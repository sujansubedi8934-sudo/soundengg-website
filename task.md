# Task Checklist - Ear Training Redesign & Mobile Margin Correction

- `[x]` Correct top margin gap on mobile viewports
    - `[x]` Add `margin-top: 0 !important;` to `.main-content` in mobile viewport style query inside `responsive.css`
    - `[x]` Add `margin-top: 0 !important;` to `.native-mobile-platform .main-content` inside `responsive.css`
- `[x]` Redesign Ear Training View (`app.html`, `responsive.css`)
    - `[x]` Restructure the HTML markup of `#ear-training-view` inside `app.html` to group settings, A/B console, stats, and frequency options in structured widgets
    - `[x]` Add CSS rules inside `responsive.css` for `.ear-training-grid`, `.ear-train-widget`, `.ear-train-instruction`, `.play-btn-outer-ring`, `.train-play-button`, `.ab-channel-btn`, and settings buttons
    - `[x]` Style the stats panels inside `.ear-train-stats-grid` and option band chips inside `.train-options-grid-flat`
- `[x]` Verification & Testing
    - `[x]` Run production build `npm run build`
    - `[x]` Synchronize web assets `npx cap sync`
    - `[x]` Verify functionality and responsive layout that the large space between the top bar and "ENGINEERING TOOLS" is resolved on mobile
    - `[x]` Verify that the Ear Training view layout is updated, clean, and interactive
    - `[x]` Verify that correctness/error state highlight colors and light/dark theme contrast are correct
