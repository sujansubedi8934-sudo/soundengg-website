# Walkthrough - Mobile Layout Restructure & Usability Enhancements

We have successfully restructured the mobile layout to improve navigation, visibility, and features, and redesigned the Tap Tempo Delay view to match the premium aesthetics of the app.

---

## Technical Implementations

### 1. Clean Mobile Safe Header (`app.html`, `responsive.css`)
* **Logo Placement**: Integrated the **SoundEngg Brand Logo** (light/dark theme variants) on the top-left of the safe header `#mobile-safe-header` for the main views (Home, Blog, Menu).
* **Tool Sub-views**: Hides the brand logo and reveals the back chevron arrow on the left when navigated inside any sub-tool, displaying the active tool's name centered in the header.
* **Subscription Badge**: Added a tiny, elegant subscription pill badge (`#mobile-sub-badge`) on the top-right corner, displaying `FREE`, `PRO`, or `LIFETIME` based on active subscription status.
* **Header Clean Up**: Removed all settings/profile buttons from the mobile header to reduce clutter.

### 2. Direct 8-Tool Grid Homepage (`app.html`, `main.js`)
* **Full Tool Grid**: Expanded the Quick Tools grid on the home page dashboard to layout all 8 engineering tools directly in the exact requested order:
  1. RTA Spectrogram
  2. Ear Training
  3. Signal Generator
  4. Time Delay Calculation
  5. Tuner
  6. Sub Array Calc
  7. Pinout Reference
  8. Tap Delay
* **Obsolete UI Removal**: Completely removed the stats row (`15+ Tools`, `25+ Articles`, `100% Offline`), the recently used tools feed, the bulky top `mobile-pro-banner` banner, and deleted the slide-up tools drawer `#mobile-tools-drawer` modal markup.
* **Event Listeners**: Added click event listeners for all 8 homepage tool cards inside `main.js` to route cleanly to their respective views.

### 3. Restructured Bottom Navigation Tab Bar (`app.html`, `main.js`)
* Restructured the bottom tab bar into a clean 5-tab layout on mobile:
  * **Tab 1: Home** (`#btn-tab-home`, Icon: `home`, routes to `dashboard-view`).
  * **Tab 2: Blog** (`#btn-tab-blog`, Icon: `menu_book`, routes to `blog-view`).
  * **Tab 3 (Center): RTA** (`#btn-tab-console`, Icon: `analytics`, routes directly to the flagship `rta-view`).
  * **Tab 4: Settings** (`#btn-tab-settings`, Icon: `settings`, routes directly to the existing `#settings-panel` drawer).
  * **Tab 5: Menu / LOGIN/SIGNUP** (`#btn-tab-menu`, Class: `.auth-toggle-btn`, routes to the new inline `#menu-view`).

### 4. Dynamic Menu View & Auth Integration (`auth.js`, `main.js`, `premium.js`)
* **Inline Preferences Container**: Created `#menu-view` to act as the Tab 5 Preferences pane.
* **Dynamic Tab Naming**: Inside `handleAuthStateChange` in `auth.js`:
  * If logged out: Tab 5 label/icon becomes `LOGIN/SIGNUP` (icon: `login`) and redirects to login/signup forms directly within `#menu-view`.
  * If logged in: Tab 5 label/icon becomes `MENU` (icon: `menu`) and displays the User Profile card, a segmented Light/Dark theme toggle, and the Author Profile card.
* **State Updates**:
  * Toggles the display of `#menu-profile-logged-in` (`flex`/`none`), `#menu-profile-logged-out` (`block`/`none`), and `#menu-security-card` (`block`/`none`) dynamically based on user state.
  * Hydrates `#menu-profile-email` with `user.email`.
  * Sets `window.userSubscriptionTier` globally (`free`, `pro`, `lifetime`) to support premium status updates.
* **Premium Status Badge & Portals**: Inside `updatePremiumUI()` in `premium.js`:
  * Sets the text content of `#mobile-sub-badge` (`FREE`, `PRO`, or `LIFETIME`) and updates its style class (`pro` or `free`).
  * Syncs the profile tier text of `#menu-profile-tier` (`FREE TIER`, `PRO PASS`, or `LIFETIME PASS`).
  * Toggles display of `#menu-btn-upgrade` and `#menu-btn-billing-portal`.
  * Handles lifetime subscriptions by showing a disabled "LIFETIME IS PERMANENT" button.
