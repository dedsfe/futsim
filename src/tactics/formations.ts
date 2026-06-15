import type { FormationSlot } from "../domain/types";

/**
 * Formações em coordenadas normalizadas (0..1) na ótica de um time atacando
 * para a DIREITA. x: 0 = própria linha de fundo, 1 = gol adversário.
 * y: 0 = lateral de cima, 1 = lateral de baixo.
 */
export const FORMATIONS: Record<string, FormationSlot[]> = {
  "4-4-2": [
    { role: "GK", x: 0.05, y: 0.5 },
    { role: "FB", x: 0.22, y: 0.15 },
    { role: "CB", x: 0.2, y: 0.38 },
    { role: "CB", x: 0.2, y: 0.62 },
    { role: "FB", x: 0.22, y: 0.85 },
    { role: "WM", x: 0.48, y: 0.12 },
    { role: "CM", x: 0.45, y: 0.4 },
    { role: "CM", x: 0.45, y: 0.6 },
    { role: "WM", x: 0.48, y: 0.88 },
    { role: "ST", x: 0.72, y: 0.42 },
    { role: "ST", x: 0.72, y: 0.58 },
  ],
  "4-3-3": [
    { role: "GK", x: 0.05, y: 0.5 },
    { role: "FB", x: 0.22, y: 0.15 },
    { role: "CB", x: 0.2, y: 0.38 },
    { role: "CB", x: 0.2, y: 0.62 },
    { role: "FB", x: 0.22, y: 0.85 },
    { role: "DM", x: 0.4, y: 0.5 },
    { role: "CM", x: 0.5, y: 0.32 },
    { role: "CM", x: 0.5, y: 0.68 },
    { role: "WG", x: 0.74, y: 0.16 },
    { role: "ST", x: 0.78, y: 0.5 },
    { role: "WG", x: 0.74, y: 0.84 },
  ],
  "4-2-3-1": [
    { role: "GK", x: 0.05, y: 0.5 },
    { role: "FB", x: 0.22, y: 0.15 },
    { role: "CB", x: 0.2, y: 0.38 },
    { role: "CB", x: 0.2, y: 0.62 },
    { role: "FB", x: 0.22, y: 0.85 },
    { role: "DM", x: 0.38, y: 0.4 },
    { role: "DM", x: 0.38, y: 0.6 },
    { role: "WM", x: 0.6, y: 0.16 },
    { role: "AM", x: 0.58, y: 0.5 },
    { role: "WM", x: 0.6, y: 0.84 },
    { role: "ST", x: 0.78, y: 0.5 },
  ],
  "3-5-2": [
    { role: "GK", x: 0.05, y: 0.5 },
    { role: "CB", x: 0.2, y: 0.3 },
    { role: "CB", x: 0.18, y: 0.5 },
    { role: "CB", x: 0.2, y: 0.7 },
    { role: "WM", x: 0.45, y: 0.1 },
    { role: "CM", x: 0.45, y: 0.34 },
    { role: "DM", x: 0.4, y: 0.5 },
    { role: "CM", x: 0.45, y: 0.66 },
    { role: "WM", x: 0.45, y: 0.9 },
    { role: "ST", x: 0.74, y: 0.42 },
    { role: "ST", x: 0.74, y: 0.58 },
  ],
  "3-4-3": [
    { role: "GK", x: 0.05, y: 0.5 },
    { role: "CB", x: 0.2, y: 0.3 },
    { role: "CB", x: 0.18, y: 0.5 },
    { role: "CB", x: 0.2, y: 0.7 },
    { role: "WM", x: 0.46, y: 0.12 },
    { role: "CM", x: 0.46, y: 0.4 },
    { role: "CM", x: 0.46, y: 0.6 },
    { role: "WM", x: 0.46, y: 0.88 },
    { role: "WG", x: 0.74, y: 0.18 },
    { role: "ST", x: 0.78, y: 0.5 },
    { role: "WG", x: 0.74, y: 0.82 },
  ],
  "5-3-2": [
    { role: "GK", x: 0.05, y: 0.5 },
    { role: "FB", x: 0.24, y: 0.1 },
    { role: "CB", x: 0.2, y: 0.32 },
    { role: "CB", x: 0.18, y: 0.5 },
    { role: "CB", x: 0.2, y: 0.68 },
    { role: "FB", x: 0.24, y: 0.9 },
    { role: "CM", x: 0.46, y: 0.32 },
    { role: "DM", x: 0.42, y: 0.5 },
    { role: "CM", x: 0.46, y: 0.68 },
    { role: "ST", x: 0.72, y: 0.42 },
    { role: "ST", x: 0.72, y: 0.58 },
  ],
};

export const FORMATION_KEYS = Object.keys(FORMATIONS);
