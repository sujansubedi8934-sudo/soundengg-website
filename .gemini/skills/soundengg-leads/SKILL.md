---
name: soundengg-leads
description: Automated B2B lead generation, prospecting, and personalized email outreach engine for SoundEngg. Discovers verified live audio companies, church AVL directors, concert PA rental houses, corporate AV crews, and live sound academies, extracts decision-maker contacts, crafts tailored pitches, and tracks them in leads_pipeline.csv.
---

# SoundEngg B2B Lead Generation & Outreach Engine

This skill automates high-conversion, personalized B2B client acquisition for SoundEngg across four core pro-audio customer segments.

## 🎯 Target Customer Segments & Value Hooks

| Segment | Target Decision Makers | Primary Pain Point Solved | The Email Hook |
| :--- | :--- | :--- | :--- |
| **1. Church Tech & AVL** | Technical Director, Production Director, Audio Lead | Volunteer mixing, balcony/front-fill delay alignment, wireless feedback | 1-Mic Auto-Ping for quick delay alignment during Sunday rehearsal + 1/24 RTA feedback detection |
| **2. Concert PA & Rental Houses** | Owner, Operations Manager, Head System Tech | Line checks, quick multi-speaker offset alignment, utility cable pinout reference in the shop | 6-second wavefront delay deconvolution off a phone mic without hauling laptops/Smaart rigs |
| **3. Corporate Event AV** | A1 Audio Lead, Project Manager, AV Director | Ballroom speech intelligibility, podium feedback notching, tight changeovers | Fast ballroom distributed delay calculation without stringing extra measurement mics |
| **4. Live Audio Academies** | Program Chair, Live Sound Instructor, Education Director | Teaching delay physics, hands-on frequency recognition drills, student ear training | Interactive 10-round ear training challenge with global leaderboard + practical acoustic calculators |

---

## 🚫 Negative Filters (Strict Non-Targets)

**NEVER outreach to:**
* ❌ Studio recording / mastering / mixing engineers (unless they do live sound)
* ❌ ADR / Voiceover / Foley studios (they do not use PA delay or subwoofer arrays)
* ❌ Wedding DJs or mobile karaoke operators (focus is on live production & pro audio)

---

## 🔍 Discovery & Verification Workflow

When the user asks to generate leads (e.g., *"Find 5 church tech directors in Texas"* or *"Find 5 PA rental houses in the UK"*):

### Step 1: Search Strategy
Run targeted queries to identify real companies:
```text
# Church AVL
site:linkedin.com ("Technical Director" OR "Production Director") ("Church" OR "Worship") "[Location]"
"[Church Name]" "Technical Director" email OR contact

# Concert PA Rental
"concert sound rental" OR "live sound production" "[Location]" -studio -mastering
"[Company Name]" owner OR "operations manager" contact email

# Corporate AV
"event audio visual production" OR "corporate AV staging" "[Location]"
"[Company Name]" A1 OR "audio engineer" email

# Audio Academies
"live sound engineering program" OR "audio technology degree" "[Location]"
"[School Name]" "live sound" instructor OR director email
```

### Step 2: Verification Protocol
Verify:
1. The company is actively in business and operates live sound reinforcement or church AVL.
2. The contact name and role match a real decision-maker.
3. The email is authentic (e.g., direct name@domain.com or info@domain.com).

### Step 3: Pipeline Persistence
Record all qualified leads in `leads_pipeline.csv` using this schema:
```csv
Company,Contact Name,Role,Email,Segment,City/Region,Website,Status,Date Added
```
*Statuses:* `To Contact` | `Emailed` | `Replied` | `Pro Active` | `Client Won`

---

## ✉️ High-Converting Email Templates

### Template 1: Church Technical Director
**Subject:** Quick audio question for the [Church Name] tech team 🎛️

```text
Hi [First Name],

I came across [Church Name]'s production setup—great work keeping weekly worship services running smoothly with your team.

I'm a working live sound engineer and developer of SoundEngg (www.soundengg.com). We built a 1-mic Acoustic Auto-Ping tool that lets church techs time-align front-fills and under-balcony speakers right off a phone mic in 6 seconds, alongside an offline 1/24-octave RTA to ring out vocal mic feedback.

Quick 6-second video demo of the Auto-Ping:
👉 https://www.facebook.com/share/v/1KB6iAYs85/

I’d love to gift your audio team free Lifetime Pro access to test on your sanctuary setup—zero strings attached, just want fellow church techs to have it in their kit:
👉 Download: https://www.soundengg.com/download

If you'd like to test it out this weekend, let me know what email address you use and I'll unlock full Pro access for you right away!

Best regards,
Sujan Subedi
Live Sound Engineer & Creator of SoundEngg
sujan@soundengg.com
```

### Template 2: Concert PA Rental House / Production Company
**Subject:** Time-aligning fills on tight soundchecks (Tool for [Company Name] crews)

```text
Hi [First Name],

Following [Company Name]'s live concert rigs and festival stages—impressive deployment work across your events.

I'm a working live sound engineer and developed SoundEngg (www.soundengg.com), an all-in-one mobile utility designed to eliminate guesswork during tight festival changeovers and line checks.

Our main tool is a 1-Mic Acoustic Auto-Ping delay finder. It measures dual wavefront arrivals (fill vs main PA) and outputs the arrival delta in milliseconds and feet/meters directly on a phone mic without dragging out a laptop, interface, or laser meter:
👉 6-Second Demo: https://www.facebook.com/share/v/1KB6iAYs85/

It also includes 1/24-octave RTA analysis and instant offline pinout references (XLR, SpeakON NL4/NL8, DMX512, DB25) for quick cable repairs in the shop or on stage.

I'd love to set your lead techs up with free Lifetime Pro access to keep in their gig kits:
👉 https://www.soundengg.com/download

Let me know if you'd be open to testing it on an upcoming show!

Best regards,
Sujan Subedi
Live Sound Engineer & Creator of SoundEngg
sujan@soundengg.com
```

### Template 3: Live Audio Academy / College Program
**Subject:** Ear training & delay physics utility for [School Name] live audio students

```text
Hi [First Name],

I've been following [School Name]'s live sound curriculum—fantastic program preparing students for real-world touring and venue production.

I'm a working live sound engineer and developed SoundEngg (www.soundengg.com), an audio engineering utility suite used by working FOH mixers.

For audio students, we built an interactive Ear Training Lab with real-time randomized ISO frequency cut/boost drills (20 Hz - 20 kHz) to help them identify feedback frequencies by ear, alongside an acoustic delay deconvolution tool (Auto-Ping) that demonstrates speed-of-sound wavefront physics in real time.

I would love to provide free Pro access for your live sound faculty and explore bulk access for your incoming audio cohort.

You can check out the challenge and app here:
• Ear Training: https://www.soundengg.com/challenge.html
• App Overview: https://www.soundengg.com/download

Happy to share faculty licenses whenever you have a moment!

Best regards,
Sujan Subedi
Live Sound Engineer & Creator of SoundEngg
sujan@soundengg.com
```
