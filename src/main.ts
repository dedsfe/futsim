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
import { MainMenu } from "./ui/MainMenu";
import { WorldCupMenu } from "./ui/WorldCupMenu";
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

const gameUI = document.getElementById("game-ui")!;
const mainMenuRoot = document.getElementById("main-menu")!;

let hud: Hud;
let scoreboard: Scoreboard;
let statsPanel: StatsPanel | null = null;
let sidebarMode: "stats" | "org" = "org";
let mainMenu: MainMenu;
let currentOnMatchEnd: ((h: number, a: number, hp: number, ap: number) => void) | null = null;

function startMatch(
  teams: { home: Team; away: Team }, 
  onMatchEnd?: (h: number, a: number, hp: number, ap: number) => void,
  coachedSide: "home" | "away" = "home",
  isKnockout: boolean = false
) {
  // Esconde o menu, mostra a UI do jogo
  mainMenu.hide();
  gameUI.style.display = "grid";
  currentOnMatchEnd = onMatchEnd || null;

  // Resolve clash colors
  if (teams.home.secondaryColor && teams.away.secondaryColor) {
    const dist = (c1: string, c2: string) => {
      const h1 = c1.replace("#", "");
      const h2 = c2.replace("#", "");
      const r1 = parseInt(h1.substring(0, 2), 16), g1 = parseInt(h1.substring(2, 4), 16), b1 = parseInt(h1.substring(4, 6), 16);
      const r2 = parseInt(h2.substring(0, 2), 16), g2 = parseInt(h2.substring(2, 4), 16), b2 = parseInt(h2.substring(4, 6), 16);
      return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    };

    const d1 = dist(teams.home.color, teams.away.color);
    if (d1 < 160) {
      // Cores parecidas. Tenta usar o uniforme reserva de quem der mais contraste
      const dAwaySec = dist(teams.home.color, teams.away.secondaryColor);
      const dHomeSec = dist(teams.home.secondaryColor, teams.away.color);
      if (dAwaySec > dHomeSec) {
        teams.away.color = teams.away.secondaryColor;
      } else {
        teams.home.color = teams.home.secondaryColor;
      }
    }
  }

  engine = new MatchEngine(teams.home, teams.away, isKnockout);
  coached = coachedSide;
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
    if (engine) engine.catchUp(elapsed); // respeita pausa e matchSpeedMultiplier
    hiddenAt = 0;
    last = performance.now();
  }
});

function frame(now: number) {
  const dt = (now - last) / 1000;
  last = now;

  try {
    if (!document.hidden && engine) {
      engine.update(dt);
      renderer.draw(engine);
      hud.update();
      scoreboard.update();
      if (sidebarMode === "stats") statsPanel?.update();

      if (engine.phase === "end" && currentOnMatchEnd) {
        const cb = currentOnMatchEnd;
        currentOnMatchEnd = null;
        cb(engine.scoreHome, engine.scoreAway, engine.shootout?.homeScore || 0, engine.shootout?.awayScore || 0);
      }
    }
  } catch (err: any) {
    console.error("CRASH NO LOOP DA ENGINE:", err);
    alert("CRASH: " + err.message + "\n\n" + err.stack);
    engine = null as any; // Para o loop de tentar rodar a engine quebrada
    return; // Para o game loop totalmente
  }

  requestAnimationFrame(frame);
}

function init() {
  mainMenu = new MainMenu(mainMenuRoot, (mode) => {
    if (mode === "quick") {
      import("./data/buildNationalTeam").then(({ buildNation }) => {
        startMatch({ home: buildNation("brazil", "home"), away: buildNation("argentina", "away") });
      });
    } else if (mode === "world_cup") {
      new WorldCupMenu(mainMenuRoot, () => {
        mainMenuRoot.style.display = ""; // just in case
        init(); // re-init menu
      }, (homeId, awayId, onFinish, coachedSide, isKnockout) => {
        try {
          const homeTeam = buildNation(homeId, "home");
          const awayTeam = buildNation(awayId, "away");
          startMatch({ home: homeTeam, away: awayTeam }, (h, a, hp, ap) => {
             gameUI.style.display = "none";
             onFinish(h, a, hp, ap);
          }, coachedSide, isKnockout);
        } catch (err: any) {
          console.error("Erro ao iniciar jogo do usuário:", err);
          alert("Erro ao iniciar a partida: " + err.message);
          mainMenuRoot.style.display = "flex";
        }
      });
    }
  });

  mainMenu.show();
  gameUI.style.display = "none";
  requestAnimationFrame(frame);
}

init();