* **Action Delegation**: Bound a click listener for `#menu-btn-billing-portal` in `main.js` that delegates directly to the primary `#btn-sub-manage` modal triggers.

### 5. Tap Tempo Delay Redesign & Layout Bug Fixes (`app.html`, `responsive.css`, `tapTempo.js`)
* **BPM Wrapping Fix**: Separated the large numeric BPM value (styled at `3.75rem` using `--font-headline` Space Grotesk) and the `BPM` unit label (`1.1rem` Space Grotesk) into distinct, bottom-aligned flex elements. This keeps the layout single-line, preventing wrapping and maintaining centered alignment on small mobile device screen widths.
* **JS Code Alignment**: Modified `tapTempo.js` to assign only the computed numeric value (`bpm`) to the display element's text content, removing the hardcoded duplicate `" BPM"` string and preventing double units.
* **Premium Theme Cards**: Overrode the boxy white widgets inside `#tap-delay-view` with `.tap-delay-widget` and `.tap-subdivision-card` classes:
  * In dark mode: Deep gray backgrounds with high-contrast borders (`var(--outline)`) and drop shadows.
  * In light mode: Clean white/light gray backgrounds matching home page card panels.
* **Interactive Concentric Trigger Button**: Enclosed the trigger button inside a double dashed concentric ring (`.tap-tempo-button-container`) that functions as a touch-active sonar visualizer. The button itself uses a premium gradient from `--primary` to `#008B9F` with white, high-shadow content.
* **Subdivision Panel Accents**: Added left-aligned 4px accent borders (`border-left: 4px solid var(--primary);`) and a neon bottom pulse indicator (`box-shadow: 0 -1px 8px var(--primary);`) to the subdivision cards, matching the high-end industrial engineering style of the app.

### 6. Mobile Footer Link Hiding (`responsive.css`)
* Appended responsive media queries in `responsive.css` to hide the marketing/legal footer links globally on mobile viewports (`max-width: 768px`).

---

## Verification Results

### Build & Sync
1. Compiled production assets:
   ```bash
   npm run build
   ```
   * **Status:** Passed. Output compiles successfully to `/www`.
2. Synced Capacitor mobile platforms:
   ```bash
   npx cap sync
   ```
   * **Status:** Passed. Web assets copied and updated.

### Manual Behavior Check
* **Desktop View:** Unaffected.
* **Mobile View:**
  * **Footer Links**: Hidden on mobile viewport width.
  * **Home Page**: Renders the complete 8-tool grid in the correct order. The banner, stats bar, and recent list are gone.
  * **Header**: Brand logo is displayed on the left of the safe header for main views and slides out for the back button in sub-views. The subscription badge displays `FREE`, `PRO`, or `LIFETIME` on the right.
  * **Settings Tab**: Correctly opens the system settings panel when tapped.
  * **Menu/Auth Tab**: Toggles labels and icons dynamically (e.g. `LOGIN/SIGNUP` with login icon vs `MENU` with menu icon). Shows profile cards, theme switcher, and author navigation links correctly.
  * **Tap Tempo Delay View**: Redesigned widget layout is highly engaging, concentric tap tempo button pulses cleanly, subdivision list has left accent strips with neon visualizer lines, and the BPM number and units are separated on a single line, preventing wrapping.

---

## Redesign & Margin Correction Additions (June 17, 2026)

We have successfully resolved the mobile vertical gap issue and completed the redesign of the Ear Training sub-tool.

### 1. Mobile Spacing Fix (`responsive.css`)
* Overrode the global desktop `.main-content` `margin-top: 5.5rem` offset in the mobile media queries and native-mobile platform rules.
* Restored standard `margin-top: 0 !important;` for viewports under 768px, ensuring that the page content fits immediately below the safe header.

### 2. Ear Training View Redesign (`app.html`, `responsive.css`)
* **Widget Card Layout**: Restructured `#ear-training-view` inside `app.html` using a responsive grid `.ear-training-grid` (split into two columns on desktop, collapsed to a vertical stack on mobile).
* **Concentric Play Button & Console Widget**: Configured the listening panel in `.ab-console-widget` with a dotted concentric ring around the play button, which glows and pulses with smooth animations during playback.
* **Rounded A/B and Setting Toggles**: Styled all buttons and selection fields to follow the same dark/light styling rules and cyan accent colors as other premium panels.
* **Monospaced Stats Grid**: Re-aligned the dynamic session, question counter, and percentage score blocks in a 3-column rounded panel.
* **Frequency Band Chip Options**: Rewrote selection chips inside the `.train-options-grid-flat` to scale dynamically, providing high contrast and glowing feedback states (green glow for `.correct` choices, red glow for `.error` choices).

