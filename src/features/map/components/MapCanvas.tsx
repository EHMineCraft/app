import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CanvasSize,
  MapMarker,
  ScreenPoint,
  Viewport,
} from '../../../types/map'
import type { Dimension } from '../../../types/dimension'
import { DIMENSION_LABEL } from '../../../types/dimension'
import {
  computeGridStep,
  distance,
  gameToScreen,
  getVisibleGameBounds,
} from '../../../utils/mapProjection'
import { useMapViewportStore } from '../store/useMapViewportStore'

const MARKER_RADIUS = 6
const MARKER_HIT_RADIUS = 12
const CLICK_MOVE_THRESHOLD = 5
const WHEEL_ZOOM_FACTOR = 1.15
const BUTTON_ZOOM_FACTOR = 1.3

const BACKGROUND_COLOR: Record<Dimension, string> = {
  overworld: '#171717',
  nether: '#2a1414',
}

const GRID_COLOR: Record<Dimension, string> = {
  overworld: '#2a2a2a',
  nether: '#3d2020',
}

interface MapCanvasProps {
  markers: MapMarker[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  dimension: Dimension
  isLoading?: boolean
}

export function MapCanvas({
  markers,
  selectedId,
  onSelect,
  dimension,
  isLoading = false,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 0,
    height: 0,
  })

  const viewport = useMapViewportStore((s) => s.viewport)
  const pan = useMapViewportStore((s) => s.pan)
  const zoomAt = useMapViewportStore((s) => s.zoomAt)

