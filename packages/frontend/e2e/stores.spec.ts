import { test, expect } from '@playwright/test';

test.describe('Store pages', () => {
  test('list page shows heading', async ({ page }) => {
    await page.goto('/stores');
    await expect(page.locator('h5')).toHaveText('Stores');
  });

  test('create page shows form', async ({ page }) => {
    await page.goto('/stores/new');
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('detail page loads', async ({ page }) => {
    await page.goto('/stores/test-id');
    await expect(page.locator('h5')).toBeVisible();
  });
});
