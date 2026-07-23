import { browser, expect } from '@wdio/globals';

const describePerformance =
  process.env.DESKTOP_PERF === '1' ? describe : xdescribe;

async function measureScrollProfile(cssOverrides = []) {
  return browser.executeAsync((overrides, done) => {
    const stylesheet = Array.from(document.styleSheets).find((candidate) => {
      try {
        return candidate.cssRules.length > 0;
      } catch {
        return false;
      }
    });
    const insertedRules = [];

    [
      'html { scroll-behavior: auto !important; }',
      ...overrides,
    ].forEach((rule) => {
      const index = stylesheet.cssRules.length;
      stylesheet.insertRule(rule, index);
      insertedRules.push(index);
    });
    window.scrollTo({ top: 0 });

    const frameDurations = [];
    const steps = 24;
    const maxScroll =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    let step = 0;
    let previousFrame;
    const start = performance.now();

    function advance(timestamp) {
      if (previousFrame !== undefined) {
        frameDurations.push(timestamp - previousFrame);
      }
      previousFrame = timestamp;
      step += 1;
      window.scrollTo({ top: (maxScroll * step) / steps });

      if (step < steps) {
        requestAnimationFrame(advance);
        return;
      }

      const result = {
        durationMs: performance.now() - start,
        maxFrameMs: Math.max(...frameDurations),
        over25ms: frameDurations.filter((duration) => duration > 25).length,
        scrollY: window.scrollY,
        appliedRules: insertedRules.length,
      };
      [...insertedRules].reverse().forEach((index) => {
        stylesheet.deleteRule(index);
      });
      window.scrollTo({ top: 0 });
      done(result);
    }

    requestAnimationFrame(advance);
  }, cssOverrides);
}

async function compareCssProfiles() {
  const overrides = {
    baseline: [],
    originalFixedGrid: [
      'html[data-runtime="tauri"] body::before { position: fixed !important; }',
    ],
    noBackdropBlur: ['.topbar { backdrop-filter: none !important; }'],
    noFixedGridMask: ['body::before { content: none !important; }'],
    noGridBackground: [
      'body::before { background-image: none !important; }',
    ],
    noGridMask: [`
      body::before {
        -webkit-mask-image: none !important;
        mask-image: none !important;
      }
    `],
    nonFixedGrid: [
      'body::before { position: absolute !important; }',
    ],
    noLargeShadows: [`
      .app-shell,
      .composer-panel,
      .snippet-card { box-shadow: none !important; }
    `],
    noAnimations: [`
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
      }
    `],
  };
  const names = Object.keys(overrides);
  const samples = Object.fromEntries(names.map((name) => [name, []]));

  for (let round = 0; round < 3; round += 1) {
    const order = round % 2 === 0 ? names : [...names].reverse();
    for (const name of order) {
      samples[name].push(await measureScrollProfile(overrides[name]));
    }
  }

  return Object.fromEntries(
    Object.entries(samples).map(([name, values]) => {
      const durations = values
        .map((value) => value.durationMs)
        .sort((a, b) => a - b);
      const maxFrames = values
        .map((value) => value.maxFrameMs)
        .sort((a, b) => a - b);

      return [
        name,
        {
          medianDurationMs: durations[1],
          medianMaxFrameMs: maxFrames[1],
          samples: values,
        },
      ];
    }),
  );
}

describePerformance('SnipStack Desktop performance probe', () => {
  it('measures a release build with 1,000 temporary snippets', async () => {
    await browser.waitUntil(
      async () =>
        (await browser.execute(
          () => document.querySelectorAll('.snippet-card').length,
        )) >= 1000,
      {
        timeout: 30000,
        timeoutMsg: 'The 1,000-snippet performance fixture did not render.',
      },
    );

    const initial = await browser.execute(() => ({
      cards: document.querySelectorAll('.snippet-card').length,
      readyAtMs: performance.now(),
    }));

    const cssProfiles = await compareCssProfiles();

    const filter = await browser.executeAsync((done) => {
      const input = document.querySelector('#snippet-search');
      const start = performance.now();
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      ).set;

      setter.call(input, 'Desktop perf 20260723 1000');
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          done({
            durationMs: performance.now() - start,
            cards: document.querySelectorAll('.snippet-card').length,
          });
        });
      });
    });

    console.log(
      'DESKTOP_PERF_RESULT',
      JSON.stringify({ initial, filter, cssProfiles }),
    );

    expect(initial.cards).toBeGreaterThanOrEqual(1000);
    expect(filter.cards).toBe(1);
    expect(filter.durationMs).toBeLessThan(1000);
    expect(cssProfiles.originalFixedGrid.medianDurationMs).toBeGreaterThan(
      cssProfiles.baseline.medianDurationMs * 1.05,
    );
    Object.values(cssProfiles).forEach((profile) => {
      expect(profile.medianDurationMs).toBeLessThan(3000);
      profile.samples.forEach((sample) => {
        expect(sample.scrollY).toBeGreaterThan(0);
        expect(sample.appliedRules).toBeGreaterThan(0);
      });
    });
  });
});