### 3. Verification & Platform Sync
* Successfully executed assets compilation with `npm run build`.
* Synchronized mobile platform folders via `npx cap sync`.

---

## Redesigns & VFD Layout Adjustments (June 17, 2026 - Continuation)

### 1. Signal Generator Sweep Button Fix (`app.html`)
* **Sweep Duration Layout**: Detached the numeric duration input (`#siggen-sweep-time`) from the text label. Wrapped the input in a compact 48px VFD badge and positioned the text label outside of it.
* **Compact Text Label**: Squeezed and stacked the label text (`SEC<br>DURATION`) with a `0.58rem` font size next to the input.
* **Flexible Button Scaling**: Switched the sweep button (`#btn-siggen-sweep`)'s CSS flex property to `flex: 1` (removing `flex-shrink: 0`). This allows the button to expand to fill all remaining horizontal row space and prevent it from overflowing/clipping off the viewport.

### 2. Time Delay Calculator Redesign (`app.html`, `delayCalc.js`)
* **Premium Card Wrapper**: Swapped out the old boxy card layout for the modern, rounded `.siggen-widget` layout, which supports seamless dark/light theme switching out-of-the-box.
* **VFD Numeric Inputs**: Wrapped both Distance and Temperature numeric inputs in custom glowing VFD wrappers (`.vfd-input-wrap` and `.vfd-input`). Styled the temperature unit select dropdown (`#delay-temp-unit-mod`) to match the hardware-inspired dark look.
* **Black Glass Output Display**: Designed a custom hardware display screen (`#020204` background) with a glowing cyan border, subtle inset shadow, and large text-shadowed numbers for the `DELAY_OFFSET` readout.
* **Gradient Progress Indicator**: Replaced the basic progress track with a modern inset-shadowed container, neon gradient bar (`linear-gradient(90deg, var(--primary) 0%, #00ffcc 100%)`), and a dynamic progress percentage text label (`#delay-progress-percent`).
* **Collapsible Sound Physics Card**: Structured the Engineering Insight block into a collapsible widget (`#delay-theory-card`). Toggling the header rotates the chevron and expands/collapses the content.

---

## Contextual Control Bar Redesign (June 17, 2026 - Continuation)

### 1. Mobile Safe Header Navigation Compatibility (`responsive.css`)
* Overrode the `.back-link` (circular back button `<-`) styling on viewports under 768px in the mobile media queries block with `display: none !important;`.
* This completely hides the duplicate back arrows on mobile (where navigation back is already handled by the top safe PWA header) while keeping them fully functional and visible as `BACK TO DASHBOARD` on desktop.

### 2. Header Cleanup & Option A Control Bars (`app.html`)
* Rewrote the header sections for all 10 sub-views to replace the giant page titles and redundant titles with a compact, flexbox control row.
* **Compact Row Layout**:
  * **Left Side**: Displays the desktop back link, the glowing `HELP` guide button next to a help question mark icon, a vertical separator `|`, and a tiny monospaced metadata subtitle.
  * **Right Side**: Aligns contextual command buttons (like `INITIALIZE_CORE`, `ACTIVATE_MIC`, `USE IMPERIAL`) right-justified.
* **Applied Views**:
  1. **Time Delay Calculation** (`#module-view`)
  2. **Pinout Connection** (`#pinout-view`)
  3. **System Settings** (`#settings-view`)
  4. **Signal Generator** (`#siggen-view`)
  5. **RTA Spectrogram** (`#rta-view`)
  6. **Ear Training** (`#ear-training-view`)
  7. **Precision Tuner** (`#tuner-view`)
  8. **Subwoofer Array Calc** (`#sub-calc-view`)
  9. **Tap Tempo Delay** (`#tap-delay-view`)
  10. **System Preferences / Menu** (`#menu-view`)

