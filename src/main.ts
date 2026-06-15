import { buildTeam } from "./domain/roster";
import { defaultTactics } from "./tactics/defaults";
import { buildNation, AVAILABLE_NATIONS } from "./data/buildNationalTeam";
import { MatchEngine } from "./simulation/MatchEngine";
import type { Team } from "./domain/Team";
import { Renderer } from "./rendering/Renderer";
import { Hud } from "./ui/hud";
import { Scoreboard } from "./ui/Scoreboard";
import { QuickBar } from "./ui/quickbar";
import { TacticalPanel } from "./ui/TacticalPanel";
import { StatsPanel } from "./ui/StatsPanel";
import { el } from "./ui/dom";

function genericTeams(): { home: Team; away: Team } {
  return {
    home: buildTeam("home", "Azuis FC", "#2f7bff", defaultTactics("4-3-3"), 72, 101),
    away: buildTeam("away", "Vermelhos EC", "#ff5a4d", defaultTactics("4-4-2"), 70, 202),
  };
}

// estado mutável: trocar de partida recria o motor + UI
let engine!: MatchEngine;
let coached: "home" | "away" = "home";
const getCoached = () => (coached === "home" ? engine.home : engine.away);

const canvas = document.getElementById("pitch") as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const hudRoot = document.getElementById("hud")!;
const quickRoot = document.getElementById("quickbar")!;
const sidebarRoot = document.getElementById("sidebar")!;
const scoreboardRoot = document.getElementById("scoreboard")!;

let hud: Hud;
let scoreboard: Scoreboard;
let statsPanel: StatsPanel | null = null;
let sidebarMode: "stats" | "org" = "org";

function startMatch(teams: { home: Team; away: Team }) {
  engine = new MatchEngine(teams.home, teams.away);
  coached = "home";
  hudRoot.replaceChildren();
  quickRoot.replaceChildren();
  sidebarRoot.replaceChildren();
  statsPanel = null;

  // barra de seleção de partida: escolha qualquer confronto (Copa)
  const bar = el("div", { class: "matchbar" });
  const mkSelect = (sel: string) => {
    const s = el("select") as HTMLSelectElement;
    for (const n of AVAILABLE_NATIONS) s.append(el("option", { value: n.id }, n.name));
    s.value = sel;
    return s;
  };
  const homeSel = mkSelect("brazil");
  const awaySel = mkSelect("argentina");
  const go = el("button", {}, "▶ Iniciar");
  go.onclick = () => startMatch({ home: buildNation(homeSel.value, "home"), away: buildNation(awaySel.value, "away") });
  const generic = el("button", {}, "Genéricos");
  generic.onclick = () => startMatch(genericTeams());
  const pens = el("button", {}, "🥅 Pênaltis");
  pens.onclick = () => engine.startShootout();
  const et = el("button", {}, "⏱ Prorrogação");
  et.onclick = () => engine.startExtraTime();
  bar.append(el("span", { class: "coach-tag" }, "🏆"), homeSel, el("span", { class: "coach-tag" }, "×"), awaySel, go, generic, pens, et);
  hudRoot.append(bar);
  hud = new Hud(hudRoot, engine);
  scoreboard = new Scoreboard(scoreboardRoot, engine);

  // abas do painel direito: Estatísticas | Organização
  const tabs = el("div", { class: "tabs" });
  const tabStats = el("button", {}, "📊 Estatísticas");
  const tabOrg = el("button", {}, "⚙️ Organização");
  const content = el("div", { class: "tabcontent" });
  sidebarRoot.append(tabs, content);
  tabs.append(tabStats, tabOrg);

  let panel: TacticalPanel | null = null;
  const show = (mode: "stats" | "org") => {
    sidebarMode = mode;
    content.replaceChildren();
    tabStats.classList.toggle("on", mode === "stats");
    tabOrg.classList.toggle("on", mode === "org");
    if (mode === "org") {
      panel = new TacticalPanel(content, engine, getCoached, (side) => { coached = side; });
      statsPanel = null;
    } else {
      statsPanel = new StatsPanel(content, engine);
    }
  };
  tabStats.onclick = () => show("stats");
  tabOrg.onclick = () => show("org");
  show("org");

  new QuickBar(quickRoot, engine, renderer, getCoached, () => panel?.sync());
}

startMatch(genericTeams());

// ---- loop baseado em delta-time real ----
let last = performance.now();
let hiddenAt = 0;

// Continuidade fora da tela: quando a aba volta a ficar visível, recupera o
// tempo que passou (rAF é congelado em background) avançando a simulação.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hiddenAt = performance.now();
  } else if (hiddenAt) {
    const elapsed = (performance.now() - hiddenAt) / 1000;
    engine.catchUp(elapsed); // respeita pausa e matchSpeedMultiplier
    hiddenAt = 0;
    last = performance.now();
  }
});

function frame(now: number) {
  const dt = (now - last) / 1000;
  last = now;
  if (!document.hidden) {
    engine.update(dt); // converte para tempo de simulação internamente
    renderer.draw(engine);
    hud.update();
    scoreboard.update();
    if (sidebarMode === "stats") statsPanel?.update();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
