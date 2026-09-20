import { create } from 'zustand'
import type { CanvasSize, ScreenPoint, Viewport } from '../../../types/map'
import { panViewport, zoomViewportAt } from '../../../utils/mapProjection'

interface MapViewportState {
  viewport: Viewport
  pan: (screenDelta: { dx: number; dy: number }) => void
  zoomAt: (canvas: CanvasSize, screenAnchor: ScreenPoint, factor: number) => void
  setCenter: (center: { x: number; z: number }) => void
}

const INITIAL_VIEWPORT: Viewport = { centerX: 0, centerZ: 0, scale: 1 }

export const useMapViewportStore = create<MapViewportState>((set) => ({
  viewport: INITIAL_VIEWPORT,
  pan: (screenDelta) =>
    set((state) => ({ viewport: panViewport(state.viewport, screenDelta) })),
  zoomAt: (canvas, screenAnchor, factor) =>
    set((state) => ({
      viewport: zoomViewportAt(state.viewport, canvas, screenAnchor, factor),
    })),
  setCenter: (center) =>
    set((state) => ({
      viewport: { ...state.viewport, centerX: center.x, centerZ: center.z },
    })),
}))
