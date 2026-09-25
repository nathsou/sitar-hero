import type { Game, GameEvent } from '../game/game';
import { joinMessage, layerNames } from '../music/arrange';
import { Camera } from './camera';
import { Hall, flame } from './hall';
import { Hud } from './hud';
import { GEMS, GOLD } from './palette';
import { Particles } from './particles';
import { buildSprites } from './sprites';
import { Stage } from './stage';

interface Seat {
  x: number;
  size: number;
  sprite: HTMLCanvasElement;
  fan: number; // 0 none, ±1 fan side
}

/** Draws the gallery every frame, and the performance when one is running. */
export class Renderer {
  readonly cam = new Camera();
  private readonly g: CanvasRenderingContext2D;
  private readonly hall: Hall;
  private readonly stage: Stage;
  private readonly hud: Hud;
  private readonly particles = new Particles();
  private game: Game | null = null;
  private approach = 1.7;
  private light = 0.3;
  private shake = 0;
  private missFlash = 0;
  private fortFlash = 0;
  private lastFrame = performance.now() / 1000;
  private lastBeat = -1;
  private beatPulse = 0;
  private dpr = 1;
  private seats: Seat[] = [];
  private chandelier: HTMLCanvasElement | null = null;
  private vignetteDark: HTMLCanvasElement | null = null;
  private vignetteRed: HTMLCanvasElement | null = null;
  private vignetteGold: HTMLCanvasElement | null = null;
  private reduced = false;
  /** Menu mood: how bright the idle hall is. */
  idleLight = 0.35;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext('2d', { alpha: false })!;
    this.hall = new Hall(this.cam);
    this.stage = new Stage(this.cam, buildSprites(null));
    this.hud = new Hud(this.cam);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Apply display options: ring labels (null hides them), timing strip, reduced effects. */
  configure(opts: { labels: readonly string[] | null; timingStrip: boolean; reduced: boolean }) {
    this.stage.sprites = buildSprites(opts.labels);
    this.hud.showTimingStrip = opts.timingStrip;
    this.reduced = opts.reduced;
    this.particles.reduced = opts.reduced;
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.dpr = dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.canvas.style.width = `${W}px`;
    this.canvas.style.height = `${H}px`;
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cam.resize(W, H);
    this.hall.resize(dpr);
    this.hud.resize(dpr);
    this.buildSeats();
    this.chandelier = this.buildChandelier();
    this.vignetteDark = this.buildVignette('rgba(0,0,0,0.45)', 0.55);
    this.vignetteRed = this.buildVignette('rgba(120,10,30,0.8)', 0.55);
    this.vignetteGold = this.buildVignette('rgba(255,210,120,0.7)', 0.3);
  }

  attach(game: Game | null, approach = 1.7) {
    this.game = game;
    this.approach = approach;
    this.hud.reset();
    this.hud.setSong(game?.song.def ?? null);
    this.lastBeat = -1;
    this.particles.clear();
    game?.on((e) => this.onEvent(game, e));
  }

  /** Map a screen x at the ring line to a lane (for touch play). */
  laneAt(x: number): number {
    const X = (x - this.cam.cx) / this.cam.laneW;
    return Math.max(0, Math.min(3, Math.floor(X + 2)));
  }

  private get now() {
    return performance.now() / 1000;
  }

