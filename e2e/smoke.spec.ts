import { test, expect } from '@playwright/test';

test('homepage loads and displays app name', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/formatvault/i);
  await expect(page.getByRole('heading', { name: /format anything/i })).toBeVisible();
});
