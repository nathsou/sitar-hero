import type { Game } from '../game/game';
import type { ChartNote } from '../music/chart';
import type { Camera } from './camera';
import { flame } from './hall';
import { GEMS, GOLD } from './palette';
import type { Sprites } from './sprites';

const FAR = 1.02;
const NEAR = -0.26;
const RIBBON_SAMPLES = 30;

const BAR_LINE = Array.from({ length: 11 }, (_, i) => `rgba(243,210,122,${(0.55 * i) / 10})`);
const BEAT_LINE = Array.from({ length: 11 }, (_, i) => `rgba(243,210,122,${(0.14 * i) / 10})`);
const LANE_BEAM = GEMS.map((g) => [`${g.glow}0.32)`, `${g.glow}0)`]);

/** Everything that moves on the runway. Draws without allocating per frame. */
export class Stage {
  sprites: Sprites;
  private readonly visible: ChartNote[] = [];
  // Reusable ribbon outline buffers: left edge, right edge, and the bright core.
  private readonly lx = new Float32Array(RIBBON_SAMPLES + 1);
  private readonly ly = new Float32Array(RIBBON_SAMPLES + 1);
  private readonly rx = new Float32Array(RIBBON_SAMPLES + 1);
  private readonly ry = new Float32Array(RIBBON_SAMPLES + 1);
  private readonly clx = new Float32Array(RIBBON_SAMPLES + 1);
  private readonly crx = new Float32Array(RIBBON_SAMPLES + 1);
  private readonly candelabraD = new Float32Array(64);

  constructor(
    private readonly cam: Camera,
    sprites: Sprites,
  ) {
    this.sprites = sprites;
  }

  laneX(lane: number) {
    return lane - 1.5;
  }

  ringX(lane: number) {
    return this.cam.x(lane - 1.5, 0);
  }

  get ringY() {
    return this.cam.hitY;
  }

  draw(g: CanvasRenderingContext2D, game: Game, approach: number, time: number, light: number) {
    const t = game.now;
    this.drawBeats(g, game, t, approach, time, light);
    this.drawBeams(g, game, t);
    this.drawRings(g, game, t);
    this.drawNotes(g, game, t, approach, time);
  }

  private drawBeats(g: CanvasRenderingContext2D, game: Game, t: number, A: number, time: number, light: number) {
    const c = this.cam;
    const { def, tempo } = game.song;
    const pulse = def.pulse;
    const j0 = Math.floor((tempo.toBeat(t + NEAR * A) - def.pickup) / pulse) - 1;
    const j1 = Math.ceil((tempo.toBeat(t + FAR * A) - def.pickup) / pulse) + 1;
    const pulsesPerBar = Math.round(def.beatsPerBar / pulse);
    let candelabras = 0;
    for (let j = j1; j >= j0; j--) {
      const d = (tempo.toSec(def.pickup + j * pulse) - t) / A;
      if (d < NEAR || d > FAR) continue;
      const bar = ((j % pulsesPerBar) + pulsesPerBar) % pulsesPerBar === 0;
      const s = c.s(d);
      const fade = Math.min(10, Math.max(0, Math.round(((FAR - d) / 0.15) * 10)));
      const y = c.y(0, d);
      g.beginPath();
      g.moveTo(c.x(-2.02, d), y);
      g.lineTo(c.x(2.02, d), y);
      g.lineWidth = Math.max(1, (bar ? 3 : 1.2) * s);
      g.strokeStyle = bar ? BAR_LINE[fade] : BEAT_LINE[fade];
      g.stroke();
      if (bar) {
        // Embroidered lozenges on the seams.
        g.fillStyle = BAR_LINE[Math.min(10, Math.round(fade * 1.1))];
        const r = 5 * s;
        for (let X = -1; X <= 1; X++) {
          const x = c.x(X, d);
          g.beginPath();
          g.moveTo(x, y - r * 0.6);
          g.lineTo(x + r, y);
          g.lineTo(x, y + r * 0.6);
          g.lineTo(x - r, y);
          g.closePath();
          g.fill();
        }
        if (candelabras < this.candelabraD.length) this.candelabraD[candelabras++] = d;
      }
    }
    for (let i = 0; i < candelabras; i++) {
      this.candelabra(g, -2.5, this.candelabraD[i], time, light);
      this.candelabra(g, 2.5, this.candelabraD[i], time, light);
    }
  }

