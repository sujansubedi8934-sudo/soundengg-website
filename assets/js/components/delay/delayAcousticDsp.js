// ==========================================================================
// DELAY CALCULATOR — ACOUSTIC PULSE-COMPRESSION & GCC-PHAT DSP ENGINE MODULE
// ==========================================================================
// Extracted from delayCalc.js for clean modularity with zero behavior changes.

(function () {
    // Zero-Phase Cascaded Biquad Bandpass Filter (650 Hz HPF + 7000 Hz LPF for 800-6000 Hz Broadband Micro-Chirp)
    function applyBandpassFilter(samples, sampleRate) {
        const fcH = 650;
        const omegaH = 2 * Math.PI * fcH / sampleRate;
        const alphaH = Math.sin(omegaH) / (2 * 0.7071);
        const coswH = Math.cos(omegaH);
        const b0H = (1 + coswH) / 2;
        const b1H = -(1 + coswH);
        const b2H = (1 + coswH) / 2;
        const a0H = 1 + alphaH;
        const a1H = -2 * coswH;
        const a2H = 1 - alphaH;

        const fcL = Math.min(7000, sampleRate * 0.44);
        const omegaL = 2 * Math.PI * fcL / sampleRate;
        const alphaL = Math.sin(omegaL) / (2 * 0.7071);
        const coswL = Math.cos(omegaL);
        const b0L = (1 - coswL) / 2;
        const b1L = 1 - coswL;
        const b2L = (1 - coswL) / 2;
        const a0L = 1 + alphaL;
        const a1L = -2 * coswL;
        const a2L = 1 - alphaL;

        const filtered = new Float32Array(samples.length);
        let x1H = 0, x2H = 0, y1H = 0, y2H = 0;
        let x1L = 0, x2L = 0, y1L = 0, y2L = 0;

        for (let i = 0; i < samples.length; i++) {
            const x0 = samples[i];
            const y0H = (b0H / a0H) * x0 + (b1H / a0H) * x1H + (b2H / a0H) * x2H - (a1H / a0H) * y1H - (a2H / a0H) * y2H;
            x2H = x1H; x1H = x0;
            y2H = y1H; y1H = y0H;

            const y0L = (b0L / a0L) * y0H + (b1L / a0L) * x1L + (b2L / a0L) * x2L - (a1L / a0L) * y1L - (a2L / a0L) * y2L;
            x2L = x1L; x1L = y0H;
            y2L = y1L; y1L = y0L;

            filtered[i] = y0L;
        }
        return filtered;
    }

    // In-place Radix-2 Cooley-Tukey Complex FFT / IFFT
    function fftRadix2(re, im, invert) {
        const n = re.length;
        for (let i = 1, j = 0; i < n; i++) {
            let bit = n >> 1;
            for (; j & bit; bit >>= 1) {
                j ^= bit;
            }
            j ^= bit;
            if (i < j) {
                const tr = re[i]; re[i] = re[j]; re[j] = tr;
                const ti = im[i]; im[i] = im[j]; im[j] = ti;
            }
        }
        for (let len = 2; len <= n; len <<= 1) {
            const halfLen = len >> 1;
            const ang = (2 * Math.PI / len) * (invert ? 1 : -1);
            const wlenRe = Math.cos(ang);
            const wlenIm = Math.sin(ang);
            for (let i = 0; i < n; i += len) {
                let wRe = 1.0;
                let wIm = 0.0;
                for (let j = 0; j < halfLen; j++) {
                    const uRe = re[i + j];
                    const uIm = im[i + j];
                    const vIdx = i + j + halfLen;
                    const vRe = re[vIdx] * wRe - im[vIdx] * wIm;
                    const vIm = re[vIdx] * wIm + im[vIdx] * wRe;
                    re[i + j] = uRe + vRe;
                    im[i + j] = uIm + vIm;
                    re[vIdx] = uRe - vRe;
                    im[vIdx] = uIm - vIm;
                    const nextWRe = wRe * wlenRe - wIm * wlenIm;
                    wIm = wRe * wlenIm + wIm * wlenRe;
                    wRe = nextWRe;
                }
            }
        }
        if (invert) {
            const invN = 1.0 / n;
            for (let i = 0; i < n; i++) {
                re[i] *= invN;
                im[i] *= invN;
            }
        }
    }

    // Precompute complex autocorrelation kernel of a template for CLEAN wavefront subtraction
    function buildTemplateAutoCorrelation(refI, refQ) {
        const L = refI.length;
        const rII = new Float32Array(2 * L - 1);
        const rQQ = new Float32Array(2 * L - 1);
        const rIQ = new Float32Array(2 * L - 1);
        let energyI = 0;
        let energyQ = 0;
        for (let k = 0; k < L; k++) {
            energyI += refI[k] * refI[k];
            energyQ += refQ[k] * refQ[k];
        }
        const invEI = 1.0 / Math.max(1e-12, energyI);
        const invEQ = 1.0 / Math.max(1e-12, energyQ);

        for (let d = -(L - 1); d <= (L - 1); d++) {
            let sumII = 0, sumQQ = 0, sumIQ = 0;
            const kStart = Math.max(0, -d);
            const kEnd = Math.min(L, L - d);
            for (let k = kStart; k < kEnd; k++) {
                const kd = k + d;
                sumII += refI[kd] * refI[k];
                sumQQ += refQ[kd] * refQ[k];
                sumIQ += refI[kd] * refQ[k];
            }
            const idx = d + (L - 1);
            rII[idx] = sumII * invEI;
            rQQ[idx] = sumQQ * invEQ;
            rIQ[idx] = sumIQ * Math.sqrt(invEI * invEQ);
        }
        return { rII, rQQ, rIQ };
    }

    // Dual-Template Reference Builder:
    // 1. 'chirp': 7.5ms Broadband Micro-Chirp (800 Hz -> 6000 Hz) for sub-millisecond pulse compression
    // 2. 'classic': 3.5ms Dual-Tone (1.5 kHz + 3.0 kHz) for backward compatibility with older exported WAVs
    function getReferencePulseTemplates(sampleRate) {
        // --- Template A: Broadband Micro-Chirp (7.5ms, 800 Hz -> 6000 Hz) ---
        const chirpDurationSec = 0.0075;
        const chirpSamples = Math.round(chirpDurationSec * sampleRate);
        const chirpI = new Float32Array(chirpSamples);
        const chirpQ = new Float32Array(chirpSamples);
        const f0 = 800;
        const f1 = 6000;
        const kSweep = (f1 - f0) / chirpDurationSec;
        const attackChirp = Math.max(4, Math.round(0.00035 * sampleRate));
        const tailChirp = Math.max(16, Math.round(0.0012 * sampleRate));

        let chirpEnergy = 0;
        for (let i = 0; i < chirpSamples; i++) {
            const t = i / sampleRate;
            let env = 1.0;
            if (i < attackChirp) {
                env = 0.5 * (1.0 - Math.cos(Math.PI * (i / attackChirp)));
            } else if (i > chirpSamples - tailChirp) {
                const rem = (chirpSamples - i) / tailChirp;
                env = 0.5 * (1.0 - Math.cos(Math.PI * rem));
            }
            const expFocus = Math.exp(-t / 0.0055);
            const coreEnv = Math.exp(-t / 0.0016);
            const phaseChirp = 2 * Math.PI * (f0 * t + 0.5 * kSweep * t * t);

            chirpI[i] = env * (
                0.78 * Math.sin(phaseChirp) * expFocus +
                0.22 * (0.82 * Math.sin(2 * Math.PI * 1500 * t) + 0.18 * Math.sin(2 * Math.PI * 3000 * t)) * coreEnv
            );
            chirpQ[i] = env * (
                0.78 * Math.cos(phaseChirp) * expFocus +
                0.22 * (0.82 * Math.cos(2 * Math.PI * 1500 * t) + 0.18 * Math.cos(2 * Math.PI * 3000 * t)) * coreEnv
            );
            chirpEnergy += chirpI[i] * chirpI[i] + chirpQ[i] * chirpQ[i];
        }
        const chirpNorm = Math.sqrt(2.0 / Math.max(1e-12, chirpEnergy));
        for (let i = 0; i < chirpSamples; i++) {
            chirpI[i] *= chirpNorm;
            chirpQ[i] *= chirpNorm;
        }
        const chirpAutoCorr = buildTemplateAutoCorrelation(chirpI, chirpQ);

        // --- Template B: Classic 1.5 kHz + 3.0 kHz Click (3.5ms) ---
        const classicSamples = Math.round(0.0035 * sampleRate);
        const classicI = new Float32Array(classicSamples);
        const classicQ = new Float32Array(classicSamples);
        const attackClassic = Math.round(0.0002 * sampleRate);
        const decayClassic = Math.round(0.0012 * sampleRate);

        let classicEnergy = 0;
        for (let i = 0; i < classicSamples; i++) {
            const env = (i < attackClassic) ? (i / attackClassic) : Math.exp(-(i - attackClassic) / decayClassic);
            const tailFade = (i > classicSamples - 16) ? (classicSamples - i) / 16 : 1.0;
            const w = env * tailFade;
            classicI[i] = w * (0.82 * Math.sin((2 * Math.PI * 1500 * i) / sampleRate) + 0.18 * Math.sin((2 * Math.PI * 3000 * i) / sampleRate));
            classicQ[i] = w * (0.82 * Math.cos((2 * Math.PI * 1500 * i) / sampleRate) + 0.18 * Math.cos((2 * Math.PI * 3000 * i) / sampleRate));
            classicEnergy += classicI[i] * classicI[i] + classicQ[i] * classicQ[i];
        }
        const classicNorm = Math.sqrt(2.0 / Math.max(1e-12, classicEnergy));
        for (let i = 0; i < classicSamples; i++) {
            classicI[i] *= classicNorm;
            classicQ[i] *= classicNorm;
        }
        const classicAutoCorr = buildTemplateAutoCorrelation(classicI, classicQ);

        return {
            chirp: { refI: chirpI, refQ: chirpQ, pulseSamples: chirpSamples, autoCorr: chirpAutoCorr, isChirp: true },
            classic: { refI: classicI, refQ: classicQ, pulseSamples: classicSamples, autoCorr: classicAutoCorr, isChirp: false },
            refI: chirpI,
            refQ: chirpQ,
            pulseSamples: chirpSamples
        };
    }

    // Raw I/Q Cross-Correlation helper for a single template
    function correlateTemplateIQ(windowSamples, tpl) {
        const refI = tpl.refI;
        const refQ = tpl.refQ;
        const tLen = refI.length;
        const outLen = Math.max(1, windowSamples.length - tLen);
        const cI = new Float32Array(outLen);
        const cQ = new Float32Array(outLen);
        const rawEtc = new Float32Array(outLen);
        let maxEnergy = 0;
        let maxIdx = 0;
        let energySum = 0;

        for (let n = 0; n < outLen; n++) {
            let corrI = 0;
            let corrQ = 0;
            for (let k = 0; k < tLen; k++) {
                const s = windowSamples[n + k];
                corrI += refI[k] * s;
                corrQ += refQ[k] * s;
            }
            cI[n] = corrI;
            cQ[n] = corrQ;
            const e = corrI * corrI + corrQ * corrQ;
            rawEtc[n] = e;
            energySum += e;
            if (e > maxEnergy) {
                maxEnergy = e;
                maxIdx = n;
            }
        }
        const meanEnergy = energySum / outLen;
        const crestFactor = meanEnergy > 1e-15 ? (maxEnergy / meanEnergy) : 0;
        return { cI, cQ, rawEtc, maxEnergy, maxIdx, crestFactor, outLen, tpl };
    }

    // Option B Full Pulse-Compression Engine:
    // 1. Dual-Template Auto-Sensing (Broadband Micro-Chirp vs Classic Click)
    // 2. CLEAN Iterative Wavefront Skirt Subtraction (unmasks quiet Speaker 2 arrivals)
    // 3. GCC-PHAT (beta-whitened Phase Transform) Spectral Phase-Slope Sharpening
    // 4. Power Cepstrum (Comb-Filter Quefrency) Extraction
    function computeMatchedFilterETC(windowSamples, templates, sampleRate = 48000) {
        const chirpTpl = templates.chirp || { refI: templates.refI, refQ: templates.refQ, autoCorr: buildTemplateAutoCorrelation(templates.refI, templates.refQ) };
        const classicTpl = templates.classic || null;

        // Step 1: Auto-sense whether the pulse is the new Broadband Micro-Chirp or a legacy WAV Click
        const chirpCorr = correlateTemplateIQ(windowSamples, chirpTpl);
        let activeCorr = chirpCorr;
        if (classicTpl) {
            const classicCorr = correlateTemplateIQ(windowSamples, classicTpl);
            if (classicCorr.maxEnergy * classicCorr.crestFactor > chirpCorr.maxEnergy * chirpCorr.crestFactor * 1.15) {
                activeCorr = classicCorr;
            }
        }

        const { cI, cQ, outLen, tpl } = activeCorr;
        const tLen = tpl.refI.length;

        // Step 2: CLEAN Primary-Wavefront Skirt Subtraction
        const pMain = activeCorr.maxIdx;
        const peakI = cI[pMain];
        const peakQ = cQ[pMain];
        const cleanEtc = new Float32Array(outLen);
        const coreRadius = Math.max(3, Math.round(0.00045 * sampleRate)); // Preserve ±0.45ms main summit core
        const transitionSpan = Math.max(4, Math.round(0.00055 * sampleRate));
        const cleanGain = 0.82;
        const { rII, rQQ, rIQ } = tpl.autoCorr;

        for (let n = 0; n < outLen; n++) {
            let curI = cI[n];
            let curQ = cQ[n];
            const d = n - pMain;
            const absD = Math.abs(d);
            if (absD > coreRadius && absD < tLen) {
                let blend = 1.0;
                if (absD < coreRadius + transitionSpan) {
                    const u = (absD - coreRadius) / transitionSpan;
                    blend = 0.5 * (1.0 - Math.cos(Math.PI * u));
                }
                const kIdx = d + (tLen - 1);
                const subWeight = cleanGain * blend;
                curI -= subWeight * (peakI * rII[kIdx] + peakQ * rIQ[kIdx]);
                curQ -= subWeight * (peakQ * rQQ[kIdx] - peakI * rIQ[kIdx]);
            }
            cleanEtc[n] = curI * curI + curQ * curQ;
        }

        // Step 3: Radix-2 FFT for Analytic GCC-PHAT (Phase-Slope Sharpening) & Power Cepstrum
        let fftSize = 1024;
        while (fftSize < windowSamples.length + tLen) {
            fftSize <<= 1;
        }
        const sigRe = new Float32Array(fftSize);
        const sigIm = new Float32Array(fftSize);
        const tplRe = new Float32Array(fftSize);
        const tplIm = new Float32Array(fftSize);

        for (let i = 0; i < windowSamples.length; i++) sigRe[i] = windowSamples[i];
        for (let i = 0; i < tLen; i++) tplRe[i] = tpl.refI[i];

        fftRadix2(sigRe, sigIm, false);
        fftRadix2(tplRe, tplIm, false);

        const halfFFT = fftSize >> 1;
        const binHz = sampleRate / fftSize;
        const kMin = Math.max(1, Math.floor(700 / binHz));
        const kMax = Math.min(halfFFT - 1, Math.ceil(6200 / binHz));

        // Cross-spectrum G[k] = S[k] * conj(H[k]) and Signal Power |S[k]|^2
        const crossRe = new Float32Array(fftSize);
        const crossIm = new Float32Array(fftSize);
        const crossMag = new Float32Array(halfFFT);
        const sigPow = new Float32Array(halfFFT);
        let maxCrossMag = 0;
        let maxSigPow = 0;

        for (let k = kMin; k <= kMax; k++) {
            const sR = sigRe[k], sI = sigIm[k];
            const hR = tplRe[k], hI = tplIm[k];
            const gR = sR * hR + sI * hI;
            const gI = sI * hR - sR * hI;
            crossRe[k] = gR;
            crossIm[k] = gI;
            const mag = Math.hypot(gR, gI);
            crossMag[k] = mag;
            if (mag > maxCrossMag) maxCrossMag = mag;

            const p = sR * sR + sI * sI;
            sigPow[k] = p;
            if (p > maxSigPow) maxSigPow = p;
        }

        // 3a. Analytic GCC-PHAT (beta = 0.68 partial phase whitening + Hilbert positive-frequency doubling)
        const phatRe = new Float32Array(fftSize);
        const phatIm = new Float32Array(fftSize);
        const beta = 0.68;
        const regEps = Math.max(1e-12, maxCrossMag * 0.008); // Wiener noise-floor regularizer
        const passbandLen = Math.max(1, kMax - kMin);

        for (let k = kMin; k <= kMax; k++) {
            const u = (k - kMin) / passbandLen;
            const edgeTaper = Math.sin(Math.PI * u);
            const weight = (2.0 * (0.35 + 0.65 * edgeTaper)) / Math.pow(crossMag[k] + regEps, beta);
            phatRe[k] = crossRe[k] * weight;
            phatIm[k] = crossIm[k] * weight;
        }
        fftRadix2(phatRe, phatIm, true);

        // 3b. Power Cepstrum C_cep[tau] = |IFFT(log(|S[k]|^2))| for Comb-Filter Quefrency Verification
        const cepRe = new Float32Array(fftSize);
        const cepIm = new Float32Array(fftSize);
        const cepEps = Math.max(1e-14, maxSigPow * 0.0005);
        let logMean = 0;
        for (let k = kMin; k <= kMax; k++) {
            const lv = Math.log(sigPow[k] + cepEps);
            cepRe[k] = lv;
            logMean += lv;
        }
        logMean /= (kMax - kMin + 1);
        for (let k = kMin; k <= kMax; k++) {
            const u = (k - kMin) / passbandLen;
            const hann = 0.5 * (1.0 - Math.cos(2 * Math.PI * u));
            const centered = (cepRe[k] - logMean) * hann;
            cepRe[k] = centered;
            cepRe[fftSize - k] = centered; // Symmetric real spectrum
        }
        fftRadix2(cepRe, cepIm, true);

        const maxCepLag = Math.min(halfFFT, Math.round(0.115 * sampleRate));
        const minCepLag = Math.max(4, Math.round(0.0012 * sampleRate));
        const cepstrum = new Float32Array(maxCepLag);
        let maxCepVal = 0;
        for (let tau = minCepLag; tau < maxCepLag; tau++) {
            const val = Math.max(0, cepRe[tau]);
            cepstrum[tau] = val;
            if (val > maxCepVal) maxCepVal = val;
        }
        if (maxCepVal > 0) {
            const invCep = 1.0 / maxCepVal;
            for (let tau = minCepLag; tau < maxCepLag; tau++) {
                cepstrum[tau] *= invCep;
            }
        }

        // Step 4: Fuse CLEAN Matched-Filter Envelope with Analytic GCC-PHAT Phase-Slope Envelope
        let maxClean = 0;
        let maxPhat = 0;
        const phatEnv = new Float32Array(outLen);
        for (let n = 0; n < outLen; n++) {
            if (cleanEtc[n] > maxClean) maxClean = cleanEtc[n];
            const pE = phatRe[n] * phatRe[n] + phatIm[n] * phatIm[n];
            phatEnv[n] = pE;
            if (pE > maxPhat) maxPhat = pE;
        }

        const etc = new Float32Array(outLen);
        let maxEnergy = 0;
        if (maxClean > 0 && maxPhat > 0) {
            const invClean = 1.0 / maxClean;
            const invPhat = 1.0 / maxPhat;
            for (let n = 0; n < outLen; n++) {
                const normClean = cleanEtc[n] * invClean;
                const normPhat = phatEnv[n] * invPhat;
                const fusedNorm = normClean * (0.40 + 0.60 * Math.sqrt(normPhat)) + 0.36 * normPhat * Math.pow(normClean, 0.25);
                const e = fusedNorm * maxClean;
                etc[n] = e;
                if (e > maxEnergy) maxEnergy = e;
            }
        } else {
            for (let n = 0; n < outLen; n++) {
                etc[n] = cleanEtc[n];
                if (cleanEtc[n] > maxEnergy) maxEnergy = cleanEtc[n];
            }
        }

        return { etc, maxEnergy, cepstrum, phatEnv, maxPhat };
    }

    // Zero-phase symmetric triangular smoothing to suppress single-sample slope ripples on ETC
    function smoothETCEnvelope(etc, sampleRate) {
        const radius = Math.max(3, Math.round(0.00026 * sampleRate)); // ~0.26ms half-width
        const out = new Float32Array(etc.length);
        let maxVal = 0;
        for (let i = 0; i < etc.length; i++) {
            let weightedSum = 0;
            let weightTotal = 0;
            const kMin = Math.max(0, i - radius);
            const kMax = Math.min(etc.length - 1, i + radius);
            for (let k = kMin; k <= kMax; k++) {
                const w = (radius + 1) - Math.abs(i - k);
                weightedSum += etc[k] * w;
                weightTotal += w;
            }
            const v = weightTotal > 0 ? (weightedSum / weightTotal) : etc[i];
            out[i] = v;
            if (v > maxVal) maxVal = v;
        }
        return { etcSmooth: out, smoothMax: maxVal };
    }

    // Dual-Speaker Arrival Summit Detector (Volume-Independent Pre/Post Causal Detection + Valley Merge + Cepstral Verification)
    function analyzeBurstArrivals(etc, maxEnergy, sampleRate, sensMultiplier, cepstrum = null, phatEnv = null) {
        const minAbsEnergy = 0.0000008 * Math.min(1.0, sensMultiplier);
        if (maxEnergy < minAbsEnergy) {
            return { p1: -1, p2: -1, pMain: -1, refinedP1: -1, refinedP2: -1, error: 'NO PULSE DETECTED' };
        }

        const { etcSmooth, smoothMax } = smoothETCEnvelope(etc, sampleRate);
        if (smoothMax <= 0) {
            return { p1: -1, p2: -1, pMain: -1, refinedP1: -1, refinedP2: -1, error: 'NO PULSE DETECTED' };
        }

        // 1. Build visual amplitude envelope sqrt(ETC / smoothMax) matching the canvas renderer (0.0 .. 1.0)
        const N = etcSmooth.length;
        const ampCurve = new Float32Array(N);
        const invSmoothMax = 1.0 / smoothMax;
        let pMainIdx = 0;
        for (let i = 0; i < N; i++) {
            const a = Math.sqrt(Math.max(0, etcSmooth[i] * invSmoothMax));
            ampCurve[i] = a;
            if (a > ampCurve[pMainIdx]) pMainIdx = i;
        }

        // Normalize optional GCC-PHAT envelope for volume-independent pre/post peak verification
        let normPhatCurve = null;
        if (phatEnv && phatEnv.length === N) {
            let pMax = 0;
            for (let i = 0; i < N; i++) {
                if (phatEnv[i] > pMax) pMax = phatEnv[i];
            }
            if (pMax > 0) {
                normPhatCurve = new Float32Array(N);
                const invP = 1.0 / pMax;
                for (let i = 0; i < N; i++) {
                    normPhatCurve[i] = Math.sqrt(Math.max(0, phatEnv[i] * invP));
                }
            }
        }

        // Measure true pre-arrival ambient noise floor in the quiet region well before the primary arrival
        const noiseEndIdx = Math.max(16, Math.min(Math.round(0.022 * sampleRate), pMainIdx - Math.round(0.055 * sampleRate)));
        let noiseMean = 0;
        let noiseStd = 0;
        if (noiseEndIdx > 8) {
            for (let i = 0; i < noiseEndIdx; i++) noiseMean += ampCurve[i];
            noiseMean /= noiseEndIdx;
            for (let i = 0; i < noiseEndIdx; i++) {
                const d = ampCurve[i] - noiseMean;
                noiseStd += d * d;
            }
            noiseStd = Math.sqrt(noiseStd / noiseEndIdx);
        }
        const preCausalFloorThreshold = Math.max(0.048, Math.min(0.12, noiseMean + 4.2 * noiseStd)) * Math.sqrt(sensMultiplier);

        // 2. Identify all local summits in ampCurve using a ±0.35ms neighborhood
        const postAmpThreshold = Math.max(0.058, Math.min(0.18, Math.max(0.062, noiseMean + 5.2 * noiseStd) * Math.sqrt(sensMultiplier)));
        const localRadius = Math.max(4, Math.round(0.00035 * sampleRate));
        const minMountainSpacing = Math.round(0.0015 * sampleRate);
        const maxCausalPreSamples = Math.round(0.550 * sampleRate);
        let mountains = [];

        for (let i = localRadius; i < N - localRadius; i++) {
            const amp = ampCurve[i];
            const isCausalPreRegion = (i < pMainIdx - minMountainSpacing) && ((pMainIdx - i) <= maxCausalPreSamples);
            const activeThreshold = isCausalPreRegion ? Math.min(postAmpThreshold, preCausalFloorThreshold) : postAmpThreshold;
            if (amp < activeThreshold) continue;

            let isLocalMax = true;
            for (let d = 1; d <= localRadius; d++) {
                if (ampCurve[i - d] > amp || ampCurve[i + d] >= amp) {
                    isLocalMax = false;
                    break;
                }
            }
            if (isLocalMax) {
                const phatVal = normPhatCurve ? normPhatCurve[i] : amp;
                // In the causal pre-peak region, if amplitude is very small (< postAmpThreshold), require clear SNR or PHAT support
                if (isCausalPreRegion && amp < postAmpThreshold && phatVal < 0.14 && amp < preCausalFloorThreshold * 1.25) {
                    continue;
                }
                mountains.push({ idx: i, amp, energy: etcSmooth[i], phat: phatVal, isPrePeak: isCausalPreRegion });
            }
        }

        if (mountains.length === 0) {
            return { p1: -1, p2: -1, pMain: -1, refinedP1: -1, refinedP2: -1, error: 'NO PULSE DETECTED' };
        }

        // 3. Iterative Bidirectional Valley Merge
        const minValleyDropRatio = Math.max(0.16, Math.min(0.32, 0.24 * Math.pow(sensMultiplier, 0.45)));

        function getValleyMinAmp(idxA, idxB) {
            let vMin = Math.min(ampCurve[idxA], ampCurve[idxB]);
            for (let v = idxA + 1; v < idxB; v++) {
                if (ampCurve[v] < vMin) vMin = ampCurve[v];
            }
            return vMin;
        }

        let mergedAny = true;
        while (mergedAny && mountains.length > 1) {
            mergedAny = false;
            for (let k = 0; k < mountains.length - 1; k++) {
                const mA = mountains[k];
                const mB = mountains[k + 1];
                const distSamples = mB.idx - mA.idx;
                const vMin = getValleyMinAmp(mA.idx, mB.idx);
                const smallerPeakAmp = Math.min(mA.amp, mB.amp);
                const valleyDropRatio = smallerPeakAmp > 0 ? ((smallerPeakAmp - vMin) / smallerPeakAmp) : 0;

                if (distSamples < minMountainSpacing || valleyDropRatio < minValleyDropRatio) {
                    if (mB.amp >= mA.amp) {
                        mountains.splice(k, 1);
                    } else {
                        mountains.splice(k + 1, 1);
                    }
                    mergedAny = true;
                    break;
                }
            }
        }

        // 4. Filter to causal search range around the primary mountain (expanded up to 550ms for outdoor delay towers / fields)
        let tallestIdx = 0;
        for (let k = 1; k < mountains.length; k++) {
            if (mountains[k].amp > mountains[tallestIdx].amp) {
                tallestIdx = k;
            }
        }
        const primaryMountain = mountains[tallestIdx];
        const maxPostSpanSamples = Math.round(0.550 * sampleRate); // Up to 550ms (~190 meters)
        const maxPreSpanSamples = Math.round(0.550 * sampleRate); // Symmetrical 550ms (~190 meters) causal pre-span
        mountains = mountains.filter(m => {
            if (m.idx <= primaryMountain.idx) {
                return (primaryMountain.idx - m.idx) <= maxPreSpanSamples;
            }
            return (m.idx - primaryMountain.idx) <= maxPostSpanSamples;
        });

        // Re-locate tallestIdx after filtering
        tallestIdx = 0;
        for (let k = 1; k < mountains.length; k++) {
            if (mountains[k].amp > mountains[tallestIdx].amp) {
                tallestIdx = k;
            }
        }

        let p1 = mountains[tallestIdx].idx;
        let p2 = -1;
        const candidateList = [];

        if (mountains.length >= 2) {
            // 5. Select the 2 most dominant mountains (evaluating both Causal Pre-Peak and Post-Peak candidates)
            let bestSecond = null;
            let bestSecondScore = -1;
            const cepRadius = Math.max(2, Math.round(0.00025 * sampleRate));
            const candidateMountains = [];

            for (let k = 0; k < mountains.length; k++) {
                if (k === tallestIdx) continue;
                const cand = mountains[k];
                const idxLeft = Math.min(primaryMountain.idx, cand.idx);
                const idxRight = Math.max(primaryMountain.idx, cand.idx);
                const vMin = getValleyMinAmp(idxLeft, idxRight);
                const smallerAmp = Math.min(primaryMountain.amp, cand.amp);
                const dropRatio = smallerAmp > 0 ? ((smallerAmp - vMin) / smallerAmp) : 0;
                if (dropRatio < minValleyDropRatio * 0.75) continue;

                const lagSamples = idxRight - idxLeft;
                const lagMs = (lagSamples / sampleRate) * 1000;
                const isPreCandidate = cand.idx < primaryMountain.idx;

                // Guard against false 1.5ms - 3.5ms post-peak cabinet diffraction / horn reflection ripples on a loud speaker
                if (!isPreCandidate && lagMs < 3.5) {
                    if (dropRatio < Math.max(0.45, minValleyDropRatio * 1.55) || cand.amp < 0.34) {
                        continue;
                    }
                }

                let cepstralBoost = 1.0;
                if (cepstrum && lagSamples > cepRadius && lagSamples < cepstrum.length - cepRadius) {
                    let localCepMax = 0;
                    for (let c = lagSamples - cepRadius; c <= lagSamples + cepRadius; c++) {
                        if (cepstrum[c] > localCepMax) localCepMax = cepstrum[c];
                    }
                    cepstralBoost = 1.0 + 0.30 * localCepMax;
                }

                // Volume-independent effective amplitude blends amplitude and phase-whitened GCC-PHAT coherence
                const effectiveAmp = (0.65 * cand.amp) + (0.35 * (cand.phat || cand.amp));
                // Causal pre-peak arrivals (before the loudest speaker) cannot be room reflections of the loud speaker
                const preCausalBoost = (isPreCandidate && lagMs >= 3.0) ? 1.4 : 1.0;

                // Prominence-weighted arrival score:
                // Prominent outdoor speaker wavefronts (high amplitude + deep valley separation) overwhelmingly outscore low reflections
                const score = Math.pow(effectiveAmp, 1.35) * (0.45 + 0.55 * dropRatio) * cepstralBoost * preCausalBoost;

                cand.score = score;
                cand.lagMs = lagMs;
                cand.dropRatio = dropRatio;
                candidateMountains.push(cand);

                if (score > bestSecondScore) {
                    bestSecondScore = score;
                    bestSecond = cand;
                }
            }

            if (bestSecond) {
                if (primaryMountain.idx < bestSecond.idx) {
                    p1 = primaryMountain.idx;
                    p2 = bestSecond.idx;
                } else {
                    p1 = bestSecond.idx;
                    p2 = primaryMountain.idx;
                }
            }

            // Build candidate list sorted by prominence score
            candidateMountains.sort((a, b) => b.score - a.score);
            candidateMountains.forEach(c => {
                const deltaMs = Math.abs(c.idx - p1) / sampleRate * 1000;
                if (deltaMs >= 0.5 && deltaMs <= 550) {
                    candidateList.push({
                        idx: c.idx,
                        deltaMs: deltaMs,
                        amp: c.amp,
                        score: c.score,
                        isDominant: (c === bestSecond)
                    });
                }
            });
        }

        // Refine p1, p2, and primary summit to exact unsmoothed summit within ±3 samples and apply parabolic interpolation
        function refineSummit(idx) {
            if (idx < 0) return { discrete: -1, refined: -1 };
            let bestIdx = idx;
            const rMin = Math.max(1, idx - 3);
            const rMax = Math.min(etc.length - 2, idx + 3);
            for (let j = rMin; j <= rMax; j++) {
                if (etc[j] > etc[bestIdx]) bestIdx = j;
            }
            let refined = bestIdx;
            const denom = 2 * (etc[bestIdx - 1] - 2 * etc[bestIdx] + etc[bestIdx + 1]);
            if (Math.abs(denom) > 1e-12) {
                const deltaP = (etc[bestIdx - 1] - etc[bestIdx + 1]) / denom;
                if (Math.abs(deltaP) < 1.0) refined = bestIdx + deltaP;
            }
            return { discrete: bestIdx, refined };
        }

        const r1 = refineSummit(p1);
        const r2 = p2 !== -1 ? refineSummit(p2) : { discrete: -1, refined: -1 };
        const rMain = refineSummit(primaryMountain.idx);

        // Refine candidate discrete and refined timings
        candidateList.forEach(cand => {
            const r = refineSummit(cand.idx);
            cand.discrete = r.discrete;
            cand.refined = r.refined;
            cand.deltaMs = (Math.abs(r.refined - r1.refined) / sampleRate) * 1000;
        });

        return {
            p1: r1.discrete,
            p2: r2.discrete,
            pMain: rMain.discrete,
            refinedP1: r1.refined,
            refinedP2: r2.refined,
            candidates: candidateList,
            etcSmooth,
            error: null
        };
    }

    window.DelayAcousticDsp = {
        applyBandpassFilter,
        fftRadix2,
        buildTemplateAutoCorrelation,
        getReferencePulseTemplates,
        correlateTemplateIQ,
        computeMatchedFilterETC,
        smoothETCEnvelope,
        analyzeBurstArrivals
    };
})();
