export interface LocalUser {
  name: string
  email?: string
  createdAt: string
}

export const LOCAL_USER_KEY = 'local_user'
export const LOCAL_PASSWORD_KEY = 'local_password_hash'
const DEFAULT_PASSWORD = '1234'

export async function ensureDefaultPassword(): Promise<void> {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(LOCAL_PASSWORD_KEY)
  if (stored) return
  const { hashString } = await import('./security')
  const hash = await hashString(DEFAULT_PASSWORD)
  window.localStorage.setItem(LOCAL_PASSWORD_KEY, hash)
}

export async function verifyPassword(input: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(LOCAL_PASSWORD_KEY)
  if (!stored) return false
  const { hashString } = await import('./security')
  const hash = await hashString(input)
  return hash === stored
}

export async function setLocalPassword(nextPassword: string): Promise<void> {
  if (typeof window === 'undefined') return
  const { hashString } = await import('./security')
  const hash = await hashString(nextPassword)
  window.localStorage.setItem(LOCAL_PASSWORD_KEY, hash)
}

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
