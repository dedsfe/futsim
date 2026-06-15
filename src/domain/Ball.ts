import { BALL, FIELD } from "../core/constants";
import { Vec2 } from "../core/Vector2";
import type { Player } from "./Player";

/** Bola com física simples de rolamento no solo. */
export class Ball {
  pos = new Vec2(FIELD.W / 2, FIELD.H / 2);
  vel = new Vec2(0, 0);

  /** Jogador que domina a bola, ou null se está solta. */
  owner: Player | null = null;
  /** Último time a tocar (usado p/ tiro de meta / escanteio / posse). */
  lastTouchSide: "home" | "away" | null = null;
  /** Destinatário pretendido de um passe — vai ao encontro da bola. */
  intendedReceiver: Player | null = null;
  /** Último jogador a tocar a bola (para autor do gol / estatísticas). */
  lastTouchPlayer: Player | null = null;
  /** Tipo do passe em curso (para estatística de passe longo/curto). */
  passKind: "pass" | "long" | "through" | "cross" | null = null;
  /** Segundos antes que possa ser dominada de novo (evita re-captura instantânea). */
  looseLock = 0;

  speed() {
    return this.vel.len();
  }

  /** Integra a física de bola solta. Não chamado quando há dono (dono "cola" a bola). */
  integrate(dt: number) {
    if (this.looseLock > 0) this.looseLock = Math.max(0, this.looseLock - dt);
    const sp = this.vel.len();
    if (sp > 0) {
      const ns = Math.max(0, sp - BALL.FRICTION_DECEL * dt);
      this.vel = sp > 1e-6 ? this.vel.scale(ns / sp) : new Vec2(0, 0);
      this.pos = this.pos.addMut(this.vel, dt);
    }
  }

  kick(dir: Vec2, speed: number, side: "home" | "away") {
    this.owner = null;
    this.intendedReceiver = null;
    this.passKind = null;
    this.vel = dir.withLen(speed);
    this.lastTouchSide = side;
    this.looseLock = 0.18; // breve janela para a bola sair do pé
  }
}
