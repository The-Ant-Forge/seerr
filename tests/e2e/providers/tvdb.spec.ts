import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from 'tests/e2e/helpers/auth';

test.describe('TVDB Integration', () => {
  const ROUTES = {
    home: '/',
    metadataSettings: '/settings/metadata',
    tomorrowIsOursTvShow: '/tv/72879',
    monsterTvShow: '/tv/225634',
    dragonnBallZKaiAnime: '/tv/61709',
  };

  const SELECTORS = {
    sidebarToggle: '[data-testid=sidebar-toggle]',
    sidebarSettingsMobile: '[data-testid=sidebar-menu-settings-mobile]',
    settingsNavDesktop: 'nav[data-testid="settings-nav-desktop"]',
    metadataSaveButton: '[data-testid="metadata-save-button"]',
    tmdbStatus: '[data-testid="tmdb-status"]',
    tvdbStatus: '[data-testid="tvdb-status"]',
    tvMetadataProviderSelector: '[data-testid="tv-metadata-provider-selector"]',
    animeMetadataProviderSelector:
      '[data-testid="anime-metadata-provider-selector"]',
    seasonSelector: '[data-testid="season-selector"]',
    season1: 'Season 1',
    season2: 'Season 2',
    season3: 'Season 3',
    episodeList: '[data-testid="episode-list"]',
    episode9: '9 - Hang Men',
  };

  const navigateToMetadataSettings = async (page: Page) => {
    await page.goto(ROUTES.home);
    await page.locator(SELECTORS.sidebarToggle).click();
    await page.locator(SELECTORS.sidebarSettingsMobile).click();
    await page
      .locator(
        `${SELECTORS.settingsNavDesktop} a[href="${ROUTES.metadataSettings}"]`
      )
      .click();
  };

  const testAndVerifyMetadataConnection = async (page: Page) => {
    const testResponse = page.waitForResponse(
      '**/api/v1/settings/metadatas/test'
    );
    await page
      .locator('button[type="button"]')
      .filter({ hasText: 'Test' })
      .click();
    return testResponse;
  };

  const saveMetadataSettings = async (
    page: Page,
    customBody: Record<string, string> | null = null
  ) => {
    if (customBody) {
      await page.route('**/api/v1/settings/metadatas', (route) => {
        if (route.request().method() === 'PUT') {
          route.continue({
            postData: JSON.stringify(customBody),
          });
        } else {
          route.continue();
        }
      });
    }

    const saveResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/v1/settings/metadatas') &&
        resp.request().method() === 'PUT'
    );
    await page.locator(SELECTORS.metadataSaveButton).click();
    return saveResponse;
  };

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Metadata settings
    await navigateToMetadataSettings(page);

    // Verify we're on the correct settings page
    await expect(
      page.locator('h3').filter({ hasText: 'Metadata Providers' })
    ).toBeVisible();

    // Configure TVDB as TV provider and test connection
    await page.locator(SELECTORS.tvMetadataProviderSelector).click();
    await page
      .locator('[class*="react-select__option"]')
      .filter({ hasText: 'TheTVDB' })
      .click();

    // Test the connection
    const testResponse = await testAndVerifyMetadataConnection(page);
    expect(testResponse.status()).toBe(200);

    // Check TVDB connection status
    await expect(page.locator(SELECTORS.tvdbStatus)).toContainText(
      'Operational'
    );

    // Save settings
    const saveResponse = await saveMetadataSettings(page, {
      anime: 'tvdb',
      tv: 'tvdb',
    });
    expect(saveResponse.status()).toBe(200);
    const saveBody = await saveResponse.json();
    expect(saveBody.tv).toBe('tvdb');
  });

  test('should display "Tomorrow is Ours" show information with multiple seasons from TVDB', async ({
    page,
  }) => {
    await page.goto(ROUTES.tomorrowIsOursTvShow);

    // Select Season 2 and verify it loads
    const season2 = page.getByText(SELECTORS.season2);
    await expect(season2).toBeVisible();
    await season2.scrollIntoViewIfNeeded();
    await season2.click();

    // Verify that episodes are displayed for Season 2
    await expect(page.getByText('260 - Episode 506')).toBeVisible();
  });

  test('Should display "Monster" show information correctly when not existing on TVDB', async ({
    page,
  }) => {
    await page.goto(ROUTES.monsterTvShow);

    // Intercept season 1 request
    const season1Response = page.waitForResponse(
      '**/api/v1/tv/225634/season/1'
    );

    // Select Season 1
    const season1 = page.getByText(SELECTORS.season1);
    await expect(season1).toBeVisible();
    await season1.scrollIntoViewIfNeeded();
    await season1.click();

    // Wait for the season data to load
    await season1Response;

    // Verify specific episode exists
    await expect(page.getByText(SELECTORS.episode9)).toBeVisible();
  });

  test('should display "Dragon Ball Z Kai" show information with multiple only 2 seasons from TVDB', async ({
    page,
  }) => {
    await page.goto(ROUTES.dragonnBallZKaiAnime);

    // Select Season 2 and verify it visible
    const season2 = page.getByText(SELECTORS.season2);
    await expect(season2).toBeVisible();
    await season2.scrollIntoViewIfNeeded();
    await season2.click();

    // select season 3 and verify it not visible
    await expect(page.getByText(SELECTORS.season3)).toHaveCount(0);
  });
});