  private onEvent(game: Game, e: GameEvent) {
    const time = this.now;
    const u = this.hud.u;
    const ringY = this.stage.ringY;
    switch (e.type) {
      case 'hit':
        this.particles.burst(this.stage.ringX(e.note.lane), ringY, GEMS[e.note.lane].light, u, e.judgment === 'perfect');
        if (!e.note.harmony) this.hud.judge(e.judgment, e.note.offset * 1000, time);
        break;
      case 'miss':
        this.particles.smoke(this.stage.ringX(e.note.lane), ringY, u);
        this.hud.judge(e.early ? 'early' : 'miss', e.note.offset * 1000, time);
        if (!this.reduced) this.shake = 0.18;
        this.missFlash = 1;
        break;
      case 'ghost':
        this.particles.smoke(this.stage.ringX(e.lane), ringY, u * 0.5);
        if (e.late) this.hud.judge('late', 0, time);
        break;
      case 'holdDone':
        this.particles.burst(this.stage.ringX(e.note.lane), ringY, GOLD.bright, u * 0.8, true);
        break;
      case 'tier':
        if (e.up) {
          this.hud.banner(joinMessage(game.song.def, e.tier), time, e.tier === 4 ? 'grand' : 'gold');
          this.particles.shower(this.cam.W, 30 + e.tier * 15, e.tier === 4 ? 'confetti' : 'petal');
        } else {
          const name = layerNames(game.song.def)[e.tier + 1].toLowerCase();
          this.hud.banner(`The ${name} fall${name.endsWith('s') ? '' : 's'} silent…`, time, 'muted', undefined, 1.6);
        }
        break;
      case 'streak':
        this.hud.banner(`${e.streak} in a row!`, time, 'gold', e.streak >= 100 ? 'Bravissimo!' : 'Bravo, bravo!');
        this.particles.shower(this.cam.W, 60, 'petal');
        break;
      case 'phrase':
        this.hud.banner('A gilded phrase!', time, 'gold', 'Fortissimo +25%', 1.6);
        break;
      case 'fortissimo':
        if (e.on) {
          this.hud.banner('FORTISSIMO!', time, 'grand', 'Every instrument, double points', 2.4);
          this.fortFlash = 1;
          this.particles.shower(this.cam.W, 120, 'confetti');
        }
        break;
      case 'countin': {
        const def = game.song.def;
        this.hud.countIn(e.beat, def.beatsPerBar <= 2 ? 4 : Math.round(def.beatsPerBar / def.pulse), time);
        break;
      }
      case 'fail':
        this.hud.banner('Dismissed from Court!', time, 'red', 'His Excellency has left the hall', 3);
        break;
      case 'finish':
        this.hud.banner('Fin', time, 'grand', undefined, 3);
        this.particles.shower(this.cam.W, 140, 'petal');
        break;
    }
  }

