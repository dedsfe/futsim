import { FIELD } from "../core/constants";
import { clamp, lerp, Vec2 } from "../core/Vector2";
import type { Player } from "../domain/Player";
import type { Team } from "../domain/Team";
import { mentalityBias } from "../tactics/defaults";
import { World, opponentsOf } from "./context";
import {
  ballSideShift,
  blockPassingLaneTarget,
  blockShootingLane,
  coveringTarget,
  dangerLevel,
  getCoveringDefender,
  getNearestDefenderToBall,
  trackRunnerTarget,
} from "./defense";

const PRESS_THRESHOLD = { always: 1.0, mid: 0.62, low: 0.34 } as const;
const isWide = (r: string) => r === "WG" || r === "WM" || r === "FB";
const isDefender = (r: string) => r === "CB" || r === "FB" || r === "DM" || r === "WM";

/**
 * Calcula `target` e `action` de TODOS os jogadores do time, exceto o portador
 * (cujo destino vem da decisão). É aqui que a tática vira movimento — agora com
 * organização defensiva real: 1º defensor pressiona, 2º cobre, bloqueio de
 * chute, fechamento de linhas, acompanhamento de infiltração e basculamento.
 */
export function computeTeamTargets(team: Team, world: World): void {
  const t = team.tactics;
  const ball = world.ball;
  const inPoss = world.possession === team.side;
  const opp = opponentsOf(world, team.players[0]);
  const ballA = team.attackProgress(ball.pos);
  const mb = mentalityBias[t.mentality];
  const defending = !inPoss;
  const danger = defending ? dangerLevel(team, world) : 0;

  // linha de impedimento adversária (penúltimo defensor) — atacantes a respeitam
  let offsideLineA = 1;
  if (inPoss) {
    const progs = opp.filter((o) => !o.sentOff).map((o) => team.attackProgress(o.pos)).sort((a, b) => b - a);
    offsideLineA = progs[1] ?? progs[0] ?? 1;
  }

  // ---- frame coletivo: linha defensiva e linha de frente (em "progresso") ----
  // bloco mais curto ao defender (compacto verticalmente)
  const span = lerp(0.62, 0.34, t.compactness) * (inPoss ? 1 : 0.82);
  let teamLine = lerp(0.08, 0.5, t.lineHeight) + (ballA - 0.5) * 0.32;
  teamLine += inPoss ? lerp(0, 0.14, mb) : world.possession ? -0.06 : 0;
  // perigo recua a linha mesmo com instrução alta (não deixa finalizar livre)
  teamLine -= danger * 0.12;
  teamLine = clamp(teamLine, 0.06, 0.64);
  const teamFront = clamp(teamLine + span + (inPoss ? lerp(0, 0.18, mb) : 0), 0.2, 0.96);

  // ---- organização defensiva (atribui papéis) ----
  const overrides = new Map<Player, { target: Vec2; action: Player["action"] }>();
  if (defending || world.possession === null) {
    assignDefensiveRoles(team, world, danger, overrides);
  }

  // ponto previsto da bola (para receber/interceptar em movimento)
  const predicted = ball.pos.add(ball.vel.scale(0.35));
  const sideShift = ballSideShift(team, world);

  for (const p of team.players) {
    if (p === ball.owner || p.sentOff) continue;
    if (p.isGK) {
      positionGK(p, team, world, danger);
      continue;
    }

    // destinatário do passe vai ao encontro da bola
    if (!ball.owner && ball.intendedReceiver === p) {
      p.target = predicted;
      p.action = "run";
      continue;
    }

    // papel defensivo atribuído (press / cobertura / bloqueio de chute)
    const ov = overrides.get(p);
    if (ov) {
      p.target = ov.target;
      p.action = ov.action;
      continue;
    }

    // ---------- posição base no frame coletivo ----------
    const baseA = p.slot.x;
    const baseW = p.slot.y;
    const r = clamp((baseA - 0.05) / 0.73, 0, 1);
    let a = lerp(teamLine, teamFront, r);

    const width = inPoss ? t.attackWidth : t.defenseWidth;
    let w = 0.5 + (baseW - 0.5) * lerp(0.5, 1.6, width);
    // basculamento para o lado da bola (mais forte ao defender = compactar)
    w += sideShift * (inPoss ? 0.12 : 0.4 * (0.5 + 0.5 * t.compactness));

    // foco de ataque
    if (inPoss && t.attackFocus !== "balanced") {
      const fb = t.attackFocus === "left" ? -0.16 : t.attackFocus === "right" ? 0.16 : 0;
      w += fb * (0.4 + 0.6 * r);
    }

    // ---------- instruções individuais ----------
    const ins = p.instr;
    if (ins.positioning === "get-forward") a += 0.1;
    if (ins.positioning === "stay-back") a -= 0.1;
    if (ins.attackDepth && inPoss) a += 0.12;
    if (ins.overlap && inPoss && ballA >= baseA - 0.05) {
      a += 0.15;
      w = w < 0.5 ? Math.min(w, 0.14) : Math.max(w, 0.86); // pelo corredor
    }
    if (ins.betweenLines && inPoss) {
      a = clamp(ballA + 0.06, a, 0.82); // atrás dos volantes adversários
      w = lerp(w, 0.5, 0.4);
    }
    if (ins.cutInside && inPoss && isWide(p.role)) {
      w = lerp(w, 0.5, 0.6); // sai da linha, ataca o miolo
      a += 0.05;
    }
    if (ins.stayWide) w = w < 0.5 ? Math.min(w, 0.1) : Math.max(w, 0.9);
    if (ins.guardBox) { a = Math.min(a, 0.32); w = lerp(w, 0.5, 0.5); }
    if (ins.holdPosition) { a = lerp(a, baseA, 0.6); w = lerp(w, baseW, 0.6); }

    // ---------- corridas em profundidade quando em posse ----------
    // atacantes ficam adiantados mas SEGURAM A LINHA (não vivem impedidos)
    if (inPoss && (p.role === "ST" || p.role === "WG" || ins.attackDepth)) {
      const desired = Math.max(a, clamp(ballA + 0.13, 0.5, 0.96));
      a = Math.min(desired, offsideLineA + 0.04);
    }
    // estrutura: zaga e volante seguram p/ proteger contra-ataque (sem inundar)
    if (inPoss && !ins.overlap && !ins.attackDepth) {
      if (p.role === "CB") a = Math.min(a, 0.55);
      else if (p.role === "DM") a = Math.min(a, 0.66);
    }

    let target = team.progressToField(clamp(a, 0.03, 0.97), clamp(w, 0.03, 0.97));

    // ---------- ajustes defensivos finos ----------
    if (defending) {
      const track = trackRunnerTarget(p, team, world, target);
      if (track && isDefender(p.role)) target = track;
      else if (p.role === "DM" || p.role === "CM") target = blockPassingLaneTarget(p, team, world, target);
      target = applyMarking(p, team, world, target, opp);
    }

    p.target = target;
    p.action = inPoss ? (r > 0.6 ? "run" : "support") : "recover";
  }
}

