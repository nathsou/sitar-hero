import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

// ─── William Tell Overture (Finale) ────────────────────────────────────────
// E major, 2/4. The galop figure is "ta-ta-TUM" with the TUM on the beat and
// the two semiquavers as its upbeat. Main theme (A) and the "ta-ta-ta TUM,
// TUUM" continuation (C); each 8-bar entry's last bar carries the next upbeat.

const TELL: Record<string, [string, string]> = {
  A1: ['B4e B4s B4s B4e B4s B4s |', 'E:2 |'],
  A2: ['E5e F#5e G#5e B4s B4s |', 'E:2 |'],
  A3: ['B4e B4s B4s E5e G#5s G#5s |', 'E:2 |'],
  A4: ['F#5e D#5e B4e B4s B4s |', 'B7:2 |'],
  A6: ['E5e F#5e G#5e E5s G#5s |', 'E:2 |'],
  A7: ['B5q ~B5s A5s G#5s F#5s |', 'B7:2 |'],
  toA: ['E5e G#5e E5e B4s B4s |', 'E:2 |'],
  toC: ['E5e G#5e E5e F#5e |', 'E:2 |'],
  fin: ['E5e G#5e E5q |', 'E:2 |'],
  C1: ['F#5e F#5s F#5s F#5e G#5e |', 'B7:2 |'],
  C2: ['A5e F#5q A5e |', 'B7:2 |'],
  C3: ['G#5e E5q G#5e |', 'E:2 |'],
  C4: ['F#5e B4q F#5e |', 'B7:2 |'],
  C8: ['F#5q r e B4s B4s |', 'B7:2 |'],
  END: ['E5q r q |', 'E:2 |'],
};
const TA = 'A1 A2 A3 A4 A1 A6 A7';
const TC = 'C1 C2 C3 C4 C1 C2 C3';

// ─── Nocturne Op. 9 No. 2 ──────────────────────────────────────────────────
// 12/8 (6 crotchet beats). Bars 1–12 and the ornamented return (13–16),
// following the first edition; the fioriture are kept, grace notes dropped.

const NOCT: Record<string, [string, string]> = {
  n1: ['G5h F5e G5e F5q. Eb5q Bb4e |', 'Eb:1.5 Abm/Eb:1.5 Eb:3 |'],
  n2: ['G5q C5e C6q G5e Bb5q. Ab5q G5e |', 'C7:3 Bbm/F:1.5 Fm:1.5 |'],
  n3: ['F5q. G5q D5e Eb5q. C5q. |', 'Bb7:1.5 G7/B:1.5 Cm:1.5 Adim7:1.5 |'],
  n4: ['Bb4e D6e C6e Bb5s Ab5s G5s Ab5s C5s D5s Eb5q. r q Bb4e |', 'Bb7:3 Eb:3 |'],
  n5: ['G5q. F5s G5s F5s E5s F5s G5s F5e Eb5q ~Eb5s F5s Eb5s D5s Eb5s F5s |', 'Eb:1.5 Abm/Eb:1.5 Eb:3 |'],
  n6: ['G5s B4s C5s D5s C5s F5s E5s Ab5s G5s D6s C6s G5s Bb5q. Ab5q G5e |', 'C7:3 Bbm/F:1.5 Fm:1.5 |'],
  n7: ['F5q. G5e G5e D5e Eb5q. C5q. |', 'Bb7:1.5 G7/B:1.5 Cm:1.5 Adim7:1.5 |'],
  n8: ['Bb4e D6e C6e Bb5s Ab5s G5s Ab5s C5s D5s Eb5h D5e Eb5e |', 'Bb7:3 Eb:3 |'],
  n9: ['F5q. G5q F5e F5q. C5q. |', 'Bb:3 F/A:3 |'],
  n10: ['Eb5e Eb5e Eb5e Eb5e D5s Eb5s F5s. Eb5t Eb5q. Bb4q. |', 'Ab:1.5 Abm:1.5 Eb:3 |'],
  n11: ['Bb5q. A5q G5e F5q. D5q. |', 'Edim7:1.5 C7/E:1.5 F:1.5 Gm:1.5 |'],
  n12: ['Eb5q. D5e C5e D5e Bb4e B4q C5q D5e |', 'Cm:1.5 F7:1.5 Bb:1.5 Bb7:1.5 |'],
  n16: ['Bb4e D6e C6e Bb5s Ab5s G5s Ab5s C5s D5s Eb5h. |', 'Bb7:3 Eb:3 |'],
  c1: ['Eb5e Bb4e G5e Eb5e Bb4e G5e Eb5e Bb4e G5e Eb5e Bb4e G5e |', 'Eb:6 |'],
  c2: ['Eb5q. Eb6q. ~Eb6h. |', 'Eb:6 |'],
};

