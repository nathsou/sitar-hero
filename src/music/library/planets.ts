import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

const SUITE = { era: 'planets', composer: 'Gustav Holst', year: '1916', keys: 'harp', brass: 'horns' } as const;

// ─── Mars, the Bringer of War (5/4) ────────────────────────────────────────

const MARS: Record<string, [string, string]> = {
  O1: ['G3e3 G3e3 G3e3 G3q D4q G3e G3e D4q |', 'G5:5 |'],
  O2: ['G3e3 G3e3 G3e3 G3q Ab3q G3e G3e Ab3q |', 'G5:5 |'],
  B1: ['G4w ~G4q |', 'G5:5 |'],
  B2: ['D5h. Db5h |', 'G5:3 Db:2 |'],
  B3: ['C5h. Bb4h |', 'C:3 Bb:2 |'],
  B4: ['G4w ~G4q |', 'G5:5 |'],
  C1: ['G4e3 G4e3 G4e3 G4q D5q G4e G4e D5q |', 'G5:5 |'],
  C2: ['G4e3 G4e3 G4e3 G4q Db5q G4e G4e Db5q |', 'Db:5 |'],
  END: ['G3w ~G3q |', 'G5:5 |'],
};

// ─── Venus, the Bringer of Peace ───────────────────────────────────────────

const VENUS: Record<string, [string, string]> = {
  V1: ['Eb4h Bb4h | C5h. Bb4q | Ab4h G4h | Bb4w |', 'Eb:4 | Ab:4 | Fm:2 Eb:2 | Bb:4 |'],
  V2: ['G5h F5h | Eb5h. D5q | C5h Bb4q C5q | D5w |', 'Eb:2 Bb:2 | Cm:4 | Ab:4 | Bb:4 |'],
  V3: ['Eb5h G5h | Bb5h. Ab5q | G5q F5q Eb5q D5q | Eb5w |', 'Eb:4 | Eb:2 Ab:2 | Ab:2 Bb:2 | Eb:4 |'],
};

// ─── Mercury, the Winged Messenger (6/8) ───────────────────────────────────

const MERCURY: Record<string, [string, string]> = {
  M1: ['Bb4e D5e F5e Bb5e F5e D5e |', 'Bb:3 |'],
  M2: ['E5e G#5e B5e E6e B5e G#5e |', 'E:3 |'],
  T1: ['F5q Bb5e A5q G5e |', 'Bb:3 |'],
  T2: ['F5q. D5q. |', 'Bb:3 |'],
  T3: ['Eb5q G5e F5q Eb5e |', 'Eb:3 |'],
  T4: ['D5q. Bb4q. |', 'Bb:3 |'],
  T5: ['C5q Eb5e D5q C5e |', 'F7:3 |'],
  T6: ['Bb4q. F5q. |', 'Bb:3 |'],
  T7: ['G5e A5e Bb5e C6e D6e Eb6e |', 'Eb:1.5 F:1.5 |'],
  T8: ['F6q. r q. |', 'Bb:3 |'],
};
const MM = 'M1 M2 M1 M2';
const MT = 'T1 T2 T3 T4 T5 T6 T7 T8';

// ─── Jupiter, the Bringer of Jollity ───────────────────────────────────────

const JUPITER: Record<string, [string, string]> = {
  S1: ['C5s D5s E5s G5s A5s G5s E5s D5s |', 'C:2 |'],
  S2: ['E5s G5s A5s C6s D6s C6s A5s G5s |', 'Am:2 |'],
  J1: ['G4e C5e C5e D5e |', 'C:2 |'],
  J2: ['E5e G5e E5e D5e |', 'C:2 |'],
  J3: ['C5e D5e E5e C5e |', 'C:1 Am:1 |'],
  J4: ['G4q r q |', 'G:2 |'],
  J5: ['A4e C5e C5e D5e |', 'F:2 |'],
  J6: ['E5e A5e G5e E5e |', 'Am:1 C:1 |'],
  J7: ['D5e E5e D5e B4e |', 'G:2 |'],
  J8: ['C5q r q |', 'C:2 |'],
  F1: ['C6q G5q |', 'C:2 |'],
  F2: ['E5q C5q |', 'C:2 |'],
  F3: ['G5e C6e E6e C6e |', 'C:2 |'],
  F4: ['G6h |', 'G:2 |'],
  END: ['C6h | C5h |', 'C:2 | C:2 |'],
};
const JB = 'S1 S2 S1 S2 J1 J2 J3 J4 J5 J6 J7 J8 J1 J2 J3 J4 J5 J6 J7 J8 F1 F2 F3 F4';

// ─── Saturn, the Bringer of Old Age ────────────────────────────────────────

