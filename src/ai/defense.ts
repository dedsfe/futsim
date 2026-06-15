import { FIELD } from "../core/constants";
import { clamp, Vec2 } from "../core/Vector2";
import type { Player } from "../domain/Player";
import type { Team } from "../domain/Team";
import { World, opponentsOf } from "./context";

const ownGoalVec = (team: Team) => new Vec2(team.ownGoal.x, team.ownGoal.y);

/** Nível de perigo defensivo 0..1 (baixo→extremo). Dirige a agressividade. */
export function dangerLevel(team: Team, world: World): number {
  const ball = world.ball.pos;
  const g = ownGoalVec(team);
  const dBallGoal = ball.dist(g);
  const attackers = opponentsOf(world, team.players[0]);
  const inBox = attackers.filter((a) => !a.sentOff && a.pos.dist(g) < 18).length;

  let d = clamp(1 - dBallGoal / 55, 0, 1);
  d += 0.13 * inBox;

  const owner = world.ball.owner;
  if (owner && owner.side !== team.side) {
    const facingGoal = owner.facing.dot(g.sub(owner.pos).normalized()) > 0.3;
    if (facingGoal && dBallGoal < 35) d += 0.15;
  }
  return clamp(d, 0, 1);
}

export type DangerBand = "low" | "medium" | "high" | "extreme";
export function dangerBand(d: number): DangerBand {
  return d > 0.8 ? "extreme" : d > 0.55 ? "high" : d > 0.3 ? "medium" : "low";
}

/** 1º defensor: jogador de linha mais próximo da bola (pressiona o portador). */
export function getNearestDefenderToBall(team: Team, world: World): Player | null {
  let best: Player | null = null;
  let bd = Infinity;
  for (const p of team.outfield()) {
    if (p.sentOff) continue;
    const d = p.pos.dist(world.ball.pos);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

/** 2º defensor: dá cobertura — mais próximo do próprio gol, atrás do 1º. */
export function getCoveringDefender(team: Team, presser: Player | null, world: World): Player | null {
  const g = ownGoalVec(team);
  let best: Player | null = null;
  let bd = Infinity;
  for (const p of team.outfield()) {
    if (p.sentOff || p === presser) continue;
    // prioriza quem já está entre a bola e o gol
    const d = p.pos.dist(world.ball.pos) + 0.4 * p.pos.dist(g);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

/** Alvo de cobertura: atrás do 1º defensor, na linha bola→gol. */
export function coveringTarget(team: Team, world: World): Vec2 {
  const g = ownGoalVec(team);
  const ball = world.ball.pos;
  const dir = g.sub(ball).normalized();
  return ball.add(dir.scale(7));
}

/**
 * Se o portador está em posição de chute e de frente para o gol, retorna o
 * defensor melhor posicionado e o ponto na LINHA DE CHUTE para bloquear.
 */
export function blockShootingLane(team: Team, world: World): { defender: Player; target: Vec2 } | null {
  const owner = world.ball.owner;
  if (!owner || owner.side === team.side) return null;
  const g = ownGoalVec(team);
  const dGoal = owner.pos.dist(g);
  if (dGoal > 30) return null;
  const facing = owner.facing.dot(g.sub(owner.pos).normalized()) > 0.1;
  if (!facing) return null;

  const dir = g.sub(owner.pos).normalized();
  const blockPoint = owner.pos.add(dir.scale(clamp(dGoal * 0.45, 2.5, 9)));
  let best: Player | null = null;
  let bd = Infinity;
  for (const p of team.outfield()) {
    if (p.sentOff) continue;
    const d = p.pos.dist(blockPoint);
    if (d < bd) { bd = d; best = p; }
  }
  return best ? { defender: best, target: blockPoint } : null;
}

/**
 * Fechar linha de passe: desloca o destino zonal do meio-campista para a linha
 * entre a bola e o atacante mais perigoso (entre linhas).
 */
export function blockPassingLaneTarget(_defender: Player, team: Team, world: World, zonal: Vec2): Vec2 {
  const ball = world.ball.pos;
  const attackers = opponentsOf(world, team.players[0]).filter((a) => !a.isGK && !a.sentOff);
  // atacante mais avançado próximo deste setor
  let pick: Player | null = null;
  let bd = 16;
  for (const a of attackers) {
    const d = a.pos.dist(zonal);
    if (team.attackProgress(a.pos) > 0.45 && d < bd) { bd = d; pick = a; }
  }
  if (!pick) return zonal;
  const mid = Vec2.lerp(ball, pick.pos, 0.5);
  return Vec2.lerp(zonal, mid, 0.4);
}

/**
 * Acompanhar infiltração: se um atacante corre para a área no setor deste
 * defensor, segue goal-side bem perto.
 */
export function trackRunnerTarget(defender: Player, team: Team, world: World, zonal: Vec2): Vec2 | null {
  const g = ownGoalVec(team);
  const attackers = opponentsOf(world, team.players[0]).filter((a) => !a.isGK && !a.sentOff);
  let pick: Player | null = null;
  let bd = 9;
  for (const a of attackers) {
    const intoBox = a.pos.dist(g) < 26 && team.attackProgress(a.pos) > 0.6;
    const d = a.pos.dist(defender.pos);
    if (intoBox && d < bd) { bd = d; pick = a; }
  }
  if (!pick) return null;
  const dir = g.sub(pick.pos).normalized();
  const goalSide = pick.pos.add(dir.scale(1.3));
  return Vec2.lerp(zonal, goalSide, 0.8);
}

/** Probabilidade-base de desarme limpo por tick (sem considerar dt). */
export function tackleSkillEdge(defender: Player, attacker: Player): number {
  const atk = attacker.skill("dribbling") * 0.55 + attacker.skill("control") * 0.25 + attacker.skill("strength") * 0.2;
  const def = defender.skill("tackling") * 0.6 + defender.skill("strength") * 0.3 + defender.skill("marking") * 0.1;
  return def - atk; // >0 = defensor leva vantagem
}

/** Quanto o time deve bascular para o lado da bola (compactação). */
export function ballSideShift(team: Team, world: World): number {
  const ballW = team.lateral(world.ball.pos);
  return ballW - 0.5; // -0.5..0.5
}

/** Está dentro da própria grande área? (para perigo extremo / emergência) */
export function inOwnBox(team: Team, p: Vec2): boolean {
  const nearOwnLine = team.side === "home" ? p.x < FIELD.PENALTY_DEPTH : p.x > FIELD.W - FIELD.PENALTY_DEPTH;
  return nearOwnLine && Math.abs(p.y - FIELD.H / 2) < FIELD.PENALTY_WIDTH / 2;
}
