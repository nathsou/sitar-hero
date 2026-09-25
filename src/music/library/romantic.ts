import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

// ─── William Tell Overture (Finale) ────────────────────────────────────────

const TELL: Record<string, [string, string]> = {
  W1: ['E4s E4s E4e E4s E4s E4e |', 'A:2 |'],
  W2: ['E4s E4s A4e B4e C#5e |', 'A:1 E:1 |'],
  W4: ['A4s A4s C#5e B4e G#4e |', 'A:1 E:1 |'],
  W7: ['A4s C#5s E5e C#5s A4s E4e |', 'A:2 |'],
  W8: ['B4e E5e A4q |', 'E7:1 A:1 |'],
  G1: ['E5e E5e E5e E5e |', 'A:2 |'],
  G2: ['F#5e E5e D5e C#5e |', 'D:1 A:1 |'],
  G3: ['B4e B4e B4e B4e |', 'E:2 |'],
  G4: ['C#5e B4e A4e G#4e |', 'E:2 |'],
  G5: ['A4e A4e A4e A4e |', 'A:2 |'],
  G6: ['B4e A4e G#4e F#4e |', 'E:2 |'],
  G7: ['E4e F#4e G#4e A4e |', 'E:2 |'],
  G8: ['B4q E4q |', 'E7:2 |'],
  END: ['A4q r q | A3q r q |', 'A:2 | A:2 |'],
};
const TW = 'W1 W2 W1 W4 W1 W2 W7 W8';
const TG = 'G1 G2 G3 G4 G5 G6 G7 G8';

// ─── Nocturne Op. 9 No. 2 ──────────────────────────────────────────────────

const NOCT: Record<string, [string, string]> = {
  n1: ['G5h F5e G5e F5q. Eb5q Bb4e |', 'Eb:3 Bb7:3 |'],
  n2: ['G5q C5e C6q G5e Bb5q. Ab5q G5e |', 'Cm:3 Ab:3 |'],
  n3: ['F5q. G5q D5e Eb5q. C5q. |', 'Bb:3 Cm:3 |'],
  n4: ['Bb4e Bb5e A5e Bb5e G5e F5e Eb5q. r q Bb4e |', 'Bb7:3 Eb:3 |'],
  cad: ['Eb5h. r h r e Bb4e |', 'Eb:6 |'],
  n5: ['C6q. Bb5q G5e Ab5q. F5q. |', 'Ab:3 Bb7:3 |'],
  n6: ['G5q. F5q Eb5e F5q. Bb4q. |', 'Eb:3 Bb:3 |'],
  n7: ['C6q. Bb5q G5e Ab5e G5e F5e Eb5e D5e C5e |', 'Ab:3 Fm:3 |'],
  n8: ['Bb4q. Eb5q G5e Eb5h r e Bb4e |', 'Bb:3 Eb:3 |'],
  end: ['Eb5h. ~Eb5h. |', 'Eb:6 |'],
};

// ─── Fantaisie-Impromptu ───────────────────────────────────────────────────

const FANT: Record<string, [string, string]> = {
  f1: ['G#4s A4s G#4s G4s G#4s C#5s E5s D#5s C#5s D#5s C#5s C5s C#5s E5s G#5s A5s |', 'C#m:4 |'],
  f2: ['G#5s A5s G#5s G5s G#5s C#6s E6s D#6s C#6s D#6s C#6s C6s C#6s G#5s E5s C#5s |', 'C#m:4 |'],
  f3: ['D#5s E5s D#5s D5s D#5s F#5s A5s G#5s F#5s G#5s F#5s F5s F#5s A5s C#6s B5s |', 'G#7:4 |'],
  f4: ['A5s G#5s F#5s E5s D#5s C#5s C5s C#5s D#5s C#5s B4s A4s G#4q |', 'F#m:2 G#7:1 C#m:1 |'],
  R1: ['F5h Eb5q Db5q | C5q Db5q Eb5h |', 'Db:4 | Ab7:4 |'],
  R2: ['Ab4h. Ab4q | Bb4q C5q Db5q Eb5q |', 'Db:4 | Gb:4 |'],
  R3: ['F5h Gb5q F5q | Eb5h Db5h |', 'Db:2 Gb:2 | Ab:2 Db:2 |'],
  R4: ['C5q Db5q Eb5q Ab4q | Db5w |', 'Ab7:4 | Db:4 |'],
  end: ['C#5w |', 'C#m:4 |'],
};

