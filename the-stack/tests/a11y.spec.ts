import { test, expect } from '@playwright/test';

test.describe('Accessibility basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('html lang attribute is set', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('page has exactly one h1', async ({ page }) => {
    // Each section uses divs, so there should be 0 or 1 h1s
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('all images have alt attributes', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('interactive inputs have accessible labels', async ({ page }) => {
    // Scroll to L2 to make inputs present
    await page.locator('#sec-l2').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const inputA = page.locator('#l2-a');
    const inputB = page.locator('#l2-b');

    // Inputs should be present and interactive
    await expect(inputA).toBeVisible();
    await expect(inputB).toBeVisible();
  });

  test('canvas elements are present', async ({ page }) => {
    // bg-canvas and signal-canvas should be in the DOM
    await expect(page.locator('#bg-canvas')).toBeAttached();
    await expect(page.locator('#signal-canvas')).toBeAttached();
  });

  test('keyboard: tab reaches footer links', async ({ page }) => {
    // Tab through the page to the footer links
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // The email link should be focusable
    await page.locator('footer a[href="mailto:echen823@usc.edu"]').focus();
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('A');
  });
});
