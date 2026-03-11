import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@seerr.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'test1234';
const USER_EMAIL = process.env.USER_EMAIL ?? 'friend@seerr.dev';
const USER_PASSWORD = process.env.USER_PASSWORD ?? 'test1234';

export { ADMIN_EMAIL, USER_EMAIL };

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');

  await page.locator('[data-testid=email]').fill(email);
  await page.locator('[data-testid=password]').fill(password);

  const loginResponse = page.waitForResponse('**/api/v1/auth/local');
  await page.locator('[data-testid=local-signin-button]').click();
  await loginResponse;

  await expect(page).toHaveURL(/\//);
}

export async function loginAsAdmin(page: Page) {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function loginAsUser(page: Page) {
  await login(page, USER_EMAIL, USER_PASSWORD);
}
