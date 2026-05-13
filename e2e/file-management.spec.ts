import { test, expect } from '@playwright/test';

test.describe('File Management - Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/files');
  });

  test('displays the page title "项目文件"', async ({ page }) => {
    await expect(page.locator('h1:has-text("项目文件")')).toBeVisible({ timeout: 10000 });
  });

  test('upload button is visible with correct text', async ({ page }) => {
    const uploadBtn = page.locator('button:has-text("上传文件")');
    await expect(uploadBtn).toBeVisible({ timeout: 10000 });
    await expect(uploadBtn).toBeEnabled();
  });

  test('new folder button is visible', async ({ page }) => {
    const newFolderBtn = page.locator('button:has-text("新建文件夹")');
    await expect(newFolderBtn).toBeVisible({ timeout: 10000 });
    await expect(newFolderBtn).toBeEnabled();
  });

  test('search input is present with placeholder text', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索文件"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await expect(searchInput).toBeEditable();
  });
});

test.describe('File Management - File List Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/files');
  });

  test('file list table has "文件名" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("文件名"), .ant-table th:has-text("文件名")')).toBeVisible({ timeout: 10000 });
  });

  test('file list table has "大小" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("大小"), .ant-table th:has-text("大小")')).toBeVisible({ timeout: 10000 });
  });

  test('file list table has "上传时间" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("上传时间"), .ant-table th:has-text("上传时间")')).toBeVisible({ timeout: 10000 });
  });

  test('file list table has "上传人" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("上传人"), .ant-table th:has-text("上传人")')).toBeVisible({ timeout: 10000 });
  });

  test('file list table has "操作" column header', async ({ page }) => {
    await expect(page.locator('th:has-text("操作"), .ant-table th:has-text("操作")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('File Management - Type Filter Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/files');
  });

  test('"全部" tab is present', async ({ page }) => {
    await expect(page.locator('.ant-tabs-tab:has-text("全部")')).toBeVisible({ timeout: 10000 });
  });

  test('"文档" tab is present', async ({ page }) => {
    await expect(page.locator('.ant-tabs-tab:has-text("文档")')).toBeVisible({ timeout: 10000 });
  });

  test('"图片" tab is present', async ({ page }) => {
    await expect(page.locator('.ant-tabs-tab:has-text("图片")')).toBeVisible({ timeout: 10000 });
  });

  test('"代码" tab is present', async ({ page }) => {
    await expect(page.locator('.ant-tabs-tab:has-text("代码")')).toBeVisible({ timeout: 10000 });
  });

  test('clicking a type filter tab activates it', async ({ page }) => {
    const docTab = page.locator('.ant-tabs-tab:has-text("文档")');
    await docTab.click();
    await expect(docTab).toHaveClass(/ant-tabs-tab-active/);
  });
});

test.describe('File Management - Storage Stats', () => {
  test('storage statistics section is visible', async ({ page }) => {
    await page.goto('/files');
    // StorageStatsBar renders storage info with GB/MB or file count
    await expect(page.locator('text=/GB|MB|文件数|存储空间|容量/')).toBeVisible({ timeout: 10000 });
  });
});
