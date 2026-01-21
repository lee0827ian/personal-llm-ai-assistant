import { useMemo, useState } from 'react'
import { Brain, Lock } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { useLocalUser } from '../../hooks/useLocalUser'

interface LocalAuthGateProps {
  children: React.ReactNode
}

export function LocalAuthGate({ children }: LocalAuthGateProps) {
  const { user, setUser } = useLocalUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isReady = useMemo(() => Boolean(user), [user])

  if (isReady) {
    return <>{children}</>
  }

  const handleContinue = () => {
    if (!name.trim() || password !== '1234') return
    setUser({
      name: name.trim(),
      email: email.trim() || undefined,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-3xl w-full grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
            <Brain className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide">Personal AI Workspace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Private, local-first AI assistant for your documents.
          </h1>
          <p className="text-muted-foreground text-lg">
            Sign in locally to access your personal knowledge base. Your data stays on this device.
          </p>
        </div>

        <Card className="p-6 space-y-5 shadow-lg">
          <div className="flex items-center gap-2 text-foreground">
            <Lock className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Local sign in</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="local-auth-name" className="text-sm font-medium">
                Display name
              </label>
              <Input
                id="local-auth-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Alex"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="local-auth-email" className="text-sm font-medium">
                Email (optional)
              </label>
              <Input
                id="local-auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="local-auth-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="local-auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
              <p className="text-xs text-muted-foreground">Initial password: 1234</p>
            </div>
          </div>
          <Button className="w-full" onClick={handleContinue} disabled={!name.trim() || password !== '1234'}>
            Continue
          </Button>
          <p className="text-xs text-muted-foreground">
            This sign-in is stored locally and does not leave your device.
          </p>
        </Card>
      </div>
    </div>
  )
}
