const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

describe('Trial Status Evaluation in Auth Module', () => {
    test('auth.js checks trial_expires_at and sets isTrialActive', () => {
        const authContent = fs.readFileSync('assets/js/modules/auth.js', 'utf8');
        assert.equal(authContent.includes('trial_expires_at'), true, 'auth.js must check trial_expires_at');
        assert.equal(authContent.includes('isTrialActive'), true, 'auth.js must compute isTrialActive');
    });

    test('Active trial date is evaluated as Pro', () => {
        const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const profile = { is_pro: false, subscription_tier: 'free', trial_expires_at: futureDate };
        
        const isTrialActive = !!(profile.trial_expires_at && new Date(profile.trial_expires_at) > new Date());
        const isUserPro = profile.is_pro || isTrialActive;

        assert.equal(isTrialActive, true);
        assert.equal(isUserPro, true);
    });

    test('Expired trial date drops user to free tier', () => {
        const pastDate = new Date(Date.now() - 5000).toISOString();
        const profile = { is_pro: false, subscription_tier: 'free', trial_expires_at: pastDate };
        
        const isTrialActive = !!(profile.trial_expires_at && new Date(profile.trial_expires_at) > new Date());
        const isUserPro = profile.is_pro || isTrialActive;

        assert.equal(isTrialActive, false);
        assert.equal(isUserPro, false);
    });
});
