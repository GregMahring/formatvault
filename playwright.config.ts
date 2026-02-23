import { defineConfig, devices } from '@playwright/test';

// Typed env helper — avoids @typescript-eslint/no-unsafe-member-access on process.env
const env = process.env as Record<string, string | undefined>;
const isCI = Boolean(env['CI']);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Fail the build on CI if test.only is accidentally left in source
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Spin up the Vite dev server before running E2E tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 30000,
  },
});
