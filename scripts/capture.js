// capture.js - script to capture mega menu screenshot and console logs using Playwright
const { chromium } = require('playwright');

(async () => {
  const logs = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  // Wait for dev server to be up
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

  // Hover over Dispensa menu item
  const dispensaBtn = page.locator('text=Dispensa');
  await dispensaBtn.hover();
  // Wait a moment for menu to appear
  await page.waitForTimeout(1000);

  // Capture screenshot of the whole page (including mega menu)
  await page.screenshot({ path: 'dispensa_hover.png', fullPage: true });

  // Capture DOM snapshot of mega menu container
  const megaMenuHTML = await page.evaluate(() => {
    const el = document.querySelector('.absolute.top-full.left-0.w-full.z-50.shadow-lg');
    return el ? el.outerHTML : 'MegaMenu not found';
  });

  console.log('---CONSOLE_LOGS_START---');
  logs.forEach(l => console.log(l));
  console.log('---CONSOLE_LOGS_END---');
  console.log('---MEGA_MENU_HTML_START---');
  console.log(megaMenuHTML);
  console.log('---MEGA_MENU_HTML_END---');

  await browser.close();
})();
