import { pitchClass as pc } from '../theory';
import { rep, seq, song, type SongDef } from '../types';

/** Write each note as a triplet eighth (three to the beat). */
const t3 = (notes: string) => notes.trim().split(/\s+/).map((n) => `${n}e3`).join(' ');
/** Write each note as a triplet sixteenth (six to the beat). */
const s3 = (notes: string) => notes.trim().split(/\s+/).map((n) => `${n}s3`).join(' ');

// ─── Canon in D ────────────────────────────────────────────────────────────

/**
 * First violin, from the 1st entry to the end of the famous semiquaver passage
 * (original bars 3–22). Note values are doubled so the ground moves in half
 * notes: each original bar becomes two bars here.
 */
const CANON = `
  F#5h E5h | D5h C#5h | B4h A4h | B4h C#5h |
  D5h C#5h | B4h A4h | G4h F#4h | G4h E4h |
  D4q F#4q A4q G4q | F#4q D4q F#4q E4q | D4q B3q D4q A4q | G4q B4q A4q G4q |
  F#4q D4q E4q C#5q | D5q F#5q A5q A4q | B4q G4q A4q F#4q | D4q D5q D5q. C#5e |
  D5e C#5e D5e D4e C#4e A3e E4e F#4e | D4e D5e C#5e B4e C#5e F#5e A5e B5e |
  G5e F#5e E5e G5e F#5e E5e D5e C#5e | B4e A4e G4e F#4e E4e G4e F#4e E4e |
  D4e E4e F#4e G4e A4e E4e A4e G4e | F#4e B4e A4e G4e A4e G4e F#4e E4e |
  D4e B3e B4e C#5e D5e C#5e B4e A4e | G4e F#4e E4e B4e A4e B4e A4e G4e |
  F#4q F#5q E5h | r q D5q F#5h | B4h A4h | B4h C#5h |
  D5q D5q C#5h | r q B4q D5h | D5h. D5q | D5q G5q E5q A5q |
  A5e F#5s G5s A5e F#5s G5s A5s A4s B4s C#5s D5s E5s F#5s G5s |
  F#5e D5s E5s F#5e F#4s G4s A4s B4s A4s G4s A4s F#4s G4s A4s |
  G4e B4s A4s G4e F#4s E4s F#4s E4s D4s E4s F#4s G4s A4s B4s |
  G4e B4s A4s B4e C#5s D5s A4s B4s C#5s D5s E5s F#5s G5s A5s |
  F#5e D5s E5s F#5e E5s D5s E5s C#5s D5s E5s F#5s E5s D5s C#5s |
  D5e B4s C#5s D5e D4s E4s F#4s G4s F#4s E4s F#4s D5s C#5s D5s |
  B4e D5s C#5s B4e A4s G4s A4s G4s F#4s G4s A4s B4s C#5s D5s |
  B4e D5s C#5s D5e C#5s B4s C#5s D5s E5s D5s C#5s D5s B4s C#5s |
  D5w |`;
/** Ground cycles under the melody (each cycle is four bars). */
const CANON_CYCLES = 10;

// ─── Toccata and Fugue in D minor ──────────────────────────────────────────

