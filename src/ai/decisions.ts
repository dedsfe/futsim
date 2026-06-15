import { FIELD } from "../core/constants";
import { rng } from "../core/random";
import { clamp, lerp, Vec2 } from "../core/Vector2";
import type { Player } from "../domain/Player";
import type { PossessionStyle } from "../domain/types";
import { World, opponentsOf, teammatesOf } from "./context";
import { laneClearness, openSpace, pressureOn } from "./perception";
import { evaluateShotQuality, ShotEval } from "./shooting";
import { mentalityBias } from "../tactics/defaults";

export type DecisionKind =
  | "shoot"
  | "pass"
  | "through"
  | "cross"
  | "long"
  | "clear"
  | "carry"
  | "dribble"
  | "shield";

/** Registro de depuração: por que uma ação foi escolhida. */
export interface DecisionLog {
  chosen: DecisionKind;
  reason: string;
  scores: { kind: string; score: number }[];
  xg: number;
}

export interface Decision {
  kind: DecisionKind;
  target: Vec2;
  receiver?: Player;
  log?: DecisionLog;
}

interface Cand {
  score: number;
  label: string;
  d: Decision;
}

/** Pesos por estilo de posse — modela "passar curto" vs "jogo direto" etc. */
function styleWeights(style: PossessionStyle) {
  switch (style) {
    case "short": return { forward: 0.9, longBall: 0.4, through: 0.5, safe: 1.15, carry: 0.82 };
    case "direct": return { forward: 1.4, longBall: 1.0, through: 0.9, safe: 0.75, carry: 0.85 };
    case "counter": return { forward: 1.55, longBall: 1.1, through: 1.0, safe: 0.65, carry: 0.95 };
    case "long": return { forward: 1.15, longBall: 1.7, through: 0.75, safe: 0.8, carry: 0.7 };
    case "fast": return { forward: 1.4, longBall: 0.9, through: 0.95, safe: 0.8, carry: 0.95 };
  }
}

/**
 * Lançamento só é justificável com contexto (Parte 5): há atacante atacando
 * espaço num corredor livre e o passador tem qualidade; OU a defesa está alta
 * (espaço nas costas); OU é emergência sob pressão. A tática (longBallFreq)
 * também precisa permitir. Caso contrário, o lançamento é fortemente penalizado.
 */
export function shouldAttemptLongBall(owner: Player, world: World): boolean {
  const team = owner.team;
  const t = team.tactics;
  const opp = opponentsOf(world, owner);
  const attackVec = new Vec2(team.attackDir, 0);
  const attackProg = team.attackProgress(owner.pos);
  const pressure = pressureOn(owner.pos, opp, 7);
  if (pressure > 0.62 && attackProg < 0.32) return true; // emergência

  const runner = teammatesOf(world, owner)
    .filter((m) => !m.isGK && !m.sentOff && team.attackProgress(m.pos) > attackProg + 0.15)
    .sort((a, b) => team.attackProgress(b.pos) - team.attackProgress(a.pos))[0];
  if (!runner) return false;

  const space = openSpace(runner.pos, attackVec, opp, 16) > 0.45;
  const quality = owner.skill("passing") > 0.55 || owner.skill("vision") > 0.55;
  const oppLineHigh = team.attackProgress(runner.pos) < 0.85 && space; // espaço nas costas
  return t.longBallFreq > 0.2 && quality && (space || oppLineHigh);
}

/** Chutão só em emergência real no próprio terço sob pressão (Parte 5). */
export function shouldClearBall(owner: Player, world: World): boolean {
  const team = owner.team;
  const opp = opponentsOf(world, owner);
  const attackProg = team.attackProgress(owner.pos);
  const pressure = pressureOn(owner.pos, opp, 6);
  const lowFreq = team.tactics.longBallFreq < 0.45;
  return attackProg < 0.3 && pressure > (lowFreq ? 0.78 : 0.62);
}

/**
 * Decisão do portador da bola por PONTUAÇÃO (Parte 2, revisada). Cada ação recebe
 * uma nota; a melhor vence — com ruído proporcional à (falta de) "decisão" do
 * jogador. Diferença-chave desta revisão: o time tem INTENÇÃO DE VENCER —
 * finalização em chance clara recebe bônus enorme e passe lateral/atrás sem
 * progressão é penalizado quando existe opção ofensiva melhor.
 */
