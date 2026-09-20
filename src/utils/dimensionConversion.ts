import type { GamePoint } from '../types/map'
import { roundCoordinate } from './coordinates'

const NETHER_RATIO = 8

export function overworldToNetherCoordinate(value: number): number {
  return roundCoordinate(value / NETHER_RATIO)
}

export function netherToOverworldCoordinate(value: number): number {
  return roundCoordinate(value * NETHER_RATIO)
}

export function overworldToNetherPoint(point: GamePoint): GamePoint {
  return {
    x: overworldToNetherCoordinate(point.x),
    z: overworldToNetherCoordinate(point.z),
  }
}

export function netherToOverworldPoint(point: GamePoint): GamePoint {
  return {
    x: netherToOverworldCoordinate(point.x),
    z: netherToOverworldCoordinate(point.z),
  }
}

/**
 * True when a manually-entered overworld/nether pair doesn't match the 8x
 * conversion rule — the user's real portal link may not sit at the
 * auto-calculated spot, so callers should surface this as an FYI, not an error.
 */
export function coordinatesDivergeFromConversion(
  overworld: GamePoint,
  nether: GamePoint,
): boolean {
  const expected = overworldToNetherPoint(overworld)
  return expected.x !== nether.x || expected.z !== nether.z
}
