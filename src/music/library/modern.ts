import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

// ─── The Entertainer ───────────────────────────────────────────────────────
// 2/4 in semiquavers, after Joplin's A and B strains (played A A B B A).
// The last bar of each strain carries the upbeat of the next.

const RAG: Record<string, [string, string]> = {
  e1: ['E5s C6e E5s C6e E5s C6s |', 'C:1 C7:1 |'],
  e2: ['~C6q ~C6s C6s D6s D#6s |', 'F:1 C/E:1 |'],
  e3: ['E6s C6s D6s E6s ~E6s B5s D6e |', 'C:1 G7:1 |'],
  e4: ['C6q. D5s D#5s |', 'C:2 |'],
  e6: ['~C6q ~C6e A5s G5s |', 'F:1 C/E:1 |'],
  e7: ['F#5s A5s C6s E6s ~E6s D6s C6s A5s |', 'D7:2 |'],
  e8: ['D6q. D5s D#5s |', 'G:1 G7:1 |'],
  e12: ['C6q. C6s D6s |', 'C:2 |'],
  e13: ['E6s C6s D6s E6s ~E6s C6s D6s C6s |', 'C:1 C7:1 |'],
  e14: ['E6s C6s D6s E6s ~E6s C6s D6s C6s |', 'F:1 Fm:1 |'],
  e15: ['E6s C6s D6s E6s ~E6s B5s D6e |', 'C/G:1 G7:1 |'],
  toB: ['C6q r s E5s F5s F#5s |', 'C:2 |'],
  fin: ['C6q r q |', 'C:2 |'],
  f1: ['G5e A5s G5s ~G5s E5s F5s F#5s |', 'C:2 |'],
  f2: ['G5e A5s G5s ~G5s E5s C5s G4s |', 'C:1 C7:1 |'],
  f3: ['A4s B4s C5s D5s E5s D5s C5s D5s |', 'F:1 Fm:1 |'],
  f4: ['G4q ~G4s E5s F5s F#5s |', 'C:2 |'],
  f6: ['G5e A5s G5s ~G5s G5s A5s A#5s |', 'C:2 |'],
  f7: ['B5s B5e B5e A5s F#5s D5s |', 'D7:2 |'],
  f8: ['G5q ~G5s E6s F6s F#6s |', 'G:1 G7:1 |'],
  f9: ['G6e A6s G6s ~G6s E6s F6s F#6s |', 'C:2 |'],
  f10: ['G6e A6s G6s ~G6s E6s C6s G5s |', 'C:1 C7:1 |'],
  f11: ['A5s B5s C6s D6s E6s D6s C6s D6s |', 'F:1 Fm:1 |'],
  f12: ['C6q ~C6s G5s F#5s G5s |', 'C:1 C7:1 |'],
  f13: ['C6e A5s C6s ~C6s A5s C6s A5s |', 'F:1 F#dim7:1 |'],
  f14: ['G5s C6s E6s G6s ~G6s E6s C6s G5s |', 'C/G:1 Am:1 |'],
  f15: ['A5e C6e E6s D6s ~D6s C6s |', 'D7:1 G7:1 |'],
  f16: ['~C6q r s E5s F5s F#5s |', 'C:2 |'],
  toA: ['~C6q r e D5s D#5s |', 'C:2 |'],
};
const RA = 'e1 e2 e3 e4 e1 e6 e7 e8 e1 e2 e3 e12 e13 e14 e15';
const RB = 'f1 f2 f3 f4 f1 f6 f7 f8 f9 f10 f11 f12 f13 f14 f15';

// ─── Clair de lune ─────────────────────────────────────────────────────────
// 9/8 (4.5 crotchet beats), after the 1905 Fromont edition: the opening
// (bars 1–14), the Tempo rubato (15–18), Un poco mosso (27–34) and the
// closing phrase before the coda (62–64). The top voice is taken throughout.

