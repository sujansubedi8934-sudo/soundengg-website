window.soundEnggBlogs = window.soundEnggBlogs || [];
window.soundEnggBlogs.push({
    "id": "adamson-cardioid-subs",
    "category": "subs",
    "categoryLabel": "SUBWOOFERS",
    "isPro": false,
    "title": "Adamson Systems: Unpacking Their Approach to Controlled Directivity Subs",
    "excerpt": "Inside Adamson's low-end engineering. Explore how Kevlar drivers, FBF presets, and networked Milan AVB nodes shape modern tour sound reinforcement.",
    "readTime": "10 MIN READ",
    "seoKeywords": [
        "Adamson Systems",
        "Kevlar Subwoofers",
        "E119 Subwoofer",
        "FBF Cardioid",
        "Blueprint AV",
        "Milan AVB"
    ],
    "content": `
            <div class="article-header">
                <span class="cat-tag">SUBWOOFERS</span>
                <h1>Adamson Systems: Unpacking Their Approach to Controlled Directivity Subs</h1>
                <p class="article-meta">By Sujan Subedi | 10 Minute Read | Published June 2026</p>
            </div>
            <div class="article-body">
                <p>If you have been paying attention to global tour riders over the last decade, you have undoubtedly noticed a massive surge in Front of House (FOH) engineers requesting Adamson Systems. From massive stadium rock tours to heavyweight electronic music festivals, Adamson has muscled its way into the "Big Three" touring PA conversation, sitting alongside L-Acoustics and d&b audiotechnik. While their mid-high line arrays are highly praised, a PA is only as strong as its low-end anchor. Adamson’s E119 and dual 18-inch E121 subwoofers are absolute sledgehammers. Today, we will examine how Adamson handles low-frequency directivity, their signature driver materials, and how their prediction software shapes the bass on modern tours.</p>

                <h2>The Kevlar Advantage: Why Adamson Subs Hit Different</h2>
                <p>To understand Adamson’s approach to subwoofers, you have to look at the physical drivers. Almost every major PA manufacturer uses paper or composite cones for their low-frequency drivers. Adamson uses Kevlar. Yes, the same material used in bulletproof vests. This choice is not a marketing gimmick; it is an engineering decision based on mass, stiffness, and transient response.</p>
                <p>When an amplifier sends a massive burst of electrical energy—such as a kick drum transient—into a subwoofer, the cone must push forward violently to displace air and then snap back to its resting position instantly. Standard paper cones can flex, warp, or "break up" under extreme physical stress. This cone deformation causes a loss of acoustic energy and introduces unwanted harmonic distortion, making the bass sound muddy and "flabby."</p>
                <p>Adamson’s Kevlar cones are incredibly light yet structurally rigid. Because the cone does not flex, it moves as a perfectly solid piston. The impulse response is exceptionally fast, allowing the driver to stop and start with high precision. For the mix engineer, this means the bass doesn’t just rumble; it punches. You can hear the attack of a bass guitar pick and the beater of a kick drum hitting the skin, even down at 40Hz. Because the transient response is so clean, these subwoofers are highly effective for building phase-aligned directional arrays.</p>

                <h2>Front-Back-Front (FBF) Cardioid Deployments</h2>
                <p>When it comes to keeping that Kevlar-driven bass off the stage, system techs heavily utilize a specific gradient cardioid block known as FBF (Front-Back-Front). In standard arrays, low frequencies wrap around the cabinets and flood the stage. To resolve this, techs stack subwoofers in blocks of three: the bottom sub faces the audience, the middle sub faces the stage (reversed), and the top sub faces the audience.</p>
                <p>Adamson provides factory-optimized DSP presets inside their Lab Gruppen PLM amplifiers to handle this FBF configuration. The reversed middle box is delayed, polarity-inverted, and EQ-compensated to match the rearward acoustic path of the two front-facing boxes. Because the E119 is front-loaded and extremely phase-linear, the rear cancellation achieved by reversing the middle box is immense. This setup creates a massive, broad-band null on the stage (often exceeding 15dB of rejection), keeping the monitor world quiet while the audience gets full low-end energy.</p>
                <p><em>(Editor’s note: Deploying a gradient stack with a rig that doesn’t have factory presets? You need to calculate the depth offset and delay times manually. Use our <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">Subwoofer Array Calculator</a>, punch in the physical depth of your cabinets, and get the exact millisecond values to lock your phase in).</em></p>

                <h2>Blueprint AV: Designing and Phase-Aligning the Array</h2>
                <p>To predict and calculate these setups, Adamson techs use <strong>Blueprint AV</strong>, their proprietary 3D prediction software. Blueprint is fast and heavily focused on rigging mechanics and acoustic simulation. If an engineer wants to fly a line of E119 subwoofers right next to an E15 main hang, Blueprint allows them to model the phase interaction between the mains and the flown subs.</p>
                <p>The software displays the "Virtual Acoustic Center" of the arrays. Because flown subs and flown mains are rarely hung perfectly flush, their acoustic centers are physically offset, causing phase misalignment at the crossover frequency. Blueprint calculates this physical offset and tells the system tech exactly how many milliseconds of <a href="../app.html#delay" class="text-primary font-bold hover:underline">delay</a> to apply to the sub hang to align the wavefronts at the listener position. This ensures coherent summation, preventing a phase cancellation "hole" in the crossover region.</p>

                <h2>The Future: CS-Series and Networked Subwoofers</h2>
                <p>Adamson is currently pushing the industry forward with their CS-Series (such as the CS119 sub). Historically, Adamson was a passive speaker company reliant on Lab Gruppen amp racks. The CS-Series puts the amplification and the DSP directly inside the Kevlar subwoofer. However, they did not just make it self-powered; they made it a fully networked node using Milan AVB (Audio Video Bridging) over Ethernet.</p>
                <p>You run a single power cable and a single Cat5e network cable to the CS119. That single network cable carries the digital audio signal, telemetry data (temperature, limiting, impedance), and control software data perfectly in sync, with practically zero latency. When you build a cardioid array with CS-Series subs, you do not need to touch an amp rack. You map it in Blueprint AV, push the network update, and the internal DSP in each individual subwoofer aligns the phase and delay perfectly. You can verify the phase coherence across the room using our web-based <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA Spectrum Analyzer</a>.</p>

                <h2>Summary</h2>
                <p>By combining Kevlar cone technology with advanced network integration, Adamson Systems has redefined low-end control. Whether deploying passive E119s in an FBF stack or flying networked CS119 arrays, the goal remains the same: maximum impact in the crowd, absolute silence on the stage, and perfect phase alignment throughout the venue.</p>
            </div>
        `
});
