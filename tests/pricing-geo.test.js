const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

describe('Regional Pricing Logic in Codebase', () => {
    test('checkoutAndPlatform.js contains exact India rates ₹199, ₹999, ₹1,999 and no ₹299 or ₹1,499 or ₹3,499', () => {
        const fileContent = fs.readFileSync('assets/js/modules/checkoutAndPlatform.js', 'utf8');
        
        // Assert old test values are completely gone from pricing logic
        assert.equal(fileContent.includes('₹299'), false, 'Should not contain old ₹299');
        assert.equal(fileContent.includes('₹1,499'), false, 'Should not contain old ₹1,499');
        assert.equal(fileContent.includes('₹3,499'), false, 'Should not contain old ₹3,499');

        // Assert new approved values are present
        assert.equal(fileContent.includes('₹199'), true, 'Should contain new ₹199');
        assert.equal(fileContent.includes('₹999'), true, 'Should contain new ₹999');
        assert.equal(fileContent.includes('₹1,999'), true, 'Should contain new ₹1,999');
    });

    test('adManager.js contains exact Razorpay amounts for India (19900, 99900, 199900)', () => {
        const fileContent = fs.readFileSync('assets/js/utils/adManager.js', 'utf8');

        // Assert old amounts are gone
        assert.equal(fileContent.includes('amount = 29900'), false, 'Should not contain old 29900');
        assert.equal(fileContent.includes('amount = 149900'), false, 'Should not contain old 149900');
        assert.equal(fileContent.includes('amount = 349900'), false, 'Should not contain old 349900');

        // Assert new approved amounts in paise are present
        assert.equal(fileContent.includes('amount = 19900'), true, 'Should contain 19900 (₹199)');
        assert.equal(fileContent.includes('amount = 99900'), true, 'Should contain 99900 (₹999)');
        assert.equal(fileContent.includes('amount = 199900'), true, 'Should contain 199900 (₹1,999)');
    });

    test('supabase/functions/secure-payment/index.ts contains updated USD (499, 2999, 6900) and INR (199900) amounts and no legacy 3499 or $19.99', () => {
        const edgeContent = fs.readFileSync('supabase/functions/secure-payment/index.ts', 'utf8');

        assert.equal(edgeContent.includes('3499'), false, 'Edge function must not contain legacy 3499 / 349900');
        assert.equal(edgeContent.includes('$1.99 or $19.99'), false, 'Edge function must not contain legacy $1.99 or $19.99');
        assert.equal(edgeContent.includes('6900'), true, 'Edge function must contain 6900 ($69.00 USD lifetime)');
        assert.equal(edgeContent.includes('199900'), true, 'Edge function must contain 199900 (₹1,999 INR lifetime)');
        assert.equal(edgeContent.includes('499'), true, 'Edge function must contain 499 ($4.99 USD monthly)');
        assert.equal(edgeContent.includes('2999'), true, 'Edge function must contain 2999 ($29.99 USD yearly)');
    });

    test('checkoutAndPlatform.js supports soundengg-country-override for testing India vs International pricing', () => {
        const fileContent = fs.readFileSync('assets/js/modules/checkoutAndPlatform.js', 'utf8');
        assert.equal(fileContent.includes('soundengg-country-override'), true, 'Should support soundengg-country-override');
    });
});