const LUNE: Record<string, [string, string]> = {
  L1: ['r q Ab5e ~Ab5q. F5q. |', 'Db:4.5 |'],
  L2: ['~F5e Eb5e F5e Eb5h. |', 'Cdim7/Gb:4.5 |'],
  L3: ['~Eb5e Db5e Eb5e Db5e. F5q. Db5e. |', 'Bbm:4.5 |'],
  L4: ['~Db5e C5e Db5e C5h. |', 'Ebm7:4.5 |'],
  L5: ['~C5e Bb4e C5e Bb4e Eb5e Bb4e Ab4e Bb4e Ab4e |', 'Ebm7/Db:3 Ab7/C:1.5 |'],
  L6: ['~Ab4e Gb4e Ab4e Gb4q. F4q. |', 'Ebm/Bb:3 F7/A:1.5 |'],
  L7: ['~F4e F4e Gb4e F4e Bb4e F4e Eb4e F4e Eb4e |', 'Bbm7/Ab:3 Gb:1.5 |'],
  L8: ['~Eb4e Db4e Eb4e Db4q. C4q. |', 'Bbm7/F:3 Ab7:1.5 |'],
  L9: ['r q. Ab5q. F5q. |', 'Db:4.5 |'],
  L10: ['~F5e Eb5e F5e Eb5h. |', 'Gb:4.5 |'],
  L11: ['~Eb5e Db5e Eb5e Ab5q. F5q. |', 'Db/F:4.5 |'],
  L12: ['~F5e Eb5e F5e Eb5q. Db5q. |', 'Gb:4.5 |'],
  L13: ['~Db5e Db5e Eb5e Bb5e. Ab5q. F5e. |', 'Db7/Ab:4.5 |'],
  L14: ['F5e Eb5e F5e Eb5e. Db5q. Bb4e. |', 'Bbm7:4.5 |'],
  B15: ['r e. F5e. ~F5e Eb5e Eb5e Eb5e Db5e Db5e |', 'Ebm7:4.5 |'],
  B16: ['Db5e C5e C5e C5e. Db5e. Bb4q. |', 'Gb:4.5 |'],
  B17: ['r e. F5e. ~F5e Gb5e F5e Eb5e F5e Eb5e |', 'Ebm7:4.5 |'],
  B18: ['Db5e Eb5e Db5e C5e. Db5e. Bb4q. |', 'Gb:3 Ebm:1.5 |'],
  U27: ['Ab4h. Cb5q Db5e |', 'Db:1.5 Fm:1.5 Fb:1.5 |'],
  U28: ['Ab4h. Cb5q Ab4e |', 'Db:1.5 Fm:1.5 Fb:1.5 |'],
  U29: ['Db5q Eb5e F5q. Db5q F5e |', 'Db:4.5 |'],
  U30: ['G5e F5e Db5e Db5q. r q. |', 'Eb7:4.5 |'],
  U31: ['Bb4h. C5q F5e |', 'Ab7:1.5 Gb:1.5 Fm:1.5 |'],
  U33: ['Gb5q. ~Gb5e. F5e. D5e. Eb5e. |', 'Ebm:4.5 |'],
  U34: ['Bb5h. Ab5q. |', 'Daug:1.5 Ebm:1.5 Caug/Ab:1.5 |'],
  C62: ['r e Db4e Eb4e Bb4q. Ab4q. |', 'Db/F:4.5 |'],
  C63: ['r e Gb4e Ab4e Db5q. Bb4q. |', 'Ebm7:4.5 |'],
  C64: ['r e Bb4e C5e F5q. Ab4q. |', 'Ab7:4.5 |'],
  end: ['Db5h. r q. |', 'Db:4.5 |'],
};

const [ragMel, ragCh] = seq(RAG, `${RA} e4 ${RA} toB ${RB} f16 ${RB} toA ${RA} fin`);
const [luneMel, luneCh] = seq(LUNE, 'L1 L2 L3 L4 L5 L6 L7 L8 L9 L10 L11 L12 L13 L14 B15 B16 B17 B18 U27 U28 U29 U30 U31 U31 U33 U34 C62 C63 C64 end');

export const MODERN: SongDef[] = [
  song({
    id: 'entertainer', title: 'The Entertainer', subtitle: 'A Rag Time Two Step', composer: 'Scott Joplin', year: '1902', era: 'modern',
    blurb: 'Syncopation from a century not yet born. “Not fast,” warns the composer.',
    bpm: 84, beatsPerBar: 2, pickup: 0.5, tonic: pc('C'), lead: 'piano', keys: 'piano', keysStyle: 'stride', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: 'D5s D#5s | ' + ragMel, chords: 'N:0.5 | ' + ragCh,
  }),
  song({
    id: 'lune', title: 'Clair de lune', subtitle: 'Suite bergamasque, III', composer: 'Claude Debussy', year: '1905', era: 'modern',
    blurb: 'Moonlight on still water, in nine-eight time. Let every ribbon float.',
    bpm: 72, beatsPerBar: 4.5, pulse: 1.5, tonic: pc('Db'), lead: 'piano', keys: 'piano', keysStyle: 'arpeggio', brass: 'horns',
    melody: luneMel, chords: luneCh,
  }),
];
