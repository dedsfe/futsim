import { clear, el } from "./dom";

type MenuCallback = (mode: "quick" | "world_cup") => void;

export class MainMenu {
  constructor(private root: HTMLElement, private onSelect: MenuCallback) {
    this.render();
  }

  show() {
    this.root.style.display = "flex";
  }

  hide() {
    this.root.style.display = "none";
  }

  private render() {
    clear(this.root);
    this.root.className = "main-menu-container";

    const title = el("h1", { class: "main-title" }, "FUTSIM 26");
    const subtitle = el("p", { class: "main-subtitle" }, "SIMULADOR DE FUTEBOL TÁTICO");

    const btnQuick = el("button", { class: "menu-btn" }, "PARTIDA RÁPIDA");
    btnQuick.onclick = () => this.onSelect("quick");

    const btnCup = el("button", { class: "menu-btn" }, "COPA DO MUNDO 2026");
    btnCup.onclick = () => this.onSelect("world_cup");

    const menuOptions = el("div", { class: "menu-options" }, btnQuick, btnCup);

    const overlay = el("div", { class: "menu-overlay" }, title, subtitle, menuOptions);
    this.root.append(overlay);
  }
}
