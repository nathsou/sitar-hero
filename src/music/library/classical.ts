import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

// ─── Eine kleine Nachtmusik ────────────────────────────────────────────────

const NACHT: Record<string, [string, string]> = {
  N1: ['G4q r e D4e G4q r e D4e |', 'G:4 |'],
  N2: ['G4e D4e G4e B4e D5q r q |', 'G:4 |'],
  N3: ['C5q r e A4e C5q r e A4e |', 'D7:4 |'],
  N4: ['C5e A4e F#4e A4e D4q r q |', 'D7:4 |'],
  N5: ['G4q G4e. B4s A4e. G4s G4e. F#4s |', 'G:2 D7:2 |'],
  N6: ['F#4q A4e. C5s F#4e. A4s G4e. B4s |', 'D7:2 G:2 |'],
  N7: ['F#4e A4e C5e A4e G4e B4e D5e B4e |', 'D7:2 G:2 |'],
  N8: ['A4e C5e F#4e A4e G4q r q |', 'D7:2 G:2 |'],
  S1: ['D4s E4s F#4s G4s A4s B4s C#5s D5s E5s F#5s G5s A5s B5q |', 'D:4 |'],
  S2: ['A5q F#5q D5q A4q |', 'D:2 A7:2 |'],
  S3: ['G4s A4s B4s C5s D5s E5s F#5s G5s A5s B5s C6s D6s B5q |', 'G:4 |'],
  S4: ['D6q B5q G5q D5q |', 'G:2 D7:2 |'],
  END: ['G5q G4q G4h |', 'G:4 |'],
};
const NA = 'N1 N2 N3 N4 N5 N6 N7 N8';

// ─── Rondo alla Turca ──────────────────────────────────────────────────────

const RONDO: Record<string, [string, string]> = {
  r1: ['C5q D5s C5s B4s C5s |', 'Am:2 |'],
  r2: ['E5q F5s E5s D#5s E5s |', 'Am:2 |'],
  r3: ['B5s A5s G#5s A5s B5s A5s G#5s A5s |', 'Am:1 E:1 |'],
  r4: ['C6q A5e B5e |', 'Am:2 |'],
  r5: ['C6e B5e A5e G#5e |', 'Am:1 E:1 |'],
  r6: ['A5e E5e F5e D5e |', 'Am:1 Dm:1 |'],
  r7: ['C5q B4e. A4s |', 'Am:1 E:1 |'],
  r8a: ['A4q B4s A4s G#4s A4s |', 'Am:2 |'],
  r8b: ['A4q r q |', 'Am:2 |'],
  m1: ['C#5q A4q |', 'A:2 |'],
  m2: ['B4e C#5e D5e B4e |', 'E:2 |'],
  m5: ['C#5e E5e A5e E5e |', 'A:2 |'],
  m6: ['F#5e D5e B4e G#4e |', 'D:1 E:1 |'],
  m7: ['A4q E4q |', 'A:1 E:1 |'],
  m8: ['A4h |', 'A:2 |'],
  m8x: ['A4q B4s A4s G#4s A4s |', 'A:1 Am:1 |'],
  END: ['A4q A3q |', 'Am:2 |'],
};
const RA = 'r1 r2 r3 r4 r5 r6 r7';
const RM = 'm1 m2 m1 m2 m5 m6 m7';

// ─── Moonlight Sonata ──────────────────────────────────────────────────────

const trip = (n: string, times = 1) => Array.from({ length: times }, () => n.split(' ').map((x) => `${x}e3`).join(' ')).join(' ');
const MOON: Record<string, [string, string]> = {
  i1: [`${trip('G#3 C#4 E4', 4)} |`, 'C#m:4 |'],
  i2: [`${trip('G#3 C#4 E4', 4)} |`, 'C#m/B:4 |'],
  i3: [`${trip('A3 C#4 E4', 2)} ${trip('A3 D4 F#4', 2)} |`, 'A:2 D/F#:2 |'],
  i4: [`${trip('G#3 C4 F#4')} ${trip('G#3 C#4 E4')} ${trip('G#3 C#4 D#4')} ${trip('F#3 C4 D#4')} |`, 'G#7:1 C#m/G#:1 G#7:2 |'],
  m5: ['r h. G#4e. G#4s |', 'C#m:4 |'],
  m6: ['G#4h. G#4e. G#4s |', 'C#m:4 |'],
  m7: ['G#4h A4h |', 'A:2 D:2 |'],
  m8: ['G#4h F#4h |', 'G#7:4 |'],
  m9: ['E4h. G#4e. G#4s |', 'C#m:4 |'],
  m11: ['G#4h A4h |', 'A:2 F#m:2 |'],
  m13: ['E4h. r q |', 'C#m:4 |'],
  e1: ['r h. B4e. B4s |', 'E:4 |'],
  e2: ['B4h. B4e. B4s |', 'E:2 B7:2 |'],
  e3: ['B4h C#5h |', 'E:2 A:2 |'],
  e4: ['B4h A4h |', 'E:2 B7:2 |'],
  e5: ['G#4w |', 'E:4 |'],
  e6: ['F#4h. D#4e. D#4s |', 'B7:4 |'],
  e7: ['E4w |', 'G#7:4 |'],
  END: ['C#4w |', 'C#m:4 |'],
};

