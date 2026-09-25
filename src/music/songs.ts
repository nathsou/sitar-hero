import { BAROQUE } from './library/baroque';
import { CLASSICAL } from './library/classical';
import { MODERN } from './library/modern';
import { PLANETS } from './library/planets';
import { ROMANTIC } from './library/romantic';
import type { Era, SongDef } from './types';

export type { SongDef } from './types';

/** The programme, in concert order. Imported scores are appended at runtime. */
export const SONGS: SongDef[] = [...BAROQUE, ...CLASSICAL, ...ROMANTIC, ...MODERN, ...PLANETS];

export const ERAS: { id: Era; title: string; note: string }[] = [
  { id: 'baroque', title: 'Of Our Own Age', note: 'The Baroque, 1700–1740' },
  { id: 'classical', title: 'Prophecies of the Classical Age', note: 'procured by the Count’s astrologer' },
  { id: 'romantic', title: 'Visions of the Romantic Century', note: 'from a future of waltzes and storms' },
  { id: 'modern', title: 'Dreams of a Distant Epoch', note: 'rag time and moonlight' },
  { id: 'planets', title: 'The Astrologer’s Suite: The Planets', note: 'Gustav Holst, 1914–1921' },
  { id: 'imported', title: 'Scores Brought from Abroad', note: 'imported from MIDI files' },
];
