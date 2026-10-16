import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/integration', workers: 1,
  use: { baseURL: 'http://127.0.0.1:5189', ...(process.env.PLAYWRIGHT_CHROME ? { channel: 'chrome' } : {}) },
  webServer: [
    { command: 'node scripts/integration-api.mjs', url: 'http://127.0.0.1:3099/api/health', reuseExistingServer: false },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5189 --strictPort', env: { API_PROXY_TARGET: 'http://127.0.0.1:3099' }, url: 'http://127.0.0.1:5189', reuseExistingServer: false },
  ],
})