// ─── Fantaisie-Impromptu ───────────────────────────────────────────────────
// Cut time (4 crotchets). The opening semiquaver figure (bars 5–12, which begin
// on a semiquaver rest), then the Db-major Moderato cantabile melody, then the
// opening again, closing on the C-sharp major of the coda.

const FANT: Record<string, [string, string]> = {
  a1: ['r s G#4s A4s G#4s G4s G#4s C#5s E5s D#5s C#5s D#5s C#5s C5s C#5s E5s G#5s |', 'C#m:4 |'],
  a3: ['r s A4s C#5s D#5s F#5s A5s C#6s D#6s B6s A6s G#6s F#6s E6s D#6s F#6s C#6s |', 'D#dim:2 F#m:2 |'],
  a4: ['C6s D#6s A5s G#5s F#5s A5s E5s D#5s F#5s C#5s C5s D#5s A4s G#4s B4s A4s |', 'G#7:4 |'],
  a5: ['~A4s G#4s A4s G#4s G4s G#4s C#5s E5s D#5s C#5s D#5s C#5s C5s C#5s E5s G#5s |', 'C#m:4 |'],
  a6: ['r s G#4s A#4s G#4s G4s G#4s C#5s E5s D#5s C#5s D#5s C#5s C5s C#5s E5s G#5s |', 'C#m:4 |'],
  a7: ['D#5s E5s D#5s D5s D#5s B5s A#5s G#5s G5s E6s D#6s C#6s B5s A#5s G#5s G5s |', 'G#m:2 D#7:2 |'],
  a8: ['A#5s G#5s B5s D5s E5s D#5s G#5s A#4s C#5s B4s D#5s G4s A#4s G#4s G4s G#4s |', 'G#m:4 |'],
  R1: ['Ab4h Bb4e Ab4e Db5e Eb5e |', 'Ab/Db:2 Ab7/Db:2 |'],
  R1b: ['Ab4h Bb4e Ab4e Db5e Eb5e |', 'Ab:2 Ab7:2 |'],
  R2: ['F5h Ab5h |', 'Db:4 |'],
  R3: ['Gb5q F5q Eb5q F5e. Db5s |', 'Ab7:1 Db:1 Ab:1 Db:1 |'],
  R4: ['Ab4h Bb4h |', 'Ab:2 Gb:2 |'],
  R5: ['~Bb4h Cb5e Bb4e Eb5e F5e |', 'Bb:2 Bb7:2 |'],
  R6: ['Gb5q F5q Eb5q F5q |', 'Ebm:1 F:1 Ebm/Gb:1 Ab7:1 |'],
  R7: ['Db5h F5q. Eb5e |', 'Db:2 Eb7:2 |'],
  R8: ['Eb5w |', 'Ab:2 Ab7:2 |'],
  R7b: ['Db5q. G4t Ab4t Bb4t Ab4t F5q. Eb5e |', 'Db:2 Ab7:2 |'],
  R8b: ['Eb5h Db5h |', 'Ab7:2 Db:2 |'],
  end: ['C#5w |', 'C#:4 |'],
};
const FA = 'a1 a1 a3 a4 a5 a6 a7 a8';

// ─── Minute Waltz ──────────────────────────────────────────────────────────
// Four bars of the unaccompanied spinning figure, the main waltz (16 bars),
// the second strain, the Sostenuto trio, then the reprise.

