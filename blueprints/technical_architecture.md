# Technical Architecture Document (TAD) - SoundEngg

## 1. Technology Stack Overview
SoundEngg is built as a hybrid mobile application leveraging a unified web codebase deployed inside native mobile wrappers.

*   **Frontend Core:** Vanilla HTML5, CSS3 (Modern custom design system variables), and ES6 Javascript. No heavy JS frameworks (React/Vue/Angular) are used to guarantee minimal startup latency and optimal battery efficiency on-site.
*   **Mobile Wrapper:** **Capacitor** (by Ionic) compiles the web directory `/www` into native iOS (Xcode/Swift) and Android (Android Studio/Kotlin) application shell containers.
*   **Backend & Database:** **Supabase** (Postgres database, GoTrue Authentication engine, and Row Level Security policies).
*   **In-App Payments:** **RevenueCat Purchases SDK** (Capacitor plugin `@revenuecat/purchases-capacitor`) wrapping native iOS StoreKit 2 and Android Google Play Billing APIs.
*   **Service Worker:** Custom Progressive Web App (PWA) cache manager handling offline caching of core styles, tools, and DSP mathematical engines.

---

## 2. System Diagram & Data Flow
```mermaid
graph TD
    subgraph Client (Capacitor Native Shell)
        A[HTML/CSS/JS Assets] <--> B[Capacitor Native Bridge]
        A <--> C[Service Worker Cache]
    end

    subgraph External Platforms
        B <--> D[RevenueCat Purchases SDK]
        D <--> E[Apple App Store API]
        D <--> F[Google Play Store API]
        A <--> G[Supabase Auth & DB]
    end

    subgraph Backend Webhooks
        D -- Secure Webhook --> G
    end
```

---

## 3. Directory Structure & Core Modules
The repository is structured logically to separate global styles, static assets, modular JavaScript engines, and native configuration parameters:

```
├── app.html                  # Main application interactive panel containing tool containers
├── pro.html                  # Pricing comparative landing page
├── index.html                # Public marketing homepage
├── service-worker.js         # Offline caching script
├── build-app.js              # Custom node build execution pipeline
├── package.json              # NPM dependencies
└── assets/
    ├── css/
    │   ├── variables.css     # Global color palette, layout, and theme tokens
    │   ├── styles.css        # Layouts, utility classes, and base components
    │   └── pages.css         # Page-specific styling definitions
    └── js/
        ├── main.js           # Central app controller, event binders, and DOM bootstrap
        ├── modules/
        │   ├── auth.js       # Supabase Authentication handler
        │   ├── billing.js    # RevenueCat native purchase integration wrapper
        │   ├── premium.js    # Global premium layout controller & ad visibility toggles
        │   ├── theme.js      # Dark/Light mode controller
        │   └── utils.js      # Global utility functions (SafeStorage, country detection)
        ├── utils/
        │   ├── audioCalcs.js # Core DSP and acoustic alignment mathematical formulas
        │   └── adManager.js  # AdSense & native banner ad management handlers
        └── components/
            ├── rtaEngine.js        # Low-latency Web Audio API FFT analyzer
            ├── signalGenerator.js  # Audio generator (Sine, Pink/White Noise sweeps)
            ├── subCalc.js          # Subwoofer array placement calculator
            ├── delayCalc.js        # Microsecond alignment calculation tool
            └── earTraining.js      # Sine/noise frequency training utility
```

---

## 4. Key Integration Architectural Specs

### Offline Cache Policy (PWA Service Worker)
*   **Strategy:** Cache-First with Network Fallback.
*   The application caches all `.html`, `.css`, and `.js` modules on the user's initial load. 
*   Updates are managed via version cache names (e.g. `soundengg-cache-v12.0`). When a user connects online, the service worker checks for changes in `manifest.json` and updates cache blocks in the background.

### Supabase Auth & Session Management
*   The client initializes `supabase.createClient` globally.
*   To prevent startup UI flashes or private browsing access blockages, the app uses a custom fallback memory layer called `window.safeStorage` to store session details.
*   `window.safeStorage` automatically uses local storage when available, and falls back to a memory-based dictionary when cookies or local storage are blocked (e.g., Safari Private Browsing).

### Web-Native Payment Bridge (RevenueCat Routing)
*   The checkout buttons dynamically detect the execution platform:
    *   **Native App:** Calls `window.billingManager.purchasePackage(plan)`, triggering native store sheets.
    *   **Web Browser:** Redirects to Lemon Squeezy (International) or Razorpay (India) secure checkouts.
*   Once a purchase is successful, RevenueCat triggers a secure background webhook directly to the Supabase Database to update the user's subscription tier in Postgres, ensuring instant cross-platform synchronizations.

---

## 5. Environment & Configuration Settings

To maintain security and ensure the app behaves predictably across staging and production environments, the project relies on specific configurations:

### Client-Side Public Parameters
The client files use standard variables loaded at app initialization. Since these are client-facing, they must only contain **Public** credentials:

*   **`SUPABASE_URL`** (Configured in `app.html` / `index.html`): The API endpoint for your Supabase project (e.g. `https://ewudkzyjcvjxxqpqnqiy.supabase.co`).
*   **`SUPABASE_ANON_KEY`**: The anonymous public key that allows basic client-side access through Supabase's RLS policies.
*   **`REVENUECAT_IOS_API_KEY`** (Configured in `billing.js`): The Public API key generated in the RevenueCat dashboard for Apple store integrations (`test_jJwYMCBMjObenYRxyfglVMzOakP`).
*   **`REVENUECAT_ANDROID_API_KEY`** (Configured in `billing.js`): The Public API key generated in the RevenueCat dashboard for Google Play integrations.

### ⚠️ Critical Security Rules:
*   **No Secret Keys in Client Bundle:** Under no circumstances should the **Supabase `service_role` key** or the **RevenueCat Secret API Key** be embedded in the HTML/JS frontend source files. If exposed, these keys bypass Row Level Security (RLS) policies and allow database modifications.
*   **Vercel / Hosting Environment Keys:** If the app utilizes edge functions or server-side redirects (e.g. for API routes), these private variables must be stored in the **Vercel Settings > Environment Variables** dashboard rather than being committed to the Git repository.

---

## 🤖 Prompt to Generate This Document
```text
"Act as a senior software architect who has built and scaled multiple SaaS products. Based on my app idea, create a complete Technical Architecture Document. It should include the recommended tech stack with reasoning for each choice, the complete file and folder structure of the project, the full database schema with all tables, fields, and relationships explained in plain English, and any environment variables or configuration notes I need to be aware of before I start building. My app idea is: SoundEngg, a fast, offline-first mobile toolkit for professional audio technicians."
```