/** Toccata bars 1–14 and fugue bars 30–46 (Bach-Gesellschaft numbering), top voice. */
const TOCCATA: Record<string, [string, string]> = {
  // The three unison flourishes, each an octave lower.
  T1: ['A5s G5s A5h. r e |', 'N:4 |'],
  T2: ['G5s F5s E5s D5s C#5e D5e ~D5h |', 'N:4 |'],
  T3: ['A4s G4s A4h. r e |', 'N:4 |'],
  T4: ['E4s F4s C#4s D4s ~D4h. |', 'N:4 |'],
  T5: ['A3s G3s A3h. r e |', 'N:4 |'],
  T6: ['G3s F3s E3s D3s C#3e D3e ~D3h |', 'N:4 |'],
  // The diminished seventh over the pedal D, resolving to D major.
  T7: ['D3q C#3e E3e G3e Bb3e C#4e E4e |', 'D.C#.E.G.Bb:4 |'],
  T8: ['~E4q D4q r q r e. C#4s |', 'D.C#.E.G.Bb:1 D:3 |'],
  // Prestissimo triplets, first low then an octave higher.
  P4: [`${s3('D4 E4 C#4 D4 E4 C#4 D4 E4 C#4')} D4s E4s ${s3('F4 G4 E4 F4 G4 E4 F4 G4 E4')} F4s G4s |`, 'A7:4 |'],
  P5: [`${s3('A4 Bb4 G4 A4 Bb4 G4 A4 Bb4 G4')} A4s r s r q r e. C#5s |`, 'A7:4 |'],
  P6: [`${s3('D5 E5 C#5 D5 E5 C#5 D5 E5 C#5')} D5s E5s ${s3('F5 G5 E5 F5 G5 E5 F5 G5 E5')} F5s G5s |`, 'A7:4 |'],
  P7: [`${s3('A5 Bb5 G5 A5 Bb5 G5 A5 Bb5 G5')} A5s r s r q r e. A5s |`, 'A7:4 |'],
  // The descending chain of broken chords.
  P8: [`${s3('G5 Bb5 E5 G5 Bb5 E5 F5 A5 D5 F5 A5 D5 E5 G5 C5 E5 G5 C5 D5 F5 Bb4 D5 F5 Bb4')} |`, 'C7:1 Dm:1 C:1 Bb:1 |'],
  P9: [`${s3('C5 E5 A4 C5 E5 A4 Bb4 D5 G4 Bb4 D5 G4 A4 C5 F4 A4 C5 F4 G4 Bb4 E4 G4 Bb4 E4')} |`, 'Am:1 Gm:1 F:1 C7:1 |'],
  P10: [`${s3('F4 A4 D4 F4 A4 D4 E4 G4 C#4 E4 G4 C#4')} r q G4q |`, 'Dm:1 A7:3 |'],
  // Semiquavers over the repeated A.
  P12: ['F4q r e r s A4s D5s E5s F5s D5s E5s F5s G5s E5s |', 'Dm:4 |'],
  P13: ['F5s G5s A5s F5s G5s A5s Bb5s G5s A5s F5s G5s E5s F5s D5s E5s C#5s |', 'Dm:1 Gm:1 A7:2 |'],
  P14: ['D5s A4s Bb4s G4s A4s F4s G4s E4s F4s D4s G4s E4s F4s D4s E4s C#4s |', 'Dm:2 A7:2 |'],
  // Fugue: the subject over its repeated A, the answer over D, then the soprano entry.
  F0: ['D3q r q r s A4s G4s A4s F4s A4s E4s A4s |', 'Dm:4 |'],
  F1: ['D4s A4s C#4s A4s D4s A4s E4s A4s F4s A4s A3s A4s B3s A4s C#4s A4s |', 'Dm:1 A:1 Dm:1 A:1 |'],
  F2: ['D4s A4s C#4s A4s D4s A4s E4s A4s r s D5s C5s D5s Bb4s D5s A4s D5s |', 'Dm:1 A:1 D7:1 Gm:1 |'],
  F3: ['G4s D5s F#4s D5s G4s D5s A4s D5s Bb4s D5s D4s D5s E4s D5s F#4s D5s |', 'Gm:1 D:1 Gm:1 D7:1 |'],
  F4: ['G4s D5s F#4s D5s G4s D5s A4s D5s Bb4e D5e Bb4e D5e |', 'Gm:1 D:1 Gm:2 |'],
  F5: ['Eb5e G4e Eb5e G4e C5e A4e C5e A4e |', 'Cm:2 F:2 |'],
  F6: ['D5e F4e D5e F4e Bb4e G4e Bb4e G4e |', 'Bb:2 C7:2 |'],
  F7: ['C#5e E4e C#5e E4e A4e F4e A4e F4e |', 'A:2 Dm:2 |'],
  F8: ['G4e C#4e G4e C#4e F4e D4e F4e D4e |', 'A7:2 Dm:2 |'],
  F9: ['E4e Bb3e E4e Bb3e r s A5s G5s A5s F5s A5s E5s A5s |', 'A7:2 Dm:2 |'],
  F10: ['D5s A5s C#5s A5s D5s A5s E5s A5s F5s A5s A4s A5s B4s A5s C#5s A5s |', 'Dm:1 A:1 Dm:1 A:1 |'],
  F11: ['D5s A5s C#5s A5s D5s A5s E5s A5s F5s A5s E5s A5s D5s A5s C5s A5s |', 'Dm:1 A:1 Dm:1 F:1 |'],
  F12: ['Bb4s A5s C5s A5s D5s G5s Bb4s G5s E5s G5s D5s G5s C5s G5s Bb4s G5s |', 'Bb:1 Gm:1 C7:2 |'],
  F13: ['A4s G5s Bb4s G5s C5s F5s A4s F5s D5s F5s C5s F5s Bb4s F5s A4s F5s |', 'C7:1 F:3 |'],
  F14: ['G4s F5s A4s F5s Bb4s E5s G4s E5s C#5s E5s Bb4s E5s A4s E5s G4s E5s |', 'Dm:1 Gm:1 A7:2 |'],
  F15: ['F4s E5s G4s E5s A4s D5s F4s D5s E4s E5s E4s E5s F4s D5s F4s D5s |', 'A7:1 Dm:1 A:1 Dm:1 |'],
  F16: ['Bb4s C#5s Bb4s C#5s A4s D5s F4s D5s E4s E5s E4s E5s F4s D5s F4s D5s |', 'A7:1 Dm:1 A:1 Dm:1 |'],
  END: ['D5w |', 'Dm:4 |'],
};

// ─── Prelude in C (WTC I) ──────────────────────────────────────────────────

/** Each bar of the Prelude is one five-note chord broken in the same figure, twice. */
const PRELUDE_BARS = [
  'C4 E4 G4 C5 E5', 'C4 D4 A4 D5 F5', 'B3 D4 G4 D5 F5', 'C4 E4 G4 C5 E5',
  'C4 E4 A4 E5 A5', 'C4 D4 F#4 A4 D5', 'B3 D4 G4 D5 G5', 'B3 C4 E4 G4 C5',
  'A3 C4 E4 G4 C5', 'D3 A3 D4 F#4 C5', 'G3 B3 D4 G4 B4', 'G3 Bb3 E4 G4 C#5',
  'F3 A3 D4 A4 D5', 'F3 Ab3 D4 F4 B4', 'E3 G3 C4 G4 C5', 'E3 F3 A3 C4 F4',
  'D3 F3 A3 C4 F4', 'G2 D3 G3 B3 F4', 'C3 E3 G3 C4 E4', 'C3 G3 Bb3 C4 E4',
  'F2 F3 A3 C4 E4', 'F#2 C3 A3 C4 Eb4', 'Ab2 F3 B3 C4 D4', 'G2 F3 G3 B3 D4',
  'G2 E3 G3 C4 E4', 'G2 D3 G3 C4 F4', 'G2 D3 G3 B3 F4', 'G2 Eb3 A3 C4 F#4',
  'G2 E3 G3 C4 G4', 'G2 D3 G3 C4 F4', 'G2 D3 G3 B3 F4', 'C2 C3 G3 Bb3 E4',
  'C2 C3 F3 A3 C4', 'C2 B2 G3 B3 D4',
];

function prelude(): [string, string] {
  const mel: string[] = [];
  const ch: string[] = [];
  for (const bar of PRELUDE_BARS) {
    const [a, b, c, d, e] = bar.split(' ');
    const fig = [a, b, c, d, e, c, d, e];
    mel.push([...fig, ...fig].map((n) => `${n}s`).join(' ') + ' |');
    ch.push(`${[a, b, c, d, e].map((n) => n.replace(/-?\d$/, '')).join('.')}:4 |`);
  }
  mel.push('C4w |');
  ch.push('C.E.G:4 |');
  return [mel.join(' '), ch.join(' ')];
}

// ─── Jesu, Joy of Man's Desiring ───────────────────────────────────────────

