import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, loginAsAdmin, USER_EMAIL } from 'tests/e2e/helpers/auth';

const testUser = {
  username: 'Test User',
  emailAddress: 'test@seeerr.dev',
  password: 'test1234',
};

test.describe('User List', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('opens the user list from the home page', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid=sidebar-toggle]').click();
    await page.locator('[data-testid=sidebar-menu-users-mobile]').click();

    await expect(page.locator('[data-testid=page-header]')).toContainText(
      'User List'
    );
  });

  test('can find the admin user and friend user in the user list', async ({
    page,
  }) => {
    await page.goto('/users');

    await expect(
      page
        .locator('[data-testid=user-list-row]')
        .filter({ hasText: ADMIN_EMAIL })
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid=user-list-row]')
        .filter({ hasText: USER_EMAIL })
    ).toBeVisible();
  });

  test('can create a local user', async ({ page }) => {
    await page.goto('/users');

    await page.getByText('Create Local User').click();

    await expect(page.locator('[data-testid=modal-title]')).toContainText(
      'Create Local User'
    );

    await page.locator('#username').fill(testUser.username);
    await page.locator('#email').fill(testUser.emailAddress);
    await page.locator('#password').fill(testUser.password);

    const userListResponse = page.waitForResponse(
      '**/api/v1/user?take=10&skip=0&sort=displayname'
    );

    await page.locator('[data-testid=modal-ok-button]').click();

    await userListResponse;
    // Wait a little longer for the user list to fully re-render
    await page.waitForTimeout(1000);

    await expect(
      page
        .locator('[data-testid=user-list-row]')
        .filter({ hasText: testUser.emailAddress })
    ).toBeVisible();
  });

  test('can delete the created local test user', async ({ page }) => {
    await page.goto('/users');

    await page
      .locator('[data-testid=user-list-row]')
      .filter({ hasText: testUser.emailAddress })
      .getByText('Delete')
      .click();

    await expect(page.locator('[data-testid=modal-title]')).toContainText(
      'Delete User'
    );

    const userListResponse = page.waitForResponse(
      '**/api/v1/user?take=10&skip=0&sort=displayname'
    );

    await expect(page.locator('[data-testid=modal-ok-button]')).toContainText(
      'Delete'
    );
    await page.locator('[data-testid=modal-ok-button]').click();

    await userListResponse;
    await page.waitForTimeout(1000);

    await expect(
      page
        .locator('[data-testid=user-list-row]')
        .filter({ hasText: testUser.emailAddress })
    ).toHaveCount(0);
  });
});
