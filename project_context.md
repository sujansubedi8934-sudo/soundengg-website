# PROJECT CONTEXT: SoundEngg

## 1. Project Overview & Target Audience
* **What it is:** **SoundEngg** (along with the premium tier **SoundEngg Pro**) is a professional, high-precision utility toolkit and dashboard for audio engineers, system technicians, and acoustic professionals. It runs as an offline-first responsive web application (Vercel) and a native mobile application (Android & iOS) via Ionic Capacitor.
* **Target User:** Live sound engineers, Front of House (FOH) and Monitor mixers, system technicians, RF coordinators, and studio/acoustical engineers working under high-pressure live concert and festival environments.
* **Core Value Proposition:** Fast, phase-accurate, offline-first access to critical acoustic calculations, real-time analyzer (RTA) metering, frequency ear-training, and connector pinouts—wrapped in a high-contrast industrial interface designed specifically for low-light show settings.

### Core Modules & Features
1. **RTA Analyser:** High-resolution, low-latency Real-Time Analysis with live frequency peak tracking, selectable frequency weightings, and a 60FPS spectrogram waterfall visualizer.
2. **Ear Training EQ Game:** EQ peak/cut identification practice, compression matching, and frequency isolation training games.
3. **Subwoofer Arrays:** Interactive broadside, Cardioids (d&b CSA, Gradient/Inline presets) array delay, and spacing calculators.
4. **Delay & Time Alignment:** Temperature-compensated delay computations for aligning main PA columns to delay towers or fills.
5. **Instrument Tuner:** Ultra-precise chromatic tuner utilizing rapid fundamental pitch tracking algorithms.
6. **Signal Generator:** High-fidelity audio oscillator producing Sine sweeps, Pink Noise, and White Noise.
7. **SPL Attenuation:** Inverse-square law calculator predicting decibel drop over physical distance.
8. **Connector Pinouts:** Rapid-lookup electrical wiring layouts for XLR, SpeakON (2/4/8-pole), TRS, RJ45, DMX, and more.
9. **Engineering Blog:** An offline-cached technical knowledge base containing acoustic papers and tutorial guides.

---

## 2. Tech Stack & Architecture

### Frontend & Aesthetics
* **Core Languages:** Pure semantic HTML5, Vanilla JavaScript (ES6+), and Vanilla CSS3. No bulky frameworks (React/Vue/Angular) are used, ensuring instantaneous, lightweight startup speeds on both browsers and native mobile webviews.
* **Design System & Aesthetics:** Retro-futuristic **Industrial VFD (Vacuum Fluorescent Display)** design. Employs deep pitch-black backdrops, neon amber (`#ff9900` / `#ffb700`) and cyan glowing highlights, high-contrast grid layouts tailored for low-light outdoor gigs, glassmorphic drawer menus, customized scrollbars, and fine-tuned micro-animations.
* **Asset Pipeline & Compilation:** A custom Node.js utility (`build-app.js`) that cleans, minifies, and copies production-ready assets into a separate `/www` output directory, filtering out Node packages, development files, and project configurations.
* **SEO & Trust Signals:** Adheres to Google AdSense guidelines with dedicated trust pages (`/about` and `/contact`), standardized navigation systems, and clean extensionless URLs (configured in `vercel.json` and generated in sitemaps/canonical links to avoid crawler redirect loops).

### Modular Architecture Structure
The application's JavaScript is split into modular segments:
1. **`/assets/js/utils/audioCalcs.js`** -> Phase-accurate pure audio math formulas (Delay, Sub arrays, SPL attenuation).
2. **`/assets/js/utils/adManager.js`** -> Monetization logic, dynamic gateway loaders (Razorpay/Lemon Squeezy), Google AdSense & native AdMob initialization, listeners, and lock-screen failsafes.
3. **`/assets/js/modules/auth.js`** -> Supabase session tracking, background database syncs, login/logout UI bindings.
4. **`/assets/js/modules/premium.js`** -> Premium UI update logic and global `isPremiumActive` status toggles.
5. **`/assets/js/components/`** -> Module-specific UI and WebAudio Canvas controllers:
   - `rtaEngine.js` (60FPS spectrogram & peak tracking)
   - `tunerEngine.js` (Chromatic tuner)
   - `signalGenerator.js` (Sine, Pink, White noise oscillators)
   - `subCalc.js` (Subwoofer array spacing/delay)
   - `delayCalc.js` (Temperature-compensated delay alignment)
   - `earTraining.js` (Frequency isolation game)
   - `tapTempo.js` (Tap-tempo calculations)
   - `pinouts.js` (Connector layouts)
   - `blogEngine.js` (Blog and markdown rendering)
6. **`/assets/js/blog-data.js`** and **`/assets/js/data/blogs/*.js`** -> Individual isolated static blog contents.
7. **`/assets/js/main.js`** -> App Initialization, Supabase routing, Global State, version checks, and Capacitor deep links.

