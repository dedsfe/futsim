/**
 * Validação de individualidade (Parte 5): cada craque parece ele mesmo,
 * goleiros coerentes, sem atributos absurdos.
 * Rodar: npx esbuild scripts/test-players.ts --bundle --platform=node --format=esm
 *        --outfile=/tmp/pl.mjs && node /tmp/pl.mjs
 */
import { buildNation, AVAILABLE_NATIONS } from "../src/data/buildNationalTeam";
import { MatchEngine } from "../src/simulation/MatchEngine";
import { Vec2 } from "../src/core/Vector2";
import { rng } from "../src/core/random";
import type { Player } from "../src/domain/Player";

let pass = 0, fail = 0;
const check = (n: string, ok: boolean, d = "") => { console.log(`${ok ? "✅" : "❌"} ${n}${d ? "  — " + d : ""}`); ok ? pass++ : fail++; };

const teams: Record<string, Player[]> = {};
for (const n of AVAILABLE_NATIONS) teams[n.id] = buildNation(n.id, "home").players;
const find = (nat: string, name: string) => teams[nat].find((p) => p.name.includes(name));

// 1) Mbappé: rápido e atacando profundidade
{
  const m = find("france", "Mbappe")!;
  check("1. Mbappé rápido + ataca profundidade", m.attr.pace >= 90 && !!m.instr.attackDepth && m.hasTrait("SPEEDSTER"), `pace=${m.attr.pace} depth=${m.instr.attackDepth}`);
}
// 2) Yamal: corta para dentro e cria
{
  const y = find("spain", "Yamal")!;
  check("2. Yamal corta p/ dentro + driblador", !!y.instr.cutInside && y.hasTrait("DRIBBLER") && y.attr.marking < 40, `cutInside=${y.instr.cutInside} mar=${y.attr.marking}`);
}
// 3) Pedri: playmaker entre linhas (não box-to-box genérico)
{
  const p = find("spain", "Pedri")!;
  check("3. Pedri playmaker entre linhas", p.hasTrait("PLAYMAKER") && !!p.instr.betweenLines && !p.hasTrait("BOX_TO_BOX"), `traits=${p.traits}`);
}
// 4) Rodri: protege e organiza (âncora, recuado)
{
  const r = find("spain", "Rodri")!;
  check("4. Rodri âncora/organizador", r.role === "DM" && r.hasTrait("DEFENSIVE_ANCHOR") && r.instr.positioning === "stay-back", `role=${r.role} pos=${r.instr.positioning}`);
}
// 5) Messi: flutua entre linhas e cria
{
  const m = find("argentina", "Messi")!;
  check("5. Messi entre linhas + criador", m.hasTrait("PLAYMAKER") && m.hasTrait("BETWEEN_LINES") && !!m.instr.betweenLines, `traits=${m.traits}`);
}
// 6) Vini: ataca espaço e tenta 1x1
{
  const v = find("brazil", "Vini")!;
  check("6. Vini espaço + 1x1", v.attr.pace >= 90 && !!v.instr.attackDepth && !!v.instr.dribbleMore, `pace=${v.attr.pace}`);
}
// 7) Ronaldo: finalizador de área
{
  const r = find("portugal", "Ronaldo")!;
  check("7. Ronaldo finalizador", r.attr.finishing >= 85 && (r.hasTrait("FINALIZER") || r.hasTrait("POACHER")) && !!r.instr.shootMore, `fin=${r.attr.finishing}`);
}
// 8) Goleiros agem como goleiros (não defensores de linha)
{
  const gks = ["france:Maignan", "brazil:Alisson", "argentina:Martinez"].map((s) => { const [n, name] = s.split(":"); return find(n, name)!; });
  const ok = gks.every((g) => g.isGK && g.attr.goalkeeping >= 80 && g.attr.marking < 45 && g.attr.finishing < 40);
  check("8. GKs coerentes (GK alto, marcação/finalização baixas)", ok, gks.map((g) => `${g.name} GK${g.attr.goalkeeping} mar${g.attr.marking}`).join(" | "));
}
// 9) Zagueiro técnico sai jogando mas não vira meia
{
  const g = find("brazil", "Gabriel")!; // ball-playing defender
  check("9. Zagueiro técnico (passe ok, mas defensor)", g.role === "CB" && g.attr.marking >= 80 && g.attr.dribbling < 80, `mar=${g.attr.marking} drib=${g.attr.dribbling}`);
}
// 10) Nenhum atributo absurdo em lugar nenhum
{
  let absurd = "";
  for (const n of AVAILABLE_NATIONS) for (const p of teams[n.id]) {
    const a = p.attr;
    const vals = Object.values(a);
    if (vals.some((v) => v < 15 || v > 99)) absurd = `${p.name} fora de [15,99]`;
    if (p.isGK && (a.marking > 50 || a.finishing > 45)) absurd = `${p.name} GK com stats de linha`;
    if (!p.isGK && a.goalkeeping > 55) absurd = `${p.name} linha com GK alto`;
  }
  check("10. Sem atributos absurdos (GK não-defensor, linha sem GK alto)", absurd === "", absurd);
}

// 11) Disputa de bola: o mais FORTE leva o 50/50 com mais frequência
{
  rng.reseed(7);
  let strongWins = 0; const trials = 150;
  for (let i = 0; i < trials; i++) {
    const e = new MatchEngine(buildNation("france", "home"), buildNation("brazil", "away"));
    e.matchClockMultiplier = 1;
    let g = 0; while (e.phase !== "play" && g++ < 2000) e.update(1 / 60);
    const strong = e.home.players.find((p) => p.name.includes("Upamecano"))!; // físico 84
    const weak = e.away.players.find((p) => p.name.includes("Rodrygo"))!;      // físico 63
    strong.recoverTimer = 0; weak.recoverTimer = 0;
    strong.pos = new Vec2(52, 33.6); weak.pos = new Vec2(52, 34.4);
    e.ball.owner = null; e.ball.pos = new Vec2(52, 34); e.ball.vel = new Vec2(0, 0); e.ball.looseLock = 0;
    for (let k = 0; k < 25 && !e.ball.owner; k++) e.update(1 / 60);
    if (e.ball.owner === strong) strongWins++;
  }
  const p = Math.round((strongWins / trials) * 100);
  check("11. Físico alto leva mais na disputa de bola (>60%)", p > 60, `forte venceu ${p}%`);
}

console.log(`\n=== JOGADORES: ${pass} passaram, ${fail} falharam ===`);
