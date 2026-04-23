document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    applyAutoTheme();
    setupRoleModal();
    initGlobalUnits();
    setupNavigation();
    initDelayCalc();
    initProfessionalRTA(); 
    initSPLSegments();
    initPinout();
    initGlobalSearch();
    initBlog();
    initSignalGenerator();
    
    // Start mock data loops
    setInterval(updateSPL, 250);
    setInterval(updateCPU, 2000);
});

function setupThemeToggle() {
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');
    const htmlEl = document.documentElement;

    btnLight.addEventListener('click', () => {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
    });

    btnDark.addEventListener('click', () => {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
    });
}

function applyAutoTheme() {
    const hour = new Date().getHours();
    const isDayTime = hour >= 6 && hour < 18; // Day: 6 AM to 6 PM
    
    const htmlEl = document.documentElement;
    const btnLight = document.getElementById('btn-light');
    const btnDark = document.getElementById('btn-dark');

    if (isDayTime) {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
        btnLight.classList.add('active');
        btnDark.classList.remove('active');
    } else {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        btnDark.classList.add('active');
        btnLight.classList.remove('active');
    }
}

function setupRoleModal() {
    const overlay = document.getElementById('role-modal-overlay');
    const roleButtons = document.querySelectorAll('.role-btn');
    const savedRole = localStorage.getItem('soundengg-role');

    // If a role is already saved, hide the modal immediately
    if (savedRole && savedRole !== 'null') {
        overlay.classList.add('hidden');
    } else {
        overlay.classList.remove('hidden');
    }

    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.getAttribute('data-role');
            localStorage.setItem('soundengg-role', role);
            overlay.classList.add('hidden');
            console.log(`Role selected: ${role}`);
            // Future: Trigger dashboard filter based on role
        });
    });
}

let globalUnitSystem = 'metric'; // 'metric' or 'imperial'

function initGlobalUnits() {
    const btnMetric = document.getElementById('unit-metric');
    const btnImperial = document.getElementById('unit-imperial');
    if (!btnMetric || !btnImperial) return;

    function setSystem(system) {
        globalUnitSystem = system;
        localStorage.setItem('soundengg-units', system);
        
        if (system === 'metric') {
            btnMetric.classList.add('active');
            btnImperial.classList.remove('active');
        } else {
            btnImperial.classList.add('active');
            btnMetric.classList.remove('active');
        }

        // Broadcast change
        document.dispatchEvent(new CustomEvent('unitsChanged'));
    }

    btnMetric.addEventListener('click', () => setSystem('metric'));
    btnImperial.addEventListener('click', () => setSystem('imperial'));

    // Init from storage
    const saved = localStorage.getItem('soundengg-units') || 'metric';
    setSystem(saved);
}

function setupNavigation() {
    const dashboardView = document.getElementById('dashboard-view');
    const rtaView = document.getElementById('rta-view');
    const authorView = document.getElementById('author-view');
    const moduleView = document.getElementById('module-view');
    const pinoutView = document.getElementById('pinout-view');
    const blogView = document.getElementById('blog-view');
    const siggenView = document.getElementById('siggen-view');
    
    // IDs for ALL primary views to manage visibility
    const ALL_VIEWS = [dashboardView, rtaView, authorView, moduleView, pinoutView, blogView, siggenView];

    const btnLaunchRta = document.getElementById('btn-launch-rta');
    const btnLaunchDelay = document.getElementById('btn-launch-delay');
    const btnLaunchPinout = document.getElementById('btn-launch-pinout');
    
    const btnNavAuthor = document.getElementById('btn-nav-author');
    const btnNavBlog = document.getElementById('btn-nav-blog');
    const btnNavDashboard = document.getElementById('btn-nav-dashboard');
    const backButtons = document.querySelectorAll('.btn-back-home, .btn-back');

    const updateActiveNav = (activeBtn) => {
        if (btnNavDashboard) btnNavDashboard.classList.toggle('active', activeBtn === btnNavDashboard);
        if (btnNavAuthor) btnNavAuthor.classList.toggle('active', activeBtn === btnNavAuthor);
        if (btnNavBlog) btnNavBlog.classList.toggle('active', activeBtn === btnNavBlog);
    };

    /**
     * Senior View Manager: Ensures ONLY one view is visible at any time.
     */
    function showView(targetView, navButton = null) {
        if (!targetView) return;
        
        // Hide ALL other views first
        ALL_VIEWS.forEach(v => {
            if (v) v.style.display = 'none';
        });

        // Show target
        targetView.style.display = 'block';
        
        // Handle Nav Highlights
        updateActiveNav(navButton);
        
        // Common Reset
        window.scrollTo(0, 0);

        // Specific View Re-initialization
        if (targetView === rtaView) {
            const canvas = document.getElementById('rta-canvas');
            if (canvas) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        }
    }

    // Dashboard Launcher Listeners
    if (btnLaunchRta) btnLaunchRta.addEventListener('click', () => showView(rtaView));
    if (btnLaunchDelay) btnLaunchDelay.addEventListener('click', () => showView(moduleView));
    if (btnLaunchPinout) btnLaunchPinout.addEventListener('click', () => showView(pinoutView));

    const btnLaunchSiggen = document.getElementById('btn-launch-siggen');
    if (btnLaunchSiggen) btnLaunchSiggen.addEventListener('click', () => showView(siggenView));

    // Top Navigation Listeners
    if (btnNavDashboard) {
        btnNavDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            showView(dashboardView, btnNavDashboard);
        });
    }

    if (btnNavAuthor) {
        btnNavAuthor.addEventListener('click', (e) => {
            e.preventDefault();
            showView(authorView, btnNavAuthor);
        });
    }

    if (btnNavBlog) {
        btnNavBlog.addEventListener('click', (e) => {
            e.preventDefault();
            showView(blogView, btnNavBlog);
            
            // Explicitly Reset Blog to Index state and clear filters
            const blogIndex = document.getElementById('blog-index');
            const blogReader = document.getElementById('blog-reader');
            if (blogIndex && blogReader) {
                blogIndex.style.display = 'grid';
                blogReader.style.display = 'none';
                
                // Clear any active category filtering (Senior Fix)
                const catBtns = document.querySelectorAll('.cat-btn');
                catBtns.forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
                if (allBtn) allBtn.classList.add('active');
                
                // Trigger re-render of all articles to clear the filter
                if (typeof window.renderBlogList === 'function') {
                    window.renderBlogList('all');
                }
            }
        });
    }

    // Common Back Navigation
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => showView(dashboardView, btnNavDashboard));
    });

    // Settings Toggle Logic (Non-exclusive view)
    const btnSettings = document.getElementById('btn-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (btnSettings && settingsPanel && btnCloseSettings) {
        btnSettings.addEventListener('click', () => {
            settingsPanel.classList.add('open');
        });
        btnCloseSettings.addEventListener('click', () => {
            settingsPanel.classList.remove('open');
        });
    }

    // Gallery Zoom Logic
    const galleryBoxes = document.querySelectorAll('.gallery-img-box');
    const zoomOverlay = document.getElementById('image-zoom-overlay');
    const zoomImageView = document.getElementById('zoom-image-view');
    const btnCloseZoom = document.getElementById('btn-close-zoom');

    if (zoomOverlay && zoomImageView && btnCloseZoom) {
        galleryBoxes.forEach(box => {
            box.addEventListener('click', () => {
                // Extract background-image url from inline style
                const bgImage = box.style.backgroundImage;
                if (bgImage) {
                    // Extract url string: url("...")
                    const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                    if (urlMatch && urlMatch[1]) {
                        zoomImageView.src = urlMatch[1];
                        zoomOverlay.classList.remove('hidden');
                        zoomOverlay.style.display = 'flex';
                    }
                }
            });
        });

        // Close logic
        const closeZoomModal = () => {
            zoomOverlay.classList.add('hidden');
            zoomOverlay.style.display = 'none';
            setTimeout(() => { zoomImageView.src = ''; }, 300); // clear src after hide
        };

        btnCloseZoom.addEventListener('click', closeZoomModal);
        zoomOverlay.addEventListener('click', (e) => {
            if(e.target === zoomOverlay) closeZoomModal();
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !zoomOverlay.classList.contains('hidden')) {
                closeZoomModal();
            }
        });
    }

}

function initDelayCalc() {
    const distInput = document.getElementById('delay-dist-mod');
    const distLabel = document.getElementById('label-dist-mod');
    const tempInput = document.getElementById('delay-temp-mod');
    const tempUnitSelect = document.getElementById('delay-temp-unit-mod');
    const outputEl = document.getElementById('delay-output-mod');
    const progressEl = document.getElementById('delay-progress-mod');

    if (!distInput || !tempInput || !outputEl || !progressEl) return;

    function update() {
        const dist = parseFloat(distInput.value) || 0;
        const temp = parseFloat(tempInput.value) || 0;
        const tUnit = tempUnitSelect.value;
        
        let delayMs = 0;

        if (globalUnitSystem === 'metric') {
            if (distLabel) distLabel.textContent = 'Distance (m)';
            // Formula (m/s): 331.3 + (0.606 * TempCelsius)
            const tempC = (tUnit === 'F') ? (temp - 32) * 5/9 : temp;
            const speed = 331.3 + (0.606 * tempC);
            delayMs = (dist / speed) * 1000;
        } else {
            if (distLabel) distLabel.textContent = 'Distance (ft)';
            // Formula (ft/s): 1052.3 + (1.106 * TempFahrenheit)
            const tempF = (tUnit === 'C') ? (temp * 9/5) + 32 : temp;
            const speed = 1052.3 + (1.106 * tempF);
            delayMs = (dist / speed) * 1000;
        }

        // Update VFD display
        outputEl.innerHTML = `${delayMs.toFixed(2)}<span class="delay-unit">ms</span>`;

        // Update progress bar (vis-ref capped at 50ms for detail)
        const progressPercent = Math.min(100, (delayMs / 50) * 100); 
        progressEl.style.width = `${progressPercent}%`;
    }

    distInput.addEventListener('input', update);
    tempInput.addEventListener('input', update);
    tempUnitSelect.addEventListener('change', update);
    document.addEventListener('unitsChanged', update);
    
    // Initial run
    update();
}

