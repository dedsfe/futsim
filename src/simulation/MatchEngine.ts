import { BALL, FIELD, GOAL_Y, MATCH, PLAYER, SIM } from "../core/constants";
import { rng } from "../core/random";
import { clamp, lerp, Vec2 } from "../core/Vector2";
import { Ball } from "../domain/Ball";
import type { Player } from "../domain/Player";
import type { Team } from "../domain/Team";
import { decide, Decision, DecisionLog } from "../ai/decisions";
import { decideGoalkeeper } from "../ai/goalkeeper";
import { World } from "../ai/context";
import { computeTeamTargets } from "../ai/positioning";
import { inOwnBox } from "../ai/defense";
import { Card, cardForFoul, foulChanceOnFailedTackle, isLastDefender, isOffside } from "./rules";

export type Phase = "kickoff" | "play" | "goal" | "halftime" | "stoppage" | "shootout" | "end";

type Side = "home" | "away";

/** Estado da disputa de pênaltis. */
export interface ShootoutState {
  homeScore: number;
  awayScore: number;
  homeKicks: boolean[]; // resultado de cada cobrança (gol = true)
  awayKicks: boolean[];
  turn: Side;
  round: number;
  kicker: Player | null;
  state: "ready" | "runup" | "strike" | "result" | "done";
  timer: number;
  lastResult: "goal" | "saved" | "missed" | null;
  pendingOutcome: "goal" | "saved" | "missed" | null;
  diveTarget: Vec2 | null; // para onde o goleiro mergulha
  winner: Side | null;
  takers: { home: Player[]; away: Player[] };
  idx: { home: number; away: number };
}

export interface MatchStats {
  possessionTicks: { home: number; away: number };
  shots: { home: number; away: number };
  shotsInBox: { home: number; away: number };
  backPasses: { home: number; away: number };
  tackles: { home: number; away: number };
  interceptions: { home: number; away: number };
  fouls: { home: number; away: number };
  offsides: { home: number; away: number };
  penalties: { home: number; away: number };
  yellow: { home: number; away: number };
  red: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  saves: { home: number; away: number };
  passesCompleted: { home: number; away: number };
  passesFailed: { home: number; away: number };
  longPass: { home: number; away: number }; // tentativas de passe longo
  longPassOk: { home: number; away: number }; // passes longos completados
  passByKind: Record<string, { att: number; ok: number }>; // por tipo: tentados/certos
  xg: { home: number; away: number };
  actions: Record<string, number>;
  actionsBySide: { home: Record<string, number>; away: Record<string, number> };
  timeOnBall: Record<string, number>; // player id -> ticks in possession
}

export interface GoalEvent {
  side: Side;
  scorer: string;
  minute: number;
  half: 1 | 2;
}

const zeroSide = () => ({ home: 0, away: 0 });

export class MatchEngine {
  ball = new Ball();
  scoreHome = 0;
  scoreAway = 0;
  gameSeconds = 0;
  realElapsed = 0; // segundos REAIS de simulação decorridos (debug)
  half: 1 | 2 = 1;
  phase: Phase = "kickoff";

  /**
   * Multiplicador APENAS do RELÓGIO da partida (1x,5x,10x,20x,30x). A física
   * (jogadores, bola, colisões, IA) roda SEMPRE em tempo real — não acelera.
   * Só o cronômetro/stamina/eventos-por-tempo correm mais rápido.
   */
  matchClockMultiplier = 10;
  /**
   * Ritmo da FÍSICA (quão rápido os jogadores/bola se movem na tela), separado do
   * relógio. 1 = tempo real natural; >1 = jogo mais ágil sem virar "turbo".
   */
  physicsSpeed = 1.8;
  /** Pausa real: congela tempo, bola, jogadores, IA e regras. */
  paused = false;
  debug = false; // loga a decisão do portador no console

  /** Máx. de tempo REAL de física recuperável de uma vez ao voltar à aba (s). */
  static readonly MAX_CATCHUP_REAL = 30;

  /** Aliases retrocompatíveis. */
  get matchSpeedMultiplier() { return this.matchClockMultiplier; }
  set matchSpeedMultiplier(v: number) { this.matchClockMultiplier = v; }
  get speed() { return this.matchClockMultiplier; }
  set speed(v: number) { this.matchClockMultiplier = v; }
  pause() { this.paused = true; }
  resume() { this.paused = false; }
  togglePause() { this.paused = !this.paused; }

  stats: MatchStats = {
    possessionTicks: zeroSide(), shots: zeroSide(), shotsInBox: zeroSide(),
    backPasses: zeroSide(), tackles: zeroSide(), interceptions: zeroSide(),
    fouls: zeroSide(), offsides: zeroSide(), penalties: zeroSide(),
    yellow: zeroSide(), red: zeroSide(),
    shotsOnTarget: zeroSide(), saves: zeroSide(), passesCompleted: zeroSide(), passesFailed: zeroSide(),
    longPass: zeroSide(), longPassOk: zeroSide(), passByKind: {},
    xg: zeroSide(), actions: {}, actionsBySide: { home: {}, away: {} },
    timeOnBall: {},
  };
  goals: GoalEvent[] = [];
  shootout: ShootoutState | null = null;
  extraTime = false;
  lastEvent = "Pontapé inicial";
  lastDecisionLog: DecisionLog | null = null;

  private acc = 0;
  /** Cronômetro de bola parada (em segundos de SIMULAÇÃO — escala com a velocidade). */
  private stoppage: number = MATCH.KICKOFF_PAUSE;
  private decisionTimer = 0;
  private pendingRestart: (() => void) | null = null;
  private offsideReceiver: Player | null = null;
  private duelFoulCooldown = 0; // evita faltas de disputa repetidas na mesma bola
  private penalty: { kicker: Player; defendSide: Side } | null = null;
  private pendingFoul: {
    spot: Vec2; attackingSide: Side; fouler: Player; victim: Player;
    card: Card; penalty: boolean; timer: number;
  } | null = null;

  private openingSide: Side = "home"; // quem deu a saída no 1º tempo
  constructor(public home: Team, public away: Team, public isKnockout: boolean = false) {
    this.openingSide = "home";
    this.setupKickoff("home");
  }

  get world(): World {
    const possession = this.ball.owner ? this.ball.owner.side : null;
    return { home: this.home, away: this.away, ball: this.ball, timeSec: this.gameSeconds, possession };
  }

