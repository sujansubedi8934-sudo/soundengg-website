/**
 * SoundEngg Viral FOH Acoustic Alignment Share Card Generator
 * Renders a 1080x1080 professional acoustic calibration card for social sharing (Instagram, Reddit, WhatsApp)
 */
(function() {
    'use strict';

    const SoundEnggShareCard = {
        /**
         * Renders the alignment card onto an HTML5 Canvas
         * @param {Object} data 
         * @returns {HTMLCanvasElement}
         */
        createCanvas(data) {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');

            const zoneName = data.zoneName || 'Main PA ↔ Delay Tower 1';
            const venueName = data.venueName || 'FOH Live Sound Check';
            const totalDelayMs = parseFloat(data.totalDelayMs || 0).toFixed(1);
            const flightTimeMs = parseFloat(data.flightTimeMs || 0).toFixed(1);
            const haasMs = parseFloat(data.haasMs || 0).toFixed(1);
            const distance = parseFloat(data.distance || 0).toFixed(1);
            const unit = data.unit || 'm';
            const equivDist = data.equivDist || (unit === 'm' ? (parseFloat(distance) * 3.28084).toFixed(1) + ' ft' : (parseFloat(distance) / 3.28084).toFixed(1) + ' m');
            const temp = data.temp || '20';
            const tempUnit = data.tempUnit || '°C';
            const speed = data.speed || '343.4';
            const dateStr = data.dateStr || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // 1. Background Gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
            bgGrad.addColorStop(0, '#0a0d14');
            bgGrad.addColorStop(0.5, '#0f141f');
            bgGrad.addColorStop(1, '#080a0f');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1080, 1080);

            // 2. Subtle Coordinate Grid Lines
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.04)';
            ctx.lineWidth = 1;
            for (let x = 60; x < 1080; x += 60) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 1080);
                ctx.stroke();
            }
            for (let y = 60; y < 1080; y += 60) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(1080, y);
                ctx.stroke();
            }

            // 3. Brushed Metal Outer Border with Corner Accents
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.35)';
            ctx.lineWidth = 2;
            ctx.strokeRect(50, 50, 980, 980);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(56, 56, 968, 968);

            // Corner decorative brackets
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 4;
            const bLen = 30;
            // Top-left
            ctx.beginPath(); ctx.moveTo(48, 48 + bLen); ctx.lineTo(48, 48); ctx.lineTo(48 + bLen, 48); ctx.stroke();
            // Top-right
            ctx.beginPath(); ctx.moveTo(1032 - bLen, 48); ctx.lineTo(1032, 48); ctx.lineTo(1032, 48 + bLen); ctx.stroke();
            // Bottom-left
            ctx.beginPath(); ctx.moveTo(48, 1032 - bLen); ctx.lineTo(48, 1032); ctx.lineTo(48 + bLen, 1032); ctx.stroke();
            // Bottom-right
            ctx.beginPath(); ctx.moveTo(1032 - bLen, 1032); ctx.lineTo(1032, 1032); ctx.lineTo(1032, 1032 - bLen); ctx.stroke();

            // 4. Header: Brand & Spec Category
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 32px "SF Pro Display", -apple-system, sans-serif';
            ctx.letterSpacing = '3px';
            ctx.fillText('SOUNDENGG', 90, 115);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 16px "SF Mono", Monaco, Consolas, monospace';
            ctx.letterSpacing = '2px';
            ctx.fillText('// ACOUSTIC ALIGNMENT SPEC SHEET', 90, 142);

            // Verified Badge (Top Right)
            ctx.fillStyle = 'rgba(0, 255, 204, 0.12)';
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(790, 85, 200, 52, 26);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 15px "SF Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ISO 9613-1 CAL', 890, 117);
            ctx.textAlign = 'left';

            // 5. Zone & Venue Metadata Header
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px "SF Pro Display", -apple-system, sans-serif';
            ctx.fillText(zoneName.toUpperCase(), 90, 220);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '18px "SF Mono", monospace';
            ctx.fillText(`VENUE: ${venueName.toUpperCase()}  |  DATE: ${dateStr.toUpperCase()}`, 90, 255);

            // 6. Center Hero Box: Oscilloscope Waveform & Big Number
            const heroGrad = ctx.createLinearGradient(90, 290, 990, 630);
            heroGrad.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
            heroGrad.addColorStop(1, 'rgba(8, 12, 22, 0.95)');
            ctx.fillStyle = heroGrad;
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(90, 290, 900, 360, 16);
            ctx.fill();
            ctx.stroke();

            // Stylized Impulse Response Waveform Background inside Hero
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(90, 290, 900, 360, 16);
            ctx.clip();

            // Draw center zero line
            const waveCenterY = 560;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(110, waveCenterY);
            ctx.lineTo(970, waveCenterY);
            ctx.stroke();

            // Main Arrival pulse (at x = 240)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(130, waveCenterY);
            ctx.lineTo(210, waveCenterY);
            ctx.lineTo(230, waveCenterY - 45);
            ctx.lineTo(240, waveCenterY + 60);
            ctx.lineTo(250, waveCenterY - 20);
            ctx.lineTo(270, waveCenterY);
            ctx.lineTo(550, waveCenterY);
            ctx.stroke();

            // Delay speaker Arrival pulse (at x = 620)
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(550, waveCenterY);
            ctx.lineTo(600, waveCenterY);
            ctx.lineTo(615, waveCenterY - 80);
            ctx.lineTo(630, waveCenterY + 70);
            ctx.lineTo(645, waveCenterY - 30);
            ctx.lineTo(665, waveCenterY);
            ctx.lineTo(950, waveCenterY);
            ctx.stroke();

            // Delta T indicator between peaks
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(240, waveCenterY - 55);
            ctx.lineTo(240, waveCenterY - 100);
            ctx.lineTo(630, waveCenterY - 100);
            ctx.lineTo(630, waveCenterY - 85);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 15px "SF Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Δt = ${totalDelayMs} ms`, (240 + 630) / 2, waveCenterY - 110);
            ctx.textAlign = 'left';
            ctx.restore();

            // Hero Main Text Label
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 16px "SF Mono", monospace';
            ctx.letterSpacing = '2px';
            ctx.fillText('TARGET DELAY TIME SETTING', 130, 345);

            // Glowing Main Delay Number
            ctx.shadowColor = 'rgba(0, 255, 204, 0.6)';
            ctx.shadowBlur = 25;
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 96px "SF Mono", monospace';
            const numWidth = ctx.measureText(`${totalDelayMs}`).width;
            ctx.fillText(`${totalDelayMs}`, 130, 445);
            ctx.shadowBlur = 0; // reset shadow

            // "ms" unit text
            ctx.font = '36px "SF Pro Display", sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('ms', 150 + numWidth, 420);

            // Secondary Sub-text in Hero Box
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '18px "SF Pro Display", -apple-system, sans-serif';
            ctx.fillText(`Acoustic Transit: ${flightTimeMs} ms  •  Haas Precedence: +${haasMs} ms`, 130, 490);

            // 7. Quad Metrics Grid (4 Cards Below Hero)
            const cards = [
                {
                    title: 'PHYSICAL DISTANCE',
                    val: `${distance} ${unit}`,
                    sub: `(${equivDist})`,
                    color: '#f8fafc'
                },
                {
                    title: 'FLIGHT TIME',
                    val: `${flightTimeMs} ms`,
                    sub: 'Direct line propagation',
                    color: '#38bdf8'
                },
                {
                    title: 'HAAS PRECEDENCE',
                    val: `+${haasMs} ms`,
                    sub: 'Frontal localization pull',
                    color: '#a855f7'
                },
                {
                    title: 'SPEED OF SOUND (c)',
                    val: `${speed} m/s`,
                    sub: `@ ${temp}${tempUnit} ambient air`,
                    color: '#f59e0b'
                }
            ];

            const gridY = 680;
            const cardW = 430;
            const cardH = 120;
            const cardPositions = [
                { x: 90, y: gridY },
                { x: 560, y: gridY },
                { x: 90, y: gridY + 140 },
                { x: 560, y: gridY + 140 }
            ];

            cards.forEach((c, i) => {
                const pos = cardPositions[i];
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(pos.x, pos.y, cardW, cardH, 12);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#64748b';
                ctx.font = 'bold 13px "SF Mono", monospace';
                ctx.letterSpacing = '1px';
                ctx.fillText(c.title, pos.x + 24, pos.y + 36);

                ctx.fillStyle = c.color;
                ctx.font = 'bold 28px "SF Mono", monospace';
                ctx.fillText(c.val, pos.x + 24, pos.y + 75);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '13px "SF Pro Display", sans-serif';
                ctx.fillText(c.sub, pos.x + 24, pos.y + 100);
            });

            // 8. Footer Bar: App Attribution & QR/Download CTA
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(90, 960);
            ctx.lineTo(990, 960);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px "SF Pro Display", -apple-system, sans-serif';
            ctx.fillText('Calibrated with SoundEngg Auto-Ping Workstation', 90, 995);

            ctx.fillStyle = '#64748b';
            ctx.font = '14px "SF Mono", monospace';
            ctx.fillText('Offline Field Tools for Touring FOH & System Techs • www.soundengg.com', 90, 1020);

            // Right Pill Tag
            ctx.fillStyle = 'rgba(0, 255, 204, 0.1)';
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(830, 975, 160, 40, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 14px "SF Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SOUNDENGG', 910, 1000);
            ctx.textAlign = 'left';

            return canvas;
        },

        /**
         * Open interactive Share Card Modal in the DOM
         * @param {Object} initialData 
         */
        openModal(initialData) {
            let modal = document.getElementById('soundengg-share-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'soundengg-share-modal';
                modal.innerHTML = `
                    <div class="se-modal-backdrop"></div>
                    <div class="se-modal-container">
                        <div class="se-modal-header">
                            <div>
                                <h3 class="se-modal-title">FOH Alignment Share Card</h3>
                                <p class="se-modal-subtitle">Generate a calibrated spec card for social sharing & soundcheck documentation</p>
                            </div>
                            <button type="button" class="se-modal-close" id="se-modal-close-btn">&times;</button>
                        </div>
                        <div class="se-modal-body">
                            <div class="se-card-preview-wrap">
                                <canvas id="se-share-canvas" width="1080" height="1080"></canvas>
                            </div>
                            <div class="se-modal-controls">
                                <div class="se-control-group">
                                    <label class="se-control-label" for="se-zone-input">Speaker / Zone Label</label>
                                    <input type="text" id="se-zone-input" class="se-control-input" value="Main PA ↔ Delay Tower 1" maxlength="35" />
                                </div>
                                <div class="se-control-group">
                                    <label class="se-control-label" for="se-venue-input">Venue / Stage Name</label>
                                    <input type="text" id="se-venue-input" class="se-control-input" value="Festival Main Stage FOH" maxlength="35" />
                                </div>
                                <div class="se-btn-stack">
                                    <button type="button" id="se-btn-download-card" class="se-btn se-btn-primary">
                                        <span class="material-symbols-outlined">download</span> Download High-Res PNG
                                    </button>
                                    <button type="button" id="se-btn-copy-card" class="se-btn se-btn-secondary">
                                        <span class="material-symbols-outlined">content_copy</span> Copy Image
                                    </button>
                                    <button type="button" id="se-btn-native-share" class="se-btn se-btn-secondary">
                                        <span class="material-symbols-outlined">share</span> Share (Mobile / Instagram)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                this.injectStyles();
            }

            modal.style.display = 'flex';

            const zoneInput = document.getElementById('se-zone-input');
            const venueInput = document.getElementById('se-venue-input');
            const previewCanvas = document.getElementById('se-share-canvas');
            const closeBtn = document.getElementById('se-modal-close-btn');
            const backdrop = modal.querySelector('.se-modal-backdrop');
            const btnDownload = document.getElementById('se-btn-download-card');
            const btnCopy = document.getElementById('se-btn-copy-card');
            const btnShare = document.getElementById('se-btn-native-share');

            const currentData = { ...initialData };

            const render = () => {
                currentData.zoneName = zoneInput.value || 'Main PA ↔ Delay Tower 1';
                currentData.venueName = venueInput.value || 'FOH Live Sound Check';
                const rendered = this.createCanvas(currentData);
                const pCtx = previewCanvas.getContext('2d');
                pCtx.clearRect(0, 0, 1080, 1080);
                pCtx.drawImage(rendered, 0, 0);
            };

            zoneInput.oninput = render;
            venueInput.oninput = render;
            render();

            const closeModal = () => {
                modal.style.display = 'none';
            };

            closeBtn.onclick = closeModal;
            backdrop.onclick = closeModal;

            // 1. Download High-Res PNG
            btnDownload.onclick = () => {
                const link = document.createElement('a');
                link.download = `soundengg-delay-${(zoneInput.value || 'alignment').toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
                link.href = previewCanvas.toDataURL('image/png');
                link.click();
            };

            // 2. Copy Image to Clipboard
            btnCopy.onclick = async () => {
                try {
                    previewCanvas.toBlob(async (blob) => {
                        if (!blob) return;
                        if (navigator.clipboard && window.ClipboardItem) {
                            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                            btnCopy.innerHTML = '<span class="material-symbols-outlined">check</span> Copied to Clipboard!';
                            setTimeout(() => {
                                btnCopy.innerHTML = '<span class="material-symbols-outlined">content_copy</span> Copy Image';
                            }, 2500);
                        } else {
                            alert('Clipboard image copy not supported in this browser. Please use Download PNG.');
                        }
                    });
                } catch (e) {
                    alert('Clipboard write failed. Please use Download PNG.');
                }
            };

            // 3. Web Share API
            btnShare.onclick = async () => {
                if (navigator.share && previewCanvas.toBlob) {
                    previewCanvas.toBlob(async (blob) => {
                        const file = new File([blob], 'soundengg-alignment-card.png', { type: 'image/png' });
                        try {
                            await navigator.share({
                                title: 'SoundEngg Delay Alignment Spec',
                                text: `Acoustic delay aligned to ${currentData.totalDelayMs} ms at ${currentData.distance} ${currentData.unit}. Generated with SoundEngg.`,
                                files: [file]
                            });
                        } catch (err) {
                            console.log('Share canceled or dismissed');
                        }
                    });
                } else {
                    btnDownload.click();
                }
            };
        },

        injectStyles() {
            if (document.getElementById('se-share-card-styles')) return;
            const style = document.createElement('style');
            style.id = 'se-share-card-styles';
            style.textContent = `
                #soundengg-share-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                }
                .se-modal-backdrop {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                }
                .se-modal-container {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 960px;
                    max-height: 90vh;
                    overflow-y: auto;
                    background: #0f141f;
                    border: 1px solid rgba(0, 255, 204, 0.3);
                    border-radius: 16px;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
                    display: flex;
                    flex-direction: column;
                }
                html.light .se-modal-container {
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
                }
                .se-modal-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                }
                html.light .se-modal-header {
                    border-bottom: 1px solid #e2e8f0;
                }
                .se-modal-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 0.3rem 0;
                }
                html.light .se-modal-title {
                    color: #0f172a;
                }
                .se-modal-subtitle {
                    font-size: 0.9rem;
                    color: #94a3b8;
                    margin: 0;
                }
                .se-modal-close {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 2rem;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 1rem;
                    transition: color 0.2s;
                }
                .se-modal-close:hover {
                    color: #00ffcc;
                }
                .se-modal-body {
                    padding: 2rem;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    align-items: start;
                }
                @media (max-width: 768px) {
                    .se-modal-body {
                        grid-template-columns: 1fr;
                    }
                }
                .se-card-preview-wrap {
                    background: #080a0f;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                #se-share-canvas {
                    width: 100%;
                    height: auto;
                    aspect-ratio: 1 / 1;
                    border-radius: 8px;
                    display: block;
                }
                .se-modal-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .se-control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .se-control-label {
                    font-size: 0.8rem;
                    font-family: monospace;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #94a3b8;
                }
                .se-control-input {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: #ffffff;
                    font-size: 0.95rem;
                    outline: none;
                }
                html.light .se-control-input {
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    color: #0f172a;
                }
                .se-control-input:focus {
                    border-color: #00ffcc;
                }
                .se-btn-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                }
                .se-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 18px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .se-btn-primary {
                    background: #00ffcc;
                    color: #0b0f17;
                    border: 1px solid #00ffcc;
                }
                .se-btn-primary:hover {
                    background: #00e6b8;
                    box-shadow: 0 0 15px rgba(0, 255, 204, 0.4);
                }
                .se-btn-secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }
                html.light .se-btn-secondary {
                    background: #f1f5f9;
                    color: #0f172a;
                    border: 1px solid #cbd5e1;
                }
                .se-btn-secondary:hover {
                    border-color: #00ffcc;
                    color: #00ffcc;
                }
            `;
            document.head.appendChild(style);
        }
    };

    window.SoundEnggShareCard = SoundEnggShareCard;
})();
