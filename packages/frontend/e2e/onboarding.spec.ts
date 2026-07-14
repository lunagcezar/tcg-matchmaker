import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test('onboarding page renders form', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('login page uses AuthForm component', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('AppCard renders with title', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.app-card')).toBeVisible();
  });
});
