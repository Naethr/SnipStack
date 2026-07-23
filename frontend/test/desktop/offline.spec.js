import { $, expect } from '@wdio/globals';

const describeOffline =
  process.env.DESKTOP_OFFLINE === '1' ? describe : xdescribe;

describeOffline('SnipStack packaged artifact without the Rails API', () => {
  it('keeps the interface usable and exposes a retryable offline state', async () => {
    await expect($('footer')).toHaveText(
      expect.stringContaining('API status · offline'),
    );
    await expect($('#snippet-composer')).toBeDisplayed();
    await expect($('.load-error')).toHaveText(
      expect.stringContaining('Could not reach the SnipStack API'),
    );
    const retryButton = await $('button=Try again');
    await expect(retryButton).toBeDisplayed();

    await retryButton.click();
    await expect($('.load-error')).toHaveText(
      expect.stringContaining('Could not reach the SnipStack API'),
    );
    await expect($('button=Try again')).toBeDisplayed();
  });
});
