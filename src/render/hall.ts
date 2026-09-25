import type { Camera } from './camera';
import { GOLD, goldGradient } from './palette';

type Pt = [number, number];

export function path(g: CanvasRenderingContext2D, pts: Pt[]) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}

interface Sconce {
  x: number;
  y: number;
  s: number;
}

interface Firework {
  x: number;
  y: number;
  t: number;
  color: string;
  size: number;
}

interface Bounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * The Hall of Mirrors: a long gilded gallery drawn once per resize into an
 * offscreen canvas, plus the living parts (candles, fireworks, mirror glints)
 * painted every frame.
 */
export class Hall {
  private readonly bg = document.createElement('canvas');
  private windowBounds: Bounds[] = [];
  private windowClip: Path2D | null = null;
  private mirrorPaths: Path2D[] = [];
  private mirrorBounds: Bounds[] = [];
  private sconces: Sconce[] = [];
  private readonly fireworks: Firework[] = Array.from({ length: 12 }, () => ({ x: 0, y: 0, t: -99, color: '#fff', size: 0 }));
  private nextFirework = 0;

  constructor(private readonly cam: Camera) {}

  resize(dpr: number) {
    const { W, H } = this.cam;
    this.bg.width = Math.round(W * dpr);
    this.bg.height = Math.round(H * dpr);
    const g = this.bg.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.windowBounds = [];
    this.windowClip = new Path2D();
    this.mirrorPaths = [];
    this.mirrorBounds = [];
    this.sconces = [];
    this.paintBackWall(g);
    this.paintSideWall(g, -1);
    this.paintSideWall(g, 1);
    this.paintFloor(g);
    this.paintRunway(g);
    this.paintDrapes(g);
  }

  // ─── Static painting ────────────────────────────────────────────────────

  private paintBackWall(g: CanvasRenderingContext2D) {
    const c = this.cam;
    const d = c.backD;
    const X = c.roomX;
    const wall: Pt[] = [c.p(-X, 0, d), c.p(X, 0, d), c.p(X, 4, d), c.p(-X, 4, d)];
    path(g, wall);
    const wg = g.createLinearGradient(0, wall[2][1], 0, wall[0][1]);
    wg.addColorStop(0, '#2c0c14');
    wg.addColorStop(1, '#5a1c28');
    g.fillStyle = wg;
    g.fill();

    // The great doorway at the end of the runway, glowing with candlelight beyond.
    const pts: Pt[] = [c.p(-1.5, 0, d), c.p(1.5, 0, d)];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      pts.push(c.p(1.5 * Math.cos(a), 1.75 + 0.55 * Math.sin(a), d));
    }
    path(g, pts);
    const [bx, by] = c.p(0, 0.2, d);
    const glow = g.createRadialGradient(bx, by, 2, bx, by, (by - pts[14][1]) * 1.2);
    glow.addColorStop(0, '#fff0c2');
    glow.addColorStop(0.35, '#f2b25a');
    glow.addColorStop(0.75, '#8a3d1c');
    glow.addColorStop(1, '#3a140c');
    g.fillStyle = glow;
    g.fill();
    g.lineWidth = Math.max(2, c.laneW * 0.05);
    g.strokeStyle = goldGradient(g, pts[0][0], pts[14][1], pts[1][0], pts[0][1]);
    g.stroke();

    // The Sun King's emblem in the lunette.
    const [sx, sy] = c.p(0, 1.95, d);
    const sr = c.laneW * c.s(d) * 0.34;
    g.save();
    g.translate(sx, sy);
    for (let i = 0; i < 16; i++) {
      g.rotate(Math.PI / 8);
      g.beginPath();
      g.moveTo(-sr * 0.12, 0);
      g.lineTo(0, -sr * (i % 2 ? 1.5 : 2));
      g.lineTo(sr * 0.12, 0);
      g.fillStyle = i % 2 ? GOLD.mid : GOLD.light;
      g.fill();
    }
    g.beginPath();
    g.arc(0, 0, sr, 0, Math.PI * 2);
    g.fillStyle = goldGradient(g, -sr, -sr, sr, sr);
    g.fill();
    g.restore();

