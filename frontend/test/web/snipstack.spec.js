import { $, browser, expect } from '@wdio/globals';

function cardFor(title) {
  return $(
    `//article[contains(@class, "snippet-card")][.//h2[normalize-space()="${title}"]]`,
  );
}

async function activate(element) {
  await element.waitForDisplayed();
  await element.scrollIntoView({ block: 'center' });
  await browser.execute((target) => target.click(), element);
}

async function measureWebBaseline() {
  await browser.sendCommand('Performance.enable', {});

  const navigation = await browser.execute(() => {
    const entry = performance.getEntriesByType('navigation')[0];

    return {
      cards: document.querySelectorAll('.snippet-card').length,
      domContentLoadedMs: entry.domContentLoadedEventEnd,
      loadEventMs: entry.loadEventEnd,
    };
  });
  const scroll = await browser.executeAsync((done) => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0 });

    const durations = [];
    const steps = 24;
    const maxScroll = root.scrollHeight - root.clientHeight;
    let step = 0;
    let previousFrame;
    const startedAt = performance.now();

    function advance(timestamp) {
      if (previousFrame !== undefined) {
        durations.push(timestamp - previousFrame);
      }
      previousFrame = timestamp;
      step += 1;
      window.scrollTo({ top: (maxScroll * step) / steps });

      if (step < steps) {
        requestAnimationFrame(advance);
        return;
      }

      const result = {
        durationMs: performance.now() - startedAt,
        maxFrameMs: Math.max(...durations),
        scrollY: window.scrollY,
      };
      window.scrollTo({ top: 0 });
      root.style.scrollBehavior = previousBehavior;
      done(result);
    }

    requestAnimationFrame(advance);
  });
  const { metrics } = await browser.sendCommandAndGetResult(
    'Performance.getMetrics',
    {},
  );
  const values = Object.fromEntries(
    metrics.map(({ name, value }) => [name, value]),
  );

  return {
    ...navigation,
    jsHeapUsedBytes: values.JSHeapUsedSize,
    rendererTaskDurationMs: values.TaskDuration * 1000,
    scroll,
  };
}

describe('SnipStack web', () => {
  let pendingCleanupTitle;

  afterEach(async () => {
    if (!pendingCleanupTitle) return;

    const card = await cardFor(pendingCleanupTitle);
    if (!(await card.isExisting())) return;

    await activate(await card.$('button=Delete'));
    await activate(await card.$('button=Yes, delete'));
    await card.waitForExist({ reverse: true });
  });

  it('preserves the responsive browser interactions', async () => {
    await browser.url('/');
    await expect($('footer')).toHaveText(
      expect.stringContaining('API status · connected'),
    );
    const baseline = await measureWebBaseline();
    console.log('WEB_BASELINE_RESULT', JSON.stringify(baseline));
    expect(baseline.cards).toBeGreaterThan(0);
    expect(baseline.jsHeapUsedBytes).toBeGreaterThan(0);
    expect(baseline.rendererTaskDurationMs).toBeGreaterThanOrEqual(0);
    expect(baseline.scroll.scrollY).toBeGreaterThan(0);
    const fontState = await browser.executeAsync(async (done) => {
      await document.fonts.ready;
      done({
        loaded: [400, 500, 600, 700].every((weight) =>
          document.fonts.check(`${weight} 16px Outfit`),
        ),
        remoteRequests: performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url)),
      });
    });
    expect(fontState.loaded).toBe(true);
    expect(fontState.remoteRequests).toEqual([]);

    for (const [width, height] of [
      [1440, 900],
      [1120, 800],
      [760, 800],
      [420, 900],
    ]) {
      await browser.setWindowSize(width, height);
      await expect($('#snippet-composer')).toBeDisplayed();
      await expect($('#snippet-search')).toBeDisplayed();

      const layout = await browser.execute(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    }

    await browser.setWindowSize(1440, 900);
    const firstCard = await $('.snippet-card');
    await firstCard.waitForDisplayed();
    const firstTitle = await firstCard.$('h2').getText();

    await $('#snippet-search').setValue(firstTitle);
    await expect(cardFor(firstTitle)).toBeDisplayed();
    await $('#snippet-search').setValue('');

    await $('h1').click();
    await browser.execute(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '/', bubbles: true }),
      );
    });
    await browser.waitUntil(
      () =>
        browser.execute(
          () =>
            document.activeElement?.id === 'snippet-search' &&
            document
              .querySelector('.search-field')
              .matches(':focus-within'),
        ),
      {
        timeout: 3000,
        timeoutMsg: 'The browser search focus indicator did not become visible.',
      },
    );

    await activate(await firstCard.$('button=Copy'));
    await expect($('.status-message p')).toHaveText(
      `Code from “${firstTitle}” copied.`,
    );

    await browser.sendCommand('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    const reducedMotion = await browser.execute(() => {
      const styles = getComputedStyle(
        document.querySelector('.topbar__action'),
      );

      return {
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        transitionDuration: parseFloat(styles.transitionDuration),
        animationDuration: parseFloat(styles.animationDuration),
      };
    });
    expect(reducedMotion.matches).toBe(true);
    expect(reducedMotion.transitionDuration).toBeLessThan(0.001);
    expect(reducedMotion.animationDuration).toBeLessThan(0.001);
    await browser.sendCommand('Emulation.setEmulatedMedia', { features: [] });

    await browser.execute(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight });
    });
    await browser.waitUntil(() => browser.execute(() => window.scrollY > 0), {
      timeout: 3000,
      timeoutMsg: 'The browser page did not scroll.',
    });
    const scrollState = await browser.execute(() => ({
      scrollable:
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight,
      scrollY: window.scrollY,
    }));
    expect(scrollState.scrollable).toBe(true);
    expect(scrollState.scrollY).toBeGreaterThan(0);
  });

  it('completes CRUD through the browser transport', async () => {
    await browser.url('/');
    await expect($('footer')).toHaveText(
      expect.stringContaining('API status · connected'),
    );

    const suffix = Date.now();
    const createdTitle = `Web smoke ${suffix}`;
    const updatedTitle = `${createdTitle} updated`;
    pendingCleanupTitle = createdTitle;

    await $('#snippet-title').setValue(createdTitle);
    await $('#snippet-language').setValue('JavaScript');
    await $('#snippet-code').setValue(`const webRun = ${suffix};`);
    await $('#snippet-tags').setValue('web, smoke');
    await activate(await $('button=Save snippet'));

    const createdCard = await cardFor(createdTitle);
    await createdCard.waitForDisplayed();
    await activate(await createdCard.$('button=Edit'));
    await $('#snippet-title').setValue(updatedTitle);
    await activate(await $('button=Save changes'));
    pendingCleanupTitle = updatedTitle;

    const updatedCard = await cardFor(updatedTitle);
    await updatedCard.waitForDisplayed();
    await activate(await updatedCard.$('button=Delete'));
    await activate(await updatedCard.$('button=Yes, delete'));
    await updatedCard.waitForExist({ reverse: true });
    pendingCleanupTitle = undefined;
  });
});
