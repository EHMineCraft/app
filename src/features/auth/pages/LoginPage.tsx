import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)

  if (!isLoading && user) {
    return <Navigate to="/worlds" replace />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Minecraft Atlas</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        마인크래프트 월드의 좌표와 장소를 기록하고 관리하는 2D 지도 서비스입니다.
      </p>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="rounded bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
      >
        Google로 로그인
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
