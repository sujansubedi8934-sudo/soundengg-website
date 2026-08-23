const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, '..', 'assets', 'js', 'data', 'blogs');

const articles = [
  {
    id: "jbl-pro-vtx-line-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "JBL Professional VTX: Differential Drive, RBI Waveguides & Crown Power",
    excerpt: "An insider look at JBL's flagship touring system. Explore the VTX A-Series (A12, A8, A6), Radiation Boundary Integrators (RBI), LAC-3 prediction, and Crown I-Tech HD touring racks.",
    readTime: "18 MIN READ",
    seoKeywords: [
        "JBL Professional VTX line array review",
        "JBL VTX A12 A8 A6 V25-II",
        "Radiation Boundary Integrator RBI JBL",
        "Differential Drive neodymium transducers JBL",
        "Line Array Calculator LAC-3 Crown I-Tech HD",
        "Performance Manager JBL audio guide"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>JBL Professional VTX: Differential Drive, RBI Waveguides & Crown Power</h1>
            <p class="article-meta">By Sujan Subedi | 18 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>From Woodstock in 1969 to the world's largest modern touring festivals, <strong>JBL Professional</strong> has been a cornerstone of American sound reinforcement. With the launch of the <strong>VTX A-Series (A12, A8, A6)</strong>, JBL re-engineered its acoustic architecture from the ground up, pairing world-class transducer physics with one of the fastest, safest rigging systems on the road.</p>

            <h2>1. Core Proprietary Technologies</h2>

            <h3>A. Radiation Boundary Integrator (RBI)</h3>
            <p>The patented **RBI (Radiation Boundary Integrator)** waveguide mounts the high-frequency compression drivers directly within the mid-range horn acoustic boundary. It uses tuned acoustic perforations to let mid-frequency energy pass through smoothly while acting as a seamless waveguide for the high frequencies. This completely eliminates horn-edge diffraction artifacts and provides rock-solid horizontal directivity ($90^\circ$ or $120^\circ$).</p>

            <h3>B. Dual-Voice-Coil Differential Drive Transducers</h3>
            <p>JBL's proprietary **Differential Drive** technology utilizes two separate voice coils and magnetic gaps per driver. This delivers dramatically increased thermal heat dissipation, ultra-low power compression, and cuts magnet weight in half compared to conventional ceramic drivers.</p>

            <h3>C. Auto-Locking Quick Rigging</h3>
            <p>Touring crew fatigue is a major factor on multi-city runs. The VTX A-Series features an automatic locking suspension mechanism: you preset your splay angles on the ground cart, lift the array with a single motor, and the pins automatically lock into place at the precise target degree.</p>

            <h2>2. The JBL VTX Product Catalog & Lineup</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Acoustic Specs & Drivers</th>
                        <th>Max Output & Weight</th>
                        <th>Recommended Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>JBL VTX A12</strong></td>
                        <td>Large-Format Flagship (2x 12" LF, 4x 5.5" MF, 3x 2" HF)</td>
                        <td>146 dB SPL | 60.8 kg (134 lbs)</td>
                        <td>Stadiums, Arenas, Major Festivals</td>
                        <td><a href="https://jblpro.com/en/products/vtx-a12" target="_blank" rel="noopener">JBL VTX A12 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>JBL VTX A8</strong></td>
                        <td>Compact Touring Workhorse (2x 8" LF, 4x 3.5" MF, 2x 2" HF)</td>
                        <td>139 dB SPL | 29.5 kg (65 lbs)</td>
                        <td>Theatres, Arenas, High-End Corporate</td>
                        <td><a href="https://jblpro.com/en/products/vtx-a8" target="_blank" rel="noopener">JBL VTX A8 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>JBL VTX A6</strong></td>
                        <td>Sub-Compact Line Array (2x 6.5" LF, 1x 3" HF)</td>
                        <td>134 dB SPL | 18.4 kg (40 lbs)</td>
                        <td>Under-Balcony, Front-Fills, Small Clubs</td>
                        <td><a href="https://jblpro.com/en/products/vtx-a6" target="_blank" rel="noopener">JBL VTX A6 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>JBL VTX B28</strong></td>
                        <td>Arrayable Subwoofer (2x 18" 2288H Differential Drive)</td>
                        <td>141 dB SPL | Down to 25 Hz</td>
                        <td>Ground / Flown Cardioid Sub Arrays</td>
                        <td><a href="https://jblpro.com/en/products/vtx-b28" target="_blank" rel="noopener">JBL VTX B28 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Amplification & Processing: Crown I-Tech HD & Performance Manager</h2>
            <ul>
                <li><strong>Crown I-Tech 4x3500HD / 12000HD:</strong> Touring-grade multi-channel Class-I amplifiers with BSS Omnidrive HD DSP processing and LevelMAX limiters.</li>
                <li><strong>JBL LAC-3 (Line Array Calculator 3):</strong> Fast acoustic and mechanical prediction software with direct rigging safety verification.</li>
                <li><strong>Performance Manager:</strong> Real-time networked control suite for configuring arrays, monitoring loads, and testing transducer health over HiQnet.</li>
            </ul>

            <p><em>(System Tech Tip: Calculate line array delay offsets with our interactive <a href="../app.html#delay" class="text-primary font-bold hover:underline">Speaker Delay Calculator</a>).</em></p>
        </div>
    `
  },
  {
    id: "rcf-tt-audio-gtx-line-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "TT+ Audio & RCF: GTX Series, FiRPHASE & The Italian Powerhouse",
    excerpt: "Discover the powerhouse engineering of RCF and TT+ Audio. Explore the flagship GTX 12, TTL 33-A, 0° linear phase FiRPHASE processing, XPS 16K amplifiers, and RDNet 5.0.",
    readTime: "17 MIN READ",
    seoKeywords: [
        "RCF TT+ Audio GTX 12 line array review",
        "RCF FiRPHASE linear phase audio technology",
        "TT+ Audio XPS 16K amplifier DSP",
        "RDNet 5.0 networked audio management",
        "RCF HDL 30-A TTL 33-A touring sound"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>TT+ Audio & RCF: GTX Series, FiRPHASE & The Italian Powerhouse</h1>
            <p class="article-meta">By Sujan Subedi | 17 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Based in Reggio Emilia, Italy, <strong>RCF</strong> is one of the rare pro-audio titans that manufactures every single component—from raw voice coils and neodymium magnets to wooden cabinetry and digital DSP—entirely in-house. With the launch of their premium touring division, <strong>TT+ Audio</strong>, and the flagship <strong>GTX Series</strong>, the Italian company delivers world-class stadium-grade audio performance.</p>

            <h2>1. Proprietary Innovations: FiRPHASE 0° Linear Phase Processing</h2>
            <p>Traditional crossover filters introduce non-linear phase shifts that smear audio transients and create comb filtering when cabinets couple. RCF's proprietary **FiRPHASE** DSP algorithms use advanced finite impulse response filters to achieve **true $0^\circ$ linear phase response across the entire audio bandwidth** without adding excessive system latency.</p>
            <ul>
                <li><strong>The Audible Benefit:</strong> Vocals sound intimate and centered, drum transients hit with instant percussive attack, and stereo imaging stays wide and transparent.</li>
            </ul>

            <h2>2. TT+ Audio & RCF Lineup Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Acoustic Architecture</th>
                        <th>Max SPL & Coverage</th>
                        <th>Ideal Venue / Application</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>TT+ Audio GTX 12</strong></td>
                        <td>Large-Format Flagship (2x 12" Neodymium LF, 4x 6" MF, 2x 3" HF)</td>
                        <td>148 dB SPL | 90° H Directivity</td>
                        <td>Stadiums, Major Touring Festivals</td>
                        <td><a href="https://www.ttaudio.com/en/product/gtx-12" target="_blank" rel="noopener">TT+ Audio GTX 12 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>TT+ Audio GTX 10</strong></td>
                        <td>Mid-Format Touring Workhorse (2x 10" LF, 1x 4" Diaphragm HF)</td>
                        <td>143 dB SPL | 110° H</td>
                        <td>Arenas, Concert Theatres, Shed Tours</td>
                        <td><a href="https://www.ttaudio.com/en/product/gtx-10" target="_blank" rel="noopener">TT+ Audio GTX 10 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>RCF HDL 30-A</strong></td>
                        <td>Active 2-Way Touring Workhorse (2x 10" LF, 1x 4" HF)</td>
                        <td>137 dB SPL | 2200W Onboard Class-D</td>
                        <td>Mid-Sized Gigs, Corporate, Regional Tours</td>
                        <td><a href="https://www.rcf.it/en/products/product-detail/hdl-30-a" target="_blank" rel="noopener">RCF HDL 30-A Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>TT+ Audio GTS 29</strong></td>
                        <td>Touring Subwoofer (2x 19" Ultra-Long Excursion)</td>
                        <td>146 dB SPL | Down to 25 Hz</td>
                        <td>Extreme Low-Frequency Touring Array</td>
                        <td><a href="https://www.ttaudio.com/en/product/gts-29" target="_blank" rel="noopener">TT+ Audio GTS 29 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Power & Control: XPS 16K & RDNet 5.0</h2>
            <ul>
                <li><strong>XPS 16K Amplifier:</strong> 4-channel powerhouse delivering **4x 4,000 W at 2.7 ohms** with 40-bit floating-point 96 kHz DSP and dual redundant Dante inputs.</li>
                <li><strong>RDNet 5.0:</strong> Comprehensive network platform providing real-time speaker telemetry, impedance monitoring, inclinometer angles, and EQ tuning per box.</li>
            </ul>

            <p><em>(Check out our live <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA Spectrogram Tool</a> to monitor acoustic linearity across your line arrays).</em></p>
        </div>
    `
  },
  {
    id: "electro-voice-dynacord-line-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "Electro-Voice & Dynacord: X-Line Advance, Hydra Wavefront & TGX Amps",
    excerpt: "Engineering breakdown of the Electro-Voice X-Line Advance (X1, X2), Hydra plane-wave generators, Dynacord TGX/IPX multi-channel touring amplifiers, and SONICUE software.",
    readTime: "17 MIN READ",
    seoKeywords: [
        "Electro-Voice line array guide X-Line Advance",
        "Electro-Voice X1 X2 EVA line array",
        "Hydra plane wave generator Electro-Voice",
        "Dynacord TGX20 TGX10 amplifier DSP",
        "SONICUE sound system software tutorial"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>Electro-Voice & Dynacord: X-Line Advance, Hydra Wavefront & TGX Amps</h1>
            <p class="article-meta">By Sujan Subedi | 17 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>For nearly a century, <strong>Electro-Voice (EV)</strong> has been a cornerstone of American audio engineering. Together with its sister brand <strong>Dynacord</strong>, EV created the <strong>X-Line Advance (X1 and X2)</strong> family, combining compact box dimensions with massive acoustic output and bulletproof German amplification.</p>

            <h2>1. Core Acoustic Technologies</h2>

            <h3>A. Hydra Plane-Wave Generators</h3>
            <p>The high-frequency section of the X-Line Advance uses the patented **Hydra Wavefront Generator**. It converts high-frequency energy from multiple compression drivers into a continuous, perfectly phase-coherent isophasic planar wavefront, completely avoiding phase cancellation between adjacent array boxes.</p>

            <h3>B. Integrated Rigging Structure (IRS)</h3>
            <p>A captive, pin-less rigging system allows a single system technician to deploy an entire 12-box array in minutes, cutting festival changeover times significantly.</p>

            <h2>2. Electro-Voice System Catalog & Lineup</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Transducers & Specs</th>
                        <th>Max Output & Directivity</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Electro-Voice X2-212</strong></td>
                        <td>High-Performance Flagship (1x 12" DVN3125 LF, 2x 3" ND6A HF)</td>
                        <td>146 dB SPL | 90° or 120° H</td>
                        <td>Arenas, Stadiums, Major Concert Venues</td>
                        <td><a href="https://products.electrovoice.com/na/en/x2-212-90" target="_blank" rel="noopener">EV X2-212 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Electro-Voice X1-212</strong></td>
                        <td>Compact Touring Workhorse (1x 12" SMX2121 LF, 2x 2" ND2R HF)</td>
                        <td>143 dB SPL | 90° or 120° H</td>
                        <td>Theatres, Houses of Worship, Clubs</td>
                        <td><a href="https://products.electrovoice.com/na/en/x1-212-90" target="_blank" rel="noopener">EV X1-212 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Electro-Voice X12-128</strong></td>
                        <td>Dual 18" Subwoofer (2x 18" DVF4180 High-Output LF)</td>
                        <td>147 dB SPL | Down to 27 Hz</td>
                        <td>Sub-Bass Touring Extension</td>
                        <td><a href="https://products.electrovoice.com/na/en/x12-128" target="_blank" rel="noopener">EV X12-128 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Amplification & Processing: Dynacord TGX & SONICUE</h2>
            <ul>
                <li><strong>Dynacord TGX20 / TGX10:</strong> 4-channel DSP powerhouse delivering up to **4x 5,000 W** with Dante audio networking, OMNEO, and ultra-low latency FIR filters.</li>
                <li><strong>SONICUE Sound System Software:</strong> Intuitive multi-touch ecosystem for fast venue mapping, amplifier monitoring, and tuning.</li>
            </ul>

            <p><em>(System Tech Tip: Check audio line-levels and speaker polarities using our <a href="../app.html#siggen" class="text-primary font-bold hover:underline">Audio Signal Generator</a>).</em></p>
        </div>
    `
  },
  {
    id: "qsc-audio-qsys-line-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "QSC Audio: L Class, WideLine & The Q-SYS Ecosystem on Stage",
    excerpt: "Explore QSC's modern line array lineup: the intelligent active L Class (LA112, LA108), the classic WideLine series, RapidDeploy rigging, and seamless Q-SYS cloud integration.",
    readTime: "16 MIN READ",
    seoKeywords: [
        "QSC Audio line array L Class LA112 LA108",
        "QSC WideLine-10 WideLine-8 review",
        "Q-SYS ecosystem live sound integration",
        "QSC LEAF Length-Equalized Acoustic Flare",
        "active networked line array QSC"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>QSC Audio: L Class, WideLine & The Q-SYS Ecosystem on Stage</h1>
            <p class="article-meta">By Sujan Subedi | 16 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>For decades, Costa Mesa's <strong>QSC</strong> has been synonymous with bulletproof power amplifiers and versatile loudspeakers. With the introduction of the intelligent active <strong>L Class (LA112 and LA108)</strong> and the proven <strong>WideLine series</strong>, QSC combines active onboard DSP with direct network integration into the world-leading <strong>Q-SYS audio ecosystem</strong>.</p>

            <h2>1. Core Innovations: LEAF Waveguide & RapidDeploy Rigging</h2>
            <ul>
                <li><strong>QSC LEAF (Length-Equalized Acoustic Flare) Waveguide:</strong> Delivers an exceptionally flat, phase-aligned acoustic wavefront across wide audience coverage areas.</li>
                <li><strong>QSC RapidDeploy:</strong> Allows single-person deployment without secondary pin handling, automatically reporting array splay angles to the onboard DSP.</li>
                <li><strong>Acoustic Intelligence (AWARE):</strong> Boxes automatically discover their neighbors in the array, calculating array optimization curves automatically without requiring an external laptop.</li>
            </ul>

            <h2>2. QSC Line Array Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Configuration & Power</th>
                        <th>Max Output & Weight</th>
                        <th>Target Application</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>QSC LA112</strong></td>
                        <td>Active 2-Way (1x 12" LF, 2x 1.75" HF | 2400W Class-D)</td>
                        <td>136 dB SPL | 21.4 kg (47 lbs)</td>
                        <td>Live Venues, Corporate, Touring Theatres</td>
                        <td><a href="https://www.qsc.com/live-sound/products/loudspeakers/powered-loudspeakers/l-class/la112/" target="_blank" rel="noopener">QSC LA112 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>QSC LA108</strong></td>
                        <td>Active 2-Way (1x 8" LF, 2x 1.75" HF | 1300W Class-D)</td>
                        <td>134 dB SPL | 13.7 kg (30 lbs)</td>
                        <td>Small Theatres, Houses of Worship, Corporate</td>
                        <td><a href="https://www.qsc.com/live-sound/products/loudspeakers/powered-loudspeakers/l-class/la108/" target="_blank" rel="noopener">QSC LA108 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>QSC WideLine-10</strong></td>
                        <td>Touring Compact (2x 10" LF, 1x 3" Diaphragm HF)</td>
                        <td>135 dB SPL | 140° Extra-Wide H</td>
                        <td>Ballrooms, Wide Theatres, Concert Halls</td>
                        <td><a href="https://www.qsc.com/live-sound/products/loudspeakers/line-array-loudspeakers/wideline-10/" target="_blank" rel="noopener">QSC WideLine-10 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>QSC LS118</strong></td>
                        <td>Active Subwoofer (1x 18" Direct-Radiating | 3700W Class-D)</td>
                        <td>136 dB SPL | Down to 35 Hz</td>
                        <td>Sub-Bass Extension for L Class Systems</td>
                        <td><a href="https://www.qsc.com/live-sound/products/loudspeakers/powered-loudspeakers/l-class/ls118/" target="_blank" rel="noopener">QSC LS118 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Network & DSP Architecture: Q-SYS & Dante</h2>
            <p>The L Class features onboard dual Dante network ports, allowing seamless multi-room routing, system diagnostics, and emergency paging integration directly through <strong>Q-SYS Designer</strong>.</p>

            <p><em>(Check out our <a href="../app.html#pinouts" class="text-primary font-bold hover:underline">Audio Pinout Tool</a> to verify balanced audio and network connections).</em></p>
        </div>
    `
  },
  {
    id: "coda-audio-planar-wave-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "CODA Audio: Planar Wave Drivers, Sensor Control & LINUS Amplification",
    excerpt: "Discover the revolutionary German transducer technology behind CODA Audio: patented DDP dual-diaphragm planar wave drivers, Sensor-Controlled subwoofers, and ultra-compact AiRAY power.",
    readTime: "17 MIN READ",
    seoKeywords: [
        "CODA Audio line array AiRAY ViRAY CiRAY",
        "DDP dual diaphragm planar wave driver CODA",
        "Sensor Controlled Subwoofer SCV-F CODA Audio",
        "LINUS14D LINUS12C amplifier DSP",
        "CODA System Optimizer prediction software"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>CODA Audio: Planar Wave Drivers, Sensor Control & LINUS Amplification</h1>
            <p class="article-meta">By Sujan Subedi | 17 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>While many speaker companies buy off-the-shelf drivers and design wooden boxes around them, Hannover's <strong>CODA Audio</strong> manufactures its own proprietary transducers from the atomic level up. By eliminating conventional dome compression drivers, CODA packs large-format stadium power into enclosures that weigh half as much as the competition.</p>

            <h2>1. Breakthrough Transducer Innovations</h2>

            <h3>A. Patented Dual Diaphragm Planar Wave Drivers (DDP)</h3>
            <p>Traditional compression drivers suffer from high intermodulation distortion and phase breakup above 8 kHz. CODA's concentric **DDP driver** features two separate annular diaphragms acting as a two-way coaxial system that outputs a truly flat, isophasic planar wavefront with virtually zero distortion up to 22 kHz.</p>

            <h3>B. Sensor-Controlled Subwoofers (SC Technology)</h3>
            <p>In CODA's subwoofers, a specialized optical/magnetic sensor on the voice coil reads actual cone displacement in real time, feeding a closed feedback loop into the LINUS DSP amplifier. This completely eliminates non-linear port distortion, power compression, and group delay blur.</p>

            <h2>2. CODA Audio Product Lineup & Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Acoustic Specs & Drivers</th>
                        <th>Max Output & Weight</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>CODA AiRAY</strong></td>
                        <td>Ultra-Compact Large-Format (2x 12" LF, 2x 6" DDP HF)</td>
                        <td>148 dB SPL | 40 kg (88 lbs!)</td>
                        <td>Stadiums, Arenas, Major Festivals</td>
                        <td><a href="https://codaaudio.com/speakers/airay/" target="_blank" rel="noopener">CODA AiRAY Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>CODA ViRAY</strong></td>
                        <td>Compact Touring Workhorse (2x 8" LF, 1x 6" DDP HF)</td>
                        <td>142 dB SPL | 25 kg (55 lbs)</td>
                        <td>Theatres, Concert Halls, Arenas</td>
                        <td><a href="https://codaaudio.com/speakers/viray/" target="_blank" rel="noopener">CODA ViRAY Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>CODA CiRAY</strong></td>
                        <td>Mid-Size Array (2x 10" LF, 1x 6" DDP HF)</td>
                        <td>144 dB SPL | 33 kg</td>
                        <td>Concert Tours, Festivals, Theatres</td>
                        <td><a href="https://codaaudio.com/speakers/ciray/" target="_blank" rel="noopener">CODA CiRAY Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>CODA SCP-F / SCV-F</strong></td>
                        <td>Sensor-Controlled Subwoofer (2x 18" Sensor LF)</td>
                        <td>146 dB SPL | Down to 25 Hz (Zero group delay)</td>
                        <td>Cardioid / Omni Touring Sub-Bass</td>
                        <td><a href="https://codaaudio.com/speakers/scp/" target="_blank" rel="noopener">CODA SCP Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Power & Control: LINUS14D & System Optimizer</h2>
            <ul>
                <li><strong>LINUS14D:</strong> 4-channel Class-D amplifier delivering **4x 3,500 W at 4 ohms** with 96 kHz SHARC DSP, Sensor-Control comparator inputs, and Dante audio networking.</li>
                <li><strong>CODA System Optimizer:</strong> High-speed 3D electro-acoustic prediction suite with continuous real-time spline calculation.</li>
            </ul>

            <p><em>(Check out our interactive <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">Subwoofer Array Alignment Tool</a> to optimize cardioid bass coverage).</em></p>
        </div>
    `
  }
];

articles.forEach(article => {
  const filePath = path.join(blogsDir, `${article.id}.js`);
  const jsContent = `window.soundEnggBlogs = window.soundEnggBlogs || [];\nwindow.soundEnggBlogs.push(${JSON.stringify(article, null, 4)});\n`;
  fs.writeFileSync(filePath, jsContent, 'utf8');
  console.log(`✓ Generated: assets/js/data/blogs/${article.id}.js`);
});

