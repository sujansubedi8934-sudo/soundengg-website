window.soundEnggBlogs = window.soundEnggBlogs || [];
window.soundEnggBlogs.push({
    "id": "tool-spl-distance",
    "category": "acoustics",
    "categoryLabel": "TOOL DEEP DIVE",
    "title": "Tool Deep Dive: Decoding SPL Distance Attenuation",
    "excerpt": "Predicting how loud your PA will be in the back row. Understanding the inverse square law using our SPL tool.",
    "readTime": "7 MIN READ",
    "seoKeywords": [
        "SPL Distance Attenuation",
        "Inverse Square Law",
        "Loudspeaker Output",
        "SPL Calculator",
        "SoundEngg Tools"
    ],
    "content": `
            <div class="article-header">
                <span class="cat-tag">TOOL DEEP DIVE</span>
                <h1>Decoding SPL Distance Attenuation</h1>
                <p class="article-meta">By SoundEngg Editorial Team | 7 Minute Read | Updated May 2026</p>
            </div>
            <div class="article-body">
                <p>One of the most common questions an engineer is asked by a promoter is: "Will it be loud enough in the back?" With the <strong>SoundEngg SPL Distance Attenuation Calculator</strong>, you don't have to guess. You can prove it with math.</p>

                <h2>1. The Inverse Square Law</h2>
                <p>In a free field (outdoors, away from reflecting walls), sound energy drops significantly as you move away from the source. For a standard "Point Source" speaker, the rule is the <strong>Inverse Square Law</strong>: You lose 6 decibels (dB) of Sound Pressure Level (SPL) every time your distance from the speaker doubles.</p>
                <p>If your speaker produces 130dB at 1 meter, it will produce 124dB at 2 meters, 118dB at 4 meters, and 112dB at 8 meters. Our calculator does all of this logarithmic math for you instantly.</p>

                <h2>2. Using the Tool for System Design</h2>
                <p>Before you load the truck, check the venue dimensions. If the audience stretches 32 meters back, you know you will lose roughly 30dB from the speaker's 1-meter output spec. If the client demands 100dB of rock-concert volume in the back row, your speaker must be capable of producing at least 130dB at 1 meter. If it only produces 120dB, the back row will only hear 90dB—you need a bigger PA or delay towers.</p>

                <h2>3. Point Source vs. Line Source</h2>
                <p>Our tool provides calculations for both Point Sources (6dB drop per doubling) and theoretical Line Sources (3dB drop per doubling). While true line sources only exist in theory, large line arrays behave closely to a 3dB drop in their "near-field." Using the Line Source option gives you an approximation of how a large-format line array will carry energy to the back of a stadium compared to a standard ground-stacked speaker.</p>

                <h2>Summary</h2>
                <p>Math doesn't lie. Use the SPL Distance tool during the pre-production phase to ensure you are bringing the right amount of firepower to the gig, keeping both the client and the audience happy.</p>
            </div>
        `
});
