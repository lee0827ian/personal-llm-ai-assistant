import { useBlinkAuth } from '@blinkdotnew/react'
import { Card } from '../components/ui/card'
import { User, Shield, Info, Database, Brain } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useBlinkAuth()

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <header className="h-16 border-b flex items-center px-6 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-foreground">Settings</h2>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Profile</h3>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">{user?.email?.split('@')[0]}</h4>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">AI Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-foreground">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">Model</span>
                </div>
                <p className="text-sm text-muted-foreground">Using Gemini 3 Flash for fast and efficient RAG processing.</p>
              </Card>
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-foreground">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Vector Storage</span>
                </div>
                <p className="text-sm text-muted-foreground">Built-in high-performance semantic retrieval system.</p>
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
                    Your documents are processed and stored securely. We do not use your personal data to train public models.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pt-4 border-t">
                <div className="p-2 bg-secondary rounded-lg">
                  <Info className="h-5 w-5 text-foreground/70" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Version</h4>
                  <p className="text-sm text-muted-foreground mt-1">1.0.0 Stable</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