// ─── Symphony No. 5 ────────────────────────────────────────────────────────

const FIFTH: Record<string, [string, string]> = {
  F1: ['r e G4e G4e G4e |', 'Cm:2 |'],
  F2: ['Eb4h |', 'Cm:2 |'],
  F3: ['~Eb4h |', 'Cm:2 |'],
  F4: ['r e F4e F4e F4e |', 'G7:2 |'],
  F5: ['D4h |', 'G7:2 |'],
  F6: ['~D4h |', 'G7:2 |'],
  Q1: ['r e G4e G4e G4e | Eb4e Ab4e Ab4e Ab4e | G4e Eb5e Eb5e Eb5e | C5q r q |', 'Cm:2 | Ab:2 | Cm:2 | Cm:2 |'],
  Q2: ['r e G4e G4e G4e | D4e Ab4e Ab4e Ab4e | G4e F5e F5e F5e | D5q r q |', 'G7:2 | G7:2 | G7:2 | G7:2 |'],
  Q3: ['r e G5e G5e G5e | Eb5e C5e C5e C5e | D5e Bb4e Bb4e Bb4e | C5e Ab4e Ab4e Ab4e |', 'Cm:2 | Cm:2 | Bb:2 | Ab:2 |'],
  Q4: ['G4e Eb4e Eb4e Eb4e | F4e D4e D4e D4e | Eb4q r q | G4q r q |', 'Cm:2 | G7:2 | Cm:2 | Cm:2 |'],
  H1: ['r e Bb4e Bb4e Bb4e | Eb5h | F5h | Bb4h |', 'Bb:2 | Eb:2 | Bb:2 | Eb:2 |'],
  S1: [
    'r e Bb4e Bb4e Bb4e | Eb5q. D5e | C5q Bb4q | Ab4q. G4e | F4q Eb4q | G4q. Ab4e | Bb4q Eb5q | D5h |',
    'Bb:2 | Eb:2 | Ab:2 | Ab:2 | Bb7:2 | Eb:2 | Eb:2 | Bb:2 |',
  ],
  C1: [
    'G4e G4e G4e Eb4e | F4e F4e F4e D4e | G4e G4e G4e Eb4e | F4e F4e F4e D4e | C5e C5e C5e G4e | Ab4e Ab4e Ab4e F4e | G4q G4q | G4h |',
    'Cm:2 | G7:2 | Cm:2 | G7:2 | Cm:2 | Fm:2 | Cm:2 | Cm:2 |',
  ],
  END: ['C5q r q | C4q r q | C5h |', 'Cm:2 | Cm:2 | Cm:2 |'],
};

// ─── Für Elise ─────────────────────────────────────────────────────────────

const ELISE: Record<string, [string, string]> = {
  a1: ['E5s D#5s E5s B4s D5s C5s |', 'N:1.5 |'],
  a2: ['A4e r s C4s E4s A4s |', 'Am:1.5 |'],
  a3: ['B4e r s E4s G#4s B4s |', 'E:1.5 |'],
  a4: ['C5e r s E4s E5s D#5s |', 'Am:1.5 |'],
  a7: ['B4e r s E4s C5s B4s |', 'E:1.5 |'],
  a8a: ['A4e r e E5s D#5s |', 'Am:1.5 |'],
  a8b: ['A4e r s B4s C5s D5s |', 'Am:1.5 |'],
  a8f: ['A4q. |', 'Am:1.5 |'],
  b1: ['E5e. G4s F5s E5s |', 'C:1.5 |'],
  b2: ['D5e. F4s E5s D5s |', 'G:1.5 |'],
  b3: ['C5e. E4s D5s C5s |', 'Am:1.5 |'],
  b4: ['B4e r s E4s E5s r s |', 'E:1.5 |'],
  b5: ['r s E5s E6s r s r s D#5s |', 'E:1.5 |'],
  b6: ['E5s r s r s D#5s E5s D#5s |', 'E:1.5 |'],
};
const EA = 'a1 a2 a3 a4 a1 a2 a7';
const EB = 'b1 b2 b3 b4 b5 b6';

// ─── Ode to Joy ────────────────────────────────────────────────────────────

const ODE_LOW = `
  F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | F#4q. E4e E4h |
  F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | E4q. D4e D4h |
  E4q E4q F#4q D4q | E4q F#4e G4e F#4q D4q | E4q F#4e G4e F#4q E4q | D4q E4q A3h |
  F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | E4q. D4e D4h |`;
const ODE_CH = `
  D:4 | D:2 A:2 | D:4 | D:2 A:2 | D:4 | D:2 A:2 | D:4 | A:2 D:2 |
  A:2 D:2 | A:2 D:2 | A:2 D:2 | D:2 A:2 | D:4 | D:2 A:2 | D:4 | A:2 D:2 |`;
