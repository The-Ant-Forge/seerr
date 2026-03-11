import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import watchlistFixture from 'tests/e2e/fixtures/watchlist.json';
import { loginAsAdmin } from 'tests/e2e/helpers/auth';

const clickFirstTitleCardInSlider = async (
  page: Page,
  sliderTitle: string
): Promise<void> => {
  const sliderHeader = page
    .locator('.slider-header')
    .filter({ hasText: sliderTitle });
  const slider = sliderHeader.locator('~ [data-testid=media-slider]').first();
  const firstCard = slider.locator('[data-testid=title-card]').first();

  await firstCard.hover();
  const text = await firstCard
    .locator('[data-testid=title-card-title]')
    .textContent();

  await firstCard.click();
  await expect(page.locator('[data-testid=media-title]')).toContainText(text!);
};

test.describe('Discover', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('loads a trending item', async ({ page }) => {
    const trendingResponse = page.waitForResponse(
      '**/api/v1/discover/trending*'
    );
    await page.goto('/');
    await trendingResponse;
    await clickFirstTitleCardInSlider(page, 'Trending');
  });

  test('loads popular movies', async ({ page }) => {
    const popularMoviesResponse = page.waitForResponse(
      '**/api/v1/discover/movies*'
    );
    await page.goto('/');
    await popularMoviesResponse;
    await clickFirstTitleCardInSlider(page, 'Popular Movies');
  });

  test('loads upcoming movies', async ({ page }) => {
    const upcomingMoviesResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/discover/movies') &&
        resp.url().includes('page=1') &&
        resp.url().includes('primaryReleaseDateGte')
    );
    await page.goto('/');
    await upcomingMoviesResponse;
    await clickFirstTitleCardInSlider(page, 'Upcoming Movies');
  });

  test('loads popular series', async ({ page }) => {
    const popularTvResponse = page.waitForResponse('**/api/v1/discover/tv*');
    await page.goto('/');
    await popularTvResponse;
    await clickFirstTitleCardInSlider(page, 'Popular Series');
  });

  test('loads upcoming series', async ({ page }) => {
    const upcomingSeriesResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/discover/tv') &&
        resp.url().includes('page=1') &&
        resp.url().includes('firstAirDateGte=')
    );
    await page.goto('/');
    await upcomingSeriesResponse;
    await clickFirstTitleCardInSlider(page, 'Upcoming Series');
  });

  test('displays error for media with invalid TMDB ID', async ({ page }) => {
    await page.route('**/api/v1/media?*', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          pageInfo: { pages: 1, pageSize: 20, results: 1, page: 1 },
          results: [
            {
              downloadStatus: [],
              downloadStatus4k: [],
              id: 1922,
              mediaType: 'movie',
              tmdbId: 998814,
              tvdbId: null,
              imdbId: null,
              status: 5,
              status4k: 1,
              createdAt: '2022-08-18T18:11:13.000Z',
              updatedAt: '2022-08-18T19:56:41.000Z',
              lastSeasonChange: '2022-08-18T19:56:41.000Z',
              mediaAddedAt: '2022-08-18T19:56:41.000Z',
              serviceId: null,
              serviceId4k: null,
              externalServiceId: null,
              externalServiceId4k: null,
              externalServiceSlug: null,
              externalServiceSlug4k: null,
              ratingKey: null,
              ratingKey4k: null,
              seasons: [],
            },
          ],
        }),
      })
    );

    const mediaResponse = page.waitForResponse('**/api/v1/media?*');
    await page.goto('/');
    await mediaResponse;

    const sliderHeader = page
      .locator('.slider-header')
      .filter({ hasText: 'Recently Added' });
    const slider = sliderHeader.locator('~ [data-testid=media-slider]').first();
    const firstCard = slider.locator('[data-testid=title-card]').first();

    await expect(
      firstCard.locator('[data-testid=title-card-title]')
    ).toContainText('Movie Not Found');
  });

  test('displays error for request with invalid TMDB ID', async ({ page }) => {
    await page.route('**/api/v1/request?*', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          pageInfo: { pages: 1, pageSize: 10, results: 1, page: 1 },
          results: [
            {
              id: 582,
              status: 1,
              createdAt: '2022-08-18T18:11:13.000Z',
              updatedAt: '2022-08-18T18:11:13.000Z',
              type: 'movie',
              is4k: false,
              serverId: null,
              profileId: null,
              rootFolder: null,
              languageProfileId: null,
              tags: null,
              media: {
                downloadStatus: [],
                downloadStatus4k: [],
                id: 1922,
                mediaType: 'movie',
                tmdbId: 998814,
                tvdbId: null,
                imdbId: null,
                status: 2,
                status4k: 1,
                createdAt: '2022-08-18T18:11:13.000Z',
                updatedAt: '2022-08-18T18:11:13.000Z',
                lastSeasonChange: '2022-08-18T18:11:13.000Z',
                mediaAddedAt: null,
                serviceId: null,
                serviceId4k: null,
                externalServiceId: null,
                externalServiceId4k: null,
                externalServiceSlug: null,
                externalServiceSlug4k: null,
                ratingKey: null,
                ratingKey4k: null,
              },
              seasons: [],
              modifiedBy: null,
              requestedBy: {
                permissions: 4194336,
                id: 18,
                email: 'friend@seerr.dev',
                plexUsername: null,
                username: '',
                recoveryLinkExpirationDate: null,
                userType: 2,
                avatar:
                  'https://gravatar.com/avatar/c77fdc27cab83732b8623d2ea873d330?default=mm&size=200',
                movieQuotaLimit: null,
                movieQuotaDays: null,
                tvQuotaLimit: null,
                tvQuotaDays: null,
                createdAt: '2022-08-17T04:55:28.000Z',
                updatedAt: '2022-08-17T04:55:28.000Z',
                requestCount: 1,
                displayName: 'friend@seerr.dev',
              },
              seasonCount: 0,
            },
          ],
        }),
      })
    );

    const requestsResponse = page.waitForResponse('**/api/v1/request?*');
    await page.goto('/');
    await requestsResponse;

    const sliderHeader = page
      .locator('.slider-header')
      .filter({ hasText: 'Recent Requests' });
    const slider = sliderHeader.locator('~ [data-testid=media-slider]').first();
    const firstCard = slider.locator('[data-testid=request-card]').first();

    await expect(
      firstCard.locator('[data-testid=request-card-title]')
    ).toContainText('Movie Not Found');
  });

  test('loads plex watchlist', async ({ page }) => {
    await page.route('**/api/v1/discover/watchlist', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(watchlistFixture),
      })
    );

    const watchlistResponse = page.waitForResponse(
      '**/api/v1/discover/watchlist'
    );
    const tmdbMovieResponse = page.waitForResponse('**/api/v1/movie/361743');

    await page.goto('/');

    await watchlistResponse;

    const sliderHeader = page
      .locator('.slider-header')
      .filter({ hasText: 'Watchlist' });

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
