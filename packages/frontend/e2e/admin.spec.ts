import { test, expect } from '@playwright/test';

test.describe('Admin pages', () => {
  test('admin login redirects to login page when not authenticated', async ({ page }) => {
    await page.goto('/admin/tcgs');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin TCG page renders table', async ({ page }) => {
    await page.goto('/admin/tcgs');
    await expect(page.locator('h5')).toHaveText('Manage TCGs');
  });

  test('admin users page renders table', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h5')).toHaveText('Manage Users');
  });

  test('admin reports page renders table', async ({ page }) => {
    await page.goto('/admin/reports');
    await expect(page.locator('h5')).toHaveText('Reports');
  });

  test('admin audit page renders table', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.locator('h5')).toHaveText('Audit Log');
  });
});
