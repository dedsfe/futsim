import type { TeamTactics } from "../domain/types";
import { defaultTactics } from "../tactics/defaults";
import { COMBINED_TACTICS } from "./combinedData";

/**
 * Perfil tático baseado em PESQUISA da forma real/atual de uma seleção.
 * Genérico: serve para qualquer time (Brasil, Argentina, França, Espanha...).
 * Números nunca são "no chute" — confidence indica o grau de certeza e
 * `sources` lista de onde a pesquisa veio (ver data/tactics-research.md).
 */
export interface ResearchedTacticalProfile {
  teamId: string;
  teamName: string;
  researchedAt: string;
  sources: string[];
  confidence: "low" | "medium" | "high";
  likelyFormation: string;
  alternativeFormations: string[];
  tacticalSummary: string;
  buildUpStyle: "short" | "balanced" | "direct";
  defensiveLineHeight: number; // 0..1
  pressingIntensity: number; // 0..1
  counterPressing: number; // 0..1
  directness: number; // 0..1
  longBallFrequency: number; // 0..1
  progressivePassBias: number; // 0..1
  possessionPatience: number; // 0..1 (alto = mais paciente)
  tempo: number; // 0..1
  width: number; // 0..1
  attackFocus: "left" | "right" | "center" | "balanced";
  transitionAttack: string;
  transitionDefense: string;
  playerRoles: Record<string, string>; // id do jogador → papel pesquisado
}

/** Brasil de Ancelotti (2025/26): compacto e organizado, controla o jogo, sai
 *  jogando e progride pelo MEIO com VELOCIDADE explorando espaço pelos pontas —
 *  vertical sem ser chutão. */
export const BrazilCurrentRealTactics: ResearchedTacticalProfile = {
  teamId: "brazil",
  teamName: "Brasil",
  researchedAt: "2026-06-14",
  sources: [
    "https://worldsoccertalk.com/world-cup/brazil-2026-world-cup-preview-squad-breakdown-key-player-and-tactical-analysis/",
    "https://tacticalfootballanalysis.com/carlo-ancelotti-tactics-brazil-2026-world-cup-tactical-analysis/",
    "https://totalfootballanalysis.com/data-analysis/carlo-ancelotti-brazil-data-analysis-statistics",
  ],
  confidence: "medium",
  likelyFormation: "4-3-3",
  alternativeFormations: ["4-2-3-1"],
  tacticalSummary:
    "Compacto e organizado sem bola; em posse move a bola rápido, minimiza toques e progride pelo meio para acessar os pontas no espaço. Vertical com critério (passe progressivo e ataque ao espaço), não chutão.",
  buildUpStyle: "balanced",
  defensiveLineHeight: 0.55,
  pressingIntensity: 0.58,
  counterPressing: 0.55,
  directness: 0.6,
  longBallFrequency: 0.32,
  progressivePassBias: 0.75,
  possessionPatience: 0.5,
  tempo: 0.72,
  width: 0.68,
  attackFocus: "balanced",
  transitionAttack: "acelerar e atacar o espaço pelos pontas",
  transitionDefense: "recompor compacto, pressão moderada na zona da bola",
  playerRoles: {
    "br-vini": "inverted_winger_runner",
    "br-rodrygo": "inverted_winger",
    "br-raphinha": "wide_forward_finisher",
    "br-bruno": "box_to_box_progressor",
    "br-carlos-augusto": "overlapping_fullback",
    "br-fabinho": "holding_mid",
  },
};

/** Argentina de Scaloni (2025/26): 4-3-3 que vira 4-4-2 sem bola, contra-pressão
 *  forte, jogo associativo/relacional e transições verticais pelo canal central. */
