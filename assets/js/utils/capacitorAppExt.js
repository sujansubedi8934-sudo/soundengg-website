// Native Android Exit Logic
function attachCapacitorBackButton() {
    if (window.Capacitor && window.Capacitor.isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
            const path = window.location.pathname;
            
            // If on landing page, EXIT the app
            if (path.endsWith('index.html') || path === '/' || path === '') {
                window.Capacitor.Plugins.App.exitApp();
                return;
            }
            
            // If on console page
            if (path.endsWith('app.html')) {
                const zoomOverlay = document.getElementById('zoom-overlay');
                if (zoomOverlay && zoomOverlay.style.display !== 'none' && !zoomOverlay.classList.contains('hidden')) {
                    zoomOverlay.classList.add('hidden');
                    zoomOverlay.style.display = 'none';
                    return;
                }
                
                if (window.location.hash) {
                    window.history.back();
                } else {
                    window.location.href = 'index.html';
                }
                return;
            }
            
            if (!canGoBack) {
                window.Capacitor.Plugins.App.exitApp();
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
