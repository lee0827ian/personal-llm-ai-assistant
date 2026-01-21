import { useEffect, useState } from 'react'
import { FileText, Trash2, Upload, Loader2, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { toast } from 'react-hot-toast'
import {
  deleteVectorDocument,
  getVectorDocuments,
  initVectorDB,
  saveVectorDocument,
  type VectorDocument,
} from '../lib/vectorStorage'
import { extractText } from '../lib/localRag'
import { cn } from '../lib/utils'

export default function LibraryPage() {
  const [documents, setDocuments] = useState<VectorDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    await initVectorDB()
    const docs = await getVectorDocuments()
    setDocuments(docs)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || isUploading) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File must be less than 10MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setCurrentFile(file.name)

    const toastId = toast.loading(`Processing ${file.name}...`)

    try {
      const content = await extractText(file)
      await saveVectorDocument(file.name, content, (progress) => {
        setUploadProgress(progress)
      })

      await loadDocuments()
      toast.success(`${file.name} added!`, { id: toastId })
      e.target.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to process file', { id: toastId })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentFile('')
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Delete this document and its embeddings?')) return
    try {
      await deleteVectorDocument(docId)
      await loadDocuments()
      toast.success('Document deleted')
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg text-foreground">Knowledge Library</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            <Zap className="h-3 w-3" />
            Vector Embeddings
          </span>
        </div>
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.txt"
            disabled={isUploading}
          />
          <label htmlFor="file-upload">
            <Button asChild variant="primary" className="cursor-pointer font-medium" disabled={isUploading}>
              <span>
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Document
              </span>
            </Button>
          </label>
        </div>
      </header>

      {isUploading && (
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{currentFile}</span>
              <span className="text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">Creating vector embeddings for semantic search...</p>
          </div>
        </div>
      )}

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Local Documents</h3>
              <p className="text-muted-foreground mt-1">
                {documents.length} documents · {documents.reduce((sum, doc) => sum + doc.chunkCount, 0)} chunks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className={cn(
                  'p-4 flex items-center gap-4 group hover:border-foreground/20 transition-colors',
                  isUploading && 'opacity-60'
                )}
              >
                <div className="p-3 bg-secondary rounded-xl">
                  <FileText className="h-6 w-6 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-foreground">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {doc.chunkCount} chunks · {new Date(doc.createdAt).toLocaleDateString()}
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
                    Upload your first PDF or text file to start using personal vector RAG.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
