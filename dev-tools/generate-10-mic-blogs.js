const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, '..', 'assets', 'js', 'data', 'blogs');

const articles = [
  {
    id: "mic-transducer-types",
    category: "theory",
    categoryLabel: "THEORY & FUNDAMENTALS",
    title: "Microphone Transducer Physics: Dynamic vs. Condenser vs. Ribbon",
    excerpt: "Deep dive into the electrical and mechanical physics of dynamic, condenser, and ribbon microphones. Learn their transient response, SPL handling, and practical stage and studio applications.",
    readTime: "16 MIN READ",
    seoKeywords: [
        "Microphone types dynamic condenser ribbon",
        "transducer physics audio engineering",
        "moving coil vs electrostatic capacitance",
        "ribbon microphone velocity induction",
        "transient response SPL handling microphones",
        "Faraday law microphone induction"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">THEORY & FUNDAMENTALS</span>
            <h1>Microphone Transducer Physics: Dynamic vs. Condenser vs. Ribbon</h1>
            <p class="article-meta">By Sujan Subedi | 16 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Every microphone is fundamentally a <strong>transducer</strong>—an electro-acoustic device that converts mechanical pressure waves in the air into electrical voltage fluctuations in an audio circuit. While all microphones perform this core conversion, the mechanical architecture of the capsule dictates its transient speed, frequency linearity, dynamic range, sensitivity, and off-axis coloration.</p>
            <p>Understanding the fundamental physics behind the three core transducer types—<strong>Dynamic (Moving-Coil)</strong>, <strong>Condenser (Electrostatic Capacitance)</strong>, and <strong>Ribbon (Velocity Induction)</strong>—is the single most important prerequisite for making calculated, professional mic choices on stage and in the recording studio.</p>

            <h2>1. Dynamic Microphones (Moving-Coil Physics)</h2>
            <p>Moving-coil dynamic microphones operate on the fundamental principle of <strong>Faraday's Law of Electromagnetic Induction</strong>. When an electrical conductor moves through a static magnetic field, an electromotive force (EMF / voltage) is induced across the conductor:</p>

            <pre class="visual-diagram"><code>
             ELECTROMAGNETIC INDUCTION FORMULA
             ---------------------------------
             ε = -N × (dΦB / dt)

             Where:
               ε   = Induced Voltage (Audio Signal)
               N   = Number of voice coil wire turns
               dΦB = Rate of change of magnetic flux
            </code></pre>

            <h3>Mechanical Anatomy & Operation</h3>
            <p>A moving-coil dynamic capsule consists of three core components:</p>
            <ul>
                <li><strong>Diaphragm:</strong> A flexible, molded polymer membrane (typically Mylar or polyester) tensioned across an outer ring.</li>
                <li><strong>Voice Coil:</strong> An ultra-fine copper or aluminum wire coil physically glued to the underside of the diaphragm.</li>
                <li><strong>Permanent Magnet Assembly:</strong> A high-flux neodymium or alnico permanent magnet with a circular gap where the voice coil floats without touching the metal edges.</li>
            </ul>
            <p>When acoustic sound pressure strikes the diaphragm, it physically pushes the attached voice coil back and forth through the magnetic gap. As the coil cuts across the magnetic lines of flux, an alternating electrical voltage is generated that precisely mirrors the acoustic frequency and amplitude of the incoming sound wave.</p>

            <h3>Acoustic & Mechanical Characteristics</h3>
            <ul>
                <li><strong>Acoustic Mass & Inertia:</strong> Because the diaphragm must carry the physical weight of a copper voice coil, moving-coil dynamics have substantial mechanical mass. It takes more acoustic energy to start the diaphragm moving and more time for it to stop. This produces a rounded, smooth transient response that naturally cushions harsh high-frequency spikes.</li>
                <li><strong>Extreme SPL Tolerance:</strong> Dynamic capsules have no internal active electronics to overload or clip. They can routinely withstand sound pressure levels exceeding <strong>150 dB SPL</strong> (such as direct placement inside a kick drum or 1 inch from a snare head) without mechanical failure or electrical clipping.</li>
                <li><strong>Low Sensitivity:</strong> Typical output sensitivity is low, around <strong>1.5 to 2.5 mV/Pa (-56 to -52 dBV/Pa)</strong>, requiring clean preamp gain.</li>
                <li><strong>Tour-Grade Ruggedness:</strong> Dynamic microphones are completely passive (no phantom power required) and highly resistant to stage moisture, extreme temperature swings, and mechanical drops.</li>
            </ul>

            <h2>2. Condenser Microphones (Electrostatic Variable Capacitance)</h2>
            <p>Condenser (capacitor) microphones operate on electrostatic principles governed by the parallel-plate capacitance equation:</p>

            <pre class="visual-diagram"><code>
             CAPACITANCE & VOLTAGE MODULATION
             --------------------------------
             C = (ε × A) / d      and      ΔV = Q × Δ(1 / C)

             Where:
               C = Capacitance in Farads
               ε = Permittivity of air
               A = Diaphragm surface area
               d = Distance between diaphragm and backplate
               Q = Fixed polarizing electrical charge
            </code></pre>

            <h3>Mechanical Anatomy & Operation</h3>
            <p>Unlike dynamics, a condenser capsule does not use magnets or voice coils. Instead, it forms a variable capacitor consisting of:</p>
            <ul>
                <li><strong>Front Diaphragm:</strong> An ultra-thin membrane (2 to 5 microns thick—roughly 1/20th the thickness of a human hair) made of gold-sputtered Mylar tensioned over a conductive brass ring.</li>
                <li><strong>Solid Backplate:</strong> A precision-machined, acoustically perforated conductive brass plate situated 20 to 50 microns behind the diaphragm.</li>
                <li><strong>Polarizing Charge (+48V Phantom Power):</strong> A continuous DC charge ($Q$) is applied across the plates. (In electret condensers, this charge is permanently embedded in the backplate material during manufacturing).</li>
                <li><strong>Impedance Converter (JFET / Vacuum Tube):</strong> The capsule produces electrical voltage at an astronomical impedance (billions of ohms). An internal active head amplifier steps this down to standard balanced line impedance ($150\text{--}200\,\Omega$).</li>
            </ul>

            <h3>Acoustic & Mechanical Characteristics</h3>
            <ul>
                <li><strong>Ultra-Low Acoustic Mass:</strong> With no voice coil attached, the microscopic gold membrane has virtually negligible mass. It accelerates and decelerates almost instantaneously in response to the subtlest acoustic pressure variations.</li>
                <li><strong>Lightning-Fast Transient Response:</strong> Accurately resolves fast percussive attacks, acoustic guitar pick clicks, cymbal shimmer, and delicate vocal sibilance up to 20 kHz and beyond.</li>
                <li><strong>High Output Sensitivity:</strong> Outputs <strong>10 to 30 mV/Pa (-40 to -30 dBV/Pa)</strong>—roughly 15 to 20 dB hotter than a dynamic microphone.</li>
                <li><strong>Headroom Limitations & Moisture Vulnerability:</strong> The internal JFET circuit can distort if hit with extreme SPL before the console preamp (which is why condenser mics often include hardware $-10\text{ dB}$ or $-20\text{ dB}$ pads). High humidity on outdoor festival stages can cause electrostatic condensation and crackling across the backplate.</li>
            </ul>

            <h2>3. Ribbon Microphones (Velocity / Electro-Dynamic Physics)</h2>
            <p>A ribbon microphone is technically an electromagnetic transducer, but with a crucial distinction: <strong>the diaphragm and the electrical conductor are the exact same component</strong>.</p>

            <pre class="visual-diagram"><code>
             VELOCITY INDUCTION IN RIBBONS
             -----------------------------
             V_induced = B × l × v

             Where:
               B = Magnetic flux density
               l = Length of the aluminum ribbon
               v = Velocity of air particle movement
            </code></pre>

            <h3>Mechanical Anatomy & Operation</h3>
            <p>An ultra-thin, corrugated strip of pure aluminum foil (typically 1.5 to 2.5 microns thick, weighing less than the volume of air surrounding it) is suspended under low mechanical tension between the poles of two powerful neodymium magnets.</p>
            <p>Because both the front and rear faces of the ribbon are completely open to the room, sound pressure waves pass directly through the element. The ribbon responds to the <em>particle velocity</em> of the sound wave rather than omnidirectional scalar pressure. As the aluminum foil moves, it directly cuts the magnetic flux lines, inducing an AC voltage.</p>
            <p>Because a tiny aluminum strip has an ultra-low impedance of less than $1\,\Omega$, a specialized internal step-up transformer converts the signal to a standard balanced $150\text{--}300\,\Omega$ output while providing passive voltage gain.</p>

            <h3>Acoustic & Mechanical Characteristics</h3>
            <ul>
                <li><strong>Natural Figure-8 Directivity:</strong> Classic ribbons are inherently bidirectional. They exhibit deep, razor-sharp $90^\circ$ side rejection nulls that can be angled to isolate instruments in dense live and studio environments.</li>
                <li><strong>Natural High-End Roll-off & Warmth:</strong> Completely free from the plastic resonance and electrostatic ringing of conventional diaphragms. Ribbons produce a velvety, organic top-end that takes high-frequency shelving EQ boosts exceptionally well.</li>
                <li><strong>Delicacy & Handling:</strong> Traditional passive ribbons can be stretched or torn by strong air blasts (plosives, kick drum ports) or improper patchbay phantom power shorts. Modern active ribbons (such as Royer R-122 or AEA A440) include active buffer electronics and require +48V phantom power safely.</li>
            </ul>

            <h2>Transducer Comparison Matrix</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Dynamic (Moving-Coil)</th>
                        <th>Condenser (Electrostatic)</th>
                        <th>Ribbon (Velocity)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Operating Physics</strong></td>
                        <td>Electromagnetic Induction</td>
                        <td>Electrostatic Variable Capacitance</td>
                        <td>Electromagnetic Particle Velocity</td>
                    </tr>
                    <tr>
                        <td><strong>Power Requirement</strong></td>
                        <td>None (Passive)</td>
                        <td>+48V Phantom Power / Tube PSU</td>
                        <td>Passive (Traditional) / +48V (Active)</td>
                    </tr>
                    <tr>
                        <td><strong>Diaphragm Mass</strong></td>
                        <td>Heavy (Polymer + Copper Coil)</td>
                        <td>Ultra-Light (Gold-sputtered Mylar)</td>
                        <td>Virtually Weightless (Aluminum Foil)</td>
                    </tr>
                    <tr>
                        <td><strong>Transient Speed</strong></td>
                        <td>Smooth / Rounded</td>
                        <td>Instantaneous / Highly Analytical</td>
                        <td>Fast & Organic</td>
                    </tr>
                    <tr>
                        <td><strong>Max SPL Handling</strong></td>
                        <td>Extreme (>150 dB SPL)</td>
                        <td>Moderate to High (130-145 dB SPL with Pad)</td>
                        <td>Moderate (130-135 dB SPL)</td>
                    </tr>
                    <tr>
                        <td><strong>Sensitivity</strong></td>
                        <td>Low (~1.5-2.5 mV/Pa)</td>
                        <td>High (~10-30 mV/Pa)</td>
                        <td>Low (~1.0-2.0 mV/Pa)</td>
                    </tr>
                    <tr>
                        <td><strong>Stage Durability</strong></td>
                        <td>Indestructible</td>
                        <td>Moderate (Moisture sensitive)</td>
                        <td>Delicate (Shield from wind blasts)</td>
                    </tr>
                </tbody>
            </table>

            <h2>Engineering Selection Blueprint: When to Use Which</h2>
            <ul>
                <li><strong>Choose Dynamic When:</strong> The sound source is explosive and percussive (snare drum, rack toms, kick drum), high-gain electric guitar cabinets, or screaming live vocalists on loud stages where stage durability and bleed rejection are paramount.</li>
                <li><strong>Choose Condenser When:</strong> You need surgical frequency resolution, extended high-frequency air, fast transient tracking, or low-noise capture of delicate instruments (studio lead vocals, acoustic guitar, piano, drum overheads, orchestra).</li>
                <li><strong>Choose Ribbon When:</strong> You need to tame harsh, aggressive high frequencies (screaming electric guitar amps, brass sections, harsh drum cymbals) or when you want to utilize steep $90^\circ$ figure-8 side rejection nulls for acoustic isolation.</li>
            </ul>

            <p><em>(Pro Tip: Check out our interactive <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA Spectrum Analyzer</a> to visually inspect the frequency curves and high-end roll-off of different microphone capsules in real time).</em></p>
        </div>
    `
  },
  {
    id: "polar-patterns-proximity-effect",
    category: "acoustics",
    categoryLabel: "ACOUSTIC THEORY & FOH",
    title: "Decoding Polar Patterns & Proximity Effect for Clean Mixes",
    excerpt: "Master the acoustic mechanics of Cardioid, Supercardioid, Hypercardioid, Figure-8, and Omnidirectional polar patterns. Learn how rear null angles and proximity effect dictate live monitor rejection and low-end clarity.",
    readTime: "18 MIN READ",
    seoKeywords: [
        "Microphone polar patterns proximity effect",
        "cardioid vs supercardioid vs hypercardioid",
        "microphone rear null angles live sound",
        "proximity effect low frequency boost physics",
        "gain before feedback stage monitor placement",
        "figure 8 bidirectional microphone isolation"
    ],
    content: `
        <div class="article-header">
            <span class="cat-tag">ACOUSTIC THEORY & FOH</span>
            <h1>Decoding Polar Patterns & Proximity Effect for Clean Mixes</h1>
            <p class="article-meta">By Sujan Subedi | 18 Minute Read | Published August 2026</p>
        </div>
        <div class="article-body">
            <p>Choosing the correct microphone directivity (polar pattern) and understanding its acoustic consequences is the defining factor between a muddy, feedback-prone live mix and a crystal-clear, punchy front-of-house sound. Polar patterns are not just graphic icons on a spec sheet—they represent three-dimensional acoustic sensitivity spheres governed by phase-delay acoustic ports, pressure gradients, and proximity physics.</p>

            <h2>1. The Two Fundamental Capsules: Pressure vs. Pressure Gradient</h2>
            <p>Every directional polar pattern is created by combining two basic acoustic principles:</p>
            <ul>
                <li><strong>Pressure Component (Pure Omnidirectional):</strong> The rear of the diaphragm is completely sealed in a sealed acoustic chamber. Sound can only strike the front face. Because sound pressure is a scalar quantity (it exerts force equally from all angles), the capsule responds identically to sound arriving from $0^\circ$, $90^\circ$, or $180^\circ$. True omni capsules have <strong>zero proximity effect</strong>.</li>
                <li><strong>Pressure Gradient Component (Pure Figure-8 / Bidirectional):</strong> Both the front and rear faces of the diaphragm are equally open to the sound field. The diaphragm moves based on the <em>pressure difference (gradient)</em> between the front and back. Sounds arriving from $90^\circ$ and $270^\circ$ reach both sides at the exact same millisecond and cancel completely (creating a $0\text{ dB}$ side null).</li>
            </ul>

            <pre class="visual-diagram"><code>
             POLAR PATTERN MATHEMATICAL SUMMATION
             ------------------------------------
             Directivity: R(θ) = (1 - k) + k × cos(θ)

             Where:
               θ = Arrival angle (0° = on-axis, 180° = rear)
               k = Gradient ratio:
                   k = 0.0  ──> Omnidirectional
                   k = 0.5  ──> Standard Cardioid
                   k = 0.63 ──> Supercardioid
                   k = 0.75 ──> Hypercardioid
                   k = 1.0  ──> Figure-8 (Bidirectional)
            </code></pre>

            <h2>2. Deep Dive into the 5 Standard Polar Patterns</h2>

            <h3>A. Omnidirectional ($k = 0$)</h3>
            <ul>
                <li><strong>Pickup Arc:</strong> $360^\circ$ spherical coverage.</li>
                <li><strong>Null Angles:</strong> None.</li>
                <li><strong>Proximity Effect:</strong> None (Flat low-end response regardless of distance).</li>
                <li><strong>Best Use:</strong> Measurement microphones, classical room capture, headset/lavalier mics (resistant to wind and breathing plosives).</li>
            </ul>

            <h3>B. Cardioid ($k = 0.5$)</h3>
            <ul>
                <li><strong>Pickup Arc:</strong> Wide $131^\circ$ front acceptance angle.</li>
                <li><strong>Null Angle:</strong> Exactly at $180^\circ$ (Direct rear rejection).</li>
                <li><strong>Side Attenuation ($90^\circ$):</strong> $-6\text{ dB}$.</li>
                <li><strong>Stage Monitor Alignment:</strong> Place a single stage wedge directly behind the microphone at $180^\circ$.</li>
                <li><strong>Best Use:</strong> Shure SM58, SM57, Sennheiser e835, universal studio vocal tracking.</li>
            </ul>

            <h3>C. Supercardioid ($k = 0.63$)</h3>
            <ul>
                <li><strong>Pickup Arc:</strong> Tighter $115^\circ$ front acceptance angle.</li>
                <li><strong>Side Attenuation ($90^\circ$):</strong> $-8.6\text{ dB}$ (superior side bleed rejection).</li>
                <li><strong>Rear Lobe:</strong> Exhibits a small rear sensitivity lobe ($-12\text{ dB}$).</li>
                <li><strong>Null Angles:</strong> Symmetrical dead zones located at $126^\circ$ and $234^\circ$ off-axis.</li>
                <li><strong>Stage Monitor Alignment:</strong> NEVER place the monitor at $180^\circ$. Place dual stage wedges split at $60^\circ$ to the sides ($120^\circ\text{--}130^\circ$ off-axis).</li>
                <li><strong>Best Use:</strong> Sennheiser e945, Shure Beta 58A, Audix OM7 on loud stages with screaming cymbals.</li>
            </ul>

            <h3>D. Hypercardioid ($k = 0.75$)</h3>
            <ul>
                <li><strong>Pickup Arc:</strong> Ultra-tight $105^\circ$ front acceptance angle.</li>
                <li><strong>Side Attenuation ($90^\circ$):</strong> $-12\text{ dB}$ (maximum side rejection).</li>
                <li><strong>Rear Lobe:</strong> Prominent rear pickup lobe ($-6\text{ dB}$).</li>
                <li><strong>Null Angles:</strong> Located at $110^\circ$ and $250^\circ$.</li>
                <li><strong>Best Use:</strong> Beyerdynamic M160, Audix D6 on hi-hat/snare bleed isolation.</li>
            </ul>

            <h3>E. Figure-8 / Bidirectional ($k = 1.0$)</h3>
            <ul>
                <li><strong>Pickup Arc:</strong> Symmetrical $90^\circ$ front and $90^\circ$ rear lobes.</li>
                <li><strong>Null Angles:</strong> Infinitely deep theoretical nulls at exactly $90^\circ$ and $270^\circ$ sides.</li>
                <li><strong>Best Use:</strong> Mid-Side (M/S) stereo recording, ribbon mic acoustic guitar/vocal bleed isolation, face-to-face dual vocalists.</li>
            </ul>

            <h2>3. Polar Pattern Reference Chart & Monitor Placement</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Polar Pattern</th>
                        <th>Front Coverage Angle</th>
                        <th>Side Rejection (90°)</th>
                        <th>Max Null Angle(s)</th>
                        <th>Correct Stage Monitor Angle</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Omnidirectional</strong></td>
                        <td>360° (Full Sphere)</td>
                        <td>0 dB</td>
                        <td>None</td>
                        <td>Avoid live stage wedges</td>
                    </tr>
                    <tr>
                        <td><strong>Cardioid</strong></td>
                        <td>131° (Wide)</td>
                        <td>-6 dB</td>
                        <td>180° (Direct Rear)</td>
                        <td>Directly Behind (180°)</td>
                    </tr>
                    <tr>
                        <td><strong>Supercardioid</strong></td>
                        <td>115° (Narrow)</td>
                        <td>-8.6 dB</td>
                        <td>126° & 234°</td>
                        <td>Dual Split Wedges (125°)</td>
                    </tr>
                    <tr>
                        <td><strong>Hypercardioid</strong></td>
                        <td>105° (Very Narrow)</td>
                        <td>-12 dB</td>
                        <td>110° & 250°</td>
                        <td>Dual Split Wedges (110°)</td>
                    </tr>
                    <tr>
                        <td><strong>Figure-8</strong></td>
                        <td>90° Front / 90° Rear</td>
                        <td>-∞ dB (Infinite Null)</td>
                        <td>90° & 270° (Sides)</td>
                        <td>Sides facing loud sources</td>
                    </tr>
                </tbody>
            </table>

            <h2>4. Proximity Effect: The Physics of the Low-End Boost</h2>
            <p><strong>Proximity Effect</strong> is the dramatic boost in low-frequency response that occurs when a directional (gradient) microphone is moved close to a sound source.</p>

            <h3>The Mathematical Cause: Curved Wavefronts</h3>
            <p>Sound waves from a distant source arrive at the microphone capsule as flat, parallel plane waves. But when a source (like a singer's mouth or acoustic guitar body) is within a few inches, the sound wave arrives as a steep <strong>spherical (curved) wavefront</strong>.</p>
            <p>According to the inverse-square law, the pressure drop across the microscopic distance between the front and rear ports of the capsule becomes exponentially larger at low frequencies. Because low-frequency wavelengths are long, this phase differential creates a massive low-frequency boost, reaching up to **+12 to +18 dB at 100 Hz** when a singer swallows the grille.</p>

            <pre class="visual-diagram"><code>
             PROXIMITY EFFECT VS DISTANCE (Cardioid)
             ----------------------------------------
             Distance: 12 inches (30 cm) ──> Flat (0 dB boost)
             Distance:  4 inches (10 cm) ──> +4 dB boost @ 100 Hz
             Distance:  1 inch   (2.5 cm)──> +10 dB boost @ 100 Hz
             Distance:  Touching Grille  ──> +16 dB boost @ 100 Hz (Severe Boominess)
            </code></pre>

            <h3>How FOH Engineers Harness or Tame Proximity Effect</h3>
            <ul>
                <li><strong>To Add Warmth & Authority:</strong> Thin, reedy vocalists benefit from singing within 1 to 2 inches of a cardioid or supercardioid capsule to artificially fatten their fundamental tone.</li>
                <li><strong>To Clean Up Mud in Dense Live Mixes:</strong> Engage a high-pass filter (HPF) on the console channel between **80 Hz and 120 Hz** to remove sub-harmonic stage rumble and excessive proximity mud.</li>
                <li><strong>The Variable-D Solution:</strong> Microphones like the <em>Electro-Voice RE20</em> and <em>RE320</em> utilize internal rear acoustic duct ports (Variable-D technology) to eliminate proximity effect entirely, allowing vocalists to move freely without tonal shifts.</li>
            </ul>

            <p><em>(Tip: Use our web-based <a href="../app.html#rta" class="text-primary font-bold hover:underline">Real-Time Analyzer (RTA)</a> to visualize proximity effect frequency shifts as you move closer to your microphone).</em></p>
        </div>
    `
  }
];

articles.forEach(article => {
  const filePath = path.join(blogsDir, `${article.id}.js`);
  const jsContent = `window.soundEnggBlogs = window.soundEnggBlogs || [];\nwindow.soundEnggBlogs.push(${JSON.stringify(article, null, 4)});\n`;
  fs.writeFileSync(filePath, jsContent, 'utf8');
  console.log(`✓ Generated article: assets/js/data/blogs/${article.id}.js`);
});

