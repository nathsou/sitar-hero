import { chordAtTime, type CompiledSong, type MelodyNote, type TimedNote } from './arrange';

export type Difficulty = 'amateur' | 'virtuoso' | 'maestro';

export const DIFFICULTIES: { id: Difficulty; name: string; blurb: string }[] = [
  { id: 'amateur', name: 'Amateur', blurb: 'The principal beats. A gentleman’s pastime.' },
  { id: 'virtuoso', name: 'Virtuoso', blurb: 'Every quaver, and the odd double-stop. For the salon’s darling.' },
  { id: 'maestro', name: 'Maestro', blurb: 'Every semiquaver, ornaments and chords. For the Kapellmeister.' },
];

interface Rule {
  /** Notes must start on this fraction of the pulse (0 = anywhere). */
  grid: number;
  /** Minimum spacing between gems, as a fraction of the pulse and in seconds. */
  minPulses: number;
  minSec: number;
  /** Add a chord gem every this many bars (0 = never). */
  chordEvery: number;
}

const RULES: Record<Difficulty, Rule> = {
  amateur: { grid: 1, minPulses: 1, minSec: 0.42, chordEvery: 0 },
  virtuoso: { grid: 0.5, minPulses: 0.5, minSec: 0.2, chordEvery: 2 },
  maestro: { grid: 0, minPulses: 0, minSec: 0.075, chordEvery: 1 },
};

export type Judgment = 'perfect' | 'great' | 'good' | 'miss';

export interface ChartNote {
  id: number;
  time: number;
  lane: number;
  midi: number;
  /** Loudness 0–1, from the melody's phrasing. */
  vel: number;
  /** How long the played note should ring, in seconds. */
  soundDur: number;
  hold: boolean;
  /** End of the ribbon (equals `time` for plain gems). */
  end: number;
  /** Sustain points per second while a ribbon is held. */
  holdRate: number;
  /** Melody notes too quick for this difficulty; they sound only if this gem is struck. */
  followers: TimedNote[];
  /** The other gem of a double-stop, if any. */
  chordWith: ChartNote | null;
  /** True for the added lower voice of a double-stop. */
  harmony: boolean;
  phrase: number;
  gilded: boolean;

  // Runtime state, reset per performance.
  state: 'pending' | 'hit' | 'missed';
  judgment: Judgment | null;
  /** Hit offset in seconds (negative = early). */
  offset: number;
  holding: boolean;
  holdDone: boolean;
  holdDropped: boolean;
  holdScoredTo: number;
}

export interface Phrase {
  index: number;
  gilded: boolean;
  notes: ChartNote[];
}

export interface Chart {
  notes: ChartNote[];
  phrases: Phrase[];
  holdCount: number;
}

const HOLD_POINTS_PER_BEAT = 25;
const EPS = 1e-6;

export function buildChart(song: CompiledSong, difficulty: Difficulty): Chart {
  const { def } = song;
  const rule = RULES[difficulty];
  const pulse = def.pulse;
  // A Maestro ornaments the melody, as any self-respecting Baroque soloist would.
  const melody = difficulty === 'maestro' ? ornament(song) : song.melody;

  // 1 · Choose which melody notes become gems. Long notes are always kept.
  const kept: MelodyNote[] = [];
  const grid = rule.grid * pulse;
  for (const n of melody) {
    const pos = n.beat - def.pickup;
    const onGrid = grid === 0 || Math.abs(pos / grid - Math.round(pos / grid)) < EPS;
    if (!onGrid && n.beats < pulse - EPS) continue;
    const prev = kept[kept.length - 1];
    if (prev && (n.beat - prev.beat < rule.minPulses * pulse - EPS || n.time - prev.time < rule.minSec)) continue;
    kept.push(n);
  }

  // 2 · Map pitch to lanes: higher notes lean right, and the direction of each step is kept.
  const lanes = assignLanes(kept, melody, Math.max(2, def.beatsPerBar));

  // 3 · Gems and ribbons. Each gem carries the melody notes skipped after it.
  const phraseBeats = def.beatsPerBar >= 4 ? def.beatsPerBar * 2 : def.beatsPerBar * 4;
  const notes: ChartNote[] = [];
  let m = 0;
  for (let i = 0; i < kept.length; i++) {
    const n = kept[i];
    const next = kept[i + 1];
    while (m < melody.length && melody[m].time <= n.time) m++;
    const followers: TimedNote[] = [];
    for (; m < melody.length && (!next || melody[m].time < next.time); m++) {
      const f = melody[m];
      followers.push({ time: f.time, dur: f.dur, midi: f.midi, vel: f.vel });
    }
    const hold = n.beats >= 1.5 - EPS && n.dur >= 0.6;
    notes.push(makeNote(notes.length, n.time, lanes[i], n.midi, n.vel, n.dur, hold, followers, Math.floor(Math.max(0, n.beat - def.pickup) / phraseBeats), (HOLD_POINTS_PER_BEAT * n.beats) / n.dur));
  }

  // 4 · Double-stops: on strong downbeats with room around them, add a harmony gem.
  if (rule.chordEvery > 0) {
    const bar = def.beatsPerBar;
    const extra: ChartNote[] = [];
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const src = kept[i];
      const pos = src.beat - def.pickup;
      const barIdx = Math.round(pos / bar);
      if (n.hold || Math.abs(pos / bar - barIdx) > EPS || barIdx % rule.chordEvery !== 0) continue;
      const prevGap = i > 0 ? n.time - notes[i - 1].time : Infinity;
      const nextGap = i + 1 < notes.length ? notes[i + 1].time - n.time : Infinity;
      if (prevGap < 0.28 || nextGap < 0.28) continue;
      const chord = chordAtTime(song, n.time + 0.001);
      if (!chord) continue;
      let partner = -1;
      for (let d = 3; d <= 9 && partner < 0; d++) if (chord.tones.includes((n.midi - d + 120) % 12)) partner = n.midi - d;
      if (partner < 0) continue;
      // The lower voice sits to the left, unless the melody is already in the leftmost lane.
      const lane = n.lane >= 1 ? n.lane - 1 : 1;
      const p = makeNote(0, n.time, lane, partner, n.vel * 0.7, n.soundDur, false, [], n.phrase, 0);
      p.chordWith = n;
      p.harmony = true;
      n.chordWith = p;
      extra.push(p);
    }
    notes.push(...extra);
    notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
    notes.forEach((n, i) => (n.id = i));
  }

  // 5 · Gild every fourth phrase; perfect phrases charge the Fortissimo.
  const byPhrase = new Map<number, ChartNote[]>();
  for (const n of notes) {
    let list = byPhrase.get(n.phrase);
    if (!list) byPhrase.set(n.phrase, (list = []));
    list.push(n);
  }
  let lastPhrase = 0;
  for (const k of byPhrase.keys()) lastPhrase = Math.max(lastPhrase, k);
  const phrases: Phrase[] = [...byPhrase.entries()].map(([index, ns]) => {
    const gilded = index % 4 === 2 && ns.length >= 3 && index !== lastPhrase;
    for (const n of ns) n.gilded = gilded;
    return { index, gilded, notes: ns };
  });

  return { notes, phrases, holdCount: notes.filter((n) => n.hold).length };
}

