import { useEffect, useRef, useState } from 'react'
import { Send, Trash2, KeyRound, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { toast } from 'react-hot-toast'
import { cn } from '../lib/utils'
import { vectorRag } from '../lib/vectorStorage'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ name: string; score: number }>
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [tempApiKey, setTempApiKey] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('claude_api_key')
    if (saved) {
      setApiKey(saved)
      setTempApiKey(saved)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSaveApiKey = () => {
    window.localStorage.setItem('claude_api_key', tempApiKey)
    setApiKey(tempApiKey)
    setIsSettingsOpen(false)
    toast.success('API key saved')
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    if (!apiKey) {
      toast.error('Please set your API key first')
      setIsSettingsOpen(true)
      return
    }

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const { answer, sources } = await vectorRag(input, apiKey)
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources }])
    } catch (error) {
      console.error('Chat failed:', error)
      toast.error('Failed to get a response')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">AI Assistant</h2>
          <Badge variant="secondary" className="gap-1.5">
            <Zap className="h-3 w-3" />
            Vector RAG
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <KeyRound className="h-4 w-4 mr-2" />
                API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Claude API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={tempApiKey}
                  onChange={(event) => setTempApiKey(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Stored locally in your browser. Required to generate answers.
                </p>
                <Button onClick={handleSaveApiKey} className="w-full">
                  Save API Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => setMessages([])}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-secondary rounded-full">
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">How can I help you today?</h3>
              <p className="text-muted-foreground max-w-sm">
                Ask anything about your local documents. Vector embeddings keep your data on this
                device.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-4 animate-in fade-in slide-in-from-bottom-2',
                msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed space-y-3',
                  msg.role === 'assistant'
                    ? 'bg-secondary text-foreground'
                    : 'bg-primary text-primary-foreground shadow-sm'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === 'assistant' && msg.content === '' && isLoading && (
                  <span className="inline-block h-4 w-1 bg-foreground animate-pulse ml-1" />
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-3 border-t border-foreground/10 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, idx) => (
                        <div
                          key={idx}
                          className="bg-background/50 px-2 py-1 rounded text-[10px] border border-foreground/10 truncate max-w-[170px]"
                        >
                          {source.name} · {source.score}%
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-6 border-t bg-card/50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto relative">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="pr-12 h-12 rounded-xl shadow-sm focus-visible:ring-1"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1 top-1 h-10 w-10 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Brain({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 3 3 0 1 0 5.136-2.436c.214-.047.43-.09.648-.129a4 4 0 1 0-1.125-7.842A3 3 0 0 0 12 5Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.52 8.105 3 3 0 1 1-5.136-2.436c-.214-.047-.43-.09-.648-.129a4 4 0 1 1 1.125-7.842A3 3 0 0 1 12 5Z" />
    </svg>
  )
}
