import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

const SUITE = { era: 'planets', composer: 'Gustav Holst', year: '1916', keys: 'harp', brass: 'horns' } as const;

// These follow the openings of Holst's score (checked against published excerpts).
// The atmospheric movements have little tune to speak of, so their charts stay
// close to the ostinati and motifs that make them recognisable.

// ─── Mars, the Bringer of War (5/4) ────────────────────────────────────────
// A col legno ostinato on G beneath a slow theme: G, then D, then the D-flat
// a tritone from the pedal that gives the movement its menace.

const MARS: Record<string, [string, string]> = {
  O: ['G4e3 G4e3 G4e3 G4q G4q G4e G4e G4q |', 'G5:5 |'],
  OL: ['G3e3 G3e3 G3e3 G3q G3q G3e G3e G3q |', 'G5:5 |'],
  T1: ['G4w ~G4q |', 'G5:5 |'],
  T2: ['G4h. D5h |', 'G5:3 G.D:2 |'],
  T3: ['Db5w ~Db5q |', 'G.Db:5 |'],
  T4: ['Db5h. r h |', 'G.Db:5 |'],
  U1: ['G5w ~G5q |', 'G5:5 |'],
  U2: ['G5h. D6h |', 'G5:3 G.D:2 |'],
  U3: ['Db6w ~Db6q |', 'G.Db:5 |'],
  U4: ['Db6h. r h |', 'G.Db:5 |'],
  END: ['G4e3 G4e3 G4e3 G4q r h. |', 'G5:5 |'],
};

// ─── Venus, the Bringer of Peace ───────────────────────────────────────────
// The unaccompanied horn call (F G A-flat | B-flat), answered by flutes and oboes.

const VENUS: Record<string, [string, string]> = {
  H1: ['F4h G4q Ab4q |', 'N:4 |'],
  H2: ['Bb4w |', 'N:4 |'],
  H3: ['F4h G4q Ab4q |', 'Eb:4 |'],
  H4: ['Bb4q. r e r h |', 'Eb:4 |'],
  F1: ['F5h G5q Ab5q |', 'Ab:4 |'],
  F2: ['Bb5w |', 'Eb:4 |'],
  F3: ['F5h G5q Ab5q |', 'Fm:4 |'],
  F4: ['Bb5q. r e r h |', 'Eb:4 |'],
  END: ['Eb5w | ~Eb5w |', 'Eb:4 | Eb:4 |'],
};

// ─── Mercury, the Winged Messenger (6/8) ───────────────────────────────────
// Flickering arpeggios that set B-flat major against E major, a tritone apart.

const MERCURY: Record<string, [string, string]> = {
  A: ['Bb4e D5e F5e Bb5e F5e D5e |', 'Bb:3 |'],
  B: ['E5e G#5e B5e E6e B5e G#5e |', 'E:3 |'],
  C: ['Bb5e F5e D5e Bb4e D5e F5e |', 'Bb:3 |'],
  D: ['E6e B5e G#5e E5e G#5e B5e |', 'E:3 |'],
  AB: ['Bb4e D5e F5e E5e G#5e B5e |', 'Bb:1.5 E:1.5 |'],
  END: ['Bb5q. r q. |', 'Bb:3 |'],
};
const MM = 'A B A B C D C D';

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
// Flutes and harps tick like a clock between two chords, B over F and A over
// E-flat, syncopated across the bar.

const SATURN: Record<string, [string, string]> = {
  S1: ['r q B4h A4q |', 'F.B:3 Eb.A:1 |'],
  S2: ['~A4q B4h A4q |', 'Eb.A:1 F.B:2 Eb.A:1 |'],
  L1: ['~A4q B3h A3q |', 'Eb.A:1 F.B:2 Eb.A:1 |'],
  L2: ['~A3q B3h A3q |', 'Eb.A:1 F.B:2 Eb.A:1 |'],
  END: ['~A4q r h. |', 'Eb.A:1 N:3 |'],
};

// ─── Uranus, the Magician (6/8) ────────────────────────────────────────────
// The spell: G, E-flat, A, B, each held under a fermata.

const URANUS: Record<string, [string, string]> = {
  G: ['G4h. | ~G4h. |', 'G:3 | G:3 |'],
  Eb: ['Eb4h. | ~Eb4h. |', 'Eb:3 | Eb:3 |'],
  A: ['A4h. | ~A4h. |', 'A:3 | A:3 |'],
  B: ['B3h. | ~B3h. |', 'B:3 | B:3 |'],
  g: ['G4q. Eb4q. |', 'G:1.5 Eb:1.5 |'],
  a: ['A4q. B3q. |', 'A:1.5 B:1.5 |'],
  g2: ['G5q. Eb5q. |', 'G:1.5 Eb:1.5 |'],
  a2: ['A5q. B4q. |', 'A:1.5 B:1.5 |'],
  END: ['G4h. | ~G4h. |', 'G:3 | G:3 |'],
};

// ─── Neptune, the Mystic (5/4) ─────────────────────────────────────────────
// Flutes sway between E minor and G-sharp minor; piccolo and oboes answer.

