import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('login page renders with form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[placeholder*="邮箱"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"], input[placeholder*="密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
  });

  test('login page shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button:has-text("登录")').click();
    // Should show validation messages
    await expect(page.locator('text=/请输入|请填写|必填/')).toBeVisible({ timeout: 5000 });
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a:has-text("注册"), text=/没有账号|立即注册/');
    await expect(registerLink).toBeVisible({ timeout: 10000 });
  });

  test('login page has link to forgot password', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.locator('a:has-text("忘记密码"), text=/忘记密码|找回密码/');
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Clear any stored tokens
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('Register Flow', () => {
  test('register page renders with form fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[placeholder*="姓名"], input[id*="name"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"], input[placeholder*="邮箱"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[placeholder*="密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("注册")')).toBeVisible();
  });

  test('register page has link back to login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.locator('a:has-text("登录"), text=/已有账号|返回登录/');
    await expect(loginLink).toBeVisible({ timeout: 10000 });
  });
});
