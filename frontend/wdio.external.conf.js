const appBinaryPath =
  process.env.TAURI_APP_BINARY ||
  './src-tauri/target/release/bundle/appimage/SnipStack_0.1.0_amd64.AppImage';

export const config = {
  host: '127.0.0.1',
  port: 4444,
  runner: 'local',
  specs: ['./test/desktop/**/*.spec.js'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: appBinaryPath,
      },
    },
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