/** The triplet obbligato of BWV 147/10, with the first chorale line where it rests. */
const JESU: Record<string, [string, string]> = {
  r0: [`r e3 ${t3('G4 A4 B4 D5 C5 C5 E5 D5')} |`, 'G:2 C:1 |'],
  r0b: [`${t3('G4 B4 A4 B4 D5 C5 C5 E5 D5')} |`, 'G:2 C:1 |'],
  r1: [`${t3('D5 G5 F#5 G5 D5 B4 G4 A4 B4')} |`, 'G:1 Em:1 G:1 |'],
  r2: [`${t3('C5 D5 E5 D5 C5 B4 A4 B4 G4')} |`, 'Am:1 G:1 C:1 |'],
  r3: [`${t3('F#4 G4 A4 D4 F#4 A4 C5 B4 A4')} |`, 'D:1 D7:2 |'],
  r4: [`${t3('B4 G4 A4 B4 D5 C5 C5 E5 D5')} |`, 'G:2 C:1 |'],
  r6: [`${t3('A4 D5 C5 B4 A4 G4 D4 G4 F#4')} |`, 'D7:1 G:1 D7:1 |'],
  r6b: [`${t3('E4 D5 C5 B4 A4 G4 D4 G4 F#4')} |`, 'C:1 G:1 D7:1 |'],
  r7: [`${t3('G4 B4 D5 G5 D5 B4 G4 B4 D5')} |`, 'G:3 |'],
  // Chorale: "Jesu, joy of man's desiring…"
  c8: ['B4h C5q |', 'G:1 Bm:1 C:1 |'],
  c9: ['D5h D5q |', 'D:1 Em:1 G:1 |'],
  c10: ['C5h B4q |', 'Am:1 D7:1 G:1 |'],
  o11: [`${t3('A4 D4 E4 F#4 A4 G4 A4 C5 B4')} |`, 'D:2 D7:1 |'],
  o12: [`${t3('C5 A4 F#4 D4 F#4 A4 C5 B4 A4')} |`, 'D7:3 |'],
  // Middle episode through E minor, A minor and C major.
  m0: [`${t3('G4 B4 D5 G5 D5 B4 G4 B4 C#5')} |`, 'G:2 A7:1 |'],
  m1: [`${t3('D5 D4 E4 F#4 A4 G#4 G#4 B4 A4')} |`, 'D:2 E:1 |'],
  m2: [`${t3('A4 C5 B4 C5 A4 E4 C4 D4 E4')} |`, 'Am:3 |'],
  m3: [`${t3('F4 D5 C5 D5 B4 G#4 E4 F#4 G#4')} |`, 'Dm:1 E7:2 |'],
  m4: [`${t3('A4 C5 B4 C5 E5 D5 D5 F5 E5')} |`, 'Am:2 Dm:1 |'],
  m5: [`${t3('E5 A5 G#5 A5 E5 C5 A4 B4 C5')} |`, 'E7:1 Am:2 |'],
  m6: [`${t3('F5 E5 D5 C5 B4 A4 E4 A4 G#4')} |`, 'Dm:1 Am:1 E:1 |'],
  m7: [`${t3('A4 C5 E5')} A5h |`, 'Am:3 |'],
  m8: [`r e3 ${t3('C5 D5 E5 G5 F5 G5 Bb5 A5')} |`, 'C:2 C7:1 |'],
  m9: [`${t3('A5 C6 B5 C6 A5 F5 D5 E5 F5')} |`, 'F:2 Dm:1 |'],
  m10: [`${t3('E5 G5 F5 G5 E5 C5 G4 A4 Bb4')} |`, 'C:2 C7:1 |'],
  m11: [`${t3('A4 C5 B4 C5 A4 F4 D4 E4 F4')} |`, 'F:2 Dm:1 |'],
  m12: [`${t3('E4 C4 D4 E4 G4 F#4 G4 B4 A4')} |`, 'C:1 D7:1 G:1 |'],
  end: ['G4h. |', 'G:3 |'],
};
const JESU_ORDER = `
  r0 r1 r2 r3 r4 r1 r6 r7 c8 c9 c10 o11 o12 r4 r1 r6b
  r0b r1 r2 r3 r4 r1 r6 m0 m1 m2 m3 m4 m5 m6 m7 m8 m9 m10 m11 m12
  r4 r1 r2 r3 r4 r1 r6b end`;

// ─── Minuet in G ───────────────────────────────────────────────────────────

const MIN_A = `
  D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q |
  C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | F#4q G4e A4e B4e G4e | A4h. |
  D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q |
  C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | A4q B4e A4e G4e F#4e | G4h. |`;
const MIN_A_CH = `G:3 | G:3 | C:3 | G:3 | Am:3 | G:3 | D:3 | D:3 | G:3 | G:3 | C:3 | G:3 | Am:3 | G:3 | D7:3 | G:3 |`;
const MIN_B = `
  B5q G5e A5e B5e G5e | A5q D5e E5e F#5e D5e | G5q E5e F#5e G5e D5e | C#5q B4e C#5e A4q |
  A4e B4e C#5e D5e E5e F#5e | G5q F#5q E5q | F#5q A4q C#5q | D5h. |
  D5q G4e F#4e G4q | E5q G4e F#4e G4q | D5q C5q B4q | A4e G4e F#4e G4e A4q |
  D4e E4e F#4e G4e A4e B4e | C5q B4q A4q | B4e D5e G4q F#4q | G4h. |`;
const MIN_B_CH = `G:3 | D:3 | Em:3 | A:3 | A:3 | Em:3 | D:1 A7:2 | D:3 | G:3 | C:3 | G:3 | D:3 | D:3 | Am:3 | G:2 D7:1 | G:3 |`;

// ─── The Four Seasons ──────────────────────────────────────────────────────
// Solo violin line after the Mutopia edition of Op. 8 (bar numbers in comments).

const rp = (note: string, n: number) => rep(note, n);