/** 1º defensor pressiona, 2º dá cobertura, e bloqueio de chute em perigo alto. */
function assignDefensiveRoles(
  team: Team,
  world: World,
  danger: number,
  out: Map<Player, { target: Vec2; action: Player["action"] }>,
): void {
  const t = team.tactics;
  const ball = world.ball;
  const teamBallProg = team.attackProgress(ball.pos);
  const loose = world.possession === null;

  const pressZoneOk = teamBallProg <= PRESS_THRESHOLD[t.pressTrigger];
  // contra-pressão: ao perder a bola no campo ofensivo, pressiona forte
  const counterPress = t.onLoss === "counterpress" && teamBallProg > 0.55;
  const pressActive = loose || pressZoneOk || counterPress || danger > 0.5;

  const goalSideUnit = new Vec2(team.ownGoal.x, team.ownGoal.y).sub(ball.pos).normalized();

  // 1º defensor — pressiona o portador
  const presser = getNearestDefenderToBall(team, world);
  if (presser && pressActive) {
    out.set(presser, { target: ball.pos.add(goalSideUnit.scale(0.5)), action: "press" });
  }

  // 2º defensor — cobertura atrás do 1º
  const cover = getCoveringDefender(team, presser, world);
  if (cover && (danger > 0.3 || pressActive)) {
    out.set(cover, { target: coveringTarget(team, world), action: "mark" });
  }

  // pressores extra conforme intensidade / contra-pressão / perigo
  // defesa POSICIONAL: 1 pressiona o portador + no MÁX. 1 de apoio (= 2 na bola),
  // 1 cobre atrás (posicional), o resto mantém a forma/zona. Só em perigo extremo
  // na área entra um 3º. Nunca os "4 atrás da bola".
  let extra = (t.pressIntensity >= 0.45 ? 1 : 0) + (counterPress ? 1 : 0);
  extra = Math.min(extra, 1);
  if (danger > 0.85) extra += 1; // emergência dentro da área
  if (extra > 0 && pressActive) {
    const gate = lerp(15, 30, t.pressIntensity);
    const candidates = team
      .outfield()
      .filter((p) => !p.sentOff && p !== presser && p !== cover && p.role !== "CB") // zaga segura a linha
      .sort((a, b) => a.pos.dist(ball.pos) - b.pos.dist(ball.pos))
      .slice(0, extra);
    for (const p of candidates) {
      if (p.pos.dist(ball.pos) < gate) out.set(p, { target: ball.pos.add(goalSideUnit.scale(0.6)), action: "press" });
    }
  }

  // bloqueio da linha de chute (perigo alto / portador de frente p/ gol)
  if (danger > 0.45) {
    const block = blockShootingLane(team, world);
    if (block && !out.has(block.defender)) {
      out.set(block.defender, { target: block.target, action: "mark" });
    }
  }
}

