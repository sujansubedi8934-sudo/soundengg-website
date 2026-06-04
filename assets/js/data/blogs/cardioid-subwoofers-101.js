window.soundEnggBlogs = window.soundEnggBlogs || [];
window.soundEnggBlogs.push({
    "id": "cardioid-subwoofers-101",
    "category": "subs",
    "categoryLabel": "SUBWOOFERS",
    "isPro": false,
    "title": "Cardioid Subs 101: How to Keep the Low End Off Your Stage",
    "excerpt": "A system engineer's guide to cardioid subwoofers. Learn the physics of gradient arrays, how delay and polarity create cancellations, and how to keep your stage rumble-free.",
    "readTime": "10 MIN READ",
    "seoKeywords": [
        "Cardioid Sub Array",
        "Gradient Subwoofer Array",
        "Polarity Inversion",
        "Phase Cancellation",
        "Stage Rumble",
        "Subwoofer Delay"
    ],
    "content": `
            <div class="article-header">
                <span class="cat-tag">SUBWOOFERS</span>
                <h1>Cardioid Subs 101: How to Keep the Low End Off Your Stage</h1>
                <p class="article-meta">By SoundEngg Editorial Team | 10 Minute Read | Updated June 2026</p>
            </div>
            <div class="article-body">
                <p>Let's talk about the dreaded "bass wash." You are mixing a corporate band in a highly reverberant ballroom. You push up the bass fader, and suddenly the entire stage is vibrating. The lead singer is complaining they can't hear their wedge, the acoustic guitar is aggressively feeding back at 80Hz, and the room sounds like a swamp. Your subs are dumping just as much energy backward onto the stage as they are forward into the crowd. You need a compact solution that kills the rear bass energy without requiring a massive stage footprint.</p>
                <p>Enter the Gradient Subwoofer Array—more commonly known in the industry as the <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">Cardioid Sub Array</a>. By utilizing phase cancellation, we can shape low-frequency energy to protect the stage. Let's break down how they actually work.</p>
                
                <h2>The Problem with Omnidirectional Subs</h2>
                <p>A single subwoofer radiates omnidirectionally at low frequencies. This is because wavelengths are extremely long. At 50Hz, a sound wave is roughly 22.5 feet (6.8 meters) long. Because these waves are so physically large compared to the wooden cabinet they are coming out of, standard subwoofers wrap sound around themselves, dumping equal energy in all directions. For the front-of-house mix, this creates a muddy low-end. For the stage, it is a monitor feedback nightmare. Acoustic guitars feed back, mic diaphragms rumble, and low frequencies bounce off the back walls, causing cancellations across the venue.</p>
                
                <h2>What is a Cardioid Pattern?</h2>
                <p>Cardioid means "heart-shaped." In sub arrays, this translates to strong forward energy and highly reduced rear energy. To achieve a cardioid polar pattern with low frequencies, we place one or more subwoofers facing backward toward the stage, and use a combination of physical spacing, time <a href="../app.html#delay" class="text-primary font-bold hover:underline">delay</a>, and polarity inversion to cancel out the stage wash.</p>
                
                <h2>The Standard 2:1 Cardioid Block (3-Box Stack)</h2>
                <p>The most common cardioid configuration on tour is the three-box stack. Imagine three identical subwoofers stacked on top of each other. The bottom and top subs face forward toward the audience. The middle sub is physically turned around, facing backward toward the stage.</p>
                <p>To make the rear-facing sub cancel out the stage wash without destroying the front mix, we follow two crucial steps in our DSP:</p>
                <ol>
                    <li><strong>The Delay:</strong> We need the sound wave from the front-facing boxes to reach the rear-facing box before it fires. We measure the physical depth of the cabinet (e.g., 30 inches or 0.76 meters) and calculate the travel time. At 20°C, sound travels 1 meter in about 2.9 milliseconds. We apply a 2.2 ms <a href="../app.html#delay" class="text-primary font-bold hover:underline">delay</a> to the rear-facing sub.</li>
                    <li><strong>The Polarity Flip:</strong> Now, the waves are aligned in time at the back of the stack. To cancel them, we invert the polarity on the amplifier channel driving the rear-facing sub.</li>
                </ol>
                <p>At the rear of the stack (on the stage), you now have two identical low-frequency waves occupying the same space at the same time, but they are 180 degrees out of polarity. They actively cancel each other out, creating a massive "null" of silence behind the array. At the front (audience side), the delayed rear-facing sub is completely out of time, so it doesn't cancel the mains. You lose only 1 to 2 dB of forward output, but the dead-quiet stage is worth the trade-off.</p>
                
                <h2>Spacing and Variations</h2>
                <p>You can also build a cardioid setup with just two subs side-by-side or stacked (one facing front, one facing rear). While the rear cancellation is just as effective, you sacrifice a bit more forward output because the ratio of front-to-rear energy is 1:1 instead of 2:1. Spacing must be measured accurately from the acoustic centers of the cabinets. Incorrect spacing or wrong delay settings will skew the null, causing low-mid build-up where you want silence. Always verify your cancellation using an <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA</a> measurement mic behind the array during soundcheck.</p>
                <p><em>(Editor’s note: Calculating physical offsets and converting them to milliseconds on a dark stage is a recipe for error. Use our interactive <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">Subwoofer Array Calculator</a> to enter your cabinet dimensions and get the exact delay times and spacing parameters needed to lock your cardioid array in tight).</em></p>
            </div>
        `
});
