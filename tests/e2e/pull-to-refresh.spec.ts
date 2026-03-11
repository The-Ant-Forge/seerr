import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Pull To Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
  });

  test('reloads the current page', async ({ page }) => {
    await page.waitForTimeout(500);

    const apiResponsePromise = page.waitForResponse('**/api/v1/*');

    // Simulate pull-to-refresh with touch events
    const searchbar = page.locator('.searchbar');
    const box = await searchbar.boundingBox();

    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      await page.touchscreen.tap(startX, startY);

      // Perform a swipe down gesture
      await page.evaluate(
        async ({ x, y }) => {
          const touchStart = new Touch({
            identifier: 0,
            target: document.elementFromPoint(x, y)!,
            clientX: x,
            clientY: y,
          });
          const touchStartEvent = new TouchEvent('touchstart', {
            touches: [touchStart],
            targetTouches: [touchStart],
            changedTouches: [touchStart],
            bubbles: true,
          });
          document.elementFromPoint(x, y)!.dispatchEvent(touchStartEvent);

          // Move down in steps
          for (let i = 0; i < 10; i++) {
            const currentY = y + i * 50;
            const touchMove = new Touch({
              identifier: 0,
              target: document.elementFromPoint(x, y)!,
              clientX: x,
              clientY: currentY,
            });
            const touchMoveEvent = new TouchEvent('touchmove', {
              touches: [touchMove],
              targetTouches: [touchMove],
              changedTouches: [touchMove],
              bubbles: true,
            });
            document.elementFromPoint(x, y)!.dispatchEvent(touchMoveEvent);
            await new Promise((r) => setTimeout(r, 50));
          }

          const touchEnd = new Touch({
            identifier: 0,
            target: document.elementFromPoint(x, y)!,
            clientX: x,
            clientY: y + 500,
          });
          const touchEndEvent = new TouchEvent('touchend', {
            touches: [],
            targetTouches: [],
            changedTouches: [touchEnd],
            bubbles: true,
          });
          document.elementFromPoint(x, y)!.dispatchEvent(touchEndEvent);
        },
        { x: startX, y: startY }
      );
    }

    const response = await apiResponsePromise;
    expect(response.ok()).toBeTruthy();
  });
});
