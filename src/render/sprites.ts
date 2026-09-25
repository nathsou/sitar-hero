import { GEMS, GOLD, SERIF, goldGradient, mix, type GemColor } from './palette';

export const SPRITE = 160;

function canvas(size = SPRITE): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}

const octagon = (cx: number, cy: number, r: number, rot = Math.PI / 8) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = rot + (i * Math.PI) / 4;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });

/** A brilliant-cut gem seen from above, lit from the upper left. */
function drawGem(g: CanvasRenderingContext2D, color: GemColor, gilded: boolean) {
  const c = SPRITE / 2;
  const R = SPRITE * (gilded ? 0.36 : 0.4);
  const r = R * 0.56;
  const outer = octagon(c, c, R);
  const table = octagon(c, c, r);
  const light = -Math.PI * 0.75;

  if (gilded) {
    // Gold bezel with eight claws.
    g.beginPath();
    g.arc(c, c, R * 1.2, 0, Math.PI * 2);
    g.fillStyle = goldGradient(g, c - R, c - R, c + R, c + R);
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = GOLD.shadow;
    g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.beginPath();
      g.arc(c + Math.cos(a) * R * 1.05, c + Math.sin(a) * R * 1.05, R * 0.13, 0, Math.PI * 2);
      g.fillStyle = i % 2 ? GOLD.light : GOLD.bright;
      g.fill();
    }
  }

  // Crown facets between girdle and table.
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const mid = Math.atan2((outer[i][1] + outer[j][1]) / 2 - c, (outer[i][0] + outer[j][0]) / 2 - c);
    const shade = 0.5 + 0.5 * Math.cos(mid - light);
    g.beginPath();
    g.moveTo(table[i][0], table[i][1]);
    g.lineTo(outer[i][0], outer[i][1]);
    g.lineTo(outer[j][0], outer[j][1]);
    g.lineTo(table[j][0], table[j][1]);
    g.closePath();
    g.fillStyle = shade > 0.5 ? mix(color.base, color.light, (shade - 0.5) * 1.6) : mix(color.dark, color.base, shade * 2);
    g.fill();
    // Star facet: a triangle from the table edge to the girdle midpoint.
    const mx = (outer[i][0] + outer[j][0]) / 2;
    const my = (outer[i][1] + outer[j][1]) / 2;
    g.beginPath();
    g.moveTo(table[i][0], table[i][1]);
    g.lineTo(mx, my);
    g.lineTo(table[j][0], table[j][1]);
    g.closePath();
    g.fillStyle = shade > 0.4 ? mix(color.base, '#ffffff', shade * 0.35) : mix(color.dark, color.base, 0.4 + shade);
    g.fill();
  }

  // The table: a window into the stone.
  const tg = g.createRadialGradient(c - r * 0.4, c - r * 0.4, r * 0.1, c, c, r * 1.1);
  tg.addColorStop(0, color.light);
  tg.addColorStop(0.55, color.base);
  tg.addColorStop(1, color.dark);
  g.beginPath();
  table.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = tg;
  g.fill();

  // Facet edges.
  g.lineWidth = 1.2;
  g.strokeStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    g.moveTo(table[i][0], table[i][1]);
    g.lineTo(outer[i][0], outer[i][1]);
    g.stroke();
  }
  g.beginPath();
  outer.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.lineWidth = 2.2;
  g.strokeStyle = gilded ? GOLD.shadow : 'rgba(20,6,10,0.8)';
  g.stroke();

  // Specular glints.
  g.save();
  g.globalCompositeOperation = 'lighter';
  const sx = c - r * 0.45;
  const sy = c - r * 0.5;
  const sg = g.createRadialGradient(sx, sy, 0, sx, sy, r * 0.7);
  sg.addColorStop(0, 'rgba(255,255,255,0.85)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sg;
  g.beginPath();
  g.ellipse(sx, sy, r * 0.7, r * 0.4, -Math.PI / 4, 0, Math.PI * 2);
  g.fill();
  star(g, c + r * 0.55, c - r * 0.75, R * 0.28, 'rgba(255,255,255,0.9)');
  g.restore();
}

