const appBinaryPath =
  process.env.TAURI_APP_BINARY || './src-tauri/target/debug/snipstack-desktop';
const driverProvider = process.env.TAURI_DRIVER_PROVIDER || 'embedded';

export const config = {
  runner: 'local',
  specs: ['./test/desktop/**/*.spec.js'],
  maxInstances: 1,
  capabilities: [
    {
      browserName: 'tauri',
      'tauri:options': {
        application: appBinaryPath,
      },
    },
  ],
  services: [
    [
      '@wdio/tauri-service',
      {
        appBinaryPath,
        driverProvider,
        embeddedPort: 4445,
        autoDownloadEdgeDriver: false,
        captureBackendLogs: false,
        captureFrontendLogs: false,
        startTimeout: 60000,
      },
    ],
  ],
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
