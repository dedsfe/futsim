import { FIELD, GOAL_LEFT, GOAL_RIGHT } from "../core/constants";
import { Vec2 } from "../core/Vector2";
import type { Player } from "./Player";
import type { TeamSide, TeamTactics, FormationSlot } from "./types";

export class Team {
  players: Player[] = [];

  public secondaryColor?: string;

  constructor(
    public side: TeamSide,
    public name: string,
    public color: string,
    public tactics: TeamTactics,
  ) {}

  /** Direção de ataque no eixo X: home → +1 (gol direito), away → -1 (gol esquerdo). */
  get attackDir(): 1 | -1 {
    return this.side === "home" ? 1 : -1;
  }
  /** Gol que este time ataca. */
  get oppGoal() {
    return this.side === "home" ? GOAL_RIGHT : GOAL_LEFT;
  }
  /** Gol que este time defende. */
  get ownGoal() {
    return this.side === "home" ? GOAL_LEFT : GOAL_RIGHT;
  }

  get gk(): Player | undefined {
    return this.players.find((p) => p.isGK);
  }
  outfield() {
    return this.players.filter((p) => !p.isGK);
  }

  /**
   * Converte um slot normalizado (ótica: atacar para a direita) para coordenadas
   * de campo conforme o lado do time. O `away` é rotacionado 180°.
   */
  slotToField(slot: FormationSlot): Vec2 {
    return this.progressToField(slot.x, slot.y);
  }

  /**
   * Espaço "progresso de ataque": a ∈ [0,1] do próprio gol ao gol adversário,
   * w ∈ [0,1] na largura. Independe do lado — facilita a IA pensar sempre
   * "atacando para a frente". A conversão cuida da orientação real no campo.
   */
  progressToField(a: number, w: number): Vec2 {
    if (this.side === "home") {
      return new Vec2(a * FIELD.W, w * FIELD.H);
    }
    return new Vec2(FIELD.W - a * FIELD.W, FIELD.H - w * FIELD.H);
  }

  /** Progresso de ataque (0..1) de uma posição de campo, na ótica deste time. */
  attackProgress(p: Vec2): number {
    return this.side === "home" ? p.x / FIELD.W : 1 - p.x / FIELD.W;
  }
  /** Largura (0..1) de uma posição de campo, na ótica deste time. */
  lateral(p: Vec2): number {
    return this.side === "home" ? p.y / FIELD.H : 1 - p.y / FIELD.H;
  }
}