function makeNote(
  id: number, time: number, lane: number, midi: number, vel: number, dur: number, hold: boolean,
  followers: TimedNote[], phrase: number, holdRate: number,
): ChartNote {
  return {
    id, time, lane, midi, vel, soundDur: dur, hold,
    end: hold ? time + dur - Math.min(0.12, dur * 0.15) : time,
    holdRate, followers, chordWith: null, harmony: false, phrase, gilded: false,
    state: 'pending', judgment: null, offset: 0,
    holding: false, holdDone: false, holdDropped: false, holdScoredTo: 0,
  };
}

/** Reset the runtime fields so a chart can be performed again. */
export function resetChart(chart: Chart) {
  for (const n of chart.notes) {
    n.state = 'pending';
    n.judgment = null;
    n.offset = 0;
    n.holding = n.holdDone = n.holdDropped = false;
    n.holdScoredTo = 0;
  }
}

/**
 * Turn downbeat crotchets into written-out mordents: main note, the scale step
 * above, and back (two semiquavers and a quaver). The scale is inferred from
 * the pitch classes the melody itself uses.
 */
function ornament(song: CompiledSong): MelodyNote[] {
  const { def, melody } = song;
  const scale = [...new Set(melody.map((n) => n.midi % 12))].sort((a, b) => a - b);
  const upper = (midi: number) => {
    for (let step = 1; step <= 2; step++) if (scale.includes((midi + step) % 12)) return midi + step;
    return midi + 2;
  };
  const out: MelodyNote[] = [];
  const bar = def.beatsPerBar;
  for (const n of melody) {
    const pos = n.beat - def.pickup;
    const downbeat = Math.abs(pos / bar - Math.round(pos / bar)) < EPS;
    const q = n.dur / n.beats / 4;
    if (!downbeat || n.beats < 1 - EPS || n.beats > 1.5 + EPS || n.dur < 0.45 || q < 0.12) {
      out.push(n);
      continue;
    }
    out.push({ ...n, beats: 0.25, dur: q });
    out.push({ ...n, midi: upper(n.midi), beat: n.beat + 0.25, time: n.time + q, beats: 0.25, dur: q, vel: n.vel * 0.9 });
    out.push({ ...n, beat: n.beat + 0.5, time: n.time + 2 * q, beats: n.beats - 0.5, dur: n.dur - 2 * q });
  }
  return out;
}

function assignLanes(kept: MelodyNote[], all: MelodyNote[], windowBeats: number): number[] {
  const lanes: number[] = [];
  let prevLane = -1;
  let prevMidi = -1;
  let start = 0;
  for (const n of kept) {
    while (start < all.length && all[start].beat < n.beat - windowBeats) start++;
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = start; j < all.length && all[j].beat <= n.beat + windowBeats; j++) {
      lo = Math.min(lo, all[j].midi);
      hi = Math.max(hi, all[j].midi);
    }
    if (hi - lo < 5) {
      const c = (hi + lo) / 2;
      lo = c - 2.5;
      hi = c + 2.5;
    }
    let lane = Math.min(3, Math.max(0, Math.floor(((n.midi - lo) / (hi - lo + 0.001)) * 4)));
    if (prevLane >= 0) {
      if (n.midi > prevMidi && lane <= prevLane) lane = Math.min(3, prevLane + 1);
      else if (n.midi < prevMidi && lane >= prevLane) lane = Math.max(0, prevLane - 1);
      else if (n.midi === prevMidi) lane = prevLane;
    }
    lanes.push(lane);
    prevLane = lane;
    prevMidi = n.midi;
  }
  return lanes;
}