const SPRING: Record<string, [string, string]> = {
  // Ritornello (bars 1–9), with the piano echo of bars 1–3.
  s1: ['G#5e G#5e G#5e F#5s E5s B5q. B5s A5s |', 'E:4 |'],
  s3: ['G#5e A5s B5s A5e G#5e F#5e D#5e B4e E5e |', 'E:1 A:0.5 F#7:0.5 B:2 |'],
  s6: ['G#5e A5s B5s A5e G#5e F#5q r e E5e |', 'E:1 A:0.5 F#7:0.5 B:2 |'],
  s7: ['B5e A5s G#5s A5e B5e C#6e B5q E5e |', 'E:4 |'],
  s9: ['C#6e B5q A5e G#5e F#5s E5s F#5q |', 'E:3 B:1 |'],
  // "Canto degli uccelli" (bars 13–17).
  b13: ['E5q r q B5q B5q |', 'E:4 |'],
  b14: ['B5q B5q B5q B5q |', 'E:4 |'],
  b15: [`${rp('B5e', 8)} |`, 'E:4 |'],
  b16: [`${rp('B5e', 7)} C#6s D#6s |`, 'E:4 |'],
  b17: ['E6s D#6s C#6s B5s A5s G#5s F#5s E5s r h |', 'E:4 |'],
  // "Scorrono i fonti": the murmuring brook (bars 31–43).
  f31: ['E5e G#4s A4s B4s A4s B4s A4s G#4s A4s G#4s A4s B4s A4s B4s A4s |', 'E:4 |'],
  f32: ['G#4s A4s G#4s A4s B4s A4s B4s A4s G#4s A4s G#4s A4s B4s C#5s B4s C#5s |', 'E:4 |'],
  f33: ['D#5s E5s D#5s E5s F#5s E5s F#5s E5s D#5s E5s D#5s E5s F#5s E5s F#5s E5s |', 'B:4 |'],
  f34: ['D#5s E5s D#5s E5s F#5s G#5s F#5s G#5s A5s G#5s A5s G#5s F#5s A5s G#5s F#5s |', 'B7:4 |'],
  f35: ['G#5e F#5s E5s D#5s C#5s B4s A4s G#4s A4s G#4s A4s B4s A4s B4s A4s |', 'E:4 |'],
  f36: ['G#4s A4s G#4s A4s B4s A4s B4s A4s G#4s A4s G#4s A4s B4s A4s B4s A4s |', 'E:4 |'],
  f37: ['G#4q r e G#5e A5h |', 'E:2 B7:2 |'],
  f38: ['G#5h F#5h |', 'E:2 B:2 |'],
  f39: ['G#5h A5h |', 'E:2 B7:2 |'],
  f40: ['G#5h F#5q r e B4e |', 'E:2 B:2 |'],
  f41: ['F#5e E5s D#5s E5e F#5e G#5e F#5q B4e |', 'B:4 |'],
  f43: ['G#5e F#5q E5e D#5e C#5s B4s C#5q |', 'E:1 B:2 F#:1 |'],
  // "Tuoni": thunder and lightning (bars 44–50, 55); the 32nd runs become 16ths.
  t44: [`B4s ${rp('B3s', 15)} |`, 'B:4 |'],
  t45: ['B4s C#5s D#5s E5s F#5s G#5s A5s B5s B4s C#5s D#5s E5s F#5s G#5s A5s B5s |', 'B:4 |'],
  t46: [`${rp('B3s', 8)} ${rp('A3s', 8)} |`, 'B:2 B7/A:2 |'],
  t47: [`${s3('B5 G#5 B5 E6 B5 E6 B5 G#5 B5 E6 B5 E6 B5 G#5 B5 D#6 B5 D#6 B5 G#5 B5 D#6 B5 D#6')} |`, 'E/G#:2 G#m:2 |'],
  t48: [`C#6q r q ${s3('C#6 A#5 C#6 F#6 C#6 F#6 C#6 A#5 C#6 F#6 C#6 F#6')} |`, 'A:2 F#/A#:2 |'],
  t49: [`${s3('C#6 A#5 C#6 E6 C#6 E6 C#6 A#5 C#6 E6 C#6 E6')} D#6q r q |`, 'F#7:2 B:2 |'],
  t50: [`${s3('D#6 B#5 D#6 G#6 D#6 G#6 D#6 B#5 D#6 G#6 D#6 G#6 D#6 B#5 D#6 F#6 D#6 F#6 D#6 B#5 D#6 F#6 D#6 F#6')} |`, 'G#/B#:2 G#7:2 |'],
  t55: ['C#6q r q r q r e C#5e |', 'C#m:4 |'],
  // Ritornello in C sharp minor (bars 56–58), then the tutti of bars 66–70.
  m56: ['G#5e F#5s E5s F#5e G#5e A5e G#5q C#5e |', 'C#m:4 |'],
  m58: ['A5e G#5q F#5e E5e D#5s C#5s D#5q |', 'C#m:3 G#:1 |'],
  m66: ['G#5e G#5e G#5e F#5s G#5s A5q. A5s G#5s |', 'C#m:2 F#m:2 |'],
  m67: ['F#5e F#5e F#5e E5s F#5s G#5q. G#5s A5s |', 'B:2 E:2 |'],
  m68: ['B5e B5e B5e B5s A5s G#5e G#5e G#5e G#5s A5s |', 'E:4 |'],
  m70: ['B5e B5e B5e A5s G#5s F#5h |', 'E:2 B:2 |'],
  // Closing ritornello (bars 76–78).
  e76: ['E5e. G#5s A5e B5e C#6e B5q E5e |', 'E:4 |'],
  FIN: ['E5h r h |', 'E:4 |'],
};
const [springMel, springCh] = seq(
  SPRING,
  `s1 s1 s3 s1 s1 s6 s7 s7 s9 b13 b14 b15 b16 b17
   f31 f32 f33 f34 f35 f36 f37 f38 f39 f40 f41 f41 f43
   t44 t45 t46 t47 t48 t49 t50 t55 m56 m56 m58 m66 m67 m68 m68 m70
   e76 s7 s9 FIN`,
);

