import { $, browser, expect } from '@wdio/globals';

const describeArtifact =
  process.env.DESKTOP_ARTIFACT === '1' ? describe : xdescribe;

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

describeArtifact('SnipStack packaged artifact', () => {
  it('loads the API and completes CRUD through the production AppImage', async () => {
    await expect($('footer')).toHaveText(
      expect.stringContaining('API status · connected'),
    );

    await browser.execute(() => document.activeElement?.blur());
    const keyboardOrder = [];
    for (let step = 0; step < 3; step += 1) {
      await browser.keys(['\uE004']);
      keyboardOrder.push(
        await browser.execute(() => ({
          className: document.activeElement?.className,
          tagName: document.activeElement?.tagName,
        })),
      );
    }
    expect(keyboardOrder).toEqual([
      { className: 'skip-link', tagName: 'A' },
      { className: 'brand', tagName: 'A' },
      {
        className: 'button button--primary topbar__action',
        tagName: 'BUTTON',
      },
    ]);

    const suffix = Date.now();
    const createdTitle = `AppImage smoke ${suffix}`;
    const updatedTitle = `${createdTitle} updated`;

    await $('#snippet-title').setValue(createdTitle);
    await $('#snippet-language').setValue('JavaScript');
    await $('#snippet-code').setValue(`const appImageRun = ${suffix};`);
    await $('#snippet-tags').setValue('appimage, smoke');
    await $('button=Save snippet').click();

    const createdCard = await cardFor(createdTitle);
    await createdCard.waitForDisplayed();
    await activate(await createdCard.$('button=Edit'));
    await expect($('button=Save changes')).toBeDisplayed();

    await $('#snippet-title').setValue(updatedTitle);
    await activate(await $('button=Save changes'));

    const updatedCard = await cardFor(updatedTitle);
    await updatedCard.waitForDisplayed();
    await activate(await updatedCard.$('button=Delete'));
    await activate(await updatedCard.$('button=Yes, delete'));
    await updatedCard.waitForExist({ reverse: true });
  });
});