### 3. Shortened Descriptions for Responsive Control Bars
* Shortened the metadata description subtitles for the target sub-views inside [app.html](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/app.html) to keep them clean, aligned, and fit next to their action buttons on narrow mobile screens:
  * **RTA Spectrogram**: Changed from `Real-time Acoustic Analysis // 31-Band ISO RTA` to `31-Band ISO RTA`.
  * **Time Delay Calculator**: Changed from `Precision Phase Alignment Node // CALIBRATION_ACTIVE` to `Phase Alignment Node`.
  * **Precision Tuner**: Changed from `Chromatic Instrument Tuning & Pitch Analysis` to `Chromatic Tuning Node`.
  * **Subwoofer Array Calc**: Changed from `Wavelength Analysis & Array Alignment` to `Sub Array Alignment`.

### 4. RTA Spectrogram Tab Redesign
* **Rack-Mount Widget Card Layout**: Grouped the layout into beautiful `.siggen-widget` modular cards with dark/light themes.
* **Double VFD Telemetry Dashboard**: Replaced the text footer with a gorgeous high-contrast black dashboard screen featuring glowing text readouts for Peak Level (`#rta-peak-val`) and Dominant Frequency (`#rta-dom-val`).
* **Segmented Controls**: Converted the text buttons for Mode Selection (Curve / RTA / Waterfall) and Frequency Weighting (A-WT / C-WT) into inline segmented toggles using the new `.segmented-control` class.
* **Visualizer Glass Screen**: Housed the canvas wrapper in a rounded card with a deep black-screen (`#020204`) background and neon glow elements.
* **Canvas Overlay Scaling**: Scaled down the dominant frequency canvas text overlay from `72px` to `54px` (a 75% scaling) and repositioned its center to `75px` to keep it clean and prevent clipping on small screen heights.

### 5. Precision Tuner Tab Redesign
* **Hardware VFD Display Console**: Restructured the note readout screen into a beautiful, dedicated black-glass display card (`#020204` background) with a neon border matching the flagship hardware console look.
* **Segmented Mode Selector**: Replaced the Visual Mode text buttons with modern, inline segmented switches (`CLASSIC` / `STROBE` / `DIGITAL BAR`) using `.segmented-control`.
* **VFD Input Wrappers**: Styled the A4 Reference Frequency input in a monospaced cyan glowing input frame.
* **In-Tune Glowing State**: Added a dynamic neon green text glow (`text-shadow`) to the cents display when the note is in-tune, improving instant visual feedback.


## Subwoofer Array Calculator Redesign (June 18, 2026)

We have successfully redesigned the **Subwoofer Array Calculator** view (`#sub-calc-view` in `app.html`) to align with the premium rack-mount hardware aesthetic and resolve key layout wrapping/vertical stretching issues on mobile viewports.

### 1. Wavelength Grid (3x2 Desktop & 2x3 Mobile)
* **Fractional Wavelengths**: Restructured the wavelength container to display 6 cards with IDs: `wave-1-8`, `wave-1-6` (New), `wave-1-4`, `wave-1-3` (New), `wave-1-2`, and `wave-1`.
* **Grid Formatting**: 
  - On desktop, the grid renders in a balanced **3x2 layout**.
  - On mobile viewports under 768px, it collapses into a **2x3 grid** with a vertical block format, conserving space and eliminating text wrapping.
  - The full wavelength (`wave-1`) card is highlighted with a green border and text glow.

### 2. Expandable Frequency Preset Drawer
* **Accordion Toggle**: Moved the preset frequency buttons (40Hz, 63Hz, 80Hz, 100Hz, 125Hz, 250Hz) into a collapsible settings console drawer (`#subcalc-presets-dropdown`).
* **Micro-Animations**: Included a chevron toggle button (`#btn-toggle-subcalc-presets`) that rotates 180 degrees smoothly when expanded, revealing the presets in a rounded drawer.

### 3. Unified Clutter-Free Array Configurations Card
* **Segmented Controls**: Merged the Cardioids, End-Fire, and Broadside panels into a single, clean **Array Configurations** card.
* **Master Segmented Switch**: Introduced a fluid master segmented control (`CARDIOID` / `END-FIRE` / `BROADSIDE`) using the `.segmented-control` class.
* **Cardioid Sub-tabs**: Embedded a secondary segmented control for Cardioid types (`2-Box Gradient`, `3-Box CSA`, `4-Box L-Acoustics`).
* **SVG Visualizer Integration**: Toggling master/sub tabs displays only the active configuration's description, calculated spacing/delay statistics, and corresponding animated SVG layout (Gradient, CSA, L-Acoustics, End-Fire, or Broadside), saving significant screen real estate.

