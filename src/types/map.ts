/** A point in Minecraft world coordinates (X, Z plane — Y is not represented on the map). */
export interface GamePoint {
  x: number
  z: number
}

/** A point in canvas pixel space, origin at the canvas's top-left corner. */
export interface ScreenPoint {
  x: number
  y: number
}

export interface CanvasSize {
  width: number
  height: number
}

/** Map camera state: the game coordinate at the center of the viewport, and pixels-per-block zoom. */
export interface Viewport {
  centerX: number
  centerZ: number
  scale: number
}

/** A drawable point on the map canvas, projected from a place's coordinate for the active dimension. */
export interface MapMarker {
  id: string
  name: string
  x: number
  z: number
  color: string
  isBaseCamp: boolean
}