const MINUTE: Record<string, [string, string]> = {
  i1: ['Ab4q G4e Ab4e C5e Bb4e |', 'N:3 |'],
  i2: ['G4e Ab4e Bb4e Ab4e C5e Bb4e |', 'N:3 |'],
  i3: ['G4e Ab4e C5e Bb4e G4e Ab4e |', 'N:3 |'],
  i4: ['C5e Bb4e G4e Ab4e C5e Bb4e |', 'N:3 |'],
  a1: ['G4e Ab4e C5e Bb4e G4e Ab4e |', 'Db:3 |'],
  a2: ['C5e Bb4e G4e Ab4e C5e Bb4e |', 'Db/F:3 |'],
  a4: ['Bb4e C5e Db5e Eb5e F5e Gb5e |', 'Db/F:3 |'],
  a5: ['Bb5q. Ab5e Gb5e F5e |', 'Ab7:3 |'],
  a6: ['F5e Eb5e Eb5e D5e Eb5q |', 'Ab7/Eb:3 |'],
  a8: ['F5e Eb5e D5e Eb5e F5e Bb4e |', 'Ab7:3 |'],
  a16: ['Eb5e F5e Eb5e D5e Eb5e E5e |', 'Ab7:3 |'],
  x1: ['F5e3 Gb5e3 F5e3 E5e F5e Ab5e Gb5e |', 'F7/A:3 |'],
  x2: ['F5e Gb5e F5e E5e F5e Bb5e |', 'Bbm:3 |'],
  x3: ['Ab5e3 Bb5e3 Ab5e3 G5e Ab5e C6e Bb5e |', 'Ab7/C:3 |'],
  x4: ['Ab5e Bb5e Ab5e G5e Ab5e Db6e |', 'Db:3 |'],
  x5: ['C6e Bb5e Ab5e Gb5e F5e Eb5e |', 'Ebm/Gb:3 |'],
  x6: ['Db5e C5e Bb4e Ab4e Gb4e F4e |', 'Db/Ab:3 |'],
  x7: ['Eb4e Db4e C4e Eb4e Bb4e Ab4e |', 'Ab7:3 |'],
  x8: ['G4e Ab4e Bb4e C5e Db5e Eb5e |', 'Db:3 |'],
  x12: ['Ab5e Bb5e Ab5e G5e Ab5e F6e |', 'Db:3 |'],
  x13: ['Eb6e Db6e C6e Bb5e Ab5e Gb5e |', 'Ebm/Gb:3 |'],
  x14: ['F5e Eb5e Db5e C5e Bb4e Ab4e |', 'Db/Ab:3 |'],
  x15: ['A4e C5e Bb4e F4e Gb4e C4e |', 'Ab7:3 |'],
  x16: ['Db4q r q Ab4q |', 'Db:3 |'],
  xEnd: ['Db4q r h |', 'Db:3 |'],
  t1: ['~Ab4h Eb4q |', 'Ab7:3 |'],
  t2: ['Ab4h E4q |', 'Ab7:3 |'],
  t3: ['Ab4h F4q |', 'Db:3 |'],
  t4: ['F5h F5q |', 'Db/Ab:3 |'],
  t5: ['F5h Bb4q |', 'Ab7/Eb:3 |'],
  t6: ['F5h C5q |', 'Ab7:3 |'],
  t7: ['Eb5h Db5q |', 'Db:3 |'],
  t8: ['C5e. Eb5e. Db5e. Bb4e. |', 'Db/F:3 |'],
  t9: ['Ab4h Eb4q |', 'Ab7/C:3 |'],
  t12: ['F5h. |', 'Bdim7:3 |'],
  t13: ['C5q B4q C5q |', 'Fm/C:3 |'],
  t14: ['Ab5q Bb4q G5q |', 'C:3 |'],
  t15: ['A4q G5q Ab4q |', 'F:3 |'],
  t16: ['F5q F4q Bb4q |', 'Bbm:3 |'],
  t23: ['Eb5q Db5q C5q |', 'Db:3 |'],
  t24: ['Eb5q Db5q. Bb4e |', 'Db/F:3 |'],
  t27: ['Ab4h F4q |', 'Fdim/Cb:3 |'],
  t28: ['F5h. |', 'Bb7:3 |'],
  t29: ['F5h Bb4q |', 'Eb7:3 |'],
  t30: ['Eb5h A4q |', 'Ebm:3 |'],
  t31: ['Eb5q Ab4q D5q |', 'Ab7:3 |'],
  t32: ['F5q Eb5q Ab5q |', 'N:3 |'],
  tr: ['Ab4h. |', 'N:3 |'],
};
const MI = 'i1 i2 i3 i4';
const MA = 'a1 a2 a1 a4 a5 a6 a5 a8 a1 a2 a1 a4 a5 a6 a5 a16';
const MX = 'x1 x2 x3 x4 x5 x6 x7 x8 x1 x2 x3 x12 x13 x14 x15';
const MT = 't1 t2 t3 t4 t5 t6 t7 t8 t9 t2 t3 t12 t13 t14 t15 t16 t9 t2 t3 t4 t5 t6 t23 t24 t9 t2 t27 t28 t29 t30 t31 t32';

