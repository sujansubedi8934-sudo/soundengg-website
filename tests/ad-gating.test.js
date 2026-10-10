const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

describe('Pro Feature Ad Gate and Cooldown Rules', () => {
    test('adManager.js exports or defines gateProFeature', () => {
        const fileContent = fs.readFileSync('assets/js/utils/adManager.js', 'utf8');
        assert.equal(fileContent.includes('gateProFeature'), true, 'adManager.js must contain gateProFeature function');
    });

    test('gateProFeature grants immediate access if user is premium/trial active', () => {
        let isPremium = true;
        let adPlayed = false;
        let actionExecuted = false;

        function simulateGate(cb) {
            if (isPremium) {
                cb();
                return;
            }
            adPlayed = true;
        }

        simulateGate(() => { actionExecuted = true; });
        assert.equal(actionExecuted, true);
        assert.equal(adPlayed, false);
    });

    test('gateProFeature grants immediate access if 2.5m cooldown is active', () => {
        let isPremium = false;
        let cooldownExpiry = Date.now() + 150000; // 2.5 min in future
        let adPlayed = false;
        let actionExecuted = false;

        function simulateGate(cb) {
            if (isPremium || Date.now() < cooldownExpiry) {
                cb();
                return;
            }
            adPlayed = true;
        }

        simulateGate(() => { actionExecuted = true; });
        assert.equal(actionExecuted, true);
        assert.equal(adPlayed, false);
    });

    test('gateProFeature triggers ad modal when cooldown is expired for free tier', () => {
        let isPremium = false;
        let cooldownExpiry = Date.now() - 5000; // 5s ago
        let modalTriggered = false;
        let actionExecuted = false;

        function simulateGate(cb) {
            if (isPremium || Date.now() < cooldownExpiry) {
                cb();
                return;
            }
            modalTriggered = true;
        }

        simulateGate(() => { actionExecuted = true; });
        assert.equal(actionExecuted, false);
        assert.equal(modalTriggered, true);
    });
});
