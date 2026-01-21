import { Button } from '../ui/button'
import { Brain, Shield, Zap, Sparkles } from 'lucide-react'

interface LandingPageProps {
  onLogin: () => void
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-12">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex justify-center">
            <div className="p-3 bg-primary rounded-2xl">
              <Brain className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            Personal AI Assistant
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Your private, context-aware intelligence powered by open-source LLMs and advanced RAG technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Shield className="h-6 w-6" />}
            title="Privacy First"
            description="Your data stays yours. Secure, private document storage and processing."
          />
          <FeatureCard 
            icon={<Zap className="h-6 w-6" />}
            title="Advanced RAG"
            description="Deep context awareness using semantic search across all your documents."
          />
          <FeatureCard 
            icon={<Sparkles className="h-6 w-6" />}
            title="Smart Insights"
            description="Get instant answers and summaries from your personal knowledge base."
          />
        </div>

        <div className="pt-8">
          <Button size="lg" onClick={onLogin} className="text-lg px-8 h-12 rounded-full font-medium">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 inline-flex p-2 bg-secondary rounded-lg">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
