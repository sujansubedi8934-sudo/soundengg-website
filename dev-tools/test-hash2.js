const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  await page.goto('http://localhost:3000/app.html', { waitUntil: 'networkidle0' });
  
  console.log('Evaluating JS...');
  const logs = await page.evaluate(() => {
    const btn = document.getElementById('btn-launch-rta');
    if (!btn) return 'NO BTN';
    
    // Override showView to track if it's called
    const origShow = window.showView;
    window.showView = function(view, navBtn) {
      console.log('SHOW VIEW CALLED WITH', view ? view.id : 'null');
      origShow(view, navBtn);
    };
    
    btn.click();
    return document.getElementById('rta-view').style.display;
  });
  
  console.log('Style Display:', logs);
  await browser.close();
})();
