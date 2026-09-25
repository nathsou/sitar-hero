import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

// Sources checked against: Humdrum/kern editions of K. 331 and Op. 27/2 (craigsapp/mozart-piano-sonatas,
// craigsapp/beethoven-piano-sonatas) and Mutopia LilyPond editions of K. 525/I, Op. 67/I and WoO 59.
// Fast ornaments (trills, turns, grace notes) are reduced to plain notes.

// ─── Eine kleine Nachtmusik ────────────────────────────────────────────────
// The recapitulation (bars 76–137 of the movement): the opening theme, the second
// theme now in G, the closing group and the coda. First violin line.

const NACHT: Record<string, [string, string]> = {
  n1: ['G5q r e D5e G5q r e D5e |', 'G:4 |'],
  n2: ['G5e D5e G5e B5e D6q r q |', 'G:4 |'],
  n3: ['C6q r e A5e C6q r e A5e |', 'D7:4 |'],
  n4: ['C6e A5e F#5e A5e D5q r q |', 'D7:4 |'],
  n5: ['G5e r e G5q. B5e A5e G5e |', 'G:4 |'],
  n6: ['G5e F#5e F#5q. A5e C6e F#5e |', 'D7/G:4 |'],
  n7: ['A5e G5e G5q. B5e A5e G5e |', 'G:4 |'],
  n9: ['G5e G5e F#5e E5s F#5s G5e G5e A5e G5s A5s |', 'G:1 D7/A:1 G/B:1 D7/F#:1 |'],
  n10: ['B5e B5e C6e B5s C6s D6q r q |', 'G:1 D7/A:1 G/B:2 |'],
  n11: ['D5h E5h |', 'G:2 C:2 |'],
  n12: ['C5q C5q B4q B4q |', 'D7:2 Em:2 |'],
  n13: ['A4q A4q G4e F#4e E4e F#4e |', 'Am/C:2 D7:2 |'],
  n14: ['G4e r e A4e r e B4e r e r q |', 'G/B:1 D7:1 G:2 |'],
  n16: ['D5e C5e C5e C5e C5e B4e B4e B4e |', 'D7:2 Em:2 |'],
  n17: ['B4e A4e A4e A4e G4e F#4e E4e F#4e |', 'Am/C:2 D7:2 |'],
  n18: ['G4h ~G4e F#4s G4s A4e F#4e |', 'G:4 |'],
  n19: ['B4h ~B4e A4s B4s C5e A4e |', 'G:4 |'],
  n20: ['D5h E5q F#5q |', 'G:2 C:1 D:1 |'],
  n21: ['G5q A5q B5q C#6q |', 'G/D:1 D:2 A7/D:1 |'],
  n22: ['D6q. A5e C#6e. A5s C#6e. A5s |', 'D:2 A7:2 |'],
  n24: ['D6e A5e C#6e A5e D6e A5e C#6e A5e |', 'D:1 A7:1 D:1 A7:1 |'],
  n25: ['D6e D4e D4e D4e D4q r q |', 'D:4 |'],
  // second theme, in the tonic
  s1: ['D5q. C5s3 B4s3 A4s3 G4e r e E5e r e |', 'G:3 E7/G#:1 |'],
  s2: ['C5e r e A4e r e D5e r e r q |', 'Am:1 A7/G:1 D7/F#:1 D:1 |'],
  s3: ['B5q. A5s3 G5s3 F#5s3 E5e r e C6e r e |', 'G:1 B7/D#:1 Em:1 C:1 |'],
  s4: ['B5h A5q r q |', 'G/D:2 D7:2 |'],
  s5: ['r e D6e D6e D6e D6e D6e D6e D6e |', 'G:1 D7/A:1 G/B:1 E7/G#:1 |'],
  s6: ['D6e D6e D6e D6e D6e C6e A5e F#5e |', 'D7/A:1 G:1 D/F#:1 D7:1 |'],
  s7: ['F#5e G5e r e E5e E5e D5e r e F#4e |', 'Em:1 C:1 D7:2 |'],
  s8: ['G4q r e D5e G5e F#5e E5e D5e |', 'G:4 |'],
  s9: ['E5e D5e r e D5e D5e D5e D5e D5e |', 'D7:4 |'],
  s10: ['E5e D5e r e D5e G5e F#5e E5e D5e |', 'G:4 |'],
  s12: ['E5e D5e r q E5q. D5s3 C5s3 B4s3 |', 'G:2 Am:1 E7:1 |'],
  s13: ['C5q r q D5q. C5s3 B4s3 A4s3 |', 'Am:2 D7:2 |'],
  s14: ['B4q r q E5e F#5s G5s F#5e E5e |', 'G:2 C:2 |'],
  s15: ['E5e D5e B4e D5e D5e C5e B4e A4e |', 'G/D:2 D7:2 |'],
  s20: ['E5e D5e r q E6q. D6s3 C6s3 B5s3 |', 'G:2 Am:1 E7:1 |'],
  s21: ['C6q r q D6q. C6s3 B5s3 A5s3 |', 'Am:2 D7:2 |'],
  s22: ['B5q r q E5e F#5s G5s F#5e E5e |', 'G:2 C:2 |'],
  s23: ['D5e G5e B5e D6e D6e C6e B5e A5e |', 'G/D:2 D7:2 |'],
  // closing group
  c1: ['G5e D4e E4e F#4e G4e G4e A4e G4s A4s |', 'G:3 D7:1 |'],
  c2: ['B4e F#4e G4e A4e B4e B4e C5e B4s C5s |', 'G:3 C:1 |'],
  c3: ['D5e D5e D#5e C#5s D#5s E5q r q |', 'D:1 B7/D#:1 Em:2 |'],
  c4: ['E4q. A4e G4e F#4e E4e D4e |', 'C:2 D7:2 |'],
  c5: ['D5e C#5e C5e B4e D5e C#5e C5e B4e |', 'G:4 |'],
  c6: ['D5e E5e F#5e G5e D5e E5e F#5e G5e |', 'G:4 |'],
  c7: ['A5q r q D6q r q |', 'Am/C:2 D:2 |'],
  // coda
  k1: ['G5q r e D5e B4e G4e B4e D5e |', 'G:4 |'],
  k2: ['G5e D5e G5e B5e D6q F#5q |', 'G:3 D:1 |'],
  k5: ['G5q r q G5q r q |', 'G:4 |'],
  k6: ['G5q G4e. G4s G4q r q |', 'G:4 |'],
};