// ─── Infernal Galop (Can-Can) ──────────────────────────────────────────────
// 2/4. The can-can theme as Offenbach first gives it, in G major, then
// restated in D major.

const CANCAN: Record<string, [string, string]> = {
  g1: ['G4q A4s C5s B4s A4s |', 'G:1 D7:1 |'],
  g2: ['D5e D5e D5s E5s B4s C5s |', 'G:2 |'],
  g3: ['A4e A4e A4s C5s B4s A4s |', 'D:1 D7:1 |'],
  g4: ['G4s G5s F#5s E5s D5s C5s B4s A4s |', 'G:1 D7:1 |'],
  g8: ['G4s D5s A4s B4s G4e D4e |', 'G:0.5 D:0.5 G:0.5 D:0.5 |'],
  gEnd: ['G4s D5s A4s B4s G4q |', 'G:0.5 D:0.5 G:1 |'],
  d1: ['D5q E5s G5s F#5s E5s |', 'D:1 A7:1 |'],
  d2: ['A5e A5e A5s B5s F#5s G5s |', 'D:2 |'],
  d3: ['E5e E5e E5s G5s F#5s E5s |', 'A:1 A7:1 |'],
  d4: ['D5s D6s C#6s B5s A5s G5s F#5s E5s |', 'D:1 A7:1 |'],
  d8: ['D5s A5s E5s F#5s D5e A4e |', 'D:0.5 A:0.5 D:0.5 A:0.5 |'],
  d8x: ['D5s A5s E5s F#5s D5e D4e |', 'D:0.5 A:0.5 D:1 |'],
};
const CG = 'g1 g2 g3 g4 g1 g2 g3 g8';
const CD = 'd1 d2 d3 d4 d1 d2 d3 d8';
const CDX = 'd1 d2 d3 d4 d1 d2 d3 d8x';

// ─── The Blue Danube ───────────────────────────────────────────────────────
// Waltz No. 1: the famous 32-bar theme in D (with its "bum-bum" answers
// across the bar line), the 16-bar second strain in A, then the theme again.

