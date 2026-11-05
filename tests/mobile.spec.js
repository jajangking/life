import { test, expect } from '@playwright/test';

test.use({ isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

async function enterCity(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await page.waitForFunction(() => window.__KOTA_KECIL__, null, { timeout: 45_000 });
  await expect(page.locator('#loading')).toBeHidden();
}

// Check geometry, not just "visible": an element can be visible to Playwright
// while a big headline still covers the canvas or intercepts a touch target.
async function layoutProblems(page) {
  return page.evaluate(() => {
    const problems = [];
    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!element || !element.getClientRects().length || getComputedStyle(element).visibility === 'hidden') return null;
      return element.getBoundingClientRect();
    };
    const intersects = (a, b) => a && b && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    const documentBox = document.documentElement;
    if (documentBox.scrollWidth > innerWidth + 1) problems.push('horizontal page overflow');
    if (documentBox.scrollHeight > innerHeight + 1) problems.push('vertical page overflow');
    const headline = box('.intro h1');
    for (const selector of ['.header', '.time-panel', '#world canvas', '.scene-tools', '#labels', '#neighborhood', '#tour-start', '.playback-dock']) {
      const rectangle = box(selector);
      if (!rectangle) { problems.push(`${selector} is hidden`); continue; }
      if (rectangle.left < -1 || rectangle.right > innerWidth + 1 || rectangle.top < -1 || rectangle.bottom > innerHeight + 1) problems.push(`${selector} is outside the viewport`);
      if (intersects(headline, rectangle)) problems.push(`headline overlaps ${selector}`);
    }
    const canvas = box('#world canvas');
    if (!canvas || canvas.height < 140 || canvas.width < 220) problems.push('insufficient space for the city');
    for (const selector of ['.header', '.intro', '.time-panel', '.scene-tools', '#labels', '#neighborhood', '#tour-start', '.playback-dock']) {
      if (intersects(canvas, box(selector))) problems.push(`city is covered by ${selector}`);
    }
    if (headline) {
      const element = document.querySelector('.intro h1');
      if (element.scrollWidth > element.clientWidth + 1) problems.push('headline is clipped horizontally');
      if (headline.height > parseFloat(getComputedStyle(element).lineHeight) * 2 + 1) problems.push('headline takes more than two lines');
    }
    const headerButtons = ['.brand', '#nav-people', '#sound', '#help'];
    for (let i = 0; i < headerButtons.length; i++) {
      for (let j = i + 1; j < headerButtons.length; j++) {
        if (intersects(box(headerButtons[i]), box(headerButtons[j]))) problems.push(`${headerButtons[i]} overlaps ${headerButtons[j]}`);
      }
    }
    if (canvas) {
      const hit = document.elementFromPoint(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
      if (hit?.closest('.intro, .time-panel, .header, .playback-dock')) problems.push('UI intercepts a touch in the middle of the city');
    }
    return problems;
  });
}
async function expectClearLayout(page, description) {
  await expect.poll(() => layoutProblems(page), { message: description }).toEqual([]);
}
async function expectTouchable(page, selector) {
  await expect(page.locator(selector)).toBeInViewport({ ratio: 1 });
  await expect.poll(() => page.locator(selector).evaluate((element) => {
    const r = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  }), { message: `${selector} must not be covered by a heading or panel` }).toBe(true);
}

// Same page is resized like a real phone, without reloading/recreating the city.
test('headlines never cover the city or controls across portrait and landscape phones', async ({ page }) => {
  test.setTimeout(150_000);
  const sizes = [
    [320, 568], [360, 640], [375, 667], [390, 844], [412, 915],
    [430, 932], [568, 320], [844, 390], [932, 430], [390, 844],
  ];
  await enterCity(page, { width: sizes[0][0], height: sizes[0][1] });
  for (const [width, height] of sizes) {
    await test.step(`${width} × ${height}`, async () => {
      await page.setViewportSize({ width, height });
      await expectClearLayout(page, `No overlapping title or controls at ${width} × ${height}`);
    });
  }
  for (const selector of ['#nav-people', '#sound', '#help', '#zoom-in', '#zoom-out', '#pause', '#tour-start']) {
    const size = await page.locator(selector).boundingBox();
    expect(size.width, `${selector} touch width`).toBeGreaterThanOrEqual(42);
    expect(size.height, `${selector} touch height`).toBeGreaterThanOrEqual(40);
    await expectTouchable(page, selector);
  }
});

test('safe-area padding, larger headings and changing browser height preserve the city space', async ({ page }) => {
  await enterCity(page, { width: 390, height: 844 });
  // Chromium has no physical notch: exercise the same CSS variables as env().
  await page.locator('.app-shell').evaluate((element) => {
    element.style.setProperty('--safe-top', '24px');
    element.style.setProperty('--safe-bottom', '34px');
    element.style.setProperty('--safe-left', '20px');
    element.style.setProperty('--safe-right', '20px');
  });
  const header = await page.locator('.header').boundingBox();
  const dock = await page.locator('.playback-dock').boundingBox();
  expect(header.y).toBeGreaterThanOrEqual(24);
  expect(dock.y + dock.height).toBeLessThanOrEqual(844 - 34);
  await expectClearLayout(page, 'Notch and home-indicator padding');
  await page.locator('.intro h1').evaluate((element) => { element.style.fontSize = '32px'; });
  for (const height of [700, 780, 844]) {
    await page.setViewportSize({ width: 390, height });
    await expectClearLayout(page, `Enlarged text with browser height ${height}`);
  }
});

test('tour and resident titles stay bounded, actions stay tappable and the selected subject stays above the sheet', async ({ page }) => {
  test.setTimeout(120_000);
  await enterCity(page, { width: 320, height: 568 });
  await page.locator('#tour-start').tap();
  await expect(page.locator('#tour-card h2')).toContainText('Kopi hangat');
  await expect(page.locator('#tour-card')).toBeInViewport({ ratio: 1 });
  await expectTouchable(page, '#tour-close');
  await expectTouchable(page, '#tour-next');
  const hero = await page.locator('.intro h1').boundingBox();
  const sheet = await page.locator('#tour-card').boundingBox();
  expect(sheet.y).toBeGreaterThan(hero.y + hero.height);
  expect(await page.locator('#tour-card h2').evaluate((h) => h.scrollWidth <= h.clientWidth + 1)).toBe(true);
  await expect.poll(async () => {
    const state = await page.evaluate(() => window.__KOTA_KECIL__.getState());
    const panel = await page.locator('#tour-card').boundingBox();
    const world = await page.locator('#world').boundingBox();
    return state.selectedScreen?.y > world.y + 4 && state.selectedScreen?.y < panel.y - 8;
  }).toBe(true);
  await page.setViewportSize({ width: 568, height: 320 });
  for (const [index, heading] of ['Kopi hangat', 'bernapas', 'Resep lama', 'sebuah rumah'].entries()) {
    if (index > 0) await page.locator('#tour-next').tap();
    await expect(page.locator('#tour-card h2')).toContainText(heading);
    await expect(page.locator('#tour-card')).toBeInViewport({ ratio: 1 });
    const title = await page.locator('#tour-card h2').boundingBox();
    const body = await page.locator('.tour-body').boundingBox();
    expect(title.y, 'Tour title starts inside its scroll body').toBeGreaterThanOrEqual(body.y);
    expect(title.y + title.height, 'Entire tour title is readable on short landscape').toBeLessThanOrEqual(body.y + body.height + 1);
    await expectTouchable(page, '#tour-close');
    await expectTouchable(page, '#tour-next');
    const tour = await page.locator('#tour-card').boundingBox();
    const world = await page.locator('#world').boundingBox();
    expect(tour.x + tour.width).toBeLessThanOrEqual(world.x);
  }
  await page.locator('#tour-close').tap();
  await expect(page.locator('#tour-card')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__KOTA_KECIL__.getState().bottomOcclusion)).toBe(0);
  await page.setViewportSize({ width: 320, height: 568 });

  await page.locator('#nav-people').tap();
  await page.locator('#resident-search').fill('Sari');
  await page.locator('.resident-row').tap();
  await expect(page.locator('#selection h2')).toHaveText('Sari');
  await expectTouchable(page, '#selection-action');
  await expectTouchable(page, '.selection-close');
  await page.locator('#selection-action').tap();
  expect((await page.evaluate(() => window.__KOTA_KECIL__.getState())).following).toBe('warga-0');
  await expect.poll(async () => {
    const state = await page.evaluate(() => window.__KOTA_KECIL__.getState());
    const panel = await page.locator('#selection').boundingBox();
    const world = await page.locator('#world').boundingBox();
    return state.selectedScreen?.y > world.y + 4 && state.selectedScreen?.y < panel.y - 8;
  }).toBe(true);
  // Rotate while the panel is open: the story moves left, the city stays right.
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#selection')).toBeInViewport({ ratio: 1 });
  const story = await page.locator('#selection').boundingBox();
  const city = await page.locator('#world').boundingBox();
  expect(story.x + story.width).toBeLessThanOrEqual(city.x);
  await expectTouchable(page, '#selection-action');
  await expectTouchable(page, '.selection-close');
  await page.locator('.selection-close').tap();
  await page.setViewportSize({ width: 320, height: 568 });
  await expectClearLayout(page, 'Layout restores after closing the story and rotating back');
});

