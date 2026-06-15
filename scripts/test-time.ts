/**
 * Testes de tempo/pausa/velocidade/continuidade fora da tela (Parte 1).
 * Rodar: npx esbuild scripts/test-time.ts --bundle --platform=node --format=esm
 *        --outfile=/tmp/t.mjs && node /tmp/t.mjs
 */
import { buildTeam } from "../src/domain/roster";
import { defaultTactics } from "../src/tactics/defaults";
import { MatchEngine } from "../src/simulation/MatchEngine";
import { rng } from "../src/core/random";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? "  — " + detail : ""}`);
  ok ? pass++ : fail++;
};

function newEngine(mult = 1) {
  const h = buildTeam("home", "H", "#00f", defaultTactics("4-3-3"), 74, 1);
  const a = buildTeam("away", "A", "#f00", defaultTactics("4-3-3"), 74, 2);
  const e = new MatchEngine(h, a);
  e.matchSpeedMultiplier = mult;
  return e;
}
/** Feed N segundos reais em frames de 1/60s. */
function feedReal(e: MatchEngine, realSeconds: number) {
  const frames = Math.round(realSeconds * 60);
  for (let i = 0; i < frames; i++) e.update(1 / 60);
}
/** Consome o pontapé inicial até a bola rolar. */
function toPlay(e: MatchEngine) {
  let g = 0;
  while (e.phase !== "play" && g++ < 2000) e.update(1 / 60);
}

// 1) 1x: ~60s reais → ~60s de jogo
{
  const e = newEngine(1);
  toPlay(e);
  const g0 = e.gameSeconds;
  feedReal(e, 60);
  const d = e.gameSeconds - g0;
  check("1x: 60s reais ≈ 60s de jogo", d >= 55 && d <= 60.2, `avançou ${d.toFixed(1)}s`);
}

// 2) 10x: ~6s reais → ~60s de jogo
{
  const e = newEngine(10);
  toPlay(e);
  const g0 = e.gameSeconds;
  feedReal(e, 6);
  const d = e.gameSeconds - g0;
  check("10x: 6s reais ≈ 60s de jogo", d >= 52 && d <= 60.5, `avançou ${d.toFixed(1)}s`);
}

// 3) escala linear: 10x avança ~10x mais que 1x no mesmo tempo real
{
  const e1 = newEngine(1); toPlay(e1); const a0 = e1.gameSeconds; feedReal(e1, 5); const d1 = e1.gameSeconds - a0;
  const e10 = newEngine(10); toPlay(e10); const b0 = e10.gameSeconds; feedReal(e10, 5); const d10 = e10.gameSeconds - b0;
  const ratio = d10 / d1;
  check("Velocidade escala a simulação (≈10x)", ratio >= 8.5 && ratio <= 10.5, `razão ${ratio.toFixed(1)}x`);
}

// 4) Pausado: tempo real não avança nada
{
  const e = newEngine(10);
  toPlay(e);
  e.pause();
  const g0 = e.gameSeconds;
  feedReal(e, 5);
  check("Pausado: nada avança", e.gameSeconds === g0, `Δ=${(e.gameSeconds - g0).toFixed(3)}s`);
  e.resume();
  feedReal(e, 1);
  check("Após retomar: volta a avançar", e.gameSeconds > g0);
}

// 5) Fora da tela e voltar: avança o tempo perdido (10x, 30s reais → ~300s jogo)
{
  const e = newEngine(10);
  toPlay(e);
  const g0 = e.gameSeconds;
  e.catchUp(30); // 30s fora da tela
  const d = e.gameSeconds - g0;
  check("Fora da tela 30s @10x ≈ 300s de jogo", d >= 270 && d <= 301, `avançou ${d.toFixed(0)}s`);
}

// 6) Fora da tela enquanto pausado: não avança
{
  const e = newEngine(10);
  toPlay(e);
  e.pause();
  const g0 = e.gameSeconds;
  e.catchUp(30);
  check("Fora da tela + pausado: nada avança", e.gameSeconds === g0);
}

// 7) Relógio acelera, mas a FÍSICA dos jogadores não (Parte 4)
{
  function run(mult: number, realSec: number) {
    rng.reseed(99); // reprodutível e idêntico p/ os dois multiplicadores
    const e = newEngine(mult);
    toPlay(e);
    const g0 = e.gameSeconds;
    const before = e.home.players.map((p) => p.pos.clone());
    feedReal(e, realSec);
    let dist = 0;
    e.home.players.forEach((p, i) => (dist += p.pos.dist(before[i])));
    return { clock: e.gameSeconds - g0, dist };
  }
  const a = run(1, 3);
  const b = run(20, 3);
  const clockRatio = b.clock / a.clock;
  const distRatio = b.dist / a.dist;
  check("Relógio 20x corre ~20x mais rápido", clockRatio > 14 && clockRatio < 24, `razão relógio ${clockRatio.toFixed(1)}x`);
  // física NÃO é multiplicada pelo relógio: a distância fica perto de 1x (a
  // divergência de estado dá variação, mas LONGE de ~20x).
  check("Jogadores NÃO ficam 20x mais rápidos", distRatio < 4, `razão distância física ${distRatio.toFixed(2)}x (≠ 20x)`);
}

console.log(`\n=== TEMPO: ${pass} passaram, ${fail} falharam ===`);