/** Ajusta o destino para acompanhar um adversário (cobertura goal-side). */
function applyMarking(p: Player, team: Team, world: World, zonalTarget: Vec2, opp: Player[]): Vec2 {
  const t = team.tactics;
  const defensive = isDefender(p.role);

  if (p.instr.markTargetId) {
    const tgt = opp.find((o) => o.id === p.instr.markTargetId && !o.sentOff);
    if (tgt) return goalSideOf(tgt.pos, team, 1.3);
  }
  if (world.possession === team.side) return zonalTarget;

  // zaga e volante marcam firme no próprio terço (solidez/congestão na área)
  const inOwnThird = team.attackProgress(world.ball.pos) < 0.4;
  const tight = t.marking === "man" || (t.marking === "hybrid" && defensive) ||
    p.instr.marking === "tight" || (p.role === "CB" && inOwnThird);
  if (!defensive && !tight) return zonalTarget;

  const radius = tight ? 9 : 5.5;
  let pick: Player | null = null;
  let bd = radius;
  for (const o of opp) {
    if (o.isGK || o.sentOff) continue;
    const d = o.pos.dist(zonalTarget);
    if (d < bd) { bd = d; pick = o; }
  }
  if (!pick) return zonalTarget;
  const markPos = goalSideOf(pick.pos, team, tight ? 1.1 : 1.8);
  return Vec2.lerp(zonalTarget, markPos, tight ? 0.85 : 0.55);
}

function goalSideOf(target: Vec2, team: Team, gap: number): Vec2 {
  const g = new Vec2(team.ownGoal.x, team.ownGoal.y);
  return target.add(g.sub(target).normalized().scale(gap));
}

function positionGK(gk: Player, team: Team, world: World, danger: number): void {
  const g = new Vec2(team.ownGoal.x, team.ownGoal.y);
  const ball = world.ball;
  const dist = g.dist(ball.pos);

  // emergência: saída do goleiro em bola solta dentro da área / perigo extremo
  if (danger > 0.82 && !ball.owner && dist < 16) {
    gk.target = ball.pos;
    gk.action = "press";
    return;
  }

  const depth = clamp(lerp(1.5, 7, 1 - dist / 60), 1.5, danger > 0.6 ? 4 : 8);
  const dir = ball.pos.sub(g).normalized();
  const target = g.add(dir.scale(depth));
  target.y = clamp(target.y, FIELD.H / 2 - FIELD.GOAL_WIDTH, FIELD.H / 2 + FIELD.GOAL_WIDTH);
  gk.target = target;
  gk.action = "recover";
}
