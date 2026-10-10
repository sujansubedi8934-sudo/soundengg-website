/**
 * SoundEngg Dual-Channel FFT Transfer Function Engine
 * Focusrite 2i2, Audient EVO 4, MOTU, Behringer UMC, and USB Audio Class Support
 * Computes:
 * - Time Delay (GCC-PHAT Cross-Correlation Impulse Response)
 * - Transfer Function H1(f) (Magnitude in dB)
 * - Phase Response ∠H1(f) (-180° to +180°)
 * - Coherence Function γ²(f) (0% to 100%)
 * - Fractional Octave Smoothing (1/1, 1/3, 1/6, 1/12, 1/24)
 */

(function(window) {
    'use strict';

    const TF_FFT_SIZE = 4096;
    const CIRCULAR_BUFFER_LEN = 96000; // 2.0 seconds at 48kHz

    // --- State Object ---
    const TransferFunction = {
        isInitialized: false,
        isRunning: false,
        isStarting: false,
        audioCtx: null,
        stream: null,
        sourceNode: null,
        splitterNode: null,
        processorNode: null,
        mergerNode: null,
        generatorGainNode: null,
        audioSessionConfigured: false,
        lastStartErrorTime: 0,

        // Channel Assignment Routing
        measChannel: 0, // 0 = In 1 (Left), 1 = In 2 (Right)
        refChannel: 1,  // 1 = In 2 (Right), 0 = In 1 (Left)
        measInvert: false,
        refInvert: false,
        measGainTrim: 1.0,
        refGainTrim: 1.0,

        // Live Audio Metering
        measPeakDbfs: -100,
        refPeakDbfs: -100,
        measRmsDbfs: -100,
        refRmsDbfs: -100,
        hasTwoChannels: false,
        isVirtualLoopback: true,
        isSharedStream: false,
        hasValidReference: false,

        // Hardware Device Details
        deviceName: 'Default Audio Input',
        isUsbHardware: false,
        sampleRate: 48000,

        // Reference Delay Compensation
        refDelaySamples: 0,
        refDelayMs: 0.0,
        refCircularBuffer: new Float32Array(CIRCULAR_BUFFER_LEN),
        refWriteIdx: 0,
        temperatureC: (typeof window.globalTempC === 'number') ? window.globalTempC : 22.0,
        autoTrackingDelay: false,

        // Internal Signal Generator
        generatorActive: false,
        generatorType: 'pink', // 'pink', 'sine', 'sweep'
        generatorRouting: 'both', // 'left', 'right', 'both'
        generatorLevelDbfs: -18.0,
        generatorSourceNode: null,

        // DSP Settings
        averagingFrames: 8,
        coherenceBlanking: true,
        coherenceThreshold: 0.50, // 50% threshold
        phaseWrap: true,
        smoothingFraction: 6, // 1/6th octave default

        // Output Display Data
        freqs: new Float32Array(TF_FFT_SIZE / 2),
        magnitude: new Float32Array(TF_FFT_SIZE / 2).fill(0),
        magnitudeSmoothed: new Float32Array(TF_FFT_SIZE / 2).fill(0),
        phase: new Float32Array(TF_FFT_SIZE / 2).fill(0),
        phaseSmoothed: new Float32Array(TF_FFT_SIZE / 2).fill(0),
        coherence: new Float32Array(TF_FFT_SIZE / 2).fill(0),
        measSpectrumDb: new Float32Array(TF_FFT_SIZE / 2).fill(-100),
        refSpectrumDb: new Float32Array(TF_FFT_SIZE / 2).fill(-100),
        measSpectrumSmoothed: new Float32Array(TF_FFT_SIZE / 2).fill(-100),
        refSpectrumSmoothed: new Float32Array(TF_FFT_SIZE / 2).fill(-100),
        showRtaOverlay: true,
        virtualRefActive: false,
        impulseResponse: new Float32Array(TF_FFT_SIZE),
        peakDelayMs: null,
        peakDelayValid: false,
        pnrDb: 0.0,
        peakDistanceM: 0.0,
        peakDistanceFt: 0.0,
        peakCoherence: 0.0
    };

    // --- Internal DSP Buffers ---
    let windowTable = null;
    let cosTable = null;
    let sinTable = null;
    let bitRevTable = null;

    // Running Cross-Spectral Accumulators
    let avgSxx = null;
    let avgSyy = null;
    let avgSxyReal = null;
    let avgSxyImag = null;
    let avgCount = 0;

    // Time-domain buffers for analysis
    let rawMeasBuffer = new Float32Array(TF_FFT_SIZE);
    let rawRefBuffer = new Float32Array(TF_FFT_SIZE);
    let delayedRefBuffer = new Float32Array(TF_FFT_SIZE);

    // Virtual Loopback Ring Buffer for Internal Pink Noise Synchronization
    const VIRTUAL_REF_BUF_LEN = CIRCULAR_BUFFER_LEN; // 96000 samples
    const virtualRefRing = new Float32Array(VIRTUAL_REF_BUF_LEN);
    let virtualRefWritePtr = 0;
    let virtualRefAvailableSamples = 0;
    const tempVirtualRefBlock = new Float32Array(TF_FFT_SIZE);

    // FFT scratchpads
    let fftReal = new Float32Array(TF_FFT_SIZE);
    let fftImag = new Float32Array(TF_FFT_SIZE);
    let refFftReal = new Float32Array(TF_FFT_SIZE);
    let refFftImag = new Float32Array(TF_FFT_SIZE);
    let measFftReal = new Float32Array(TF_FFT_SIZE);
    let measFftImag = new Float32Array(TF_FFT_SIZE);

    // --- Precompute Math Tables ---
    function initMathTables(N) {
        windowTable = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            // Hann window
            windowTable[i] = 0.5 * (1.0 - Math.cos((2.0 * Math.PI * i) / (N - 1)));
        }

        cosTable = new Float32Array(N / 2);
        sinTable = new Float32Array(N / 2);
        for (let i = 0; i < N / 2; i++) {
            cosTable[i] = Math.cos((-2.0 * Math.PI * i) / N);
            sinTable[i] = Math.sin((-2.0 * Math.PI * i) / N);
        }

        bitRevTable = new Uint16Array(N);
        const bits = Math.round(Math.log2(N));
        for (let i = 0; i < N; i++) {
            let rev = 0;
            for (let j = 0; j < bits; j++) {
                if ((i >> j) & 1) rev |= (1 << (bits - 1 - j));
            }
            bitRevTable[i] = rev;
        }

        avgSxx = new Float32Array(N / 2);
        avgSyy = new Float32Array(N / 2);
        avgSxyReal = new Float32Array(N / 2);
        avgSxyImag = new Float32Array(N / 2);

        // Precompute frequency bins
        const binHz = TransferFunction.sampleRate / N;
        for (let k = 0; k < N / 2; k++) {
            TransferFunction.freqs[k] = k * binHz;
        }
    }

    // --- Fast In-Place Real FFT ---
    function computeFFT(realIn, imagIn, outReal, outImag, N) {
        for (let i = 0; i < N; i++) {
            const rev = bitRevTable[i];
            outReal[i] = realIn[rev];
            outImag[i] = imagIn[rev];
        }

        for (let halfSize = 1; halfSize < N; halfSize *= 2) {
            const step = halfSize * 2;
            const kStep = (N / 2) / halfSize;
            for (let i = 0; i < N; i += step) {
                for (let j = 0; j < halfSize; j++) {
                    const k = j * kStep;
                    const c = cosTable[k];
                    const s = sinTable[k];
                    const tr = c * outReal[i + j + halfSize] - s * outImag[i + j + halfSize];
                    const ti = s * outReal[i + j + halfSize] + c * outImag[i + j + halfSize];
                    outReal[i + j + halfSize] = outReal[i + j] - tr;
                    outImag[i + j + halfSize] = outImag[i + j] - ti;
                    outReal[i + j] += tr;
                    outImag[i + j] += ti;
                }
            }
        }
    }

    // --- Fast Inverse FFT for Impulse Response ---
    function computeIFFT(inReal, inImag, outTime, N) {
        // IFFT via conjugate trick: IFFT(X) = (1/N) * conj(FFT(conj(X)))
        for (let i = 0; i < N; i++) {
            fftReal[i] = inReal[i];
            fftImag[i] = -inImag[i]; // conjugate
        }
        computeFFT(fftReal, fftImag, outTime, fftImag, N);
        const invN = 1.0 / N;
        for (let i = 0; i < N; i++) {
            outTime[i] = outTime[i] * invN;
        }
    }

    // --- Speed of Sound Calculator ---
    function getSpeedOfSound(tempC) {
        return 331.3 * Math.sqrt(1.0 + (tempC / 273.15));
    }

    // --- Hardware Query Helper (iOS & Android Bridge with Cache) ---
    let cachedHardwareDetails = null;
    let lastHardwareQueryTime = 0;

    async function queryNativeAudioHardware(force = false) {
        const now = Date.now();
        if (!force && cachedHardwareDetails && (now - lastHardwareQueryTime < 4000)) {
            return cachedHardwareDetails;
        }
        try {
            const plugin = window.Capacitor?.registerPlugin ? 
                window.Capacitor.registerPlugin('AudioSessionPlugin') : 
                window.Capacitor?.Plugins?.AudioSessionPlugin;
            
            if (plugin && typeof plugin.getAudioDeviceDetails === 'function') {
                const details = await plugin.getAudioDeviceDetails();
                if (details && details.success) {
                    cachedHardwareDetails = details;
                    lastHardwareQueryTime = now;
                    TransferFunction.isUsbHardware = !!details.isUsbDevice;
                    TransferFunction.deviceName = details.deviceName || 'USB Audio Device';
                    TransferFunction.hasTwoChannels = (details.maxInputChannels >= 2);
                    if (details.sampleRate && details.sampleRate > 0) {
                        TransferFunction.sampleRate = details.sampleRate;
                    }
                    return details;
                }
            }
        } catch (e) {
            console.warn('Native AudioSessionPlugin device query fallback:', e);
        }
        return null;
    }

    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
        navigator.mediaDevices.addEventListener('devicechange', () => {
            cachedHardwareDetails = null;
        });
    }

    // --- Start Dual-Channel Transfer Function Engine ---
    TransferFunction.start = async function(deviceId) {
        if (this.isRunning || this.isStarting) return;
        this.isStarting = true;
        try {
            const activeDeviceId = deviceId || (window.safeStorage ? window.safeStorage.getItem('soundengg-mic-id') : null);

            // Configure native audio session on iOS/Android (lock to external USB interface)
            try {
                const plugin = window.Capacitor?.registerPlugin ? 
                    window.Capacitor.registerPlugin('AudioSessionPlugin') : 
                    window.Capacitor?.Plugins?.AudioSessionPlugin;
                if (plugin) {
                    if (typeof plugin.setPreferredInputDevice === 'function') {
                        await plugin.setPreferredInputDevice({
                            deviceId: activeDeviceId || '',
                            deviceName: ''
                        });
                        this.audioSessionConfigured = true;
                    } else if (typeof plugin.configureAudioSession === 'function' && !this.audioSessionConfigured) {
                        await plugin.configureAudioSession();
                        this.audioSessionConfigured = true;
                    }
                }
            } catch (err) {
                console.warn('setPreferredInputDevice error in TF:', err);
            }

        // Query connected USB interface details
        await queryNativeAudioHardware();

        // Reuse active AudioContext & stream from RTA pipeline to eliminate competing contexts on iOS/WebKit
        const pipeline = (typeof window.getRtaAudioPipeline === 'function') ? window.getRtaAudioPipeline() : null;
        let reusedPipeline = false;

        if (pipeline && pipeline.audioCtx && pipeline.audioCtx.state !== 'closed') {
            this.audioCtx = pipeline.audioCtx;
            if (this.audioCtx.state === 'suspended') {
                try { await this.audioCtx.resume(); } catch (e) {}
            }
            this.sampleRate = this.audioCtx.sampleRate || 48000;

            if (pipeline.stream && pipeline.stream.active && (!activeDeviceId || activeDeviceId === 'default' || pipeline.activeInputDevice?.deviceId === activeDeviceId)) {
                this.stream = pipeline.stream;
                this.isSharedStream = true;
                reusedPipeline = true;
            }
        }

        // Fallback AudioContext initialization
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
            this.audioCtx = new AudioContextClass({
                sampleRate: 48000,
                latencyHint: 'interactive'
            });
        }
        if (this.audioCtx.state === 'suspended') {
            try { await this.audioCtx.resume(); } catch (e) {}
        }
        this.sampleRate = this.audioCtx.sampleRate || 48000;

        initMathTables(TF_FFT_SIZE);

        if (!this.stream || !this.stream.active) {
            this.isSharedStream = false;
            // Request 2-channel stereo stream without voice processing
            const constraints = {
                audio: {
                    deviceId: (activeDeviceId && activeDeviceId !== 'default') ? { exact: activeDeviceId } : undefined,
                    channelCount: { ideal: 2, min: 1 },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: { ideal: 48000 }
                }
            };

            try {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn('Stereo constraint fallback to default audio input:', err);
                const fallbackConstraint = (activeDeviceId && activeDeviceId !== 'default') ? 
                    { audio: { deviceId: { exact: activeDeviceId } } } : { audio: true };
                this.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraint);
            }
        }

        const audioTracks = this.stream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
            const settings = audioTracks[0].getSettings();
            if (settings.channelCount) {
                this.hasTwoChannels = (settings.channelCount >= 2);
            }
            if (this.hasTwoChannels) {
                this.isVirtualLoopback = false;
            } else {
                this.isVirtualLoopback = true;
            }
            if (audioTracks[0].label) {
                this.deviceName = audioTracks[0].label;
                if (/focusrite|scarlett|evo|motu|presonus|behringer|umc|audiobox/i.test(this.deviceName)) {
                    this.isUsbHardware = true;
                }
            }
        }

        if (reusedPipeline && pipeline.micGainTrimNode) {
            this.sourceNode = pipeline.micGainTrimNode;
        } else {
            this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);
        }
        this.splitterNode = this.audioCtx.createChannelSplitter(2);
        this.mergerNode = this.audioCtx.createChannelMerger(2);
        this.sourceNode.connect(this.splitterNode);

        // Route channels into ChannelMergerNode
        this.splitterNode.connect(this.mergerNode, 0, 0); // Ch 0 -> Merger In 0
        if (this.hasTwoChannels) {
            this.splitterNode.connect(this.mergerNode, 1, 1); // Ch 1 -> Merger In 1
        } else {
            // For mono / built-in mic, clone Ch 0 to Merger In 1
            this.splitterNode.connect(this.mergerNode, 0, 1);
        }

        // 2-channel ScriptProcessor for real-time dual stream DSP
        this.processorNode = this.audioCtx.createScriptProcessor(TF_FFT_SIZE, 2, 2);
        this.mergerNode.connect(this.processorNode);

        // Connect processor to destination via silent gain to keep it alive
        const silentGain = this.audioCtx.createGain();
        silentGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
        this.processorNode.connect(silentGain);
        silentGain.connect(this.audioCtx.destination);

        let writeBlockIdx = 0;

        this.processorNode.onaudioprocess = (e) => {
            if (!this.isRunning) return;

            const inCh0 = e.inputBuffer.getChannelData(0);
            const inCh1 = (e.inputBuffer.numberOfChannels > 1) ? e.inputBuffer.getChannelData(1) : inCh0;
            const N = inCh0.length;

            // Route physical channels based on user configuration
            let rawMeas = (this.measChannel === 0) ? inCh0 : inCh1;
            let rawRef = null;
            let hasValidRef = false;

            // Virtual Loopback: Use live synchronized Pink Noise if active on 1-channel or virtual mode
            if (this.isVirtualLoopback || !this.hasTwoChannels) {
                if (this.virtualRefActive && virtualRefAvailableSamples >= N) {
                    const readPos = (virtualRefWritePtr - N + VIRTUAL_REF_BUF_LEN) % VIRTUAL_REF_BUF_LEN;
                    for (let i = 0; i < N; i++) {
                        tempVirtualRefBlock[i] = virtualRefRing[(readPos + i) % VIRTUAL_REF_BUF_LEN];
                    }
                    rawRef = tempVirtualRefBlock;
                    hasValidRef = true;
                } else if (this.generatorActive) {
                    rawRef = this.getSynthesizedReferenceChunk(rawMeas.length);
                    hasValidRef = true;
                } else {
                    // Pink Noise is inactive on 1-channel/built-in mic: DO NOT self-reference to 0 dB flatline!
                    rawRef = null;
                    hasValidRef = false;
                }
            } else {
                rawRef = (this.refChannel === 1) ? inCh1 : inCh0;
            }

            // Polarity inversion & Gain trim
            const mPol = this.measInvert ? -1.0 : 1.0;
            const rPol = this.refInvert ? -1.0 : 1.0;
            const mTrim = this.measGainTrim * mPol;
            const rTrim = this.refGainTrim * rPol;

            let mPeak = 0, rPeak = 0;
            let mSumSq = 0, rSumSq = 0;

            for (let i = 0; i < N; i++) {
                const sm = rawMeas[i] * mTrim;
                const sr = rawRef ? (rawRef[i] * rTrim) : 0;
                rawMeasBuffer[i] = sm;
                rawRefBuffer[i] = sr;

                const absM = Math.abs(sm);
                const absR = Math.abs(sr);
                if (absM > mPeak) mPeak = absM;
                if (absR > rPeak) rPeak = absR;
                mSumSq += sm * sm;
                rSumSq += sr * sr;
            }

            // Meter calculations (dBFS)
            this.measPeakDbfs = mPeak > 0.00001 ? 20 * Math.log10(mPeak) : -100;
            this.refPeakDbfs = rPeak > 0.00001 ? 20 * Math.log10(rPeak) : -100;
            this.measRmsDbfs = mSumSq > 0.00001 ? 10 * Math.log10(mSumSq / N) : -100;
            this.refRmsDbfs = rSumSq > 0.00001 ? 10 * Math.log10(rSumSq / N) : -100;

            // In 2-channel hardware mode, check if reference line feed has active signal
            if (!this.isVirtualLoopback && this.hasTwoChannels) {
                hasValidRef = (this.refPeakDbfs > -55.0);
            }

            this.hasValidReference = hasValidRef;

            if (!hasValidRef) {
                // Zero out coherence and blank peak delay locator
                this.coherence.fill(0);
                this.magnitude.fill(0);
                this.magnitudeSmoothed.fill(0);
                this.peakCoherence = 0.0;
                this.peakDelayValid = false;
                this.peakDelayMs = null;
                avgCount = 0;
                if (avgSxx) avgSxx.fill(0);
                if (avgSyy) avgSyy.fill(0);
                if (avgSxyReal) avgSxyReal.fill(0);
                if (avgSxyImag) avgSxyImag.fill(0);
                return;
            }

            // Write valid Reference to Circular Delay Buffer
            for (let i = 0; i < N; i++) {
                this.refCircularBuffer[this.refWriteIdx] = rawRefBuffer[i];
                this.refWriteIdx = (this.refWriteIdx + 1) % CIRCULAR_BUFFER_LEN;
            }

            // Retrieve Delay-Compensated Reference Block from Circular Buffer
            const delayOffset = Math.max(0, Math.min(CIRCULAR_BUFFER_LEN - TF_FFT_SIZE, Math.round(this.refDelaySamples)));
            for (let i = 0; i < N; i++) {
                let readPos = (this.refWriteIdx - N - delayOffset + i) % CIRCULAR_BUFFER_LEN;
                if (readPos < 0) readPos += CIRCULAR_BUFFER_LEN;
                delayedRefBuffer[i] = this.refCircularBuffer[readPos];
            }

            // Acoustic Pulse Detector Tap (PRO / Auto-Ping Locator)
            if (this.pulseDetection && this.pulseDetection.active) {
                this.recordPulseSamples(rawMeasBuffer, rawRefBuffer);
            }

            // Execute Transfer Function Cross-Spectral DSP
            processDualChannelFrame(rawMeasBuffer, rawRefBuffer, delayedRefBuffer);
        };

            this.isRunning = true;
            this.isInitialized = true;
        } catch (err) {
            console.error('Failed to start Transfer Function engine:', err);
            this.isRunning = false;
            this.lastStartErrorTime = Date.now();
        } finally {
            this.isStarting = false;
        }
    };

    // --- Stop Dual-Channel Engine ---
    TransferFunction.stop = function() {
        this.isRunning = false;
        this.isStarting = false;
        if (this.processorNode) {
            try { this.processorNode.disconnect(); } catch (e) {}
            this.processorNode.onaudioprocess = null;
        }
        if (this.mergerNode) {
            try { this.mergerNode.disconnect(); } catch (e) {}
            this.mergerNode = null;
        }
        if (this.splitterNode) {
            try { this.splitterNode.disconnect(); } catch (e) {}
            this.splitterNode = null;
        }
        if (this.sourceNode) {
            try { this.sourceNode.disconnect(); } catch (e) {}
            this.sourceNode = null;
        }
        if (this.stream && !this.isSharedStream) {
            try { this.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
            this.stream = null;
        } else if (this.isSharedStream) {
            this.stream = null;
        }
        this.isSharedStream = false;
        this.hasValidReference = false;
        this.stopGenerator();
    };

    // --- Transfer Function Mathematics (H1, Phase, Coherence, Delay) ---
    function processDualChannelFrame(measTime, rawRefTime, delayedRefTime) {
        const N = TF_FFT_SIZE;
        const halfN = N / 2;

        // 1. Compute Windowed FFTs
        // Reference (Delayed)
        for (let i = 0; i < N; i++) {
            fftReal[i] = delayedRefTime[i] * windowTable[i];
            fftImag[i] = 0.0;
        }
        computeFFT(fftReal, fftImag, refFftReal, refFftImag, N);

        // Measurement
        for (let i = 0; i < N; i++) {
            fftReal[i] = measTime[i] * windowTable[i];
            fftImag[i] = 0.0;
        }
        computeFFT(fftReal, fftImag, measFftReal, measFftImag, N);

        // 2. Accumulate Cross-Power and Auto-Power Spectra with Running Average
        const M = Math.max(1, TransferFunction.averagingFrames);
        const alpha = 1.0 / M;

        for (let k = 0; k < halfN; k++) {
            const xr = refFftReal[k], xi = refFftImag[k];
            const yr = measFftReal[k], yi = measFftImag[k];

            const pxx = xr * xr + xi * xi;
            const pyy = yr * yr + yi * yi;
            // Cross-spectrum: Sxy = Y * conj(X)
            const pxyR = yr * xr + yi * xi;
            const pxyI = yi * xr - yr * xi;

            if (avgCount === 0) {
                avgSxx[k] = pxx;
                avgSyy[k] = pyy;
                avgSxyReal[k] = pxyR;
                avgSxyImag[k] = pxyI;
            } else {
                avgSxx[k] = (1.0 - alpha) * avgSxx[k] + alpha * pxx;
                avgSyy[k] = (1.0 - alpha) * avgSyy[k] + alpha * pyy;
                avgSxyReal[k] = (1.0 - alpha) * avgSxyReal[k] + alpha * pxyR;
                avgSxyImag[k] = (1.0 - alpha) * avgSxyImag[k] + alpha * pxyI;
            }
        }
        if (avgCount < M) avgCount++;

        // 3. Compute H1 Estimator, Magnitude (dB), Phase (deg), and Coherence
        const eps = 1e-12;
        let sumCoh = 0;
        let validCohBins = 0;

        for (let k = 0; k < halfN; k++) {
            const sxx = avgSxx[k] + eps;
            const syy = avgSyy[k] + eps;
            const sxyR = avgSxyReal[k];
            const sxyI = avgSxyImag[k];

            // H1 Frequency Response: H1 = Sxy / Sxx
            const h1R = sxyR / sxx;
            const h1I = sxyI / sxx;
            const magSq = h1R * h1R + h1I * h1I;
            TransferFunction.magnitude[k] = 10.0 * Math.log10(magSq + eps);

            // Real-Time Dual Channel Auto-Power Spectrums (dBFS) for Live RTA Display
            TransferFunction.measSpectrumDb[k] = 10.0 * Math.log10(syy) - 66.22;
            TransferFunction.refSpectrumDb[k] = 10.0 * Math.log10(sxx) - 66.22;

            // Phase Angle in degrees: atan2(Im, Re)
            let deg = Math.atan2(h1I, h1R) * (180.0 / Math.PI);
            if (!TransferFunction.phaseWrap && k > 0) {
                // Optional unwrapped phase
                let diff = deg - TransferFunction.phase[k - 1];
                while (diff > 180) { deg -= 360; diff -= 360; }
                while (diff < -180) { deg += 360; diff += 360; }
            }
            TransferFunction.phase[k] = deg;

            // Coherence: γ² = |Sxy|² / (Sxx * Syy)
            const numCoh = sxyR * sxyR + sxyI * sxyI;
            const denCoh = sxx * syy;
            const cohVal = Math.max(0.0, Math.min(1.0, numCoh / denCoh));
            TransferFunction.coherence[k] = cohVal;

            if (k >= 10 && k <= halfN - 10) {
                sumCoh += cohVal;
                validCohBins++;
            }
        }
        TransferFunction.peakCoherence = validCohBins > 0 ? (sumCoh / validCohBins) : 1.0;

        // 4. Fractional Octave Smoothing (Complex Frequency Smoothing)
        applyComplexFractionalSmoothing(TransferFunction.smoothingFraction);

        // 5. Delay Locator (GCC-PHAT Cross-Correlation Impulse Response)
        computeDelayLocator(measTime, rawRefTime);
    }

    // --- Complex Fractional Octave Smoothing Engine ---
    function applyComplexFractionalSmoothing(fraction) {
        const halfN = TF_FFT_SIZE / 2;
        if (!fraction || fraction <= 0) {
            TransferFunction.magnitudeSmoothed.set(TransferFunction.magnitude);
            TransferFunction.phaseSmoothed.set(TransferFunction.phase);
            TransferFunction.measSpectrumSmoothed.set(TransferFunction.measSpectrumDb);
            TransferFunction.refSpectrumSmoothed.set(TransferFunction.refSpectrumDb);
            return;
        }

        const octWidth = 1.0 / fraction;
        const factor = Math.pow(2.0, octWidth / 2.0);

        for (let k = 1; k < halfN; k++) {
            const fCenter = TransferFunction.freqs[k];
            if (fCenter < 20) {
                TransferFunction.magnitudeSmoothed[k] = TransferFunction.magnitude[k];
                TransferFunction.phaseSmoothed[k] = TransferFunction.phase[k];
                TransferFunction.measSpectrumSmoothed[k] = TransferFunction.measSpectrumDb[k];
                TransferFunction.refSpectrumSmoothed[k] = TransferFunction.refSpectrumDb[k];
                continue;
            }
            const fLow = fCenter / factor;
            const fHigh = fCenter * factor;

            let kLow = Math.max(1, Math.round(fLow / (TransferFunction.sampleRate / TF_FFT_SIZE)));
            let kHigh = Math.min(halfN - 1, Math.round(fHigh / (TransferFunction.sampleRate / TF_FFT_SIZE)));
            if (kHigh < kLow) kHigh = kLow;

            let sumMag = 0;
            let sumSin = 0;
            let sumCos = 0;
            let sumMeas = 0;
            let sumRef = 0;
            let count = 0;

            for (let j = kLow; j <= kHigh; j++) {
                sumMag += TransferFunction.magnitude[j];
                const rad = TransferFunction.phase[j] * (Math.PI / 180.0);
                sumSin += Math.sin(rad);
                sumCos += Math.cos(rad);
                sumMeas += TransferFunction.measSpectrumDb[j];
                sumRef += TransferFunction.refSpectrumDb[j];
                count++;
            }

            TransferFunction.magnitudeSmoothed[k] = count > 0 ? (sumMag / count) : TransferFunction.magnitude[k];
            TransferFunction.phaseSmoothed[k] = count > 0 ? (Math.atan2(sumSin, sumCos) * (180.0 / Math.PI)) : TransferFunction.phase[k];
            TransferFunction.measSpectrumSmoothed[k] = count > 0 ? (sumMeas / count) : TransferFunction.measSpectrumDb[k];
            TransferFunction.refSpectrumSmoothed[k] = count > 0 ? (sumRef / count) : TransferFunction.refSpectrumDb[k];
        }
    }

    // --- Delay Locator (GCC-PHAT Impulse Response & Peak Finder) ---
    function computeDelayLocator(measTime, rawRefTime) {
        if (!TransferFunction.hasValidReference || !rawRefTime) {
            TransferFunction.peakDelayMs = null;
            TransferFunction.peakDelayValid = false;
            return;
        }

        // Gating: Must have active measurement microphone signal above room silence (-55 dBFS)
        if (TransferFunction.measPeakDbfs < -55.0) {
            TransferFunction.peakDelayMs = null;
            TransferFunction.peakDelayValid = false;
            return;
        }

        const N = TF_FFT_SIZE;
        // Compute un-delayed FFT of Reference
        for (let i = 0; i < N; i++) {
            fftReal[i] = rawRefTime[i] * windowTable[i];
            fftImag[i] = 0.0;
        }
        computeFFT(fftReal, fftImag, refFftReal, refFftImag, N);

        // Compute GCC-PHAT Normalized Cross-Spectrum
        const eps = 1e-9;
        const irReal = fftReal;
        const irImag = fftImag;

        for (let k = 0; k < N; k++) {
            const xr = refFftReal[k], xi = refFftImag[k];
            const yr = measFftReal[k], yi = measFftImag[k];

            // Cross-spectrum: Sxy = Y * conj(X)
            const cR = yr * xr + yi * xi;
            const cI = yi * xr - yr * xi;
            const mag = Math.sqrt(cR * cR + cI * cI) + eps;

            // Whitening (PHAT filter)
            irReal[k] = cR / mag;
            irImag[k] = cI / mag;
        }

        // IFFT to obtain time-domain Impulse Response
        computeIFFT(irReal, irImag, TransferFunction.impulseResponse, N);

        // Peak search in expanded causal range up to 85% of buffer (~72.5ms / 25m at 48k)
        let peakIdx = 0;
        let peakVal = 0;
        const searchMax = Math.round(N * 0.85);

        for (let i = 0; i < searchMax; i++) {
            const absVal = Math.abs(TransferFunction.impulseResponse[i]);
            if (absVal > peakVal) {
                peakVal = absVal;
                peakIdx = i;
            }
        }

        // If delay is already compensated, check negative residual delays [N - searchMax/2, N - 1]
        if (TransferFunction.refDelaySamples > 0) {
            const negSearchStart = N - Math.round(searchMax * 0.5);
            for (let i = negSearchStart; i < N; i++) {
                const absVal = Math.abs(TransferFunction.impulseResponse[i]);
                if (absVal > peakVal) {
                    peakVal = absVal;
                    peakIdx = i - N; // negative lag
                }
            }
        }

        // Compute Peak-to-Noise Ratio (PNR) to prevent false random noise locks
        let sumNoise = 0;
        let countNoise = 0;
        for (let i = 0; i < searchMax; i++) {
            if (Math.abs(i - peakIdx) > 8) {
                sumNoise += Math.abs(TransferFunction.impulseResponse[i]);
                countNoise++;
            }
        }
        const noiseFloor = countNoise > 0 ? (sumNoise / countNoise) : 1e-6;
        const pnrDb = 20.0 * Math.log10((peakVal + 1e-9) / (noiseFloor + 1e-9));
        TransferFunction.pnrDb = pnrDb;

        // Smaart-grade Delay Validation: Peak must exceed noise floor by >= 6.0 dB AND mid-band coherence >= 0.20
        if (pnrDb < 6.0 || TransferFunction.peakCoherence < 0.20) {
            TransferFunction.peakDelayValid = false;
            TransferFunction.peakDelayMs = null;
            return;
        }

        const sampleRate = TransferFunction.sampleRate || 48000;
        const totalDelaySamples = Math.max(0, Math.round(TransferFunction.refDelaySamples + peakIdx));
        const delayMs = (totalDelaySamples / sampleRate) * 1000.0;
        TransferFunction.peakDelayValid = true;
        TransferFunction.peakDelayMs = delayMs;

        const activeTempC = (typeof window.globalTempC === 'number') ? window.globalTempC : TransferFunction.temperatureC;
        const c = getSpeedOfSound(activeTempC);
        TransferFunction.peakDistanceM = (delayMs / 1000.0) * c;
        TransferFunction.peakDistanceFt = TransferFunction.peakDistanceM * 3.28084;

        // Auto-tracking delay if enabled
        if (TransferFunction.autoTrackingDelay && totalDelaySamples > 0) {
            TransferFunction.refDelaySamples = totalDelaySamples;
            TransferFunction.refDelayMs = delayMs;
        }
    }

    // --- Delay Actions ---
    TransferFunction.lockDelay = function() {
        this.refDelaySamples = Math.round((this.peakDelayMs / 1000.0) * this.sampleRate);
        this.refDelayMs = this.peakDelayMs;
        this.resetAveraging();
        return this.refDelayMs;
    };

    TransferFunction.setDelayMs = function(ms) {
        this.refDelayMs = Math.max(0, ms);
        this.refDelaySamples = Math.round((this.refDelayMs / 1000.0) * this.sampleRate);
        this.resetAveraging();
    };

    TransferFunction.trimDelay = function(deltaMs) {
        this.setDelayMs(this.refDelayMs + deltaMs);
    };

    TransferFunction.resetAveraging = function() {
        avgCount = 0;
        if (avgSxx) {
            avgSxx.fill(0);
            avgSyy.fill(0);
            avgSxyReal.fill(0);
            avgSxyImag.fill(0);
        }
    };

    // --- Signal Generator Routing (Pink Noise, Sweeps) ---
    TransferFunction.startGenerator = function(type = 'pink') {
        if (!this.audioCtx) return;
        this.stopGenerator();

        // Lock native iOS / Android audio route to USB interface DAC
        try {
            const plugin = window.Capacitor?.registerPlugin ? 
                window.Capacitor.registerPlugin('AudioSessionPlugin') : 
                window.Capacitor?.Plugins?.AudioSessionPlugin;
            if (plugin && typeof plugin.setPreferredInputDevice === 'function') {
                const savedMicId = window.safeStorage ? window.safeStorage.getItem('soundengg-mic-id') : null;
                plugin.setPreferredInputDevice({
                    deviceId: savedMicId || '',
                    deviceName: cachedHardwareDetails?.deviceName || ''
                }).catch(() => {});
            }
        } catch (e) {}

        this.generatorType = type;
        const sampleRate = this.audioCtx.sampleRate;
        const bufferLen = sampleRate * 3; // 3 second continuous buffer
        const buffer = this.audioCtx.createBuffer(2, bufferLen, sampleRate);
        const lChannel = buffer.getChannelData(0);
        const rChannel = buffer.getChannelData(1);

        // Paul Kellet Pink Noise Filter
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferLen; i++) {
            const white = Math.random() * 2.0 - 1.0;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;

            lChannel[i] = pink;
            rChannel[i] = pink;
        }

        const src = this.audioCtx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        this.generatorGainNode = this.audioCtx.createGain();
        const linearGain = Math.pow(10.0, this.generatorLevelDbfs / 20.0);
        this.generatorGainNode.gain.setValueAtTime(linearGain, this.audioCtx.currentTime);

        this.mergerNode = this.audioCtx.createChannelMerger(2);

        // Channel routing logic
        const muteGain = this.audioCtx.createGain();
        muteGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);

        if (this.generatorRouting === 'left') {
            src.connect(this.generatorGainNode);
            this.generatorGainNode.connect(this.mergerNode, 0, 0); // Out 1 (Left)
        } else if (this.generatorRouting === 'right') {
            src.connect(this.generatorGainNode);
            this.generatorGainNode.connect(this.mergerNode, 0, 1); // Out 2 (Right)
        } else {
            // Stereo (Both L+R)
            src.connect(this.generatorGainNode);
            this.generatorGainNode.connect(this.mergerNode, 0, 0);
            this.generatorGainNode.connect(this.mergerNode, 0, 1);
        }

        this.mergerNode.connect(this.audioCtx.destination);
        src.start();

        this.generatorSourceNode = src;
        this.generatorActive = true;
    };

    TransferFunction.stopGenerator = function() {
        if (this.generatorSourceNode) {
            try { this.generatorSourceNode.stop(); } catch (e) {}
            try { this.generatorSourceNode.disconnect(); } catch (e) {}
            this.generatorSourceNode = null;
        }
        if (this.generatorGainNode) {
            try { this.generatorGainNode.disconnect(); } catch (e) {}
            this.generatorGainNode = null;
        }
        if (this.mergerNode) {
            try { this.mergerNode.disconnect(); } catch (e) {}
            this.mergerNode = null;
        }
        this.generatorActive = false;
    };

    TransferFunction.setGeneratorLevel = function(dbfs) {
        this.generatorLevelDbfs = Math.max(-60, Math.min(0, dbfs));
        if (this.generatorGainNode && this.audioCtx) {
            const linearGain = Math.pow(10.0, this.generatorLevelDbfs / 20.0);
            this.generatorGainNode.gain.setValueAtTime(linearGain, this.audioCtx.currentTime);
        }
    };

    // Feed synchronized Pink Noise generator audio into virtual loopback ring buffer
    TransferFunction.feedVirtualReference = function(samples) {
        if (!samples || samples.length === 0) return;
        const len = samples.length;
        for (let i = 0; i < len; i++) {
            virtualRefRing[virtualRefWritePtr] = samples[i];
            virtualRefWritePtr = (virtualRefWritePtr + 1) % VIRTUAL_REF_BUF_LEN;
        }
        virtualRefAvailableSamples = Math.min(VIRTUAL_REF_BUF_LEN, virtualRefAvailableSamples + len);
        this.virtualRefActive = true;
    };

    TransferFunction.setVirtualReferenceActive = function(active) {
        this.virtualRefActive = !!active;
        if (!active) {
            virtualRefAvailableSamples = 0;
            virtualRefWritePtr = 0;
            this.refPeakDbfs = -100;
            this.refRmsDbfs = -100;
        }
    };

    TransferFunction.toggleRtaOverlay = function() {
        this.showRtaOverlay = !this.showRtaOverlay;
        return this.showRtaOverlay;
    };

    // Synthesized loopback chunk for single-channel fallback
    TransferFunction.getSynthesizedReferenceChunk = function(len) {
        const out = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            out[i] = (Math.random() * 2.0 - 1.0) * 0.15;
        }
        return out;
    };

    // --- Acoustic Pulse Delay Finder (PRO / Auto-Ping Locator) ---
    TransferFunction.pulseDetection = null;

    TransferFunction.recordPulseSamples = function(rawMeas, rawRef) {
        if (!this.pulseDetection || !this.pulseDetection.active) return;
        const pd = this.pulseDetection;
        const N = rawMeas.length;
        const remaining = pd.targetSamples - pd.capturedSamples;
        const toCopy = Math.min(N, remaining);

        for (let i = 0; i < toCopy; i++) {
            pd.measBuffer[pd.capturedSamples + i] = rawMeas[i];
            pd.refBuffer[pd.capturedSamples + i] = rawRef[i];
        }
        pd.capturedSamples += toCopy;

        if (pd.capturedSamples >= pd.targetSamples) {
            pd.active = false;
            this.processPulseArrival(pd);
        }
    };

    TransferFunction.runAcousticPulseFinder = async function(onComplete, onError) {
        try {
            if (!this.isRunning) {
                await this.start();
            }
            if (!this.audioCtx) {
                if (onError) onError('AudioContext unavailable');
                return;
            }
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            const sampleRate = this.audioCtx.sampleRate || 48000;
            const wasGenActive = this.generatorActive;
            if (wasGenActive) {
                this.stopGenerator();
            }

            // Calibrated 4ms Gaussian-Hann acoustic pulse (2.5 kHz center frequency)
            const pulseSamples = Math.max(64, Math.round(sampleRate * 0.004));
            const pulseSignal = new Float32Array(pulseSamples);
            for (let i = 0; i < pulseSamples; i++) {
                const t = i / pulseSamples;
                const hann = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * t));
                pulseSignal[i] = hann * Math.sin(2.0 * Math.PI * 2500.0 * (i / sampleRate));
            }

            // Capture window: 350 ms (~120 meters acoustic range)
            const targetSamples = Math.round(sampleRate * 0.35);
            this.pulseDetection = {
                active: true,
                targetSamples: targetSamples,
                capturedSamples: 0,
                measBuffer: new Float32Array(targetSamples),
                refBuffer: new Float32Array(targetSamples),
                pulseSignal: pulseSignal,
                wasGeneratorActive: wasGenActive,
                onComplete: onComplete,
                onError: onError,
                sampleRate: sampleRate
            };

            // Play the pulse through active destination
            const pulseAudioBuf = this.audioCtx.createBuffer(2, pulseSamples + 64, sampleRate);
            const lCh = pulseAudioBuf.getChannelData(0);
            const rCh = pulseAudioBuf.getChannelData(1);
            for (let i = 0; i < pulseSamples; i++) {
                lCh[i] = pulseSignal[i] * 0.7; // -3 dBFS output
                rCh[i] = pulseSignal[i] * 0.7;
            }

            const src = this.audioCtx.createBufferSource();
            src.buffer = pulseAudioBuf;
            src.connect(this.audioCtx.destination);
            src.start();

        } catch (e) {
            console.error('runAcousticPulseFinder error:', e);
            if (onError) onError(e.message || e);
        }
    };

    TransferFunction.processPulseArrival = function(pd) {
        try {
            const N = pd.targetSamples;
            const P = pd.pulseSignal.length;
            const sMeas = pd.measBuffer;
            const sRef = pd.refBuffer;
            const sampleRate = pd.sampleRate || 48000;

            // Matched filter cross-correlation
            let peakMeasIdx = 0;
            let peakMeasVal = 0;
            let sumMeasNoise = 0;
            const maxLag = Math.min(N - P, Math.round(sampleRate * 0.25)); // search up to 250ms (85 meters)

            for (let k = 0; k < maxLag; k++) {
                let sum = 0;
                for (let p = 0; p < P; p += 2) { // 2x decimation for fast, responsive calculation
                    sum += sMeas[k + p] * pd.pulseSignal[p];
                }
                const absSum = Math.abs(sum);
                sumMeasNoise += absSum;
                if (absSum > peakMeasVal) {
                    peakMeasVal = absSum;
                    peakMeasIdx = k;
                }
            }

            const avgNoise = sumMeasNoise / Math.max(1, maxLag);
            const snrRatio = peakMeasVal / (avgNoise + 1e-6);

            // Gating: Require pulse peak above background noise
            if (peakMeasVal < 0.06 || snrRatio < 3.0) {
                if (pd.wasGeneratorActive) {
                    setTimeout(() => {
                        this.startGenerator(this.generatorType);
                    }, 200);
                }
                if (pd.onError) {
                    pd.onError('No acoustic pulse detected above room noise. Check speaker volume and mic trim.');
                }
                return;
            }

            let peakRefIdx = 0;
            let peakRefVal = 0;
            if (this.hasTwoChannels && !this.isVirtualLoopback) {
                for (let k = 0; k < maxLag; k++) {
                    let sum = 0;
                    for (let p = 0; p < P; p += 2) {
                        sum += sRef[k + p] * pd.pulseSignal[p];
                    }
                    const absSum = Math.abs(sum);
                    if (absSum > peakRefVal) {
                        peakRefVal = absSum;
                        peakRefIdx = k;
                    }
                }
            }

            // Calculate acoustic travel time
            let deltaSamples = peakMeasIdx;
            if (peakRefVal > 0.05 && peakRefIdx < peakMeasIdx) {
                deltaSamples = peakMeasIdx - peakRefIdx;
            }

            const delayMs = Math.max(0, (deltaSamples / sampleRate) * 1000.0);
            const activeTempC = (typeof window.globalTempC === 'number') ? window.globalTempC : this.temperatureC;
            const c = getSpeedOfSound(activeTempC);
            const distM = (delayMs / 1000.0) * c;
            const distFt = distM * 3.28084;

            // Apply locked delay
            this.setDelayMs(delayMs);
            this.peakDelayMs = delayMs;
            this.peakDistanceM = distM;
            this.peakDistanceFt = distFt;
            this.resetAveraging();

            // Resume generator if it was active
            if (pd.wasGeneratorActive) {
                setTimeout(() => {
                    this.startGenerator(this.generatorType);
                }, 200);
            }

            if (pd.onComplete) {
                pd.onComplete({
                    delayMs: delayMs,
                    distM: distM,
                    distFt: distFt,
                    confidence: Math.min(1.0, peakMeasVal / 2.0)
                });
            }
        } catch (err) {
            console.error('processPulseArrival error:', err);
            if (pd.onError) pd.onError(err);
        }
    };

    // Expose Globally
    window.TransferFunctionEngine = TransferFunction;

})(window);
