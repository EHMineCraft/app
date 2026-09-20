const KEY_PREFIX = 'minecraft-atlas:last-world:'

// Scoped per-uid per spec's cache-isolation rule: different accounts must
// never read each other's "last selected world".
export function getLastWorldId(uid: string): string | null {
  try {
    return localStorage.getItem(KEY_PREFIX + uid)
  } catch {
    return null
  }
}

export function setLastWorldId(uid: string, worldId: string): void {
  try {
    localStorage.setItem(KEY_PREFIX + uid, worldId)
  } catch {
    // Private browsing / storage quota — non-critical, safe to ignore.
  }
}