  frame() {
    const time = this.now;
    const dt = Math.min(0.05, time - this.lastFrame);
    this.lastFrame = time;
    const g = this.g;
    const game = this.game;
    const { W, H } = this.cam;

    // Light follows the ensemble; the hall is dim until the orchestra fills in.
    const target = game ? 0.22 + game.effectiveTier * 0.17 + (game.fortActive ? 0.1 : 0) : this.idleLight;
    this.light += (target - this.light) * Math.min(1, dt * 2.5);

    let beatPos = time * 1.5;
    if (game) {
      beatPos = game.song.tempo.toBeat(Math.max(0, game.now));
      const beat = Math.floor(beatPos);
      if (beat !== this.lastBeat && game.now >= 0) {
        this.lastBeat = beat;
        this.beatPulse = 1;
      }
    }
    this.beatPulse = Math.max(0, this.beatPulse - dt * 4);
    this.shake = Math.max(0, this.shake - dt);
    this.missFlash = Math.max(0, this.missFlash - dt * 3);
    this.fortFlash = Math.max(0, this.fortFlash - dt * 1.5);

    const shaking = this.shake > 0;
    if (shaking) g.setTransform(this.dpr, 0, 0, this.dpr, (Math.random() - 0.5) * 40 * this.shake * this.dpr, (Math.random() - 0.5) * 25 * this.shake * this.dpr);
    g.fillStyle = '#0a0306';
    g.fillRect(-10, -10, W + 20, H + 20);

    const festive = !!game && game.effectiveTier >= 4 && !this.reduced;
    this.hall.draw(g, time, this.light, this.beatPulse, festive);
    this.chandeliers(g, time);

    if (game) {
      game.update();
      this.stage.draw(g, game, this.approach, time, this.light);
      for (let lane = 0; lane < 4; lane++) {
        if (game.holdOf[lane] && Math.random() < 0.7) this.particles.sparkle(this.stage.ringX(lane), this.stage.ringY, GEMS[lane].light, this.hud.u);
      }
    }
    this.audience(g, time, game, beatPos);
    this.particles.update(dt);
    this.particles.draw(g);
    this.vignette(g, game, time);
    if (game) this.hud.draw(g, game, time);
    if (shaking) g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ─── Cached decorations ─────────────────────────────────────────────────

  private offscreen(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * this.dpr));
    c.height = Math.max(1, Math.ceil(h * this.dpr));
    const g = c.getContext('2d')!;
    g.scale(this.dpr, this.dpr);
    return [c, g];
  }

  private buildVignette(edge: string, inner: number): HTMLCanvasElement {
    const { W, H } = this.cam;
    const [c, g] = this.offscreen(W, H);
    const r = Math.hypot(W, H) / 2;
    const grad = g.createRadialGradient(W / 2, H / 2, r * inner, W / 2, H / 2, r);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, edge);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    return c;
  }

  private chandelierSize() {
    return Math.min(this.cam.W * 0.07, this.cam.H * 0.1);
  }

  private buildChandelier(): HTMLCanvasElement {
    const size = this.chandelierSize();
    const w = size * 2.4;
    const h = size * 1.2;
    const [c, g] = this.offscreen(w, h);
    const x = w / 2;
    const y = size * 0.45;
    g.strokeStyle = GOLD.mid;
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(x, y, size, size * 0.28, 0, 0, Math.PI);
    g.stroke();
    g.beginPath();
    g.ellipse(x, y - size * 0.1, size * 0.6, size * 0.18, 0, 0, Math.PI);
    g.stroke();
    g.beginPath();
    g.moveTo(x, y - size * 0.35);
    g.lineTo(x, y + size * 0.45);
    g.stroke();
    g.beginPath();
    g.arc(x, y + size * 0.5, size * 0.07, 0, Math.PI * 2);
    g.fillStyle = GOLD.light;
    g.fill();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (i / 6);
      const cx = x + Math.cos(a) * size * 0.95;
      const cy = y + Math.sin(a) * size * 0.26;
      g.fillStyle = '#f4ecd8';
      g.fillRect(cx - 2, cy - size * 0.16, 4, size * 0.16);
      g.fillStyle = 'rgba(220,235,255,0.55)';
      g.beginPath();
      g.arc(cx, cy + size * 0.09, 2, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }

  private chandeliers(g: CanvasRenderingContext2D, time: number) {
    const { W, H } = this.cam;
    const size = this.chandelierSize();
    const sprite = this.chandelier;
    if (!sprite) return;
    const lit = Math.round(2 + this.light * 5);
    for (const fx of W > 700 ? [0.31, 0.69] : [0.5]) {
      const x = W * fx;
      const y = H * 0.1 + size * 0.3;
      g.strokeStyle = GOLD.deep;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, y - size * 0.3);
      g.stroke();
      g.drawImage(sprite, x - size * 1.2, y - size * 0.45, size * 2.4, size * 1.2);
      for (let i = 0; i < 7; i++) {
        // Candles are lit in a scattered order as the hall brightens.
        if ((i * 3) % 7 >= lit) continue;
        const a = Math.PI * (i / 6);
        flame(g, x + Math.cos(a) * size * 0.95, y + Math.sin(a) * size * 0.26 - size * 0.18, size * 0.1, time * 1.1 + i, 0.5 + 0.5 * this.light);
      }
    }
  }

  /** Pre-render the silhouetted courtiers: heads, towering wigs and shoulders. */
  private buildSeats() {
    const { W, H } = this.cam;
    this.seats = [];
    if (W < 760) return;
    const unit = Math.min(W, H) * 0.07;
    const layout: [number, number][] = [[0.05, 1.05], [0.13, 0.95], [0.21, 1.08], [0.79, 1.08], [0.87, 0.95], [0.95, 1.05]];
    layout.forEach(([fx, sz], i) => {
      const s = unit * sz;
      const w = s * 2.4;
      const h = s * 3;
      const [c, g] = this.offscreen(w, h);
      const x = w / 2;
      const y = h - s * 0.9 - s * 0.2;
      g.fillStyle = '#0b0407';
      g.beginPath();
      g.ellipse(x, h + s * 0.1 - s * 0.2, s * 1.1, s * 0.9, 0, Math.PI, 0);
      g.fill();
      g.beginPath();
      g.arc(x, y, s * 0.42, 0, Math.PI * 2);
      g.fill();
      if (i % 2) {
        g.beginPath();
        g.ellipse(x, y - s * 0.62, s * 0.42, s * 0.62, 0, 0, Math.PI * 2);
        g.fill();
      } else {
        for (const [dx, dy] of [[-0.38, 0.05], [0.38, 0.05], [-0.3, 0.35], [0.3, 0.35], [0, -0.35]]) {
          g.beginPath();
          g.arc(x + dx * s, y + dy * s, s * 0.24, 0, Math.PI * 2);
          g.fill();
        }
      }
      this.seats.push({ x: W * fx, size: s, sprite: c, fan: i === 1 ? 1 : i === 4 ? -1 : 0 });
    });
  }

  /** Silhouetted courtiers in the foreground; they bob along as the music grows. */
  private audience(g: CanvasRenderingContext2D, time: number, game: Game | null, beat: number) {
    if (!this.seats.length) return;
    const { H } = this.cam;
    const energy = game ? game.effectiveTier / 4 : 0.1;
    this.seats.forEach((seat, i) => {
      const s = seat.size;
      const bob = Math.abs(Math.sin(beat * Math.PI + i)) * s * 0.12 * energy;
      const w = s * 2.4;
      const h = s * 3;
      g.drawImage(seat.sprite, seat.x - w / 2, H - h + s * 0.2 - bob, w, h);
      const y = H - s * 0.9 - bob;
      // Rim light from the stage.
      g.globalAlpha = 0.18 + 0.3 * this.light;
      g.strokeStyle = GOLD.light;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(seat.x, y, s * 0.42, Math.PI * 1.1, Math.PI * 1.7);
      g.stroke();
      g.globalAlpha = 1;
      if (seat.fan) {
        // A lady's fan, fluttering when the music is lively.
        const open = 0.6 + 0.35 * Math.sin(time * (4 + energy * 10));
        g.save();
        g.translate(seat.x + seat.fan * s * 0.7, y + s * 0.5);
        g.rotate(-0.5 * seat.fan + Math.sin(time * 9) * 0.08 * energy);
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, s * 0.6, -Math.PI / 2 - open, -Math.PI / 2 + open);
        g.closePath();
        g.fillStyle = '#140810';
        g.fill();
        g.globalAlpha = 0.25 + 0.3 * this.light;
        g.strokeStyle = GOLD.light;
        g.stroke();
        g.restore();
      }
    });
  }

  private vignette(g: CanvasRenderingContext2D, game: Game | null, time: number) {
    const { W, H } = this.cam;
    if (this.vignetteDark) g.drawImage(this.vignetteDark, 0, 0, W, H);
    const danger = game ? Math.max(0, 0.3 - game.favor) / 0.3 : 0;
    const red = Math.max(this.missFlash * 0.5, danger * (0.5 + 0.5 * Math.sin(time * 7)) * 0.45);
    if (red > 0.01 && this.vignetteRed) {
      g.globalAlpha = red;
      g.drawImage(this.vignetteRed, 0, 0, W, H);
      g.globalAlpha = 1;
    }
    const gold = this.fortFlash * 0.5 + (game?.fortActive ? 0.12 + 0.07 * this.beatPulse : 0);
    if (gold > 0.01 && this.vignetteGold) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(1, gold);
      g.drawImage(this.vignetteGold, 0, 0, W, H);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
  }
}
