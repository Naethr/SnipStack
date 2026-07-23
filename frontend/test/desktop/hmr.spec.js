import { stat, utimes } from 'node:fs/promises';
import { resolve } from 'node:path';
import { $, browser, expect } from '@wdio/globals';

const describeHmr = process.env.DESKTOP_HMR === '1' ? describe : xdescribe;

describeHmr('SnipStack Tauri development', () => {
  it('receives Vite HMR updates inside the WebView', async () => {
    await expect($('h1=Snippet library')).toBeDisplayed();
    await browser.execute(() => {
      window.__snipstackHmrMessages = [];

      for (const method of ['debug', 'info', 'log']) {
        const original = console[method].bind(console);
        console[method] = (...args) => {
          window.__snipstackHmrMessages.push(args.join(' '));
          original(...args);
        };
      }
    });

    const appPath = resolve(process.cwd(), 'src/App.jsx');
    const originalTimes = await stat(appPath);

    try {
      const now = new Date();
      await utimes(appPath, now, now);
      await browser.waitUntil(
        () =>
          browser.execute(() =>
            window.__snipstackHmrMessages.some((message) =>
              message.includes('[vite] hot updated: /src/App.jsx'),
            ),
          ),
        {
          timeout: 10000,
          timeoutMsg: 'Vite HMR was not observed inside the Tauri WebView.',
        },
      );
      await expect($('h1=Snippet library')).toBeDisplayed();
    } finally {
      await utimes(appPath, originalTimes.atime, originalTimes.mtime);
    }
  });
});
