import { test, expect } from '@playwright/test';

test.describe('Profile page', () => {
  test('page loads for a username', async ({ page }) => {
    await page.goto('/profile/testuser');
    await expect(page.locator('body')).toBeVisible();
  });
});
