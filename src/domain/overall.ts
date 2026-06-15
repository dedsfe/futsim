import { clamp } from "../core/Vector2";
import type { Attributes, RoleId } from "./types";

/**
 * Pesos de overall por função (Parte 3). Cada função valoriza atributos
 * diferentes — atacante valoriza finalização/movimentação, zagueiro valoriza
 * marcação/desarme/força, goleiro valoriza defesa, etc.
 */
const WEIGHTS: Record<RoleId, Partial<Record<keyof Attributes, number>>> = {
  GK: { goalkeeping: 6, positioning: 2, decision: 1, strength: 1 },
  CB: { marking: 3, tackling: 3, positioning: 2, strength: 2, decision: 1.5, pace: 1, passing: 0.5 },
  FB: { pace: 2, marking: 2, tackling: 2, stamina: 2, crossing: 1.5, passing: 1, positioning: 1 },
  DM: { tackling: 2.5, marking: 2, positioning: 2, passing: 2, vision: 1.5, decision: 1.5, stamina: 1.5 },
  CM: { passing: 2.5, vision: 2.5, decision: 2, control: 1.5, stamina: 1.5, dribbling: 1 },
  AM: { passing: 2.5, vision: 2.5, dribbling: 2, control: 2, finishing: 1.5, decision: 1.5 },
  WM: { pace: 2, crossing: 2, dribbling: 1.5, stamina: 1.5, passing: 1, finishing: 1 },
  WG: { pace: 3, dribbling: 3, finishing: 2, crossing: 1.5, control: 1.5, decision: 1 },
  ST: { finishing: 3.5, shooting: 2, positioning: 2, decision: 1.5, strength: 1.5, pace: 1.5, control: 1 },
};

/** Overall 1..99 calculado a partir dos atributos, com pesos da função. */
export function calculateOverall(attr: Attributes, role: RoleId): number {
  const w = WEIGHTS[role];
  let sum = 0;
  let wsum = 0;
  for (const k in w) {
    const key = k as keyof Attributes;
    sum += attr[key] * (w[key] as number);
    wsum += w[key] as number;
  }
  return Math.round(clamp(sum / Math.max(wsum, 1), 1, 99));
}

/** Quão adequado o jogador é a uma função (0..99). */
export function calculateRoleSuitability(attr: Attributes, role: RoleId): number {
  return calculateOverall(attr, role);
}

/** Atributos efetivos no contexto atual (aplica fadiga). */
export function getPlayerEffectiveAttributes(attr: Attributes, stamina: number): Attributes {
  const f = clamp(0.8 + 0.2 * stamina, 0.8, 1);
  const out = { ...attr };
  (Object.keys(out) as (keyof Attributes)[]).forEach((k) => {
    out[k] = Math.round(out[k] * f);
  });
  return out;
}
