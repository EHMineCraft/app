import type { CanvasSize, GamePoint, ScreenPoint, Viewport } from '../types/map'

export const MIN_SCALE = 0.05
export const MAX_SCALE = 8

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/**
 * Converts a game (X, Z) coordinate to a canvas pixel position for the given
 * viewport and canvas size. Z maps to screen-down, matching Minecraft's
 * in-game map convention (north/-Z is up, south/+Z is down).
 */
export function gameToScreen(
  point: GamePoint,
  viewport: Viewport,
  canvas: CanvasSize,
): ScreenPoint {
  return {
    x: canvas.width / 2 + (point.x - viewport.centerX) * viewport.scale,
    y: canvas.height / 2 + (point.z - viewport.centerZ) * viewport.scale,
  }
}

export function screenToGame(
  point: ScreenPoint,
  viewport: Viewport,
  canvas: CanvasSize,
): GamePoint {
  return {
    x: viewport.centerX + (point.x - canvas.width / 2) / viewport.scale,
    z: viewport.centerZ + (point.y - canvas.height / 2) / viewport.scale,
  }
}

/** Pans the viewport by a screen-space pixel delta (e.g. pointer movement while dragging). */
export function panViewport(
  viewport: Viewport,
  screenDelta: { dx: number; dy: number },
): Viewport {
  return {
    ...viewport,
    centerX: viewport.centerX - screenDelta.dx / viewport.scale,
    centerZ: viewport.centerZ - screenDelta.dy / viewport.scale,
  }
}

/**
 * Zooms the viewport by `factor` while keeping the game point currently under
 * `screenAnchor` fixed on screen, so the point the user is looking at doesn't jump.
 */
export function zoomViewportAt(
  viewport: Viewport,
  canvas: CanvasSize,
  screenAnchor: ScreenPoint,
  factor: number,
): Viewport {
  const newScale = clampScale(viewport.scale * factor)
  const anchorGame = screenToGame(screenAnchor, viewport, canvas)
  return {
    scale: newScale,
    centerX: anchorGame.x - (screenAnchor.x - canvas.width / 2) / newScale,
    centerZ: anchorGame.z - (screenAnchor.y - canvas.height / 2) / newScale,
  }
}

/** The "nice" grid step candidates, in game blocks. */
const GRID_STEPS = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000,
]

/**
 * Picks the smallest grid step whose on-screen spacing is still at least
 * `minPixelSpacing`, so grid lines stay readable at any zoom level.
 */
export function computeGridStep(scale: number, minPixelSpacing = 80): number {
  for (const step of GRID_STEPS) {
    if (step * scale >= minPixelSpacing) return step
  }
  return GRID_STEPS[GRID_STEPS.length - 1]
}

export function getVisibleGameBounds(viewport: Viewport, canvas: CanvasSize) {
  const halfWidth = canvas.width / 2 / viewport.scale
  const halfHeight = canvas.height / 2 / viewport.scale
  return {
    minX: viewport.centerX - halfWidth,
    maxX: viewport.centerX + halfWidth,
    minZ: viewport.centerZ - halfHeight,
    maxZ: viewport.centerZ + halfHeight,
  }
}

export function distance(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
