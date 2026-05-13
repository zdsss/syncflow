import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('loads dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('header renders with user info area', async ({ page }) => {
    const header = page.locator('header, [class*="header"]');
    await expect(header).toBeVisible();
  });

  test('sidebar is visible on dashboard', async ({ page }) => {
    const sidebar = page.locator('nav, [class*="sidebar"]');
    await expect(sidebar).toBeVisible();
  });
});