// ─── Minute Waltz ──────────────────────────────────────────────────────────

const MINUTE: Record<string, [string, string]> = {
  I1: ['G5e Ab5e C6e Bb5e G5e Ab5e |', 'Ab7:3 |'],
  I2: ['C6e Bb5e G5e Ab5e C6e Bb5e |', 'Ab7:3 |'],
  A1: ['Ab5q Db6e C6e Bb5e Ab5e |', 'Db:3 |'],
  A2: ['Gb5e Ab5e Bb5e Ab5e F5e Db5e |', 'Gb:1.5 Db:1.5 |'],
  A3: ['Eb5e F5e Gb5e F5e Eb5e Db5e |', 'Ab7:3 |'],
  A4: ['C5e Db5e Eb5e Ab5e C6e Eb6e |', 'Ab7:3 |'],
  A5: ['Db6q Ab5e F5e Db5e Ab4e |', 'Db:3 |'],
  A6: ['Bb4e Db5e F5e Bb5e Ab5e Gb5e |', 'Bbm:3 |'],
  A7: ['F5e Eb5e Db5e C5e Db5e Eb5e |', 'Ab7:3 |'],
  A8: ['Db5q r q r q |', 'Db:3 |'],
  B1: ['Ab5h. |', 'Db:3 |'],
  B2: ['Gb5q F5q Eb5q |', 'Ebm:3 |'],
  B3: ['F5h. |', 'Bbm:3 |'],
  B4: ['Db5h Eb5q |', 'Gb:2 Ab:1 |'],
  B5: ['F5h. |', 'Db:3 |'],
  B6: ['Gb5q Ab5q Bb5q |', 'Gb:3 |'],
  B7: ['Ab5h. |', 'Db:3 |'],
  B8: ['~Ab5h Ab4q |', 'Ab7:3 |'],
};
const MI = 'I1 I2 I1 I2';
const MA = 'A1 A2 A3 A4 A5 A6 A7 A8';
const MB = 'B1 B2 B3 B4 B5 B6 B7 B8';

// ─── Infernal Galop (Can-Can) ──────────────────────────────────────────────

const CANCAN: Record<string, [string, string]> = {
  K1: ['C5q C5e D5e |', 'C:2 |'],
  K2: ['F5e E5e D5e G5e |', 'G7:2 |'],
  K3: ['G5q G5e A5e |', 'C:1 F:1 |'],
  K4: ['E5e F5e D5e D5e |', 'C:1 G7:1 |'],
  K5: ['D5q D5e F5e |', 'G7:2 |'],
  K6: ['E5e D5e C5e C6e |', 'G7:1 C:1 |'],
  K7: ['B5e A5e G5e F5e |', 'G7:2 |'],
  K8: ['E5e D5e C5q |', 'G7:1 C:1 |'],
  L1: ['G5e G5e G5e G5e |', 'C:2 |'],
  L2: ['G5e F5e E5e D5e |', 'G7:2 |'],
  L3: ['E5e E5e E5e E5e |', 'C:2 |'],
  L4: ['E5e D5e C5e B4e |', 'G7:2 |'],
  L5: ['C5e C5e C5e C5e |', 'C:2 |'],
  L6: ['C5e B4e A4e G4e |', 'Am:1 C:1 |'],
  L7: ['A4e B4e C5e D5e |', 'F:1 G:1 |'],
  L8: ['E5q G5q |', 'C:2 |'],
  END: ['C6q r q |', 'C:2 |'],
};
const CK = 'K1 K2 K3 K4 K5 K6 K7 K8';
const CL = 'L1 L2 L3 L4 L5 L6 L7 L8';

// ─── The Blue Danube ───────────────────────────────────────────────────────

