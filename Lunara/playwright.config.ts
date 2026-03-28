import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Lunara frontend.
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests sequentially in CI for stability, parallel locally */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry once on CI to handle flakiness */
  retries: process.env.CI ? 1 : 0,
  /* Single worker on CI for consistency */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter */
  reporter: process.env.CI ? 'github' : 'html',
  /* Shared settings for all projects */
  use: {
    baseURL: 'http://localhost:5173',
    /* Collect trace on first retry for debugging */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Only run Chromium to keep things fast */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start Vite so page.goto(baseURL) works in CI and locally. */
  webServer: process.env.CI
    ? {
        /* CI already runs `npm run build`; serve the production bundle like production deploys */
        command: 'npm run preview -- --host 127.0.0.1 --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
