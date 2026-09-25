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
