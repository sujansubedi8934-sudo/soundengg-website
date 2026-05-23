// --- Capacitor Native detection early helper ---
window.isNativeMobile = function() {
    return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

// --- SAFE STORAGE PROXY (Safari Protection) ---
const safeStorage = window.safeStorage || {
    getItem: function(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            if (!window.localStorageFallback) window.localStorageFallback = {};
            return window.localStorageFallback[key] || null;
        }
    },
    setItem: function(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            if (!window.localStorageFallback) window.localStorageFallback = {};
            window.localStorageFallback[key] = String(value);
        }
    },
    removeItem: function(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (e) {
            if (!window.localStorageFallback) window.localStorageFallback = {};
            delete window.localStorageFallback[key];
        }
    },
    clear: function() {
        try {
            window.localStorage.clear();
        } catch (e) {
            window.localStorageFallback = {};
        }
    }
};

window.safeStorage = safeStorage;

// --- MODAL UTILITIES (Senior Stability - Global Scope) ---
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.classList.add('modal-open');
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    // Force wipe all inline styles used for the "frozen" fix
    modal.style.display = '';
    modal.style.visibility = '';
    modal.style.opacity = '';
    document.body.classList.remove('modal-open');
}

function getDeviceMetadata() {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os = 'macOS';
    else if (ua.indexOf('X11') !== -1) os = 'Linux';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';
    else if (ua.indexOf('Android') !== -1) os = 'Android';

    let browser = 'Unknown Browser';
    if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (ua.indexOf('SamsungBrowser') !== -1) browser = 'Samsung Browser';
    else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) browser = 'Opera';
    else if (ua.indexOf('Trident') !== -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') !== -1 || ua.indexOf('Edg') !== -1) browser = 'Edge';
    else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') !== -1) browser = 'Safari';

    return { os, browser };
}

function parseDeviceString(deviceStr) {
    if (!deviceStr) return null;
    const parts = deviceStr.split('|');
    const id = parts[0];
    const os = parts[1] || 'Legacy OS';
    const browser = parts[2] || 'Legacy Browser';
    const lastActive = parts[3] ? parseInt(parts[3], 10) : Date.now();
    return { id, os, browser, lastActive, raw: deviceStr };
}

// Make them available globally explicitly (in case they are needed across different script files)
window.openModal = openModal;
window.closeModal = closeModal;
window.getDeviceMetadata = getDeviceMetadata;
window.parseDeviceString = parseDeviceString;
