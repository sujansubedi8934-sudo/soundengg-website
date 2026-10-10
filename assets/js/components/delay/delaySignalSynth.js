// ==========================================================================
// DELAY CALCULATOR — BROADBAND MICRO-CHIRP SYNTHESIS & WAV EXPORTER MODULE
// ==========================================================================
// Extracted from delayCalc.js for clean modularity with zero behavior changes.

(function () {
    // Synthesize a single 7.5ms Broadband Micro-Chirp Pulse (800 Hz -> 6000 Hz) for Pulse-Compression & GCC-PHAT
    function synthesizeChirpPulseSample(i, sampleRate) {
        const durationSec = 0.0075; // 7.5ms broadband micro-chirp
        const pulseSamples = Math.round(durationSec * sampleRate);
        if (i < 0 || i >= pulseSamples) return 0;

        const t = i / sampleRate;
        const f0 = 800;  // 800 Hz start
        const f1 = 6000; // 6000 Hz end (5.2 kHz bandwidth -> 0.19ms compressed impulse width)
        const kSweep = (f1 - f0) / durationSec;

        // Smooth raised-cosine attack (0.35ms) + gentle exponential/Tukey decay to avoid speaker click distortion
        const attackSamples = Math.max(4, Math.round(0.00035 * sampleRate));
        const tailSamples = Math.max(16, Math.round(0.0012 * sampleRate));
        let env = 1.0;
        if (i < attackSamples) {
            env = 0.5 * (1.0 - Math.cos(Math.PI * (i / attackSamples)));
        } else if (i > pulseSamples - tailSamples) {
            const rem = (pulseSamples - i) / tailSamples;
            env = 0.5 * (1.0 - Math.cos(Math.PI * rem));
        }
        // Subtle exponential energy focus toward the leading edge
        const expFocus = Math.exp(-t / 0.0055);

        // Instantaneous phase of linear FM chirp: 2*pi*(f0*t + 0.5*k*t^2)
        const phaseChirp = 2 * Math.PI * (f0 * t + 0.5 * kSweep * t * t);
        // Blend 78% broadband FM chirp + 22% 1.5kHz/3kHz transient core for crisp audible studio click
        const coreEnv = Math.exp(-t / 0.0016);
        const wave = 0.78 * Math.sin(phaseChirp) * expFocus +
                     0.22 * (0.82 * Math.sin(2 * Math.PI * 1500 * t) + 0.18 * Math.sin(2 * Math.PI * 3000 * t)) * coreEnv;

        return env * wave;
    }

    function buildLoopAudioBuffer(ctx) {
        // 60 BPM = exactly 1 broadband micro-chirp pulse every 1.0 second
        const sampleRate = ctx.sampleRate;
        const durationSec = 1.0;
        const totalSamples = Math.round(sampleRate * durationSec);
        const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
        const channelData = buffer.getChannelData(0);

        const peakAmp = 0.891; // -1.0 dBFS
        const pulseSamples = Math.round(0.0075 * sampleRate);

        for (let i = 0; i < pulseSamples; i++) {
            channelData[i] = peakAmp * synthesizeChirpPulseSample(i, sampleRate);
        }
        return buffer;
    }

    // In-memory 16-bit 48kHz Broadcast WAV Generator for 100% Offline Universal Export
    function generateAlignmentWavBlob() {
        const sampleRate = 48000;
        const durationSec = 15; // 15 seconds (15 broadband micro-chirp pulses at 60 BPM)
        const totalSamples = sampleRate * durationSec;
        const samples = new Float32Array(totalSamples);
        const peakAmp = 0.891;
        const pulseIntervalSec = 1.0;
        const numPulses = Math.floor(durationSec / pulseIntervalSec);
        const pulseSamples = Math.round(0.0075 * sampleRate);

        for (let p = 0; p < numPulses; p++) {
            const startSample = Math.round((0.5 + p * pulseIntervalSec) * sampleRate);
            for (let i = 0; i < pulseSamples; i++) {
                const idx = startSample + i;
                if (idx < totalSamples) {
                    samples[idx] = peakAmp * synthesizeChirpPulseSample(i, sampleRate);
                }
            }
        }

        const bytesPerSample = 2;
        const channels = 1;
        const blockAlign = channels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = totalSamples * bytesPerSample;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46); // 'RIFF'
        view.setUint32(4, 36 + dataSize, true);
        view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45); // 'WAVE'
        view.setUint8(12, 0x66); view.setUint8(13, 0x6D); view.setUint8(14, 0x74); view.setUint8(15, 0x20); // 'fmt '
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true); // 16-bit
        view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61); // 'data'
        view.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < totalSamples; i++) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, Math.round(s * 32767), true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    // Universal Download & Export Handler (iOS UIActivityViewController, Android MediaStore, Web Share, Blob Download)
    async function exportAlignmentWavFile({ textDownloadAlignment, iconDownloadAlignment } = {}) {
        const fileName = 'soundengg-delay-alignment-click-48k.wav';
        const localPath = `assets/audio/${fileName}`;

        const originalText = textDownloadAlignment ? textDownloadAlignment.textContent : 'DOWNLOAD .WAV (1.5MB)';
        if (textDownloadAlignment) textDownloadAlignment.textContent = 'PREPARING...';
        if (iconDownloadAlignment) iconDownloadAlignment.textContent = 'hourglass_empty';

        try {
            // 1. Obtain Blob (try packaged local file first, then synthesized buffer)
            let blob = null;
            try {
                const res = await fetch(localPath);
                if (res.ok) {
                    blob = await res.blob();
                }
            } catch (fetchErr) {
                console.warn('Local asset fetch fallback to generator:', fetchErr);
            }

            if (!blob) {
                blob = generateAlignmentWavBlob();
            }

            const isNative = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || (window.Capacitor !== undefined && window.Capacitor.platform !== 'web'));

            // 2. Convert Blob to Base64 for native offline saving/sharing
            let base64Data = null;
            try {
                base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const res = reader.result;
                        if (typeof res === 'string') {
                            resolve(res.split(',')[1]);
                        } else {
                            resolve(null);
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (convErr) {
                console.warn('Base64 conversion failed:', convErr);
            }

            // 3. Native Android / iOS Offline Plugin Exporters
            if (isNative && base64Data) {
                const platform = window.Capacitor?.getPlatform ? window.Capacitor.getPlatform() : (window.Capacitor?.platform || 'web');
                const isIos = platform === 'ios';

                const NativeAudioExport = window._cachedNativeAudioExportPlugin || window.Capacitor?.Plugins?.NativeAudioExport || (window.Capacitor?.registerPlugin ? (window._cachedNativeAudioExportPlugin = window.Capacitor.registerPlugin('NativeAudioExport')) : null);
                const AudioPlugin = window._cachedAudioSessionPlugin || window.Capacitor?.Plugins?.AudioSessionPlugin || (window.Capacitor?.registerPlugin ? (window._cachedAudioSessionPlugin = window.Capacitor.registerPlugin('AudioSessionPlugin')) : null);

                if (isIos) {
                    // iOS / iPad: Present native UIActivityViewController with "Save to Files" / AirDrop
                    let shared = false;
                    if (NativeAudioExport && typeof NativeAudioExport.shareWavFile === 'function') {
                        try {
                            await NativeAudioExport.shareWavFile({
                                fileName: fileName,
                                base64Data: base64Data,
                                title: 'SoundEngg Delay Alignment Pulse'
                            });
                            shared = true;
                        } catch (e) {
                            console.warn('NativeAudioExport.shareWavFile error on iOS:', e);
                        }
                    }

                    if (!shared && AudioPlugin && typeof AudioPlugin.shareWavFile === 'function') {
                        try {
                            await AudioPlugin.shareWavFile({
                                fileName: fileName,
                                base64Data: base64Data
                            });
                            shared = true;
                        } catch (e) {
                            console.warn('AudioPlugin.shareWavFile error on iOS:', e);
                        }
                    }

                    if (shared) {
                        if (typeof window.showSoundEnggToast === 'function') {
                            window.showSoundEnggToast('Tap "Save to Files" or AirDrop to export WAV');
                        }
                        return;
                    }
                } else {
                    // Android: MediaStore direct save to Downloads/SoundEngg/ & Quick Share
                    if (NativeAudioExport && typeof NativeAudioExport.saveWavToDownloads === 'function') {
                        try {
                            const saveRes = await NativeAudioExport.saveWavToDownloads({
                                fileName: fileName,
                                base64Data: base64Data,
                                mimeType: 'audio/wav'
                            });
                            console.log('Saved to Downloads successfully:', saveRes);
                            if (typeof window.showSoundEnggToast === 'function') {
                                window.showSoundEnggToast('✓ Saved to Downloads/SoundEngg/' + fileName);
                            }
                            if (typeof NativeAudioExport.shareWavFile === 'function') {
                                setTimeout(() => {
                                    NativeAudioExport.shareWavFile({
                                        fileName: fileName,
                                        base64Data: base64Data,
                                        title: 'SoundEngg Delay Alignment Pulse'
                                    }).catch(e => console.warn(e));
                                }, 500);
                            }
                            return;
                        } catch (nativeSaveErr) {
                            console.warn('NativeAudioExport.saveWavToDownloads failed, trying shareWavFile:', nativeSaveErr);
                            if (typeof NativeAudioExport.shareWavFile === 'function') {
                                await NativeAudioExport.shareWavFile({
                                    fileName: fileName,
                                    base64Data: base64Data,
                                    title: 'SoundEngg Delay Alignment Pulse'
                                });
                                return;
                            }
                        }
                    }
                }

                // Inside native app, do not fall through to silently-ignored <a download>
                if (typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast('Export failed. Please check device permissions.');
                }
                return;
            }

            // 4. Web Share API (Mobile Safari / Chrome Web Browsers)
            if (blob && typeof navigator !== 'undefined' && navigator.canShare) {
                try {
                    const file = new File([blob], fileName, { type: 'audio/wav' });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'SoundEngg Delay Alignment Pulse (60 BPM)',
                            text: 'Universal 16-bit 48kHz Broadcast WAV calibrated alignment pulse for digital console USB playback.',
                            files: [file]
                        });
                        return;
                    }
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') return;
                    console.warn('Web Share API error, falling back:', shareErr);
                }
            }

            // 5. Desktop & Web Browser standard Blob download (PC / Mac Web Browsers)
            if (blob) {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                }, 1500);
                if (typeof window.showSoundEnggToast === 'function') {
                    window.showSoundEnggToast('✓ Downloaded ' + fileName);
                }
            }
        } catch (err) {
            console.error('Download alignment WAV failed:', err);
            if (typeof window.showSoundEnggToast === 'function') {
                window.showSoundEnggToast('Export failed. Please check device permissions.');
            }
        } finally {
            if (textDownloadAlignment) textDownloadAlignment.textContent = originalText;
            if (iconDownloadAlignment) iconDownloadAlignment.textContent = 'download';
        }
    }

    window.DelaySignalSynth = {
        synthesizeChirpPulseSample,
        buildLoopAudioBuffer,
        generateAlignmentWavBlob,
        exportAlignmentWavFile
    };
})();
