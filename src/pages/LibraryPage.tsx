import { useState, useEffect } from 'react'
import { Plus, Search, FileText, Trash2, Upload, Loader2, FolderPlus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { blink } from '../lib/blink'
import { toast } from 'react-hot-toast'
import { cn } from '../lib/utils'

export default function LibraryPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollection, setSelectedCollection] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  useEffect(() => {
    loadCollections()
  }, [])

  useEffect(() => {
    if (selectedCollection) {
      loadDocuments(selectedCollection.id)
    } else {
      setDocuments([])
    }
  }, [selectedCollection])

  async function loadCollections() {
    try {
      const cols = await blink.rag.listCollections()
      setCollections(cols)
      if (cols.length > 0 && !selectedCollection) {
        setSelectedCollection(cols[0])
      }
    } catch (error) {
      toast.error('Failed to load collections')
    }
  }

  async function loadDocuments(collectionId: string) {
    try {
      const docs = await blink.rag.listDocuments({ collectionId })
      setDocuments(docs)
    } catch (error) {
      toast.error('Failed to load documents')
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || isCreating) return
    setIsCreating(true)
    try {
      const col = await blink.rag.createCollection({ name: newCollectionName })
      setCollections(prev => [...prev, col])
      setNewCollectionName('')
      setSelectedCollection(col)
      toast.success('Collection created')
    } catch (error) {
      toast.error('Failed to create collection')
    } finally {
      setIsCreating(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedCollection || isUploading) return

    setIsUploading(true)
    const toastId = toast.loading('Uploading document...')

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        const data = base64.split(',')[1]

        try {
          const doc = await blink.rag.upload({
            collectionName: selectedCollection.name,
            filename: file.name,
            file: {
              data,
              contentType: file.type
            }
          })

          toast.loading('Processing document...', { id: toastId })
          await blink.rag.waitForReady(doc.id)
          
          await loadDocuments(selectedCollection.id)
          toast.success('Document ready', { id: toastId })
        } catch (error) {
          toast.error('Upload failed', { id: toastId })
        } finally {
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Failed to read file', { id: toastId })
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    try {
      await blink.rag.deleteDocument(docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success('Document deleted')
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection and all its documents?')) return
    try {
      await blink.rag.deleteCollection(id)
      setCollections(prev => prev.filter(c => c.id !== id))
      if (selectedCollection?.id === id) {
        setSelectedCollection(collections[0] || null)
      }
      toast.success('Collection deleted')
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-foreground">Knowledge Library</h2>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Collections List */}
        <div className="w-64 border-r p-4 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Collections
            </h3>
            <div className="space-y-1">
              {collections.map(col => (
                <div
                  key={col.id}
                  className={cn(
                    'group flex items-center justify-between px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors',
                    selectedCollection?.id === col.id
                      ? 'bg-secondary text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                  onClick={() => setSelectedCollection(col)}
                >
                  <span className="truncate">{col.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCollection(col.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <Input
              placeholder="New collection..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              disabled={isCreating || !newCollectionName.trim()}
              onClick={handleCreateCollection}
            >
              {isCreating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <FolderPlus className="h-3 w-3 mr-2" />}
              Create Collection
            </Button>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
          {selectedCollection ? (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">{selectedCollection.name}</h3>
                  <p className="text-muted-foreground mt-1">
                    {documents.length} documents in this collection
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.html,.md"
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      asChild
                      variant="primary"
                      className="cursor-pointer font-medium"
                      disabled={isUploading}
                    >
                      <span>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Upload Document
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map(doc => (
                  <Card key={doc.id} className="p-4 flex items-center gap-4 group hover:border-foreground/20 transition-colors">
                    <div className="p-3 bg-secondary rounded-xl">
                      <FileText className="h-6 w-6 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {doc.status === 'ready' ? 'Ready for search' : 'Processing...'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Card>
                ))}
                {documents.length === 0 && (
                  <div className="col-span-full py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-secondary rounded-full">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">No documents yet</h4>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                        Upload your first PDF or text file to start using personal RAG.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div className="max-w-xs space-y-4">
                <div className="p-4 bg-secondary rounded-full inline-block">
                  <Library className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium text-foreground">Select a collection</h3>
                <p className="text-muted-foreground">
                  Choose a collection from the sidebar or create a new one to manage your documents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Library({ className }: { className?: string }) {
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
      <path d="M16 6l4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  )
}
