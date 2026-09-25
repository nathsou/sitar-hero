/**
 * A simple perspective camera looking down a long gallery.
 *
 * World coordinates:
 *  - X: lateral, in lane widths (the runway spans −2…2).
 *  - h: height, in multiples of the eye height (0 = floor, 1 = eye level).
 *  - d: depth, where gems travel from d = 1 (far) to d = 0 (the rings) in one approach time.
 */
export class Camera {
  W = 0;
  H = 0;
  cx = 0;
  hitY = 0;
  horizon = 0;
  laneW = 0;
  /** Scale 0 at the hit line to 1/(1+K) at d = 1. */
  readonly K = 3;
  /** Depth of the back wall of the gallery. */
  readonly backD = 1.12;
  /** Nearest depth ever drawn (just below the bottom of the screen). */
  readonly nearD = -0.26;
  /** Half-width of the gallery, in lanes. */
  roomX = 5.4;

  resize(W: number, H: number) {
    this.W = W;
    this.H = H;
    this.cx = W / 2;
    this.laneW = Math.max(62, Math.min(124, W * 0.085, H * 0.13));
    this.hitY = H * (H > W ? 0.8 : 0.83);
    const farY = H * 0.31;
    // Choose the horizon so the far end of the runway (d = 1) sits at farY.
    const sFar = this.s(1);
    this.horizon = (farY - sFar * this.hitY) / (1 - sFar);
    this.roomX = Math.max(5.4, (W / 2 / this.laneW) * 0.95);
  }

  s(d: number): number {
    return 1 / (1 + this.K * Math.max(d, -0.3));
  }

  x(X: number, d: number): number {
    return this.cx + X * this.laneW * this.s(d);
  }

  y(h: number, d: number): number {
    return this.horizon + (this.hitY - this.horizon) * this.s(d) * (1 - h);
  }

  /** Project (X, h, d) to screen. */
  p(X: number, h: number, d: number): [number, number] {
    const s = this.s(d);
    return [this.cx + X * this.laneW * s, this.horizon + (this.hitY - this.horizon) * s * (1 - h)];
  }

  /** Depth at which the floor meets a screen row (inverse of y at h = 0). */
  dAtY(y: number): number {
    const s = (y - this.horizon) / (this.hitY - this.horizon);
    return (1 / s - 1) / this.K;
  }
}
