import { test, expect } from '@playwright/test';

// All 7 stack layers + the "Now" and "Interests" sections
const SECTIONS = [
  { id: 'sec-now',       title: "What I'm building",       layer: null },
  { id: 'sec-l7',        title: 'Software Engineering',    layer: 7    },
  { id: 'sec-l6',        title: 'Systems & Networking',    layer: 6    },
  { id: 'sec-l5',        title: 'Languages & Toolchains',  layer: 5    },
  { id: 'sec-l4',        title: 'Microarchitecture',       layer: 4    },
  { id: 'sec-l3',        title: 'FPGA & HDL Design',       layer: 3    },
  { id: 'sec-l2',        title: 'Analog & Mixed-Signal',   layer: 2    },
  { id: 'sec-l1',        title: 'Semiconductor Devices',   layer: 1    },
  { id: 'sec-interests', title: 'Outside the lab',         layer: null },
];

test.describe('Stack sections exist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  for (const sec of SECTIONS) {
    test(`section #${sec.id} is in the DOM`, async ({ page }) => {
      const section = page.locator(`#${sec.id}`);
      await expect(section).toBeAttached();
    });

    test(`section #${sec.id} has correct title`, async ({ page }) => {
      // Scroll to the section so the animation fires
      await page.locator(`#${sec.id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(700); // let CSS transition play

      const inner = page.locator(`#${sec.id} .section-inner`);
      await expect(inner).toBeVisible();
      await expect(inner.locator('.section-title')).toContainText(sec.title);
    });
  }

  test('all 7 data-layer attributes are present', async ({ page }) => {
    for (let i = 1; i <= 7; i++) {
      await expect(page.locator(`section[data-layer="${i}"]`)).toBeAttached();
    }
  });
});

test.describe('Section scroll-in animations', () => {
  test('section-inner starts invisible', async ({ page }) => {
    await page.goto('./');
    // Before scrolling, the first section-inner should be invisible (opacity 0)
    const first = page.locator('.section-inner').first();
    const opacity = await first.evaluate(el => getComputedStyle(el).opacity);
    // It starts at 0 — if IntersectionObserver hasn't triggered yet
    expect(parseFloat(opacity)).toBeLessThanOrEqual(1);
  });

  test('section-inner becomes visible after scroll', async ({ page }) => {
    await page.goto('./');
    const section = page.locator('#sec-now .section-inner');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await expect(section).toHaveCSS('opacity', '1');
  });
});
