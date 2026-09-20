import { create } from 'zustand'
import type { User } from 'firebase/auth'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  signInWithGoogle: async () => {
    set({ error: null })
    try {
      // Redirect instead of popup: signInWithPopup gets blocked by browser
      // popup policies in a lot of real-world setups (seen in production as
      // auth/popup-blocked), especially inconsistently across browsers/OSes.
      // Redirect has no popup to block — it navigates away and back instead.
      await signInWithRedirect(auth, googleAuthProvider)
    } catch (err) {
      console.error('Google sign-in failed:', err)
      set({
        error: `Google 로그인에 실패했습니다 (${firebaseErrorCode(err)}). 다시 시도해주세요.`,
      })
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

// Surfaces errors from a just-completed redirect sign-in (e.g. a Google
// account already linked to a different provider). onAuthStateChanged above
// already picks up a successful result, so this only needs to handle failure.
getRedirectResult(auth).catch((err) => {
  console.error('Google redirect sign-in failed:', err)
  useAuthStore.setState({
    error: `Google 로그인에 실패했습니다 (${firebaseErrorCode(err)}). 다시 시도해주세요.`,
  })
})
