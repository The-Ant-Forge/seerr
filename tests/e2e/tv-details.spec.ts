import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('TV Details', () => {
  test('loads a tv details page', async ({ page }) => {
    await loginAsAdmin(page);
    // Try to load stranger things
    await page.goto('/tv/66732');

    await expect(page.locator('[data-testid=media-title]')).toContainText(
      'Stranger Things (2016)'
    );
  });

  test('shows seasons and expands episodes', async ({ page }) => {
    await loginAsAdmin(page);

    // Try to load stranger things
    await page.goto('/tv/66732');

    // intercept request for season info
    const season4Response = page.waitForResponse('**/api/v1/tv/66732/season/4');

    const season4 = page.getByText('Season 4');
    await expect(season4).toBeVisible();
    await season4.scrollIntoViewIfNeeded();
    await season4.click();

    await season4Response;

    await expect(page.getByText('Chapter Nine')).toBeVisible();
  });
});
