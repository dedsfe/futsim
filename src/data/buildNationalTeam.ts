import { Player } from "../domain/Player";
import { Team } from "../domain/Team";
import type { FormationSlot, RoleId, TeamSide, TeamTactics } from "../domain/types";
import { FORMATIONS } from "../tactics/formations";
import type { NationalSquadFile, RealPlayerData } from "./eaFc26Types";
import { mapEaFc26PlayerToSimulationPlayer, mapPosition } from "./mapEaFc26";
import { applyResearchedProfile, RESEARCHED_PROFILES, ResearchedTacticalProfile } from "./researchedTactics";
import squadsBA from "../../data/ea-fc-26/manual-brazil-argentina-test.json";
import squadsB1 from "../../data/ea-fc-26/squads-batch1.json";
import { COMBINED_SQUADS } from "./combinedData";

/** Registro de todas as seleções disponíveis (cresce a cada leva). */
const ALL_SQUADS: Record<string, NationalSquadFile> = {
  brazil: (squadsBA as any).brazil,
  argentina: (squadsBA as any).argentina,
  france: (squadsB1 as any).france,
  england: (squadsB1 as any).england,
  spain: (squadsB1 as any).spain,
  portugal: (squadsB1 as any).portugal,
  ...COMBINED_SQUADS
};

/**
 * Funções compatíveis por slot, em ordem de preferência. Inclui um nível de
 * fallback DEFENSIVO para nunca encaixar atacante em vaga de zaga quando a
 * seleção não tem um 2º zagueiro nos dados.
 */
const COMPAT: Record<RoleId, RoleId[]> = {
  GK: ["GK"],
  CB: ["CB", "FB", "DM"], // fallback: lateral antes do volante (não puxa o ancora)
  FB: ["FB", "WM", "CB", "DM"],
  DM: ["DM", "CM", "CB"],
  CM: ["CM", "DM", "AM", "WM"],
  AM: ["AM", "CM", "WG", "WM"],
  WM: ["WM", "WG", "FB", "AM"],
  WG: ["WG", "WM", "AM", "ST"],
  ST: ["ST", "WG", "AM"],
};

/** Escolhe os 11 titulares: melhor overall por slot, respeitando compatibilidade. */
function pickXI(pool: RealPlayerData[], formation: string): { slot: FormationSlot; real: RealPlayerData }[] {
  let slots = FORMATIONS[formation];
  if (!slots) {
    console.warn(`Formação desconhecida: ${formation}, usando 4-3-3 como fallback`);
    slots = FORMATIONS["4-3-3"];
  }
  const used = new Set<string>();
  const out: { slot: FormationSlot; real: RealPlayerData }[] = [];
  for (const slot of slots) {
    const compat = COMPAT[slot.role];
    let best: RealPlayerData | null = null;
    let bestScore = -Infinity;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      // considera posição principal E alternativas; usa a melhor compatibilidade
      const roles = [mapPosition(p.position), ...(p.alternatePositions ?? []).map(mapPosition)];
      let ci = Infinity;
      for (const r of roles) { const idx = compat.indexOf(r); if (idx >= 0) ci = Math.min(ci, idx); }
      if (ci === Infinity) continue;
      const score = p.overall - ci * 6; // pune FORTE jogar fora da posição natural
      if (score > bestScore) { bestScore = score; best = p; }
    }
    if (!best) {
      const gks = pool.filter((p) => p.position === "GK");
      const gk = gks.sort((a, b) => b.overall - a.overall)[0];
      const bestFallback = pool.filter((p) => !used.has(p.id)).sort((a, b) => b.overall - a.overall)[0];
      best = gk ?? bestFallback;
    }
    if (best) {
      used.add(best.id);
      out.push({ slot, real: best });
    }
  }
  return out;
}

