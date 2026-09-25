import type { AudioEngine, Session } from '../audio/engine';
import type { SustainHandle } from '../audio/voices';
import { LAYER_IDS, type CompiledSong, type LayerId, type TimedNote } from '../music/arrange';
import type { Chart, ChartNote, Difficulty, Judgment, Phrase } from '../music/chart';
import type { LeadKind } from '../music/types';
import type { Strictness } from '../storage';

/** Timing windows in seconds either side of a note, plus how early a press still counts as a (wrong) attempt. */
export interface Windows {
  perfect: number;
  great: number;
  good: number;
  early: number;
}

export const STRICTNESS: Record<Strictness, Windows & { label: string; blurb: string }> = {
  lenient: { perfect: 0.045, great: 0.09, good: 0.135, early: 0.2, label: 'Lenient', blurb: 'A forgiving ear. Early presses are simply ignored.' },
  standard: { perfect: 0.035, great: 0.07, good: 0.11, early: 0.18, label: 'Standard', blurb: 'Tighter windows. Striking a jewel far too soon counts as a faux pas.' },
  strict: { perfect: 0.025, great: 0.05, good: 0.085, early: 0.15, label: 'Strict', blurb: 'For the Kapellmeister’s own ears. Every millisecond is judged.' },
};

/** Ensemble energy needed for each orchestra tier. */
export const TIER_THRESHOLDS = [0, 8, 20, 36, 56];

const LAYER_LEVEL: Record<LayerId, number> = { keys: 0.9, bass: 0.9, strings: 0.8, timpani: 0.85, brass: 0.75 };
const POINTS = { perfect: 100, great: 70, good: 40 };
const FAVOR_GAIN = { perfect: 0.03, great: 0.024, good: 0.014 };
const FAVOR_LOSS: Record<Difficulty, number> = { amateur: 0.05, virtuoso: 0.065, maestro: 0.08 };
/** Seconds a full Fortissimo gauge lasts. */
const FORTISSIMO_SECONDS = 16;
/** Releasing a ribbon this close to its end still counts as holding it through. */
const HOLD_GRACE = 0.12;
/** A stray press this soon after a missed note is reported as "too late". */
const LATE_LABEL = 0.22;
/** How many recent hits the timing strip remembers. */
export const TIMING_HISTORY = 24;

export interface GameOptions {
  difficulty: Difficulty;
  speed: number;
  noFail: boolean;
  approach: number;
  offsetMs: number;
  lead: LeadKind;
  strictness: Strictness;
  missSounds: boolean;
  /** Debug/attract mode: the game plays itself. */
  autoplay?: boolean;
}

export type GameEvent =
  | { type: 'hit'; note: ChartNote; judgment: Exclude<Judgment, 'miss'> }
  | { type: 'miss'; note: ChartNote; early: boolean }
  | { type: 'ghost'; lane: number; late: boolean }
  | { type: 'tier'; tier: number; up: boolean }
  | { type: 'streak'; streak: number }
  | { type: 'holdDone'; note: ChartNote }
  | { type: 'holdDrop'; note: ChartNote }
  | { type: 'phrase'; phrase: Phrase }
  | { type: 'fortissimo'; on: boolean }
  | { type: 'countin'; beat: number }
  | { type: 'fail' }
  | { type: 'finish' };

export interface Results {
  score: number;
  accuracy: number;
  counts: Record<Judgment, number>;
  early: number;
  total: number;
  maxStreak: number;
  holdsCompleted: number;
  holdCount: number;
  maxTier: number;
  fortissimos: number;
  failed: boolean;
  failedAt: number | null;
  stars: number;
  meanOffsetMs: number;
  /** Accuracy over the opening, middle and final thirds. */
  thirds: number[];
}

type State = 'countin' | 'playing' | 'failing' | 'done';

export class Game {
  state: State = 'countin';
  paused = false;
  /** Current song time in seconds (heard time, calibrated). Updated by update(). */
  now: number;
  readonly lanesDown = [false, false, false, false];
  readonly lanePressedAt = [-99, -99, -99, -99];
  /** The ribbon each lane is holding, if any. */
  readonly holdOf: (ChartNote | null)[] = [null, null, null, null];

