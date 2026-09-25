import { midiToFreq } from '../music/theory';
import type { KeysKind, LeadKind } from '../music/types';
import { karplus, type PluckParams } from './karplus';
import { pianoTone, trimTail } from './piano';

export interface SustainHandle {
  /** Release the note at context time `at`. */
  release(at: number): void;
}

export type BufferKind = 'sitar' | 'harpsichord' | 'piano' | 'guitar' | 'harp';

/** Plucked and struck tones are pre-rendered at this rate; Web Audio resamples on playback. */
const BUFFER_RATE = 32000;
/** Upper bound on cached tone memory. Least-recently-used tones are dropped beyond it. */
const CACHE_BUDGET_BYTES = 40 * 1024 * 1024;

const NOOP: SustainHandle = { release() {} };

/**
 * Fade a gain to silence from `at` without a jump. Cancelling a ramp that is
 * still in progress (say, a short note released during its attack) would
 * otherwise snap the gain back to its last fixed value and click.
 */
function fadeOut(p: AudioParam, at: number, tau: number) {
  if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(at);
  else {
    p.cancelScheduledValues(at);
    p.setValueAtTime(p.value, at);
  }
  p.setTargetAtTime(0, at, tau);
}

/** How each buffered instrument stops: extra ring after the written length, and damper speed. */
const DAMPING: Record<BufferKind, { ring: number; tau: number }> = {
  sitar: { ring: 0.12, tau: 0.22 },
  harpsichord: { ring: 0.02, tau: 0.05 },
  piano: { ring: 0.08, tau: 0.12 },
  guitar: { ring: 0.3, tau: 0.2 },
  harp: { ring: 0.9, tau: 0.5 },
};

class ToneCache {
  private readonly map = new Map<string, AudioBuffer>();
  private bytes = 0;

  get(key: string): AudioBuffer | undefined {
    const buf = this.map.get(key);
    if (buf) {
      // Refresh recency: Map iteration order is insertion order.
      this.map.delete(key);
      this.map.set(key, buf);
    }
    return buf;
  }

  set(key: string, buf: AudioBuffer) {
    this.map.set(key, buf);
    this.bytes += buf.length * 4;
    while (this.bytes > CACHE_BUDGET_BYTES && this.map.size > 1) {
      const [oldKey, old] = this.map.entries().next().value!;
      this.map.delete(oldKey);
      this.bytes -= old.length * 4;
    }
  }
}

/**
 * Every instrument in the orchestra, synthesised from scratch. Plucked and struck
 * instruments use cached pre-rendered tones; bowed, blown and piped ones are oscillators.
 */
export class Voices {
  private readonly cache = new ToneCache();
  private readonly noise: AudioBuffer;
  private readonly buzzCurve: Float32Array<ArrayBuffer>;
  private organWave: PeriodicWave | null = null;