const DANUBE: Record<string, [string, string]> = {
  D1: ['D4q F#4q A4q |', 'D:3 |'],
  D2: ['A4q r q A5q |', 'D:3 |'],
  D3: ['A5q r q F#5q |', 'D:3 |'],
  D4: ['F#5q r q D4q |', 'D:3 |'],
  D7: ['A5q r q G5q |', 'A7:3 |'],
  D8: ['G5q r q C#4q |', 'A7:3 |'],
  D9: ['C#4q E4q B4q |', 'A7:3 |'],
  D10: ['B4q r q B5q |', 'A7:3 |'],
  D11: ['B5q r q G5q |', 'A7:3 |'],
  D14: ['B4q r q B5q |', 'D:3 |'],
  D15: ['B5q r q F#5q |', 'D:3 |'],
  D18: ['D5q r q D6q |', 'D:3 |'],
  D19: ['D6q r q A5q |', 'D:3 |'],
  D20: ['A5q r q D4q |', 'D:3 |'],
  D22: ['D5q r q D6q |', 'G:3 |'],
  D23: ['D6q r q B5q |', 'G:3 |'],
  D24: ['B5q r q E5q |', 'G:3 |'],
  D25: ['E5q G5q B5e r e |', 'Em:3 |'],
  D26: ['B5h. |', 'E7:3 |'],
  D27: ['~B5q G#5q A5q |', 'E7:2 A7:1 |'],
  D28: ['F#6h. |', 'D:3 |'],
  D29: ['~F#6q D6q F#5q |', 'D:3 |'],
  D30: ['F#5h E5q |', 'A7:3 |'],
  D31: ['B5h A5q |', 'A7:3 |'],
  D32: ['D5q r e D5e D5q |', 'D:3 |'],
  T: ['r q D6e r e C#6e r e |', 'A:3 |'],
  E1: ['C#6e r e B5e r e B5e r e |', 'A:3 |'],
  E2: ['r q B5e r e A#5e r e |', 'F#7:3 |'],
  E3: ['A#5e r e B5e r e B5e r e |', 'Bm:3 |'],
  E4: ['r q E5e r e E5e r e |', 'E7:3 |'],
  E5: ['F#5h E5q |', 'E7:3 |'],
  E6: ['r q E5e r e E5e r e |', 'E7:3 |'],
  E7: ['B5h A5q |', 'E7:2 A:1 |'],
  E10: ['r q B5e r e C#6e r e |', 'A:3 |'],
  E11: ['E6e r e D6e r e D6e r e |', 'E7:3 |'],
  E12: ['r q G#5e r e B5e r e |', 'E7:3 |'],
  E14: ['G#5q. F#5e D5e B4e |', 'E7:3 |'],
  E15: ['F#5e F#5e F#5q E5q |', 'D:2 E7:1 |'],
  E16a: ['A4q D6e r e C#6e r e |', 'A:3 |'],
  E16b: ['A4q r q D4q |', 'A:2 A7:1 |'],
};
const DA = 'D1 D2 D3 D4 D1 D2 D7 D8 D9 D10 D11 D8 D9 D14 D15 D4 D1 D18 D19 D20 D1 D22 D23 D24 D25 D26 D27 D28 D29 D30 D31 D32';
const DE = 'E1 E2 E3 E4 E5 E6 E7 T E1 E10 E11 E12 E7 E14 E15';

// ─── In the Hall of the Mountain King ──────────────────────────────────────
// Over the bassoons' bare B–F# (and later F#–C#) pedal.

const TROLL: Record<string, [string, string]> = {
  M1: ['B3e C#4e D4e E4e F#4e D4e F#4q |', 'Bm:4 |'],
  M2: ['E#4e C#4e E#4q E4e C4e E4q |', 'C#7/B:2 B5:2 |'],
  M3: ['B3e C#4e D4e E4e F#4e D4e F#4e B4e |', 'Bm:4 |'],
  M4: ['A4e F#4e D4e F#4e A4q r q |', 'D:4 |'],
  M5: ['F#4e G#4e A#4e B4e C#5e A#4e C#5q |', 'F#:4 |'],
  M6: ['D5e A#4e D5q C#5e A#4e C#5q |', 'Daug:2 F#:2 |'],
  M8: ['D5e A#4e D5q C#5q r q |', 'Daug:2 F#:2 |'],
  END: ['B4q r q B3q r q |', 'Bm:4 |'],
};
const TR = 'M1 M2 M3 M4 M1 M2 M3 M4 M5 M6 M5 M8 M1 M2 M3 M4';

// ─── Gymnopédie No. 1 ──────────────────────────────────────────────────────
// The whole first half (39 bars): four bars of the rocking Gmaj7–Dmaj7
// introduction, the two statements of the tune, the modal middle phrase
// and the first-time ending.