  get clock(): string {
    const m = Math.floor(this.gameSeconds / 60);
    const s = Math.floor(this.gameSeconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  /**
   * Avança por frame. `realDt` = segundos REAIS desde o último frame.
   *   physicsDeltaTime = realDeltaTime           → física natural (não acelera)
   *   matchClockDeltaTime = realDeltaTime * mult  → relógio/stamina/eventos
   * A física roda em passos fixos de tempo real; o relógio avança multiplicado.
   */
  update(realDt: number) {
    if (this.paused) return;
    if (this.phase === "shootout") { this.updateShootout(Math.min(realDt, 0.05)); return; }
    if (this.phase === "end") return;
    this.realElapsed += Math.min(realDt, 0.05);
    this.advance(Math.min(realDt, 0.05), 6); // física sempre em tempo real
  }

  /** Recupera o tempo fora da tela rodando física real (limitado) — o relógio
   *  avança realElapsed * matchClockMultiplier. */
  catchUp(realElapsed: number) {
    if (this.paused || this.phase === "end" || realElapsed <= 0) return;
    this.advance(Math.min(realElapsed, MatchEngine.MAX_CATCHUP_REAL), Infinity);
  }

  /** `realDt` = tempo REAL a simular; a física avança `realDt * physicsSpeed`. */
  private advance(realDt: number, maxSteps: number) {
    this.acc += realDt * this.physicsSpeed;
    let n = 0;
    while (this.acc >= SIM.FIXED_DT && n++ < maxSteps) {
      this.tick(SIM.FIXED_DT);
      this.acc -= SIM.FIXED_DT;
      if (this.phase === "end") { this.acc = 0; break; }
    }
  }

  /** Um passo de tempo fixo: consome bola parada OU simula o jogo. */
  private tick(dt: number) {
    if (this.stoppage > 0) {
      this.stoppage -= dt;
      if (this.stoppage <= 0) {
        this.stoppage = 0;
        if (this.pendingRestart) { const fn = this.pendingRestart; this.pendingRestart = null; fn(); }
        this.phase = "play";
      }
      return; // congelado durante a parada
    }
    this.step(dt);
  }

  private step(dt: number) {
    // relógio avança em tempo de jogo; física roda a physicsSpeed. A razão
    // (mult/physicsSpeed) garante que o cronômetro continue batendo o mult× real.
    this.gameSeconds += dt * (this.matchClockMultiplier / this.physicsSpeed);
    if (this.half === 1 && this.gameSeconds >= MATCH.HALF_MINUTES * 60) {
      this.half = 2;
      this.lastEvent = "Intervalo";
      this.phase = "halftime";
      // 2º tempo: dá a saída quem NÃO começou o jogo
      this.setupKickoff(this.openingSide === "home" ? "away" : "home");
      return;
    }
    const endLimit = MATCH.HALF_MINUTES * (this.extraTime ? 160 : 120); // 90' ou 120' c/ prorrogação
    if (this.half === 2 && this.gameSeconds >= endLimit) {
      if (this.isKnockout && this.scoreHome === this.scoreAway) {
        this.startShootout();
      } else {
        this.phase = "end";
        this.lastEvent = this.extraTime ? "Fim da prorrogação" : "Fim de jogo";
      }
      return;
    }

    // pênalti em execução
    if (this.penalty) { this.takePenalty(); return; }

    const world = this.world;
    if (world.possession) {
      this.stats.possessionTicks[world.possession]++;
      if (this.ball.owner) {
        this.stats.timeOnBall[this.ball.owner.id] = (this.stats.timeOnBall[this.ball.owner.id] || 0) + 1;
      }
    }

    // vantagem (lei da vantagem)
    if (this.pendingFoul) this.tickAdvantage(dt);

    // decisão do portador
    if (this.ball.owner) {
      const owner = this.ball.owner;
      if (owner.isGK) owner.target = owner.pos.clone(); // goleiro não sai conduzindo
      this.decisionTimer -= dt;
      if (this.decisionTimer <= 0) {
        const d = owner.isGK ? decideGoalkeeper(owner, world) : decide(owner, world);
        if (d.log) {
          this.lastDecisionLog = d.log;
          owner.lastDecision = { chosen: d.log.chosen, reason: d.log.reason };
          this.stats.actions[d.log.chosen] = (this.stats.actions[d.log.chosen] ?? 0) + 1;
          const bySide = this.stats.actionsBySide[owner.side];
          bySide[d.log.chosen] = (bySide[d.log.chosen] ?? 0) + 1;
          if (this.debug) console.log(`[${owner.team.name} #${owner.shirt}] ${d.log.chosen.toUpperCase()} — ${d.log.reason} | ${d.log.scores.map((s) => `${s.kind}:${s.score}`).join("  ")}`);
        }
        this.execute(owner, d, world);
        const tempo = owner.team.tactics.tempo;
        this.decisionTimer = Math.max(SIM.DECISION_INTERVAL, lerp(0.42, 0.16, tempo));
      }
    }

    computeTeamTargets(this.home, world);
    computeTeamTargets(this.away, world);

    // stamina cai em tempo de JOGO (razão mult/physicsSpeed por passo de física)
    const stScale = this.matchClockMultiplier / this.physicsSpeed;
    for (const p of this.home.players) p.steer(dt, this.urgency(p), stScale);
    for (const p of this.away.players) p.steer(dt, this.urgency(p), stScale);
    this.clampPlayers();

    if (this.ball.owner) {
      const o = this.ball.owner;
      this.ball.pos = o.pos.add(o.facing.scale(PLAYER.RADIUS + BALL.RADIUS + 0.2));
      this.ball.vel = o.vel.clone();
    } else {
      this.ball.integrate(dt);
    }

    this.resolveTackles(dt);
    if (this.stoppage > 0) return;
    this.resolveLooseBall(dt);
    this.resolveBoundaries();
    if (this.duelFoulCooldown > 0) this.duelFoulCooldown -= dt;
    for (const p of [...this.home.players, ...this.away.players]) {
      if (p.recoverTimer > 0) p.recoverTimer -= dt;
    }
  }

  private urgency(p: Player): number {
    const fit = lerp(0.82, 1, p.stamina); // cansaço reduz intensidade
    if (p === this.ball.owner) {
      if (p.action === "shield") return 0.2;
      return lerp(0.6, 1, p.team.tactics.tempo) * fit;
    }
    let u: number;
    switch (p.action) {
      case "press": u = 1; break;
      case "run": u = 0.95; break;
      case "mark": u = 0.9; break;
      case "recover": u = 0.85; break;
      case "support": u = 0.72; break;
      default: u = 0.4;
    }
    return u * fit;
  }

  // ---------------- execução de decisões ----------------
  private execute(owner: Player, d: Decision, world: World) {
    owner.action = d.kind === "dribble" || d.kind === "carry" ? d.kind : "carry";
    const pressure = this.pressureQuick(owner, world);

    switch (d.kind) {
      case "shoot": {
        this.stats.shots[owner.side]++;
        if (this.inShootingBox(owner)) this.stats.shotsInBox[owner.side]++;
        this.stats.xg[owner.side] += d.log?.xg ?? 0;
        this.lastEvent = `Chute de ${owner.team.name}`;
        const err = rng.gauss() * lerp(0.2, 0.03, owner.skill("finishing")) * (1 + 0.7 * pressure);
        const speed = BALL.MAX_SHOT_SPEED * lerp(0.72, 1, owner.skill("shooting"));
        this.kickToward(owner, d.target, speed, err);
        break;
      }
      case "cross": {
        const err = rng.gauss() * lerp(0.16, 0.04, owner.skill("crossing")) * (1 + 0.5 * pressure);
        this.kickToward(owner, d.target, this.reachSpeed(owner.pos.dist(d.target)) * 1.15, err, BALL.MAX_PASS_SPEED);
        const mates = (owner.side === "home" ? this.home : this.away).outfield();
        this.ball.intendedReceiver = d.receiver ?? mates.filter((m) => m !== owner && !m.sentOff)
          .sort((a, b) => a.pos.dist(d.target) - b.pos.dist(d.target))[0] ?? null;
        this.ball.passKind = "cross";
        (this.stats.passByKind.cross ??= { att: 0, ok: 0 }).att++;
        this.lastEvent = `Cruzamento de ${owner.team.name}`;
        break;
      }
      case "long":
      case "through":
      case "pass": {
        if (d.receiver && world.possession) {
          const prog = owner.team.attackProgress(d.target);
          if (prog < owner.team.attackProgress(owner.pos) - 0.03) this.stats.backPasses[owner.side]++;
        }
        const dist = owner.pos.dist(d.target);
        const isLong = d.kind === "long";
        // passe longo usa a habilidade de passe + visão; erro ANGULAR menor para
        // não ser amplificado demais pela distância (senão long pass sempre erra)
        const passSkill = isLong
          ? owner.skill("passing") * 0.7 + owner.skill("vision") * 0.3
          : owner.skill("passing");
        const base = isLong ? lerp(0.1, 0.016, passSkill) : lerp(0.16, 0.025, passSkill);
        const riskMul = owner.instr.passRisk === "risky" ? 1.25 : owner.instr.passRisk === "safe" ? 0.8 : 1;
        const err = rng.gauss() * base * riskMul * (1 + 0.8 * pressure);
        // velocidade que ALCANCE o alvo (cap maior p/ passe longo não cair curto)
        const cap = isLong ? BALL.MAX_PASS_SPEED * 1.3 : BALL.MAX_PASS_SPEED;
        const speed = this.reachSpeed(dist, cap) * (d.kind === "through" ? 0.95 : 1);
        this.kickToward(owner, d.target, speed, err, cap);
        this.ball.intendedReceiver = d.receiver ?? null;
        this.ball.passKind = d.kind;
        (this.stats.passByKind[d.kind] ??= { att: 0, ok: 0 }).att++;
        if (isLong) this.stats.longPass[owner.side]++;
        // impedimento checado no momento do passe
        if (d.receiver && isOffside(owner, d.receiver, world)) this.offsideReceiver = d.receiver;
        else this.offsideReceiver = null;
        break;
      }
      case "clear": {
        const err = rng.gauss() * 0.14;
        this.kickToward(owner, d.target, BALL.MAX_PASS_SPEED, err, BALL.MAX_PASS_SPEED);
        this.lastEvent = `Afastou — ${owner.team.name}`;
        break;
      }
      case "carry":
      case "dribble":
        owner.target = d.target;
        break;
      case "shield":
        owner.target = owner.pos.clone();
        break;
    }
  }

  private inShootingBox(p: Player): boolean {
    return (
      Math.abs(p.pos.y - FIELD.H / 2) < FIELD.PENALTY_WIDTH / 2 &&
      Math.min(p.pos.x, FIELD.W - p.pos.x) < FIELD.PENALTY_DEPTH &&
      p.team.attackProgress(p.pos) > 0.7
    );
  }

  private reachSpeed(dist: number, max: number = BALL.MAX_PASS_SPEED) {
    return clamp(Math.sqrt(2 * BALL.FRICTION_DECEL * dist) * 1.12, 6, max);
  }

  private kickToward(owner: Player, target: Vec2, speed: number, errRad: number, cap: number = BALL.MAX_SHOT_SPEED) {
    const a = target.sub(this.ball.pos).angle() + errRad;
    const dir = Vec2.fromAngle(a, 1);
    owner.facing = dir;
    this.ball.kick(dir, Math.min(speed, cap), owner.side);
    this.ball.lastTouchPlayer = owner;
    owner.recoverTimer = 0.15;
  }

  private pressureQuick(p: Player, world: World): number {
    const opp = p.side === "home" ? world.away.players : world.home.players;
    let sum = 0;
    for (const o of opp) {
      if (o.sentOff) continue;
      const d = o.pos.dist(p.pos);
      if (d < 6) sum += 1 - d / 6;
    }
    return clamp(sum, 0, 1);
  }

  // ---------------- disputas, desarmes e faltas ----------------
  private resolveTackles(dt: number) {
    const owner = this.ball.owner;
    if (!owner || owner.recoverTimer > 0) return;
    const opp = owner.side === "home" ? this.away.players : this.home.players;
    let best: Player | null = null;
    let bd: number = PLAYER.TACKLE_RADIUS;
    for (const o of opp) {
      if (o.recoverTimer > 0 || o.sentOff) continue;
      const d = o.pos.dist(owner.pos);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return;
    // tentativa de desarme discreta (~ a cada 0.35s)
    if (rng.next() > dt / 0.35) return;

    this.stats.tackles[best.side]++;
    const edge = (best.skill("tackling") * 0.6 + best.skill("strength") * 0.3 + best.skill("marking") * 0.1) -
      (owner.skill("dribbling") * 0.55 + owner.skill("control") * 0.25 + owner.skill("strength") * 0.2);
    const aggr = best.team.tactics.aggression;
    // jogador "press-resistant" (Pedri, Vitinha...) perde menos bola sob pressão
    const resist = owner.hasTrait("PRESS_RESISTANT") ? 0.7 : 1;
    const pSucc = clamp((0.14 + edge * 0.55 + aggr * 0.05) * resist, 0.03, 0.72);

    if (rng.chance(pSucc)) {
      // desarme limpo
      this.ball.owner = null;
      const away = best.pos.sub(owner.pos).normalized();
      this.ball.kick(away, rng.range(2, 5), best.side);
      this.ball.looseLock = 0.05;
      owner.recoverTimer = 0.4;
      best.recoverTimer = 0.12;
      this.lastEvent = `Desarme de ${best.team.name}`;
    } else if (rng.chance(foulChanceOnFailedTackle(best, owner))) {
      this.triggerFoul(best, owner);
    } else {
      best.recoverTimer = 0.2; // bote errado, recompõe
    }
  }

  private resolveLooseBall(dt: number) {
    if (this.ball.owner || this.ball.looseLock > 0) return;
    const all = [...this.home.players, ...this.away.players];
    const reachOf = (p: Player) => (p.isGK ? 2.9 : PLAYER.CONTROL_RADIUS);
    const contenders = all.filter((p) => p.recoverTimer <= 0 && !p.sentOff && p.pos.dist(this.ball.pos) < reachOf(p));
    if (contenders.length === 0) return;

    // ---- DISPUTA DE BOLA (50/50): FÍSICO decide mais, depois controle/proximidade ----
    let best: Player = contenders[0];
    let bestScore = -Infinity;
    for (const c of contenders) {
      const close = 1 - c.pos.dist(this.ball.pos) / reachOf(c); // 0..1
      const ctrl = c.isGK ? c.skill("goalkeeping") : c.skill("control");
      let sc = 0.5 * c.skill("strength") + 0.25 * ctrl + 0.2 * close + 0.05 * c.team.tactics.aggression + rng.range(0, 0.1);
      if (c.isGK) sc += 0.35; // goleiro tem prioridade na bola ao seu alcance
      if (sc > bestScore) { bestScore = sc; best = c; }
    }

    // ---- FALTA NA DISPUTA: só quando o PERDEDOR físico desafia colado e a bola
    // está parada (raro; o desarme normal já cobre a maioria das faltas) ----
    const rival = contenders.find((c) => c.side !== best.side && !c.isGK && c.pos.dist(this.ball.pos) < 1.0);
    if (rival && !best.isGK && this.ball.speed() < 4 && this.duelFoulCooldown <= 0 && rng.next() < dt / 0.5) {
      const loser = best.skill("strength") >= rival.skill("strength") ? rival : best;
      const winner = loser === best ? rival : best;
      const gap = winner.skill("strength") - loser.skill("strength");
      const pFoul = clamp(0.04 + loser.team.tactics.aggression * 0.1 + Math.max(0, gap) * 0.3, 0, 0.22);
      if (rng.chance(pFoul)) { this.duelFoulCooldown = 4; this.triggerFoul(loser, winner); return; }
    }

    const sp = this.ball.speed();
    const dist = best.pos.dist(this.ball.pos);
    let p: number;
    if (best.isGK) {
      // defesa: goleiro segura bem mesmo chutes fortes se estiver na trajetória
      const close = clamp(1 - dist / 2.9, 0, 1);
      p = clamp((0.55 + 0.45 * best.skill("goalkeeping")) * clamp(1 - sp / 70, 0.5, 1) * (0.35 + 0.65 * close), 0, 0.97);
    } else {
      const speedFactor = clamp(1 - sp / 24, 0.15, 1);
      const close = clamp(1 - dist / PLAYER.CONTROL_RADIUS, 0, 1);
      p = clamp((0.3 + 0.55 * best.skill("control")) * speedFactor * (0.4 + 0.6 * close), 0, 0.97);
    }
    if (!rng.chance(p)) return;

    const switched = this.ball.lastTouchSide && this.ball.lastTouchSide !== best.side;
    // impedimento: o jogador flagrado tocou a bola
    if (this.offsideReceiver && best === this.offsideReceiver) {
      return this.whistleOffside(best);
    }
    this.offsideReceiver = null;

    const shooterSide = this.ball.lastTouchSide;
    const wasShot = sp > 16 && !!this.ball.lastTouchPlayer && !this.ball.intendedReceiver;
    // defesa do goleiro a um chute
    if (best.isGK && switched && wasShot && shooterSide) {
      this.stats.saves[best.side]++;
      this.stats.shotsOnTarget[shooterSide]++;
    }
    // interceptação de passe (adversário rouba bola em movimento)
    if (switched && !best.isGK && sp > 5 && this.ball.intendedReceiver && this.ball.intendedReceiver.side !== best.side) {
      this.stats.interceptions[best.side]++;
    }
    // passe certo / errado: completo se chega a QUALQUER companheiro (definição
    // padrão); errado se um adversário recupera. Conta o passe longo à parte.
    if (this.ball.intendedReceiver && shooterSide && this.ball.passKind) {
      if (best.side === shooterSide) {
        this.stats.passesCompleted[shooterSide]++;
        if (this.ball.passKind === "long") this.stats.longPassOk[shooterSide]++;
        (this.stats.passByKind[this.ball.passKind] ??= { att: 0, ok: 0 }).ok++;
      } else {
        this.stats.passesFailed[shooterSide]++;
      }
    }

    this.ball.owner = best;
    this.ball.lastTouchPlayer = best;
    this.ball.intendedReceiver = null;
    this.ball.passKind = null;
    this.ball.vel = new Vec2(0, 0);
    this.decisionTimer = best.isGK ? 0.5 : 0.12;
    if (best.isGK && switched) this.lastEvent = `Defesa de ${best.team.name}!`;
    else if (switched) this.lastEvent = `Recuperou — ${best.team.name}`;
  }

  // ---------------- FALTAS / VANTAGEM / CARTÕES ----------------
  private triggerFoul(fouler: Player, victim: Player) {
    const inBox = inOwnBox(fouler.team, victim.pos);
    const lastMan = isLastDefender(fouler, this.world);
    const card = cardForFoul(fouler, victim, this.world, lastMan);
    this.pendingFoul = {
      spot: victim.pos.clone(),
      attackingSide: victim.side,
      fouler, victim, card,
      penalty: inBox,
      timer: inBox ? 0 : 0.55, // pênalti não joga vantagem
    };
    fouler.recoverTimer = 0.5;
  }

  private tickAdvantage(dt: number) {
    const pf = this.pendingFoul!;
    pf.timer -= dt;
    if (pf.timer > 0) return;
    this.pendingFoul = null;
    const owner = this.ball.owner;
    const keptAdvantage =
      !pf.penalty && owner && owner.side === pf.attackingSide &&
      owner.team.attackProgress(owner.pos) >= owner.team.attackProgress(pf.spot) - 0.04;
    this.applyCard(pf.fouler, pf.card);
    if (keptAdvantage) {
      this.stats.fouls[pf.fouler.side]++;
      this.lastEvent = "Vantagem!";
      return;
    }
    this.commitFoul(pf);
  }

  private commitFoul(pf: NonNullable<MatchEngine["pendingFoul"]>) {
    this.stats.fouls[pf.fouler.side]++;
    if (pf.penalty) {
      this.lastEvent = `Pênalti para ${pf.victim.team.name}!`;
      this.whistle(() => this.setupPenalty(pf.attackingSide), 1.3);
    } else {
      this.lastEvent = `Falta — tiro livre para ${pf.victim.team.name}`;
      this.whistle(() => this.setupFreeKick(pf.attackingSide, pf.spot), 0.9);
    }
  }

  private applyCard(p: Player, card: Card) {
    if (card === "none") return;
    if (card === "yellow") {
      p.yellowCards++;
      this.stats.yellow[p.side]++;
      this.lastEvent = `🟨 Amarelo — #${p.shirt} ${p.team.name}`;
      if (p.yellowCards >= 2) this.sendOff(p, true);
    } else {
      this.stats.red[p.side]++;
      this.sendOff(p, false);
    }
  }

  private sendOff(p: Player, second: boolean) {
    p.sentOff = true;
    const team = p.side === "home" ? this.home : this.away;
    const i = team.players.indexOf(p);
    if (i >= 0) team.players.splice(i, 1);
    if (this.ball.owner === p) this.ball.owner = null;
    this.lastEvent = `🟥 ${second ? "2º amarelo" : "Vermelho"} — #${p.shirt} ${p.team.name} (10 em campo)`;
  }

  // ---------------- apito / bola parada ----------------
  private whistle(setup: () => void, pauseSec = 1.0) {
    setup();
    this.phase = "stoppage";
    this.stoppage = pauseSec;
  }

  private whistleOffside(flagged: Player) {
    this.stats.offsides[flagged.side]++;
    const defend: Side = flagged.side === "home" ? "away" : "home";
    this.lastEvent = `Impedimento — #${flagged.shirt} ${flagged.team.name}`;
    this.ball.owner = null;
    this.offsideReceiver = null;
    this.whistle(() => this.giveBall(this.ball.pos.clone(), defend), 0.8);
  }

  // ---------------- gols, linhas, reinício ----------------
  private resolveBoundaries() {
    const b = this.ball;
    // gol e bola fora só valem com a bola SOLTA (em jogo). Com dono, a bola está
    // colada ao jogador — evita "gol" do goleiro encostado na própria linha.
    if (b.owner) return;
    const inPosts = b.pos.y > GOAL_Y.top && b.pos.y < GOAL_Y.bottom;
    if (b.pos.x >= FIELD.W && inPosts) return this.onGoal("home");
    if (b.pos.x <= 0 && inPosts) return this.onGoal("away");

    if (b.pos.x > FIELD.W || b.pos.x < 0) {
      const attackingRight = b.pos.x > FIELD.W;
      const defendingSide: Side = attackingRight ? "away" : "home";
      if (b.lastTouchSide === defendingSide) {
        // ESCANTEIO para quem atacava aquele gol
        const atkSide: Side = attackingRight ? "home" : "away";
        const corner = new Vec2(attackingRight ? FIELD.W - 0.4 : 0.4, b.pos.y < FIELD.H / 2 ? 0.4 : FIELD.H - 0.4);
        this.lastEvent = "Escanteio";
        return this.setupCorner(corner, atkSide);
      }
      // TIRO DE META para o goleiro do time que defende aquele gol
      const goalKick = new Vec2(defendingSide === "home" ? FIELD.SIX_DEPTH : FIELD.W - FIELD.SIX_DEPTH, FIELD.H / 2);
      this.lastEvent = "Tiro de meta";
      return this.giveBall(goalKick, defendingSide, true);
    }
    if (b.pos.y < 0 || b.pos.y > FIELD.H) {
      const throwTo: Side = b.lastTouchSide === "home" ? "away" : "home";
      const at = new Vec2(clamp(b.pos.x, 2, FIELD.W - 2), b.pos.y < 0 ? 0.5 : FIELD.H - 0.5);
      this.lastEvent = "Lateral";
      return this.giveBall(at, throwTo);
    }
  }

  /** Coloca a bola no ponto e entrega a um jogador do `side` (GK no tiro de meta). */
  private giveBall(at: Vec2, side: Side, toGK = false) {
    this.ball.pos = at.clone();
    this.ball.vel = new Vec2(0, 0);
    this.ball.owner = null;
    this.ball.intendedReceiver = null;
    this.ball.lastTouchSide = side;
    this.ball.lastTouchPlayer = null;
    this.offsideReceiver = null;
    const team = side === "home" ? this.home : this.away;
    let best: Player | undefined;
    if (toGK) best = team.gk;
    if (!best) {
      let bd = Infinity;
      for (const p of team.players) {
        if (p.isGK) continue;
        const d = p.pos.dist(at);
        if (d < bd) { bd = d; best = p; }
      }
    }
    best = best ?? team.players[0];
    best.pos = at.add(new Vec2(team.attackDir * -0.5, 0));
    best.recoverTimer = 0;
    this.ball.owner = best;
    this.decisionTimer = 0.25;
  }

  /** Escanteio: cobrador no canto, atacantes na área, alvo do cruzamento marcado. */
  private setupCorner(corner: Vec2, atkSide: Side) {
    this.giveBall(corner, atkSide);
    const atk = atkSide === "home" ? this.home : this.away;
    const taker = this.ball.owner!;
    const goal = atk.oppGoal;
    const targets = atk.outfield()
      .filter((p) => p !== taker)
      .sort((a, b) => b.attr.strength - a.attr.strength) // os mais fortes vão à área
      .slice(0, 4);
    targets.forEach((p, i) => {
      p.pos = new Vec2(goal.x - atk.attackDir * (4 + i * 2), FIELD.H / 2 + (i - 1.5) * 4);
      p.vel = new Vec2(0, 0);
    });
    this.ball.intendedReceiver = targets[0] ?? null;
  }

  private setupFreeKick(side: Side, spot: Vec2) {
    this.giveBall(spot, side);

    const atkTeam = side === "home" ? this.home : this.away;
    const defTeam = side === "home" ? this.away : this.home;
    const goalTarget = atkTeam.oppGoal;
    const goalPos = new Vec2(goalTarget.x, goalTarget.y);
    const distToGoal = spot.dist(goalPos);
    const toGoal = goalPos.sub(spot).normalized();
    // perpendicular ao vetor bola→gol (para espalhar jogadores lateralmente)
    const perp = new Vec2(-toGoal.y, toGoal.x);

    // --- classificação da falta ---
    const isDirect = distToGoal < 32; // chute direto viável
    const isClose = distToGoal < 22;  // muito perto, perigosa
    const wallSize = isClose ? 4 : isDirect ? 3 : 2;

    // ======================== DEFESA ========================

    // 1) Barreira: wallSize jogadores a 9.15m na linha bola→gol
    const wallCenter = spot.add(toGoal.scale(9.15));
    const wallPlayers = defTeam.outfield()
      .filter(p => !p.sentOff)
      .sort((a, b) => b.attr.strength - a.attr.strength) // fortes na barreira
      .slice(0, wallSize);
    wallPlayers.forEach((p, i) => {
      const offset = (i - (wallSize - 1) / 2) * 0.9; // ~0.9m entre cada
      p.pos = wallCenter.add(perp.scale(offset));
      p.vel = new Vec2(0, 0);
      p.target = p.pos.clone();
    });

    // 2) Goleiro: atrás da barreira, deslocado para o lado aberto
    const gk = defTeam.gk;
    if (gk) {
      // o goleiro cobre o lado que a barreira NÃO cobre
      const openSide = spot.y < FIELD.H / 2 ? 1 : -1; // lado aberto
      const gkX = goalPos.x + (goalPos.x === 0 ? 1.0 : -1.0);
      const gkY = clamp(
        goalPos.y + openSide * (FIELD.GOAL_WIDTH / 2 - 1.0),
        FIELD.H / 2 - FIELD.GOAL_WIDTH / 2,
        FIELD.H / 2 + FIELD.GOAL_WIDTH / 2,
      );
      gk.pos = new Vec2(gkX, gkY);
      gk.vel = new Vec2(0, 0);
      gk.target = gk.pos.clone();
    }

    // 3) Restante da defesa: marca na área / zonal próximo
    const wallSet = new Set(wallPlayers);
    const remainDef = defTeam.outfield()
      .filter(p => !p.sentOff && !wallSet.has(p));

    if (isDirect) {
      // posiciona na/perto da grande área, cobrindo o espaço
      const boxEdgeX = goalPos.x === 0
        ? FIELD.PENALTY_DEPTH
        : FIELD.W - FIELD.PENALTY_DEPTH;
      const lineX = goalPos.x === 0
        ? Math.max(boxEdgeX - 3, 2)
        : Math.min(boxEdgeX + 3, FIELD.W - 2);
      remainDef.forEach((p, i) => {
        const lateral = FIELD.H / 2 + ((i - (remainDef.length - 1) / 2) * 5);
        p.pos = new Vec2(lineX, clamp(lateral, 4, FIELD.H - 4));
        p.vel = new Vec2(0, 0);
        p.target = p.pos.clone();
      });
    } else {
      // falta longe: só afasta quem está dentro dos 9.15m, resto mantém posição
      for (const o of remainDef) {
        const d = o.pos.dist(spot);
        if (d < 9.15) {
          o.pos = spot.add(o.pos.sub(spot).normalized().scale(9.15));
          o.vel = new Vec2(0, 0);
        }
      }
    }

    // ======================== ATAQUE ========================

    const taker = this.ball.owner!;

    if (isDirect) {
      // 4a) Jogador de opção curta perto da bola (para tabela/variação)
      const shortOption = atkTeam.outfield()
        .filter(p => !p.sentOff && p !== taker)
        .sort((a, b) => b.attr.passing - a.attr.passing)[0];
      if (shortOption) {
        shortOption.pos = spot.add(perp.scale(-2.5)).add(toGoal.scale(-2));
        shortOption.vel = new Vec2(0, 0);
        shortOption.target = shortOption.pos.clone();
      }

      // 4b) Jogadores na área (para cabeceio/rebote): os mais fortes e
      //     com melhor finalização, exceto o cobrador e a opção curta
      const inBoxCandidates = atkTeam.outfield()
        .filter(p => !p.sentOff && p !== taker && p !== shortOption)
        .sort((a, b) =>
          (b.attr.strength + b.attr.finishing) - (a.attr.strength + a.attr.finishing))
        .slice(0, isClose ? 4 : 3);

      const boxCenterX = goalPos.x === 0
        ? FIELD.PENALTY_DEPTH * 0.6
        : FIELD.W - FIELD.PENALTY_DEPTH * 0.6;
      inBoxCandidates.forEach((p, i) => {
        // espalha no arco da grande área com variação lateral
        const lat = FIELD.H / 2 + ((i - (inBoxCandidates.length - 1) / 2) * 4.5);
        const depth = boxCenterX + (goalPos.x === 0 ? -1 : 1) * (i % 2 === 0 ? 0 : 3);
        p.pos = new Vec2(depth, clamp(lat, 8, FIELD.H - 8));
        p.vel = new Vec2(0, 0);
        p.target = p.pos.clone();
      });

      // 4c) Quem sobra fica atrás para equilíbrio (zagueiros, volantes)
      const boxSet = new Set([taker, shortOption, ...inBoxCandidates]);
      const remainAtk = atkTeam.outfield()
        .filter(p => !p.sentOff && !boxSet.has(p));
      remainAtk.forEach((p, i) => {
        // posiciona atrás da bola, espalhado
        const backX = spot.x + atkTeam.attackDir * -12 + (i * atkTeam.attackDir * -4);
        const backY = FIELD.H / 2 + ((i - (remainAtk.length - 1) / 2) * 10);
        p.pos = new Vec2(clamp(backX, 3, FIELD.W - 3), clamp(backY, 5, FIELD.H - 5));
        p.vel = new Vec2(0, 0);
        p.target = p.pos.clone();
      });
    }
    // falta longe do gol: posicionamento normal (a IA cuida na retomada)

    // 5) Receptor sugerido — melhor finalizador na área
    if (isDirect) {
      const inBox = atkTeam.outfield()
        .filter(p => !p.sentOff && p !== taker && p.pos.dist(goalPos) < FIELD.PENALTY_DEPTH + 5)
        .sort((a, b) => b.attr.finishing - a.attr.finishing);
      this.ball.intendedReceiver = inBox[0] ?? null;
    }
  }

  private setupPenalty(attackSide: Side) {
    const atk = attackSide === "home" ? this.home : this.away;
    const def: Side = attackSide === "home" ? "away" : "home";
    const defTeam = def === "home" ? this.home : this.away;
    const goalX = defTeam.ownGoal.x;
    const spot = new Vec2(goalX === 0 ? 11 : FIELD.W - 11, FIELD.H / 2);

    // cobrador = melhor finalizador disponível
    const kicker = atk.outfield().sort((a, b) => b.attr.finishing - a.attr.finishing)[0] ?? atk.players[0];
    kicker.pos = spot.add(new Vec2(atk.attackDir * -1.5, 0));
    kicker.vel = new Vec2(0, 0);
    // todos os outros fora da área
    for (const p of [...this.home.players, ...this.away.players]) {
      if (p === kicker || p.isGK) continue;
      if (inOwnBox(defTeam, p.pos) || p.team.attackProgress(p.pos) > 0.78) {
        const edgeX = goalX === 0 ? FIELD.PENALTY_DEPTH + 2 : FIELD.W - FIELD.PENALTY_DEPTH - 2;
        p.pos = new Vec2(edgeX, FIELD.H / 2 + (rng.next() - 0.5) * 30);
      }
      p.vel = new Vec2(0, 0);
    }
    const gk = defTeam.gk;
    if (gk) gk.pos = new Vec2(goalX, FIELD.H / 2);

    this.ball.pos = spot.clone();
    this.ball.vel = new Vec2(0, 0);
    this.ball.owner = kicker;
    this.ball.lastTouchSide = attackSide;
    this.stats.penalties[attackSide]++;
    this.penalty = { kicker, defendSide: def };
    this.lastEvent = `Pênalti — #${kicker.shirt} vai cobrar`;
  }

  private takePenalty() {
    const pen = this.penalty!;
    this.penalty = null;
    const k = pen.kicker;
    const defTeam = pen.defendSide === "home" ? this.home : this.away;
    const goalX = defTeam.ownGoal.x;
    const cornerTop = rng.next() < 0.5;
    const aimY = cornerTop ? FIELD.H / 2 - 3.0 : FIELD.H / 2 + 3.0;
    const target = new Vec2(goalX, aimY);
    // goleiro chuta para um lado (adivinha)
    const gk = defTeam.gk;
    if (gk) {
      const guessTop = rng.next() < 0.5;
      gk.pos = new Vec2(goalX + (goalX === 0 ? 0.5 : -0.5), FIELD.H / 2 + (guessTop ? -2.5 : 2.5));
      gk.recoverTimer = 0; // pode defender se adivinhou
    }
    this.stats.shots[k.side]++;
    this.stats.shotsInBox[k.side]++;
    this.stats.xg[k.side] += 0.78;
    const err = rng.gauss() * lerp(0.12, 0.03, k.skill("finishing"));
    this.ball.owner = null;
    this.kickToward(k, target, BALL.MAX_SHOT_SPEED * 0.95, err);
    this.lastEvent = `Cobrança de pênalti — ${k.team.name}`;
  }

  private onGoal(scorer: Side) {
    if (scorer === "home") this.scoreHome++; else this.scoreAway++;
    const name = scorer === "home" ? this.home.name : this.away.name;
    // autor do gol = último a tocar, se for do time que marcou (senão, gol/desvio)
    const lt = this.ball.lastTouchPlayer;
    const scorerName = lt && lt.side === scorer ? (lt.name || `#${lt.shirt}`) : "—";
    this.stats.shotsOnTarget[scorer]++;
    this.goals.push({ side: scorer, scorer: scorerName, minute: Math.floor(this.gameSeconds / 60), half: this.half });
    this.lastEvent = `⚽ GOL de ${name}! (${scorerName})`;
    this.phase = "goal";
    this.stoppage = MATCH.KICKOFF_PAUSE;
    this.pendingFoul = null;
    this.penalty = null;
    this.setupKickoff(scorer === "home" ? "away" : "home");
  }

  private setupKickoff(side: Side) {
    this.pendingRestart = null;
    this.offsideReceiver = null;
    this.ball.lastTouchPlayer = null;
    const center = new Vec2(FIELD.W / 2, FIELD.H / 2);
    for (const team of [this.home, this.away]) {
      for (const p of team.players) {
        // pontapé inicial: TODOS no próprio campo e fora do círculo central
        let pos = team.progressToField(Math.min(p.slot.x, 0.47), p.slot.y);
        if (pos.dist(center) < FIELD.CENTER_CIRCLE_R + 0.5) {
          pos = pos.add(pos.sub(center).normalized().scale(FIELD.CENTER_CIRCLE_R + 1));
        }
        p.pos = pos;
        p.vel = new Vec2(0, 0);
        p.target = p.pos.clone();
        p.recoverTimer = 0;
      }
    }
    this.ball.pos = center.clone();
    this.ball.vel = new Vec2(0, 0);
    this.ball.intendedReceiver = null;
    this.ball.lastTouchSide = side;
    // cobrador do time que dá a saída, junto à bola no círculo central
    const team = side === "home" ? this.home : this.away;
    const taker = team.outfield().sort((a, b) => b.slot.x - a.slot.x)[0] ?? team.players[0];
    taker.pos = new Vec2(FIELD.W / 2 - team.attackDir * 0.6, FIELD.H / 2 + 1.5);
    this.ball.owner = taker;
    this.decisionTimer = 0.4;
    if (this.phase !== "goal" && this.phase !== "halftime") this.phase = "kickoff";
    this.stoppage = MATCH.KICKOFF_PAUSE;
  }

  // ---------------- PRORROGAÇÃO ----------------
  /** Prorrogação (2x15'). Recomeça com pontapé inicial; fim em 120'. */
  startExtraTime() {
    this.extraTime = true;
    this.half = 2;
    this.lastEvent = "Prorrogação!";
    this.setupKickoff(this.openingSide);
  }

  // ---------------- DISPUTA DE PÊNALTIS ----------------
  /** Vai direto para a disputa de pênaltis (botão / empate). */
  startShootout() {
    const order = (t: Team) => t.outfield().filter((p) => !p.sentOff).sort((a, b) => b.attr.finishing - a.attr.finishing);
    this.shootout = {
      homeScore: 0, awayScore: 0, homeKicks: [], awayKicks: [],
      turn: "home", round: 1, kicker: null, state: "ready", timer: 1.2,
      lastResult: null, pendingOutcome: null, diveTarget: null, winner: null,
      takers: { home: order(this.home), away: order(this.away) }, idx: { home: 0, away: 0 },
    };
    this.phase = "shootout";
    this.paused = false;
    this.lastEvent = "Disputa de pênaltis!";
    this.positionForShootout("home");
  }

  private positionForShootout(side: Side) {
    const so = this.shootout!;
    const W = FIELD.W, H = FIELD.H;
    const spot = new Vec2(W - 11, H / 2);
    const kickTeam = side === "home" ? this.home : this.away;
    const defTeam = side === "home" ? this.away : this.home;
    const list = so.takers[side];
    const kicker = list[so.idx[side] % list.length] ?? kickTeam.players[0];
    so.kicker = kicker;
    // recua o cobrador pra dar passada (corridinha diagonal até a bola)
    kicker.pos = new Vec2(W - 16.5, H / 2 + (rng.next() < 0.5 ? -2.6 : 2.6));
    kicker.vel = new Vec2(0, 0);
    so.diveTarget = null;
    const gk = defTeam.gk;
    if (gk) { gk.pos = new Vec2(W - 0.6, H / 2); gk.vel = new Vec2(0, 0); }
    // demais jogadores aguardam ENFILEIRADOS na linha do meio (como na vida real)
    const others = [...this.home.players, ...this.away.players].filter((p) => p !== kicker && p !== gk);
    const n = Math.max(1, others.length - 1);
    others.forEach((p, i) => {
      p.pos = new Vec2(W / 2, 11 + (i / n) * (H - 22));
      p.vel = new Vec2(0, 0);
    });
    this.ball.pos = spot.clone(); this.ball.vel = new Vec2(0, 0); this.ball.owner = null; this.ball.looseLock = 0;
  }

  private executeShootoutKick() {
    const so = this.shootout!;
    const W = FIELD.W, H = FIELD.H;
    const kicker = so.kicker!;
    const gk = (so.turn === "home" ? this.away : this.home).gk;
    const fin = kicker.skill("finishing");
    const onTarget = rng.chance(0.74 + 0.2 * fin);
    const topAim = rng.next() < 0.5;
    let targetY = H / 2 + (topAim ? -3 : 3);
    const guessTop = rng.next() < 0.5; // o goleiro escolhe um canto e mergulha
    so.diveTarget = new Vec2(W - 0.6, H / 2 + (guessTop ? -3.2 : 3.2));
    let outcome: "goal" | "saved" | "missed";
    if (!onTarget) {
      outcome = "missed"; targetY = H / 2 + (topAim ? -6.5 : 6.5);
    } else {
      const saveSkill = gk ? gk.skill("goalkeeping") : 0.5;
      const saveP = guessTop === topAim ? 0.3 + 0.4 * saveSkill : 0.05;
      outcome = rng.chance(saveP) ? "saved" : "goal";
      if (outcome === "saved") targetY = so.diveTarget.y; // bola na mão do goleiro
    }
    const tx = outcome === "missed" ? W + 1 : outcome === "saved" ? W - 0.6 : W + 0.5;
    const dir = new Vec2(tx, targetY).sub(this.ball.pos).normalized();
    this.ball.kick(dir, BALL.MAX_SHOT_SPEED * 0.9, so.turn);
    kicker.facing = dir;
    so.pendingOutcome = outcome;
  }

  private applyShootoutResult() {
    const so = this.shootout!;
    const scored = so.pendingOutcome === "goal";
    if (so.turn === "home") { so.homeKicks.push(scored); if (scored) so.homeScore++; }
    else { so.awayKicks.push(scored); if (scored) so.awayScore++; }
    so.lastResult = so.pendingOutcome;
    const name = so.turn === "home" ? this.home.name : this.away.name;
    const kn = so.kicker?.name || name;
    const r = so.pendingOutcome === "goal" ? `⚽ GOOOL de ${kn}!`
      : so.pendingOutcome === "saved" ? `🧤 DEFENDEUUU! (${name})`
      : `😱 PRA FORA! (${kn})`;
    this.lastEvent = r;
  }

  private decideShootout(): Side | null {
    const so = this.shootout!;
    const h = so.homeScore, a = so.awayScore;
    const hk = so.homeKicks.length, ak = so.awayKicks.length;
    if (hk <= 5 && ak <= 5) {
      if (h > a + (5 - ak)) return "home";
      if (a > h + (5 - hk)) return "away";
    }
    if (hk === ak && hk >= 5 && h !== a) return h > a ? "home" : "away";
    return null;
  }

  private updateShootout(realDt: number) {
    const so = this.shootout;
    if (!so) return;
    const pdt = realDt * this.physicsSpeed;
    const gk = (so.turn === "home" ? this.away : this.home).gk;

    // ---- animações contínuas por estado (a emoção do lance) ----
    if (so.state === "runup" && so.kicker) {
      so.kicker.target = this.ball.pos.clone(); // corre até a bola
      so.kicker.steer(pdt, 1);
    } else if (so.state === "strike") {
      if (!this.ball.owner) this.ball.integrate(pdt); // bola voando
      if (gk && so.diveTarget) { gk.target = so.diveTarget; gk.steer(pdt, 1); } // mergulho
      if (so.kicker) { so.kicker.target = this.ball.pos.clone(); so.kicker.steer(pdt, 0.3); }
    } else if (so.state === "result") {
      if (so.lastResult === "goal" && so.kicker) { // cobrador comemora correndo
        so.kicker.target = new Vec2(FIELD.W - 4, FIELD.H / 2 + 6); so.kicker.steer(pdt, 1);
      } else if (so.lastResult === "saved" && gk) { // goleiro comemora a defesa
        gk.target = new Vec2(FIELD.W - 9, FIELD.H / 2); gk.steer(pdt, 1);
      }
    }

    so.timer -= realDt;
    if (so.timer > 0) return;

    if (so.state === "ready") {
      so.state = "runup"; so.timer = 0.8; // tensão antes da corrida
    } else if (so.state === "runup") {
      this.executeShootoutKick();
      so.state = "strike"; so.timer = 0.95;
    } else if (so.state === "strike") {
      this.applyShootoutResult();
      so.state = "result"; so.timer = 1.5; // beat de reação/comemoração
    } else if (so.state === "result") {
      const w = this.decideShootout();
      if (w) {
        this.winner = w;
        this.phase = "end";
        this.lastEvent = `Fim de Jogo! ${w === "home" ? this.home.name : this.away.name} vence nos pênaltis!`;
      } else {
        if (so.turn === "home") so.turn = "away";
        else { so.turn = "home"; so.round++; so.idx.home++; so.idx.away++; }
        this.positionForShootout(so.turn);
        so.state = "ready"; so.timer = 1.2;
      }
    }
  }

  private clampPlayers() {
    const m = 0.3;
    for (const p of [...this.home.players, ...this.away.players]) {
      p.pos.x = clamp(p.pos.x, m, FIELD.W - m);
      p.pos.y = clamp(p.pos.y, m, FIELD.H - m);
    }
  }

  possessionPct(side: Side) {
    const tot = this.stats.possessionTicks.home + this.stats.possessionTicks.away;
    if (tot === 0) return 50;
    return Math.round((this.stats.possessionTicks[side] / tot) * 100);
  }
}
