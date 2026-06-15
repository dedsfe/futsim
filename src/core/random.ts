/** RNG determinístico (mulberry32) — partidas reproduzíveis com a mesma seed. */
export class Rng {
  private s: number;
  constructor(seed = 12345) {
    this.s = seed >>> 0;
  }
  /** Re-semeia o RNG (testes determinísticos/reproduzíveis). */
  reseed(seed: number) {
    this.s = seed >>> 0;
  }
  next() {
    this.s |= 0;
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** [-1,1] aproximadamente gaussiano (soma de uniformes). */
  gauss() {
    return (this.next() + this.next() + this.next() - 1.5) / 1.5;
  }
  range(lo: number, hi: number) {
    return lo + (hi - lo) * this.next();
  }
  chance(p: number) {
    return this.next() < p;
  }
}

export const rng = new Rng(Date.now() & 0xffffff);
