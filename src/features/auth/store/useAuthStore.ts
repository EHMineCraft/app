import { create } from 'zustand'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleAuthProvider } from '../../../lib/firebase/config'
import { useCategoriesStore } from '../../categories/store/useCategoriesStore'
import { usePlacesStore } from '../../places/store/usePlacesStore'
import { useWorldsStore } from '../../worlds/store/useWorldsStore'

interface AuthState {
  user: User | null
  /** True until the first onAuthStateChanged callback fires — avoids flashing the login page during startup. */
  isLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  logOut: () => Promise<void>
}

function firebaseErrorCode(err: unknown): string {
  return err && typeof err === 'object' && 'code' in err
    ? String((err as { code: unknown }).code)
    : 'unknown'
}

function signInErrorMessage(err: unknown): string {
  const code = firebaseErrorCode(err)
  if (code === 'auth/popup-blocked') {
    return '브라우저가 로그인 팝업을 차단했습니다. 주소창의 팝업 차단 아이콘을 눌러 이 사이트의 팝업을 허용한 뒤 다시 시도해주세요.'
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '로그인 팝업이 닫혔습니다. 다시 시도해주세요.'
  }
  if (code === 'auth/network-request-failed') {
    return '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
  }
  return `Google 로그인에 실패했습니다 (${code}). 다시 시도해주세요.`
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  signInWithGoogle: async () => {
    set({ error: null })
    try {
      // Popup, with the default firebaseapp.com authDomain: the standard,
      // most-supported setup. signInWithRedirect + a custom/proxied
      // authDomain was tried and hit a known, long-open Firebase JS SDK bug
      // ("missing initial state") in storage-partitioned browsers — a much
      // deeper problem than an occasional blocked popup.
      await signInWithPopup(auth, googleAuthProvider)
    } catch (err) {
      console.error('Google sign-in failed:', err)
      set({ error: signInErrorMessage(err) })
    }
  },

  logOut: async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out failed:', err)
      set({ error: '로그아웃에 실패했습니다. 다시 시도해주세요.' })
    }
  },
}))

// Firebase SDK manages the actual session; this just mirrors its current
// user into the store so components can subscribe without touching the SDK.
let previousUid: string | null = null
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, isLoading: false })
  // Clear every other store's cached data on logout (or account switch) so
  // the next account never sees a residual trace of the previous one.
  if (previousUid !== null && user?.uid !== previousUid) {
    useWorldsStore.getState().reset()
    usePlacesStore.getState().reset()
    useCategoriesStore.getState().reset()
  }
  previousUid = user?.uid ?? null
})