### 4. Collapsible Physics Insights Card
* **Collapsible Drawer**: Wrapped the lengthy engineering insights description in a collapsible accordion drawer (`#subcalc-theory-card`), allowing the user to hide it and minimize vertical scroll.

### 5. Verification & Sync
* **Build Check**: Ran `npm run build` to compile production assets into `/www`.
* **Platform Sync**: Executed `npx cap sync` to synchronize Capacitor platform public folders for iOS and Android.

---

## Pinout Reference Premium Upgrades (June 18, 2026 - Continuation)

We have successfully redesigned the **Pinout Reference** view (`#pinout-view` in `app.html`) to look cleaner, more professional, and highly interactive:

### 1. Bidirectional Pin Highlighting (Hover Pin <-> Table Row)
* **Automatic Coordinate Mapping**: Created a smart SVG element mapper that calculates the physical distance between pin text labels (e.g. `1`, `2`, `T`, `R`, `S`) and their surrounding vector shapes (circles, rects).
* **Hover Highlights**: 
  - Hovering a row in the pin list table automatically highlights and adds a neon cyan glow to the corresponding pin shape in the SVG drawing.
  - Hovering a pin directly inside the SVG highlights and accents the matching row in the table.
* **Animations**: Applied smooth CSS filters (`drop-shadow` glows) and transition properties to SVG paths/shapes for interactive responsiveness.

### 2. Sleek Category Filter Pill Bar
* **Pill Tab Restructuring**: Converted the category select buttons into a horizontally scrollable glassmorphic pill bar (`.pinout-cats`), removing vertical wrapping and making it look extremely attractive on mobile screens.
* **Glow Active State**: Styled the active category pill to have a bright cyan glow with a drop-shadow.

### 3. VFD Search Input Bar
* **Rack-Mount Search**: Swapped the standard search input box for a VFD-style hardware screen (`#020204` background) with a cyan inner inset shadow and a monospaced glowing cursor, aligning it with other dashboard tools.

### 4. Fused Assembly & Soldering Datasheets
* **Solder Specs Panel**: Injected an assembly card inside each connector's accordion containing recommended soldering iron temperature (345°C - 370°C), rosin-core solder type, wire stripping measurements (15mm jacket, 3mm conductor), and wire gauge guidelines.
* **Signal Routing Maps**: For adapter cables, replaced generic text with a clean, grid-based wire routing datasheet explaining how signal poles are bridged (e.g., tying XLR Pin 3 to Pin 1 for unbalanced lines to avoid hum).

---

## Precision Tuner Upgrades & Smoothing (June 18, 2026 - Continuation)

We have successfully resolved the tuner jitter issues, smoothed the response, and built the Tuning Stability History timeline chart:

### 1. Autocorrelation Pitch Smoothing (Median Filter)
* **Outlier Filtering**: Implemented a **5-tap sliding median filter** on the raw pitch estimates returned by the autocorrelation algorithm in [tunerEngine.js](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/assets/js/components/tunerEngine.js).
* **Noise Immunity**: Single-frame room noise transients and octave jumps (common in analog mic inputs) are completely filtered out, stabilizing the needle, note name, and cents offset displays.
* **Exponential Damping**: Applied a tuned `0.85 / 0.15` exponential moving average onto the median filtered pitch for a rock-solid, fluid response.

### 2. Tuning Stability History Canvas Chart
* **Cent-Drift Timeline Graph**: Designed a scrolling canvas graph (`#tuner-stability-canvas`) inside a new settings widget card displaying the last 150 pitch cents offsets.
* **Dynamic Grid Layout**: Draws grid reference lines at ±50, ±25, and 0 cents, with a glowing green horizontal line for perfect in-tune target bounds.
* **Drop-out Detection**: Plots signal dropouts as clean gaps in the scrolling line, instead of falling back to zero or drawing continuous lines during silent intervals.
* **Telemetry Counters**: Calculates and updates real-time Average Cents Offset (`AVG: X.X¢`) and Maximum Cents Deviation (`MAX: X¢`) stats.

