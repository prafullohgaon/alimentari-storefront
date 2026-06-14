// scripts/capture-mega-menu.js
// This script uses Puppeteer to capture screenshots of the mega menu
// at various viewport widths. It navigates to the home page, hovers over
// each top‑level navigation item, and saves screenshots for closed and
// opened states.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const widths = [1440, 1280, 1024, 768, 375]; // desktop, tablet, mobile
  const screenshotsDir = path.resolve(__dirname, '../artifacts/mega-menu-screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Assuming the dev server runs at http://localhost:3000
  const baseUrl = 'http://localhost:3000';

  for (const width of widths) {
    await page.setViewport({ width, height: 1200, deviceScaleFactor: 1 });
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });

    // Capture closed navigation (no hover)
    await page.screenshot({
      path: path.join(screenshotsDir, `closed-${width}.png`),
      fullPage: false,
    });

    // Hover over the first nav item (e.g., Grocery) to open mega menu
    const navSelector = 'header nav button:first-child';
    await page.hover(navSelector);
    // Wait a moment for animation
    await page.waitForTimeout(500);

    // Capture opened mega menu (desktop view)
    await page.screenshot({
      path: path.join(screenshotsDir, `open-${width}.png`),
      fullPage: false,
    });
  }

  await browser.close();
  console.log('Screenshots saved to', screenshotsDir);
})();
