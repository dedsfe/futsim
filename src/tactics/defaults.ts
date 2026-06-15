import type { TeamTactics } from "../domain/types";

export function defaultTactics(formation = "4-3-3"): TeamTactics {
  return {
    formation,
    mentality: "balanced",
    possession: "short",
    attackWidth: 0.6,
    defenseWidth: 0.45,
    lineHeight: 0.5,
    pressIntensity: 0.5,
    pressTrigger: "mid",
    compactness: 0.55,
    tempo: 0.55,
    aggression: 0.5,
    attackFocus: "balanced",
    buildOut: "short",
    marking: "zonal",
    offsideTrap: false,
    creativeFreedom: 0.5,
    playersForward: 3,
    playersProtecting: 2,
    onLoss: "recover",
    onRecovery: "keep",
    longBallFreq: 0.4,
    progressivePassBias: 0.55,
    source: "DEFAULT_GAME_PRESET",
    overrides: {},
  };
}

/** Botões da barra rápida durante a partida (Parte 3). */
export const QUICK_COMMANDS: Record<string, (t: TeamTactics) => void> = {
  Pressionar: (t) => {
    t.pressIntensity = 0.92;
    t.pressTrigger = "always";
    t.lineHeight = Math.max(t.lineHeight, 0.72);
    t.compactness = 0.7;
    t.aggression = 0.75;
  },
  Recuar: (t) => {
    t.pressIntensity = 0.25;
    t.pressTrigger = "low";
    t.lineHeight = 0.25;
    t.mentality = "defensive";
    t.compactness = 0.7;
  },
  "Ataque Total": (t) => {
    t.mentality = "all-out";
    t.playersForward = 5;
    t.playersProtecting = 1;
    t.lineHeight = Math.max(t.lineHeight, 0.7);
    t.tempo = 0.8;
  },
  "Manter Posse": (t) => {
    t.possession = "short";
    t.tempo = 0.35;
    t.creativeFreedom = 0.35;
    t.buildOut = "short";
  },
  "Contra-Atacar": (t) => {
    t.possession = "counter";
    t.onRecovery = "accelerate";
    t.lineHeight = 0.38;
    t.tempo = 0.7;
  },
  "Bola Longa": (t) => {
    t.possession = "long";
    t.buildOut = "long";
  },
  "Explorar Direita": (t) => {
    t.attackFocus = "right";
  },
  "Explorar Esquerda": (t) => {
    t.attackFocus = "left";
  },
  "Fechar Meio": (t) => {
    t.attackFocus = "center";
    t.defenseWidth = 0.25;
    t.compactness = 0.8;
  },
  "Marcação Alta": (t) => {
    t.lineHeight = 0.8;
    t.offsideTrap = true;
    t.pressTrigger = "always";
    t.pressIntensity = Math.max(t.pressIntensity, 0.7);
  },
  "Marcação Baixa": (t) => {
    t.lineHeight = 0.22;
    t.offsideTrap = false;
    t.pressTrigger = "low";
    t.pressIntensity = 0.35;
  },
};

/** Conversões úteis usadas pela IA/posicionamento. */
export const mentalityBias: Record<TeamTactics["mentality"], number> = {
  defensive: 0.25,
  balanced: 0.5,
  attacking: 0.72,
  "all-out": 0.9,
};
