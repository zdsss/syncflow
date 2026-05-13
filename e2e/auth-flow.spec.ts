import { test, expect } from '@playwright/test';

test.describe('Auth Flow - Login Page Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays the SyncFlow login title', async ({ page }) => {
    await expect(page.locator('text=SyncFlow 登录')).toBeVisible({ timeout: 10000 });
  });

  test('email field has correct label', async ({ page }) => {
    // Ant Design renders labels as <label> elements associated with form items
    await expect(page.locator('label:has-text("邮箱")')).toBeVisible({ timeout: 10000 });
  });

  test('password field has correct label', async ({ page }) => {
    await expect(page.locator('label:has-text("密码")')).toBeVisible({ timeout: 10000 });
  });

  test('email input accepts text entry', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[placeholder*="邮箱"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('password input is a password type field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('submit button is enabled by default', async ({ page }) => {
    const submitBtn = page.locator('button:has-text("登录")');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await expect(submitBtn).toBeEnabled();
  });
});

test.describe('Auth Flow - Register Navigation', () => {
  test('register link text contains "去注册"', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a:has-text("去注册")');
    await expect(registerLink).toBeVisible({ timeout: 10000 });
  });

  test('clicking register link navigates to register page', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a:has-text("去注册")');
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/, { timeout: 10000 });
  });
});

test.describe('Auth Flow - Forgot Password Navigation', () => {
  test('forgot password link text contains "忘记密码"', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.locator('a:has-text("忘记密码")');
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
  });

  test('clicking forgot password link navigates to forgot-password page', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.locator('a:has-text("忘记密码")');
    await forgotLink.click();
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 10000 });
  });
});

test.describe('Auth Flow - Register Page Elements', () => {
  test('register page has name field', async ({ page }) => {
    await page.goto('/register');
    await expect(
      page.locator('input[placeholder*="姓名"], input[id*="name"], label:has-text("姓名")')
    ).toBeVisible({ timeout: 10000 });
  });

  test('register page has email field', async ({ page }) => {
    await page.goto('/register');
    await expect(
      page.locator('input[type="email"], input[placeholder*="邮箱"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('register page has password field', async ({ page }) => {
    await page.goto('/register');
    await expect(
      page.locator('input[type="password"], input[placeholder*="密码"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('register page has back to login link', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.locator('a:has-text("去登录"), a:has-text("登录"), a:has-text("返回登录")');
    await expect(loginLink.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Auth Flow - Validation', () => {
  test('empty email shows required validation message', async ({ page }) => {
    await page.goto('/login');
    // Fill only password, leave email empty
    await page.locator('input[placeholder*="密码"], input[type="password"]').fill('somepassword');
    await page.locator('button:has-text("登录")').click();
    await expect(page.locator('text=/请输入邮箱|请输入有效的邮箱地址/')).toBeVisible({ timeout: 5000 });
  });

  test('empty password shows required validation message', async ({ page }) => {
    await page.goto('/login');
    // Fill only email, leave password empty
    await page.locator('input[placeholder*="邮箱"], input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("登录")').click();
    await expect(page.locator('text=/请输入密码/')).toBeVisible({ timeout: 5000 });
  });
});
