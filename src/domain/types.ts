/** Tipos compartilhados do domínio. Sem dependência de render. */

export type TeamSide = "home" | "away";

/** Estilos/tendências individuais que influenciam pequenas decisões. */
export type Trait =
  | "FINALIZER"
  | "PLAYMAKER"
  | "SPEEDSTER"
  | "DRIBBLER"
  | "INVERTED_WINGER"
  | "TARGET_FORWARD"
  | "BOX_TO_BOX"
  | "DEFENSIVE_ANCHOR"
  | "BALL_PLAYING_DEFENDER"
  | "ATTACKING_FULLBACK"
  | "SWEEPER_KEEPER"
  | "TRADITIONAL_KEEPER"
  | "PRESSING_FORWARD"
  | "LONG_SHOT_TAKER"
  | "CREATIVE_PASSER"
  // ---- personalizadas (craques) ----
  | "ATTACKS_DEPTH"
  | "INSIDE_FORWARD"
  | "BETWEEN_LINES"
  | "DEEP_PLAYMAKER"
  | "POSITIONAL_MASTER"
  | "PRESS_RESISTANT"
  | "SHORT_PASS_SPECIALIST"
  | "LEFT_FOOTED_CREATOR"
  | "FREE_ROLE"
  | "PRESSING_WINGER"
  | "PRESSING_MIDFIELDER"
  | "DIRECT_RUNNER"
  | "CREATIVE_CROSSER"
  | "BOX_FINISHER"
  | "POACHER"
  | "AERIAL_THREAT"
  | "RISKY_PASSER"
  | "LATE_RUNNER"
  | "BALL_CARRIER"
  | "BIG_GAME_PLAYER"
  | "COMPLETE_FORWARD"
  | "PLAYMAKING_FORWARD"
  | "PENALTY_SPECIALIST";

/** Atributos do jogador, todos 0..100 (Parte 2). */
export interface Attributes {
  pace: number; // velocidade
  acceleration: number; // aceleração
  passing: number; // passe
  shooting: number; // chute
  marking: number; // marcação
  tackling: number; // desarme
  dribbling: number; // drible
  vision: number; // visão de jogo
  positioning: number; // posicionamento
  stamina: number; // resistência
  decision: number; // decisão
  strength: number; // força física
  control: number; // controle de bola
  finishing: number; // finalização
  crossing: number; // cruzamento
  goalkeeping: number; // defesa (goleiro)
}

export type RoleId =
  | "GK"
  | "CB" // zagueiro central
  | "FB" // lateral
  | "DM" // volante
  | "CM" // meio-campo
  | "AM" // meia ofensivo
  | "WM" // meia/ponta de lado
  | "WG" // ponta
  | "ST"; // atacante

/** Posição-base normalizada na formação (0..1, na ótica do time atacando p/ direita). */
export interface FormationSlot {
  role: RoleId;
  x: number; // 0 = própria linha de fundo, 1 = gol adversário
  y: number; // 0 = lateral superior, 1 = lateral inferior
}

/** Instruções individuais (Parte 3). Tudo opcional; default = sem ajuste. */
export interface PlayerInstructions {
  positioning?: "stay-back" | "balanced" | "get-forward";
  cutInside?: boolean; // ponta corta para dentro
  stayWide?: boolean; // abrir na linha
  overlap?: boolean; // lateral/meia faz ultrapassagem
  marking?: "none" | "tight"; // pressionar mais o adversário
  markTargetId?: string | null; // marcar jogador específico
  betweenLines?: boolean; // procurar espaço entre linhas
  attackDepth?: boolean; // atacar profundidade
  holdPosition?: boolean; // segurar posição
  passRisk?: "safe" | "normal" | "risky"; // jogar simples / arriscar
  shootMore?: boolean;
  crossMore?: boolean;
  dribbleMore?: boolean;
  giveCover?: boolean; // dar cobertura
  pressing?: "less" | "normal" | "more";
  guardBox?: boolean; // proteger entrada da área
}

export type Mentality = "defensive" | "balanced" | "attacking" | "all-out";
export type PossessionStyle =
  | "short" // posse curta
  | "direct" // jogo direto
  | "counter" // contra-ataque
  | "long" // bola longa
  | "fast"; // transição rápida
export type AttackFocus = "left" | "right" | "center" | "balanced";
export type MarkingType = "zonal" | "man" | "hybrid";
export type OnLoss = "recover" | "counterpress" | "foul";
export type OnRecovery = "keep" | "accelerate" | "direct";

/** De onde veio cada parâmetro tático. */
export type TacticalPresetSource = "REAL_CURRENT_RESEARCH" | "USER_CUSTOM" | "DEFAULT_GAME_PRESET";

/** Tática coletiva (Parte 3). Mutável em tempo real pela interface. */
export interface TeamTactics {
  formation: string; // chave em formations.ts
  mentality: Mentality;
  possession: PossessionStyle;
  attackWidth: number; // 0..1
  defenseWidth: number; // 0..1 (compactação lateral na defesa)
  lineHeight: number; // 0..1 altura da linha defensiva
  pressIntensity: number; // 0..1
  pressTrigger: "always" | "mid" | "low"; // gatilho de pressão por zona
  compactness: number; // 0..1 (distância entre linhas)
  tempo: number; // 0..1 ritmo de jogo
  aggression: number; // 0..1
  attackFocus: AttackFocus;
  buildOut: "short" | "long"; // saída de bola
  marking: MarkingType;
  offsideTrap: boolean; // linha de impedimento
  creativeFreedom: number; // 0..1
  playersForward: number; // alvo de jogadores no ataque (informativo/peso)
  playersProtecting: number; // proteção a contra-ataque
  onLoss: OnLoss;
  onRecovery: OnRecovery;

  // ---- frequência de bola longa / passe progressivo (Parte 5) ----
  longBallFreq: number; // 0..1 — quão propenso a lançar/chutar longo
  progressivePassBias: number; // 0..1 — preferência por passe progressivo rasteiro

  // ---- origem dos parâmetros (preset pesquisado x edição do usuário) ----
  source: TacticalPresetSource;
  overrides: Partial<Record<string, TacticalPresetSource>>;
}
