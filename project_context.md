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

### Modular Architecture Structure (Current Phase)
To solve performance bottlenecks and massive file sizes, the `main.js` monolith has been successfully modularized into the following structure:
1. **`/assets/js/utils/audioCalcs.js`** -> Phase-accurate pure audio math formulas (Delay, Sub arrays, SPL attenuation).
2. **`/assets/js/utils/adManager.js`** -> Monetization logic, Razorpay checkout, Google AdSense & native AdMob initialization, listeners, and lock-screen failsafes.
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
7. **`/assets/js/main.js`** -> Stripped down strictly to App Initialization, Supabase routing, Global State, and Capacitor deep links.

### Mobile Shell & Wrapper
* **Wrapper Platform:** **Ionic Capacitor (v8.3.4)**.
* **Bundle ID:** `com.soundengg.app` (configured as **SoundEngg Console**).
* **Native Projects:**
  * Android Studio Project (`/android` shell directory) compiling to a production `.aab` bundle.
  * Apple Xcode Project (`/ios` shell directory) compiling to iOS App Store packages.
* **Native Audio Permissions:** Native wrapper manifests request microphone and audio-recording hooks (`RECORD_AUDIO` on Android, `NSMicrophoneUsageDescription` on iOS) for tuner and analyzer modules.

### Backend & Databases
* **Database & Auth Engine:** **Supabase (SDK v2)** handles secure user auth sessions (safely wrapped to survive mobile webview cache clearances), database transactions, and client-server profile state storage.
* **State Management:** Local browser state handles real-time calculations. A custom 1.5s debounced state manager synchronizes configurations silently with Supabase (`user_configs` table) when the user is authenticated.

### Monetization & Ads Integration
* **Web Payment gateway:** **Razorpay Web Subscriptions** (Monthly/Yearly/Lifetime) integrated via secure Supabase Edge Functions (`secure-payment`).
* **Web Ads Network:** **Google AdSense** served via a custom 15-second "view ad to unlock 6 hours of tools" model.
* **Mobile Ads Network:** Native **Google AdMob** integrated via `@capacitor-community/admob`.
  * *Bypass Fail-Safe:* Kept pristine in `adManager.js`. If native AdMob fails (e.g., in simulator shells or App Store reviews), the app instantly bypasses the lock and grants dashboard access.

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
| `subscription_provider`| TEXT | `'razorpay'`, `'app_store'`, `'play_store'`. |
| `subscription_id` | TEXT | Payment transaction token. |
| `subscription_expires_at`| TIMESTAMP | Exact expiration timestamp of active premium access. |

### 3.2. `user_configs` Table
Stores debounced, cross-device settings parameters for all calculation and analyzer tools.
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `user_id` | UUID (PK) | References `profiles.id`. |
| `config_type` | TEXT (PK) | Name of active tool (`'delay'`, `'subcalc'`, `'rta'`, `'tuner'`). |
| `data` | JSONB | Stores key-value parameters of the tool settings. |

---

## 4. Current Milestone & Next Steps

### What is Currently Working (Milestones Completed)
- [x] **Monolithic Refactoring (Phases 1-3):** Successfully extracted `utils.js`, `theme.js`, `auth.js`, `premium.js`, `audioCalcs.js`, and `adManager.js` out of `main.js`, severely shrinking and decluttering the core bundle.
- [x] **Refactoring Phase 4 (Components):** Successfully isolated all WebAudio Canvas controllers (RTA, Tuner, Game, Signal Generator, Calculators, Blog Engine) into dedicated files inside `/assets/js/components/`.
- [x] **Phase 5 (Routing & Bug Fixes):** Fixed massive scoping bugs in `main.js`, corrected deep linking routing from landing page to console components, resolved syntax errors across newly extracted files, and restored full DOMContentLoaded execution stability.
- [x] **Lightweight Static Build pipeline:** `build-app.js` minifies and packs assets into `/www` dynamically.
- [x] **Vercel Web Deployments:** Configured `vercel.json` with `"outputDirectory": "www"`.
- [x] **Capacitor Mobile Setup:** Both Android Studio (`/android`) and iOS Xcode (`/ios`) shells are initialized and functional.
- [x] **Native AdMob Fail-Safe:** Screen-blur lockouts bypass correctly if AdMob fails initialization.
- [x] **Payment Webhooks:** Secure transactional checkout via `secure-payment` edge functions.
- [x] **Safari WebKit Audio Output Fallback:** Implemented robust graceful degradation for Safari/WebKit where `setSinkId` is unsupported.
- [x] **Apple Compliance (Account Deletion):** Integrated a secure, in-app "Delete Account" flow.
- [x] **Google OAuth Redirect:** Deep-link capturing for `soundengg://login-callback` hydrates `supabaseClient` safely.
- [x] **Automated Android Bundle Compilation:** Compiled a signed production **Version Code 4** App Bundle (`app-release.aab`).

### Upcoming Plan & Next Operational Steps
1. **Popup & Inline AdMob Integration:**
   * Finalize CSS/HTML layout wrappers in popups (Google AdSense units for browser, `@capacitor-community/admob` banner overlays for native apps).
2. **Google Play Console & App Store Releases:**
   * Deploy the signed `.aab` Android Bundle.
   * Open `/ios` in Xcode, assign Developer Account Team, and archive iOS build.
4. **Supabase Production Security Hardening:**
   * Connect an external SMTP transactional mail server to lift rate-limiting on verification emails.

---

## 5. Developer Persona & AI Directives

### Developer Background & Experience
* The project developer is a senior professional concert live sound engineer, RF specialist, and acoustics designer with decades of experience in PA system optimization, console routing, and audio math.

### Communication & Tone Rules
1. **Skip Introductory Explanations:** Do **not** explain simple acoustic or physics definitions.
2. **Technical Depth Over Simplicity:** Focus entirely on robust code construction, mathematical accuracy, high-frequency timer efficiencies, and stable mobile-webview interactions.

### Code & Styling Standards
* **Vanilla First:** Prioritize raw Vanilla JavaScript, semantic HTML5, and native CSS custom properties. Keep dependencies to absolute zero unless instructed.
* **Protect the VFD Design Language:** Under no circumstances should the retro-futuristic Industrial VFD (Vacuum Fluorescent Display) interface styling be modified. The grid lines, scanlines, glowing text shadows, and glass panels are frozen and must remain pristine.
* **Auto-Sync Requirement:** Whenever JavaScript or HTML assets are modified, compile and synchronize files across the Capacitor native wrapper shells instantly by executing: `npm run build && npx cap sync`.
* **Git Commit Strategy:** Stage and commit modifications locally. Never attempt to push branches to origin directly inside shell tools—let the user review, verify, and push manually.