  score = 0;
  streak = 0;
  maxStreak = 0;
  readonly counts: Record<Judgment, number> = { perfect: 0, great: 0, good: 0, miss: 0 };
  earlyMisses = 0;
  /** The Count's favour, 0–1. Empty means dismissal. */
  favor = 0.6;
  /** How clearly the melody sings, 0.15–1. Misses muffle it. */
  presence = 1;
  energy = 0;
  tier = 0;
  maxTier = 0;
  fortGauge = 0;
  fortActive = false;
  fortCount = 0;
  holdsCompleted = 0;
  failedAt: number | null = null;
  readonly brokenPhrases = new Set<number>();
  /** When the ensemble changed size, for the results timeline. */
  readonly tierLog: { t: number; tier: number }[] = [{ t: 0, tier: 0 }];
  /** Recent hit offsets (seconds) in a ring buffer, for the timing strip. */
  readonly recentOffsets = new Float32Array(TIMING_HISTORY);
  readonly recentAt = new Float64Array(TIMING_HISTORY).fill(-99);
  recentHead = 0;
  readonly windows: Windows;
  readonly endTime: number;
  readonly startTime: number;

  private readonly session: Session;
  private startCtx = 0;
  private readonly offset: number;
  private readonly layerCursor: Record<LayerId, number> = { keys: 0, bass: 0, strings: 0, timpani: 0, brass: 0 };
  private readonly laneNotes: ChartNote[][] = [[], [], [], []];
  private readonly laneCursor = [0, 0, 0, 0];
  private readonly holdHandle: (SustainHandle | null)[] = [null, null, null, null];
  private readonly lastMissAt = [-99, -99, -99, -99];
  private readonly phraseOf = new Map<number, Phrase>();
  private readonly listeners: ((e: GameEvent) => void)[] = [];
  private offsetSum = 0;
  private lastUpdate = 0;
  private readonly countIn: number[] = [];
  private readonly timers: number[] = [];

  constructor(
    private readonly engine: AudioEngine,
    readonly song: CompiledSong,
    readonly chart: Chart,
    readonly opts: GameOptions,
  ) {
    engine.sfxLevel = opts.missSounds ? 1 : 0;
    this.session = engine.createSession();
    this.windows = STRICTNESS[opts.strictness];
    this.offset = opts.offsetMs / 1000;
    for (const n of chart.notes) this.laneNotes[n.lane].push(n);
    for (const p of chart.phrases) this.phraseOf.set(p.index, p);

    const last = chart.notes[chart.notes.length - 1];
    this.endTime = Math.max(song.length, last ? last.end : 0) + 1.4;

    // Lead-in: long enough for the first gems to travel the floor, and for the cane to count a bar.
    const { def, tempo } = song;
    const beats = def.beatsPerBar <= 2 ? 4 : Math.round(def.beatsPerBar / def.pulse);
    for (let k = beats; k >= 1; k--) this.countIn.push(tempo.toSec(def.pickup - k * def.pulse));
    this.startTime = Math.min(-(opts.approach + 0.5), this.countIn[0] - 0.4);
    this.now = this.startTime;
  }

  on(fn: (e: GameEvent) => void) {
    this.listeners.push(fn);
  }

  private emit(e: GameEvent) {
    for (const fn of this.listeners) fn(e);
  }

  get multiplier(): number {
    return (1 + Math.min(3, Math.floor(this.streak / 10))) * (this.fortActive ? 2 : 1);
  }

  /** Fraction of the way to the next ×multiplier, for the wax seal's ring. */
  get multiplierProgress(): number {
    return this.streak >= 30 ? 1 : (this.streak % 10) / 10;
  }

  hasFailed(): boolean {
    return this.failedAt !== null;
  }

  get effectiveTier(): number {
    return this.fortActive ? 4 : this.tier;
  }

