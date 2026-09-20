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
  createdAt: number
  updatedAt: number
}

/** Fields a user submits through the place form; the store fills in id/timestamps. */
export interface PlaceInput {
  name: string
  overworld: GamePoint | null
  nether: GamePoint | null
  y: number | null
  description: string
}
