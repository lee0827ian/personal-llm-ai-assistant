import { useEffect, useState } from 'react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { User, Shield, Info, Database, Brain, Key } from 'lucide-react'
import { useLocalUser } from '../hooks/useLocalUser'

const API_KEY_STORAGE = 'local_ai_api_key'

export default function SettingsPage() {
  const { user, setUser, logout } = useLocalUser()
  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE)
    if (stored) setApiKey(stored)
  }, [])

  useEffect(() => {
    setDisplayName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user])

  const handleSaveProfile = () => {
    if (!displayName.trim()) return
    setUser({
      name: displayName.trim(),
      email: email.trim() || undefined,
      createdAt: user?.createdAt ?? new Date().toISOString(),
    })
  }

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem(API_KEY_STORAGE)
      window.dispatchEvent(new Event('local-api-key-updated'))
      return
    }
    localStorage.setItem(API_KEY_STORAGE, apiKey.trim())
    window.dispatchEvent(new Event('local-api-key-updated'))
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <header className="h-16 border-b flex items-center px-6 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-foreground">Settings</h2>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Profile</h3>
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">{user?.name ?? 'Local User'}</h4>
                  <p className="text-muted-foreground">{user?.email ?? 'No email set'}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display name</label>
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSaveProfile} disabled={!displayName.trim()}>
                  Save profile
                </Button>
                <Button variant="outline" onClick={logout}>
                  Sign out
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">AI Configuration</h3>
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <Key className="h-4 w-4" />
                <span className="font-medium">Claude API Key</span>
              </div>
              <Input
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Stored locally in your browser. Required for generating answers.
              </p>
              <Button onClick={handleSaveApiKey}>Save API key</Button>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-foreground">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">Model</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Uses your Claude API key for response generation with local context.
                </p>
              </Card>
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-foreground">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Vector Storage</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Local embeddings stored in IndexedDB for semantic search across documents.
                </p>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">About</h3>
            <Card className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary rounded-lg">
                  <Shield className="h-5 w-5 text-foreground/70" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Privacy Policy</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Documents and embeddings stay in your browser storage. Nothing is uploaded unless you call
                    external APIs directly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pt-4 border-t">
                <div className="p-2 bg-secondary rounded-lg">
                  <Info className="h-5 w-5 text-foreground/70" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Version</h4>
                  <p className="text-sm text-muted-foreground mt-1">1.1.0 Local</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
