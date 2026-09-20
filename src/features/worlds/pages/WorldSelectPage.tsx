import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { useWorldsStore } from '../store/useWorldsStore'

export function WorldSelectPage() {
  const navigate = useNavigate()
  const uid = useAuthStore((s) => s.user?.uid)

  const worlds = useWorldsStore((s) => s.worlds)
  const isLoading = useWorldsStore((s) => s.isLoading)
  const error = useWorldsStore((s) => s.error)
  const lastWorldId = useWorldsStore((s) => s.lastWorldId)
  const load = useWorldsStore((s) => s.load)
  const create = useWorldsStore((s) => s.create)
  const rename = useWorldsStore((s) => s.rename)
  const remove = useWorldsStore((s) => s.remove)
  const selectWorld = useWorldsStore((s) => s.selectWorld)

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (uid) void load(uid)
  }, [uid, load])

  // RequireAuth guarantees a user by the time this page renders.
  if (!uid) return null

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    const world = await create(uid, { name })
    setCreating(false)
    if (world) {
      setNewName('')
      handleEnter(world.id)
    }
  }

  const handleEnter = (worldId: string) => {
    selectWorld(uid, worldId)
    navigate(`/worlds/${worldId}/map`)
  }

  const startEdit = (worldId: string, name: string) => {
    setEditingId(worldId)
    setEditName(name)
  }

  const saveEdit = () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    void rename(uid, editingId, name)
    setEditingId(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">내 월드</h1>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-neutral-400">불러오는 중...</p>
      ) : worlds.length === 0 ? (
        <p className="text-sm text-neutral-500">
          아직 월드가 없습니다. 아래에서 만들어보세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {worlds.map((world) => {
            const isEditing = editingId === world.id
            const isConfirming = confirmingDeleteId === world.id

            return (
              <li
                key={world.id}
                className="rounded border border-neutral-800 bg-neutral-900 p-3"
              >
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded bg-blue-600 px-2 py-1 text-xs font-medium hover:bg-blue-500"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleEnter(world.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
                    >
                      {world.name}
                      {lastWorldId === world.id && (
                        <span className="ml-2 text-xs text-emerald-400">
                          최근
                        </span>
                      )}
                    </button>

                    {!isConfirming ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(world.id, world.name)}
                          className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(world.id)}
                          className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-900/50"
                        >
                          삭제
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1 text-xs">
                        <span className="text-neutral-400">삭제할까요?</span>
                        <button
                          type="button"
                          onClick={() => {
                            void remove(uid, world.id)
                            setConfirmingDeleteId(null)
                          }}
                          className="rounded bg-red-600 px-2 py-1 font-medium hover:bg-red-500"
                        >
                          삭제
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          className="rounded px-2 py-1 text-neutral-300 hover:bg-neutral-700"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex gap-2 border-t border-neutral-800 pt-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 월드 이름"
          className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
        >
          {creating ? '생성 중...' : '월드 생성'}
        </button>
      </div>
    </div>
  )
}