    // Pilasters flanking the door.
    for (const px of [-2.4, 2.4, -4.2, 4.2]) this.pilasterFront(g, px, d);
  }

  private pilasterFront(g: CanvasRenderingContext2D, X: number, d: number) {
    const c = this.cam;
    const w = 0.28;
    const q: Pt[] = [c.p(X - w, 0, d), c.p(X + w, 0, d), c.p(X + w, 4, d), c.p(X - w, 4, d)];
    path(g, q);
    const pg = g.createLinearGradient(q[0][0], 0, q[1][0], 0);
    pg.addColorStop(0, '#5e2430');
    pg.addColorStop(0.5, '#8d3f48');
    pg.addColorStop(1, '#4a1a24');
    g.fillStyle = pg;
    g.fill();
    const cap: Pt[] = [c.p(X - w * 1.3, 2.1, d), c.p(X + w * 1.3, 2.1, d), c.p(X + w * 1.3, 2.35, d), c.p(X - w * 1.3, 2.35, d)];
    path(g, cap);
    g.fillStyle = goldGradient(g, cap[0][0], cap[2][1], cap[1][0], cap[0][1]);
    g.fill();
  }

  private paintSideWall(g: CanvasRenderingContext2D, side: -1 | 1) {
    const c = this.cam;
    const X = side * c.roomX;
    const near = c.nearD;
    const far = c.backD;
    const P = (h: number, d: number) => c.p(X, h, d);

    const wall: Pt[] = [P(0, near), P(0, far), P(4, far), P(4, near)];
    path(g, wall);
    const wg = g.createLinearGradient(wall[0][0], 0, wall[1][0], 0);
    wg.addColorStop(0, '#1e070d');
    wg.addColorStop(1, '#4a1621');
    g.fillStyle = wg;
    g.fill();

    // Wainscot of green marble with a gilded rail.
    const wain: Pt[] = [P(0, near), P(0, far), P(0.32, far), P(0.32, near)];
    path(g, wain);
    g.fillStyle = '#16241f';
    g.fill();
    g.beginPath();
    g.moveTo(...P(0.32, near));
    g.lineTo(...P(0.32, far));
    g.lineWidth = 3;
    g.strokeStyle = GOLD.deep;
    g.stroke();

    const bay = 0.24;
    for (let b = far; b - bay > near - bay; b -= bay) {
      const dA = b - bay;
      const dB = b;
      this.archedOpening(g, X, side, dA + 0.035, dB - 0.035);
      this.pilasterSide(g, X, dB);
      if (dB < far - 0.01) {
        const [sx, sy] = P(1.3, dB);
        this.sconces.push({ x: sx + side * -2, y: sy, s: c.s(dB) });
      }
    }

    // Gilded entablature along the top.
    const ent: Pt[] = [P(2.3, near), P(2.3, far), P(2.6, far), P(2.6, near)];
    path(g, ent);
    g.fillStyle = goldGradient(g, 0, ent[1][1], 0, ent[0][1]);
    g.fill();
  }

  private pilasterSide(g: CanvasRenderingContext2D, X: number, d: number) {
    const c = this.cam;
    const w = 0.022;
    const q: Pt[] = [c.p(X, 0, d - w), c.p(X, 0, d + w), c.p(X, 2.3, d + w), c.p(X, 2.3, d - w)];
    path(g, q);
    g.fillStyle = '#7a3440';
    g.fill();
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(243,210,122,0.35)';
    g.stroke();
    const cap: Pt[] = [c.p(X, 2.02, d - w * 1.5), c.p(X, 2.02, d + w * 1.5), c.p(X, 2.3, d + w * 1.5), c.p(X, 2.3, d - w * 1.5)];
    path(g, cap);
    g.fillStyle = GOLD.mid;
    g.fill();
  }

  private archedOpening(g: CanvasRenderingContext2D, X: number, side: -1 | 1, dA: number, dB: number) {
    const c = this.cam;
    const P = (h: number, d: number) => c.p(X, h, d);
    const dm = (dA + dB) / 2;
    const rd = (dB - dA) / 2;
    const pts: Pt[] = [P(0.42, dA), P(0.42, dB)];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      pts.push(P(1.7 + 0.38 * Math.sin(a), dm + rd * Math.cos(a)));
    }
    const top = Math.min(...pts.map((p) => p[1]));
    const bottom = Math.max(...pts.map((p) => p[1]));

    g.save();
    path(g, pts);
    g.clip();
    if (side < 0) {
      // Window onto the night garden.
      this.windowBounds.push(bounds(pts));
      toPath(pts, this.windowClip!);
      const sky = g.createLinearGradient(0, top, 0, bottom);
      sky.addColorStop(0, '#070d24');
      sky.addColorStop(0.7, '#17244f');
      sky.addColorStop(1, '#2c2a4a');
      g.fillStyle = sky;
      g.fill();
      const xs = pts.map((p) => p[0]);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs);
      for (let i = 0; i < 26; i++) {
        const sx = x0 + Math.random() * (x1 - x0);
        const sy = top + Math.random() * (bottom - top) * 0.75;
        g.fillStyle = `rgba(255,250,230,${0.3 + Math.random() * 0.6})`;
        g.fillRect(sx, sy, 1.3, 1.3);
      }
    } else {
      // A mirror of many panes, catching the candlelight.
      this.mirrorPaths.push(toPath(pts));
      this.mirrorBounds.push(bounds(pts));
      const m = g.createLinearGradient(0, top, 0, bottom);
      m.addColorStop(0, '#3b3342');
      m.addColorStop(0.5, '#8a7560');
      m.addColorStop(1, '#4a3a33');
      g.fillStyle = m;
      g.fill();
    }
    // Glazing bars / pane joins.
    g.strokeStyle = side < 0 ? 'rgba(40,28,20,0.9)' : 'rgba(243,210,122,0.35)';
    g.lineWidth = Math.max(1, c.s(dm) * 2.5);
    for (const h of [0.75, 1.1, 1.45, 1.8]) {
      g.beginPath();
      g.moveTo(...P(h, dA));
      g.lineTo(...P(h, dB));
      g.stroke();
    }
    for (const f of [1 / 3, 2 / 3]) {
      g.beginPath();
      g.moveTo(...P(0.42, dA + (dB - dA) * f));
      g.lineTo(...P(2.1, dA + (dB - dA) * f));
      g.stroke();
    }
    g.restore();

    path(g, pts);
    g.lineWidth = Math.max(1.5, c.s(dm) * 5);
    g.strokeStyle = goldGradient(g, 0, top, 0, bottom);
    g.stroke();
  }

  private paintFloor(g: CanvasRenderingContext2D) {
    const c = this.cam;
    const cols = 10;
    const w = (2 * c.roomX) / cols;
    const dStep = 0.09;
    let row = 0;
    for (let d = c.nearD; d < c.backD - 1e-6; d += dStep, row++) {
      const d2 = Math.min(c.backD, d + dStep);
      const fog = Math.min(1, Math.max(0, d / c.backD));
      for (let i = 0; i < cols; i++) {
        const X0 = -c.roomX + i * w;
        path(g, [c.p(X0, 0, d), c.p(X0 + w, 0, d), c.p(X0 + w, 0, d2), c.p(X0, 0, d2)]);
        const light = (i + row) % 2 === 0;
        const base = light ? [96, 86, 74] : [26, 19, 20];
        const f = 0.55 + 0.45 * fog;
        g.fillStyle = `rgb(${Math.round(base[0] * f)},${Math.round(base[1] * f)},${Math.round(base[2] * f)})`;
        g.fill();
      }
    }
  }

  private paintRunway(g: CanvasRenderingContext2D) {
    const c = this.cam;
    const near = c.nearD;
    const far = 1.02;
    const carpet: Pt[] = [c.p(-2.22, 0, near), c.p(2.22, 0, near), c.p(2.22, 0, far), c.p(-2.22, 0, far)];
    path(g, carpet);
    const cg = g.createLinearGradient(0, carpet[2][1], 0, carpet[0][1]);
    cg.addColorStop(0, '#3a1120');
    cg.addColorStop(0.4, '#240912');
    cg.addColorStop(1, '#16050b');
    g.fillStyle = cg;
    g.fill();

    // Alternate lanes of slightly different velvet nap.
    for (let lane = 0; lane < 4; lane++) {
      if (lane % 2) continue;
      const X0 = lane - 2;
      path(g, [c.p(X0, 0, near), c.p(X0 + 1, 0, near), c.p(X0 + 1, 0, far), c.p(X0, 0, far)]);
      g.fillStyle = 'rgba(255,220,230,0.025)';
      g.fill();
    }

    // Gold braid borders.
    for (const side of [-1, 1]) {
      const a = side * 2.02;
      const b = side * 2.22;
      const q: Pt[] = [c.p(a, 0, near), c.p(b, 0, near), c.p(b, 0, far), c.p(a, 0, far)];
      path(g, q);
      g.fillStyle = goldGradient(g, q[0][0], 0, q[1][0], 0);
      g.fill();
    }

    // Faint lane seams.
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(243,210,122,0.13)';
    for (const X of [-1, 0, 1]) {
      g.beginPath();
      g.moveTo(...c.p(X, 0, near));
      g.lineTo(...c.p(X, 0, far));
      g.stroke();
    }
  }

  private paintDrapes(g: CanvasRenderingContext2D) {
    const { W, H } = this.cam;
    const dw = Math.max(26, W * 0.055);
    // Side curtains.
    for (const side of [0, 1]) {
      const x0 = side ? W - dw : 0;
      const cg = g.createLinearGradient(x0, 0, x0 + dw, 0);
      const folds = 5;
      for (let i = 0; i <= folds; i++) {
        cg.addColorStop(i / folds, i % 2 ? '#7a0f22' : '#3a0610');
      }
      g.fillStyle = cg;
      g.beginPath();
      if (side) {
        g.moveTo(W, 0);
        g.lineTo(W - dw, 0);
        g.quadraticCurveTo(W - dw * 0.55, H * 0.5, W - dw * 1.15, H);
        g.lineTo(W, H);
      } else {
        g.moveTo(0, 0);
        g.lineTo(dw, 0);
        g.quadraticCurveTo(dw * 0.55, H * 0.5, dw * 1.15, H);
        g.lineTo(0, H);
      }
      g.fill();
      // Tasselled tie-back.
      const tx = side ? W - dw * 0.7 : dw * 0.7;
      const ty = H * 0.55;
      g.beginPath();
      g.ellipse(tx, ty, dw * 0.45, dw * 0.12, 0, 0, Math.PI * 2);
      g.fillStyle = goldGradient(g, tx - dw * 0.4, ty - 5, tx + dw * 0.4, ty + 5);
      g.fill();
      g.beginPath();
      g.moveTo(tx - dw * 0.1, ty);
      g.lineTo(tx - dw * 0.18, ty + dw * 0.7);
      g.lineTo(tx + dw * 0.18, ty + dw * 0.7);
      g.lineTo(tx + dw * 0.1, ty);
      g.fillStyle = GOLD.mid;
      g.fill();
    }

    // Scalloped valance across the top, with a gold fringe.
    const vh = Math.max(22, H * 0.045);
    const swags = Math.max(4, Math.round(W / 220));
    const sw = W / swags;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W, 0);
    g.lineTo(W, vh * 0.5);
    for (let i = swags - 1; i >= 0; i--) {
      g.quadraticCurveTo(i * sw + sw / 2, vh * 1.7, i * sw, vh * 0.5);
    }
    g.closePath();
    const vg = g.createLinearGradient(0, 0, 0, vh * 1.3);
    vg.addColorStop(0, '#2a040b');
    vg.addColorStop(1, '#8a1428');
    g.fillStyle = vg;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = GOLD.mid;
    g.stroke();
    for (let i = 0; i < swags; i++) {
      g.beginPath();
      g.arc(i * sw, vh * 0.55, 5, 0, Math.PI * 2);
      g.fillStyle = GOLD.light;
      g.fill();
    }
  }

  // ─── Per-frame ──────────────────────────────────────────────────────────

  /**
   * @param light 0 (a single guttering candle) … 1 (every candle ablaze)
   * @param beatPulse 1 on the beat, decaying to 0
   * @param festive fireworks outside while the trumpets play
   */
  draw(g: CanvasRenderingContext2D, time: number, light: number, beatPulse: number, festive: boolean) {
    const { W, H } = this.cam;
    g.drawImage(this.bg, 0, 0, W, H);

    if (festive) this.launchFireworks(time);
    this.drawFireworks(g, time);
    this.drawMirrorGlints(g, time, light);

    // Candlelit darkness: the room brightens as the ensemble grows.
    g.globalAlpha = 0.64 * (1 - light);
    g.fillStyle = '#060209';
    g.fillRect(0, 0, W, H);

    // Warm light spilling from the doorway, swelling on the beat.
    const x = this.cam.cx;
    const y = this.cam.y(0.6, this.cam.backD);
    const r = this.cam.laneW * (2.2 + light * 1.6 + beatPulse * 0.4);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = Math.min(1, 0.36 + 0.4 * light + 0.24 * beatPulse);
    g.drawImage(glowSprite(), x - r, y - r, r * 2, r * 2);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    for (const s of this.sconces) this.sconce(g, s, time, light);
  }

  private sconce(g: CanvasRenderingContext2D, s: Sconce, time: number, light: number) {
    const size = this.cam.laneW * s.s * 0.55;
    if (size < 2) return;
    g.strokeStyle = GOLD.mid;
    g.lineWidth = Math.max(1, size * 0.08);
    g.beginPath();
    g.moveTo(s.x - size * 0.5, s.y);
    g.quadraticCurveTo(s.x, s.y + size * 0.5, s.x + size * 0.5, s.y);
    g.stroke();
    flame(g, s.x - size * 0.5, s.y - size * 0.25, size * 0.5, time + s.x * 0.01 - 0.5, 0.35 + 0.65 * light);
    flame(g, s.x + size * 0.5, s.y - size * 0.25, size * 0.5, time + s.x * 0.01 + 0.5, 0.35 + 0.65 * light);
  }

  private drawMirrorGlints(g: CanvasRenderingContext2D, time: number, light: number) {
    if (!this.mirrorPaths.length) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = Math.min(1, 0.5 + 0.8 * light);
    const sprite = glintSprite();
    for (let i = 0; i < this.mirrorPaths.length; i++) {
      const b = this.mirrorBounds[i];
      const phase = (time * 0.12 + i * 0.37) % 1.6;
      const gx = b.x0 + (b.x1 - b.x0) * (phase - 0.3);
      g.save();
      g.clip(this.mirrorPaths[i]);
      g.drawImage(sprite, gx - 30, b.y0, 60, b.y1 - b.y0);
      g.restore();
    }
    g.restore();
  }

  private launchFireworks(time: number) {
    if (time < this.nextFirework || !this.windowBounds.length) return;
    this.nextFirework = time + 0.25 + Math.random() * 0.5;
    const b = this.windowBounds[(Math.random() * this.windowBounds.length) | 0];
    // Reuse the oldest slot rather than allocating.
    let slot = this.fireworks[0];
    for (const f of this.fireworks) if (f.t < slot.t) slot = f;
    slot.x = b.x0 + Math.random() * (b.x1 - b.x0);
    slot.y = b.y0 + Math.random() * (b.y1 - b.y0) * 0.6;
    slot.size = (b.x1 - b.x0) * (0.35 + Math.random() * 0.4);
    slot.color = FIREWORK_COLORS[(Math.random() * FIREWORK_COLORS.length) | 0];
    slot.t = time;
  }

  private drawFireworks(g: CanvasRenderingContext2D, time: number) {
    let any = false;
    for (const f of this.fireworks) if (time - f.t < 1.6) any = true;
    if (!any || !this.windowClip) return;
    g.save();
    g.clip(this.windowClip);
    g.globalCompositeOperation = 'lighter';
    for (const f of this.fireworks) {
      const age = time - f.t;
      if (age >= 1.6) continue;
      const r = f.size * Math.sqrt(age / 1.6);
      g.globalAlpha = Math.max(0, 1 - age / 1.6);
      g.fillStyle = f.color;
      const drop = age * age * 12;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        g.fillRect(f.x + Math.cos(a) * r - 1.2, f.y + Math.sin(a) * r + drop - 1.2, 2.4, 2.4);
      }
    }
    g.restore();
  }
}

