import { pitchClass as pc } from '../theory';
import { rep, seq, song, type SongDef } from '../types';

// ─── Canon in D ────────────────────────────────────────────────────────────

const CANON: Record<string, string> = {
  A: 'F#5q E5q D5q C#5q | B4q A4q B4q C#5q |',
  B: 'D5q C#5q B4q A4q | G4q F#4q G4q E4q |',
  C: 'D4e F#4e A4e G4e F#4e D4e F#4e E4e | D4e B3e D4e A4e G4e B4e A4e G4e |',
  D: 'F#4e D4e E4e C#5e D5e F#5e A5e A4e | B4e G4e A4e F#4e D4e D5e D5e C#5e |',
  E: `D5s C#5s D5s D4s C#4s A4s E4s F#4s D4s D5s C#5s B4s C#5s F#5s A5s B5s |
      G5s F#5s E5s G5s F#5s E5s D5s C#5s B4s A4s G4s F#4s E4s G4s F#4s E4s |`,
  F: `D4s E4s F#4s G4s A4s E4s A4s G4s F#4s B4s A4s G4s A4s G4s F#4s E4s |
      D4s B3s B4s C#5s D5s C#5s B4s A4s G4s F#4s E4s B4s A4s B4s A4s G4s |`,
  H: 'A5h F#5h | G5h E5h |',
};
const CANON_ORDER = 'A B C D E F C D E F B H'.split(' ');

// ─── Toccata and Fugue in D minor ──────────────────────────────────────────