### 3. Fluid Strobe Visualizer Mode
* **Pill Conveyer Belt**: Refactored the strobe mode from boxy square grids to a premium conveyor of rounded pill blocks styled with cyan/green linear gradients, glow filters, and borders.
* **Rotational Speed Damping**: Taught the strobe velocity to damp exponentially when approaching perfect pitch. When the note gets within ±3 cents (in-tune), the conveyer crawls at sub-pixel velocities to indicate a near lock-lock, mirroring premium physical rack strobe hardware.


## Ear Training EQ Matching Mode & Pro Ad Flash Fix (June 18, 2026 - Continuation)

We have successfully implemented a gamified EQ Matching Quiz mode inside the Ear Training tool and resolved the start-up ad popup flash/race-condition for Pro users:

### 1. Ear Training EQ Matching Quiz Mode (`app.html`, `responsive.css`, `earTraining.js`)
* **Training Mode Selector**: Integrated a new segmented control row inside the expandable Configuration card to switch between **SPECTRAL ID** (classic mode: find the boosted band) and **EQ MATCHING** (new gamified mode).
* **Boost vs. Cut Challenge**: When playing in EQ Matching mode, B (Processed) randomly chooses to either boost OR cut the target frequency band by the configured magnitude (e.g. ±3dB, ±6dB, ±12dB).
* **Dual Guess Input**:
  - Added a **Guess Action Direction** selector container (`#ear-train-direction-container`) that slides down when EQ Matching is active.
  - Designed two high-end console-style guess buttons: **BOOST (+)** (lights up green/cyan) and **CUT (-)** (lights up orange/red).
* **Validation Highlights**:
  - Tapping a frequency band submits the combination of selected Direction + Band.
  - Correct answers light up the selected frequency and guess direction green.
  - Incorrect answers highlight errors in red and reveal the correct answers in green.
* **ReferenceError Resolution**: Corrected multiple start-up typos where undefined `startAudio()` was called, changing them to point to `startChallenge()` for robust playback.

### 2. Pro Startup Ad Flash Fix (`premium.js`)
* **Reactive Cached Properties**: Refactored `window.isUserPro` and `window.userSubscriptionTier` from static variables into reactive cached properties using `Object.defineProperty` on the global `window` object.
* **Bypassing Timing Latencies**: Writes to these variables automatically populate safe local storage keys (`soundengg_cached_is_pro` and `soundengg_cached_sub_tier`). Subsequent app loads read directly from this cache.
* **Eliminating Race Conditions**: On application launch, `adManager.js` immediately detects the user's Pro status from the local cache rather than waiting for Supabase session network checks, keeping the `#ad-lock-modal` overlay hidden and completely resolving the flash/flicker. If the network later reports the session has expired or the user logged out, the cache is updated and the app locks dynamically.
 
 
+## Marketing Landing Page Redesign (June 18, 2026 - Continuation)
+
+We have successfully completed a premium redesign of the marketing landing page (`index.html`) to align it with the cybernetic, hardware-inspired console aesthetic of the app without impacting functionality or introducing mini calculators:
+
+### 1. Two-Column Responsive Hero Grid (`index.html`, `pages.css`)
+* **Responsive Desktop Layout**: Overrode the old centering flexbox style to enable the CSS grid layout, producing a modern 2-column format on desktop.
+* **Simulated VFD Oscilloscope visualizer**: Designed a beautiful VFD glass panel container (`.vfd-glass-panel`) on the right side of the hero section.
+* **Lightweight Canvas Waves**: Implemented an optimized, 60fps canvas-drawn audio oscilloscope (`#hero-oscilloscope-canvas`) that renders animated dual-phase sine and sub-harmonic waveforms with custom glow filters and an analog scope grid, reacting dynamically to hover transformations.
+* **Blinking LED status**: Added a simulated blinking green status LED indicator (`.status-dot.green`).
+
+### 2. Glassmorphic Color-Coded Feature Cards (`pages.css`)
+* **Visual Styling**: Updated `.feature-card` to use a glassmorphic background layer (`rgba(13, 22, 35, 0.4)`) with high-blur backdrop filters, custom rounded corners, and a border style matching physical rack equipment.
+* **Interactive Hover Glows**: Configured distinct, color-coded glows on hover for each of the 6 key engineering features:
+  * **RTA Analyser**: Glowing cyan border/shadow.
+  * **Ear Training**: Glowing magenta/pink border/shadow.
+  * **Subwoofer Arrays**: Glowing green border/shadow.
## Marketing Landing Page Redesign (June 18, 2026 - Continuation)

