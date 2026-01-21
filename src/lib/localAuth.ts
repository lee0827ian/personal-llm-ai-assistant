export interface LocalUser {
  name: string
  email?: string
  createdAt: string
}

export const LOCAL_USER_KEY = 'local_user'

export function getLocalUser(): LocalUser | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(LOCAL_USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as LocalUser
  } catch {
    return null
  }
}

export function saveLocalUser(user: LocalUser): void {
  window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
}

export function clearLocalUser(): void {
  window.localStorage.removeItem(LOCAL_USER_KEY)
}
