import type { Team } from "../domain/Team";
import type { MatchEngine } from "../simulation/MatchEngine";
import type { Renderer } from "../rendering/Renderer";
import { QUICK_COMMANDS } from "../tactics/defaults";
import { el } from "./dom";

/** Barra de comandos táticos durante a partida (Parte 3). */
export class QuickBar {
  constructor(
    root: HTMLElement,
    engine: MatchEngine,
    renderer: Renderer,
    private getCoached: () => Team,
    private onChange: () => void,
  ) {
    const tag = el("span", { class: "coach-tag" }, "Comandos rápidos:");
    const grp = el("div", { class: "grp" });
    for (const name of Object.keys(QUICK_COMMANDS)) {
      const b = el("button", {}, name);
      b.onclick = () => {
        QUICK_COMMANDS[name](this.getCoached().tactics);
        flash(b);
        this.onChange();
      };
      grp.append(b);
    }

    // utilidades
    const debug = el("button", {}, "Ver alvos táticos");
    debug.onclick = () => {
      renderer.showTargets = !renderer.showTargets;
      debug.classList.toggle("on", renderer.showTargets);
    };
    const pause = el("button", {}, "⏸ Pausar");
    pause.onclick = () => {
      engine.togglePause();
      pause.textContent = engine.paused ? "▶ Retomar" : "⏸ Pausar";
      pause.classList.toggle("on", engine.paused);
    };

    root.append(tag, grp, pause, debug);
  }
}

function flash(b: HTMLButtonElement) {
  b.classList.add("on");
  setTimeout(() => b.classList.remove("on"), 350);
}
