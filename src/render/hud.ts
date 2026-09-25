import { TIER_THRESHOLDS, TIMING_HISTORY, type Game } from '../game/game';
import { layerNames } from '../music/arrange';
import type { SongDef } from '../music/types';
import type { Camera } from './camera';
import { flame } from './hall';
import { GOLD, SERIF, goldGradient } from './palette';

/** What the popup under the rings announces. */
export type Callout = 'perfect' | 'great' | 'good' | 'miss' | 'early' | 'late';

interface Popup {
  kind: Callout;
  offsetMs: number;
  t0: number;
}

interface Banner {
  text: string;
  sub?: string;
  t0: number;
  dur: number;
  tone: 'gold' | 'muted' | 'grand' | 'red';
}

const CALLOUT_TEXT: Record<Callout, string> = {
  perfect: 'Magnifique!',
  great: 'Bravo!',
  good: 'Passable',
  miss: 'Faux pas',
  early: 'Trop tôt!',
  late: 'Trop tard!',
};
const CALLOUT_COLOR: Record<Exclude<Callout, 'perfect'>, string> = {
  great: '#d6e6ff',
  good: '#e7b88f',
  miss: '#c65a6c',
  early: '#9fc4ff',
  late: '#f0a86a',
};
const EARLY = '#9fc4ff';
const LATE = '#f0a86a';

const COUNT_WORDS = ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six'];

export class Hud {
  private popup: Popup | null = null;
  private banners: Banner[] = [];
  private count: { word: string; t0: number } | null = null;
  private names: string[] = [];
  private readonly frames = new Map<string, HTMLCanvasElement>();
  private dpr = 1;
  showTimingStrip = true;

  constructor(private readonly cam: Camera) {}

  get u(): number {
    return Math.max(0.62, Math.min(1.15, this.cam.W / 1280, this.cam.H / 780));
  }

  resize(dpr: number) {
    this.dpr = dpr;
    this.frames.clear();
  }

  setSong(def: SongDef | null) {
    this.names = def ? layerNames(def) : [];
  }

  judge(kind: Callout, offsetMs: number, time: number) {
    this.popup = { kind, offsetMs, t0: time };
  }

  banner(text: string, time: number, tone: Banner['tone'] = 'gold', sub?: string, dur = 2.2) {
    this.banners = this.banners.filter((b) => time - b.t0 < 0.4);
    this.banners.push({ text, sub, t0: time, dur, tone });
  }

  countIn(beat: number, perBar: number, time: number) {
    this.count = { word: COUNT_WORDS[beat % perBar] ?? '', t0: time };
  }

  reset() {
    this.popup = null;
    this.banners = [];
    this.count = null;
  }

  draw(g: CanvasRenderingContext2D, game: Game, time: number) {
    const u = this.u;
    const { W } = this.cam;
    const top = Math.max(26, this.cam.H * 0.045) + 12 * u;
    this.drawScore(g, game, 18 * u + W * 0.04, top, u);
    if (W >= 900) this.drawEnsemble(g, game, 18 * u + W * 0.04, top + 118 * u, u, time);
    this.drawFavor(g, game, W - W * 0.04 - 18 * u, top, u, time);
    this.drawSeal(g, game, u);
    this.drawProgress(g, game, u, top);
    if (this.showTimingStrip) this.drawTimingStrip(g, game, u);
    this.drawPopup(g, time, u);
    this.drawCount(g, time, u);
    this.drawBanners(g, time, u);
  }

  // ─── Panels ─────────────────────────────────────────────────────────────

