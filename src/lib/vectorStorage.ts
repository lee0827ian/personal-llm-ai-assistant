import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { embed, findMostSimilar } from './embeddings'
import { generateAnswer } from './localRag'

interface Chunk {
  id: string
  text: string
  vector: number[]
  documentId: string
  documentName: string
}

export interface VectorDocument {
  id: string
  filename: string
  content: string
  createdAt: number
  chunkCount: number
}

interface VectorDB extends DBSchema {
  documents: {
    key: string
    value: VectorDocument
  }
  chunks: {
    key: string
    value: Chunk
    indexes: { 'by-document': string }
  }
}

let db: IDBPDatabase<VectorDB> | null = null

export async function initVectorDB() {
  if (db) return db

  db = await openDB<VectorDB>('vector-rag', 1, {
    upgrade(database) {
      database.createObjectStore('documents', { keyPath: 'id' })
      const chunkStore = database.createObjectStore('chunks', { keyPath: 'id' })
      chunkStore.createIndex('by-document', 'documentId')
    },
  })

  return db
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+\s+/)

  let currentChunk = ''
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

export async function saveVectorDocument(
  filename: string,
  content: string,
  onProgress?: (progress: number) => void
): Promise<VectorDocument> {
  const database = await initVectorDB()
  const docId = crypto.randomUUID()
  const chunks = chunkText(content, 800)

  for (let i = 0; i < chunks.length; i += 1) {
    const chunkTextValue = chunks[i]
    if (onProgress) {
      onProgress(Math.round(((i + 1) / chunks.length) * 100))
    }

    const vector = await embed(chunkTextValue)

    await database.add('chunks', {
      id: `${docId}-${i}`,
      text: chunkTextValue,
      vector,
      documentId: docId,
      documentName: filename,
    })
  }

  const document: VectorDocument = {
    id: docId,
    filename,
    content,
    createdAt: Date.now(),
    chunkCount: chunks.length,
  }

  await database.add('documents', document)
  return document
}

export async function vectorSearch(query: string, topK = 5) {
  const database = await initVectorDB()
  const queryVector = await embed(query)
  const allChunks = await database.getAll('chunks')

  const results = findMostSimilar(
    queryVector,
    allChunks.map((chunk) => ({
      vector: chunk.vector,
      data: {
        text: chunk.text,
        source: chunk.documentName,
      },
    })),
    topK
  )

  return results.map((result) => ({
    text: result.data.text,
    source: result.data.source,
    score: result.score,
  }))
}

export async function vectorRag(query: string, apiKey: string) {
  const searchResults = await vectorSearch(query, 3)
  const contexts = searchResults.map((result) => result.text)
  const answer = await generateAnswer(query, contexts, apiKey)

  const sourceMap = new Map<string, number>()
  for (const result of searchResults) {
    const existing = sourceMap.get(result.source) ?? 0
    sourceMap.set(result.source, Math.max(existing, result.score))
  }

  const sources = Array.from(sourceMap.entries()).map(([name, score]) => ({
    name,
    score: Math.round(score * 100),
  }))

  return { answer, sources }
}

export async function getVectorDocuments(): Promise<VectorDocument[]> {
  const database = await initVectorDB()
  return database.getAll('documents')
}

export async function deleteVectorDocument(docId: string) {
  const database = await initVectorDB()
  const chunks = await database.getAllFromIndex('chunks', 'by-document', docId)

  for (const chunk of chunks) {
    await database.delete('chunks', chunk.id)
  }

  await database.delete('documents', docId)
}
