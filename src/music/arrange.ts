import { shapeMelody } from './expression';
import { parseChords, parseMelody, streamLength, type ChordEvent, type NoteEvent } from './notation';
import { TempoMap } from './tempo';
import { pcAtOrAbove, voiceChord, type Chord } from './theory';
import { KEYS_NAMES, type Score, type SongDef } from './types';

/** A sounding note in seconds. */
export interface TimedNote {
  time: number;
  dur: number;
  midi: number;
  vel: number;
}

export interface MelodyNote extends TimedNote {
  beat: number;
  beats: number;
}

export interface TimedChord {
  time: number;
  end: number;
  chord: Chord;
}

/** The orchestra enters in this order as the streak grows. */
export const LAYER_IDS = ['keys', 'bass', 'strings', 'timpani', 'brass'] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export function layerNames(def: SongDef): string[] {
  if (def.ensemble === 'piano') return [KEYS_NAMES[def.keys], ...PIANO_TIERS];
  return [KEYS_NAMES[def.keys], 'Violoncello', 'Strings', 'Timpani', def.brass === 'horns' ? 'Horns' : 'Trumpets'];
}

/**
 * Solo piano music adds no instruments; a streak lets the pianist play more
 * expressively instead (see Game.applyMix and scheduleLayers).
 */
export const PIANO_TIERS = ['Sustain pedal', 'Singing tone', 'Hall resonance', 'Full tone'];
const PIANO_MESSAGES = ['', 'The pedal goes down…', 'The melody begins to sing!', 'The hall rings with it!', 'Full tone! Bravissimo!'];

export function joinMessage(def: SongDef, tier: number): string {
  if (def.ensemble === 'piano') return PIANO_MESSAGES[tier];
  const name = layerNames(def)[tier];
  if (tier === 4) return `${name}! Grand Tutti!`;
  if (tier === 3) return 'The timpani thunder in!';
  return `The ${name.toLowerCase()} join${name.endsWith('s') ? '' : 's'}!`;
}

export interface CompiledSong {
  def: SongDef;
  tempo: TempoMap;
  melody: MelodyNote[];
  layers: Record<LayerId, TimedNote[]>;
  chords: TimedChord[];
  totalBeats: number;
  length: number;
}

/** Parse a notated song into a score (beats, not seconds). */
export function parseScore(def: SongDef): Score {
  const opts = { beatsPerBar: def.beatsPerBar, pickup: def.pickup, label: def.id };
  const melody = parseMelody(def.melody, opts);
  const chords = parseChords(def.chords, opts);
  const bass = def.bass ? parseMelody(def.bass, { ...opts, label: `${def.id}:bass` }) : [];
  const totalBeats = Math.max(streamLength(melody), streamLength(chords));
  // A melody may end on a rest; only a gap of a whole bar suggests a missing bar.
  if (import.meta.env.DEV && Math.abs(streamLength(melody) - streamLength(chords)) >= def.beatsPerBar) {
    console.warn(`[${def.id}] melody ${streamLength(melody)} beats vs chords ${streamLength(chords)}`);
  }
  const tempo = def.accel ? TempoMap.ramp(def.bpm, def.accel, totalBeats) : TempoMap.constant(def.bpm);
  return { melody, chords, bass, tempo, totalBeats };
}

export function compileSong(def: SongDef, speed = 1, score: Score = parseScore(def)): CompiledSong {
  const tempo = speed === 1 ? score.tempo : score.tempo.scaled(speed);
  const sec = (b: number) => tempo.toSec(b);
  const timed = (n: { beat: number; beats: number; midi: number; vel: number }): TimedNote => {
    const time = sec(n.beat);
    return { time, dur: sec(n.beat + n.beats) - time, midi: n.midi, vel: n.vel };
  };

  const vels = shapeMelody(score.melody, def.beatsPerBar, def.pickup ?? 0, def.pulse ?? 1);
  const melody: MelodyNote[] = score.melody.map((n, i) => ({
    ...timed({ beat: n.beat, beats: n.dur, midi: n.midi, vel: vels[i] }),
    beat: n.beat,
    beats: n.dur,
  }));

  const ctx: Ctx = { def, chords: score.chords, bass: score.bass, totalBeats: score.totalBeats, keysNotes: score.keysNotes };
  const build = (notes: BeatNote[]) => {
    const out = notes.map(timed);
    out.sort((a, b) => a.time - b.time);
    return out;
  };
  const from = def.keysFrom ?? -Infinity;
  const layers: Record<LayerId, TimedNote[]> = {
    keys: build(keys(ctx).filter((n) => n.beat >= from - 1e-6)),
    bass: build(bassLine(ctx)),
    strings: build(strings(ctx)),
    timpani: build(timpani(ctx)),
    brass: build(brass(ctx)),
  };

  const chords: TimedChord[] = [];
  for (const c of score.chords) if (c.chord) chords.push({ time: sec(c.beat), end: sec(c.beat + c.dur), chord: c.chord });

  return { def, tempo, melody, layers, chords, totalBeats: score.totalBeats, length: sec(score.totalBeats) };
}