  /** Ornate panel background, rendered once per size and reused. */
  private frame(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, u: number) {
    const key = `${Math.round(w)}x${Math.round(h)}`;
    let sprite = this.frames.get(key);
    if (!sprite) {
      sprite = document.createElement('canvas');
      const pad = 2;
      sprite.width = Math.ceil((w + pad * 2) * this.dpr);
      sprite.height = Math.ceil((h + pad * 2) * this.dpr);
      const f = sprite.getContext('2d')!;
      f.scale(this.dpr, this.dpr);
      f.translate(pad, pad);
      roundRect(f, 0, 0, w, h, 10 * u);
      f.fillStyle = 'rgba(22,6,12,0.88)';
      f.fill();
      f.lineWidth = 2;
      f.strokeStyle = goldGradient(f, 0, 0, w, h);
      f.stroke();
      roundRect(f, 4 * u, 4 * u, w - 8 * u, h - 8 * u, 7 * u);
      f.lineWidth = 1;
      f.strokeStyle = 'rgba(243,210,122,0.35)';
      f.stroke();
      f.strokeStyle = GOLD.light;
      f.lineWidth = 1.5;
      for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]]) {
        f.beginPath();
        f.arc(cx + sx * 9 * u, cy + sy * 9 * u, 5 * u, 0, Math.PI * 2);
        f.stroke();
      }
      this.frames.set(key, sprite);
    }
    g.drawImage(sprite, x - 2, y - 2, sprite.width / this.dpr, sprite.height / this.dpr);
  }

  private drawScore(g: CanvasRenderingContext2D, game: Game, x: number, y: number, u: number) {
    const w = 240 * u;
    const h = 96 * u;
    this.frame(g, x, y, w, h, u);
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.font = `600 ${11 * u}px ${SERIF}`;
    g.fillStyle = GOLD.mid;
    spaced(g, 'SCORE', x + w / 2, y + 24 * u, 3 * u);
    g.font = `700 ${36 * u}px ${SERIF}`;
    g.fillStyle = GOLD.light;
    g.fillText(Math.round(game.score).toLocaleString('en-GB'), x + w / 2, y + 62 * u);
    g.font = `italic ${14 * u}px ${SERIF}`;
    g.fillStyle = 'rgba(243,210,122,0.8)';
    g.fillText(`Streak ${game.streak}   ·   Best ${game.maxStreak}`, x + w / 2, y + 84 * u);
  }

  private drawEnsemble(g: CanvasRenderingContext2D, game: Game, x: number, y: number, u: number, time: number) {
    const w = 240 * u;
    const row = 24 * u;
    const h = 40 * u + row * 5;
    this.frame(g, x, y, w, h, u);
    g.textAlign = 'left';
    g.font = `italic 600 ${14 * u}px ${SERIF}`;
    g.fillStyle = GOLD.light;
    g.fillText('The Ensemble', x + 16 * u, y + 24 * u);
    const eff = game.effectiveTier;
    for (let i = 0; i < this.names.length; i++) {
      const ry = y + 34 * u + row * i + row * 0.62;
      const on = i <= eff;
      g.fillStyle = on ? '#f4ecd8' : 'rgba(244,236,216,0.3)';
      g.fillRect(x + 20 * u, ry - 9 * u, 4 * u, 11 * u);
      if (on) flame(g, x + 22 * u, ry - 11 * u, 6 * u, time + i, 1);
      g.font = `${on ? '600 ' : ''}${14 * u}px ${SERIF}`;
      g.fillStyle = on ? GOLD.light : 'rgba(243,210,122,0.32)';
      g.fillText(this.names[i], x + 36 * u, ry);
      // Progress toward the next instrument.
      if (i === game.tier + 1 && !game.fortActive) {
        const lo = TIER_THRESHOLDS[game.tier];
        const hi = TIER_THRESHOLDS[i];
        const p = Math.max(0, Math.min(1, (game.energy - lo) / (hi - lo)));
        const bx = x + 140 * u;
        const bw = 80 * u;
        g.fillStyle = 'rgba(243,210,122,0.15)';
        g.fillRect(bx, ry - 6 * u, bw, 4 * u);
        g.fillStyle = GOLD.mid;
        g.fillRect(bx, ry - 6 * u, bw * p, 4 * u);
      }
    }
  }

  private drawFavor(g: CanvasRenderingContext2D, game: Game, right: number, y: number, u: number, time: number) {
    const w = 270 * u;
    const h = 128 * u;
    const x = right - w;
    this.frame(g, x, y, w, h, u);
    const f = game.favor;

    // The patron's cameo; he fidgets when displeased.
    const unease = Math.max(0, 0.35 - f) / 0.35;
    g.save();
    g.translate(x + 44 * u, y + 50 * u);
    g.rotate(Math.sin(time * 18) * 0.12 * unease);
    cameo(g, 26 * u, 33 * u, f);
    g.restore();

    g.textAlign = 'left';
    g.font = `italic 600 ${14 * u}px ${SERIF}`;
    g.fillStyle = GOLD.light;
    g.fillText('The Count’s Favour', x + 84 * u, y + 26 * u);
    const bx = x + 84 * u;
    const bw = w - 100 * u;
    const by = y + 36 * u;
    const bh = 10 * u;
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(bx, by, bw, bh);
    g.fillStyle = f < 0.25 ? '#b3243a' : f < 0.5 ? '#d98a2b' : f < 0.8 ? GOLD.light : '#9fe0a8';
    g.fillRect(bx, by, bw * f, bh);
    g.strokeStyle = GOLD.deep;
    g.lineWidth = 1;
    g.strokeRect(bx, by, bw, bh);
    g.font = `italic ${12 * u}px ${SERIF}`;
    g.fillStyle = 'rgba(243,210,122,0.75)';
    const mood = f > 0.85 ? 'is enchanted' : f > 0.6 ? 'is pleased' : f > 0.35 ? 'grows restless…' : f > 0.15 ? 'glances at his watch…' : 'reaches for his hat!';
    g.fillText(`His Excellency ${mood}`, bx, by + 26 * u);

    // Fortissimo gauge.
    const fy = y + 84 * u;
    g.font = `600 ${11 * u}px ${SERIF}`;
    g.fillStyle = game.fortActive ? GOLD.bright : GOLD.mid;
    spaced(g, 'FORTISSIMO', bx, fy, 2 * u, 'left');
    const gy = fy + 8 * u;
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(bx, gy, bw, 9 * u);
    g.globalAlpha = 0.75 + (game.fortActive ? 0.25 + 0.25 * Math.sin(time * 12) : 0);
    g.fillStyle = GOLD.light;
    g.fillRect(bx, gy, bw * game.fortGauge, 9 * u);
    g.globalAlpha = 1;
    g.strokeStyle = GOLD.deep;
    g.strokeRect(bx, gy, bw, 9 * u);
    g.fillStyle = 'rgba(243,210,122,0.6)';
    g.fillRect(bx + bw / 2 - 0.5, gy - 2 * u, 1, 13 * u);
    if (game.fortGauge >= 0.5 && !game.fortActive) {
      g.font = `italic 700 ${12 * u}px ${SERIF}`;
      g.globalAlpha = 0.6 + 0.4 * Math.sin(time * 6);
      g.fillStyle = GOLD.bright;
      g.textAlign = 'right';
      g.fillText('Press SPACE', bx + bw, fy);
      g.globalAlpha = 1;
    }
  }

  private drawSeal(g: CanvasRenderingContext2D, game: Game, u: number) {
    const c = this.cam;
    const r = 30 * u;
    const x = Math.max(r * 1.45 + 4, c.x(-2.2, 0) - r * 1.9);
    const y = c.hitY - r * 0.3;
    const fort = game.fortActive;
    // Irregular wax blob.
    g.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const rr = r * (1.08 + 0.07 * Math.sin(a * 5 + 1) + 0.04 * Math.sin(a * 9));
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fillStyle = fort ? GOLD.mid : '#8e1020';
    g.fill();
    g.beginPath();
    g.arc(x, y, r * 0.78, 0, Math.PI * 2);
    g.fillStyle = fort ? GOLD.deep : '#6b0a18';
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = fort ? GOLD.bright : '#b3243a';
    g.stroke();
    g.beginPath();
    g.arc(x, y, r * 1.3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * game.multiplierProgress);
    g.lineWidth = 3 * u;
    g.strokeStyle = GOLD.light;
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `italic 700 ${24 * u}px ${SERIF}`;
    g.fillStyle = '#fbe9d0';
    g.fillText(`×${game.multiplier}`, x, y + 1);
    g.textBaseline = 'alphabetic';
    if (game.streak >= 5) {
      g.font = `700 ${18 * u}px ${SERIF}`;
      g.fillStyle = GOLD.light;
      g.fillText(String(game.streak), x, y + r * 1.9);
      g.font = `italic ${11 * u}px ${SERIF}`;
      g.fillStyle = 'rgba(243,210,122,0.7)';
      g.fillText('in a row', x, y + r * 1.9 + 14 * u);
    }
  }

  private drawProgress(g: CanvasRenderingContext2D, game: Game, u: number, top: number) {
    const { cx, W } = this.cam;
    // On narrow screens the side panels meet in the middle: use a slim bar along the very top.
    const narrow = W < 760;
    const w = narrow ? W - 24 : Math.min(W * 0.3, 360 * u);
    const x = cx - w / 2;
    const y = narrow ? 5 : top + 30 * u;
    if (!narrow) {
      g.textAlign = 'center';
      g.font = `italic ${15 * u}px ${SERIF}`;
      g.fillStyle = 'rgba(243,210,122,0.85)';
      g.fillText(`${game.song.def.title} · ${game.song.def.composer}`, cx, y - 10 * u);
    }
    g.fillStyle = 'rgba(243,210,122,0.18)';
    g.fillRect(x, y, w, 2);
    const p = Math.max(0, Math.min(1, game.now / game.endTime));
    g.fillStyle = GOLD.light;
    g.fillRect(x, y, w * p, 2);
    g.beginPath();
    g.arc(x + w * p, y + 1, 3.5 * u, 0, Math.PI * 2);
    g.fill();
  }

  /** A hit-error bar under the rings: where your recent strikes landed, early (left) to late (right). */
  private drawTimingStrip(g: CanvasRenderingContext2D, game: Game, u: number) {
    const c = this.cam;
    const w = Math.min(c.laneW * 2.6, 300 * u);
    const h = 8 * u;
    const x = c.cx - w / 2;
    const y = Math.min(c.H - 22 * u, c.hitY + c.laneW * 0.98);
    const win = game.windows;
    const scale = w / 2 / win.good;
    g.globalAlpha = 0.85;
    g.fillStyle = 'rgba(20,6,12,0.7)';
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = 'rgba(231,184,143,0.35)';
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(160,190,255,0.4)';
    g.fillRect(c.cx - win.great * scale, y, win.great * scale * 2, h);
    g.fillStyle = 'rgba(243,210,122,0.6)';
    g.fillRect(c.cx - win.perfect * scale, y, win.perfect * scale * 2, h);
    g.fillStyle = '#fff1b8';
    g.fillRect(c.cx - 0.75, y - 3 * u, 1.5, h + 6 * u);

    // Recent strikes fade over three seconds; the arrow marks their average.
    let sum = 0;
    let n = 0;
    for (let i = 0; i < TIMING_HISTORY; i++) {
      const age = game.now - game.recentAt[i];
      if (age < 0 || age > 3) continue;
      const off = game.recentOffsets[i];
      const px = c.cx + Math.max(-1, Math.min(1, off / win.good)) * (w / 2);
      g.globalAlpha = 1 - age / 3;
      g.fillStyle = off < 0 ? EARLY : LATE;
      g.fillRect(px - 1, y - 2 * u, 2, h + 4 * u);
      sum += off;
      n++;
    }
    if (n >= 3) {
      const mx = c.cx + Math.max(-1, Math.min(1, sum / n / win.good)) * (w / 2);
      g.globalAlpha = 1;
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(mx, y - 3 * u);
      g.lineTo(mx - 4 * u, y - 9 * u);
      g.lineTo(mx + 4 * u, y - 9 * u);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 0.6;
    g.font = `italic ${10 * u}px ${SERIF}`;
    g.fillStyle = EARLY;
    g.textAlign = 'right';
    g.fillText('early', x - 6, y + h);
    g.fillStyle = LATE;
    g.textAlign = 'left';
    g.fillText('late', x + w + 6, y + h);
    g.globalAlpha = 1;
  }

  // ─── Transient text ─────────────────────────────────────────────────────

  private drawPopup(g: CanvasRenderingContext2D, time: number, u: number) {
    const p = this.popup;
    if (!p) return;
    const age = time - p.t0;
    if (age > 0.75) {
      this.popup = null;
      return;
    }
    const c = this.cam;
    const pop = age < 0.1 ? 1.35 - age * 3.5 : 1;
    const bad = p.kind === 'miss' || p.kind === 'early' || p.kind === 'late';
    // Just below the rings, where only departed jewels pass.
    const y = c.hitY + c.laneW * 0.58 + (bad ? age * 30 : -age * 10);
    g.save();
    g.globalAlpha = age > 0.45 ? 1 - (age - 0.45) / 0.3 : 1;
    g.translate(c.cx, y);
    g.scale(pop, pop);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `italic 700 ${(bad ? 24 : 30) * u}px ${SERIF}`;
    g.lineWidth = 5 * u;
    g.strokeStyle = 'rgba(20,4,10,0.75)';
    const text = CALLOUT_TEXT[p.kind];
    g.strokeText(text, 0, 0);
    g.fillStyle = p.kind === 'perfect' ? GOLD.light : CALLOUT_COLOR[p.kind];
    g.fillText(text, 0, 0);
    if (p.kind === 'great' || p.kind === 'good') {
      const early = p.offsetMs < 0;
      g.font = `italic 700 ${13 * u}px ${SERIF}`;
      g.fillStyle = early ? EARLY : LATE;
      g.fillText(`${early ? 'early' : 'late'} · ${Math.abs(Math.round(p.offsetMs))} ms`, 0, 21 * u);
    }
    g.restore();
  }

  private drawCount(g: CanvasRenderingContext2D, time: number, u: number) {
    const c = this.count;
    if (!c) return;
    const age = time - c.t0;
    if (age > 0.7) return;
    g.save();
    g.globalAlpha = 1 - age / 0.7;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `italic 700 ${(64 + age * 30) * u}px ${SERIF}`;
    g.fillStyle = GOLD.light;
    g.fillText(c.word, this.cam.cx, this.cam.H * 0.48);
    g.restore();
  }

  private drawBanners(g: CanvasRenderingContext2D, time: number, u: number) {
    if (!this.banners.length) return;
    this.banners = this.banners.filter((b) => time - b.t0 < b.dur);
    const c = this.cam;
    for (const b of this.banners) {
      const age = time - b.t0;
      const alpha = Math.min(1, age / 0.2, (b.dur - age) / 0.5);
      const grand = b.tone === 'grand';
      const size = (grand ? 54 : 34) * u * (age < 0.2 ? 0.85 + age * 0.75 : 1);
      const y = c.H * (grand ? 0.42 : 0.22);
      g.save();
      g.globalAlpha = Math.max(0, alpha);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `italic 700 ${size}px ${SERIF}`;
      const tw = g.measureText(b.text).width;
      g.lineWidth = 6 * u;
      g.strokeStyle = 'rgba(20,4,10,0.8)';
      g.strokeText(b.text, c.cx, y);
      g.fillStyle = b.tone === 'muted' ? 'rgba(220,200,190,0.85)' : b.tone === 'red' ? '#e0566c' : goldGradient(g, 0, y - size / 2, 0, y + size / 2);
      g.fillText(b.text, c.cx, y);
      g.strokeStyle = b.tone === 'muted' ? 'rgba(220,200,190,0.5)' : GOLD.mid;
      g.lineWidth = 1.5;
      for (const s of [-1, 1]) {
        const x0 = c.cx + s * (tw / 2 + 16 * u);
        g.beginPath();
        g.moveTo(x0, y);
        g.bezierCurveTo(x0 + s * 30 * u, y - 10 * u, x0 + s * 50 * u, y + 10 * u, x0 + s * 80 * u, y);
        g.stroke();
      }
      if (b.sub) {
        g.font = `italic ${16 * u}px ${SERIF}`;
        g.fillStyle = 'rgba(243,210,122,0.85)';
        g.fillText(b.sub, c.cx, y + size * 0.75);
      }
      g.restore();
    }
  }
}

