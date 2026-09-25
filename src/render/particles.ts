const enum Kind {
  Leaf,
  Spark,
  Petal,
  Smoke,
  Ring,
  Confetti,
}

const MAX = 900;
const LEAF_COLORS = ['#fff1b8', '#f3d27a', '#d4a640', '#e8c46a'];
const PETAL_COLORS = ['#f7c6cf', '#f29bb0', '#fde2e4', '#e8768f'];
const CONFETTI_COLORS = ['#d0243e', '#2a5ee0', '#1d9e5c', '#e3a01c', '#fff1b8'];

const pick = <T>(xs: T[]) => xs[(Math.random() * xs.length) | 0];

/**
 * A fixed-size particle pool stored as parallel typed arrays: no per-particle
 * objects, no per-frame allocation. Dead particles are compacted in place.
 */
export class Particles {
  private n = 0;
  private readonly kind = new Uint8Array(MAX);
  private readonly x = new Float32Array(MAX);
  private readonly y = new Float32Array(MAX);
  private readonly vx = new Float32Array(MAX);
  private readonly vy = new Float32Array(MAX);
  private readonly life = new Float32Array(MAX);
  private readonly max = new Float32Array(MAX);
  private readonly size = new Float32Array(MAX);
  private readonly rot = new Float32Array(MAX);
  private readonly vr = new Float32Array(MAX);
  private readonly color: string[] = new Array<string>(MAX).fill('#fff');
  /** Reduced effects: fewer, calmer particles. */
  reduced = false;

  private add(k: Kind, x: number, y: number, vx: number, vy: number, max: number, size: number, rot: number, vr: number, color: string) {
    if (this.n >= MAX) return;
    const i = this.n++;
    this.kind[i] = k;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.life[i] = 0;
    this.max[i] = max;
    this.size[i] = size;
    this.rot[i] = rot;
    this.vr[i] = vr;
    this.color[i] = color;
  }

  clear() {
    this.n = 0;
  }

  burst(x: number, y: number, color: string, scale: number, perfect: boolean) {
    const leaves = this.reduced ? 3 : perfect ? 14 : 8;
    for (let i = 0; i < leaves; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const v = (120 + Math.random() * 260) * scale;
      this.add(Kind.Leaf, x, y, Math.cos(a) * v, Math.sin(a) * v, 0.9 + Math.random() * 0.6, (5 + Math.random() * 6) * scale, Math.random() * 6, (Math.random() - 0.5) * 16, pick(LEAF_COLORS));
    }
    const sparks = this.reduced ? 4 : 10;
    for (let i = 0; i < sparks; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (60 + Math.random() * 220) * scale;
      this.add(Kind.Spark, x, y, Math.cos(a) * v, Math.sin(a) * v * 0.6 - 40, 0.35 + Math.random() * 0.3, (2 + Math.random() * 3) * scale, 0, 0, color);
    }
    this.add(Kind.Ring, x, y, 0, 0, 0.4, 40 * scale, 0, 0, color);
  }

  sparkle(x: number, y: number, color: string, scale: number) {
    if (this.reduced && Math.random() < 0.6) return;
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const v = (80 + Math.random() * 120) * scale;
    this.add(Kind.Spark, x + (Math.random() - 0.5) * 20 * scale, y, Math.cos(a) * v, Math.sin(a) * v, 0.4 + Math.random() * 0.3, (1.5 + Math.random() * 2.5) * scale, 0, 0, color);
  }

  smoke(x: number, y: number, scale: number) {
    for (let i = 0; i < 5; i++) {
      this.add(Kind.Smoke, x + (Math.random() - 0.5) * 20 * scale, y, (Math.random() - 0.5) * 30, -30 - Math.random() * 40, 0.8 + Math.random() * 0.4, (10 + Math.random() * 10) * scale, 0, 0, '');
    }
  }

