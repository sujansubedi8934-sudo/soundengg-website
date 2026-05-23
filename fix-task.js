const fs = require('fs');
let code = fs.readFileSync('/Users/sujansubedi/.gemini/antigravity/brain/1e37a828-3e5f-4d33-80ed-25323a212412/task.md', 'utf8');

// The multi_replace replaced:
// - [ ] Phase 3: AdManager & Monetization
// with Phase 6.

code = code.replace(
    "- [x] Phase 6: Popup & Inline AdMob Integration\n  - [x] Finalize CSS/HTML wrappers for AdSense\n  - [x] Build robust offline/pending placeholders\n  - [x] Move Capacitor native AdMob logic into adManager.js\n  - [x] Extract `initAdManager` to `assets/js/utils/adManager.js`\n  - [x] Extract Razorpay checkouts",
    "- [x] Phase 3: AdManager & Monetization\n  - [x] Extract `initAdManager` to `assets/js/utils/adManager.js`\n  - [x] Extract Razorpay checkouts\n- [x] Phase 6: Popup & Inline AdMob Integration\n  - [x] Finalize CSS/HTML wrappers for AdSense\n  - [x] Build robust offline/pending placeholders\n  - [x] Move Capacitor native AdMob logic into adManager.js"
);

fs.writeFileSync('/Users/sujansubedi/.gemini/antigravity/brain/1e37a828-3e5f-4d33-80ed-25323a212412/task.md', code);
