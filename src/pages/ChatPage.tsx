import { useState, useEffect, useRef } from 'react'
import { Send, Plus, Search, FileText, Trash2, Database } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import { Card } from '../components/ui/card'
import { blink } from '../lib/blink'
import { ragSearch } from '@blinkdotnew/sdk'
import { toast } from 'react-hot-toast'
import { cn } from '../lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCollections()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function loadCollections() {
    try {
      const cols = await blink.rag.listCollections()
      setCollections(cols)
      if (cols.length > 0) {
        setSelectedCollection(cols[0].name)
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      if (!selectedCollection) {
        const { text } = await blink.ai.generateText({ prompt: input })
        setMessages(prev => [...prev, { role: 'assistant', content: text }])
      } else {
        // Use streaming RAG
        let fullResponse = ''
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        
        const stream = await blink.rag.aiSearch({
          collectionName: selectedCollection,
          query: input,
          stream: true,
        })

        const reader = stream.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const json = JSON.parse(line.slice(6))
              if (json.type === 'text-delta') {
                fullResponse += json.delta
                setMessages(prev => {
                  const last = prev[prev.length - 1]
                  return [...prev.slice(0, -1), { ...last, content: fullResponse }]
                })
              }
              if (json.type === 'sources') {
                setMessages(prev => {
                  const last = prev[prev.length - 1]
                  return [...prev.slice(0, -1), { ...last, sources: json.sources }]
                })
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e)
            }
          }
        }
      }
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
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-xs font-medium">
            <Database className="h-3 w-3" />
            <select 
              className="bg-transparent border-none focus:ring-0 p-0"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="">No Collection (General AI)</option>
              {collections.map(col => (
                <option key={col.id} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMessages([])}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
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
                Ask anything about your documents or general knowledge. 
                I'm powered by advanced context retrieval.
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
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source: any, idx: number) => (
                        <div key={idx} className="bg-background/50 px-2 py-1 rounded text-[10px] border border-foreground/10 truncate max-w-[150px]">
                          {source.filename}
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
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="pr-12 h-12 rounded-xl shadow-sm focus-visible:ring-1"
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