/** Letter-spaced small caps. */
function spaced(g: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'center' | 'left' = 'center') {
  let total = spacing * (text.length - 1);
  for (let i = 0; i < text.length; i++) total += g.measureText(text[i]).width;
  let cx = align === 'center' ? x - total / 2 : x;
  const prev = g.textAlign;
  g.textAlign = 'left';
  for (let i = 0; i < text.length; i++) {
    g.fillText(text[i], cx, y);
    cx += g.measureText(text[i]).width + spacing;
  }
  g.textAlign = prev;
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const WIG_CURLS: [number, number, number][] = [
  [-10, -14, 9], [-14, -4, 9], [-15, 7, 9], [-12, 18, 8], [-4, -19, 8], [4, -20, 7], [-6, 26, 7], [-17, 26, 6],
];

/** A shell cameo of a bewigged nobleman, in profile. Blushes gold when delighted. */
export function cameo(g: CanvasRenderingContext2D, rx: number, ry: number, favor: number) {
  g.beginPath();
  g.ellipse(0, 0, rx + 4, ry + 4, 0, 0, Math.PI * 2);
  g.fillStyle = GOLD.mid;
  g.fill();
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = favor > 0.7 ? '#c98a66' : favor < 0.3 ? '#7a3a44' : '#a8645e';
  g.fill();

  g.save();
  g.clip();
  const s = ry / 33;
  g.scale(s, s);
  g.fillStyle = '#f7efe4';
  for (const [cx, cy, r] of WIG_CURLS) {
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
  }
  // Face in profile, looking right.
  g.beginPath();
  g.moveTo(2, -20);
  g.quadraticCurveTo(12, -19, 13, -8);
  g.lineTo(18, -1);
  g.lineTo(13, 2);
  g.quadraticCurveTo(15, 5, 13, 7);
  g.quadraticCurveTo(14, 11, 10, 13);
  g.quadraticCurveTo(6, 15, 3, 14);
  g.lineTo(4, 26);
  g.lineTo(-6, 34);
  g.lineTo(-6, 0);
  g.closePath();
  g.fill();
  g.fillStyle = '#2a0d14';
  g.beginPath();
  g.ellipse(-13, 12, 3, 5, 0.4, 0, Math.PI * 2);
  g.fill();
  // Eye: open and bright when pleased, lidded when bored.
  g.strokeStyle = '#8e4a4a';
  g.lineWidth = 1.4;
  g.beginPath();
  if (favor > 0.4) g.arc(8, -8, 1.8, 0, Math.PI * 2);
  else {
    g.moveTo(6, -8);
    g.lineTo(10, -8);
  }
  g.stroke();
  g.restore();
}
