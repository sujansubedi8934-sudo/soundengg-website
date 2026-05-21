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
* **Asset Pipeline & Compilation:** A custom Node.js utility ([build-app.js](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/build-app.js)) that cleans, minifies, and copies production-ready assets into a separate `/www` output directory, filtering out Node packages, development files, and project configurations.

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
* **Web Payment gateway:** **Razorpay Web Subscriptions** (Monthly/Yearly/Lifetime) integrated via two secure, custom-written Deno Edge Functions in Supabase:
  * `razorpay-checkout`: Generates payment orders (Paise for INR, Cents for USD) and validates HMAC payment signatures.
  * `razorpay-webhook`: Securely updates a user's database record to `is_pro: true` on verified billing gateway alerts.
* **Web Ads Network:** **Google AdSense** served via a custom 15-second "view ad to unlock 6 hours of tools" model.
* **Mobile Ads Network:** Native **Google AdMob** integrated via `@capacitor-community/admob`.
  * *Bypass Fail-Safe:* If the native AdMob plugin fails or is missing (e.g., in simulator shells or App Store/Google Play testing reviews), the app instantly bypasses the lock and grants dashboard access, preventing any startup screen freeze or blur.

---

## 3. Database Schema & Data Models

### 3.1. `profiles` Table
Stores registered accounts, active subscriptions, and user metadata.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (Primary Key) | References `auth.users.id` in Supabase Auth. |
| `email` | TEXT | User's primary registered email address. |
| `full_name` | TEXT | User's full name. |
| `company` | TEXT | Optional audio production company. |
| `is_pro` | BOOLEAN | True if premium features are unlocked (Default: `false`). |
| `subscription_tier` | TEXT | Active tier: `'free'`, `'monthly'`, `'yearly'`, `'lifetime'`. |
| `subscription_provider` | TEXT | Billing channel: `'razorpay'`, `'app_store'`, `'play_store'`. |
| `subscription_id` | TEXT | Razorpay/App Store/Play Store payment transaction token. |
| `subscription_expires_at`| TIMESTAMP | Exact expiration timestamp of active premium access. |
| `device_ids` | JSONB | Array of active authorized client hardware identifiers. |
| `created_at` | TIMESTAMP | Record insertion time. |
| `updated_at` | TIMESTAMP | Last profile update time. |

#### JSON Schema Structure (Profiles)
```json
{
  "id": "7f68c34f-012b-4cd3-89ef-90123abc4567",
  "email": "engineer@soundcompany.com",
  "full_name": "Sujan Subedi",
  "company": "Antigravity Sound Labs",
  "is_pro": true,
  "subscription_tier": "yearly",
  "subscription_provider": "razorpay",
  "subscription_id": "sub_K1aB2c3D4e5F6g",
  "subscription_expires_at": "2027-05-20T19:26:00Z",
  "device_ids": ["dev_iph15pro_x1y2z3"],
  "created_at": "2026-05-20T13:42:00Z",
  "updated_at": "2026-05-20T19:26:00Z"
}
```

---

### 3.2. `user_configs` Table
Stores debounced, cross-device settings parameters for all calculation and analyzer tools.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `user_id` | UUID (Composite PK) | References `profiles.id`. |
| `config_type` | TEXT (Composite PK) | Name of active tool (e.g., `'delay'`, `'subcalc'`, `'rta'`, `'tuner'`). |
| `data` | JSONB | Stores key-value parameters of the tool settings. |
| `updated_at` | TIMESTAMP | Time of the last successful client-to-server sync. |

#### Sync Logic Snippet
```javascript
// State changes trigger this debounced syncing controller (1.5 seconds timer)
async function syncToolState(userId, configType, stateData) {
  await supabaseClient
    .from('user_configs')
    .upsert({ 
      user_id: userId, 
      config_type: configType, 
      data: stateData, 
      updated_at: new Date().toISOString() 
    });
}
```

---

## 4. Current Milestone & Next Steps

