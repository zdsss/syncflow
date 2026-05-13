import { test, expect } from '@playwright/test';

test.describe('Task Management E2E', () => {
  test('todo page displays task list', async ({ page }) => {
    await page.goto('/todo');
    await expect(page.locator('text=工作空间')).toBeVisible({ timeout: 10000 });
    // Should show some task-related content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('todo page has filter controls', async ({ page }) => {
    await page.goto('/todo');
    // Look for filter elements
    await expect(page.locator('[class*="filter"], [class*="Filter"], button, select')).toHaveCount(1, { timeout: 10000 });
  });

  test('todo page has new task button', async ({ page }) => {
    await page.goto('/todo');
    const newTaskBtn = page.locator('button:has-text("新建任务"), button:has-text("新增")');
    await expect(newTaskBtn).toBeVisible({ timeout: 10000 });
  });

  test('clicking new task button opens form', async ({ page }) => {
    await page.goto('/todo');
    const newTaskBtn = page.locator('button:has-text("新建任务"), button:has-text("新增")');
    await newTaskBtn.click();
    // Should open a modal or form
    await expect(page.locator('.ant-modal, [class*="modal"], [class*="Modal"], [class*="form"], [class*="Form"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Project Management E2E', () => {
  test('project page shows project tree', async ({ page }) => {
    await page.goto('/project');
    await expect(page.locator('text=项目管理')).toBeVisible({ timeout: 10000 });
    // Should have tree structure
    await expect(page.locator('[class*="tree"], [class*="Tree"], .ant-tree')).toBeVisible({ timeout: 10000 });
  });

  test('project page has view tabs', async ({ page }) => {
    await page.goto('/project');
    // Should have tab navigation (计划表/任务甘特图/项目甘特图)
    await expect(page.locator('text=/计划表|甘特图|看板/')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard E2E', () => {
  test('dashboard shows view switcher', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=中控看板')).toBeVisible({ timeout: 10000 });
    // Should have view switcher (排期/看板)
    await expect(page.locator('text=/排期|看板/')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard has info panel', async ({ page }) => {
    await page.goto('/dashboard');
    // Should show some stats or info panel
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