  const dragRef = useRef<{
    lastX: number
    lastY: number
    moved: number
    pointerId: number
  } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setCanvasSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Zoom via wheel needs a non-passive native listener: React's onWheel is
  // registered passive by default, so e.preventDefault() there is ignored
  // and the page would scroll instead of zooming the map.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const anchor: ScreenPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      const factor = e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR
      zoomAt({ width: rect.width, height: rect.height }, anchor, factor)
    }
    canvas.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheelNative)
  }, [zoomAt])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    canvas.style.width = `${canvasSize.width}px`
    canvas.style.height = `${canvasSize.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMap(ctx, viewport, canvasSize, markers, selectedId, dimension)
  }, [viewport, canvasSize, markers, selectedId, dimension])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        lastX: e.clientX,
        lastY: e.clientY,
        moved: 0,
        pointerId: e.pointerId,
      }
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      const dx = e.clientX - drag.lastX
      const dy = e.clientY - drag.lastY
      drag.lastX = e.clientX
      drag.lastY = e.clientY
      drag.moved += Math.hypot(dx, dy)
      pan({ dx, dy })
    },
    [pan],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      dragRef.current = null
      if (!drag || drag.pointerId !== e.pointerId) return
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      if (drag.moved < CLICK_MOVE_THRESHOLD) {
        const rect = e.currentTarget.getBoundingClientRect()
        const clickPoint: ScreenPoint = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
        onSelect(
          hitTestMarker(clickPoint, markers, viewport, {
            width: rect.width,
            height: rect.height,
          }),
        )
      }
    },
    [viewport, markers, onSelect],
  )

  const handleZoomButton = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      zoomAt(
        { width: rect.width, height: rect.height },
        { x: rect.width / 2, y: rect.height / 2 },
        factor,
      )
    },
    [zoomAt],
  )

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-neutral-900"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 font-mono text-xs text-neutral-100">
        [{DIMENSION_LABEL[dimension]}] X: {Math.round(viewport.centerX)}, Z:{' '}
        {Math.round(viewport.centerZ)}
      </div>

      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded bg-black/60 px-3 py-2 text-sm text-neutral-300">
            불러오는 중...
          </p>
        </div>
      ) : (
        markers.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded bg-black/60 px-3 py-2 text-sm text-neutral-300">
              표시할 장소가 없습니다. 좌측 하단 + 버튼으로 추가해보세요.
            </p>
          </div>
        )
      )}

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          type="button"
          aria-label="확대"
          onClick={() => handleZoomButton(BUTTON_ZOOM_FACTOR)}
          className="h-8 w-8 rounded bg-black/60 text-lg leading-none text-neutral-100 hover:bg-black/80"
        >
          +
        </button>
        <button
          type="button"
          aria-label="축소"
          onClick={() => handleZoomButton(1 / BUTTON_ZOOM_FACTOR)}
          className="h-8 w-8 rounded bg-black/60 text-lg leading-none text-neutral-100 hover:bg-black/80"
        >
          −
        </button>
      </div>
    </div>
  )
}

function hitTestMarker(
  point: ScreenPoint,
  markers: MapMarker[],
  viewport: Viewport,
  canvas: CanvasSize,
): string | null {
  let closestId: string | null = null
  let closestDist = MARKER_HIT_RADIUS
  for (const marker of markers) {
    const screen = gameToScreen({ x: marker.x, z: marker.z }, viewport, canvas)
    const d = distance(point, screen)
    if (d <= closestDist) {
      closestDist = d
      closestId = marker.id
    }
  }
  return closestId
}

function drawMap(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  canvas: CanvasSize,
  markers: MapMarker[],
  selectedId: string | null,
  dimension: Dimension,
) {
  ctx.fillStyle = BACKGROUND_COLOR[dimension]
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawGrid(ctx, viewport, canvas, dimension)
  drawAxes(ctx, viewport, canvas)
  drawMarkers(ctx, viewport, canvas, markers, selectedId)
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  canvas: CanvasSize,
  dimension: Dimension,
) {
  const step = computeGridStep(viewport.scale)
  const bounds = getVisibleGameBounds(viewport, canvas)

  ctx.strokeStyle = GRID_COLOR[dimension]
  ctx.lineWidth = 1
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillStyle = '#6b7280'

  const firstX = Math.floor(bounds.minX / step) * step
  for (let x = firstX; x <= bounds.maxX; x += step) {
    const screen = gameToScreen({ x, z: 0 }, viewport, canvas)
    ctx.beginPath()
    ctx.moveTo(screen.x + 0.5, 0)
    ctx.lineTo(screen.x + 0.5, canvas.height)
    ctx.stroke()
    if (x !== 0) ctx.fillText(String(x), screen.x + 4, 12)
  }

  const firstZ = Math.floor(bounds.minZ / step) * step
  for (let z = firstZ; z <= bounds.maxZ; z += step) {
    const screen = gameToScreen({ x: 0, z }, viewport, canvas)
    ctx.beginPath()
    ctx.moveTo(0, screen.y + 0.5)
    ctx.lineTo(canvas.width, screen.y + 0.5)
    ctx.stroke()
    if (z !== 0) ctx.fillText(String(z), 4, screen.y - 4)
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  canvas: CanvasSize,
) {
  const origin = gameToScreen({ x: 0, z: 0 }, viewport, canvas)
  ctx.strokeStyle = '#525252'
  ctx.lineWidth = 1.5

  ctx.beginPath()
  ctx.moveTo(0, origin.y + 0.5)
  ctx.lineTo(canvas.width, origin.y + 0.5)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(origin.x + 0.5, 0)
  ctx.lineTo(origin.x + 0.5, canvas.height)
  ctx.stroke()
}

function drawMarkers(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  canvas: CanvasSize,
  markers: MapMarker[],
  selectedId: string | null,
) {
  for (const marker of markers) {
    const screen = gameToScreen({ x: marker.x, z: marker.z }, viewport, canvas)
    const isSelected = marker.id === selectedId
    const radius = marker.isBaseCamp ? MARKER_RADIUS + 2 : MARKER_RADIUS

    if (marker.isBaseCamp) {
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, radius + 3, 0, Math.PI * 2)
      ctx.strokeStyle = '#f5c518'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = marker.color
    ctx.fill()
    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(0,0,0,0.6)'
    ctx.lineWidth = isSelected ? 2.5 : 1.5
    ctx.stroke()

    ctx.fillStyle = '#e5e5e5'
    ctx.font = '12px ui-sans-serif, system-ui'
    const label = marker.isBaseCamp ? `🏠 ${marker.name}` : marker.name
    ctx.fillText(label, screen.x + radius + 4, screen.y + 4)
  }
}
