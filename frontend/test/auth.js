import { $, expect } from '@wdio/globals';
import process from 'node:process';

export async function signInForSmoke() {
  const email = process.env.SNIPSTACK_TEST_EMAIL;
  const password = process.env.SNIPSTACK_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('Set SNIPSTACK_TEST_EMAIL and SNIPSTACK_TEST_PASSWORD for browser/desktop smoke tests.');
  }

  await $('h1').waitForDisplayed();
  if (await $('#auth-email').isExisting()) {
    await $('#auth-email').setValue(email);
    await $('#auth-password').setValue(password);
    await $('button=Sign in').click();
  }

  await expect($('h1=Snippet library')).toBeDisplayed();
}