const TOCCATA: Record<string, [string, string]> = {
  T1: ['A5s G5s A5h. r e |', 'A:4 |'],
  T2: ['G5s F5s E5s D5s C#5q D5h |', 'A7:2 Dm:2 |'],
  T3: ['A4s G4s A4h. r e |', 'A:4 |'],
  T4: ['E4s F4s C#4s D4s ~D4q r h |', 'A7:1 Dm:3 |'],
  T5: ['A3s G3s A3h. r e |', 'A:4 |'],
  T6: ['G3s F3s E3s D3s C#3q D3h |', 'A7:2 Dm:2 |'],
  T7: ['C#4e E4e G4e Bb4e C#5e E5e G5e Bb5e |', 'C#dim7:4 |'],
  T8: ['C#6w |', 'A7:4 |'],
  T9: ['D6h r h |', 'Dm:4 |'],
  F1: ['A5s G5s A5s F5s A5s E5s A5s D5s A5s C#5s A5s D5s A5s E5s A5s F5s |', 'Dm:2 A:2 |'],
  F2: ['Bb5s A5s Bb5s G5s Bb5s F5s Bb5s E5s Bb5s D5s Bb5s E5s Bb5s F5s Bb5s G5s |', 'Gm:4 |'],
  F3: ['A5s G5s A5s F5s A5s E5s A5s D5s G5s F5s G5s E5s G5s D5s G5s C#5s |', 'Dm:2 A7:2 |'],
  F4: ['D5s A4s F4s A4s D5s A4s F4s A4s D4q r q |', 'Dm:4 |'],
  F5: ['A4s G#4s A4s E4s A4s F4s A4s D4s A4s C#4s A4s D4s A4s E4s A4s F4s |', 'Dm:2 A:2 |'],
  F6: ['D5s C#5s D5s A4s D5s Bb4s D5s G4s D5s A4s D5s F4s D5s E4s D5s D4s |', 'Gm:2 Dm:2 |'],
  F7: ['C#5s D5s E5s C#5s D5s E5s F5s D5s E5s F5s G5s E5s F5s G5s A5s F5s |', 'A:2 Dm:2 |'],
  F8: ['Bb5s A5s G5s F5s E5s D5s C#5s D5s E5s C#5s A4s C#5s D5q |', 'Gm:1 A7:2 Dm:1 |'],
  END: ['D5w |', 'D:4 |'],
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

const t3 = (notes: string) => notes.trim().split(/\s+/).map((n) => `${n}e3`).join(' ') + ' |';
const JESU: Record<string, [string, string]> = {
  j1: [t3('G4 A4 B4 D5 C5 C5 E5 D5 D5'), 'G:1 D7:1 Em:1 |'],
  j2: [t3('G5 F#5 G5 D5 B4 G4 A4 B4 C5'), 'G:2 Am:1 |'],
  j3: [t3('D5 E5 D5 C5 B4 A4 B4 G4 F#4'), 'G:1 Am:1 Em:1 |'],
  j4: [t3('G4 A4 D4 F#4 A4 C5 B4 A4 B4'), 'C:1 D7:1 G:1 |'],
  j4e: [t3('G4 A4 D4 F#4 A4 C5 B4 A4 G4'), 'C:1 D7:1 G:1 |'],
  jG: ['G4h. |', 'G:3 |'],
  k1: [t3('E5 F#5 G5 B5 A5 A5 C6 B5 B5'), 'Em:1 Am:1 Em:1 |'],
  k2: [t3('E6 D#6 E6 B5 G5 E5 F#5 G5 A5'), 'Em:2 Am:1 |'],
  k3: [t3('B5 C6 B5 A5 G5 F#5 G5 E5 D#5'), 'Em:1 Am:1 B:1 |'],
  k4: [t3('E5 F#5 B4 D#5 F#5 A5 G5 F#5 E5'), 'Em:1 B7:1 Em:1 |'],
  kE: ['E5h. |', 'Em:3 |'],
};

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

const SPRING: Record<string, [string, string]> = {
  R1: ['G#5e G#5e G#5e F#5s E5s B5q. B5s A5s |', 'E:4 |'],
  R3: ['G#5e A5s B5s A5e G#5e F#5q re E5e |', 'E:2 B:2 |'],
  R6: ['G#5e A5s B5s A5e G#5e F#5h |', 'E:2 B:2 |'],
  R7: ['B5e B5s A5s G#5e A5s B5s C#6e B5e A5e G#5e |', 'E:2 A:2 |'],
  R8: ['F#5e F#5s G#5s A5e F#5e D#5e B4e B5q |', 'B7:4 |'],
  R9: ['E6e D#6s C#6s B5e A5e G#5e F#5e E5e D#5e |', 'A:2 B:2 |'],
  R10: ['E5q B4q E5h |', 'E:1 B:1 E:2 |'],
  B11: ['B5s C#6s B5s C#6s B5s C#6s B5s C#6s B5e G#5e B5e G#5e |', 'E:4 |'],
  B12: ['E6s F#6s E6s F#6s E6s F#6s E6s F#6s E6e B5e G#5e E5e |', 'E:4 |'],
  B13: ['A5s B5s A5s B5s A5s B5s A5s B5s A5e F#5e D#5e B4e |', 'B:4 |'],
  B14: ['E5e G#5e B5e E6e B5h |', 'E:4 |'],
  K15: ['E5s F#5s G#5s A5s B5s A5s G#5s F#5s E5s F#5s G#5s A5s B5s C#6s B5s A5s |', 'E:2 A:2 |'],
  K16: ['G#5s A5s B5s C#6s D#6s C#6s B5s A5s G#5e F#5e E5q |', 'E:2 B:1 E:1 |'],
  K17: ['A5s G#5s F#5s E5s D#5s E5s F#5s G#5s A5e F#5e D#5e B4e |', 'B7:4 |'],
  K18: ['E5h. re E5e |', 'E:4 |'],
  S1: ['E4s E4s E4s E4s E4s E4s E4s E4s E4s F#4s G#4s A4s B4s C#5s D#5s E5s |', 'E:4 |'],
  S2: ['B4s B4s B4s B4s B4s B4s B4s B4s B4s C#5s D#5s E5s F#5s G#5s A5s B5s |', 'B:4 |'],
  S3: ['C#5s C#5s C#5s C#5s C#5s D#5s E5s F#5s G#5s A5s B5s C#6s B5e G#5e |', 'C#m:4 |'],
  S4: ['A5s F#5s D#5s B4s A5s F#5s D#5s B4s F#5q B4q |', 'B7:4 |'],
  S4b: ['A5s F#5s D#5s B4s A5s F#5s D#5s B4s B4q. E5e |', 'B7:4 |'],
  FIN: ['B4e E5e G#5e B5e E6h |', 'E:4 |'],
};
const [springMel, springCh] = seq(
  SPRING,
  `R1 R1 R3 R1 R1 R6 R7 R8 R9 R10 B11 B12 B13 B14 R1 R1 R6 K15 K16 K17 K18 R1 R1 R6
   S1 S2 S3 S4 S1 S2 S3 S4b R1 R1 R3 R1 R1 R6 R7 R8 R9 R10 FIN`,
);

const SUMMER: Record<string, [string, string]> = {
  S1: ['G4e G5e G4e G5e G4e G5e G4e G5e |', 'Gm:4 |'],
  S2: ['G5s F5s Eb5s D5s C5s Bb4s A4s G4s G5s F5s Eb5s D5s C5s Bb4s A4s G4s |', 'Gm:4 |'],
  S3: ['D5e D4e D5e D4e D5e D4e D5e D4e |', 'D:4 |'],
  S4: ['D5s C5s Bb4s A4s G4s F#4s E4s D4s D5s C5s Bb4s A4s G4s F#4s E4s D4s |', 'D:4 |'],
  S5: ['G4s Bb4s D5s G5s Bb5s G5s D5s Bb4s G4s Bb4s D5s G5s Bb5s G5s D5s Bb4s |', 'Gm:4 |'],
  S6: ['A4s C5s Eb5s F#5s A5s F#5s Eb5s C5s D4s F#4s A4s C5s D5s C5s A4s F#4s |', 'D7:4 |'],
  S7: ['G4s Bb4s D5s G5s F5s Eb5s D5s C5s Bb4s A4s G4s F#4s G4q |', 'Gm:2 D:1 Gm:1 |'],
  E1: ['Eb5e Eb5e Eb5e Eb5e D5e D5e D5e D5e |', 'Eb:2 Bb:2 |'],
  E2: ['C5e C5e C5e C5e Bb4e Bb4e Bb4e Bb4e |', 'Cm:2 Gm:2 |'],
  E3: ['A4s Bb4s C5s D5s Eb5s F5s G5s A5s Bb5s A5s G5s F5s Eb5s D5s C5s Bb4s |', 'F:2 Bb:2 |'],
  E4: ['A4s G4s F#4s G4s A4s Bb4s C5s A4s D5q r q |', 'D7:3 Gm:1 |'],
  END: ['G4q G3q r h |', 'Gm:4 |'],
};
const SUMMER_A = 'S1 S2 S1 S2 S3 S4 S5 S6 S5 S6 S7';

const AUTUMN: Record<string, [string, string]> = {
  A1: ['C5e F5e F5e F5e F5e G5s F5s E5e D5e |', 'F:4 |'],
  A2: ['C5e A4e A4e A4e A4e Bb4s A4s G4e F4e |', 'F:4 |'],
  A3: ['C5e F5e A5e F5e C6e A5e F5e C5e |', 'F:4 |'],
  A4: ['Bb4e D5e G5e D5e C5q C4q |', 'Gm:2 C:2 |'],
  E1: ['F5s G5s A5s Bb5s C6s Bb5s A5s G5s F5s E5s D5s C5s Bb4s A4s G4s F4s |', 'F:4 |'],
  E2: ['C5s D5s E5s F5s G5s F5s E5s D5s C5s Bb4s A4s G4s F4q |', 'C7:3 F:1 |'],
  E3: ['A5s Bb5s A5s Bb5s A5s Bb5s A5s Bb5s G5s A5s G5s A5s G5s A5s G5s A5s |', 'F:2 C:2 |'],
  E4: ['F5e A5e C6e A5e F5q r q |', 'F:4 |'],
};
const AUT_A = 'A1 A2 A3 A4';
const AUT_E = 'E1 E2 E3 E4';

const WINTER: Record<string, [string, string]> = {
  W1: ['C5e C5e C5e C5e C5e C5e C5e C5e |', 'C7:4 |'],
  W2: ['Db5e Db5e Db5e Db5e C5e C5e C5e C5e |', 'Db:2 C:2 |'],
  W3: ['E5e E5e E5e E5e F5e F5e F5e F5e |', 'C7:2 Fm:2 |'],
  W4: ['G5e G5e G5e G5e Ab5e Ab5e G5e G5e |', 'C7:4 |'],
  W5: ['F5s Ab5s C6s F6s C6s Ab5s F5s C5s F5s Ab5s C6s F6s C6s Ab5s F5s C5s |', 'Fm:4 |'],
  W6: ['E5s G5s Bb5s Db6s Bb5s G5s E5s C5s E5s G5s Bb5s Db6s Bb5s G5s E5s C5s |', 'C7:4 |'],
  W7: ['F5s Ab5s C6s F6s Eb6s Db6s C6s Bb5s Ab5s G5s F5s E5s F5q |', 'Fm:2 C7:1 Fm:1 |'],
  W8: ['Ab5e G5e F5e E5e F5q r q |', 'Fm:2 C:1 Fm:1 |'],
  END: ['F5q F4q r h |', 'Fm:4 |'],
};

// ─── Badinerie ─────────────────────────────────────────────────────────────

const BAD_A = [
  ['F#5e B5s F#5s D5e F#5s D5s |', 'Bm:2 |'],
  ['B4q F#4s B4s D5s B4s |', 'Bm:2 |'],
  ['C#5s B4s C#5s B4s A#4s C#5s E5s C#5s |', 'F#:2 |'],
  ['D5e B4e B5e D6s B5s |', 'Bm:2 |'],
  ['F#5e B5s F#5s D5e F#5s D5s |', 'Bm:2 |'],
  ['B4q D5s F#5s B5s D6s |', 'Bm:2 |'],
  ['C#6s B5s A#5s B5s G5s F#5s E5s D5s |', 'F#:1 Em:1 |'],
  ['C#5q F#5q |', 'F#:2 |'],
  ['A5s F#5s G5s E5s F#5s D5s E5s C#5s |', 'D:1 A:1 |'],
  ['D5s B4s C#5s A#4s B4e F#5e |', 'Bm:2 |'],
  ['G5s E5s F#5s D5s E5s C#5s D5s B4s |', 'Em:1 Bm:1 |'],
  ['C#5s A#4s B4s G#4s A#4e F#4e |', 'F#:2 |'],
  ['B4s C#5s D5s E5s F#5s G5s A5s F#5s |', 'Bm:2 |'],
  ['G5s E5s C#5s A#4s B4e D5e |', 'C#dim:1 Bm:1 |'],
  ['C#5s D5s E5s C#5s A#4s B4s C#5s A#4s |', 'F#:2 |'],
];
const BAD_B = [
  ['C#6e F#5s C#6s A#5e C#6s A#5s |', 'F#:2 |'],
  ['F#5q C#5s F#5s A#5s F#5s |', 'F#:2 |'],
  ['G5s F#5s G5s E5s D5s C#5s B4s A#4s |', 'Em:1 F#:1 |'],
  ['B4e F#5e B5e D6s B5s |', 'Bm:2 |'],
  ['G5e B5s G5s E5e G5s E5s |', 'Em:2 |'],
  ['C#5q E5s G5s A5s G5s |', 'A7:2 |'],
  ['F#5e A5s F#5s D5e F#5s D5s |', 'D:2 |'],
  ['A4q D5s F#5s A5s F#5s |', 'D:2 |'],
  ['G5s F#5s E5s D5s C#5s B4s A#4s B4s |', 'Em:1 F#:1 |'],
  ['C#5s E5s D5s C#5s B4e F#4e |', 'F#:1 Bm:1 |'],
  ['G4s B4s D5s G5s F#5s E5s D5s C#5s |', 'G:1 F#:1 |'],
  ['B4s D5s F#5s B5s A#5s F#5s C#6s A#5s |', 'Bm:1 F#:1 |'],
  ['B5e F#5e D5e B4e |', 'Bm:2 |'],
  ['E5s G5s F#5s E5s D5s C#5s B4s A#4s |', 'Em:1 F#:1 |'],
  ['B4s D5s C#5s B4s A#4e C#5e |', 'Bm:1 F#:1 |'],
];

function badinerie(i: 0 | 1): string {
  const pick = (m: string, c: string) => (i === 0 ? m : c);
  const all = (bars: string[][]) => bars.map((b) => b[i]).join(' ');
  return [
    pick('B5e D6s B5s |', 'N:1 |'),
    all(BAD_A),
    pick('F#4q B5e D6s B5s |', 'F#:1 Bm:1 |'),
    all(BAD_A),
    pick('F#4q re F#5e |', 'F#:2 |'),
    all(BAD_B),
    pick('B4q re F#5e |', 'Bm:2 |'),
    all(BAD_B),
    pick('B4q F#5e D6s F#6s | B5h |', 'Bm:2 | Bm:2 |'),
  ].join(' ');
}

const [toccMel, toccCh] = seq(TOCCATA, 'T1 T2 T3 T4 T5 T6 T7 T8 T9 F1 F2 F3 F4 F5 F6 F7 F8 F1 F2 F3 F4 F5 F6 F7 F8 T1 T2 END');
const [preMel, preCh] = prelude();
const [jesuMel, jesuCh] = seq(JESU, 'j1 j2 j3 j4 j1 j2 j3 j4e jG k1 k2 k3 k4 kE j1 j2 j3 j4 j1 j2 j3 j4e jG k1 k2 k3 k4 kE j1 j2 j3 j4e jG');
const [sumMel, sumCh] = seq(SUMMER, `${SUMMER_A} E1 E2 E3 E4 ${SUMMER_A} E1 E2 E3 E4 ${SUMMER_A} END`);
const [autMel, autCh] = seq(AUTUMN, `${AUT_A} ${AUT_A} ${AUT_E} ${AUT_A} ${AUT_E} ${AUT_A} ${AUT_E} ${AUT_A}`);
const [winMel, winCh] = seq(WINTER, 'W1 W2 W3 W4 W5 W6 W7 W8 W1 W2 W3 W4 W5 W6 W7 W8 W5 W6 W7 W8 W5 W6 W7 END');

const SEASON = { era: 'baroque', composer: 'Antonio Vivaldi', year: '1725', lead: 'violin', bassStyle: 'eighths', stringStyle: 'pulse' } as const;

export const BAROQUE: SongDef[] = [
  song({
    id: 'canon', title: 'Canon in D', subtitle: 'upon a ground of eight notes', composer: 'Johann Pachelbel', year: 'c. 1700', era: 'baroque',
    blurb: 'Eight notes in the bass, forever. Above them, the melody blossoms ever faster.',
    bpm: 70, beatsPerBar: 4, tonic: pc('D'), lead: 'violin',
    melody: CANON_ORDER.map((c) => CANON[c]).join(' ') + ' D5w |',
    chords: rep('D:1 A:1 Bm:1 F#m:1 | G:1 D:1 G:1 A:1 |', CANON_ORDER.length) + ' D:4 |',
    bass: rep('D3q A2q B2q F#2q | G2q D2q G2q A2q |', CANON_ORDER.length) + ' D2w |',
    bassStyle: 'explicit',
  }),
  song({
    id: 'toccata', title: 'Toccata and Fugue', subtitle: 'in D minor, BWV 565', composer: 'Johann Sebastian Bach', year: 'c. 1704', era: 'baroque',
    blurb: 'Three thunderous flourishes on the great organ, then a whirl of semiquavers. Mind the pedals.',
    bpm: 66, beatsPerBar: 4, tonic: pc('D'), lead: 'organ', keys: 'organ', keysStyle: 'block',
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
    bpm: 100, beatsPerBar: 4, pickup: 0.5, tonic: pc('E'),
    melody: 'E5e | ' + springMel, chords: 'N:0.5 | ' + springCh,
  }),
  song({
    ...SEASON, id: 'summer', title: 'Summer', subtitle: 'The Four Seasons · III. Presto',
    blurb: 'The storm breaks at last: hail, lightning and scales like driving rain.',
    bpm: 132, beatsPerBar: 4, tonic: pc('G'), melody: sumMel, chords: sumCh,
  }),
  song({
    ...SEASON, id: 'autumn', title: 'Autumn', subtitle: 'The Four Seasons · I. Allegro',
    blurb: 'The harvest is in and the peasants dance, some of them rather unsteadily.',
    bpm: 104, beatsPerBar: 4, tonic: pc('F'), melody: autMel, chords: autCh, bassStyle: 'quarters',
  }),
  song({
    ...SEASON, id: 'winter', title: 'Winter', subtitle: 'The Four Seasons · I. Allegro non molto',
    blurb: 'Chattering teeth, stamping feet and a biting wind. Wrap up warmly.',
    bpm: 88, beatsPerBar: 4, tonic: pc('F'), melody: winMel, chords: winCh,
  }),
  song({
    id: 'badinerie', title: 'Badinerie', subtitle: 'Orchestral Suite No. 2 in B minor', composer: 'Johann Sebastian Bach', year: 'c. 1739', era: 'baroque',
    blurb: 'A jest for the flute, taken at a gallop. Only a Maestro survives it with a wig intact.',
    bpm: 108, beatsPerBar: 2, pickup: 1, tonic: pc('B'), lead: 'flute', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: badinerie(0), chords: badinerie(1),
  }),
];
