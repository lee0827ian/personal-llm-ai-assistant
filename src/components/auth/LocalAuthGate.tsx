import { useState } from 'react'
import { LandingPage } from './LandingPage'
import { useLocalUser } from '../../hooks/useLocalUser'

export function LocalAuthGate({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useLocalUser()
  const [displayName, setDisplayName] = useState('')

  if (!user) {
    return (
      <LandingPage
        displayName={displayName}
        onDisplayNameChange={setDisplayName}
        onLogin={() =>
          setUser({
            name: displayName.trim() || 'Local User',
            createdAt: new Date().toISOString(),
          })
        }
      />
    )
  }

  return <>{children}</>
}
