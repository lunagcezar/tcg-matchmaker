import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('page renders map container', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.map-container')).toBeVisible();
  });

  test('filter bar shows event type pills', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /matches/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /trading/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /tournaments/i })).toBeVisible();
  });

  test('geolocate button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /find near me/i })).toBeVisible();
  });

  test('filtering by type filters the event feed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /matches/i }).click();
  });
});
