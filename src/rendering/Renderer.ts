import { BALL, FIELD, GOAL_Y, PLAYER } from "../core/constants";
import type { Player } from "../domain/Player";
import type { MatchEngine } from "../simulation/MatchEngine";

const PAD = 6; // metros de margem fora das linhas

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private scale = 8;
  showTargets = false; // debug: linhas de destino tático
  showRoles = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const wrap = this.canvas.parentElement!;
    const availW = wrap.clientWidth;
    const fieldW = FIELD.W + PAD * 2;
    const fieldH = FIELD.H + PAD * 2;
    this.scale = availW / fieldW;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = fieldW * this.scale * dpr;
    this.canvas.height = fieldH * this.scale * dpr;
    this.canvas.style.width = `${fieldW * this.scale}px`;
    this.canvas.style.height = `${fieldH * this.scale}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private X(m: number) {
    return (m + PAD) * this.scale;
  }
  private Y(m: number) {
    return (m + PAD) * this.scale;
  }
  private S(m: number) {
    return m * this.scale;
  }

  draw(engine: MatchEngine) {
    const ctx = this.ctx;
    this.drawPitch();
    if (this.showTargets) this.drawTargets(engine);
    for (const p of engine.home.players) this.drawPlayer(p, engine);
    for (const p of engine.away.players) this.drawPlayer(p, engine);
    this.drawBall(engine);
    ctx.restore?.();
  }

  private drawPitch() {
    const ctx = this.ctx;
    const w = (FIELD.W + PAD * 2) * this.scale;
    const h = (FIELD.H + PAD * 2) * this.scale;

    // fundo
    ctx.fillStyle = "#1f7a34";
    ctx.fillRect(0, 0, w, h);
    // listras
    const stripes = 12;
    const sw = this.S(FIELD.W) / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#22833a" : "#1d7531";
      ctx.fillRect(this.X(0) + i * sw, this.Y(0), sw, this.S(FIELD.H));
    }

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1.5, this.S(0.18));
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(this.X(x1), this.Y(y1));
      ctx.lineTo(this.X(x2), this.Y(y2));
      ctx.stroke();
    };
    // contorno
    ctx.strokeRect(this.X(0), this.Y(0), this.S(FIELD.W), this.S(FIELD.H));
    // meio
    line(FIELD.W / 2, 0, FIELD.W / 2, FIELD.H);
    ctx.beginPath();
    ctx.arc(this.X(FIELD.W / 2), this.Y(FIELD.H / 2), this.S(FIELD.CENTER_CIRCLE_R), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.X(FIELD.W / 2), this.Y(FIELD.H / 2), this.S(0.4), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    // áreas
    const pa = FIELD.PENALTY_DEPTH;
    const paW = FIELD.PENALTY_WIDTH;
    const sa = FIELD.SIX_DEPTH;
    const saW = FIELD.SIX_WIDTH;
    const cy = FIELD.H / 2;
    // esquerda
    ctx.strokeRect(this.X(0), this.Y(cy - paW / 2), this.S(pa), this.S(paW));
    ctx.strokeRect(this.X(0), this.Y(cy - saW / 2), this.S(sa), this.S(saW));
    // direita
    ctx.strokeRect(this.X(FIELD.W - pa), this.Y(cy - paW / 2), this.S(pa), this.S(paW));
    ctx.strokeRect(this.X(FIELD.W - sa), this.Y(cy - saW / 2), this.S(sa), this.S(saW));

    // gols
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, this.S(0.3));
    ctx.strokeRect(this.X(-FIELD.GOAL_DEPTH), this.Y(GOAL_Y.top), this.S(FIELD.GOAL_DEPTH), this.S(FIELD.GOAL_WIDTH));
    ctx.strokeRect(this.X(FIELD.W), this.Y(GOAL_Y.top), this.S(FIELD.GOAL_DEPTH), this.S(FIELD.GOAL_WIDTH));
  }

  private drawTargets(engine: MatchEngine) {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(255,255,0,0.35)";
    ctx.lineWidth = 1;
    for (const p of [...engine.home.players, ...engine.away.players]) {
      ctx.beginPath();
      ctx.moveTo(this.X(p.pos.x), this.Y(p.pos.y));
      ctx.lineTo(this.X(p.target.x), this.Y(p.target.y));
      ctx.stroke();
    }
  }

  private drawPlayer(p: Player, engine: MatchEngine) {
    const ctx = this.ctx;
    const x = this.X(p.pos.x);
    const y = this.Y(p.pos.y);
    const r = Math.max(6, this.S(PLAYER.RADIUS * 2.4));

    // realce do portador
    if (engine.ball.owner === p) {
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffec3d";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.isGK ? "#222" : p.team.color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = p.isGK ? "#ffd23f" : "rgba(0,0,0,0.5)";
    ctx.stroke();

    // direção
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + p.facing.x * r, y + p.facing.y * r);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // número
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.round(r)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(p.shirt), x, y);
  }

  private drawBall(engine: MatchEngine) {
    const ctx = this.ctx;
    const b = engine.ball;
    const x = this.X(b.pos.x);
    const y = this.Y(b.pos.y);
    const r = Math.max(3, this.S(BALL.RADIUS * 3));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#222";
    ctx.stroke();
  }
}