/** The chord sounding at time t (binary search over sorted chords). */
export function chordAtTime(song: CompiledSong, t: number): Chord | null {
  const cs = song.chords;
  let lo = 0;
  let hi = cs.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cs[mid].end <= t) lo = mid + 1;
    else if (cs[mid].time > t) hi = mid - 1;
    else return cs[mid].chord;
  }
  return null;
}

// ─── Arrangement ──────────────────────────────────────────────────────────

interface BeatNote {
  beat: number;
  beats: number;
  midi: number;
  vel: number;
}

interface Ctx {
  def: SongDef;
  chords: ChordEvent[];
  bass: NoteEvent[];
  totalBeats: number;
  keysNotes?: (NoteEvent & { vel: number })[];
}

const EPS = 1e-6;
const note = (beat: number, beats: number, midi: number, vel: number): BeatNote => ({ beat, beats, midi, vel });

/** Every subdivision of every chord, with its position in the bar. */
function* grid(ctx: Ctx, step: number) {
  const { beatsPerBar: bpb, pickup } = ctx.def;
  for (const ev of ctx.chords) {
    if (!ev.chord) continue;
    for (let b = ev.beat; b < ev.beat + ev.dur - EPS; b += step) {
      const inBar = (((b - pickup) % bpb) + bpb) % bpb;
      yield { beat: b, inBar, chord: ev.chord, chordStart: Math.abs(b - ev.beat) < EPS, ev };
    }
  }
}

/** Subdivision for "eighth-note" figures: thirds of the pulse in compound time. */
const subdivision = (def: SongDef) => (def.pulse >= 1.5 ? def.pulse / 3 : def.pulse / 2);
const isOn = (x: number, unit: number) => Math.abs(x / unit - Math.round(x / unit)) < EPS;
const bassOf = (c: Chord, lo = 36) => pcAtOrAbove(c.bass, lo);

