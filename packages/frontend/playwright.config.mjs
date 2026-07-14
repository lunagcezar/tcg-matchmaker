import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm -F @tcg/worker dev',
      url: 'http://localhost:8787/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'pnpm -F @tcg/frontend dev',
      url: 'http://localhost:9000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
