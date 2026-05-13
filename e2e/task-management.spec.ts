import { test, expect } from '@playwright/test';

test.describe('Task Management - Page Load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo');
  });

  test('displays the workspace title "工作空间"', async ({ page }) => {
    await expect(page.locator('h1:has-text("工作空间")')).toBeVisible({ timeout: 10000 });
  });

  test('page URL contains /todo', async ({ page }) => {
    await expect(page).toHaveURL(/\/todo/);
  });

  test('page body is not empty', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Task Management - Action Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo');
  });

  test('"新建任务" button is visible and enabled', async ({ page }) => {
    const newTaskBtn = page.locator('button:has-text("新建任务")');
    await expect(newTaskBtn).toBeVisible({ timeout: 10000 });
    await expect(newTaskBtn).toBeEnabled();
  });

  test('"AI 助手" button is visible', async ({ page }) => {
    const aiBtn = page.locator('button:has-text("AI 助手")');
    await expect(aiBtn).toBeVisible({ timeout: 10000 });
  });

  test('search icon is present', async ({ page }) => {
    // The search icon renders as an Ant Design SearchOutlined icon
    await expect(
      page.locator('[class*="searchButton"], .anticon-search').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Task Management - Filter Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo');
  });

  test('filter bar section is present', async ({ page }) => {
    await expect(page.locator('[class*="filterBar"], [class*="FilterBar"]')).toBeVisible({ timeout: 10000 });
  });

  test('"今日" filter item is visible', async ({ page }) => {
    await expect(page.locator('text=今日')).toBeVisible({ timeout: 10000 });
  });

  test('"本周" filter item is visible', async ({ page }) => {
    await expect(page.locator('text=本周')).toBeVisible({ timeout: 10000 });
  });

  test('"本月" filter item is visible', async ({ page }) => {
    await expect(page.locator('text=本月')).toBeVisible({ timeout: 10000 });
  });

  test('"全部" filter item is visible', async ({ page }) => {
    await expect(page.locator('[class*="filterItem"]:has-text("全部")')).toBeVisible({ timeout: 10000 });
  });

  test('date range picker is present', async ({ page }) => {
    await expect(page.locator('.ant-picker-range')).toBeVisible({ timeout: 10000 });
  });

  test('status dropdown is present', async ({ page }) => {
    await expect(page.locator('.ant-select').first()).toBeVisible({ timeout: 10000 });
  });

  test('keyword search input is present', async ({ page }) => {
    await expect(page.locator('input[placeholder*="搜索任务"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Task Management - Task List Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo');
  });

  test('task list area is rendered', async ({ page }) => {
    await expect(page.locator('[class*="taskArea"], [class*="TaskArea"]')).toBeVisible({ timeout: 10000 });
  });

  test('task table has "任务名称" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("任务名称")')).toBeVisible({ timeout: 10000 });
  });

  test('task table has "状态" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("状态")')).toBeVisible({ timeout: 10000 });
  });

  test('task table has "优先级" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("优先级")')).toBeVisible({ timeout: 10000 });
  });

  test('task table has "负责人" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("负责人")')).toBeVisible({ timeout: 10000 });
  });

  test('task table has "截止日期" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("截止日期")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Task Management - Interactions', () => {
  test('clicking "新建任务" opens task form modal', async ({ page }) => {
    await page.goto('/todo');
    const newTaskBtn = page.locator('button:has-text("新建任务")');
    await newTaskBtn.click();
    // A modal or form should appear
    await expect(
      page.locator('.ant-modal, [class*="modal"], [class*="Modal"], [class*="taskForm"], [class*="TaskForm"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('clicking "AI 助手" toggles the AI panel', async ({ page }) => {
    await page.goto('/todo');
    const aiBtn = page.locator('button:has-text("AI 助手")');
    await aiBtn.click();
    // AI panel should become visible
    await expect(
      page.locator('[class*="aiPanel"], [class*="AiPanel"], [class*="ai-panel"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('keyword search input is functional', async ({ page }) => {
    await page.goto('/todo');
    const searchInput = page.locator('input[placeholder*="搜索任务"]');
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });
});
