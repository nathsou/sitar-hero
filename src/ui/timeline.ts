import type { Judgment } from '../music/chart';

export interface TimelineData {
  duration: number;
  notes: { time: number; judgment: Judgment | null; offset: number }[];
  tiers: { t: number; tier: number }[];
  failedAt: number | null;
  /** The "good" timing window, which the vertical scale spans. */
  window: number;
}

const INK = '58,34,20';
const COLORS: Record<Exclude<Judgment, 'miss'>, string> = { perfect: '#b07a14', great: '#3a6fd8', good: '#b8763a' };

/**
 * Draw the performance as a strip: time runs left to right; each struck note is a
 * dot placed by its timing (early above the line, late below); misses are red
 * ticks; the shaded area behind is the running accuracy, and the gilded bands
 * show how much of the orchestra was playing.
 */
export function drawTimeline(canvas: HTMLCanvasElement, data: TimelineData) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth || 600;
  const H = canvas.clientHeight || 80;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const g = canvas.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);

  const pad = 4;
  const top = 4;
  const bottom = H - 14;
  const mid = (top + bottom) / 2;
  const span = (bottom - top) / 2 - 3;
  const dur = Math.max(1, data.duration);
  const X = (t: number) => pad + (Math.max(0, Math.min(dur, t)) / dur) * (W - pad * 2);

  // Orchestra bands.
  for (let i = 0; i < data.tiers.length; i++) {
    const a = data.tiers[i];
    const b = data.tiers[i + 1];
    const x0 = X(a.t);
    const x1 = X(b ? b.t : data.failedAt ?? dur);
    g.fillStyle = `rgba(212,166,64,${0.04 + a.tier * 0.045})`;
    g.fillRect(x0, top, x1 - x0, bottom - top);
  }

  // Running accuracy, as a soft area rising from the baseline.
  const weight = (j: Judgment | null) => (j === 'perfect' ? 1 : j === 'great' ? 0.75 : j === 'good' ? 0.45 : 0);
  const judged = data.notes.filter((n) => n.judgment !== null);
  if (judged.length > 4) {
    const k = Math.max(4, Math.round(judged.length / 24));
    g.beginPath();
    g.moveTo(X(judged[0].time), bottom);
    let sum = 0;
    for (let i = 0; i < judged.length; i++) {
      sum += weight(judged[i].judgment);
      if (i >= k) sum -= weight(judged[i - k].judgment);
      const acc = sum / Math.min(i + 1, k);
      g.lineTo(X(judged[i].time), bottom - acc * (bottom - top));
    }
    g.lineTo(X(judged[judged.length - 1].time), bottom);
    g.closePath();
    g.fillStyle = `rgba(${INK},0.07)`;
    g.fill();
  }

  // The perfect line and the edges of the window.
  g.fillStyle = `rgba(${INK},0.35)`;
  g.fillRect(pad, mid - 0.5, W - pad * 2, 1);
  g.fillStyle = `rgba(${INK},0.12)`;
  g.fillRect(pad, mid - span, W - pad * 2, 1);
  g.fillRect(pad, mid + span, W - pad * 2, 1);

  for (const n of data.notes) {
    if (!n.judgment) continue;
    const x = X(n.time);
    if (n.judgment === 'miss') {
      g.fillStyle = 'rgba(176,36,58,0.55)';
      g.fillRect(x - 0.6, top, 1.2, bottom - top);
      continue;
    }
    const y = mid + Math.max(-1, Math.min(1, n.offset / data.window)) * span;
    g.fillStyle = COLORS[n.judgment];
    g.beginPath();
    g.arc(x, y, 1.8, 0, Math.PI * 2);
    g.fill();
  }

  if (data.failedAt !== null) {
    const x = X(data.failedAt);
    g.fillStyle = 'rgba(142,16,32,0.18)';
    g.fillRect(x, top, W - pad - x, bottom - top);
    g.font = 'italic 700 12px "Hoefler Text", Baskerville, Georgia, serif';
    g.fillStyle = '#8e1020';
    g.textAlign = 'left';
    g.fillText(' ✕ dismissed', Math.min(x, W - 90), mid + 4);
  }

  // Time labels.
  g.font = '10px "Hoefler Text", Baskerville, Georgia, serif';
  g.fillStyle = `rgba(${INK},0.7)`;
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  g.textAlign = 'left';
  g.fillText('0:00', pad, H - 2);
  g.textAlign = 'center';
  g.fillText(fmt(dur / 2), W / 2, H - 2);
  g.textAlign = 'right';
  g.fillText(fmt(dur), W - pad, H - 2);
}
