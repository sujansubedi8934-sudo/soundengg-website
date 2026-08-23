const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, '..', 'assets', 'js', 'data', 'blogs');

const articles = [
  {
    id: "eaw-adaptive-performance-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "EAW (Eastern Acoustic Works): Anya, Anna & The Adaptive Steering Revolution",
    excerpt: "Explore the groundbreaking digital beam steering technology behind EAW Adaptive Systems: Anya, Anna, Otto subwoofers, Resolution 2 prediction, and zero-splay straight-hang physics.",
    readTime: "18 MIN READ",
    seoKeywords: [
        "EAW line array guide Anya Anna Otto",
        "EAW Adaptive Performance beam steering",
        "Resolution 2 software EAW tutorial",
        "EAW NTX210L active line array",
        "zero splay straight hang line array EAW"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>EAW (Eastern Acoustic Works): Anya, Anna & The Adaptive Steering Revolution</h1>
            <p class="article-meta">By Sujan Subedi | 18 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>For over 40 years, Whitinsville, Massachusetts-based <strong>Eastern Acoustic Works (EAW)</strong> has pushed boundary-breaking loudspeaker design—from the iconic KF850 that defined 90s touring to the revolutionary <strong>ADAPTive Systems family (Anya, Anna, and Otto)</strong>.</p>
            <p>Instead of physically curving an array using mechanical splay pins, EAW Adaptive systems hang in a <strong>completely straight vertical line</strong>, using hundreds of individually powered and DSP-controlled transducers to electronically steer and shape the 3D acoustic wavefront in real time.</p>

            <h2>1. The Engineering Magic: Adaptive Performance</h2>
            <ul>
                <li><strong>No Mechanical J-Curvature:</strong> Every box hangs straight ($0^\circ$ splay). This allows arrays to fit inside tight venue sightlines and fly right up against stadium roofs.</li>
                <li><strong>Real-Time Electronic Beam Steering:</strong> Using <strong>EAW Resolution 2</strong> software, engineers draw the venue. The software calculates exact FIR phase and amplitude algorithms to steer coverage anywhere from $+10^\circ$ up to $-70^\circ$ down without moving the physical array!</li>
                <li><strong>Dynamic Re-Optimization During Shows:</strong> If the balcony opens mid-show or rain moves the outdoor crowd, the engineer simply drags the coverage plane in Resolution 2, and the array adapts coverage instantly without lowering the PA.</li>
            </ul>

            <h2>2. EAW Product Catalog & Lineup</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Architecture & Transducers</th>
                        <th>Max Output & Channels</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>EAW Anya</strong></td>
                        <td>3-Way Full-Range Adaptive (2x 15" LF, 6x 5" MF, 14x 1" HF | 22 Amp Channels)</td>
                        <td>>150 dB SPL Peak | Straight Hang</td>
                        <td>Stadiums, Mega Arenas, Large Festivals</td>
                        <td><a href="https://eaw.com/products/anya/" target="_blank" rel="noopener">EAW Anya Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>EAW Anna</strong></td>
                        <td>Medium-Format Adaptive (2x 10" LF, 4x 5" MF, 8x 1" HF | 14 Amp Channels)</td>
                        <td>144 dB SPL | 100° H Electronic Steering</td>
                        <td>Arenas, Theatres, Shed Tours</td>
                        <td><a href="https://eaw.com/products/anna/" target="_blank" rel="noopener">EAW Anna Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>EAW Otto</strong></td>
                        <td>Adaptive Subwoofer (2x 18" Offset Woofers | 2 Amp Channels per box)</td>
                        <td>141 dB SPL | Real-Time Steerable Lows</td>
                        <td>Cardioid / Hypercardioid Low-End Control</td>
                        <td><a href="https://eaw.com/products/otto/" target="_blank" rel="noopener">EAW Otto Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>EAW NTX210L</strong></td>
                        <td>Articulated Active Line Array (2x 10" LF, 2x 1.4" HF | OptiLogic Smart Rigging)</td>
                        <td>140 dB SPL | Dante Onboard</td>
                        <td>Regional Touring, Corporate, Concert Halls</td>
                        <td><a href="https://eaw.com/products/ntx210l/" target="_blank" rel="noopener">EAW NTX210L Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Networked DSP & Resolution 2 Integration</h2>
            <p>Every Adaptive module features integrated discrete Class-D amplifiers, FPGA processing, Dante audio networking, and health telemetry. All diagnostic data streams live over standard Cat6 cabling into <strong>Resolution 2</strong>.</p>

            <p><em>(System Tech Tip: Check audio line-levels and speaker polarities using our <a href="../app.html#siggen" class="text-primary font-bold hover:underline">Audio Signal Generator</a>).</em></p>
        </div>
    `
  },
  {
    id: "nexo-stm-geom-line-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "Nexo: STM Scalability, GEO M & Hyperbolic Wavesource Engineering",
    excerpt: "Inside France's premier touring loudspeaker brand. Explore Nexo's Scale-Through-Modularity (STM), GEO M Series, patented HRW waveguides, and NXAMPmk2 TDcontrollers.",
    readTime: "17 MIN READ",
    seoKeywords: [
        "Nexo line array guide STM GEO M",
        "Nexo STM M46 M28 B112 modular system",
        "Nexo GEO M12 M6 compact line array",
        "Hyperbolic Reflective Wavesource HRW Nexo",
        "NXAMP4x4mk2 TDcontroller DSP amplifier"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>Nexo: STM Scalability, GEO M & Hyperbolic Wavesource Engineering</h1>
            <p class="article-meta">By Sujan Subedi | 17 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Founded in Paris and now part of the Yamaha family, <strong>Nexo</strong> has spent over four decades developing innovative line source geometry. With the invention of the patented <strong>HRW (Hyperbolic Reflective Wavesource)</strong> and the groundbreaking <strong>STM (Scale Through Modularity)</strong> concept, Nexo offers exceptional flexibility for rental companies worldwide.</p>

            <h2>1. Core Acoustic Innovations</h2>

            <h3>A. Hyperbolic Reflective Wavesource (HRW)</h3>
            <p>The HRW converts curved acoustic wavefronts into flat, virtual planar wavefronts using internal parabolic reflective surfaces. This ensures razor-sharp high-frequency phase alignment across adjacent cabinets with zero acoustic smearing.</p>

            <h3>B. STM: Scale Through Modularity</h3>
            <p>Instead of forcing rental companies to buy different speaker systems for clubs, arenas, and stadiums, Nexo STM allows you to build customized arrays combining Main (M46/M28), Bass (B112), and Sub (S118) modules side-by-side or stacked vertically in any configuration.</p>

            <h2>2. Nexo Product Lineup & System Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Acoustic Configuration</th>
                        <th>Max Output & Weight</th>
                        <th>Ideal Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Nexo STM M46</strong></td>
                        <td>Modular Main Cabinet (4x 6.5" LF, 4x 2.5" HF HRW)</td>
                        <td>145 dB SPL | 55 kg</td>
                        <td>Stadiums, Large Arenas, Festivals</td>
                        <td><a href="https://www.nexo-sa.com/products/stm-m46/" target="_blank" rel="noopener">Nexo STM M46 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Nexo STM M28</strong></td>
                        <td>Omni-Purpose Modular Main (2x 8" LF, 4x 2.5" HF)</td>
                        <td>141 dB SPL | 37 kg</td>
                        <td>Theatres, Touring Down-Fill, Medium Gigs</td>
                        <td><a href="https://www.nexo-sa.com/products/stm-m28/" target="_blank" rel="noopener">Nexo STM M28 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Nexo GEO M12</strong></td>
                        <td>High-Output Compact Array (1x 12" LF, 1x 3" HF)</td>
                        <td>140 dB SPL | 34 kg</td>
                        <td>Live Theatres, Shed Tours, Concert Halls</td>
                        <td><a href="https://www.nexo-sa.com/products/geo-m12/" target="_blank" rel="noopener">Nexo GEO M12 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Nexo GEO M6</strong></td>
                        <td>Ultra-Compact Micro Array (1x 6.5" LF, 1x 1" HF)</td>
                        <td>127 dB SPL | 9.7 kg</td>
                        <td>Corporate, Under-Balcony, Speech/Houses of Worship</td>
                        <td><a href="https://www.nexo-sa.com/products/geo-m6/" target="_blank" rel="noopener">Nexo GEO M6 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Nexo RS18 / MSUB18</strong></td>
                        <td>Ray Sub / Flying Subwoofer (2x 18" Neodymium LF)</td>
                        <td>143 dB SPL | Down to 31 Hz</td>
                        <td>Omni / Cardioid Touring Low-End</td>
                        <td><a href="https://www.nexo-sa.com/products/rs18/" target="_blank" rel="noopener">Nexo RS18 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Amplification & Processing: NXAMPmk2 TDcontrollers</h2>
            <ul>
                <li><strong>NXAMP4x4mk2 / NXAMP4x2mk2:</strong> 4-channel powerhouses delivering up to **4x 4,500 W into 2 ohms** with integrated dual multicore DSP, Dante/AES inputs, and color touchscreen management.</li>
                <li><strong>NS-1 Simulation & NeMo Remote:</strong> Comprehensive 3D simulation software and iOS/macOS network monitoring.</li>
            </ul>

            <p><em>(System Tech Tip: Check temperature-compensated delay settings with our web-based <a href="../app.html#delay" class="text-primary font-bold hover:underline">Time Delay Calculator</a>).</em></p>
        </div>
    `
  },
  {
    id: "pk-sound-robotic-line-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "PK Sound: Robotic Remote Directivity & The Actuated Wavefront Era",
    excerpt: "How PK Sound automated line array rigging. Explore the robotic multi-axis variable directivity in Trinity Black and T10, PK .toolkit software, and on-the-fly coverage adjustments.",
    readTime: "17 MIN READ",
    seoKeywords: [
        "PK Sound robotic line array Trinity Black T10",
        "remote variable directivity robotic line array",
        "PK Sound T218 sub PK .toolkit tutorial",
        "Milan AVB active robotic line array PK Sound",
        "electronic festivals PK Sound bass"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>PK Sound: Robotic Remote Directivity & The Actuated Wavefront Era</h1>
            <p class="article-meta">By Sujan Subedi | 17 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Hailing from Calgary, Canada, <strong>PK Sound</strong> became a legend in the electronic and bass music festival scene (Excision, Lost Lands, Bass Canyon) before conquering stadium rock and arena tours. PK Sound's crowning breakthrough is the introduction of **Robotic Multi-Axis Variable Directivity**.</p>

            <h2>1. The Robotic Directivity Breakthrough</h2>
            <p>In traditional line arrays, if you need to adjust horizontal coverage or vertical splay angles, the sound crew must lower the entire 3-ton array to the stage, pull pins manually, and re-fly the rig. In the **Trinity Black and T10**, every cabinet contains internal high-torque robotic actuators.</p>
            <ul>
                <li><strong>Remote Horizontal Directivity (60° to 120° in 5° steps):</strong> Adjust the horizontal flare of individual boxes from your FOH laptop via <strong>PK .toolkit</strong> while the array is in the air.</li>
                <li><strong>Remote Vertical Splay (0.1° resolution):</strong> Physically curve or flatten the array mechanically while listening from the audience plane in real time!</li>
            </ul>

            <h2>2. PK Sound Product Catalog & Lineup</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Architecture & Actuators</th>
                        <th>Max Output & Power</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>PK Trinity Black</strong></td>
                        <td>Large-Format Robotic (2x 12" LF, 4x 6.5" MF, 2x 4" HF | 6000W 4-ch Class-D)</td>
                        <td>149.3 dB SPL Peak | Robotic Multi-Axis</td>
                        <td>Major EDM Festivals, Stadiums, Global Arenas</td>
                        <td><a href="https://pksound.live/products/trinity-black" target="_blank" rel="noopener">PK Trinity Black Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>PK T10</strong></td>
                        <td>Medium Robotic Array (2x 10" LF, 1x 4" Coaxial MF/HF | 3000W Class-D)</td>
                        <td>144.5 dB SPL | Robotic Variable H/V</td>
                        <td>Arenas, Concert Theatres, Festival Side-Hangs</td>
                        <td><a href="https://pksound.live/products/t10" target="_blank" rel="noopener">PK T10 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>PK T218 Subwoofer</strong></td>
                        <td>Intelligent Sub-Bass (2x 18" Neodymium | 4000W Class-D)</td>
                        <td>144.1 dB SPL | Down to 25 Hz (Cardioid / Omni)</td>
                        <td>High-Impact Sub-Bass Touring Reinforcement</td>
                        <td><a href="https://pksound.live/products/t218" target="_blank" rel="noopener">PK T218 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Network, DSP & PK .toolkit</h2>
            <p>All PK systems are active, self-powered, and network-native using <strong>Milan AVB</strong> audio streaming with analog backup. System technicians use **PK .toolkit** for automated 3D modeling, auto-discovery of array elements, and live robotic aiming.</p>

            <p><em>(Check out our interactive <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">Subwoofer Array Alignment Tool</a> to optimize cardioid bass coverage).</em></p>
        </div>
    `
  },
  {
    id: "clair-brothers-truefit-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "Clair Brothers: C12 TrueFit, Custom Continuous Waveguides & Arena Heritage",
    excerpt: "The engineering behind the world's most legendary touring production company. Explore Clair Brothers' C12-TrueFit, continuously variable custom waveguides, and Lake processing.",
    readTime: "17 MIN READ",
    seoKeywords: [
        "Clair Brothers line array C12 C8 TrueFit",
        "Clair Brothers custom continuously variable waveguide",
        "Clair Global touring sound heritage",
        "Lake processing Clair Brothers amplification",
        "i212 i218 line array review"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>Clair Brothers: C12 TrueFit, Custom Continuous Waveguides & Arena Heritage</h1>
            <p class="article-meta">By Sujan Subedi | 17 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>From the Rolling Stones, Queen, and U2 to modern global stadium tours, <strong>Clair Brothers (Clair Global)</strong> is the titan that pioneered modern concert sound reinforcement in Lititz, Pennsylvania. With their proprietary manufacturing division, Clair Brothers created the **C12-TrueFit and C8-TrueFit** systems, delivering custom continuously variable horizontal waveguides tailored to the exact architecture of each venue.</p>

            <h2>1. The TrueFit Custom Waveguide Innovation</h2>
            <p>Most line array manufacturers offer fixed horizontal coverage ($90^\circ$ or $120^\circ$). In asymmetric venues or wide arenas, this results in high-frequency energy hitting side walls or leaving coverage gaps. Clair's **TrueFit Technology** creates 3D CNC-machined wooden waveguides with continuously variable horizontal flare tailored to the exact geometry of the room, ensuring perfectly uniform acoustic coverage.</p>

            <h2>2. Clair Brothers Product Catalog & Lineup</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Architecture & Transducers</th>
                        <th>Max Output & Coverage</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Clair C12-TrueFit / C12-M</strong></td>
                        <td>Large-Format Flagship (2x 12" LF, 2x 3.5" MF, 2x 1.4" HF)</td>
                        <td>145 dB SPL | Continuously Variable TrueFit H</td>
                        <td>Arenas, Stadiums, Performing Arts Centers</td>
                        <td><a href="https://clairmfg.com/products/c12-truefit/" target="_blank" rel="noopener">Clair C12 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Clair C8-TrueFit / C8-M</strong></td>
                        <td>Mid-Size Touring Array (2x 8" LF, 2x 2.5" MF, 2x 1.4" HF)</td>
                        <td>139 dB SPL | Custom TrueFit Waveguide</td>
                        <td>Theatres, Concert Halls, Shed Tours</td>
                        <td><a href="https://clairmfg.com/products/c8-truefit/" target="_blank" rel="noopener">Clair C8 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Clair i218 Subwoofer</strong></td>
                        <td>Touring Subwoofer (2x 18" Long-Excursion LF)</td>
                        <td>144 dB SPL | Down to 28 Hz</td>
                        <td>Flown & Ground-Stacked Sub-Bass Reinforcement</td>
                        <td><a href="https://clairmfg.com/products/i218-m/" target="_blank" rel="noopener">Clair i218 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Amplification & Processing: Lake & Lab Gruppen</h2>
            <p>Clair systems are powered by high-performance <strong>Lab Gruppen PLM+ Series</strong> touring racks loaded with genuine <strong>Lake Processing</strong> (Mesa and Contour EQ, Linear Phase Crossovers, and Dante networking).</p>

            <p><em>(Monitor Engineers: Check your stage feedback frequencies with our <a href="../app.html#rta" class="text-primary font-bold hover:underline">Real-Time Analyzer Tool</a>).</em></p>
        </div>
    `
  },
  {
    id: "alcons-audio-pro-ribbon-arrays",
    category: "arrays",
    categoryLabel: "LINE ARRAYS",
    title: "Alcons Audio: Pro-Ribbon Transducers & Zero-Compression Highs",
    excerpt: "How the Netherlands' Alcons Audio eliminated compression driver distortion. Explore the LR28, LR24, LR18 Pro-Ribbon line arrays, Sentinel10 ALCs, and ultra-high-definition sound.",
    readTime: "18 MIN READ",
    seoKeywords: [
        "Alcons Audio line array review LR28 LR24",
        "pro-ribbon transducer line array Alcons Audio",
        "zero compression distortion live sound Alcons",
        "Sentinel10 Sentinel3 Amplified Loudspeaker Controller",
        "audiophile high definition touring line array"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">LINE ARRAYS</span>
            <h1>Alcons Audio: Pro-Ribbon Transducers & Zero-Compression Highs</h1>
            <p class="article-meta">By Sujan Subedi | 18 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Based in Almere, Netherlands, <strong>Alcons Audio</strong> has carved out a unique position in the pro-audio world by replacing traditional dome compression drivers with **patented high-output Pro-Ribbon Transducers**. The result is a line array that delivers audiophile studio-monitor fidelity at stadium sound pressure levels.</p>

            <h2>1. The Pro-Ribbon Transducer Advantage: Zero Power Compression</h2>
            <p>Standard compression drivers force high-frequency acoustic energy through a narrow phase plug and compression throat, causing harsh harmonic distortion and thermal power compression above 10 kHz. Alcons' patented **RBN series Pro-Ribbon drivers** produce a natural, isophasic cylindrical wavefront directly from the ribbon membrane with **up to 90% less total harmonic distortion (THD)** and razor-sharp transient response up to 20 kHz.</p>

            <h2>2. Alcons Audio Product Catalog & Lineup</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>System / Model</th>
                        <th>Driver Configuration</th>
                        <th>Max Output & Directivity</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Alcons LR28</strong></td>
                        <td>Large-Format Flagship (2x 14" LF, 4x 6.5" MF, 1x 14" RBN1402rsr Pro-Ribbon HF)</td>
                        <td>147 dB SPL | 80° or 110° H | 1:15 Dynamic RMS</td>
                        <td>Stadiums, High-End Classical/Theatrical Arenas</td>
                        <td><a href="https://www.alconsaudio.com/product/lr28/" target="_blank" rel="noopener">Alcons LR28 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Alcons LR24</strong></td>
                        <td>Mid-Size Touring Array (2x 12" LF, 2x 6.5" MF, 1x 12" RBN1202rsr Pro-Ribbon HF)</td>
                        <td>143 dB SPL | 80° or 120° H</td>
                        <td>Arenas, Concert Halls, High-Definition Tours</td>
                        <td><a href="https://www.alconsaudio.com/product/lr24/" target="_blank" rel="noopener">Alcons LR24 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Alcons LR18</strong></td>
                        <td>Compact Touring Workhorse (2x 8" LF, 1x 5.5" MF, 1x 6.5" RBN602rsr Pro-Ribbon HF)</td>
                        <td>139 dB SPL | 90° or 120° H</td>
                        <td>Theatres, High-End Corporate, Live Venues</td>
                        <td><a href="https://www.alconsaudio.com/product/lr18/" target="_blank" rel="noopener">Alcons LR18 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Alcons BC543 Subwoofer</strong></td>
                        <td>Cardioid Sub-Bass (3x 18" Long-Excursion Carbon-Cone LF)</td>
                        <td>145 dB SPL | Down to 27 Hz (Selectable Cardioid)</td>
                        <td>Reference Touring Low-End Extension</td>
                        <td><a href="https://www.alconsaudio.com/product/bc543/" target="_blank" rel="noopener">Alcons BC543 Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Amplification & Processing: Sentinel ALCs & Signal Integrity</h2>
            <ul>
                <li><strong>Sentinel10 ALC (Amplified Loudspeaker Controller):</strong> 4-channel Class-D controller delivering **4x 2,500 W at 4 ohms** with 192 kHz DSP, Signal Integrity Sensing (SIS) cable compensation, and Dante inputs.</li>
                <li><strong>ARC (Alcons Ribbon Calculator):</strong> Proprietary 3D ray-tracing and acoustic simulation engine.</li>
            </ul>

            <p><em>(Check out our live <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA Spectrogram Tool</a> to experience linear high-frequency resolution).</em></p>
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

