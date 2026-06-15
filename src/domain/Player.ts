import { PLAYER } from "../core/constants";
import { clamp, lerp, norm, Vec2 } from "../core/Vector2";
import type {
  Attributes,
  FormationSlot,
  PlayerInstructions,
  RoleId,
  Trait,
} from "./types";
import type { Team } from "./Team";

/** Ação atual escolhida pela IA — usada por render/debug e pela física. */
export type ActionKind =
  | "idle"
  | "support" // mover para posição de apoio
  | "press" // ir à bola
  | "mark" // marcar adversário
  | "recover" // recompor defensivamente
  | "run" // ataque a espaço/profundidade
  | "carry" // conduzir bola
  | "dribble"
  | "shield"; // proteger a bola

export class Player {
  pos = new Vec2();
  vel = new Vec2();
  /** Direção que o jogador "olha" (para offset da bola e chutes). */
  facing = new Vec2(1, 0);
  /** Alvo de movimento calculado pela IA a cada tick. */
  target = new Vec2();

  action: ActionKind = "idle";
  stamina = 1; // 0..1, drena com corrida
  /** Cooldown após erro/disputa para evitar tremer. */
  recoverTimer = 0;

  // ---- identidade / individualidade ----
  name = "";
  overall = 70; // 1..99 (calculado ou importado do EA FC 26)
  traits: Trait[] = [];
  preferredFoot: "Left" | "Right" = "Right";
  /** Última decisão (para painel/debug). */
  lastDecision: { chosen: string; reason: string } | null = null;

  // ---- disciplina (regras) ----
  yellowCards = 0;
  sentOff = false;

  constructor(
    public id: string,
    public team: Team,
    public shirt: number,
    public role: RoleId,
    public slot: FormationSlot,
    public attr: Attributes,
    public instr: PlayerInstructions = {},
  ) {}

  get side() {
    return this.team.side;
  }
  get isGK() {
    return this.role === "GK";
  }

  /** 0 = inteiro, 1 = exausto. */
  get fatigue() {
    return 1 - this.stamina;
  }

  /** Velocidade máxima atual (m/s) considerando atributo e fadiga. */
  maxSpeed() {
    const base = lerp(PLAYER.MAX_SPEED_MIN, PLAYER.MAX_SPEED_MAX, this.attr.pace / 100);
    return base * lerp(0.7, 1, this.stamina);
  }
  accel() {
    return lerp(PLAYER.ACCEL_MIN, PLAYER.ACCEL_MAX, this.attr.acceleration / 100) * lerp(0.78, 1, this.stamina);
  }

  /**
   * Move o jogador rumo a `target` respeitando aceleração e limites.
   * `dt` é tempo REAL (física natural). `staminaScale` faz a stamina cair
   * proporcional ao tempo de JOGO (matchClockMultiplier), não ao tempo real.
   */
  steer(dt: number, urgency = 1, staminaScale = 1) {
    const toTarget = this.target.sub(this.pos);
    const d = toTarget.len();
    const desiredSpeed = this.maxSpeed() * clamp(urgency, 0, 1) * (d > 0.4 ? 1 : d / 0.4);
    const desired = d > 1e-4 ? toTarget.scale(desiredSpeed / d) : new Vec2(0, 0);

    // aproxima a velocidade atual da desejada limitada pela aceleração
    const dv = desired.sub(this.vel);
    const maxDv = this.accel() * dt;
    const dvl = dv.len();
    this.vel = dvl > maxDv ? this.vel.add(dv.scale(maxDv / dvl)) : desired;

    this.pos = this.pos.addMut(this.vel, dt);
    if (this.vel.len() > 0.3) this.facing = this.vel.normalized();

    // fadiga: drena com esforço (proporcional ao tempo de JOGO via staminaScale)
    const effort = this.vel.len() / PLAYER.MAX_SPEED_MAX;
    const drain = (effort * effort) * 0.0011 * lerp(1.7, 0.6, this.attr.stamina / 100) * staminaScale;
    const recover = (1 - effort) * 0.0004 * staminaScale;
    this.stamina = clamp(this.stamina - drain + recover, 0.3, 1);
  }

  /** Qualidade efetiva de uma habilidade 0..1 modulada por fadiga. */
  skill(a: keyof Attributes) {
    return (this.attr[a] / 100) * lerp(0.8, 1, this.stamina);
  }

  /** "Decisão" efetiva 0..1 (cai com o cansaço) — usada no ruído de escolha. */
  decisionSkill() {
    return (this.attr.decision / 100) * lerp(0.75, 1, this.stamina);
  }

  hasTrait(tr: Trait) {
    return this.traits.includes(tr);
  }

  /**
   * Consistência 0..1 derivada do overall: craque (90) é muito mais regular que
   * jogador fraco (60). Multiplica o erro de decisão/execução (1 = sem erro extra).
   */
  consistency() {
    return clamp((this.overall - 45) / 50, 0.1, 1);
  }

  /** Pressão composta (0..1) usada por vários cálculos de risco. */
  static composure(p: Player) {
    return norm(p.attr.decision * 0.6 + p.attr.strength * 0.4, 0, 100);
  }
}