export const ArgentinaCurrentRealTactics: ResearchedTacticalProfile = {
  teamId: "argentina",
  teamName: "Argentina",
  researchedAt: "2026-06-14",
  sources: [
    "https://www.squawka.com/en/features/tactical-analysis-argentina-most-interesting-national-team-2026-world-cup/",
    "https://the-footballanalyst.com/argentina-lionel-scaloni-tactical-analysis/",
    "https://mbpschool.com/en/argentina-national-team-tactical-analysis/",
  ],
  confidence: "medium",
  likelyFormation: "4-3-3",
  alternativeFormations: ["4-4-2", "4-2-3-1"],
  tacticalSummary:
    "Posse e controle com jogo relacional (muita movimentação e liberdade). Sem bola vira 4-4-2 compacto com contra-pressão intensa. Domina as transições: após recuperar, ataca vertical priorizando o canal central.",
  buildUpStyle: "short",
  defensiveLineHeight: 0.52,
  pressingIntensity: 0.78,
  counterPressing: 0.82,
  directness: 0.5,
  longBallFrequency: 0.28,
  progressivePassBias: 0.7,
  possessionPatience: 0.66,
  tempo: 0.5,
  width: 0.58,
  attackFocus: "center",
  transitionAttack: "primeiro passe vertical, prioriza o meio",
  transitionDefense: "contra-pressão imediata, fecha linhas de passe",
  playerRoles: {
    "ar-messi": "free_playmaker",
    "ar-dybala": "advanced_playmaker",
    "ar-enzo": "deep_progressor",
    "ar-macallister": "box_to_box",
    "ar-paredes": "deep_playmaker",
    "ar-lautaro": "pressing_finisher",
    "ar-tagliafico": "supporting_fullback",
  },
};

/** França (Deschamps): bloco sólido e compacto, letal em transição com a
 *  velocidade de Mbappé/Dembélé; pragmático, ataca o espaço. */
export const FranceCurrentRealTactics: ResearchedTacticalProfile = {
  teamId: "france", teamName: "França", researchedAt: "2026-06-14",
  sources: ["https://www.fcratings.com/nations/france-18"], confidence: "medium",
  likelyFormation: "4-3-3", alternativeFormations: ["4-2-3-1"],
  tacticalSummary: "Defensivamente sólido e pragmático; explode em transição com a velocidade dos atacantes, atacando o espaço pelos lados.",
  buildUpStyle: "balanced", defensiveLineHeight: 0.5, pressingIntensity: 0.55, counterPressing: 0.5,
  directness: 0.64, longBallFrequency: 0.35, progressivePassBias: 0.68, possessionPatience: 0.5,
  tempo: 0.68, width: 0.62, attackFocus: "balanced",
  transitionAttack: "acelerar com os atacantes no espaço", transitionDefense: "recompor compacto",
  playerRoles: { "fr-mbappe": "inverted_winger_runner", "fr-dembele": "inverted_winger", "fr-olise": "inverted_winger", "fr-theo": "overlapping_fullback", "fr-tchouameni": "holding_mid" },
};

/** Inglaterra (Tuchel): controle de posse, pontas decisivos, jogo metódico. */
export const EnglandCurrentRealTactics: ResearchedTacticalProfile = {
  teamId: "england", teamName: "Inglaterra", researchedAt: "2026-06-14",
  sources: ["https://www.fcratings.com/nations/england-14"], confidence: "medium",
  likelyFormation: "4-3-3", alternativeFormations: ["4-2-3-1"],
  tacticalSummary: "Posse e controle, ameaça pelos lados (Saka/Foden) e qualidade no meio; metódica, paciente para criar.",
  buildUpStyle: "balanced", defensiveLineHeight: 0.52, pressingIntensity: 0.6, counterPressing: 0.55,
  directness: 0.5, longBallFrequency: 0.3, progressivePassBias: 0.7, possessionPatience: 0.62,
  tempo: 0.55, width: 0.62, attackFocus: "balanced",
  transitionAttack: "construir com critério pelos lados", transitionDefense: "bloco médio organizado",
  playerRoles: { "en-saka": "inverted_winger", "en-foden": "inverted_winger", "en-bellingham": "box_to_box_progressor", "en-rice": "holding_mid", "en-taa": "overlapping_fullback" },
};

