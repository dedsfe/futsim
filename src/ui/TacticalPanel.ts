import type { Player } from "../domain/Player";
import type { Team } from "../domain/Team";
import type { MatchEngine } from "../simulation/MatchEngine";
import type {
  AttackFocus,
  MarkingType,
  Mentality,
  OnLoss,
  OnRecovery,
  PossessionStyle,
  TeamTactics,
} from "../domain/types";
import { FORMATIONS, FORMATION_KEYS } from "../tactics/formations";
import { clear, el } from "./dom";

/**
 * Painel tático completo (Parte 3): edição coletiva + por jogador. Tudo altera
 * `team.tactics` / `player.instr`, lidos ao vivo pela IA — sem "salvar".
 */
export class TacticalPanel {
  private syncFns: (() => void)[] = [];
  private selected: Player | null = null;

  constructor(
    private root: HTMLElement,
    private engine: MatchEngine,
    private getCoached: () => Team,
    private switchCoach: (side: "home" | "away") => void,
  ) {
    this.render();
  }

  /** Atualiza controles a partir do estado (após comandos rápidos). */
  sync() {
    this.syncFns.forEach((f) => f());
  }

  render() {
    const team = this.getCoached();
    clear(this.root);
    this.syncFns = [];

    // ---- cabeçalho / troca de time ----
    const head = el("div", { class: "row" });
    const title = el("h3", {}, `Técnico: ${team.name}`);
    const swap = el("button", {}, "Trocar time");
    swap.onclick = () => {
      this.switchCoach(team.side === "home" ? "away" : "home");
      this.selected = null;
      this.render();
    };
    head.append(title, swap);
    this.root.append(head);

    // ---- origem da tática (preset pesquisado x customizada) + debug ----
    const t = team.tactics;
    const srcLabel = t.source === "REAL_CURRENT_RESEARCH" ? "Tática real pesquisada"
      : t.source === "USER_CUSTOM" ? "Customizada por você" : "Preset padrão";
    const info = el("div", { class: "pcard" });
    info.append(
      el("div", {}, `📋 ${srcLabel}`),
      el("div", { class: "muted" }, `Formação ${t.formation} · Posse ${t.possession} · Saída ${t.buildOut}`),
      el("div", { class: "muted" }, `Bola longa ${Math.round(t.longBallFreq * 100)}% · Passe progressivo ${Math.round(t.progressivePassBias * 100)}%`),
    );
    this.root.append(info);

    this.buildCollective(team.tactics);
    this.buildPlayers(team);
  }

  // ---------------- TÁTICA COLETIVA ----------------
  private buildCollective(t: TeamTactics) {
    this.root.append(el("h4", {}, "Sistema coletivo"));

    // formação
    this.root.append(
      this.selectRow<string>(
        "Formação",
        FORMATION_KEYS.map((k) => [k, k]),
        () => t.formation,
        (v) => this.changeFormation(v),
      ),
    );
    this.root.append(
      this.selectRow<Mentality>(
        "Mentalidade",
        [["defensive", "Defensiva"], ["balanced", "Equilibrada"], ["attacking", "Ofensiva"], ["all-out", "Ataque total"]],
        () => t.mentality,
        (v) => (t.mentality = v),
      ),
      this.selectRow<PossessionStyle>(
        "Estilo de posse",
        [["short", "Posse curta"], ["direct", "Jogo direto"], ["counter", "Contra-ataque"], ["long", "Bola longa"], ["fast", "Transição rápida"]],
        () => t.possession,
        (v) => (t.possession = v),
      ),
      this.selectRow<AttackFocus>(
        "Foco de ataque",
        [["balanced", "Equilibrado"], ["left", "Esquerda"], ["right", "Direita"], ["center", "Centro"]],
        () => t.attackFocus,
        (v) => (t.attackFocus = v),
      ),
      this.selectRow<"short" | "long">(
        "Saída de bola",
        [["short", "Curta"], ["long", "Longa"]],
        () => t.buildOut,
        (v) => (t.buildOut = v),
      ),
      this.selectRow<MarkingType>(
        "Marcação",
        [["zonal", "Por zona"], ["man", "Individual"], ["hybrid", "Híbrida"]],
        () => t.marking,
        (v) => (t.marking = v),
      ),
      this.selectRow<TeamTactics["pressTrigger"]>(
        "Gatilho de pressão",
        [["always", "Sempre (alta)"], ["mid", "Meio-campo"], ["low", "Bloco baixo"]],
        () => t.pressTrigger,
        (v) => (t.pressTrigger = v),
      ),
      this.selectRow<OnLoss>(
        "Ao perder a bola",
        [["recover", "Recompor"], ["counterpress", "Pressão imediata"], ["foul", "Falta tática"]],
        () => t.onLoss,
        (v) => (t.onLoss = v),
      ),
      this.selectRow<OnRecovery>(
        "Ao recuperar",
        [["keep", "Manter posse"], ["accelerate", "Acelerar"], ["direct", "Lançar direto"]],
        () => t.onRecovery,
        (v) => (t.onRecovery = v),
      ),
    );

    this.root.append(
      this.sliderRow("Altura da linha", () => t.lineHeight, (v) => (t.lineHeight = v)),
      this.sliderRow("Intensidade de pressão", () => t.pressIntensity, (v) => (t.pressIntensity = v)),
      this.sliderRow("Compactação", () => t.compactness, (v) => (t.compactness = v)),
      this.sliderRow("Largura ofensiva", () => t.attackWidth, (v) => (t.attackWidth = v)),
      this.sliderRow("Largura defensiva", () => t.defenseWidth, (v) => (t.defenseWidth = v)),
      this.sliderRow("Ritmo de jogo", () => t.tempo, (v) => (t.tempo = v)),
      this.sliderRow("Agressividade", () => t.aggression, (v) => (t.aggression = v)),
      this.sliderRow("Liberdade criativa", () => t.creativeFreedom, (v) => (t.creativeFreedom = v)),
    );

    // linha de impedimento
    const off = el("div", { class: "row" });
    const cb = el("input", { type: "checkbox" }) as HTMLInputElement;
    cb.checked = t.offsideTrap;
    cb.onchange = () => (t.offsideTrap = cb.checked);
    this.syncFns.push(() => (cb.checked = t.offsideTrap));
    off.append(el("label", {}, "Linha de impedimento"), cb);
    this.root.append(off);
  }

