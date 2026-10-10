// Native Android Exit & Layered Back Unwinding Logic
function closeTopmostOverlayOrDrawer() {
    // 1. Check RTA Fullscreen Settings Drawer
    const rtaDrawer = document.getElementById('rta-fs-drawer');
    const rtaDrawerBackdrop = document.getElementById('rta-fs-drawer-backdrop');
    if (rtaDrawer && rtaDrawer.classList.contains('open')) {
        const closeBtn = document.getElementById('btn-rta-fs-drawer-close');
        if (closeBtn) {
            closeBtn.click();
        } else {
            rtaDrawer.classList.remove('open');
            if (rtaDrawerBackdrop) rtaDrawerBackdrop.classList.remove('open');
        }
        return true;
    }

    // 2. Check Native HTML <dialog> elements (e.g. app-rating-dialog)
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog && typeof openDialog.close === 'function') {
        openDialog.close();
        return true;
    }

    // 3. Check active modal overlays in reverse priority order
    const modalSelectors = [
        '#billing-cancel-confirm-modal',
        '#account-delete-confirm-modal',
        '#venue-env-modal',
        '#pro-upgrade-modal',
        '#auth-modal-overlay',
        '#profile-modal',
        '#mic-cal-modal',
        '#image-zoom-overlay',
        '#zoom-overlay'
    ];
    for (const sel of modalSelectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const computed = window.getComputedStyle(el);
        const isVisible = (el.classList.contains('active') || el.style.display === 'flex' || el.style.display === 'block') &&
            computed.display !== 'none' &&
            computed.visibility !== 'hidden' &&
            computed.opacity !== '0' &&
            !el.classList.contains('hidden');
        if (isVisible) {
            el.classList.remove('active');
            el.classList.add('hidden');
            el.style.display = 'none';
            return true;
        }
    }

    // 4. Check mobile slide-out navigation menu
    const topNav = document.querySelector('.top-nav.open');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    if (topNav) {
        topNav.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        return true;
    }

    return false;
}

function attachCapacitorBackButton() {
    const AppPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) || (window.capacitorApp && window.capacitorApp.App);
    
    if (AppPlugin) {
        AppPlugin.addListener('backButton', ({ canGoBack }) => {
            const path = window.location.pathname;
            
            // 1. Always close any open modal, dialog, or drawer first
            if (closeTopmostOverlayOrDrawer()) {
                return;
            }

            // 2. If reading a blog article, return to the Blog list
            if (typeof window.closeBlogArticleIfOpen === 'function' && window.closeBlogArticleIfOpen()) {
                return;
            }

            // 3. If on console page (or root native container hosting dashboard-view)
            const dashboardView = document.getElementById('dashboard-view');
            if (path.endsWith('app.html') || dashboardView) {
                const isDashboardVisible = dashboardView && (dashboardView.style.display === 'block' || window.getComputedStyle(dashboardView).display === 'block');
                
                if (isDashboardVisible) {
                    AppPlugin.exitApp();
                } else if (typeof window.goBack === 'function') {
                    window.goBack();
                } else if (window.location.hash) {
                    window.history.back();
                } else {
                    AppPlugin.exitApp();
                }
                return;
            }
            
            // If on standalone landing page, exit the app
            if (path.endsWith('index.html') || path === '/' || path === '') {
                AppPlugin.exitApp();
                return;
            }
            
            if (!canGoBack) {
                AppPlugin.exitApp();
            } else {
                window.history.back();
            }
        });
    } else if (window.Capacitor && window.Capacitor.isNative) {
        // Wait and retry if it's native but App plugin hasn't loaded
        setTimeout(attachCapacitorBackButton, 200);
    }
}
document.addEventListener('DOMContentLoaded', attachCapacitorBackButton);

