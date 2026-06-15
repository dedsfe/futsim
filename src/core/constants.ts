/**
 * Geometria do campo em METROS (padrão FIFA ~105x68). Toda a simulação opera
 * em metros; a renderização converte para pixels. Origem (0,0) = canto
 * superior-esquerdo. Eixo X = comprimento, eixo Y = largura.
 */
export const FIELD = {
  W: 105,
  H: 68,
  GOAL_WIDTH: 7.32,
  GOAL_DEPTH: 2.0,
  PENALTY_DEPTH: 16.5,
  PENALTY_WIDTH: 40.32,
  SIX_DEPTH: 5.5,
  SIX_WIDTH: 18.32,
  CENTER_CIRCLE_R: 9.15,
  MARGIN: 4, // faixa fora das linhas onde a bola/jogador ainda existe
} as const;

export const GOAL_Y = { top: FIELD.H / 2 - FIELD.GOAL_WIDTH / 2, bottom: FIELD.H / 2 + FIELD.GOAL_WIDTH / 2 };

/** Posições dos dois gols (centro da linha de fundo). */
export const GOAL_LEFT = { x: 0, y: FIELD.H / 2 };
export const GOAL_RIGHT = { x: FIELD.W, y: FIELD.H / 2 };

export const PLAYER = {
  RADIUS: 0.45,
  CONTROL_RADIUS: 1.1, // alcance para dominar bola solta
  TACKLE_RADIUS: 1.4, // alcance para tentar desarme
  DRIBBLE_OFFSET: 0.9, // distância da bola à frente do condutor
  MAX_SPEED_MIN: 4.2, // m/s para atributo 0
  MAX_SPEED_MAX: 8.6, // m/s para atributo 100
  ACCEL_MIN: 8,
  ACCEL_MAX: 22,
} as const;

export const BALL = {
  RADIUS: 0.22,
  FRICTION_DECEL: 6.5, // desaceleração no solo (m/s^2)
  MAX_PASS_SPEED: 26,
  MAX_SHOT_SPEED: 34,
  CAPTURE_SPEED: 14, // acima disso fica mais difícil dominar
} as const;

export const MATCH = {
  /** 1 minuto real = X minutos de jogo. 90 min em ~3 min reais por padrão. */
  HALF_MINUTES: 45,
  TIME_SCALE: 30, // segundos de jogo por segundo real
  KICKOFF_PAUSE: 1.2, // segundos reais parado após gol/início
} as const;

export const SIM = {
  FIXED_DT: 1 / 60, // passo fixo da física
  DECISION_INTERVAL: 0.12, // s entre reavaliações de decisão do portador
} as const;
