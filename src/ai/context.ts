import type { Ball } from "../domain/Ball";
import type { Player } from "../domain/Player";
import type { Team } from "../domain/Team";

/** Visão somente-leitura do estado da partida que a IA consome. */
export interface World {
  home: Team;
  away: Team;
  ball: Ball;
  timeSec: number;
  /** Time em posse (ou null se bola solta). */
  possession: "home" | "away" | null;
}

export const teamOf = (w: World, side: "home" | "away") =>
  side === "home" ? w.home : w.away;

export const oppTeam = (w: World, p: Player) =>
  p.side === "home" ? w.away : w.home;

export const ownTeam = (w: World, p: Player) =>
  p.side === "home" ? w.home : w.away;

export const opponentsOf = (w: World, p: Player) => oppTeam(w, p).players;

export const teammatesOf = (w: World, p: Player) =>
  ownTeam(w, p).players.filter((x) => x !== p);
