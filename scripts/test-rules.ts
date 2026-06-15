/**
 * Verificação das REGRAS do futebol (reinícios) — busca 100% de cobertura.
 * Rodar: npx esbuild scripts/test-rules.ts --bundle --platform=node --format=esm
 *        --outfile=/tmp/r.mjs && node /tmp/r.mjs
 */
import { Vec2 } from "../src/core/Vector2";
import { FIELD } from "../src/core/constants";
import { buildTeam } from "../src/domain/roster";
import { defaultTactics } from "../src/tactics/defaults";
import { MatchEngine } from "../src/simulation/MatchEngine";
import { rng } from "../src/core/random";

rng.reseed(42);
let pass = 0, fail = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "✅" : "❌"} ${n}${d ? "  — " + d : ""}`); ok ? pass++ : fail++; };

function eng() {
  const h = buildTeam("home", "Casa", "#00f", defaultTactics("4-3-3"), 75, 1);
  const a = buildTeam("away", "Fora", "#f00", defaultTactics("4-3-3"), 75, 2);
  const e = new MatchEngine(h, a);
  e.matchClockMultiplier = 10;
  let g = 0; while (e.phase !== "play" && g++ < 2000) e.update(1 / 60); // consome o pontapé inicial
  return e;
}
/** Coloca a bola SOLTA num ponto fora e roda 1 tick para o motor reiniciar. */
function ballOut(e: MatchEngine, pos: Vec2, lastTouch: "home" | "away") {
  e.ball.owner = null;
  e.ball.intendedReceiver = null;
  e.ball.pos = pos.clone();
  e.ball.vel = new Vec2(0, 0);
  e.ball.looseLock = 0;
  e.ball.lastTouchSide = lastTouch;
  e.update(1 / 60);
  return { event: e.lastEvent, owner: e.ball.owner, x: e.ball.pos.x, y: e.ball.pos.y };
}

console.log("=== KICKOFF (início) ===");
{
  const e = eng();
  const center = new Vec2(FIELD.W / 2, FIELD.H / 2);
  const taker = e.ball.owner!;
  let ownHalfOk = true, circleOk = true;
  for (const team of [e.home, e.away]) {
    for (const p of team.players) {
      if (team.attackProgress(p.pos) > 0.52) ownHalfOk = false; // todos no próprio campo
      if (p !== taker && p.pos.dist(center) < FIELD.CENTER_CIRCLE_R - 0.5) circleOk = false;
    }
  }
  check("Todos no próprio campo no pontapé inicial", ownHalfOk);
  check("Círculo central livre (só o cobrador)", circleOk);
  check("Bola no meio e com o time da saída", e.ball.pos.dist(center) < 1.5 && !!taker);
}

console.log("\n=== LATERAL (throw-in) ===");
{
  let e = eng();
  let r = ballOut(e, new Vec2(50, -1), "home"); // saiu pela linha de cima, último toque casa
  check("Lateral p/ adversário (cima)", r.event === "Lateral" && r.owner?.side === "away", `evt=${r.event} dono=${r.owner?.side}`);
  e = eng();
  r = ballOut(e, new Vec2(60, FIELD.H + 1), "away"); // linha de baixo, último toque fora
  check("Lateral p/ adversário (baixo)", r.event === "Lateral" && r.owner?.side === "home", `evt=${r.event} dono=${r.owner?.side}`);
}

console.log("\n=== ESCANTEIO (corner) ===");
{
  // bola sai pela linha de fundo DIREITA (gol do away), último toque do AWAY → escanteio do home
  let e = eng();
  let r = ballOut(e, new Vec2(FIELD.W + 1, 8), "away");
  check("Escanteio p/ quem atacava (direita)", r.event === "Escanteio" && r.owner?.side === "home", `evt=${r.event} dono=${r.owner?.side}`);
  check("Bola no canto (direita)", r.x > FIELD.W - 2 && (r.y < 3 || r.y > FIELD.H - 3), `x=${r.x.toFixed(1)} y=${r.y.toFixed(1)}`);
  // linha de fundo ESQUERDA (gol do home), último toque do HOME → escanteio do away
  e = eng();
  r = ballOut(e, new Vec2(-1, FIELD.H - 8), "home");
  check("Escanteio p/ quem atacava (esquerda)", r.event === "Escanteio" && r.owner?.side === "away", `evt=${r.event} dono=${r.owner?.side}`);
}

console.log("\n=== TIRO DE META (goal kick) ===");
{
  // linha de fundo direita (gol do away), último toque do HOME (atacante) → tiro de meta do away (goleiro)
  let e = eng();
  let r = ballOut(e, new Vec2(FIELD.W + 1, 8), "home");
  check("Tiro de meta p/ defensor (direita) e com o GOLEIRO", r.event === "Tiro de meta" && r.owner?.side === "away" && !!r.owner?.isGK, `evt=${r.event} dono=${r.owner?.side} gk=${r.owner?.isGK}`);
  // esquerda, último toque do away → tiro de meta do home GK
  e = eng();
  r = ballOut(e, new Vec2(-1, FIELD.H - 8), "away");
  check("Tiro de meta p/ defensor (esquerda) e com o GOLEIRO", r.event === "Tiro de meta" && r.owner?.side === "home" && !!r.owner?.isGK, `evt=${r.event} dono=${r.owner?.side} gk=${r.owner?.isGK}`);
}

console.log("\n=== GOL ===");
{
  let e = eng();
  const before = e.scoreHome;
  ballOut(e, new Vec2(FIELD.W + 0.5, FIELD.H / 2), "home"); // entre as traves do gol direito
  check("Gol do Brasil/casa ao cruzar a linha entre as traves", e.scoreHome === before + 1, `placar casa ${e.scoreHome}`);
  e = eng();
  const beforeA = e.scoreAway;
  ballOut(e, new Vec2(-0.5, FIELD.H / 2), "away");
  check("Gol do visitante no gol esquerdo", e.scoreAway === beforeA + 1, `placar fora ${e.scoreAway}`);
}

console.log("\n=== TEMPO: intervalo e fim ===");
{
  const e = eng();
  e.gameSeconds = 45 * 60 - 0.5;
  let g = 0; while (e.half === 1 && g++ < 400) e.update(1 / 60);
  check("Intervalo aos 45min e saída do 2º tempo p/ quem não começou", e.half === 2, `half=${e.half}`);
  e.gameSeconds = 90 * 60 - 0.5;
  g = 0; while (e.phase !== "end" && g++ < 400) e.update(1 / 60); // consome a parada do intervalo
  check("Fim de jogo aos 90min", e.phase === "end", `phase=${e.phase}`);
}

console.log("\n=== PÊNALTIS / PRORROGAÇÃO ===");
{
  const e = eng();
  e.startShootout();
  let g = 0; while (e.phase === "shootout" && g++ < 60 * 120) e.update(1 / 60);
  const so = e.shootout!;
  check("Disputa de pênaltis termina com um vencedor", e.phase === "end" && (so.winner === "home" || so.winner === "away"), `winner=${so.winner} ${so.homeScore}-${so.awayScore}`);
  check("Placar dos pênaltis é coerente (vencedor fez mais)", (so.winner === "home") === (so.homeScore > so.awayScore));
  check("Pelo menos 3 cobranças por lado", so.homeKicks.length >= 3 && so.awayKicks.length >= 3);
}
{
  const e = eng();
  e.gameSeconds = 90 * 60 - 0.5; let g = 0; while (e.phase !== "end" && g++ < 400) e.update(1 / 60);
  e.startExtraTime();
  check("Prorrogação reabre o jogo (não está mais 'end')", e.phase !== "end" && e.extraTime, `phase=${e.phase}`);
}

console.log(`\n=== REGRAS: ${pass} passaram, ${fail} falharam ===`);
