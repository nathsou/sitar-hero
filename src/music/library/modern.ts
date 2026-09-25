import { pitchClass as pc } from '../theory';
import { seq, song, type SongDef } from '../types';

// ─── The Entertainer ───────────────────────────────────────────────────────

const RAG: Record<string, [string, string]> = {
  e1: ['E5s C6e E5s C6e E5s C6s |', 'C:2 |'],
  e2: ['~C6q r s C6s D6s D#6s |', 'C:1 C7:1 |'],
  e3: ['E6s C6s D6s E6e B5s D6e |', 'C:1 G7:1 |'],
  e4: ['C6q. D5s D#5s |', 'C:2 |'],
  e7: ['A5s G5s F#5s A5s C6s E6e D6s |', 'D7:2 |'],
  e8: ['C6s A5s D6q. |', 'D7:1 G7:1 |'],
  e9: ['E6s C6s D6s E6e C6s D6s E6s |', 'C:2 |'],
  e10: ['~E6s C6s D6s C6s E6s C6s D6s E6s |', 'F:1 C:1 |'],
  e11: ['~E6s C6s D6s C6s E6s C6s D6s E6s |', 'G7:2 |'],
  e12: ['~E6s C6s D6s B5s C6q |', 'G7:1 C:1 |'],
};
const RA = 'e1 e2 e3 e4 e1 e2 e7 e8';
const RB = 'e1 e2 e3 e4 e9 e10 e11 e12';

// ─── Clair de lune ─────────────────────────────────────────────────────────

const LUNE: Record<string, [string, string]> = {
  c1: ['r e Ab5h. ~Ab5q |', 'Db:4.5 |'],
  c2: ['Gb5q. F5q Gb5e F5q. |', 'Ebm7:4.5 |'],
  c3: ['Eb5q. F5q Eb5e Db5q. |', 'Db:4.5 |'],
  c4: ['Eb5q. Db5q C5e Db5q. |', 'Bbm:4.5 |'],
  c5: ['C5q. Bb4h. |', 'Ab7:4.5 |'],
  m1: ['Ab4e Db5e F5e Ab5q. Gb5q. |', 'Db:4.5 |'],
  m2: ['F5e Eb5e Db5e Eb5q. Ab4q. |', 'Ab7:4.5 |'],
  m3: ['Bb4e Eb5e Gb5e Bb5q. Ab5q. |', 'Ebm:4.5 |'],
  m4: ['Gb5e F5e Eb5e F5q. Db5q. |', 'Db:4.5 |'],
  m5: ['Db5e F5e Ab5e Db6q. C6q. |', 'Dbmaj7:4.5 |'],
  m6: ['Bb5e Ab5e Gb5e F5q. Eb5q. |', 'Gbmaj7:4.5 |'],
  m7: ['Db5e Eb5e F5e Gb5q. Ab5q. |', 'Ebm7:4.5 |'],
  m8: ['Ab5h. ~Ab5q. |', 'Ab:4.5 |'],
  end: ['Db5h. ~Db5q. | ~Db5h. ~Db5q. |', 'Db:4.5 | Db:4.5 |'],
};
const LC = 'c1 c2 c3 c4 c5';
const LM = 'm1 m2 m3 m4 m5 m6 m7 m8';

const [ragMel, ragCh] = seq(RAG, `${RA} ${RB} ${RA} ${RB} ${RA} ${RB}`);
const [luneMel, luneCh] = seq(LUNE, `${LC} ${LC} ${LM} ${LM} ${LC} end`);

export const MODERN: SongDef[] = [
  song({
    id: 'entertainer', title: 'The Entertainer', subtitle: 'A Rag Time Two Step', composer: 'Scott Joplin', year: '1902', era: 'modern',
    blurb: 'Syncopation from a century not yet born. “Not fast,” warns the composer.',
    bpm: 76, beatsPerBar: 2, pickup: 0.5, tonic: pc('C'), lead: 'piano', keys: 'piano', keysStyle: 'stride', bassStyle: 'quarters', stringStyle: 'pulse',
    melody: 'D5s D#5s | ' + ragMel, chords: 'N:0.5 | ' + ragCh,
  }),
  song({
    id: 'lune', title: 'Clair de lune', subtitle: 'Suite bergamasque, III', composer: 'Claude Debussy', year: '1905', era: 'modern',
    blurb: 'Moonlight on still water, in nine-eight time. Let every ribbon float.',
    bpm: 72, beatsPerBar: 4.5, pulse: 1.5, tonic: pc('Db'), lead: 'piano', keys: 'piano', keysStyle: 'arpeggio', brass: 'horns',
    melody: luneMel, chords: luneCh,
  }),
];
