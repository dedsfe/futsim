import { clamp, distPointToSegment, Vec2 } from "../core/Vector2";
import type { Player } from "../domain/Player";

export interface Near {
  player: Player | null;
  dist: number;
}

export function nearest(pos: Vec2, list: Player[], exclude?: Player): Near {
  let best: Player | null = null;
  let bd = Infinity;
  for (const p of list) {
    if (p === exclude) continue;
    const d = p.pos.dist(pos);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return { player: best, dist: bd };
}

/**
 * Pressão sobre um ponto (0..1). Soma a contribuição de adversários próximos
 * com decaimento — vários marcadores perto = pressão alta.
 */
export function pressureOn(pos: Vec2, opponents: Player[], radius = 9): number {
  let sum = 0;
  for (const o of opponents) {
    const d = o.pos.dist(pos);
    if (d < radius) sum += 1 - d / radius;
  }
  return clamp(sum, 0, 1);
}

/**
 * Quão limpa está a linha de passe de `from` a `to` (0 = bloqueada, 1 = livre).
 * Considera o adversário que mais se aproxima do segmento, ignorando quem está
 * praticamente em cima do destino (esse é "marcação", tratada à parte).
 */
export function laneClearness(
  from: Vec2,
  to: Vec2,
  opponents: Player[],
  channel = 2.2,
): number {
  let minClear = 1;
  for (const o of opponents) {
    // ignora adversário atrás do passador (não intercepta)
    const toOpp = o.pos.sub(from);
    const dir = to.sub(from);
    if (dir.len() < 0.1) continue;
    if (toOpp.dot(dir) < 0) continue;
    const d = distPointToSegment(o.pos, from, to);
    const clear = clamp(d / channel, 0, 1);
    if (clear < minClear) minClear = clear;
  }
  return minClear;
}

/**
 * Espaço livre numa direção a partir de `pos` (0..1 normalizado por `maxLook`).
 * Mede a distância até o adversário mais próximo dentro de um cone à frente.
 */
export function openSpace(
  pos: Vec2,
  dir: Vec2,
  opponents: Player[],
  maxLook = 14,
  coneDeg = 55,
): number {
  const d = dir.normalized();
  const cos = Math.cos((coneDeg * Math.PI) / 180);
  let nearestInCone = maxLook;
  for (const o of opponents) {
    const rel = o.pos.sub(pos);
    const dist = rel.len();
    if (dist < 0.1 || dist > maxLook) continue;
    if (rel.normalized().dot(d) < cos) continue;
    if (dist < nearestInCone) nearestInCone = dist;
  }
  return clamp(nearestInCone / maxLook, 0, 1);
}
