import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const host = process.env.TAURI_DEV_HOST

function webdriverEntry(mode) {
  if (mode !== 'webdriver') return null

  return {
    name: 'snipstack-webdriver-entry',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          attrs: { type: 'module', src: '/src/test/wdio-entry.js' },
          injectTo: 'head-prepend',
        },
      ],
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), webdriverEntry(mode)].filter(Boolean),
  clearScreen: false,
  server: {
    host: host || '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5173,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: 'safari13',
    minify: process.env.TAURI_ENV_DEBUG ? false : 'oxc',
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: './src/test/setup.js',
  },
}))
