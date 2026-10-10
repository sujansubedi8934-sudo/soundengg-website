// =========================================================================
// RTA MEASUREMENT REPORT & DATA EXPORT MODULE (rtaDataExport.js)
// Extracted from assets/js/components/rtaEngine.js — 100% identical export pipeline
// =========================================================================

(function() {
    'use strict';

    function getNativeAudioExportPlugin() {
        if (window._cachedNativeAudioExportPlugin) return window._cachedNativeAudioExportPlugin;
        const existing = window.Capacitor?.Plugins?.NativeAudioExport;
        if (existing) {
            window._cachedNativeAudioExportPlugin = existing;
            return existing;
        }
        if (window.Capacitor?.registerPlugin) {
            try {
                window._cachedNativeAudioExportPlugin = window.Capacitor.registerPlugin('NativeAudioExport');
                return window._cachedNativeAudioExportPlugin;
            } catch (e) {}
        }
        return null;
    }

    function uint8ArrayToBase64(bytes) {
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const sub = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, sub);
        }
        return btoa(binary);
    }

    function base64ToBlob(base64Data, mimeType) {
        const byteChars = atob(base64Data);
        const byteNumbers = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        return new Blob([byteNumbers], { type: mimeType });
    }

    async function shareOrSaveExport(blob, base64Data, fileName, mimeType, title, desc, btnEl, opts = {}) {
        const toastFn = window.showToastNotification || window.showSoundEnggToast || console.log;
        if (typeof window.triggerHaptic === 'function') {
            window.triggerHaptic('light');
        }

        const origHtml = btnEl ? btnEl.innerHTML : null;
        if (btnEl) {
            btnEl.style.pointerEvents = 'none';
            btnEl.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">hourglass_top</span><span>EXPORTING...</span>`;
        }

        const restoreBtn = (success) => {
            if (!btnEl || !origHtml) return;
            if (success) {
                btnEl.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: #00FF9D;">check_circle</span><span style="color: #00FF9D;">EXPORTED</span>`;
                setTimeout(() => {
                    btnEl.innerHTML = origHtml;
                    btnEl.style.pointerEvents = '';
                }, 1400);
            } else {
                btnEl.innerHTML = origHtml;
                btnEl.style.pointerEvents = '';
            }
        };

        try {
            const isNative = typeof window !== 'undefined' && (
                window.Capacitor?.isNativePlatform?.() ||
                (window.Capacitor !== undefined && window.Capacitor.platform && window.Capacitor.platform !== 'web')
            );

            // 1. Native iOS / iPad & Android Capacitor Export Pipeline
            if (isNative && base64Data) {
                const platform = window.Capacitor?.getPlatform ? window.Capacitor.getPlatform() : (window.Capacitor?.platform || 'web');
                const isIos = platform === 'ios' || !!opts.isIOSPlatform;
                const nativeExport = getNativeAudioExportPlugin();
                const audioPlugin = typeof opts.getAudioSessionPlugin === 'function' ? opts.getAudioSessionPlugin() : null;

                if (isIos) {
                    let shared = false;
                    if (nativeExport && typeof nativeExport.shareWavFile === 'function') {
                        try {
                            await nativeExport.shareWavFile({
                                fileName: fileName,
                                base64Data: base64Data,
                                title: title || fileName
                            });
                            shared = true;
                        } catch (e) {
                            console.warn('[Export] NativeAudioExport.shareWavFile warning on iOS:', e);
                        }
                    }

                    if (!shared && audioPlugin && typeof audioPlugin.shareWavFile === 'function') {
                        try {
                            await audioPlugin.shareWavFile({
                                fileName: fileName,
                                base64Data: base64Data,
                                title: title || fileName
                            });
                            shared = true;
                        } catch (e) {
                            console.warn('[Export] AudioSessionPlugin.shareWavFile warning on iOS:', e);
                        }
                    }

                    if (shared) {
                        toastFn(`✓ Ready to Save or Share: ${fileName}`, 3000);
                        restoreBtn(true);
                        return;
                    }
                } else {
                    // Android: Save directly to Downloads/SoundEngg/ and launch native Share Sheet
                    if (nativeExport) {
                        let saved = false;
                        if (typeof nativeExport.saveWavToDownloads === 'function') {
                            try {
                                await nativeExport.saveWavToDownloads({
                                    fileName: fileName,
                                    base64Data: base64Data,
                                    mimeType: mimeType
                                });
                                saved = true;
                                toastFn(`✓ Saved to Downloads/SoundEngg/${fileName}`, 3000);
                            } catch (saveErr) {
                                console.warn('[Export] saveWavToDownloads warning on Android:', saveErr);
                            }
                        }

                        if (typeof nativeExport.shareWavFile === 'function') {
                            try {
                                await nativeExport.shareWavFile({
                                    fileName: fileName,
                                    base64Data: base64Data,
                                    mimeType: mimeType,
                                    title: title || fileName,
                                    text: desc || 'SoundEngg Acoustic Measurement Export'
                                });
                                restoreBtn(true);
                                return;
                            } catch (shareErr) {
                                console.warn('[Export] shareWavFile warning on Android:', shareErr);
                            }
                        }

                        if (saved) {
                            restoreBtn(true);
                            return;
                        }
                    }
                }
            }

            // 2. Web Share API (iOS Safari / Mobile Browsers / WebView fallback)
            if (blob && typeof navigator !== 'undefined' && navigator.canShare) {
                try {
                    const file = new File([blob], fileName, { type: mimeType });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: title || fileName,
                            text: desc || 'SoundEngg acoustic measurement data.'
                        });
                        toastFn('✓ Shared successfully!', 2500);
                        restoreBtn(true);
                        return;
                    }
                } catch (shareErr) {
                    if (shareErr && shareErr.name === 'AbortError') {
                        restoreBtn(false);
                        return;
                    }
                    console.warn('[Export] Web Share API fallback:', shareErr);
                }
            }

            // 3. Desktop Browser Download Fallback
            if (blob) {
                const link = document.createElement('a');
                link.download = fileName;
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(link.href), 1500);

                toastFn('✓ File exported: ' + fileName, 3000);
                restoreBtn(true);
                return;
            }

            restoreBtn(false);
        } catch (err) {
            console.error('[Export] Unexpected export error:', err);
            toastFn('⚠️ Export failed: ' + (err.message || 'Unknown error'), 3000);
            restoreBtn(false);
        }
    }

    function buildAndExportSpectrumPng(state, btnEl) {
        const {
            canvas,
            currentMode,
            currentOctaveFraction,
            currentOctaveFreqs,
            currentWeighting,
            averagingFactor,
            inputRmsDbfs,
            calibrationOffset,
            domFreqDisplay,
            peakFlagSmoothedDb,
            currentLayout,
            viewMinFreq,
            viewMaxFreq,
            snapshots,
            isSnapshotSlotUnlocked,
            isIOSPlatform,
            getAudioSessionPlugin
        } = state;

        const isLight = document.documentElement.classList.contains('light');
        const reportWidth = Math.max(1200, canvas ? canvas.width : 1200);
        const reportHeight = Math.max(700, (canvas ? canvas.height : 500) + 150);
        
        const reportCanvas = document.createElement('canvas');
        reportCanvas.width = reportWidth;
        reportCanvas.height = reportHeight;
        const rctx = reportCanvas.getContext('2d');
        if (!rctx) return;

        // 1. Background
        rctx.fillStyle = isLight ? '#f8fafc' : '#05070f';
        rctx.fillRect(0, 0, reportWidth, reportHeight);

        // Subtle gradient background
        const grad = rctx.createLinearGradient(0, 0, 0, reportHeight);
        if (isLight) {
            grad.addColorStop(0, 'rgba(241, 245, 249, 0.95)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 1.0)');
        } else {
            grad.addColorStop(0, 'rgba(10, 16, 28, 0.85)');
            grad.addColorStop(1, 'rgba(5, 7, 15, 1.0)');
        }
        rctx.fillStyle = grad;
        rctx.fillRect(0, 0, reportWidth, reportHeight);

        // 2. Top Header Banner (Height: 90px)
        const primaryColor = isLight ? '#008B9F' : '#00f2fe';
        const textColor = isLight ? '#0f172a' : '#f8fafc';
        const textMuted = isLight ? '#64748b' : '#94a3b8';

        // SoundEngg Title
        rctx.fillStyle = primaryColor;
        rctx.font = "bold 20px 'Space Grotesk', system-ui, sans-serif";
        rctx.textAlign = 'left';
        rctx.textBaseline = 'top';
        rctx.fillText("SOUNDENGG // ACOUSTIC SPECTRUM REPORT", 24, 20);

        // Subtitle / Date
        rctx.fillStyle = textMuted;
        rctx.font = "12px 'Space Grotesk', monospace";
        const now = new Date();
        const dateStr = now.toLocaleString();
        rctx.fillText(`MEASUREMENT CAPTURE  |  ${dateStr}`, 24, 48);

        // Telemetry Metadata Strip (Right aligned in header)
        const modeLabel = currentMode === 'rta' ? 
            (currentOctaveFraction === 3 ? '31-BAND 1/3-OCT RTA' : `1/${currentOctaveFraction}-OCTAVE RTA`) :
            (currentMode === 'fft' ? 'HIGH-RES FFT LOG CURVE' : 'TRANSFER FUNCTION');
        const weightLabel = `${currentWeighting.toUpperCase()}-WEIGHT`;
        const speedLabel = (averagingFactor <= 2 ? 'FAST' : averagingFactor < 7 ? 'SLOW' : 'INFINITE');
        const splVal = (inputRmsDbfs > -85) ? `${(inputRmsDbfs + calibrationOffset).toFixed(1)} dB${currentWeighting.toUpperCase()}` : `CAL OFFSET: ${calibrationOffset} dB`;

        rctx.textAlign = 'right';
        rctx.fillStyle = textColor;
        rctx.font = "bold 13px 'Space Grotesk', monospace";
        rctx.fillText(`${modeLabel}  |  ${weightLabel}  |  ${speedLabel}  |  SPL: ${splVal}`, reportWidth - 24, 24);

        if (domFreqDisplay && domFreqDisplay !== '--- Hz') {
            rctx.fillStyle = primaryColor;
            rctx.font = "12px 'Space Grotesk', monospace";
            const peakText = (peakFlagSmoothedDb > -120) ? `  |  PEAK: ${(peakFlagSmoothedDb + calibrationOffset).toFixed(1)} dB` : '';
            rctx.fillText(`DOMINANT: ${domFreqDisplay}${peakText}`, reportWidth - 24, 48);
        }

        // Header Divider Line
        rctx.strokeStyle = isLight ? 'rgba(0, 139, 159, 0.25)' : 'rgba(0, 242, 254, 0.25)';
        rctx.lineWidth = 1;
        rctx.beginPath();
        rctx.moveTo(24, 76);
        rctx.lineTo(reportWidth - 24, 76);
        rctx.stroke();

        // 3. Draw Center Plot (the spectrum visualizer canvas)
        const plotX = 24;
        const plotY = 88;
        const plotW = reportWidth - 48;
        const plotH = reportHeight - 166;

        // Plot Border Frame
        rctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)';
        rctx.strokeRect(plotX, plotY, plotW, plotH);

        // Render current main canvas into plot
        if (canvas && canvas.width > 0 && canvas.height > 0) {
            rctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, plotX, plotY, plotW, plotH);
        }

        // 3b. Stamp Frequency Axis Scale Strip Below Plot
        const isDualPlot = (currentLayout === 'spl_history' && currentMode !== 'waterfall');
        const freqAxisWidth = isDualPlot ? Math.round(plotW * 0.64) : plotW;
        const freqAxisY = plotY + plotH + 11;
        const fmtFreqLabel = (f) => f >= 1000 ? (f % 1000 === 0 ? (f / 1000) + 'k' : (f / 1000).toFixed(f % 100 === 0 ? 1 : 2).replace(/\.?0+$/, '') + 'k') : String(f);

        rctx.font = "bold 10px 'Space Grotesk', monospace";
        rctx.fillStyle = textMuted;
        rctx.textBaseline = 'middle';

        if (currentMode === 'rta') {
            const freqs = currentOctaveFreqs || window.ISO_1_3_FREQS;
            const totalBands = freqs.length;
            const barW = freqAxisWidth / totalBands;
            const isoAnchors = [20, 31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000];
            freqs.forEach((f, idx) => {
                const isMajor = totalBands <= 10 ? true :
                    (totalBands <= 31 ? (idx % 2 === 0 || idx === totalBands - 1) :
                        isoAnchors.some(a => Math.abs(Math.log2(f / a)) < 0.04));
                if (!isMajor) return;
                const cx = plotX + (idx + 0.5) * barW;
                rctx.textAlign = idx === 0 ? 'left' : (idx === totalBands - 1 ? 'right' : 'center');
                rctx.fillText(fmtFreqLabel(f), cx, freqAxisY);
            });
        } else {
            const minF = viewMinFreq || 20;
            const maxF = viewMaxFreq || 20000;
            const logSpan = Math.log10(maxF / minF);
            const logTicks = [20, 31.5, 50, 80, 125, 200, 315, 500, 800, 1250, 2000, 3150, 5000, 8000, 12500, 20000];
            logTicks.forEach((f) => {
                if (f < minF || f > maxF) return;
                const normX = Math.log10(f / minF) / (logSpan || 1);
                const cx = plotX + normX * freqAxisWidth;
                rctx.textAlign = normX < 0.03 ? 'left' : (normX > 0.97 ? 'right' : 'center');
                rctx.fillText(fmtFreqLabel(f), cx, freqAxisY);
            });
        }

        // 4. Bottom Footer & Legend (Height: 50px)
        const footerY = reportHeight - 48;
        rctx.strokeStyle = isLight ? 'rgba(0, 139, 159, 0.25)' : 'rgba(0, 242, 254, 0.25)';
        rctx.beginPath();
        rctx.moveTo(24, footerY);
        rctx.lineTo(reportWidth - 24, footerY);
        rctx.stroke();

        // Active Trace Legend Badges
        const activeTraces = [];
        activeTraces.push({ name: 'LIVE SPECTRUM', color: primaryColor });
        const traceLabels = ['TRACE A', 'TRACE B', 'TRACE C', 'TRACE D'];
        const traceColors = ['#00FFFF', '#FF00FF', '#FFE600', '#00FF66'];
        for (let i = 0; i < 4; i++) {
            if (snapshots && snapshots[i] && snapshots[i].visible !== false && isSnapshotSlotUnlocked(i)) {
                activeTraces.push({ name: traceLabels[i], color: snapshots[i].color || traceColors[i] });
            }
        }

        let curBadgeX = 24;
        rctx.textAlign = 'left';
        rctx.textBaseline = 'middle';
        activeTraces.forEach(tr => {
            rctx.fillStyle = tr.color;
            rctx.fillRect(curBadgeX, footerY + 16, 12, 12);
            rctx.strokeStyle = isLight ? '#00000022' : '#ffffff44';
            rctx.strokeRect(curBadgeX, footerY + 16, 12, 12);

            rctx.fillStyle = textColor;
            rctx.font = "bold 11px 'Space Grotesk', monospace";
            rctx.fillText(tr.name, curBadgeX + 18, footerY + 22);

            const badgeWidth = rctx.measureText(tr.name).width + 36;
            curBadgeX += badgeWidth;
        });

        // Right Branding Note
        rctx.textAlign = 'right';
        rctx.fillStyle = textMuted;
        rctx.font = "11px 'Space Grotesk', monospace";
        rctx.fillText("SoundEngg Acoustic Measurement Suite // soundengg.com", reportWidth - 24, footerY + 22);

        // 5. Synchronous PNG DataURL + Blob Extraction (preserves user gesture activation on iOS/Android)
        const pad = n => String(n).padStart(2, '0');
        const fileDate = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const fileName = `SoundEngg_Spectrum_Report_${fileDate}.png`;

        const dataUrl = reportCanvas.toDataURL('image/png');
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        const blob = base64Data ? base64ToBlob(base64Data, 'image/png') : null;

        shareOrSaveExport(
            blob,
            base64Data,
            fileName,
            'image/png',
            'SoundEngg Spectrum Report',
            `SoundEngg Acoustic Spectrum Report - ${now.toLocaleDateString()}`,
            btnEl || document.getElementById('btn-rta-export-png'),
            { isIOSPlatform, getAudioSessionPlugin }
        );
    }

    function buildAndExportSpectrumCsv(state, btnEl) {
        const {
            currentMode,
            currentWeighting,
            averagingFactor,
            calibrationOffset,
            currentOctaveFreqs,
            currentRtaLevels,
            snapshots,
            isSnapshotSlotUnlocked,
            audioCtx,
            analyser,
            bufferLength,
            dataArray,
            getIECWeighting,
            getTiltOffset,
            isIOSPlatform,
            getAudioSessionPlugin
        } = state;

        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const fileDate = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const fileName = `SoundEngg_Spectrum_Data_${fileDate}.csv`;

        const speedLabel = (averagingFactor <= 2 ? 'FAST' : averagingFactor < 7 ? 'SLOW' : 'INFINITE');
        const lines = [];
        lines.push("# SOUNDENGG ACOUSTIC MEASUREMENT DATA EXPORT");
        lines.push(`# Date: ${now.toISOString()}`);
        lines.push(`# Mode: ${currentMode.toUpperCase()}`);
        lines.push(`# Weighting: ${currentWeighting.toUpperCase()}-WEIGHT`);
        lines.push(`# Averaging: ${speedLabel}`);
        lines.push(`# Calibration Offset: ${calibrationOffset} dB SPL`);
        
        const snapNames = ['Trace_A_dBFS', 'Trace_B_dBFS', 'Trace_C_dBFS', 'Trace_D_dBFS'];

        if (currentMode === 'rta') {
            lines.push(`Frequency_Hz,Band_Index,Live_dBFS,SPL_Calibrated_dB,${snapNames.join(',')}`);
            const freqs = currentOctaveFreqs || window.ISO_1_3_FREQS;
            for (let i = 0; i < freqs.length; i++) {
                const f = freqs[i];
                const liveDb = (currentRtaLevels && currentRtaLevels[i] !== undefined && currentRtaLevels[i] > -120) ? 
                    currentRtaLevels[i].toFixed(1) : '-100.0';
                const spl = (parseFloat(liveDb) + calibrationOffset).toFixed(1);
                
                const snapVals = [0, 1, 2, 3].map(sIdx => {
                    const snap = snapshots && snapshots[sIdx];
                    if (snap && snap.rta && snap.rta[i] !== undefined && isSnapshotSlotUnlocked(sIdx)) {
                        return snap.rta[i].toFixed(1);
                    }
                    return '';
                });

                lines.push(`${f},${i+1},${liveDb},${spl},${snapVals.join(',')}`);
            }
        } else if (currentMode === 'tf') {
            const tf = window.TransferFunctionEngine;
            lines.push("Frequency_Hz,Magnitude_dB,Phase_Deg,Coherence_Pct");
            const tfFreqs = tf && (tf.freqs || tf.frequencies);
            if (tf && tfFreqs) {
                const mag = tf.smoothingFraction > 0 ? tf.magnitudeSmoothed : tf.magnitude;
                const phase = tf.smoothingFraction > 0 ? tf.phaseSmoothed : tf.phase;
                for (let i = 0; i < tfFreqs.length; i++) {
                    const f = tfFreqs[i].toFixed(1);
                    const m = (mag && mag[i] !== undefined) ? mag[i].toFixed(2) : '0.00';
                    const p = (phase && phase[i] !== undefined) ? phase[i].toFixed(1) : '0.0';
                    const c = (tf.coherence && tf.coherence[i] !== undefined) ? Math.round(tf.coherence[i] * 100) : '100';
                    lines.push(`${f},${m},${p},${c}`);
                }
            }
        } else {
            // FFT Curve
            lines.push(`Frequency_Hz,Live_dBFS,SPL_Calibrated_dB,${snapNames.join(',')}`);
            const sampleRate = audioCtx ? audioCtx.sampleRate : 48000;
            const fftSize = analyser ? analyser.fftSize : 2048;
            const binCount = bufferLength || (fftSize / 2);
            for (let b = 1; b < binCount; b++) {
                const freqNum = (b * sampleRate) / fftSize;
                if (freqNum < 20 || freqNum > 20000) continue;
                const f = freqNum.toFixed(1);
                const rawDb = (dataArray && dataArray[b] !== undefined) ? dataArray[b] : -100.0;
                const weightedDb = rawDb + getIECWeighting(freqNum, currentWeighting) + getTiltOffset(freqNum);
                const liveDb = weightedDb.toFixed(1);
                const spl = (weightedDb + calibrationOffset).toFixed(1);

                const snapVals = [0, 1, 2, 3].map(sIdx => {
                    const snap = snapshots && snapshots[sIdx];
                    if (snap && snap.fft && snap.fft[b] !== undefined && isSnapshotSlotUnlocked(sIdx)) {
                        return snap.fft[b].toFixed(1);
                    }
                    return '';
                });

                lines.push(`${f},${liveDb},${spl},${snapVals.join(',')}`);
            }
        }

        const csvContent = lines.join('\r\n');
        const utf8Bytes = new TextEncoder().encode(csvContent);
        const base64Data = uint8ArrayToBase64(utf8Bytes);
        const blob = new Blob([utf8Bytes], { type: 'text/csv;charset=utf-8;' });

        shareOrSaveExport(
            blob,
            base64Data,
            fileName,
            'text/csv',
            'SoundEngg Spectrum Data (CSV)',
            `SoundEngg Measurement Data - ${now.toLocaleDateString()}`,
            btnEl || document.getElementById('btn-rta-export-csv'),
            { isIOSPlatform, getAudioSessionPlugin }
        );
    }

    window.RtaDataExport = {
        getNativeAudioExportPlugin,
        uint8ArrayToBase64,
        base64ToBlob,
        shareOrSaveExport,
        buildAndExportSpectrumPng,
        buildAndExportSpectrumCsv
    };
})();