function keys(ctx: Ctx): BeatNote[] {
  const { def } = ctx;
  const out: BeatNote[] = [];
  const pulse = def.pulse;
  const pulsesPerBar = def.beatsPerBar / pulse;
  let voicing: number[] | null = null;
  const voice = (c: Chord, lo: number, hi: number) => (voicing = voiceChord(c, voicing, lo, hi));

  switch (def.keysStyle) {
    case 'explicit':
      for (const n of ctx.keysNotes ?? []) out.push(note(n.beat, n.dur, n.midi, n.vel * 0.55));
      break;

    case 'comp':
      for (const g of grid(ctx, pulse)) {
        const down = g.inBar < EPS;
        const idx = Math.round(g.inBar / pulse);
        voice(g.chord, 60, 79).forEach((m, i) => out.push(note(g.beat + i * 0.02, pulse * 0.9, m, down ? 0.5 : 0.32)));
        const lh = pulsesPerBar >= 4 ? idx % 2 === 0 : pulsesPerBar === 3 ? down : true;
        if (lh || g.chordStart) out.push(note(g.beat, pulse * (down && pulsesPerBar === 3 ? 2.8 : 1.8), bassOf(g.chord, 43), 0.55));
      }
      break;

    case 'waltz': {
      const unit = pulse >= 1.5 ? pulse / 3 : pulse;
      for (const g of grid(ctx, unit)) {
        const k = Math.round(g.inBar / unit);
        if (k % 3 === 0) out.push(note(g.beat, unit * 2.5, bassOf(g.chord, 38), 0.55));
        else voice(g.chord, 55, 72).forEach((m) => out.push(note(g.beat, unit * 0.85, m, 0.3)));
      }
      break;
    }

    case 'lento': {
      // Satie's Gymnopédies: a low bass note on the downbeat, one chord on the
      // second beat, both held (on the pedal) to the end of the bar.
      const bar = def.beatsPerBar;
      for (const g of grid(ctx, pulse)) {
        const k = Math.round(g.inBar / pulse);
        if (k === 0) out.push(note(g.beat, bar * 0.98, bassOf(g.chord, 38), 0.5));
        else if (k === 1) {
          // Seventh chords are voiced without the root (already in the bass), keeping the seventh.
          const c = g.chord.tones.length >= 4 ? { ...g.chord, tones: g.chord.tones.filter((t) => t !== g.chord.root) } : g.chord;
          voice(c, 54, 68).forEach((m) => out.push(note(g.beat, (bar - pulse) * 0.98, m, 0.3)));
        }
      }
      break;
    }

    case 'stride': {
      const unit = subdivision(def);
      for (const g of grid(ctx, unit)) {
        const k = Math.round(g.inBar / unit);
        if (k % 2 === 0) {
          const fifth = (k / 2) % 2 === 1;
          const root = bassOf(g.chord, 38);
          out.push(note(g.beat, unit * 0.9, fifth ? pcAtOrAbove(g.chord.tones[2] ?? g.chord.root, root - 12 + 5) : root, 0.55));
        } else {
          voice(g.chord, 55, 70).forEach((m) => out.push(note(g.beat, unit * 0.7, m, 0.33)));
        }
      }
      break;
    }

    case 'alberti': {
      const unit = subdivision(def);
      for (const g of grid(ctx, unit)) {
        const v = voice(g.chord, 48, 67);
        const k = Math.round(g.inBar / unit) % 4;
        out.push(note(g.beat, unit * 1.2, v[[0, 2, 1, 2][k]], k === 0 ? 0.45 : 0.32));
      }
      break;
    }

    case 'triplets': {
      const unit = 1 / 3;
      for (const g of grid(ctx, unit)) {
        const v = voice(g.chord, 52, 71);
        const k = Math.round(g.inBar / unit) % 3;
        out.push(note(g.beat, unit * 1.5, v[k], k === 0 ? 0.42 : 0.3));
        if (g.chordStart) out.push(note(g.beat, g.ev.dur * 0.98, bassOf(g.chord, 31), 0.5), note(g.beat, g.ev.dur * 0.98, bassOf(g.chord, 31) + 12, 0.35));
      }
      break;
    }

    case 'arpeggio': {
      const unit = pulse >= 1.5 ? 0.5 : pulse <= 0.5 ? 0.25 : 0.5;
      for (const g of grid(ctx, unit)) {
        const v = voice(g.chord, 55, 72);
        const pattern = [bassOf(g.chord, 40), v[0], v[1], v[2], v[0] + 12, v[2], v[1], v[0]];
        const k = Math.round(g.inBar / unit) % pattern.length;
        out.push(note(g.beat, unit * 2.2, pattern[k], k === 0 ? 0.45 : 0.3));
      }
      break;
    }

    case 'block':
      for (const ev of ctx.chords) {
        if (!ev.chord) continue;
        voice(ev.chord, 55, 72).forEach((m) => out.push(note(ev.beat, ev.dur * 0.97, m, 0.34)));
        out.push(note(ev.beat, ev.dur * 0.97, bassOf(ev.chord, 36), 0.4));
      }
      break;

    case 'bass':
      for (const ev of ctx.chords) if (ev.chord) out.push(note(ev.beat, ev.dur * 0.98, bassOf(ev.chord, 36), 0.45));
      break;

    case 'rhythm': {
      const rhythm = def.keysRhythm ?? [pulse];
      for (let bar = def.pickup; bar < ctx.totalBeats - EPS; bar += def.beatsPerBar) {
        let b = bar;
        for (const len of rhythm) {
          const c = chordAtBeat(ctx.chords, b);
          if (c) {
            const root = bassOf(c, 43);
            out.push(note(b, len * 0.8, root, 0.5), note(b, len * 0.8, root + 7, 0.35));
          }
          b += len;
        }
      }
      break;
    }
  }
  return out;
}

function chordAtBeat(chords: ChordEvent[], beat: number): Chord | null {
  for (const c of chords) if (beat >= c.beat - EPS && beat < c.beat + c.dur - EPS) return c.chord;
  return null;
}

