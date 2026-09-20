import { create } from 'zustand'
import {
  createCategory,
  deleteCategoryDoc,
  fetchCategories,
  updateCategoryDoc,
} from '../../../lib/firebase/categories'
import type { Category, CategoryInput } from '../../../types/category'

interface CategoriesState {
  categoriesByWorld: Record<string, Category[]>
  loadingByWorld: Record<string, boolean>
  errorByWorld: Record<string, string | null>

  loadCategories: (uid: string, worldId: string) => Promise<void>
  addCategory: (
    uid: string,
    worldId: string,
    input: CategoryInput,
  ) => Promise<Category | null>
  updateCategory: (
    uid: string,
    worldId: string,
    categoryId: string,
    input: CategoryInput,
  ) => Promise<boolean>
  removeCategory: (
    uid: string,
    worldId: string,
    categoryId: string,
  ) => Promise<boolean>
  /** Clears all cached category data — called on logout so the next account starts clean. */
  reset: () => void
  /** Drops one world's categories — called when that world is deleted, so no orphaned data lingers in memory. */
  clearWorld: (worldId: string) => void
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categoriesByWorld: {},
  loadingByWorld: {},
  errorByWorld: {},

  loadCategories: async (uid, worldId) => {
    set((state) => ({
      loadingByWorld: { ...state.loadingByWorld, [worldId]: true },
      errorByWorld: { ...state.errorByWorld, [worldId]: null },
    }))
    try {
      const categories = await fetchCategories(uid, worldId)
      set((state) => ({
        categoriesByWorld: { ...state.categoriesByWorld, [worldId]: categories },
        loadingByWorld: { ...state.loadingByWorld, [worldId]: false },
      }))
    } catch {
      set((state) => ({
        loadingByWorld: { ...state.loadingByWorld, [worldId]: false },
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '카테고리를 불러오지 못했습니다.',
        },
      }))
    }
  },

  addCategory: async (uid, worldId, input) => {
    try {
      const category = await createCategory(uid, worldId, input)
      set((state) => ({
        categoriesByWorld: {
          ...state.categoriesByWorld,
          [worldId]: [...(state.categoriesByWorld[worldId] ?? []), category],
        },
      }))
      return category
    } catch {
      set((state) => ({
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '카테고리 저장에 실패했습니다. 다시 시도해주세요.',
        },
      }))
      return null
    }
  },

  updateCategory: async (uid, worldId, categoryId, input) => {
    const previous = get().categoriesByWorld[worldId] ?? []
    set((state) => ({
      categoriesByWorld: {
        ...state.categoriesByWorld,
        [worldId]: previous.map((category) =>
          category.id === categoryId
            ? { ...category, ...input, updatedAt: Date.now() }
            : category,
        ),
      },
    }))
    try {
      await updateCategoryDoc(uid, worldId, categoryId, input)
      return true
    } catch {
      set((state) => ({
        categoriesByWorld: { ...state.categoriesByWorld, [worldId]: previous },
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '카테고리 수정에 실패했습니다. 다시 시도해주세요.',
        },
      }))
      return false
    }
  },

  removeCategory: async (uid, worldId, categoryId) => {
    const previous = get().categoriesByWorld[worldId] ?? []
    set((state) => ({
      categoriesByWorld: {
        ...state.categoriesByWorld,
        [worldId]: previous.filter((category) => category.id !== categoryId),
      },
    }))
    try {
      await deleteCategoryDoc(uid, worldId, categoryId)
      return true
    } catch {
      set((state) => ({
        categoriesByWorld: { ...state.categoriesByWorld, [worldId]: previous },
        errorByWorld: {
          ...state.errorByWorld,
          [worldId]: '카테고리 삭제에 실패했습니다. 다시 시도해주세요.',
        },
      }))
      return false
    }
  },

  reset: () =>
    set({ categoriesByWorld: {}, loadingByWorld: {}, errorByWorld: {} }),

  clearWorld: (worldId) =>
    set((state) => {
      const { [worldId]: _c, ...categoriesByWorld } = state.categoriesByWorld
      const { [worldId]: _l, ...loadingByWorld } = state.loadingByWorld
      const { [worldId]: _e, ...errorByWorld } = state.errorByWorld
      return { categoriesByWorld, loadingByWorld, errorByWorld }
    }),
}))

const EMPTY_CATEGORIES: Category[] = []

export function useCategoriesForWorld(worldId: string): Category[] {
  return useCategoriesStore(
    (s) => s.categoriesByWorld[worldId] ?? EMPTY_CATEGORIES,
  )
}
