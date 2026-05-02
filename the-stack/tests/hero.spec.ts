import { test, expect } from '@playwright/test';

test.describe('Hero section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Eric Chen/);
  });

  test('hero name is visible', async ({ page }) => {
    const name = page.locator('.hero-name');
    await expect(name).toBeVisible();
    await expect(name).toHaveText('Eric Chen');
  });

  test('hero tagline contains expected text', async ({ page }) => {
    const tagline = page.locator('.hero-tagline');
    await expect(tagline).toContainText('Full-stack engineer');
    await expect(tagline).toContainText('45nm CMOS');
  });

  test('hero meta shows USC affiliation', async ({ page }) => {
    const meta = page.locator('.hero-meta');
    await expect(meta).toContainText('USC');
  });

  test('typewriter command appears in hero prompt', async ({ page }) => {
    // Wait for the typewriter animation to complete (up to 6s)
    const heroCmd = page.locator('#hero-cmd');
    await expect(heroCmd).toContainText('eric_chen', { timeout: 8000 });
  });

  test('scroll hint is present', async ({ page }) => {
    await expect(page.locator('.scroll-hint')).toBeVisible();
  });

  test('right panel terminal is present', async ({ page }) => {
    await expect(page.locator('#terminal')).toBeVisible();
    await expect(page.locator('#term-header')).toBeVisible();
  });
});
