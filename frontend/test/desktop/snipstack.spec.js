import { $, browser, expect } from '@wdio/globals';

function cardFor(title) {
  return $(
    `//article[contains(@class, "snippet-card")][.//h2[normalize-space()="${title}"]]`,
  );
}

describe('SnipStack Desktop', () => {
  it('loads the Rails-backed interface and preserves window interactions', async () => {
    const heading = await $('h1=Snippet library');
    await heading.waitForDisplayed();
    await expect($('footer')).toHaveText(expect.stringContaining('API status · connected'));

    const initialSize = await browser.getWindowSize();
    const initialViewport = await browser.execute(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    expect(initialSize.width).toBeGreaterThanOrEqual(1280);
    expect(initialSize.height).toBeGreaterThanOrEqual(800);
    expect(initialViewport.width).toBe(1280);
    expect(initialViewport.height).toBeGreaterThanOrEqual(720);

    await browser.execute(() => {
      document.activeElement?.blur();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '/', bubbles: true }),
      );
    });
    expect(
      await browser.execute(() => document.activeElement?.id),
    ).toBe('snippet-search');

    await $('#snippet-search').click();
    await browser.pause(250);
    const focusIndicator = await browser.execute(() => {
      const searchField = document.querySelector('.search-field');

      return {
        matchesFocusWithin: searchField.matches(':focus-within'),
        shadow: getComputedStyle(searchField).boxShadow,
      };
    });
    expect(focusIndicator.matchesFocusWithin).toBe(true);
    expect(focusIndicator.shadow).not.toBe('none');
    await heading.click();

    const layoutBehavior = await browser.execute(() => {
      const composer = document.querySelector('.composer-panel');
      const code = document.querySelector('.code-window pre');
      window.scrollTo({ top: document.documentElement.scrollHeight });

      const result = {
        composerPosition: getComputedStyle(composer).position,
        composerTop: Math.round(composer.getBoundingClientRect().top),
        documentScrollable:
          document.documentElement.scrollHeight >
          document.documentElement.clientHeight,
        codeOverflow: code ? getComputedStyle(code).overflow : null,
      };

      window.scrollTo({ top: 0 });
      return result;
    });
    expect(layoutBehavior.composerPosition).toBe('sticky');
    expect(Number.isFinite(layoutBehavior.composerTop)).toBe(true);
    expect(layoutBehavior.documentScrollable).toBe(true);
    expect(layoutBehavior.codeOverflow).toBe('auto');

    await browser.setWindowSize(600, 500);
    const constrainedSize = await browser.getWindowSize();
    expect(constrainedSize.width).toBeGreaterThanOrEqual(720);
    expect(constrainedSize.height).toBeGreaterThanOrEqual(600);

    await browser.maximizeWindow();
    const maximizedSize = await browser.getWindowSize();
    expect(maximizedSize.width).toBeGreaterThanOrEqual(720);
    expect(maximizedSize.height).toBeGreaterThanOrEqual(600);
    await expect($('#snippet-composer')).toBeDisplayed();

    await browser.fullscreenWindow();
    await expect($('#snippet-composer')).toBeDisplayed();
    await expect($('#snippet-search')).toBeDisplayed();

    for (const [width, height] of [
      [1440, 900],
      [1120, 800],
      [760, 800],
      [720, 600],
    ]) {
      await browser.setWindowSize(width, height);
      await expect($('#snippet-composer')).toBeDisplayed();
      await expect($('#snippet-search')).toBeDisplayed();
      const horizontalLayout = await browser.execute(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(horizontalLayout.scrollWidth).toBeLessThanOrEqual(
        horizontalLayout.clientWidth,
      );
      await browser.saveScreenshot(
        `../docs/desktop-screenshots/tauri-${width}x${height}.png`,
      );
    }

    await browser.setWindowSize(720, 600);
    await $('button=Save snippet').scrollIntoView({ block: 'center' });
    await expect($('button=Save snippet')).toBeDisplayed();
    await $('footer').scrollIntoView({ block: 'center' });
    await expect($('footer')).toBeDisplayed();
    await browser.setWindowSize(1440, 900);
    await browser.execute(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    const hasReducedMotionRule = await browser.execute(() => {
      return Array.from(document.styleSheets).some((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules).some((rule) =>
            rule.conditionText?.includes('prefers-reduced-motion'),
          );
        } catch {
          return false;
        }
      });
    });
    expect(hasReducedMotionRule).toBe(true);

    if (process.env.DESKTOP_REDUCED_MOTION === '1') {
      const reducedMotion = await browser.execute(() => {
        const button = document.querySelector('.topbar__action');
        const styles = getComputedStyle(button);

        return {
          matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          transitionDuration: styles.transitionDuration,
          animationDuration: styles.animationDuration,
        };
      });
      expect(reducedMotion.matches).toBe(true);
      expect(parseFloat(reducedMotion.transitionDuration)).toBeLessThan(0.001);
      expect(parseFloat(reducedMotion.animationDuration)).toBeLessThan(0.001);
    }
  });

  it('creates, edits, copies, filters, and deletes through the real API', async () => {
    const suffix = Date.now();
    const createdTitle = `WDIO desktop ${suffix}`;
    const updatedTitle = `${createdTitle} updated`;
    const code = `const desktopRun = ${suffix};`;

    await $('#snippet-title').setValue(createdTitle);
    await $('#snippet-language').setValue('JavaScript');
    await $('#snippet-code').setValue(code);
    await $('#snippet-tags').setValue('wdio, desktop');
    await $('button=Save snippet').click();

    const createdCard = await cardFor(createdTitle);
    await createdCard.waitForDisplayed();

    await createdCard.$('button=Copy').click();
    const copyMessage = await $('.status-message p');
    await copyMessage.waitForDisplayed();
    await expect(copyMessage).toHaveText(`Code from “${createdTitle}” copied.`);

    await createdCard.$('button=Edit').click();
    await $('#snippet-title').setValue(updatedTitle);
    await $('button=Save changes').click();

    const updatedCard = await cardFor(updatedTitle);
    await updatedCard.waitForDisplayed();

    await $('#snippet-search').setValue(String(suffix));
    await expect(updatedCard).toBeDisplayed();
    await $('#snippet-search').setValue('');

    await updatedCard.$('button=Delete').click();
    await updatedCard.$('button=Yes, delete').click();
    await updatedCard.waitForExist({ reverse: true });
  });
});
