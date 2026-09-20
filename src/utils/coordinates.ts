/**
 * Rounds half away from zero (12.5 -> 13, -12.5 -> -13), unlike JS's
 * built-in Math.round which rounds -12.5 to -12. Chosen so the rule reads
 * the same for negative and positive coordinates, which are both common
 * in Minecraft.
 */
export function roundCoordinate(n: number): number {
  return Math.sign(n) * Math.round(Math.abs(n))
}