const GYM: Record<string, [string, string]> = {
  iG: ['r h. |', 'Gmaj7:3 |'],
  iD: ['r h. |', 'Dmaj7:3 |'],
  a1: ['r q F#5q A5q |', 'Gmaj7:3 |'],
  a2: ['G5q F#5q C#5q |', 'Dmaj7:3 |'],
  a3: ['B4q C#5q D5q |', 'Gmaj7:3 |'],
  a4: ['A4h. |', 'Dmaj7:3 |'],
  a5: ['F#4h. |', 'Gmaj7:3 |'],
  hD: ['~F#4h. |', 'Dmaj7:3 |'],
  hG: ['~F#4h. |', 'Gmaj7:3 |'],
  b1: ['C#5h. |', 'F#m:3 |'],
  b2: ['F#5h. |', 'Bm:3 |'],
  b3: ['E4h. |', 'Em:3 |'],
  b4: ['~E4h. |', 'Em7:3 |'],
  b5: ['~E4h. |', 'Dm:3 |'],
  c1: ['A4q B4q C5q |', 'Am:3 |'],
  c2: ['E5q D5q B4q |', 'Em7/D:3 |'],
  c3: ['D5q C5q B4q |', 'Em7/D:3 |'],
  c4: ['D5h. |', 'Am/D:3 |'],
  c5: ['~D5h D5q |', 'D7:3 |'],
  c6: ['E5q F5q G5q |', 'Dm7:3 |'],
  c7: ['A5q C5q D5q |', 'Am/D:3 |'],
  c8: ['E5q D5q B4q |', 'Em7/D:3 |'],
  c9: ['D5h. |', 'Am/D:3 |'],
  e1: ['G5h. |', 'Em:3 |'],
  e2: ['F#5h. |', 'F#m:3 |'],
  e3: ['B4q A4q B4q |', 'Bm:3 |'],
  e4: ['C#5q D5q E5q |', 'A/E:3 |'],
  e5: ['C#5q D5q E5q |', 'F#m7/E:3 |'],
  e6: ['F#4h. |', 'Em7:3 |'],
  e7: ['C5h. |', 'Am7:3 |'],
  e8: ['D5h. |', 'D:3 |'],
};

const [tellMel, tellCh] = seq(TELL, `${TA} toA ${TA} toC ${TC} C4 ${TC} C8 ${TA} toA ${TA} toC ${TC} C4 ${TC} C8 ${TA} toA ${TA} fin END`);
const [noctMel, noctCh] = seq(NOCT, 'n1 n2 n3 n4 n5 n6 n7 n8 n9 n10 n11 n12 n5 n6 n7 n16 c1 c2');
const [fantMel, fantCh] = seq(FANT, `${FA} R1 R2 R3 R4 R5 R6 R7 R8 R1b R2 R3 R4 R5 R6 R7b R8b ${FA} end`);
const [minMel, minCh] = seq(MINUTE, `${MI} ${MA} ${MX} x16 ${MT} tr ${MI} ${MA} ${MX} xEnd`);
const [canMel, canCh] = seq(CANCAN, `${CG} ${CG} ${CD} ${CDX} ${CG} ${CG} ${CD} ${CDX} g1 g2 g3 g4 g1 g2 g3 gEnd`);
const [danMel, danCh] = seq(DANUBE, `${DA} T ${DE} E16a ${DE} E16b ${DA}`);
const [trollMel, trollCh] = seq(TROLL, `${TR} ${TR} ${TR} END`);
const [gymMel, gymCh] = seq(GYM, 'iG iD iG iD a1 a2 a3 a4 a5 hD hG hD a1 a2 a3 a4 b1 b2 b3 b4 b5 c1 c2 c3 c4 c5 c6 c7 c8 c9 c5 e1 e2 e3 e4 e5 e6 e7 e8');

