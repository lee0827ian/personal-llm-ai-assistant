import { useEffect, useRef, useState } from 'react'
import { Database, Send, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import { toast } from 'react-hot-toast'
import { cn } from '../lib/utils'
import { getCollections, type Collection, vectorRag } from '../lib/vectorStorage'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ name: string; score: number }>
}

const API_KEY_STORAGE = 'local_ai_api_key'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) ?? '')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const cols = await getCollections()
        setCollections(cols)
        if (cols.length > 0) {
          setSelectedCollection((prev) => prev || cols[0].id)
        }
      } catch (error) {
        console.error('Failed to load collections:', error)
      }
    }

    loadCollections()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const syncKey = () => {
      setApiKey(localStorage.getItem(API_KEY_STORAGE) ?? '')
    }

    window.addEventListener('storage', syncKey)
    window.addEventListener('local-api-key-updated', syncKey)

    return () => {
      window.removeEventListener('storage', syncKey)
      window.removeEventListener('local-api-key-updated', syncKey)
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const currentApiKey = localStorage.getItem(API_KEY_STORAGE) ?? ''
    if (!currentApiKey) {
      toast.error('Set your API key in Settings before chatting')
      return
    }

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }])
    setInput('')
    setIsLoading(true)

    try {
      const { answer, sources } = await vectorRag({
        query: userMessage.content,
        apiKey: currentApiKey,
        collectionId: selectedCollection || undefined,
      })

      setMessages((prev) => {
        if (prev.length === 0) return prev
        const next = [...prev]
        const lastIndex = next.length - 1
        if (next[lastIndex].role !== 'assistant') return prev
        next[lastIndex] = { role: 'assistant', content: answer, sources }
        return next
      })
    } catch (error) {
      console.error('Chat failed:', error)
      toast.error('Failed to get a response')
      setMessages((prev) =>
        prev.filter((message) => !(message.role === 'assistant' && message.content === ''))
      )
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
              onChange={(event) => setSelectedCollection(event.target.value)}
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMessages([])} disabled={isLoading}>
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
                Ask anything about your documents. Semantic search keeps answers grounded in your files.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-4 animate-in fade-in slide-in-from-bottom-2',
                message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed space-y-3',
                  message.role === 'assistant'
                    ? 'bg-secondary text-foreground'
                    : 'bg-primary text-primary-foreground shadow-sm'
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.role === 'assistant' && message.content === '' && isLoading && (
                  <span className="inline-block h-4 w-1 bg-foreground animate-pulse ml-1" />
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="pt-3 border-t border-foreground/10 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source, sourceIndex) => (
                        <div
                          key={`${source.name}-${sourceIndex}`}
                          className="bg-background/50 px-2 py-1 rounded text-[10px] border border-foreground/10 truncate max-w-[180px]"
                        >
                          {source.name} ({source.score}%)
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
            placeholder={apiKey ? 'Type your message...' : 'Add your API key in Settings to chat'}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
            disabled={isLoading}
            className="pr-12 h-12 rounded-xl shadow-sm focus-visible:ring-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !apiKey}
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