### Mobile Shell & Wrapper
* **Wrapper Platform:** **Ionic Capacitor (v8.3.4)**.
* **Bundle ID:** `com.soundengg.app` (configured as **SoundEngg Console**).
* **Native Plugins:**
  * `@capacitor-community/admob` (Mobile monetization banner overlay)
  * `@capacitor/browser` (Launches checkout pages securely inside in-app browser sheets)
  * `@capacitor/device` (App version checks and device hardware details)
  * `@capacitor/app` (Handles native back buttons and exit controls)
  * `capacitor-razorpay` (Domestic Indian checkout wrapper)

### Backend & Databases
* **Database & Auth Engine:** **Supabase (SDK v2)** handles secure user auth sessions, database transactions, and client-server profile state storage.
* **Supabase Edge Functions:**
  * `secure-payment` -> Handles client-side checkout initiation, verification handshakes, and cancellations for both Razorpay and Lemon Squeezy.
  * `razorpay-webhook` -> Verifies and processes transaction webhooks from Razorpay.
  * `lemonsqueezy-webhook` -> Verifies and processes transaction webhooks from Lemon Squeezy.
  * `delete-account` -> Securely deletes user accounts to meet App Store requirements.

### Monetization & Ads Integration
* **Hybrid Billing Gateway (Razorpay + Lemon Squeezy)**:
  * **Indian Users (INR)**: Routed to **Razorpay** (₹199 / ₹1,999 / ₹3,499) for optimized native UPI / Card checkouts.
  * **International Users (USD)**: Routed to **Lemon Squeezy** ($2.99 / $29.99 / $49.99) supporting international cards, PayPal, Apple Pay, and Google Pay.
  * **Dynamic Geolocation**: Geolocation timezone offsets and Geo-IP lookups automatically swap pricing cards, text details, and payment modals dynamically.
* **Web Ads Network:** **Google AdSense** served via a custom 15-second "view ad to unlock 6 hours of tools" model.
* **Mobile Ads Network:** Native **Google AdMob** integrated via `@capacitor-community/admob`.
  * *Bypass Fail-Safe:* Bypasses screen-blur locks immediately if AdMob fails initialization (e.g. in emulator environments or App Store reviews).

---

## 3. Database Schema & Data Models

### 3.1. `profiles` Table
Stores registered accounts, active subscriptions, and user metadata.
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | References `auth.users.id`. |
| `email` | TEXT | User's primary registered email address. |
| `full_name` | TEXT | User's full name. |
| `is_pro` | BOOLEAN | True if premium features are unlocked. |
| `subscription_tier` | TEXT | `'free'`, `'monthly'`, `'yearly'`, `'lifetime'`. |
| `subscription_provider`| TEXT | `'razorpay'`, `'lemonsqueezy'`, `'razorpay_cancelled'`, `'lemonsqueezy_cancelled'`, `'app_store'`, `'play_store'`. |
| `subscription_id` | TEXT | Payment transaction ID (order/subscription ID). |
| `subscription_expires_at`| TIMESTAMP | Exact expiration timestamp of active premium access (null for lifetime). |

---

## 4. Current Milestones & Next Steps

### What is Currently Working (Milestones Completed)
- [x] **Monolithic Refactoring:** Extracted js modules (`rtaEngine.js`, `adManager.js`, `auth.js`, etc.) to isolate UI engines, core calculators, and ad lockouts from the main thread.
- [x] **AdSense Trust Signaling:** Created `/about` and `/contact` pages, and integrated vercel clean URLs to resolve AdSense "Low value content" violations.
- [x] **Hybrid Checkout Architecture:** Integrated Razorpay (domestic INR) and Lemon Squeezy (international USD) under a unified Supabase Edge Function API, resolving international purchase verification issues.
- [x] **Capacitor WebView Compatibility:** Integrated `@capacitor/browser` to launch Lemon Squeezy checkouts natively, bypassing WebView iframe/CSP bugs.
- [x] **Dismissable App Updates:** Added "UPDATE LATER" button triggers to allow users to bypass non-blocking native client upgrades.
- [x] **Safari WebKit Audio Output Fallback:** Implemented grace fallbacks for Safari/WebKit where `setSinkId` is unsupported.
- [x] **Apple Compliance (Account Deletion):** Integrated a secure, in-app "Delete Account" flow.

### Upcoming Plan & Next Operational Steps
1. **Google Play Console closed testing (Priority)**:
   - Run the 14-day closed beta test with the recruited group of testers (12+ active testers).
   - Gather feedback via the Web3Forms AJAX form on `contact.html`.
2. **Supabase Production Security Hardening**:
   - Link external SMTP transactional mail servers to bypass signup rate limits.
