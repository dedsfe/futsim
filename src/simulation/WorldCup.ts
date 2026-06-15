import { AVAILABLE_NATIONS, buildNation } from "../data/buildNationalTeam";

export interface TeamStats {
  id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface MatchResult {
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
}

export interface KnockoutMatch {
  id: string;
  homeId: string | null;
  awayId: string | null;
  homeScore: number;
  awayScore: number;
  played: boolean;
  homePens: number;
  awayPens: number;
  nextMatchId: string | null;
  nextSlot: "home" | "away";
}

export interface Group {
  letter: string;
  teams: string[]; // 4 ids
  standings: Record<string, TeamStats>;
  matches: MatchResult[];
}

export class WorldCup {
  groups: Group[] = [];
  roundOf32: string[] = []; // Os 32 classificados
  knockouts: Record<string, KnockoutMatch[]> = {
    r32: [], r16: [], qf: [], sf: [], final: []
  };
  currentStage: "groups" | "r32" | "r16" | "qf" | "sf" | "final" | "done" = "groups";
  userTeamId: string | null = null;

  constructor() {
    this.drawGroups();
  }

  private drawGroups() {
    // Pegamos exatamente 48 seleções
    const nations = [...AVAILABLE_NATIONS].map(n => ({ id: n.id, name: n.name }));
    
    // Embaralha
    for (let i = nations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nations[i], nations[j]] = [nations[j], nations[i]];
    }

    // Se houver menos de 48, preenchemos com os primeiros repetidos pra não quebrar (embora tenhamos 48+ na real)
    while (nations.length < 48) {
      nations.push(nations[nations.length % AVAILABLE_NATIONS.length]);
    }
    const selected = nations.slice(0, 48);

    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    for (let i = 0; i < 12; i++) {
      const groupTeams = selected.slice(i * 4, i * 4 + 4);
      const standings: Record<string, TeamStats> = {};
      for (const t of groupTeams) {
        standings[t.id] = { id: t.id, name: t.name, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      }

      // Rodadas: T1xT2, T3xT4 | T1xT3, T2xT4 | T1xT4, T2xT3
      const matches: MatchResult[] = [
        { homeId: groupTeams[0].id, awayId: groupTeams[1].id, homeScore: 0, awayScore: 0, played: false },
        { homeId: groupTeams[2].id, awayId: groupTeams[3].id, homeScore: 0, awayScore: 0, played: false },
        { homeId: groupTeams[0].id, awayId: groupTeams[2].id, homeScore: 0, awayScore: 0, played: false },
        { homeId: groupTeams[1].id, awayId: groupTeams[3].id, homeScore: 0, awayScore: 0, played: false },
        { homeId: groupTeams[0].id, awayId: groupTeams[3].id, homeScore: 0, awayScore: 0, played: false },
        { homeId: groupTeams[1].id, awayId: groupTeams[2].id, homeScore: 0, awayScore: 0, played: false },
      ];

      this.groups.push({ letter: letters[i], teams: groupTeams.map(t => t.id), standings, matches });
    }
  }

  // Permite trocar duas seleções de lugar (mesmo grupo ou grupos diferentes)
  swapTeams(gIdx1: number, tId1: string, gIdx2: number, tId2: string) {
    if (gIdx1 === gIdx2 && tId1 === tId2) return;
    
    const g1 = this.groups[gIdx1];
    const g2 = this.groups[gIdx2];

    // Troca na lista de teams
    const t1Index = g1.teams.indexOf(tId1);
    const t2Index = g2.teams.indexOf(tId2);
    if (t1Index === -1 || t2Index === -1) return;

    g1.teams[t1Index] = tId2;
    g2.teams[t2Index] = tId1;

    // Move os stats de um grupo pro outro
    const stats1 = g1.standings[tId1];
    const stats2 = g2.standings[tId2];

    delete g1.standings[tId1];
    delete g2.standings[tId2];

    g1.standings[tId2] = stats2;
    g2.standings[tId1] = stats1;

    // Atualiza o calendário de jogos para refletir a troca
    for (const m of g1.matches) {
      if (m.homeId === tId1) m.homeId = tId2;
      if (m.awayId === tId1) m.awayId = tId2;
    }
    for (const m of g2.matches) {
      if (m.homeId === tId2) m.homeId = tId1;
      if (m.awayId === tId2) m.awayId = tId1;
    }
  }

