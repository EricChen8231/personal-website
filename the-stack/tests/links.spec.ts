import { test, expect } from '@playwright/test';

test.describe('Footer links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
  });

  test('email link points to USC address', async ({ page }) => {
    const emailLink = page.locator('footer a[href="mailto:echen823@usc.edu"]');
    await expect(emailLink).toBeVisible();
  });

  test('LinkedIn link points to correct profile', async ({ page }) => {
    const linkedinLink = page.locator('footer a[href*="linkedin.com/in/ericchen823"]');
    await expect(linkedinLink).toBeVisible();
  });

  test('GitHub link points to correct profile', async ({ page }) => {
    const githubLink = page.locator('footer a[href="https://github.com/ericchen8231"]');
    await expect(githubLink).toBeVisible();
  });

  test('all external links have rel="noopener noreferrer" or target="_blank"', async ({ page }) => {
    const externalLinks = page.locator('a[href^="https://"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      const target = await link.getAttribute('target');
      // External links should open in new tab
      if (target === '_blank') {
        const rel = await link.getAttribute('rel');
        expect(rel).toContain('noopener');
      }
    }
  });
});

test.describe('Meta tags', () => {
  test('page title is set', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle(/Eric Chen/);
  });

  test('meta description is set', async ({ page }) => {
    await page.goto('./');
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute('content', /45nm CMOS/i);
  });
});
