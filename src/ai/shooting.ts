import { FIELD, GOAL_Y } from "../core/constants";
import { clamp, distPointToSegment, Vec2 } from "../core/Vector2";
import type { Player } from "../domain/Player";
import { World, oppTeam } from "./context";
import { pressureOn } from "./perception";

/** Avaliação completa de uma finalização (modelo de xG simplificado). */
export interface ShotEval {
  shootable: boolean; // está em posição de chutar?
  xg: number; // probabilidade aproximada de gol 0..1 (independe da habilidade)
  clear: boolean; // chance CLARA de gol
  oneOnOne: boolean; // cara a cara com o goleiro
  insideBox: boolean;
  dGoal: number;
  angleFactor: number; // 0..1 ângulo de finalização
  blockers: number; // defensores entre jogador e gol
  nearestDefDist: number; // defensor mais próximo à frente
  gkCoverage: number; // 0..1 quanto o goleiro cobre o ângulo
  pressure: number;
}

function angleBetween(a: Vec2, b: Vec2): number {
  const la = a.len();
  const lb = b.len();
  if (la < 1e-6 || lb < 1e-6) return 0;
  return Math.acos(clamp(a.dot(b) / (la * lb), -1, 1));
}

/**
 * evaluateShotQuality — nota uma finalização considerando distância, ângulo,
 * defensores na linha de chute, defensor mais próximo, pressão, posição do
 * goleiro, se está dentro da área e se está cara a cara.
 */
export function evaluateShotQuality(player: Player, world: World): ShotEval {
  const team = player.team;
  const goalC = new Vec2(team.oppGoal.x, team.oppGoal.y);
  const postTop = new Vec2(team.oppGoal.x, GOAL_Y.top);
  const postBot = new Vec2(team.oppGoal.x, GOAL_Y.bottom);
  const dGoal = player.pos.dist(goalC);
  const attackProg = team.attackProgress(player.pos);

  const opp = oppTeam(world, player);
  const gk = opp.gk;

  // ângulo de gol visível
  const openAngle = angleBetween(postTop.sub(player.pos), postBot.sub(player.pos));
  const angleFactor = clamp(openAngle / 0.5, 0, 1); // ~28° já é ótimo

  // distância → probabilidade base (decai rápido)
  const distFactor = Math.exp(-dGoal / 9);

  // defensores na linha de chute (entre jogador e gol)
  let blockers = 0;
  let nearestDefDist = Infinity;
  for (const o of opp.players) {
    if (o.isGK || o.sentOff) continue;
    const ahead = team.attackProgress(o.pos) > attackProg; // mais perto do gol que o atacante
    const dToLine = distPointToSegment(o.pos, player.pos, goalC);
    if (ahead && dToLine < 2.2 && o.pos.dist(player.pos) < dGoal) blockers++;
    if (ahead) nearestDefDist = Math.min(nearestDefDist, o.pos.dist(player.pos));
  }
  if (!Number.isFinite(nearestDefDist)) nearestDefDist = 30;

  // cobertura do goleiro: quanto ele está sobre a linha bola→gol
  let gkCoverage = 0;
  if (gk) {
    const gkLineDist = distPointToSegment(gk.pos, player.pos, goalC);
    gkCoverage = clamp(1 - gkLineDist / 5, 0, 1);
  }

  const pressure = pressureOn(player.pos, opp.players, 6);

  let xg = distFactor * (0.35 + 0.65 * angleFactor);
  xg *= clamp(1 - 0.4 * blockers, 0.05, 1);
  xg *= 1 - 0.5 * gkCoverage;
  xg *= 1 - 0.3 * pressure;
  xg = clamp(xg, 0, 0.95);

  const insideBox =
    Math.abs(player.pos.y - FIELD.H / 2) < FIELD.PENALTY_WIDTH / 2 &&
    Math.min(player.pos.x, FIELD.W - player.pos.x) < FIELD.PENALTY_DEPTH &&
    attackProg > 0.7;

  const oneOnOne = blockers === 0 && nearestDefDist > 5 && dGoal < 19;

  const shootable = dGoal < 35 && attackProg > 0.42;

  const clear =
    shootable &&
    ((insideBox && blockers === 0 && nearestDefDist > 3 && angleFactor > 0.22) ||
      oneOnOne ||
      xg > 0.33);

  return {
    shootable,
    xg,
    clear,
    oneOnOne,
    insideBox,
    dGoal,
    angleFactor,
    blockers,
    nearestDefDist,
    gkCoverage,
    pressure,
  };
}

/** Chance CLARA de gol — atalho para a IA priorizar a finalização. */
export function isClearChance(player: Player, world: World): boolean {
  return evaluateShotQuality(player, world).clear;
}

/** Valor esperado de gol (xG) 0..1. */
export function getExpectedGoalValue(player: Player, world: World): number {
  return evaluateShotQuality(player, world).xg;
}
