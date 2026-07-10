import { test, expect } from '@playwright/test';

test.describe('L2 interactive adder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    // Scroll the L2 section into view so StackClient wires up the inputs
    await page.locator('#sec-l2').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  });

  test('adder inputs exist', async ({ page }) => {
    await expect(page.locator('#l2-a')).toBeVisible();
    await expect(page.locator('#l2-b')).toBeVisible();
  });

  test('default values produce correct sum', async ({ page }) => {
    // Defaults: A=6, B=5 → sum=11
    const result = page.locator('#l2-result');
    await expect(result).toContainText('11', { timeout: 2000 });
  });

  test('changing inputs updates the result', async ({ page }) => {
    await page.locator('#l2-a').fill('9');
    await page.locator('#l2-a').dispatchEvent('input');
    await page.locator('#l2-b').fill('7');
    await page.locator('#l2-b').dispatchEvent('input');
    await expect(page.locator('#l2-result')).toContainText('16', { timeout: 2000 });
  });

  test('binary representation appears', async ({ page }) => {
    const binary = page.locator('#l2-binary');
    // Should show binary strings like 0110 + 0101 = 01011
    await expect(binary).not.toBeEmpty();
  });

  test('overflow wraps correctly at 15+15=30', async ({ page }) => {
    await page.locator('#l2-a').fill('15');
    await page.locator('#l2-a').dispatchEvent('input');
    await page.locator('#l2-b').fill('15');
    await page.locator('#l2-b').dispatchEvent('input');
    await expect(page.locator('#l2-result')).toContainText('30', { timeout: 2000 });
  });
});

test.describe('Terminal log populates', () => {
  test('terminal shows "Ready" after init', async ({ page }) => {
    await page.goto('./');
    const termBody = page.locator('#term-body');
    await expect(termBody).toContainText('Ready', { timeout: 10000 });
  });

  test('terminal shows all 7 layer loaded messages', async ({ page }) => {
    await page.goto('./');
    // Wait for all layers to load in the terminal (7 * 140ms + buffer)
    await page.waitForTimeout(3000);
    for (let i = 1; i <= 7; i++) {
      await expect(page.locator('#term-body')).toContainText(`[L${i}]`);
    }
  });
});