export function decide(owner: Player, world: World): Decision {
  const team = owner.team;
  const t = team.tactics;
  const sw = styleWeights(t.possession);
  const mb = mentalityBias[t.mentality];
  const opp = opponentsOf(world, owner);
  const mates = teammatesOf(world, owner).filter((m) => !m.sentOff);
  const goal = new Vec2(team.oppGoal.x, team.oppGoal.y);
  const attackProg = team.attackProgress(owner.pos);
  const selfPressure = pressureOn(owner.pos, opp, 7);
  const attackVec = new Vec2(team.attackDir, 0);
  // "fome de gol": ataque arrisca mais p/ finalizar
  const intent = 0.85 + 0.5 * mb;
  // contexto de bola longa (Parte 5): permite ou penaliza lançamentos
  const longBallOk = shouldAttemptLongBall(owner, world);
  const longMul = longBallOk ? lerp(0.55, 1.15, t.longBallFreq) : 0.35;

  // linha de impedimento adversária — não passar para quem está impedido
  const oppProgs = opp.filter((o) => !o.sentOff).map((o) => team.attackProgress(o.pos)).sort((a, b) => b - a);
  const offsideLineA = oppProgs[1] ?? oppProgs[0] ?? 1;
  const isOffsideNow = (pos: Vec2) =>
    team.attackProgress(pos) > 0.5 &&
    team.attackProgress(pos) > attackProg &&
    team.attackProgress(pos) > offsideLineA + 0.005;

  const cands: Cand[] = [];

  // ---------------- CHUTAR ----------------
  const shot: ShotEval = evaluateShotQuality(owner, world);
  let ownShotXg = 0;
  // dentro da área chuta com chance modesta; de fora só com chance muito boa
  // (batedor de longe arrisca de mais longe)
  const outsideThresh = owner.hasTrait("LONG_SHOT_TAKER") ? 0.11 : 0.18;
  const shotOk = shot.shootable && shot.blockers < 2 &&
    ((shot.insideBox && (shot.clear || shot.xg > 0.06)) ||
      (!shot.insideBox && (shot.oneOnOne || shot.xg > outsideThresh)));
  if (shotOk) {
    ownShotXg = shot.xg;
    const fin = owner.skill("finishing") * 0.6 + owner.skill("shooting") * 0.4;
    let s = (0.3 + 2.6 * shot.xg) * (0.65 + 0.6 * fin) * (1 - 0.2 * shot.pressure) * intent;
    // BÔNUS ENORME para chance clara — não pode tocar de lado à toa
    if (shot.clear) s += 1.9;
    if (shot.oneOnOne) s += 1.3;
    if (shot.insideBox) s += 0.5;
    if (owner.instr.shootMore) s *= 1.3;
    if (owner.hasTrait("FINALIZER") || owner.hasTrait("BOX_FINISHER") || owner.hasTrait("POACHER") || owner.hasTrait("COMPLETE_FORWARD")) s *= 1.15;
    cands.push({ score: s, label: "SHOOT", d: { kind: "shoot", target: aimShot(owner, world, shot) } });
  }

  // ---------------- PASSES (curto, inversão, profundidade, assistência) -----
  let forwardOptionAvailable = false;
  for (const m of mates) {
    if (m.isGK && attackProg > 0.35) continue;
    if (isOffsideNow(m.pos)) continue; // não passa para companheiro impedido
    const to = m.pos;
    const dist = owner.pos.dist(to);
    if (dist < 2.5) continue;
    const lane = laneClearness(owner.pos, to, opp);
    if (lane < 0.1) continue;
    const recvPressure = pressureOn(to, opp, 8);
    const openness = 1 - recvPressure;
    const gain = team.attackProgress(to) - attackProg; // -1..1
    const passSkill = owner.skill("passing") * 0.6 + owner.skill("vision") * 0.4;
    if (gain > 0.04 && openness > 0.4) forwardOptionAvailable = true;

    const isLong = dist > 28;
    const longPenalty = isLong ? (1 - sw.longBall) * 0.5 : dist > 18 ? 0.1 : 0;
    const safety = lane * 0.6 + openness * 0.4;
    const forwardVal = gain > 0 ? gain * sw.forward : gain * 0.5;

    let s =
      0.08 +
      0.3 * safety +
      1.0 * forwardVal +
      0.18 * openness +
      0.25 * passSkill +
      0.5 * selfPressure * safety -
      longPenalty;

    // ASSISTÊNCIA: passar para companheiro em posição MELHOR de finalização
    if (team.attackProgress(to) > 0.6) {
      const mShot = evaluateShotQuality(m, world);
      if (mShot.xg > ownShotXg + 0.05 && openness > 0.45) {
        s += 1.4 * mShot.xg + (mShot.clear ? 0.8 : 0);
      }
    }

    // inversão de jogo
    if (Math.abs(to.y - owner.pos.y) > 22 && openness > 0.6) s += 0.18;

    if (owner.instr.passRisk === "safe") s += safety * 0.3 - Math.max(0, forwardVal) * 0.2;
    if (owner.instr.passRisk === "risky") s += Math.max(0, forwardVal) * 0.3;
    // de frente pro gol no terço ofensivo NÃO se toca pra trás à toa
    if (gain < -0.03 && attackProg > 0.5) s -= 0.7;
    // passe LONGO (rifar) só com contexto e conforme a tática (Parte 5);
    // passe progressivo rasteiro é o PADRÃO — favorecido com força pela tática
    if (isLong) s *= longMul;
    else if (gain > 0.04) s *= 1 + 0.45 * t.progressivePassBias;

    cands.push({
      score: s,
      label: gain < -0.03 ? "BACK_PASS" : isLong ? "LONG" : "PASS",
      d: { kind: isLong ? "long" : "pass", target: to, receiver: m },
    });

    // lançamento em PROFUNDIDADE — só com corredor REALMENTE livre e linha limpa
    // (evita a "diagonal pra ninguém"); alvo mais curto, ao alcance do corredor.
    if ((m.role === "ST" || m.role === "WG" || m.role === "AM" || m.instr.attackDepth) && gain > 0) {
      const lead = lerp(5, 11, m.skill("pace"));
      const leadPoint = m.pos.add(attackVec.scale(lead));
      const tLane = laneClearness(owner.pos, leadPoint, opp, 2.6);
      const spaceForRun = openSpace(m.pos, attackVec, opp, 16);
      if (team.attackProgress(leadPoint) < 0.97 && spaceForRun > 0.5 && tLane > 0.45) {
        forwardOptionAvailable = true;
        let ts = (0.15 + 0.4 * tLane + 0.45 * spaceForRun + 0.3 * m.skill("pace")) *
          sw.through * (0.7 + 0.4 * owner.skill("vision"));
        if (owner.hasTrait("PLAYMAKER") || owner.hasTrait("CREATIVE_PASSER")) ts *= 1.15;
        cands.push({ score: ts, label: "THROUGH", d: { kind: "through", target: leadPoint, receiver: m } });
      }
    }
  }

  // ---------------- CRUZAR ----------------
  const wide = Math.abs(owner.pos.y - FIELD.H / 2) > 17;
  if (wide && attackProg > 0.6) {
    const matesInBox = mates.filter(
      (m) => m.pos.dist(goal) < 20 && team.attackProgress(m.pos) > 0.78,
    );
    if (matesInBox.length > 0) {
      // MIRA num jogador real na área (mais forte no alto), levemente à frente
      const target = matesInBox.sort((a, b) => b.attr.strength - a.attr.strength)[0];
      const aim = target.pos.add(attackVec.scale(1.5));
      let s = (0.3 + 0.25 * matesInBox.length + 0.45 * owner.skill("crossing")) * sw.forward * intent;
      if (owner.instr.crossMore) s *= 1.3;
      cands.push({ score: s, label: "CROSS", d: { kind: "cross", target: aim, receiver: target } });
    }
  }

  // ---------------- CONDUZIR (drible/controle dão vantagem, mas passe é base) -
  {
    const fwdSpace = openSpace(owner.pos, attackVec, opp, 14);
    const carryDir = attackVec.scale(0.7).add(goal.sub(owner.pos).normalized().scale(0.3)).normalized();
    const target = owner.pos.add(carryDir.scale(8));
    let s = (0.3 + 0.45 * fwdSpace + 0.14 * owner.skill("control") + 0.18 * owner.skill("dribbling")) * sw.carry * (1 - 0.6 * selfPressure);
    if (owner.instr.dribbleMore) s += 0.08;
    if (owner.hasTrait("DRIBBLER") || owner.hasTrait("BALL_CARRIER")) s *= 1.15; // conduz/segura mais
    if (owner.hasTrait("SPEEDSTER")) s *= 1.06;
    cands.push({ score: s, label: "CARRY", d: { kind: "carry", target } });
  }

  // ---------------- DRIBLAR ----------------
  {
    const nearOpp = opp.reduce(
      (acc, o) => (!o.sentOff && o.pos.dist(owner.pos) < acc.d ? { o, d: o.pos.dist(owner.pos) } : acc),
      { o: null as Player | null, d: 99 },
    );
    if (nearOpp.o && nearOpp.d < 4) {
      const beyond = owner.pos.add(attackVec.scale(5));
      const spaceBeyond = openSpace(beyond, attackVec, opp, 10);
      const isolated = clamp(nearOpp.d / 4, 0, 1);
      let s = (0.15 + 0.6 * owner.skill("dribbling") + 0.3 * spaceBeyond) * (0.5 + 0.5 * isolated);
      // cara a cara com goleiro: driblar o goleiro é boa opção
      if (shot.oneOnOne && nearOpp.o.isGK) s += 0.6;
      if (owner.instr.dribbleMore) s *= 1.3;
      if (owner.hasTrait("DRIBBLER")) s *= 1.22; // driblador aceita mais o 1x1
      cands.push({ score: s, label: "DRIBBLE", d: { kind: "dribble", target: beyond } });
    }
  }

  // ---------------- RECUAR (toque de segurança, só FORA do terço ofensivo) --
  if (selfPressure > 0.42 && attackProg < 0.5) {
    const back = mates
      .filter((m) => team.attackProgress(m.pos) < attackProg - 0.05)
      .map((m) => ({ m, free: 1 - pressureOn(m.pos, opp, 8), lane: laneClearness(owner.pos, m.pos, opp) }))
      .sort((a, b) => b.free + b.lane - (a.free + a.lane))[0];
    if (back && back.lane > 0.35) {
      const penalty = forwardOptionAvailable ? 0.5 : 0;
      const s = (0.2 + 0.4 * back.free + 0.3 * back.lane) * sw.safe * (0.5 + 0.6 * selfPressure) - penalty;
      cands.push({ score: s, label: "BACK_PASS", d: { kind: "pass", target: back.m.pos, receiver: back.m } });
    }
  }

  // ---------------- BOLA DE SAÍDA sob pressão no campo de defesa ----
  if (attackProg < 0.42 && selfPressure > 0.45) {
    // saída CURTA preferida (respeita "saída de bola: curta")
    const shortEsc = mates
      .filter((m) => !m.isGK && !isOffsideNow(m.pos))
      .map((m) => ({ m, free: 1 - pressureOn(m.pos, opp, 8), lane: laneClearness(owner.pos, m.pos, opp), d: owner.pos.dist(m.pos) }))
      .filter((o) => o.d < 24 && o.lane > 0.45 && o.free > 0.5)
      .sort((a, b) => b.free + b.lane - (a.free + a.lane))[0];
    if (shortEsc) {
      cands.push({ score: 0.5 + 0.5 * selfPressure + 0.2 * shortEsc.free, label: "PASS", d: { kind: "pass", target: shortEsc.m.pos, receiver: shortEsc.m } });
    }
    // saída LONGA só com contexto de bola longa OU sem saída curta segura
    const outlet = mates
      .filter((m) => !m.isGK && !isOffsideNow(m.pos) && team.attackProgress(m.pos) > attackProg + 0.2)
      .sort((a, b) => team.attackProgress(b.pos) - team.attackProgress(a.pos))[0];
    if (outlet && (longBallOk || !shortEsc)) {
      const lead = outlet.pos.add(attackVec.scale(5));
      const s = (0.5 + 0.55 * selfPressure + 0.3 * owner.skill("passing")) * (0.6 + 0.6 * sw.longBall) * (shortEsc ? longMul : 1);
      cands.push({ score: s, label: "LONG", d: { kind: "long", target: lead, receiver: outlet } });
    }
  }

  // ---------------- CHUTÃO: só emergência real (shouldClearBall) -------------
  if (shouldClearBall(owner, world)) {
    const clearTo = new Vec2(owner.pos.x + team.attackDir * 30, FIELD.H / 2 + (rng.next() - 0.5) * 24);
    cands.push({ score: 0.5 + 0.5 * selfPressure, label: "CLEAR", d: { kind: "clear", target: clearTo } });
  }

  // ---------------- SEGURAR (proteger a bola — força/controle/drible) -------
  const holdSkill = owner.skill("strength") * 0.5 + owner.skill("dribbling") * 0.3 + owner.skill("control") * 0.2;
  cands.push({
    score: (0.1 + 0.3 * holdSkill) * (0.4 + selfPressure),
    label: "SHIELD",
    d: { kind: "shield", target: owner.pos },
  });

  // ---------------- ruído de DECISÃO -------
  // vem do QI (atributo "decisão"/visão), não de um multiplicador genérico de overall.
  const noise = lerp(0.32, 0.045, owner.decisionSkill()) * (1 + 0.5 * selfPressure);
  const freedom = 0.5 + t.creativeFreedom;
  let best = cands[0];
  let bestScore = -Infinity;
  for (const c of cands) {
    const s = c.score + rng.gauss() * noise * freedom;
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }

  best.d.log = buildLog(best, cands, shot, selfPressure);
  return best.d;
}