// ─── Rondo alla Turca ──────────────────────────────────────────────────────
// Bars 1–56 plus the returning A-major refrain; top line of the right hand.

const RONDO: Record<string, [string, string]> = {
  a1: ['C5e r e D5s C5s B4s C5s |', 'Am:2 |'],
  a2: ['E5e r e F5s E5s D#5s E5s |', 'Am:2 |'],
  a3: ['B5s A5s G#5s A5s B5s A5s G#5s A5s |', 'Am:2 |'],
  a4: ['C6q A5e C6e |', 'Am:2 |'],
  a5: ['B5e A5e G5e A5e |', 'Em:2 |'],
  a7: ['B5e A5e G5e F#5e |', 'Em:1 B7:1 |'],
  a8x: ['E5q B4s A4s G#4s A4s |', 'Em:1 E:1 |'], // first ending, back to the start
  a8y: ['E5q E5e F5e |', 'Em:1 C:0.5 G7:0.5 |'], // second ending, on to the C-major phrase
  b9: ['G5e G5e A5s G5s F5s E5s |', 'C:2 |'],
  b10: ['D5q E5e F5e |', 'G:1 C:0.5 G7:0.5 |'],
  b12: ['D5q C5e D5e |', 'G:1 Am:0.5 G:0.5 |'],
  b13: ['E5e E5e F5s E5s D5s C5s |', 'Am:2 |'],
  b14: ['B4q C5e D5e |', 'E:1 Am:0.5 E7:0.5 |'],
  b16: ['B4q B4s A4s G#4s A4s |', 'E:2 |'],
  b20: ['C6q A5e B5e |', 'F.A.D#:2 |'],
  b21: ['C6e B5e A5e G#5e |', 'Am/E:1 Bdim/D:1 |'],
  b22: ['A5e E5e F5e D5e |', 'Am/C:1 Bdim/D:1 |'],
  b23: ['C5q B4e. A4t B4t |', 'Am/E:1 E7:1 |'],
  b24: ['A4q A5e B5e |', 'Am:1 E:1 |'],
  // the A-major "Janissary" refrain
  R1: ['C#6q A5e B5e |', 'A:2 |'],
  R2: ['C#6e B5e A5e G#5e |', 'A:2 |'],
  R3: ['F#5e G#5e A5e B5e |', 'D:1 D#dim:1 |'],
  R4: ['G#5e E5e A5e B5e |', 'E:2 |'],
  R7: ['F#5e B5e G#5e E5e |', 'D:1 E:1 |'],
  R8: ['A5q A5e B5e |', 'A:2 |'],
  R8f: ['A5q C#6s D6s C#6s B5s |', 'A:1 C#7:1 |'],
  R8e: ['A5q r q |', 'A:2 |'],
  // F-sharp-minor episode and the A-major scales
  d1: ['A5s B5s A5s G#5s F#5s A5s G#5s F#5s |', 'F#m:2 |'],
  d2: ['E#5s F#5s G#5s E#5s C#5s D#5s E#5s C#5s |', 'C#7/G#:2 |'],
  d3: ['F#5s E#5s F#5s G#5s A5s G#5s A5s B5s |', 'F#m:2 |'],
  d4: ['C#6s B#5s C#6s B#5s C#6s D6s C#6s B5s |', 'C#/E#:2 |'],
  d6: ['E5s F#5s G#5s E5s C#5s D#5s E5s C#5s |', 'C#m/G#:2 |'],
  d7: ['D#5s E5s F#5s D#5s B#4s C#5s D#5s B#4s |', 'G#7:2 |'],
  d8: ['C#5q E5s D5s C#5s B4s |', 'C#m:1 E7:1 |'],
  e1: ['A4s B4s C#5s D5s E5s F#5s G#5s A5s |', 'A:2 |'],
  e2: ['A5s G#5s F#5s E5s E5s D5s C#5s B4s |', 'E7:2 |'],
  e4: ['A#5e B5e E5s D5s C#5s B4s |', 'E7:2 |'],
  e7: ['C#5s E5s A4s C#5s B4s D5s G#4s B4s |', 'A:0.5 F#m:0.5 E7/D:0.5 E:0.5 |'],
  e8: ['A4q C#6s D6s C#6s B5s |', 'A:1 C#7:1 |'],
  d12: ['C#6s B#5s C#6s B#5s C#6s B#5s C#6s A#5s |', 'C#:1 C#7:1 |'],
  d13: ['D6s C#6s D6s C#6s D6s C#6s D6s C#6s |', 'Bm:2 |'],
  d14: ['D6s C#6s B5s A5s G#5s A5s B5s G#5s |', 'E:2 |'],
  d15: ['A5s B5s C#6s F#5s E#5s F#5s G#5s E#5s |', 'F#m:1 C#7:1 |'],
  d16: ['F#5q A5e B5e |', 'F#m:1 E:1 |'],
};
const RA = 'a1 a2 a3 a4 a5 a5 a7';
const RB = 'b9 b10 b9 b12 b13 b14 b13 b16 a1 a2 a3 b20 b21 b22 b23 b24';
const RR = 'R1 R2 R3 R4 R1 R2 R7';

