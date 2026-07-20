# Task Checklist - Organic Growth & Viral Loops

- [x] Component 1: Smart App Banner Setup
    - [x] Add `#web-smart-banner` HTML markup & styling in `app.html`
    - [x] Implement conditional visibility check in `main.js` (detecting mobile web vs native)
    - [x] Hook dismiss button to LocalStorage tracker
- [x] Component 2: Calculators Share Link
    - [x] Add "SHARE CONFIG" buttons to Delay and Sub Array calculator widgets in `app.html`
    - [x] Write click listener and serialization routine in `delayCalc.js`
    - [x] Write click listener and serialization routine in `subCalc.js`
    - [x] Update `handleDeepLink` in `main.js` to parse URL params, pre-fill inputs, and trigger a success Toast
- [x] Component 3: In-App Store Review Prompt
    - [x] Create HTML dialog markup for store rating prompt in `app.html`
    - [x] Implement usage tracking log and dialog trigger in `main.js`
    - [x] Add click handlers redirecting to App Store and Google Play Store respectively
- [x] Component 4: SEO-to-App Blog Banners
    - [x] Update `getTemplate` in `generate-static-blog.js` to append sticky mobile download CTAs on all posts
    - [x] Build & compile to verify output