  start() {
    const ctx = this.engine.ctx;
    this.startCtx = this.engine.heardTime() + 0.15 - this.startTime;
    const perBar = this.countIn.length;
    this.countIn.forEach((t, i) => {
      this.engine.voices.cane(this.session.sfx, this.startCtx + t, i % perBar === 0);
      const ms = (this.startCtx + t - ctx.currentTime) * 1000;
      this.timers.push(window.setTimeout(() => this.state === 'countin' && this.emit({ type: 'countin', beat: i }), Math.max(0, ms)));
    });
    this.applyMix(true);
    this.now = this.time();
    this.lastUpdate = this.now;
  }

  time(): number {
    return this.engine.heardTime() - this.startCtx - this.offset;
  }

  update() {
    if (this.paused || this.state === 'done') return;
    const t = this.time();
    this.now = t;
    const dt = Math.min(0.1, Math.max(0, t - this.lastUpdate));
    this.lastUpdate = t;
    if (this.state === 'failing') return;

    this.scheduleLayers();
    if (this.state === 'countin' && t >= 0) this.state = 'playing';
    if (this.opts.autoplay) this.autoplay(t);

    const good = this.windows.good;
    for (let lane = 0; lane < 4; lane++) {
      const notes = this.laneNotes[lane];
      let i = this.laneCursor[lane];
      while (i < notes.length && notes[i].state !== 'pending') i++;
      while (i < notes.length && t - notes[i].time > good) {
        if (notes[i].state === 'pending') this.miss(notes[i], false);
        i++;
        // A miss may have exhausted the Count's patience.
        if (this.hasFailed()) return;
      }
      this.laneCursor[lane] = i;

      const held = this.holdOf[lane];
      if (held) {
        this.payHold(held, t);
        if (t >= held.end) this.endHold(lane, true);
      }
    }

    if (this.fortActive) {
      this.fortGauge -= dt / FORTISSIMO_SECONDS;
      if (this.fortGauge <= 0) {
        this.fortGauge = 0;
        this.fortActive = false;
        this.emit({ type: 'fortissimo', on: false });
        this.applyMix();
      }
    }

    if (t >= this.endTime) {
      this.state = 'done';
      this.releaseAllHolds();
      this.session.dispose(2);
      this.emit({ type: 'finish' });
    }
  }

  private autoplay(t: number) {
    for (let lane = 0; lane < 4; lane++) {
      const notes = this.laneNotes[lane];
      let i = this.laneCursor[lane];
      while (i < notes.length && notes[i].state !== 'pending') i++;
      const n = notes[i];
      if (n && t >= n.time) {
        this.lanesDown[lane] = true;
        this.lanePressedAt[lane] = t;
        this.hit(n, n.time + (Math.random() - 0.5) * this.windows.perfect);
      } else if (!this.holdOf[lane] && t - this.lanePressedAt[lane] > 0.08) {
        this.lanesDown[lane] = false;
      }
    }
    if (this.fortGauge >= 0.5) this.activateFortissimo();
  }

  private scheduleLayers() {
    const ctx = this.engine.ctx;
    const horizon = ctx.currentTime + 0.3;
    const v = this.engine.voices;
    const def = this.song.def;
    const pulse = def.stringStyle === 'pulse';
    const horns = def.brass === 'horns';
    // Solo piano music: the pianist's own bass, a soft string pad, harp and distant horns.
    const piano = def.ensemble === 'piano';
    for (const id of LAYER_IDS) {
      const notes = this.song.layers[id];
      const dest = this.session.layers[id];
      let i = this.layerCursor[id];
      for (; i < notes.length && this.startCtx + notes[i].time < horizon; i++) {
        const n = notes[i];
        const at = this.startCtx + n.time;
        if (at < ctx.currentTime - 0.03) continue;
        const when = Math.max(at, ctx.currentTime);
        switch (id) {
          case 'keys':
            v.keys(def.keys, dest, when, n.midi, n.dur, n.vel);
            break;
          case 'bass':
            if (piano) v.keys('grand', dest, when, n.midi, n.dur, n.vel * 0.9);
            else v.cello(dest, when, n.midi, n.dur, n.vel);
            break;
          case 'strings':
            v.strings(dest, when, n.midi, n.dur, piano ? n.vel * 0.5 : n.vel, pulse && !piano);
            break;
          case 'timpani':
            if (piano) v.keys('harp', dest, when, n.midi + 24, 1, n.vel * 0.45);
            else v.timpani(dest, when, n.midi, n.vel);
            break;
          case 'brass':
            v.brass(dest, when, n.midi, n.dur, piano ? n.vel * 0.5 : n.vel, horns || piano);
            break;
        }
      }
      this.layerCursor[id] = i;
    }
  }

