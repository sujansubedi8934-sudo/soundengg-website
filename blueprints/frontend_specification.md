# Frontend Specification Document (FSD) - SoundEngg

## 1. Visual Aesthetics & Theme Design
SoundEngg uses a rich, premium dark mode aesthetic tailored specifically for audio engineers and gig crews working in dim backstage conditions or dark concert venues.

*   **Design Paradigm:** Glassmorphism / Neon Cyberpunk grid.
*   **Aesthetic Goal:** WOW the user immediately with vibrant neon highlights, dark translucent cards, and smooth, responsive interactive states.

---

## 2. Color System Tokens
All layout elements pull styles directly from the design tokens defined in [variables.css](file:///Users/sujansubedi/Documents/GitHub/soundengg-website/assets/css/variables.css):

| CSS Variable | Hex Value | Application |
| :--- | :--- | :--- |
| `--background` | `#050508` | Primary background color (deep, rich black) |
| `--surface` | `#0c0d12` | Main card and dashboard surface background |
| `--surface-highest` | `#16171f` | Hover states, modals, and highlighted item backgrounds |
| `--primary` | `#00ffcc` | Primary accent (neon teal). Used for success badges and RTA canvases |
| `--neon-blue` | `#00f0ff` | Secondary accent (neon blue). Used for active checkouts and buttons |
| `--outline` | `#1f212a` | Borders and divider lines |
| `--text` | `#ffffff` | Primary text color |
| `--text-muted` | `#82858f` | Secondary/description text |
| `--danger` | `#ff3b30` | Error messages, cancel buttons, and input validation failures |

---

## 3. Typography Rules
To maintain the professional "measurement tool" look, we use two Google Fonts imported at startup:

*   **Headline Font (Outfit):** Used for navigation headers, main dashboard titles, and product banners. Gives a clean, modern, premium feel.
*   **Measurement Font (JetBrains Mono / Space Mono):** Used for calculator input boxes, output result text, and code readouts. The monospaced alignment matches real measurement hardware screens (like RTA meters or decibel gauges).

---

## 4. Key Component Specifications

### 1. Translucent Content Cards (`.calculator-card`)
*   **Styles:** Translucent background (`rgba(12, 13, 18, 0.7)`), 1px border (`var(--outline)`), and a subtle backdrop-filter blur (`10px`).
*   **Transitions:** Smooth transform scale on hover (`scale(1.02)`) with a light green/teal box-shadow glow.

### 2. Main Navigation Bar (`.top-bar`)
*   **Layout:** Fixed top bar with a flexible grid.
*   **Elements:** Logo on the left, active navigation tabs in the center, and a dynamic **Tier Badge** (`FREE TIER` in grey, or `PRO PASS` / `LIFETIME PASS` in glowing neon green) on the right.

### 3. Audio RTA Spectrogram Canvas (`#rta-canvas`)
*   **Colors:** Rendered dynamically via JavaScript using canvas gradients:
    *   Low frequencies (Bass): Dark blue-to-teal.
    *   Mid frequencies (Vocal): Neon green.
    *   High frequencies (Treble): Yellow-to-red (feedback warnings).
*   **Grid:** 2D logarithmic frequency grid (20Hz to 20kHz) mapped horizontally with decibel (dB) markers mapped vertically.

---

## 5. Micro-Animations & Responsive Design

### Hover Actions
*   Interactive elements (buttons, inputs, sliders) must use `transition: all 0.2s ease-in-out` for hover states.
*   Active state transitions: Buttons slightly scale down on tap/click to mimic physical tactile feedback.

### Responsive Breakpoints
*   **Mobile (< 768px):** Layout collapses to a single-column scrolling panel. Left sidebar hides into a mobile hamburger slide-out drawer.
*   **Tablet (768px - 1024px):** Dual-column grid for calculators.
*   **Desktop (> 1024px):** Three-column grid with a fixed left navigation sidebar.

---

## 6. Spacing & Layout Specifications

SoundEngg uses a structured CSS Grid and Flexbox alignment system to prevent layouts from feeling cramped:

*   **Paddings & Margins (Standard Rem Units):**
    *   `0.25rem` (4px): Micro-spacing (badge paddings, list item gaps).
    *   `0.5rem` (8px): Element spacing (between input fields and labels).
    *   `1rem` (16px): Content card padding (standard padding inside calculator cards).
    *   `1.5rem` (24px): Container margins (spacing between different calculator blocks).
    *   `2rem` (32px): Layout padding (outer margins of the dashboard).
*   **Grid Gaps:** 
    *   Main tool panels use `display: grid; grid-gap: 1.5rem;` to maintain uniform horizontal and vertical spacing.
*   **Border Radius:** 
    *   Standard elements use a border-radius of `6px` or `8px` to maintain a consistent semi-rounded shape, keeping a sleek hardware dashboard aesthetic.

---

## 7. API & Integrations Specifications

The app integrates with two primary external systems. All endpoint communications are wrapper-secured:

### 1. Supabase Authentication API
Handles user sessions, account registry, and secure JWT storage.
*   **API Endpoint:** `https://ewudkzyjcvjxxqpqnqiy.supabase.co/auth/v1`
*   **Authentication Call (Sign-in):**
    *   *Path:* `/token?grant_type=password`
    *   *Data Sent:* `{"email": "user@email.com", "password": "securepassword"}`
    *   *Expected Response:* JSON block containing access token JWT, user metadata details, and user UUID (`id`).
*   **Database Sync Call (Fetch Profile):**
    *   *Path:* `/rest/v1/subscriptions?select=*` (using Auth Authorization Bearer Header)
    *   *Expected Response:* JSON subscription status parameters (e.g. `{"is_pro": true, "subscription_tier": "monthly"}`).

### 2. RevenueCat Purchases SDK API
Tracks store transactions and updates native entitlements.
*   **SDK Method Call (Configure):**
    *   *Method:* `Purchases.configure({ apiKey: "test_jJwYMCBMjObenYRxyfglVMzOakP" })`
*   **SDK Method Call (Identify User):**
    *   *Method:* `Purchases.logIn({ appUserID: "supabase-user-uuid" })`
    *   *Outcome:* Syncs purchases to the user's Supabase account.
*   **SDK Method Call (Purchase Package):**
    *   *Method:* `Purchases.purchasePackage({ aPackage: selectedPkg })`
    *   *Expected Response:* Returns updated `customerInfo` containing active entitlement tags.

---

## 🤖 Prompt to Generate This Document
```text
"Act as a senior UI/UX designer and frontend architect. Create a Frontend Specification Document for my app. It should define a complete design system including color palette with hex codes, typography choices, component styles for buttons, inputs, cards and modals, spacing and layout rules. It should also include a full API and integration spec for every third party service my app will use — what each service does, which endpoints are called, what data is sent and what response is expected. My app idea is: SoundEngg, a fast, offline-first mobile toolkit for professional audio technicians."
```


