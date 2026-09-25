import type { ChordEvent, NoteEvent } from './notation';
import type { TempoMap } from './tempo';

/** Instruments that can play the solo line. */
export type LeadKind = 'sitar' | 'harpsichord' | 'piano' | 'grand' | 'violin' | 'guitar' | 'organ' | 'flute' | 'trumpet';
/** The instrument that accompanies from the start (tier 0). */
export type KeysKind = 'harpsichord' | 'piano' | 'grand' | 'organ' | 'harp' | 'strings';
/** How that accompaniment is figured. */
export type KeysStyle = 'comp' | 'waltz' | 'stride' | 'alberti' | 'lento' | 'triplets' | 'arpeggio' | 'block' | 'bass' | 'rhythm' | 'explicit';
export type BassStyle = 'held' | 'quarters' | 'eighths' | 'explicit';
export type StringStyle = 'pad' | 'pulse';
export type Era = 'baroque' | 'classical' | 'romantic' | 'modern' | 'planets' | 'imported';

export const LEAD_NAMES: Record<LeadKind, string> = {
  sitar: 'Sitar',
  harpsichord: 'Harpsichord',
  piano: 'Pianoforte',
  grand: 'Grand piano',
  violin: 'Violin',
  guitar: 'Guitar',
  organ: 'Organ',
  flute: 'Flute',
  trumpet: 'Trumpet',
};

export const KEYS_NAMES: Record<KeysKind, string> = {
  harpsichord: 'Harpsichord',
  piano: 'Pianoforte',
  grand: 'Grand piano',
  organ: 'Organ',
  harp: 'Harp',
  strings: 'Violas',
};

export interface SongDef {
  id: string;
  title: string;
  subtitle: string;
  composer: string;
  year: string;
  blurb: string;
  era: Era;
  bpm: number;
  /** Tempo at the very end, for pieces that accelerate. */
  accel?: number;
  /** Bar length in quarter-note beats (3/8 = 1.5, 6/8 = 3, 12/8 = 6). */
  beatsPerBar: number;
  /** The felt pulse in quarter-note beats (1.5 for compound metres). */
  pulse: number;
  pickup: number;
  /** Pitch class of the tonic (timpani and trumpets are tuned to it). */
  tonic: number;
  melody: string;
  chords: string;
  bass?: string;
  bassStyle: BassStyle;
  stringStyle: StringStyle;
  keys: KeysKind;
  keysStyle: KeysStyle;
  /** Onset rhythm for keysStyle "rhythm", in beats, repeated each bar. */
  keysRhythm?: number[];
  /** Beat at which the accompaniment starts (when the soloist plays the opening alone). */
  keysFrom?: number;
  lead: LeadKind;
  brass: 'trumpets' | 'horns';
  /**
   * Who joins as the streak grows. "orchestra": cello, strings, timpani, brass.
   * "piano": solo piano music; no one joins, but the pianist plays with more pedal,
   * tone and resonance as the streak grows.
   */
  ensemble: 'orchestra' | 'piano';
}

/** A parsed score, independent of where it came from (notation or MIDI). */
export interface Score {
  melody: NoteEvent[];
  chords: ChordEvent[];
  bass: NoteEvent[];
  /** Explicit accompaniment notes (from MIDI), played by the keys layer. */
  keysNotes?: (NoteEvent & { vel: number })[];
  tempo: TempoMap;
  totalBeats: number;
}

type RequiredKeys = 'id' | 'title' | 'composer' | 'year' | 'era' | 'bpm' | 'beatsPerBar' | 'tonic' | 'melody' | 'chords';

export function song(d: Pick<SongDef, RequiredKeys> & Partial<SongDef>): SongDef {
  return {
    subtitle: '',
    blurb: '',
    pulse: 1,
    pickup: 0,
    bassStyle: 'held',
    stringStyle: 'pad',
    keys: 'harpsichord',
    keysStyle: 'comp',
    lead: 'sitar',
    brass: 'trumpets',
    ensemble: 'orchestra',
    ...d,
  };
}

/** Repeat a notation fragment. */
export const rep = (s: string, n: number) => Array.from({ length: n }, () => s).join(' ');

/** Look up named bars ("A1 A2 A1") in a table of [melody, chords] pairs. */
export function seq(table: Record<string, [string, string]>, order: string): [string, string] {
  const keys = order.trim().split(/\s+/);
  for (const k of keys) if (!table[k]) throw new Error(`Unknown bar "${k}"`);
  return [keys.map((k) => table[k][0]).join(' '), keys.map((k) => table[k][1]).join(' ')];
}
