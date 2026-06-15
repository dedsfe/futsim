import { FIELD } from "../core/constants";
import { rng } from "../core/random";
import { Vec2 } from "../core/Vector2";
import type { Player } from "../domain/Player";
import type { Decision } from "./decisions";
import { World, opponentsOf, teammatesOf } from "./context";
import { laneClearness, pressureOn } from "./perception";

/** Estados de decisão do goleiro COM a bola. */
export type GkState = "HOLD_BALL" | "DISTRIBUTE_SHORT" | "DISTRIBUTE_LONG" | "CLEAR_BALL";

function gkLog(state: GkState, reason: string, kind: Decision["kind"]): Decision["log"] {
  return { chosen: kind, reason: `[${state}] ${reason}`, scores: [{ kind: state, score: 100 }], xg: 0 };
}

/**
 * Decisão do GOLEIRO com a bola (Parte 2). Diferente do jogador de linha:
 * NUNCA conduz/dribla para fora da área. Prioriza segurar/distribuir conforme a
 * saída de bola do time e afasta sob pressão. "Jogo com os pés" (goalkeeping)
 * melhora a distribuição, mas o goleiro continua se comportando como goleiro.
 */
export function decideGoalkeeper(gk: Player, world: World): Decision {
  const team = gk.team;
  const t = team.tactics;
  const opp = opponentsOf(world, gk);
  const mates = teammatesOf(world, gk).filter((m) => !m.sentOff);
  const attackVec = new Vec2(team.attackDir, 0);
  const pressure = pressureOn(gk.pos, opp, 9);
  const footwork = gk.skill("goalkeeping"); // proxy de "jogo com os pés"

  const clearTarget = () =>
    new Vec2(gk.pos.x + team.attackDir * 45, FIELD.H / 2 + (rng.next() - 0.5) * 28);

  // 1) sob pressão → afasta sem hesitar (chutão)
  if (pressure > 0.45) {
    return { kind: "clear", target: clearTarget(), log: gkLog("CLEAR_BALL", "sob pressão, afasta", "clear") };
  }

  // opções de saída curta: zagueiros/laterais/volante livres e com linha limpa
  const shortOpts = mates
    .filter((m) => m.role === "CB" || m.role === "FB" || m.role === "DM")
    .map((m) => ({ m, free: 1 - pressureOn(m.pos, opp, 8), lane: laneClearness(gk.pos, m.pos, opp), d: gk.pos.dist(m.pos) }))
    .filter((o) => o.d < 38 && o.lane > 0.4 && o.free > 0.5)
    .sort((a, b) => b.free + b.lane - (a.free + a.lane));

  // opções de lançamento: jogador adiantado no campo de ataque
  const longOpts = mates
    .filter((m) => ["ST", "WG", "WM", "AM", "CM"].includes(m.role))
    .map((m) => ({ m, prog: team.attackProgress(m.pos), free: 1 - pressureOn(m.pos, opp, 10) }))
    .filter((o) => o.prog > 0.45)
    .sort((a, b) => b.prog + 0.3 * b.free - (a.prog + 0.3 * a.free));

  const wantLong = t.buildOut === "long" || t.possession === "long" || t.possession === "direct";

  // 2) time de bola longa → lança no campo de ataque
  if (wantLong && longOpts[0]) {
    const m = longOpts[0].m;
    return { kind: "long", target: m.pos.add(attackVec.scale(4)), receiver: m, log: gkLog("DISTRIBUTE_LONG", "saída longa no atacante", "long") };
  }

  // 3) saída curta segura (tem que estar realmente livre)
  if (t.buildOut === "short" && shortOpts[0] && pressure < 0.3) {
    const m = shortOpts[0].m;
    return { kind: "pass", target: m.pos, receiver: m, log: gkLog("DISTRIBUTE_SHORT", "saída curta para defensor livre", "pass") };
  }

  // 4) sem saída curta segura → lança longo se houver alvo
  if (longOpts[0] && footwork > 0.35) {
    const m = longOpts[0].m;
    return { kind: "long", target: m.pos.add(attackVec.scale(4)), receiver: m, log: gkLog("DISTRIBUTE_LONG", "sem saída curta, lança", "long") };
  }

  // 5) último recurso: afasta
  return { kind: "clear", target: clearTarget(), log: gkLog("CLEAR_BALL", "sem opção, afasta", "clear") };
}