/** Summer, III. Presto (3/4): bars 1–40, then the close from bar 113. */
const SUMMER: Record<string, [string, string]> = {
  p1: [`G4s ${rp('G3s', 11)} |`, 'Gm:3 |'],
  p2: [`F4s ${rp('G3s', 11)} |`, 'Gm:3 |'],
  p3: [`Eb4s ${rp('G3s', 11)} |`, 'Gm:3 |'],
  p4: [`D4s ${rp('G3s', 7)} G3e r e |`, 'Gm:3 |'],
  p5: ['r h. |', 'N:3 |'],
  p6: [`D5s ${rp('D4s', 11)} |`, 'D:3 |'],
  p7: [`C5s ${rp('D4s', 11)} |`, 'D:3 |'],
  p8: [`Bb4s ${rp('D4s', 11)} |`, 'D:3 |'],
  p9: [`A4s ${rp('D4s', 7)} D4e r e |`, 'D:3 |'],
  p10: ['r s D5s C5s Bb4s A4s G4s F#4s E4s D4s C4s Bb3s A3s |', 'D7:3 |'],
  p11: [`${rp('G3s', 12)} |`, 'Gm:3 |'],
  p12: ['G3s G5s F5s Eb5s D5s C5s Bb4s A4s G4s F4s Eb4s D4s |', 'Gm:3 |'],
  p13: [`${rp('C4s', 12)} |`, 'Cm:3 |'],
  p14: ['C4s Bb5s A5s G5s F5s Eb5s D5s C5s Bb4s A4s G4s F4s |', 'Cm:3 |'],
  p15: [`${rp('Eb4s', 12)} |`, 'Eb:3 |'],
  p16: ['Eb4s D6s C6s Bb5s A5s G5s F#5s E5s D5s C5s Bb4s A4s |', 'Eb:3 |'],
  p17: [`${rp('G4s', 12)} |`, 'Gm:3 |'],
  p18: ['G4s D6s C6s Bb5s A5s G5s F#5s E5s D5s C5s Bb4s A4s |', 'Gm:3 |'],
  p20: [`${rp('D5s G4s G4s G4s', 3)} |`, 'Gm:3 |'],
  p21: ['D4s A4s Bb4s C5s D5s E5s F#5s G5s A5e r e |', 'D:3 |'],
  p22: ['r s A4s Bb4s C5s D5s E5s F#5s G5s A5e r e |', 'D7:3 |'],
  p23: ['r s Bb4s C5s D5s Eb5s F#5s G5s A5s Bb5e r e |', 'Gm/D:3 |'],
  p24: ['r s D5s E5s F#5s G5s A5s Bb5s C6s D6e r e |', 'D:3 |'],
  p29: [`${rp('Bb5s G5s D5s Bb4s', 3)} |`, 'Gm:3 |'],
  p30: [`${rp('D5s Bb4s G4s D4s', 3)} |`, 'Gm:3 |'],
  p31: [`${rp('G4s D4s Bb3s G3s', 3)} |`, 'Gm:3 |'],
  p32: [`${rp('G4s B4s', 6)} |`, 'G:3 |'],
  p33: [`${rp('G4s C5s', 6)} |`, 'C:3 |'],
  p34: [`${rp('G4s C#5s', 6)} |`, 'A7:3 |'],
  p35: [`${rp('A4s D5s', 6)} |`, 'Dm:3 |'],
  p37: [`${rp('A4s C#5s', 6)} |`, 'A:3 |'],
  p38: ['D5s D4s E4s F4s G4s A4s B4s C#5s D5s A4s B4s C#5s |', 'Dm:3 |'],
  p39: ['D5s E5s F5s G5s A5s D5s E5s F5s G5s A5s B5s C#6s |', 'A7:3 |'],
  p40: ['D6q r h |', 'D:3 |'],
  q113: ['G4s G4s A4s Bb4s C5s D5s E5s F#5s G5s A5s Bb5s A5s |', 'Gm:3 |'],
  q114: ['G5s F5s Eb5s D5s C5s Bb4s A4s G4s F#4s E4s D4s C4s |', 'Gm:3 |'],
  q115: [`${rp('Bb3s G3s', 6)} |`, 'Gm:3 |'],
  q116: ['Eb4s D4s F#4s E4s G4s F#4s A4s G4s Bb4s A4s C5s Bb4s |', 'D7:3 |'],
  q117: ['D5s C5s Eb5s D5s F5s E5s G5s F#5s A5s G5s Bb5s A5s |', 'Gm:3 |'],
  q120: [`${rp('D4s', 12)} |`, 'D:3 |'],
  q121: [`${rp('G4s D4s Bb3s G3s', 3)} |`, 'Gm/Bb:3 |'],
  q122: [`${rp('G4s', 12)} |`, 'Cm:3 |'],
  q123: [`${rp('F#4s', 12)} |`, 'D:3 |'],
  q127: [`${rp('G4s', 4)} ${rp('Bb4s', 4)} ${rp('D5s', 4)} |`, 'Gm:3 |'],
  q128: [`${rp('G5s', 4)} ${rp('Bb5s', 4)} ${rp('G5s', 4)} |`, 'Gm:3 |'],
  q129: [`${rp('D5s', 4)} ${rp('Bb4s', 4)} ${rp('G4s', 4)} |`, 'Gm:3 |'],
  q130: ['G3h. |', 'Gm:3 |'],
};
const [sumMel, sumCh] = seq(
  SUMMER,
  `p1 p2 p3 p4 p5 p6 p7 p8 p9 p10 p11 p12 p13 p14 p15 p16 p17 p18 p17 p20
   p21 p22 p23 p24 p24 p22 p23 p24 p29 p30 p31 p32 p33 p34 p35 p35 p37 p38 p39 p40
   q113 q114 q115 q116 q117 q116 q117 q120 q121 q122 q123 q121 q122 q123 q127 q128 q129 q130`,
);