### What is Currently Working
- [x] **Lightweight Static Build pipeline:** `build-app.js` minifies and packs assets into `/www` dynamically.
- [x] **Vercel Web Deployments:** Configured `vercel.json` with `"outputDirectory": "www"` so the build output deploys seamlessly.
- [x] **Capacitor Mobile Setup:** Both Android Studio (`/android`) and iOS Xcode (`/ios`) shells are initialized and functional.
- [x] **Native AdMob Fail-Safe:** Screen-blur lockouts in simulators or during App Store reviews are bypassed, automatically granting console access if the native AdMob plugin is not initialized.
- [x] **Git Workspace Sanitation:** All Android Studio `.idea` folders and system clutter are cleanly ignored in `.gitignore`.
- [x] **Payment Webhooks:** Secure transactional checkout and webhook listener functions are written and deployed.
- [x] **Safari WebKit Audio Output Fallback:** Implemented robust graceful degradation for Safari/WebKit where `setSinkId` is unsupported. Dynamically locks and disables the Audio Output dropdown, changes the mouse cursor style, and displays a premium, custom warning box instructing users to route their output via macOS/iOS System Settings.
- [x] **Apple Compliance (Account Deletion):** Integrated a secure, in-app "Delete Account" flow in `app.html` / `main.js` that calls the Supabase Edge Function to purge all user preset data and login maps.
- [x] **Supabase Production Hardening (RLS):** Fully configured and deployed strict Row Level Security (RLS) policies on `profiles` and `user_configs` tables, protecting all user profiles and preferences.

### Next Steps & Operational Playbook
1. **Razorpay Live Gateway Swap:**
   * Transition Razorpay keys from Test Mode to Live Mode.
   * Inject Live Key Secret configurations into Supabase Edge Secrets:
     ```bash
     supabase secrets set RAZORPAY_KEY_ID="rzp_live_..." RAZORPAY_KEY_SECRET="..." RAZORPAY_WEBHOOK_SECRET="..."
     ```
2. **AdMob Production ID Mapping:**
   * Replace AdMob test block IDs inside [main.js](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/main.js) with production Interstitial and Rewarded Video Ad IDs.
3. **Google Play Console Release Checklist:**
   * Prepare standard store promotional graphics, logo assets, and legal descriptions.
   * Compile and sign a production Android App Bundle:
     ```bash
     npm run build
     npx cap sync android
     ```
   * Open `/android` in Android Studio and run **Build > Generate Signed Bundle / APK**.
4. **Apple App Store Connect Xcode Release Checklist:**
   * Open `/ios` in Apple Xcode.
   * Assign a verified Developer Account Team.
   * Set native app icons, build numbers, and archive target packages for App Store Connect distribution.
   * [x] *Required Compliance:* Add a secure "Delete Account" option within the user drawer menu linked to the backend `supabase.auth.admin.deleteUser()` to comply with Apple's strict User Data Deletion regulations.
5. **Supabase Production Security Hardening:**
   * [x] Configure and activate Row Level Security (RLS) policies on both `profiles` and `user_configs` tables.
   * Connect an external SMTP transactional mail server (e.g., Resend, Mailgun) inside Supabase Auth Settings to lift the default rate-limiting constraints on verification emails.

---

## 5. Developer Persona & AI Directives

### Developer Background & Experience
* The project developer is a senior professional concert live sound engineer, RF specialist, and acoustics designer with decades of experience in PA system optimization, console routing, and audio math.

### Communication & Tone Rules
1. **Skip Introductory Explanations:** Do **not** explain simple acoustic or physics definitions (e.g., what an XLR pinout path is, how the inverse square law functions, or standard 1/3-octave frequency bands).
2. **Technical Depth Over Simplicity:** Focus entirely on robust code construction, mathematical accuracy, high-frequency timer efficiencies in JavaScript canvas rendering, and stable mobile-webview interactions.

### Code & Styling Standards
* **Vanilla First:** Prioritize raw Vanilla JavaScript, semantic HTML5, and native CSS custom properties. Keep dependencies to absolute zero unless specifically instructed.
* **Protect the VFD Design Language:** Under no circumstances should the retro-futuristic Industrial VFD (Vacuum Fluorescent Display) interface styling be modified. The grid lines, scanlines, glowing text shadows (amber and cyan), glass drawer panels, and neon-themed color schemes are frozen and must remain pristine.
* **Auto-Sync Requirement:** Whenever JavaScript or HTML assets are modified, compile and synchronize files across the Capacitor native wrapper shells instantly by executing:
  ```bash
  npm run build && npx cap sync
  ```
* **Git Commit Strategy:** Stage and commit modifications locally. Never attempt to push branches to origin directly inside shell tools—let the user review, verify, and click **Push** via their local GitHub Desktop client.