const SATURN: Record<string, [string, string]> = {
  S1: ['A4e C5e A4e C5e A4e C5e A4e C5e |', 'Am:4 |'],
  S2: ['Bb4e D5e Bb4e D5e Bb4e D5e Bb4e D5e |', 'Gm:4 |'],
  T1: ['C4h D4h | E4h. D4q | C4h B3h | C4w |', 'C:4 | Am:4 | F:2 G:2 | C:4 |'],
  T2: ['E4h F4h | G4h. F4q | E4h D4h | E4w |', 'C:4 | C:4 | Am:2 G:2 | C:4 |'],
  T3: ['G4h A4h | Bb4h. A4q | G4h F4h | E4w |', 'C7:4 | F:4 | C:2 Dm:2 | C:4 |'],
  BELL: ['C5q G4q C5q G4q |', 'C:4 |'],
  END: ['C4w | ~C4w |', 'C:4 | C:4 |'],
};

// ─── Uranus, the Magician (6/8) ────────────────────────────────────────────

const URANUS: Record<string, [string, string]> = {
  U1: ['G4q. Eb4q. | A4q. B4q. |', 'G:1.5 Eb:1.5 | A:1.5 B:1.5 |'],
  U2: ['G3q. Eb3q. | A3q. B3q. |', 'G:1.5 Eb:1.5 | A:1.5 B:1.5 |'],
  D1: ['G3e A3e B3e C4q A3e |', 'G:3 |'],
  D2: ['B3q G3e D4q. |', 'G:1.5 D:1.5 |'],
  D3: ['C4e B3e A3e B3q G3e |', 'C:1.5 G:1.5 |'],
  D4: ['A3q. D3q. |', 'D:3 |'],
  D7: ['E4e D4e C4e B3q A3e |', 'C:1.5 D7:1.5 |'],
  D8: ['G3q. r q. |', 'G:3 |'],
  E1: ['D4e D4e D4e G4q. |', 'G:3 |'],
  E2: ['F#4e E4e D4e G4q. |', 'D:1.5 G:1.5 |'],
  E3: ['B4e B4e B4e D5q. |', 'G:3 |'],
  E4: ['C5e B4e A4e G4q. |', 'C:1.5 G:1.5 |'],
  END: ['G2q. r q. |', 'G:3 |'],
};
const UD = 'D1 D2 D3 D4 D1 D2 D7 D8';
const UE = 'E1 E2 E3 E4 E1 E2 E3 E4';

// ─── Neptune, the Mystic (5/4) ─────────────────────────────────────────────

const NEPTUNE: Record<string, [string, string]> = {
  N1: ['E5e G5e B5e G5e E5e G5e B5e G5e E5e G5e |', 'Em:5 |'],
  N2: ['G#5e B5e D#6e B5e G#5e B5e D#6e B5e G#5e B5e |', 'G#m:5 |'],
  C1: ['B4h. G4h |', 'Em:3 C:2 |'],
  C2: ['A4w ~A4q |', 'D:5 |'],
  C3: ['B4h. D5h |', 'G:5 |'],
  C4: ['E5w ~E5q |', 'Em:5 |'],
  END: ['E5w ~E5q | ~E5w ~E5q |', 'Em:5 | Em:5 |'],
};

// ─── Thaxted (Jupiter's great hymn) ────────────────────────────────────────

const THAX: Record<string, [string, string]> = {
  b1: ['A4q. C5e B4e. G4s |', 'F:1.5 G:1.5 |'],
  b2: ['C5e D5e C5q B4q |', 'C:2 G:1 |'],
  b3: ['A4e B4e A4q G4q |', 'F:1 C:2 |'],
  b4: ['E4h E4e G4e |', 'C:3 |'],
  b6: ['C5e D5e E5q E5q |', 'C:3 |'],
  b7: ['E5e D5e C5q D5q |', 'Am:1 F:1 G:1 |'],
  b8m: ['C5h G5e E5e |', 'C:3 |'],
  b9: ['D5q. C5e D5q |', 'G:3 |'],
  b10: ['E5q G5q E5q |', 'C:3 |'],
  b11: ['D5q. C5e D5e E5e |', 'G:3 |'],
  b12: ['C5h G4e G4e |', 'C:3 |'],
  b13: ['A4q C5q B4q |', 'F:2 G:1 |'],
  b14: ['A4q G4q E4e G4e |', 'F:1 C:2 |'],
  b8x: ['C5h E4e G4e |', 'C:3 |'],
  b8f: ['C5h. |', 'C:3 |'],
};
const TH1 = 'b1 b2 b3 b4 b1 b2 b6 b7 b8m b9 b10 b11 b12 b13 b14 b1 b2 b3 b4 b1 b2 b6 b7';

