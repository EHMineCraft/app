import { create } from 'zustand'
import type { Place, PlaceInput } from '../../../types/place'

interface PlacesState {
  placesByWorld: Record<string, Place[]>
  addPlace: (worldId: string, input: PlaceInput) => Place
  updatePlace: (worldId: string, placeId: string, input: PlaceInput) => void
  removePlace: (worldId: string, placeId: string) => void
}

export const usePlacesStore = create<PlacesState>((set) => ({
  placesByWorld: {},

  addPlace: (worldId, input) => {
    const now = Date.now()
    const place: Place = {
      id: crypto.randomUUID(),
      worldId,
      categoryId: null,
      createdAt: now,
      updatedAt: now,
      ...input,
    }
    set((state) => ({
      placesByWorld: {
        ...state.placesByWorld,
        [worldId]: [...(state.placesByWorld[worldId] ?? []), place],
      },
    }))
    return place
  },

  updatePlace: (worldId, placeId, input) => {
    set((state) => ({
      placesByWorld: {
        ...state.placesByWorld,
        [worldId]: (state.placesByWorld[worldId] ?? []).map((place) =>
          place.id === placeId
            ? { ...place, ...input, updatedAt: Date.now() }
            : place,
        ),
      },
    }))
  },

  removePlace: (worldId, placeId) => {
    set((state) => ({
      placesByWorld: {
        ...state.placesByWorld,
        [worldId]: (state.placesByWorld[worldId] ?? []).filter(
          (place) => place.id !== placeId,
        ),
      },
    }))
  },
}))

const EMPTY_PLACES: Place[] = []

export function usePlacesForWorld(worldId: string): Place[] {
  return usePlacesStore((s) => s.placesByWorld[worldId] ?? EMPTY_PLACES)
}
