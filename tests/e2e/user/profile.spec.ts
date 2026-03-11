import { expect, test } from '@playwright/test';
import watchlistFixture from 'tests/e2e/fixtures/watchlist.json';
import { ADMIN_EMAIL, loginAsAdmin } from 'tests/e2e/helpers/auth';

test.describe('User Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('opens user profile page from the home page', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid=user-menu]').click();
    await page.locator('[data-testid=user-menu-profile]').click();

    await expect(page.locator('h1')).toContainText(ADMIN_EMAIL);
  });

  test('loads plex watchlist', async ({ page }) => {
    await page.route(/\/api\/v1\/user\/\d+\/watchlist/, (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(watchlistFixture),
      })
    );

    const watchlistResponse = page.waitForResponse(
      /\/api\/v1\/user\/\d+\/watchlist/
    );
    const tmdbMovieResponse = page.waitForResponse('**/api/v1/movie/361743');

    await page.goto('/profile');

    await watchlistResponse;

    const sliderHeader = page
      .locator('.slider-header')
      .filter({ hasText: 'Plex Watchlist' });

    await sliderHeader.scrollIntoViewIfNeeded();

    await tmdbMovieResponse;
    // Wait a little longer to make sure the movie component reloaded
    await page.waitForTimeout(500);

    const slider = sliderHeader.locator('~ [data-testid=media-slider]').first();
    const firstCard = slider.locator('[data-testid=title-card]').first();

    await firstCard.hover();
    const text = await firstCard
      .locator('[data-testid=title-card-title]')
      .textContent();

    await firstCard.click();
    await expect(page.locator('[data-testid=media-title]')).toContainText(
      text!
    );
  });
});
