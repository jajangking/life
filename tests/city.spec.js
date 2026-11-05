import { test, expect } from '@playwright/test';

async function enterCity(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__KOTA_KECIL__, null, { timeout: 45_000 });
}
const state = (page) => page.evaluate(() => window.__KOTA_KECIL__.getState());

test('the city renders, stays alive, and has no runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterCity(page);
  await expect(page).toHaveTitle(/Kota Kecil/);
  await expect(page.getByRole('heading', { name: 'Dunia kecil. Cerita besar.' })).toBeVisible();
  await expect(page.locator('#world canvas')).toBeVisible();
  await expect(page.locator('#loading')).toBeHidden();
  expect(await state(page)).toMatchObject({ residents: 40, places: 18, districts: 3, running: true, period: 'sore' });
  const before = (await state(page)).time;
  await expect.poll(async () => (await state(page)).time).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test('time, pause, speed, labels and zoom controls really change the simulation', async ({ page }) => {
  await enterCity(page);
  await page.locator('[data-period="malam"].time-button').click();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-period', 'malam');
  await expect(page.locator('#clock')).toContainText('20');
  expect((await state(page)).period).toBe('malam');
  await page.locator('#pause').click();
  expect((await state(page)).running).toBe(false);
  const pausedAt = (await state(page)).time;
  await page.waitForTimeout(500);
  expect((await state(page)).time).toBe(pausedAt);
  await page.locator('[data-speed="4"]').click();
  expect((await state(page)).speed).toBe(4);
  await page.locator('#pause').click();
  expect((await state(page)).running).toBe(true);
  await page.locator('#zoom-in').click();
  expect((await state(page)).zoom).toBeGreaterThan(1);
  await page.locator('#zoom-out').click();
  expect((await state(page)).zoom).toBeCloseTo(1, 1);
  await page.locator('#labels').click();
  await expect(page.locator('#annotations')).toBeHidden();
  await page.locator('#labels').click();
  await expect(page.locator('#annotations')).toBeVisible();
  await page.locator('#auto-rotate').click();
  await expect(page.locator('#auto-rotate')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-period="pagi"].time-button').click();
  expect((await state(page)).period).toBe('pagi');
  await expect(page.locator('#temperature')).toHaveText('24°');
});

test('residents can be searched, selected and followed', async ({ page }) => {
  await enterCity(page);
  await page.locator('#nav-people').click();
  await expect(page.locator('.resident-row')).toHaveCount(40);
  await page.locator('#resident-search').fill('Naya');
  await expect(page.locator('.resident-row')).toHaveCount(1);
  await page.locator('.resident-row').click();
  await expect(page.locator('#selection h2')).toHaveText('Naya');
  await expect(page.locator('#residents')).toBeHidden();
  await page.locator('#selection-action').click();
  expect((await state(page)).following).toBe('warga-2');
  await expect(page.locator('#selection-action')).toContainText('Berhenti mengikuti');
  await page.locator('#selection-action').click();
  expect((await state(page)).following).toBeNull();
  await page.locator('.selection-close').click();
  await expect(page.locator('#selection')).toBeHidden();
  await page.locator('#nav-people').click();
  await expect(page.locator('#resident-search')).toHaveValue('');
  await expect(page.locator('.resident-row')).toHaveCount(40);
  await page.locator('#resident-search').fill('Tidak Ada');
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('guided walks, information and photo downloads work', async ({ page }) => {
  await enterCity(page);
  await page.locator('#tour-start').click();
  await expect(page.locator('#tour-card h2')).toContainText('Kopi hangat');
  for (let i = 0; i < 3; i++) await page.locator('#tour-next').click();
  await expect(page.locator('#tour-card h2')).toContainText('sebuah rumah');
  await page.locator('#tour-next').click();
  await expect(page.locator('#tour-card')).toBeHidden();
  await page.locator('#help').click();
  await expect(page.locator('#info-dialog')).toBeVisible();
  await expect(page.locator('#dialog-content')).toContainText('Putar kota');
  await page.keyboard.press('Escape');
  await expect(page.locator('#info-dialog')).toBeHidden();
  await page.locator('#neighborhood').click();
  await expect(page.locator('#dialog-content')).toContainText('Kampung Mentari');
  await page.locator('.dialog-close').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#screenshot').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('kota-kecil-sore.png');
  expect(await download.failure()).toBeNull();
});

test('the compact mobile layout fits the viewport and keeps controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterCity(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('#tour-start')).toBeVisible();
  await expect(page.locator('#pause')).toBeInViewport();
  await page.locator('#nav-people').click();
  await expect(page.locator('#residents')).toBeInViewport();
  await page.locator('#resident-search').fill('Sari');
  await page.locator('.resident-row').click();
  await expect(page.locator('#selection')).toBeInViewport();
  await page.locator('.selection-close').click();
  await page.locator('[data-period="malam"].time-button').click();
  expect((await state(page)).period).toBe('malam');
});

test('unsupported WebGL receives an actionable fallback', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/.test(type)) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#loading')).toContainText('Kotanya belum bisa dibuka.');
  await expect(page.getByRole('button', { name: 'Coba lagi' })).toBeVisible();
});
