// --- PINOUT COMPONENT LOGIC ---

const PINOUT_DATA = [
  {id:'xlr3',name:'XLR 3-pin',cat:'analog',tag:'Balanced mic/line',color:'#378ADD',desc:'The industry standard balanced audio connector. Used for microphones, line-level balanced signals, and DMX lighting (not recommended for DMX — use XLR 5-pin instead). Pin 2 is "hot" per IEC standard.',
   pins:[{n:'1',sig:'Ground / shield',color:'#888780',note:'Cable screen / chassis ground'},
         {n:'2',sig:'Hot (+)',color:'#E24B4A',note:'Positive / non-inverting signal'},
         {n:'3',sig:'Cold (−)',color:'#ffffff',note:'Negative / inverting signal',border:'#cccccc'}],
   uses:['Microphone','Line level','Balanced send','AES/EBU digital'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#444" stroke-width="1.5"/><circle cx="40" cy="25" r="8" fill="#888780" stroke="#666" stroke-width="1"/><text x="40" y="29" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">1</text><circle cx="22" cy="56" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="60" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">2</text><circle cx="58" cy="56" r="8" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="58" y="60" text-anchor="middle" fill="#333" font-size="10" font-weight="500">3</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {id:'xlr5',name:'XLR 5-pin',cat:'digital',tag:'DMX / AES stereo',color:'#7F77DD',desc:'5-pin XLR is the professional standard for DMX512 lighting control. Also used for stereo AES/EBU digital audio (two channels in one connector) and some stereo microphone/intercom systems.',
   pins:[{n:'1',sig:'Ground / shield',color:'#888780',note:'Common ground'},
         {n:'2',sig:'Data − (DMX) / AES Ch1 −',color:'#E24B4A',note:'DMX negative data line'},
         {n:'3',sig:'Data + (DMX) / AES Ch1 +',color:'#ffffff',note:'DMX positive data line',border:'#cccccc'},
         {n:'4',sig:'Data − Ch2 (AES)',color:'#1D9E75',note:'Second data channel −'},
         {n:'5',sig:'Data + Ch2 (AES)',color:'#378ADD',note:'Second data channel +'}],
   uses:['DMX512 lighting','AES/EBU stereo','Intercom','Stereo mic'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="34" fill="#1a1a22" stroke="#534AB7" stroke-width="1.5"/><circle cx="40" cy="17" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="40" y="21" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">1</text><circle cx="20" cy="34" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="20" y="38" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">2</text><circle cx="60" cy="34" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="60" y="38" text-anchor="middle" fill="#333" font-size="9" font-weight="500">3</text><circle cx="26" cy="60" r="7" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="26" y="64" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">4</text><circle cx="54" cy="60" r="7" fill="#378ADD" stroke="#185FA5" stroke-width="1"/><text x="54" y="64" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">5</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Female (front)</text></svg>`
  },
  {id:'ts',name:'TS — 6.35mm mono jack',cat:'analog',tag:'Unbalanced mono',color:'#EF9F27',desc:'Two-conductor connector: Tip = signal, Sleeve = ground. Used for unbalanced mono signals such as guitars, bass, and mono line connections. The sleeve also acts as the cable screen.',
   pins:[{n:'T',sig:'Tip — signal (+)',color:'#EF9F27',note:'Mono audio signal'},
         {n:'S',sig:'Sleeve — ground',color:'#888780',note:'Ground and cable screen'}],
   uses:['Guitar/bass instrument','Mono unbalanced line','Effects loops','Amp send'],
   warn:'Unbalanced — susceptible to noise over long cable runs. Max recommended run: ~6m.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="10" y="38" width="60" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="10" y="38" width="20" height="14" rx="7" fill="#EF9F27" stroke="#BA7517" stroke-width="1"/><text x="20" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">T</text><text x="55" y="48" text-anchor="middle" fill="#fff" font-size="10" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {id:'trs',name:'TRS — 6.35mm stereo/balanced',cat:'analog',tag:'Balanced / stereo',color:'#1D9E75',desc:'Three-conductor: Tip = left/hot, Ring = right/cold, Sleeve = ground. Used for balanced mono signals in professional gear, stereo headphones, and insert loops (send/return on one cable).',
   pins:[{n:'T',sig:'Tip — Left / Hot (+)',color:'#E24B4A',note:'Left channel or positive signal'},
         {n:'R',sig:'Ring — Right / Cold (−)',color:'#1D9E75',note:'Right channel or negative signal'},
         {n:'S',sig:'Sleeve — Ground',color:'#888780',note:'Ground and cable screen'}],
   uses:['Balanced insert','Stereo headphone','Balanced line','Y-cable source'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="38" width="64" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="8" y="38" width="18" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect x="29" y="38" width="16" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="17" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="37" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text x="58" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">Side view</text></svg>`
  },
  {id:'trs35',name:'3.5mm TRS (mini jack)',cat:'analog',tag:'Consumer stereo',color:'#D4537E',desc:'Miniature version of TRS used in consumer devices — phones, laptops, tablets. Same Tip/Ring/Sleeve layout. TRRS (4-conductor) variants add a microphone pin and are found on smartphones.',
   pins:[{n:'T',sig:'Tip — Left channel',color:'#E24B4A',note:'Left audio'},
         {n:'R',sig:'Ring — Right channel',color:'#1D9E75',note:'Right audio'},
         {n:'S',sig:'Sleeve — Ground',color:'#888780',note:'Common ground'},
         {n:'R2',sig:'(TRRS) Mic / ground',color:'#7F77DD',note:'4th conductor on phone headsets'}],
   uses:['Phone/tablet output','Laptop audio','Consumer playback','TRRS headsets'],
   note:'TRRS pinout varies: CTIA (Apple/Android) vs OMTP (older Nokia). Always verify before wiring.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="38" width="52" height="14" rx="7" fill="#888780" stroke="#666" stroke-width="1"/><rect x="14" y="38" width="15" height="14" rx="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><rect x="32" y="38" width="12" height="14" fill="#1D9E75" stroke="#0F6E56" stroke-width="1"/><text x="21" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="38" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">R</text><text x="57" y="48" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">S</text><text x="40" y="68" text-anchor="middle" fill="#888" font-size="9">3.5mm</text></svg>`
  },
  {id:'rca',name:'RCA (phono) connector',cat:'analog',tag:'Consumer unbalanced',color:'#D85A30',desc:'Unbalanced single-channel connector standard in consumer hi-fi, DJ gear, and home audio. Center pin = signal, outer ring = ground. Always wired in stereo pairs — red (right) and white/black (left).',
   pins:[{n:'C',sig:'Centre pin — signal',color:'#E24B4A',note:'Audio signal'},
         {n:'O',sig:'Outer ring — ground',color:'#888780',note:'Ground / screen'}],
   uses:['DJ mixer phono/line','Consumer hi-fi','CD/media player','Turntable output'],
   warn:'Unbalanced — not suitable for long runs without a DI box. Max recommended: 3–5m.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="28" fill="#1a1a22" stroke="#888" stroke-width="8"/><circle cx="40" cy="45" r="10" fill="#E24B4A" stroke="#c0392b" stroke-width="1.5"/><text x="40" y="49" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">C</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl2',name:'Speakon NL2',cat:'speaker',tag:'2-pole speaker',color:'#639922',desc:'2-pole Neutrik Speakon. One speaker channel. The locking twist connector is the safe standard for amplifier-to-speaker runs. Used on smaller PA speakers and some monitors.',
   pins:[{n:'1+',sig:'Positive (+)',color:'#E24B4A',note:'Hot — from amp positive'},
         {n:'1−',sig:'Negative (−)',color:'#1a1a22',note:'Return — from amp negative',border:'#555'}],
   uses:['Passive speakers','Stage monitors','Small PA systems'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="28" y="35" width="12" height="18" rx="2" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="34" y="47" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1+</text><rect x="42" y="35" width="12" height="18" rx="2" fill="#333" stroke="#555" stroke-width="1"/><text x="48" y="47" text-anchor="middle" fill="#aaa" font-size="8" font-weight="500">1−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl4',name:'Speakon NL4',cat:'speaker',tag:'4-pole speaker',color:'#639922',desc:'4-pole Neutrik Speakon. Carries two speaker channels (bi-amp) or one channel on 1+/1− with 2+/2− unused. Standard in most professional loudspeaker systems. Never use with live mains voltage.',
   pins:[{n:'1+',sig:'Ch 1 positive',color:'#E24B4A',note:'Low frequency / full range +'},
         {n:'1−',sig:'Ch 1 negative',color:'#1a1a22',note:'Low frequency / full range −',border:'#555'},
         {n:'2+',sig:'Ch 2 positive',color:'#378ADD',note:'High frequency (bi-amp) +'},
         {n:'2−',sig:'Ch 2 negative',color:'#0C447C',note:'High frequency (bi-amp) −'}],
   uses:['Full-range passive speakers','Bi-amp systems','Sub + top runs'],
   note:'For single-amp use: wire 1+/1− only. Leave 2+/2− disconnected or loop through.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="24" y="28" width="12" height="15" rx="2" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="30" y="39" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">1+</text><rect x="44" y="28" width="12" height="15" rx="2" fill="#333" stroke="#555" stroke-width="1"/><text x="50" y="39" text-anchor="middle" fill="#aaa" font-size="7" font-weight="500">1−</text><rect x="24" y="48" width="12" height="15" rx="2" fill="#378ADD" stroke="#185FA5" stroke-width="1"/><text x="30" y="59" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">2+</text><rect x="44" y="48" width="12" height="15" rx="2" fill="#0C447C" stroke="#042C53" stroke-width="1"/><text x="50" y="59" text-anchor="middle" fill="#fff" font-size="7" font-weight="500">2−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'nl8',name:'Speakon NL8',cat:'speaker',tag:'8-pole speaker',color:'#639922',desc:'8-pole Neutrik Speakon. Carries up to four independent speaker channels, used for tri-amp or quad systems, or running multiple speakers through one cable from an amp rack. Fully backward compatible with NL4.',
   pins:[{n:'1+/1−',sig:'Ch 1 — LF or full range',color:'#E24B4A',note:'Low frequency channel'},
         {n:'2+/2−',sig:'Ch 2 — MF or HF',color:'#378ADD',note:'Mid or high frequency'},
         {n:'3+/3−',sig:'Ch 3 — subwoofer or aux',color:'#1D9E75',note:'Third amplifier channel'},
         {n:'4+/4−',sig:'Ch 4 — aux / spare',color:'#7F77DD',note:'Fourth channel or loop through'}],
   uses:['Tri-amp systems','Multi-way loudspeakers','Amp rack multicore'],
   note:'NL8 sockets also accept NL4 and NL2 plugs — only the matching pins connect.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="45" r="32" fill="#1a1a22" stroke="#639922" stroke-width="2"/><rect x="16" y="26" width="10" height="12" rx="1" fill="#E24B4A"/><text x="21" y="36" text-anchor="middle" fill="#fff" font-size="7">1+</text><rect x="28" y="26" width="10" height="12" rx="1" fill="#c0392b"/><text x="33" y="36" text-anchor="middle" fill="#fff" font-size="7">1−</text><rect x="42" y="26" width="10" height="12" rx="1" fill="#378ADD"/><text x="47" y="36" text-anchor="middle" fill="#fff" font-size="7">2+</text><rect x="54" y="26" width="10" height="12" rx="1" fill="#185FA5"/><text x="59" y="36" text-anchor="middle" fill="#fff" font-size="7">2−</text><rect x="16" y="52" width="10" height="12" rx="1" fill="#1D9E75"/><text x="21" y="62" text-anchor="middle" fill="#fff" font-size="7">3+</text><rect x="28" y="52" width="10" height="12" rx="1" fill="#0F6E56"/><text x="33" y="62" text-anchor="middle" fill="#fff" font-size="7">3−</text><rect x="42" y="52" width="10" height="12" rx="1" fill="#7F77DD"/><text x="47" y="62" text-anchor="middle" fill="#fff" font-size="7">4+</text><rect x="54" y="52" width="10" height="12" rx="1" fill="#534AB7"/><text x="59" y="62" text-anchor="middle" fill="#fff" font-size="7">4−</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">Front face</text></svg>`
  },
  {id:'ts-xlr',name:'TS to XLR — unbalanced',cat:'adapter',tag:'Instrument → console',color:'#D85A30',desc:'Connects an unbalanced TS source (guitar, synth, playback device) to an XLR balanced input. Pin 2 carries the signal and pin 3 is tied to pin 1 (ground) to prevent hum. The signal remains unbalanced — no noise rejection gain.',
   pins:[{n:'TS Tip',sig:'→ XLR Pin 2 (hot)',color:'#E24B4A',note:'Signal wire'},
         {n:'TS Sleeve',sig:'→ XLR Pin 1 + Pin 3',color:'#888780',note:'Ground bridged to both pins 1 and 3'}],
   uses:['Guitar DI (no box)','Synth unbalanced out','Media player to console'],
   warn:'Tie pin 3 to pin 1 at the XLR end to avoid hum. Never leave pin 3 floating.',
   svg:`<svg width="160" height="60" viewBox="0 0 160 60"><rect x="4" y="22" width="30" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="4" y="22" width="12" height="14" rx="7" fill="#EF9F27" stroke="#BA7517"/><text x="10" y="32" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">T</text><text x="25" y="32" text-anchor="middle" fill="#fff" font-size="9">S</text><line x1="35" y1="29" x2="60" y2="29" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="35" y1="29" x2="60" y2="46" stroke="#888780" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="80" cy="20" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="80" y="24" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1</text><circle cx="65" cy="44" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="65" y="48" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">2</text><circle cx="95" cy="44" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="95" y="48" text-anchor="middle" fill="#333" font-size="8" font-weight="500">3</text><line x1="60" y1="29" x2="72" y2="21" stroke="#888780" stroke-width="1.5"/><line x1="60" y1="46" x2="57" y2="44" stroke="#E24B4A" stroke-width="1.5"/><line x1="80" y1="27" x2="95" y2="37" stroke="#888780" stroke-width="1" stroke-dasharray="2 2"/><text x="80" y="58" text-anchor="middle" fill="#888" font-size="8">pin 3 tied to pin 1</text></svg>`
  },
  {id:'trs-xlr-bal',name:'TRS to XLR — balanced',cat:'adapter',tag:'Balanced send',color:'#1D9E75',desc:'Fully balanced connection. TRS Tip → XLR Pin 2 (hot), TRS Ring → XLR Pin 3 (cold), TRS Sleeve → XLR Pin 1 (ground). Used to connect balanced TRS outputs (interfaces, consoles) to balanced XLR inputs. Full common-mode noise rejection.',
   pins:[{n:'TRS Tip',sig:'→ XLR Pin 2 (hot +)',color:'#E24B4A',note:'Hot / positive signal'},
         {n:'TRS Ring',sig:'→ XLR Pin 3 (cold −)',color:'#1D9E75',note:'Cold / negative signal'},
         {n:'TRS Sleeve',sig:'→ XLR Pin 1 (ground)',color:'#888780',note:'Shield / ground'}],
   uses:['Interface balanced out','Console insert send','Keyboard/synth balanced','DI box through'],
   note:'This is a true balanced connection — both hot and cold are carried. Best noise rejection of all adapter types.',
   svg:`<svg width="160" height="60" viewBox="0 0 160 60"><rect x="2" y="20" width="42" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="2" y="20" width="13" height="14" rx="7" fill="#E24B4A" stroke="#c0392b"/><rect x="18" y="20" width="11" height="14" fill="#1D9E75" stroke="#0F6E56"/><text x="8" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">T</text><text x="24" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">R</text><text x="36" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">S</text><line x1="44" y1="23" x2="70" y2="44" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="44" y1="27" x2="98" y2="44" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="44" y1="30" x2="84" y2="20" stroke="#888780" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="84" cy="16" r="7" fill="#888780" stroke="#666" stroke-width="1"/><text x="84" y="20" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">1</text><circle cx="70" cy="40" r="7" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="70" y="44" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">2</text><circle cx="98" cy="40" r="7" fill="#eee" stroke="#ccc" stroke-width="1"/><text x="98" y="44" text-anchor="middle" fill="#333" font-size="8" font-weight="500">3</text></svg>`
  },
  {id:'trs-xlr-insert',name:'TRS to dual XLR — Y insert cable',cat:'adapter',tag:'Console insert loop',color:'#7F77DD',desc:'Y cable with one TRS plug splitting to two XLR connectors — one male (send, from console to outboard) and one female (return, from outboard back to console). TRS Tip = send, TRS Ring = return, Sleeve = ground on both sides.',
   pins:[{n:'TRS Tip',sig:'→ XLR Male Pin 2 (send)',color:'#E24B4A',note:'Console send to outboard input'},
         {n:'TRS Ring',sig:'→ XLR Female Pin 2 (return)',color:'#1D9E75',note:'Outboard output back to console'},
         {n:'TRS Sleeve',sig:'→ XLR Pin 1 both sides',color:'#888780',note:'Ground both connectors'}],
   uses:['Console channel insert','Compressor loop','EQ in-line','Effects processor loop'],
   warn:'Tip = SEND (to outboard IN), Ring = RETURN (from outboard OUT). Swapping these kills the loop.',
   svg:`<svg width="160" height="70" viewBox="0 0 160 70"><rect x="2" y="26" width="40" height="14" rx="7" fill="#888780" stroke="#666"/><rect x="2" y="26" width="13" height="14" rx="7" fill="#E24B4A" stroke="#c0392b"/><rect x="18" y="26" width="10" height="14" fill="#1D9E75" stroke="#0F6E56"/><text x="9" y="36" text-anchor="middle" fill="#fff" font-size="8">T</text><text x="23" y="36" text-anchor="middle" fill="#fff" font-size="8">R</text><text x="36" y="36" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="42" y1="30" x2="80" y2="16" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="42" y1="34" x2="80" y2="54" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="94" cy="12" r="7" fill="#0C0C0F" stroke="#E24B4A" stroke-width="1.5"/><text x="94" y="16" text-anchor="middle" fill="#E24B4A" font-size="7" font-weight="500">M</text><text x="94" y="26" text-anchor="middle" fill="#888" font-size="7">Send</text><circle cx="94" cy="52" r="7" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="94" y="56" text-anchor="middle" fill="#1D9E75" font-size="7" font-weight="500">F</text><text x="94" y="66" text-anchor="middle" fill="#888" font-size="7">Return</text></svg>`
  },
  {id:'35-xlr',name:'3.5mm TRS to XLR stereo',cat:'adapter',tag:'Phone/laptop → system',color:'#D4537E',desc:'Converts stereo 3.5mm consumer output to two balanced XLR males (L + R). Tip → XLR-L Pin 2, Ring → XLR-R Pin 2, Sleeve → Pin 1 on both XLR connectors. Signal is unbalanced on each XLR output — adequate for short runs.',
   pins:[{n:'3.5mm Tip',sig:'→ XLR Left Pin 2',color:'#E24B4A',note:'Left channel signal'},
         {n:'3.5mm Ring',sig:'→ XLR Right Pin 2',color:'#1D9E75',note:'Right channel signal'},
         {n:'3.5mm Sleeve',sig:'→ XLR (both) Pin 1+3',color:'#888780',note:'Ground, pins 1+3 bridged each side'}],
   uses:['Phone/laptop to PA','DJ backup source','Media player to console'],
   warn:'Output is unbalanced at each XLR. Use a stereo DI box for runs over 5m or in noisy environments.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="20" y="12" width="40" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="20" y="12" width="12" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="34" y="12" width="10" height="12" fill="#1D9E75" stroke="#0F6E56"/><text x="26" y="21" text-anchor="middle" fill="#fff" font-size="8">T</text><text x="39" y="21" text-anchor="middle" fill="#fff" font-size="8">R</text><text x="52" y="21" text-anchor="middle" fill="#fff" font-size="8">S</text><line x1="30" y1="24" x2="20" y2="45" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="50" y1="24" x2="60" y2="45" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="56" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="60" text-anchor="middle" fill="#378ADD" font-size="7" font-weight="500">L</text><circle cx="60" cy="56" r="9" fill="#1a1a22" stroke="#E24B4A" stroke-width="1.5"/><text x="60" y="60" text-anchor="middle" fill="#E24B4A" font-size="7" font-weight="500">R</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="9">XLR M × 2</text></svg>`
  },
  {id:'35-rca',name:'3.5mm to stereo RCA',cat:'adapter',tag:'Consumer stereo',color:'#D85A30',desc:'Standard cable for connecting consumer devices (phones, laptops, media players) to DJ mixers or hi-fi amplifiers with RCA inputs. Tip → Red RCA (right), Ring → White/Black RCA (left), Sleeve → ground on both RCAs.',
   pins:[{n:'Tip',sig:'→ RCA Red — Right channel',color:'#E24B4A',note:'Right audio'},
         {n:'Ring',sig:'→ RCA White — Left channel',color:'#1D9E75',note:'Left audio'},
         {n:'Sleeve',sig:'→ RCA outer rings (both)',color:'#888780',note:'Common ground'}],
   uses:['Phone to DJ mixer','Media player to amplifier','Laptop to mixing desk (line)'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="22" y="10" width="36" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="22" y="10" width="11" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="35" y="10" width="9" height="12" fill="#1D9E75" stroke="#0F6E56"/><line x1="30" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="50" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="58" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {id:'trs-rca',name:'TRS to stereo RCA',cat:'adapter',tag:'Pro to consumer',color:'#D4537E',desc:'Connects a professional TRS stereo output (interface, mixer headphone out, DJ monitor out) to a consumer RCA input. Same wiring as 3.5mm to RCA but with a full-size 6.35mm TRS plug on the pro side.',
   pins:[{n:'TRS Tip',sig:'→ RCA Red (right)',color:'#E24B4A',note:'Right channel'},
         {n:'TRS Ring',sig:'→ RCA White (left)',color:'#1D9E75',note:'Left channel'},
         {n:'TRS Sleeve',sig:'→ RCA outer rings',color:'#888780',note:'Ground both RCAs'}],
   uses:['Interface to monitors (RCA)','DJ booth monitoring','Club install amplifiers'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="14" y="10" width="48" height="12" rx="6" fill="#888780" stroke="#666"/><rect x="14" y="10" width="14" height="12" rx="6" fill="#E24B4A" stroke="#c0392b"/><rect x="30" y="10" width="11" height="12" fill="#1D9E75" stroke="#0F6E56"/><line x1="28" y1="22" x2="20" y2="46" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="52" y1="22" x2="60" y2="46" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="58" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="20" cy="58" r="4" fill="#fff"/><text x="20" y="74" text-anchor="middle" fill="#E24B4A" font-size="8">R</text><circle cx="60" cy="58" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="60" cy="58" r="4" fill="#fff"/><text x="60" y="74" text-anchor="middle" fill="#888" font-size="8">L</text></svg>`
  },
  {id:'rca-xlrm',name:'RCA to male XLR (stereo pair)',cat:'adapter',tag:'Consumer → balanced',color:'#D85A30',desc:'Two RCA connectors to two XLR males. Converts unbalanced consumer outputs to XLR for connecting to PA systems or mixing consoles. RCA centre pin → XLR Pin 2, RCA outer → XLR Pins 1+3 (bridged).',
   pins:[{n:'RCA Red centre',sig:'→ XLR-R Male Pin 2',color:'#E24B4A',note:'Right signal to console'},
         {n:'RCA White centre',sig:'→ XLR-L Male Pin 2',color:'#1D9E75',note:'Left signal to console'},
         {n:'RCA outer (both)',sig:'→ XLR Pin 1 + Pin 3',color:'#888780',note:'Ground, pin 3 bridged to pin 1'}],
   uses:['CD player to PA','Laptop to front-of-house','Media server to console'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="22" cy="20" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle cx="58" cy="20" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#1a1a22" stroke="#378ADD" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#fff" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R male XLR</text></svg>`
  },
  {id:'rca-xlrf',name:'RCA to female XLR (stereo pair)',cat:'adapter',tag:'Consumer to balanced in',color:'#D85A30',desc:'Same wiring as RCA to male XLR but terminates in female XLR connectors. Used when the destination has XLR male pins sticking out (e.g. some amplifiers, powered speakers with XLR male inputs). Less common — verify your destination connector gender first.',
   pins:[{n:'RCA Red centre',sig:'→ XLR-R Female Pin 2',color:'#E24B4A',note:'Right channel input'},
         {n:'RCA White centre',sig:'→ XLR-L Female Pin 2',color:'#1D9E75',note:'Left channel input'},
         {n:'RCA outer (both)',sig:'→ XLR Female Pin 1+3',color:'#888780',note:'Bridged ground'}],
   uses:['Consumer source to amp with male XLR','Broadcast input adapters'],
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="22" cy="20" r="9" fill="#E24B4A" stroke="#c0392b" stroke-width="2"/><circle cx="22" cy="20" r="4" fill="#fff"/><circle cx="58" cy="20" r="9" fill="#888" stroke="#555" stroke-width="2"/><circle cx="58" cy="20" r="4" fill="#fff"/><line x1="22" y1="30" x2="20" y2="52" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="58" y1="30" x2="60" y2="52" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="20" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><circle cx="60" cy="64" r="9" fill="#E1F5EE" stroke="#1D9E75" stroke-width="1.5"/><text x="60" y="68" text-anchor="middle" fill="#0F6E56" font-size="7">XLR</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">L + R female XLR</text></svg>`
  },
  {id:'pcon',name:'PowerCon — general (NAC3)',cat:'power',tag:'Locking mains power',color:'#E24B4A',desc:'Neutrik PowerCon is a twist-locking mains power connector rated at 250V / 16A. The NAC3FCA (blue, IN) and NAC3FCB (grey, OUT) variants are keyed differently — they cannot be cross-connected. Used for powering stage equipment, intelligent lighting, and amplifiers.',
   pins:[{n:'L',sig:'Line (live)',color:'#E24B4A',note:'Brown wire (UK) / Black (US)'},
         {n:'N',sig:'Neutral',color:'#1a1a22',note:'Blue wire (UK) / White (US)',border:'#555'},
         {n:'E',sig:'Earth / ground',color:'#639922',note:'Green-yellow wire'}],
   uses:['Amp rack power','Intelligent lighting','Powered speaker mains','Stage power distro'],
   warn:'DANGER — live mains voltage (230V/120V). Never connect or disconnect under load. Do not use as a breakout connector.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#E24B4A" stroke-width="2"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9" font-weight="500">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9" font-weight="500">E</text><text x="40" y="82" text-anchor="middle" fill="#E24B4A" font-size="8">⚡ mains voltage</text></svg>`
  },
  {id:'pcon-in',name:'PowerCon IN — NAC3FCA (blue)',cat:'power',tag:'Power input',color:'#378ADD',desc:'Blue PowerCon — the input connector. Accepts mains power into equipment. The blue colour and unique key orientation prevents cross-connection with OUT connectors. Wired: L = Line (brown), N = Neutral (blue), E = Earth (green-yellow).',
   pins:[{n:'L',sig:'Line (live) — brown',color:'#E24B4A',note:'Connect to live/line from distro'},
         {n:'N',sig:'Neutral — blue',color:'#1a1a22',note:'Connect to neutral',border:'#555'},
         {n:'E',sig:'Earth — green/yellow',color:'#639922',note:'Always connect earth first'}],
   uses:['Equipment power input','Powered speakers IN','Amplifier mains IN'],
   warn:'Blue = IN (power into device). Grey = OUT (power through device). These are physically keyed and incompatible.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#378ADD" stroke-width="3"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9">E</text><text x="40" y="82" text-anchor="middle" fill="#378ADD" font-size="8">Blue — IN</text></svg>`
  },
  {id:'pcon-out',name:'PowerCon OUT — NAC3FCB (grey)',cat:'power',tag:'Power loop-through',color:'#888780',desc:'Grey PowerCon — the output connector. Passes mains power through from one device to the next (daisy-chain / loop-through). Used to feed power from a distribution unit or one device to another. Same L/N/E pinout as the IN connector but physically keyed differently.',
   pins:[{n:'L',sig:'Line (live) — brown',color:'#E24B4A',note:'Loop-through to next device'},
         {n:'N',sig:'Neutral — blue',color:'#1a1a22',note:'Neutral loop-through',border:'#555'},
         {n:'E',sig:'Earth — green/yellow',color:'#639922',note:'Earth continuity through'}],
   uses:['Power distro output','Daisy-chain amplifier power','Dimmer rack output'],
   warn:'Grey = OUT / through. Never use OUT to connect to standard mains sockets.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#888780" stroke-width="3"/><circle cx="22" cy="52" r="8" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="22" y="56" text-anchor="middle" fill="#fff" font-size="9">L</text><circle cx="58" cy="52" r="8" fill="#222" stroke="#555" stroke-width="1"/><text x="58" y="56" text-anchor="middle" fill="#aaa" font-size="9">N</text><circle cx="40" cy="30" r="8" fill="#3B6D11" stroke="#639922" stroke-width="1"/><text x="40" y="34" text-anchor="middle" fill="#fff" font-size="9">E</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Grey — OUT</text></svg>`
  },
  {id:'rj45',name:'RJ45 / EtherCon (Ethernet)',cat:'digital',tag:'Network / Dante / AES67',color:'#7F77DD',desc:'8-position 8-contact connector for Ethernet, Dante audio networking, AES67, AVB, and AES/EBU over Cat5e/Cat6. Pin 1+2 = TX pair, Pin 3+6 = RX pair. EtherCon (Neutrik) is the ruggedized, XLR-body version for live and touring use.',
   pins:[{n:'1',sig:'TX+ (transmit)',color:'#E24B4A',note:'White-orange'},
         {n:'2',sig:'TX− (transmit)',color:'#D85A30',note:'Orange'},
         {n:'3',sig:'RX+ (receive)',color:'#1D9E75',note:'White-green'},
         {n:'4',sig:'PoE / unused',color:'#378ADD',note:'Blue'},
         {n:'5',sig:'PoE / unused',color:'#85B7EB',note:'White-blue'},
         {n:'6',sig:'RX− (receive)',color:'#639922',note:'Green'},
         {n:'7',sig:'Unused / PoE',color:'#D4537E',note:'White-brown'},
         {n:'8',sig:'Unused / PoE',color:'#8B4513',note:'Brown'}],
   uses:['Dante audio network','AES67 / AVB','Stage network','EtherCon touring runs'],
   note:'Use Cat5e minimum (Cat6 preferred for Dante). T568B wiring standard for all pro audio networking.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="20" width="48" height="44" rx="4" fill="#1a1a22" stroke="#7F77DD" stroke-width="1.5"/><rect x="20" y="26" width="5" height="28" rx="1" fill="#E24B4A"/><rect x="27" y="26" width="5" height="28" rx="1" fill="#D85A30"/><rect x="34" y="26" width="5" height="28" rx="1" fill="#1D9E75"/><rect x="41" y="26" width="5" height="28" rx="1" fill="#378ADD"/><rect x="48" y="26" width="5" height="28" rx="1" fill="#85B7EB"/><rect x="55" y="26" width="5" height="28" rx="1" fill="#639922"/><rect x="62" y="26" width="1.5" height="28" rx="1" fill="#D4537E"/><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">T568B — 8 pins</text></svg>`
  },
  {id:'bnc',name:'BNC — word clock / video sync',cat:'digital',tag:'75Ω coax',color:'#888780',desc:'Bayonet Neill-Concelman connector. Used for word clock distribution (44.1/48/96kHz sync), video sync signals, SPDIF digital audio (75Ω), and MADI (coaxial format). Twist-lock coaxial connector with centre pin (signal) and outer barrel (ground/shield). Requires 75Ω coaxial cable.',
   pins:[{n:'C',sig:'Centre — signal / clock',color:'#EF9F27',note:'Word clock or digital audio signal'},
         {n:'O',sig:'Outer barrel — ground',color:'#888780',note:'Coaxial shield / ground'}],
   uses:['Word clock sync','SPDIF coaxial','MADI coaxial','Video sync / black burst'],
   warn:'Use 75Ω cable only. 50Ω BNC cable causes reflections and sync errors. Always terminate unused word clock outputs with a 75Ω terminator.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="28" fill="#1a1a22" stroke="#888780" stroke-width="6"/><circle cx="40" cy="44" r="10" fill="#EF9F27" stroke="#BA7517" stroke-width="1.5"/><text x="40" y="48" text-anchor="middle" fill="#fff" font-size="8" font-weight="500">75Ω</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">Coax — BNC</text></svg>`
  },
  {id:'midi',name:'DIN 5-pin MIDI',cat:'digital',tag:'MIDI control',color:'#D4537E',desc:'Standard MIDI connector. 5-pin DIN, but only 3 pins are used for standard MIDI. Pin 2 = cable screen/ground, Pin 4 = MIDI current source (+5V through 220Ω), Pin 5 = MIDI data. Pins 1 and 3 are not connected in standard MIDI (used in some proprietary extensions).',
   pins:[{n:'1',sig:'Not connected (NC)',color:'#D3D1C7',note:'Unused in standard MIDI'},
         {n:'2',sig:'Cable screen / shield',color:'#888780',note:'Ground — connect at one end only'},
         {n:'3',sig:'Not connected (NC)',color:'#D3D1C7',note:'Unused in standard MIDI'},
         {n:'4',sig:'+5V source (220Ω)',color:'#E24B4A',note:'Current loop positive'},
         {n:'5',sig:'MIDI data',color:'#7F77DD',note:'Serial data 31.25 kbaud'}],
   uses:['MIDI keyboard/controller','MIDI patchbay','Synthesizers','MIDI time code (MTC)'],
   note:'MIDI is an opto-isolated current loop — not a voltage signal. Never connect MIDI OUT to MIDI OUT.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><circle cx="40" cy="44" r="32" fill="#1a1a22" stroke="#D4537E" stroke-width="1.5"/><circle cx="40" cy="18" r="6" fill="#D3D1C7" stroke="#888" stroke-width="1"/><text x="40" y="22" text-anchor="middle" fill="#555" font-size="8">1</text><circle cx="20" cy="34" r="6" fill="#888780" stroke="#666" stroke-width="1"/><text x="20" y="38" text-anchor="middle" fill="#fff" font-size="8">2</text><circle cx="60" cy="34" r="6" fill="#D3D1C7" stroke="#888" stroke-width="1"/><text x="60" y="38" text-anchor="middle" fill="#555" font-size="8">3</text><circle cx="26" cy="56" r="6" fill="#E24B4A" stroke="#c0392b" stroke-width="1"/><text x="26" y="60" text-anchor="middle" fill="#fff" font-size="8">4</text><circle cx="54" cy="56" r="6" fill="#7F77DD" stroke="#534AB7" stroke-width="1"/><text x="54" y="60" text-anchor="middle" fill="#fff" font-size="8">5</text><text x="40" y="82" text-anchor="middle" fill="#888" font-size="8">DIN 5-pin</text></svg>`
  },
  {id:'db25',name:'DB25 / D-Sub — Tascam & Elco',cat:'digital',tag:'Multicore analog/digital',color:'#D85A30',desc:'25-pin D-sub connector used as a multicore analog connector. The Tascam wiring standard carries 8 balanced analog channels on one connector (common on audio interfaces, patchbays, and consoles). Elco/Edac 38-pin is an alternative format on some vintage consoles.',
   pins:[{n:'1–8',sig:'Signals (Tascam: alt. hot/cold)',color:'#378ADD',note:'8 channels of balanced audio'},
         {n:'9–17',sig:'Hot and cold pairs',color:'#1D9E75',note:'Pins arranged in pairs per channel'},
         {n:'18–25',sig:'Ground returns',color:'#888780',note:'One ground per channel'}],
   uses:['Audio interface analog I/O','Patchbay multicore','Console sub-group routing','Pro Tools HD interfaces'],
   note:'Tascam pinout and Yamaha pinout differ — always check which standard your gear uses before building loom cables.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="8" y="24" width="64" height="40" rx="3" fill="#1a1a22" stroke="#D85A30" stroke-width="1.5"/><g fill="#378ADD"><circle cx="14" cy="36" r="3.5"/><circle cx="23" cy="36" r="3.5"/><circle cx="32" cy="36" r="3.5"/><circle cx="41" cy="36" r="3.5"/><circle cx="50" cy="36" r="3.5"/><circle cx="59" cy="36" r="3.5"/><circle cx="68" cy="36" r="3.5"/></g><g fill="#1D9E75"><circle cx="18" cy="48" r="3.5"/><circle cx="27" cy="48" r="3.5"/><circle cx="36" cy="48" r="3.5"/><circle cx="45" cy="48" r="3.5"/><circle cx="54" cy="48" r="3.5"/><circle cx="63" cy="48" r="3.5"/></g><text x="40" y="80" text-anchor="middle" fill="#888" font-size="8">DB25 — 25 pins</text></svg>`
  },
  {id:'toslink',name:'Optical / TOSLINK',cat:'digital',tag:'Digital optical',color:'#EF9F27',desc:'Toshiba Link optical connector. Carries S/PDIF or ADAT Lightpipe digital audio on a fiber optic cable. Immune to electrical interference and ground loops. ADAT Lightpipe carries 8 channels at 44.1/48kHz or 4 channels at 96kHz. S/PDIF carries 2 channels up to 192kHz.',
   pins:[{n:'TX',sig:'Transmit — light out',color:'#EF9F27',note:'Red/IR light pulse = digital signal'},
         {n:'RX',sig:'Receive — light in',color:'#888780',note:'Photodiode receiver'}],
   uses:['ADAT lightpipe (8ch)','S/PDIF optical','Interface I/O','Consumer DAC/ADC'],
   note:'ADAT = 8 channels. S/PDIF optical = 2 channels. Same connector, different protocols. Max cable length ~5m for reliable transmission.',
   svg:`<svg width="80" height="90" viewBox="0 0 80 90"><rect x="16" y="24" width="48" height="36" rx="4" fill="#1a1a22" stroke="#EF9F27" stroke-width="1.5"/><rect x="24" y="32" width="32" height="20" rx="2" fill="#0C0C0F"/><circle cx="40" cy="42" r="8" fill="#EF9F27" opacity="0.9"/><circle cx="40" cy="42" r="4" fill="#fff" opacity="0.6"/><text x="40" y="78" text-anchor="middle" fill="#888" font-size="8">TOSLINK optical</text></svg>`
  }
];

const PINOUT_CATS = [
    {id:'all',label:'All'},
    {id:'analog',label:'Analog audio'},
    {id:'speaker',label:'Speaker connectors'},
    {id:'adapter',label:'Adapter cables'},
    {id:'power',label:'Power connectors'},
    {id:'digital',label:'Digital & networking'}
];

let activePinoutCat = 'all';

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

    srchEl.addEventListener('input', window.renderPinouts);
    window.renderPinouts();
};

window.setPinoutCat = function(catId, btnEl) {
    activePinoutCat = catId;
    document.querySelectorAll('#pinout-cats .cat-btn').forEach(b => b.classList.remove('on'));
    btnEl.classList.add('on');
    window.renderPinouts();
};

window.renderPinouts = function() {
    const listEl = document.getElementById('pinout-list');
    const badgeEl = document.getElementById('pinout-count-badge');
    const srchInput = document.getElementById('pinout-srch');
    if(!listEl) return;

    const q = (srchInput.value || '').toLowerCase();
    listEl.innerHTML = '';
    let total = 0;

    PINOUT_CATS.filter(c => c.id !== 'all').forEach(cat => {
        if (activePinoutCat !== 'all' && activePinoutCat !== cat.id) return;
        
        const items = PINOUT_DATA.filter(d => d.cat === cat.id && 
            (d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q))
        );
        
        if (!items.length) return;
        total += items.length;
        
        const hdr = document.createElement('div');
        hdr.className = 'section-hdr pinout-section-hdr';
        hdr.textContent = cat.label.toUpperCase();
        listEl.appendChild(hdr);
        
        items.forEach(conn => {
            const acc = document.createElement('div');
            acc.className = 'acc pinout-acc';
            acc.innerHTML = `
                <div class="acc-hdr" onclick="window.togglePinout(this)">
                    <div class="conn-dot" style="background:${conn.color};box-shadow: 0 0 8px ${conn.color};"></div>
                    <div class="acc-name">${conn.name}</div>
                    <div class="acc-tag" style="background:var(--outline);color:var(--primary);border:1px solid var(--outline-light)">${conn.tag}</div>
                    <div class="acc-arrow"><span class="material-symbols-outlined">expand_more</span></div>
                </div>
                <div class="acc-body">
                    <div class="desc">${conn.desc}</div>
                    <div class="pin-layout">
                        <div class="pin-svg">${conn.svg}</div>
                        <div class="pin-table-container">
                            <table class="pin-table">
                                <thead><tr><th>Pin</th><th>Signal</th><th>Note</th></tr></thead>
                                <tbody>${conn.pins.map(p=>`<tr class="table-pin-row" data-pin="${p.n}"><td><div class="dot-cell"><div class="pd" style="background:${p.color};border:1px solid ${p.border||'rgba(255,255,255,0.1)'}"></div><strong>${p.n}</strong></div></td><td>${p.sig}</td><td class="pin-note">${p.note}</td></tr>`).join('')}</tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Fused Quick Soldering & Connection Guide Panel -->
                    <div class="soldering-spec-panel" style="margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px dashed var(--outline-light); border-radius: 6px; margin-bottom: 1rem;">
                        <h5 style="margin: 0 0 0.5rem 0; font-family: var(--font-mono); font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                            <span class="material-symbols-outlined" style="font-size: 14px;">bolt</span>
                            ${conn.cat === 'adapter' ? 'Adapter Signal Routing Map' : 'Professional Assembly Specifications'}
                        </h5>
                        <div style="font-size: 0.78rem; line-height: 1.4; color: var(--text-muted);">
                            ${conn.cat === 'adapter' 
                                ? `<strong>Wiring Guide:</strong> This adapter bridges unbalanced/balanced formats. Pin 2 carries signal hot (+). Ground continuity is bridged to ${conn.id.includes('unbalanced') || conn.id.includes('rca') ? 'XLR Pins 1 + 3 to prevent floating hum' : 'XLR Pin 1'}.` 
                                : `<strong>Solder Specs:</strong> Temp: 345°C - 370°C (650°F-700°F). Use Lead-Free SAC305 or Sn60/Pb40 rosin-core solder.<br>
                                   <strong>Stripping Guide:</strong> Jacket: 15mm (0.6") | Conductors/Shield: 3mm (0.12"). Recommend 20-24 AWG wiring.`
                            }
                        </div>
                    </div>

                    <div class="use-row">${conn.uses.map(u=>`<span class="use-tag">${u}</span>`).join('')}</div>
                    ${conn.warn?`<div class="warn-box">⚠ ${conn.warn}</div>`:''}
                    ${conn.note?`<div class="note-box">ℹ ${conn.note}</div>`:''}
                </div>
            `;
            listEl.appendChild(acc);
            
            // Attach bidirectional pin highlighting
            attachPinoutInteractions(acc, conn.pins);
        });
    });
    
    if(badgeEl) badgeEl.textContent = total + ' CONNECTORS';
};

function attachPinoutInteractions(accEl, pins) {
    const svg = accEl.querySelector('svg');
    if (!svg) return;

    const texts = Array.from(svg.querySelectorAll('text'));
    const circles = Array.from(svg.querySelectorAll('circle'));
    const rects = Array.from(svg.querySelectorAll('rect'));

    // Match text and shapes to pins
    const matchedShapes = [];
    
    texts.forEach(text => {
        const val = text.textContent.trim();
        const cleanVal = val.toLowerCase();
        
        const pin = pins.find(p => {
            const cleanN = p.n.toLowerCase();
            return cleanN === cleanVal || 
                   (cleanVal === 't' && cleanN.includes('tip')) ||
                   (cleanVal === 'r' && cleanN.includes('ring')) ||
                   (cleanVal === 's' && cleanN.includes('sleeve')) ||
                   (cleanVal === 'c' && cleanN.includes('centre')) ||
                   (cleanVal === 'o' && cleanN.includes('outer')) ||
                   (cleanVal === 'l' && cleanN.includes('left')) ||
                   (cleanVal === 'r' && cleanN.includes('right')) ||
                   (cleanN.includes(cleanVal)) ||
                   (cleanVal.includes(cleanN));
        });
        
        if (!pin) return;

        const tx = parseFloat(text.getAttribute('x') || 0);
        const ty = parseFloat(text.getAttribute('y') || 0);

        // Find closest circle
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

        // Find closest rect
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

        // Select closest shape
        const shape = (minCircleDist < minRectDist) ? closestCircle : closestRect;
        
        // Ensure we don't match the outer shell circles/rects
        if (shape) {
            const r = parseFloat(shape.getAttribute('r') || 0);
            const w = parseFloat(shape.getAttribute('width') || 0);
            if (r > 20 || w > 45) return; // Skip background/shell elements
            
            shape.setAttribute('data-pin', pin.n);
            text.setAttribute('data-pin', pin.n);
            shape.classList.add('interactive-svg-pin');
            text.classList.add('interactive-svg-pin');
            shape.style.cursor = 'pointer';
            text.style.cursor = 'pointer';
            
            matchedShapes.push({ pinName: pin.n, elements: [shape, text] });
        }
    });

    // Add event listeners for bidirectional highlighting
    const tableRows = accEl.querySelectorAll('.table-pin-row');
    tableRows.forEach(row => {
        const pinName = row.getAttribute('data-pin');
        
        row.addEventListener('mouseenter', () => {
            row.classList.add('highlight-row');
            matchedShapes.forEach(m => {
                if (m.pinName === pinName) {
                    m.elements.forEach(el => el.classList.add('highlight-pin'));
                }
            });
        });
        
        row.addEventListener('mouseleave', () => {
            row.classList.remove('highlight-row');
            matchedShapes.forEach(m => {
                if (m.pinName === pinName) {
                    m.elements.forEach(el => el.classList.remove('highlight-pin'));
                }
            });
        });
    });

    matchedShapes.forEach(m => {
        m.elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                matchedShapes.forEach(other => {
                    if (other.pinName === m.pinName) {
                        other.elements.forEach(e => e.classList.add('highlight-pin'));
                    }
                });
                const matchingRow = accEl.querySelector(`.table-pin-row[data-pin="${m.pinName}"]`);
                if (matchingRow) matchingRow.classList.add('highlight-row');
            });
            
            el.addEventListener('mouseleave', () => {
                matchedShapes.forEach(other => {
                    if (other.pinName === m.pinName) {
                        other.elements.forEach(e => e.classList.remove('highlight-pin'));
                    }
                });
                const matchingRow = accEl.querySelector(`.table-pin-row[data-pin="${m.pinName}"]`);
                if (matchingRow) matchingRow.classList.remove('highlight-row');
            });
        });
    });
}

window.togglePinout = function(hdrEl) {
    const body = hdrEl.nextElementSibling;
    const arrow = hdrEl.querySelector('.acc-arrow');
    const open = body.classList.contains('open');
    body.classList.toggle('open', !open);
    arrow.classList.toggle('open', !open);
};