export const ROMANTIC: SongDef[] = [
  song({
    id: 'tell', title: 'William Tell Overture', subtitle: 'Finale: March of the Swiss Soldiers', composer: 'Gioachino Rossini', year: '1829', era: 'romantic',
    blurb: 'Hoofbeats and trumpet calls at full gallop. Hold on to your tricorne.',
    bpm: 152, beatsPerBar: 2, pickup: 0.5, tonic: pc('E'), lead: 'trumpet', keys: 'strings', keysStyle: 'stride', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: 'B4s B4s | ' + tellMel, chords: 'N:0.5 | ' + tellCh,
  }),
  song({
    id: 'nocturne', title: 'Nocturne in E-flat', subtitle: 'Op. 9 No. 2', composer: 'Frédéric Chopin', year: '1832', era: 'romantic',
    blurb: 'A singer’s melody for the piano, drifting over a gentle rocking bass.',
    bpm: 72, beatsPerBar: 6, pulse: 1.5, pickup: 0.5, tonic: pc('Eb'), lead: 'grand', keys: 'grand', ensemble: 'piano', keysStyle: 'waltz',
    melody: 'Bb4e | ' + noctMel, chords: 'N:0.5 | ' + noctCh,
  }),
  song({
    id: 'fantaisie', title: 'Fantaisie-Impromptu', subtitle: 'Op. 66', composer: 'Frédéric Chopin', year: '1834', era: 'romantic',
    blurb: 'Semiquavers against triplets in a storm of C-sharp minor, then a song of pure calm.',
    bpm: 88, beatsPerBar: 4, tonic: pc('C#'), lead: 'grand', keys: 'grand', ensemble: 'piano', keysStyle: 'triplets',
    melody: fantMel, chords: fantCh,
  }),
  song({
    id: 'minute', title: 'Minute Waltz', subtitle: 'Op. 64 No. 1', composer: 'Frédéric Chopin', year: '1847', era: 'romantic',
    blurb: 'A little dog chasing its tail. It takes rather more than a minute to master.',
    bpm: 184, beatsPerBar: 3, tonic: pc('Db'), lead: 'grand', keys: 'grand', ensemble: 'piano', keysStyle: 'waltz',
    melody: minMel, chords: minCh,
  }),
  song({
    id: 'cancan', title: 'Infernal Galop', subtitle: 'from Orpheus in the Underworld', composer: 'Jacques Offenbach', year: '1858', era: 'romantic',
    blurb: 'The can-can! Skirts and ribbons flying. The Count pretends to be scandalised.',
    bpm: 138, beatsPerBar: 2, tonic: pc('G'), lead: 'trumpet', keys: 'strings', keysStyle: 'stride', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: canMel, chords: canCh,
  }),
  song({
    id: 'danube', title: 'The Blue Danube', subtitle: 'Waltz, Op. 314', composer: 'Johann Strauss II', year: '1866', era: 'romantic',
    blurb: 'Whirl across the ballroom floor: one-two-three, one-two-three.',
    bpm: 168, beatsPerBar: 3, pickup: 1, tonic: pc('D'), lead: 'violin', keys: 'strings', keysStyle: 'waltz', brass: 'horns',
    melody: 'D4q | ' + danMel, chords: 'N:1 | ' + danCh,
  }),
  song({
    id: 'troll', title: 'In the Hall of the Mountain King', subtitle: 'Peer Gynt Suite No. 1', composer: 'Edvard Grieg', year: '1875', era: 'romantic',
    blurb: 'It begins on tiptoe and ends in a stampede. The tempo never stops rising.',
    bpm: 120, accel: 200, beatsPerBar: 4, tonic: pc('B'), lead: 'guitar', keys: 'strings', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: trollMel, chords: trollCh,
  }),
  song({
    id: 'gymnopedie', title: 'Gymnopédie No. 1', subtitle: 'Lent et douloureux', composer: 'Erik Satie', year: '1888', era: 'romantic',
    blurb: 'Slow, sorrowful and strange. The hardest thing is not to hurry.',
    bpm: 72, beatsPerBar: 3, tonic: pc('D'), lead: 'grand', keys: 'grand', ensemble: 'piano', keysStyle: 'lento',
    melody: gymMel, chords: gymCh,
  }),
];