const [marsMel, marsCh] = seq(MARS, 'O1 O1 O2 O1 B1 B2 B3 B4 O1 O2 O1 O2 B1 B2 B3 B4 O1 O2 O1 O2 O1 O2 C1 C2 C1 C2 B1 B2 B3 B4 C1 C2 C1 C2 END');
const [venMel, venCh] = seq(VENUS, 'V1 V2 V3 V1 V2 V3');
const [merMel, merCh] = seq(MERCURY, `${MM} ${MM} ${MT} ${MM} ${MT} ${MM} ${MT} ${MM} ${MM}`);
const [jupMel, jupCh] = seq(JUPITER, `${JB} ${JB} ${JB} END`);
const [satMel, satCh] = seq(SATURN, 'S1 S2 S1 S2 T1 T2 T3 S1 S2 BELL BELL BELL BELL T1 T3 END');
const [uraMel, uraCh] = seq(URANUS, `U1 U2 ${UD} ${UD} ${UE} ${UD} ${UE} U1 END`);
const [nepMel, nepCh] = seq(NEPTUNE, 'N1 N2 N1 N2 N1 N2 C1 C2 C3 C4 N1 N2 N1 N2 C1 C2 C3 C4 N1 N2 N1 N2 END');
const [thaxMel, thaxCh] = seq(THAX, `${TH1} b8x ${TH1} b8f`);

export const PLANETS: SongDef[] = [
  song({
    ...SUITE, id: 'mars', title: 'Mars', subtitle: 'the Bringer of War', year: '1914',
    blurb: 'Five beats to the bar, struck with the wood of the bow. Relentless.',
    bpm: 168, beatsPerBar: 5, tonic: pc('G'), lead: 'trumpet', keys: 'strings', keysStyle: 'rhythm',
    keysRhythm: [1 / 3, 1 / 3, 1 / 3, 1, 1, 0.5, 0.5, 1], bassStyle: 'quarters',
    melody: marsMel, chords: marsCh,
  }),
  song({
    ...SUITE, id: 'venus', title: 'Venus', subtitle: 'the Bringer of Peace',
    blurb: 'A horn calls, the flutes answer, and all is stillness. Hold every ribbon.',
    bpm: 60, beatsPerBar: 4, tonic: pc('Eb'), lead: 'flute', keysStyle: 'arpeggio',
    melody: venMel, chords: venCh,
  }),
  song({
    ...SUITE, id: 'mercury', title: 'Mercury', subtitle: 'the Winged Messenger',
    blurb: 'Two keys at once, darting like quicksilver. Blink and he is gone.',
    bpm: 150, beatsPerBar: 3, pulse: 1.5, tonic: pc('Bb'), lead: 'flute', keysStyle: 'waltz',
    melody: merMel, chords: merCh,
  }),
  song({
    ...SUITE, id: 'jupiter', title: 'Jupiter', subtitle: 'the Bringer of Jollity',
    blurb: 'Swirling strings and horns in high spirits: the whole orchestra on holiday.',
    bpm: 132, beatsPerBar: 2, tonic: pc('C'), lead: 'trumpet', keysStyle: 'stride', bassStyle: 'quarters', stringStyle: 'pulse', brass: 'trumpets',
    melody: jupMel, chords: jupCh,
  }),
  song({
    ...SUITE, id: 'saturn', title: 'Saturn', subtitle: 'the Bringer of Old Age',
    blurb: 'A clock ticks; a slow procession approaches; bells toll. Patience, soloist.',
    bpm: 66, beatsPerBar: 4, tonic: pc('C'), lead: 'organ', keys: 'organ', keysStyle: 'block',
    melody: satMel, chords: satCh,
  }),
  song({
    ...SUITE, id: 'uranus', title: 'Uranus', subtitle: 'the Magician',
    blurb: 'Four notes cast the spell (G, E-flat, A, B), then the bassoons begin to dance.',
    bpm: 150, beatsPerBar: 3, pulse: 1.5, tonic: pc('G'), lead: 'trumpet', keysStyle: 'waltz', bassStyle: 'quarters', brass: 'trumpets',
    melody: uraMel, chords: uraCh,
  }),
  song({
    ...SUITE, id: 'neptune', title: 'Neptune', subtitle: 'the Mystic',
    blurb: 'Harps and celesta shimmer in five-four, and distant voices fade into space.',
    bpm: 72, beatsPerBar: 5, tonic: pc('E'), lead: 'flute', keysStyle: 'arpeggio',
    melody: nepMel, chords: nepCh,
  }),
  song({
    ...SUITE, id: 'thaxted', title: 'Jupiter Theme', subtitle: 'Thaxted · “I Vow to Thee, My Country”', year: '1921',
    blurb: 'The great hymn at the heart of Jupiter. Broad, noble and full of ribbons.',
    bpm: 84, beatsPerBar: 3, pickup: 1, tonic: pc('C'), lead: 'violin', keys: 'organ', keysStyle: 'block', brass: 'horns',
    melody: 'E4e G4e | ' + thaxMel, chords: 'N:1 | ' + thaxCh,
  }),
];