const RTA_BARS_COUNT = 24;
function initRTA() {
    const container = document.getElementById('rta-bars');
    for (let i = 0; i < RTA_BARS_COUNT; i++) {
        const bar = document.createElement('div');
        bar.className = 'rta-bar';
        // Base opacity mapped to standard
        bar.style.opacity = Math.random() * 0.5 + 0.3;
        bar.style.height = `${Math.random() * 100}%`;
        container.appendChild(bar);
    }
}

function updateRTA() {
    const bars = document.querySelectorAll('.rta-bar');
    bars.forEach(bar => {
        // Mock random frequency activity
        const val = Math.max(10, Math.min(100, parseFloat(bar.style.height) + (Math.random() * 30 - 15)));
        bar.style.height = `${val}%`;
        bar.style.opacity = val / 100 + 0.2;
    });
}

const SPL_SEGMENTS_COUNT = 12;
function initSPLSegments() {
    const container = document.getElementById('spl-segments');
    for (let i = 0; i < SPL_SEGMENTS_COUNT; i++) {
        const seg = document.createElement('div');
        seg.className = 'spl-seg';
        
        // Color bands: Deep Navy for first 4, Turquoise (Primary) for next 4, Bright Cyan for next 1, Gray for rest
        if (i < 4) seg.style.backgroundColor = 'rgba(0, 38, 77, 0.8)'; 
        else if (i < 8) seg.style.backgroundColor = 'rgba(20, 167, 181, 0.8)'; 
        else if (i < 9) seg.style.backgroundColor = 'rgba(0, 210, 255, 0.8)'; 
        else seg.style.backgroundColor = 'var(--surface-highest)';
        
        container.appendChild(seg);
    }
}

function updateSPL() {
    const splVal = Math.max(85, Math.min(102, 98.4 + (Math.random() * 4 - 2)));
    document.getElementById('spl-live').textContent = splVal.toFixed(1);
    
    // Update segments visually based on SPL
    const segments = document.querySelectorAll('.spl-seg');
    const activeIndex = Math.floor(((splVal - 80) / 25) * SPL_SEGMENTS_COUNT);
    
    segments.forEach((seg, i) => {
        if (i <= activeIndex) {
            seg.style.opacity = "1";
        } else {
            seg.style.opacity = "0.2";
        }
    });

    const splText = document.getElementById('spl-live');
    if (splVal > 100) {
        splText.style.color = '#f44336';
    } else {
        splText.style.color = 'var(--primary)';
    }
}

function updateCPU() {
    const cpuVal = Math.floor(Math.random() * 15) + 5;
    const cpuEl = document.getElementById('cpu-load');
    cpuEl.textContent = `${cpuVal}%`;
    if (cpuVal > 15) {
        cpuEl.style.color = 'var(--primary)';
    } else {
        cpuEl.style.color = 'var(--text-main)';
    }
}

// --- PINOUT COMPONENT LOGIC ---

