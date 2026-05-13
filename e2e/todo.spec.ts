import { test, expect } from '@playwright/test';

test.describe('Todo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo');
  });

  test('loads todo page', async ({ page }) => {
    await expect(page).toHaveURL(/\/todo/);
  });

  test('renders page content area', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });
});