const NEPTUNE: Record<string, [string, string]> = {
  N1: ['G4q E4q G4e E4e D#4e G#4e B4e G#4e |', 'Em:3 G#m:2 |'],
  N2: ['G4q E4q G4e E4e D#4s G#4s B4s D#5s G#5e r e |', 'Em:3 G#m:2 |'],
  N3: ['r q G#4h ~G#4h |', 'G#m:5 |'],
  N4: ['E5q C5q E5q D#5h |', 'C:3 G#m:2 |'],
  END: ['E5w ~E5q | ~E5w ~E5q |', 'Em:5 | Em:5 |'],
};

// ─── Thaxted (Jupiter's great hymn) ────────────────────────────────────────

const THAX: Record<string, [string, string]> = {
  a1: ['A4q. C5e B4e. G4s |', 'F:1.5 G:1.5 |'],
  a2: ['C5e D5e C5q B4q |', 'C:2 G:1 |'],
  a3: ['A4e B4e A4q G4q |', 'F:1 C:2 |'],
  a4: ['E4h E4e G4e |', 'C:3 |'],
  a6: ['C5e D5e E5q E5q |', 'C:3 |'],
  a7: ['E5e D5e C5q D5q |', 'Am:1 F:1 G:1 |'],
  a8: ['C5h G5e E5e |', 'C:3 |'],
  b1: ['D5h C5e E5e |', 'G:2 C:1 |'],
  b2: ['D5q G4q G5e E5e |', 'G:2 C:1 |'],
  b3: ['D5h E5e G5e |', 'G:2 C:1 |'],
  b4: ['A5h A5e B5e |', 'F:2 G:1 |'],
  b5: ['C6q B5q A5q |', 'Am:1 G:1 F:1 |'],
  b6: ['G5q C6q E5q |', 'C:2 Am:1 |'],
  b7: ['D5e C5e D5q E5q |', 'G:3 |'],
  b8: ['G5h E4e G4e |', 'C:3 |'],
  a8x: ['C5h E4e G4e |', 'C:3 |'],
  a8f: ['C5h. |', 'C:3 |'],
};
// A · A′ · B · A · A′, as in the hymn: “I vow to thee … the service of my love; /
// the love that asks no question … the dearest and the best; / the love that never falters …”
const TB = 'b1 b2 b3 b4 b5 b6 b7 b8';

const [marsMel, marsCh] = seq(MARS, 'O O O O T1 T2 T3 T4 O O O O U1 U2 U3 U4 OL OL O O T1 T2 T3 T4 O O O O U1 U2 U3 U4 O O END');
const [venMel, venCh] = seq(VENUS, 'H1 H2 H3 H4 F1 F2 F3 F4 H1 H2 H3 H4 F1 F2 F3 F4 END');
const [merMel, merCh] = seq(MERCURY, `${MM} ${MM} AB AB AB AB ${MM} AB AB AB AB ${MM} ${MM} END`);
const [jupMel, jupCh] = seq(JUPITER, `${JB} ${JB} ${JB} END`);
const [satMel, satCh] = seq(SATURN, 'S1 S2 S2 S2 S2 S2 L1 L2 L2 L2 S1 S2 S2 S2 END');
const [uraMel, uraCh] = seq(URANUS, 'G Eb A B g a g a g2 a2 g2 a2 G Eb A B g a g a g2 a2 g2 a2 G Eb A B END');
const [nepMel, nepCh] = seq(NEPTUNE, 'N1 N2 N3 N4 N1 N2 N3 N4 N1 N2 N3 N4 END');
const TA = 'a1 a2 a3 a4 a1 a6 a7';
const [thaxMel, thaxCh] = seq(THAX, `${TA} a8 ${TB} ${TA} a8x ${TA} a8 ${TB} ${TA} a8f`);

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
    blurb: 'A lone horn rises four notes; flutes and oboes answer. Hold every ribbon.',
    bpm: 60, beatsPerBar: 4, tonic: pc('Eb'), lead: 'flute', keysStyle: 'block', keys: 'strings',
    melody: venMel, chords: venCh,
  }),
  song({
    ...SUITE, id: 'mercury', title: 'Mercury', subtitle: 'the Winged Messenger',
    blurb: 'B-flat major and E major, a tritone apart, flicker past like quicksilver.',
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
    blurb: 'Two chords tick like an old clock, slower than a heartbeat. Patience, soloist.',
    bpm: 56, beatsPerBar: 4, tonic: pc('A'), lead: 'organ', keys: 'organ', keysStyle: 'block',
    melody: satMel, chords: satCh,
  }),
  song({
    ...SUITE, id: 'uranus', title: 'Uranus', subtitle: 'the Magician',
    blurb: 'Four notes cast the spell: G, E-flat, A, B. The brass intone it; the orchestra takes it up.',
    bpm: 120, beatsPerBar: 3, pulse: 1.5, tonic: pc('G'), lead: 'trumpet', keysStyle: 'block', bassStyle: 'quarters', brass: 'trumpets',
    melody: uraMel, chords: uraCh,
  }),
  song({
    ...SUITE, id: 'neptune', title: 'Neptune', subtitle: 'the Mystic',
    blurb: 'Flutes sway between E minor and G-sharp minor in five-four, and the hall fades into space.',
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
