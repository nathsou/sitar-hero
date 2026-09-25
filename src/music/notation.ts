import { noteToMidi, parseChord, type Chord } from './theory';

/**
 * A tiny score notation, one token per note:
 *
 *   D5q   quarter-note D5          F#4e.  dotted eighth F#4
 *   Bb3h  half-note B-flat 3       re     eighth rest (also "r e")
 *   ~D5q  tie: extend the previous note by a quarter
 *   A4e3  triplet eighth (2/3 length)
 *
 * Durations: w=4 h=2 q=1 e=½ s=¼ t=⅛ beats. "|" marks bar lines and is
 * used only to validate that every bar adds up to the meter.
 */

export interface NoteEvent {
  beat: number;
  dur: number; // beats
  midi: number;
  /** Loudness 0–1, when the source records it (MIDI files do; notation does not). */
  vel?: number;
}

export interface ChordEvent {
  beat: number;
  dur: number;
  chord: Chord | null;
}

const DURATIONS: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 0.125 };
const TOKEN = /^(~)?([A-G][#b]?-?\d|r)([whqest])(\.)?(3)?$/;

export interface ParseOptions {
  beatsPerBar: number;
  /** Length of the anacrusis before the first bar line, in beats. */
  pickup?: number;
  label: string;
}

export function parseMelody(src: string, opts: ParseOptions): NoteEvent[] {
  const notes: NoteEvent[] = [];
  let beat = 0;
  let barStart = 0;
  let barIndex = 0;

  for (const token of tokenize(src)) {
    if (token === '|') {
      checkBar(beat - barStart, barIndex, opts);
      barStart = beat;
      barIndex++;
      continue;
    }
    const m = TOKEN.exec(token);
    if (!m) throw new Error(`[${opts.label}] bad token "${token}"`);
    let dur = DURATIONS[m[3]];
    if (m[4]) dur *= 1.5;
    if (m[5]) dur *= 2 / 3;

    if (m[1]) {
      const last = notes[notes.length - 1];
      if (!last) throw new Error(`[${opts.label}] tie with nothing before it`);
      last.dur += dur;
    } else if (m[2] !== 'r') {
      notes.push({ beat, dur, midi: noteToMidi(m[2]) });
    }
    beat += dur;
  }
  if (beat - barStart > 1e-6) checkBar(beat - barStart, barIndex, opts);
  return notes;
}

/** Split into tokens, joining a spaced rest ("r q.") into one token ("rq."). */
function tokenize(src: string): string[] {
  return src.trim().replace(/(^|\s)r\s+([whqest]\.?3?)(?=\s|$)/g, '$1r$2').split(/\s+/);
}

export function parseChords(src: string, opts: ParseOptions): ChordEvent[] {
  const events: ChordEvent[] = [];
  let beat = 0;
  let barStart = 0;
  let barIndex = 0;
  for (const token of src.trim().split(/\s+/)) {
    if (token === '|') {
      checkBar(beat - barStart, barIndex, opts);
      barStart = beat;
      barIndex++;
      continue;
    }
    const [symbol, len] = token.split(':');
    const dur = Number(len);
    if (!symbol || !Number.isFinite(dur)) throw new Error(`[${opts.label}] bad chord token "${token}"`);
    events.push({ beat, dur, chord: parseChord(symbol) });
    beat += dur;
  }
  return events;
}

function checkBar(length: number, index: number, opts: ParseOptions) {
  const expected = index === 0 && opts.pickup ? opts.pickup : opts.beatsPerBar;
  if (Math.abs(length - expected) > 1e-6 && import.meta.env.DEV) {
    console.warn(`[${opts.label}] bar ${index} has ${length} beats, expected ${expected}`);
  }
}

/** Total length in beats of a parsed stream. */
export function streamLength(events: { beat: number; dur: number }[]): number {
  return events.reduce((end, e) => Math.max(end, e.beat + e.dur), 0);
}
