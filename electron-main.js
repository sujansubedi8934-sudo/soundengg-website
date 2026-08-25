const { app, BrowserWindow, shell, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Performance & Hardware Acceleration Optimization
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-features', 'ScreenCaptureKitPickerScreen,ScreenCaptureKitStreamPickerSonoma,VideoCapture');

app.setName('SoundEngg: RTA & Audio Utility');

// Enforce single instance lock to prevent duplicate background instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 960,
        minHeight: 640,
        backgroundColor: '#090a0f',
        title: 'SoundEngg: RTA & Audio Utility - Live Sound Calculators & RTA',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        show: false, // Prevents white flash during startup
        webPreferences: {
            preload: path.join(__dirname, 'electron-preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            backgroundThrottling: false
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Auto-approve audio device permissions (Web Audio API / RTA mic access only)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media' || permission === 'microphone') {
            callback(true); // Allow microphone for RTA analysis
        } else {
            callback(false); // Deny unnecessary background sensors/cameras
        }
    });

    // Intercept all external & blog links to open in the system default web browser (Safari/Chrome/Edge)
    // This prevents overlapping floating windows and routes readers to soundengg.com where live ads generate revenue!
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
        } else if (url.includes('/blog/') || url.includes('blog/')) {
            const blogSlug = url.split(/blog\//).pop().replace('.html', '');
            shell.openExternal(`https://www.soundengg.com/blog/${blogSlug}`);
        } else if (url.startsWith('file://')) {
            // If opening a local html file in new window, convert to web url or open in browser
            const filename = path.basename(url);
            if (filename.includes('.html') && filename !== 'app.html') {
                shell.openExternal(`https://www.soundengg.com/${filename}`);
            }
        }
        return { action: 'deny' }; // Always deny creating overlapping mini-windows inside Electron!
    });

    // Load compiled www/app.html or root app.html
    const wwwAppPath = path.join(__dirname, 'www', 'app.html');
    if (fs.existsSync(wwwAppPath)) {
        mainWindow.loadFile(wwwAppPath);
    } else {
        mainWindow.loadFile(path.join(__dirname, 'app.html'));
    }

    // Set custom application menu with F11 Fullscreen support for FOH engineers
    const template = [
        {
            label: 'SoundEngg',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen', accelerator: 'F11' }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'RTA Spectrogram Analyzer',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('rta')")
                },
                {
                    label: 'Subwoofer Array Calculator',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('subcalc')")
                },
                {
                    label: 'Speaker Delay Calculator',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('delay')")
                },
                {
                    label: 'Signal Generator',
                    accelerator: 'CmdOrCtrl+4',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('siggen')")
                },
                {
                    label: 'Ear Training Room',
                    accelerator: 'CmdOrCtrl+5',
                    click: () => mainWindow.webContents.executeJavaScript("window.showView && window.showView('eartraining')")
                },
                { type: 'separator' },
                { role: 'toggleDevTools', accelerator: 'F12' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'SoundEngg Official Website',
                    click: () => shell.openExternal('https://www.soundengg.com')
                },
                {
                    label: 'Technical Blog & Audio Library',
                    click: () => shell.openExternal('https://www.soundengg.com/blog.html')
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