/** Autumn, I. Allegro: the villagers' dance, the drunkard, the ritornello in G minor, the return. */
const AUTUMN: Record<string, [string, string]> = {
  a1: ['A5e A5e A5e Bb5e A5q A5e Bb5e |', 'F:4 |'],
  a2: ['A5e A5e A5e A5e Bb5q A5e Bb5e |', 'F:4 |'],
  a3: ['A5e G5s A5s Bb5e A5e G5q r q |', 'F:1 Bb:0.5 Bdim:0.5 C:2 |'],
  a4: ['A4e A4e A4e Bb4e A4q A4e Bb4e |', 'F:4 |'],
  a6: ['A4e G4s A4s Bb4e A4e G4q r q |', 'F:1 Bb:0.5 Bdim:0.5 C:2 |'],
  a7: ['A5e A5e A5e C6e D5q D5e D5e |', 'F:2 Gm:2 |'],
  a8: ['G5e G5e G5e Bb5e C5q C5e F5e |', 'C7:2 F:2 |'],
  a9: ['A5e A5e A5e Bb5e A5e A5e A5e Bb5e |', 'F:4 |'],
  a10: ['A5e A5e A5e Bb5e A5e G5s A5s Bb5e G5e |', 'F:2 Bb:1 C:1 |'],
  a11: ['A5q r q A4e A4e A4e Bb4e |', 'F:4 |'],
  a12: ['A4e A4e A4e Bb4e A4e A4e A4e Bb4e |', 'F:4 |'],
  a13: ['A4e G4s A4s Bb4e G4e F4q r q |', 'F:1 Bb:0.5 C:0.5 F:2 |'],
  a115: ['A4e G4s A4s Bb4e G4e F4h |', 'F:1 Bb:0.5 C:0.5 F:2 |'],
  // "L'ubriaco": the drunkard staggers up and down (bars 32–35).
  d32: ['A4q r q F6s C6s A5s F5s F6s C6s A5s F5s |', 'F:4 |'],
  d33: ['F6s C6s A5s F5s F6s C6s A5s F5s A5s F5s F5s C5s C5s A4s A4s F4s |', 'F:4 |'],
  d34: ['F4s C4s C4s A3s A3s C4s C4s F4s F4s A4s A4s C5s C5s F5s F5s A5s |', 'F:4 |'],
  d35: ['A5s F5s F5s C5s C5s A4s A4s F4s F4s C4s C4s A3s C4e r e |', 'F:4 |'],
  // Tutti ritornello in G minor (bars 57–66).
  g57: ['G4e D5e D5e Eb5e D5q D5e Eb5e |', 'Gm:4 |'],
  g58: ['D5e D5e D5e Eb5e C5e C5e C5e D5e |', 'Gm:2 D7:2 |'],
  g59: ['Bb4e A4s Bb4s C5e Bb4e A4q r e F#5e |', 'Gm:1 Cm:1 D:2 |'],
  g60: ['G5e G5e G5e F5e Eb5e Eb5e Eb5e Eb5e |', 'G7:2 Cm:2 |'],
  g61: ['F5e F5e F5e Eb5e D5e D5e D5e D5e |', 'F7:2 Bb:2 |'],
  g62: ['Eb5e Eb5e Eb5e D5e C#5e C#5e C#5e Eb5e |', 'Eb:2 A7:2 |'],
  g63: ['F5e F5e F5e G5e F5e F5e F5e G5e |', 'Dm:4 |'],
  g64: ['F5e F5e F5e G5e F5e E5s F5s G5e E5e |', 'Dm:2 Gm:1 A:1 |'],
  g65: ['F5q r q F4e F4e F4e G4e |', 'Dm:4 |'],
  g66: ['F4e F4e F4e G4e F4e F4e F4e G4e |', 'Dm:4 |'],
};
const [autMel, autCh] = seq(
  AUTUMN,
  `a1 a2 a3 a4 a4 a6 a7 a8 a9 a10 a11 a12 a13
   d32 d33 d34 d35
   g57 g58 g59 g60 g61 g62 g63 g64 g65 g66
   a1 a2 a3 a7 a8 a9 a10 a11 a12 a115`,
);

/** Winter, I. Allegro non molto: the shivering opening, the stamping tutti, the solo, the close. */
const WINTER: Record<string, [string, string]> = {
  // Bars 1–3 give the entries of cello, viola and second violins; the soloist enters in bar 4.
  w1: [`${rp('F4e', 8)} |`, 'F.F:4 |'],
  w2: [`${rp('G4e', 8)} |`, 'F.G:4 |'],
  w3: [`${rp('Db5e', 8)} |`, 'F.G.Db:4 |'],
  w4: [`${rp('Bb5e', 8)} |`, 'F.G.Db.Bb:4 |'],
  w5: [`${rp('Bb5e', 8)} |`, 'E.G.Db.Bb:4 |'],
  w6: [`${rp('Ab5e', 8)} |`, 'Fm:4 |'],
  w7: [`${rp('Db5e', 8)} |`, 'Bbm/F:4 |'],
  w8: [`${rp('Eb5e', 8)} |`, 'F7:4 |'],
  w9: [`${rp('D5e', 8)} |`, 'G7/F:4 |'],
  w10: [`${rp('Eb5e', 8)} |`, 'F#dim7:4 |'],
  w11: [`${rp('D5e', 8)} |`, 'Gsus4:2 G:2 |'],
  w12: ['C5q r q r h |', 'C:4 |'],
  // Tutti, bars 19–26 ("batter li piedi"); the 32nd-note bursts are written as 16ths.
  w19: [`${rp('Db5e', 4)} ${rp('E5e', 4)} |`, 'C7:4 |'],
  w20: [`F5s ${rp('F4s', 15)} |`, 'Fm:4 |'],
  w21: [`${rp('F4s', 16)} |`, 'Fm/Eb:2 Bbm/Db:2 |'],
  w22: [`${rp('F4s', 8)} E4s ${rp('G5s', 7)} |`, 'Bbm/Db:2 C7:2 |'],
  w23: [`${rp('Ab5s C5s', 4)} ${rp('Db5s', 8)} |`, 'Fm:2 Bbm:2 |'],
  w24: [`${rp('G5s Db5s', 4)} ${rp('C5s', 8)} |`, 'Eb7:2 Ab:2 |'],
  w25: [`${rp('F5s C5s', 4)} ${rp('Bb4s', 8)} |`, 'Db:2 Gdim:2 |'],
  w26: [`${rp('E5s Bb4s', 4)} F5q r q |`, 'C7:2 Fm:2 |'],
  // Solo, bars 40–46.
  w40: [`${rp('Bb4e', 8)} |`, 'Eb:2 Bb/D:2 |'],
  w41: [`${rp('Bb4e', 4)} ${rp('Db5s', 8)} |`, 'Eb7:4 |'],
  w42: [`${rp('C5e', 4)} ${rp('Eb5s', 8)} |`, 'Ab:2 Fm:2 |'],
  w43: [`${rp('D5e', 4)} ${rp('Ab5s', 8)} |`, 'Bb7:4 |'],
  w44: ['G5s Eb6s Eb6s Bb5s Bb5s G5s G5s Eb5s Eb5e G5e Bb5e Db6e |', 'Eb:2 Eb7:2 |'],
  w45: ['C6s F6s F6s C6s C6s A5s A5s F5s F5e A5e C6e Eb6e |', 'F7:4 |'],
  w46: ['D6s G6s G6s D6s D6s B5s B5s G5s G5e B5e D6e F6e |', 'G7:4 |'],
  // Closing tutti, bars 56–63.
  w56: [`C5s ${rp('G5s', 7)} ${rp('Ab5s C5s', 4)} |`, 'C7:2 Fm:2 |'],
  w57: [`${rp('Db5s', 8)} ${rp('G5s Db5s', 4)} |`, 'Bbm:2 Eb7:2 |'],
  w58: [`${rp('C5s', 8)} ${rp('F5s C5s', 4)} |`, 'Ab:2 Db:2 |'],
  w59: [`${rp('Bb4s', 8)} ${rp('E5s G5s Bb5s G5s', 2)} |`, 'Gdim:2 C7:2 |'],
  w60: [`${rp('Ab5s', 8)} ${rp('G5s', 8)} |`, 'Fm:2 C7/Bb:2 |'],
  w61: [`${rp('G5s', 8)} F5s ${rp('Ab4s', 7)} |`, 'C7:2 Fm:2 |'],
  w62: [`${rp('G4s', 16)} |`, 'C7/Bb:2 C7:2 |'],
  w63: ['F4w |', 'Fm:4 |'],
};
const [winMel, winCh] = seq(
  WINTER,
  `w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12
   w19 w20 w21 w22 w23 w24 w25 w26
   w40 w41 w42 w43 w44 w45 w46
   w56 w57 w58 w59 w60 w61 w62 w63`,
);

