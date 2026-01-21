import { useEffect, useState } from 'react'
import { LandingPage } from './LandingPage'
import { useLocalUser } from '../../hooks/useLocalUser'
import { ensureDefaultPassword, verifyPassword } from '../../lib/localAuth'

export function LocalAuthGate({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useLocalUser()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void ensureDefaultPassword()
  }, [])

  useEffect(() => {
    if (error) {
      setError('')
    }
  }, [password])

  if (!user) {
    return (
      <LandingPage
        displayName={displayName}
        onDisplayNameChange={setDisplayName}
        password={password}
        onPasswordChange={setPassword}
        isSubmitting={isSubmitting}
        error={error}
        onLogin={async () => {
          if (!password.trim()) {
            setError('비밀번호를 입력해주세요.')
            return
          }
          setIsSubmitting(true)
          setError('')
          const isValid = await verifyPassword(password)
          if (!isValid) {
            setError('비밀번호가 올바르지 않습니다.')
            setIsSubmitting(false)
            return
          }
          setUser({
            name: displayName.trim() || 'Local User',
            createdAt: new Date().toISOString(),
          })
          setIsSubmitting(false)
        }}
      />
    )
  }

  return <>{children}</>
}
