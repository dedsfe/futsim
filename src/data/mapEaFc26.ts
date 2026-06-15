import { clamp } from "../core/Vector2";
import { ROLE_BIAS } from "../domain/roster";
import type { Attributes, RoleId, Trait } from "../domain/types";
import type { RealPlayerData } from "./eaFc26Types";
import { FACE_STATS, GK_IDS } from "./faceStats";
import { COMBINED_KNOWN_TRAITS } from "./combinedData";

/** Posição EA → função interna (RoleId). */
export function mapPosition(pos: string): RoleId {
  const p = pos.toUpperCase();
  if (p === "GK") return "GK";
  if (p === "CB") return "CB";
  if (["RB", "LB", "RWB", "LWB"].includes(p)) return "FB";
  if (p === "CDM") return "DM";
  if (p === "CM") return "CM";
  if (p === "CAM") return "AM";
  if (["RM", "LM"].includes(p)) return "WM";
  if (["RW", "LW"].includes(p)) return "WG";
  return "ST";
}

const cl = (v: number) => clamp(Math.round(v), 20, 99);

/**
 * Traits PERSONALIZADAS dos craques das 6 seleções (não genérico por posição).
 * Alteram comportamento via instruções/decisões (ver buildNationalTeam/decisions).
 */
const KNOWN_TRAITS: Record<string, Trait[]> = {
  ...COMBINED_KNOWN_TRAITS,
  // Brasil
  "br-vini": ["SPEEDSTER", "DRIBBLER", "INVERTED_WINGER", "ATTACKS_DEPTH"],
  "br-raphinha": ["PRESSING_WINGER", "INVERTED_WINGER", "DIRECT_RUNNER", "CREATIVE_CROSSER"],
  "br-rodrygo": ["DRIBBLER", "INVERTED_WINGER", "ATTACKS_DEPTH"],
  "br-matheus-cunha": ["DRIBBLER", "CREATIVE_PASSER", "FREE_ROLE"],
  "br-bruno": ["BOX_TO_BOX", "DEEP_PLAYMAKER", "LONG_SHOT_TAKER"],
  "br-marquinhos": ["DEFENSIVE_ANCHOR", "BALL_PLAYING_DEFENDER", "POSITIONAL_MASTER"],
  "br-gabriel": ["BALL_PLAYING_DEFENDER", "AERIAL_THREAT"],
  "br-bremer": ["DEFENSIVE_ANCHOR", "AERIAL_THREAT"],
  "br-militao": ["DEFENSIVE_ANCHOR"],
  "br-fabinho": ["DEFENSIVE_ANCHOR"],
  "br-ederson-cm": ["DEEP_PLAYMAKER"],
  "br-antony": ["INVERTED_WINGER", "DRIBBLER"],
  "br-martinelli": ["SPEEDSTER", "DIRECT_RUNNER", "PRESSING_WINGER"],
  "br-carlos-augusto": ["ATTACKING_FULLBACK"],
  "br-alisson": ["SWEEPER_KEEPER"],
  // Argentina
  "ar-messi": ["PLAYMAKER", "CREATIVE_PASSER", "LONG_SHOT_TAKER", "BETWEEN_LINES", "FREE_ROLE"],
  "ar-lautaro": ["FINALIZER", "PRESSING_FORWARD", "COMPLETE_FORWARD"],
  "ar-julian": ["FINALIZER", "PRESSING_FORWARD", "BOX_TO_BOX"],
  "ar-dybala": ["PLAYMAKER", "LONG_SHOT_TAKER", "CREATIVE_PASSER", "LEFT_FOOTED_CREATOR"],
  "ar-enzo": ["DEEP_PLAYMAKER", "BOX_TO_BOX", "LONG_SHOT_TAKER"],
  "ar-macallister": ["BOX_TO_BOX", "CREATIVE_PASSER", "LATE_RUNNER"],
  "ar-depaul": ["BOX_TO_BOX", "PRESSING_MIDFIELDER"],
  "ar-paredes": ["DEEP_PLAYMAKER", "CREATIVE_PASSER"],
  "ar-dimaria": ["INVERTED_WINGER", "DRIBBLER", "CREATIVE_PASSER", "LEFT_FOOTED_CREATOR"],
  "ar-romero": ["DEFENSIVE_ANCHOR", "AERIAL_THREAT"],
  "ar-licha": ["BALL_PLAYING_DEFENDER", "DEFENSIVE_ANCHOR"],
  "ar-otamendi": ["DEFENSIVE_ANCHOR", "AERIAL_THREAT"],
  "ar-tagliafico": ["ATTACKING_FULLBACK"],
  "ar-molina": ["ATTACKING_FULLBACK"],
  "ar-emi": ["TRADITIONAL_KEEPER", "BIG_GAME_PLAYER"],
  // França
  "fr-mbappe": ["SPEEDSTER", "FINALIZER", "ATTACKS_DEPTH", "INSIDE_FORWARD"],
  "fr-dembele": ["SPEEDSTER", "DRIBBLER", "INVERTED_WINGER", "DIRECT_RUNNER"],
  "fr-olise": ["INVERTED_WINGER", "CREATIVE_PASSER", "DRIBBLER"],
  "fr-doue": ["DRIBBLER", "INSIDE_FORWARD"],
  "fr-barcola": ["SPEEDSTER", "DIRECT_RUNNER"],
  "fr-griezmann": ["PLAYMAKING_FORWARD", "CREATIVE_PASSER", "FREE_ROLE"],
  "fr-thuram": ["TARGET_FORWARD", "AERIAL_THREAT"],
  "fr-rabiot": ["BOX_TO_BOX", "LATE_RUNNER"],
  "fr-tchouameni": ["DEFENSIVE_ANCHOR", "DEEP_PLAYMAKER"],
  "fr-kante": ["DEFENSIVE_ANCHOR", "PRESS_RESISTANT", "BALL_CARRIER"],
  "fr-saliba": ["DEFENSIVE_ANCHOR", "POSITIONAL_MASTER"],
  "fr-upamecano": ["DEFENSIVE_ANCHOR", "AERIAL_THREAT"],
  "fr-konate": ["DEFENSIVE_ANCHOR"],
  "fr-kounde": ["ATTACKING_FULLBACK"],
  "fr-theo": ["ATTACKING_FULLBACK", "SPEEDSTER"],
  "fr-maignan": ["SWEEPER_KEEPER"],
  // Inglaterra
  "en-kane": ["COMPLETE_FORWARD", "PLAYMAKING_FORWARD", "FINALIZER", "PENALTY_SPECIALIST"],
  "en-bellingham": ["BOX_TO_BOX", "LATE_RUNNER", "BALL_CARRIER", "BIG_GAME_PLAYER"],
  "en-saka": ["INVERTED_WINGER", "DRIBBLER", "DIRECT_RUNNER"],
  "en-foden": ["INSIDE_FORWARD", "DRIBBLER", "CREATIVE_PASSER"],
  "en-palmer": ["CREATIVE_PASSER", "LONG_SHOT_TAKER", "PENALTY_SPECIALIST"],
  "en-rice": ["DEFENSIVE_ANCHOR", "BOX_TO_BOX", "PRESS_RESISTANT"],
  "en-maddison": ["CREATIVE_PASSER", "BETWEEN_LINES"],
  "en-taa": ["ATTACKING_FULLBACK", "CREATIVE_CROSSER", "CREATIVE_PASSER"],
  "en-james": ["ATTACKING_FULLBACK"],
  "en-konsa": ["DEFENSIVE_ANCHOR"],
  "en-guehi": ["DEFENSIVE_ANCHOR"],
  "en-bowen": ["DIRECT_RUNNER", "PRESSING_WINGER"],
  "en-watkins": ["SPEEDSTER", "ATTACKS_DEPTH"],
  "en-eze": ["DRIBBLER", "INSIDE_FORWARD"],
  // Espanha
  "es-yamal": ["DRIBBLER", "INVERTED_WINGER", "CREATIVE_PASSER", "LEFT_FOOTED_CREATOR"],
  "es-pedri": ["PLAYMAKER", "PRESS_RESISTANT", "SHORT_PASS_SPECIALIST", "BETWEEN_LINES"],
  "es-rodri": ["DEFENSIVE_ANCHOR", "DEEP_PLAYMAKER", "POSITIONAL_MASTER"],
  "es-fabian": ["DEEP_PLAYMAKER", "LONG_SHOT_TAKER"],
  "es-nico": ["SPEEDSTER", "DRIBBLER", "DIRECT_RUNNER"],
  "es-ferran": ["FINALIZER", "PRESSING_FORWARD"],
  "es-olmo": ["BETWEEN_LINES", "CREATIVE_PASSER", "LATE_RUNNER"],
  "es-merino": ["BOX_TO_BOX", "AERIAL_THREAT", "LATE_RUNNER"],
  "es-zubimendi": ["DEFENSIVE_ANCHOR", "DEEP_PLAYMAKER"],
  "es-cucurella": ["ATTACKING_FULLBACK"],
  "es-grimaldo": ["ATTACKING_FULLBACK", "CREATIVE_CROSSER", "LONG_SHOT_TAKER"],
  "es-llorente": ["SPEEDSTER", "BOX_TO_BOX"],
  "es-carvajal": ["ATTACKING_FULLBACK"],
  "es-inigo": ["DEFENSIVE_ANCHOR", "BALL_PLAYING_DEFENDER"],
  "es-simon": ["TRADITIONAL_KEEPER"],
  // Portugal
  "pt-ronaldo": ["FINALIZER", "BOX_FINISHER", "AERIAL_THREAT", "POACHER"],
  "pt-bruno": ["CREATIVE_PASSER", "LONG_SHOT_TAKER", "RISKY_PASSER", "PRESSING_MIDFIELDER"],
  "pt-vitinha": ["DEEP_PLAYMAKER", "PRESS_RESISTANT", "SHORT_PASS_SPECIALIST"],
  "pt-joaoneves": ["BOX_TO_BOX", "PRESS_RESISTANT", "BALL_CARRIER"],
  "pt-leao": ["SPEEDSTER", "DRIBBLER", "INVERTED_WINGER", "ATTACKS_DEPTH"],
  "pt-bernardo": ["DRIBBLER", "CREATIVE_PASSER", "PRESS_RESISTANT"],
  "pt-nunomendes": ["ATTACKING_FULLBACK", "SPEEDSTER"],
  "pt-cancelo": ["ATTACKING_FULLBACK", "CREATIVE_CROSSER"],
  "pt-dias": ["DEFENSIVE_ANCHOR", "POSITIONAL_MASTER", "AERIAL_THREAT"],
  "pt-rubenneves": ["DEEP_PLAYMAKER", "LONG_SHOT_TAKER"],
  "pt-palhinha": ["DEFENSIVE_ANCHOR", "PRESSING_MIDFIELDER"],
  "pt-neto": ["DIRECT_RUNNER", "DRIBBLER"],
  "pt-matheusnunes": ["BOX_TO_BOX", "BALL_CARRIER"],
  "pt-trincao": ["INSIDE_FORWARD", "CREATIVE_PASSER"],
};