// ─── Badinerie ─────────────────────────────────────────────────────────────

/** First half (after the upbeat), two beats per bar, ending on the bar that holds the next upbeat. */
const BAD_A: [string, string][] = [
  ['F#5e B5s F#5s D5e F#5s D5s |', 'Bm:2 |'],
  ['B4q F#4s B4s D5s B4s |', 'Bm:2 |'],
  ['C#5s B4s C#5s B4s A#4s C#5s E5s C#5s |', 'F#:1 F#7:1 |'],
  ['D5e B4e B5e D6s B5s |', 'Bm:2 |'],
  ['F#5e B5s F#5s D5e F#5s D5s |', 'Bm:2 |'],
  ['B4q D5s C#5s D5e |', 'Bm:2 |'],
  ['D5s C#5s D5e B5e D5e |', 'Bm:1 G#dim:1 |'],
  ['D5e C#5e F#5s E#5s F#5e |', 'C#:1 F#m:1 |'],
  ['F#5s E#5s F#5e D6e F#5e |', 'F#m:1 Bm:1 |'],
  ['F#5e E#5e C#5s F#5s A5s F#5s |', 'C#:1 F#m:1 |'],
  ['G#5s F#5s G#5s F#5s E#5s G#5s B5s G#5s |', 'C#:1 C#7:1 |'],
  ['A5s G#5s A5s G#5s F#5s A5s F#5s E#5s |', 'F#m:2 |'],
  ['F#5s B5s F#5s E#5s F#5s C#6s F#5s E#5s |', 'Bm:1 F#m:1 |'],
  ['F#5s D6s F#5s E#5s F#5s D6s C#6s B5s |', 'Bm:2 |'],
  ['C#6s A5s G#5s F#5s A5e G#5e |', 'C#7:1 C#:1 |'],
];
const BAD_B: [string, string][] = [
  ['C#5e F#5s C#5s A4e C#5s A4s |', 'F#m:2 |'],
  ['F#4q C5e B4e |', 'F#m:1 B7:1 |'],
  ['E5e D#5s F#5s A5e G5s F#5s |', 'B7:2 |'],
  ['G5e E5e G5e B5s G5s |', 'Em:2 |'],
  ['E5e G5s E5s C#5e E5s C#5s |', 'Em:1 A7:1 |'],
  ['A4q A4s D5s F#5s D5s |', 'A:1 D:1 |'],
  ['E5s D5s E5s D5s C#5s E5s G5s E5s |', 'A7:2 |'],
  ['F#5s E5s F#5s E5s D5s F#5s D5s C#5s |', 'D:2 |'],
  ['D5s G5s D5s C#5s D5s A5s D5s C#5s |', 'A7:1 D:1 |'],
  ['D5s B5s D5s C#5s D5s B5s A5s G5s |', 'Bm:1 G:1 |'],
  ['A5s F#5s E5s D5s F#5e E5e |', 'D:1 A7:1 |'],
  ['D5q F#5s E5s F#5e |', 'D:1 Bm:1 |'],
  ['F#5s E5s F#5e D6e F#5e |', 'Bm:2 |'],
  ['F#5e E5e E5s D5s E5e |', 'F#m:1 A:1 |'],
  ['E5s D5s E5e C#6e E5e |', 'A:2 |'],
  ['E5e D5e B5e D6s B5s |', 'D:1 Bm:1 |'],
  ['A5e G5e ~G5e B5t A5t G5t F#5t |', 'Em:2 |'],
  ['E5q ~E5e G5t F#5t E5t D5t |', 'Em:2 |'],
  ['C5s E5s G5s E5s C5s B4s C5s B4s |', 'C:2 |'],
  ['A#4e F#4e G4e F#4e |', 'F#:1 Em:1 |'],
  ['B4e A#4s C#5s E5e D5s C#5s |', 'F#:1 F#7:1 |'],
  ['D5e B4t C#5t D5t E5t F#5e D5s F#5s |', 'Bm:2 |'],
  ['B5e F#5e E5s D5s C#5s D5s |', 'Bm:1 Em:1 |'],
];

