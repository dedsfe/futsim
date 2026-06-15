import type { Player } from "../domain/Player";
import type { Team } from "../domain/Team";
import type { MatchEngine } from "../simulation/MatchEngine";
import { clear, el } from "./dom";

/** Sigla de 3 letras a partir do nome (Brasil→BRA, Argentina→ARG, França→FRA...). */
const abbr = (name: string) => name.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 3).toUpperCase();

interface Box {
  root: HTMLElement;
  fill: HTMLElement; // barra de stamina
  num: HTMLElement;
  name: HTMLElement;
}

/**
 * Placar broadcast no topo + DUAS caixas estilo FIFA nos cantos inferiores:
 * casa à esquerda, visitante à direita. Cada caixa mostra o jogador "ativo"
 * daquele time — o portador da bola, ou (sem a bola) o mais próximo dela.
 */
export class Scoreboard {
  private homeNum = el("span", { class: "sb-num" }, "0");
  private awayNum = el("span", { class: "sb-num" }, "0");
  private clockEl = el("span", { class: "sb-clock" }, "00:00");
  private periodEl = el("span", { class: "sb-period" }, "1ºT");
  private pensEl = el("div", { class: "sb-pens" });
  private boxHome: Box;
  private boxAway: Box;

  constructor(root: HTMLElement, private engine: MatchEngine) {
    clear(root);
    const e = engine;
    const chip = (color: string) => {
      const c = el("span", { class: "sb-chip" });
      c.style.background = color;
      return c;
    };
    const homeTeam = el("div", { class: "sb-team" },
      chip(e.home.color), el("span", { class: "sb-abbr" }, abbr(e.home.name)), this.homeNum);
    const awayTeam = el("div", { class: "sb-team away" },
      this.awayNum, el("span", { class: "sb-abbr" }, abbr(e.away.name)), chip(e.away.color));
    const mid = el("div", { class: "sb-mid" }, this.clockEl, this.periodEl);
    root.append(el("div", { class: "sb" }, homeTeam, mid, awayTeam), this.pensEl);

    const wrap = root.parentElement ?? root;
    this.boxHome = this.makeBox(false);
    this.boxAway = this.makeBox(true);
    wrap.append(this.boxHome.root, this.boxAway.root);
  }

  private makeBox(away: boolean): Box {
    const fill = el("span", { class: "fifa-sta-fill" });
    const num = el("span", { class: "fifa-num" }, "");
    const name = el("span", { class: "fifa-name" }, "");
    const row = el("div", { class: "fifa-row" }, num, name);
    const rootEl = el("div", { class: "fifa-carrier" + (away ? " away" : "") },
      el("div", { class: "fifa-sta" }, fill), row);
    return { root: rootEl, fill, num, name };
  }

  /** Quem mostrar para um time: portador, ou o mais próximo da bola se sem posse. */
  private activePlayer(team: Team): Player | null {
    const e = this.engine;
    if (e.shootout) {
      if (e.shootout.turn === team.side) return e.shootout.kicker;
      return team.gk ?? null;
    }
    if (e.ball.owner && e.ball.owner.side === team.side) return e.ball.owner;
    let best: Player | null = null;
    let bd = Infinity;
    for (const p of team.players) {
      if (p.sentOff) continue;
      const d = p.pos.dist(e.ball.pos);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  private fillBox(box: Box, team: Team, hasBall: boolean) {
    const p = this.activePlayer(team);
    if (!p) { box.root.style.display = "none"; return; }
    box.root.style.display = "block";
    box.root.classList.toggle("haspossession", hasBall);
    box.root.style.borderColor = team.color;
    box.num.textContent = String(p.shirt);
    box.name.textContent = (p.name || p.role).toUpperCase() + (hasBall ? " ⚽" : "");
    const st = Math.round(p.stamina * 100);
    box.fill.style.width = `${st}%`;
    box.fill.style.background = st > 60 ? "#34c759" : st > 35 ? "#e3b341" : "#f85149";
  }

  update() {
    const e = this.engine;
    this.homeNum.textContent = String(e.scoreHome);
    this.awayNum.textContent = String(e.scoreAway);
    this.clockEl.textContent = e.clock;
    this.periodEl.textContent =
      e.phase === "end" ? "FIM"
      : e.phase === "halftime" ? "INT"
      : e.phase === "shootout" ? "PÊN"
      : (e.extraTime ? "PRO " : "") + (e.half === 2 ? "2ºT" : "1ºT");

    const poss = e.ball.owner ? e.ball.owner.side : null;
    this.fillBox(this.boxHome, e.home, poss === "home");
    this.fillBox(this.boxAway, e.away, poss === "away");

    clear(this.pensEl);
    const so = e.shootout;
    if (so) {
      const prow = (name: string, kicks: boolean[], score: number) => {
        const r = el("div", { class: "sb-pen-row" });
        r.append(el("span", { class: "sb-pen-abbr" }, abbr(name)));
        for (const g of kicks) r.append(el("span", { class: "sb-dot " + (g ? "ok" : "miss") }));
        r.append(el("span", { class: "sb-pen-score" }, String(score)));
        return r;
      };
      this.pensEl.append(
        el("div", { class: "sb-pen-title" }, so.winner ? "Pênaltis — fim" : "Disputa de pênaltis"),
        prow(e.home.name, so.homeKicks, so.homeScore),
        prow(e.away.name, so.awayKicks, so.awayScore),
      );
    }
  }
}