const GENERIC_TRAIT: Record<RoleId, Trait> = {
  GK: "TRADITIONAL_KEEPER", CB: "DEFENSIVE_ANCHOR", FB: "ATTACKING_FULLBACK",
  DM: "DEFENSIVE_ANCHOR", CM: "BOX_TO_BOX", AM: "CREATIVE_PASSER",
  WM: "ATTACKING_FULLBACK", WG: "DRIBBLER", ST: "FINALIZER",
};

export function inferTraits(real: RealPlayerData, role: RoleId): Trait[] {
  return KNOWN_TRAITS[real.id] ?? [GENERIC_TRAIT[role]];
}

/**
 * Atributos internos a partir dos SUB-STATS REAIS (não do overall puro).
 * Goleiro usa stats de GOLEIRO e fica conservador no resto. Sem dado real,
 * usa fallback conservador por posição (nunca valores absurdos).
 */
function deriveAttributes(real: RealPlayerData, role: RoleId): Attributes {
  const ovr = real.overall;
  const fs = FACE_STATS[real.id];
  const out = {} as Attributes;

  if (role === "GK") {
    if (fs && GK_IDS.has(real.id)) {
      const [div, han, kic, ref, spd, pos] = fs;
      out.goalkeeping = cl((div + han + ref + pos) / 4);
      out.passing = cl(kic); out.crossing = cl(kic - 12);
      out.pace = cl(spd); out.acceleration = cl(spd - 4);
      out.positioning = cl(pos);
    } else {
      out.goalkeeping = cl(clamp(ovr, 40, 99)); // fallback: usa o overall real
      out.passing = cl(ovr - 16); out.crossing = cl(ovr - 28);
      out.pace = 52; out.acceleration = 50; out.positioning = cl(ovr - 4);
    }
    // GK NÃO tem atributos de jogador de linha (conservador/baixo)
    out.shooting = 22; out.finishing = 20; out.dribbling = 34;
    out.control = cl(out.passing - 8); out.vision = cl(out.passing - 6);
    out.marking = 24; out.tackling = 24; out.strength = 70; out.stamina = 58;
    out.decision = cl(clamp(ovr - 2, 40, 95));
    return out;
  }

  if (fs && !GK_IDS.has(real.id)) {
    const [pac, sho, pas, dri, def, phy] = fs;
    out.pace = cl(pac); out.acceleration = cl(pac - 3);
    out.shooting = cl(sho); out.finishing = cl(sho);
    out.passing = cl(pas); out.vision = cl(pas); out.crossing = cl(pas - 3);
    out.dribbling = cl(dri); out.control = cl(dri);
    out.marking = cl(def); out.tackling = cl(def);
    out.strength = cl(phy); out.stamina = cl(phy - 3);
    out.goalkeeping = cl(clamp(ovr - 45, 12, 45));
    // mentais: overall melhora consistência/decisão/posicionamento
    out.decision = cl(clamp(ovr - 3, 35, 96));
    out.positioning = cl(clamp(0.5 * ovr + 0.3 * def + 0.2 * pas, 35, 96));
    return out;
  }

  // ---- fallback conservador por posição (sem sub-stats reais) ----
  const bias = ROLE_BIAS[role];
  const base = Math.min(ovr, 80);
  const ATTRS: (keyof Attributes)[] = ["pace", "acceleration", "passing", "shooting", "marking", "tackling", "dribbling", "vision", "positioning", "stamina", "decision", "strength", "control", "finishing", "crossing", "goalkeeping"];
  for (const k of ATTRS) out[k] = cl(clamp(base + (bias[k] ?? 0), 28, 84));
  out.goalkeeping = cl(clamp(ovr - 45, 12, 45));
  out.decision = cl(clamp(ovr - 4, 35, 90));
  return out;
}

export interface MappedPlayer {
  attr: Attributes;
  overall: number;
  traits: Trait[];
  naturalRole: RoleId;
  displayName: string;
  preferredFoot: "Left" | "Right";
}

/** Converte um RealPlayerData (EA FC 26) nos dados do jogador da simulação. */
export function mapEaFc26PlayerToSimulationPlayer(real: RealPlayerData): MappedPlayer {
  const naturalRole = mapPosition(real.position);
  return {
    attr: deriveAttributes(real, naturalRole),
    overall: real.overall,
    traits: inferTraits(real, naturalRole),
    naturalRole,
    displayName: real.displayName,
    preferredFoot: real.preferredFoot ?? "Right",
  };
}