function bassLine(ctx: Ctx): BeatNote[] {
  const out: BeatNote[] = [];
  const { def } = ctx;
  switch (def.bassStyle) {
    case 'explicit':
      for (const b of ctx.bass) out.push(note(b.beat, b.dur * 0.97, b.midi, 0.75));
      break;
    case 'held':
      for (const ev of ctx.chords) if (ev.chord) out.push(note(ev.beat, ev.dur * 0.97, bassOf(ev.chord), 0.75));
      break;
    case 'quarters': {
      let k = 0;
      for (const g of grid(ctx, def.pulse)) out.push(note(g.beat, def.pulse * 0.8, bassOf(g.chord) + (k++ % 2 ? 12 : 0), 0.7));
      break;
    }
    case 'eighths': {
      const unit = subdivision(def);
      for (const g of grid(ctx, unit)) out.push(note(g.beat, unit * 0.8, bassOf(g.chord), isOn(g.inBar, def.pulse) ? 0.75 : 0.5));
      break;
    }
  }
  return out;
}

function strings(ctx: Ctx): BeatNote[] {
  const out: BeatNote[] = [];
  let voicing: number[] | null = null;
  if (ctx.def.stringStyle === 'pad') {
    for (const ev of ctx.chords) {
      if (!ev.chord) continue;
      voicing = voiceChord(ev.chord, voicing, 55, 74);
      for (const m of voicing) out.push(note(ev.beat, ev.dur, m, 0.5));
    }
  } else {
    const unit = subdivision(ctx.def);
    for (const g of grid(ctx, unit)) {
      voicing = voiceChord(g.chord, voicing, 55, 74);
      const accent = isOn(g.inBar, ctx.def.pulse);
      for (const m of voicing) out.push(note(g.beat, unit * 0.68, m, accent ? 0.55 : 0.38));
    }
  }
  return out;
}

function timpani(ctx: Ctx): BeatNote[] {
  const out: BeatNote[] = [];
  const { def } = ctx;
  const tonic = pcAtOrAbove(def.tonic, 41);
  const dominant = tonic - 5;
  const drumFor = (c: Chord) => (c.root === def.tonic ? tonic : c.root === (def.tonic + 7) % 12 ? dominant : null);
  const pulsesPerBar = def.beatsPerBar / def.pulse;
  let bar = 0;
  for (const g of grid(ctx, def.pulse)) {
    const down = g.inBar < EPS;
    if (down) bar++;
    const midbar = pulsesPerBar === 4 && Math.abs(g.inBar - def.beatsPerBar / 2) < EPS;
    const drum = drumFor(g.chord);
    if ((down || midbar) && drum !== null) out.push(note(g.beat, 1, drum, down ? 0.9 : 0.6));
    if (bar % 4 === 0 && Math.abs(g.inBar - (def.beatsPerBar - def.pulse)) < EPS && g.beat + def.pulse < ctx.totalBeats) {
      const step = def.pulse / 4;
      for (let i = 0; i < 4; i++) out.push(note(g.beat + i * step, step * 1.2, dominant, 0.35 + i * 0.12));
    }
  }
  return out;
}

function brass(ctx: Ctx): BeatNote[] {
  const out: BeatNote[] = [];
  const { def } = ctx;
  const t = def.tonic;
  const allowed = new Set([t, (t + 5) % 12, (t + 7) % 12]);
  const p = def.pulse;
  const pulses = def.beatsPerBar / p;
  const rhythm: [number, number][] =
    pulses >= 3 ? [[0, 1.5 * p], [1.5 * p, 0.5 * p], [2 * p, (pulses - 2) * p * 0.9]]
    : pulses >= 2 ? [[0, 0.75 * p], [0.75 * p, 0.25 * p], [p, 0.9 * p]]
    : [[0, 0.9 * def.beatsPerBar]];
  let voicing: number[] | null = null;
  for (let bar = def.pickup; bar < ctx.totalBeats - EPS; bar += def.beatsPerBar) {
    for (const [offset, len] of rhythm) {
      const chord = chordAtBeat(ctx.chords, bar + offset);
      if (!chord || !allowed.has(chord.root)) continue;
      voicing = voiceChord(chord, voicing, 64, 81);
      const vel = offset === 0 ? 0.6 : 0.45;
      for (const m of voicing) out.push(note(bar + offset, len * 0.92, m, vel));
      if (offset === 0) out.push(note(bar, len * 0.92, pcAtOrAbove(chord.tones[2] ?? chord.root, 74), 0.3));
    }
  }
  return out;
}