  private changeFormation(key: string) {
    const team = this.getCoached();
    team.tactics.formation = key;
    const slots = FORMATIONS[key];
    team.players.forEach((p, i) => {
      p.slot = slots[i];
      p.role = slots[i].role;
    });
    this.render();
  }

  // ---------------- JOGADORES / INSTRUÇÕES INDIVIDUAIS ----------------
  private buildPlayers(team: Team) {
    this.root.append(el("h4", {}, "Jogadores"));
    const list = el("div", { class: "players" });
    for (const p of team.players) {
      const row = el("div", { class: "prow" + (p === this.selected ? " sel" : "") });
      row.append(
        el("span", { class: "num" }, String(p.shirt)),
        el("span", { class: "nm" }, `${p.name || p.role} ${this.instrSummary(p)}`),
        el("span", { class: "rl" }, `${p.role} · ${p.overall}`),
      );
      row.onclick = () => {
        this.selected = p === this.selected ? null : p;
        this.render();
      };
      list.append(row);
    }
    this.root.append(list);

    if (this.selected) this.buildInstructions(this.selected, team);
  }

  private instrSummary(p: Player): string {
    const i = p.instr;
    const flags: string[] = [];
    if (i.positioning === "get-forward") flags.push("↑");
    if (i.positioning === "stay-back") flags.push("↓");
    if (i.cutInside) flags.push("corta");
    if (i.stayWide) flags.push("abre");
    if (i.overlap) flags.push("ultrap.");
    if (i.attackDepth) flags.push("prof.");
    if (i.marking === "tight" || i.markTargetId) flags.push("marca");
    return flags.length ? `· ${flags.join(" ")}` : "";
  }

