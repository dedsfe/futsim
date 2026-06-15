import { clamp } from "../core/Vector2";
import { Rng } from "../core/random";
import { FORMATIONS } from "../tactics/formations";
import { Player } from "./Player";
import { Team } from "./Team";
import { calculateOverall } from "./overall";
import type { Attributes, RoleId, TeamSide, TeamTactics } from "./types";

const A = (o: Partial<Attributes>): Partial<Attributes> => o;

/** Sobrenomes fictícios para times genéricos (pra mostrar nome, não a posição). */
const GENERIC_SURNAMES = [
  "Silva", "Souza", "Costa", "Lima", "Alves", "Rocha", "Dias", "Pinto", "Melo", "Castro", "Nunes",
  "Ramos", "Teixeira", "Moraes", "Barros", "Freitas", "Cardoso", "Gomes", "Pires", "Vieira", "Antunes", "Macedo",
];

/** Tendências por função (delta sobre a força base do time). */
export const ROLE_BIAS: Record<RoleId, Partial<Attributes>> = {
  GK: A({ goalkeeping: 18, positioning: 8, passing: -8, dribbling: -20, pace: -12 }),
  CB: A({ marking: 12, tackling: 12, strength: 12, positioning: 8, dribbling: -10, finishing: -14 }),
  FB: A({ pace: 8, crossing: 8, marking: 6, stamina: 8, finishing: -10 }),
  DM: A({ tackling: 10, marking: 8, passing: 6, vision: 6, positioning: 8, finishing: -8 }),
  CM: A({ passing: 10, vision: 10, stamina: 8, decision: 6 }),
  AM: A({ passing: 8, vision: 10, dribbling: 8, finishing: 6, marking: -10 }),
  WM: A({ pace: 8, crossing: 8, stamina: 8, dribbling: 6 }),
  WG: A({ pace: 12, dribbling: 12, crossing: 8, finishing: 6, marking: -12 }),
  ST: A({ finishing: 14, shooting: 12, pace: 8, strength: 6, marking: -16 }),
};

export const ATTR_KEYS: (keyof Attributes)[] = [
  "pace", "acceleration", "passing", "shooting", "marking", "tackling",
  "dribbling", "vision", "positioning", "stamina", "decision", "strength",
  "control", "finishing", "crossing", "goalkeeping",
];

function attrFor(role: RoleId, strength: number, rng: Rng): Attributes {
  const bias = ROLE_BIAS[role];
  const out = {} as Attributes;
  for (const k of ATTR_KEYS) {
    const delta = (bias[k] ?? 0) + rng.gauss() * 6;
    out[k] = Math.round(clamp(strength + delta, 25, 99));
  }
  if (role !== "GK") out.goalkeeping = Math.round(clamp(strength - 35, 15, 50));
  return out;
}

/** Monta um time completo a partir de uma formação e força média (0..100). */
export function buildTeam(
  side: TeamSide,
  name: string,
  color: string,
  tactics: TeamTactics,
  strength: number,
  seed: number,
): Team {
  const rng = new Rng(seed);
  const team = new Team(side, name, color, tactics);
  const slots = FORMATIONS[tactics.formation];
  slots.forEach((slot, i) => {
    const attr = attrFor(slot.role, strength, rng);
    const p = new Player(`${side}-${i}`, team, i === 0 ? 1 : i + 1, slot.role, slot, attr);
    p.name = GENERIC_SURNAMES[(side === "home" ? 0 : 11) + i] ?? GENERIC_SURNAMES[i % GENERIC_SURNAMES.length];
    p.overall = calculateOverall(attr, slot.role);
    p.pos = team.slotToField(slot);
    p.target = p.pos.clone();
    team.players.push(p);
  });
  return team;
}
