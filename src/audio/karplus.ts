/**
 * Karplus–Strong plucked string with fractional-delay tuning and an optional
 * one-sided "bridge" nonlinearity that imitates the sitar's buzzing jawari.
 * Pure function: no Web Audio, so it can be tested in Node.
 */
export interface PluckParams {
  /** Seconds for the note to fall by 60 dB. */
  t60: number;
  /** 0–1: how bright the excitation noise is. */
  brightness: number;
  /** 0–0.5: where along the string it is plucked (lower = more nasal). */
  pluckPos: number;
  /** 0–1: strength of the jawari buzz; 0 disables it. */
  buzz: number;
  /** 0–0.5: loop low-pass weight; 0.5 is classic Karplus–Strong, lower rings brighter and longer. */
  damp: number;
}

export function karplus(sampleRate: number, freq: number, seconds: number, p: PluckParams): Float32Array {
  const len = Math.floor(sampleRate * seconds);
  const out = new Float32Array(len);

  // Loop delay = N (line) + damp (two-point low-pass) + allpass fraction.
  const s = Math.min(0.5, Math.max(0.05, p.damp));
  const period = sampleRate / freq;
  let n = Math.floor(period - s);
  let frac = period - s - n;
  if (frac < 0.2) {
    n -= 1;
    frac += 1;
  }
  const c = (1 - frac) / (1 + frac);

  // Excitation: filtered noise with a pluck-position comb.
  const exc = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp += p.brightness * (Math.random() * 2 - 1 - lp);
    exc[i] = lp;
  }
  const line = new Float32Array(n);
  const pp = Math.max(1, Math.round(n * p.pluckPos));
  let mean = 0;
  for (let i = 0; i < n; i++) {
    line[i] = exc[i] - (i >= pp ? exc[i - pp] : 0);
    mean += line[i];
  }
  mean /= n;
  let peak = 1e-9;
  for (let i = 0; i < n; i++) {
    line[i] -= mean;
    peak = Math.max(peak, Math.abs(line[i]));
  }
  for (let i = 0; i < n; i++) line[i] /= peak;

  const rho = Math.pow(0.001, 1 / (freq * p.t60));
  let idx = 0;
  let prev = 0;
  let apX = 0;
  let apY = 0;
  let env = 1;
  for (let i = 0; i < len; i++) {
    const x = line[idx];
    out[i] = x;
    const avg = (1 - s) * x + s * prev;
    prev = x;
    const ap = c * avg + apX - c * apY;
    apX = avg;
    apY = ap;
    let y = ap * rho;
    if (p.buzz > 0) {
      // The string grazes a curved bridge on one side of its swing.
      env = Math.max(Math.abs(y), env * 0.9997);
      const th = env * 0.45;
      if (y > th) y = th + (y - th) * (1 - p.buzz);
    }
    line[idx] = y;
    if (++idx >= n) idx = 0;
  }

  // Remove the DC the one-sided clipping introduces, then normalise.
  let dcIn = 0;
  let dcOut = 0;
  let max = 1e-9;
  for (let i = 0; i < len; i++) {
    const x = out[i];
    dcOut = x - dcIn + 0.995 * dcOut;
    dcIn = x;
    out[i] = dcOut;
    max = Math.max(max, Math.abs(dcOut));
  }
  for (let i = 0; i < len; i++) out[i] /= max;
  return out;
}
