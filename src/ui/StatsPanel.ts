import type { MatchEngine } from "../simulation/MatchEngine";
import { clear, el } from "./dom";

/** Painel de estatísticas da partida (aba "Estatísticas"). */
export class StatsPanel {
  constructor(private root: HTMLElement, private engine: MatchEngine) {
    this.update();
  }

  update() {
    const e = this.engine;
    const s = e.stats;
    clear(this.root);

    // placar
    const head = el("div", { class: "stat-head" });
    head.append(
      teamName(e.home.name, e.home.color),
      el("div", { class: "stat-score" }, `${e.scoreHome} - ${e.scoreAway}`),
      teamName(e.away.name, e.away.color),
    );
    this.root.append(head);
    const sub = el("div", { class: "muted" }, `${e.half === 2 ? "2º tempo" : "1º tempo"} · ${e.clock}`);
    sub.style.textAlign = "center";
    this.root.append(sub);
    const dbg = el("div", { class: "muted" },
      `⏱ Relógio ${e.matchClockMultiplier}x · real ${Math.floor(e.realElapsed)}s → jogo ${e.clock} (física em tempo real)`);
    dbg.style.textAlign = "center";
    this.root.append(dbg);

    // autores dos gols
    this.root.append(el("h4", {}, "Gols"));
    if (e.goals.length === 0) {
      this.root.append(el("div", { class: "muted" }, "Sem gols ainda."));
    } else {
      const list = el("div", { class: "goals" });
      for (const g of e.goals) {
        const teamName2 = g.side === "home" ? e.home.name : e.away.name;
        const row = el("div", { class: "goalrow" }, `⚽ ${g.minute}' ${g.scorer} (${teamName2})`);
        row.style.textAlign = g.side === "home" ? "left" : "right";
        list.append(row);
      }
      this.root.append(list);
    }

    // tabela de estatísticas
    this.root.append(el("h4", {}, "Estatísticas"));
    const table = el("div", { class: "stat-table" });
    const pct = (h: number, a: number) => {
      const t = h + a;
      return t === 0 ? ["50%", "50%"] : [`${Math.round((h / t) * 100)}%`, `${Math.round((a / t) * 100)}%`];
    };
    const poss = [`${e.possessionPct("home")}%`, `${e.possessionPct("away")}%`];
    const passAcc = (side: "home" | "away") => {
      const c = s.passesCompleted[side], f = s.passesFailed[side];
      return c + f === 0 ? "—" : `${Math.round((c / (c + f)) * 100)}%`;
    };
    table.append(
      statRow("Posse", poss[0], poss[1]),
      statRow("Chutes", s.shots.home, s.shots.away),
      statRow("No gol", s.shotsOnTarget.home, s.shotsOnTarget.away),
      statRow("Na área", s.shotsInBox.home, s.shotsInBox.away),
      statRow("xG", s.xg.home.toFixed(2), s.xg.away.toFixed(2)),
      statRow("Passes certos", s.passesCompleted.home, s.passesCompleted.away),
      statRow("Acerto passe", passAcc("home"), passAcc("away")),
      statRow("Desarmes", s.tackles.home, s.tackles.away),
      statRow("Interceptações", s.interceptions.home, s.interceptions.away),
      statRow("Defesas (GK)", s.saves.home, s.saves.away),
      statRow("Faltas", s.fouls.home, s.fouls.away),
      statRow("Impedimentos", s.offsides.home, s.offsides.away),
      statRow("Pênaltis", s.penalties.home, s.penalties.away),
      statRow("Amarelos", s.yellow.home, s.yellow.away),
      statRow("Vermelhos", s.red.home, s.red.away),
    );
    void pct;
    this.root.append(table);
  }
}

function teamName(name: string, color: string) {
  const d = el("div", { class: "stat-team" }, name);
  d.style.color = color;
  return d;
}

function statRow(label: string, home: string | number, away: string | number) {
  const row = el("div", { class: "stat-row" });
  row.append(
    el("span", { class: "sv h" }, String(home)),
    el("span", { class: "sl" }, label),
    el("span", { class: "sv a" }, String(away)),
  );
  return row;
}
