import type { NoteEvent } from './notation';

/**
 * Dynamics for a melody written without any: a player's phrasing, roughly.
 *
 * - Phrases (split at rests and after long notes) swell towards their highest
 *   note and relax at the end.
 * - Strong beats lean, weak subdivisions are lighter.
 * - Long notes are given a little more weight.
 * - Passages that sit higher than the rest of the piece are played out,
 *   lower ones held back, like Baroque terraced dynamics.
 *
 * Notes that already carry a velocity (from a MIDI file) keep it, with only a
 * light metric accent added so they still breathe.
 */
export function shapeMelody(notes: NoteEvent[], beatsPerBar: number, pickup: number, pulse: number): number[] {
  const n = notes.length;
  const out = new Array<number>(n).fill(0.8);
  if (!n) return out;

  const durs = notes.map((x) => x.dur).sort((a, b) => a - b);
  const median = durs[Math.floor(n / 2)];
  const longNote = Math.max(1.5, median * 3);

  // Phrase boundaries.
  const phraseOf = new Int32Array(n);
  let phrase = 0;
  for (let i = 1; i < n; i++) {
    const prev = notes[i - 1];
    const gap = notes[i].beat - (prev.beat + prev.dur);
    if (gap >= 0.5 - 1e-6 || prev.dur >= longNote - 1e-6) phrase++;
    phraseOf[i] = phrase;
  }

  // Register of each four-bar span against the whole piece.
  const span = beatsPerBar * 4;
  const mean = notes.reduce((s, x) => s + x.midi, 0) / n;
  const spanSum = new Map<number, [number, number]>();
  for (const x of notes) {
    const k = Math.floor(Math.max(0, x.beat - pickup) / span);
    const e = spanSum.get(k) ?? [0, 0];
    e[0] += x.midi;
    e[1]++;
    spanSum.set(k, e);
  }

  let start = 0;
  while (start < n) {
    let end = start;
    while (end + 1 < n && phraseOf[end + 1] === phraseOf[start]) end++;
    let lo = Infinity;
    let hi = -Infinity;
    let peak = start;
    for (let i = start; i <= end; i++) {
      if (notes[i].midi < lo) lo = notes[i].midi;
      if (notes[i].midi > hi) {
        hi = notes[i].midi;
        peak = i;
      }
    }
    const len = end - start + 1;
    for (let i = start; i <= end; i++) {
      const x = notes[i];
      if (x.vel !== undefined) {
        out[i] = 0.35 + 0.65 * x.vel + accent(x.beat, beatsPerBar, pickup, pulse) * 0.5;
        continue;
      }
      // Swell towards the phrase's summit, then ease away from it.
      const toPeak = i <= peak ? (i - start + 1) / (peak - start + 1) : 1 - (i - peak) / (end - peak + 1);
      const contour = hi > lo ? (x.midi - lo) / (hi - lo) : 0.5;
      let v = 0.66 + 0.1 * toPeak + 0.08 * contour;
      v += accent(x.beat, beatsPerBar, pickup, pulse);
      if (x.dur >= 1.5) v += 0.04;
      if (i === end && len > 2 && x.dur < longNote) v -= 0.05;
      const k = Math.floor(Math.max(0, x.beat - pickup) / span);
      const [sum, count] = spanSum.get(k)!;
      v += Math.max(-0.08, Math.min(0.08, (sum / count - mean) * 0.012));
      out[i] = v;
    }
    start = end + 1;
  }
  for (let i = 0; i < n; i++) out[i] = Math.max(0.45, Math.min(1, out[i]));
  return out;
}

/** Metric weight: downbeats lean, main beats hold, subdivisions lighten. */
function accent(beat: number, beatsPerBar: number, pickup: number, pulse: number): number {
  const inBar = (((beat - pickup) % beatsPerBar) + beatsPerBar) % beatsPerBar;
  if (inBar < 1e-3 || beatsPerBar - inBar < 1e-3) return 0.08;
  const inPulse = inBar / pulse;
  if (Math.abs(inPulse - Math.round(inPulse)) < 1e-3) return 0.02;
  const inBeat = inBar % 1;
  if (Math.abs(inBeat - 0.5) < 1e-3 || Math.abs(inBeat - 1 / 3) < 1e-3 || Math.abs(inBeat - 2 / 3) < 1e-3) return -0.03;
  return -0.06;
}