function badinerie(i: 0 | 1): string {
  const all = (bars: [string, string][]) => bars.map((b) => b[i]).join(' ');
  const pick = (m: string, c: string) => (i === 0 ? m : c);
  return [
    pick('B5e D6s B5s |', 'Bm:1 |'),
    all(BAD_A),
    pick('F#5q B5e D6s B5s |', 'F#m:1 Bm:1 |'),
    all(BAD_A),
    pick('F#5q F#5e A5s F#5s |', 'F#m:2 |'),
    all(BAD_B),
    pick('C#5e B4e F#5e A5s F#5s |', 'F#:0.5 Bm:0.5 F#m:1 |'),
    all(BAD_B),
    pick('C#5e B4e ~B4q |', 'F#:0.5 Bm:1.5 |'),
  ].join(' ');
}

const [toccMel, toccCh] = seq(
  TOCCATA,
  `T1 T2 T3 T4 T5 T6 T7 T8 P4 P5 P6 P7 P8 P9 P10 P12 P13 P14
   F0 F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 F13 F14 F15 F16 END`,
);
const [preMel, preCh] = prelude();
const [jesuMel, jesuCh] = seq(JESU, JESU_ORDER);

const SEASON = { era: 'baroque', composer: 'Antonio Vivaldi', year: '1725', lead: 'violin', bassStyle: 'eighths', stringStyle: 'pulse' } as const;

export const BAROQUE: SongDef[] = [
  song({
    id: 'canon', title: 'Canon in D', subtitle: 'upon a ground of eight notes', composer: 'Johann Pachelbel', year: 'c. 1700', era: 'baroque',
    blurb: 'Eight notes in the bass, forever. Above them, the melody blossoms ever faster.',
    bpm: 100, beatsPerBar: 4, tonic: pc('D'), lead: 'violin',
    melody: CANON,
    chords: rep('D:2 A:2 | Bm:2 F#m:2 | G:2 D:2 | G:2 A:2 |', CANON_CYCLES) + ' D:4 |',
    bass: rep('D3h A2h | B2h F#2h | G2h D2h | G2h A2h |', CANON_CYCLES) + ' D2w |',
    bassStyle: 'explicit',
  }),
  song({
    id: 'toccata', title: 'Toccata and Fugue', subtitle: 'in D minor, BWV 565', composer: 'Johann Sebastian Bach', year: 'c. 1704', era: 'baroque',
    blurb: 'Three thunderous flourishes on the great organ, then a whirl of semiquavers. Mind the pedals.',
    bpm: 76, beatsPerBar: 4, tonic: pc('D'), lead: 'organ', keys: 'organ', keysStyle: 'block',
    melody: toccMel, chords: toccCh,
  }),
  song({
    id: 'prelude', title: 'Prelude in C', subtitle: 'The Well-Tempered Clavier, Book I', composer: 'Johann Sebastian Bach', year: '1722', era: 'baroque',
    blurb: 'One figure, thirty-five harmonies. A meditation that rewards a steady hand.',
    bpm: 72, beatsPerBar: 4, tonic: pc('C'), lead: 'harpsichord', keysStyle: 'bass',
    melody: preMel, chords: preCh,
  }),
  song({
    id: 'jesu', title: 'Jesu, Joy of Man’s Desiring', subtitle: 'from Cantata BWV 147', composer: 'Johann Sebastian Bach', year: '1723', era: 'baroque',
    blurb: 'A river of triplets flowing around a chorale. Keep the current smooth.',
    bpm: 84, beatsPerBar: 3, tonic: pc('G'), lead: 'violin', keys: 'organ', keysStyle: 'block', bassStyle: 'quarters',
    melody: jesuMel, chords: jesuCh,
  }),
  song({
    id: 'minuet', title: 'Minuet in G', subtitle: 'from the Notebook for Anna Magdalena', composer: 'Christian Petzold', year: 'c. 1725', era: 'baroque',
    blurb: 'A courtly dance in three, fit for a first appearance before His Excellency.',
    bpm: 112, beatsPerBar: 3, tonic: pc('G'), lead: 'harpsichord',
    melody: [MIN_A, MIN_A, MIN_B, MIN_B].join(' '),
    chords: [MIN_A_CH, MIN_A_CH, MIN_B_CH, MIN_B_CH].join(' '),
  }),
  song({
    ...SEASON, id: 'spring', title: 'Spring', subtitle: 'The Four Seasons · I. Allegro',
    blurb: 'Birdsong, murmuring brooks and a sudden thunderstorm, all by candlelight.',
    bpm: 104, beatsPerBar: 4, pickup: 0.5, tonic: pc('E'),
    melody: 'E5e | ' + springMel, chords: 'N:0.5 | ' + springCh,
  }),
  song({
    ...SEASON, id: 'summer', title: 'Summer', subtitle: 'The Four Seasons · III. Presto',
    blurb: 'The storm breaks at last: hail, lightning and scales like driving rain.',
    bpm: 132, beatsPerBar: 3, tonic: pc('G'), melody: sumMel, chords: sumCh,
  }),
  song({
    ...SEASON, id: 'autumn', title: 'Autumn', subtitle: 'The Four Seasons · I. Allegro',
    blurb: 'The harvest is in and the peasants dance, some of them rather unsteadily.',
    bpm: 104, beatsPerBar: 4, tonic: pc('F'), melody: autMel, chords: autCh, bassStyle: 'quarters',
  }),
  song({
    ...SEASON, id: 'winter', title: 'Winter', subtitle: 'The Four Seasons · I. Allegro non molto',
    blurb: 'Chattering teeth, stamping feet and a biting wind. Wrap up warmly.',
    bpm: 84, beatsPerBar: 4, tonic: pc('F'), melody: winMel, chords: winCh,
  }),
  song({
    id: 'badinerie', title: 'Badinerie', subtitle: 'Orchestral Suite No. 2 in B minor', composer: 'Johann Sebastian Bach', year: 'c. 1739', era: 'baroque',
    blurb: 'A jest for the flute, taken at a gallop. Only a Maestro survives it with a wig intact.',
    bpm: 108, beatsPerBar: 2, pickup: 1, tonic: pc('B'), lead: 'flute', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: badinerie(0), chords: badinerie(1),
  }),
];
