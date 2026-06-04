window.soundEnggBlogs = window.soundEnggBlogs || [];
window.soundEnggBlogs.push({
    "id": "foh-vs-system-tech",
    "category": "live",
    "categoryLabel": "LIVE TECHNIQUES",
    "isPro": false,
    "title": "System Tech vs. FOH Engineer: Where the Line Gets Drawn",
    "excerpt": "In professional tours, FOH engineers and system techs have distinct responsibilities. Learn how they collaborate to optimize system tuning and deliver a great mix.",
    "readTime": "11 MIN READ",
    "seoKeywords": [
        "system tech vs FOH engineer",
        "live sound system engineer",
        "PA tuning",
        "FOH responsibilities",
        "live audio crew roles",
        "Smaart PA tuning"
    ],
    "content": `
            <div class="article-header">
                <span class="cat-tag">LIVE TECHNIQUES</span>
                <h1>System Tech vs. FOH Engineer: Where the Line Gets Drawn</h1>
                <p class="article-meta">By Sujan Subedi | 11 Minute Read | Published June 2026</p>
            </div>
            <div class="article-body">
                <p>Walk into the Front of House (FOH) mix position at a stadium concert, and you will typically see two people standing behind the control consoles. One person is actively mixing, adjusting vocal levels, and riding delay effects. The other person is monitoring a laptop screen displaying phase traces, holding an iPad, and inspecting the line array hangs. To the audience, they are both simply \"the sound crew.\" However, in professional touring, these are two distinct roles with separate skill sets: the <strong>FOH Engineer</strong> and the <strong>System Tech</strong> (System Engineer). When they collaborate effectively, the show sounds pristine; when responsibilities blur, troubleshooting becomes difficult. Let’s look at who does what and how their workflows align.</p>

                <h2>The FOH Engineer: Hired by the Band</h2>
                <p>The FOH Engineer is hired directly by the artist or band management and travels with the tour. Their role is primarily artistic, translating the band's musical vision into the venue's PA system. They focus on the balance and character of the mix rather than the physical layout of the speakers.</p>
                <p><strong>Core Responsibilities of FOH:</strong>
                <ul>
                    <li>Mixing the show in real time.</li>
                    <li>Managing the console show files and routing configurations.</li>
                    <li>Conducting virtual soundchecks using multitrack recordings.</li>
                    <li>Applying EQ, compression, and effects to individual channels.</li>
                    <li>Communicating with band members, monitor engineers, and management regarding sonic preferences.</li>
                </ul>
                The FOH engineer operates the system, but they rely on the System Tech to build and align it. They also coordinate with the monitor engineer regarding stage volumes and microphone choices, ensuring a feedback-free environment for the artist.</p>

                <h2>The System Tech: Hired by the Audio Vendor</h2>
                <p>The System Engineer is typically hired by the audio production company providing the equipment (such as Clair Global or Eighth Day Sound). They manage the physical deployment, rigging limits, and acoustic calibration of the PA system. The role requires a strong understanding of acoustic physics, networking, and system diagnostics.</p>

                <h3>FOH vs. System Tech Division of Labor</h3>
                <pre class="visual-diagram"><code>
+--------------------------+---------------------------+
|       FOH ENGINEER       |        SYSTEM TECH        |
|     (Hired by Band)      |  (Hired by Audio Vendor)  |
+--------------------------+---------------------------+
| - Mixes the band         | - Designs the PA hang     |
| - EQs individual inputs  | - Aligns Subs and Mains   |
| - Controls the console   | - Tunes the room via DSP  |
| - Rides FX and Dynamics  | - Monitors amp telemetry  |
| - The "Artist"           | - The "Physicist"         |
+--------------------------+---------------------------+
                </code></pre>

                <p>The System Tech is on site hours before FOH arrives. They map the venue dimensions using laser measures, input the coordinates into 3D prediction software, calculate line array splay angles, and oversee the installation of the PA arrays. Once flown, the System Tech uses dual-channel FFT software (such as Smaart) and measurement microphones to align the subwoofers, time-align delay columns, and tune the system's frequency response to be linear and coherent across all coverage zones. They also monitor amplifier telemetry (such as impedance changes, limiting events, and temperature metrics) over network protocols like LA Network Manager or ArmoníaPlus, ensuring the hardware runs within safe parameters.</p>

                <h2>The Golden Rule: FOH EQs the Band, Tech EQs the Room</h2>
                <p>At soundcheck, the System Tech hands control of the system EQ to the FOH engineer, confirming that the PA is flat and time-aligned. This handover is a critical transition. If the FOH engineer notices a harsh room reflection at 4kHz, they do not hack their master console EQ. Instead, they ask the System Tech to apply a broad cut across the system processor matrix. This ensures the FOH engineer mixes on a flat, phase-aligned system, while the System Tech manages room-specific resonances in the amplifier DSP.</p>

                <h2>Mid-Show Adjustments: Managing Atmospheric Drift</h2>
                <p>The System Tech's responsibilities continue throughout the show. In outdoor venues, temperature and humidity shifts physically alter the speed of sound. At 8:00 PM in summer, the air may be warm and humid, and the delay towers are aligned accordingly. By 10:00 PM, as the temperature drops, the speed of sound decreases, causing delay towers to fall out of sync with the main stage, resulting in phase cancellation in the lawn area.</p>
                <p>The System Tech actively monitors these environmental changes, walking the venue with an iPad and adjusting the millisecond delay times in the system processors to maintain phase alignment as the weather changes. FOH controls the mix balance, but the System Tech manages the physical environment.</p>
                <p><em>(Editor’s note: Managing room acoustics or calculating system delay offsets? Use our interactive <a href="../app.html#delay" class="text-primary font-bold hover:underline">Time Delay Calculators</a> and <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA Spectrum Analyzer</a> to calculate alignment settings and analyze frequencies on the fly).</em></p>

                <h2>Summary</h2>
                <p>Live sound at a professional level requires collaboration. The FOH engineer focuses on the musical mix, while the System Tech optimizes the PA system for the venue. By understanding and respecting these boundaries, crews can prevent troubleshooting bottlenecks and focus on making the show sound professional. Live sound is a team sport; when the physicist and the artist work in harmony, the audience gets an unforgettable experience.</p>
            </div>
        `
});
