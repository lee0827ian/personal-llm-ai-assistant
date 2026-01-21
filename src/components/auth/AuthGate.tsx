import { useBlinkAuth } from '@blinkdotnew/react'
import { blink } from '../../lib/blink'
import { LandingPage } from './LandingPage'
import { Spinner } from '../ui/spinner'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useBlinkAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => blink.auth.login()} />
  }

  return <>{children}</>
}
