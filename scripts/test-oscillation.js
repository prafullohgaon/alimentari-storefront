const { chromium } = require('playwright');

(async () => {
  console.log('Testing scroll transition point pixel by pixel...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const url = 'http://localhost:3000';
  await page.goto(url, { waitUntil: 'networkidle' });

  // Get initial dimensions
  const initialHeaderHeight = await page.evaluate(() => {
    const header = document.querySelector('header');
    return header ? header.offsetHeight : 0;
  });
  console.log(`Initial header height: ${initialHeaderHeight}px`);

  console.log('\n--- SCROLLING DOWN PIXEL BY PIXEL ---');
  // Scroll slowly from 30px to 60px
  for (let scrollTarget = 30; scrollTarget <= 60; scrollTarget++) {
    await page.evaluate((target) => window.scrollTo(0, target), scrollTarget);
    // Wait a tiny bit for render updates
    await page.waitForTimeout(50);

    const actualScrollY = await page.evaluate(() => window.scrollY);
    const wrapperClass = await page.locator('header > div').first().getAttribute('class');
    const isTranslated = wrapperClass.includes('-translate-y-10');
    const headerHeight = await page.evaluate(() => {
      const header = document.querySelector('header');
      return header ? header.offsetHeight : 0;
    });

    console.log(`Target: ${scrollTarget}px | Actual scrollY: ${actualScrollY}px | Translated Scrolled: ${isTranslated} | Header Height: ${headerHeight}px`);
  }

  console.log('\n--- SCROLLING UP PIXEL BY PIXEL ---');
  // Scroll slowly back from 60px to 30px
  for (let scrollTarget = 60; scrollTarget >= 30; scrollTarget--) {
    await page.evaluate((target) => window.scrollTo(0, target), scrollTarget);
    await page.waitForTimeout(50);

    const actualScrollY = await page.evaluate(() => window.scrollY);
    const wrapperClass = await page.locator('header > div').first().getAttribute('class');
    const isTranslated = wrapperClass.includes('-translate-y-10');
    const headerHeight = await page.evaluate(() => {
      const header = document.querySelector('header');
      return header ? header.offsetHeight : 0;
    });

    console.log(`Target: ${scrollTarget}px | Actual scrollY: ${actualScrollY}px | Translated Scrolled: ${isTranslated} | Header Height: ${headerHeight}px`);
  }

  await browser.close();
})();
