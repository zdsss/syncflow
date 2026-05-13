import { test, expect } from '@playwright/test';

test.describe('All Pages Load', () => {
  const pages = [
    'dashboard',
    'project',
    'todo',
    'files',
    'config',
    'bom',
    'process',
    'knowledge',
    'template',
    'personal',
    'query',
    'resources',
    'approval',
  ];

  for (const pageName of pages) {
    test(`/${pageName} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto(`/${pageName}`);
      await page.waitForLoadState('networkidle');

      expect(errors).toEqual([]);
    });
  }
});
