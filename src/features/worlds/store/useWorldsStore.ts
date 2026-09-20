import { create } from 'zustand'
import {
  createWorld,
  deleteWorld,
  fetchWorlds,
  renameWorld,
} from '../../../lib/firebase/worlds'
import { getLastWorldId, setLastWorldId } from '../../../lib/storage/recentWorld'
import type { World, WorldInput } from '../../../types/world'
import { useCategoriesStore } from '../../categories/store/useCategoriesStore'
import { usePlacesStore } from '../../places/store/usePlacesStore'

interface WorldsState {
  worlds: World[]
  isLoading: boolean
  error: string | null
  lastWorldId: string | null
  load: (uid: string) => Promise<void>
  create: (uid: string, input: WorldInput) => Promise<World | null>
  rename: (uid: string, worldId: string, name: string) => Promise<void>
  remove: (uid: string, worldId: string) => Promise<void>
  selectWorld: (uid: string, worldId: string) => void
  reset: () => void
}

export const useWorldsStore = create<WorldsState>((set, get) => ({
  worlds: [],
  isLoading: false,
  error: null,
  lastWorldId: null,

  load: async (uid) => {
    set({ isLoading: true, error: null })
    try {
      const worlds = await fetchWorlds(uid)
      set({ worlds, isLoading: false, lastWorldId: getLastWorldId(uid) })
    } catch {
      set({ isLoading: false, error: '월드 목록을 불러오지 못했습니다.' })
    }
  },

  create: async (uid, input) => {
    set({ error: null })
    try {
      const world = await createWorld(uid, input)
      set((state) => ({ worlds: [world, ...state.worlds] }))
      return world
    } catch {
      set({ error: '월드 생성에 실패했습니다. 다시 시도해주세요.' })
      return null
    }
  },

  rename: async (uid, worldId, name) => {
    const previous = get().worlds
    set((state) => ({
      worlds: state.worlds.map((w) => (w.id === worldId ? { ...w, name } : w)),
    }))
    try {
      await renameWorld(uid, worldId, name)
    } catch {
      set({ worlds: previous, error: '월드 이름 수정에 실패했습니다.' })
    }
  },

  remove: async (uid, worldId) => {
    const previous = get().worlds
    set((state) => ({ worlds: state.worlds.filter((w) => w.id !== worldId) }))
    try {
      await deleteWorld(uid, worldId)
      usePlacesStore.getState().clearWorld(worldId)
      useCategoriesStore.getState().clearWorld(worldId)
    } catch {
      set({ worlds: previous, error: '월드 삭제에 실패했습니다.' })
    }
  },

  selectWorld: (uid, worldId) => {
    setLastWorldId(uid, worldId)
    set({ lastWorldId: worldId })
  },

  reset: () => set({ worlds: [], isLoading: false, error: null, lastWorldId: null }),
}))
