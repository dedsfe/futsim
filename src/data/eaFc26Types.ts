/**
 * Camada de dados de jogadores REAIS (EA SPORTS FC 26), separada do motor.
 * IMPORTANTE: uso apenas para TESTE LOCAL/PESSOAL. Não usar nomes/escudos/marcas
 * reais em build pública sem licença — trocar por dados fictícios/licenciados.
 */

export type PlayerRatingSource = "EA_FC_26_OFFICIAL" | "EA_FC_26_IMPORTED" | "MANUAL_TEST";

/** Bloco de atributos de goleiro do EA (pode vir ausente). */
export interface EaGoalkeeping {
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  speed?: number;
  positioning?: number;
}

/** Dados crus de um jogador real. Campos ausentes ficam undefined (missing). */
export interface RealPlayerData {
  id: string;
  realName: string;
  displayName: string;
  nationality: "Brazil" | "Argentina";
  club?: string;
  position: string; // posição EA (ex.: "ST", "LW", "CB", "GK", "RB")
  alternatePositions?: string[];
  overall: number; // overall EA FC 26 (NÃO inventar — só real ou marcado MANUAL_TEST)
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  goalkeeping?: EaGoalkeeping;
  preferredFoot?: "Left" | "Right";
  source: PlayerRatingSource;
  sourceUrl?: string;
  lastUpdated: string; // ISO date
  /** Observação interna (ex.: "overall a confirmar"). */
  note?: string;
}

export interface NationalSquadFile {
  nation: "Brazil" | "Argentina";
  displayName: string;
  colors: { primary: string; secondary: string };
  formation: string;
  source: string;
  players: RealPlayerData[];
}
