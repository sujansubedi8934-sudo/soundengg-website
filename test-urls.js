const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`[404 URL] ${response.url()}`);
    }
  });

  await page.goto('http://localhost:3000/app.html', { waitUntil: 'networkidle0' });
  await browser.close();
})();