  // ─── Input ──────────────────────────────────────────────────────────────

  press(lane: number, perfMs: number) {
    if (this.paused || this.lanesDown[lane]) return;
    this.lanesDown[lane] = true;
    const t = this.engine.heardTimeAt(perfMs) - this.startCtx - this.offset;
    this.lanePressedAt[lane] = t;
    if (this.state !== 'playing' && this.state !== 'countin') return;

    const w = this.windows;
    const strictEarly = this.opts.strictness !== 'lenient';
    const notes = this.laneNotes[lane];
    for (let i = this.laneCursor[lane]; i < notes.length; i++) {
      const n = notes[i];
      const d = t - n.time;
      if (-d > w.early) break;
      if (n.state !== 'pending') continue;
      if (Math.abs(d) <= w.good) {
        this.hit(n, t);
        return;
      }
      if (d < 0) {
        // Struck well before its time: with strict ears, that jewel is spent.
        if (strictEarly) {
          n.offset = d;
          this.miss(n, true);
          return;
        }
        break;
      }
    }
    this.ghost(lane, t - this.lastMissAt[lane] < LATE_LABEL);
  }

  release(lane: number, perfMs: number) {
    this.lanesDown[lane] = false;
    if (this.paused) return;
    const n = this.holdOf[lane];
    if (!n) return;
    const t = this.engine.heardTimeAt(perfMs) - this.startCtx - this.offset;
    this.payHold(n, t);
    this.endHold(lane, t >= n.end - HOLD_GRACE);
  }

  activateFortissimo(): boolean {
    if (this.fortActive || this.fortGauge < 0.5 || this.state !== 'playing' || this.paused) return false;
    this.fortActive = true;
    this.fortCount++;
    const now = this.engine.ctx.currentTime;
    const v = this.engine.voices;
    const root = 60 + this.song.def.tonic;
    for (const m of [root, root + 4, root + 7, root + 12]) v.brass(this.session.sfx, now, m, 0.6, 0.7, false);
    for (let i = 0; i < 6; i++) v.timpani(this.session.sfx, now + i * 0.06, root - 24, 0.3 + i * 0.1);
    this.emit({ type: 'fortissimo', on: true });
    this.applyMix();
    return true;
  }

  // ─── Judgement ──────────────────────────────────────────────────────────

  private hit(n: ChartNote, t: number) {
    const w = this.windows;
    const d = t - n.time;
    const ad = Math.abs(d);
    const j = ad <= w.perfect ? 'perfect' : ad <= w.great ? 'great' : 'good';
    n.state = 'hit';
    n.judgment = j;
    n.offset = d;
    this.offsetSum += d;
    this.recentOffsets[this.recentHead] = d;
    this.recentAt[this.recentHead] = t;
    this.recentHead = (this.recentHead + 1) % TIMING_HISTORY;
    this.counts[j]++;
    this.streak++;
    this.maxStreak = Math.max(this.maxStreak, this.streak);
    this.score += POINTS[j] * this.multiplier;
    this.favor = Math.min(1, this.favor + FAVOR_GAIN[j]);
    this.presence = Math.min(1, this.presence + 0.12);
    this.energy = Math.min(TIER_THRESHOLDS[4] + 24, this.energy + (j === 'perfect' ? 1.25 : 1));

    const now = this.engine.ctx.currentTime;
    const handle = this.engine.voices.lead(this.opts.lead, this.session.lead, now, n.midi, n.soundDur, n.vel, n.hold);
    if (n.hold) {
      n.holding = true;
      n.holdScoredTo = n.time;
      this.holdOf[n.lane] = n;
      this.holdHandle[n.lane] = handle;
    }
    for (const f of n.followers) this.playFollower(f, now);

    this.emit({ type: 'hit', note: n, judgment: j });
    if (this.streak % 50 === 0) this.emit({ type: 'streak', streak: this.streak });
    this.updateTier();
    this.checkPhrase(n);
    this.applyMix();
  }

