// capture_all.js - capture mega menu HTML and screenshots for multiple categories
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // wait for dev server
  const url = 'http://localhost:3000';
  let attempts = 0;
  while (attempts < 30) {
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      break;
    } catch (e) {
      attempts++;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  if (attempts === 30) {
    console.error('Failed to load dev server');
    process.exit(1);
  }

  const categories = [
    { id: 'dispensa', name: 'Dispensa' },
    { id: 'latticini-salumi', name: 'Formaggi & Salumi' },
    { id: 'panetteria', name: 'Panetteria' },
    { id: 'enoteca', name: 'Enoteca' },
    { id: 'frutta-verdura', name: 'Frutta & Verdura' },
    { id: 'casa-persona', name: 'Casa & Persona' },
  ];

  for (const cat of categories) {
    const btn = page.locator(`text=${cat.name}`);
    await btn.hover();
    await page.waitForTimeout(1000);
    // capture screenshot
    await page.screenshot({ path: `${cat.id}_hover.png`, fullPage: true });
    // capture mega menu HTML
    const html = await page.evaluate(() => {
      const el = document.querySelector('.absolute.top-full.left-0.w-full.z-50.shadow-lg');
      return el ? el.outerHTML : 'MegaMenu not found';
    });
    fs.writeFileSync(`${cat.id}_mega.html`, html);
    // move mouse away to close menu before next
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
  }

  await browser.close();
})();
