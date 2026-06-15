import { el, clear } from "./dom";
import { WorldCup } from "../simulation/WorldCup";

export class WorldCupMenu {
  public tournament: WorldCup;
  private editMode = false;
  private selectedSwap: { groupIdx: number, teamId: string } | null = null;

  constructor(
    private root: HTMLElement, 
    private onExit: () => void,
    private onPlayMatch: (homeId: string, awayId: string, onFinish: (h: number, a: number, hp: number, ap: number) => void, coachedSide: "home" | "away", isKnockout: boolean) => void
  ) {
    this.tournament = new WorldCup();
    this.render();
  }

  private render() {
    clear(this.root);
    this.root.className = "world-cup-menu";

    const header = el("div", { class: "wc-header" });
    const titleText = this.editMode ? "AJUSTE MANUAL DE GRUPOS" : "COPA DO MUNDO 2026";
    
    // Team selector
    const allTeams = [...this.tournament.groups.flatMap(g => g.teams)].sort((a,b) => {
      const g1 = this.tournament.groups.find(g => g.teams.includes(a))?.standings[a].name || "";
      const g2 = this.tournament.groups.find(g => g.teams.includes(b))?.standings[b].name || "";
      return g1.localeCompare(g2);
    });

    const selectEl = el("select", { class: "wc-select" });
    selectEl.style.marginRight = "1rem";
    selectEl.style.padding = "0.5rem";
    selectEl.style.background = "#1e1e2f";
    selectEl.style.color = "white";
    selectEl.style.borderRadius = "4px";
    selectEl.append(el("option", { value: "" }, "-- Escolha sua Seleção --"));
    for (const t of allTeams) {
      const name = this.tournament.groups.find(g => g.teams.includes(t))?.standings[t].name || t;
      const opt = el("option", { value: t }, name);
      if (this.tournament.userTeamId === t) opt.selected = true;
      selectEl.append(opt);
    }
    selectEl.onchange = () => { this.tournament.userTeamId = selectEl.value; };

    header.append(
      el("div", {}, el("h1", {}, titleText), this.tournament.currentStage === "done" ? "" : selectEl),
      el("div", { class: "wc-controls" },
        (!this.editMode && this.tournament.currentStage !== "done")
          ? this.makeBtn("Avançar Torneio", () => this.advanceTournament())
          : "",
        this.tournament.currentStage === "groups" && !this.editMode
          ? this.makeBtn("Sortear Novamente", () => this.reshuffleGroups())
          : "",
        this.tournament.currentStage === "groups"
          ? this.makeBtn(this.editMode ? "Salvar Ajustes" : "Ajustar Grupos", () => this.toggleEditMode())
          : "",
        this.makeBtn("Voltar", this.onExit)
      )
    );

    const content = el("div", { class: "wc-content" });

    if (this.tournament.currentStage === "groups") {
      this.renderGroups(content);
    } else {
      this.renderKnockouts(content);
    }

    this.root.append(header, content);
  }

  private renderGroups(container: HTMLElement) {
    const grid = el("div", { class: "groups-grid" });
    for (let i = 0; i < 12; i++) {
      grid.append(this.renderGroup(i));
    }
    container.append(grid);
  }

  private renderGroup(index: number) {
    const g = this.tournament.groups[index];
    const rank = this.tournament.getGroupRanking(index);

    const card = el("div", { class: "group-card" });
    card.append(el("h3", {}, `Grupo ${g.letter}`));

    const table = el("table", { class: "group-table" });
    table.innerHTML = `
      <tr>
        <th>Seleção</th>
        <th>P</th>
        <th>J</th>
        <th>V</th>
        <th>E</th>
        <th>D</th>
        <th>SG</th>
      </tr>
    `;

    for (const t of rank) {
      const row = el("tr");
      
      const isSelected = this.selectedSwap?.teamId === t.id;
      if (this.editMode) {
        row.style.cursor = "pointer";
        row.style.transition = "background 0.2s";
        if (isSelected) row.style.background = "#3730a3";
        row.onclick = () => this.handleTeamClick(index, t.id);
        row.onmouseover = () => { if (!isSelected) row.style.background = "#2a2a3a"; };
        row.onmouseout = () => { if (!isSelected) row.style.background = "transparent"; };
      }

      row.innerHTML = `
        <td style="text-align:left; font-weight:bold;">${t.name}</td>
        <td>${t.points}</td>
        <td>${t.played}</td>
        <td>${t.won}</td>
        <td>${t.drawn}</td>
        <td>${t.lost}</td>
        <td>${t.goalsFor - t.goalsAgainst}</td>
      `;
      table.append(row);
    }
    card.append(table);
    return card;
  }