/** Instruções individuais derivadas das traits (a tática individual aparece em campo). */
function instructionsFromTraits(p: Player) {
  const i = p.instr;
  const has = (t: Parameters<Player["hasTrait"]>[0]) => p.hasTrait(t);
  const wide = p.role === "WG" || p.role === "WM";
  if (wide && (has("INVERTED_WINGER") || has("INSIDE_FORWARD") || has("LEFT_FOOTED_CREATOR"))) i.cutInside = true;
  if ((p.role === "FB" || p.role === "WM") && has("ATTACKING_FULLBACK")) i.overlap = true;
  if (has("ATTACKS_DEPTH") || has("DIRECT_RUNNER") || has("LATE_RUNNER") ||
    (has("SPEEDSTER") && (p.role === "WG" || p.role === "ST"))) i.attackDepth = true;
  if (has("LONG_SHOT_TAKER") || has("BOX_FINISHER") || has("POACHER")) i.shootMore = true;
  if (has("PRESSING_FORWARD") || has("PRESSING_WINGER") || has("PRESSING_MIDFIELDER")) i.pressing = "more";
  if (has("PLAYMAKER") || has("CREATIVE_PASSER") || has("RISKY_PASSER")) i.passRisk = "risky";
  if (has("BETWEEN_LINES")) i.betweenLines = true;
  if (has("DEEP_PLAYMAKER")) { i.positioning = "stay-back"; i.passRisk = "risky"; }
  if (has("CREATIVE_CROSSER")) i.crossMore = true;
  if (has("DRIBBLER") || has("BALL_CARRIER")) i.dribbleMore = true;
  if (p.role === "CB" && has("BALL_PLAYING_DEFENDER")) i.passRisk = "normal";
}

/** Aplica o papel PESQUISADO do jogador (profile.playerRoles) sobre as instruções. */
function applyResearchedRole(p: Player, roleKey: string) {
  const i = p.instr;
  switch (roleKey) {
    case "inverted_winger": i.cutInside = true; break;
    case "inverted_winger_runner": i.cutInside = true; i.attackDepth = true; break;
    case "wide_forward_finisher": i.shootMore = true; break;
    case "overlapping_fullback": i.overlap = true; break;
    case "supporting_fullback": i.positioning = "balanced"; break;
    case "holding_mid": i.positioning = "stay-back"; i.guardBox = true; break;
    case "deep_playmaker": i.positioning = "stay-back"; i.passRisk = "risky"; break;
    case "deep_progressor": i.passRisk = "risky"; break;
    case "advanced_playmaker": case "free_playmaker": i.betweenLines = true; i.passRisk = "risky"; break;
    case "box_to_box": case "box_to_box_progressor": i.positioning = "get-forward"; break;
    case "pressing_finisher": i.pressing = "more"; i.attackDepth = true; break;
  }
}

function buildTeam(side: TeamSide, file: NationalSquadFile, tactics: TeamTactics, profile?: ResearchedTacticalProfile): Team {
  const color = file.colors.primary;
  const team = new Team(side, file.displayName, color, tactics);
  team.secondaryColor = file.colors.secondary;
  const xi = pickXI(file.players, tactics.formation);
  xi.forEach(({ slot, real }, i) => {
    const m = mapEaFc26PlayerToSimulationPlayer(real);
    const p = new Player(real.id, team, i === 0 ? 1 : i + 1, slot.role, slot, m.attr, {});
    p.name = m.displayName;
    p.overall = m.overall;
    p.traits = m.traits;
    p.preferredFoot = m.preferredFoot;
    instructionsFromTraits(p);
    const rk = profile?.playerRoles[real.id];
    if (rk) applyResearchedRole(p, rk);
    p.pos = team.slotToField(slot);
    p.target = p.pos.clone();
    team.players.push(p);
  });
  return team;
}

/** Seleções jogáveis: têm elenco (overalls reais) E perfil tático pesquisado. */
export const AVAILABLE_NATIONS: { id: string; name: string }[] = Object.keys(RESEARCHED_PROFILES)
  .filter((id) => ALL_SQUADS[id])
  .map((id) => ({ id, name: ALL_SQUADS[id].displayName }));

/** Monta uma seleção (por id) já com a tática real pesquisada como ponto de partida. */
export function buildNation(id: string, side: TeamSide): Team {
  const profile = RESEARCHED_PROFILES[id];
  const file = ALL_SQUADS[id];
  if (!profile || !file) throw new Error(`Seleção desconhecida: ${id}`);
  return buildTeam(side, file, applyResearchedProfile(profile), profile);
}

/** Atalho do modo Copa: Brasil × Argentina. */
export function buildCopaTeams(): { home: Team; away: Team } {
  return { home: buildNation("brazil", "home"), away: buildNation("argentina", "away") };
}
