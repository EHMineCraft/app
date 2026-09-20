import type { GamePoint } from '../types/map'
import { roundCoordinate } from './coordinates'

export interface PlaceFormValues {
  name: string
  overworldX: string
  overworldZ: string
  netherX: string
  netherZ: string
  y: string
  description: string
}

export interface PlaceFormErrors {
  name?: string
  overworld?: string
  nether?: string
  y?: string
  coordinates?: string
}

export interface PlaceFormResult {
  valid: boolean
  errors: PlaceFormErrors
  data?: {
    name: string
    overworld: GamePoint | null
    nether: GamePoint | null
    y: number | null
    description: string
  }
}

type CoordinateFieldParse =
  | { kind: 'empty' }
  | { kind: 'value'; value: number }
  | { kind: 'invalid' }

function parseCoordinateField(raw: string): CoordinateFieldParse {
  const trimmed = raw.trim()
  if (trimmed === '') return { kind: 'empty' }
  const num = Number(trimmed)
  if (!Number.isFinite(num)) return { kind: 'invalid' }
  return { kind: 'value', value: roundCoordinate(num) }
}

function validateCoordinatePair(
  xRaw: string,
  zRaw: string,
): { value: GamePoint | null; error: string | null } {
  const x = parseCoordinateField(xRaw)
  const z = parseCoordinateField(zRaw)

  if (x.kind === 'empty' && z.kind === 'empty') {
    return { value: null, error: null }
  }
  if (x.kind === 'invalid' || z.kind === 'invalid') {
    return { value: null, error: 'X, Z 좌표는 숫자로 입력해주세요.' }
  }
  if (x.kind === 'empty' || z.kind === 'empty') {
    return { value: null, error: 'X, Z 좌표를 모두 입력해주세요.' }
  }
  return { value: { x: x.value, z: z.value }, error: null }
}

/** Returns a point only when both fields are present and valid — used for live UI checks, not validation. */
export function tryParseCoordinatePoint(
  xRaw: string,
  zRaw: string,
): GamePoint | null {
  const x = parseCoordinateField(xRaw)
  const z = parseCoordinateField(zRaw)
  if (x.kind === 'value' && z.kind === 'value') return { x: x.value, z: z.value }
  return null
}

export function validatePlaceForm(values: PlaceFormValues): PlaceFormResult {
  const errors: PlaceFormErrors = {}

  const name = values.name.trim()
  if (!name) {
    errors.name = '장소 이름을 입력해주세요.'
  }

  const overworld = validateCoordinatePair(values.overworldX, values.overworldZ)
  if (overworld.error) errors.overworld = overworld.error

  const nether = validateCoordinatePair(values.netherX, values.netherZ)
  if (nether.error) errors.nether = nether.error

  if (!overworld.error && !nether.error && !overworld.value && !nether.value) {
    errors.coordinates = '오버월드 또는 네더 좌표 중 하나는 반드시 입력해야 합니다.'
  }

  const yField = parseCoordinateField(values.y)
  let y: number | null = null
  if (yField.kind === 'invalid') {
    errors.y = 'Y 좌표는 숫자로 입력해주세요.'
  } else if (yField.kind === 'value') {
    y = yField.value
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors,
    data: {
      name,
      overworld: overworld.value,
      nether: nether.value,
      y,
      description: values.description,
    },
  }
}
