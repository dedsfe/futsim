/**
 * Cenários de validação headless da IA e das regras (Parte 5).
 * Rodar: npx esbuild scripts/scenarios.ts --bundle --platform=node --format=esm
 *        --outfile=/tmp/s.mjs && node /tmp/s.mjs
 */
import { Vec2 } from "../src/core/Vector2";
import { FIELD } from "../src/core/constants";
import { buildTeam } from "../src/domain/roster";
import { Ball } from "../src/domain/Ball";
import type { Team } from "../src/domain/Team";
import type { Player } from "../src/domain/Player";
import { defaultTactics } from "../src/tactics/defaults";
import { decide } from "../src/ai/decisions";
import { decideGoalkeeper } from "../src/ai/goalkeeper";
import { computeTeamTargets } from "../src/ai/positioning";
import { isOffside } from "../src/simulation/rules";
import { inOwnBox } from "../src/ai/defense";
import { MatchEngine } from "../src/simulation/MatchEngine";
import { rng } from "../src/core/random";
import type { World } from "../src/ai/context";

let pass = 0, fail = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? "  — " + detail : ""}`);
  ok ? pass++ : fail++;
}

function freshTeams(homeForm = "4-3-3", awayForm = "4-4-2") {
  const home = buildTeam("home", "Azuis", "#00f", defaultTactics(homeForm), 75, 11);
  const away = buildTeam("away", "Vermelhos", "#f00", defaultTactics(awayForm), 73, 22);
  return { home, away };
}
function park(team: Team, x: number) {
  team.players.forEach((p, i) => { p.pos = new Vec2(x, 4 + i * 5.6); p.target = p.pos.clone(); p.vel = new Vec2(0, 0); });
}
function mkWorld(home: Team, away: Team, ball: Ball): World {
  return { home, away, ball, timeSec: 600, possession: ball.owner ? ball.owner.side : null };
}
function find(team: Team, role: string, n = 0): Player {
  return team.players.filter((p) => p.role === role)[n] ?? team.outfield()[n];
}

/** Distribuição de decisões repetindo decide() N vezes. */
function decideDist(owner: Player, world: World, N = 300): Record<string, number> {
  const d: Record<string, number> = {};
  for (let i = 0; i < N; i++) {
    const k = decide(owner, world).kind;
    d[k] = (d[k] ?? 0) + 1;
  }
  return d;
}
const pct = (d: Record<string, number>, k: string, N = 300) => Math.round(((d[k] ?? 0) / N) * 100);

console.log("\n=== CENÁRIOS DE DECISÃO OFENSIVA ===");

// 1) Atacante livre dentro da área → deve chutar na maioria das vezes
{
  const { home, away } = freshTeams();
  park(home, 20); park(away, 60);
  const st = find(home, "ST");
  st.pos = new Vec2(96, 34);
  const ball = new Ball(); ball.owner = st; ball.pos = st.pos.clone();
  const gk = away.gk!; gk.pos = new Vec2(104, 34);
  const w = mkWorld(home, away, ball);
  const d = decideDist(st, w);
  check("1. Atacante livre na área chuta na maioria", pct(d, "shoot") >= 70, `shoot=${pct(d, "shoot")}%`);
}

// 2) Cara a cara com o goleiro → chutar ou driblar (não tocar atrás)
{
  const { home, away } = freshTeams();
  park(home, 20); park(away, 30);
  const st = find(home, "ST"); st.pos = new Vec2(88, 34);
  const ball = new Ball(); ball.owner = st; ball.pos = st.pos.clone();
  away.gk!.pos = new Vec2(102, 34);
  const w = mkWorld(home, away, ball);
  const d = decideDist(st, w);
  const aggressive = pct(d, "shoot") + pct(d, "dribble");
  check("2. Cara a cara: chuta/dribla (não toca atrás)", aggressive >= 75 && pct(d, "shoot") >= 40, `shoot=${pct(d, "shoot")}% dribble=${pct(d, "dribble")}%`);
}

// 3) Volante sem pressão no meio → conduzir/passar, não chutar
{
  const { home, away } = freshTeams();
  park(home, 30); park(away, 75);
  const dm = find(home, "DM"); dm.pos = new Vec2(52, 34);
  const ball = new Ball(); ball.owner = dm; ball.pos = dm.pos.clone();
  const w = mkWorld(home, away, ball);
  const d = decideDist(dm, w);
  check("3. Volante no meio NÃO chuta à toa", pct(d, "shoot") <= 3, `shoot=${pct(d, "shoot")}% carry=${pct(d, "carry")}% pass=${pct(d, "pass")}%`);
}

// 4) Zagueiro pressionado → afastar/segurar/recuar (segurança)
{
  const { home, away } = freshTeams();
  park(home, 8); park(away, 45); // companheiros atrás (recuo), adversários longe
  const cb = find(home, "CB"); cb.pos = new Vec2(15, 34);
  home.gk!.pos = new Vec2(4, 34);
  // três adversários fechando à frente e dos lados (espaço bloqueado)
  away.players[9].pos = new Vec2(17, 33.5);
  away.players[10].pos = new Vec2(16, 36);
  away.players[8].pos = new Vec2(15.5, 31.5);
  const ball = new Ball(); ball.owner = cb; ball.pos = cb.pos.clone();
  const w = mkWorld(home, away, ball);
  const d = decideDist(cb, w);
  const safe = pct(d, "clear") + pct(d, "shield") + pct(d, "pass") + pct(d, "long");
  check("4. Zagueiro pressionado joga seguro", safe >= 80 && pct(d, "shoot") === 0, `clear=${pct(d, "clear")}% shield=${pct(d, "shield")}% pass=${pct(d, "pass")}% long=${pct(d, "long")}%`);
}

console.log("\n=== CENÁRIOS DEFENSIVOS / TÁTICOS ===");

// 12) Defensor próximo do portador → pressiona
{
  const { home, away } = freshTeams();
  park(home, 60); park(away, 50);
  const owner = find(home, "CM"); owner.pos = new Vec2(60, 34);
  const ball = new Ball(); ball.owner = owner; ball.pos = owner.pos.clone();
  const def = away.outfield().sort((a, b) => a.pos.dist(owner.pos) - b.pos.dist(owner.pos))[0];
  def.pos = new Vec2(62, 34);
  const w = mkWorld(home, away, ball);
  computeTeamTargets(away, w);
  const nearest = away.outfield().sort((a, b) => a.pos.dist(ball.pos) - b.pos.dist(ball.pos))[0];
  check("12. Defensor mais próximo pressiona", nearest.action === "press" && nearest.target.dist(ball.pos) < 3, `action=${nearest.action}`);
}

// 6) Pressão alta → vários sobem para pressionar a saída
{
  const { home, away } = freshTeams();
  const t = away.tactics; t.pressIntensity = 0.95; t.pressTrigger = "always";
  park(home, 40); park(away, 60);
  const gk = home.gk!; gk.pos = new Vec2(8, 34);
  // home tenta sair jogando: zagueiros recebem opções
  find(home, "CB", 0).pos = new Vec2(18, 26);
  find(home, "CB", 1).pos = new Vec2(18, 42);
  const ball = new Ball(); ball.owner = gk; ball.pos = gk.pos.clone();
  // atacantes/meias do away sobem para pressionar a saída
  away.players[9].pos = new Vec2(20, 34);
  away.players[10].pos = new Vec2(24, 28);
  away.players[7].pos = new Vec2(24, 40);
  const w = mkWorld(home, away, ball);
  computeTeamTargets(away, w);
  const pressers = away.outfield().filter((p) => p.action === "press");
  check("6. Pressão alta sobe vários marcadores", pressers.length >= 2, `pressers=${pressers.length}`);
}

// 7) Linha baixa → time compacta perto do próprio gol
{
  const { home, away } = freshTeams();
  away.tactics.lineHeight = 0.12; away.tactics.pressTrigger = "low";
  park(home, 55); park(away, 70);
  const owner = find(home, "CM"); owner.pos = new Vec2(55, 34);
  const ball = new Ball(); ball.owner = owner; ball.pos = owner.pos.clone();
  const w = mkWorld(home, away, ball);
  computeTeamTargets(away, w);
  // away defende o gol direito (x=105) → linha baixa = x alto (perto de 105)
  const avgX = away.outfield().reduce((s, p) => s + p.target.x, 0) / away.outfield().length;
  check("7. Linha baixa recua o bloco", avgX > 70, `x médio dos alvos=${avgX.toFixed(1)} (gol em 105)`);
}

// 8) Ponta "cortar para dentro" → ataca o miolo
{
  const { home, away } = freshTeams("4-3-3");
  const wg = find(home, "WG");
  park(home, 60); park(away, 30);
  const owner = find(home, "CM"); owner.pos = new Vec2(70, 34);
  const ball = new Ball(); ball.owner = owner; ball.pos = owner.pos.clone();
  const w = mkWorld(home, away, ball);
  wg.instr = {}; computeTeamTargets(home, w);
  const yWide = wg.target.y;
  wg.instr = { cutInside: true }; computeTeamTargets(home, w);
  const yInside = wg.target.y;
  check("8. Ponta corta para dentro (mais central)", Math.abs(yInside - 34) < Math.abs(yWide - 34) - 2, `y largo=${yWide.toFixed(1)} → y dentro=${yInside.toFixed(1)}`);
}

// 9) Lateral "apoiar/ultrapassar" → sobe pelo corredor
{
  const { home, away } = freshTeams("4-3-3");
  const fb = find(home, "FB");
  park(home, 50); park(away, 30);
  const owner = find(home, "CM"); owner.pos = new Vec2(72, 34);
  const ball = new Ball(); ball.owner = owner; ball.pos = owner.pos.clone();
  const w = mkWorld(home, away, ball);
  fb.instr = {}; computeTeamTargets(home, w); const xBase = fb.target.x;
  fb.instr = { overlap: true }; computeTeamTargets(home, w); const xOver = fb.target.x;
  check("9. Lateral apoiando ultrapassa", xOver > xBase + 3, `x base=${xBase.toFixed(1)} → x overlap=${xOver.toFixed(1)}`);
}

// 5) Linha alta vs profundidade → atacante explora as costas
{
  const { home, away } = freshTeams();
  const st = find(home, "ST"); st.instr = { attackDepth: true };
  park(home, 50); park(away, 50);
  away.gk!.pos = new Vec2(101, 34);            // goleiro fundo (linha real)
  find(away, "CB").pos = new Vec2(72, 34);      // último zagueiro define a linha
  const owner = find(home, "CM"); owner.pos = new Vec2(55, 34);
  const ball = new Ball(); ball.owner = owner; ball.pos = owner.pos.clone();
  const w = mkWorld(home, away, ball);
  computeTeamTargets(home, w);
  check("5. Atacante com profundidade corre à frente da bola", home.attackProgress(st.target) > home.attackProgress(ball.pos), `prog alvo=${home.attackProgress(st.target).toFixed(2)} vs bola=${home.attackProgress(ball.pos).toFixed(2)}`);
}

console.log("\n=== REGRAS ===");

// 11) Impedimento
{
  const { home, away } = freshTeams();
  park(home, 50); park(away, 50);
  const passer = find(home, "CM"); passer.pos = new Vec2(60, 34);
  const st = find(home, "ST");
  const ball = new Ball(); ball.owner = passer; ball.pos = passer.pos.clone();
  away.gk!.pos = new Vec2(104, 34);
  const lastDef = find(away, "CB"); lastDef.pos = new Vec2(80, 34);
  away.outfield().forEach((p) => { if (p !== lastDef) p.pos = new Vec2(40, p.pos.y); }); // resto recuado
  const w = mkWorld(home, away, ball);
  st.pos = new Vec2(95, 34);
  const off = isOffside(passer, st, w);
  st.pos = new Vec2(75, 34);
  const onside = isOffside(passer, st, w);
  check("11. Impedimento detectado corretamente", off === true && onside === false, `à frente=${off}, atrás do zagueiro=${onside}`);
}

// 10) Falta dentro da área = pênalti (geometria de detecção)
{
  const { home, away } = freshTeams();
  const inBox = inOwnBox(away, new Vec2(98, 34)); // área do away (gol em x=105)
  const outBox = inOwnBox(away, new Vec2(80, 34));
  check("10. Detecção de área (base do pênalti)", inBox === true && outBox === false, `dentro=${inBox}, fora=${outBox}`);
}

console.log("\n=== GOLEIRO ===");

// G1) Goleiro pressionado → afasta (clear), nunca conduz
{
  const { home, away } = freshTeams();
  park(home, 30); park(away, 60);
  const gk = home.gk!; gk.pos = new Vec2(5, 34);
  const ball = new Ball(); ball.owner = gk; ball.pos = gk.pos.clone();
  away.players[9].pos = new Vec2(8, 33); away.players[10].pos = new Vec2(7, 36); // pressão
  const w = mkWorld(home, away, ball);
  const kinds = new Set<string>();
  let clears = 0;
  for (let i = 0; i < 200; i++) { const k = decideGoalkeeper(gk, w).kind; kinds.add(k); if (k === "clear") clears++; }
  check("G1. GK pressionado afasta (e nunca conduz)", clears >= 180 && !kinds.has("carry") && !kinds.has("dribble"), `clear=${clears}/200 tipos=${[...kinds]}`);
}

// G2) Goleiro livre, saída curta → distribui curto para defensor (não conduz)
{
  const { home, away } = freshTeams();
  home.tactics.buildOut = "short";
  park(home, 30); park(away, 75);
  const gk = home.gk!; gk.pos = new Vec2(5, 34);
  find(home, "CB", 0).pos = new Vec2(20, 26);
  find(home, "FB", 0).pos = new Vec2(22, 14);
  const ball = new Ball(); ball.owner = gk; ball.pos = gk.pos.clone();
  const w = mkWorld(home, away, ball);
  const d: Record<string, number> = {};
  for (let i = 0; i < 200; i++) { const k = decideGoalkeeper(gk, w).kind; d[k] = (d[k] ?? 0) + 1; }
  check("G2. GK livre (saída curta) distribui curto", (d["pass"] ?? 0) >= 120 && !d["carry"] && !d["dribble"], JSON.stringify(d));
}

// G3) Goleiro com time de bola longa → lança
{
  const { home, away } = freshTeams();
  home.tactics.buildOut = "long"; home.tactics.possession = "long";
  park(home, 30); park(away, 75);
  const gk = home.gk!; gk.pos = new Vec2(5, 34);
  find(home, "ST").pos = new Vec2(70, 34);
  const ball = new Ball(); ball.owner = gk; ball.pos = gk.pos.clone();
  const w = mkWorld(home, away, ball);
  const d: Record<string, number> = {};
  for (let i = 0; i < 200; i++) { const k = decideGoalkeeper(gk, w).kind; d[k] = (d[k] ?? 0) + 1; }
  check("G3. GK (bola longa) lança no campo de ataque", (d["long"] ?? 0) >= 150, JSON.stringify(d));
}

// ============ MÉTRICAS DE UMA PARTIDA COMPLETA ============
console.log("\n=== MÉTRICAS DE PARTIDA COMPLETA ===");
{
  rng.reseed(20260614); // partida reprodutível
  const home = buildTeam("home", "Azuis", "#00f", defaultTactics("4-3-3"), 75, 7);
  const away = buildTeam("away", "Vermelhos", "#f00", defaultTactics("4-4-2"), 73, 9);
  const e = new MatchEngine(home, away);
  e.matchClockMultiplier = 1;
  let frames = 0;
  let possTicks = 0;
  while (e.phase !== "end" && frames < 60 * 60 * 30) { e.update(1 / 60); frames++; if (e.ball.owner) possTicks++; }
  const s = e.stats;
  const sum = (o: { home: number; away: number }) => o.home + o.away;
  console.log(`placar:           ${e.scoreHome} - ${e.scoreAway}   (${e.clock})`);
  console.log(`posse:            ${e.possessionPct("home")}% / ${e.possessionPct("away")}%`);
  console.log(`chutes:           ${sum(s.shots)}   (na área: ${sum(s.shotsInBox)})`);
  console.log(`xG total:         ${(s.xg.home + s.xg.away).toFixed(2)}  (${s.xg.home.toFixed(2)} / ${s.xg.away.toFixed(2)})`);
  console.log(`passes p/ trás:   ${sum(s.backPasses)}`);
  console.log(`desarmes (tent.): ${sum(s.tackles)}`);
  console.log(`interceptações:   ${sum(s.interceptions)}`);
  console.log(`faltas:           ${sum(s.fouls)}`);
  console.log(`impedimentos:     ${sum(s.offsides)}`);
  console.log(`pênaltis:         ${sum(s.penalties)}`);
  console.log(`cartões:          🟨 ${sum(s.yellow)}  🟥 ${sum(s.red)}`);
  console.log(`ações escolhidas: ${JSON.stringify(s.actions)}`);

  check("M1. Gera finalizações suficientes (>=12)", sum(s.shots) >= 12, `chutes=${sum(s.shots)}`);
  check("M2. Boa parte das finalizações na área (>=30%)", sum(s.shotsInBox) >= sum(s.shots) * 0.3, `na área=${sum(s.shotsInBox)}/${sum(s.shots)}`);
  check("M3. Há disputa (desarmes + interceptações)", sum(s.tackles) + sum(s.interceptions) >= 20);
  const fwdActions = (s.actions["pass"] ?? 0) + (s.actions["through"] ?? 0) + (s.actions["carry"] ?? 0) + (s.actions["long"] ?? 0);
  check("M4. Passes para trás não dominam (< ações ofensivas)", sum(s.backPasses) < fwdActions, `trás=${sum(s.backPasses)} vs ofensivas=${fwdActions}`);
  check("M5. Regras ativas (faltas no jogo)", sum(s.fouls) >= 3, `faltas=${sum(s.fouls)}`);
}

console.log(`\n=== RESULTADO: ${pass} passaram, ${fail} falharam ===`);