const DANUBE: Record<string, [string, string]> = {
  b1: ['D4q F#4q A4q |', 'D:3 |'],
  b2: ['A4q r q A5q |', 'D:3 |'],
  b3: ['A5q r q F#5q |', 'D:3 |'],
  b4: ['F#5q r q D4q |', 'D:3 |'],
  b6: ['A4q r q A5q |', 'D:3 |'],
  b7: ['A5q r q G5q |', 'A7:3 |'],
  b8: ['G5q r q C#4q |', 'A7:3 |'],
  b9: ['C#4q E4q B4q |', 'A7:3 |'],
  b10: ['B4q r q B5q |', 'A7:3 |'],
  b11: ['B5q r q G5q |', 'A7:3 |'],
  b15: ['B5q r q F#5q |', 'D:3 |'],
  b18: ['D5q r q D6q |', 'D:3 |'],
  b19: ['D6q r q A5q |', 'D:3 |'],
  b20: ['A5q r q D4q |', 'D:3 |'],
  b23: ['D6q r q B5q |', 'G:3 |'],
  b24: ['B5q r q E4q |', 'Em:3 |'],
  b25: ['E4q G4q B4q |', 'Em:3 |'],
  b26: ['B4h r q |', 'Em:3 |'],
  b27: ['A4q C#5q E5q |', 'A7:3 |'],
  b28: ['D5h D4q |', 'D:3 |'],
  fin: ['D5h. |', 'D:3 |'],
};
const DAN = 'b1 b2 b3 b4 b1 b6 b7 b8 b9 b10 b11 b8 b9 b10 b15 b4 b1 b18 b19 b20 b1 b18 b23 b24 b25 b26 b27';

// ─── In the Hall of the Mountain King ──────────────────────────────────────

const TROLL: Record<string, [string, string]> = {
  M1: ['B3e C#4e D4e E4e F#4e D4e F#4q |', 'Bm:4 |'],
  M2: ['F4e C#4e F4q E4e C4e E4q |', 'C#:2 C:2 |'],
  M3: ['B3e C#4e D4e E4e F#4e D4e F#4e B4e |', 'Bm:4 |'],
  M4: ['A4e F#4e D4e F#4e A4h |', 'D:4 |'],
  M5: ['F#4e G#4e A#4e B4e C#5e A#4e C#5q |', 'F#:4 |'],
  M6: ['D5e A#4e D5q C#5e A#4e C#5q |', 'Bb:2 F#:2 |'],
  M8: ['D5e A#4e D5q C#5h |', 'Bb:2 F#:2 |'],
  END: ['B4q r q B3q r q |', 'Bm:4 |'],
};
const TR = 'M1 M2 M3 M4 M1 M2 M3 M4 M5 M6 M5 M8 M1 M2 M3 M4';

// ─── Gymnopédie No. 1 ──────────────────────────────────────────────────────

const GYM: Record<string, [string, string]> = {
  i1: ['r h. |', 'Gmaj7:3 |'],
  i2: ['r h. |', 'Dmaj7:3 |'],
  a1: ['r q F#5q A5q |', 'Gmaj7:3 |'],
  a2: ['G5q F#5q C#5q |', 'Dmaj7:3 |'],
  a3: ['B4q C#5q D5q |', 'Gmaj7:3 |'],
  a4: ['A4h. |', 'Dmaj7:3 |'],
  a5: ['F#4h. |', 'Gmaj7:3 |'],
  a6: ['~F#4h. |', 'Dmaj7:3 |'],
  b5: ['C#5h. |', 'F#m:3 |'],
  b6: ['F#5h. |', 'Bm:3 |'],
  b7: ['E5h. |', 'Em:3 |'],
  b8: ['~E5h. |', 'A:3 |'],
  c1: ['r q B4q C#5q |', 'Em:3 |'],
  c2: ['D5q E5q C#5q |', 'Bm:3 |'],
  c3: ['D5q E5q F#5q |', 'Bm:3 |'],
  c4: ['C#5h. |', 'F#m:3 |'],
  c5: ['~C#5h. |', 'F#m:3 |'],
  c8: ['B4h. |', 'Em:3 |'],
  c9: ['~B4h. |', 'Em:3 |'],
  end: ['D4h. | ~D4h. |', 'Dmaj7:3 | Dmaj7:3 |'],
};

