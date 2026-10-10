const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/Users/sai/.gemini/antigravity/brain/8155be98-00ae-43a9-a0eb-c5420b700152';

(async () => {
    console.log('[Puppeteer] Launching Chrome...');
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });

    try {
        console.log('[Puppeteer] Navigating to http://localhost:3000/app.html...');
        await page.goto('http://localhost:3000/app.html', { waitUntil: 'networkidle0' });

        // Hide any venue or first-time modals
        await page.evaluate(() => {
            const venueModal = document.getElementById('venue-env-modal');
            if (venueModal) {
                venueModal.classList.add('hidden');
                venueModal.style.display = 'none';
            }
            const ratingModal = document.getElementById('in-app-rating-modal');
            if (ratingModal) {
                ratingModal.classList.add('hidden');
                ratingModal.style.display = 'none';
            }
        });

        // 1. Verify Pro Upgrade Modal in Dark Mode
        await page.evaluate(() => {
            document.documentElement.className = 'dark';
            document.body.className = 'dark';
            const modal = document.getElementById('pro-upgrade-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                modal.style.zIndex = '999999';
            }
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'verify-pro-upgrade-modal-dark.png')
        });
        console.log('[Puppeteer] Captured verify-pro-upgrade-modal-dark.png');

        // 2. Verify Pro Upgrade Modal in Light Mode
        await page.evaluate(() => {
            document.documentElement.className = 'light';
            document.body.className = 'light';
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'verify-pro-upgrade-modal-light.png')
        });
        console.log('[Puppeteer] Captured verify-pro-upgrade-modal-light.png');

        // 3. Verify Plan Selector Modal in Light Mode
        await page.evaluate(() => {
            const proModal = document.getElementById('pro-upgrade-modal');
            if (proModal) {
                proModal.classList.add('hidden');
                proModal.style.display = 'none';
            }
            const planModal = document.getElementById('plan-selector-modal');
            if (planModal) {
                planModal.classList.remove('hidden');
                planModal.style.display = 'flex';
                planModal.style.zIndex = '999999';
            }
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'verify-plan-selector-modal-light.png')
        });
        console.log('[Puppeteer] Captured verify-plan-selector-modal-light.png');

        // 4. Verify Plan Selector Modal in Dark Mode
        await page.evaluate(() => {
            document.documentElement.className = 'dark';
            document.body.className = 'dark';
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'verify-plan-selector-modal-dark.png')
        });
        console.log('[Puppeteer] Captured verify-plan-selector-modal-dark.png');

        console.log('[Puppeteer] All modal visual verifications captured successfully!');
    } catch (err) {
        console.error('[Puppeteer] Verification error:', err);
    } finally {
        await browser.close();
    }
})();
