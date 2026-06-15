/**
 * Testes do modo Copa (Brasil x Argentina), individualidade e overall.
 * Rodar: npx esbuild scripts/test-copa.ts --bundle --platform=node --format=esm
 *        --outfile=/tmp/c.mjs && node /tmp/c.mjs
 */
import { buildTeam } from "../src/domain/roster";
import { defaultTactics } from "../src/tactics/defaults";
import { buildCopaTeams } from "../src/data/buildNationalTeam";
import { MatchEngine } from "../src/simulation/MatchEngine";
import { rng } from "../src/core/random";
import type { MatchEngine as ME } from "../src/simulation/MatchEngine";

rng.reseed(20260614); // testes reprodutíveis
let pass = 0, fail = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "✅" : "❌"} ${n}${d ? "  — " + d : ""}`); ok ? pass++ : fail++; };
const sum = (o: Record<string, number>, ...ks: string[]) => ks.reduce((a, k) => a + (o[k] ?? 0), 0);
const total = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

console.log("=== ELENCOS REAIS (EA FC 26) ===");
{
  const { home, away } = buildCopaTeams();
  console.log("Brasil XI:", home.players.map((p) => `${p.name}(${p.overall})`).join(", "));
  console.log("Argentina XI:", away.players.map((p) => `${p.name}(${p.overall})`).join(", "));

  const vini = home.players.find((p) => p.name.includes("Vini"));
  const messi = away.players.find((p) => p.name.includes("Messi"));
  check("Nomes reais aparecem (Vini Jr. e Messi)", !!vini && !!messi);
  check("Overall real do EA FC 26 (Vini 89, Messi 86)", vini?.overall === 89 && messi?.overall === 86, `Vini=${vini?.overall} Messi=${messi?.overall}`);
  check("Traits aplicadas (Vini SPEEDSTER + corta p/ dentro)", !!vini?.traits.includes("SPEEDSTER") && !!vini?.instr.cutInside, `${vini?.traits}`);
  check("Messi PLAYMAKER/CREATIVE_PASSER", !!messi?.traits.includes("PLAYMAKER"), `${messi?.traits}`);
}

console.log("\n=== ESTILOS DIFERENTES (Brasil vertical x Argentina posse) ===");
{
  let braPass = 0, braCarry = 0, brTot = 0, argPass = 0, argCarry = 0, argTot = 0;
  let dynamicOk = true;
  for (let i = 0; i < 3; i++) {
    const { home, away } = buildCopaTeams();
    const e = new MatchEngine(home, away); e.matchClockMultiplier = 1;
    let f = 0; while (e.phase !== "end" && f < 60 * 60 * 30) { e.update(1 / 60); f++; }
    const h = e.stats.actionsBySide.home, a = e.stats.actionsBySide.away;
    braPass += h["pass"] ?? 0; braCarry += h["carry"] ?? 0; brTot += total(h);
    argPass += a["pass"] ?? 0; argCarry += a["carry"] ?? 0; argTot += total(a);
    if (e.stats.shots.home + e.stats.shots.away < 8) dynamicOk = false;
  }
  const argPassShare = argPass / argTot, braPassShare = braPass / brTot;
  const braCarryShare = braCarry / brTot, argCarryShare = argCarry / argTot;
  console.log(`Brasil  : passe curto ${(braPassShare * 100).toFixed(0)}%  condução ${(braCarryShare * 100).toFixed(0)}%`);
  console.log(`Argentina: passe curto ${(argPassShare * 100).toFixed(0)}%  condução ${(argCarryShare * 100).toFixed(0)}%`);
  check("Argentina troca mais passes curtos (posse) que o Brasil", argPassShare > braPassShare, `Arg ${(argPassShare * 100).toFixed(0)}% vs Bra ${(braPassShare * 100).toFixed(0)}%`);
  check("Brasil conduz mais (dribladores) que a Argentina", braCarryShare > argCarryShare, `Bra ${(braCarryShare * 100).toFixed(0)}% vs Arg ${(argCarryShare * 100).toFixed(0)}%`);
  check("Partida dinâmica (chances reais)", dynamicOk);
}

console.log("\n=== OVERALL AFETA A SIMULAÇÃO ===");
{
  let strongXg = 0, weakXg = 0, strongShots = 0, weakShots = 0;
  for (let s = 0; s < 3; s++) {
    const strong = buildTeam("home", "Fortes", "#00f", defaultTactics("4-3-3"), 86, s + 1);
    const weak = buildTeam("away", "Fracos", "#f00", defaultTactics("4-3-3"), 60, s + 40);
    const e = new MatchEngine(strong, weak); e.matchClockMultiplier = 1;
    let f = 0; while (e.phase !== "end" && f < 60 * 60 * 30) { e.update(1 / 60); f++; }
    strongXg += e.stats.xg.home; weakXg += e.stats.xg.away;
    strongShots += e.stats.shots.home; weakShots += e.stats.shots.away;
  }
  console.log(`Fortes(86): xG ${strongXg.toFixed(1)} chutes ${strongShots}  |  Fracos(60): xG ${weakXg.toFixed(1)} chutes ${weakShots}`);
  check("Time de overall alto cria muito mais que o de overall baixo", strongXg > weakXg * 1.6 && strongShots > weakShots);
}

console.log("\n=== CANSAÇO AFETA O JOGADOR ===");
{
  const t = buildTeam("home", "T", "#00f", defaultTactics("4-3-3"), 75, 5);
  const p = t.players[10];
  p.stamina = 1; const freshSpeed = p.maxSpeed(); const freshPass = p.skill("passing");
  p.stamina = 0.4; const tiredSpeed = p.maxSpeed(); const tiredPass = p.skill("passing");
  check("Jogador cansado fica mais lento e impreciso", tiredSpeed < freshSpeed && tiredPass < freshPass, `vel ${freshSpeed.toFixed(1)}→${tiredSpeed.toFixed(1)}`);
}

console.log(`\n=== COPA/INDIVIDUALIDADE: ${pass} passaram, ${fail} falharam ===`);
void (null as unknown as ME);
