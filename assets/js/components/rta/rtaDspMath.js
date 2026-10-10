// =========================================================================
// RTA DSP MATH, OCTAVE BANDS, FFT, CALIBRATION & WATERFALL COLOR (rtaDspMath.js)
// Extracted from assets/js/components/rtaEngine.js — 100% identical DSP math
// =========================================================================

// 1/6 Octave ISO Standard Center Frequencies
const ISO_FREQS = [
    20, 22.4, 25, 28, 31.5, 35.5, 40, 45, 50, 56, 63, 71, 80, 90, 100, 
    112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 
    1120, 1250, 1400, 1600, 1800, 2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100, 8000, 9000, 10000, 
    11200, 12500, 14000, 16000, 18000, 20000
];
window.ISO_FREQS = ISO_FREQS;

// Standard ISO 1/3-Octave Graphic EQ Fader Center Frequencies (31 Bands)
const ISO_1_3_FREQS = [
    20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 
    630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 
    10000, 12500, 16000, 20000
];
window.ISO_1_3_FREQS = ISO_1_3_FREQS;

// Standard ISO 1/1-Octave Center Frequencies (10 Bands)
const ISO_1_1_FREQS = [
    31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000
];
window.ISO_1_1_FREQS = ISO_1_1_FREQS;

// Fractional Octave Table Generator for 1/12 and 1/24 Octave Resolutions
function generateOctaveFrequencies(fraction) {
    const freqs = [];
    const nMin = Math.floor(fraction * Math.log2(20 / 1000));
    const nMax = Math.ceil(fraction * Math.log2(20000 / 1000));
    for (let n = nMin; n <= nMax; n++) {
        const f = 1000 * Math.pow(2, n / fraction);
        if (f >= 19.5 && f <= 20400) {
            let rounded;
            if (f < 100) rounded = Math.round(f * 10) / 10;
            else if (f < 1000) rounded = Math.round(f);
            else if (f < 10000) rounded = Math.round(f / 10) * 10;
            else rounded = Math.round(f / 100) * 100;
            freqs.push(rounded);
        }
    }
    return freqs;
}

const OCTAVE_TABLES = {
    1: ISO_1_1_FREQS,
    3: ISO_1_3_FREQS,
    6: ISO_FREQS,
    12: generateOctaveFrequencies(12),
    24: generateOctaveFrequencies(24)
};
window.OCTAVE_TABLES = OCTAVE_TABLES;

// A-Weighting Look-up Table for 1/6 octave (fallback for backwards compatibility)
const A_WEIGHTS = { 20:-50.5, 22.4:-48.0, 25:-44.7, 28:-41.6, 31.5:-39.4, 35.5:-37.0, 40:-34.6, 45:-32.4, 50:-30.2, 56:-28.2, 63:-26.2, 71:-24.1, 80:-22.5, 90:-20.8, 100:-19.1, 112:-17.5, 125:-16.1, 140:-14.7, 160:-13.4, 180:-12.2, 200:-10.9, 224:-9.6, 250:-8.6, 280:-7.5, 315:-6.6, 355:-5.7, 400:-4.8, 450:-4.0, 500:-3.2, 560:-2.5, 630:-1.9, 710:-1.3, 800:-0.8, 900:-0.4, 1000:0, 1120:0.3, 1250:0.6, 1400:0.8, 1600:1.0, 1800:1.1, 2000:1.2, 2240:1.3, 2500:1.3, 2800:1.3, 3150:1.2, 3550:1.1, 4000:1.0, 4500:0.8, 5000:0.5, 5600:0.2, 6300:-0.1, 7100:-0.5, 8000:-1.1, 9000:-1.7, 10000:-2.5, 11200:-3.3, 12500:-4.3, 14000:-5.4, 16000:-6.6, 18000:-7.9, 20000:-9.3 };
window.A_WEIGHTS = A_WEIGHTS;

// Exact IEC 61672-1 Analytic Weighting Functions (A-weighting, C-weighting, Z/Flat)
function getIECWeighting(freq, type) {
    if (!freq || freq <= 0) return 0;
    const wType = (type || 'a').toLowerCase();
    if (wType === 'z' || wType === 'flat') return 0;
    const f2 = freq * freq;
    if (wType === 'c') {
        const num = 12194 * 12194 * f2;
        const den = (f2 + 20.6 * 20.6) * (f2 + 12194 * 12194);
        return 20 * Math.log10(num / den) + 0.06;
    }
    // Default to A-weighting
    const num = 12194 * 12194 * f2 * f2;
    const den = (f2 + 20.6 * 20.6) * Math.sqrt((f2 + 107.7 * 107.7) * (f2 + 737.9 * 737.9)) * (f2 + 12194 * 12194);
    return 20 * Math.log10(num / den) + 2.0;
}
window.getIECWeighting = getIECWeighting;