  private playFollower(f: TimedNote, now: number) {
    const at = this.startCtx + f.time;
    if (at > now + 0.01) this.engine.voices.lead(this.opts.lead, this.session.lead, at, f.midi, f.dur, f.vel * 0.92);
  }

  private miss(n: ChartNote, early: boolean) {
    n.state = 'missed';
    n.judgment = 'miss';
    if (n.hold) n.holdDropped = true;
    this.counts.miss++;
    if (early) this.earlyMisses++;
    this.lastMissAt[n.lane] = n.time;
    this.streak = 0;
    this.favor = Math.max(0, this.favor - FAVOR_LOSS[this.opts.difficulty]);
    this.presence = Math.max(0.15, this.presence - 0.34);
    this.energy = TIER_THRESHOLDS[Math.max(0, this.tier - 1)];
    if (n.gilded) this.brokenPhrases.add(n.phrase);
    this.engine.voices.fumble(this.session.misses, this.engine.ctx.currentTime, n.midi, 0.35);
    this.emit({ type: 'miss', note: n, early });
    this.updateTier();
    this.applyMix();
    if (this.favor <= 0 && !this.opts.noFail) this.fail();
  }

  private ghost(lane: number, late: boolean) {
    const next = this.laneNotes[lane][this.laneCursor[lane]];
    const midi = next ? next.midi : 60 + this.song.def.tonic;
    this.engine.voices.fumble(this.session.misses, this.engine.ctx.currentTime, midi, 0.2);
    this.favor = Math.max(0, this.favor - 0.01);
    this.emit({ type: 'ghost', lane, late });
    if (this.favor <= 0 && !this.opts.noFail && this.state === 'playing') this.fail();
  }

  private payHold(n: ChartNote, t: number) {
    const upTo = Math.min(t, n.end);
    if (upTo <= n.holdScoredTo) return;
    this.score += (upTo - n.holdScoredTo) * n.holdRate * this.multiplier;
    n.holdScoredTo = upTo;
  }

  private endHold(lane: number, completed: boolean) {
    const n = this.holdOf[lane];
    const h = this.holdHandle[lane];
    if (!n) return;
    this.holdOf[lane] = null;
    this.holdHandle[lane] = null;
    n.holding = false;
    const now = this.engine.ctx.currentTime;
    if (completed) {
      n.holdDone = true;
      this.holdsCompleted++;
      // Let the note ring to its written end so it meets the next one, rather than
      // stopping when the ribbon's scoring window closes.
      h?.release(Math.max(now + 0.02, this.startCtx + n.time + n.soundDur));
      this.emit({ type: 'holdDone', note: n });
    } else {
      n.holdDropped = true;
      h?.release(now);
      this.emit({ type: 'holdDrop', note: n });
    }
  }

  private releaseAllHolds() {
    const now = this.engine.ctx.currentTime;
    for (let lane = 0; lane < 4; lane++) {
      this.holdHandle[lane]?.release(now);
      const n = this.holdOf[lane];
      if (n) n.holding = false;
      this.holdOf[lane] = null;
      this.holdHandle[lane] = null;
    }
  }

  private checkPhrase(n: ChartNote) {
    const p = this.phraseOf.get(n.phrase);
    if (!p || !p.gilded || p.notes[p.notes.length - 1] !== n) return;
    if (p.notes.every((x) => x.state === 'hit')) {
      this.fortGauge = Math.min(1, this.fortGauge + 0.25);
      this.emit({ type: 'phrase', phrase: p });
    }
  }

