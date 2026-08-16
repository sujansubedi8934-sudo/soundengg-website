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
  
  console.log('Clicking on RTA button...');
  const success = await page.evaluate(() => {
    const btn = document.getElementById('btn-launch-rta');
    if(btn) {
      btn.click();
      return true;
    }
    return false;
  });
  
  console.log('Button click success:', success);
  
  await new Promise(r => setTimeout(r, 1000));
  
  const rtaVisible = await page.evaluate(() => {
    const el = document.getElementById('rta-view');
    return el && el.style.display !== 'none';
  });
  
  console.log('Is RTA Visible:', rtaVisible);

  await browser.close();
})();