We have successfully completed a premium redesign of the marketing landing page (`index.html`) to align it with the cybernetic, hardware-inspired console aesthetic of the app without impacting functionality or introducing mini calculators:

### 1. Two-Column Responsive Hero Grid (`index.html`, `pages.css`)
* **Responsive Desktop Layout**: Overrode the old centering flexbox style to enable the CSS grid layout, producing a modern 2-column format on desktop.
* **Simulated VFD Oscilloscope visualizer**: Designed a beautiful VFD glass panel container (`.vfd-glass-panel`) on the right side of the hero section.
* **Lightweight Canvas Waves**: Implemented an optimized, 60fps canvas-drawn audio oscilloscope (`#hero-oscilloscope-canvas`) that renders animated dual-phase sine and sub-harmonic waveforms with custom glow filters and an analog scope grid, reacting dynamically to hover transformations.
* **Blinking LED status**: Added a simulated blinking green status LED indicator (`.status-dot.green`).

### 2. Glassmorphic Color-Coded Feature Cards (`pages.css`)
* **Visual Styling**: Updated `.feature-card` to use a glassmorphic background layer (`rgba(13, 22, 35, 0.4)`) with high-blur backdrop filters, custom rounded corners, and a border style matching physical rack equipment.
* **Interactive Hover Glows**: Configured distinct, color-coded glows on hover for each of the 6 key engineering features:
  * **RTA Analyser**: Glowing cyan border/shadow.
  * **Ear Training**: Glowing magenta/pink border/shadow.
  * **Subwoofer Arrays**: Glowing green border/shadow.
  * **Delay & Time Alignment**: Glowing deep teal border/shadow.
  * **Instrument Tuner**: Glowing bright neon green border/shadow.
  * **Signal Generator**: Glowing orange/red border/shadow.

### 3. Production Compilation & Capacitor Synchronization
* Successfully ran `npm run build` to copy the updated assets to the `/www` app bundle.
* Synchronized web assets to Capacitor platforms (iOS/Android) via `npx cap sync`.

---

## Android Native Back Button Navigation Fix (June 20, 2026)

We have successfully resolved the native hardware back button loop, incorrect home screen exit behavior, and the AdMob banner overlapping issue:

### 1. Intercepting Native Back Button (`capacitorAppExt.js`)
* **Dashboard View Verification**: Updated the Capacitor `backButton` event listener for the console view (`app.html`) to dynamically query the DOM for `#dashboard-view` and check its current display state.
* **Clean App Termination**: If the Dashboard (Home screen) is active, the app directly calls `AppPlugin.exitApp()`. This terminates the native process cleanly, preventing the back button from loading `index.html`, reloading the webview, or looping through previously opened views.
* **Internal SPA Navigation**: If any other sub-tool is active, it calls the SPA's internal `window.goBack()` function.

### 2. Synchronization of Navigation Stack (`main.js`)
* **Resetting Stack on Home**: Ensured that whenever the user navigates back to a main view (like the Dashboard/Home screen via the bottom navigation tabs), the custom navigation stack `window.appNavigationHistory` is completely cleared.
* **Graceful Exit Path**: When the stack is cleared on Home, the hardware back button will see that the Home screen is visible and exit the app. If a user is in another main view (like Blog/Settings/Menu) and presses back, the empty stack will take them back to the Home screen, where the next press exits.

### 3. Resolving AdMob Banner Overlaps
* **Preventing Page Reloads**: Since the back button no longer triggers redirects to `index.html` followed by page refreshes, the JavaScript context is never lost. The `.has-native-banner` class remains on the `body` element while the banner is visible, keeping bottom tab positions shifted up by `50px` and preventing any overlaps.

### 4. Build & Platform Synchronization
* Built production resources via `npm run build` and synced to Android/iOS platforms via `npx cap sync`.
* Incremented `versionCode` to `18` and `versionName` to `1.1.3` in both [app-version.json](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/app-version.json) and [build.gradle](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/android/app/build.gradle) to prepare for the new AAB release.
* Built the signed release Android App Bundle (AAB) successfully using the embedded Android Studio Java Runtime environment: `android/app/build/outputs/bundle/release/app-release.aab`.
* Copied the signed bundle to the root directory as [app-release.aab](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/app-release.aab) and committed it to Git.
