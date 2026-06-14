const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  const widths = [1600,1440,1280,1024];
  const url = 'http://localhost:3000/reparto';
  for (const w of widths) {
    await page.setViewport({width:w, height:1200});
    await page.goto(url, {waitUntil:'networkidle0'});
    const screenshotPath = path.resolve(__dirname, `preview_${w}.png`);
    await page.screenshot({path:screenshotPath, fullPage:true});
    console.log('Saved', screenshotPath);
  }
  await browser.close();
})();