const [tellMel, tellCh] = seq(TELL, `${TW} ${TW} ${TG} ${TW} ${TG} ${TW} ${TW} ${TG} END`);
const [noctMel, noctCh] = seq(NOCT, 'n1 n2 n3 n4 n5 n6 n7 n8 n1 n2 n3 cad n5 n6 n7 n8 n1 n2 n3 end');
const [fantMel, fantCh] = seq(FANT, 'f1 f2 f3 f4 f1 f2 f3 f4 R1 R2 R3 R4 R1 R2 R3 R4 f1 f2 f3 f4 f1 f2 f3 f4 end');
const [minMel, minCh] = seq(MINUTE, `${MI} ${MA} I1 I2 ${MA} ${MB} ${MB} ${MI} ${MA} ${MA}`);
const [canMel, canCh] = seq(CANCAN, `${CK} ${CK} ${CL} ${CK} ${CK} ${CL} ${CK} ${CK} END`);
const [danMel, danCh] = seq(DANUBE, `${DAN} b28 ${DAN} b28 ${DAN} fin`);
const [trollMel, trollCh] = seq(TROLL, `${TR} ${TR} ${TR} END`);
const [gymMel, gymCh] = seq(GYM, 'i1 i2 a1 a2 a3 a4 a5 a6 a1 a2 a3 a4 a5 a6 a1 a2 a3 a4 b5 b6 b7 b8 c1 c2 c3 c4 c5 c1 c2 c8 c9 a1 a2 a3 a4 a5 a6 end');

export const ROMANTIC: SongDef[] = [
  song({
    id: 'tell', title: 'William Tell Overture', subtitle: 'Finale: March of the Swiss Soldiers', composer: 'Gioachino Rossini', year: '1829', era: 'romantic',
    blurb: 'Hoofbeats and trumpet calls at full gallop. Hold on to your tricorne.',
    bpm: 152, beatsPerBar: 2, tonic: pc('A'), lead: 'trumpet', keys: 'strings', keysStyle: 'stride', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: tellMel, chords: tellCh,
  }),
  song({
    id: 'nocturne', title: 'Nocturne in E-flat', subtitle: 'Op. 9 No. 2', composer: 'Frédéric Chopin', year: '1832', era: 'romantic',
    blurb: 'A singer’s melody for the piano, drifting over a gentle rocking bass.',
    bpm: 72, beatsPerBar: 6, pulse: 1.5, pickup: 0.5, tonic: pc('Eb'), lead: 'piano', keys: 'piano', keysStyle: 'waltz',
    melody: 'Bb4e | ' + noctMel, chords: 'N:0.5 | ' + noctCh,
  }),
  song({
    id: 'fantaisie', title: 'Fantaisie-Impromptu', subtitle: 'Op. 66', composer: 'Frédéric Chopin', year: '1834', era: 'romantic',
    blurb: 'Semiquavers against triplets in a storm of C-sharp minor, then a song of pure calm.',
    bpm: 100, beatsPerBar: 4, tonic: pc('C#'), lead: 'piano', keys: 'piano', keysStyle: 'triplets',
    melody: fantMel, chords: fantCh,
  }),
  song({
    id: 'minute', title: 'Minute Waltz', subtitle: 'Op. 64 No. 1', composer: 'Frédéric Chopin', year: '1847', era: 'romantic',
    blurb: 'A little dog chasing its tail. It takes rather more than a minute to master.',
    bpm: 184, beatsPerBar: 3, tonic: pc('Db'), lead: 'piano', keys: 'piano', keysStyle: 'waltz',
    melody: minMel, chords: minCh,
  }),
  song({
    id: 'cancan', title: 'Infernal Galop', subtitle: 'from Orpheus in the Underworld', composer: 'Jacques Offenbach', year: '1858', era: 'romantic',
    blurb: 'The can-can! Skirts and ribbons flying. The Count pretends to be scandalised.',
    bpm: 144, beatsPerBar: 2, tonic: pc('C'), lead: 'trumpet', keys: 'strings', keysStyle: 'stride', bassStyle: 'quarters', stringStyle: 'pulse',
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
    bpm: 76, accel: 196, beatsPerBar: 4, tonic: pc('B'), lead: 'guitar', keys: 'strings', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: trollMel, chords: trollCh,
  }),
  song({
    id: 'gymnopedie', title: 'Gymnopédie No. 1', subtitle: 'Lent et douloureux', composer: 'Erik Satie', year: '1888', era: 'romantic',
    blurb: 'Slow, sorrowful and strange. The hardest thing is not to hurry.',
    bpm: 80, beatsPerBar: 3, tonic: pc('D'), lead: 'piano', keys: 'piano', keysStyle: 'waltz',
    melody: gymMel, chords: gymCh,
  }),
];
