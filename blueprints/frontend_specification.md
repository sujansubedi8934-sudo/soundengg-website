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
