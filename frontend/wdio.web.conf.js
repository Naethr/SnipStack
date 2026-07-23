export const config = {
  runner: 'local',
  specs: ['./test/web/**/*.spec.js'],
  maxInstances: 1,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        binary: '/usr/bin/google-chrome',
        args: [
          '--headless=new',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1440,900',
        ],
      },
    },
  ],
  baseUrl: 'http://127.0.0.1:5173',
  logLevel: 'error',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 1,
  framework: 'jasmine',
  reporters: ['spec'],
  jasmineOpts: {
    defaultTimeoutInterval: 60000,
  },
};
