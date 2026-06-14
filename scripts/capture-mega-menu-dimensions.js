// scripts/capture-mega-menu-dimensions.js
// Updated to robustly locate the mega‑menu trigger and capture dimensions

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const widths = [1440, 1280, 1024, 768]; // desktop/tablet breakpoints (skip tiny mobile for now)
  const screenshotsDir = path.resolve(__dirname, '../artifacts/mega-menu-screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';

  for (const width of widths) {
    await page.setViewport({ width, height: 1200, deviceScaleFactor: 1 });
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });

    // Ensure navigation bar is rendered
    await page.waitForSelector('header nav', { visible: true, timeout: 30000 });

    // Closed state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, `closed-${width}.png`), fullPage: false });

    // Locate first button inside the nav (Shop All) and dispatch mouseenter
    await page.evaluate(() => {
      const nav = document.querySelector('header nav');
      if (!nav) return;
      const btn = nav.querySelector('button');
      if (btn) {
        const ev = new MouseEvent('mouseenter', { bubbles: true, cancelable: true });
        btn.dispatchEvent(ev);
      }
    });
    // Wait for the panel animation and for the .shadow-lg element to appear
    await page.waitForSelector('.shadow-lg', { visible: true, timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 600)); // extra safety delay

    // Open state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, `open-${width}.png`), fullPage: false });

    // Measure dimensions of the mega menu panel (wrapper with shadow-lg)
    const dimensions = await page.evaluate(() => {
      const el = document.querySelector('.shadow-lg');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height) };
    });
    if (dimensions) {
      const log = `Viewport:${width}px MegaMenu width:${dimensions.width}px height:${dimensions.height}px`;
      const logPath = path.join(screenshotsDir, `dimensions-${width}.txt`);
      fs.writeFileSync(logPath, log);
    }
  }

  await browser.close();
  console.log('All screenshots & dimension logs saved to', screenshotsDir);
})();
