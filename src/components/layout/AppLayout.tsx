import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/useAuthStore'

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logOut = useAuthStore((s) => s.logOut)

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <span className="font-semibold tracking-tight">Minecraft Atlas</span>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-400">
              {user.displayName ?? user.email}
            </span>
            <button
              type="button"
              onClick={() => logOut()}
              className="rounded border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              로그아웃
            </button>
          </div>
        )}
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
