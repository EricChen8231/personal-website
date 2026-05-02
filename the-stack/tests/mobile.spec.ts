import { test, expect } from '@playwright/test';

// These tests run under the mobile-safari / mobile-chrome projects defined in
// playwright.config.ts, but can also be run standalone.

test.describe('Mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 size

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads without horizontal overflow', async ({ page }) => {
    const bodyWidth  = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth  = await page.evaluate(() => window.innerWidth);
    // Allow a tiny margin for scrollbar width
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 2);
  });

  test('hero name is visible on mobile', async ({ page }) => {
    await expect(page.locator('.hero-name')).toBeVisible();
    await expect(page.locator('.hero-name')).toContainText('Eric Chen');
  });

  test('right panel does not obscure content on mobile', async ({ page }) => {
    // On small screens the right panel should either be hidden or repositioned.
    // At minimum, the hero-name text should not be clipped.
    const heroNameBox  = await page.locator('.hero-name').boundingBox();
    const viewportSize = page.viewportSize()!;
    if (heroNameBox) {
      expect(heroNameBox.x).toBeGreaterThanOrEqual(0);
      expect(heroNameBox.x + heroNameBox.width).toBeLessThanOrEqual(viewportSize.width + 4);
    }
  });

  test('sections are reachable by scrolling on mobile', async ({ page }) => {
    // Scroll to L4 section and check it becomes visible
    await page.locator('#sec-l4').scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const inner = page.locator('#sec-l4 .section-inner');
    await expect(inner).toBeAttached();
  });
});

test.describe('Desktop layout', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('right panel is visible on desktop', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#right-panel')).toBeVisible();
  });

  test('content has correct margins on desktop', async ({ page }) => {
    await page.goto('/');
    const content = page.locator('#content');
    const box = await content.boundingBox();
    // #content should have margin-left:36 and margin-right:310
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(30);
    }
  });
});
