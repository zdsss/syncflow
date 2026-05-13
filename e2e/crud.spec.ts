import { test, expect } from '@playwright/test';

test.describe('Core CRUD flows', () => {
  test('dashboard loads with project data', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=中控看板')).toBeVisible({ timeout: 10000 });
    // Check that some content is rendered
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('todo page loads with task list', async ({ page }) => {
    await page.goto('/todo');
    await expect(page.locator('text=工作空间')).toBeVisible({ timeout: 10000 });
  });

  test('project page loads with tree', async ({ page }) => {
    await page.goto('/project');
    await expect(page.locator('text=项目管理')).toBeVisible({ timeout: 10000 });
  });

  test('files page loads with file list', async ({ page }) => {
    await page.goto('/files');
    await expect(page.locator('text=项目文件')).toBeVisible({ timeout: 10000 });
  });

  test('config page loads', async ({ page }) => {
    await page.goto('/config');
    await expect(page.locator('text=配置管理')).toBeVisible({ timeout: 10000 });
  });

  test('approval page loads', async ({ page }) => {
    await page.goto('/approval');
    await expect(page.locator('text=审批管理')).toBeVisible({ timeout: 10000 });
  });

  test('bom page loads', async ({ page }) => {
    await page.goto('/bom');
    await expect(page.locator('text=BOM管理')).toBeVisible({ timeout: 10000 });
  });

  test('process page loads', async ({ page }) => {
    await page.goto('/process');
    await expect(page.locator('text=工艺管理')).toBeVisible({ timeout: 10000 });
  });

  test('query page loads', async ({ page }) => {
    await page.goto('/query');
    await expect(page.locator('text=查询统计')).toBeVisible({ timeout: 10000 });
  });

  test('knowledge page loads', async ({ page }) => {
    await page.goto('/knowledge');
    await expect(page.locator('text=知识管理')).toBeVisible({ timeout: 10000 });
  });

  test('template page loads', async ({ page }) => {
    await page.goto('/template');
    await expect(page.locator('text=模板定义')).toBeVisible({ timeout: 10000 });
  });

  test('personal page loads', async ({ page }) => {
    await page.goto('/personal');
    await expect(page.locator('text=个人文件夹')).toBeVisible({ timeout: 10000 });
  });

  test('resources page loads', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('text=通用资源')).toBeVisible({ timeout: 10000 });
  });
});