// 7-Window Function DSP Engine with Coherent Gain Amplitude Calibration
function buildWindowTables(N) {
    const tables = {};
    const windowDefs = {
        hann: (i) => 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))),
        hamming: (i) => 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1)),
        flattop: (i) => {
            const a0 = 0.21557895, a1 = 0.41663158, a2 = 0.277263158, a3 = 0.083578947, a4 = 0.006947368;
            const phi = 2 * Math.PI * i / (N - 1);
            return a0 - a1 * Math.cos(phi) + a2 * Math.cos(2 * phi) - a3 * Math.cos(3 * phi) + a4 * Math.cos(4 * phi);
        },
        blackman_harris: (i) => {
            const a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
            const phi = 2 * Math.PI * i / (N - 1);
            return a0 - a1 * Math.cos(phi) + a2 * Math.cos(2 * phi) - a3 * Math.cos(3 * phi);
        },
        hft223d: (i) => {
            const phi = 2 * Math.PI * i / (N - 1);
            return 1 - 1.932934889 * Math.cos(phi) + 1.283563383 * Math.cos(2 * phi) - 0.381308016 * Math.cos(3 * phi) + 0.0322 * Math.cos(4 * phi);
        },
        rectangular: () => 1.0,
        exponential: (i) => Math.exp(-3.0 * i / (N - 1))
    };

    for (const [key, fn] of Object.entries(windowDefs)) {
        const arr = new Float32Array(N);
        let sum = 0;
        for (let i = 0; i < N; i++) {
            const w = fn(i);
            arr[i] = w;
            sum += w;
        }
        const scale = sum > 0.0001 ? 2.0 / sum : 2.0 / N;
        tables[key] = { table: arr, sum, scale };
    }
    return tables;
}

// In-Memory Fast Radix-2 Real FFT Engine with Precomputed Trigonometric Tables
let fftTwiddleCos = null;
let fftTwiddleSin = null;
let fftBitRev = null;
let fftReal = null;
let fftImag = null;

function initFFTBuffers(N) {
    fftTwiddleCos = new Float32Array(N / 2);
    fftTwiddleSin = new Float32Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
        fftTwiddleCos[i] = Math.cos(-2 * Math.PI * i / N);
        fftTwiddleSin[i] = Math.sin(-2 * Math.PI * i / N);
    }
    fftBitRev = new Uint16Array(N);
    let j = 0;
    for (let i = 0; i < N; i++) {
        fftBitRev[i] = j;
        let bit = N >> 1;
        while (j >= bit && bit > 0) {
            j -= bit;
            bit >>= 1;
        }
        j += bit;
    }
    fftReal = new Float32Array(N);
    fftImag = new Float32Array(N);
}

function computeCustomFFT(timeDomainData, windowKey, windowTablesRef, outMagArray) {
    const N = timeDomainData.length;
    if (!fftBitRev || fftBitRev.length !== N) {
        initFFTBuffers(N);
    }
    const winEntry = (windowTablesRef && windowTablesRef[windowKey]) || (windowTablesRef && windowTablesRef['hann']);
    const winTable = winEntry ? winEntry.table : null;
    const winScale = winEntry ? winEntry.scale : (2.0 / N);

    if (winTable) {
        for (let i = 0; i < N; i++) {
            fftReal[i] = timeDomainData[i] * winTable[i];
            fftImag[i] = 0;
        }
    } else {
        for (let i = 0; i < N; i++) {
            fftReal[i] = timeDomainData[i];
            fftImag[i] = 0;
        }
    }

    for (let i = 0; i < N; i++) {
        const rev = fftBitRev[i];
        if (i < rev) {
            const tr = fftReal[i]; fftReal[i] = fftReal[rev]; fftReal[rev] = tr;
            const ti = fftImag[i]; fftImag[i] = fftImag[rev]; fftImag[rev] = ti;
        }
    }

    for (let halfSize = 1; halfSize < N; halfSize <<= 1) {
        const step = halfSize << 1;
        const twiddleStep = N / step;
        for (let i = 0; i < N; i += step) {
            for (let k = 0; k < halfSize; k++) {
                const twIdx = k * twiddleStep;
                const cos = fftTwiddleCos[twIdx];
                const sin = fftTwiddleSin[twIdx];
                const matchIdx = i + k + halfSize;
                const tr = fftReal[matchIdx] * cos - fftImag[matchIdx] * sin;
                const ti = fftReal[matchIdx] * sin + fftImag[matchIdx] * cos;
                fftReal[matchIdx] = fftReal[i + k] - tr;
                fftImag[matchIdx] = fftImag[i + k] - ti;
                fftReal[i + k] += tr;
                fftImag[i + k] += ti;
            }
        }
    }

    const halfN = N >> 1;
    for (let i = 0; i < halfN; i++) {
        const r = fftReal[i];
        const im = fftImag[i];
        const mag = Math.sqrt(r * r + im * im) * winScale;
        outMagArray[i] = mag > 1e-6 ? 20 * Math.log10(mag) : -120;
    }
}

