/** Pitch and harmony helpers shared by the notation parser, the arranger and the MIDI importer. */

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function pitchClass(name: string): number {
  const letter = LETTER_PC[name[0]];
  if (letter === undefined) throw new Error(`Bad pitch name "${name}"`);
  let pc = letter;
  for (const ch of name.slice(1)) {
    if (ch === '#') pc += 1;
    else if (ch === 'b') pc -= 1;
  }
  return (pc + 12) % 12;
}

/** "F#4" → 66 (MIDI, C4 = 60). */
export function noteToMidi(note: string): number {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Bad note "${note}"`);
  const letter = LETTER_PC[m[1][0]];
  const accidental = m[1].length > 1 ? (m[1][1] === '#' ? 1 : -1) : 0;
  return (Number(m[2]) + 1) * 12 + letter + accidental;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface Chord {
  root: number; // pitch class
  /** Pitch classes, root first; the first three form the core triad. */
  tones: number[];
  bass: number; // pitch class of the bass note (root unless slash chord)
}

const QUALITY_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  '5': [0, 7, 12],
};

export const CHORD_TEMPLATES: { suffix: string; intervals: number[] }[] = Object.entries(QUALITY_INTERVALS)
  .filter(([s]) => ['', 'm', '7', 'dim'].includes(s))
  .map(([suffix, intervals]) => ({ suffix, intervals }));

/**
 * Parse a chord symbol: "F#m", "A7", "D/F#", "Bbdim7", or an explicit spelling
 * of pitch classes joined by dots, bass first ("C.E.G.Bb"). "N" is no chord.
 */
export function parseChord(symbol: string): Chord | null {
  if (symbol === 'N') return null;
  if (symbol.includes('.')) {
    const pcs = symbol.split('.').map(pitchClass);
    const tones = [...new Set(pcs)];
    return { root: tones[0], tones, bass: pcs[0] };
  }
  const m = /^([A-G][#b]?)(maj7|m7|sus4|dim7|dim|aug|m|7|5)?(?:\/([A-G][#b]?))?$/.exec(symbol);
  if (!m) throw new Error(`Bad chord "${symbol}"`);
  const root = pitchClass(m[1]);
  return {
    root,
    tones: QUALITY_INTERVALS[m[2] ?? ''].map((i) => (root + i) % 12),
    bass: m[3] ? pitchClass(m[3]) : root,
  };
}

/** Pitch classes of the chord, root first. */
export function chordTones(chord: Chord): number[] {
  return chord.tones;
}

/** Lowest MIDI note >= `min` with the given pitch class. */
export function pcAtOrAbove(pc: number, min: number): number {
  return min + ((pc - (min % 12) + 12) % 12);
}

/**
 * Choose a close-position three-voice chord inside [lo, hi] that moves as little
 * as possible from the previous voicing — plain Baroque voice leading.
 */
export function voiceChord(chord: Chord, prev: number[] | null, lo: number, hi: number): number[] {
  const t = chord.tones;
  const tones = [t[0], t[1] ?? t[0], t[2] ?? t[1] ?? t[0]];
  let best: number[] | null = null;
  let bestCost = Infinity;
  const mid = (lo + hi) / 2;
  for (let inv = 0; inv < 3; inv++) {
    const a = tones[inv];
    const b = tones[(inv + 1) % 3];
    const c = tones[(inv + 2) % 3];
    for (let base = pcAtOrAbove(a, lo); base < lo + 12; base += 12) {
      const v1 = pcAtOrAbove(b, base + 1);
      const v2 = pcAtOrAbove(c, v1 + 1);
      if (v2 > hi) continue;
      const cost = prev
        ? Math.abs(base - prev[0]) + Math.abs(v1 - prev[1]) + Math.abs(v2 - prev[2])
        : Math.abs(v1 - mid);
      if (cost < bestCost) {
        bestCost = cost;
        best = [base, v1, v2];
      }
    }
  }
  return best ?? tones.map((pc) => pcAtOrAbove(pc, lo));
}

/** Krumhansl–Kessler key profiles, for guessing the tonic of imported music. */
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export function estimateKey(histogram: number[]): { tonic: number; minor: boolean } {
  let best = { tonic: 0, minor: false, score: -Infinity };
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const minor of [false, true]) {
      const profile = minor ? MINOR_PROFILE : MAJOR_PROFILE;
      let score = 0;
      for (let i = 0; i < 12; i++) score += histogram[(tonic + i) % 12] * profile[i];
      if (score > best.score) best = { tonic, minor, score };
    }
  }
  return { tonic: best.tonic, minor: best.minor };
}