const FIREWORK_COLORS = ['#ffd27a', '#ff7a95', '#8fc2ff', '#9ff0b0', '#fff1b8'];

function bounds(pts: Pt[]) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1 };
}

function toPath(pts: Pt[], into = new Path2D()): Path2D {
  pts.forEach(([x, y], i) => (i ? into.lineTo(x, y) : into.moveTo(x, y)));
  into.closePath();
  return into;
}

let haloCanvas: HTMLCanvasElement | null = null;
let glowCanvas: HTMLCanvasElement | null = null;
let glintCanvas: HTMLCanvasElement | null = null;

function radialSprite(size: number, stops: [number, string][]): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/** Soft orange halo around a candle flame, drawn once and reused. */
function haloSprite() {
  return (haloCanvas ??= radialSprite(64, [[0, 'rgba(255,190,90,1)'], [1, 'rgba(255,160,60,0)']]));
}

/** Warm glow from the doorway. */
function glowSprite() {
  return (glowCanvas ??= radialSprite(128, [[0, 'rgba(255,214,140,0.5)'], [1, 'rgba(255,180,90,0)']]));
}

/** A vertical band of light for the mirror glints. */
function glintSprite() {
  if (glintCanvas) return glintCanvas;
  const c = (glintCanvas = document.createElement('canvas'));
  c.width = 64;
  c.height = 4;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 64, 0);
  grad.addColorStop(0, 'rgba(255,240,200,0)');
  grad.addColorStop(0.5, 'rgba(255,240,200,0.16)');
  grad.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 4);
  return c;
}

const FLAME_FILLS = Array.from({ length: 11 }, (_, i) => `rgba(255,${Math.round(200 + 4 * i)},140,${0.5 + 0.05 * i})`);

/** A candle flame with a soft halo. Allocation-free: sprites and fill styles are cached. */
export function flame(g: CanvasRenderingContext2D, x: number, y: number, size: number, time: number, intensity: number) {
  const flick = 1 + Math.sin(time * 13.1) * 0.06 + Math.sin(time * 7.3 + 1.3) * 0.08;
  const h = size * flick;
  const r = size * 2.6;
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = 0.35 * intensity;
  g.drawImage(haloSprite(), x - r, y - r, r * 2, r * 2);
  g.globalAlpha = 1;
  g.beginPath();
  g.moveTo(x, y - h);
  g.quadraticCurveTo(x + size * 0.32, y - h * 0.2, x, y + size * 0.1);
  g.quadraticCurveTo(x - size * 0.32, y - h * 0.2, x, y - h);
  g.fillStyle = FLAME_FILLS[Math.max(0, Math.min(10, Math.round(intensity * 10)))];
  g.fill();
  g.globalCompositeOperation = 'source-over';
}