const ODE_HIGH = ODE_LOW.replace(/([A-G]#?)(\d)/g, (_, n: string, o: string) => `${n}${Number(o) + 1}`);

const [nachtMel, nachtCh] = seq(NACHT, `${NA} ${NA} S1 S2 S3 S4 ${NA} S1 S2 S3 S4 N1 N2 N3 N4 N8 END`);
const [rondoMel, rondoCh] = seq(
  RONDO,
  `${RA} r8a ${RA} r8b ${RM} m8 ${RM} m8x ${RA} r8a ${RA} r8b ${RM} m8 ${RM} m8x ${RA} r8a ${RA} END`,
);
const [moonMel, moonCh] = seq(MOON, 'i1 i2 i3 i4 m5 m6 m7 m8 m9 m6 m11 m8 m13 e1 e2 e3 e4 e5 e6 e7 m5 m6 m7 m8 m13 END');
const [fifthMel, fifthCh] = seq(
  FIFTH,
  'F1 F2 F3 F4 F5 F6 F6 Q1 Q2 Q3 Q4 H1 S1 C1 F1 F2 F3 F4 F5 F6 F6 Q1 Q2 Q3 Q4 H1 S1 C1 C1 END',
);
const [eliseMel, eliseCh] = seq(ELISE, `${EA} a8a ${EA} a8b ${EB} ${EA} a8a ${EA} a8b ${EB} ${EA} a8f`);

export const CLASSICAL: SongDef[] = [
  song({
    id: 'turca', title: 'Rondo alla Turca', subtitle: 'Piano Sonata No. 11, III', composer: 'Wolfgang Amadeus Mozart', year: '1783', era: 'classical',
    blurb: 'A Janissary band marches through a Viennese salon. Nimble fingers required.',
    bpm: 126, beatsPerBar: 2, pickup: 1, tonic: pc('A'), lead: 'piano', keys: 'piano', keysStyle: 'stride', bassStyle: 'quarters',
    melody: 'B4s A4s G#4s A4s | ' + rondoMel, chords: 'N:1 | ' + rondoCh,
  }),
  song({
    id: 'nachtmusik', title: 'Eine kleine Nachtmusik', subtitle: 'Serenade No. 13, I. Allegro', composer: 'Wolfgang Amadeus Mozart', year: '1787', era: 'classical',
    blurb: 'A little night music for strings, all rockets and good manners.',
    bpm: 132, beatsPerBar: 4, tonic: pc('G'), lead: 'violin', keys: 'strings', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: nachtMel, chords: nachtCh,
  }),
  song({
    id: 'moonlight', title: 'Moonlight Sonata', subtitle: 'Piano Sonata No. 14, I. Adagio sostenuto', composer: 'Ludwig van Beethoven', year: '1801', era: 'classical',
    blurb: 'Endless triplets under a pale, patient melody. Breathe with the ribbons.',
    bpm: 56, beatsPerBar: 4, tonic: pc('C#'), lead: 'piano', keys: 'piano', keysStyle: 'triplets', keysFrom: 16,
    melody: moonMel, chords: moonCh,
  }),
  song({
    id: 'fifth', title: 'Symphony No. 5', subtitle: 'I. Allegro con brio', composer: 'Ludwig van Beethoven', year: '1808', era: 'classical',
    blurb: 'Fate knocks at the door. Four times. Then it will not stop knocking.',
    bpm: 184, beatsPerBar: 2, tonic: pc('C'), lead: 'violin', keys: 'strings', brass: 'horns', stringStyle: 'pulse', bassStyle: 'quarters',
    melody: fifthMel, chords: fifthCh,
  }),
  song({
    id: 'elise', title: 'Für Elise', subtitle: 'Bagatelle No. 25 in A minor', composer: 'Ludwig van Beethoven', year: '1810', era: 'classical',
    blurb: 'Every pupil’s first love. Mind the little rests between the phrases.',
    bpm: 64, beatsPerBar: 1.5, pulse: 0.5, pickup: 0.5, tonic: pc('A'), lead: 'piano', keys: 'piano', keysStyle: 'arpeggio',
    melody: 'E5s D#5s | ' + eliseMel, chords: 'N:0.5 | ' + eliseCh,
  }),
  song({
    id: 'ode', title: 'Ode to Joy', subtitle: 'Symphony No. 9, IV', composer: 'Ludwig van Beethoven', year: '1824', era: 'classical',
    blurb: 'All men become brothers, and the melody is almost all stepwise. A gentle beginning.',
    bpm: 120, beatsPerBar: 4, tonic: pc('D'), lead: 'violin', keys: 'strings', brass: 'horns', bassStyle: 'quarters',
    melody: [ODE_LOW, ODE_HIGH, ODE_LOW].join(' '), chords: [ODE_CH, ODE_CH, ODE_CH].join(' '),
  }),
];
