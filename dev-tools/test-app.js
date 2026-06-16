const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if(msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  await page.goto('http://localhost:3000/app.html', { waitUntil: 'networkidle2' });
  await browser.close();
})();
