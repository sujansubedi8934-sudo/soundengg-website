document.addEventListener('DOMContentLoaded', () => {
    // Hardware Back Button Handler for Capacitor
    if (window.Capacitor && window.Capacitor.isNative && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', (data) => {
            const path = window.location.pathname;
            
            if (path.endsWith('app.html')) {
                // 1. Check if any overlays are open
                const zoomOverlay = document.getElementById('zoom-overlay');
                if (zoomOverlay && zoomOverlay.style.display !== 'none' && !zoomOverlay.classList.contains('hidden')) {
                    zoomOverlay.classList.add('hidden');
                    zoomOverlay.style.display = 'none';
                    return;
                }
                
                const authModal = document.getElementById('auth-modal');
                if (authModal && authModal.style.display === 'flex') {
                    authModal.style.display = 'none';
                    return;
                }

                // 2. Check which view is currently active
                const dashboardView = document.getElementById('dashboard-view');
                if (dashboardView && dashboardView.style.display === 'block') {
                    // We are at the root of the console. Go back to landing page.
                    window.location.href = 'index.html';
                } else {
                    // We are inside a module, go back to dashboard
                    if (typeof window.showView === 'function') {
                        // Find the dashboard nav button to highlight it correctly
                        const btnNavDashboard = document.getElementById('btn-nav-dashboard');
                        window.showView(dashboardView, btnNavDashboard);
                    } else {
                        window.location.href = 'index.html';
                    }
                }
            } else {
                // We are probably on index.html or pro.html, exit the app
                window.Capacitor.Plugins.App.exitApp();
            }
        });
    }
});
