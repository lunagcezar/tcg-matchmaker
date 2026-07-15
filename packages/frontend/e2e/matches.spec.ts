import { test, expect } from '@playwright/test';

test.describe('Match pages', () => {
  test('list page shows heading', async ({ page }) => {
    await page.goto('/matches');
    await expect(page.locator('h5')).toHaveText('Matches');
  });

  test('create page shows form fields', async ({ page }) => {
    await page.goto('/matches/new');
    await expect(page.getByText(/create match/i)).toBeVisible();
  });

  test('detail page loads', async ({ page }) => {
    await page.goto('/matches/test-id');
    await expect(page.locator('h5')).toBeVisible();
  });
});