  private candelabra(g: CanvasRenderingContext2D, X: number, d: number, time: number, light: number) {
    const c = this.cam;
    const fade = Math.min(1, (FAR - d) / 0.15, (d - NEAR) / 0.1);
    if (fade <= 0) return;
    const bx = c.x(X, d);
    const by = c.y(0, d);
    const ty = c.y(0.42, d);
    const w = c.laneW * c.s(d);
    g.globalAlpha = fade;
    g.strokeStyle = GOLD.mid;
    g.lineWidth = Math.max(1, w * 0.035);
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx, ty);
    g.moveTo(bx - w * 0.22, ty - w * 0.02);
    g.quadraticCurveTo(bx, ty + w * 0.16, bx + w * 0.22, ty - w * 0.02);
    g.stroke();
    g.beginPath();
    g.ellipse(bx, by, w * 0.1, w * 0.035, 0, 0, Math.PI * 2);
    g.fillStyle = GOLD.deep;
    g.fill();
    for (let k = -1; k <= 1; k++) {
      const cx = bx + k * 0.22 * w;
      const cy = ty - w * (k === 0 ? 0.12 : 0.05);
      g.globalAlpha = fade;
      g.fillStyle = '#f4ecd8';
      g.fillRect(cx - w * 0.02, cy - w * 0.09, w * 0.04, w * 0.09);
      flame(g, cx, cy - w * 0.1, w * 0.07, time + X + d * 7 + k, (0.4 + 0.6 * light) * fade);
    }
    g.globalAlpha = 1;
  }

  private drawBeams(g: CanvasRenderingContext2D, game: Game, t: number) {
    const c = this.cam;
    const top = 0.45;
    const y0 = c.hitY;
    const y2 = c.y(0, top);
    g.globalCompositeOperation = 'lighter';
    for (let lane = 0; lane < 4; lane++) {
      const since = t - game.lanePressedAt[lane];
      const strength = game.lanesDown[lane] ? 1 : Math.max(0, 1 - since * 6);
      if (strength <= 0) continue;
      const X0 = lane - 2 + 0.08;
      const X1 = lane - 2 + 0.92;
      const grad = g.createLinearGradient(0, y0, 0, y2);
      grad.addColorStop(0, LANE_BEAM[lane][0]);
      grad.addColorStop(1, LANE_BEAM[lane][1]);
      g.globalAlpha = strength;
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(c.x(X0, 0), y0);
      g.lineTo(c.x(X1, 0), y0);
      g.lineTo(c.x(X1, top), y2);
      g.lineTo(c.x(X0, top), y2);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  private drawRings(g: CanvasRenderingContext2D, game: Game, t: number) {
    const size = this.cam.laneW * 0.98;
    const y = this.cam.hitY;
    for (let lane = 0; lane < 4; lane++) {
      const x = this.ringX(lane);
      const down = game.lanesDown[lane];
      const since = t - game.lanePressedAt[lane];
      const squash = down ? 0.93 : 1 - Math.max(0, 0.07 - since * 0.3);
      const sw = size * squash;
      const sh = sw * 0.56;
      g.drawImage(down ? this.sprites.ringsPressed[lane] : this.sprites.rings[lane], x - sw / 2, y - sh / 2, sw, sh);
    }
  }

  private drawNotes(g: CanvasRenderingContext2D, game: Game, t: number, A: number, time: number) {
    const notes = game.chart.notes;
    const tMin = t + NEAR * A;
    const tMax = t + FAR * A;
    // Binary search for the first note that could still be visible (ribbons last at most ~8 s).
    let lo = 0;
    let hi = notes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (notes[mid].time < tMin - 8) lo = mid + 1;
      else hi = mid;
    }
    const visible = this.visible;
    visible.length = 0;
    for (let i = lo; i < notes.length && notes[i].time <= tMax; i++) if (notes[i].end >= tMin) visible.push(notes[i]);

    for (let i = visible.length - 1; i >= 0; i--) if (visible[i].hold) this.drawRibbon(g, visible[i], t, A, time);
    // Gold links between the two jewels of a double-stop.
    for (let i = visible.length - 1; i >= 0; i--) {
      const n = visible[i];
      if (n.harmony && n.chordWith && n.state === 'pending' && n.chordWith.state === 'pending') this.drawLink(g, n, n.chordWith, (n.time - t) / A);
    }
    for (let i = visible.length - 1; i >= 0; i--) {
      const n = visible[i];
      if (n.state === 'hit') continue;
      this.drawGem(g, n, (n.time - t) / A, game.brokenPhrases.has(n.phrase));
    }
  }

  private drawLink(g: CanvasRenderingContext2D, a: ChartNote, b: ChartNote, d: number) {
    if (d > FAR || d < NEAR) return;
    const c = this.cam;
    const s = c.s(d);
    const y = c.y(0, d) - c.laneW * 0.1 * s;
    g.globalAlpha = Math.min(1, (FAR - d) / 0.1);
    g.strokeStyle = GOLD.light;
    g.lineWidth = Math.max(1.5, 6 * s);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(c.x(this.laneX(a.lane), d), y);
    g.lineTo(c.x(this.laneX(b.lane), d), y);
    g.stroke();
    g.lineCap = 'butt';
    g.globalAlpha = 1;
  }

  private drawGem(g: CanvasRenderingContext2D, n: ChartNote, d: number, broken: boolean) {
    if (d > FAR || d < NEAR) return;
    const c = this.cam;
    const s = c.s(d);
    const size = c.laneW * (n.harmony ? 0.74 : 0.84) * s;
    const x = c.x(this.laneX(n.lane), d);
    const y = c.y(0, d);
    const h = size * 0.64;
    const fade = Math.min(1, (FAR - d) / 0.1);
    g.globalAlpha = n.state === 'missed' ? 0.3 * fade : fade;
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(x, y + size * 0.05, size * 0.4, size * 0.14, 0, 0, Math.PI * 2);
    g.fill();
    const sprite = n.gilded && !broken ? this.sprites.gilded[n.lane] : this.sprites.gems[n.lane];
    g.drawImage(sprite, x - size / 2, y - h / 2 - size * 0.1, size, h);
    g.globalAlpha = 1;
  }

  private drawRibbon(g: CanvasRenderingContext2D, n: ChartNote, t: number, A: number, time: number) {
    if (n.holdDone) return;
    const c = this.cam;
    const head = n.holding ? t : n.time;
    const d0 = Math.max(NEAR, (head - t) / A);
    const d1 = Math.min(FAR, (n.end - t) / A);
    if (d1 <= d0) return;
    const col = GEMS[n.lane];
    const dead = n.holdDropped || n.state === 'missed';
    const amp = n.holding ? 0.13 : dead ? 0.03 : 0.08;
    const half = n.holding ? 0.2 : 0.16;
    const base = this.laneX(n.lane);
    const { lx, ly, rx, ry, clx, crx } = this;
    for (let k = 0; k <= RIBBON_SAMPLES; k++) {
      const d = d0 + ((d1 - d0) * k) / RIBBON_SAMPLES;
      const X = base + Math.sin(d * 24 - time * 6 + n.id) * amp;
      const w = half * (1 + 0.18 * Math.sin(d * 40 - time * 4));
      const y = c.y(0, d);
      lx[k] = c.x(X - w, d);
      rx[k] = c.x(X + w, d);
      clx[k] = c.x(X - w * 0.3, d);
      crx[k] = c.x(X + w * 0.3, d);
      ly[k] = ry[k] = y;
    }
    const outline = (left: Float32Array, right: Float32Array) => {
      g.beginPath();
      g.moveTo(left[0], ly[0]);
      for (let k = 1; k <= RIBBON_SAMPLES; k++) g.lineTo(left[k], ly[k]);
      for (let k = RIBBON_SAMPLES; k >= 0; k--) g.lineTo(right[k], ry[k]);
      g.closePath();
    };
    const fade = Math.min(1, (FAR - d0) / 0.1);
    g.globalAlpha = (dead ? 0.28 : 0.92) * fade;
    outline(lx, rx);
    g.fillStyle = dead ? '#6d6068' : n.holding ? col.light : col.base;
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = dead ? '#3a3036' : col.dark;
    g.stroke();
    outline(clx, crx);
    g.fillStyle = dead ? 'rgba(200,190,195,0.25)' : 'rgba(255,255,255,0.45)';
    g.fill();
    if (n.holding) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.35 + 0.15 * Math.sin(time * 20);
      outline(lx, rx);
      g.fillStyle = `${col.glow}0.6)`;
      g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = 1;

    // A gold knot at the ribbon's end.
    const kr = c.laneW * c.s(d1) * 0.09;
    g.beginPath();
    g.ellipse(c.x(base, d1), c.y(0, d1), kr * 1.3, kr * 0.8, 0, 0, Math.PI * 2);
    g.fillStyle = dead ? '#6d6068' : GOLD.light;
    g.fill();
  }
}
