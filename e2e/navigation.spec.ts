import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('redirects to dashboard from root', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('sidebar renders all navigation items', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('nav, [class*="sidebar"], [class*="Sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('navigates to todo page', async ({ page }) => {
    await page.goto('/todo');
    await expect(page).toHaveURL(/\/todo/);
  });

  test('navigates to project page', async ({ page }) => {
    await page.goto('/project');
    await expect(page).toHaveURL(/\/project/);
  });

  test('navigates to approval page', async ({ page }) => {
    await page.goto('/approval');
    await expect(page).toHaveURL(/\/approval/);
  });

  test('navigates to files page', async ({ page }) => {
    await page.goto('/files');
    await expect(page).toHaveURL(/\/files/);
  });

  test('navigates to config page', async ({ page }) => {
    await page.goto('/config');
    await expect(page).toHaveURL(/\/config/);
  });

  test('unknown route redirects to dashboard', async ({ page }) => {
    await page.goto('/nonexistent');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
