export const config = {
  host: '127.0.0.1',
  port: 4445,
  runner: 'local',
  specs: ['./test/desktop/hmr.spec.js'],
  maxInstances: 1,
  capabilities: [{ browserName: 'tauri' }],
  logLevel: 'error',
  waitforTimeout: 10000,
  connectionRetryTimeout: 30000,
  connectionRetryCount: 1,
  framework: 'jasmine',
  reporters: ['spec'],
  jasmineOpts: {
    defaultTimeoutInterval: 60000,
  },
};
