import { LAYER_IDS, type LayerId } from '../music/arrange';
import { Voices } from './voices';

/** Audio routing for one performance; torn down wholesale when it ends. */
export interface Session {
  out: GainNode;
  lead: GainNode;
  leadFilter: BiquadFilterNode;
  layers: Record<LayerId, GainNode>;
  sfx: GainNode;
  /** Fumbles and ghost notes, separately adjustable. */
  misses: GainNode;
  dispose(fade?: number): void;
}

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly voices: Voices;
  readonly master: GainNode;
  readonly ui: GainNode;
  private readonly reverbIn: GainNode;
  private lastHeard = 0;
  /** Level of miss and fumble sounds (0 mutes them). */
  sfxLevel = 1;

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    this.voices = new Voices(this.ctx);

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    this.master = this.ctx.createGain();
    this.master.connect(comp).connect(this.ctx.destination);

    const reverb = this.ctx.createConvolver();
    reverb.buffer = hallImpulse(this.ctx, 2.6);
    this.reverbIn = this.ctx.createGain();
    const wet = this.ctx.createGain();
    wet.gain.value = 0.32;
    this.reverbIn.connect(reverb).connect(wet).connect(this.master);

    this.ui = this.ctx.createGain();
    this.ui.gain.value = 0.6;
    this.ui.connect(this.master);
    this.ui.connect(this.reverbIn);
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  async unlock() {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  /**
   * The context time of the sample reaching the listener's ears right now.
   * Anything scheduled at context time X is heard when this returns X.
   */
  heardTime(): number {
    const ctx = this.ctx;
    let t: number;
    const ts = ctx.getOutputTimestamp?.();
    if (ctx.state === 'running' && ts?.contextTime !== undefined && ts.performanceTime) {
      t = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
    } else {
      t = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
    }
    t = Math.min(t, ctx.currentTime);
    this.lastHeard = Math.max(this.lastHeard, t);
    return this.lastHeard;
  }

  /** heardTime() at the moment of a DOM event (performance.now() timestamp). */
  heardTimeAt(perfMs: number): number {
    const lag = Math.max(0, (performance.now() - perfMs) / 1000);
    return this.heardTime() - Math.min(lag, 0.25);
  }

  createSession(): Session {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.connect(this.master);
    const send = ctx.createGain();
    send.gain.value = 0.9;
    out.connect(send).connect(this.reverbIn);

    const leadFilter = ctx.createBiquadFilter();
    leadFilter.type = 'lowpass';
    leadFilter.frequency.value = 12000;
    leadFilter.Q.value = 0.4;
    const lead = ctx.createGain();
    lead.connect(leadFilter).connect(out);

    const layers = {} as Record<LayerId, GainNode>;
    for (const id of LAYER_IDS) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(out);
      layers[id] = g;
    }
    const sfx = ctx.createGain();
    sfx.connect(out);
    const misses = ctx.createGain();
    misses.gain.value = this.sfxLevel;
    misses.connect(out);

    return {
      out,
      lead,
      leadFilter,
      layers,
      sfx,
      misses,
      dispose: (fade = 0.4) => {
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.setTargetAtTime(0, now, fade / 4);
        setTimeout(() => {
          out.disconnect();
          send.disconnect();
        }, fade * 1000 + 300);
      },
    };
  }
}

/** A synthetic concert-hall impulse: early reflections, then a darkening diffuse tail. */
function hallImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  const reflections = [0.011, 0.019, 0.027, 0.036, 0.049, 0.061, 0.078];
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    const predelay = Math.floor(sr * 0.018);
    for (let i = predelay; i < len; i++) {
      const x = (i - predelay) / (len - predelay);
      const coeff = 0.85 - 0.7 * x; // high frequencies die first
      lp += coeff * (Math.random() * 2 - 1 - lp);
      d[i] = lp * Math.pow(1 - x, 3.2) * 0.6;
    }
    reflections.forEach((r, k) => {
      const i = Math.floor(sr * (r + (ch ? 0.0031 * k : 0)));
      if (i < len) d[i] += (k % 2 ? -1 : 1) * 0.5 * Math.pow(0.8, k);
    });
  }
  return buf;
}
