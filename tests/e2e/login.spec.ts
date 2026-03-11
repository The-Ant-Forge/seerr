import { expect, test } from '@playwright/test';
import { loginAsAdmin, loginAsUser } from './helpers/auth';

test.describe('Login Page', () => {
  test('succesfully logs in as an admin', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await expect(page.getByText('Trending')).toBeVisible();
  });

  test('succesfully logs in as a local user', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/');
    await expect(page.getByText('Trending')).toBeVisible();
  });
});