  // Retorna os times de um grupo ordenados por Pontos > Saldo > Gols Pró
  getGroupRanking(groupIdx: number): TeamStats[] {
    const g = this.groups[groupIdx];
    return Object.values(g.standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const sgA = a.goalsFor - a.goalsAgainst;
      const sgB = b.goalsFor - b.goalsAgainst;
      if (sgA !== sgB) return sgB - sgA;
      return b.goalsFor - a.goalsFor;
    });
  }

  // Simula uma partida AI vs AI usando distribuição de Poisson (estatística baseada no Overall)
  simulateMatchFast(homeId: string, awayId: string): { homeScore: number, awayScore: number } {
    try {
      const home = buildNation(homeId, "home");
      const away = buildNation(awayId, "away");

      const hOvr = home.players.reduce((acc, p) => acc + p.overall, 0) / home.players.length;
      const aOvr = away.players.reduce((acc, p) => acc + p.overall, 0) / away.players.length;

      const diff = hOvr - aOvr;
      
      // Média de gols (lambda). Ajustado para gerar resultados mais dinâmicos
      const lambdaH = Math.max(0.2, 1.3 + (diff * 0.12) + 0.1); // pequeno fator casa (arbitrário)
      const lambdaA = Math.max(0.2, 1.3 - (diff * 0.12));

      const poisson = (lambda: number) => {
        const L = Math.exp(-lambda);
        let p = 1.0;
        let k = 0;
        do {
          k++;
          p *= Math.random();
        } while (p > L);
        return k - 1;
      };

      return { homeScore: poisson(lambdaH), awayScore: poisson(lambdaA) };
    } catch (e) {
      console.error("Erro ao simular estatisticamente", homeId, awayId, e);
      return { homeScore: 0, awayScore: 0 };
    }
  }

  // Registra o resultado oficial de uma partida
  recordMatchResult(m: MatchResult, homeScore: number, awayScore: number) {
    m.homeScore = homeScore;
    m.awayScore = awayScore;
    m.played = true;

    // Acha o grupo
    for (const g of this.groups) {
      if (g.teams.includes(m.homeId)) {
        const h = g.standings[m.homeId];
        const a = g.standings[m.awayId];
        
        h.played++; a.played++;
        h.goalsFor += m.homeScore; h.goalsAgainst += m.awayScore;
        a.goalsFor += m.awayScore; a.goalsAgainst += m.homeScore;

        if (m.homeScore > m.awayScore) {
          h.won++; h.points += 3; a.lost++;
        } else if (m.homeScore < m.awayScore) {
          a.won++; a.points += 3; h.lost++;
        } else {
          h.drawn++; a.drawn++; h.points += 1; a.points += 1;
        }
        break;
      }
    }
  }

  // Avança no calendário até achar um jogo do usuário ou acabar a fase
  // Retorna o MatchResult do jogo do usuário se achar, ou null se não achar nada
  advanceToNextUserMatch(): MatchResult | KnockoutMatch | null {
    if (this.currentStage === "groups") {
      for (let round = 0; round < 6; round++) {
        for (const g of this.groups) {
          const m = g.matches[round];
          if (!m.played) {
            if (m.homeId === this.userTeamId || m.awayId === this.userTeamId) return m;
            const res = this.simulateMatchFast(m.homeId, m.awayId);
            this.recordMatchResult(m, res.homeScore, res.awayScore);
          }
        }
      }
      this.advanceToKnockouts();
      this.currentStage = "r32";
      return this.advanceToNextUserMatch();
    }

    if (this.currentStage === "done") return null;

    // Mata-mata
    const roundMatches = this.knockouts[this.currentStage];
    for (const m of roundMatches) {
      if (!m.played && m.homeId && m.awayId) {
        if (m.homeId === this.userTeamId || m.awayId === this.userTeamId) return m;
        const res = this.simulateMatchFast(m.homeId, m.awayId);
        let hPens = 0, aPens = 0;
        if (res.homeScore === res.awayScore) {
           hPens = Math.floor(Math.random() * 2) + 4; // 4 ou 5
           aPens = Math.floor(Math.random() * 2) + 3; // 3 ou 4
           if (hPens === aPens) hPens++;
        }
        this.recordKnockoutResult(m, res.homeScore, res.awayScore, hPens, aPens);
      }
    }

    // Avança a fase
    if (this.currentStage === "r32") this.currentStage = "r16";
    else if (this.currentStage === "r16") this.currentStage = "qf";
    else if (this.currentStage === "qf") this.currentStage = "sf";
    else if (this.currentStage === "sf") this.currentStage = "final";
    else if (this.currentStage === "final") { this.currentStage = "done"; return null; }

    return this.advanceToNextUserMatch();
  }

