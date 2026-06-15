/** Vetor 2D imutável-friendly. Unidades = metros no espaço do campo. */
export class Vec2 {
  constructor(public x = 0, public y = 0) {}

  static of(x: number, y: number) {
    return new Vec2(x, y);
  }
  static zero() {
    return new Vec2(0, 0);
  }

  clone() {
    return new Vec2(this.x, this.y);
  }
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }
  copy(v: Vec2) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v: Vec2) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }
  sub(v: Vec2) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }
  scale(s: number) {
    return new Vec2(this.x * s, this.y * s);
  }

  /** Soma in-place (evita alocação no loop quente). */
  addMut(v: Vec2, s = 1) {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }

  len() {
    return Math.hypot(this.x, this.y);
  }
  len2() {
    return this.x * this.x + this.y * this.y;
  }

  normalized() {
    const l = this.len();
    return l > 1e-9 ? new Vec2(this.x / l, this.y / l) : new Vec2(0, 0);
  }

  withLen(target: number) {
    return this.normalized().scale(target);
  }

  dist(v: Vec2) {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }
  dist2(v: Vec2) {
    const dx = this.x - v.x,
      dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dot(v: Vec2) {
    return this.x * v.x + this.y * v.y;
  }
  angle() {
    return Math.atan2(this.y, this.x);
  }

  static fromAngle(a: number, len = 1) {
    return new Vec2(Math.cos(a) * len, Math.sin(a) * len);
  }
  static lerp(a: Vec2, b: Vec2, t: number) {
    return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0..1 a partir de um valor entre [lo,hi]. */
export const norm = (v: number, lo: number, hi: number) =>
  clamp((v - lo) / (hi - lo), 0, 1);

/**
 * Distância de um ponto p ao segmento a-b. Usado para checar se um adversário
 * "fecha" a linha de passe.
 */
export function distPointToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = b.sub(a);
  const t = clamp(p.sub(a).dot(ab) / Math.max(ab.len2(), 1e-9), 0, 1);
  const proj = a.add(ab.scale(t));
  return p.dist(proj);
}