// ─── Moonlight Sonata ──────────────────────────────────────────────────────
// Bars 1–8, then the reprise from bar 46 (which follows bar 45 = bar 8) to the cadence
// at bar 60. The soloist plays the triplets of the introduction, then the melody.

const trip = (n: string, times = 1) => Array.from({ length: times }, () => n.split(' ').map((x) => `${x}e3`).join(' ')).join(' ');
const MOON: Record<string, [string, string]> = {
  i1: [`${trip('G#3 C#4 E4', 4)} |`, 'C#m:4 |'],
  i2: [`${trip('G#3 C#4 E4', 4)} |`, 'C#m/B:4 |'],
  i3: [`${trip('A3 C#4 E4', 2)} ${trip('A3 D4 F#4', 2)} |`, 'A:2 D/F#:2 |'],
  i4: [`${trip('G#3 B#3 F#4')} ${trip('G#3 C#4 E4')} ${trip('G#3 C#4 D#4')} ${trip('F#3 B#3 D#4')} |`, 'G#7:1 C#m/G#:1 G#sus4:1 G#7:1 |'],
  m5: ['r h. G#4e. G#4s |', 'C#m:4 |'],
  m6: ['G#4h. G#4e. G#4s |', 'G#7/B#:4 |'],
  m7: ['G#4h A4h |', 'C#m:2 F#m:2 |'],
  m8: ['G#4h F#4q B4q |', 'E/B:2 B7:2 |'],
  m46: ['E4q r q r q B4e. B4s |', 'E:4 |'],
  m47: ['B4h. B4e. B4s |', 'B7/D#:4 |'],
  m48: ['B4h B#4q C#5q |', 'E:2 G#7/D#:1 C#m:1 |'],
  m49: ['D#5h E5h |', 'G#7/B#:2 C#m:2 |'],
  m50: ['D5h B#4h |', 'D/F#:2 G#7:2 |'],
  m51: ['C#5h. C#5q |', 'C#m:2 C#:2 |'],
  m52: ['D5h. B#4q |', 'F#m:4 |'],
  m53: ['C#5h. C#5q |', 'C#:4 |'],
  m55: ['C#5h C#5h |', 'C#:2 F#m:2 |'],
  m56: ['B4h. B4q |', 'B7/D#:3 E:1 |'],
  m57: ['A4q A4q G#4q G#4q |', 'A/C#:1 D#dim:1 G#7/B#:1 C#m:1 |'],
  m58: ['F#4h G#4q A4q |', 'F#m/A:2 G#sus4:1 D#dim/F#:1 |'],
  m59: ['G#4h G#4h |', 'C#m/G#:2 G#7:2 |'],
  END: ['C#4w |', 'C#m:4 |'],
};

