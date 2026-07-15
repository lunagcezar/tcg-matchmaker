import { test, expect } from '@playwright/test';

test.describe('Trading pages', () => {
  test('list page shows heading', async ({ page }) => {
    await page.goto('/trading');
    await expect(page.locator('h5')).toHaveText('Trading Sessions');
  });

  test('create page shows form', async ({ page }) => {
    await page.goto('/trading/new');
    await expect(page.getByText(/create trading session/i)).toBeVisible();
  });

  test('detail page loads', async ({ page }) => {
    await page.goto('/trading/test-id');
    await expect(page.locator('h5')).toBeVisible();
  });
});
