import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Movie Details', () => {
  test('loads a movie page', async ({ page }) => {
    await loginAsAdmin(page);
    // Try to load minions: rise of gru
    await page.goto('/movie/438148');

    await expect(page.locator('[data-testid=media-title]')).toContainText(
      'Minions: The Rise of Gru (2022)'
    );
  });
});
