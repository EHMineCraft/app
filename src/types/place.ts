import type { GamePoint } from './map'

export interface Place {
  id: string
  worldId: string
  name: string
  categoryId: string | null
  overworld: GamePoint | null
  nether: GamePoint | null
  y: number | null
  description: string
  /** Exactly one place per world has this true — see usePlacesStore for the invariant. */
  isBaseCamp: boolean
  createdAt: number
  updatedAt: number
}

/**
 * Fields a user submits through the place form; the store fills in
 * id/timestamps. isBaseCamp is deliberately excluded — it's only changed
 * through the dedicated setBaseCamp store action, never via the regular form.
 */
export interface PlaceInput {
  name: string
  categoryId: string | null
  overworld: GamePoint | null
  nether: GamePoint | null
  y: number | null
  description: string
}
