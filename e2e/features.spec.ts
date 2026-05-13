import { test, expect } from '@playwright/test';

test.describe('File Management E2E', () => {
  test('files page shows file list', async ({ page }) => {
    await page.goto('/files');
    await expect(page.locator('text=项目文件')).toBeVisible({ timeout: 10000 });
  });

  test('files page has upload button', async ({ page }) => {
    await page.goto('/files');
    const uploadBtn = page.locator('button:has-text("上传"), button:has-text("Upload")');
    await expect(uploadBtn).toBeVisible({ timeout: 10000 });
  });

  test('files page has type filter tabs', async ({ page }) => {
    await page.goto('/files');
    // Should have type tabs (全部/文档/图片/代码)
    await expect(page.locator('text=/全部|文档|图片|代码/')).toBeVisible({ timeout: 10000 });
  });

  test('files page has storage stats', async ({ page }) => {
    await page.goto('/files');
    // Should show storage info
    await expect(page.locator('text=/GB|MB|文件/')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Config Management E2E', () => {
  test('config page shows tabs', async ({ page }) => {
    await page.goto('/config');
    await expect(page.locator('text=配置管理')).toBeVisible({ timeout: 10000 });
    // Should have tab navigation
    await expect(page.locator('text=/角色权限|角色卡片|通知设置/')).toBeVisible({ timeout: 10000 });
  });

  test('config page shows department tabs', async ({ page }) => {
    await page.goto('/config');
    // Should show department navigation
    await expect(page.locator('text=/公司管理层|设计部|产品部|研发部|测试部/')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Approval E2E', () => {
  test('approval page loads', async ({ page }) => {
    await page.goto('/approval');
    await expect(page.locator('text=审批管理')).toBeVisible({ timeout: 10000 });
  });

  test('approval page has status filters', async ({ page }) => {
    await page.goto('/approval');
    // Should have filter tabs or buttons
    await expect(page.locator('text=/全部|待审批|已通过|已驳回/')).toBeVisible({ timeout: 10000 });
  });
});
