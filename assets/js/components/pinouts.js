// --- LIVE PRODUCTION PINOUT COMPONENT & SPECIFICATION ENGINE ---

const PINOUT_CATS = [
    {id:'all', label:'All'},
    {id:'analog', label:'Analog & Intercom'},
    {id:'speaker', label:'Touring Speaker'},
    {id:'adapter', label:'Adapters & Turnarounds'},
    {id:'digital', label:'Digital Audio & Sync'},
    {id:'lighting', label:'Lighting & DMX'},
    {id:'power', label:'Stage Power & Distro'}
];

const PINOUT_DATA = [
  // ==========================================
  // CATEGORY 1: ANALOG AUDIO, INTERCOM & MULTIPIN (12 Entries)
  // ==========================================
  {
    id: 'xlr3',
    aliases: ['xlr-3', 'xlr3m', 'xlr3f'],
    name: 'XLR 3-Pin Balanced Mic/Line',
    cat: 'analog',
    tag: 'Balanced mic/line',
    color: '#378ADD',
    desc: 'The universal professional standard for balanced analog microphone and line-level interconnection (IEC 61076-2-103 / AES14). Pin 2 is defined as hot (non-inverting). Full common-mode rejection cancels induced EMI/RFI noise.',
    uses: ['Microphone', 'Line level balanced', 'Balanced console send/return', 'DI box output'],
    pins: [
      {n:'1', pin:'1', sig:'Ground / Shield', name:'Ground / Shield', color:'#888780', col:'#888780', note:'Cable screen & chassis ground', desc:'Cable screen & chassis ground'},
      {n:'2', pin:'2', sig:'Hot (+)', name:'Hot (+)', color:'#E24B4A', col:'#E24B4A', note:'Positive / non-inverting audio phase', desc:'Positive / non-inverting audio phase'},
      {n:'3', pin:'3', sig:'Cold (−)', name:'Cold (−)', color:'#ffffff', col:'#ffffff', note:'Negative / inverting audio phase', desc:'Negative / inverting audio phase', border:'#cccccc'}
    ],
    phantomSafety: 'safe',
    cableSpec: '22–24 AWG Shielded Twisted Pair (110Ω STP, <60 pF/m)',
    troubleshootTip: 'Continuity: Pins 1-1, 2-2, 3-3 (<0.5Ω). Insulation: Pins 1-2, 1-3, 2-3 (>100MΩ open). Verify Pin 1 is NOT bridged to outer shell in mic lines to prevent ground loops.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#444" stroke-width="1.5"/><circle class="interactive-svg-pin" data-pin="2" cx="24" cy="34" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text class="interactive-svg-pin" data-pin="2" x="24" y="38" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">2</text><circle class="interactive-svg-pin" data-pin="1" cx="56" cy="34" r="8" fill="#888780" stroke="#666" stroke-width="1"/><text class="interactive-svg-pin" data-pin="1" x="56" y="38" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">1</text><circle class="interactive-svg-pin" data-pin="3" cx="40" cy="62" r="8" fill="#eee" stroke="#ccc" stroke-width="1"/><text class="interactive-svg-pin" data-pin="3" x="40" y="66" text-anchor="middle" fill="#333" font-size="10" font-weight="500">3</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {
    id: 'ts',
    aliases: ['mono-jack', 'ts-14', 'ts-unbalanced'],
    name: '1/4" TS — 6.35mm Mono Jack',
    cat: 'analog',
    tag: 'Unbalanced mono',
    color: '#EF9F27',
    desc: 'Two-conductor unbalanced connector. Tip carries audio signal; Sleeve carries ground return and cable shielding. Industry standard for electric guitars, passive/active basses, effects pedals, and synth unbalanced outputs.',
    uses: ['Electric guitar/bass', 'Unbalanced synth output', 'Effects pedal loop', 'Amp footswitch'],
    warn: 'Unbalanced — susceptible to electro-magnetic interference over runs >6m (20ft). Use an active/passive DI box for stage runs.',
    pins: [
      {n:'T', pin:'T', sig:'Tip — Signal (+)', name:'Tip — Signal (+)', color:'#EF9F27', col:'#EF9F27', note:'Center audio conductor', desc:'Center audio conductor'},
      {n:'S', pin:'S', sig:'Sleeve — Ground / Shield', name:'Sleeve — Ground / Shield', color:'#888780', col:'#888780', note:'Outer ground and shield barrel', desc:'Outer ground and shield barrel'}
    ],
    phantomSafety: 'danger',
    cableSpec: '20–22 AWG High-Z Coaxial Instrument Cable (<70 pF/m)',
    troubleshootTip: 'Measure Tip-to-Tip (<0.3Ω) and Sleeve-to-Sleeve (<0.3Ω). Verify Tip-to-Sleeve is infinite (>50MΩ). Inspect plug shaft for bent tip groove or oxidized sleeve barrel.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="10" y="38" width="60" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect class="interactive-svg-pin" data-pin="T" x="10" y="38" width="20" height="14" rx="7" fill="#EF9F27" stroke="#BA7517" stroke-width="1"/><text class="interactive-svg-pin" data-pin="T" x="20" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">T</text><text class="interactive-svg-pin" data-pin="S" x="55" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {
    id: 'trs',
    aliases: ['stereo-jack', 'trs-14', 'trs-balanced'],
    name: '1/4" TRS — 6.35mm Stereo / Balanced',
    cat: 'analog',
    tag: 'Balanced / stereo',
    color: '#1D9E75',
    desc: 'Three-conductor 1/4" jack. Tip = Hot (+), Ring = Cold (−), Sleeve = Ground/Shield. Used for professional balanced line-level interconnects, stereo headphones (Tip = Left, Ring = Right), and single-jack console insert points.',
    uses: ['Balanced monitor line send', 'Audio interface line I/O', 'Stereo headphones', 'Console insert loop'],
    pins: [
      {n:'T', pin:'T', sig:'Tip — Hot (+) / Left', name:'Tip — Hot (+) / Left', color:'#E24B4A', col:'#E24B4A', note:'Positive balanced signal or Left headphone', desc:'Positive balanced signal or Left headphone'},
      {n:'R', pin:'R', sig:'Ring — Cold (−) / Right', name:'Ring — Cold (−) / Right', color:'#1D9E75', col:'#1D9E75', note:'Negative balanced signal or Right headphone', desc:'Negative balanced signal or Right headphone'},
      {n:'S', pin:'S', sig:'Sleeve — Ground / Shield', name:'Sleeve — Ground / Shield', color:'#888780', col:'#888780', note:'Common shield & audio ground', desc:'Common shield & audio ground'}
    ],
    phantomSafety: 'caution',
    cableSpec: '22–24 AWG Balanced Twisted Pair with Shield (110Ω)',
    troubleshootTip: 'Tip-Tip <0.4Ω, Ring-Ring <0.4Ω, Sleeve-Sleeve <0.4Ω. Verify no short between Tip and Ring or Ring and Sleeve. CAUTION: Hot-plugging TRS into phantom inputs causes momentary DC shorts!',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="38" width="64" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect class="interactive-svg-pin" data-pin="T" x="8" y="38" width="18" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect class="interactive-svg-pin" data-pin="R" x="29" y="38" width="16" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text class="interactive-svg-pin" data-pin="T" x="17" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text class="interactive-svg-pin" data-pin="R" x="37" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text class="interactive-svg-pin" data-pin="S" x="58" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {
    id: 'minitrs',
    aliases: ['trs35', '35mm-trs', 'mini-jack'],
    name: '3.5mm TRS Mini-Jack (Stereo)',
    cat: 'analog',
    tag: 'Consumer stereo',
    color: '#D4537E',
    desc: 'Miniature 1/8" stereo connector found on consumer laptops, smartphones, tablets, and field recorders. Unbalanced stereo format with Tip = Left channel, Ring = Right channel, and Sleeve = Common ground return.',
    uses: ['Laptop/phone audio out', 'Field recorder line in', 'In-Ear Monitor (IEM) earphones', 'Portable audio players'],
    pins: [
      {n:'T', pin:'T', sig:'Tip — Left Channel', name:'Tip — Left Channel', color:'#E24B4A', col:'#E24B4A', note:'Left unbalanced audio signal', desc:'Left unbalanced audio signal'},
      {n:'R', pin:'R', sig:'Ring — Right Channel', name:'Ring — Right Channel', color:'#1D9E75', col:'#1D9E75', note:'Right unbalanced audio signal', desc:'Right unbalanced audio signal'},
      {n:'S', pin:'S', sig:'Sleeve — Ground Return', name:'Sleeve — Ground Return', color:'#888780', col:'#888780', note:'Common ground return', desc:'Common ground return'}
    ],
    phantomSafety: 'danger',
    cableSpec: '26–28 AWG Multi-Conductor Shielded Y-Cable (32Ω–10kΩ)',
    troubleshootTip: 'Check continuity Tip-to-Tip and Ring-to-Ring. Ensure Tip and Ring do not short to Sleeve. Never connect directly to +48V mic inputs without a pad/isolation transformer.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="38" width="52" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect class="interactive-svg-pin" data-pin="T" x="14" y="38" width="15" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect class="interactive-svg-pin" data-pin="R" x="32" y="38" width="12" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text class="interactive-svg-pin" data-pin="T" x="21" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text class="interactive-svg-pin" data-pin="R" x="38" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text class="interactive-svg-pin" data-pin="S" x="57" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">3.5mm</text></svg>`
  },
  {
    id: 'rca',
    aliases: ['phono', 'cinch', 'rca-stereo'],
    name: 'RCA / Phono Connector',
    cat: 'analog',
    tag: 'Consumer unbalanced',
    color: '#D85A30',
    desc: 'Standard consumer and DJ unbalanced coaxial audio connector. Center pin carries signal; outer circular barrel carries ground/shield. Paired in Red (Right) and White/Black (Left). Ground makes contact AFTER center pin during insertion, causing loud thumps if hot-plugged.',
    uses: ['DJ mixer CDJ / Phono turntable', 'Hi-Fi media players', 'Subwoofer line output', 'Consumer tape/aux in'],
    warn: 'Unbalanced — susceptible to RF and ground loop hum over runs >5m. Mute amplifier before plugging/unplugging.',
    pins: [
      {n:'C', pin:'C', sig:'Center Pin — Signal (+)', name:'Center Pin — Signal (+)', color:'#E24B4A', col:'#E24B4A', note:'Audio signal path', desc:'Audio signal path'},
      {n:'O', pin:'O', sig:'Outer Shell — Ground / Shield', name:'Outer Shell — Ground / Shield', color:'#888780', col:'#888780', note:'Coaxial ground screen', desc:'Coaxial ground screen'}
    ],
    phantomSafety: 'danger',
    cableSpec: '75Ω Coaxial or Shielded Single-Pair Audio Cable (<80 pF/m)',
    troubleshootTip: 'Center-to-Center <0.3Ω; Outer-to-Outer <0.3Ω; Center-to-Outer >100MΩ. Inspect outer ground leaf springs for loose mechanical tension causing buzzing.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle class="interactive-svg-pin" data-pin="O" cx="40" cy="45" r="28" fill="#1a1a22" stroke="#888" stroke-width="8"/><circle class="interactive-svg-pin" data-pin="C" cx="40" cy="45" r="10" fill="#E24B4A" stroke="#c0392b" stroke-width="1.5"/><text class="interactive-svg-pin" data-pin="C" x="40" y="49" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">C</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {
    id: 'xlr4',
    aliases: ['xlr4-com', 'xlr-4', 'clearcom-headset'],
    name: 'XLR 4-Pin Intercom & DC Power',
    cat: 'analog',
    tag: 'Intercom & Camera DC',
    color: '#378ADD',
    desc: 'Touring production intercom standard (Clear-Com, RTS, Telex) and professional broadcast video camera DC power feed standard (Sony, Panasonic, ARRI 12V–30V DC). Headset pinout: 1 Mic GND, 2 Mic+, 3 HP GND, 4 HP+. Camera DC pinout: 1 GND, 4 +12V DC.',
    uses: ['Production intercom single-ch headset', '12V/14.4V broadcast camera power', 'Field monitor DC supply', 'LED field lights'],
    pins: [
      {n:'1', pin:'1', sig:'Mic GND / DC (−)', name:'Mic GND / DC (−)', color:'#888780', col:'#888780', note:'Headset mic shield or DC power negative return', desc:'Headset mic shield or DC power negative return'},
      {n:'2', pin:'2', sig:'Mic Hot (+) / N.C.', name:'Mic Hot (+) / N.C.', color:'#E24B4A', col:'#E24B4A', note:'Headset mic unbalanced hot (Unused on camera DC)', desc:'Headset mic unbalanced hot (Unused on camera DC)'},
      {n:'3', pin:'3', sig:'Headphone (−) / N.C.', name:'Headphone (−) / N.C.', color:'#1D9E75', col:'#1D9E75', note:'Headphone ground return (Unused on camera DC)', desc:'Headphone ground return (Unused on camera DC)'},
      {n:'4', pin:'4', sig:'Headphone (+) / +12V–30V DC', name:'Headphone (+) / +12V–30V DC', color:'#EF9F27', col:'#EF9F27', note:'Headphone ear driver (+) or Camera +DC power', desc:'Headphone ear driver (+) or Camera +DC power'}
    ],
    phantomSafety: 'na',
    cableSpec: '4-Conductor Shielded Cable (24 AWG audio pairs or 14–16 AWG power conductors)',
    troubleshootTip: 'Intercom test: Pins 3 to 4 measures headphone DCR (150Ω–600Ω). Pins 1 to 2 measures dynamic mic DCR (150Ω–200Ω). On camera power: verify Pin 4 is +12V to +14.4V DC relative to Pin 1 GND.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><circle class="interactive-svg-pin" data-pin="1" cx="24" cy="32" r="7" fill="#888780"/><text class="interactive-svg-pin" data-pin="1" x="24" y="36" text-anchor="middle" fill="#fff" font-size="9">1</text><circle class="interactive-svg-pin" data-pin="2" cx="56" cy="32" r="7" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="2" x="56" y="36" text-anchor="middle" fill="#fff" font-size="9">2</text><circle class="interactive-svg-pin" data-pin="3" cx="56" cy="58" r="7" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="3" x="56" y="62" text-anchor="middle" fill="#fff" font-size="9">3</text><circle class="interactive-svg-pin" data-pin="4" cx="24" cy="58" r="7" fill="#EF9F27"/><text class="interactive-svg-pin" data-pin="4" x="24" y="62" text-anchor="middle" fill="#fff" font-size="9">4</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">XLR 4-Pin</text></svg>`
  },
  {
    id: 'xlr6',
    aliases: ['xlr6-com', 'xlr-6', 'clearcom-2ch'],
    name: 'XLR 6-Pin Dual-Channel Intercom',
    cat: 'analog',
    tag: 'Dual-channel intercom',
    color: '#7F77DD',
    desc: 'Clear-Com and RTS two-channel partyline intercom standard. Combines two independent audio channels (Channel A and Channel B) with +30V DC system power and balanced microphone lines onto a single locking 6-pin connector (e.g. RS-702 beltpacks).',
    uses: ['Clear-Com dual-channel beltpacks', 'Master station partyline links', 'Theatrical comms interconnects'],
    pins: [
      {n:'1', pin:'1', sig:'Mic Shield / Ground', name:'Mic Shield / Ground', color:'#888780', col:'#888780', note:'Mic audio common ground', desc:'Mic audio common ground'},
      {n:'2', pin:'2', sig:'Mic Audio (+)', name:'Mic Audio (+)', color:'#E24B4A', col:'#E24B4A', note:'Microphone unbalanced audio', desc:'Microphone unbalanced audio'},
      {n:'3', pin:'3', sig:'Intercom Line Ground', name:'Intercom Line Ground', color:'#333333', col:'#333333', note:'Power and intercom audio return', desc:'Power and intercom audio return', border:'#888888'},
      {n:'4', pin:'4', sig:'+30V DC System Power', name:'+30V DC System Power', color:'#E24B4A', col:'#E24B4A', note:'+30V DC nominal supply rail', desc:'+30V DC nominal supply rail'},
      {n:'5', pin:'5', sig:'Channel A Audio', name:'Channel A Audio', color:'#378ADD', col:'#378ADD', note:'Partyline Ch A audio bus', desc:'Partyline Ch A audio bus'},
      {n:'6', pin:'6', sig:'Channel B Audio', name:'Channel B Audio', color:'#1D9E75', col:'#1D9E75', note:'Partyline Ch B audio bus', desc:'Partyline Ch B audio bus'}
    ],
    phantomSafety: 'danger',
    cableSpec: '3-Pair Individually Shielded Touring Audio Cable (22 AWG)',
    troubleshootTip: 'Check DC voltage between Pin 4 (+30V) and Pin 3 (GND): must read +28V to +32V DC. Pin 5 and Pin 6 to Pin 3 should read 0V DC. DANGER: Never patch into audio consoles.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#7F77DD" stroke-width="1.5"/><circle class="interactive-svg-pin" data-pin="1" cx="40" cy="20" r="6" fill="#888780"/><text class="interactive-svg-pin" data-pin="1" x="40" y="24" text-anchor="middle" fill="#fff" font-size="8">1</text><circle class="interactive-svg-pin" data-pin="2" cx="58" cy="30" r="6" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="2" x="58" y="34" text-anchor="middle" fill="#fff" font-size="8">2</text><circle class="interactive-svg-pin" data-pin="3" cx="58" cy="55" r="6" fill="#333" stroke="#888" stroke-width="1"/><text class="interactive-svg-pin" data-pin="3" x="58" y="59" text-anchor="middle" fill="#fff" font-size="8">3</text><circle class="interactive-svg-pin" data-pin="4" cx="40" cy="65" r="6" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="4" x="40" y="69" text-anchor="middle" fill="#fff" font-size="8">4</text><circle class="interactive-svg-pin" data-pin="5" cx="22" cy="55" r="6" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="5" x="22" y="59" text-anchor="middle" fill="#fff" font-size="8">5</text><circle class="interactive-svg-pin" data-pin="6" cx="22" cy="30" r="6" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="6" x="22" y="34" text-anchor="middle" fill="#fff" font-size="8">6</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">XLR 6-Pin</text></svg>`
  },
  {
    id: 'euroblock3',
    aliases: ['phoenix3', 'phoenix-3pin', 'euroblock'],
    name: 'Euroblock / Phoenix 3-Pin (3.81/5.08mm)',
    cat: 'analog',
    tag: 'DSP install balanced',
    color: '#1D9E75',
    desc: 'Detachable screw-terminal or push-in block connector standard in commercial audio DSPs (Biamp Tesira, QSC Q-SYS, BSS Soundweb, Extron). Carries balanced audio: + Hot, − Cold, S Shield. Jumper rules: Balanced OUT to Unbalanced IN: float − for active op-amp, tie − to S for transformer. Unbalanced OUT to Balanced IN: wire + to Hot, tie − to S.',
    uses: ['DSP line/mic inputs & outputs', 'Installed power amplifier inputs', 'Commercial audio wall plates', 'Conference room audio frames'],
    pins: [
      {n:'+', pin:'+', sig:'Hot (+)', name:'Hot (+)', color:'#E24B4A', col:'#E24B4A', note:'Positive non-inverting balanced audio', desc:'Positive non-inverting balanced audio'},
      {n:'−', pin:'−', sig:'Cold (−)', name:'Cold (−)', color:'#ffffff', col:'#ffffff', note:'Negative inverting balanced audio', desc:'Negative inverting balanced audio', border:'#cccccc'},
      {n:'S', pin:'S', sig:'Shield / GND', name:'Shield / GND', color:'#888780', col:'#888780', note:'Cable drain and chassis ground', desc:'Cable drain and chassis ground'}
    ],
    phantomSafety: 'safe',
    cableSpec: '22–24 AWG Foil-Shielded Twisted Pair Install Cable (Belden 8451 / 9451)',
    troubleshootTip: 'Verify terminal screw torque (0.22–0.25 Nm). Check for loose wire whiskers causing shorts between +/− and shield. Measure DC across + and − (should be 0.00V DC).',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="12" y="24" width="56" height="42" rx="4" fill="#0F6E56" stroke="#1D9E75" stroke-width="1.5"/><rect class="interactive-svg-pin" data-pin="+" x="17" y="32" width="12" height="18" rx="2" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="+" x="23" y="45" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">+</text><rect class="interactive-svg-pin" data-pin="−" x="34" y="32" width="12" height="18" rx="2" fill="#fff" stroke="#ccc"/><text class="interactive-svg-pin" data-pin="−" x="40" y="45" text-anchor="middle" fill="#333" font-size="11" font-weight="700">−</text><rect class="interactive-svg-pin" data-pin="S" x="51" y="32" width="12" height="18" rx="2" fill="#888780"/><text class="interactive-svg-pin" data-pin="S" x="57" y="45" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">S</text><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">Euroblock 3P</text></svg>`
  },
  {
    id: 'tt-bantam',
    aliases: ['tt', 'bantam', 'tt-patchbay'],
    name: 'TT / Bantam (4.4mm) Patchbay Jack',
    cat: 'analog',
    tag: 'Studio patchbay',
    color: '#7F77DD',
    desc: 'High-density 0.173" (4.4mm) miniature telephone plug and jack standard (MIL-P-642/13). Universal standard in large-format recording studio consoles (SSL, Neve, API) and broadcast routing frames. Features internal leaf switches for full-normalled and half-normalled routing.',
    uses: ['Recording studio patchbays', 'Broadcast routing frames', 'Outboard analog gear patching'],
    warn: 'EXTREME CAUTION: Hot-patching TT cables while +48V phantom is active causes momentary Tip-Ring-Sleeve shorts, sending massive DC pops into preamps and destroying speaker tweeters.',
    pins: [
      {n:'T', pin:'T', sig:'Tip — Hot (+)', name:'Tip — Hot (+)', color:'#E24B4A', col:'#E24B4A', note:'Positive balanced audio signal', desc:'Positive balanced audio signal'},
      {n:'R', pin:'R', sig:'Ring — Cold (−)', name:'Ring — Cold (−)', color:'#1D9E75', col:'#1D9E75', note:'Negative balanced audio signal', desc:'Negative balanced audio signal'},
      {n:'S', pin:'S', sig:'Sleeve — Ground / Shield', name:'Sleeve — Ground / Shield', color:'#888780', col:'#888780', note:'Patchbay chassis shield & ground', desc:'Patchbay chassis shield & ground'}
    ],
    phantomSafety: 'caution',
    cableSpec: '26 AWG Shielded Twin-Lead High-Flex Patch Cord (110Ω AES rated)',
    troubleshootTip: 'Check normalled switch continuity between top jack ring switch and bottom jack ring lug (<0.2Ω when unplugged; open circuit when plug inserted). Clean tarnished contacts with burnishing tool.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="38" width="52" height="12" rx="6" fill="#888780" stroke="#666" stroke-width="1"/><rect class="interactive-svg-pin" data-pin="T" x="14" y="38" width="14" height="12" rx="6" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="R" x="31" y="38" width="11" height="12" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="T" x="21" y="47" text-anchor="middle" fill="#fff" font-size="8">T</text><text class="interactive-svg-pin" data-pin="R" x="36" y="47" text-anchor="middle" fill="#fff" font-size="8">R</text><text class="interactive-svg-pin" data-pin="S" x="54" y="47" text-anchor="middle" fill="#fff" font-size="8">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">TT 4.4mm</text></svg>`
  },
  {
    id: 'db25',
    aliases: ['dsub25', 'tascam-db25', 'yamaha-db25'],
    name: 'DB25 8-Channel Balanced Snake',
    cat: 'analog',
    tag: '8-Ch balanced snake',
    color: '#D85A30',
    desc: '25-pin D-sub connector carrying 8 independent balanced analog channels. Governed by AES59-2012 (Tascam standard) and legacy Yamaha standard. Tascam alternates Hot/Cold pins in an interleaved triangle pattern across pins 1-25. Yamaha routes differently — connecting a Tascam snake to a Yamaha port shorts 7 out of 8 channels directly to ground!',
    uses: ['Audio interface multichannel line I/O', 'Pro Tools HDX / Lynx / Apollo interfaces', 'Console breakout snakes', 'Summing mixer interconnects'],
    pins: [
      {n:'Ch1', pin:'1', sig:'Ch 1 Hot(24) Cold(12) GND(25)', name:'Ch 1 [Tascam 24/12/25]', color:'#E24B4A', col:'#E24B4A', note:'Tascam: 24(+), 12(−), 25(GND) | Yamaha: 1(+), 14(−), 22(GND)', desc:'Channel 1'},
      {n:'Ch2', pin:'2', sig:'Ch 2 Hot(10) Cold(23) GND(11)', name:'Ch 2 [Tascam 10/23/11]', color:'#EF9F27', col:'#EF9F27', note:'Tascam: 10(+), 23(−), 11(GND) | Yamaha: 2(+), 15(−), 23(GND)', desc:'Channel 2'},
      {n:'Ch3', pin:'3', sig:'Ch 3 Hot(21) Cold(9) GND(22)', name:'Ch 3 [Tascam 21/9/22]', color:'#1D9E75', col:'#1D9E75', note:'Tascam: 21(+), 9(−), 22(GND) | Yamaha: 3(+), 16(−), 24(GND)', desc:'Channel 3'},
      {n:'Ch4', pin:'4', sig:'Ch 4 Hot(7) Cold(20) GND(8)', name:'Ch 4 [Tascam 7/20/8]', color:'#378ADD', col:'#378ADD', note:'Tascam: 7(+), 20(−), 8(GND) | Yamaha: 4(+), 17(−), 25(GND)', desc:'Channel 4'},
      {n:'Ch5', pin:'5', sig:'Ch 5 Hot(18) Cold(6) GND(19)', name:'Ch 5 [Tascam 18/6/19]', color:'#7F77DD', col:'#7F77DD', note:'Tascam: 18(+), 6(−), 19(GND) | Yamaha: 5(+), 18(−), 10(GND)', desc:'Channel 5'},
      {n:'Ch6', pin:'6', sig:'Ch 6 Hot(4) Cold(17) GND(5)', name:'Ch 6 [Tascam 4/17/5]', color:'#D4537E', col:'#D4537E', note:'Tascam: 4(+), 17(−), 5(GND) | Yamaha: 6(+), 19(−), 12(GND)', desc:'Channel 6'},
      {n:'Ch7', pin:'7', sig:'Ch 7 Hot(15) Cold(3) GND(16)', name:'Ch 7 [Tascam 15/3/16]', color:'#639922', col:'#639922', note:'Tascam: 15(+), 3(−), 16(GND) | Yamaha: 7(+), 20(−), 13(GND)', desc:'Channel 7'},
      {n:'Ch8', pin:'8', sig:'Ch 8 Hot(1) Cold(14) GND(2)', name:'Ch 8 [Tascam 1/14/2]', color:'#888780', col:'#888780', note:'Tascam: 1(+), 14(−), 2(GND) | Yamaha: 8(+), 21(−), Chassis', desc:'Channel 8'}
    ],
    phantomSafety: 'safe',
    cableSpec: '8-Pair Individually Shielded Multipair Audio Snake Cable (110Ω AES rated)',
    troubleshootTip: 'Verify channel pairing using continuity sniffer. Test Pin 13 chassis ground isolation. Ensure mating jackscrews match standoffs (US 4-40 UNC vs metric M3). See full matrix table below.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="24" width="64" height="40" rx="3" fill="#1a1a22" stroke="#D85A30" stroke-width="1.5"/><g fill="#378ADD"><circle class="interactive-svg-pin" data-pin="Ch1" cx="14" cy="36" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch2" cx="23" cy="36" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch3" cx="32" cy="36" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch4" cx="41" cy="36" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch5" cx="50" cy="36" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch6" cx="59" cy="36" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch7" cx="68" cy="36" r="3.5"/></g><g fill="#1D9E75"><circle class="interactive-svg-pin" data-pin="Ch8" cx="18" cy="48" r="3.5"/><circle cx="27" cy="48" r="3.5"/><circle cx="36" cy="48" r="3.5"/><circle cx="45" cy="48" r="3.5"/><circle cx="54" cy="48" r="3.5"/><circle cx="63" cy="48" r="3.5"/></g><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">DB25 — 25 pins</text></svg>`
  },
  {
    id: 'lk37',
    aliases: ['lk-37', 'touring-snake-12ch', 'mass37'],
    name: 'LK37 / 37-Pin Touring Audio Sub-Snake',
    cat: 'analog',
    tag: '12-Ch touring snake',
    color: '#378ADD',
    desc: 'Heavy-duty MIL-DTL-5015 bayonet locking circular multipin connector standard for 12-channel live stage drop boxes, drum sub-snakes, and touring multicore splits (Link USA Eurocable, Syntax, Whirlwind MASS). Carries 12 balanced audio channels (36 pins) + 1 central pin (37) for master cable shield/chassis ground.',
    uses: ['12-channel stage drop boxes', 'Drum sub-snakes', 'Active stage split trunks', 'Touring multicore breakouts'],
    pins: [
      {n:'Ch1', pin:'1', sig:'Ch 1 (Pins 1+, 2−, 3 GND)', name:'Ch 1', color:'#E24B4A', col:'#E24B4A', note:'Channel 1 balanced audio', desc:'Pins 1, 2, 3'},
      {n:'Ch2', pin:'2', sig:'Ch 2 (Pins 4+, 5−, 6 GND)', name:'Ch 2', color:'#EF9F27', col:'#EF9F27', note:'Channel 2 balanced audio', desc:'Pins 4, 5, 6'},
      {n:'Ch3', pin:'3', sig:'Ch 3 (Pins 7+, 8−, 9 GND)', name:'Ch 3', color:'#1D9E75', col:'#1D9E75', note:'Channel 3 balanced audio', desc:'Pins 7, 8, 9'},
      {n:'Ch4', pin:'4', sig:'Ch 4 (Pins 10+, 11−, 12 GND)', name:'Ch 4', color:'#378ADD', col:'#378ADD', note:'Channel 4 balanced audio', desc:'Pins 10, 11, 12'},
      {n:'Ch5', pin:'5', sig:'Ch 5 (Pins 13+, 14−, 15 GND)', name:'Ch 5', color:'#7F77DD', col:'#7F77DD', note:'Channel 5 balanced audio', desc:'Pins 13, 14, 15'},
      {n:'Ch6', pin:'6', sig:'Ch 6 (Pins 16+, 17−, 18 GND)', name:'Ch 6', color:'#D4537E', col:'#D4537E', note:'Channel 6 balanced audio', desc:'Pins 16, 17, 18'},
      {n:'Ch7', pin:'7', sig:'Ch 7 (Pins 19+, 20−, 21 GND)', name:'Ch 7', color:'#639922', col:'#639922', note:'Channel 7 balanced audio', desc:'Pins 19, 20, 21'},
      {n:'Ch8', pin:'8', sig:'Ch 8 (Pins 22+, 23−, 24 GND)', name:'Ch 8', color:'#888780', col:'#888780', note:'Channel 8 balanced audio', desc:'Pins 22, 23, 24'},
      {n:'Ch9', pin:'9', sig:'Ch 9 (Pins 25+, 26−, 27 GND)', name:'Ch 9', color:'#D85A30', col:'#D85A30', note:'Channel 9 balanced audio', desc:'Pins 25, 26, 27'},
      {n:'Ch10', pin:'10', sig:'Ch 10 (Pins 28+, 29−, 30 GND)', name:'Ch 10', color:'#0F6E56', col:'#0F6E56', note:'Channel 10 balanced audio', desc:'Pins 28, 29, 30'},
      {n:'Ch11', pin:'11', sig:'Ch 11 (Pins 31+, 32−, 33 GND)', name:'Ch 11', color:'#185FA5', col:'#185FA5', note:'Channel 11 balanced audio', desc:'Pins 31, 32, 33'},
      {n:'Ch12', pin:'12', sig:'Ch 12 (Pins 34+, 35−, 36 GND)', name:'Ch 12', color:'#534AB7', col:'#534AB7', note:'Channel 12 balanced audio', desc:'Pins 34, 35, 36'},
      {n:'37', pin:'37', sig:'Center Pin 37 — Master Shield', name:'Center Pin 37', color:'#888780', col:'#888780', note:'Overall cable braid & shell chassis ground', desc:'Master Shield / Ground'}
    ],
    phantomSafety: 'safe',
    cableSpec: '12-Pair Heavy-Duty Touring Multicore Cable (Eurocable LK 12-pair, 24 AWG STP)',
    troubleshootTip: 'Check 1-to-1 continuity for all 36 signal pins + Pin 37 center shield (<0.5Ω). Check individual shield isolation (>10MΩ between shields). Inspect heavy rubber bayonet locking ring.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#378ADD" stroke-width="2"/><circle class="interactive-svg-pin" data-pin="37" cx="40" cy="45" r="5" fill="#888780"/><text class="interactive-svg-pin" data-pin="37" x="40" y="48" text-anchor="middle" fill="#fff" font-size="7">37</text><g fill="#378ADD"><circle class="interactive-svg-pin" data-pin="Ch1" cx="40" cy="20" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch2" cx="53" cy="24" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch3" cx="62" cy="35" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch4" cx="65" cy="48" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch5" cx="60" cy="61" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch6" cx="49" cy="69" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch7" cx="35" cy="70" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch8" cx="23" cy="63" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch9" cx="17" cy="51" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch10" cx="17" cy="38" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch11" cx="24" cy="26" r="3.5"/><circle class="interactive-svg-pin" data-pin="Ch12" cx="34" cy="20" r="3.5"/></g><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">LK37 (12-Ch)</text></svg>`
  },

  // ==========================================
  // CATEGORY 2: TOURING LOUDSPEAKER & AMP (6 Entries)
  // ==========================================
  {
    id: 'speakon2',
    aliases: ['nl2', 'nl-2', 'speakon-2pole'],
    name: 'Speakon NL2 (2-Pole Speaker)',
    cat: 'speaker',
    tag: '2-pole speaker',
    color: '#639922',
    desc: 'Neutrik 2-pole twist-lock loudspeaker connector. Carries a single amplifier output channel. Rated at 30A RMS continuous, 250V AC. Touch-proof design complies with IEC 65 / IEC 348. Plugs directly into NL4 sockets (mating to 1+ and 1−).',
    uses: ['Passive stage monitors', 'Small 2-way PA speakers', 'Single channel speaker links'],
    pins: [
      {n:'1+', pin:'1+', sig:'Positive (+)', name:'Positive (+)', color:'#E24B4A', col:'#E24B4A', note:'Amp positive terminal / driver (+)', desc:'Amp positive terminal / driver (+)'},
      {n:'1−', pin:'1−', sig:'Negative (−)', name:'Negative (−)', color:'#1a1a22', col:'#1a1a22', note:'Amp negative return / driver (−)', desc:'Amp negative return / driver (−)', border:'#555555'}
    ],
    phantomSafety: 'na',
    cableSpec: '2-Conductor 14 AWG (2.0mm²) to 12 AWG (3.3mm²) Stranded Copper',
    troubleshootTip: 'Measure DC resistance across 1+ and 1− at cabinet: should read voice coil DCR (~3.2Ω for 4Ω cab, ~6.4Ω for 8Ω cab). 0.0Ω indicates shorted voice coil; open circuit indicates blown driver.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect class="interactive-svg-pin" data-pin="1+" x="28" y="35" width="12" height="18" rx="2" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text class="interactive-svg-pin" data-pin="1+" x="34" y="47" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1+</text><rect class="interactive-svg-pin" data-pin="1−" x="42" y="35" width="12" height="18" rx="2" fill="#333" stroke="#555" stroke-width="1"/><text class="interactive-svg-pin" data-pin="1−" x="48" y="47" text-anchor="middle" fill="#aaa" font-size="8" font-weight="500">1−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">NL2 Front</text></svg>`
  },
  {
    id: 'speakon4',
    aliases: ['nl4', 'nl-4', 'speakon-4pole'],
    name: 'Speakon NL4 (4-Pole Speaker)',
    cat: 'speaker',
    tag: '4-pole speaker',
    color: '#639922',
    desc: 'Neutrik 4-pole twist-lock connector. The touring industry standard for bi-amplified speakers (LF on 1±, HF on 2±) or running two independent amplifier channels down a single cable (Sub on 1±, Top on 2±). Never use with live mains voltage.',
    uses: ['Bi-amplified stage wedges', 'Line array modules (d&b, JBL, Meyer)', 'Subwoofer + Top trunk runs', 'Touring amp rack outputs'],
    pins: [
      {n:'1+', pin:'1+', sig:'Ch 1 Positive (+)', name:'Ch 1 Positive (+)', color:'#E24B4A', col:'#E24B4A', note:'Low Frequency (LF) or Full Range (+)', desc:'LF/Full (+)'},
      {n:'1−', pin:'1−', sig:'Ch 1 Negative (−)', name:'Ch 1 Negative (−)', color:'#1a1a22', col:'#1a1a22', note:'Low Frequency (LF) or Full Range (−)', desc:'LF/Full (−)', border:'#555555'},
      {n:'2+', pin:'2+', sig:'Ch 2 Positive (+)', name:'Ch 2 Positive (+)', color:'#378ADD', col:'#378ADD', note:'High Frequency (HF) or Subwoofer (+)', desc:'HF/Sub (+)'},
      {n:'2−', pin:'2−', sig:'Ch 2 Negative (−)', name:'Ch 2 Negative (−)', color:'#0C447C', col:'#0C447C', note:'High Frequency (HF) or Subwoofer (−)', desc:'HF/Sub (−)'}
    ],
    phantomSafety: 'na',
    cableSpec: '4-Conductor 12 AWG (3.3mm²) or 10 AWG (5.2mm²) High-Flex Copper (Canare 4S11)',
    troubleshootTip: 'Test isolation between pair 1 and pair 2 (>10MΩ). Verify phase polarity: applying a 9V battery pulse to 1+/1− should push the LF woofer cone outward.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect class="interactive-svg-pin" data-pin="1+" x="24" y="28" width="12" height="15" rx="2" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="1+" x="30" y="39" text-anchor="middle" fill="#fff" font-size="7">1+</text><rect class="interactive-svg-pin" data-pin="1−" x="44" y="28" width="12" height="15" rx="2" fill="#333" stroke="#555"/><text class="interactive-svg-pin" data-pin="1−" x="50" y="39" text-anchor="middle" fill="#aaa" font-size="7">1−</text><rect class="interactive-svg-pin" data-pin="2+" x="24" y="48" width="12" height="15" rx="2" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="2+" x="30" y="59" text-anchor="middle" fill="#fff" font-size="7">2+</text><rect class="interactive-svg-pin" data-pin="2−" x="44" y="48" width="12" height="15" rx="2" fill="#0C447C"/><text class="interactive-svg-pin" data-pin="2−" x="50" y="59" text-anchor="middle" fill="#fff" font-size="7">2−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">NL4 Front</text></svg>`
  },
  {
    id: 'speakon8',
    aliases: ['nl8', 'nl-8', 'speakon-8pole'],
    name: 'Speakon NL8 (8-Pole Speaker)',
    cat: 'speaker',
    tag: '8-pole speaker',
    color: '#639922',
    desc: 'Neutrik 8-pole twist-lock connector. Carries up to 4 amplifier channels in a single heavy-duty cable. Used for tri-amped and quad-amped large-format line arrays (d&b J-Series, JBL VTX V25) or multi-cabinet trunk lines from amp racks to stage drops.',
    uses: ['Large-format line array modules', 'Tri-amp / Quad-amp PA cabinets', 'Multichannel amp rack trunks', 'Speaker distribution boxes'],
    pins: [
      {n:'1+', pin:'1+', sig:'Ch 1 LF1 (+)', name:'Ch 1 LF1 (+)', color:'#E24B4A', col:'#E24B4A', note:'Sub / Low-frequency 1 (+)', desc:'Ch 1 (+)'},
      {n:'1−', pin:'1−', sig:'Ch 1 LF1 (−)', name:'Ch 1 LF1 (−)', color:'#c0392b', col:'#c0392b', note:'Sub / Low-frequency 1 (−)', desc:'Ch 1 (−)'},
      {n:'2+', pin:'2+', sig:'Ch 2 LF2 (+)', name:'Ch 2 LF2 (+)', color:'#378ADD', col:'#378ADD', note:'Low-frequency 2 (+)', desc:'Ch 2 (+)'},
      {n:'2−', pin:'2−', sig:'Ch 2 LF2 (−)', name:'Ch 2 LF2 (−)', color:'#185FA5', col:'#185FA5', note:'Low-frequency 2 (−)', desc:'Ch 2 (−)'},
      {n:'3+', pin:'3+', sig:'Ch 3 Mid (+)', name:'Ch 3 Mid (+)', color:'#1D9E75', col:'#1D9E75', note:'Mid-frequency (+)', desc:'Ch 3 (+)'},
      {n:'3−', pin:'3−', sig:'Ch 3 Mid (−)', name:'Ch 3 Mid (−)', color:'#0F6E56', col:'#0F6E56', note:'Mid-frequency (−)', desc:'Ch 3 (−)'},
      {n:'4+', pin:'4+', sig:'Ch 4 High (+)', name:'Ch 4 High (+)', color:'#7F77DD', col:'#7F77DD', note:'High-frequency (+)', desc:'Ch 4 (+)'},
      {n:'4−', pin:'4−', sig:'Ch 4 High (−)', name:'Ch 4 High (−)', color:'#534AB7', col:'#534AB7', note:'High-frequency (−)', desc:'Ch 4 (−)'}
    ],
    phantomSafety: 'na',
    cableSpec: '8-Conductor 12 AWG (4.0mm²) to 10 AWG (6.0mm²) Heavy-Duty Touring Cable',
    troubleshootTip: 'Verify continuity across all 4 pairs from amp rack to breakout box. Check for adjacent pin shorts (1− to 2+, 2− to 3+, etc.) caused by stray copper strands in screw terminals.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect class="interactive-svg-pin" data-pin="1+" x="16" y="26" width="10" height="12" rx="1" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="1+" x="21" y="36" text-anchor="middle" fill="#fff" font-size="7">1+</text><rect class="interactive-svg-pin" data-pin="1−" x="28" y="26" width="10" height="12" rx="1" fill="#c0392b"/><text class="interactive-svg-pin" data-pin="1−" x="33" y="36" text-anchor="middle" fill="#fff" font-size="7">1−</text><rect class="interactive-svg-pin" data-pin="2+" x="42" y="26" width="10" height="12" rx="1" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="2+" x="47" y="36" text-anchor="middle" fill="#fff" font-size="7">2+</text><rect class="interactive-svg-pin" data-pin="2−" x="54" y="26" width="10" height="12" rx="1" fill="#185FA5"/><text class="interactive-svg-pin" data-pin="2−" x="59" y="36" text-anchor="middle" fill="#fff" font-size="7">2−</text><rect class="interactive-svg-pin" data-pin="3+" x="16" y="52" width="10" height="12" rx="1" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="3+" x="21" y="62" text-anchor="middle" fill="#fff" font-size="7">3+</text><rect class="interactive-svg-pin" data-pin="3−" x="28" y="52" width="10" height="12" rx="1" fill="#0F6E56"/><text class="interactive-svg-pin" data-pin="3−" x="33" y="62" text-anchor="middle" fill="#fff" font-size="7">3−</text><rect class="interactive-svg-pin" data-pin="4+" x="42" y="52" width="10" height="12" rx="1" fill="#7F77DD"/><text class="interactive-svg-pin" data-pin="4+" x="47" y="62" text-anchor="middle" fill="#fff" font-size="7">4+</text><rect class="interactive-svg-pin" data-pin="4−" x="54" y="52" width="10" height="12" rx="1" fill="#534AB7"/><text class="interactive-svg-pin" data-pin="4−" x="59" y="62" text-anchor="middle" fill="#fff" font-size="7">4−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">NL8 Front</text></svg>`
  },
  {
    id: 'cacom8',
    aliases: ['ca-com', 'cacom-8pin', 'lacoustics-cacom'],
    name: 'CA-COM 8-Pin (L-Acoustics PA)',
    cat: 'speaker',
    tag: 'L-Acoustics speaker',
    color: '#639922',
    desc: 'Heavy-duty bayonet circular connector manufactured by ITT Cannon / Amphenol. The official standard for L-Acoustics touring sound reinforcement systems (K1, K2, Kara II, Kiva II, KS28, SB28, LA12X, LA4X). Carries 4 high-power amplifier channels (Pins A/B Ch1, C/D Ch2, E/F Ch3, G/H Ch4).',
    uses: ['L-Acoustics DO25 / DO.7 / DO10 speaker cables', 'LA-RAK II amplifier rack distribution', 'Touring line array hangs'],
    pins: [
      {n:'A', pin:'A', sig:'Ch 1 Positive (+)', name:'Ch 1 Positive (+)', color:'#E24B4A', col:'#E24B4A', note:'L-Acoustics Ch 1 (+) / LF (+)', desc:'Ch 1 (+)'},
      {n:'B', pin:'B', sig:'Ch 1 Negative (−)', name:'Ch 1 Negative (−)', color:'#c0392b', col:'#c0392b', note:'L-Acoustics Ch 1 (−) / LF (−)', desc:'Ch 1 (−)'},
      {n:'C', pin:'C', sig:'Ch 2 Positive (+)', name:'Ch 2 Positive (+)', color:'#378ADD', col:'#378ADD', note:'L-Acoustics Ch 2 (+) / LF2 (+)', desc:'Ch 2 (+)'},
      {n:'D', pin:'D', sig:'Ch 2 Negative (−)', name:'Ch 2 Negative (−)', color:'#185FA5', col:'#185FA5', note:'L-Acoustics Ch 2 (−) / LF2 (−)', desc:'Ch 2 (−)'},
      {n:'E', pin:'E', sig:'Ch 3 Positive (+)', name:'Ch 3 Positive (+)', color:'#1D9E75', col:'#1D9E75', note:'L-Acoustics Ch 3 (+) / MF (+)', desc:'Ch 3 (+)'},
      {n:'F', pin:'F', sig:'Ch 3 Negative (−)', name:'Ch 3 Negative (−)', color:'#0F6E56', col:'#0F6E56', note:'L-Acoustics Ch 3 (−) / MF (−)', desc:'Ch 3 (−)'},
      {n:'G', pin:'G', sig:'Ch 4 Positive (+)', name:'Ch 4 Positive (+)', color:'#7F77DD', col:'#7F77DD', note:'L-Acoustics Ch 4 (+) / HF (+)', desc:'Ch 4 (+)'},
      {n:'H', pin:'H', sig:'Ch 4 Negative (−)', name:'Ch 4 Negative (−)', color:'#534AB7', col:'#534AB7', note:'L-Acoustics Ch 4 (−) / HF (−)', desc:'Ch 4 (−)'}
    ],
    phantomSafety: 'na',
    cableSpec: '8-Conductor 4.0mm² (approx. 11 AWG) Ultra-Flexible Neoprene Touring Cable',
    troubleshootTip: 'Check DC resistance across each pair (A-B, C-D, E-F, G-H) with cabinet attached; all pairs should register 2.5Ω–7.0Ω depending on model. Inspect bayonet locking pins and rubber sealing ring.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><g font-size="7" font-weight="600" text-anchor="middle" fill="#fff"><circle class="interactive-svg-pin" data-pin="A" cx="30" cy="26" r="5" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="A" x="30" y="29">A</text><circle class="interactive-svg-pin" data-pin="B" cx="50" cy="26" r="5" fill="#c0392b"/><text class="interactive-svg-pin" data-pin="B" x="50" y="29">B</text><circle class="interactive-svg-pin" data-pin="C" cx="62" cy="40" r="5" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="C" x="62" y="43">C</text><circle class="interactive-svg-pin" data-pin="D" cx="62" cy="56" r="5" fill="#185FA5"/><text class="interactive-svg-pin" data-pin="D" x="62" y="59">D</text><circle class="interactive-svg-pin" data-pin="E" cx="50" cy="68" r="5" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="E" x="50" y="71">E</text><circle class="interactive-svg-pin" data-pin="F" cx="30" cy="68" r="5" fill="#0F6E56"/><text class="interactive-svg-pin" data-pin="F" x="30" y="71">F</text><circle class="interactive-svg-pin" data-pin="G" cx="18" cy="56" r="5" fill="#7F77DD"/><text class="interactive-svg-pin" data-pin="G" x="18" y="59">G</text><circle class="interactive-svg-pin" data-pin="H" cx="18" cy="40" r="5" fill="#534AB7"/><text class="interactive-svg-pin" data-pin="H" x="18" y="43">H</text></g><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">CA-COM 8P</text></svg>`
  },
  {
    id: 'ep4',
    aliases: ['ep-speaker', 'ep8', 'amphenol-ep4'],
    name: 'Amphenol EP4 / EP8 Speaker Multipin',
    cat: 'speaker',
    tag: 'Meyer / Clair speaker',
    color: '#639922',
    desc: 'Rugged diecast metal circular speaker connectors manufactured by Amphenol. Established touring standard utilized by Meyer Sound, Clair Brothers, Adamson Systems, and Martin Audio. EP4 carries 2 channels; EP8 carries 4 channels.',
    uses: ['Meyer Sound self-powered array interconnects', 'Clair Brothers touring speaker cables', 'Adamson touring arrays'],
    pins: [
      {n:'1', pin:'1', sig:'LF Positive (+)', name:'LF Positive (+)', color:'#E24B4A', col:'#E24B4A', note:'Low Frequency (+) or Ch 1 (+)', desc:'LF (+)'},
      {n:'2', pin:'2', sig:'LF Negative (−)', name:'LF Negative (−)', color:'#c0392b', col:'#c0392b', note:'Low Frequency (−) or Ch 1 (−)', desc:'LF (−)'},
      {n:'3', pin:'3', sig:'HF Positive (+)', name:'HF Positive (+)', color:'#378ADD', col:'#378ADD', note:'High Frequency (+) or Ch 2 (+)', desc:'HF (+)'},
      {n:'4', pin:'4', sig:'HF Negative (−)', name:'HF Negative (−)', color:'#185FA5', col:'#185FA5', note:'High Frequency (−) or Ch 2 (−)', desc:'HF (−)'}
    ],
    phantomSafety: 'na',
    cableSpec: '4-Conductor or 8-Conductor 12–10 AWG Stranded Copper Speaker Cable',
    troubleshootTip: 'Test continuity across matching numbered pins; verify latch spring engages securely; check for bent solid-machined brass pins inside heavy metal housing.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><circle class="interactive-svg-pin" data-pin="1" cx="26" cy="35" r="7" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="1" x="26" y="39" text-anchor="middle" fill="#fff" font-size="8">1</text><circle class="interactive-svg-pin" data-pin="2" cx="54" cy="35" r="7" fill="#c0392b"/><text class="interactive-svg-pin" data-pin="2" x="54" y="39" text-anchor="middle" fill="#fff" font-size="8">2</text><circle class="interactive-svg-pin" data-pin="3" cx="54" cy="58" r="7" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="3" x="54" y="62" text-anchor="middle" fill="#fff" font-size="8">3</text><circle class="interactive-svg-pin" data-pin="4" cx="26" cy="58" r="7" fill="#185FA5"/><text class="interactive-svg-pin" data-pin="4" x="26" y="62" text-anchor="middle" fill="#fff" font-size="8">4</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Amphenol EP4</text></svg>`
  },
  {
    id: 'banana',
    aliases: ['binding-post', 'dual-banana', 'banana-plug'],
    name: 'Dual Banana / 5-Way Binding Post',
    cat: 'speaker',
    tag: 'Lab / amp output',
    color: '#EF9F27',
    desc: 'Standard 5-way binding post and dual-banana plug with standard 0.75" (19.05mm) spacing. Common on reference studio power amplifiers (Bryston, Crown, Lab Gruppen) and test equipment. The molded tab/rib on the plastic housing ALWAYS denotes the Negative/Ground (−) terminal.',
    uses: ['Studio reference power amplifier outputs', 'Bench test speaker loads', 'Loudspeaker crossover testing', 'Laboratory power supply terminals'],
    pins: [
      {n:'+', pin:'+', sig:'Positive (+) — Smooth Red', name:'Positive (+)', color:'#E24B4A', col:'#E24B4A', note:'Amplifier hot output (smooth red side)', desc:'Positive output (+)'},
      {n:'−', pin:'−', sig:'Negative (−) — Tabbed Black', name:'Negative (−)', color:'#1a1a22', col:'#1a1a22', note:'Amplifier return with molded polarity rib/tab', desc:'Negative output (−)', border:'#888888'}
    ],
    phantomSafety: 'na',
    cableSpec: '12–16 AWG Stranded Oxygen-Free Copper Speaker Cable',
    troubleshootTip: 'Inspect leaf springs on banana plugs for tight contact tension. Verify binding post thumb-screws are firmly torqued to avoid high-resistance arcing under high amplifier wattage.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="15" y="30" width="50" height="30" rx="3" fill="#1a1a22" stroke="#888" stroke-width="1.5"/><circle class="interactive-svg-pin" data-pin="+" cx="28" cy="45" r="7" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="+" x="28" y="49" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">+</text><circle class="interactive-svg-pin" data-pin="−" cx="52" cy="45" r="7" fill="#111" stroke="#555"/><text class="interactive-svg-pin" data-pin="−" x="52" y="49" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">−</text><rect x="63" y="42" width="4" height="6" fill="#888"/><text x="40" y="78" text-anchor="middle" fill="#888" font-size="8">0.75" Spacing (GND Tab)</text></svg>`
  },

  // ==========================================
  // CATEGORY 3: ADAPTER & CONVERTER CABLES (12 Entries)
  // ==========================================
  {
    id: 'ts-xlr',
    aliases: ['ts-to-xlr', 'unbalanced-xlr', 'ts-xlr-unbal'],
    name: 'TS to XLR (Unbalanced Interface — Pin 1 & 3 Tied)',
    cat: 'adapter',
    tag: 'Unbalanced line (NOT a DI box)',
    color: '#D85A30',
    desc: 'Direct physical cable adapter connecting an unbalanced 1/4" TS output (synth, pedal, DJ mixer) to an XLR console input. Pin 2 carries signal hot; Pin 3 is tied directly to Pin 1 (ground) at the XLR connector to prevent the input differential receiver from floating. NOTE: This is purely a mechanical pin adapter — it DOES NOT balance the signal. The line remains 100% unbalanced with no common-mode rejection.',
    uses: ['Synth unbalanced output to console', 'Emergency patch when no DI box is available', 'DJ mixer unbalanced booth output to powered speaker'],
    warn: 'CRITICAL LIVE SOUND WARNING: This adapter DOES NOT convert unbalanced audio to balanced! For long stage runs or ground isolation, ALWAYS use a DI box. NEVER ENGAGE +48V PHANTOM POWER: Pin 3 dead-shorts +48V to ground, and Pin 2 injects 48V DC directly into the instrument output stage, risking permanent hardware destruction.',
    pins: [
      {n:'Tip', pin:'Tip', sig:'→ XLR Pin 2 (Hot +)', name:'TS Tip → XLR Pin 2', color:'#E24B4A', col:'#E24B4A', note:'Signal hot conductor', desc:'Signal hot conductor'},
      {n:'Sleeve', pin:'Sleeve', sig:'→ XLR Pin 1 + Pin 3 (GND)', name:'TS Sleeve → XLR Pins 1+3 Tied', color:'#888780', col:'#888780', note:'Ground bridged to both Pin 1 (Shield) and Pin 3 (Cold) to prevent floating differential input', desc:'Ground bridged to Pin 1 and Pin 3'}
    ],
    phantomSafety: 'danger',
    cableSpec: 'Shielded Single-Conductor Audio Cable (<5m / 15ft max)',
    troubleshootTip: 'Multimeter: Tip to Pin 2 <0.3Ω; Sleeve to Pin 1 <0.3Ω; Sleeve to Pin 3 <0.3Ω; Pin 2 to Pin 1 >50MΩ open. If Pin 3 is left floating, you lose 6dB gain and pick up severe 50/60Hz hum.',
    svg: `<svg width="160" height="60" viewBox="0 0 160 60"><rect x="4" y="22" width="30" height="14" rx="7" fill="#888780" stroke="#666"/><rect class="interactive-svg-pin" data-pin="Tip" x="4" y="22" width="12" height="14" rx="7" fill="#EF9F27"/><text class="interactive-svg-pin" data-pin="Tip" x="10" y="32" text-anchor="middle" fill="#fff" font-size="9">T</text><text class="interactive-svg-pin" data-pin="Sleeve" x="25" y="32" text-anchor="middle" fill="#fff" font-size="9">S</text><line x1="35" y1="29" x2="60" y2="44" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="35" y1="29" x2="60" y2="20" stroke="#888780" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="80" cy="20" r="7" fill="#888780"/><text x="80" y="24" text-anchor="middle" fill="#fff" font-size="8">1</text><circle cx="65" cy="44" r="7" fill="#E24B4A"/><text x="65" y="48" text-anchor="middle" fill="#fff" font-size="8">2</text><circle cx="95" cy="44" r="7" fill="#eee" stroke="#ccc"/><text x="95" y="48" text-anchor="middle" fill="#333" font-size="8">3</text><line x1="80" y1="27" x2="95" y2="37" stroke="#888780" stroke-width="1.5" stroke-dasharray="2 2"/><text x="80" y="58" text-anchor="middle" fill="#888" font-size="8">pin 3 tied to pin 1 (unbalanced!)</text></svg>`
  },
  {
    id: 'trs-xlr',
    aliases: ['trs-xlr-bal', 'trs-to-xlr'],
    name: 'TRS to XLR Balanced Adapter',
    cat: 'adapter',
    tag: 'Balanced send',
    color: '#1D9E75',
    desc: 'True balanced interconnect cable. TRS Tip → XLR Pin 2 (Hot +), TRS Ring → XLR Pin 3 (Cold −), TRS Sleeve → XLR Pin 1 (Ground). Preserves full common-mode rejection ratio (CMRR) and +6dB signal level between balanced gear.',
    uses: ['Audio interface balanced outs to monitors', 'Console balanced aux sends to amp rack', 'Outboard processor balanced routing'],
    pins: [
      {n:'Tip', pin:'Tip', sig:'→ XLR Pin 2 (Hot +)', name:'Tip → XLR 2', color:'#E24B4A', col:'#E24B4A', note:'Positive / non-inverting signal', desc:'Hot (+)'},
      {n:'Ring', pin:'Ring', sig:'→ XLR Pin 3 (Cold −)', name:'Ring → XLR 3', color:'#1D9E75', col:'#1D9E75', note:'Negative / inverting signal', desc:'Cold (−)'},
      {n:'Sleeve', pin:'Sleeve', sig:'→ XLR Pin 1 (Ground)', name:'Sleeve → XLR 1', color:'#888780', col:'#888780', note:'Shield / chassis ground', desc:'Ground'}
    ],
    phantomSafety: 'safe',
    cableSpec: '110Ω Balanced Shielded Twisted Pair Cable (24 AWG)',
    troubleshootTip: 'Tip-Pin 2, Ring-Pin 3, Sleeve-Pin 1 all <0.3Ω. Verify infinite resistance between Tip and Ring (no shorts).',
    svg: `<svg width="160" height="60" viewBox="0 0 160 60"><rect x="2" y="20" width="42" height="14" rx="7" fill="#888780" stroke="#666"/><rect class="interactive-svg-pin" data-pin="Tip" x="2" y="20" width="13" height="14" rx="7" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="Ring" x="18" y="20" width="11" height="14" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="Tip" x="8" y="30" text-anchor="middle" fill="#fff" font-size="8">T</text><text class="interactive-svg-pin" data-pin="Ring" x="24" y="30" text-anchor="middle" fill="#fff" font-size="8">R</text><text class="interactive-svg-pin" data-pin="Sleeve" x="36" y="30" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="44" y1="23" x2="70" y2="44" stroke="#E24B4A" stroke-width="1.5"/><line x1="44" y1="27" x2="98" y2="44" stroke="#1D9E75" stroke-width="1.5"/><line x1="44" y1="30" x2="84" y2="20" stroke="#888780" stroke-width="1.5"/><circle cx="84" cy="16" r="7" fill="#888780"/><text x="84" y="20" text-anchor="middle" fill="#fff" font-size="8">1</text><circle cx="70" cy="40" r="7" fill="#E24B4A"/><text x="70" y="44" text-anchor="middle" fill="#fff" font-size="8">2</text><circle cx="98" cy="40" r="7" fill="#eee" stroke="#ccc"/><text x="98" y="44" text-anchor="middle" fill="#333" font-size="8">3</text></svg>`
  },
  {
    id: 'trs-dual-xlr',
    aliases: ['trs-xlr-insert', 'y-insert-cable'],
    name: 'TRS to Dual XLR — Y-Insert Cable',
    cat: 'adapter',
    tag: 'Console insert loop',
    color: '#7F77DD',
    desc: 'Y-cable splitting a console TRS insert jack into a Send (XLR Male to outboard input) and Return (XLR Female from outboard output). TRS Tip = Send, TRS Ring = Return, Sleeve = Ground on both connectors.',
    uses: ['Console channel insert loop', 'Outboard analog compressor / EQ patching', 'Effects processor loop'],
    warn: 'Tip = SEND (to outboard IN), Ring = RETURN (from outboard OUT). Swapping these mutes the channel insert loop.',
    pins: [
      {n:'Tip', pin:'Tip', sig:'→ XLR Male Pin 2 (Send)', name:'Tip → Send (M)', color:'#E24B4A', col:'#E24B4A', note:'Console send to outboard input', desc:'Send'},
      {n:'Ring', pin:'Ring', sig:'→ XLR Female Pin 2 (Return)', name:'Ring → Return (F)', color:'#1D9E75', col:'#1D9E75', note:'Outboard output back to console', desc:'Return'},
      {n:'Sleeve', pin:'Sleeve', sig:'→ XLR Pin 1 (Both connectors)', name:'Sleeve → GND', color:'#888780', col:'#888780', note:'Common shield ground', desc:'GND'}
    ],
    phantomSafety: 'danger',
    cableSpec: 'Dual-Zip Balanced/Unbalanced Shielded Cable',
    troubleshootTip: 'Verify Tip connects to Male Pin 2 (Send) and Ring connects to Female Pin 2 (Return). Pin 3 on both XLRs tied to Pin 1 ground.',
    svg: `<svg width="160" height="70" viewBox="0 0 160 70"><rect x="2" y="26" width="40" height="14" rx="7" fill="#888780" stroke="#666"/><rect class="interactive-svg-pin" data-pin="Tip" x="2" y="26" width="13" height="14" rx="7" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="Ring" x="18" y="26" width="10" height="14" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="Tip" x="9" y="36" text-anchor="middle" fill="#fff" font-size="8">T</text><text class="interactive-svg-pin" data-pin="Ring" x="23" y="36" text-anchor="middle" fill="#fff" font-size="8">R</text><text class="interactive-svg-pin" data-pin="Sleeve" x="36" y="36" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="42" y1="30" x2="80" y2="16" stroke="#E24B4A" stroke-width="1.5"/><line x1="42" y1="34" x2="80" y2="54" stroke="#1D9E75" stroke-width="1.5"/><circle cx="94" cy="12" r="7" fill="#0C0C0F" stroke="#E24B4A" stroke-width="1.5"/><text x="94" y="16" text-anchor="middle" fill="#E24B4A" font-size="7">M</text><circle cx="94" cy="52" r="7" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="94" y="56" text-anchor="middle" fill="#1D9E75" font-size="7">F</text></svg>`
  },
  {
    id: 'mini-dual-xlr',
    aliases: ['35-xlr', '35mm-dual-xlr'],
    name: '3.5mm TRS to Dual XLR Stereo',
    cat: 'adapter',
    tag: 'Phone/laptop → system',
    color: '#D4537E',
    desc: 'Splits consumer 3.5mm stereo output into two independent unbalanced XLR male connectors (Left and Right). Tip → Left XLR Pin 2, Ring → Right XLR Pin 2, Sleeve → Pins 1 & 3 on both XLRs.',
    uses: ['Laptop/phone audio to PA system', 'DJ backup playback source', 'Media player to analog console'],
    warn: 'DO NOT ENGAGE +48V! Sending 48V DC into a laptop or phone headphone jack will destroy the audio codec chip. Use a stereo DI box for runs >5m.',
    pins: [
      {n:'Tip', pin:'Tip', sig:'→ XLR-Left Pin 2', name:'Tip → Left XLR 2', color:'#E24B4A', col:'#E24B4A', note:'Left channel audio', desc:'Left'},
      {n:'Ring', pin:'Ring', sig:'→ XLR-Right Pin 2', name:'Ring → Right XLR 2', color:'#1D9E75', col:'#1D9E75', note:'Right channel audio', desc:'Right'},
      {n:'Sleeve', pin:'Sleeve', sig:'→ XLR Pins 1+3 (Both sides)', name:'Sleeve → XLR 1+3', color:'#888780', col:'#888780', note:'Ground bridged to 1 and 3 each side', desc:'GND'}
    ],
    phantomSafety: 'danger',
    cableSpec: 'Foil-Shielded Y-Split Audio Cable (<3m recommended)',
    troubleshootTip: 'Tip to Left Pin 2 (<0.3Ω); Ring to Right Pin 2 (<0.3Ω); Sleeve to Pins 1 & 3 on both XLRs. Verify Left Pin 2 and Right Pin 2 are not shorted together.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="20" y="12" width="40" height="12" rx="6" fill="#888780" stroke="#666"/><rect class="interactive-svg-pin" data-pin="Tip" x="20" y="12" width="12" height="12" rx="6" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="Ring" x="34" y="12" width="10" height="12" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="Tip" x="26" y="21" text-anchor="middle" fill="#fff" font-size="8">T</text><text class="interactive-svg-pin" data-pin="Ring" x="39" y="21" text-anchor="middle" fill="#fff" font-size="8">R</text><text class="interactive-svg-pin" data-pin="Sleeve" x="52" y="21" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="30" y1="24" x2="20" y2="45" stroke="#E24B4A" stroke-width="1.5"/><line x1="50" y1="24" x2="60" y2="45" stroke="#1D9E75" stroke-width="1.5"/><circle cx="20" cy="56" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="60" text-anchor="middle" fill="#378ADD" font-size="7">L</text><circle cx="60" cy="56" r="9" fill="#1a1a22" stroke="#E24B4A" stroke-width="1.5"/><text x="60" y="60" text-anchor="middle" fill="#E24B4A" font-size="7">R</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">XLR M × 2</text></svg>`
  },
  {
    id: 'mini-rca',
    aliases: ['35-rca', '35mm-to-rca'],
    name: '3.5mm to Stereo RCA Cable',
    cat: 'adapter',
    tag: 'Consumer stereo',
    color: '#D85A30',
    desc: 'Standard breakout cable connecting phones, tablets, or laptops to DJ mixers, home receivers, and playback monitors. Tip → White/Black RCA (Left), Ring → Red RCA (Right), Sleeve → Outer shells of both RCAs.',
    uses: ['Phone to DJ mixer line in', 'Media player to Hi-Fi amplifier', 'Laptop to club booth monitor'],
    pins: [
      {n:'Tip', pin:'Tip', sig:'→ RCA White/Black (Left)', name:'Tip → RCA Left', color:'#1D9E75', col:'#1D9E75', note:'Left channel center pin', desc:'Left Center'},
      {n:'Ring', pin:'Ring', sig:'→ RCA Red (Right)', name:'Ring → RCA Right', color:'#E24B4A', col:'#E24B4A', note:'Right channel center pin', desc:'Right Center'},
      {n:'Sleeve', pin:'Sleeve', sig:'→ Outer Shells (Both RCAs)', name:'Sleeve → RCA Shells', color:'#888780', col:'#888780', note:'Common ground return', desc:'GND'}
    ],
    phantomSafety: 'na',
    cableSpec: 'Coaxial Dual-Zip Cable (10kΩ line impedance)',
    troubleshootTip: 'Tip to Left Center, Ring to Right Center, Sleeve to both Outer Shells (<0.3Ω). Verify no short between Center pins.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="22" y="10" width="36" height="12" rx="6" fill="#888780" stroke="#666"/><rect class="interactive-svg-pin" data-pin="Tip" x="22" y="10" width="11" height="12" rx="6" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="Ring" x="35" y="10" width="9" height="12" fill="#1D9E75"/><line x1="30" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5"/><line x1="50" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5"/><circle cx="20" cy="58" r="9" fill="#E24B4A"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {
    id: 'trs-rca',
    aliases: ['14-to-rca', 'trs-to-rca'],
    name: '1/4" TRS to Stereo RCA Cable',
    cat: 'adapter',
    tag: 'Pro to consumer',
    color: '#D4537E',
    desc: 'Connects a professional 1/4" TRS stereo output (audio interface, mixer headphone out, DJ booth out) to consumer RCA line inputs. Tip → Left RCA center, Ring → Right RCA center, Sleeve → outer shells.',
    uses: ['Interface headphone out to Hi-Fi amp', 'DJ mixer booth out to recording deck', 'Club install monitor feeds'],
    pins: [
      {n:'Tip', pin:'Tip', sig:'→ RCA White/Black (Left)', name:'Tip → RCA Left', color:'#1D9E75', col:'#1D9E75', note:'Left channel center pin', desc:'Left Center'},
      {n:'Ring', pin:'Ring', sig:'→ RCA Red (Right)', name:'Ring → RCA Right', color:'#E24B4A', col:'#E24B4A', note:'Right channel center pin', desc:'Right Center'},
      {n:'Sleeve', pin:'Sleeve', sig:'→ Outer Shells (Both RCAs)', name:'Sleeve → RCA Shells', color:'#888780', col:'#888780', note:'Ground return on both RCAs', desc:'GND'}
    ],
    phantomSafety: 'na',
    cableSpec: 'High-Flex Dual Shielded Audio Cable',
    troubleshootTip: 'Tip to Left RCA center, Ring to Right RCA center, Sleeve to both RCA barrels. Check barrel ground leaves for snug fit.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="10" width="48" height="12" rx="6" fill="#888780" stroke="#666"/><rect class="interactive-svg-pin" data-pin="Tip" x="14" y="10" width="14" height="12" rx="6" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="Ring" x="30" y="10" width="11" height="12" fill="#1D9E75"/><line x1="28" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5"/><line x1="52" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5"/><circle cx="20" cy="58" r="9" fill="#E24B4A"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {
    id: 'rca-xlr-m',
    aliases: ['rca-xlrm', 'rca-to-xlr-male'],
    name: 'RCA to Male XLR (Stereo Pair)',
    cat: 'adapter',
    tag: 'Consumer → balanced',
    color: '#D85A30',
    desc: 'Connects unbalanced consumer/DJ RCA line outputs to professional balanced XLR inputs (mixing consoles, powered PA speakers). RCA center pin → XLR Pin 2, RCA outer shell → XLR Pins 1 & 3 bridged at each XLR connector.',
    uses: ['CD player / turntable mixer to PA', 'DJ console to stage snake', 'Media server to front-of-house'],
    warn: 'DO NOT APPLY +48V! Pin 3 is tied to ground and Pin 2 injects DC directly into RCA output transistors.',
    pins: [
      {n:'L Center', pin:'L-Center', sig:'→ XLR-Left Pin 2 (Hot)', name:'L Center → XLR-L 2', color:'#1D9E75', col:'#1D9E75', note:'Left channel audio signal', desc:'Left signal'},
      {n:'R Center', pin:'R-Center', sig:'→ XLR-Right Pin 2 (Hot)', name:'R Center → XLR-R 2', color:'#E24B4A', col:'#E24B4A', note:'Right channel audio signal', desc:'Right signal'},
      {n:'Shells', pin:'Shells', sig:'→ XLR Pins 1+3 (Both XLRs)', name:'Shells → XLR 1+3', color:'#888780', col:'#888780', note:'Ground bridged to Pins 1 and 3 on both XLRs', desc:'GND'}
    ],
    phantomSafety: 'danger',
    cableSpec: '75Ω Coax or Shielded Audio Line Pair',
    troubleshootTip: 'Verify Pin 1 is bridged to Pin 3 at each XLR connector. Verify RCA center pin connects only to Pin 2.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle class="interactive-svg-pin" data-pin="R Center" cx="22" cy="20" r="9" fill="#E24B4A"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle class="interactive-svg-pin" data-pin="L Center" cx="58" cy="20" r="9" fill="#888"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5"/><circle cx="20" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R male XLR</text></svg>`
  },
  {
    id: 'rca-xlr-f',
    aliases: ['rca-xlrf', 'rca-to-xlr-female'],
    name: 'RCA to Female XLR (Stereo Pair)',
    cat: 'adapter',
    tag: 'Consumer to balanced in',
    color: '#D85A30',
    desc: 'Connects professional balanced XLR outputs to consumer RCA line inputs (e.g. console master out to consumer recorder or Hi-Fi amp). XLR Pin 2 → RCA center pin, XLR Pin 1 → RCA outer shell. For active op-amp outputs, leave Pin 3 floating.',
    uses: ['Console main out to consumer recorder', 'Broadcast feed to consumer monitor', 'Pro DAC out to Hi-Fi amplifier'],
    pins: [
      {n:'XLR-L 2', pin:'XLR-L-2', sig:'→ RCA Left Center Pin', name:'XLR-L 2 → RCA Left', color:'#1D9E75', col:'#1D9E75', note:'Left channel audio signal', desc:'Left'},
      {n:'XLR-R 2', pin:'XLR-R-2', sig:'→ RCA Right Center Pin', name:'XLR-R 2 → RCA Right', color:'#E24B4A', col:'#E24B4A', note:'Right channel audio signal', desc:'Right'},
      {n:'XLR 1', pin:'XLR-1', sig:'→ RCA Outer Shells', name:'XLR 1 → RCA Outer', color:'#888780', col:'#888780', note:'Ground return', desc:'GND'},
      {n:'XLR 3', pin:'XLR-3', sig:'Floating (Active) / Tied (Transf)', name:'XLR 3 → Floating/Tied', color:'#888780', col:'#888780', note:'Float for active op-amps; tie to 1 for transformer', desc:'Cold'}
    ],
    phantomSafety: 'na',
    cableSpec: 'Shielded Low-Capacitance Audio Cable',
    troubleshootTip: 'Check that Pin 2 connects to RCA center pin; ensure Pin 3 is isolated from Pin 1 unless transformer equipment is specified.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle class="interactive-svg-pin" data-pin="XLR-R 2" cx="22" cy="20" r="9" fill="#E24B4A"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle class="interactive-svg-pin" data-pin="XLR-L 2" cx="58" cy="20" r="9" fill="#888"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5"/><circle cx="20" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R female XLR</text></svg>`
  },
  {
    id: 'summing-box',
    aliases: ['sum-mono-xlr', 'stereo-to-mono', 'resistor-summing'],
    name: 'Stereo-to-Mono Resistor Summing Box',
    cat: 'adapter',
    tag: 'Passive stereo-to-mono',
    color: '#D85A30',
    desc: 'Safely combines stereo Left and Right headphone/line outputs into a single mono balanced XLR input. Dual 470Ω–1kΩ (1% metal film) series resistors prevent the left and right output op-amps from dead-shorting into each other (Rane Note 109 "Why Not Wye?"), plus 10kΩ shunt resistor to ground.',
    uses: ['Phone/laptop headphone out to single console channel', 'DJ mixer stereo cue to mono intercom', 'Stereo media player to mono PA system'],
    warn: 'CATASTROPHIC HAZARD: Never apply +48V phantom power! 48V DC will travel backwards through summing resistors directly into smartphone/laptop audio DAC stages.',
    pins: [
      {n:'Tip', pin:'Tip', sig:'→ 470Ω Resistor → XLR Pin 2', name:'Tip → 470Ω → Pin 2', color:'#E24B4A', col:'#E24B4A', note:'Left audio through 470Ω series resistor', desc:'Left in'},
      {n:'Ring', pin:'Ring', sig:'→ 470Ω Resistor → XLR Pin 2', name:'Ring → 470Ω → Pin 2', color:'#1D9E75', col:'#1D9E75', note:'Right audio through 470Ω series resistor', desc:'Right in'},
      {n:'Pin 2', pin:'XLR-2', sig:'Summed Node + 10kΩ Shunt', name:'Summed Node (Pin 2)', color:'#EF9F27', col:'#EF9F27', note:'Summing junction to XLR Pin 2', desc:'Mono Out'},
      {n:'Pin 3', pin:'XLR-3', sig:'→ Tied to Pin 1 Ground', name:'Pin 3 → Tied to GND', color:'#888780', col:'#888780', note:'Tied to ground directly or via 470Ω', desc:'Tied to GND'},
      {n:'Sleeve', pin:'Sleeve', sig:'→ XLR Pin 1 Ground', name:'Sleeve → Pin 1', color:'#888780', col:'#888780', note:'Common shield & ground return', desc:'GND'}
    ],
    phantomSafety: 'danger',
    cableSpec: 'Shielded Barrel Enclosure with 1/4W 1% Metal Film Resistors',
    troubleshootTip: 'Measure Tip to XLR Pin 2: MUST read ~470Ω. Ring to XLR Pin 2: MUST read ~470Ω. Tip to Ring: MUST read ~940Ω. If resistance is 0Ω, the cable is a dangerous hardwired short!',
    svg: `<svg width="120" height="80" viewBox="0 0 120 80"><rect x="4" y="24" width="28" height="12" rx="6" fill="#888"/><rect class="interactive-svg-pin" data-pin="Tip" x="4" y="24" width="9" height="12" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="Ring" x="14" y="24" width="8" height="12" fill="#1D9E75"/><rect x="42" y="14" width="18" height="8" rx="2" fill="#E24B4A"/><text x="51" y="21" text-anchor="middle" fill="#fff" font-size="6">470Ω</text><rect x="42" y="34" width="18" height="8" rx="2" fill="#1D9E75"/><text x="51" y="41" text-anchor="middle" fill="#fff" font-size="6">470Ω</text><line x1="23" y1="26" x2="42" y2="18" stroke="#E24B4A" stroke-width="1.5"/><line x1="23" y1="32" x2="42" y2="38" stroke="#1D9E75" stroke-width="1.5"/><line x1="60" y1="18" x2="80" y2="28" stroke="#EF9F27" stroke-width="1.5"/><line x1="60" y1="38" x2="80" y2="28" stroke="#EF9F27" stroke-width="1.5"/><circle class="interactive-svg-pin" data-pin="Pin 2" cx="95" cy="28" r="8" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="Pin 2" x="95" y="32" text-anchor="middle" fill="#fff" font-size="8">2</text><circle class="interactive-svg-pin" data-pin="Pin 3" cx="95" cy="50" r="8" fill="#888"/><text class="interactive-svg-pin" data-pin="Pin 3" x="95" y="54" text-anchor="middle" fill="#fff" font-size="8">3+1</text><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">470Ω Summing Network</text></svg>`
  },
  {
    id: 'dmx-5to3',
    aliases: ['dmx-turnaround', 'dmx-terminator', 'dmx-5pin-to-3pin'],
    name: 'DMX 5-to-3 Turnaround & 120Ω Terminator',
    cat: 'adapter',
    tag: 'DMX turnaround & term',
    color: '#7F77DD',
    desc: 'Adapts 5-pin DMX512-A lighting consoles/fixtures to 3-pin equipment (Pin 1 GND, Pin 2 Data−, Pin 3 Data+, Pins 4/5 N/C). Also covers DMX 120Ω terminator plugs: a single 120Ω 0.25W resistor connected across Pin 2 and Pin 3 to absorb transmission line reflections.',
    uses: ['Lighting console to 3-pin DMX fixtures', '3-pin DMX splitter to 5-pin moving lights', 'End-of-line DMX daisy-chain termination'],
    warn: 'DANGER: Never plug a 3-pin DMX cable into an audio XLR mic input with +48V phantom power enabled — 48V DC instantly destroys RS-485 transceiver ICs.',
    pins: [
      {n:'1', pin:'1', sig:'Ground / Shield → Pin 1', name:'Pin 1 → Pin 1', color:'#888780', col:'#888780', note:'Common signal shield', desc:'GND'},
      {n:'2', pin:'2', sig:'Data 1 Complement (−) → Pin 2', name:'Pin 2 → Pin 2', color:'#E24B4A', col:'#E24B4A', note:'Primary data negative line', desc:'Data−'},
      {n:'3', pin:'3', sig:'Data 1 True (+) → Pin 3', name:'Pin 3 → Pin 3', color:'#ffffff', col:'#ffffff', note:'Primary data positive line', desc:'Data+', border:'#cccccc'},
      {n:'4', pin:'4', sig:'Data 2 (−) / N.C.', name:'Pin 4 (N.C.)', color:'#888780', col:'#888780', note:'Secondary link (Floating / Not Connected)', desc:'N/C'},
      {n:'5', pin:'5', sig:'Data 2 (+) / N.C.', name:'Pin 5 (N.C.)', color:'#888780', col:'#888780', note:'Secondary link (Floating / Not Connected)', desc:'N/C'}
    ],
    phantomSafety: 'danger',
    cableSpec: '120Ω Characteristic Impedance Digital Shielded Cable (Belden 9841 / 9842)',
    troubleshootTip: 'Continuity: Pins 1-1, 2-2, 3-3 (<0.3Ω). Pins 4 and 5 MUST be open. On 120Ω terminator plug: measure between Pin 2 and Pin 3: MUST read 120Ω (±2Ω, 118Ω to 122Ω).',
    svg: `<svg width="120" height="70" viewBox="0 0 120 70"><circle cx="30" cy="35" r="22" fill="#1a1a22" stroke="#7F77DD"/><circle class="interactive-svg-pin" data-pin="1" cx="30" cy="20" r="4" fill="#888"/><circle class="interactive-svg-pin" data-pin="2" cx="18" cy="30" r="4" fill="#E24B4A"/><circle class="interactive-svg-pin" data-pin="3" cx="42" cy="30" r="4" fill="#fff" stroke="#ccc"/><circle class="interactive-svg-pin" data-pin="4" cx="22" cy="46" r="4" fill="#555"/><circle class="interactive-svg-pin" data-pin="5" cx="38" cy="46" r="4" fill="#555"/><circle cx="90" cy="35" r="22" fill="#1a1a22" stroke="#7F77DD"/><circle cx="90" cy="20" r="4" fill="#888"/><circle cx="78" cy="40" r="4" fill="#E24B4A"/><circle cx="102" cy="40" r="4" fill="#fff" stroke="#ccc"/><line x1="30" y1="20" x2="90" y2="20" stroke="#888" stroke-width="1.5"/><line x1="18" y1="30" x2="78" y2="40" stroke="#E24B4A" stroke-width="1.5"/><line x1="42" y1="30" x2="102" y2="40" stroke="#fff" stroke-width="1.5"/><text x="60" y="64" text-anchor="middle" fill="#888" font-size="8">5-Pin to 3-Pin / 120Ω Term</text></svg>`
  },
  {
    id: 'midi-trs',
    aliases: ['midi-to-trs', 'type-a-midi', 'type-b-midi'],
    name: 'MIDI 5-Pin DIN to 3.5mm TRS (Type A vs B)',
    cat: 'adapter',
    tag: 'MIDI TRS Type A / B',
    color: '#D4537E',
    desc: 'Adapts 5-pin DIN MIDI jacks to modern compact 3.5mm TRS jacks. Two incompatible pinouts exist: Type A (official MMA standard: Korg, Roland, Akai, Boss, Make Noise) where Pin 5 Sink = Tip, Pin 4 Source = Ring; and Type B (Arturia, Novation, 1010music) where Tip and Ring are inverted!',
    uses: ['Connecting hardware synths to MIDI controllers', 'Compact pedalboard MIDI routing', 'Modular synth MIDI breakout'],
    pins: [
      {n:'Tip', pin:'Tip', sig:'Type A: Pin 5 (Sink) | Type B: Pin 4 (+5V)', name:'Tip [A: Data / B: +5V]', color:'#E24B4A', col:'#E24B4A', note:'MMA Type A: DIN Pin 5 | Type B: DIN Pin 4', desc:'Tip'},
      {n:'Ring', pin:'Ring', sig:'Type A: Pin 4 (+5V) | Type B: Pin 5 (Sink)', name:'Ring [A: +5V / B: Data]', color:'#1D9E75', col:'#1D9E75', note:'MMA Type A: DIN Pin 4 | Type B: DIN Pin 5', desc:'Ring'},
      {n:'Sleeve', pin:'Sleeve', sig:'DIN Pin 2 (Shield / Ground)', name:'Sleeve → Pin 2', color:'#888780', col:'#888780', note:'Connected on both Type A and Type B', desc:'Sleeve'}
    ],
    phantomSafety: 'na',
    cableSpec: '3-Conductor Shielded Cable (31.25 kbaud data rate)',
    troubleshootTip: 'Check continuity with multimeter: On Type A, DIN Pin 5 connects to Tip, and DIN Pin 4 connects to Ring. On Type B, DIN Pin 4 connects to Tip, and DIN Pin 5 connects to Ring. Sleeve always connects to DIN Pin 2.',
    svg: `<svg width="120" height="70" viewBox="0 0 120 70"><circle cx="30" cy="35" r="22" fill="#1a1a22" stroke="#D4537E"/><circle cx="30" cy="18" r="3.5" fill="#555"/><circle class="interactive-svg-pin" data-pin="Sleeve" cx="18" cy="28" r="3.5" fill="#888"/><circle cx="42" cy="28" r="3.5" fill="#555"/><circle class="interactive-svg-pin" data-pin="Ring" cx="22" cy="44" r="3.5" fill="#E24B4A"/><circle class="interactive-svg-pin" data-pin="Tip" cx="38" cy="44" r="3.5" fill="#7F77DD"/><rect x="75" y="28" width="35" height="14" rx="7" fill="#888"/><rect class="interactive-svg-pin" data-pin="Tip" x="75" y="28" width="11" height="14" rx="7" fill="#7F77DD"/><rect class="interactive-svg-pin" data-pin="Ring" x="88" y="28" width="9" height="14" fill="#E24B4A"/><text x="60" y="64" text-anchor="middle" fill="#888" font-size="8">Type A (MMA Standard)</text></svg>`
  },
  {
    id: 'xlr-phase-pad',
    aliases: ['xlr-phase-rev', 'xlr-pad', 'phase-inverter'],
    name: 'XLR Polarity Reverse & -20dB/-30dB H-Pad',
    cat: 'adapter',
    tag: 'Phase flip & attenuator',
    color: '#E24B4A',
    desc: 'Two essential audio barrels: 1) Polarity Reverse Barrel: Swaps Pin 2 and Pin 3 to invert electrical/acoustic phase by 180° (safe with +48V common-mode DC). 2) Symmetrical Balanced H-Pad Attenuator: Drops hot line/mic signals by -20dB or -30dB using dual 470Ω series resistors and 150Ω shunt resistor.',
    uses: ['Under-snare / bottom mic phase correction', 'Dual kick mic acoustic alignment', 'Dropping hot active preamp output into mic input', 'Taming high-output snare drum mics'],
    warn: 'Pad Attenuator: DO NOT place between +48V phantom supply and condenser mic — shunt resistor collapses phantom voltage. Safe on dynamic mics and line level.',
    pins: [
      {n:'1', pin:'1', sig:'Pin 1 → Pin 1 (Shield Straight Through)', name:'Pin 1 → Pin 1', color:'#888780', col:'#888780', note:'Common shield passes straight through', desc:'GND'},
      {n:'2', pin:'2', sig:'Phase Rev: → Pin 3 | H-Pad: 470Ω Series', name:'Pin 2 [Swap or 470Ω]', color:'#E24B4A', col:'#E24B4A', note:'Phase: Crosses to 3 | Pad: 470Ω series', desc:'Hot'},
      {n:'3', pin:'3', sig:'Phase Rev: → Pin 2 | H-Pad: 470Ω Series', name:'Pin 3 [Swap or 470Ω]', color:'#ffffff', col:'#ffffff', note:'Phase: Crosses to 2 | Pad: 470Ω series', desc:'Cold', border:'#cccccc'}
    ],
    phantomSafety: 'safe',
    cableSpec: 'Diecast Metal Barrel with 1% Precision Metal Film Resistors',
    troubleshootTip: 'Polarity Barrel: Pin 1-1 (<0.3Ω), Pin 2-3 (<0.3Ω), Pin 3-2 (<0.3Ω). Pad Barrel: Measure Pin 2 to Pin 3 at output: reads ~150Ω for -20dB pad.',
    svg: `<svg width="120" height="70" viewBox="0 0 120 70"><circle cx="25" cy="35" r="20" fill="#1a1a22" stroke="#E24B4A"/><circle class="interactive-svg-pin" data-pin="1" cx="25" cy="22" r="4.5" fill="#888"/><circle class="interactive-svg-pin" data-pin="2" cx="15" cy="42" r="4.5" fill="#E24B4A"/><circle class="interactive-svg-pin" data-pin="3" cx="35" cy="42" r="4.5" fill="#fff" stroke="#ccc"/><circle cx="95" cy="35" r="20" fill="#1a1a22" stroke="#E24B4A"/><circle cx="95" cy="22" r="4.5" fill="#888"/><circle cx="85" cy="42" r="4.5" fill="#E24B4A"/><circle cx="105" cy="42" r="4.5" fill="#fff" stroke="#ccc"/><line x1="25" y1="22" x2="95" y2="22" stroke="#888" stroke-width="1.5"/><line x1="15" y1="42" x2="105" y2="42" stroke="#E24B4A" stroke-width="1.5"/><line x1="35" y1="42" x2="85" y2="42" stroke="#fff" stroke-width="1.5"/><text x="60" y="64" text-anchor="middle" fill="#888" font-size="8">Pins 2 & 3 Inverted (180°)</text></svg>`
  },

  // ==========================================
  // CATEGORY 4: DIGITAL AUDIO & CAT5 SNAKES (5 Entries)
  // ==========================================
  {
    id: 'rj45',
    aliases: ['ethercon', 'cat6', 'ethernet'],
    name: 'RJ45 / EtherCON (Network, Dante, AES67)',
    cat: 'digital',
    tag: 'Network / Dante / AES67',
    color: '#7F77DD',
    desc: '8P8C modular connector ruggedized with Neutrik EtherCON metal shell. The foundation of modern live production audio networks (Audinate Dante, AES67, Ravenna, AVB/Milan) and digital snake trunks. Wired strictly to T568B standard.',
    uses: ['Dante digital audio networks', 'Digital stage rack trunks (Midas, Yamaha, Allen & Heath)', 'AVB / Milan speaker networks', 'Show control networks'],
    pins: [
      {n:'1', pin:'1', sig:'TX+ (White/Orange)', name:'Pin 1 (W-Org)', color:'#E24B4A', col:'#E24B4A', note:'Pair 2 transmit (+)', desc:'Pair 2+'},
      {n:'2', pin:'2', sig:'TX− (Orange)', name:'Pin 2 (Org)', color:'#D85A30', col:'#D85A30', note:'Pair 2 transmit (−)', desc:'Pair 2−'},
      {n:'3', pin:'3', sig:'RX+ (White/Green)', name:'Pin 3 (W-Grn)', color:'#1D9E75', col:'#1D9E75', note:'Pair 3 receive (+)', desc:'Pair 3+'},
      {n:'4', pin:'4', sig:'BI+ (Blue)', name:'Pin 4 (Blu)', color:'#378ADD', col:'#378ADD', note:'Pair 1 bi-directional (+)', desc:'Pair 1+'},
      {n:'5', pin:'5', sig:'BI− (White/Blue)', name:'Pin 5 (W-Blu)', color:'#85B7EB', col:'#85B7EB', note:'Pair 1 bi-directional (−)', desc:'Pair 1−'},
      {n:'6', pin:'6', sig:'RX− (Green)', name:'Pin 6 (Grn)', color:'#639922', col:'#639922', note:'Pair 3 receive (−)', desc:'Pair 3−'},
      {n:'7', pin:'7', sig:'BI+ (White/Brown)', name:'Pin 7 (W-Brn)', color:'#D4537E', col:'#D4537E', note:'Pair 4 bi-directional (+)', desc:'Pair 4+'},
      {n:'8', pin:'8', sig:'BI− (Brown)', name:'Pin 8 (Brn)', color:'#8B4513', col:'#8B4513', note:'Pair 4 bi-directional (−)', desc:'Pair 4−'}
    ],
    phantomSafety: 'na',
    cableSpec: 'Cat6 / Cat6A SF/UTP Shielded Touring Cable (100Ω, 250–500MHz)',
    troubleshootTip: 'Use wiremap tester to verify all 8 conductors and shield drain continuity. Pin 3 and Pin 6 (green pair) split across 4 & 5; ensure no split-pair errors.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="20" width="48" height="44" rx="4" fill="#1a1a22" stroke="#7F77DD" stroke-width="1.5"/><rect class="interactive-svg-pin" data-pin="1" x="20" y="26" width="5" height="28" rx="1" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="2" x="27" y="26" width="5" height="28" rx="1" fill="#D85A30"/><rect class="interactive-svg-pin" data-pin="3" x="34" y="26" width="5" height="28" rx="1" fill="#1D9E75"/><rect class="interactive-svg-pin" data-pin="4" x="41" y="26" width="5" height="28" rx="1" fill="#378ADD"/><rect class="interactive-svg-pin" data-pin="5" x="48" y="26" width="5" height="28" rx="1" fill="#85B7EB"/><rect class="interactive-svg-pin" data-pin="6" x="55" y="26" width="5" height="28" rx="1" fill="#639922"/><rect class="interactive-svg-pin" data-pin="7" x="62" y="26" width="2" height="28" rx="1" fill="#D4537E"/><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">T568B — 8 pins</text></svg>`
  },
  {
    id: 'midi',
    aliases: ['din5', 'midi-din', 'din-5pin'],
    name: 'DIN 5-Pin Standard MIDI',
    cat: 'digital',
    tag: 'MIDI control',
    color: '#D4537E',
    desc: 'Standard 5-pin 180° DIN connector for MIDI 1.0 serial communication. Operates as a 5mA opto-isolated current loop at 31.25 kbaud. Only Pins 2, 4, and 5 are used. Pin 2 shield connects at MIDI OUT only (floating at MIDI IN to preserve opto-isolation).',
    uses: ['Keyboard controllers', 'Hardware synthesizers', 'Lighting cue automation triggers', 'Console snapshot recall'],
    pins: [
      {n:'1', pin:'1', sig:'Not connected (NC)', name:'Pin 1 (NC)', color:'#D3D1C7', col:'#D3D1C7', note:'Unused / unassigned in standard MIDI 1.0', desc:'NC'},
      {n:'2', pin:'2', sig:'Cable Shield / Ground', name:'Pin 2 (GND)', color:'#888780', col:'#888780', note:'Connect at MIDI OUT only; float at MIDI IN', desc:'GND'},
      {n:'3', pin:'3', sig:'Not connected (NC)', name:'Pin 3 (NC)', color:'#D3D1C7', col:'#D3D1C7', note:'Unused / unassigned in standard MIDI 1.0', desc:'NC'},
      {n:'4', pin:'4', sig:'+5V Current Source (220Ω)', name:'Pin 4 (+5V)', color:'#E24B4A', col:'#E24B4A', note:'Positive current loop rail', desc:'+5V'},
      {n:'5', pin:'5', sig:'MIDI Serial Data / Sink', name:'Pin 5 (Data)', color:'#7F77DD', col:'#7F77DD', note:'Serial data current loop return', desc:'Data'}
    ],
    phantomSafety: 'na',
    cableSpec: 'Shielded Twisted Pair Audio Cable (max run 15m / 50ft)',
    troubleshootTip: 'On MIDI OUT: measure DC voltage Pin 4 to Pin 2 (+5.0V DC). On MIDI IN cable: measure resistance Pin 4 to Pin 5 (~220Ω through input optocoupler LED).',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#D4537E" stroke-width="1.5"/><rect x="37" y="12" width="6" height="4" rx="1" fill="#555"/><circle class="interactive-svg-pin" data-pin="1" cx="18" cy="46" r="6" fill="#D3D1C7"/><text class="interactive-svg-pin" data-pin="1" x="18" y="50" text-anchor="middle" fill="#555" font-size="8">1</text><circle class="interactive-svg-pin" data-pin="4" cx="27" cy="30" r="6" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="4" x="27" y="34" text-anchor="middle" fill="#fff" font-size="8">4</text><circle class="interactive-svg-pin" data-pin="2" cx="40" cy="24" r="6" fill="#888780"/><text class="interactive-svg-pin" data-pin="2" x="40" y="28" text-anchor="middle" fill="#fff" font-size="8">2</text><circle class="interactive-svg-pin" data-pin="5" cx="53" cy="30" r="6" fill="#7F77DD"/><text class="interactive-svg-pin" data-pin="5" x="53" y="34" text-anchor="middle" fill="#fff" font-size="8">5</text><circle class="interactive-svg-pin" data-pin="3" cx="62" cy="46" r="6" fill="#D3D1C7"/><text class="interactive-svg-pin" data-pin="3" x="62" y="50" text-anchor="middle" fill="#555" font-size="8">3</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">DIN 5-Pin (1-4-2-5-3)</text></svg>`
  },
  {
    id: 'toslink',
    aliases: ['optical', 'adat-optical', 'spdif-optical'],
    name: 'Optical / TOSLINK (ADAT & S/PDIF)',
    cat: 'digital',
    tag: 'Digital optical',
    color: '#EF9F27',
    desc: 'Toshiba Link fiber optic connector utilizing plastic optical fiber (POF) and 650nm red LED light. Completely immune to ground loops, EMI, and RF noise. Carries 2 channels S/PDIF or 8 channels ADAT Lightpipe (44.1/48kHz; 4 channels at 96kHz SMUX).',
    uses: ['ADAT 8-channel mic preamp expansion', 'Studio monitor DAC inputs', 'Consumer media player optical feeds'],
    pins: [
      {n:'TX', pin:'TX', sig:'Optical Transmitter', name:'TX Emitter', color:'#EF9F27', col:'#EF9F27', note:'Red LED 650nm optical output pulse', desc:'Optical Out'},
      {n:'RX', pin:'RX', sig:'Optical Receiver', name:'RX Detector', color:'#888780', col:'#888780', note:'High-speed photodiode detector', desc:'Optical In'}
    ],
    phantomSafety: 'na',
    cableSpec: '1mm PMMA Plastic Optical Fiber (<0.2 dB/m, min bend radius 25mm)',
    troubleshootTip: 'Visual check: bright red 650nm light must emerge from transmitting cable ferrule when connected to source. Inspect polished optical ferrule face for scratches or dust.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="24" width="48" height="36" rx="4" fill="#1a1a22" stroke="#EF9F27" stroke-width="1.5"/><rect x="24" y="32" width="32" height="20" rx="2" fill="#0C0C0F"/><circle class="interactive-svg-pin" data-pin="TX" cx="40" cy="42" r="8" fill="#EF9F27" opacity="0.9"/><circle class="interactive-svg-pin" data-pin="TX" cx="40" cy="42" r="4" fill="#fff" opacity="0.6"/><text x="40" y="78" text-anchor="middle" fill="#888" font-size="8">TOSLINK optical</text></svg>`
  },
  {
    id: 'aes72',
    aliases: ['catsnake', 'radial-catapult', 'cat5-snake'],
    name: 'AES72 RJ45 4-Channel CatSnake',
    cat: 'digital',
    tag: '4-Ch audio over Cat',
    color: '#7F77DD',
    desc: 'Official AES standard (AES72-2019) for transporting 4 channels of balanced analog audio, AES3 digital audio, or DMX512 control over standard 4-pair Cat5e/Cat6 cable (SoundTools CatSnake, Radial Catapult). Type 1M: Pairs 1-4 carry Channels 1-4, metal shell provides common ground return. Supports +48V phantom ONLY with shielded cable.',
    uses: ['4-channel stage drop boxes', 'Drive-rack audio snakes', 'Intercom snakes', 'Lighting DMX trunks over Cat6'],
    pins: [
      {n:'Ch1', pin:'1', sig:'Ch 1 (Pair 2: W-Org / Org)', name:'Ch 1 [Pins 1 & 2]', color:'#E24B4A', col:'#E24B4A', note:'Pin 1 (+), Pin 2 (−)', desc:'Ch 1'},
      {n:'Ch2', pin:'2', sig:'Ch 2 (Pair 3: W-Grn / Grn)', name:'Ch 2 [Pins 3 & 6]', color:'#1D9E75', col:'#1D9E75', note:'Pin 3 (+), Pin 6 (−)', desc:'Ch 2'},
      {n:'Ch3', pin:'3', sig:'Ch 3 (Pair 1: W-Blu / Blu)', name:'Ch 3 [Pins 5 & 4]', color:'#378ADD', col:'#378ADD', note:'Pin 5 (+), Pin 4 (−)', desc:'Ch 3'},
      {n:'Ch4', pin:'4', sig:'Ch 4 (Pair 4: W-Brn / Brn)', name:'Ch 4 [Pins 7 & 8]', color:'#D4537E', col:'#D4537E', note:'Pin 7 (+), Pin 8 (−)', desc:'Ch 4'},
      {n:'GND', pin:'GND', sig:'Common Shield (RJ45 Metal Shell)', name:'Shield Drain', color:'#888780', col:'#888780', note:'Provides +48V DC ground return (Type 1M)', desc:'Common Shield'}
    ],
    phantomSafety: 'safe',
    cableSpec: 'Shielded Cat5e / Cat6 / Cat7 STP/SFTP Cable (100Ω–110Ω differential pairs)',
    troubleshootTip: 'Check continuity from RJ45 metal shell to Pin 1 of all 4 breakout XLRs (<0.5Ω). DANGER: Unshielded UTP cable (Type 1O) cannot carry phantom power.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="22" width="52" height="42" rx="4" fill="#1a1a22" stroke="#7F77DD" stroke-width="1.5"/><rect class="interactive-svg-pin" data-pin="Ch1" x="18" y="28" width="8" height="28" rx="2" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="Ch1" x="22" y="44" text-anchor="middle" fill="#fff" font-size="7">1</text><rect class="interactive-svg-pin" data-pin="Ch2" x="30" y="28" width="8" height="28" rx="2" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="Ch2" x="34" y="44" text-anchor="middle" fill="#fff" font-size="7">2</text><rect class="interactive-svg-pin" data-pin="Ch3" x="42" y="28" width="8" height="28" rx="2" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="Ch3" x="46" y="44" text-anchor="middle" fill="#fff" font-size="7">3</text><rect class="interactive-svg-pin" data-pin="Ch4" x="54" y="28" width="8" height="28" rx="2" fill="#D4537E"/><text class="interactive-svg-pin" data-pin="Ch4" x="58" y="44" text-anchor="middle" fill="#fff" font-size="7">4</text><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">AES72 4-Ch</text></svg>`
  },
  {
    id: 'aes3',
    aliases: ['aes-ebu', 'aes3id', '110-ohm-digital'],
    name: 'AES/EBU Digital Audio (110Ω XLR vs 75Ω BNC)',
    cat: 'digital',
    tag: 'AES3 digital audio',
    color: '#378ADD',
    desc: 'Professional digital audio standard for transmitting 2 channels of PCM digital audio over a single balanced serial link. 110Ω balanced on 3-pin XLR (2V–7V p-p, AES3) or 75Ω unbalanced on BNC (1V p-p, AES3id). Interconnecting 110Ω XLR to 75Ω BNC requires an impedance-matching balun transformer.',
    uses: ['Digital console master bus to system DSP', 'Digital mic preamp outputs', 'Studio master clock / sync', 'Broadcast audio distribution'],
    warn: 'DO NOT APPLY +48V! DC phantom voltage saturates pulse transformers and destroys RS-422 receiver chips.',
    pins: [
      {n:'1', pin:'1', sig:'Ground / Shield', name:'Pin 1 (Shield)', color:'#888780', col:'#888780', note:'Common ground screen', desc:'GND'},
      {n:'2', pin:'2', sig:'Data (+) Balanced', name:'Pin 2 (Data+)', color:'#E24B4A', col:'#E24B4A', note:'Non-inverting digital bi-phase data', desc:'Data+'},
      {n:'3', pin:'3', sig:'Data (−) Balanced', name:'Pin 3 (Data−)', color:'#ffffff', col:'#ffffff', note:'Inverting digital bi-phase data', desc:'Data−', border:'#cccccc'}
    ],
    phantomSafety: 'danger',
    cableSpec: '110Ω (±20%) Balanced Digital Audio Cable with Foil+Braid Shield (Belden 1800B)',
    troubleshootTip: 'Check 1-to-1 continuity. Ensure cable is labeled "110 OHM DIGITAL". Standard analog mic cable (45Ω) causes high-frequency attenuation and eye-pattern jitter over >15m.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><circle class="interactive-svg-pin" data-pin="2" cx="24" cy="34" r="8" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="2" x="24" y="38" text-anchor="middle" fill="#fff" font-size="9">2</text><circle class="interactive-svg-pin" data-pin="1" cx="56" cy="34" r="8" fill="#888780"/><text class="interactive-svg-pin" data-pin="1" x="56" y="38" text-anchor="middle" fill="#fff" font-size="9">1</text><circle class="interactive-svg-pin" data-pin="3" cx="40" cy="62" r="8" fill="#eee" stroke="#ccc"/><text class="interactive-svg-pin" data-pin="3" x="40" y="66" text-anchor="middle" fill="#333" font-size="9">3</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">110Ω AES3</text></svg>`
  },

  {
    id: 'bnc',
    aliases: ['sdi-bnc', 'bnc-75', 'word-clock', 'madi-bnc'],
    name: 'BNC 75Ω (Word Clock, MADI & SDI Sync)',
    cat: 'digital',
    tag: '75Ω coax SDI / sync',
    color: '#888780',
    desc: 'Precision 75Ω bayonet coaxial connector for Serial Digital Video (HD-SDI, 3G-SDI, 6G-SDI, 12G-SDI 4K/60p) and studio Word Clock synchronization. Never use 50Ω RF BNC cables — 50Ω cable causes severe impedance mismatch reflections and SDI CRC packet dropouts.',
    uses: ['Broadcast camera SDI feeds', 'Video router patchbays', 'LED video wall processor inputs', 'Studio Word Clock distribution'],
    pins: [
      {n:'C', pin:'C', sig:'Center Pin — Signal (+)', name:'Center Pin (+)', color:'#EF9F27', col:'#EF9F27', note:'Serial digital video or word clock pulse', desc:'Signal'},
      {n:'O', pin:'O', sig:'Outer Shell — Ground / Shield', name:'Outer Shell (GND)', color:'#888780', col:'#888780', note:'Coaxial braided ground screen', desc:'GND'}
    ],
    phantomSafety: 'na',
    cableSpec: 'Strict 75Ω Precision Coaxial Cable (Belden 1694A / Belden 4794R)',
    troubleshootTip: 'Center-to-Center <0.3Ω; Shell-to-Shell <0.3Ω; Center-to-Shell >100MΩ. Max distance: 3G-SDI 80m (1694A) / 100m (4794R); 12G-SDI 45m (1694A) / 70m (4794R).',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle class="interactive-svg-pin" data-pin="O" cx="40" cy="44" r="28" fill="#1a1a22" stroke="#888780" stroke-width="6"/><circle class="interactive-svg-pin" data-pin="C" cx="40" cy="44" r="10" fill="#EF9F27" stroke="#BA7517" stroke-width="1.5"/><text class="interactive-svg-pin" data-pin="C" x="40" y="48" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">75Ω</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Coax — BNC</text></svg>`
  },
  {
    id: 'ltc-timecode',
    aliases: ['smpte-timecode', 'ltc', 'lemo-timecode'],
    name: 'LTC SMPTE Timecode (XLR ↔ BNC ↔ LEMO 5)',
    cat: 'digital',
    tag: 'Timecode sync',
    color: '#EF9F27',
    desc: 'SMPTE 12M Linear Timecode (LTC) audio signal format. Encoded as an 80-bit per frame bi-phase mark modulated square/sine wave running at 1.2 kHz to 2.4 kHz. Synchronizes lighting, pyro, laser, video playback, and DAW multi-tracks. XLR: 1 GND, 2 Hot, 3 Cold; BNC: Center Hot, Shell GND; LEMO 5-Pin: 1 GND, 2 LTC IN, 5 LTC OUT.',
    uses: ['Show control master clock sync', 'ARRI / RED camera timecode sync', 'Ambient Lockit / Tentacle Sync boxes', 'Audio playback track sync to lighting'],
    warn: 'DO NOT ENGAGE +48V! Applying phantom power destroys the output driver op-amp on timecode boxes and cameras.',
    pins: [
      {n:'1', pin:'1', sig:'Ground / Shield (All Connectors)', name:'Ground / Shield', color:'#888780', col:'#888780', note:'XLR Pin 1 / BNC Shell / LEMO Pin 1', desc:'GND'},
      {n:'2', pin:'2', sig:'LTC Signal Hot (+) / LEMO LTC IN', name:'LTC Hot / IN', color:'#E24B4A', col:'#E24B4A', note:'XLR Pin 2 / BNC Center / LEMO Pin 2 (IN)', desc:'LTC Hot'},
      {n:'3', pin:'3', sig:'LTC Cold (−) / LEMO RS232 TX', name:'LTC Cold / RS232', color:'#ffffff', col:'#ffffff', note:'XLR Pin 3 / LEMO Pin 3 (ASCII metadata)', desc:'LTC Cold', border:'#cccccc'},
      {n:'5', pin:'5', sig:'LEMO Pin 5: LTC Timecode OUT', name:'LEMO Pin 5 (OUT)', color:'#EF9F27', col:'#EF9F27', note:'Timecode output signal on 5-pin LEMO', desc:'LTC Out'}
    ],
    phantomSafety: 'danger',
    cableSpec: '24 AWG Shielded Twisted Pair (XLR) or 75Ω RG179 Coax (BNC / LEMO 0B.305)',
    troubleshootTip: 'LTC is audible as a harsh, buzzing continuous tone. Measure AC voltage on DMM: should read 1.0V to 2.0V AC (+4 dBu to +8 dBu). Verify timecode generator frame rate matches console (24, 25, 29.97DF, 30 fps).',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#EF9F27" stroke-width="1.5"/><circle class="interactive-svg-pin" data-pin="2" cx="24" cy="34" r="6" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="2" x="24" y="38" text-anchor="middle" fill="#fff" font-size="8">2</text><circle class="interactive-svg-pin" data-pin="1" cx="56" cy="34" r="6" fill="#888"/><text class="interactive-svg-pin" data-pin="1" x="56" y="38" text-anchor="middle" fill="#fff" font-size="8">1</text><circle class="interactive-svg-pin" data-pin="3" cx="40" cy="62" r="6" fill="#fff" stroke="#ccc"/><text class="interactive-svg-pin" data-pin="3" x="40" y="66" text-anchor="middle" fill="#333" font-size="8">3</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">LTC (SMPTE 12M)</text></svg>`
  },

// ==========================================
  // CATEGORY 5: LIGHTING & DMX (USITT DMX512-A)
  // ==========================================
  {
    id: 'xlr5',
    aliases: ['dmx512', 'dmx-5pin', 'dmx-rdm'],
    name: 'XLR 5-Pin (DMX512-A & RDM)',
    cat: 'lighting',
    tag: 'DMX512-A / RDM',
    color: '#7F77DD',
    desc: 'The official ANSI E1.11 standard connector for DMX512-A digital lighting control and ANSI E1.20 Remote Device Management (RDM). Features 120Ω differential RS-485 serial communication at 250 kbaud across up to 32 unit loads per daisy chain.',
    uses: ['Automated moving lights', 'LED fixtures & dimmers', 'DMX opto-splitters', 'Theatrical lighting consoles'],
    pins: [
      {n:'1', pin:'1', sig:'Signal Common / Ground', name:'Pin 1 (Common)', color:'#888780', col:'#888780', note:'Common reference ground & shield', desc:'GND'},
      {n:'2', pin:'2', sig:'Data 1 Complement (−)', name:'Pin 2 (Data 1−)', color:'#E24B4A', col:'#E24B4A', note:'Primary inverted data line', desc:'Data 1−'},
      {n:'3', pin:'3', sig:'Data 1 True (+)', name:'Pin 3 (Data 1+)', color:'#ffffff', col:'#ffffff', note:'Primary non-inverted data line', desc:'Data 1+', border:'#cccccc'},
      {n:'4', pin:'4', sig:'Data 2 Complement (−)', name:'Pin 4 (Data 2−)', color:'#1D9E75', col:'#1D9E75', note:'Secondary data link / optional (N.C.)', desc:'Data 2−'},
      {n:'5', pin:'5', sig:'Data 2 True (+)', name:'Pin 5 (Data 2+)', color:'#378ADD', col:'#378ADD', note:'Secondary data link / optional (N.C.)', desc:'Data 2+'}
    ],
    phantomSafety: 'danger',
    cableSpec: '120Ω (±10%) Shielded Twisted Pair DMX Cable (Belden 9841 / 9842)',
    troubleshootTip: 'With console transmitting, measure DC on Pin 2 and Pin 3 to Pin 1 (~2.5V DC with high-speed AC toggle). Measure end-of-line resistance across 2 & 3: reads 120Ω with terminator, open without.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#534AB7" stroke-width="1.5"/><rect x="36" y="11" width="8" height="4" fill="#555"/><circle class="interactive-svg-pin" data-pin="3" cx="24" cy="28" r="7" fill="#eee" stroke="#ccc"/><text class="interactive-svg-pin" data-pin="3" x="24" y="32" text-anchor="middle" fill="#333" font-size="9" font-weight="500">3</text><circle class="interactive-svg-pin" data-pin="4" cx="56" cy="28" r="7" fill="#1D9E75"/><text class="interactive-svg-pin" data-pin="4" x="56" y="32" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">4</text><circle class="interactive-svg-pin" data-pin="2" cx="22" cy="50" r="7" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="2" x="22" y="54" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">2</text><circle class="interactive-svg-pin" data-pin="5" cx="58" cy="50" r="7" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="5" x="58" y="54" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">5</text><circle class="interactive-svg-pin" data-pin="1" cx="40" cy="66" r="7" fill="#888780"/><text class="interactive-svg-pin" data-pin="1" x="40" y="70" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">1</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {
    id: 'socapex19',
    aliases: ['soca19', 'socapex', '19-pin-mains'],
    name: 'Socapex 19-Pin (6-Circuit Mains / Motor)',
    cat: 'power',
    tag: '6-circuit mains / PA trunk',
    color: '#E24B4A',
    desc: 'Heavy-duty circular 19-pin connector carrying 6 independent 120V or 208V/240V mains power circuits (16A/20A per circuit). Industry standard for theatrical lighting truss multicore and 3-phase chain hoist motors. CRITICAL: Every circuit MUST maintain its own dedicated isolated neutral wire — never common neutrals!',
    uses: ['Truss multi-cables to 6-lamp bars', 'Moving light power distro trunks', '3-phase stage chain hoist motor power'],
    pins: [
      {n:'1', pin:'1', sig:'Circuit 1 Live (L1)', name:'Pin 1 (C1 Live)', color:'#E24B4A', col:'#E24B4A', note:'Circuit 1 hot phase (pairs with N1 Pin 2, PE1 Pin 13)', desc:'C1 Live'},
      {n:'2', pin:'2', sig:'Circuit 1 Neutral (N1)', name:'Pin 2 (C1 Neutral)', color:'#378ADD', col:'#378ADD', note:'Circuit 1 dedicated isolated neutral', desc:'C1 Neutral'},
      {n:'3', pin:'3', sig:'Circuit 2 Live (L2)', name:'Pin 3 (C2 Live)', color:'#EF9F27', col:'#EF9F27', note:'Circuit 2 hot phase (pairs with N2 Pin 4, PE2 Pin 14)', desc:'C2 Live'},
      {n:'4', pin:'4', sig:'Circuit 2 Neutral (N2)', name:'Pin 4 (C2 Neutral)', color:'#378ADD', col:'#378ADD', note:'Circuit 2 dedicated isolated neutral', desc:'C2 Neutral'},
      {n:'5', pin:'5', sig:'Circuit 3 Live (L3)', name:'Pin 5 (C3 Live)', color:'#1D9E75', col:'#1D9E75', note:'Circuit 3 hot phase (pairs with N3 Pin 6, PE3 Pin 15)', desc:'C3 Live'},
      {n:'6', pin:'6', sig:'Circuit 3 Neutral (N3)', name:'Pin 6 (C3 Neutral)', color:'#378ADD', col:'#378ADD', note:'Circuit 3 dedicated isolated neutral', desc:'C3 Neutral'},
      {n:'7', pin:'7', sig:'Circuit 4 Live (L4)', name:'Pin 7 (C4 Live)', color:'#E24B4A', col:'#E24B4A', note:'Circuit 4 hot phase (pairs with N4 Pin 8, PE4 Pin 16)', desc:'C4 Live'},
      {n:'8', pin:'8', sig:'Circuit 4 Neutral (N4)', name:'Pin 8 (C4 Neutral)', color:'#378ADD', col:'#378ADD', note:'Circuit 4 dedicated isolated neutral', desc:'C4 Neutral'},
      {n:'9', pin:'9', sig:'Circuit 5 Live (L5)', name:'Pin 9 (C5 Live)', color:'#7F77DD', col:'#7F77DD', note:'Circuit 5 hot phase (pairs with N5 Pin 10, PE5 Pin 17)', desc:'C5 Live'},
      {n:'10', pin:'10', sig:'Circuit 5 Neutral (N5)', name:'Pin 10 (C5 Neutral)', color:'#378ADD', col:'#378ADD', note:'Circuit 5 dedicated isolated neutral', desc:'C5 Neutral'},
      {n:'11', pin:'11', sig:'Circuit 6 Live (L6)', name:'Pin 11 (C6 Live)', color:'#D4537E', col:'#D4537E', note:'Circuit 6 hot phase (pairs with N6 Pin 12, PE6 Pin 18)', desc:'C6 Live'},
      {n:'12', pin:'12', sig:'Circuit 6 Neutral (N6)', name:'Pin 12 (C6 Neutral)', color:'#378ADD', col:'#378ADD', note:'Circuit 6 dedicated isolated neutral', desc:'C6 Neutral'},
      {n:'13', pin:'13', sig:'Circuit 1 Earth (PE1)', name:'Pin 13 (C1 Earth)', color:'#639922', col:'#639922', note:'Protective Earth for Circuit 1', desc:'C1 PE'},
      {n:'14', pin:'14', sig:'Circuit 2 Earth (PE2)', name:'Pin 14 (C2 Earth)', color:'#639922', col:'#639922', note:'Protective Earth for Circuit 2', desc:'C2 PE'},
      {n:'15', pin:'15', sig:'Circuit 3 Earth (PE3)', name:'Pin 15 (C3 Earth)', color:'#639922', col:'#639922', note:'Protective Earth for Circuit 3', desc:'C3 PE'},
      {n:'16', pin:'16', sig:'Circuit 4 Earth (PE4)', name:'Pin 16 (C4 Earth)', color:'#639922', col:'#639922', note:'Protective Earth for Circuit 4', desc:'C4 PE'},
      {n:'17', pin:'17', sig:'Circuit 5 Earth (PE5)', name:'Pin 17 (C5 Earth)', color:'#639922', col:'#639922', note:'Protective Earth for Circuit 5', desc:'C5 PE'},
      {n:'18', pin:'18', sig:'Circuit 6 Earth (PE6)', name:'Pin 18 (C6 Earth)', color:'#639922', col:'#639922', note:'Protective Earth for Circuit 6', desc:'C6 PE'},
      {n:'19', pin:'19', sig:'Center Pin 19: Central Alignment & Ground', name:'Pin 19 (Center PE)', color:'#639922', col:'#639922', note:'Center ground / chassis bond', desc:'Center PE'}
    ],
    phantomSafety: 'na',
    cableSpec: '19-Conductor 12 AWG (2.5mm²) or 14 AWG (1.5mm²) Rubber SOOW / H07RN-F',
    troubleshootTip: 'Use Socapex sniffer to verify all 6 circuits have Live, dedicated isolated Neutral, and Earth correctly paired. Measure voltage from each Live pin to its matching Neutral pin (120V or 230V AC); verify 0V AC between any Neutral and Earth.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#E24B4A" stroke-width="2"/><circle class="interactive-svg-pin" data-pin="19" cx="40" cy="45" r="5" fill="#639922"/><text class="interactive-svg-pin" data-pin="19" x="40" y="48" text-anchor="middle" fill="#fff" font-size="7">19</text><g fill="#E24B4A"><circle class="interactive-svg-pin" data-pin="1" cx="40" cy="22" r="4"/><circle class="interactive-svg-pin" data-pin="3" cx="58" cy="30" r="4"/><circle class="interactive-svg-pin" data-pin="5" cx="62" cy="52" r="4"/><circle class="interactive-svg-pin" data-pin="7" cx="48" cy="65" r="4"/><circle class="interactive-svg-pin" data-pin="9" cx="30" cy="65" r="4"/><circle class="interactive-svg-pin" data-pin="11" cx="18" cy="48" r="4"/></g><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Socapex 19P</text></svg>`
  },

  // ==========================================
  // CATEGORY 6: STAGE POWER & DISTRO
  // ==========================================
  {
    id: 'powercon',
    aliases: ['powercon-nac3', 'nac3', 'nac3fca', 'nac3fcb', 'powercon-blue', 'powercon-grey', 'pcon'],
    name: 'powerCON 20A — NAC3FCA (Blue In) / NAC3FCB (Grey Out)',
    cat: 'power',
    tag: 'Locking 20A mains power',
    color: '#378ADD',
    desc: 'Neutrik 3-conductor locking mains connector rated at 250V AC / 16A (EU) or 20A (US). Blue (NAC3FCA, Type A keyway) is strictly for Power IN; Grey (NAC3FCB, Type B keyway) is strictly for Power OUT / loop-through. WARNING: Standard NAC3 series has NO BREAKING CAPACITY (CBC) — never connect or disconnect under electrical load.',
    uses: ['Amplifier rack mains distribution', 'Powered PA speaker mains input', 'Stage lighting distribution boxes', 'Rack equipment power loop-through'],
    warn: 'DANGER — LIVE MAINS VOLTAGE (120V–240V). Disconnect supply circuit breaker before unplugging. No breaking capacity — disconnecting under load causes dangerous electrical arcing and pin pitting.',
    pins: [
      {n:'L', pin:'L', sig:'Line (Live) — Brown / Black', name:'Line (L)', color:'#E24B4A', col:'#E24B4A', note:'Brown wire (UK/EU) / Black wire (US)', desc:'Live'},
      {n:'N', pin:'N', sig:'Neutral — Blue / White', name:'Neutral (N)', color:'#1a1a22', col:'#1a1a22', note:'Blue wire (UK/EU) / White wire (US)', desc:'Neutral', border:'#555555'},
      {n:'PE', pin:'PE', sig:'Earth (PE) — Green-Yellow', name:'Earth (PE)', color:'#639922', col:'#639922', note:'Protective Earth (mating first, breaking last)', desc:'Earth'}
    ],
    phantomSafety: 'na',
    cableSpec: '3-Conductor 14 AWG (2.0mm²) to 12 AWG (3.3mm²) SOOW / H07RN-F',
    troubleshootTip: 'Blue = IN (power into unit). Grey = OUT (power to next unit). Keying prevents mismatch. Test L-N (120V/230V AC) and L-PE (120V/230V AC); N-PE must be <2V AC. PE resistance to chassis <0.1Ω.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#378ADD" stroke-width="2.5"/><circle class="interactive-svg-pin" data-pin="L" cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text class="interactive-svg-pin" data-pin="L" x="22" y="56" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">L</text><circle class="interactive-svg-pin" data-pin="N" cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text class="interactive-svg-pin" data-pin="N" x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9" font-weight="500">N</text><circle class="interactive-svg-pin" data-pin="PE" cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text class="interactive-svg-pin" data-pin="PE" x="40" y="34" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">PE</text><text x="40" y="82" text-anchor="middle" fill="#378ADD" font-size="8">Blue IN / Grey OUT</text></svg>`
  },
  {
    id: 'powercon-true1',
    aliases: ['pcon-true1', 'true1', 'nac3fx-top'],
    name: 'Neutrik powerCON TRUE1 TOP (CBC Breaking)',
    cat: 'power',
    tag: 'Breaking capacity mains',
    color: '#E24B4A',
    desc: 'Next-generation mains connector (NAC3FX-W-TOP / NAC3MX-W-TOP). Certified to IEC EN 60320-1 and UL 60320-1 with Circuit Breaking Capacity (CBC), permitting safe connection and disconnection under full electrical load (250V AC / 16A). True Outdoor Protection (TOP) with IP65 weather rating and UV resistance.',
    uses: ['Modern touring moving lights (Robe, Ayrton, Martin)', 'Touring amplifier racks', 'Outdoor festival stages', 'LED video wall distros'],
    pins: [
      {n:'L', pin:'L', sig:'Line (Live) — Brown / Black', name:'Line (L)', color:'#E24B4A', col:'#E24B4A', note:'Brown wire (EU) / Black wire (US)', desc:'Live'},
      {n:'N', pin:'N', sig:'Neutral — Blue / White', name:'Neutral (N)', color:'#1a1a22', col:'#1a1a22', note:'Blue wire (EU) / White wire (US)', desc:'Neutral', border:'#555555'},
      {n:'PE', pin:'PE', sig:'Protective Earth — Green-Yellow', name:'Earth (PE)', color:'#639922', col:'#639922', note:'Pre-mating first-make last-break contact', desc:'Earth'}
    ],
    phantomSafety: 'na',
    cableSpec: '3-Conductor 14 AWG (2.0mm²) to 12 AWG (3.3mm²) H07RN-F or SJTW/SOOW Outdoor Cable',
    troubleshootTip: 'Check PE earth continuity (<0.05Ω). Verify weatherproofing rubber gasket is intact and seated in locking collar before outdoor festival deployment.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#E24B4A" stroke-width="2.5"/><circle class="interactive-svg-pin" data-pin="L" cx="24" cy="50" r="7" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="L" x="24" y="54" text-anchor="middle" fill="#fff" font-size="8">L</text><circle class="interactive-svg-pin" data-pin="N" cx="56" cy="50" r="7" fill="#1a1a22" stroke="#555"/><text class="interactive-svg-pin" data-pin="N" x="56" y="54" text-anchor="middle" fill="#aaa" font-size="8">N</text><circle class="interactive-svg-pin" data-pin="PE" cx="40" cy="30" r="7" fill="#639922"/><text class="interactive-svg-pin" data-pin="PE" x="40" y="34" text-anchor="middle" fill="#fff" font-size="8">PE</text><text x="40" y="82" text-anchor="middle" fill="#E24B4A" font-size="8">TRUE1 TOP (CBC)</text></svg>`
  },
  {
    id: 'ceeform-1ph',
    aliases: ['ceeform-blue', 'iec60309-1ph', 'commando-16a'],
    name: 'CEEForm 1-Phase 16A/32A Blue (IEC 60309 6h)',
    cat: 'power',
    tag: 'Industrial 1-Ph 230V',
    color: '#378ADD',
    desc: 'Heavy-duty industrial power connector standard (IEC 60309 / CEE 17) used across European and international live production. 3-Pin Blue housing denotes single-phase 200V–250V AC. Earth pin is at the 6h (6 o\'clock) clock position relative to the major bottom keyway.',
    uses: ['Heavy stage audio amplifier racks', 'Followspot power feeds', 'Outdoor stage distro sub-feeds', 'Catering & production trailer power'],
    pins: [
      {n:'L', pin:'L', sig:'Live Phase (Brown)', name:'Line (L)', color:'#E24B4A', col:'#E24B4A', note:'230V AC nominal live phase conductor', desc:'Live'},
      {n:'N', pin:'N', sig:'Neutral (Blue)', name:'Neutral (N)', color:'#378ADD', col:'#378ADD', note:'Neutral return conductor', desc:'Neutral'},
      {n:'PE', pin:'PE', sig:'Earth (Green-Yellow) at 6h Position', name:'Earth (PE)', color:'#639922', col:'#639922', note:'Larger diameter pin at 6 o\'clock keyway', desc:'Earth (6h)'}
    ],
    phantomSafety: 'na',
    cableSpec: '3-Conductor H07RN-F Heavy Rubber: 16A (2.5mm² / 14 AWG) or 32A (6.0mm² / 10 AWG)',
    troubleshootTip: 'Keyway is at 6 o\'clock. Measure Phase-to-Neutral: 220V–240V AC. Measure Phase-to-Earth: 220V–240V AC. Measure Neutral-to-Earth: <2.0V AC.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#378ADD" stroke-width="2"/><circle class="interactive-svg-pin" data-pin="L" cx="25" cy="36" r="7" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="L" x="25" y="40" text-anchor="middle" fill="#fff" font-size="8">L</text><circle class="interactive-svg-pin" data-pin="N" cx="55" cy="36" r="7" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="N" x="55" y="40" text-anchor="middle" fill="#fff" font-size="8">N</text><circle class="interactive-svg-pin" data-pin="PE" cx="40" cy="60" r="8" fill="#639922"/><text class="interactive-svg-pin" data-pin="PE" x="40" y="64" text-anchor="middle" fill="#fff" font-size="8">PE</text><rect x="37" y="73" width="6" height="4" fill="#378ADD"/><text x="40" y="84" text-anchor="middle" fill="#888" font-size="7">CEE Blue 6h</text></svg>`
  },
  {
    id: 'ceeform-3ph',
    aliases: ['ceeform-red', 'iec60309-3ph', 'commando-32a'],
    name: 'CEEForm 3-Phase 32A/63A Red (IEC 60309 6h)',
    cat: 'power',
    tag: 'Industrial 3-Ph 400V',
    color: '#E24B4A',
    desc: 'Heavy-duty 5-pin industrial power connector standard (IEC 60309 / CEE 17). Red housing denotes 3-phase 380V–415V AC Star + Neutral. Earth pin is at 6h (6 o\'clock) position. MANDATORY: Verify clockwise phase sequence (L1 → L2 → L3) — reversed sequence runs chain hoist motors backwards!',
    uses: ['Main stage audio distribution racks', 'Moving light dimmer/power racks', 'Stage chain hoist motor distro', 'LED video wall primary power'],
    pins: [
      {n:'L1', pin:'L1', sig:'Phase 1 (Brown)', name:'Phase 1 (L1)', color:'#E24B4A', col:'#E24B4A', note:'Phase 1 (230V to N, 400V to L2/L3)', desc:'L1'},
      {n:'L2', pin:'L2', sig:'Phase 2 (Black)', name:'Phase 2 (L2)', color:'#1a1a22', col:'#1a1a22', note:'Phase 2 (230V to N, 400V to L1/L3)', desc:'L2', border:'#555555'},
      {n:'L3', pin:'L3', sig:'Phase 3 (Grey)', name:'Phase 3 (L3)', color:'#888780', col:'#888780', note:'Phase 3 (230V to N, 400V to L1/L2)', desc:'L3'},
      {n:'N', pin:'N', sig:'Neutral (Blue) — Central Pin', name:'Neutral (N)', color:'#378ADD', col:'#378ADD', note:'Common neutral return for all 3 phases', desc:'Neutral'},
      {n:'PE', pin:'PE', sig:'Earth (Green-Yellow) at 6h Position', name:'Earth (PE)', color:'#639922', col:'#639922', note:'Larger diameter pin at 6 o\'clock keyway', desc:'Earth (6h)'}
    ],
    phantomSafety: 'na',
    cableSpec: '5-Conductor H07RN-F Rubber: 32A (6.0mm² / 10 AWG) or 63A (16.0mm² / 5 AWG)',
    troubleshootTip: 'Measure Phase-to-Neutral: 220V–240V AC. Measure Phase-to-Phase across L1-L2, L2-L3, L3-L1: 380V–415V AC. Neutral-to-Earth: <2.0V AC. Verify clockwise rotation with phase meter prior to powering hoists.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#E24B4A" stroke-width="2"/><circle class="interactive-svg-pin" data-pin="L1" cx="24" cy="30" r="5.5" fill="#E24B4A"/><text class="interactive-svg-pin" data-pin="L1" x="24" y="33" text-anchor="middle" fill="#fff" font-size="7">L1</text><circle class="interactive-svg-pin" data-pin="L2" cx="56" cy="30" r="5.5" fill="#1a1a22" stroke="#555"/><text class="interactive-svg-pin" data-pin="L2" x="56" y="33" text-anchor="middle" fill="#aaa" font-size="7">L2</text><circle class="interactive-svg-pin" data-pin="L3" cx="62" cy="50" r="5.5" fill="#888"/><text class="interactive-svg-pin" data-pin="L3" x="62" y="53" text-anchor="middle" fill="#fff" font-size="7">L3</text><circle class="interactive-svg-pin" data-pin="N" cx="40" cy="42" r="5.5" fill="#378ADD"/><text class="interactive-svg-pin" data-pin="N" x="40" y="45" text-anchor="middle" fill="#fff" font-size="7">N</text><circle class="interactive-svg-pin" data-pin="PE" cx="40" cy="62" r="7" fill="#639922"/><text class="interactive-svg-pin" data-pin="PE" x="40" y="65" text-anchor="middle" fill="#fff" font-size="7">PE</text><text x="40" y="84" text-anchor="middle" fill="#888" font-size="7">CEE Red 6h</text></svg>`
  },
  {
    id: 'camlock-400a',
    aliases: ['camlock', 'cam-lock', 'e1016'],
    name: 'Camlock (Series 16 E1016 400A Feeder)',
    cat: 'power',
    tag: '400A 3-phase feeder',
    color: '#E24B4A',
    desc: 'Single-pole high-amperage locking series connector rated up to 400A continuous at 600V AC. Used to connect main mobile generator power or venue company switches to stage distribution distros. MANDATORY SAFE TIE-IN SEQUENCE: Ground first -> Neutral second -> Hots (Black/Red/Blue) last. Disconnect in exact reverse sequence!',
    uses: ['Main generator power hookup', 'Venue company switch tie-in', 'Primary stage power distro feed (audio, video, lights)'],
    warn: 'LETHAL TOUCH POTENTIAL: Never connect Phase hots before Ground or Neutral! Loose cam engagement causes catastrophic arc melts under 200A–400A loads.',
    pins: [
      {n:'GND', pin:'GND', sig:'Ground (Green) — CONNECT 1ST / DISCONNECT LAST', name:'Ground (Green)', color:'#639922', col:'#639922', note:'Mandatory tie-in step 1: chassis safety bond', desc:'Step 1'},
      {n:'N', pin:'N', sig:'Neutral (White/Blue) — CONNECT 2ND', name:'Neutral (White)', color:'#ffffff', col:'#ffffff', note:'Mandatory tie-in step 2: neutral return reference', desc:'Step 2', border:'#cccccc'},
      {n:'L1', pin:'L1', sig:'Phase A / Line 1 (Black/Brown) — CONNECT 3RD', name:'Line 1 (Black)', color:'#1a1a22', col:'#1a1a22', note:'Phase 1 hot (120V to N / 208V to L2)', desc:'Step 3', border:'#555555'},
      {n:'L2', pin:'L2', sig:'Phase B / Line 2 (Red/Black) — CONNECT 4TH', name:'Line 2 (Red)', color:'#E24B4A', col:'#E24B4A', note:'Phase 2 hot (120V to N / 208V to L3)', desc:'Step 4'},
      {n:'L3', pin:'L3', sig:'Phase C / Line 3 (Blue/Grey) — CONNECT 5TH', name:'Line 3 (Blue)', color:'#378ADD', col:'#378ADD', note:'Phase 3 hot (120V to N / 208V to L1)', desc:'Step 5'}
    ],
    phantomSafety: 'na',
    cableSpec: '4/0 AWG (120mm²) or 2/0 AWG (70mm²) Type W / SC Entertainment Stage Feeder Cable',
    troubleshootTip: 'Mandatory safe tie-in sequence: connect Ground first, Neutral second, and Phase Hots last. Verify ground continuity and check cam engagement: rotate full 180° until detent locks. Before closing main breaker: verify L1-N, L2-N, L3-N (120V US / 230V EU); L1-L2, L2-L3, L3-L1 (208V US / 400V EU); Neutral-to-Ground (<1.0V AC).',
    svg: `<svg width="100" height="80" viewBox="0 0 100 80"><rect x="10" y="25" width="80" height="30" rx="6" fill="#1a1a22" stroke="#E24B4A" stroke-width="2"/><circle class="interactive-svg-pin" data-pin="GND" cx="22" cy="40" r="5" fill="#639922"/><circle class="interactive-svg-pin" data-pin="N" cx="36" cy="40" r="5" fill="#fff" stroke="#ccc"/><circle class="interactive-svg-pin" data-pin="L1" cx="50" cy="40" r="5" fill="#111" stroke="#555"/><circle class="interactive-svg-pin" data-pin="L2" cx="64" cy="40" r="5" fill="#E24B4A"/><circle class="interactive-svg-pin" data-pin="L3" cx="78" cy="40" r="5" fill="#378ADD"/><text x="50" y="70" text-anchor="middle" fill="#888" font-size="7">GND ➔ N ➔ L1 ➔ L2 ➔ L3</text></svg>`
  },
  {
    id: 'nema-l2130',
    aliases: ['l21-30', 'l2130', 'nema-3phase'],
    name: 'NEMA L21-30 Twist-Lock (3-Phase 30A)',
    cat: 'power',
    tag: '3-Phase 120/208V 30A',
    color: '#E24B4A',
    desc: '5-wire twist-lock connector rated at 30A, 120/208V 3-phase (Y-connected). The touring standard for powering audio amplifier racks, LED video wall distros, and lighting dimmer racks in North America. Ground tab makes first contact. A broken neutral tab will send 208V across 120V gear, destroying power supplies!',
    uses: ['Touring audio amplifier rack power', 'LED video wall processor distros', 'Lighting truss sub-distro drops'],
    pins: [
      {n:'G', pin:'G', sig:'Equipment Ground — Curved Hook Tab', name:'Ground (G)', color:'#639922', col:'#639922', note:'Outer curved hook makes first contact', desc:'Ground'},
      {n:'W', pin:'W', sig:'Neutral — Identified Conductor', name:'Neutral (W)', color:'#1a1a22', col:'#1a1a22', note:'White wire (must never be broken)', desc:'Neutral', border:'#555555'},
      {n:'X', pin:'X', sig:'Phase 1 Hot (Black Wire)', name:'Phase 1 (X)', color:'#E24B4A', col:'#E24B4A', note:'120V AC to Neutral', desc:'Phase 1'},
      {n:'Y', pin:'Y', sig:'Phase 2 Hot (Red Wire)', name:'Phase 2 (Y)', color:'#c0392b', col:'#c0392b', note:'120V AC to Neutral', desc:'Phase 2'},
      {n:'Z', pin:'Z', sig:'Phase 3 Hot (Blue Wire)', name:'Phase 3 (Z)', color:'#378ADD', col:'#378ADD', note:'120V AC to Neutral', desc:'Phase 3'}
    ],
    phantomSafety: 'na',
    cableSpec: '10 AWG 5-Conductor SOOW Heavy-Duty Flexible Cable',
    troubleshootTip: 'Measure X-W, Y-W, Z-W (115V–125V AC). Measure X-Y, Y-Z, Z-X (200V–215V AC). Measure W-to-G (<1.5V AC). Ensure ground hook tab is intact and twist-lock collar clicks.',
    svg: `<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#E24B4A" stroke-width="2"/><path class="interactive-svg-pin" data-pin="G" d="M 37 16 A 6 6 0 0 1 43 16 L 43 22 L 37 22 Z" fill="#639922"/><rect class="interactive-svg-pin" data-pin="W" x="38" y="66" width="4" height="8" fill="#fff" stroke="#ccc"/><rect class="interactive-svg-pin" data-pin="X" x="18" y="32" width="8" height="4" fill="#E24B4A"/><rect class="interactive-svg-pin" data-pin="Y" x="54" y="32" width="8" height="4" fill="#c0392b"/><rect class="interactive-svg-pin" data-pin="Z" x="52" y="54" width="8" height="4" fill="#378ADD"/><text x="40" y="84" text-anchor="middle" fill="#888" font-size="7">NEMA L21-30</text></svg>`
  }
];

// Full 25-Pin DB25 Matrix (Tascam AES59-2012 vs Yamaha Standard)
const DB25_MATRIX = {
    tascam: {
        1: { hot: 24, cold: 12, gnd: 25 },
        2: { hot: 10, cold: 23, gnd: 11 },
        3: { hot: 21, cold: 9, gnd: 22 },
        4: { hot: 7, cold: 20, gnd: 8 },
        5: { hot: 18, cold: 6, gnd: 19 },
        6: { hot: 4, cold: 17, gnd: 5 },
        7: { hot: 15, cold: 3, gnd: 16 },
        8: { hot: 1, cold: 14, gnd: 2 },
        unassignedOrChassis: [13]
    },
    yamaha: {
        1: { hot: 1, cold: 14, gnd: 22 },
        2: { hot: 2, cold: 15, gnd: 23 },
        3: { hot: 3, cold: 16, gnd: 24 },
        4: { hot: 4, cold: 17, gnd: 25 },
        5: { hot: 5, cold: 18, gnd: 10 },
        6: { hot: 6, cold: 19, gnd: 12 },
        7: { hot: 7, cold: 20, gnd: 13 },
        8: { hot: 8, cold: 21, gnd: 'chassis' },
        noConnection: [9, 11]
    }
};

// Helper: Provide lookup by alias if direct id match is not found
const originalFind = PINOUT_DATA.find.bind(PINOUT_DATA);
PINOUT_DATA.find = function(predicate, thisArg) {
    let res = originalFind(predicate, thisArg);
    if (res) return res;
    return originalFind(d => {
        try {
            if (predicate(d)) return true;
            if (d.aliases && d.aliases.length) {
                for (const alias of d.aliases) {
                    if (predicate({ ...d, id: alias })) return true;
                }
            }
        } catch (_) {}
        return false;
    }, thisArg);
};

// Global lookup helper
function getPinoutById(id) {
    if (!id) return null;
    const cleanId = String(id).toLowerCase().trim();
    return PINOUT_DATA.find(d => 
        d.id.toLowerCase() === cleanId || 
        (d.aliases && d.aliases.some(a => a.toLowerCase() === cleanId))
    ) || null;
}

// =========================================================================
// INTERACTIVE A-TO-B CUSTOM CABLE & ADAPTER PIN MAPPER ENGINE (R2)
// Real-world practical audio & lighting interconnects only
// =========================================================================
const MAPPER_ENDPOINTS = [
    { id: 'xlr3', label: 'XLR 3-Pin Balanced (Mic / Line)' },
    { id: 'trs', label: '1/4" TRS Balanced (6.35mm Line)' },
    { id: 'ts', label: '1/4" TS Unbalanced (Mono Instrument / Line)' },
    { id: 'trs35', label: '3.5mm TRS Stereo (Laptop / Phone / Tablet)' },
    { id: 'rca', label: 'Dual RCA Stereo (DJ Mixer / Media)' },
    { id: 'xlr5', label: 'XLR 5-Pin DMX (Lighting / Turnaround)' }
];

function normalizeEndpointId(id) {
    const raw = String(id || '').toLowerCase().trim();
    if (['minitrs', '35mm-trs', 'mini-jack', 'trs35'].includes(raw)) return 'trs35';
    if (['xlr-3', 'xlr3m', 'xlr3f', 'xlr3'].includes(raw)) return 'xlr3';
    if (['stereo-jack', 'trs-14', 'trs-balanced', 'trs'].includes(raw)) return 'trs';
    if (['mono-jack', 'ts-14', 'ts-unbalanced', 'ts'].includes(raw)) return 'ts';
    if (['phono', 'cinch', 'rca-stereo', 'rca'].includes(raw)) return 'rca';
    if (['phoenix3', 'phoenix-3pin', 'euroblock', 'euroblock3'].includes(raw)) return 'euroblock3';
    if (['tt', 'bantam', 'tt-patchbay', 'tt-bantam'].includes(raw)) return 'tt-bantam';
    if (['catsnake', 'radial-catapult', 'cat5-snake', 'aes72'].includes(raw)) return 'aes72';
    if (['dsub25', 'tascam-db25', 'yamaha-db25', 'db25'].includes(raw)) return 'db25';
    if (['dmx512', 'dmx-5pin', 'dmx-rdm', 'xlr5'].includes(raw)) return 'xlr5';
    if (['dmx-cat5', 'esta-e127', 'dmx-ethernet', 'dmx-rj45'].includes(raw)) return 'dmx-rj45';
    if (['din5', 'midi-din', 'din-5pin', 'midi'].includes(raw)) return 'midi';
    if (['sdi-bnc', 'bnc-75', 'word-clock', 'bnc'].includes(raw)) return 'bnc';
    if (['smpte-timecode', 'ltc', 'lemo-timecode', 'ltc-timecode'].includes(raw)) return 'ltc-timecode';
    return raw;
}

function getBalancedPinLabels(normId) {
    if (normId === 'trs' || normId === 'tt-bantam') {
        return { hotPin: 'T', hotName: 'Tip (Hot +)', coldPin: 'R', coldName: 'Ring (Cold −)', gndPin: 'S', gndName: 'Sleeve (Shield/GND)' };
    }
    if (normId === 'euroblock3') {
        return { hotPin: '+', hotName: '+ Terminal (Hot)', coldPin: '−', coldName: '− Terminal (Cold)', gndPin: 'S', gndName: 'S Terminal (Shield)' };
    }
    if (normId === 'aes72') {
        return { hotPin: '1 (W-Org)', hotName: 'Ch 1 Hot+ (Pin 1 W-Org)', coldPin: '2 (Org)', coldName: 'Ch 1 Cold− (Pin 2 Org)', gndPin: 'Shell', gndName: 'EtherCON Shell Drain' };
    }
    if (normId === 'db25') {
        return { hotPin: '24', hotName: 'Ch 1 Hot+ (Tascam Pin 24)', coldPin: '12', coldName: 'Ch 1 Cold− (Tascam Pin 12)', gndPin: '25', gndName: 'Ch 1 GND (Tascam Pin 25)' };
    }
    return { hotPin: '2', hotName: 'Pin 2 (Hot +)', coldPin: '3', coldName: 'Pin 3 (Cold −)', gndPin: '1', gndName: 'Pin 1 (Ground/Shield)' };
}

function getUnbalancedPinLabels(normId) {
    if (normId === 'rca') {
        return { hotPin: 'C', hotName: 'Center Pin (Signal +)', gndPin: 'O', gndName: 'Outer Shell (Ground)' };
    }
    if (normId === 'bnc') {
        return { hotPin: 'C', hotName: 'Center Pin (Signal +)', gndPin: 'O', gndName: 'Outer Bayonet (Shield)' };
    }
    return { hotPin: 'T', hotName: 'Tip (Signal +)', gndPin: 'S', gndName: 'Sleeve (Ground)' };
}

function calculateCableMapping(sourceId, destId) {
    if (!sourceId || !destId) return null;
    const sNorm = normalizeEndpointId(sourceId);
    const dNorm = normalizeEndpointId(destId);

    const balancedSet = ['xlr3', 'trs', 'euroblock3', 'tt-bantam', 'aes72', 'db25'];
    const unbalMonoSet = ['ts', 'bnc'];
    const stereoUnbalSet = ['trs35', 'rca'];

    let phantomStatus = 'safe';
    let phantomMessage = 'Balanced differential connection. +48V phantom power is common-mode isolated or supported when using shielded twisted-pair cable.';
    const rules = [];
    let resistorNetwork = null;
    const wiringTable = [];

    // CASE 1: Stereo Unbalanced (3.5mm TRS or Dual RCA) -> Balanced Mono (XLR3 / TRS / Euroblock / DB25 / AES72)
    if (stereoUnbalSet.includes(sNorm) && balancedSet.includes(dNorm)) {
        const dPins = getBalancedPinLabels(dNorm);
        phantomStatus = 'danger';
        phantomMessage = 'CRITICAL HAZARD: DO NOT APPLY +48V PHANTOM POWER! +48V DC will travel backwards through the summing resistors and destroy smartphone/laptop headphone DAC or consumer line output stages.';
        resistorNetwork = 'Dual 470Ω–1kΩ (1/4W 1% metal film) series summing resistors on Left & Right + 10kΩ shunt resistor across Hot and Ground';
        rules.push('Never wye-connect (hardwire) Left and Right outputs directly together without series summing resistors — doing so dead-shorts the two output op-amps into each other (Rane Note 109).');
        rules.push(`Sum Left and Right through individual 470Ω–1kΩ series resistors into destination ${dPins.hotName}, and tie destination Cold (${dPins.coldPin}) to Ground (${dPins.gndPin}).`);
        rules.push('Optional: Add a 10kΩ shunt resistor between destination Hot and Ground to provide a stable load reference and ~20dB pad if feeding a mic-level input.');

        if (sNorm === 'trs35') {
            wiringTable.push({ sourcePin: 'T', sourceName: 'Tip (Left +)', destPin: dPins.hotPin, destName: dPins.hotName, wireColor: '#E24B4A', status: 'resistor', notes: 'Via 470Ω–1kΩ series summing resistor' });
            wiringTable.push({ sourcePin: 'R', sourceName: 'Ring (Right +)', destPin: dPins.hotPin, destName: dPins.hotName, wireColor: '#1D9E75', status: 'resistor', notes: 'Via 470Ω–1kΩ series summing resistor' });
            wiringTable.push({ sourcePin: 'S', sourceName: 'Sleeve (Ground)', destPin: dPins.gndPin, destName: dPins.gndName, wireColor: '#888780', status: 'direct', notes: 'Common shield return (+ 10kΩ shunt to Hot)' });
            wiringTable.push({ sourcePin: 'S', sourceName: 'Sleeve (Ground)', destPin: dPins.coldPin, destName: dPins.coldName, wireColor: '#888780', status: 'tied', notes: `Tie ${dPins.coldPin} to ${dPins.gndPin} at destination` });
        } else {
            wiringTable.push({ sourcePin: 'L-C', sourceName: 'Left RCA Center (+)', destPin: dPins.hotPin, destName: dPins.hotName, wireColor: '#1D9E75', status: 'resistor', notes: 'Via 470Ω–1kΩ series summing resistor' });
            wiringTable.push({ sourcePin: 'R-C', sourceName: 'Right RCA Center (+)', destPin: dPins.hotPin, destName: dPins.hotName, wireColor: '#E24B4A', status: 'resistor', notes: 'Via 470Ω–1kΩ series summing resistor' });
            wiringTable.push({ sourcePin: 'O', sourceName: 'Both RCA Outer Shells', destPin: dPins.gndPin, destName: dPins.gndName, wireColor: '#888780', status: 'direct', notes: 'Common ground return (+ 10kΩ shunt to Hot)' });
            wiringTable.push({ sourcePin: 'O', sourceName: 'Both RCA Outer Shells', destPin: dPins.coldPin, destName: dPins.coldName, wireColor: '#888780', status: 'tied', notes: `Tie ${dPins.coldPin} to ${dPins.gndPin} at destination` });
        }
    }
    // CASE 2: Unbalanced Mono (TS / RCA / BNC) -> Balanced Input (XLR3 / TRS / Euroblock / etc.)
    else if (unbalMonoSet.includes(sNorm) && balancedSet.includes(dNorm)) {
        const sPins = getUnbalancedPinLabels(sNorm);
        const dPins = getBalancedPinLabels(dNorm);
        phantomStatus = 'danger';
        phantomMessage = 'DO NOT APPLY +48V! Destination console +48V phantom power will back-feed 48V DC into the unbalanced source output stage and short Cold to Ground.';
        rules.push('CRITICAL LIVE SOUND FACT: This adapter DOES NOT balance the audio! The connection remains 100% unbalanced with NO common-mode noise rejection (CMRR).');
        rules.push(`Tie destination Cold (Pin ${dPins.coldPin}) to Ground (Pin ${dPins.gndPin}) at the destination connector so the differential receiver references ground instead of floating.`);
        rules.push('For runs longer than 6m (20ft) on stage, use an active or passive DI box instead of a passive adapter cable to reject ground loops and isolate +48V.');
        wiringTable.push({ sourcePin: sPins.hotPin, sourceName: sPins.hotName, destPin: dPins.hotPin, destName: dPins.hotName, wireColor: '#E24B4A', status: 'direct', notes: 'Primary unbalanced signal to non-inverting Hot (+)' });
        wiringTable.push({ sourcePin: sPins.gndPin, sourceName: sPins.gndName, destPin: dPins.gndPin, destName: dPins.gndName, wireColor: '#888780', status: 'direct', notes: 'Cable shield & ground reference' });
        wiringTable.push({ sourcePin: sPins.gndPin, sourceName: sPins.gndName, destPin: dPins.coldPin, destName: dPins.coldName, wireColor: '#888780', status: 'tied', notes: `Bridge ${dPins.coldPin} to ${dPins.gndPin} at destination` });
    }
    // CASE 3: Balanced Output (XLR3 / TRS / Euroblock) -> Unbalanced Input (TS / RCA / 3.5mm)
    else if (balancedSet.includes(sNorm) && (unbalMonoSet.includes(dNorm) || stereoUnbalSet.includes(dNorm))) {
        const sPins = getBalancedPinLabels(sNorm);
        const dPins = getUnbalancedPinLabels(dNorm);
        phantomStatus = 'na';
        phantomMessage = 'Destination unbalanced input cannot source +48V phantom power.';
        rules.push(`Active / electronically balanced output (most modern consoles & interfaces): FLOAT Pin ${sPins.coldPin} (leave unconnected). Tying Cold to ground dead-shorts the negative op-amp driver and causes distortion/overheating.`);
        rules.push(`Transformer-coupled or servo-balanced output: TIE Pin ${sPins.coldPin} to Pin ${sPins.gndPin} (Ground) to complete the transformer secondary winding.`);
        wiringTable.push({ sourcePin: sPins.hotPin, sourceName: sPins.hotName, destPin: dPins.hotPin, destName: dPins.hotName, wireColor: '#E24B4A', status: 'direct', notes: 'Hot (+) feeds unbalanced center/tip input (+6dB loss vs differential)' });
        wiringTable.push({ sourcePin: sPins.gndPin, sourceName: sPins.gndName, destPin: dPins.gndPin, destName: dPins.gndName, wireColor: '#888780', status: 'direct', notes: 'Shield ground reference' });
        wiringTable.push({ sourcePin: sPins.coldPin, sourceName: sPins.coldName, destPin: 'NC', destName: 'Floating / Open (Active Out)', wireColor: '#888780', status: 'floated', notes: 'Leave open for active op-amps; tie to GND only for transformers' });
    }
    // CASE 4: MIDI 5-Pin DIN <-> 3.5mm TRS (MMA Type A vs Type B)
    else if ((sNorm === 'midi' && dNorm === 'trs35') || (sNorm === 'trs35' && dNorm === 'midi')) {
        phantomStatus = 'na';
        phantomMessage = '5mA opto-isolated current loop (31.25 kbaud). Do not connect to audio inputs.';
        rules.push('Official MMA RP-054 Type A Standard (Boss, Korg, Akai, Roland, Make Noise): DIN Pin 5 (Sink/Data) → TRS Tip; DIN Pin 4 (+5V Source) → TRS Ring; DIN Pin 2 (Shield) → TRS Sleeve.');
        rules.push('Legacy Type B (Arturia, Novation Launchpad Mk1/2, 1010music): Swaps Tip and Ring (DIN Pin 4 → Tip, DIN Pin 5 → Ring).');
        rules.push('DIN Pins 1 and 3 must remain unconnected (NC).');
        if (sNorm === 'midi') {
            wiringTable.push({ sourcePin: '5', sourceName: 'Pin 5 (MIDI Data Sink)', destPin: 'T', destName: 'Tip (Type A Data)', wireColor: '#7F77DD', status: 'direct', notes: 'MMA Type A standard (Ring on Type B)' });
            wiringTable.push({ sourcePin: '4', sourceName: 'Pin 4 (+5V Current Source)', destPin: 'R', destName: 'Ring (Type A +5V)', wireColor: '#E24B4A', status: 'direct', notes: 'MMA Type A standard (Tip on Type B)' });
            wiringTable.push({ sourcePin: '2', sourceName: 'Pin 2 (Shield)', destPin: 'S', destName: 'Sleeve (Shield)', wireColor: '#888780', status: 'direct', notes: 'Ground shield (float at MIDI IN receiver)' });
            wiringTable.push({ sourcePin: '1 & 3', sourceName: 'Pins 1 & 3 (Unused)', destPin: 'NC', destName: 'Not Connected', wireColor: '#555555', status: 'floated', notes: 'Unassigned in MIDI 1.0' });
        } else {
            wiringTable.push({ sourcePin: 'T', sourceName: 'Tip (Type A Data)', destPin: '5', destName: 'Pin 5 (MIDI Data Sink)', wireColor: '#7F77DD', status: 'direct', notes: 'MMA Type A standard' });
            wiringTable.push({ sourcePin: 'R', sourceName: 'Ring (Type A +5V)', destPin: '4', destName: 'Pin 4 (+5V Current Source)', wireColor: '#E24B4A', status: 'direct', notes: 'MMA Type A standard' });
            wiringTable.push({ sourcePin: 'S', sourceName: 'Sleeve (Shield)', destPin: '2', destName: 'Pin 2 (Shield)', wireColor: '#888780', status: 'direct', notes: 'Ground shield' });
        }
    }
    // CASE 5: DMX 5-Pin XLR / ESTA RJ45 DMX <-> XLR 3-Pin / XLR 5-Pin
    else if (['xlr5', 'dmx-rj45'].includes(sNorm) || ['xlr5', 'dmx-rj45'].includes(dNorm)) {
        phantomStatus = 'danger';
        phantomMessage = 'DANGER: Never connect DMX512 lines to an audio console XLR input with +48V phantom power enabled — +48V DC immediately destroys RS-485 transceiver chips!';
        rules.push('Use 110Ω–120Ω low-capacitance digital twisted-pair cable (or Cat5e/Cat6 STP per ANSI/ESTA E1.27-2). Never use standard analog mic cable for long DMX runs.');
        rules.push('Install a 120Ω 0.25W terminator resistor between Data+ (Pin 3) and Data− (Pin 2) on the final fixture in the daisy chain.');
        if (sNorm === 'dmx-rj45' || dNorm === 'dmx-rj45') {
            rules.push('ESTA E1.27-2 Cat5 DMX Pinout: Pin 1 (White/Orange) = Data 1+, Pin 2 (Orange) = Data 1−, Pins 7/8 (White/Brown & Brown) = Signal Common. Pins 4 & 5 are left unassigned.');
            wiringTable.push({ sourcePin: sNorm === 'dmx-rj45' ? '1 (W-Org)' : '3', sourceName: 'DMX Data 1 True (+)', destPin: dNorm === 'dmx-rj45' ? '1 (W-Org)' : '3', destName: 'DMX Data 1 True (+)', wireColor: '#E24B4A', status: 'direct', notes: 'Non-inverting RS-485 Data+' });
            wiringTable.push({ sourcePin: sNorm === 'dmx-rj45' ? '2 (Org)' : '2', sourceName: 'DMX Data 1 Comp (−)', destPin: dNorm === 'dmx-rj45' ? '2 (Org)' : '2', destName: 'DMX Data 1 Comp (−)', wireColor: '#378ADD', status: 'direct', notes: 'Inverting RS-485 Data−' });
            wiringTable.push({ sourcePin: sNorm === 'dmx-rj45' ? '7 (W-Brn)' : '1', sourceName: 'DMX Data 1 Common', destPin: dNorm === 'dmx-rj45' ? '7 (W-Brn)' : '1', destName: 'Pin 1 (Common/Shield)', wireColor: '#888780', status: 'direct', notes: 'Signal common reference' });
        } else {
            wiringTable.push({ sourcePin: '1', sourceName: 'Pin 1 (Common/Shield)', destPin: '1', destName: 'Pin 1 (Common/Shield)', wireColor: '#888780', status: 'direct', notes: 'RS-485 common reference' });
            wiringTable.push({ sourcePin: '2', sourceName: 'Pin 2 (Data 1−)', destPin: '2', destName: 'Pin 2 (Data 1−)', wireColor: '#378ADD', status: 'direct', notes: 'Primary DMX Complement (−)' });
            wiringTable.push({ sourcePin: '3', sourceName: 'Pin 3 (Data 1+)', destPin: '3', destName: 'Pin 3 (Data 1+)', wireColor: '#E24B4A', status: 'direct', notes: 'Primary DMX True (+)' });
            wiringTable.push({ sourcePin: '4 & 5', sourceName: 'Pins 4 & 5 (Data 2)', destPin: 'NC', destName: 'Floating / Unconnected', wireColor: '#555555', status: 'floated', notes: 'Isolate and heat-shrink pins 4 & 5 on 3-pin turnaround' });
        }
    }
    // CASE 6: LTC SMPTE Timecode (LEMO 5-Pin <-> XLR3 / BNC)
    else if (sNorm === 'ltc-timecode' || dNorm === 'ltc-timecode') {
        phantomStatus = 'danger';
        phantomMessage = 'DO NOT APPLY +48V! Phantom power on an audio input will destroy camera or lockit box LTC timecode generator outputs.';
        rules.push('Standard 5-Pin LEMO (ARRI / RED / Ambient): Pin 1 = Shield/GND, Pin 2 = LTC Timecode IN, Pin 5 = LTC Timecode OUT.');
        rules.push('When feeding an unbalanced BNC or LEMO timecode input from a balanced XLR output, connect XLR Pin 2 (Hot) to signal and XLR Pin 1 (GND) to shield; leave XLR Pin 3 floating.');
        wiringTable.push({ sourcePin: sNorm === 'ltc-timecode' ? '5 (LTC Out)' : '2 / C', sourceName: 'LTC Timecode Signal (+)', destPin: dNorm === 'ltc-timecode' ? '2 (LTC In)' : '2 / C', destName: 'LTC Timecode In (+)', wireColor: '#EF9F27', status: 'direct', notes: 'SMPTE 12M bi-phase mark timecode signal' });
        wiringTable.push({ sourcePin: '1 / O', sourceName: 'Ground / Shield', destPin: '1 / O', destName: 'Ground / Shield', wireColor: '#888780', status: 'direct', notes: 'Common shield return' });
    }
    // CASE 7: Stereo Unbalanced <-> Stereo Unbalanced (3.5mm TRS <-> Dual RCA)
    else if (stereoUnbalSet.includes(sNorm) && stereoUnbalSet.includes(dNorm)) {
        phantomStatus = 'na';
        phantomMessage = 'Unbalanced consumer stereo line-level interconnect (+48V N/A).';
        rules.push('Connect Left channel to Tip / White RCA center, Right channel to Ring / Red RCA center, and common shield to Sleeve / both RCA outer shells.');
        wiringTable.push({ sourcePin: sNorm === 'trs35' ? 'T' : 'L-C', sourceName: 'Left Signal (+)', destPin: dNorm === 'trs35' ? 'T' : 'L-C', destName: 'Left Signal (+)', wireColor: '#1D9E75', status: 'direct', notes: 'Left audio channel' });
        wiringTable.push({ sourcePin: sNorm === 'trs35' ? 'R' : 'R-C', sourceName: 'Right Signal (+)', destPin: dNorm === 'trs35' ? 'R' : 'R-C', destName: 'Right Signal (+)', wireColor: '#E24B4A', status: 'direct', notes: 'Right audio channel' });
        wiringTable.push({ sourcePin: sNorm === 'trs35' ? 'S' : 'O', sourceName: 'Common Ground', destPin: dNorm === 'trs35' ? 'S' : 'O', destName: 'Common Ground', wireColor: '#888780', status: 'direct', notes: 'Cable shield return' });
    }
    // CASE 8: Balanced <-> Balanced (XLR3, TRS, Euroblock, TT Bantam, AES72, DB25)
    else {
        const sPins = getBalancedPinLabels(sNorm);
        const dPins = getBalancedPinLabels(dNorm);
        if (['trs', 'tt-bantam'].includes(sNorm) || ['trs', 'tt-bantam'].includes(dNorm)) {
            phantomStatus = (sNorm === 'xlr3' && dNorm === 'xlr3') ? 'safe' : 'caution';
            phantomMessage = 'Balanced differential line. CAUTION: Disengage +48V phantom power before hot-patching 1/4" TRS or TT Bantam plugs to avoid momentary Tip-Ring-Sleeve shorting pops.';
        }
        if (sNorm === 'xlr3' && dNorm === 'xlr3') {
            phantomStatus = 'safe';
            phantomMessage = 'Standard 1:1 balanced XLR interconnect. Fully supports +48V phantom power and common-mode noise rejection.';
        }
        rules.push(`Maintain 1:1 differential polarity: Source ${sPins.hotName} → Destination ${dPins.hotName}, and Source ${sPins.coldName} → Destination ${dPins.coldName}.`);
        rules.push('Do NOT tie Pin 1 (Cable Shield) to the metal connector housing lug on microphone lines — chassis bonding belongs to the equipment enclosure (AES48 standard).');
        wiringTable.push({ sourcePin: sPins.hotPin, sourceName: sPins.hotName, destPin: dPins.hotPin, destName: dPins.hotName, wireColor: '#E24B4A', status: 'direct', notes: 'Balanced Hot (+) non-inverting phase' });
        wiringTable.push({ sourcePin: sPins.coldPin, sourceName: sPins.coldName, destPin: dPins.coldPin, destName: dPins.coldName, wireColor: '#378ADD', status: 'direct', notes: 'Balanced Cold (−) inverting phase' });
        wiringTable.push({ sourcePin: sPins.gndPin, sourceName: sPins.gndName, destPin: dPins.gndPin, destName: dPins.gndName, wireColor: '#888780', status: 'direct', notes: 'Cable shield / ground reference' });
    }

    return {
        sourceId,
        destId,
        wiringTable,
        tieFloatRules: rules,
        resistorNetwork,
        phantomSafetyAlert: {
            status: phantomStatus,
            message: phantomMessage
        }
    };
}

let activePinoutCat = 'all';

function renderPinoutCard(conn) {
    const safetyConfig = {
        safe: {
            cls: 'safe',
            icon: 'verified_user',
            label: '+48V PHANTOM: SAFE (BALANCED)',
            bg: 'rgba(29, 158, 117, 0.15)',
            color: '#1D9E75',
            border: 'rgba(29, 158, 117, 0.4)'
        },
        danger: {
            cls: 'danger',
            icon: 'warning',
            label: '+48V PHANTOM: DANGER (DO NOT APPLY)',
            bg: 'rgba(226, 75, 74, 0.15)',
            color: '#E24B4A',
            border: 'rgba(226, 75, 74, 0.4)'
        },
        caution: {
            cls: 'caution',
            icon: 'report_problem',
            label: '+48V PHANTOM: CAUTION (HOT-PATCH HAZARD / DC DROP)',
            bg: 'rgba(239, 159, 39, 0.15)',
            color: '#EF9F27',
            border: 'rgba(239, 159, 39, 0.4)'
        },
        na: {
            cls: 'na',
            icon: 'info',
            label: '+48V PHANTOM: N/A (POWER / DIGITAL / OPTICAL)',
            bg: 'rgba(255, 255, 255, 0.05)',
            color: '#888780',
            border: 'rgba(255, 255, 255, 0.15)'
        }
    };

    const safety = safetyConfig[conn.phantomSafety] || safetyConfig.na;
    const defaultGenderLabel = (conn.svg && conn.svg.toLowerCase().includes('male') && !conn.svg.toLowerCase().includes('female'))
        ? 'MALE [PINS] — FRONT MATING FACE'
        : 'FEMALE [SOCKETS] / MATING FACE (MALE MIRRORS PIN 1↔2)';

    let db25MatrixHtml = '';
    if (conn.id === 'db25') {
        db25MatrixHtml = `
            <div class="db25-matrix-section" style="margin-top: 1rem; border: 1px solid var(--outline); border-radius: 6px; padding: 0.75rem; background: rgba(0,0,0,0.25);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                    <strong style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--primary); display:flex; align-items:center; gap:6px;">
                        <span class="material-symbols-outlined" style="font-size:16px;">grid_view</span>
                        DB25 25-Pin 8-Channel Matrix: Tascam (AES59) vs. Yamaha
                    </strong>
                    <span style="font-size:0.7rem; color:#EF9F27; font-family:var(--font-mono, monospace);">⚠ Tascam Pin 13 = Unassigned/Chassis | Yamaha Pins 9, 11 = NC, Ch 8 GND = Chassis</span>
                </div>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.75rem; font-family:var(--font-mono, monospace);">
                        <thead>
                            <tr style="border-bottom:1px solid var(--outline); color:var(--text-muted); text-align:left;">
                                <th style="padding:4px 8px;">Ch</th>
                                <th style="padding:4px 8px; color:#378ADD;">Tascam Hot (+)</th>
                                <th style="padding:4px 8px; color:#85B7EB;">Tascam Cold (−)</th>
                                <th style="padding:4px 8px; color:#888780;">Tascam GND</th>
                                <th style="padding:4px 8px; color:#E24B4A;">Yamaha Hot (+)</th>
                                <th style="padding:4px 8px; color:#EF9F27;">Yamaha Cold (−)</th>
                                <th style="padding:4px 8px; color:#888780;">Yamaha GND</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:3px 8px;"><strong>1</strong></td><td style="padding:3px 8px;">Pin 24</td><td style="padding:3px 8px;">Pin 12</td><td style="padding:3px 8px;">Pin 25</td><td style="padding:3px 8px;">Pin 1</td><td style="padding:3px 8px;">Pin 14</td><td style="padding:3px 8px;">Pin 22</td></tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:3px 8px;"><strong>2</strong></td><td style="padding:3px 8px;">Pin 10</td><td style="padding:3px 8px;">Pin 23</td><td style="padding:3px 8px;">Pin 11</td><td style="padding:3px 8px;">Pin 2</td><td style="padding:3px 8px;">Pin 15</td><td style="padding:3px 8px;">Pin 23</td></tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:3px 8px;"><strong>3</strong></td><td style="padding:3px 8px;">Pin 21</td><td style="padding:3px 8px;">Pin 9</td><td style="padding:3px 8px;">Pin 22</td><td style="padding:3px 8px;">Pin 3</td><td style="padding:3px 8px;">Pin 16</td><td style="padding:3px 8px;">Pin 24</td></tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:3px 8px;"><strong>4</strong></td><td style="padding:3px 8px;">Pin 7</td><td style="padding:3px 8px;">Pin 20</td><td style="padding:3px 8px;">Pin 8</td><td style="padding:3px 8px;">Pin 4</td><td style="padding:3px 8px;">Pin 17</td><td style="padding:3px 8px;">Pin 25</td></tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:3px 8px;"><strong>5</strong></td><td style="padding:3px 8px;">Pin 18</td><td style="padding:3px 8px;">Pin 6</td><td style="padding:3px 8px;">Pin 19</td><td style="padding:3px 8px;">Pin 5</td><td style="padding:3px 8px;">Pin 18</td><td style="padding:3px 8px;">Pin 10</td></tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:3px 8px;"><strong>6</strong></td><td style="padding:3px 8px;">Pin 4</td><td style="padding:3px 8px;">Pin 17</td><td style="padding:3px 8px;">Pin 5</td><td style="padding:3px 8px;">Pin 6</td><td style="padding:3px 8px;">Pin 19</td><td style="padding:3px 8px;">Pin 12</td></tr>
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:3px 8px;"><strong>7</strong></td><td style="padding:3px 8px;">Pin 15</td><td style="padding:3px 8px;">Pin 3</td><td style="padding:3px 8px;">Pin 16</td><td style="padding:3px 8px;">Pin 7</td><td style="padding:3px 8px;">Pin 20</td><td style="padding:3px 8px;">Pin 13</td></tr>
                            <tr><td style="padding:3px 8px;"><strong>8</strong></td><td style="padding:3px 8px;">Pin 1</td><td style="padding:3px 8px;">Pin 14</td><td style="padding:3px 8px;">Pin 2</td><td style="padding:3px 8px;">Pin 8</td><td style="padding:3px 8px;">Pin 21</td><td style="padding:3px 8px;">Chassis</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    return `
        <div class="acc pinout-acc" data-connector-id="${conn.id}">
            <div class="acc-hdr" onclick="window.togglePinout(this)">
                <div class="conn-dot" style="background:${conn.color};box-shadow: 0 0 8px ${conn.color};"></div>
                <div class="acc-name">${conn.name}</div>
                <div class="acc-tag" style="background:var(--outline);color:var(--primary);border:1px solid var(--outline-light)">${conn.tag}</div>
                <div class="acc-arrow"><span class="material-symbols-outlined">expand_more</span></div>
            </div>
            <div class="acc-body">
                <div class="desc">${conn.desc}</div>

                <!-- Safety & Cable Spec Badges -->
                <div class="safety-badge-row" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.85rem; align-items:center;">
                    <div class="phantom-badge safety-badge phantom-${safety.cls} ${safety.cls}" style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:4px; font-size:0.75rem; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; background:${safety.bg}; color:${safety.color}; border:1px solid ${safety.border};">
                        <span class="material-symbols-outlined" style="font-size:16px;">${safety.icon}</span>
                        ${safety.label}
                    </div>
                    <div class="cable-spec-pill" style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:4px; font-size:0.75rem; font-weight:500; font-family:var(--font-mono, monospace); background:rgba(255,255,255,0.03); color:var(--text-muted); border:1px solid var(--outline);">
                        <span class="material-symbols-outlined" style="font-size:16px; color:var(--primary);">cable</span>
                        ${conn.cableSpec || 'Standard Audio/Power Interconnect'}
                    </div>
                </div>

                <!-- Front Mating View vs. Rear Solder-Cup View & Gender Indicator Bar (R3) -->
                <div class="pinout-perspective-bar" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.5rem; margin-bottom:0.75rem; padding:0.45rem 0.65rem; background:rgba(255,255,255,0.02); border:1px solid var(--outline); border-radius:6px;">
                    <div class="perspective-btn-group" style="display:inline-flex; gap:4px; flex-wrap:wrap;">
                        <button type="button" class="btn-perspective on" data-view="front" onclick="window.togglePinoutPerspective(this)">FRONT MATING VIEW</button>
                        <button type="button" class="btn-perspective" data-view="rear" onclick="window.togglePinoutPerspective(this)">REAR SOLDER-CUP VIEW — MIRRORED</button>
                    </div>
                    <span class="gender-indicator-badge" data-default-label="${defaultGenderLabel}" style="font-family:var(--font-mono, monospace); font-size:0.68rem; color:var(--primary); padding:2px 8px; border-radius:4px; background:rgba(0,210,255,0.08); border:1px solid rgba(0,210,255,0.25);">${defaultGenderLabel}</span>
                </div>

                <div class="pin-layout">
                    <div class="pin-svg pin-svg-wrap">${conn.svg}</div>
                    <div class="pin-table-container">
                        <table class="pin-table">
                            <thead><tr><th>Pin</th><th>Signal</th><th>Note</th></tr></thead>
                            <tbody>${conn.pins.map(p=>`<tr class="table-pin-row" data-pin="${p.n !== undefined ? p.n : p.pin}"><td><div class="dot-cell"><div class="pd" style="background:${p.color || p.col};border:1px solid ${p.border||'rgba(255,255,255,0.1)'}"></div><strong>${p.n !== undefined ? p.n : p.pin}</strong></div></td><td>${p.sig || p.name}</td><td class="pin-note">${p.note || p.desc || ''}</td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                </div>

                ${db25MatrixHtml}

                <!-- Dedicated Field Troubleshooting Section -->
                <div class="troubleshoot-block troubleshooting-spec-panel" style="margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(0, 210, 255, 0.03); border: 1px solid rgba(0, 210, 255, 0.2); border-radius: 6px; margin-bottom: 1rem;">
                    <h5 style="margin: 0 0 0.5rem 0; font-family: var(--font-mono); font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                        <span class="material-symbols-outlined" style="font-size: 16px;">build</span>
                        Field Troubleshooting & Multimeter Test
                    </h5>
                    <div style="font-size: 0.8rem; line-height: 1.45; color: var(--text-main);">
                        ${conn.troubleshootTip || 'Check pin-to-pin continuity (<0.5Ω) and verify isolation (>50MΩ) between adjacent signal lines and shield.'}
                    </div>
                </div>

                <!-- Professional Assembly / Soldering Guide Panel -->
                <div class="soldering-spec-panel" style="margin-top: 0.5rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px dashed var(--outline-light); border-radius: 6px; margin-bottom: 1rem;">
                    <h5 style="margin: 0 0 0.5rem 0; font-family: var(--font-mono); font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">bolt</span>
                        ${conn.cat === 'adapter' ? 'Adapter Signal Routing Map' : 'Professional Assembly Specifications'}
                    </h5>
                    <div style="font-size: 0.78rem; line-height: 1.4; color: var(--text-muted);">
                        ${conn.cat === 'adapter' 
                            ? `<strong>Wiring Guide:</strong> This adapter bridges unbalanced/balanced formats. Pin 2 carries signal hot (+). Ground continuity is bridged to ${conn.id.includes('unbalanced') || conn.id.includes('rca') || conn.id.includes('ts') ? 'XLR Pins 1 + 3 to prevent floating hum' : 'XLR Pin 1'}.` 
                            : `<strong>Solder Specs:</strong> Temp: 345°C - 370°C (650°F-700°F). Use Lead-Free SAC305 or Sn60/Pb40 rosin-core solder.<br>
                               <strong>Stripping Guide:</strong> Jacket: 15mm (0.6") | Conductors/Shield: 3mm (0.12"). Recommend 20-24 AWG wiring.`
                        }
                    </div>
                </div>

                <div class="use-row">${conn.uses.map(u=>`<span class="use-tag">${u}</span>`).join('')}</div>
                ${conn.warn?`<div class="warn-box">⚠ ${conn.warn}</div>`:''}
                ${conn.note?`<div class="note-box">ℹ ${conn.note}</div>`:''}
            </div>
        </div>
    `;
}

function togglePinoutPerspective(btnEl) {
    if (!btnEl) return;
    let card = (btnEl.closest && btnEl.closest('.pinout-acc')) || null;
    if (!card) {
        let curr = btnEl.parentNode;
        while (curr) {
            if (curr.classList && curr.classList.contains('pinout-acc')) {
                card = curr;
                break;
            }
            curr = curr.parentNode;
        }
    }
    if (!card) return;

    const view = btnEl.getAttribute('data-view') || 'front';
    const allBtns = card.querySelectorAll('.btn-perspective');
    allBtns.forEach(b => b.classList.toggle('on', b === btnEl));

    const svgWrap = card.querySelector('.pin-svg-wrap, .pin-svg');
    if (svgWrap) {
        if (view === 'rear') {
            svgWrap.classList.add('perspective-solder');
        } else {
            svgWrap.classList.remove('perspective-solder');
        }
    }

    const genderBadge = card.querySelector('.gender-indicator-badge');
    if (genderBadge) {
        const baseLabel = genderBadge.getAttribute('data-default-label') || 'FEMALE [SOCKETS] / MALE [PINS]';
        if (view === 'rear') {
            genderBadge.textContent = 'REAR SOLDER-CUP VIEW (MIRRORED HORIZONTALLY)';
        } else {
            genderBadge.textContent = baseLabel;
        }
    }
}

function updateCableMapperOutput() {
    if (typeof document === 'undefined') return;
    const srcSel = document.getElementById('mapper-source-select');
    const dstSel = document.getElementById('mapper-dest-select');
    const outEl = document.getElementById('mapper-result-container');
    if (!srcSel || !dstSel || !outEl) return;

    const result = calculateCableMapping(srcSel.value, dstSel.value);
    if (!result) return;

    const alertColors = {
        safe: { bg: 'rgba(29,158,117,0.14)', border: 'rgba(29,158,117,0.45)', color: '#1D9E75', icon: 'verified_user', title: '+48V PHANTOM POWER SAFE' },
        danger: { bg: 'rgba(226,75,74,0.16)', border: 'rgba(226,75,74,0.5)', color: '#E24B4A', icon: 'warning', title: '+48V PHANTOM POWER DANGER' },
        caution: { bg: 'rgba(239,159,39,0.15)', border: 'rgba(239,159,39,0.45)', color: '#EF9F27', icon: 'report_problem', title: '+48V PHANTOM POWER CAUTION' },
        na: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', color: '#999', icon: 'info', title: '+48V PHANTOM POWER N/A' }
    };
    const alertStyle = alertColors[result.phantomSafetyAlert.status] || alertColors.na;

    outEl.innerHTML = `
        <div class="mapper-phantom-alert" style="display:flex; align-items:flex-start; gap:10px; padding:0.75rem 1rem; border-radius:6px; background:${alertStyle.bg}; border:1px solid ${alertStyle.border}; margin-bottom:0.85rem;">
            <span class="material-symbols-outlined" style="color:${alertStyle.color}; font-size:20px; margin-top:1px;">${alertStyle.icon}</span>
            <div>
                <div style="font-family:var(--font-mono, monospace); font-size:0.74rem; font-weight:700; color:${alertStyle.color}; letter-spacing:0.5px;">${alertStyle.title}</div>
                <div style="font-size:0.8rem; color:var(--text-main); line-height:1.4; margin-top:2px;">${result.phantomSafetyAlert.message}</div>
            </div>
        </div>

        <div style="overflow-x:auto; margin-bottom:0.85rem;">
            <table class="pin-table mapper-wiring-table" style="width:100%;">
                <thead>
                    <tr>
                        <th>Source (Connector A)</th>
                        <th>Wire Bridge</th>
                        <th>Destination (Connector B)</th>
                        <th>Field Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.wiringTable.map(w => `
                        <tr>
                            <td><span class="pd" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${w.wireColor}; margin-right:6px;"></span><strong>${w.sourcePin}</strong> — ${w.sourceName}</td>
                            <td style="font-family:var(--font-mono, monospace); font-size:0.72rem; color:${w.status === 'resistor' ? '#EF9F27' : (w.status === 'floated' ? '#888' : 'var(--primary)')};">
                                ${w.status === 'resistor' ? '──[ 470Ω ]──►' : (w.status === 'tied' ? '══[ TIED ]══►' : (w.status === 'floated' ? '──× [OPEN]' : '───────────►'))}
                            </td>
                            <td><strong>${w.destPin}</strong> — ${w.destName}</td>
                            <td class="pin-note">${w.notes || w.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${result.resistorNetwork ? `
            <div style="padding:0.65rem 0.9rem; border-radius:6px; background:rgba(239,159,39,0.08); border:1px dashed rgba(239,159,39,0.4); margin-bottom:0.75rem; font-size:0.78rem; color:var(--text-main);">
                <strong style="color:#EF9F27; font-family:var(--font-mono, monospace); text-transform:uppercase;">Passive Resistor Network:</strong> ${result.resistorNetwork}
            </div>
        ` : ''}

        <div style="padding:0.65rem 0.9rem; border-radius:6px; background:rgba(255,255,255,0.02); border:1px solid var(--outline); font-size:0.78rem; color:var(--text-muted);">
            <strong style="color:var(--primary); font-family:var(--font-mono, monospace); text-transform:uppercase; display:block; margin-bottom:4px;">Tie / Float & Soldering Rules:</strong>
            <ul style="margin:0; padding-left:1.1rem; line-height:1.45;">
                ${result.tieFloatRules.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
    `;
}

function ensureCableMapperPanel() {
    if (typeof document === 'undefined') return;
    const listEl = document.getElementById('pinout-list');
    if (!listEl || !listEl.parentNode) return;
    if (document.getElementById('pinout-mapper-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'pinout-mapper-panel';
    panel.className = 'pinout-mapper-panel';
    panel.style.cssText = 'margin-bottom: 1.25rem; border: 1px solid var(--outline-light); border-radius: 8px; background: var(--surface-light, rgba(255,255,255,0.02)); overflow: hidden;';

    const optionsHtml = MAPPER_ENDPOINTS.map(ep => `<option value="${ep.id}">${ep.label}</option>`).join('');

    panel.innerHTML = `
        <div class="mapper-hdr" id="mapper-hdr-toggle" style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; background:rgba(0,210,255,0.05); cursor:pointer; user-select:none; transition:background 0.2s ease;" onclick="
            const body = document.getElementById('mapper-body-content');
            const icon = document.getElementById('mapper-toggle-chevron');
            if (body) {
                const isHidden = body.style.display === 'none';
                body.style.display = isHidden ? 'block' : 'none';
                if (icon) icon.textContent = isHidden ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
            }
        ">
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="material-symbols-outlined" style="color:var(--primary); font-size:20px;">cable</span>
                <div>
                    <strong style="font-family:var(--font-mono, monospace); font-size:0.82rem; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-main); display:block;">Custom Cable & Adapter Pin Mapper</strong>
                    <span style="font-size:0.68rem; color:var(--text-muted); display:block; margin-top:2px;">Tap to calculate pin-to-pin wiring between XLR, TRS, TS, 3.5mm & RCA</span>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-family:var(--font-mono, monospace); font-size:0.62rem; color:var(--primary); background:rgba(0,210,255,0.1); border:1px solid rgba(0,210,255,0.25); border-radius:4px; padding:2px 6px;">ADAPTER TOOL</span>
                <span class="material-symbols-outlined" id="mapper-toggle-chevron" style="color:var(--text-muted); font-size:22px; transition:transform 0.2s;">keyboard_arrow_down</span>
            </div>
        </div>
        <div class="mapper-body" id="mapper-body-content" style="display:none; padding:1rem; border-top:1px solid var(--outline);">
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:flex-end; margin-bottom:1rem;">
                <div style="flex:1; min-width:200px;">
                    <label for="mapper-source-select" style="display:block; font-family:var(--font-mono, monospace); font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Connector A (Source / Output)</label>
                    <select id="mapper-source-select" onchange="window.updateCableMapperOutput()" style="width:100%; padding:0.5rem 0.65rem; border-radius:6px; background:var(--bg-dark, #0d0f14); color:var(--text-main, #fff); border:1px solid var(--outline-light); font-size:0.82rem;">
                        ${optionsHtml}
                    </select>
                </div>
                <button type="button" onclick="window.swapCableMapperEndpoints()" title="Swap Source & Destination" style="padding:0.5rem 0.85rem; border-radius:6px; background:rgba(0,210,255,0.1); color:var(--primary); border:1px solid rgba(0,210,255,0.3); cursor:pointer; font-family:var(--font-mono, monospace); font-size:0.75rem; display:inline-flex; align-items:center; gap:4px; height:36px;">
                    <span class="material-symbols-outlined" style="font-size:16px;">swap_horiz</span> Swap A ⇄ B
                </button>
                <div style="flex:1; min-width:200px;">
                    <label for="mapper-dest-select" style="display:block; font-family:var(--font-mono, monospace); font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Connector B (Destination / Input)</label>
                    <select id="mapper-dest-select" onchange="window.updateCableMapperOutput()" style="width:100%; padding:0.5rem 0.65rem; border-radius:6px; background:var(--bg-dark, #0d0f14); color:var(--text-main, #fff); border:1px solid var(--outline-light); font-size:0.82rem;">
                        ${optionsHtml}
                    </select>
                </div>
            </div>
            <div id="mapper-result-container"></div>
        </div>
    `;

    // Insert before #pinout-list if parent supports insertBefore, else append
    if (typeof listEl.parentNode.insertBefore === 'function') {
        listEl.parentNode.insertBefore(panel, listEl);
    } else if (typeof listEl.parentNode.appendChild === 'function') {
        listEl.parentNode.appendChild(panel);
    }

    const srcSel = document.getElementById('mapper-source-select');
    const dstSel = document.getElementById('mapper-dest-select');
    if (srcSel) srcSel.value = 'trs35';
    if (dstSel) dstSel.value = 'xlr3';
    updateCableMapperOutput();
}

function swapCableMapperEndpoints() {
    if (typeof document === 'undefined') return;
    const srcSel = document.getElementById('mapper-source-select');
    const dstSel = document.getElementById('mapper-dest-select');
    if (!srcSel || !dstSel) return;
    const tmp = srcSel.value;
    srcSel.value = dstSel.value;
    dstSel.value = tmp;
    updateCableMapperOutput();
}

function attachPinoutInteractions(accEl, pins) {
    if (!accEl) return;
    const svg = accEl.querySelector('svg');
    if (!svg) return;

    const matchedShapes = [];

    // Check for pre-tagged interactive elements
    const preTagged = Array.from(svg.querySelectorAll('.interactive-svg-pin[data-pin]'));
    if (preTagged.length > 0) {
        pins.forEach(pin => {
            const pinName = String(pin.n !== undefined ? pin.n : pin.pin);
            const elements = preTagged.filter(el => {
                const dp = el.getAttribute('data-pin');
                return dp === pinName || (dp && dp.toLowerCase() === pinName.toLowerCase());
            });
            if (elements.length > 0) {
                elements.forEach(el => {
                    el.style.cursor = 'pointer';
                });
                matchedShapes.push({ pinName: pinName, elements: elements });
            }
        });
    }

    // Dynamic heuristic matching for any untagged shapes
    const texts = Array.from(svg.querySelectorAll('text:not(.interactive-svg-pin)'));
    const circles = Array.from(svg.querySelectorAll('circle:not(.interactive-svg-pin)'));
    const rects = Array.from(svg.querySelectorAll('rect:not(.interactive-svg-pin)'));

    texts.forEach(text => {
        const val = text.textContent.trim();
        const cleanVal = val.toLowerCase();
        
        const pin = pins.find(p => {
            const cleanN = String(p.n !== undefined ? p.n : p.pin).toLowerCase();
            return cleanN === cleanVal || 
                   (cleanVal === 't' && cleanN.includes('tip')) ||
                   (cleanVal === 'r' && cleanN.includes('ring')) ||
                   (cleanVal === 's' && cleanN.includes('sleeve')) ||
                   (cleanVal === 'c' && cleanN.includes('center')) ||
                   (cleanVal === 'o' && cleanN.includes('outer'));
        });
        
        if (!pin) return;
        const pinName = String(pin.n !== undefined ? pin.n : pin.pin);

        const tx = parseFloat(text.getAttribute('x') || 0);
        const ty = parseFloat(text.getAttribute('y') || 0);

        let closestCircle = null;
        let minCircleDist = Infinity;
        circles.forEach(c => {
            const cx = parseFloat(c.getAttribute('cx') || 0);
            const cy = parseFloat(c.getAttribute('cy') || 0);
            const dist = Math.hypot(cx - tx, cy - ty);
            if (dist < minCircleDist) {
                minCircleDist = dist;
                closestCircle = c;
            }
        });

        let closestRect = null;
        let minRectDist = Infinity;
        rects.forEach(r => {
            const rx = parseFloat(r.getAttribute('x') || 0);
            const ry = parseFloat(r.getAttribute('y') || 0);
            const rw = parseFloat(r.getAttribute('width') || 0);
            const rh = parseFloat(r.getAttribute('height') || 0);
            const cx = rx + rw / 2;
            const cy = ry + rh / 2;
            const dist = Math.hypot(cx - tx, cy - ty);
            if (dist < minRectDist) {
                minRectDist = dist;
                closestRect = r;
            }
        });

        const shape = (minCircleDist < minRectDist) ? closestCircle : closestRect;
        
        if (shape) {
            const r = parseFloat(shape.getAttribute('r') || 0);
            const w = parseFloat(shape.getAttribute('width') || 0);
            if (r > 22 || w > 45) return;
            
            shape.setAttribute('data-pin', pinName);
            text.setAttribute('data-pin', pinName);
            shape.classList.add('interactive-svg-pin');
            text.classList.add('interactive-svg-pin');
            shape.style.cursor = 'pointer';
            text.style.cursor = 'pointer';
            
            matchedShapes.push({ pinName: pinName, elements: [shape, text] });
        }
    });

    // Helper to toggle highlight
    const setHighlight = (pinName, active) => {
        const matchingRows = Array.from(accEl.querySelectorAll('.table-pin-row')).filter(
            r => r.getAttribute('data-pin') === String(pinName) || (r.getAttribute('data-pin') || '').toLowerCase() === String(pinName).toLowerCase()
        );
        matchingRows.forEach(row => {
            if (active) row.classList.add('highlight-row');
            else row.classList.remove('highlight-row');
        });

        matchedShapes.forEach(m => {
            if (m.pinName === pinName || m.pinName.toLowerCase() === String(pinName).toLowerCase()) {
                m.elements.forEach(el => {
                    if (active) el.classList.add('highlight-pin');
                    else el.classList.remove('highlight-pin');
                });
            }
        });
    };

    // Attach listeners for desktop hover and mobile click/touch
    const tableRows = accEl.querySelectorAll('.table-pin-row');
    tableRows.forEach(row => {
        const pinName = row.getAttribute('data-pin');
        
        row.addEventListener('mouseenter', () => setHighlight(pinName, true));
        row.addEventListener('mouseleave', () => setHighlight(pinName, false));
        
        // Touch/Click support for tablet & mobile
        row.addEventListener('click', (e) => {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            const isHighlighted = row.classList.contains('highlight-row');
            tableRows.forEach(r => r.classList.remove('highlight-row'));
            matchedShapes.forEach(m => m.elements.forEach(el => el.classList.remove('highlight-pin')));
            if (!isHighlighted) {
                setHighlight(pinName, true);
            }
        });
    });

    matchedShapes.forEach(m => {
        m.elements.forEach(el => {
            el.addEventListener('mouseenter', () => setHighlight(m.pinName, true));
            el.addEventListener('mouseleave', () => setHighlight(m.pinName, false));
            
            // Touch/Click support
            el.addEventListener('click', (e) => {
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                const isHighlighted = el.classList.contains('highlight-pin');
                tableRows.forEach(r => r.classList.remove('highlight-row'));
                matchedShapes.forEach(other => other.elements.forEach(e2 => e2.classList.remove('highlight-pin')));
                if (!isHighlighted) {
                    setHighlight(m.pinName, true);
                }
            });
        });
    });
}

if (typeof window !== 'undefined') {
    window.PINOUT_CATS = PINOUT_CATS;
    window.PINOUT_DATA = PINOUT_DATA;
    window.DB25_MATRIX = DB25_MATRIX;
    window.getPinoutById = getPinoutById;
    window.renderPinoutCard = renderPinoutCard;
    window.togglePinoutPerspective = togglePinoutPerspective;
    window.calculateCableMapping = calculateCableMapping;
    window.updateCableMapperOutput = updateCableMapperOutput;
    window.swapCableMapperEndpoints = swapCableMapperEndpoints;
    window.attachPinoutInteractions = attachPinoutInteractions;

    window.initPinout = function() {
        const listEl = document.getElementById('pinout-list');
        const srchEl = document.getElementById('pinout-srch');
        const catContainer = document.getElementById('pinout-cats');
        if(!listEl || !srchEl || !catContainer) return;

        catContainer.innerHTML = '';
        PINOUT_CATS.forEach(c => {
            const btn = document.createElement('button');
            btn.className = `cat-btn ${c.id === 'all' ? 'on' : ''}`;
            btn.textContent = c.label;
            btn.onclick = () => window.setPinoutCat(c.id, btn);
            catContainer.appendChild(btn);
        });

        ensureCableMapperPanel();
        srchEl.addEventListener('input', window.renderPinouts);
        window.renderPinouts();
    };

    window.setPinoutCat = function(catId, btnEl) {
        activePinoutCat = catId;
        window.activePinoutCat = catId;
        document.querySelectorAll('#pinout-cats .cat-btn').forEach(b => b.classList.remove('on'));
        if (btnEl && btnEl.classList) btnEl.classList.add('on');
        window.renderPinouts();
    };

    window.renderPinouts = function() {
        const listEl = document.getElementById('pinout-list');
        const badgeEl = document.getElementById('pinout-count-badge');
        const srchInput = document.getElementById('pinout-srch');
        if(!listEl) return;

        const curCat = window.activePinoutCat || activePinoutCat || 'all';
        const q = (srchInput && srchInput.value ? srchInput.value : '').trim().toLowerCase();
        listEl.innerHTML = '';
        let total = 0;

        PINOUT_CATS.filter(c => c.id !== 'all').forEach(cat => {
            if (curCat !== 'all' && curCat !== cat.id) return;
            
            const items = PINOUT_DATA.filter(d => d.cat === cat.id && 
                (d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))
            );
            
            if (!items.length) return;
            total += items.length;
            
            const hdr = document.createElement('div');
            hdr.className = 'section-hdr pinout-section-hdr';
            hdr.textContent = cat.label.toUpperCase();
            listEl.appendChild(hdr);
            
            items.forEach(conn => {
                const cardHtml = renderPinoutCard(conn);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHtml.trim();
                const acc = tempDiv.firstElementChild;
                listEl.appendChild(acc);
                
                attachPinoutInteractions(acc, conn.pins);
            });
        });
        
        if(badgeEl) badgeEl.textContent = total + ' CONNECTORS';
    };

    window.togglePinout = function(hdrEl) {
        const body = hdrEl.nextElementSibling;
        const arrow = hdrEl.querySelector('.acc-arrow');
        const open = body.classList.contains('open');
        body.classList.toggle('open', !open);
        if (arrow) arrow.classList.toggle('open', !open);
    };
}

// Export for CommonJS testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PINOUT_CATS,
        PINOUT_DATA,
        DB25_MATRIX,
        renderPinoutCard,
        getPinoutById,
        togglePinoutPerspective,
        calculateCableMapping,
        attachPinoutInteractions
    };
}