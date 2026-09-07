const fs = require('fs');
const path = require('path');

function createWavBuffer(samples, sampleRate = 48000, bitDepth = 24, channels = 1) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  if (bitDepth === 24) {
    const maxVal = 8388607;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      let intVal = Math.round(s * maxVal);
      if (intVal < 0) intVal = 0x1000000 + intVal;
      buffer.writeUInt8(intVal & 0xFF, offset);
      buffer.writeUInt8((intVal >> 8) & 0xFF, offset + 1);
      buffer.writeUInt8((intVal >> 16) & 0xFF, offset + 2);
      offset += 3;
    }
  } else {
    const maxVal = 32767;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      let intVal = Math.round(s * maxVal);
      buffer.writeInt16LE(intVal, offset);
      offset += 2;
    }
  }
  return buffer;
}

function generateAlignmentClickWav() {
  const sampleRate = 48000;
  const durationSec = 15;
  const totalSamples = sampleRate * durationSec;
  const samples = new Float32Array(totalSamples);
  const pulseFreq = 3500;
  const pulseDurationMs = 2.0;
  const pulseSamples = Math.round((pulseDurationMs / 1000) * sampleRate);
  const peakAmplitude = 0.707;

  for (let sec = 0; sec < durationSec; sec++) {
    const startSample = Math.round((sec + 0.5) * sampleRate);
    for (let i = 0; i < pulseSamples; i++) {
      const idx = startSample + i;
      if (idx < totalSamples) {
        const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (pulseSamples - 1)));
        const sine = Math.sin((2 * Math.PI * pulseFreq * i) / sampleRate);
        samples[idx] = peakAmplitude * window * sine;
      }
    }
  }

  const wavBuffer = createWavBuffer(samples, sampleRate, 24, 1);
  fs.writeFileSync('assets/audio/soundengg-delay-alignment-click-48k.wav', wavBuffer);
  fs.writeFileSync('www/assets/audio/soundengg-delay-alignment-click-48k.wav', wavBuffer);
  console.log('Generated soundengg-delay-alignment-click-48k.wav:', (wavBuffer.length / 1024).toFixed(1), 'KB');
}

function generatePinkNoiseWav() {
  const sampleRate = 48000;
  const durationSec = 10;
  const totalSamples = sampleRate * durationSec;
  const samples = new Float32Array(totalSamples);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let sumSq = 0;

  for (let i = 0; i < totalSamples; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    samples[i] = pink * 0.11;
    sumSq += samples[i] * samples[i];
  }

  const currentRms = Math.sqrt(sumSq / totalSamples);
  const targetRms = 0.1;
  const scale = targetRms / currentRms;
  const fadeSamples = Math.round(0.05 * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    let fade = 1.0;
    if (i < fadeSamples) fade = i / fadeSamples;
    else if (i > totalSamples - fadeSamples) fade = (totalSamples - i) / fadeSamples;
    samples[i] = samples[i] * scale * fade;
  }

  const wavBuffer = createWavBuffer(samples, sampleRate, 24, 1);
  fs.writeFileSync('assets/audio/soundengg-pink-noise-reference-48k.wav', wavBuffer);
  fs.writeFileSync('www/assets/audio/soundengg-pink-noise-reference-48k.wav', wavBuffer);
  console.log('Generated soundengg-pink-noise-reference-48k.wav:', (wavBuffer.length / 1024).toFixed(1), 'KB');
}

generateAlignmentClickWav();
generatePinkNoiseWav();