  private advanceTournament() {
    if (!this.tournament.userTeamId) {
      alert("Selecione sua seleção primeiro na caixa ao lado do título!");
      return;
    }
    const matchToPlay = this.tournament.advanceToNextUserMatch();
    if (matchToPlay) {
      // User match!
      this.root.style.display = "none";
      const coachedSide = matchToPlay.homeId === this.tournament.userTeamId ? "home" : "away";
      const isKnockout = "nextMatchId" in matchToPlay;

      this.onPlayMatch(matchToPlay.homeId!, matchToPlay.awayId!, (hScore, aScore, hPens, aPens) => {
        if (isKnockout) {
           this.tournament.recordKnockoutResult(matchToPlay, hScore, aScore, hPens, aPens);
        } else {
           this.tournament.recordMatchResult(matchToPlay, hScore, aScore);
        }
        this.root.style.display = "flex";
        this.render();
      }, coachedSide, isKnockout);
    } else {
      this.render(); // Fase acabou
    }
  }

  private handleTeamClick(groupIdx: number, teamId: string) {
    if (!this.editMode) return;
    if (!this.selectedSwap) {
      this.selectedSwap = { groupIdx, teamId };
      this.render();
    } else {
      // Realiza a troca (swap) no backend (WorldCup.ts) e renderiza de novo
      this.tournament.swapTeams(this.selectedSwap.groupIdx, this.selectedSwap.teamId, groupIdx, teamId);
      this.selectedSwap = null;
      this.render();
    }
  }

  private renderKnockouts(container: HTMLElement) {
    const stages = ["r32", "r16", "qf", "sf", "final"];
    const titles = ["16-Avos", "Oitavas", "Quartas", "Semifinal", "Final"];
    
    const bracketEl = el("div", { class: "wc-bracket" });
    
    stages.forEach((stage, idx) => {
       const col = el("div", { class: "wc-bracket-col" });
       col.append(el("h3", { class: "wc-bracket-title" }, titles[idx]));
       
       const matches = this.tournament.knockouts[stage as keyof typeof this.tournament.knockouts];
       for (const m of matches) {
          const matchEl = el("div", { class: "wc-bracket-match" });
          
          if (!m.played && (m.homeId === this.tournament.userTeamId || m.awayId === this.tournament.userTeamId)) {
             matchEl.classList.add("wc-bracket-match-highlight");
          }

          const getName = (id: string | null) => {
             if (!id) return "---";
             for (const g of this.tournament.groups) {
                if (g.standings[id]) return g.standings[id].name;
             }
             return id;
          };

          const homeNation = getName(m.homeId);
          const awayNation = getName(m.awayId);
          
          const homeScore = m.played ? m.homeScore.toString() : "-";
          const awayScore = m.played ? m.awayScore.toString() : "-";

          let penText = "";
          if (m.played && m.homeScore === m.awayScore) {
             penText = ` (Pên: ${m.homePens}x${m.awayPens})`;
          }

          matchEl.append(
             el("div", { class: `wc-bracket-team ${m.played && (m.homeScore > m.awayScore || m.homePens > m.awayPens) ? 'wc-winner' : ''}` }, 
                el("span", {}, homeNation),
                el("strong", {}, homeScore)
             ),
             el("div", { class: `wc-bracket-team ${m.played && (m.awayScore > m.homeScore || m.awayPens > m.homePens) ? 'wc-winner' : ''}` }, 
                el("span", {}, awayNation),
                el("strong", {}, awayScore)
             )
          );
          if (penText) {
             matchEl.append(el("div", { class: "wc-bracket-pens" }, penText));
          }

          col.append(matchEl);
       }
       bracketEl.append(col);
    });
    
    container.append(bracketEl);
  }

  private reshuffleGroups() {
    this.tournament = new WorldCup();
    this.render();
  }

  private toggleEditMode() {
    this.editMode = !this.editMode;
    this.selectedSwap = null;
    this.render();
  }

  private makeBtn(label: string, onClick: () => void) {
    if (!label) return "";
    const btn = el("button", { class: "wc-btn" }, label);
    btn.onclick = onClick;
    return btn;
  }
}
