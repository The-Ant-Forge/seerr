import { expect, test } from '@playwright/test';
import { loginAsAdmin } from 'tests/e2e/helpers/auth';

test.describe('General Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('opens the settings page from the home page', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid=sidebar-toggle]').click();
    await page.locator('[data-testid=sidebar-menu-settings-mobile]').click();

    await expect(page.locator('.heading')).toContainText('General Settings');
  });

  test('modifies setting that requires restart', async ({ page }) => {
    await page.goto('/settings/network');

    await page.locator('#trustProxy').click();
    await page
      .locator('[data-testid=settings-network-form]')
      .evaluate((form) =>
        form.dispatchEvent(new Event('submit', { bubbles: true }))
      );
    await expect(page.locator('[data-testid=modal-title]')).toContainText(
      'Server Restart Required'
    );

    await page.locator('[data-testid=modal-ok-button]').click();
    await expect(page.locator('[data-testid=modal-title]')).toHaveCount(0);

    await page.locator('[type=checkbox]#trustProxy').click();
    await page
      .locator('[data-testid=settings-network-form]')
      .evaluate((form) =>
        form.dispatchEvent(new Event('submit', { bubbles: true }))
      );
    await expect(page.locator('[data-testid=modal-title]')).toHaveCount(0);
  });
});