// ─── Symphony No. 5 ────────────────────────────────────────────────────────
// The exposition (bars 1–122) as one composite line — each entry of the motto is taken
// from whichever string part has it — then the last 25 bars of the coda. Fermatas are
// written out as one extra bar.

const FIFTH: Record<string, [string, string]> = {
  e1: ['r e G4e G4e G4e |', 'Cm:2 |'],
  e2: ['Eb4h | ~Eb4h |', 'Cm:2 | Cm:2 |'],
  e3: ['r e F4e F4e F4e |', 'G7:2 |'],
  e4: ['D4h | ~D4h | ~D4h |', 'G7:2 | G7:2 | G7:2 |'],
  e6: [
    'r e G4e G4e G4e | Eb4e Ab4e Ab4e Ab4e | G4e Eb5e Eb5e Eb5e | C5h | C5e G4e G4e G4e | D4e Ab4e Ab4e Ab4e | G4e F5e F5e F5e | D5h |',
    'Cm:2 | Ab/C:2 | Cm:2 | Cm:2 | Cm:2 | G7/B:2 | G7/B:2 | G7/B:2 |',
  ],
  e14: [
    'D5e G5e G5e F5e | Eb5h | D5e G5e G5e F5e | Eb5h | D5e G5e G5e F5e | Eb5q r q | C5q r q | G5h | ~G5h |',
    'G7/B:2 | Cm:2 | G7/B:2 | Cm:2 | G7/B:2 | Cm:2 | D7/Ab:2 | G:2 | G:2 |',
  ],
  e22: [
    'r e Ab4e Ab4e Ab4e | F4h | ~F4h | ~F4h | r e Ab4e Ab4e Ab4e | F4h | ~F4h | ~F4h | Eb4e Ab4e Ab4e Ab4e | F4h | ~F4h | ~F4h |',
    'Fm:2 | Fm:2 | Fm:2 | Fm:2 | Fm:2 | G7:2 | G7:2 | G7:2 | Cm:2 | G7:2 | G7:2 | G7:2 |',
  ],
  e33: [
    'Eb4e G4e C5e C5e | C5h | B4e B4e B4e D5e | D5h | C5e C5e C5e Eb5e | Eb5e D5e D5e F5e | F5e E5e E5e G5e | G5e F5e F5e Ab5e | Ab5e G5e G5e Bb5e | Bb5e Ab5e Ab5e C6e | C6e B5e B5e D6e |',
    'Cm:2 | G7/C:2 | G7/C:2 | Cm:2 | Cm:2 | G7/C:2 | C7:2 | Fm/C:2 | C7:2 | Fm/C:2 | G7/C:2 |',
  ],
  e44: [
    'C6e Eb6e Eb6e Eb6e | C6e G5e G5e G5e | Eb5e C5e G4e G4e | Eb4e C4e C4e C4e | B3e F5e D5e D5e | B4e G4e F4e F4e | D5e B4e G4e F4e | D4e B3e C4e C4e |',
    'Cm:2 | Cm:2 | Cm:2 | Cm:2 | G7:2 | G7:2 | G7:2 | G7:1 Cm:1 |',
  ],
  e52: [
    'C5e Eb5e Eb5e Eb5e | C5e A4e A4e A4e | Gb4e Eb4e Eb4e Eb4e | C4e A4e A4e A4e | A4q r q | r h | Bb4q r q |',
    'Cdim7:2 | Cdim7:2 | Cdim7:2 | Cdim7:2 | Cdim7:2 | N:2 | Bb/D:2 |',
  ],
  // horn call, then the second theme in E-flat
  h59: ['r e Bb4e Bb4e Bb4e | Eb5h | F5h | Bb4h |', 'Bb:2 | Eb:2 | Bb:2 | Eb:2 |'],
  t63: ['Bb4q Eb5q | D5q Eb5q | F5q C5q | C5q Bb4q |', 'Eb:2 | Bb7:2 | Bb7:2 | Eb:2 |'],
  t75: [
    'Bb4q C5q | Db5q C5q | Bb4q C5q | Bb4q Ab4q | Db5q Eb5q | F5q Eb5q | Db5q Eb5q | Db5q C5q |',
    'Eb:2 | C7:2 | C7:2 | Fm:2 | Db/F:2 | Eb/G:2 | Eb7/G:2 | Ab:2 |',
  ],
  t83: [
    'Eb5q F5q | Gb5q F5q | Eb5q F5q | Gb5q F5q | Eb5q F5q | Gb5q F5q | Eb5q F5q | Gb5q F5q | Eb5q F5q | Gb5q F5q | Gb5q A5q |',
    'Ebm:2 | Adim7:2 | Adim7:2 | Ebm/Bb:2 | Ebm/Bb:2 | Cb:2 | Cb:2 | Cdim:2 | Cdim:2 | Cdim:2 | Cdim7:2 |',
  ],
  t94: [
    'Bb5h | ~Bb5e C6e Bb5e Ab5e | Ab5e G5e F5e Eb5e | Eb5e D5e C5e D5e | F5e Eb5e Bb4e G4e | D5e C5e Ab4e F4e | C5e Bb4e G4e Eb4e |',
    'Bb/D:2 | Bb7/D:2 | Eb:2 | Bb7/F:2 | Eb/G:2 | Bb7/Ab:2 | Eb/Bb:2 |',
  ],
  t101: [
    'Bb4e A5e Bb5e A5e | Bb5e A5e Bb5e A5e | Bb5e C6e Bb5e Ab5e | Ab5e G5e F5e Eb5e | Eb5e D5e C5e D5e | F5e Eb5e Bb4e G4e | D5e C5e Ab4e F4e | C5e Bb4e G4e Eb4e | Bb3e Bb4e Bb5e Bb5e |',
    'Bb:2 | Bb/D:2 | Bb7/D:2 | Eb:2 | Bb7/F:2 | Eb/G:2 | Bb7/Ab:2 | Eb/Bb:2 | Bb:2 |',
  ],
  t110: [
    'Eb5h | ~Eb5h | ~Eb5h | ~Eb5e F5e F5e F5e | G5h | ~G5h | ~G5h | ~G5e Bb5e Bb5e Bb5e | Bb5q r q | r e Bb5e Bb5e Bb5e | Bb5q r q | r e D6e D6e D6e | Eb6q r q | r h |',
    'Eb:2 | Eb:2 | Eb:2 | Eb:0.5 Bb7:1.5 | Eb:2 | Eb:2 | Eb:2 | Eb:0.5 Bb:1.5 | Eb:2 | Bb:2 | Eb:2 | Bb:2 | Eb:2 | N:2 |',
  ],
  // coda: the motto returns, then the final cadences
  k1: [
    'r e G5e G5e G5e | Eb5h | ~Eb5h | r e F5e F5e F5e | D5h | ~D5h | r h | r e Ab4e Ab4e Ab4e | G4e Eb5e Eb5e Eb5e | C5h | C5q r q | r e Ab4e Ab4e Ab4e | G4e Eb5e Eb5e Eb5e | C5h |',
    'Cm:2 | Cm:2 | Cm:2 | G7:2 | G7:2 | G7:2 | N:2 | Fm/C:2 | Cm:2 | Cm:2 | Cm:2 | Fm/C:2 | Cm:2 | Cm:2 |',
  ],
  k15: [
    'C5e G5e G5e G5e | G5q r q | r e G5e G5e G5e | G5q r q | r e G5e G5e G5e | G5q G5q | G5q B5q | C6q B5q | C6q r q | B4q r q | C5q r q |',
    'Cm:0.5 G7:1.5 | Cm:2 | G7:2 | Cm:2 | G7:2 | Cm:1 G7:1 | Cm:1 G7:1 | Cm:1 G7:1 | Cm:2 | G:2 | Cm:2 |',
  ],
};