/** Espanha (de la Fuente): tiki-taka, posse alta, pressão alta, falso 9. */
export const SpainCurrentRealTactics: ResearchedTacticalProfile = {
  teamId: "spain", teamName: "Espanha", researchedAt: "2026-06-14",
  sources: ["https://www.fcratings.com/nations/spain-45"], confidence: "medium",
  likelyFormation: "4-3-3", alternativeFormations: ["4-3-3"],
  tacticalSummary: "Posse de bola altíssima (tiki-taka), pressão alta para recuperar logo, amplitude pelos pontas e falso 9; triangulações no meio.",
  buildUpStyle: "short", defensiveLineHeight: 0.62, pressingIntensity: 0.82, counterPressing: 0.8,
  directness: 0.4, longBallFrequency: 0.18, progressivePassBias: 0.74, possessionPatience: 0.82,
  tempo: 0.46, width: 0.62, attackFocus: "balanced",
  transitionAttack: "manter a bola e atrair a pressão", transitionDefense: "contra-pressão imediata",
  playerRoles: { "es-yamal": "inverted_winger", "es-pedri": "deep_progressor", "es-rodri": "deep_playmaker", "es-ferran": "free_playmaker", "es-cucurella": "overlapping_fullback" },
};

/** Portugal (Roberto Martínez): posse criativa, técnica no meio, ofensiva. */
export const PortugalCurrentRealTactics: ResearchedTacticalProfile = {
  teamId: "portugal", teamName: "Portugal", researchedAt: "2026-06-14",
  sources: ["https://www.fcratings.com/nations/portugal-38"], confidence: "medium",
  likelyFormation: "4-3-3", alternativeFormations: ["4-2-3-1"],
  tacticalSummary: "Posse criativa com meio-campo técnico (Vitinha/Bruno/J. Neves), ofensiva, com Leão atacando o espaço pela esquerda.",
  buildUpStyle: "short", defensiveLineHeight: 0.55, pressingIntensity: 0.62, counterPressing: 0.6,
  directness: 0.56, longBallFrequency: 0.28, progressivePassBias: 0.72, possessionPatience: 0.62,
  tempo: 0.56, width: 0.6, attackFocus: "balanced",
  transitionAttack: "tabela rápida e bola no Leão", transitionDefense: "pressão na zona da bola",
  playerRoles: { "pt-leao": "inverted_winger_runner", "pt-bruno": "advanced_playmaker", "pt-vitinha": "deep_progressor", "pt-nunomendes": "overlapping_fullback" },
};

/** Registro genérico — adicione mais seleções aqui (Copa por partes). */
export const RESEARCHED_PROFILES: Record<string, ResearchedTacticalProfile> = {
  brazil: BrazilCurrentRealTactics,
  argentina: ArgentinaCurrentRealTactics,
  france: FranceCurrentRealTactics,
  england: EnglandCurrentRealTactics,
  spain: SpainCurrentRealTactics,
  portugal: PortugalCurrentRealTactics,
  ...COMBINED_TACTICS
};

/** Converte um perfil pesquisado nos parâmetros do motor (TeamTactics). */
export function applyResearchedProfile(p: ResearchedTacticalProfile): TeamTactics {
  const t = defaultTactics(p.likelyFormation);
  t.formation = p.likelyFormation;
  t.possession = p.buildUpStyle === "short" ? "short" : p.buildUpStyle === "direct" ? "direct" : "fast";
  t.buildOut = p.buildUpStyle === "direct" ? "long" : "short";
  t.lineHeight = p.defensiveLineHeight;
  t.pressIntensity = p.pressingIntensity;
  t.pressTrigger = p.pressingIntensity > 0.7 ? "always" : p.pressingIntensity > 0.45 ? "mid" : "low";
  t.tempo = p.tempo;
  t.attackWidth = p.width;
  t.defenseWidth = Math.max(0.25, p.width * 0.7);
  t.attackFocus = p.attackFocus;
  t.compactness = 0.55 + 0.25 * p.counterPressing;
  t.aggression = 0.4 + 0.4 * p.pressingIntensity;
  t.creativeFreedom = 0.5 + 0.3 * (1 - p.possessionPatience) * 0 + 0.3 * (p.teamId === "argentina" ? 1 : 0.6);
  t.mentality = p.directness > 0.62 ? "attacking" : "balanced";
  t.onLoss = p.counterPressing > 0.65 ? "counterpress" : "recover";
  t.onRecovery = p.directness > 0.55 ? (p.buildUpStyle === "short" ? "direct" : "accelerate") : "keep";
  t.longBallFreq = p.longBallFrequency;
  t.progressivePassBias = p.progressivePassBias;
  t.source = "REAL_CURRENT_RESEARCH";
  t.overrides = {};
  return t;
}
