import { clamp } from "../core/Vector2";
import { rng } from "../core/random";
import type { Player } from "../domain/Player";
import { World } from "../ai/context";
import { isClearChance } from "../ai/shooting";

/**
 * Impedimento no momento do passe: o recebedor está em posição irregular se,
 * na metade ofensiva, está à frente da bola e do penúltimo defensor.
 * (Quem é flagrado é sempre o destinatário, logo "participa da jogada".)
 */
export function isOffside(passer: Player, receiver: Player, world: World): boolean {
  if (receiver.side !== passer.side || receiver.isGK) return false;
  const team = receiver.team;
  const recvProg = team.attackProgress(receiver.pos);
  if (recvProg <= 0.5) return false; // só na metade ofensiva

  const ballProg = team.attackProgress(world.ball.pos);
  if (recvProg <= ballProg + 0.005) return false; // não está à frente da bola

  const opps = (passer.side === "home" ? world.away : world.home).players.filter((o) => !o.sentOff);
  const progs = opps.map((o) => team.attackProgress(o.pos)).sort((a, b) => b - a);
  const secondLast = progs[1] ?? progs[0] ?? 1;
  return recvProg > secondLast + 0.005;
}

/**
 * Probabilidade de FALTA quando um desarme falha. Cresce com agressividade,
 * pressa (velocidade de aproximação), cansaço e baixa qualidade de desarme;
 * cresce também contra dribladores habilidosos (bote atrasado).
 */
export function foulChanceOnFailedTackle(defender: Player, attacker: Player): number {
  const badTackle = 1 - defender.skill("tackling");
  const aggr = defender.team.tactics.aggression;
  const fatigue = defender.fatigue;
  const slippery = attacker.skill("dribbling");
  const closingSpeed = clamp(defender.vel.len() / 8, 0, 1);
  let p =
    0.05 +
    0.16 * badTackle +
    0.12 * aggr +
    0.1 * fatigue +
    0.1 * slippery +
    0.07 * closingSpeed;
  return clamp(p, 0, 0.5);
}

export type Card = "none" | "yellow" | "red";

/**
 * Define cartão para uma falta. Vermelho direto ao impedir chance clara de gol
 * (DOGSO) ou em falta muito grave; amarelo em falta imprudente.
 */
export function cardForFoul(
  defender: Player,
  attacker: Player,
  world: World,
  wasLastDefender: boolean,
): Card {
  const deniedClearChance = wasLastDefender && isClearChance(attacker, world);
  if (deniedClearChance) return "red"; // DOGSO

  const aggr = defender.team.tactics.aggression;
  const severe = 0.006 + 0.018 * aggr + 0.015 * defender.fatigue; // entrada violenta
  if (rng.next() < severe) return "red";

  const reckless = 0.05 + 0.13 * aggr + 0.1 * (1 - defender.skill("tackling"));
  if (rng.next() < reckless) return "yellow";
  return "none";
}

/** É o último defensor de linha entre o atacante e o gol? (para DOGSO) */
export function isLastDefender(defender: Player, _world: World): boolean {
  const team = defender.team;
  const g = team.ownGoal;
  const dDef = Math.hypot(defender.pos.x - g.x, defender.pos.y - g.y);
  for (const m of team.outfield()) {
    if (m === defender || m.sentOff) continue;
    const dm = Math.hypot(m.pos.x - g.x, m.pos.y - g.y);
    // outro defensor mais perto do gol e do lado da bola → não é o último
    if (dm < dDef - 1) return false;
  }
  return true;
}
