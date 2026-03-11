import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, loginAsAdmin, USER_EMAIL } from 'tests/e2e/helpers/auth';

const visitUserEditPage = async (page: Page, email: string): Promise<void> => {
  await page.goto('/users');

  await page
    .locator('[data-testid=user-list-row]')
    .filter({ hasText: email })
    .getByText('Edit')
    .click();
};

test.describe('Auto Request Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should not see watchlist sync settings on an account without permissions', async ({
    page,
  }) => {
    await visitUserEditPage(page, USER_EMAIL);

    await expect(page.getByText('Auto-Request Movies')).toHaveCount(0);
    await expect(page.getByText('Auto-Request Series')).toHaveCount(0);
  });

  test('should see watchlist sync settings on an admin account', async ({
    page,
  }) => {
    await visitUserEditPage(page, ADMIN_EMAIL);

    await expect(page.getByText('Auto-Request Movies')).toBeVisible();
    await expect(page.getByText('Auto-Request Series')).toBeVisible();
  });

  test('should see auto-request settings after being given permission', async ({
    page,
  }) => {
    await visitUserEditPage(page, USER_EMAIL);

    await page
      .locator('[data-testid=settings-nav-desktop]')
      .getByText('Permissions')
      .click();

    await expect(page.locator('#autorequest')).not.toBeChecked();
    await page.locator('#autorequest').click();

    const userPermissionsResponse = page.waitForResponse(
      '**/api/v1/user/*/settings/permissions'
    );

    await page.getByText('Save Changes').click();

    await userPermissionsResponse;

    await page.reload();

    await expect(page.locator('#autorequest')).toBeChecked();
    await expect(page.locator('#autorequestmovies')).toBeChecked();
    await expect(page.locator('#autorequesttv')).toBeChecked();

    await page
      .locator('[data-testid=settings-nav-desktop]')
      .getByText('General')
      .click();

    await expect(page.getByText('Auto-Request Movies')).toBeVisible();
    await expect(page.getByText('Auto-Request Series')).toBeVisible();

    await expect(page.locator('#watchlistSyncMovies')).not.toBeChecked();
    await page.locator('#watchlistSyncMovies').click();
    await expect(page.locator('#watchlistSyncTv')).not.toBeChecked();
    await page.locator('#watchlistSyncTv').click();

    const userMainResponse = page.waitForResponse(
      '**/api/v1/user/*/settings/main'
    );

    await page.getByText('Save Changes').click();

    await userMainResponse;

    await page.reload();

    await expect(page.locator('#watchlistSyncMovies')).toBeChecked();
    await page.locator('#watchlistSyncMovies').click();
    await expect(page.locator('#watchlistSyncTv')).toBeChecked();
    await page.locator('#watchlistSyncTv').click();

    const userMainResponse2 = page.waitForResponse(
      '**/api/v1/user/*/settings/main'
    );

    await page.getByText('Save Changes').click();

    await userMainResponse2;

    await page
      .locator('[data-testid=settings-nav-desktop]')
      .getByText('Permissions')
      .click();

    await expect(page.locator('#autorequest')).toBeChecked();
    await page.locator('#autorequest').click();

    await page.getByText('Save Changes').click();
  });
});
