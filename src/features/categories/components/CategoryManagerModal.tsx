import { useState } from 'react'
import type { Category } from '../../../types/category'
import {
  usePlacesForWorld,
  usePlacesStore,
} from '../../places/store/usePlacesStore'
import {
  useCategoriesForWorld,
  useCategoriesStore,
} from '../store/useCategoriesStore'

interface CategoryManagerModalProps {
  uid: string
  worldId: string
  onClose: () => void
}

const DEFAULT_COLOR = '#38bdf8'

export function CategoryManagerModal({
  uid,
  worldId,
  onClose,
}: CategoryManagerModalProps) {
  const categories = useCategoriesForWorld(worldId)
  const categoriesError = useCategoriesStore((s) => s.errorByWorld[worldId])
  const addCategory = useCategoriesStore((s) => s.addCategory)
  const updateCategory = useCategoriesStore((s) => s.updateCategory)
  const removeCategory = useCategoriesStore((s) => s.removeCategory)
  const places = usePlacesForWorld(worldId)
  const updatePlace = usePlacesStore((s) => s.updatePlace)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLOR)
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_COLOR)

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    const created = await addCategory(uid, worldId, { name, color: newColor })
    setAdding(false)
    if (created) {
      setNewName('')
      setNewColor(DEFAULT_COLOR)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color)
  }

  const saveEdit = async () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    const ok = await updateCategory(uid, worldId, editingId, {
      name,
      color: editColor,
    })
    if (ok) setEditingId(null)
  }

  const placesUsingCategory = (categoryId: string) =>
    places.filter((p) => p.categoryId === categoryId)

  const handleDelete = async (categoryId: string) => {
    setDeletingId(categoryId)
    const affected = placesUsingCategory(categoryId)
    for (const place of affected) {
      await updatePlace(uid, worldId, place.id, {
        name: place.name,
        categoryId: null,
        overworld: place.overworld,
        nether: place.nether,
        y: place.y,
        description: place.description,
      })
    }
    const ok = await removeCategory(uid, worldId, categoryId)
    setDeletingId(null)
    if (ok) setConfirmingDeleteId(null)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-neutral-900 p-5 text-neutral-100 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">카테고리 관리</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-neutral-400 hover:text-neutral-100"
          >
            ×
          </button>
        </div>

        {categoriesError && (
          <p className="mb-3 text-xs text-red-400">{categoriesError}</p>
        )}

        <ul className="mb-4 max-h-64 space-y-1 overflow-y-auto">
          {categories.length === 0 && (
            <li className="text-sm text-neutral-500">
              아직 카테고리가 없습니다.
            </li>
          )}
          {categories.map((category) => {
            const usageCount = placesUsingCategory(category.id).length
            const isEditing = editingId === category.id
            const isConfirming = confirmingDeleteId === category.id
            const isDeleting = deletingId === category.id

            if (isEditing) {
              return (
                <li
                  key={category.id}
                  className="flex items-center gap-2 rounded bg-neutral-800 px-2 py-1.5"
                >
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-7 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    className="rounded bg-blue-600 px-2 py-1 text-xs font-medium hover:bg-blue-500"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
                  >
                    취소
                  </button>
                </li>
              )
            }

            return (
              <li
                key={category.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-neutral-800"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {category.name}
                  {usageCount > 0 && (
                    <span className="ml-1 text-xs text-neutral-500">
                      ({usageCount})
                    </span>
                  )}
                </span>

                {isConfirming ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-neutral-400">
                      {usageCount > 0
                        ? `${usageCount}개 장소가 미분류로 변경됩니다`
                        : '삭제할까요?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDelete(category.id)}
                      disabled={isDeleting}
                      className="rounded bg-red-600 px-2 py-1 font-medium hover:bg-red-500 disabled:opacity-50"
                    >
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      disabled={isDeleting}
                      className="rounded px-2 py-1 text-neutral-300 hover:bg-neutral-700"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(category.id)}
                      className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-900/50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2 border-t border-neutral-800 pt-3">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="새 카테고리 이름"
            className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={adding}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
