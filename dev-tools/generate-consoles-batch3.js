const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, '..', 'assets', 'js', 'data', 'blogs');

const articles = [
  {
    id: "soundcraft-vi-si-series-guide",
    category: "consoles",
    categoryLabel: "MIXING CONSOLES",
    title: "Soundcraft Vi & Si Series: Vistonics II Knobs-On-Glass, FaderGlow & Lexicon FX",
    excerpt: "Explore the British engineering behind Soundcraft digital consoles: Vi7000, Vi5000, Vi3000, patented Vistonics II rotary encoders on glass, FaderGlow visual navigation, and onboard Lexicon DSP.",
    readTime: "20 MIN READ",
    seoKeywords: [
        "Soundcraft Vi7000 Vi5000 Vi3000 review",
        "Vistonics II knob on glass touch screen",
        "FaderGlow color coded faders Soundcraft",
        "Lexicon multi-effects engine Soundcraft",
        "Soundcraft Si Impact Compact console guide"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">MIXING CONSOLES</span>
            <h1>Soundcraft Vi & Si Series: Vistonics II Knobs-On-Glass, FaderGlow & Lexicon FX</h1>
            <p class="article-meta">By Sujan Subedi | 20 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Founded in London in 1973, <strong>Soundcraft</strong> defined the sound of classic British rock with analog mixing desks like the Series Two, Ghost, and MH4. In the digital era, Soundcraft teamed with Studer to create one of the most intuitive, fast-mixing interfaces in live audio history: **Vistonics II and FaderGlow** on the **Vi Series (Vi7000, Vi5000, Vi3000, Vi1000)** and the versatile **Si Series**.</p>

            <h2>1. The Vistonics II Interface: Rotary Encoders Directly on Glass</h2>
            <p>On most touchscreens, adjusting an EQ frequency requires tapping a virtual slider and turning an assignable encoder somewhere else on the surface. Soundcraft’s patented **Vistonics II** physically mounts 16 rotary potentiometers directly onto the surface of the touchscreen glass.</p>
            <ul>
                <li><strong>Knobs Where You Look:</strong> Graphic EQ parameters, preamp gains, gate thresholds, and aux send levels appear directly underneath their respective rotary hardware knobs. You adjust what you see with instant muscle memory.</li>
                <li><strong>FaderGlow™ Optical Illumination:</strong> Fader tracks glow in distinct optical colors depending on their function: <strong>Orange for Aux Sends, Green for Matrix Outs, Blue for FX Returns, and Red for Graphic EQ bands</strong>. During high-pressure festival changeovers, FaderGlow prevents you from accidentally grabbing the wrong bus fader.</li>
            </ul>

            <h2>2. Integrated Harman DSP: Lexicon, BSS & dbx</h2>
            <ul>
                <li><strong>4 Independent Lexicon FX Engines:</strong> Studio-quality Lexicon 480L and PCM plate, hall, and chamber reverbs running inside dedicated DSP hardware.</li>
                <li><strong>BSS DPR901ii Dynamic EQ:</strong> The legendary hardware dynamic EQ built directly into master busses for transparent harsh-frequency taming.</li>
                <li><strong>BSS Graphic Equalizers:</strong> 30-band graphic EQs on every single output bus with direct FaderGlow fader control.</li>
            </ul>

            <h2>3. Soundcraft Console Product Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Fader Count & Screens</th>
                        <th>Mix Capacity & Processing</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Soundcraft Vi7000</strong></td>
                        <td>44 Faders | 4x Vistonics II Glass Touchscreens</td>
                        <td>Up to 128 Inputs | 32 Busses (SpiderCore 40-bit Floating Point)</td>
                        <td>Major Touring Productions, Arenas, Broadcast</td>
                        <td><a href="https://www.soundcraft.com/en/products/vi7000" target="_blank" rel="noopener">Vi7000 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Soundcraft Vi3000</strong></td>
                        <td>36 Faders | 4x Vistonics II Screens (All-in-One Console)</td>
                        <td>96 Inputs | 24 Busses @ 48 kHz (Onboard Dante & MADI)</td>
                        <td>Touring Theatres, Shed Tours, Festival FOH</td>
                        <td><a href="https://www.soundcraft.com/en/products/vi3000" target="_blank" rel="noopener">Vi3000 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Soundcraft Vi1000</strong></td>
                        <td>16 Faders | 2x Vistonics II Screens (Compact Touring)</td>
                        <td>96 Inputs | Full Vi Processing in Compact Chassis</td>
                        <td>Theatre Pits, Fly-Dates, Corporate Production</td>
                        <td><a href="https://www.soundcraft.com/en/products/vi1000" target="_blank" rel="noopener">Vi1000 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Soundcraft Si Impact</strong></td>
                        <td>26 Motorized Faders | FaderGlow | 32 Local XLRs</td>
                        <td>40 Inputs | 32x32 USB Audio Interface</td>
                        <td>Regional Live Clubs, Houses of Worship, Schools</td>
                        <td><a href="https://www.soundcraft.com/en/products/si-impact" target="_blank" rel="noopener">Si Impact Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Vi Stagebox (32/16 & 64/32)</strong></td>
                        <td>Modular Stagebox with Soundcraft Preamps & Dual Redundant MADI/Dante</td>
                        <td>Ultra-Low Noise Microphone Preamps with Optical Splits</td>
                        <td>Touring Stage I/O Backbone</td>
                        <td><a href="https://www.soundcraft.com/en/products/vi-stagebox" target="_blank" rel="noopener">Vi Stagebox Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>4. Network Protocols: Dante & MADI Integration</h2>
            <p>Vi consoles feature dual built-in MADI and Dante option cards, enabling simultaneous 64-track virtual soundcheck recording into DAWs and seamless connection to Harman HiQnet and BSS Soundweb London network infrastructure.</p>

            <p><em>(Check out our live <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA Spectrogram Tool</a> to check room linearity during soundcheck).</em></p>
        </div>
    `
  },
  {
    id: "presonus-studiolive-series-iii-guide",
    category: "consoles",
    categoryLabel: "MIXING CONSOLES",
    title: "PreSonus StudioLive Series III: FLEX DSP, Vintage Fat Channel & AVB Stagebox Ecosystem",
    excerpt: "Discover the power of PreSonus StudioLive Series III: 64S, 32S, 32SX, dual-core FLEX DSP processing, State-Space modeled Vintage Fat Channels, and plug-and-play AVB stagebox networking.",
    readTime: "20 MIN READ",
    seoKeywords: [
        "PreSonus StudioLive 64S 32S 32SX review",
        "PreSonus FLEX DSP Fat Channel modeling",
        "PreSonus AVB stagebox NSB16.8 NSB8.8",
        "Capture multitrack recording PreSonus",
        "UC Surface tablet mixing PreSonus"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">MIXING CONSOLES</span>
            <h1>PreSonus StudioLive Series III: FLEX DSP, Vintage Fat Channel & AVB Stagebox Ecosystem</h1>
            <p class="article-meta">By Sujan Subedi | 20 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Baton Rouge, Louisiana’s <strong>PreSonus</strong> transformed digital mixing by pioneering seamless hardware-to-software studio-live workflows. With the **StudioLive Series III ecosystem (64S, 32S, 32SX, 32SC)**, PreSonus delivers a multi-core **FLEX DSP Engine**, State-Space circuit modeled Fat Channels, and native **IEEE AVB audio networking**.</p>

            <h2>1. The FLEX DSP Engine & Vintage Fat Channel Modeling</h2>
            <p>The multi-core FLEX DSP engine provides immense processing flexibility without hardware voice-stealing:</p>
            <ul>
                <li><strong>State-Space Modeled Vintage Dynamics:</strong> Modeled component-by-component, the Fat Channel includes legendary circuit emulations of the Fairchild 670, Teletronix LA-2A, UREI 1176, Neve 1073 EQ, and Pultec passive EQs.</li>
                <li><strong>A/B Quick Comparison:</strong> Switch between two completely different channel strip settings (e.g. vintage tube EQ vs surgical digital filter) with a single tap to audition mix tweaks live.</li>
                <li><strong>64-Channel Mixing Power:</strong> The flagship **64S** packs **64 processed input channels and 32 mix busses** into a compact, lightweight touring frame.</li>
            </ul>

            <h2>2. PreSonus StudioLive Product Lineup & Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Faders & Screen Setup</th>
                        <th>Inputs & Busses (FLEX DSP)</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>StudioLive 64S</strong></td>
                        <td>33 Touch-Sensitive Motorized Faders | Full-Color Display</td>
                        <td>64 Inputs | 32 Busses (128-ch USB / AVB Engine)</td>
                        <td>Live Theatres, Houses of Worship, Regional Touring</td>
                        <td><a href="https://www.presonus.com/en-US/mixers/digital-console-mixers/studiolive-series-iii/2779200802.html" target="_blank" rel="noopener">StudioLive 64S Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>StudioLive 32S / 32SX</strong></td>
                        <td>33 / 25 Faders | Compact 19" Rackable Form (32SX)</td>
                        <td>40 Inputs | 26 Busses (Dual-Core FLEX DSP)</td>
                        <td>Corporate Production, Live Clubs, Mobile Rigs</td>
                        <td><a href="https://www.presonus.com/en-US/mixers/digital-console-mixers/studiolive-series-iii/2779200801.html" target="_blank" rel="noopener">StudioLive 32S Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>StudioLive 32SC</strong></td>
                        <td>17 Faders | Compact Rack-Mount Chassis</td>
                        <td>32 Inputs | 26 Busses (16 Local Preamps)</td>
                        <td>Fly-Dates, Breakout Rooms, Broadcast Sub-Mixes</td>
                        <td><a href="https://www.presonus.com/en-US/mixers/digital-console-mixers/studiolive-series-iii/2779200803.html" target="_blank" rel="noopener">StudioLive 32SC Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>NSB16.8 / NSB8.8 Stagebox</strong></td>
                        <td>16 In / 8 Out or 8 In / 8 Out Networked AVB Stagebox</td>
                        <td>XMAX Class-A Remote Preamps + Dual AVB Ethernet Ports</td>
                        <td>Plug-and-Play Stage I/O Drops</td>
                        <td><a href="https://www.presonus.com/en-US/mixers/ecosystem-accessories/2777100101.html" target="_blank" rel="noopener">NSB Stageboxes Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. AVB Network Audio & One-Touch Capture Recording</h2>
            <ul>
                <li><strong>Native AVB Audio:</strong> Connect NSB stageboxes and EarMix 16M personal monitor mixers over standard Cat5e without complex network switch configuration.</li>
                <li><strong>One-Touch SD Card Capture:</strong> Insert an SD card and record up to **34 tracks of uncompressed WAV audio** with zero computer setup for instant virtual soundcheck playback.</li>
            </ul>

            <p><em>(Check out our interactive <a href="../app.html#delay" class="text-primary font-bold hover:underline">Speaker Delay Calculator</a> for aligning front fills).</em></p>
        </div>
    `
  },
  {
    id: "cadac-digital-cdc-series-guide",
    category: "consoles",
    categoryLabel: "MIXING CONSOLES",
    title: "Cadac Digital CDC Series: Sub-0.4ms Latency, British Analogue Heritage & MegaCOMMS",
    excerpt: "Engineering masterclass on Cadac Digital: CDC seven-s, CDC six, CDC five, sub-0.4ms total system latency, MegaCOMMS 3072-channel optical network, and pure British analogue summing.",
    readTime: "21 MIN READ",
    seoKeywords: [
        "Cadac Digital CDC seven-s CDC six review",
        "sub-0.4ms latency digital console Cadac",
        "MegaCOMMS 3072-channel network Cadac",
        "Cadac theatre console British sound",
        "high definition audio mixing console Cadac"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">MIXING CONSOLES</span>
            <h1>Cadac Digital CDC Series: Sub-0.4ms Latency, British Analogue Heritage & MegaCOMMS</h1>
            <p class="article-meta">By Sujan Subedi | 21 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>From the golden age of Broadway and West End musicals (Phantom of the Opera, Cats, Lion King), <strong>Cadac</strong> was the undisputed acoustic crown jewel of theatrical sound design. When Cadac transitioned to the digital realm with the **CDC Series (CDC seven-s, CDC six, CDC five)**, they prioritized an acoustic benchmark that other manufacturers ignored: <strong>Sub-0.4 millisecond ultra-low system latency and pure analog-modeled British summing</strong>.</p>

            <h2>1. The Latency Benchmark: Sub-0.4ms Analog-to-Analog</h2>
            <p>In musical theatre and high-end classical concert sound, comb filtering caused by digital conversion latency (typically 1.5ms to 3ms on standard digital desks) blurs speech intelligibility and ruins vocal imaging. Cadac's **proprietary DSP architecture achieves a total through-system latency of less than 0.4 milliseconds (sub-400μs) at 96 kHz**, completely indistinguishable from an analog console.</p>

            <h2>2. The MegaCOMMS High-Definition Network Backbone</h2>
            <ul>
                <li><strong>3,072 Audio Channels:</strong> MegaCOMMS transports up to **3,072 channels of 24-bit 96 kHz audio** over coaxial cables (up to 150m) or optical fiber (up to 2km).</li>
                <li><strong>Phase-Aligned Crossovers:</strong> Proprietary 4th-order linear-phase algorithms ensure that no matter how complex the matrix routing is, all outputs arrive at the line array processors in perfect phase alignment.</li>
            </ul>

            <h2>3. Cadac CDC Product Lineup & System Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Faders & Displays</th>
                        <th>Processing Capacity</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Cadac CDC seven-s</strong></td>
                        <td>36 Motorized Faders | Dual 23.5" Full-HD Multi-Touch Displays</td>
                        <td>128 Inputs | 64 Busses @ 96 kHz (Flagship Theatre Frame)</td>
                        <td>West End / Broadway Theatres, Major World Tours</td>
                        <td><a href="https://www.cadac-sound.com/products/cdc-seven-s/" target="_blank" rel="noopener">CDC seven-s Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Cadac CDC six</strong></td>
                        <td>24 Motorized Faders | 1x 23.5" Multi-Touch Display</td>
                        <td>80 Inputs | 56 Busses @ 96 kHz Sub-0.4ms</td>
                        <td>Concert Theatres, Shed Tours, Live Opera</td>
                        <td><a href="https://www.cadac-sound.com/products/cdc-six/" target="_blank" rel="noopener">CDC six Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Cadac CDC five</strong></td>
                        <td>16 Motorized Faders | 1x 23.5" Multi-Touch Display</td>
                        <td>48 Inputs | 24 Busses @ 96 kHz (Compact Footprint)</td>
                        <td>Theatre Pits, High-End Corporate, Houses of Worship</td>
                        <td><a href="https://www.cadac-sound.com/products/cdc-five/" target="_blank" rel="noopener">CDC five Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>CDC I/O 6444 / 3216 Stagebox</strong></td>
                        <td>64 In / 44 Out or 32 In / 16 Out MegaCOMMS Preamps</td>
                        <td>Legendary Cadac British Analogue Mic Preamps</td>
                        <td>High-Definition Stage I/O Backbone</td>
                        <td><a href="https://www.cadac-sound.com/products/cdc-io-6444/" target="_blank" rel="noopener">CDC Stageboxes Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <p><em>(Monitor Engineers: Check your stage feedback frequencies with our <a href="../app.html#rta" class="text-primary font-bold hover:underline">Real-Time Analyzer Tool</a>).</em></p>
        </div>
    `
  },
  {
    id: "lawo-mc2-live-audio-consoles-guide",
    category: "consoles",
    categoryLabel: "MIXING CONSOLES",
    title: "Lawo mc² & A__UHD Core: Ultra-Dense IP Infrastructure, 1024 DSP Channels & 3D Immersive Audio",
    excerpt: "Inside the world's most powerful live broadcast and theatre console system: Lawo mc²96, mc²56, mc²36, the 1,024-channel A__UHD Core, native SMPTE 2110 / RAVENNA IP, and 3D spatial mixing.",
    readTime: "22 MIN READ",
    seoKeywords: [
        "Lawo mc296 mc256 mc236 console review",
        "Lawo A__UHD Core 1024 DSP channels",
        "SMPTE ST 2110 RAVENNA AES67 live audio Lawo",
        "Lawo live broadcast and theatre mixing",
        "3D spatial audio panning Lawo mc2"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">MIXING CONSOLES</span>
            <h1>Lawo mc² & A__UHD Core: Ultra-Dense IP Infrastructure, 1024 DSP Channels & 3D Immersive Audio</h1>
            <p class="article-meta">By Sujan Subedi | 22 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Headquartered in Rastatt, Germany, <strong>Lawo</strong> represents the absolute zenith of mission-critical broadcast infrastructure, classical festival mixing, and grand theatrical production. With the revolutionary **A__UHD Core** and the **mc² Series (mc²96, mc²56, mc²36)**, Lawo pioneered ultra-dense **SMPTE ST 2110 / RAVENNA IP network audio** with unmatched DSP channel density.</p>

            <h2>1. The Ultra-Dense Processing Engine: A__UHD Core</h2>
            <p>In a standard 1U rack space, Lawo’s **A__UHD Core (Ultra-High Density)** delivers an astonishing **1,024 broadcast-grade DSP channels at 96 kHz**:</p>
            <ul>
                <li><strong>Resource Pooling & Multi-Console Sharing:</strong> A single A__UHD Core engine can be split dynamically between up to 4 separate mc² consoles, allowing one physical server to power FOH, Monitors, and a broadcast truck simultaneously.</li>
                <li><strong>Native IP Standards (SMPTE ST 2110-30 / AES67 / RAVENNA):</strong> Connects directly into global enterprise IT networks with hitless dual-redundant stream switching (SMPTE 2022-7).</li>
                <li><strong>3D Spatial Panning Onboard:</strong> Native object-based 3D immersive panning supporting Dolby Atmos, binaural in-ear monitoring, and multi-speaker immersive concert arrays.</li>
            </ul>

            <h2>2. Lawo mc² Console Lineup & Product Catalog</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Faders & Displays</th>
                        <th>DSP Engine & Capacity</th>
                        <th>Target Deployment</th>
                        <th>Official Product Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Lawo mc²96</strong></td>
                        <td>Up to 160 Motorized Faders | Multi-Screen 4K Touch Displays</td>
                        <td>Up to 1,024 DSP Channels (A__UHD Core @ 96 kHz)</td>
                        <td>Global Mega-Events (Olympics, Super Bowl), Grand Opera</td>
                        <td><a href="https://lawo.com/products/mc296/" target="_blank" rel="noopener">Lawo mc²96 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Lawo mc²56</strong></td>
                        <td>Up to 112 Faders | Full-HD Touch Displays with Overbridge</td>
                        <td>Up to 1,024 DSP Channels (Broadcast & Live Workhorse)</td>
                        <td>Major Concert Theatres, OB Trucks, World Tours</td>
                        <td><a href="https://lawo.com/products/mc256/" target="_blank" rel="noopener">Lawo mc²56 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>Lawo mc²36 mkII</strong></td>
                        <td>16 or 32 Faders | All-in-One Console with Onboard A__UHD Core</td>
                        <td>256 DSP Channels @ 96 kHz (Ultra-Compact Frame)</td>
                        <td>Performing Arts Centers, Houses of Worship, Fly-Dates</td>
                        <td><a href="https://lawo.com/products/mc236/" target="_blank" rel="noopener">Lawo mc²36 Official Page ↗</a></td>
                    </tr>
                    <tr>
                        <td><strong>A__stage Stageboxes</strong></td>
                        <td>SMPTE 2110-30 / RAVENNA High-Density Mic Preamps</td>
                        <td>Discrete Class-A Studio Conversion with Redundant IP Streams</td>
                        <td>Broadcast & Live Stage I/O Infrastructure</td>
                        <td><a href="https://lawo.com/products/a__stage/" target="_blank" rel="noopener">A__stage Official Page ↗</a></td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Automixing & Mission-Critical Redundancy</h2>
            <p>Lawo’s **Automix** algorithms automatically manage multi-channel speech gains with microsecond precision, while hitless dual network streaming ensures zero packet loss even during massive catastrophic switch failures.</p>

            <p><em>(Check out our <a href="../app.html#pinouts" class="text-primary font-bold hover:underline">Audio Pinouts Guide</a> to verify broadcast wiring and balanced XLR lines).</em></p>
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