/** Mira do chute: canto do gol mais afastado do goleiro (colocado). */
function aimShot(owner: Player, world: World, shot: ShotEval): Vec2 {
  const team = owner.team;
  const gk = (owner.side === "home" ? world.away : world.home).gk;
  const goalX = team.oppGoal.x;
  // mira perto das traves; se há goleiro, vai ao lado oposto a ele
  let aimY = FIELD.H / 2;
  const margin = 1.0;
  const top = FIELD.H / 2 - 3.66 + margin;
  const bot = FIELD.H / 2 + 3.66 - margin;
  if (gk && shot.dGoal < 26) {
    aimY = gk.pos.y > FIELD.H / 2 ? top : bot;
  } else {
    aimY = rng.next() < 0.5 ? top : bot;
  }
  return new Vec2(goalX, aimY);
}

function buildLog(best: Cand, cands: Cand[], shot: ShotEval, pressure: number): DecisionLog {
  const top = [...cands].sort((a, b) => b.score - a.score).slice(0, 6)
    .map((c) => ({ kind: c.label, score: Math.round(c.score * 100) }));
  const reasons: string[] = [];
  if (best.label === "SHOOT") {
    if (shot.clear) reasons.push("chance clara");
    if (shot.oneOnOne) reasons.push("cara a cara");
    if (shot.insideBox) reasons.push("dentro da área");
    reasons.push(`xG ${shot.xg.toFixed(2)}`);
    reasons.push(pressure < 0.3 ? "pouca pressão" : "sob pressão");
  } else if (best.label === "THROUGH") reasons.push("companheiro correndo no espaço");
  else if (best.label === "CROSS") reasons.push("jogadores na área");
  else if (best.label === "CARRY") reasons.push("espaço livre à frente");
  else if (best.label === "DRIBBLE") reasons.push("marcador isolado");
  else if (best.label === "PASS" || best.label === "LONG") reasons.push("progressão com segurança");
  else if (best.label === "BACK_PASS") reasons.push("sem opção ofensiva, recompõe");
  else if (best.label === "CLEAR") reasons.push("afasta o perigo");
  else if (best.label === "SHIELD") reasons.push("protege a bola");
  return { chosen: best.d.kind, reason: reasons.join(", "), scores: top, xg: shot.xg };
}