// ─── Für Elise ─────────────────────────────────────────────────────────────
// A section (both endings), B section with the A return (twice), A once more.

const ELISE: Record<string, [string, string]> = {
  a1: ['E5s D#5s E5s B4s D5s C5s |', 'N:1.5 |'],
  a2: ['A4e r s C4s E4s A4s |', 'Am:1.5 |'],
  a3: ['B4e r s E4s G#4s B4s |', 'E:1.5 |'],
  a4: ['C5e r s E4s E5s D#5s |', 'Am:1.5 |'],
  a7: ['B4e r s E4s C5s B4s |', 'E:1.5 |'],
  a8a: ['A4q E5s D#5s |', 'Am:1.5 |'],
  a8b: ['A4e r s B4s C5s D5s |', 'Am:1.5 |'],
  a8f: ['A4q. |', 'Am:1.5 |'],
  b1: ['E5e. G4s F5s E5s |', 'C:1.5 |'],
  b2: ['D5e. F4s E5s D5s |', 'G:1.5 |'],
  b3: ['C5e. E4s D5s C5s |', 'Am:1.5 |'],
  b4: ['B4e r s E4s E5s r s |', 'E:1.5 |'],
  b5: ['r s E5s E6s r s r s D#5s |', 'E:1.5 |'],
  b6: ['E5e r s D#5s E5s D#5s |', 'E:1.5 |'],
};
const EA = 'a1 a2 a3 a4 a1 a2 a7';
const EB = 'b1 b2 b3 b4 b5 b6';