  private buildInstructions(p: Player, team: Team) {
    // ---- ficha do jogador (nome, overall, traits, ação, última decisão) ----
    this.root.append(el("h4", {}, `${p.name || "Jogador"} — #${p.shirt} ${p.role}`));
    const card = el("div", { class: "pcard" });
    card.append(
      el("div", {}, `Overall ${p.overall}  ·  ${team.name}  ·  ${p.preferredFoot === "Left" ? "Canhoto" : "Destro"}`),
      el("div", { class: "muted" }, p.isGK
        ? `Stamina ${Math.round(p.stamina * 100)}%  ·  GOL ${p.attr.goalkeeping} · Jogo de pés ${p.attr.passing} · Vel ${p.attr.pace}`
        : `Stamina ${Math.round(p.stamina * 100)}%  ·  Vel ${p.attr.pace} · Pas ${p.attr.passing} · Fin ${p.attr.finishing} · Drb ${p.attr.dribbling} · Mar ${p.attr.marking}`),
    );
    if (p.traits.length) {
      const tg = el("div", { class: "tags" });
      for (const tr of p.traits) tg.append(el("span", { class: "tag on" }, tr));
      card.append(tg);
    }
    card.append(
      el("div", { class: "muted" }, `Ação: ${p.action}`),
      el("div", { class: "muted" }, p.lastDecision ? `Última decisão: ${p.lastDecision.chosen} — ${p.lastDecision.reason}` : "Última decisão: —"),
    );
    this.root.append(card);
    this.root.append(el("h4", {}, "Instruções individuais"));

    this.root.append(
      this.selectRow<NonNullable<Player["instr"]["positioning"]>>(
        "Posição",
        [["stay-back", "Mais recuado"], ["balanced", "Equilibrado"], ["get-forward", "Mais avançado"]],
        () => p.instr.positioning ?? "balanced",
        (v) => (p.instr.positioning = v),
      ),
      this.selectRow<NonNullable<Player["instr"]["passRisk"]>>(
        "Risco de passe",
        [["safe", "Jogar simples"], ["normal", "Normal"], ["risky", "Arriscar mais"]],
        () => p.instr.passRisk ?? "normal",
        (v) => (p.instr.passRisk = v),
      ),
      this.selectRow<NonNullable<Player["instr"]["pressing"]>>(
        "Pressão individual",
        [["less", "Pressionar menos"], ["normal", "Normal"], ["more", "Pressionar mais"]],
        () => p.instr.pressing ?? "normal",
        (v) => (p.instr.pressing = v),
      ),
    );

    // marcar jogador específico
    const opp = team.side === "home" ? this.engine.away : this.engine.home;
    this.root.append(
      this.selectRow<string>(
        "Marcar jogador",
        [["", "—"], ...opp.outfield().map((o) => [o.id, `#${o.shirt} ${o.role}`] as [string, string])],
        () => p.instr.markTargetId ?? "",
        (v) => (p.instr.markTargetId = v || null),
      ),
    );

    // toggles
    const tags = el("div", { class: "tags" });
    const toggle = (label: string, get: () => boolean, set: (b: boolean) => void) => {
      const t = el("div", { class: "tag" + (get() ? " on" : "") }, label);
      t.onclick = () => {
        set(!get());
        t.classList.toggle("on", get());
        this.markEdited("instr:" + label);
      };
      tags.append(t);
    };
    const i = p.instr;
    toggle("Cortar p/ dentro", () => !!i.cutInside, (b) => (i.cutInside = b));
    toggle("Abrir na linha", () => !!i.stayWide, (b) => (i.stayWide = b));
    toggle("Ultrapassagem", () => !!i.overlap, (b) => (i.overlap = b));
    toggle("Atacar profundidade", () => !!i.attackDepth, (b) => (i.attackDepth = b));
    toggle("Entre linhas", () => !!i.betweenLines, (b) => (i.betweenLines = b));
    toggle("Segurar posição", () => !!i.holdPosition, (b) => (i.holdPosition = b));
    toggle("Proteger área", () => !!i.guardBox, (b) => (i.guardBox = b));
    toggle("Dar cobertura", () => !!i.giveCover, (b) => (i.giveCover = b));
    toggle("Marcar forte", () => i.marking === "tight", (b) => (i.marking = b ? "tight" : "none"));
    toggle("Chutar mais", () => !!i.shootMore, (b) => (i.shootMore = b));
    toggle("Cruzar mais", () => !!i.crossMore, (b) => (i.crossMore = b));
    toggle("Driblar mais", () => !!i.dribbleMore, (b) => (i.dribbleMore = b));
    this.root.append(tags);
    this.root.append(el("div", { class: "muted" }, "As mudanças valem imediatamente em campo."));
  }

  // ---------------- helpers de UI ----------------
  private sliderRow(label: string, get: () => number, set: (v: number) => void) {
    const row = el("div", { class: "row" });
    const input = el("input", { type: "range", min: "0", max: "100" }) as HTMLInputElement;
    const val = el("span", { class: "val" });
    const refresh = () => {
      input.value = String(Math.round(get() * 100));
      val.textContent = input.value;
    };
    input.oninput = () => {
      set(Number(input.value) / 100);
      val.textContent = input.value;
      this.markEdited(label);
    };
    refresh();
    this.syncFns.push(refresh);
    row.append(el("label", {}, label), input, val);
    return row;
  }

  /** Marca a tática como CUSTOMIZADA pelo usuário (sobrescreve o preset pesquisado). */
  private markEdited(field: string) {
    const t = this.getCoached().tactics;
    t.source = "USER_CUSTOM";
    t.overrides[field] = "USER_CUSTOM";
  }

  private selectRow<T extends string>(
    label: string,
    options: [T, string][],
    get: () => T,
    set: (v: T) => void,
  ) {
    const row = el("div", { class: "row" });
    const sel = el("select") as HTMLSelectElement;
    for (const [v, txt] of options) sel.append(el("option", { value: v }, txt));
    const refresh = () => (sel.value = get());
    sel.onchange = () => { set(sel.value as T); this.markEdited(label); };
    refresh();
    this.syncFns.push(refresh);
    row.append(el("label", {}, label), sel);
    return row;
  }
}
