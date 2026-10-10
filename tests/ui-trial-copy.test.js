const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

describe('7-Day Free Trial UI and Copy Verification', () => {
    test('app.html contains no fractional pricing and has 7-Day Trial copy in Menu and Modals', () => {
        const appHtml = fs.readFileSync('app.html', 'utf8');

        // Verify fractional pricing is gone
        assert.equal(appHtml.includes('$2.50/mo'), false, 'app.html should not contain $2.50/mo');

        // Verify 7-day trial touchpoints exist
        assert.equal(appHtml.includes('START 7-DAY FREE TRIAL'), true, 'app.html should feature 7-day trial button');
        assert.equal(appHtml.includes('7-DAY FREE TRIAL'), true, 'app.html should feature 7-DAY FREE TRIAL badges');
    });

    test('pro.html contains updated 7-Day Free Trial hero and cards', () => {
        const proHtml = fs.readFileSync('pro.html', 'utf8');
        assert.equal(proHtml.includes('Start 7-Day Free Trial'), true, 'pro.html should have Start 7-Day Free Trial button');
        assert.equal(proHtml.includes('7-Day Free Trial • Most Popular'), true, 'pro.html should have 7-Day Free Trial badge');
    });
});
