import type { MatchEngine } from "../simulation/MatchEngine";
import { clear, el } from "./dom";

const SPEEDS = [10, 20, 30];
const PACES: [string, number][] = [["Calmo", 1.2], ["Ágil", 1.8], ["Rápido", 2.6]];

/** Controles (velocidade/ritmo/pausa) + estatística resumida. O placar fica no
 *  Scoreboard (broadcast) sobreposto ao campo. */
export class Hud {
  private statEl = el("div", { class: "statline" });
  private spd = el("div", { class: "spd" });
  private pace = el("span", { class: "spd" });
  private pauseBtn = el("button", {}, "⏸");

  constructor(root: HTMLElement, private engine: MatchEngine) {
    this.pauseBtn.onclick = () => { engine.togglePause(); this.refreshPause(); };
    this.spd.append(this.pauseBtn);
    for (const s of SPEEDS) {
      const b = el("button", {}, `${s}x`);
      b.onclick = () => {
        engine.matchClockMultiplier = s;
        if (engine.paused) engine.resume();
        this.refreshSpeed(); this.refreshPause();
      };
      (b as any)._spd = s;
      this.spd.append(b);
    }
    this.spd.append(el("span", { class: "coach-tag" }, "· Ritmo:"));
    for (const [label, v] of PACES) {
      const b = el("button", {}, label);
      b.onclick = () => { engine.physicsSpeed = v; this.refreshPace(); };
      (b as any)._pace = v;
      this.pace.append(b);
    }
    this.spd.append(this.pace);

    const wrap = el("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "6px";
    wrap.append(this.spd, this.statEl);
    root.append(wrap);
    this.refreshPause(); this.refreshSpeed(); this.refreshPace();
  }

  private refreshSpeed() {
    for (const b of Array.from(this.spd.children) as HTMLButtonElement[]) {
      if ((b as any)._spd !== undefined) b.classList.toggle("on", (b as any)._spd === this.engine.matchClockMultiplier);
    }
  }
  private refreshPace() {
    for (const b of Array.from(this.pace.children) as HTMLButtonElement[]) {
      b.classList.toggle("on", (b as any)._pace === this.engine.physicsSpeed);
    }
  }
  private refreshPause() {
    this.pauseBtn.textContent = this.engine.paused ? "▶" : "⏸";
    this.pauseBtn.classList.toggle("on", this.engine.paused);
  }

  update() {
    const e = this.engine;
    clear(this.statEl);
    this.statEl.append(
      stat("Posse", `${e.possessionPct("home")}% / ${e.possessionPct("away")}%`),
      stat("Chutes", `${e.stats.shots.home} - ${e.stats.shots.away}`),
    );
    this.refreshPause(); this.refreshSpeed(); this.refreshPace();
  }
}

function stat(label: string, value: string) {
  const s = el("span", {}, label ? `${label}: ` : "");
  s.append(el("b", {}, value));
  return s;
}