  private updateTier() {
    let tier = 0;
    for (let i = 0; i < TIER_THRESHOLDS.length; i++) if (this.energy >= TIER_THRESHOLDS[i]) tier = i;
    if (tier === this.tier) return;
    const up = tier > this.tier;
    this.tier = tier;
    this.maxTier = Math.max(this.maxTier, tier);
    this.tierLog.push({ t: Math.max(0, this.now), tier });
    this.emit({ type: 'tier', tier, up });
  }

  private applyMix(immediate = false) {
    const now = this.engine.ctx.currentTime;
    const eff = this.effectiveTier;
    LAYER_IDS.forEach((id, i) => {
      const g = this.session.layers[id].gain;
      const target = i <= eff ? LAYER_LEVEL[id] : 0;
      if (immediate) g.setValueAtTime(target, now);
      else g.setTargetAtTime(target, now, i <= eff ? 0.3 : 0.9);
    });
    const p = this.presence;
    // The soloist sits ~3 dB proud of the orchestra at full presence.
    this.session.lead.gain.setTargetAtTime(1.4 * (0.3 + 0.7 * p), now, 0.12);
    this.session.leadFilter.frequency.setTargetAtTime(450 + p * p * 11500, now, 0.12);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  private fail() {
    if (this.state === 'failing' || this.state === 'done') return;
    this.state = 'failing';
    this.failedAt = Math.max(0, this.now);
    this.releaseAllHolds();
    const v = this.engine.voices;
    const now = this.engine.ctx.currentTime;
    // The harpsichordist slams a sour cluster; the orchestra stops.
    for (const m of [43, 44, 50, 55, 56, 61]) v.harpsichord(this.session.sfx, now + Math.random() * 0.04, m, 1.4, 0.8);
    this.session.dispose(2.2);
    this.emit({ type: 'fail' });
  }

  pause() {
    if (this.paused || this.state === 'done') return;
    this.paused = true;
    void this.engine.ctx.suspend();
  }

  async resume() {
    if (!this.paused) return;
    await this.engine.ctx.resume();
    this.paused = false;
    for (let lane = 0; lane < 4; lane++) if (this.holdOf[lane] && !this.lanesDown[lane]) this.endHold(lane, false);
  }

  abort() {
    this.state = 'done';
    for (const id of this.timers) clearTimeout(id);
    this.releaseAllHolds();
    this.session.dispose(0.3);
    this.listeners.length = 0;
    if (this.paused) {
      this.paused = false;
      void this.engine.ctx.resume();
    }
  }

  results(): Results {
    const notes = this.chart.notes;
    const total = notes.length;
    const c = this.counts;
    const weight = (n: ChartNote) => (n.judgment === 'perfect' ? 1 : n.judgment === 'great' ? 0.75 : n.judgment === 'good' ? 0.45 : 0);
    const accuracy = total ? notes.reduce((s, n) => s + weight(n), 0) / total : 0;
    const failed = this.failedAt !== null;
    const stars = failed ? 0 : accuracy >= 0.95 ? 5 : accuracy >= 0.88 ? 4 : accuracy >= 0.76 ? 3 : accuracy >= 0.6 ? 2 : 1;
    const hits = c.perfect + c.great + c.good;
    const thirds = [0, 1, 2].map((k) => {
      const slice = notes.slice(Math.floor((k * total) / 3), Math.floor(((k + 1) * total) / 3)).filter((n) => n.state !== 'pending');
      return slice.length ? slice.reduce((s, n) => s + weight(n), 0) / slice.length : NaN;
    });
    return {
      score: Math.round(this.score),
      accuracy,
      counts: { ...c },
      early: this.earlyMisses,
      total,
      maxStreak: this.maxStreak,
      holdsCompleted: this.holdsCompleted,
      holdCount: this.chart.holdCount,
      maxTier: this.maxTier,
      fortissimos: this.fortCount,
      failed,
      failedAt: this.failedAt,
      stars,
      meanOffsetMs: hits ? (this.offsetSum / hits) * 1000 : 0,
      thirds,
    };
  }
}