  /** A shower of rose petals or confetti across the whole width. */
  shower(W: number, count: number, kind: 'petal' | 'confetti') {
    if (this.reduced) return;
    const k = kind === 'petal' ? Kind.Petal : Kind.Confetti;
    for (let i = 0; i < count; i++) {
      this.add(k, Math.random() * W, -20 - Math.random() * 200, (Math.random() - 0.5) * 60, 60 + Math.random() * 90, 4 + Math.random() * 2, 5 + Math.random() * 6, Math.random() * 6, (Math.random() - 0.5) * 6, pick(k === Kind.Petal ? PETAL_COLORS : CONFETTI_COLORS));
    }
  }

  update(dt: number) {
    let j = 0;
    for (let i = 0; i < this.n; i++) {
      const life = this.life[i] + dt;
      if (life >= this.max[i]) continue;
      const k = this.kind[i];
      let vx = this.vx[i];
      let vy = this.vy[i];
      if (k === Kind.Leaf) {
        vy += 420 * dt;
        vx *= 1 - 1.8 * dt;
        vy *= 1 - 1.2 * dt;
      } else if (k === Kind.Spark) {
        vy += 200 * dt;
      } else if (k === Kind.Petal || k === Kind.Confetti) {
        vx += Math.sin(life * 3 + this.rot[i]) * 30 * dt;
      } else if (k === Kind.Smoke) {
        this.size[i] += 20 * dt;
      }
      // Compact: move survivor i into slot j.
      this.kind[j] = k;
      this.x[j] = this.x[i] + vx * dt;
      this.y[j] = this.y[i] + vy * dt;
      this.vx[j] = vx;
      this.vy[j] = vy;
      this.life[j] = life;
      this.max[j] = this.max[i];
      this.size[j] = this.size[i];
      this.rot[j] = this.rot[i] + this.vr[i] * dt;
      this.vr[j] = this.vr[i];
      this.color[j] = this.color[i];
      j++;
    }
    this.n = j;
  }

  draw(g: CanvasRenderingContext2D) {
    if (this.n === 0) return;
    for (let i = 0; i < this.n; i++) {
      const k = this.kind[i];
      const t = this.life[i] / this.max[i];
      const x = this.x[i];
      const y = this.y[i];
      const s = this.size[i];
      const rot = this.rot[i];
      switch (k) {
        case Kind.Leaf:
        case Kind.Confetti: {
          // Tumbling flake: its apparent width follows the spin.
          const w = s * Math.abs(Math.cos(rot * 1.7)) + 1;
          g.save();
          g.translate(x, y);
          g.rotate(rot);
          g.globalAlpha = 1 - t * t;
          g.fillStyle = this.color[i];
          g.fillRect(-w / 2, -s * 0.35, w, s * 0.7);
          g.restore();
          break;
        }
        case Kind.Petal:
          g.save();
          g.translate(x, y);
          g.rotate(rot);
          g.globalAlpha = Math.min(1, (1 - t) * 3);
          g.fillStyle = this.color[i];
          g.beginPath();
          g.ellipse(0, 0, s, s * 0.55 * Math.abs(Math.cos(rot)) + 1, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
          break;
        case Kind.Spark:
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 1 - t * t;
          g.fillStyle = this.color[i];
          g.fillRect(x - s, y - s, s * 2, s * 2);
          g.globalCompositeOperation = 'source-over';
          break;
        case Kind.Smoke:
          g.globalAlpha = 0.35 * (1 - t);
          g.fillStyle = '#5a5055';
          g.beginPath();
          g.arc(x, y, s, 0, Math.PI * 2);
          g.fill();
          break;
        case Kind.Ring:
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 1 - t;
          g.strokeStyle = this.color[i];
          g.lineWidth = 4 * (1 - t) + 1;
          g.beginPath();
          g.ellipse(x, y, s * (0.6 + t * 1.2), s * (0.6 + t * 1.2) * 0.55, 0, 0, Math.PI * 2);
          g.stroke();
          g.globalCompositeOperation = 'source-over';
          break;
      }
    }
    g.globalAlpha = 1;
  }
}
