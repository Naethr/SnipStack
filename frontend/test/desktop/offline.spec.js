import { $, expect } from '@wdio/globals';

const describeOffline =
  process.env.DESKTOP_OFFLINE === '1' ? describe : xdescribe;

describeOffline('SnipStack packaged artifact without the Rails API', () => {
  it('keeps sign-in available and explains that the API cannot be reached', async () => {
    await expect($('footer')).toHaveText(
      expect.stringContaining('API status · sign in required'),
    );
    await expect($('#auth-email')).toBeDisplayed();
    await $('#auth-email').setValue('unavailable@example.com');
    await $('#auth-password').setValue('password');
    await $('button=Sign in').click();
    await expect($('[role="alert"]')).toHaveText(
      expect.stringContaining('Could not reach the SnipStack API'),
    );
    await $('button=Sign in').click();
    await expect($('[role="alert"]')).toHaveText(
      expect.stringContaining('Could not reach the SnipStack API'),
    );
    await expect($('#snippet-composer')).not.toExist();
  });
});