export function star(g: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string) {
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 ? s * 0.18 : s;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

/** A gilded rosette target, engraved with its key. */
function drawRing(g: CanvasRenderingContext2D, color: GemColor, pressed: boolean, label: string | null) {
  const c = SPRITE / 2;
  const R = SPRITE * 0.44;

  // Recess.
  const rg = g.createRadialGradient(c, c, 0, c, c, R);
  if (pressed) {
    rg.addColorStop(0, color.light);
    rg.addColorStop(0.5, color.base);
    rg.addColorStop(1, color.dark);
  } else {
    rg.addColorStop(0, 'rgba(20,10,16,0.55)');
    rg.addColorStop(0.7, 'rgba(12,5,10,0.8)');
    rg.addColorStop(1, color.dark);
  }
  g.beginPath();
  g.arc(c, c, R * 0.78, 0, Math.PI * 2);
  g.fillStyle = rg;
  g.fill();

  // Petal ring (baroque rosette).
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    g.save();
    g.translate(c + Math.cos(a) * R * 0.86, c + Math.sin(a) * R * 0.86);
    g.rotate(a);
    g.beginPath();
    g.ellipse(0, 0, R * 0.14, R * 0.08, 0, 0, Math.PI * 2);
    g.fillStyle = goldGradient(g, -R * 0.14, -R * 0.1, R * 0.14, R * 0.1);
    g.fill();
    g.lineWidth = 1;
    g.strokeStyle = GOLD.shadow;
    g.stroke();
    g.restore();
  }

  // Main gilded band.
  g.beginPath();
  g.arc(c, c, R * 0.78, 0, Math.PI * 2);
  g.lineWidth = R * 0.12;
  g.strokeStyle = goldGradient(g, c - R, c - R, c + R, c + R);
  g.stroke();
  g.beginPath();
  g.arc(c, c, R * 0.71, 0, Math.PI * 2);
  g.lineWidth = 2;
  g.strokeStyle = pressed ? color.light : color.base;
  g.stroke();

  // Beads.
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12 + Math.PI / 24;
    g.beginPath();
    g.arc(c + Math.cos(a) * R * 0.96, c + Math.sin(a) * R * 0.96, R * 0.03, 0, Math.PI * 2);
    g.fillStyle = GOLD.light;
    g.fill();
  }

  if (label) {
    // Engraved key letter, shrunk to fit longer key names.
    const size = Math.round(R * (label.length > 2 ? 0.34 : label.length > 1 ? 0.46 : 0.62));
    g.font = `italic 700 ${size}px ${SERIF}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = pressed ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.6)';
    g.fillText(label, c + 1.5, c + 3.5);
    g.fillStyle = pressed ? '#fffbe8' : goldGradient(g, c - R * 0.3, c - R * 0.3, c + R * 0.3, c + R * 0.3);
    g.fillText(label, c, c + 2);
  } else {
    // A plain jewel boss in place of the letter.
    g.beginPath();
    g.arc(c, c, R * 0.16, 0, Math.PI * 2);
    g.fillStyle = pressed ? color.light : color.base;
    g.fill();
  }
}

export interface Sprites {
  gems: HTMLCanvasElement[];
  gilded: HTMLCanvasElement[];
  rings: HTMLCanvasElement[];
  ringsPressed: HTMLCanvasElement[];
}

/** @param labels the key name engraved on each ring, or null for unlabelled rings */
export function buildSprites(labels: readonly string[] | null): Sprites {
  const make = (fn: (g: CanvasRenderingContext2D, col: GemColor, i: number) => void) =>
    GEMS.map((col, i) => {
      const [c, g] = canvas();
      fn(g, col, i);
      return c;
    });
  return {
    gems: make((g, col) => drawGem(g, col, false)),
    gilded: make((g, col) => drawGem(g, col, true)),
    rings: make((g, col, i) => drawRing(g, col, false, labels?.[i] ?? null)),
    ringsPressed: make((g, col, i) => drawRing(g, col, true, labels?.[i] ?? null)),
  };
}
