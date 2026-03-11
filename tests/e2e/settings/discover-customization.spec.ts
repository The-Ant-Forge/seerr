import { expect, test } from '@playwright/test';
import { loginAsAdmin } from 'tests/e2e/helpers/auth';

test.describe('Discover Customization', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('show the discover customization settings', async ({ page }) => {
    await page.goto('/');

    await page.locator('[data-testid=discover-start-editing]').click();

    const createSliderHeader = page.locator(
      '[data-testid=create-slider-header]'
    );
    await expect(createSliderHeader).toContainText('Create New Slider');
    await createSliderHeader.scrollIntoViewIfNeeded();

    // There should be some built in options
    await expect(
      page.locator('[data-testid=discover-slider-edit-mode]')
    ).toContainText(['Recently Added']);
    await expect(
      page.locator('[data-testid=discover-slider-edit-mode]')
    ).toContainText(['Recent Requests']);
  });

  test('can drag to re-order elements and save to persist the changes', async ({
    page,
  }) => {
    await page.goto('/');

    await page.locator('[data-testid=discover-start-editing]').click();

    const sliders = page.locator('[data-testid=discover-slider-edit-mode]');

    // Drag first item to second position
    const source = sliders.first();
    const target = sliders.nth(1);
    await source.dragTo(target);

    await expect(sliders.nth(1)).toContainText('Recently Added');

    const discoverSlidersResponse = page.waitForResponse(
      '**/api/v1/settings/discover'
    );
    await page.locator('[data-testid=discover-customize-submit]').click();
    await discoverSlidersResponse;

    await page.reload();

    await page.locator('[data-testid=discover-start-editing]').click();

    const slidersAfterReload = page.locator(
      '[data-testid=discover-slider-edit-mode]'
    );

    await expect(slidersAfterReload.nth(1)).toContainText('Recently Added');

    // Drag back to original order
    const source2 = slidersAfterReload.first();
    const target2 = slidersAfterReload.nth(1);
    await source2.dragTo(target2);

    await expect(slidersAfterReload.nth(1)).toContainText('Recent Requests');

    const discoverSlidersResponse2 = page.waitForResponse(
      '**/api/v1/settings/discover'
    );
    await page.locator('[data-testid=discover-customize-submit]').click();
    await discoverSlidersResponse2;
  });

  test('can create a new discover option and remove it', async ({ page }) => {
    await page.goto('/');

    const sliderTitle = 'Custom Keyword Slider';

    await page.locator('[data-testid=discover-start-editing]').click();

    await page.locator('#sliderType').selectOption('TMDB Movie Keyword');

    await page.locator('#title').fill(sliderTitle);

    // First confirm that an invalid keyword doesn't allow us to submit anything
    const searchKeywordResponse = page.waitForResponse(
      '**/api/v1/search/keyword*'
    );
    await page.locator('#data').fill('invalidkeyword');
    await page.locator('#data').press('Enter');
    await searchKeywordResponse;

    await expect(
      page
        .locator('[data-testid=create-discover-option-form]')
        .locator('button')
    ).toBeDisabled();

    await page.locator('#data').clear();
    const searchKeywordResponse2 = page.waitForResponse(
      '**/api/v1/search/keyword*'
    );
    await page.locator('#data').fill('christmas');
    await page.locator('#data').press('Enter');
    await searchKeywordResponse2;

    // Confirming we have some results
    const sliderHeader = page
      .locator('.slider-header')
      .filter({ hasText: sliderTitle });
    const slider = sliderHeader.locator('~ [data-testid=media-slider]').first();
    await expect(
      slider.locator('[data-testid=title-card]').first()
    ).toBeVisible({ timeout: 10000 });

    const discoverSliderResponse = page.waitForResponse(
      '**/api/v1/settings/discover/*'
    );
    const discoverSlidersResponse = page.waitForResponse(
      '**/api/v1/settings/discover'
    );
    await page
      .locator('[data-testid=create-discover-option-form]')
      .evaluate((form) =>
        form.dispatchEvent(new Event('submit', { bubbles: true }))
      );
    await discoverSliderResponse;
    await discoverSlidersResponse;
    await page.waitForTimeout(1000);

    await expect(
      page.locator('[data-testid=discover-slider-edit-mode]').first()
    ).toContainText(sliderTitle);

    // Make sure its still there even if we reload
    await page.reload();

    await page.locator('[data-testid=discover-start-editing]').click();

    await expect(
      page.locator('[data-testid=discover-slider-edit-mode]').first()
    ).toContainText(sliderTitle);

    // Verify it's not rendering on our discover page (its still disabled!)
    await page.goto('/');

    await expect(page.locator('.slider-header')).not.toContainText([
      sliderTitle,
    ]);

    await page.locator('[data-testid=discover-start-editing]').click();

    // Enable it, and check again
    await page
      .locator('[data-testid=discover-slider-edit-mode]')
      .first()
      .locator('[role="checkbox"]')
      .click();

    const discoverSlidersResponse2 = page.waitForResponse(
      '**/api/v1/settings/discover'
    );
    await page.locator('[data-testid=discover-customize-submit]').click();
    await discoverSlidersResponse2;

    await page.goto('/');

    const enabledSliderHeader = page
      .locator('.slider-header')
      .filter({ hasText: sliderTitle });
    const enabledSlider = enabledSliderHeader
      .locator('~ [data-testid=media-slider]')
      .first();
    await expect(
      enabledSlider.locator('[data-testid=title-card]').first()
    ).toBeVisible();

    await page.locator('[data-testid=discover-start-editing]').click();

    // let's delete it and confirm its deleted.
    const discoverSliderDeleteResponse = page.waitForResponse(
      '**/api/v1/settings/discover/*'
    );
    const discoverSlidersResponse3 = page.waitForResponse(
      '**/api/v1/settings/discover'
    );
    await page
      .locator('[data-testid=discover-slider-edit-mode]')
      .first()
      .locator('[data-testid=discover-slider-remove-button]')
      .click();

    await discoverSliderDeleteResponse;
    await discoverSlidersResponse3;
    await page.waitForTimeout(1000);

    await expect(
      page.locator('[data-testid=discover-slider-edit-mode]').first()
    ).not.toContainText(sliderTitle);
  });
});