// ─── Ode to Joy ────────────────────────────────────────────────────────────
// Beethoven's version, including the syncopated F# that anticipates bar 13.

const ODE_LOW = `
  F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | F#4q. E4e E4h |
  F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | E4q. D4e D4h |
  E4q E4q F#4q D4q | E4q F#4e G4e F#4q D4q | E4q F#4e G4e F#4q E4q | D4q E4q A3q F#4q |
  ~F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | E4q. D4e D4h |`;
const ODE_CH = `
  D:4 | D:2 A:2 | D:4 | D:2 A:2 | D:4 | D:2 A:2 | D:4 | A:2 D:2 |
  A:2 D:2 | A:2 D:2 | A:2 D:1 A:1 | D:1 A:2 D:1 | D:4 | D:2 A:2 | D:4 | A:2 D:2 |`;
const ODE_HIGH = ODE_LOW.replace(/([A-G]#?)(\d)/g, (_, n: string, o: string) => `${n}${Number(o) + 1}`);

const [nachtMel, nachtCh] = seq(
  NACHT,
  `n1 n2 n3 n4 n5 n6 n7 n6 n9 n10 n11 n12 n13 n14 n11 n16 n17 n18 n19 n20 n21 n22 n22 n24 n25
   s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s9 s12 s13 s14 s15 s8 s9 s10 s9 s20 s21 s22 s23
   c1 c2 c3 c4 c5 c4 c6 c7 k1 k2 k1 k2 k5 k6`,
);
const [rondoMel, rondoCh] = seq(
  RONDO,
  `${RA} a8x ${RA} a8y ${RB} ${RR} R8 ${RR} R8f
   d1 d2 d3 d4 d1 d6 d7 d8 e1 e2 e1 e4 e1 e2 e7 e8 d1 d2 d3 d12 d13 d14 d15 d16
   ${RR} R8 ${RR} R8e`,
);
const [moonMel, moonCh] = seq(MOON, 'i1 i2 i3 i4 m5 m6 m7 m8 m46 m47 m48 m49 m50 m51 m52 m53 m52 m55 m56 m57 m58 m59 END');
const [fifthMel, fifthCh] = seq(FIFTH, 'e1 e2 e3 e4 e6 e14 e22 e33 e44 e52 h59 t63 t63 t63 t75 t83 t94 t101 t110 k1 k15');
const [eliseMel, eliseCh] = seq(ELISE, `${EA} a8a ${EA} a8b ${EB} ${EA} a8b ${EB} ${EA} a8a ${EA} a8f`);

export const CLASSICAL: SongDef[] = [
  song({
    id: 'turca', title: 'Rondo alla Turca', subtitle: 'Piano Sonata No. 11, III', composer: 'Wolfgang Amadeus Mozart', year: '1783', era: 'classical',
    blurb: 'A Janissary band marches through a Viennese salon. Nimble fingers required.',
    bpm: 126, beatsPerBar: 2, pickup: 1, tonic: pc('A'), lead: 'piano', keys: 'piano', keysStyle: 'stride', bassStyle: 'quarters',
    melody: 'B4s A4s G#4s A4s | ' + rondoMel, chords: 'E:1 | ' + rondoCh,
  }),
  song({
    id: 'nachtmusik', title: 'Eine kleine Nachtmusik', subtitle: 'Serenade No. 13, I. Allegro', composer: 'Wolfgang Amadeus Mozart', year: '1787', era: 'classical',
    blurb: 'A little night music for strings, all rockets and good manners.',
    bpm: 140, beatsPerBar: 4, tonic: pc('G'), lead: 'violin', keys: 'strings', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: nachtMel, chords: nachtCh,
  }),
  song({
    id: 'moonlight', title: 'Moonlight Sonata', subtitle: 'Piano Sonata No. 14, I. Adagio sostenuto', composer: 'Ludwig van Beethoven', year: '1801', era: 'classical',
    blurb: 'Endless triplets under a pale, patient melody. Breathe with the ribbons.',
    bpm: 56, beatsPerBar: 4, tonic: pc('C#'), lead: 'grand', keys: 'grand', ensemble: 'piano', keysStyle: 'triplets', keysFrom: 16,
    melody: moonMel, chords: moonCh,
  }),
  song({
    id: 'fifth', title: 'Symphony No. 5', subtitle: 'I. Allegro con brio', composer: 'Ludwig van Beethoven', year: '1808', era: 'classical',
    blurb: 'Fate knocks at the door. Four times. Then it will not stop knocking.',
    bpm: 200, beatsPerBar: 2, tonic: pc('C'), lead: 'violin', keys: 'strings', brass: 'horns', stringStyle: 'pulse', bassStyle: 'quarters',
    melody: fifthMel, chords: fifthCh,
  }),
  song({
    id: 'elise', title: 'Für Elise', subtitle: 'Bagatelle No. 25 in A minor', composer: 'Ludwig van Beethoven', year: '1810', era: 'classical',
    blurb: 'Every pupil’s first love. Mind the little rests between the phrases.',
    bpm: 64, beatsPerBar: 1.5, pulse: 0.5, pickup: 0.5, tonic: pc('A'), lead: 'grand', keys: 'grand', ensemble: 'piano', keysStyle: 'arpeggio',
    melody: 'E5s D#5s | ' + eliseMel, chords: 'N:0.5 | ' + eliseCh,
  }),
  song({
    id: 'ode', title: 'Ode to Joy', subtitle: 'Symphony No. 9, IV', composer: 'Ludwig van Beethoven', year: '1824', era: 'classical',
    blurb: 'All men become brothers, and the melody is almost all stepwise. A gentle beginning.',
    bpm: 120, beatsPerBar: 4, tonic: pc('D'), lead: 'violin', keys: 'strings', brass: 'horns', bassStyle: 'quarters',
    melody: [ODE_LOW, ODE_HIGH, ODE_LOW].join(' '), chords: [ODE_CH, ODE_CH, ODE_CH].join(' '),
  }),
];