  constructor(private readonly ctx: BaseAudioContext) {
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // Asymmetric soft clip: adds the buzzy even harmonics of a bridge-grazing string.
    this.buzzCurve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      this.buzzCurve[i] = Math.tanh(2.2 * x) * 0.8 + (x > 0 ? 0.25 * x * x : 0);
    }
  }

  // ─── Pre-rendered tones ─────────────────────────────────────────────────

  buffer(kind: BufferKind, midi: number): AudioBuffer {
    const key = `${kind}:${midi}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const data = trimTail(render(kind, midi));
    const buf = this.ctx.createBuffer(1, data.length, BUFFER_RATE);
    buf.getChannelData(0).set(data);
    this.cache.set(key, buf);
    return buf;
  }

  /** Pre-render every tone a performance will need, yielding to the page between batches. */
  async warm(jobs: Iterable<[BufferKind, number]>): Promise<void> {
    const unique = new Map<string, [BufferKind, number]>();
    for (const j of jobs) unique.set(`${j[0]}:${j[1]}`, j);
    let i = 0;
    for (const [kind, midi] of unique.values()) {
      this.buffer(kind, midi);
      if (++i % 6 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  }

  private playBuffer(kind: BufferKind, dest: AudioNode, t: number, midi: number, gain: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer(kind, midi);
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(dest);
    src.start(t);
    const damp = (at: number) => {
      const { tau } = DAMPING[kind];
      g.gain.cancelScheduledValues(at);
      g.gain.setValueAtTime(gain, at);
      g.gain.setTargetAtTime(0, at, tau);
      src.stop(at + tau * 8);
    };
    return { src, g, damp };
  }

  // ─── The soloist ────────────────────────────────────────────────────────

  /** When the soloist's previous note stops sounding; a note starting before then is slurred. */
  private leadUntil = 0;

  lead(kind: LeadKind, dest: AudioNode, t: number, midi: number, dur: number, vel: number, sustain = false): SustainHandle {
    const legato = t < this.leadUntil + 0.04;
    this.leadUntil = sustain ? Infinity : Math.max(t + dur, this.leadUntil === Infinity ? t : this.leadUntil);
    const handle = this.leadVoice(kind, dest, t, midi, dur, vel, sustain, legato);
    if (!sustain) return handle;
    return {
      release: (at) => {
        this.leadUntil = Math.max(at, this.ctx.currentTime);
        handle.release(at);
      },
    };
  }

  private leadVoice(kind: LeadKind, dest: AudioNode, t: number, midi: number, dur: number, vel: number, sustain: boolean, legato: boolean): SustainHandle {
    switch (kind) {
      case 'sitar':
      case 'harpsichord':
      case 'piano':
      case 'guitar': {
        const gain = vel * (kind === 'sitar' ? 0.9 : kind === 'piano' ? 0.95 : 0.85);
        const v = this.playBuffer(kind, dest, t, midi, gain);
        if (kind === 'sitar') {
          // A little meend: slide up into the note from just below.
          v.src.playbackRate.setValueAtTime(0.985, t);
          v.src.playbackRate.linearRampToValueAtTime(1, t + 0.035);
        }
        if (!sustain) {
          v.damp(t + Math.max(0.12, dur) + DAMPING[kind].ring);
          return NOOP;
        }
        const drone = kind === 'sitar' ? this.sitarDrone(dest, t, midi, vel, v.src) : null;
        let released = false;
        return {
          release: (at) => {
            if (released) return;
            released = true;
            const when = Math.max(at, this.ctx.currentTime);
            drone?.release(when);
            v.damp(when);
          },
        };
      }
      case 'violin':
        return this.sustained(this.violin(dest, t, midi, vel, legato), t, dur, sustain);
      case 'organ':
        return this.sustained(this.organ(dest, t, midi, vel * 0.9, legato), t, dur, sustain);
      case 'flute':
        return this.sustained(this.flute(dest, t, midi, vel, legato), t, dur, sustain);
      case 'trumpet':
        return this.sustained(this.brassVoice(dest, t, midi, vel * 1.2, false, legato), t, dur, sustain);
    }
  }

  private sustained(h: SustainHandle, t: number, dur: number, sustain: boolean): SustainHandle {
    if (!sustain) {
      h.release(t + Math.max(0.1, dur * 0.95));
      return NOOP;
    }
    let released = false;
    return {
      release: (at) => {
        if (released) return;
        released = true;
        h.release(Math.max(at, this.ctx.currentTime));
      },
    };
  }

  /** Held sitar notes: a bowed, buzzing drone swells under the pluck, with gamak vibrato. */
  private sitarDrone(dest: AudioNode, t: number, midi: number, vel: number, src: AudioBufferSourceNode): SustainHandle {
    const ctx = this.ctx;
    const f = midiToFreq(midi);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'triangle';
    o1.frequency.value = f;
    o2.frequency.value = f * 2;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.4;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(14, t + 0.5);
    lfo.connect(depth);
    depth.connect(o1.detune);
    depth.connect(o2.detune);
    const rate = ctx.createGain();
    rate.gain.setValueAtTime(0, t);
    rate.gain.linearRampToValueAtTime(0.006, t + 0.5);
    lfo.connect(rate).connect(src.playbackRate);
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.buzzCurve;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(6000, f * 5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel * 0.13, t + 0.3);
    o1.connect(shaper);
    o2.connect(shaper);
    shaper.connect(lp).connect(g).connect(dest);
    for (const o of [o1, o2, lfo]) o.start(t);
    return {
      release: (at) => {
        fadeOut(g.gain, at, 0.09);
        for (const o of [o1, o2, lfo]) o.stop(at + 0.8);
      },
    };
  }

  private violin(dest: AudioNode, t: number, midi: number, vel: number, legato = false): SustainHandle {
    const ctx = this.ctx;
    const f = midiToFreq(midi);
    const oscs = [-5, 5].map((c) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = c;
      return o;
    });
    const body1 = ctx.createBiquadFilter();
    body1.type = 'peaking';
    body1.frequency.value = 480;
    body1.gain.value = 4;
    body1.Q.value = 1.2;
    const body2 = ctx.createBiquadFilter();
    body2.type = 'peaking';
    body2.frequency.value = 2800;
    body2.gain.value = 5;
    body2.Q.value = 1.4;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    const g = ctx.createGain();
    const peak = vel * 0.15;
    g.gain.setValueAtTime(0, t);
    const rise = legato ? 0.09 : 0.06;
    g.gain.linearRampToValueAtTime(peak, t + rise);
    g.gain.setTargetAtTime(peak * 0.85, t + rise, 0.3);
    for (const o of oscs) o.connect(body1);
    body1.connect(body2).connect(lp).connect(g).connect(dest);
    const lfo = this.vibratoLfo(oscs, t + 0.12, 5.8, 16);
    this.noiseBurst(dest, t, 3000, 1.2, vel * (legato ? 0.012 : 0.05), 0.04);
    for (const o of oscs) o.start(t);
    return {
      release: (at) => {
        fadeOut(g.gain, at, 0.1);
        for (const o of oscs) o.stop(at + 0.8);
        lfo.stop(at + 0.8);
      },
    };
  }

  private organ(dest: AudioNode, t: number, midi: number, vel: number, legato = false): SustainHandle {
    const ctx = this.ctx;
    if (!this.organWave) {
      // Drawbars: 8′, 4′, 2⅔′, 2′, 1⅗′, 1⅓′, 1′.
      const real = new Float32Array(9);
      const imag = new Float32Array([0, 1, 0.75, 0.45, 0.5, 0.2, 0.25, 0, 0.18]);
      this.organWave = ctx.createPeriodicWave(real, imag);
    }
    const f = midiToFreq(midi);
    const o = ctx.createOscillator();
    o.setPeriodicWave(this.organWave);
    o.frequency.value = f;
    const g = ctx.createGain();
    const peak = vel * 0.09;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + (legato ? 0.03 : 0.015));
    o.connect(g).connect(dest);
    if (!legato) this.noiseBurst(dest, t, Math.min(8000, f * 3), 3, vel * 0.04, 0.02);
    o.start(t);
    return {
      release: (at) => {
        fadeOut(g.gain, at, 0.06);
        o.stop(at + 0.5);
      },
    };
  }

  private flute(dest: AudioNode, t: number, midi: number, vel: number, legato = false): SustainHandle {
    const ctx = this.ctx;
    const f = midiToFreq(midi);
    const o1 = ctx.createOscillator();
    o1.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = f * 2;
    const o2g = ctx.createGain();
    o2g.gain.value = 0.12;
    o2.connect(o2g);
    const breath = ctx.createBufferSource();
    breath.buffer = this.noise;
    breath.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = 8;
    const bg = ctx.createGain();
    bg.gain.value = 0.35;
    breath.connect(bp).connect(bg);
    const g = ctx.createGain();
    const peak = vel * 0.2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(legato ? peak : peak * 1.15, t + (legato ? 0.07 : 0.05));
    g.gain.setTargetAtTime(peak, t + 0.07, 0.1);
    o1.connect(g);
    o2g.connect(g);
    bg.connect(g);
    g.connect(dest);
    const lfo = this.vibratoLfo([o1, o2], t + 0.2, 5, 10);
    o1.start(t);
    o2.start(t);
    breath.start(t, Math.random() * 0.5);
    return {
      release: (at) => {
        fadeOut(g.gain, at, 0.08);
        for (const n of [o1, o2, breath, lfo]) n.stop(at + 0.7);
      },
    };
  }

  /** Trumpet (bright) or horn (dark and round). */
  private brassVoice(dest: AudioNode, t: number, midi: number, vel: number, horn: boolean, legato = false): SustainHandle {
    const ctx = this.ctx;
    const f = midiToFreq(midi);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'square';
    for (const o of [o1, o2]) {
      o.frequency.value = f;
      o.detune.setValueAtTime(legato ? -8 : -45, t);
      o.detune.linearRampToValueAtTime(0, t + 0.05);
    }
    const mix = ctx.createGain();
    mix.gain.value = 0.25;
    o2.connect(mix);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = horn ? 0.7 : 1.5;
    const bright = horn ? 3 : legato ? 4.5 : 7;
    lp.frequency.setValueAtTime(f * 1.2, t);
    lp.frequency.linearRampToValueAtTime(Math.min(9000, f * bright), t + (horn ? 0.09 : 0.05));
    lp.frequency.setTargetAtTime(Math.min(7000, f * (horn ? 2.2 : 4)), t + 0.1, 0.12);
    const g = ctx.createGain();
    const peak = vel * (horn ? 0.14 : 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + (horn ? 0.06 : legato ? 0.05 : 0.025));
    g.gain.setTargetAtTime(peak * 0.75, t + 0.08, 0.15);
    o1.connect(lp);
    mix.connect(lp);
    lp.connect(g).connect(dest);
    for (const o of [o1, o2]) o.start(t);
    return {
      release: (at) => {
        fadeOut(g.gain, at, 0.07);
        for (const o of [o1, o2]) o.stop(at + 0.6);
      },
    };
  }

  // ─── The orchestra ──────────────────────────────────────────────────────

  keys(kind: KeysKind, dest: AudioNode, t: number, midi: number, dur: number, vel: number) {
    switch (kind) {
      case 'harpsichord':
        this.playBuffer('harpsichord', dest, t, midi, vel * 0.6).damp(t + dur);
        break;
      case 'piano':
        this.playBuffer('piano', dest, t, midi, vel * 0.55).damp(t + dur + 0.05);
        break;
      case 'harp':
        this.playBuffer('harp', dest, t, midi, vel * 0.6).damp(t + dur * 1.5 + DAMPING.harp.ring);
        break;
      case 'organ':
        this.organ(dest, t, midi, vel * 0.8).release(t + dur);
        break;
      case 'strings':
        this.strings(dest, t, midi, dur, vel * 1.1, true);
        break;
    }
  }

  /** A single harpsichord note (menus, count-in flourishes). */
  harpsichord(dest: AudioNode, t: number, midi: number, dur: number, vel: number) {
    this.keys('harpsichord', dest, t, midi, dur, vel);
  }

  brass(dest: AudioNode, t: number, midi: number, dur: number, vel: number, horn: boolean) {
    this.brassVoice(dest, t, midi, vel, horn).release(t + dur);
  }

  cello(dest: AudioNode, t: number, midi: number, dur: number, vel: number) {
    const ctx = this.ctx;
    const f = midiToFreq(midi);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'square';
    o1.frequency.value = f;
    o2.frequency.value = f;
    o2.detune.value = -5;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500 + f * 3;
    lp.Q.value = 0.8;
    const mix = ctx.createGain();
    mix.gain.value = 0.35;
    o2.connect(mix);
    const g = ctx.createGain();
    const peak = vel * 0.1;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.035);
    g.gain.setTargetAtTime(peak * 0.7, t + 0.035, 0.2);
    g.gain.setTargetAtTime(0, t + dur, 0.06);
    o1.connect(lp);
    mix.connect(lp);
    lp.connect(g).connect(dest);
    const end = t + dur + 0.4;
    if (dur > 0.4) this.vibratoLfo([o1, o2], t + 0.25, 5, 6).stop(end);
    for (const o of [o1, o2]) {
      o.start(t);
      o.stop(end);
    }
  }

  strings(dest: AudioNode, t: number, midi: number, dur: number, vel: number, pulse: boolean) {
    const ctx = this.ctx;
    const f = midiToFreq(midi);
    const oscs = [-7, 7].map((cents) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = cents;
      return o;
    });
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(7000, 1400 + f * 3);
    lp.Q.value = 0.5;
    const g = ctx.createGain();
    const peak = vel * (pulse ? 0.085 : 0.07);
    const attack = pulse ? 0.012 : 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    if (!pulse) g.gain.setTargetAtTime(peak * 0.8, t + attack, 0.4);
    g.gain.setTargetAtTime(0, t + dur, pulse ? 0.03 : 0.12);
    for (const o of oscs) o.connect(lp);
    lp.connect(g).connect(dest);
    const end = t + dur + (pulse ? 0.25 : 0.8);
    if (!pulse) this.vibratoLfo(oscs, t + 0.15, 5.3, 7).stop(end);
    for (const o of oscs) {
      o.start(t);
      o.stop(end);
    }
  }

  timpani(dest: AudioNode, t: number, midi: number, vel: number) {
    const ctx = this.ctx;
    const f = midiToFreq(midi);
    const partials: [number, number, number][] = [
      [1, 0.2, 0.45],
      [1.5, 0.08, 0.25],
      [1.98, 0.045, 0.18],
    ];
    for (const [ratio, amp, decay] of partials) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(f * ratio * 1.1, t);
      o.frequency.exponentialRampToValueAtTime(f * ratio, t + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel * amp, t + 0.004);
      g.gain.setTargetAtTime(0, t + 0.01, decay);
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + decay * 7);
    }
    this.noiseBurst(dest, t, 350, 1, vel * 0.14, 0.03);
  }

  // ─── Effects ────────────────────────────────────────────────────────────

  /** A fumbled, muffled string: the sound of a missed note. */
  fumble(dest: AudioNode, t: number, midi: number, vel = 0.5) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.buffer('guitar', midi);
    src.playbackRate.value = 0.965;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 650;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.5, t);
    g.gain.setTargetAtTime(0, t + 0.03, 0.06);
    src.connect(lp).connect(g).connect(dest);
    src.start(t);
    src.stop(t + 0.6);
    this.noiseBurst(dest, t, 180, 0.9, vel * 0.25, 0.04);
  }

  /** The conductor's cane striking the stage floor: our count-in. */
  cane(dest: AudioNode, t: number, accent: boolean) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(accent ? 120 : 95, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(accent ? 0.7 : 0.5, t);
    g.gain.setTargetAtTime(0, t + 0.005, 0.05);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.4);
    this.noiseBurst(dest, t, 1800, 2, accent ? 0.35 : 0.22, 0.015);
  }

  /** A soft UI tick: a single harpsichord note. */
  tick(dest: AudioNode, midi: number, vel = 0.5) {
    this.harpsichord(dest, this.ctx.currentTime + 0.005, midi, 0.25, vel);
  }

  private noiseBurst(dest: AudioNode, t: number, freq: number, q: number, vel: number, decay: number) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.setTargetAtTime(0, t + 0.002, decay);
    src.connect(bp).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + decay * 8);
  }

  /** A delayed vibrato on the given oscillators; the caller stops the returned LFO. */
  private vibratoLfo(oscs: OscillatorNode[], from: number, rate: number, cents: number): OscillatorNode {
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = rate;
    const depth = this.ctx.createGain();
    depth.gain.setValueAtTime(0, from);
    depth.gain.linearRampToValueAtTime(cents, from + 0.3);
    lfo.connect(depth);
    for (const o of oscs) depth.connect(o.detune);
    lfo.start(from);
    return lfo;
  }
}

/** Render one tone of a buffered instrument. */
function render(kind: BufferKind, midi: number): Float32Array {
  const sr = BUFFER_RATE;
  const f = midiToFreq(midi);
  const damp = Math.min(0.5, Math.max(0.08, 0.5 - (midi - 48) * 0.012));
  const ks = (freq: number, seconds: number, p: Omit<PluckParams, 'damp'>, d = damp) => karplus(sr, freq, seconds, { ...p, damp: d });
  switch (kind) {
    case 'sitar': {
      const data = ks(f, 3.5, { t60: 4.5, brightness: 0.75, pluckPos: 0.08, buzz: 0.3 });
      // Sympathetic strings bloom an octave above just after the pluck.
      const sym = ks(f * 2, 3.5, { t60: 5, brightness: 0.5, pluckPos: 0.3, buzz: 0.15 });
      for (let i = 0; i < data.length; i++) data[i] = data[i] * 0.85 + sym[i] * 0.16 * (1 - Math.exp(-i / sr / 0.12));
      return data;
    }
    case 'harpsichord': {
      const t60 = Math.min(4, Math.max(1.1, 4.4 - (midi - 40) * 0.07));
      const data = ks(f, Math.min(3, t60), { t60, brightness: 0.92, pluckPos: 0.12, buzz: 0 });
      if (midi < 90) {
        // The 4′ register: a second string an octave up.
        const oct = ks(f * 2, Math.min(3, t60), { t60: t60 * 0.7, brightness: 0.9, pluckPos: 0.15, buzz: 0 }, damp * 0.8);
        for (let i = 0; i < data.length; i++) data[i] = data[i] * 0.8 + oct[i] * 0.28;
      }
      return data;
    }
    case 'guitar':
      return ks(f, 3, { t60: 2.6, brightness: 0.45, pluckPos: 0.18, buzz: 0 }, Math.min(0.5, damp + 0.1));
    case 'harp':
      return ks(f, 4, { t60: 4.5, brightness: 0.55, pluckPos: 0.4, buzz: 0 });
    case 'piano':
      return pianoTone(sr, midi, 4);
  }
}

/** The tones a lead or keys instrument needs pre-rendered (none for oscillator voices). */
export function bufferKindFor(kind: LeadKind | KeysKind): BufferKind | null {
  return kind === 'sitar' || kind === 'harpsichord' || kind === 'piano' || kind === 'guitar' || kind === 'harp' ? kind : null;
}