  recordKnockoutResult(m: KnockoutMatch, homeScore: number, awayScore: number, homePens: number, awayPens: number) {
    m.homeScore = homeScore; m.awayScore = awayScore;
    m.homePens = homePens; m.awayPens = awayPens;
    m.played = true;

    const winnerId = (homeScore > awayScore || homePens > awayPens) ? m.homeId : m.awayId;
    if (m.nextMatchId && winnerId) {
      const nextStageMatches = this.knockouts[m.nextMatchId.split("-")[0]];
      const nextMatch = nextStageMatches?.find(x => x.id === m.nextMatchId);
      if (nextMatch) {
        if (m.nextSlot === "home") nextMatch.homeId = winnerId;
        else nextMatch.awayId = winnerId;
      }
    }
  }

  // Determina os 32 classificados e monta o chaveamento R32
  advanceToKnockouts() {
    const firsts: TeamStats[] = [];
    const seconds: TeamStats[] = [];
    const thirds: TeamStats[] = [];

    for (let i = 0; i < 12; i++) {
      const rank = this.getGroupRanking(i);
      firsts.push(rank[0]);
      seconds.push(rank[1]);
      thirds.push(rank[2]);
    }

    thirds.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const sgA = a.goalsFor - a.goalsAgainst;
      const sgB = b.goalsFor - b.goalsAgainst;
      if (sgA !== sgB) return sgB - sgA;
      return b.goalsFor - a.goalsFor;
    });

    const bestThirds = thirds.slice(0, 8);
    const qualified = [...firsts, ...seconds, ...bestThirds].map(t => t.id);
    
    // Embaralha para o sorteio (Simplificação para evitar o grid complexo da FIFA)
    qualified.sort(() => Math.random() - 0.5);

    for(let i=0; i<16; i++) {
      this.knockouts.r32.push({
        id: `r32-${i}`,
        homeId: qualified[i*2], awayId: qualified[i*2+1],
        homeScore: 0, awayScore: 0, homePens: 0, awayPens: 0, played: false,
        nextMatchId: `r16-${Math.floor(i/2)}`,
        nextSlot: i % 2 === 0 ? "home" : "away"
      });
    }

    const emptyMatch = (id: string, nextMatchId: string|null, nextSlot: "home"|"away"): KnockoutMatch => 
      ({ id, homeId: null, awayId: null, homeScore: 0, awayScore: 0, homePens: 0, awayPens: 0, played: false, nextMatchId, nextSlot });

    for(let i=0; i<8; i++) this.knockouts.r16.push(emptyMatch(`r16-${i}`, `qf-${Math.floor(i/2)}`, i%2===0?"home":"away"));
    for(let i=0; i<4; i++) this.knockouts.qf.push(emptyMatch(`qf-${i}`, `sf-${Math.floor(i/2)}`, i%2===0?"home":"away"));
    for(let i=0; i<2; i++) this.knockouts.sf.push(emptyMatch(`sf-${i}`, `final-0`, i%2===0?"home":"away"));
    this.knockouts.final.push(emptyMatch(`final-0`, null, "home"));
  }
}
