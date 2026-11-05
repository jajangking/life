import { test, expect } from '@playwright/test';

test.use({ isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

const state = (page) => page.evaluate(() => window.__KOTA_KECIL__.getState());
async function enter(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__KOTA_KECIL__, null, { timeout: 45_000 });
  await expect(page.locator('#loading')).toBeHidden();
}
async function economical(page) {
  await page.locator('#help').tap();
  await page.locator('[data-quality="hemat"]').tap();
  await page.locator('.dialog-close').tap();
}

test('all three districts can be visited from the phone dialog and the camera shortcut', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enter(page);
  expect(await state(page)).toMatchObject({ residents: 40, places: 18, districts: 3, traffic: { vehicles: 16 } });
  await page.locator('#neighborhood').tap();
  await expect(page.locator('[data-district]')).toHaveCount(3);
  await page.locator('[data-district="kenanga"]').tap();
  await expect(page.locator('#info-dialog')).toBeHidden();
  expect((await state(page)).activeDistrict).toBe('kenanga');
  await expect.poll(async () => Math.abs((await state(page)).target.x - 31)).toBeLessThan(0.2);
  await page.locator('#view').tap();
  expect((await state(page)).activeDistrict).toBe('sungai');
  await expect.poll(async () => Math.abs((await state(page)).target.z + 28)).toBeLessThan(0.2);
  await page.locator('#reset').tap();
  await expect.poll(async () => (await state(page)).zoom).toBeCloseTo(1, 1);
  expect((await state(page)).activeDistrict).toBe('semua');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(errors).toEqual([]);
});

test('rain is rendered, economical quality changes rendering, and night closes the shop shutters', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await page.locator('#help').tap();
  await page.locator('[data-quality="hemat"]').tap();
  expect(await state(page)).toMatchObject({ quality: { mode: 'hemat', tier: 'hemat', shadows: false, pixelRatio: 1 }, visibleDetailBatches: 0 });
  await page.locator('[data-weather="rain"]').tap();
  await expect.poll(async () => (await state(page)).weather.drops).toBe(160);
  expect((await state(page)).weather.active).toBe(true);
  await expect.poll(async () => (await state(page)).life.sheltering).toBeGreaterThan(0);
  await page.locator('.dialog-close').tap();
  await page.locator('.time-button[data-period="malam"]').tap();
  await expect.poll(async () => (await state(page)).shuttersClosed).toBe(3);
  await page.locator('#help').tap();
  await page.locator('[data-weather="clear"]').tap();
  await expect.poll(async () => (await state(page)).weather.active).toBe(false);
  await expect.poll(async () => (await state(page)).weather.drops).toBe(0);
  await page.locator('[data-quality="detail"]').tap();
  expect((await state(page)).quality).toMatchObject({ mode: 'detail', tier: 'detail', shadows: true, shadowSize: 2048 });
  await page.locator('.dialog-close').tap();
  await expect(page.locator('#pause')).toBeInViewport({ ratio: 1 });
});

test('automatic watching changes scenes and immediately yields to a manual camera action', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page); await economical(page);
  await page.locator('#auto-rotate').tap();
  await expect(page.locator('#auto-rotate')).toHaveAttribute('aria-pressed', 'true');
  expect((await state(page)).cinematic).toMatchObject({ active: true, shot: 'kota' });
  await expect.poll(async () => (await state(page)).cinematic.index, { timeout: 30_000 }).toBeGreaterThan(0);
  expect((await state(page)).cinematic.shot).toBe('kopi');
  await expect(page.locator('.scene-hint')).toContainText('Nonton otomatis');
  await page.locator('#zoom-in').tap();
  await expect(page.locator('#auto-rotate')).toHaveAttribute('aria-pressed', 'false');
  expect((await state(page)).cinematic.active).toBe(false);
  await page.waitForTimeout(1200);
  expect((await state(page)).cinematic.active).toBe(false);
  // Explicitly starting another scene mode must also turn off the director.
  await page.locator('#auto-rotate').tap();
  await page.locator('#nav-people').tap();
  expect((await state(page)).cinematic.active).toBe(false);
  await expect(page.locator('#auto-rotate')).toHaveAttribute('aria-pressed', 'false');
});

test('arrivals, passenger boarding and deliveries actually occur, while pause freezes the simulation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page); await economical(page);
  await page.locator('[data-speed="4"]').tap();
  await expect.poll(async () => (await state(page)).traffic.boarded, { timeout: 20_000 }).toBeGreaterThan(0);
  await expect.poll(async () => (await state(page)).traffic.delivered, { timeout: 20_000 }).toBeGreaterThan(0);
  await expect.poll(async () => (await state(page)).life.arrivals, { timeout: 20_000 }).toBeGreaterThan(0);
  await page.locator('#pause').tap();
  const frozen = await state(page);
  expect(frozen.running).toBe(false);
  expect(frozen.life.walking + frozen.life.resting + frozen.life.onTransport).toBe(40);
  await page.waitForTimeout(600);
  const after = await state(page);
  expect(after.time).toBe(frozen.time);
  expect(after.traffic).toEqual(frozen.traffic);
  expect(after.life).toEqual(frozen.life);
});
