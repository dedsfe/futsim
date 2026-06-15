// Roda uma partida inteira sem render para validar a simulação (sem NaN/crash).
import { buildTeam } from "../src/domain/roster";
import { defaultTactics } from "../src/tactics/defaults";
import { MatchEngine } from "../src/simulation/MatchEngine";
import { FIELD } from "../src/core/constants";

const home = buildTeam("home", "Azuis", "#00f", defaultTactics("4-3-3"), 75, 1);
const away = buildTeam("away", "Vermelhos", "#f00", defaultTactics("4-4-2"), 70, 2);
const e = new MatchEngine(home, away);
e.matchClockMultiplier = 1;

let frames = 0;
let touches = 0;
let nan = false;
let maxBallSpeed = 0;
const events: Record<string, number> = {};
let prevEvent = "";
// ~simula até o fim (2x45min). Frame de 1/60 s real.
while (e.phase !== "end" && frames < 60 * 60 * 30) {
  e.update(1 / 60);
  frames++;
  const b = e.ball;
  if (!Number.isFinite(b.pos.x) || !Number.isFinite(b.pos.y)) nan = true;
  if (b.owner) touches++;
  maxBallSpeed = Math.max(maxBallSpeed, b.speed());
  if (e.lastEvent !== prevEvent) {
    const key = e.lastEvent.replace(/de .*$|—.*$|!$/, "").trim();
    events[key] = (events[key] ?? 0) + 1;
    prevEvent = e.lastEvent;
  }
  for (const p of [...home.players, ...away.players]) {
    if (!Number.isFinite(p.pos.x)) nan = true;
    if (p.pos.x < -1 || p.pos.x > FIELD.W + 1 || p.pos.y < -1 || p.pos.y > FIELD.H + 1) {
      nan = true;
    }
  }
}

console.log("frames simulados:", frames);
console.log("tempo de jogo:", e.clock, "fase:", e.phase);
console.log("placar:", e.scoreHome, "-", e.scoreAway);
console.log("posse:", e.possessionPct("home") + "% /", e.possessionPct("away") + "%");
console.log("chutes:", e.stats.shots.home, "-", e.stats.shots.away);
console.log("ticks com dono da bola:", touches);
console.log("velocidade máx. da bola (m/s):", maxBallSpeed.toFixed(1));
console.log("posse da bola (ticks com dono):", ((touches / frames) * 100).toFixed(0) + "%");
console.log("eventos:", events);
console.log("ALGUM NaN / fora do campo?", nan ? "SIM ❌" : "não ✅");
