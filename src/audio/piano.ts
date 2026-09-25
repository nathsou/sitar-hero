/**
 * An additive piano tone: inharmonic partials from two slightly detuned strings,
 * each with a fast "prompt" decay and a slow "aftersound", plus a hammer thump.
 * Pure function: no Web Audio, so it can be tested in Node.
 */
export function pianoTone(sampleRate: number, midi: number, maxSeconds: number): Float32Array {
  const f0 = 440 * Math.pow(2, (midi - 69) / 12);
  // Low strings ring for many seconds, high ones for barely one.
  const t1 = Math.min(9, Math.max(0.9, 9 * Math.pow(0.5, (midi - 36) / 17)));
  const seconds = Math.min(maxSeconds, t1 * 0.9 + 0.3);
  const len = Math.floor(sampleRate * seconds);
  const out = new Float32Array(len);
  const inharm = 0.00007 * Math.pow(2, ((midi - 48) / 12) * 0.9);
  const nyquist = sampleRate * 0.45;

  for (let n = 1; n <= 24; n++) {
    const fn = n * f0 * Math.sqrt(1 + inharm * n * n);
    if (fn > nyquist || fn > 9000) break;
    // Hammer strikes at ~1/8 of the string: that harmonic family is weak.
    const amp = (1 / Math.pow(n, 1.15)) * (Math.abs(Math.sin((Math.PI * n) / 8)) + 0.12);
    const fast = Math.exp(-1 / (sampleRate * ((t1 * 0.22) / (1 + 0.35 * (n - 1)))));
    const slow = Math.exp(-1 / (sampleRate * (t1 / (1 + 0.55 * (n - 1)))));
    for (const detune of [1.00035, 0.99965]) {
      const w = (2 * Math.PI * fn * detune) / sampleRate;
      const c = Math.cos(w);
      const s = Math.sin(w);
      let re = 1;
      let im = 0;
      let e1 = 0.62 * amp * 0.5;
      let e2 = 0.38 * amp * 0.5;
      for (let i = 0; i < len; i++) {
        const r = re * c - im * s;
        im = re * s + im * c;
        re = r;
        out[i] += im * (e1 + e2);
        e1 *= fast;
        e2 *= slow;
      }
    }
  }

  // Hammer: a short burst of low-passed noise, and a 2 ms onset ramp.
  let lp = 0;
  const hammer = Math.floor(sampleRate * 0.012);
  const onset = Math.floor(sampleRate * 0.002);
  for (let i = 0; i < len; i++) {
    if (i < hammer) {
      lp += 0.25 * (Math.random() * 2 - 1 - lp);
      out[i] += lp * 0.25 * (1 - i / hammer);
    }
    if (i < onset) out[i] *= i / onset;
  }

  let peak = 1e-9;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  // Normalise, and fade the last fifth so a truncated tail never clicks.
  const fadeFrom = Math.floor(len * 0.8);
  for (let i = 0; i < len; i++) {
    const fade = i < fadeFrom ? 1 : Math.pow((len - i) / (len - fadeFrom), 2);
    out[i] = (out[i] / peak) * fade;
  }
  return out;
}

/** Drop the silent tail of a decaying buffer (below −60 dB). */
export function trimTail(data: Float32Array, threshold = 0.001): Float32Array {
  let end = data.length;
  while (end > 0 && Math.abs(data[end - 1]) < threshold) end--;
  return end < data.length * 0.95 ? data.slice(0, Math.min(data.length, end + 64)) : data;
}

/**
 * A modern concert grand. Compared with the fortepiano above: three strings per
 * note from the tenor up (two in the low tenor, one in the bass), each slightly
 * out of unison so the tone beats and blooms into a long aftersound; stiffer,
 * more inharmonic strings; a felt hammer that rolls off the upper partials; and
 * a sustain several times longer. Brightness by velocity is applied at playback.
 */
export function grandTone(sampleRate: number, midi: number, maxSeconds: number): Float32Array {
  const f0 = 440 * Math.pow(2, (midi - 69) / 12);
  // Time for the aftersound to fall 60 dB: ~24 s in the bass, ~8 s at middle C, ~3 s at the top.
  const t60 = Math.min(24, Math.max(3, 24 * Math.pow(0.5, (midi - 24) / 22)));
  const seconds = Math.min(maxSeconds, t60 * 0.5 + 0.5);
  const len = Math.floor(sampleRate * seconds);
  const out = new Float32Array(len);
  const inharm = Math.min(0.003, 0.00005 * Math.pow(2, (midi - 36) / 12));
  const nyquist = sampleRate * 0.45;
  const unison = midi < 34 ? [1] : midi < 46 ? [1.0003, 0.9997] : [1.00045, 1, 0.99962];
  // Felt hammer: partials above this fall away (brighter in the treble).
  const felt = Math.min(7000, 900 + f0 * 7);
  const floor = 1e-4;

  for (let n = 1; n <= 40; n++) {
    const fn = n * f0 * Math.sqrt(1 + inharm * n * n);
    if (fn > nyquist) break;
    const strike = Math.abs(Math.sin((Math.PI * n) / 8.5)) + 0.08;
    const amp = (strike / Math.pow(n, 0.9)) / (1 + Math.pow(fn / felt, 2.2));
    if (amp < 0.002) continue;
    // Higher partials die away faster; the prompt sound is a fifth of the aftersound.
    const slowTau = t60 / 6.9 / (1 + Math.pow(fn / 1200, 1.3) + 0.08 * (n - 1));
    const fastTau = slowTau * 0.2;
    const fast = Math.exp(-1 / (sampleRate * fastTau));
    const slow = Math.exp(-1 / (sampleRate * slowTau));
    const strings = n <= 14 ? unison : [1];
    for (const detune of strings) {
      const w = (2 * Math.PI * fn * detune) / sampleRate;
      const c = Math.cos(w);
      const s = Math.sin(w);
      let re = Math.cos(detune * 7.1 * n);
      let im = Math.sin(detune * 7.1 * n);
      let e1 = (0.55 * amp) / strings.length;
      let e2 = (0.45 * amp) / strings.length;
      for (let i = 0; i < len; i++) {
        const r = re * c - im * s;
        im = re * s + im * c;
        re = r;
        out[i] += im * (e1 + e2);
        e1 *= fast;
        e2 *= slow;
        // Stop once this partial is inaudible: most of the work is the first second.
        if ((i & 1023) === 0 && e1 + e2 < floor * amp) break;
      }
    }
  }

  // Hammer knock: a brief, soft, low-passed thump, quieter in the treble.
  let lp = 0;
  const knock = Math.floor(sampleRate * 0.008);
  const knockGain = 0.12 * Math.max(0.3, 1 - (midi - 40) / 60);
  const onset = Math.floor(sampleRate * 0.0015);
  for (let i = 0; i < len; i++) {
    if (i < knock) {
      lp += 0.18 * (Math.random() * 2 - 1 - lp);
      out[i] += lp * knockGain * (1 - i / knock);
    }
    if (i < onset) out[i] *= i / onset;
  }

  let peak = 1e-9;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  const fadeFrom = Math.floor(len * 0.85);
  for (let i = 0; i < len; i++) {
    const fade = i < fadeFrom ? 1 : Math.pow((len - i) / (len - fadeFrom), 2);
    out[i] = (out[i] / peak) * fade;
  }
  return out;
}
