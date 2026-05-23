window.soundEnggBlogs = window.soundEnggBlogs || [];
window.soundEnggBlogs.push({
    "id": "dante-redundancy-pro",
    "category": "dante",
    "categoryLabel": "DANTE & IP",
    "title": "Dante Redundancy & Clocking: Building the Bulletproof Network",
    "excerpt": "Primary vs. Secondary workflows: Ensuring your digital snake never clicks, pops, or drops out during a show.",
    "readTime": "12 MIN READ",
    "seoKeywords": [
        "Dante Redundancy",
        "Network Audio",
        "Word Clock",
        "Dante Controller",
        "SoundEngg"
    ],
    "content": `
            <div class="article-header">
                <span class="cat-tag">DANTE & IP</span>
                <h1>Dante Redundancy & Clocking: The Bulletproof Network</h1>
                <p class="article-meta">By SoundEngg Editorial Team | 12 Minute Read | Updated April 2026</p>
            </div>
            <div class="article-body">
                <p>Dante has revolutionized audio routing, but it brings new risks. A standard network cable failing on a 64-channel snake can silence an entire festival. To prevent this, we use **Dante Redundancy** and **Precision Clocking**.</p>

                <h2>1. Primary vs. Secondary Networks</h2>
                <p>True Dante redundancy involves two physically separate networks. Every device (Console, Stage Box, Amp) is connected to a "Primary" switch and a "Secondary" switch. If a cable on the Primary network is cut, the audio switches to the Secondary network **instantly and sample-accurately**. There is no gap in the audio. **Crucial Rule:** Never bridge the Primary and Secondary networks; they must remain isolated.</p>

                <h2>2. The Clock Master: The Heartbeat</h2>
                <p>Every digital audio system needs a heartbeat—a Master Clock. In a Dante network, one device is elected as the "Grandmaster." If your clocking is unstable, you get "digital clicks" and "pops." For large systems, it is best to manually designate a **Preferred Master** (usually the FOH console or a dedicated Word Clock generator).</p>

                <h2>3. Managing Bandwidth and Latency</h2>
                <p>Dante is incredibly efficient, but a 96kHz system with 128 channels can put a load on your switches. Always use **Gigabit (1000Mbps) switches** and disable "Green Ethernet" (EEE). For latency, stay at 0.25ms or 0.5ms for stage-to-console runs. Going lower can increase the risk of packet drops on complex networks.</p>

                <h2>4. Summary</h2>
                <p>A Dante network is only as good as its configuration. Use redundancy, respect your clocking, and always monitor your network health in **Dante Controller**. Build a network you can trust, and you can focus on the mix.</p>
            </div>
        `
});
