export interface GemColor {
  name: string;
  key: string;
  base: string;
  light: string;
  dark: string;
  glow: string;
}

/** Ruby, sapphire, emerald, topaz — one per lane, D F J K. */
export const GEMS: GemColor[] = [
  { name: 'Ruby', key: 'D', base: '#d0243e', light: '#ff8c9b', dark: '#5c0615', glow: 'rgba(255,70,100,' },
  { name: 'Sapphire', key: 'F', base: '#2a5ee0', light: '#9dbcff', dark: '#0a1c5c', glow: 'rgba(80,140,255,' },
  { name: 'Emerald', key: 'J', base: '#1d9e5c', light: '#8cf0b8', dark: '#053d20', glow: 'rgba(60,220,140,' },
  { name: 'Topaz', key: 'K', base: '#e3a01c', light: '#ffe69a', dark: '#6b3f02', glow: 'rgba(255,190,60,' },
];

export const GOLD = {
  bright: '#fff1b8',
  light: '#f3d27a',
  mid: '#d4a640',
  deep: '#9a6b1f',
  shadow: '#4d320c',
};

export const SERIF = '"Hoefler Text", "Baskerville", "Didot", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export function goldGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, GOLD.bright);
  g.addColorStop(0.28, GOLD.light);
  g.addColorStop(0.55, GOLD.mid);
  g.addColorStop(0.8, GOLD.deep);
  g.addColorStop(1, GOLD.light);
  return g;
}

export function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function parse(hex: string): number[] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
