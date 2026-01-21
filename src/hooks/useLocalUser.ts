import { useCallback, useEffect, useState } from 'react'
import { clearLocalUser, getLocalUser, saveLocalUser, type LocalUser, LOCAL_USER_KEY } from '../lib/localAuth'

export function useLocalUser() {
  const [user, setUserState] = useState<LocalUser | null>(() => getLocalUser())

  const setUser = useCallback((nextUser: LocalUser) => {
    saveLocalUser(nextUser)
    setUserState(nextUser)
  }, [])

  const logout = useCallback(() => {
    clearLocalUser()
    setUserState(null)
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_USER_KEY) {
        setUserState(getLocalUser())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return { user, setUser, logout }
}
