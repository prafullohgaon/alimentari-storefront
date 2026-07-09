const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting Scroll Navigation Bar Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const url = 'http://localhost:3000';
  console.log(`Navigating to ${url}...`);

  // Navigate and wait
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
    console.error('Failed to load page.');
    process.exit(1);
  }

  console.log('Page loaded successfully.');

  // Target paths for screenshots in the artifacts directory
  const artifactDir = 'C:\\Users\\ronan\\.gemini\\antigravity-ide\\brain\\98d55ef0-b794-449f-8a7c-f1b400014b11';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const scrollTopPath = path.join(artifactDir, 'scroll_top.png');
  const scrollScrolledPath = path.join(artifactDir, 'scroll_scrolled.png');

  // Verify Initial State
  const initialScrollY = await page.evaluate(() => window.scrollY);
  console.log(`Initial window.scrollY: ${initialScrollY}`);

  // Check if utility bar exists and check its bounding box or height
  const utilityBarSelector = 'header .bg-slate-50.border-b';
  const mainNavbarSelector = 'header div.transition-all';

  const initialUtilityVisible = await page.locator(utilityBarSelector).isVisible();
  console.log(`Initial state: Utility Bar is visible? ${initialUtilityVisible}`);

  const initialNavbarClasses = await page.locator(mainNavbarSelector).first().getAttribute('class');
  console.log(`Initial state: Navbar classes: "${initialNavbarClasses}"`);

  // Take screenshot at top of page
  await page.screenshot({ path: scrollTopPath });
  console.log(`Saved screenshot at top: ${scrollTopPath}`);

  // Scroll down by 200px
  console.log('Scrolling down by 200px...');
  await page.evaluate(() => window.scrollTo(0, 200));
  // Wait a short duration for Framer Motion animation and React state update
  await page.waitForTimeout(500);

  const scrolledY = await page.evaluate(() => window.scrollY);
  console.log(`Scrolled window.scrollY: ${scrolledY}`);

  const scrolledUtilityVisible = await page.locator(utilityBarSelector).isVisible();
  console.log(`Scrolled state: Utility Bar is visible? ${scrolledUtilityVisible}`);

  const scrolledNavbarClasses = await page.locator(mainNavbarSelector).first().getAttribute('class');
  console.log(`Scrolled state: Navbar classes: "${scrolledNavbarClasses}"`);

  // Take screenshot after scroll
  await page.screenshot({ path: scrollScrolledPath });
  console.log(`Saved screenshot scrolled: ${scrollScrolledPath}`);

  // Scroll back to top
  console.log('Scrolling back to top...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const resetScrollY = await page.evaluate(() => window.scrollY);
  const resetUtilityVisible = await page.locator(utilityBarSelector).isVisible();
  console.log(`Reset state: window.scrollY: ${resetScrollY}, Utility Bar is visible? ${resetUtilityVisible}`);

  await browser.close();
  console.log('Test completed successfully.');
})();
