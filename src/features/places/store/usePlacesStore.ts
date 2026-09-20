import { create } from 'zustand'
import {
  createPlace,
  deletePlaceDoc,
  fetchPlaces,
  setBaseCampDoc,
  updatePlaceDoc,
} from '../../../lib/firebase/places'
import type { Place, PlaceInput } from '../../../types/place'

interface PlacesState {
  placesByWorld: Record<string, Place[]>
  loadingByWorld: Record<string, boolean>
  errorByWorld: Record<string, string | null>

  loadPlaces: (uid: string, worldId: string) => Promise<void>
  addPlace: (uid: string, worldId: string, input: PlaceInput) => Promise<Place | null>
  updatePlace: (
    uid: string,
    worldId: string,
    placeId: string,
    input: PlaceInput,
  ) => Promise<boolean>
  /** Refuses (no-ops, returns false) if placeId is the world's base camp — reassign first via setBaseCamp. */
  removePlace: (uid: string, worldId: string, placeId: string) => Promise<boolean>
  /** Assigns the base camp to placeId and unassigns it from every other place in the world. */
  setBaseCamp: (uid: string, worldId: string, placeId: string) => Promise<void>
  /** Clears all cached place data — called on logout so the next account starts clean. */
  reset: () => void
  /** Drops one world's places — called when that world is deleted, so no orphaned data lingers in memory. */
  clearWorld: (worldId: string) => void
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  placesByWorld: {},
  loadingByWorld: {},
  errorByWorld: {},

  loadPlaces: async (uid, worldId) => {
    set((state) => ({
      loadingByWorld: { ...state.loadingByWorld, [worldId]: true },
      errorByWorld: { ...state.errorByWorld, [worldId]: null },
    }))
    try {
      const places = await fetchPlaces(uid, worldId)
      set((state) => ({
        placesByWorld: { ...state.placesByWorld, [worldId]: places },
        loadingByWorld: { ...state.loadingByWorld, [worldId]: false },
      }))
    } catch {
      set((state) => ({
        loadingByWorld: { ...state.loadingByWorld, [worldId]: false },
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '장소를 불러오지 못했습니다.',
        },
      }))
    }
  },

  addPlace: async (uid, worldId, input) => {
    const existing = get().placesByWorld[worldId] ?? []
    // A world's very first place has nothing else to be — it becomes the
    // base camp automatically so the "always exactly one" invariant holds
    // from the moment a world has any place at all.
    const isFirstPlace = existing.length === 0
    try {
      const place = await createPlace(uid, worldId, input, isFirstPlace)
      set((state) => ({
        placesByWorld: {
          ...state.placesByWorld,
          [worldId]: [...(state.placesByWorld[worldId] ?? []), place],
        },
      }))
      return place
    } catch {
      set((state) => ({
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '장소 저장에 실패했습니다. 다시 시도해주세요.',
        },
      }))
      return null
    }
  },

  updatePlace: async (uid, worldId, placeId, input) => {
    const previous = get().placesByWorld[worldId] ?? []
    set((state) => ({
      placesByWorld: {
        ...state.placesByWorld,
        [worldId]: previous.map((place) =>
          place.id === placeId
            ? { ...place, ...input, updatedAt: Date.now() }
            : place,
        ),
      },
    }))
    try {
      await updatePlaceDoc(uid, worldId, placeId, input)
      return true
    } catch {
      set((state) => ({
        placesByWorld: { ...state.placesByWorld, [worldId]: previous },
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '장소 수정에 실패했습니다. 다시 시도해주세요.',
        },
      }))
      return false
    }
  },

  removePlace: async (uid, worldId, placeId) => {
    const previous = get().placesByWorld[worldId] ?? []
    const target = previous.find((place) => place.id === placeId)
    if (!target || target.isBaseCamp) return false

    set((state) => ({
      placesByWorld: {
        ...state.placesByWorld,
        [worldId]: previous.filter((place) => place.id !== placeId),
      },
    }))
    try {
      await deletePlaceDoc(uid, worldId, placeId)
      return true
    } catch {
      set((state) => ({
        placesByWorld: { ...state.placesByWorld, [worldId]: previous },
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '장소 삭제에 실패했습니다. 다시 시도해주세요.',
        },
      }))
      return false
    }
  },

  setBaseCamp: async (uid, worldId, placeId) => {
    const previous = get().placesByWorld[worldId] ?? []
    set((state) => ({
      placesByWorld: {
        ...state.placesByWorld,
        [worldId]: previous.map((place) => ({
          ...place,
          isBaseCamp: place.id === placeId,
          updatedAt: place.id === placeId ? Date.now() : place.updatedAt,
        })),
      },
    }))
    try {
      await setBaseCampDoc(
        uid,
        worldId,
        placeId,
        previous.map((place) => place.id),
      )
    } catch {
      set((state) => ({
        placesByWorld: { ...state.placesByWorld, [worldId]: previous },
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '베이스캠프 지정에 실패했습니다. 다시 시도해주세요.',
        },
      }))
    }
  },

  reset: () => set({ placesByWorld: {}, loadingByWorld: {}, errorByWorld: {} }),

  clearWorld: (worldId) =>
    set((state) => {
      const { [worldId]: _p, ...placesByWorld } = state.placesByWorld
      const { [worldId]: _l, ...loadingByWorld } = state.loadingByWorld
      const { [worldId]: _e, ...errorByWorld } = state.errorByWorld
      return { placesByWorld, loadingByWorld, errorByWorld }
    }),
}))

const EMPTY_PLACES: Place[] = []

export function usePlacesForWorld(worldId: string): Place[] {
  return usePlacesStore((s) => s.placesByWorld[worldId] ?? EMPTY_PLACES)
}
