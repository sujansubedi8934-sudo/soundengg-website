window.soundEnggBlogs = window.soundEnggBlogs || [];
window.soundEnggBlogs.push({
    "id": "subwoofer-arrays",
    "category": "subs",
    "categoryLabel": "SUBWOOFER THEORY",
    "title": "The Battle for the Backstage: Cardioid vs. End-Fire Arrays",
    "excerpt": "De-mystifying the physics of directional low-end. Learn the delay, spacing, and polarity math for cardioid and end-fire subwoofer arrays.",
    "readTime": "20 MIN READ",
    "seoKeywords": [
        "Cardioid subwoofer array setup",
        "End-Fire subwoofer calculation",
        "directional subwoofers live sound",
        "crossover delay timing",
        "comb filtering low end"
    ],
    "content": `
            <div class="article-header">
                <span class="cat-tag">SUBWOOFER THEORY</span>
                <h1>The Battle for the Backstage: Directional Low-End</h1>
                <p class="article-meta">By Sujan Subedi | 20 Minute Read | Updated June 2026</p>
            </div>
            <div class="article-body">
                <p>Subwoofers are omnidirectional by nature. Because low-frequency acoustic wavelengths are massive—a 40Hz wave is roughly 28 feet (8.5 meters) long—they ignore the physical size of standard speaker cabinets. Instead of projecting forward, the bass energy wraps around the enclosures and radiates equally in all directions, spilling backward onto the stage. This low-end spill creates a muddy rumble that destroys vocal clarity and annoys performers. To regain control of the stage, system technicians deploy **directional subwoofer arrays**.</p>

                <h2>1. The Cardioid Array: Rear-Rejection Specialist</h2>
                <p>A Cardioid array (also known as a gradient or back-to-back array) is designed to create a deep cancellation zone directly behind the subwoofers, keeping the stage quiet. The most common configuration uses a stack of two subwoofers: one facing the audience (front-firing) and one facing the stage (rear-firing).</p>
                <p>To configure a cardioid array, you must apply precise delay and polarity processing to the rear-firing enclosure:
                <ol>
                    <li><strong>Measure Physical Spacing:</strong> Determine the distance ($D$) between the acoustic centers of the front and rear subwoofers (typically the cabinet depth, around 2.5 to 3 feet).</li>
                    <li><strong>Calculate Time Delay:</strong> Use the speed of sound to find the time ($t$) it takes for sound to travel this distance: $t = D/c$. For a 3-foot cabinet, this is roughly 2.7 milliseconds. Apply this delay to the rear-firing subwoofer.</li>
                    <li><strong>Invert Polarity:</strong> Invert the polarity (180-degree phase shift) of the rear-firing subwoofer.</li>
                </ol>
                Because of the physical distance, the sound traveling forward from the rear subwoofer arrives in phase with the front subwoofer, reinforcing the bass in the audience. However, the sound traveling backward from the front subwoofer arrives at the rear cabinet at the exact same time as the delayed, polarity-inverted rear output. The two waves cancel each other out, creating a massive reduction in stage volume (often up to 15dB to 20dB of rear rejection).</p>

                <h2>2. The End-Fire Array: High-Output Low-End Beam</h2>
                <p>An End-Fire array is built for projection and power. Unlike a cardioid stack, all subwoofers in an end-fire array face forward toward the audience, arranged in a straight physical line (one in front of the other) from back to stage-front.</p>
                <p>To align an end-fire array, you delay the subwoofers progressively to match the physical travel time of the sound wave:
                <ul>
                    <li>The rear-most subwoofer receives 0ms of delay.</li>
                    <li>The second subwoofer is delayed by the time it takes sound to travel from the first subwoofer to the second ($t = D/c$).</li>
                    <li>The third subwoofer is delayed by the total travel time from the first to the third, and so on.</li>
                </ul>
                As the acoustic wave from the rear subwoofer travels forward, it passes each subsequent subwoofer just as they fire. This creates a highly focused, additive beam of low-end energy that projects deep into the venue. Behind the array, the sound waves arrive at different times with different phases, resulting in passive cancellation. However, this rear cancellation is less focused than a cardioid array and requires substantial stage depth (often 15 to 20 feet for a 4-cabinet array).</p>

                <h2>3. Horizontal Steered Subwoofer Arrays</h2>
                <p>When subwoofers are placed in a solid horizontal line across the front of a stage, they act as a single wide line source. This narrows the horizontal coverage beam, creating a narrow "power alley" down the center of the room while leaving the sides of the venue with no bass. This is known as **lobing**.</p>
                <p>To widen the coverage, you must **steer** the array electronically. By applying incremental delays starting from the center subwoofers and increasing toward the outer edges (known as delay shading), you can bend the wavefront into an arc. This spreads the low-end energy evenly across the entire horizontal plane of the venue, ensuring the audience on the sides hears the same rich low-end as the center row.</p>

                <h2>4. The Cost of Improper Timing</h2>
                <p>The boundary between a clean directional array and a comb-filtered mess is measured in milliseconds. If your delay calculations are off by even 1ms, the phase relationship will shift, and the cancellation zone will fail. Instead of a quiet stage, you will create phase nulls in the audience, causing certain bass notes to disappear entirely. Always use a laser measure to determine physical distances and verify the output phase alignment using a dual-channel FFT analyzer.</p>
                <p><em>(Editor’s note: Designing subwoofer arrays but want to avoid manual delay calculations? Use our interactive web-based <a href="../app.html#subcalc" class="text-primary font-bold hover:underline">Subwoofer Array Delay Calculator</a>. Just enter your cabinet layout and distance, and the tool will calculate the exact delays and polarity settings needed for your processor).</em></p>

                <h2>Summary</h2>
                <p>Low-end control is a matter of physics and timing. By utilizing cardioid arrays to keep low frequencies off the stage, deploying end-fire arrays for maximum projection in deep venues, and using horizontal steering to eliminate the power alley, you can deliver clean, punchy low-end throughout the venue. Monitor the results using the <a href="../app.html#rta" class="text-primary font-bold hover:underline">RTA Spectrum Analyzer</a> to maintain a balanced frequency response.</p>
            </div>
        `
});