function formatConsoleEQFader(freq) {
    if (!freq || freq <= 0) return '---';
    let closest = ISO_1_3_FREQS[0];
    let minDiff = Math.abs(Math.log2(freq / closest));
    for (let i = 1; i < ISO_1_3_FREQS.length; i++) {
        const diff = Math.abs(Math.log2(freq / ISO_1_3_FREQS[i]));
        if (diff < minDiff) {
            minDiff = diff;
            closest = ISO_1_3_FREQS[i];
        }
    }
    if (closest >= 1000) {
        const val = closest / 1000;
        return (closest % 1000 === 0 ? val.toFixed(0) : val.toFixed(closest % 100 === 0 ? 1 : 2)) + 'k';
    }
    return closest + ' Hz';
}
window.formatConsoleEQFader = formatConsoleEQFader;

// --- Custom Mic Calibration Parser & Interpolator ---
function parseCalibrationData(text) {
    const lines = text.split('\n');
    const parsed = [];
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith(';') || line.startsWith('#') || line.startsWith('*')) {
            continue;
        }
        
        const parts = line.replace(/,/g, ' ').split(/\s+/);
        if (parts.length >= 2) {
            const freq = parseFloat(parts[0]);
            const offset = parseFloat(parts[1]);
            if (!isNaN(freq) && !isNaN(offset)) {
                parsed.push({ freq, offset });
            }
        }
    }
    return parsed;
}

function buildCalibrationOffsetsArray(calProfile, bufferLength, sampleRate) {
    if (!bufferLength) return null;
    const nyquist = (sampleRate || 48000) / 2;
    const offsets = new Float32Array(bufferLength).fill(0);
    
    if (!calProfile || calProfile.length === 0) return offsets;

    // Sort profile ascending by frequency
    calProfile.sort((a, b) => a.freq - b.freq);

    for (let i = 0; i < bufferLength; i++) {
        const f = (i * nyquist) / bufferLength;
        
        if (f <= calProfile[0].freq) {
            offsets[i] = calProfile[0].offset;
        } else if (f >= calProfile[calProfile.length - 1].freq) {
            offsets[i] = calProfile[calProfile.length - 1].offset;
        } else {
            let lowPt = calProfile[0];
            let highPt = calProfile[calProfile.length - 1];
            for (let j = 0; j < calProfile.length - 1; j++) {
                if (f >= calProfile[j].freq && f <= calProfile[j + 1].freq) {
                    lowPt = calProfile[j];
                    highPt = calProfile[j + 1];
                    break;
                }
            }
            const logF = Math.log10(f || 1);
            const logLow = Math.log10(lowPt.freq || 1);
            const logHigh = Math.log10(highPt.freq || 1);
            const pct = (logF - logLow) / (logHigh - logLow || 1);
            offsets[i] = lowPt.offset + pct * (highPt.offset - lowPt.offset);
        }
    }
    return offsets;
}

function interpolateCalOffsetForFreq(calProfile, f) {
    if (!calProfile || calProfile.length === 0) return 0;
    if (f <= calProfile[0].freq) return calProfile[0].offset;
    if (f >= calProfile[calProfile.length - 1].freq) return calProfile[calProfile.length - 1].offset;
    
    for (let j = 0; j < calProfile.length - 1; j++) {
        if (f >= calProfile[j].freq && f <= calProfile[j + 1].freq) {
            const lowPt = calProfile[j];
            const highPt = calProfile[j + 1];
            const logF = Math.log10(f || 1);
            const logLow = Math.log10(lowPt.freq || 1);
            const logHigh = Math.log10(highPt.freq || 1);
            const pct = (logF - logLow) / (logHigh - logLow || 1);
            return lowPt.offset + pct * (highPt.offset - lowPt.offset);
        }
    }
    return 0;
}

// --- Rolling Spectrogram Waterfall Color Map ---
function getWaterfallColor(displayDB) {
    const minDB = 45;
    const maxDB = 110;
    const norm = Math.max(0, Math.min(1, (displayDB - minDB) / (maxDB - minDB)));
    
    if (norm < 0.2) {
        const p = norm / 0.2;
        return `hsl(240, 100%, ${Math.floor(2 + p * 8)}%)`;
    } else if (norm < 0.5) {
        const p = (norm - 0.2) / 0.3;
        return `hsl(${Math.floor(240 - p * 60)}, 100%, ${Math.floor(10 + p * 20)}%)`;
    } else if (norm < 0.8) {
        const p = (norm - 0.5) / 0.3;
        return `hsl(${Math.floor(180 - p * 160)}, 100%, ${Math.floor(30 + p * 20)}%)`;
    } else {
        const p = (norm - 0.8) / 0.2;
        return `hsl(${Math.floor(20 + p * 40)}, 100%, ${Math.floor(50 + p * 40)}%)`;
    }
}

window.RtaDspMath = {
    ISO_FREQS,
    ISO_1_3_FREQS,
    ISO_1_1_FREQS,
    OCTAVE_TABLES,
    A_WEIGHTS,
    generateOctaveFrequencies,
    getIECWeighting,
    buildWindowTables,
    initFFTBuffers,
    computeCustomFFT,
    formatConsoleEQFader,
    parseCalibrationData,
    buildCalibrationOffsetsArray,
    interpolateCalOffsetForFreq,
    getWaterfallColor
};
