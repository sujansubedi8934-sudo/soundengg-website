window.soundEnggBlogs = window.soundEnggBlogs || [];
window.soundEnggBlogs.push({
    "id": "end-fire-subwoofer-arrays",
    "category": "subs",
    "categoryLabel": "SUBWOOFERS",
    "isPro": false,
    "title": "The End-Fire Subwoofer Array: The Ultimate Guide to Punch and Directionality",
    "excerpt": "A deep dive into End-Fire subwoofer arrays. Learn the physics of time-based steering, the quarter-wavelength spacing rule, and how to configure them for maximum forward impact.",
    "readTime": "10 MIN READ",
    "seoKeywords": [
        "End-Fire Subwoofer Array",
        "Subwoofer Steering",
        "Time Alignment",
        "Phase Interaction",
        "Low Frequency Directionality",
        "Live Sound Arrays"
    ],
    "content": `
            <div class="article-header">
                <span class="cat-tag">SUBWOOFERS</span>
                <h1>The End-Fire Subwoofer Array: The Ultimate Guide to Punch and Directionality</h1>
                <p class="article-meta">By SoundEngg Editorial Team | 10 Minute Read | Updated June 2026</p>
            </div>
            <div class="article-body">
                <p>If you want to start an argument at a local crew meal, ask the system tech and the FOH engineer what their favorite subwoofer configuration is. Half the table will swear by gradient cardioid blocks, and the other half will aggressively defend the <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">end-fire subwoofer array</a>. While both configurations have the same primary goal—keeping bass off the stage and pushing it into the audience—they sound and feel completely different.</p>
                <p>If you are mixing a heavy rock, metal, or EDM festival and you need a system that hits the audience in the chest like a physical battering ram while keeping the stage relatively quiet, end-fire is the weapon of choice. But it requires real estate, lots of amplifier channels, and precise math. Let’s break down how it actually works.</p>
                
                <h2>What Is an End-Fire Array?</h2>
                <p>Instead of stacking all your subs in a single line across the front of the stage, an end-fire array lines them up front-to-back, one behind the other, all facing forward. A typical end-fire array uses four rows of subwoofers spaced a specific distance apart.</p>
                <p>If you just fire them all at the same time, you get an absolute phase disaster. The sound from the rear sub will hit the audience slightly later than the sound from the front sub, causing smearing and comb filtering. To make it work, we use precise time <a href="../app.html#delay" class="text-primary font-bold hover:underline">delay</a> to synchronize the forward wavefront, steering the energy forward while causing phase cancellation in the rear direction.</p>
                
                <h2>The Math Behind the Punch</h2>
                <p>Here is the step-by-step physics of how an end-fire array operates. Let's assume a four-row deep array:</p>
                <ol>
                    <li><strong>The Start:</strong> The acoustic wave starts at the rear box (Box 1). We apply zero delay to this box. When the kick drum hits, Box 1 fires instantly.</li>
                    <li><strong>The Travel:</strong> The sound wave from Box 1 travels physically through the air toward the front of the stage.</li>
                    <li><strong>The Sync:</strong> Just as the sound wave from Box 1 physically passes the second row (Box 2), Box 2 fires. We do this by electronically delaying Box 2 by the exact travel time between the two boxes.</li>
                    <li><strong>The Accumulation:</strong> We repeat this process. As the combined wave passes Box 3, Box 3 fires. When the massive combined wave passes Box 4, Box 4 fires.</li>
                </ol>
                <p>In the forward direction (audience side), the acoustic energy from all four subwoofers perfectly aligns in time and phase, creating a focused, highly impactful wavefront. This is why engineers love end-fire—it delivers the tightest, most aggressive transient punch of any array configuration.</p>
                
                <h2>How It Cancels the Rear Stage Wash</h2>
                <p>So, we know why it is loud in the front, but how does it keep the stage quiet? At the front of the array, all four boxes arrive in perfect phase. But at the rear (on stage), the timing is completely scrambled. When Box 4 (the front box) fires backward toward the stage, it is already electronically delayed. By the time that wave travels backward and passes Box 1, it is completely out of phase. Because the boxes are firing at different relative times in the backward direction, they actively interfere with one another. The low-frequency energy cancels out before it can roll onto the stage.</p>
                
                <h2>The Quarter-Wavelength Spacing Rule</h2>
                <p>You cannot just place the rows of subs at random distances. An end-fire array is tuned to a specific target frequency based on physical spacing. We space the acoustic centers of the rows one-quarter wavelength (1/4 λ) of the target frequency apart. If you want maximum rear cancellation at 60Hz: a 60Hz wave is 18.8 feet (5.7 meters) long. One-quarter of that is 4.7 feet (1.43 meters).</p>
                <p>You physically place the acoustic center of each row 4.7 feet apart. Then, you set your delays. Sound travels 4.7 feet in roughly 4.1 milliseconds. Row 1 (Rear) gets 0 ms, Row 2 gets 4.1 ms, Row 3 gets 8.2 ms, and Row 4 (Front) gets 12.3 ms. Because end-fire relies purely on progressive delays instead of polarity inversion, it has a larger physical footprint but provides a narrower, more directional low-frequency beam than a standard cardioid setup.</p>
                <p><em>(Editor’s note: Doing this math in your head while dealing with stagehands is a recipe for error. Open up our <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">Subwoofer Array Calculator</a>, plug in your target frequency and temperature, and we will spit out the exact physical measurements and millisecond <a href="../app.html#delay" class="text-primary font-bold hover:underline">delay calculations</a> you need for your DSP).</em></p>
            </div>
        `
});
