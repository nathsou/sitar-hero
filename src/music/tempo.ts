/**
 * A piecewise-constant tempo map converting beats (quarter notes) to seconds and back.
 * Accelerandos are approximated by many short segments.
 */
export class TempoMap {
  private readonly beats: Float64Array;
  private readonly times: Float64Array;
  private readonly spb: Float64Array;

  /** @param segments beat at which each tempo starts, sorted, first at beat 0 */
  constructor(segments: { beat: number; bpm: number }[]) {
    const n = Math.max(1, segments.length);
    this.beats = new Float64Array(n);
    this.times = new Float64Array(n);
    this.spb = new Float64Array(n);
    let t = 0;
    for (let i = 0; i < n; i++) {
      const s = segments[i] ?? { beat: 0, bpm: 120 };
      if (i > 0) t += (s.beat - this.beats[i - 1]) * this.spb[i - 1];
      this.beats[i] = i === 0 ? 0 : s.beat;
      this.times[i] = t;
      this.spb[i] = 60 / s.bpm;
    }
  }

  static constant(bpm: number) {
    return new TempoMap([{ beat: 0, bpm }]);
  }

  /** Linear change of tempo from `from` to `to` bpm across `beats` beats. */
  static ramp(from: number, to: number, beats: number, step = 0.5) {
    const segs: { beat: number; bpm: number }[] = [];
    for (let b = 0; b < beats; b += step) segs.push({ beat: b, bpm: from + ((to - from) * (b + step / 2)) / beats });
    return new TempoMap(segs.length ? segs : [{ beat: 0, bpm: from }]);
  }

  scaled(speed: number): TempoMap {
    const segs: { beat: number; bpm: number }[] = [];
    for (let i = 0; i < this.beats.length; i++) segs.push({ beat: this.beats[i], bpm: (60 / this.spb[i]) * speed });
    return new TempoMap(segs);
  }

  private segAtBeat(b: number): number {
    let lo = 0;
    let hi = this.beats.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.beats[mid] <= b) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  private segAtTime(t: number): number {
    let lo = 0;
    let hi = this.times.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.times[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  toSec(beat: number): number {
    const i = this.segAtBeat(beat);
    return this.times[i] + (beat - this.beats[i]) * this.spb[i];
  }

  toBeat(sec: number): number {
    const i = this.segAtTime(sec);
    return this.beats[i] + (sec - this.times[i]) / this.spb[i];
  }

  /** Seconds per beat at a given time. */
  spbAt(sec: number): number {
    return this.spb[this.segAtTime(sec)];
  }

  /** Tempo at the start, for display. */
  get initialBpm(): number {
    return 60 / this.spb[0];
  }
}