const PINOUT_DATA = [
  {id:'xlr3',name:'XLR 3-pin',cat:'analog',tag:'Balanced mic/line',color:'#378ADD',desc:'The industry standard balanced audio connector. Used for microphones, line-level balanced signals, and DMX lighting (not recommended for DMX — use XLR 5-pin instead). Pin 2 is "hot" per IEC standard.',
   pins:[{n:'1',sig:'Ground / shield',color:'#888780',note:'Cable screen / chassis ground'},
         {n:'2',sig:'Hot (+)',color:'#E24B4A',note:'Positive / non-inverting signal'},
         {n:'3',sig:'Cold (−)',color:'#ffffff',note:'Negative / inverting signal',border:'#cccccc'}],
   uses:['Microphone','Line level','Balanced send','AES/EBU digital'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#444" stroke-width="1.5"/><circle cx="40" cy="25" r="8" fill="#888780" stroke="#666" stroke-width="1"/><text x="40" y="29" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">1</text><circle cx="22" cy="56" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="60" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">2</text><circle cx="58" cy="56" r="8" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="58" y="60" text-anchor="middle" fill="#333" font-size="10" font-weight="500">3</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {id:'xlr5',name:'XLR 5-pin',cat:'digital',tag:'DMX / AES stereo',color:'#7F77DD',desc:'5-pin XLR is the professional standard for DMX512 lighting control. Also used for stereo AES/EBU digital audio (two channels in one connector) and some stereo microphone/intercom systems.',
   pins:[{n:'1',sig:'Ground / shield',color:'#888780',note:'Common ground'},
         {n:'2',sig:'Data − (DMX) / AES Ch1 −',color:'#E24B4A',note:'DMX negative data line'},
         {n:'3',sig:'Data + (DMX) / AES Ch1 +',color:'#ffffff',note:'DMX positive data line',border:'#cccccc'},
         {n:'4',sig:'Data − Ch2 (AES)',color:'#1D9E75',note:'Second data channel −'},
         {n:'5',sig:'Data + Ch2 (AES)',color:'#378ADD',note:'Second data channel +'}],
   uses:['DMX512 lighting','AES/EBU stereo','Intercom','Stereo mic'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#534AB7" stroke-width="1.5"/><circle cx="40" cy="17" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="40" y="21" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">1</text><circle cx="20" cy="34" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="20" y="38" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">2</text><circle cx="60" cy="34" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="60" y="38" text-anchor="middle" fill="#333" font-size="9" font-weight="500">3</text><circle cx="26" cy="60" r="7" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="26" y="64" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">4</text><circle cx="54" cy="60" r="7" fill="#378ADD" stroke="#185FA5" stroke-width="1"/><text x="54" y="64" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">5</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {id:'ts',name:'TS — 6.35mm mono jack',cat:'analog',tag:'Unbalanced mono',color:'#EF9F27',desc:'Two-conductor connector: Tip = signal, Sleeve = ground. Used for unbalanced mono signals such as guitars, bass, and mono line connections. The sleeve also acts as the cable screen.',
   pins:[{n:'T',sig:'Tip — signal (+)',color:'#EF9F27',note:'Mono audio signal'},
         {n:'S',sig:'Sleeve — ground',color:'#888780',note:'Ground and cable screen'}],
   uses:['Guitar/bass instrument','Mono unbalanced line','Effects loops','Amp send'],
   warn:'Unbalanced — susceptible to noise over long cable runs. Max recommended run: ~6m.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="10" y="38" width="60" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="10" y="38" width="20" height="14" rx="7" fill="#EF9F27" stroke="#BA7517" stroke-width="1"/><text x="20" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">T</text><text x="55" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {id:'trs',name:'TRS — 6.35mm stereo/balanced',cat:'analog',tag:'Balanced / stereo',color:'#1D9E75',desc:'Three-conductor: Tip = left/hot, Ring = right/cold, Sleeve = ground. Used for balanced mono signals in professional gear, stereo headphones, and insert loops (send/return on one cable).',
   pins:[{n:'T',sig:'Tip — Left / Hot (+)',color:'#E24B4A',note:'Left channel or positive signal'},
         {n:'R',sig:'Ring — Right / Cold (−)',color:'#1D9E75',note:'Right channel or negative signal'},
         {n:'S',sig:'Sleeve — Ground',color:'#888780',note:'Ground and cable screen'}],
   uses:['Balanced insert','Stereo headphone','Balanced line','Y-cable source'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="38" width="64" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="8" y="38" width="18" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect x="29" y="38" width="16" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="17" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="37" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text x="58" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {id:'trs35',name:'3.5mm TRS (mini jack)',cat:'analog',tag:'Consumer stereo',color:'#D4537E',desc:'Miniature version of TRS used in consumer devices — phones, laptops, tablets. Same Tip/Ring/Sleeve layout. TRRS (4-conductor) variants add a microphone pin and are found on smartphones.',
   pins:[{n:'T',sig:'Tip — Left channel',color:'#E24B4A',note:'Left audio'},
         {n:'R',sig:'Ring — Right channel',color:'#1D9E75',note:'Right audio'},
         {n:'S',sig:'Sleeve — Ground',color:'#888780',note:'Common ground'},
         {n:'R2',sig:'(TRRS) Mic / ground',color:'#7F77DD',note:'4th conductor on phone headsets'}],
   uses:['Phone/tablet output','Laptop audio','Consumer playback','TRRS headsets'],
   note:'TRRS pinout varies: CTIA (Apple/Android) vs OMTP (older Nokia). Always verify before wiring.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="38" width="52" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="14" y="38" width="15" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect x="32" y="38" width="12" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="21" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="38" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text x="57" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">3.5mm</text></svg>`
  },
  {id:'rca',name:'RCA (phono) connector',cat:'analog',tag:'Consumer unbalanced',color:'#D85A30',desc:'Unbalanced single-channel connector standard in consumer hi-fi, DJ gear, and home audio. Center pin = signal, outer ring = ground. Always wired in stereo pairs — red (right) and white/black (left).',
   pins:[{n:'C',sig:'Centre pin — signal',color:'#E24B4A',note:'Audio signal'},
         {n:'O',sig:'Outer ring — ground',color:'#888780',note:'Ground / screen'}],
   uses:['DJ mixer phono/line','Consumer hi-fi','CD/media player','Turntable output'],
   warn:'Unbalanced — not suitable for long runs without a DI box. Max recommended: 3–5m.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="28" fill="#1a1a22" stroke="#888" stroke-width="8"/><circle cx="40" cy="45" r="10" fill="#E24B4A" stroke="#c0392b" stroke-width="1.5"/><text x="40" y="49" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">C</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl2',name:'Speakon NL2',cat:'speaker',tag:'2-pole speaker',color:'#639922',desc:'2-pole Neutrik Speakon. One speaker channel. The locking twist connector is the safe standard for amplifier-to-speaker runs. Used on smaller PA speakers and some monitors.',
   pins:[{n:'1+',sig:'Positive (+)',color:'#E24B4A',note:'Hot — from amp positive'},
         {n:'1−',sig:'Negative (−)',color:'#1a1a22',note:'Return — from amp negative',border:'#555'}],
   uses:['Passive speakers','Stage monitors','Small PA systems'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="28" y="35" width="12" height="18" rx="2" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="34" y="47" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1+</text><rect x="42" y="35" width="12" height="18" rx="2" fill="#333" stroke="#555" stroke-width="1"/><text x="48" y="47" text-anchor="middle" fill="#aaa" font-size="8" font-weight="500">1−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl4',name:'Speakon NL4',cat:'speaker',tag:'4-pole speaker',color:'#639922',desc:'4-pole Neutrik Speakon. Carries two speaker channels (bi-amp) or one channel on 1+/1− with 2+/2− unused. Standard in most professional loudspeaker systems. Never use with live mains voltage.',
   pins:[{n:'1+',sig:'Ch 1 positive',color:'#E24B4A',note:'Low frequency / full range +'},
         {n:'1−',sig:'Ch 1 negative',color:'#1a1a22',note:'Low frequency / full range −',border:'#555'},
         {n:'2+',sig:'Ch 2 positive',color:'#378ADD',note:'High frequency (bi-amp) +'},
         {n:'2−',sig:'Ch 2 negative',color:'#0C447C',note:'High frequency (bi-amp) −'}],
   uses:['Full-range passive speakers','Bi-amp systems','Sub + top runs'],
   note:'For single-amp use: wire 1+/1− only. Leave 2+/2− disconnected or loop through.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="24" y="28" width="12" height="15" rx="2" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="30" y="39" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">1+</text><rect x="44" y="28" width="12" height="15" rx="2" fill="#333" stroke="#555" stroke-width="1"/><text x="50" y="39" text-anchor="middle" fill="#aaa" font-size="7" font-weight="500">1−</text><rect x="24" y="48" width="12" height="15" rx="2" fill="#378ADD" stroke="#185FA5" stroke-width="1"/><text x="30" y="59" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">2+</text><rect x="44" y="48" width="12" height="15" rx="2" fill="#0C447C" stroke="#042C53" stroke-width="1"/><text x="50" y="59" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">2−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl8',name:'Speakon NL8',cat:'speaker',tag:'8-pole speaker',color:'#639922',desc:'8-pole Neutrik Speakon. Carries up to four independent speaker channels, used for tri-amp or quad systems, or running multiple speakers through one cable from an amp rack. Fully backward compatible with NL4.',
   pins:[{n:'1+/1−',sig:'Ch 1 — LF or full range',color:'#E24B4A',note:'Low frequency channel'},
         {n:'2+/2−',sig:'Ch 2 — MF or HF',color:'#378ADD',note:'Mid or high frequency'},
         {n:'3+/3−',sig:'Ch 3 — subwoofer or aux',color:'#1D9E75',note:'Third amplifier channel'},
         {n:'4+/4−',sig:'Ch 4 — aux / spare',color:'#7F77DD',note:'Fourth channel or loop through'}],
   uses:['Tri-amp systems','Multi-way loudspeakers','Amp rack multicore'],
   note:'NL8 sockets also accept NL4 and NL2 plugs — only the matching pins connect.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="16" y="26" width="10" height="12" rx="1" fill="#E24B4A"/><text x="21" y="36" text-anchor="middle" fill="#fff" font-size="7">1+</text><rect x="28" y="26" width="10" height="12" rx="1" fill="#c0392b"/><text x="33" y="36" text-anchor="middle" fill="#fff" font-size="7">1−</text><rect x="42" y="26" width="10" height="12" rx="1" fill="#378ADD"/><text x="47" y="36" text-anchor="middle" fill="#fff" font-size="7">2+</text><rect x="54" y="26" width="10" height="12" rx="1" fill="#185FA5"/><text x="59" y="36" text-anchor="middle" fill="#fff" font-size="7">2−</text><rect x="16" y="52" width="10" height="12" rx="1" fill="#1D9E75"/><text x="21" y="62" text-anchor="middle" fill="#fff" font-size="7">3+</text><rect x="28" y="52" width="10" height="12" rx="1" fill="#0F6E56"/><text x="33" y="62" text-anchor="middle" fill="#fff" font-size="7">3−</text><rect x="42" y="52" width="10" height="12" rx="1" fill="#7F77DD"/><text x="47" y="62" text-anchor="middle" fill="#fff" font-size="7">4+</text><rect x="54" y="52" width="10" height="12" rx="1" fill="#534AB7"/><text x="59" y="62" text-anchor="middle" fill="#fff" font-size="7">4−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'ts-xlr',name:'TS to XLR — unbalanced',cat:'adapter',tag:'Instrument → console',color:'#D85A30',desc:'Connects an unbalanced TS source (guitar, synth, playback device) to an XLR balanced input. Pin 2 carries the signal and pin 3 is tied to pin 1 (ground) to prevent hum. The signal remains unbalanced — no noise rejection gain.',
   pins:[{n:'TS Tip',sig:'→ XLR Pin 2 (hot)',color:'#E24B4A',note:'Signal wire'},
         {n:'TS Sleeve',sig:'→ XLR Pin 1 + Pin 3',color:'#888780',note:'Ground bridged to both pins 1 and 3'}],
   uses:['Guitar DI (no box)','Synth unbalanced out','Media player to console'],
   warn:'Tie pin 3 to pin 1 at the XLR end to avoid hum. Never leave pin 3 floating.',
   svg:`<svg width="160" height="60" viewBox="0 0 160 60"><rect x="4" y="22" width="30" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="4" y="22" width="12" height="14" rx="7" fill="#EF9F27" stroke="#BA7517"/><text x="10" y="32" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="25" y="32" text-anchor="middle" fill="#fff" font-size="9">S</text><line x1="35" y1="29" x2="60" y2="29" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="35" y1="29" x2="60" y2="46" stroke="#888780" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="80" cy="20" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="80" y="24" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1</text><circle cx="65" cy="44" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="65" y="48" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">2</text><circle cx="95" cy="44" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="95" y="48" text-anchor="middle" fill="#333" font-size="8" font-weight="500">3</text><line x1="60" y1="29" x2="72" y2="21" stroke="#888780" stroke-width="1.5"/><line x1="60" y1="46" x2="57" y2="44" stroke="#E24B4A" stroke-width="1.5"/><line x1="80" y1="27" x2="95" y2="37" stroke="#888780" stroke-width="1" stroke-dasharray="2 2"/><text x="80" y="58" text-anchor="middle" fill="#888" font-size="8">pin 3 tied to pin 1</text></svg>`
  },
  {id:'trs-xlr-bal',name:'TRS to XLR — balanced',cat:'adapter',tag:'Balanced send',color:'#1D9E75',desc:'Fully balanced connection. TRS Tip → XLR Pin 2 (hot), TRS Ring → XLR Pin 3 (cold), TRS Sleeve → XLR Pin 1 (ground). Used to connect balanced TRS outputs (interfaces, consoles) to balanced XLR inputs. Full common-mode noise rejection.',
   pins:[{n:'TRS Tip',sig:'→ XLR Pin 2 (hot +)',color:'#E24B4A',note:'Hot / positive signal'},
         {n:'TRS Ring',sig:'→ XLR Pin 3 (cold −)',color:'#1D9E75',note:'Cold / negative signal'},
         {n:'TRS Sleeve',sig:'→ XLR Pin 1 (ground)',color:'#888780',note:'Shield / ground'}],
   uses:['Interface balanced out','Console insert send','Keyboard/synth balanced','DI box through'],
   note:'This is a true balanced connection — both hot and cold are carried. Best noise rejection of all adapter types.',
   svg:`<svg width="160" height="60" viewBox="0 0 160 60"><rect x="2" y="20" width="42" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="2" y="20" width="13" height="14" rx="7" fill="#E24B4A" stroke="#c0392b"/><rect x="18" y="20" width="11" height="14" fill="#1D9E75" stroke="#0F6E56"/><text x="8" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">T</text><text x="24" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">R</text><text x="36" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">S</text><line x1="44" y1="23" x2="70" y2="44" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="44" y1="27" x2="98" y2="44" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="44" y1="30" x2="84" y2="20" stroke="#888780" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="84" cy="16" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="84" y="20" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1</text><circle cx="70" cy="40" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="70" y="44" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">2</text><circle cx="98" cy="40" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="98" y="44" text-anchor="middle" fill="#333" font-size="8" font-weight="500">3</text></svg>`
  },
  {id:'trs-xlr-insert',name:'TRS to dual XLR — Y insert cable',cat:'adapter',tag:'Console insert loop',color:'#7F77DD',desc:'Y cable with one TRS plug splitting to two XLR connectors — one male (send, from console to outboard) and one female (return, from outboard back to console). TRS Tip = send, TRS Ring = return, Sleeve = ground on both sides.',
   pins:[{n:'TRS Tip',sig:'→ XLR Male Pin 2 (send)',color:'#E24B4A',note:'Console send to outboard input'},
         {n:'TRS Ring',sig:'→ XLR Female Pin 2 (return)',color:'#1D9E75',note:'Outboard output back to console'},
         {n:'TRS Sleeve',sig:'→ XLR Pin 1 both sides',color:'#888780',note:'Ground both connectors'}],
   uses:['Console channel insert','Compressor loop','EQ in-line','Effects processor loop'],
   warn:'Tip = SEND (to outboard IN), Ring = RETURN (from outboard OUT). Swapping these kills the loop.',
   svg:`<svg width="160" height="70" viewBox="0 0 160 70"><rect x="2" y="26" width="40" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="2" y="26" width="13" height="14" rx="7" fill="#E24B4A" stroke="#c0392b"/><rect x="18" y="26" width="10" height="14" fill="#1D9E75" stroke="#0F6E56"/><text x="9" y="36" text-anchor="middle" fill="#fff" font-size="8">T</text><text x="23" y="36" text-anchor="middle" fill="#fff" font-size="8">R</text><text x="36" y="36" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="42" y1="30" x2="80" y2="16" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="42" y1="34" x2="80" y2="54" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="94" cy="12" r="7" fill="#0C0C0F" stroke="#E24B4A" stroke-width="1.5"/><text x="94" y="16" text-anchor="middle" fill="#E24B4A" font-size="7" font-weight="500">M</text><text x="94" y="26" text-anchor="middle" fill="#888" font-size="7">Send</text><circle cx="94" cy="52" r="7" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="94" y="56" text-anchor="middle" fill="#1D9E75" font-size="7" font-weight="500">F</text><text x="94" y="66" text-anchor="middle" fill="#888" font-size="7">Return</text></svg>`
  },
  {id:'35-xlr',name:'3.5mm TRS to XLR stereo',cat:'adapter',tag:'Phone/laptop → system',color:'#D4537E',desc:'Converts stereo 3.5mm consumer output to two balanced XLR males (L + R). Tip → XLR-L Pin 2, Ring → XLR-R Pin 2, Sleeve → Pin 1 on both XLR connectors. Signal is unbalanced on each XLR output — adequate for short runs.',
   pins:[{n:'3.5mm Tip',sig:'→ XLR Left Pin 2',color:'#E24B4A',note:'Left channel signal'},
         {n:'3.5mm Ring',sig:'→ XLR Right Pin 2',color:'#1D9E75',note:'Right channel signal'},
         {n:'3.5mm Sleeve',sig:'→ XLR (both) Pin 1+3',color:'#888780',note:'Ground, pins 1+3 bridged each side'}],
   uses:['Phone/laptop to PA','DJ backup source','Media player to console'],
   warn:'Output is unbalanced at each XLR. Use a stereo DI box for runs over 5m or in noisy environments.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="20" y="12" width="40" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="20" y="12" width="12" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="34" y="12" width="10" height="12" fill="#1D9E75" stroke="#0F6E56"/><text x="26" y="21" text-anchor="middle" fill="#fff" font-size="8">T</text><text x="39" y="21" text-anchor="middle" fill="#fff" font-size="8">R</text><text x="52" y="21" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="30" y1="24" x2="20" y2="45" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="50" y1="24" x2="60" y2="45" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="56" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="60" text-anchor="middle" fill="#378ADD" font-size="7" font-weight="500">L</text><circle cx="60" cy="56" r="9" fill="#1a1a22" stroke="#E24B4A" stroke-width="1.5"/><text x="60" y="60" text-anchor="middle" fill="#E24B4A" font-size="7" font-weight="500">R</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">XLR M × 2</text></svg>`
  },
  {id:'35-rca',name:'3.5mm to stereo RCA',cat:'adapter',tag:'Consumer stereo',color:'#D85A30',desc:'Standard cable for connecting consumer devices (phones, laptops, media players) to DJ mixers or hi-fi amplifiers with RCA inputs. Tip → Red RCA (right), Ring → White/Black RCA (left), Sleeve → ground on both RCAs.',
   pins:[{n:'Tip',sig:'→ RCA Red — Right channel',color:'#E24B4A',note:'Right audio'},
         {n:'Ring',sig:'→ RCA White — Left channel',color:'#1D9E75',note:'Left audio'},
         {n:'Sleeve',sig:'→ RCA outer rings (both)',color:'#888780',note:'Common ground'}],
   uses:['Phone to DJ mixer','Media player to amplifier','Laptop to mixing desk (line)'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="22" y="10" width="36" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="22" y="10" width="11" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="35" y="10" width="9" height="12" fill="#1D9E75" stroke="#0F6E56"/><line x1="30" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="50" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="58" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {id:'trs-rca',name:'TRS to stereo RCA',cat:'adapter',tag:'Pro to consumer',color:'#D4537E',desc:'Connects a professional TRS stereo output (interface, mixer headphone out, DJ monitor out) to a consumer RCA input. Same wiring as 3.5mm to RCA but with a full-size 6.35mm TRS plug on the pro side.',
   pins:[{n:'TRS Tip',sig:'→ RCA Red (right)',color:'#E24B4A',note:'Right channel'},
         {n:'TRS Ring',sig:'→ RCA White (left)',color:'#1D9E75',note:'Left channel'},
         {n:'TRS Sleeve',sig:'→ RCA outer rings',color:'#888780',note:'Ground both RCAs'}],
   uses:['Interface to monitors (RCA)','DJ booth monitoring','Club install amplifiers'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="10" width="48" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="14" y="10" width="14" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="30" y="10" width="11" height="12" fill="#1D9E75" stroke="#0F6E56"/><line x1="28" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="52" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="58" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {id:'rca-xlrm',name:'RCA to male XLR (stereo pair)',cat:'adapter',tag:'Consumer → balanced',color:'#D85A30',desc:'Two RCA connectors to two XLR males. Converts unbalanced consumer outputs to XLR for connecting to PA systems or mixing consoles. RCA centre pin → XLR Pin 2, RCA outer → XLR Pins 1+3 (bridged).',
   pins:[{n:'RCA Red centre',sig:'→ XLR-R Male Pin 2',color:'#E24B4A',note:'Right signal to console'},
         {n:'RCA White centre',sig:'→ XLR-L Male Pin 2',color:'#1D9E75',note:'Left signal to console'},
         {n:'RCA outer (both)',sig:'→ XLR Pin 1 + Pin 3',color:'#888780',note:'Ground, pin 3 bridged to pin 1'}],
   uses:['CD player to PA','Laptop to front-of-house','Media server to console'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="22" cy="20" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle cx="58" cy="20" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R male XLR</text></svg>`
  },
  {id:'rca-xlrf',name:'RCA to female XLR (stereo pair)',cat:'adapter',tag:'Consumer to balanced in',color:'#D85A30',desc:'Same wiring as RCA to male XLR but terminates in female XLR connectors. Used when the destination has XLR male pins sticking out (e.g. some amplifiers, powered speakers with XLR male inputs). Less common — verify your destination connector gender first.',
   pins:[{n:'RCA Red centre',sig:'→ XLR-R Female Pin 2',color:'#E24B4A',note:'Right channel input'},
         {n:'RCA White centre',sig:'→ XLR-L Female Pin 2',color:'#1D9E75',note:'Left channel input'},
         {n:'RCA outer (both)',sig:'→ XLR Female Pin 1+3',color:'#888780',note:'Bridged ground'}],
   uses:['Consumer source to amp with male XLR','Broadcast input adapters'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="22" cy="20" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle cx="58" cy="20" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R female XLR</text></svg>`
  },
  {id:'pcon',name:'PowerCon — general (NAC3)',cat:'power',tag:'Locking mains power',color:'#E24B4A',desc:'Neutrik PowerCon is a twist-locking mains power connector rated at 250V / 16A. The NAC3FCA (blue, IN) and NAC3FCB (grey, OUT) variants are keyed differently — they cannot be cross-connected. Used for powering stage equipment, intelligent lighting, and amplifiers.',
   pins:[{n:'L',sig:'Line (live)',color:'#E24B4A',note:'Brown wire (UK) / Black (US)'},
         {n:'N',sig:'Neutral',color:'#1a1a22',note:'Blue wire (UK) / White (US)',border:'#555'},
         {n:'E',sig:'Earth / ground',color:'#639922',note:'Green-yellow wire'}],
   uses:['Amp rack power','Intelligent lighting','Powered speaker mains','Stage power distro'],
   warn:'DANGER — live mains voltage (230V/120V). Never connect or disconnect under load. Do not use as a breakout connector.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#E24B4A" stroke-width="2"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9" font-weight="500">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">E</text><text x="40" y="82" text-anchor="middle" fill="#E24B4A" font-size="8">⚡ mains voltage</text></svg>`
  },
  {id:'pcon-in',name:'PowerCon IN — NAC3FCA (blue)',cat:'power',tag:'Power input',color:'#378ADD',desc:'Blue PowerCon — the input connector. Accepts mains power into equipment. The blue colour and unique key orientation prevents cross-connection with OUT connectors. Wired: L = Line (brown), N = Neutral (blue), E = Earth (green-yellow).',
   pins:[{n:'L',sig:'Line (live) — brown',color:'#E24B4A',note:'Connect to live/line from distro'},
         {n:'N',sig:'Neutral — blue',color:'#1a1a22',note:'Connect to neutral',border:'#555'},
         {n:'E',sig:'Earth — green/yellow',color:'#639922',note:'Always connect earth first'}],
   uses:['Equipment power input','Powered speakers IN','Amplifier mains IN'],
   warn:'Blue = IN (power into device). Grey = OUT (power through device). These are physically keyed and incompatible.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#378ADD" stroke-width="3"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9">E</text><text x="40" y="82" text-anchor="middle" fill="#378ADD" font-size="8">Blue — IN</text></svg>`
  },
  {id:'pcon-out',name:'PowerCon OUT — NAC3FCB (grey)',cat:'power',tag:'Power loop-through',color:'#888780',desc:'Grey PowerCon — the output connector. Passes mains power through from one device to the next (daisy-chain / loop-through). Used to feed power from a distribution unit or one device to another. Same L/N/E pinout as the IN connector but physically keyed differently.',
   pins:[{n:'L',sig:'Line (live) — brown',color:'#E24B4A',note:'Loop-through to next device'},
         {n:'N',sig:'Neutral — blue',color:'#1a1a22',note:'Neutral loop-through',border:'#555'},
         {n:'E',sig:'Earth — green/yellow',color:'#639922',note:'Earth continuity through'}],
   uses:['Power distro output','Daisy-chain amplifier power','Dimmer rack output'],
   warn:'Grey = OUT / through. Never use OUT to connect to standard mains sockets.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#888780" stroke-width="3"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9">E</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Grey — OUT</text></svg>`
  },
  {id:'rj45',name:'RJ45 / EtherCon (Ethernet)',cat:'digital',tag:'Network / Dante / AES67',color:'#7F77DD',desc:'8-position 8-contact connector for Ethernet, Dante audio networking, AES67, AVB, and AES/EBU over Cat5e/Cat6. Pin 1+2 = TX pair, Pin 3+6 = RX pair. EtherCon (Neutrik) is the ruggedized, XLR-body version for live and touring use.',
   pins:[{n:'1',sig:'TX+ (transmit)',color:'#E24B4A',note:'White-orange'},
         {n:'2',sig:'TX− (transmit)',color:'#D85A30',note:'Orange'},
         {n:'3',sig:'RX+ (receive)',color:'#1D9E75',note:'White-green'},
         {n:'4',sig:'PoE / unused',color:'#378ADD',note:'Blue'},
         {n:'5',sig:'PoE / unused',color:'#85B7EB',note:'White-blue'},
         {n:'6',sig:'RX− (receive)',color:'#639922',note:'Green'},
         {n:'7',sig:'Unused / PoE',color:'#D4537E',note:'White-brown'},
         {n:'8',sig:'Unused / PoE',color:'#8B4513',note:'Brown'}],
   uses:['Dante audio network','AES67 / AVB','Stage network','EtherCon touring runs'],
   note:'Use Cat5e minimum (Cat6 preferred for Dante). T568B wiring standard for all pro audio networking.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="20" width="48" height="44" rx="4" fill="#1a1a22" stroke="#7F77DD" stroke-width="1.5"/><rect x="20" y="26" width="5" height="28" rx="1" fill="#E24B4A"/><rect x="27" y="26" width="5" height="28" rx="1" fill="#D85A30"/><rect x="34" y="26" width="5" height="28" rx="1" fill="#1D9E75"/><rect x="41" y="26" width="5" height="28" rx="1" fill="#378ADD"/><rect x="48" y="26" width="5" height="28" rx="1" fill="#85B7EB"/><rect x="55" y="26" width="5" height="28" rx="1" fill="#639922"/><rect x="62" y="26" width="1.5" height="28" rx="1" fill="#D4537E"/><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">T568B — 8 pins</text></svg>`
  },
  {id:'bnc',name:'BNC — word clock / video sync',cat:'digital',tag:'75Ω coax',color:'#888780',desc:'Bayonet Neill-Concelman connector. Used for word clock distribution (44.1/48/96kHz sync), video sync signals, SPDIF digital audio (75Ω), and MADI (coaxial format). Twist-lock coaxial connector with centre pin (signal) and outer barrel (ground/shield). Requires 75Ω coaxial cable.',
   pins:[{n:'C',sig:'Centre — signal / clock',color:'#EF9F27',note:'Word clock or digital audio signal'},
         {n:'O',sig:'Outer barrel — ground',color:'#888780',note:'Coaxial shield / ground'}],
   uses:['Word clock sync','SPDIF coaxial','MADI coaxial','Video sync / black burst'],
   warn:'Use 75Ω cable only. 50Ω BNC cable causes reflections and sync errors. Always terminate unused word clock outputs with a 75Ω terminator.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="28" fill="#1a1a22" stroke="#888780" stroke-width="6"/><circle cx="40" cy="44" r="10" fill="#EF9F27" stroke="#BA7517" stroke-width="1.5"/><text x="40" y="48" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">75Ω</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Coax — BNC</text></svg>`
  },
  {id:'midi',name:'DIN 5-pin MIDI',cat:'digital',tag:'MIDI control',color:'#D4537E',desc:'Standard MIDI connector. 5-pin DIN, but only 3 pins are used for standard MIDI. Pin 2 = cable screen/ground, Pin 4 = MIDI current source (+5V through 220Ω), Pin 5 = MIDI data. Pins 1 and 3 are not connected in standard MIDI (used in some proprietary extensions).',
   pins:[{n:'1',sig:'Not connected (NC)',color:'#D3D1C7',note:'Unused in standard MIDI'},
         {n:'2',sig:'Cable screen / shield',color:'#888780',note:'Ground — connect at one end only'},
         {n:'3',sig:'Not connected (NC)',color:'#D3D1C7',note:'Unused in standard MIDI'},
         {n:'4',sig:'+5V source (220Ω)',color:'#E24B4A',note:'Current loop positive'},
         {n:'5',sig:'MIDI data',color:'#7F77DD',note:'Serial data 31.25 kbaud'}],
   uses:['MIDI keyboard/controller','MIDI patchbay','Synthesizers','MIDI time code (MTC)'],
   note:'MIDI is an opto-isolated current loop — not a voltage signal. Never connect MIDI OUT to MIDI OUT.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#D4537E" stroke-width="1.5"/><circle cx="40" cy="18" r="6" fill="#D3D1C7" stroke="#888" stroke-width="1"/><text x="40" y="22" text-anchor="middle" fill="#555" font-size="8">1</text><circle cx="20" cy="34" r="6" fill="#888780" stroke="#666" stroke-width="1"/><text x="20" y="38" text-anchor="middle" fill="#fff" font-size="8">2</text><circle cx="60" cy="34" r="6" fill="#D3D1C7" stroke="#888" stroke-width="1"/><text x="60" y="38" text-anchor="middle" fill="#555" font-size="8">3</text><circle cx="26" cy="56" r="6" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="26" y="60" text-anchor="middle" fill="#fff" font-size="8">4</text><circle cx="54" cy="56" r="6" fill="#7F77DD" stroke="#534AB7" stroke-width="1"/><text x="54" y="60" text-anchor="middle" fill="#fff" font-size="8">5</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">DIN 5-pin</text></svg>`
  },
  {id:'db25',name:'DB25 / D-Sub — Tascam & Elco',cat:'digital',tag:'Multicore analog/digital',color:'#D85A30',desc:'25-pin D-sub connector used as a multicore analog connector. The Tascam wiring standard carries 8 balanced analog channels on one connector (common on audio interfaces, patchbays, and consoles). Elco/Edac 38-pin is an alternative format on some vintage consoles.',
   pins:[{n:'1–8',sig:'Signals (Tascam: alt. hot/cold)',color:'#378ADD',note:'8 channels of balanced audio'},
         {n:'9–17',sig:'Hot and cold pairs',color:'#1D9E75',note:'Pins arranged in pairs per channel'},
         {n:'18–25',sig:'Ground returns',color:'#888780',note:'One ground per channel'}],
   uses:['Audio interface analog I/O','Patchbay multicore','Console sub-group routing','Pro Tools HD interfaces'],
   note:'Tascam pinout and Yamaha pinout differ — always check which standard your gear uses before building loom cables.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="24" width="64" height="40" rx="3" fill="#1a1a22" stroke="#D85A30" stroke-width="1.5"/><g fill="#378ADD"><circle cx="14" cy="36" r="3.5"/><circle cx="23" cy="36" r="3.5"/><circle cx="32" cy="36" r="3.5"/><circle cx="41" cy="36" r="3.5"/><circle cx="50" cy="36" r="3.5"/><circle cx="59" cy="36" r="3.5"/><circle cx="68" cy="36" r="3.5"/></g><g fill="#1D9E75"><circle cx="18" cy="48" r="3.5"/><circle cx="27" cy="48" r="3.5"/><circle cx="36" cy="48" r="3.5"/><circle cx="45" cy="48" r="3.5"/><circle cx="54" cy="48" r="3.5"/><circle cx="63" cy="48" r="3.5"/></g><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">DB25 — 25 pins</text></svg>`
  },
  {id:'toslink',name:'Optical / TOSLINK',cat:'digital',tag:'Digital optical',color:'#EF9F27',desc:'Toshiba Link optical connector. Carries S/PDIF or ADAT Lightpipe digital audio on a fiber optic cable. Immune to electrical interference and ground loops. ADAT Lightpipe carries 8 channels at 44.1/48kHz or 4 channels at 96kHz. S/PDIF carries 2 channels up to 192kHz.',
   pins:[{n:'TX',sig:'Transmit — light out',color:'#EF9F27',note:'Red/IR light pulse = digital signal'},
         {n:'RX',sig:'Receive — light in',color:'#888780',note:'Photodiode receiver'}],
   uses:['ADAT lightpipe (8ch)','S/PDIF optical','Interface I/O','Consumer DAC/ADC'],
   note:'ADAT = 8 channels. S/PDIF optical = 2 channels. Same connector, different protocols. Max cable length ~5m for reliable transmission.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="24" width="48" height="36" rx="4" fill="#1a1a22" stroke="#EF9F27" stroke-width="1.5"/><rect x="24" y="32" width="32" height="20" rx="2" fill="#0C0C0F"/><circle cx="40" cy="42" r="8" fill="#EF9F27" opacity="0.9"/><circle cx="40" cy="42" r="4" fill="#fff" opacity="0.6"/><text x="40" y="78" text-anchor="middle" fill="#888" font-size="8">TOSLINK optical</text></svg>`
  }
];

const PINOUT_CATS = [
    {id:'all',label:'All'},
    {id:'analog',label:'Analog audio'},
    {id:'speaker',label:'Speaker connectors'},
    {id:'adapter',label:'Adapter cables'},
    {id:'power',label:'Power connectors'},
    {id:'digital',label:'Digital & networking'}
];

let activePinoutCat = 'all';

window.initPinout = function() {
    const listEl = document.getElementById('pinout-list');
    const srchEl = document.getElementById('pinout-srch');
    const catContainer = document.getElementById('pinout-cats');
    if(!listEl || !srchEl || !catContainer) return;

    catContainer.innerHTML = '';
    PINOUT_CATS.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${c.id === 'all' ? 'on' : ''}`;
        btn.textContent = c.label;
        btn.onclick = () => window.setPinoutCat(c.id, btn);
        catContainer.appendChild(btn);
    });

    srchEl.addEventListener('input', window.renderPinouts);
    window.renderPinouts();
};

window.setPinoutCat = function(catId, btnEl) {
    activePinoutCat = catId;
    document.querySelectorAll('#pinout-cats .cat-btn').forEach(b => b.classList.remove('on'));
    btnEl.classList.add('on');
    window.renderPinouts();
};

window.renderPinouts = function() {
    const listEl = document.getElementById('pinout-list');
    const badgeEl = document.getElementById('pinout-count-badge');
    const srchInput = document.getElementById('pinout-srch');
    if(!listEl) return;

    const q = (srchInput.value || '').toLowerCase();
    listEl.innerHTML = '';
    let total = 0;

    PINOUT_CATS.filter(c => c.id !== 'all').forEach(cat => {
        if (activePinoutCat !== 'all' && activePinoutCat !== cat.id) return;
        
        const items = PINOUT_DATA.filter(d => d.cat === cat.id && 
            (d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q))
        );
        
        if (!items.length) return;
        total += items.length;
        
        const hdr = document.createElement('div');
        hdr.className = 'section-hdr pinout-section-hdr';
        hdr.textContent = cat.label.toUpperCase();
        listEl.appendChild(hdr);
        
        items.forEach(conn => {
            const acc = document.createElement('div');
            acc.className = 'acc pinout-acc';
            acc.innerHTML = `
                <div class="acc-hdr" onclick="window.togglePinout(this)">
                    <div class="conn-dot" style="background:${conn.color};box-shadow: 0 0 8px ${conn.color};"></div>
                    <div class="acc-name">${conn.name}</div>
                    <div class="acc-tag" style="background:var(--outline);color:var(--primary);border:1px solid var(--outline-light)">${conn.tag}</div>
                    <div class="acc-arrow"><span class="material-symbols-outlined">expand_more</span></div>
                </div>
                <div class="acc-body">
                    <div class="desc">${conn.desc}</div>
                    <div class="pin-layout">
                        <div class="pin-svg">${conn.svg}</div>
                        <div class="pin-table-container">
                            <table class="pin-table">
                                <thead><tr><th>Pin</th><th>Signal</th><th>Note</th></tr></thead>
                                <tbody>${conn.pins.map(p=>`<tr><td><div class="dot-cell"><div class="pd" style="background:${p.color};border:1px solid ${p.border||'rgba(255,255,255,0.1)'}"></div><strong>${p.n}</strong></div></td><td>${p.sig}</td><td class="pin-note">${p.note}</td></tr>`).join('')}</tbody>
                            </table>
                        </div>
                    </div>
                    <div class="use-row">${conn.uses.map(u=>`<span class="use-tag">${u}</span>`).join('')}</div>
                    ${conn.warn?`<div class="warn-box">⚠ ${conn.warn}</div>`:''}
                    ${conn.note?`<div class="note-box">ℹ ${conn.note}</div>`:''}
                </div>
            `;
            listEl.appendChild(acc);
        });
    });
    
    if(badgeEl) badgeEl.textContent = total + ' CONNECTORS';
};

window.togglePinout = function(hdrEl) {
    const body = hdrEl.nextElementSibling;
    const arrow = hdrEl.querySelector('.acc-arrow');
    const open = body.classList.contains('open');
    body.classList.toggle('open', !open);
    arrow.classList.toggle('open', !open);
};
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchBtn = document.getElementById('btn-global-search');
    const filterChips = document.querySelectorAll('.filter-chip');
    const widgets = document.querySelectorAll('.dashboard-grid .widget');

    if (!searchInput || !widgets.length) return;

    let activeFilter = 'all';
    let searchQuery = '';

    function performFilter() {
        // Filter Dashboard Widgets
        widgets.forEach(widget => {
            const title = widget.querySelector('.widget-title')?.textContent.toLowerCase() || '';
            const subtitle = widget.querySelector('.widget-subtitle')?.textContent.toLowerCase() || '';
            const category = widget.getAttribute('data-category');
            
            const matchesSearch = title.includes(searchQuery) || subtitle.includes(searchQuery);
            const matchesCategory = activeFilter === 'all' || category === activeFilter;

            if (matchesSearch && matchesCategory) {
                widget.classList.remove('filtered-out');
            } else {
                widget.classList.add('filtered-out');
            }
        });

        // Filter Blog Articles
        const articleCards = document.querySelectorAll('.article-card');
        articleCards.forEach(card => {
            const title = card.querySelector('.article-title')?.textContent.toLowerCase() || '';
            const excerpt = card.querySelector('.article-excerpt')?.textContent.toLowerCase() || '';
            const category = card.getAttribute('data-cat');

            const matchesSearch = title.includes(searchQuery) || excerpt.includes(searchQuery);
            
            // Note: Blog has its own category filter in initBlog(), 
            // but global search should still filter it.
            if (matchesSearch) {
                card.style.display = card.classList.contains('locked') ? 'none' : 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Input Search (Real-time)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        performFilter();
    });

    // Button Click
    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value.toLowerCase().trim();
        performFilter();
    });

    // Enter Key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value.toLowerCase().trim();
            performFilter();
        }
    });

    // Filter Chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update UI
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Set state and filter
            activeFilter = chip.getAttribute('data-filter');
            performFilter();
        });
    });
}
function initBlog() {
    const blogIndex = document.getElementById('blog-index');
    const blogReader = document.getElementById('blog-reader');
    const catBtns = document.querySelectorAll('.cat-btn');
    const backBtn = document.querySelector('.btn-back-to-index');

    if (!blogIndex || !blogReader) return;

    // Render all articles (Live and Placeholders)
    function renderBlogList(filter = 'all') {
        blogIndex.innerHTML = '';
        
        // Combine real articles and placeholders
        const allItems = [
            ...blogArticles.map(a => ({ ...a, type: 'live' })),
            ...blogPlaceholders.map(p => ({ ...p, type: 'locked', id: null }))
        ];

        allItems.forEach(item => {
            if (filter !== 'all' && item.category !== filter && item.cat !== filter) return;

            const card = document.createElement('article');
            card.className = `article-card widget rugged-bevel brushed-metal ${item.type === 'locked' ? 'locked' : ''}`;
            if (item.id) card.setAttribute('data-id', item.id);
            card.setAttribute('data-cat', item.category || item.cat);

            card.innerHTML = `
                <div class="card-meta">
                    <span class="cat-tag">${(item.categoryLabel || item.cat).toUpperCase()}</span>
                    <span class="${item.type === 'locked' ? 'status-tag' : 'read-time'}">${item.type === 'locked' ? 'UPCOMING' : item.readTime}</span>
                </div>
                <h3 class="article-title ${item.type === 'live' ? 'text-primary' : ''}">${item.title}</h3>
                <p class="article-excerpt">${item.excerpt}</p>
                ${item.type === 'live' ? `<button class="read-more">READ DEEP DIVE <span class="material-symbols-outlined">arrow_forward</span></button>` : ''}
            `;

            if (item.type === 'live') {
                card.querySelector('.read-more').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openArticle(item.id);
                });
                card.addEventListener('click', () => openArticle(item.id));
            }

            blogIndex.appendChild(card);
        });
    }

    function openArticle(id) {
        const article = blogArticles.find(a => a.id === id);
        if (!article) return;

        const container = document.getElementById('article-view');
        container.innerHTML = article.content;
        
        blogIndex.style.display = 'none';
        blogReader.style.display = 'block';
        window.scrollTo(0, 0);
    }

    // Category Filtering
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-cat');
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Return to index if reading an article
            blogReader.style.display = 'none';
            blogIndex.style.display = 'grid';
            
            renderBlogList(cat);
        });
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            blogReader.style.display = 'none';
            blogIndex.style.display = 'grid';
        });
    }

    // Initial Render
    renderBlogList();
}

// --- PROFESSIONAL RTA SUITE (1/6 OCTAVE REFINE) ---
const ISO_FREQS = [
    20, 22.4, 25, 28, 31.5, 35.5, 40, 45, 50, 56, 63, 71, 80, 90, 100, 
    112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 
    1120, 1250, 1400, 1600, 1800, 2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100, 8000, 9000, 10000, 
    11200, 12500, 14000, 16000, 18000, 20000
];

function initProfessionalRTA() {
    const canvas = document.getElementById('rta-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('btn-start-analyzer');
    const inputSelect = document.getElementById('rta-input-select');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const weightBtns = document.querySelectorAll('.weight-btn');
    const calSlider = document.getElementById('rta-calibration');
    const calValue = document.getElementById('cal-offset');
    const peakToggle = document.getElementById('btn-peak-toggle');
    const peakReset = document.getElementById('btn-peak-reset');
    const labelsContainer = document.getElementById('rta-labels');
    
    let audioCtx, analyser, source, stream;
    let dataArray, bufferLength;
    let timeData; // For Hanning/Manual FFT
    let smoothedDataArray;
    let isInitialized = false;
    let currentMode = 'fft'; // Default to Spectrum Curve
    let currentWeighting = 'a'; // Default to A-weighted
    let averagingFactor = 4; // Default averaging
    let calibrationOffset = 100;
    let peakHoldEnabled = true;
    let peakData = new Array(ISO_FREQS.length).fill(-100);
    let domFreqDisplay = "--- Hz";

    // Snapshot state
    let snapshotDataRTA = null;
    let snapshotDataFFT = null;

    // A-Weighting Look-up Table for 1/6 octave (interpolated centers)
    const A_WEIGHTS = { 20:-50.5, 22.4:-48.0, 25:-44.7, 28:-41.6, 31.5:-39.4, 35.5:-37.0, 40:-34.6, 45:-32.4, 50:-30.2, 56:-28.2, 63:-26.2, 71:-24.1, 80:-22.5, 90:-20.8, 100:-19.1, 112:-17.5, 125:-16.1, 140:-14.7, 160:-13.4, 180:-12.2, 200:-10.9, 224:-9.6, 250:-8.6, 280:-7.5, 315:-6.6, 355:-5.7, 400:-4.8, 450:-4.0, 500:-3.2, 560:-2.5, 630:-1.9, 710:-1.3, 800:-0.8, 900:-0.4, 1000:0, 1120:0.3, 1250:0.6, 1400:0.8, 1600:1.0, 1800:1.1, 2000:1.2, 2240:1.3, 2500:1.3, 2800:1.3, 3150:1.2, 3550:1.1, 4000:1.0, 4500:0.8, 5000:0.5, 5600:0.2, 6300:-0.1, 7100:-0.5, 8000:-1.1, 9000:-1.7, 10000:-2.5, 11200:-3.3, 12500:-4.3, 14000:-5.4, 16000:-6.6, 18000:-7.9, 20000:-9.3 };

    // Inject Labels (Simplified for 1/6 density)
    if (labelsContainer) {
        labelsContainer.innerHTML = ISO_FREQS.map((f, i) => {
            const isMajor = i % 2 === 0; // Show label every 2 bands
            return isMajor ? `<span class="freq-label">${f >= 1000 ? (f/1000)+'k' : f}</span>` : `<span class="freq-label" style="opacity:0.2">·</span>`;
        }).join('');
    }

    async function getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'audioinput');
            inputSelect.innerHTML = inputs.map(d => `<option value="${d.deviceId}">${d.label || 'Input ' + d.deviceId.slice(0,4)}</option>`).join('');
        } catch (e) { console.error("Device enumeration failed", e); }
    }

    async function startAnalyzer(deviceId) {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }

        try {
            const constraints = { 
                audio: (deviceId && deviceId !== 'default') ? { deviceId: { exact: deviceId } } : true 
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048; 
            analyser.smoothingTimeConstant = 0; // We'll do custom smoothing
            
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
 
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Float32Array(bufferLength);
            timeData = new Float32Array(analyser.fftSize);
            smoothedDataArray = new Float32Array(bufferLength).fill(-100);
            
            isInitialized = true;
            startBtn.classList.remove('pulse-glow');
            startBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> SYSTEM_ACTIVE';
            
            getDevices();
            requestAnimationFrame(draw);
        } catch (e) {
            console.error("Mic access failed", e);
            startBtn.innerHTML = '<span class="material-symbols-outlined">error</span> ACCESS_DENIED';
        }
    }

    function getSPLColor(db) {
        const val = db + calibrationOffset;
        if (val > 105) return '#E24B4A'; // Red
        if (val > 95) return '#D85A30'; // Orange
        if (val > 85) return '#639922'; // Green
        if (val > 70) return '#378ADD'; // Light Blue
        return '#14A7B5'; // Turquoise
    }

    function draw() {
        if (!isInitialized) return;
        requestAnimationFrame(draw);
        
        // Manual FFT with Hanning Window
        analyser.getFloatTimeDomainData(timeData);
        
        // 1. Apply Hanning Window
        const N = timeData.length;
        const windowedData = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const hanning = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
            windowedData[i] = timeData[i] * hanning;
        }

        // 2. Perform FFT
        // Note: AnalyserNode.getFloatFrequencyData applies its own Blackman window.
        // For professional accuracy with the custom smoothing, we use rawData.
        analyser.getFloatFrequencyData(dataArray);

        // 3. Apply Averaging / Smoothing
        const alpha = 1 / (averagingFactor + 1);
        for (let i = 0; i < bufferLength; i++) {
            // Clamp data to a reasonable floor to avoid -Infinity issues in rendering
            if (dataArray[i] < -120) dataArray[i] = -120;
            
            smoothedDataArray[i] = (dataArray[i] * alpha) + (smoothedDataArray[i] * (1 - alpha));
            dataArray[i] = smoothedDataArray[i];
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (currentMode === 'rta') {
            drawRTA();
        } else if (currentMode === 'fft') {
            drawFFT();
        }

        drawGridAndLabels();
        drawDominantOverlay();
        updateTelemetry();
    }

    function drawGridAndLabels() {
        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = "12px 'Space Grotesk', sans-serif";
        ctx.lineWidth = 0.5;

        // dB Range to show: from calibrationOffset - 100 to calibrationOffset
        const minDisplayDB = Math.floor((calibrationOffset - 100) / 10) * 10;
        const maxDisplayDB = Math.ceil(calibrationOffset / 10) * 10;

        for (let displayDB = minDisplayDB; displayDB <= maxDisplayDB; displayDB += 10) {
            const internalDB = displayDB - calibrationOffset;
            const y = canvas.height - (internalDB + 100) * (canvas.height / 100);

            if (y < 0 || y > canvas.height) continue;

            // Draw Grid Line
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.moveTo(40, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();

            // Draw Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(`${displayDB}`, 35, y + 4);
        }
        ctx.restore();
    }

    function drawRTA() {
        const barWidth = canvas.width / ISO_FREQS.length;
        const sampleRate = audioCtx.sampleRate;
        const nyquist = sampleRate / 2;

        ISO_FREQS.forEach((centerFreq, i) => {
            const ratio = Math.pow(2, 1/12); // Half of 1/6 for band edges
            const lowFreq = centerFreq / ratio;
            const highFreq = centerFreq * ratio;
            
            const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
            const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
            
            let sum = 0;
            let count = 0;
            for (let b = lowBin; b <= highBin; b++) {
                sum += dataArray[b];
                count++;
            }
            
            let db = count > 0 ? sum / count : -100;
            if (currentWeighting === 'a') db += (A_WEIGHTS[centerFreq] || 0);

            if (db > peakData[i]) peakData[i] = db;
            
            // Draw Snapshot first (background)
            if (snapshotDataRTA && snapshotDataRTA[i]) {
                const sh = Math.max(2, (snapshotDataRTA[i] + 100) * (canvas.height / 100));
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(i * barWidth + 1, canvas.height - sh, barWidth - 2, sh);
                // Outline for better visibility
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(i * barWidth + 1, canvas.height - sh, barWidth - 2, sh);
            }

            const h = Math.max(2, (db + 100) * (canvas.height / 100));
            ctx.fillStyle = getSPLColor(db);
            ctx.fillRect(i * barWidth + 1, canvas.height - h, barWidth - 2, h);

            if (peakHoldEnabled) {
                const ph = (peakData[i] + 100) * (canvas.height / 100);
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(i * barWidth + 1, canvas.height - ph - 2, barWidth - 2, 2);
            }
        });
    }

    function drawFFT() {
        // Draw Snapshot if exists
        if (snapshotDataFFT) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1;
            for (let i = 0; i < bufferLength; i++) {
                let dbVal = snapshotDataFFT[i];
                const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
                const y = Math.min(canvas.height, canvas.height - (dbVal + 100) * (canvas.height / 100));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        }

        ctx.beginPath();
        ctx.strokeStyle = '#14A7B5';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < bufferLength; i++) {
            let dbVal = dataArray[i];
            const x = (Math.log10(i + 1) / Math.log10(bufferLength)) * canvas.width;
            const y = Math.min(canvas.height, canvas.height - (dbVal + 100) * (canvas.height / 100));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    function drawDominantOverlay() {
        ctx.save();
        // Use explicit font stack as canvas API doesn't support CSS variables
        ctx.font = "bold 72px 'Space Grotesk', sans-serif";
        ctx.fillStyle = '#14A7B5'; // Cyan/Turquoise
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(20, 167, 181, 0.7)';
        ctx.fillText(domFreqDisplay, canvas.width / 2, 90);
        ctx.restore();
    }

    function updateTelemetry() {
        const peakValEl = document.getElementById('rta-peak-val');
        const domFreqEl = document.getElementById('rta-dom-val');
        
        const maxDB = Math.max(...peakData);
        if (peakValEl) peakValEl.textContent = `${(maxDB + calibrationOffset).toFixed(1)} dB`;
        
        let maxFFT = -120;
        let domIdx = 0;
        for (let i = 2; i < bufferLength; i++) { // Skip DC
            if (dataArray[i] > maxFFT) {
                maxFFT = dataArray[i];
                domIdx = i;
            }
        }
        const domFreq = Math.round(domIdx * (audioCtx.sampleRate / analyser.fftSize));
        domFreqDisplay = `${domFreq} Hz`;
        if (domFreqEl) domFreqEl.textContent = domFreqDisplay;
    }

    // Event Listeners
    const avgSlider = document.getElementById('rta-averaging');
    const avgVal = document.getElementById('avg-val');

    if (avgSlider) {
        avgSlider.addEventListener('input', (e) => {
            averagingFactor = parseInt(e.target.value);
            avgVal.textContent = averagingFactor;
        });
    }

    startBtn.addEventListener('click', () => startAnalyzer(inputSelect.value));
    inputSelect.addEventListener('change', () => startAnalyzer(inputSelect.value));
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.getAttribute('data-mode');
        });
    });

    weightBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            weightBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeighting = btn.getAttribute('data-weight');
        });
    });

    calSlider.addEventListener('input', () => {
        calibrationOffset = parseFloat(calSlider.value);
        calValue.textContent = calibrationOffset;
    });

    peakToggle.addEventListener('click', () => {
        peakHoldEnabled = !peakHoldEnabled;
        peakToggle.classList.toggle('active', peakHoldEnabled);
        peakToggle.textContent = peakHoldEnabled ? 'ON' : 'OFF';
    });

    peakReset.addEventListener('click', () => {
        peakData.fill(-100);
    });

    const btnCapture = document.getElementById('btn-capture-snapshot');
    const btnClear = document.getElementById('btn-clear-snapshot');

    if (btnCapture) {
        btnCapture.addEventListener('click', () => {
            if (!isInitialized) return;
            
            // Capture FFT raw data
            snapshotDataFFT = new Float32Array(dataArray);

            // Capture RTA band-calculated data
            snapshotDataRTA = ISO_FREQS.map(centerFreq => {
                const ratio = Math.pow(2, 1/12);
                const lowFreq = centerFreq / ratio;
                const highFreq = centerFreq * ratio;
                const nyquist = audioCtx.sampleRate / 2;
                const lowBin = Math.max(0, Math.floor(lowFreq / nyquist * bufferLength));
                const highBin = Math.min(bufferLength - 1, Math.floor(highFreq / nyquist * bufferLength));
                
                let sum = 0;
                let count = 0;
                for (let b = lowBin; b <= highBin; b++) {
                    sum += dataArray[b];
                    count++;
                }
                let db = count > 0 ? sum / count : -100;
                if (currentWeighting === 'a') db += (A_WEIGHTS[centerFreq] || 0);
                return db;
            });

            btnCapture.innerHTML = '<span class="material-symbols-outlined">check_circle</span> SNAPSHOT_SAVED';
            btnCapture.classList.add('active');
            setTimeout(() => {
                btnCapture.innerHTML = '<span class="material-symbols-outlined">camera</span> CAPTURE_SNAPSHOT';
                btnCapture.classList.remove('active');
            }, 2000);
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            snapshotDataRTA = null;
            snapshotDataFFT = null;
        });
    }

    getDevices();
}

// --- SIGNAL GENERATOR CORE LOGIC ---
function initSignalGenerator() {
    const btnToggle = document.getElementById('btn-siggen-toggle');
    const freqSlider = document.getElementById('siggen-freq-slider');
    const freqInput = document.getElementById('siggen-freq-input');
    const gainSlider = document.getElementById('siggen-gain-slider');
    const gainVal = document.getElementById('siggen-gain-val');
    const waveBtns = document.querySelectorAll('.wave-btn');
    const freqChips = document.querySelectorAll('.freq-chip');
    const statusBadge = document.getElementById('siggen-status');
    const vuFill = document.getElementById('siggen-vu-fill');
    const meterText = document.getElementById('siggen-meter-text');
    const btnSweep = document.getElementById('btn-siggen-sweep');
    const sweepTimeInput = document.getElementById('siggen-sweep-time');
    const sweepSection = document.getElementById('siggen-sweep-section');

    let audioCtx;
    let oscillator;
    let noiseNode;
    let gainNode;
    let analyzer;
    let isPlaying = false;
    let currentWave = 'sine';
    let currentFreq = 1000;
    let currentGain = -18;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Start muted
            
            analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            
            gainNode.connect(analyzer);
            analyzer.connect(audioCtx.destination);
            
            updateVisuals();
        }
    }

    function createPinkNoise() {
        const bufferSize = 4096 * 2;
        const b = [0, 0, 0, 0, 0, 0, 0];
        const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b[0] = 0.99886 * b[0] + white * 0.0555179;
                b[1] = 0.99332 * b[1] + white * 0.0750759;
                b[2] = 0.96900 * b[2] + white * 0.1538520;
                b[3] = 0.86650 * b[3] + white * 0.3104856;
                b[4] = 0.55000 * b[4] + white * 0.5329522;
                b[5] = -0.7616 * b[5] - white * 0.0168980;
                output[i] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362;
                output[i] *= 0.11; // (roughly) compensatory gain
                b[6] = white * 0.115926;
            }
        };
        return node;
    }

    function createWhiteNoise() {
        const bufferSize = 4096;
        const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        };
        return node;
    }

    function startOutput() {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        if (currentWave === 'white' || currentWave === 'pink') {
            noiseNode = (currentWave === 'white') ? createWhiteNoise() : createPinkNoise();
            noiseNode.connect(gainNode);
        } else {
            oscillator = audioCtx.createOscillator();
            oscillator.type = currentWave;
            oscillator.frequency.setValueAtTime(currentFreq, audioCtx.currentTime);
            oscillator.connect(gainNode);
            oscillator.start();
        }

        // Soft Ramp In: 1.0 Second Linear Ramp to target volume
        const targetGain = Math.pow(10, currentGain / 20);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 1.0);
        
        isPlaying = true;
        btnToggle.classList.add('active');
        btnToggle.innerHTML = '<span class="material-symbols-outlined">stop_circle</span> DISENGAGE_OUTPUT';
        statusBadge.textContent = 'STATUS: ACTIVE';
        statusBadge.classList.add('active');
    }

    function stopOutput() {
        if (!isPlaying) return;
        
        // Soft Ramp Out
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02);
        
        setTimeout(() => {
            if (oscillator) {
                oscillator.stop();
                oscillator.disconnect();
                oscillator = null;
            }
            if (noiseNode) {
                noiseNode.disconnect();
                noiseNode = null;
            }
            isPlaying = false;
        }, 50);

        btnToggle.classList.remove('active');
        btnToggle.innerHTML = '<span class="material-symbols-outlined">power_settings_new</span> ENGAGE_OUTPUT';
        statusBadge.textContent = 'STATUS: STANDBY';
        statusBadge.classList.remove('active');
    }

    function updateVisuals() {
        if (!isPlaying) {
            vuFill.style.height = '0%';
            meterText.textContent = '-∞ dB';
            requestAnimationFrame(updateVisuals);
            return;
        }

        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const levelPercent = (avg / 255) * 100;
        
        vuFill.style.height = `${levelPercent}%`;
        
        // Map back to approximate dB for display
        const db = currentGain + (levelPercent / 10);
        meterText.textContent = `${db.toFixed(1)} dB`;

        requestAnimationFrame(updateVisuals);
    }

    function startSweep() {
        if (!isPlaying || !oscillator) {
            startOutput();
        }
        
        const duration = parseFloat(sweepTimeInput.value) || 5;
        const startTime = audioCtx.currentTime;
        const endTime = startTime + duration;
        
        // Audio Ramp
        oscillator.frequency.cancelScheduledValues(startTime);
        oscillator.frequency.setValueAtTime(20, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(20000, endTime);
        
        btnSweep.classList.add('active');
        btnSweep.innerHTML = '<span class="material-symbols-outlined">sync</span> SWEEPING...';

        // UI Sync Loop
        function updateSweepUI() {
            if (!isPlaying || audioCtx.currentTime >= endTime) {
                btnSweep.classList.remove('active');
                btnSweep.innerHTML = '<span class="material-symbols-outlined">settings_backup_restore</span> START_SWEEP';
                currentFreq = 20000;
                freqInput.value = currentFreq;
                freqSlider.value = 1;
                return;
            }
            
            // Calculate current freq for UI sync (logarithmic interpolation)
            const elapsed = audioCtx.currentTime - startTime;
            const progress = elapsed / duration;
            const minFreq = 20;
            const maxFreq = 20000;
            currentFreq = Math.round(minFreq * Math.pow(maxFreq / minFreq, progress));
            
            freqInput.value = currentFreq;
            freqSlider.value = Math.log(currentFreq / minFreq) / Math.log(maxFreq / minFreq);
            
            requestAnimationFrame(updateSweepUI);
        }
        
        updateSweepUI();
    }

    // --- Event Listeners ---

    btnToggle.addEventListener('click', () => {
        if (isPlaying) stopOutput();
        else startOutput();
    });

    // Logarithmic Frequency Mapping
    freqSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        // Map 0-1 to 20Hz - 20000Hz logarithmically
        const minFreq = 20;
        const maxFreq = 20000;
        currentFreq = Math.round(minFreq * Math.pow(maxFreq / minFreq, val));
        
        freqInput.value = currentFreq;
        if (oscillator) {
            oscillator.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.01);
        }
    });

    // Manual Frequency Input
    freqInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) return;
        if (val < 20) val = 20;
        if (val > 20000) val = 20000;
        
        currentFreq = val;
        
        // Update slider position
        const minFreq = 20;
        const maxFreq = 20000;
        const sliderVal = Math.log(currentFreq / minFreq) / Math.log(maxFreq / minFreq);
        freqSlider.value = sliderVal;

        if (oscillator) {
            oscillator.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.01);
        }
    });

    gainSlider.addEventListener('input', (e) => {
        currentGain = parseFloat(e.target.value);
        gainVal.textContent = `${currentGain} dB`;
        if (isPlaying && gainNode) {
            const targetGain = Math.pow(10, currentGain / 20);
            gainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.02);
        }
    });

    waveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newWave = btn.getAttribute('data-wave');
            if (newWave === currentWave) return;

            waveBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const wasPlaying = isPlaying;
            if (wasPlaying) stopOutput();
            
            currentWave = newWave;

            // Hide sweep for noise
            if (currentWave === 'white' || currentWave === 'pink') {
                sweepSection.style.opacity = '0.3';
                sweepSection.style.pointerEvents = 'none';
            } else {
                sweepSection.style.opacity = '1';
                sweepSection.style.pointerEvents = 'all';
            }
            
            if (wasPlaying) {
                setTimeout(startOutput, 100);
            }
        });
    });

    btnSweep.addEventListener('click', () => {
        startSweep();
    });

    freqChips.forEach(chip => {
        chip.addEventListener('click', () => {
            currentFreq = parseInt(chip.getAttribute('data-freq'));
            freqInput.value = currentFreq;
            
            // Reverse map freq to slider value
            const minFreq = 20;
            const maxFreq = 20000;
            const sliderVal = Math.log(currentFreq / minFreq) / Math.log(maxFreq / minFreq);
            freqSlider.value = sliderVal;

            if (oscillator) {
                oscillator.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.05);
            }
        });
    });
}