test('resident search and its heading fit when the on-screen keyboard reduces the viewport', async ({ page }) => {
  await enterCity(page, { width: 390, height: 844 });
  await page.locator('#nav-people').tap();
  await expect(page.locator('#nav-people')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.intro h1')).toBeHidden();
  await page.locator('#resident-search').tap();
  // Equivalent layout-space reduction to a software keyboard opening.
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(page.locator('#residents')).toBeInViewport({ ratio: 1 });
  await expectTouchable(page, '#residents-close');
  await expect(page.locator('#resident-search')).toBeInViewport({ ratio: 1 });
  await page.locator('#resident-search').fill('Naya');
  await page.setViewportSize({ width: 320, height: 360 });
  await expect(page.locator('#residents')).toBeInViewport({ ratio: 1 });
  await expectTouchable(page, '#residents-close');
  await expect(page.locator('.resident-row')).toHaveCount(1);
  await expect(page.locator('.resident-row')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.scene-tools')).toHaveJSProperty('inert', true);
  await page.setViewportSize({ width: 568, height: 320 });
  await expect(page.locator('#residents')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#residents h2')).toBeInViewport({ ratio: 1 });
  await expectTouchable(page, '#residents-close');
  await page.locator('#residents-close').tap();
  await expect(page.locator('#nav-people')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.scene-tools')).toHaveJSProperty('inert', false);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.intro h1')).toBeVisible();
  await expectClearLayout(page, 'Closing search restores the non-overlapping headline');
});

test('touches reach the time controls, camera and playback instead of the headline', async ({ page }) => {
  await enterCity(page, { width: 360, height: 640 });
  await page.locator('.time-button[data-period="malam"]').tap();
  expect((await page.evaluate(() => window.__KOTA_KECIL__.getState())).period).toBe('malam');
  await page.locator('#zoom-in').tap();
  expect((await page.evaluate(() => window.__KOTA_KECIL__.getState())).zoom).toBeGreaterThan(1);
  await page.locator('#zoom-out').tap();
  await page.locator('#pause').tap();
  expect((await page.evaluate(() => window.__KOTA_KECIL__.getState())).running).toBe(false);
  const canvas = await page.locator('#world canvas').boundingBox();
  const before = await page.locator('#compass-arrow').getAttribute('style');
  const session = await page.context().newCDPSession(page);
  const x = canvas.x + canvas.width / 2, y = canvas.y + canvas.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 60, y: y + 12 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.locator('#compass-arrow').getAttribute('style')).not.toBe(before);
  await session.detach();
  await expectClearLayout(page, 'Camera remains usable in night mode and when paused');
});
