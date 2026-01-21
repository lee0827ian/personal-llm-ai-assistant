import { embed, findMostSimilar } from './embeddings'
import { generateAnswer } from './localRag'

export interface Collection {
  id: string
  name: string
  createdAt: number
}

export interface DocumentRecord {
  id: string
  collectionId: string
  filename: string
  createdAt: number
  chunkCount: number
}

interface ChunkRecord {
  id: string
  text: string
  vector: number[]
  documentId: string
  collectionId: string
  documentName: string
}

type StoreName = 'collections' | 'documents' | 'chunks'

let db: IDBDatabase | null = null

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getDb(): Promise<IDBDatabase> {
  if (db) return db
  db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('vector-rag', 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('collections')) {
        database.createObjectStore('collections', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('documents')) {
        const docStore = database.createObjectStore('documents', { keyPath: 'id' })
        docStore.createIndex('by-collection', 'collectionId')
      }
      if (!database.objectStoreNames.contains('chunks')) {
        const chunkStore = database.createObjectStore('chunks', { keyPath: 'id' })
        chunkStore.createIndex('by-document', 'documentId')
        chunkStore.createIndex('by-collection', 'collectionId')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return db
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const database = await getDb()
  const transaction = database.transaction(storeName, 'readonly')
  const store = transaction.objectStore(storeName)
  return requestToPromise(store.getAll())
}

async function getAllFromIndex<T>(storeName: StoreName, indexName: string, key: string): Promise<T[]> {
  const database = await getDb()
  const transaction = database.transaction(storeName, 'readonly')
  const store = transaction.objectStore(storeName)
  const index = store.index(indexName)
  return requestToPromise(index.getAll(key))
}

async function putItem<T>(storeName: StoreName, value: T): Promise<void> {
  const database = await getDb()
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  await requestToPromise(store.put(value))
}

async function deleteItem(storeName: StoreName, key: string): Promise<void> {
  const database = await getDb()
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  await requestToPromise(store.delete(key))
}

export async function ensureDefaultCollection(): Promise<Collection> {
  const collections = await getAll<Collection>('collections')
  if (collections.length > 0) return collections[0]

  const defaultCollection: Collection = {
    id: crypto.randomUUID(),
    name: 'Personal Library',
    createdAt: Date.now(),
  }
  await putItem('collections', defaultCollection)
  return defaultCollection
}

export async function getCollections(): Promise<Collection[]> {
  const collections = await getAll<Collection>('collections')
  if (collections.length === 0) {
    const defaultCollection = await ensureDefaultCollection()
    return [defaultCollection]
  }
  return collections
}

export async function createCollection(name: string): Promise<Collection> {
  const collection: Collection = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
  }
  await putItem('collections', collection)
  return collection
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const docs = await getAllFromIndex<DocumentRecord>('documents', 'by-collection', collectionId)

  for (const doc of docs) {
    await deleteDocument(doc.id)
  }

  await deleteItem('collections', collectionId)
}

export async function getDocuments(collectionId: string): Promise<DocumentRecord[]> {
  return await getAllFromIndex<DocumentRecord>('documents', 'by-collection', collectionId)
}

function chunkText(text: string, chunkSize: number) {
  const sentences = text.split(/[.!?]+\s+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

export async function saveVectorDocument(options: {
  collectionId: string
  filename: string
  content: string
  onProgress?: (progress: number) => void
}): Promise<DocumentRecord> {
  const { collectionId, filename, content, onProgress } = options
  const documentId = crypto.randomUUID()
  const chunks = chunkText(content, 900)

  for (let index = 0; index < chunks.length; index += 1) {
    const text = chunks[index]
    const vector = await embed(text)

    if (onProgress) {
      onProgress(Math.round(((index + 1) / chunks.length) * 100))
    }

    await putItem('chunks', {
      id: `${documentId}-${index}`,
      text,
      vector,
      documentId,
      collectionId,
      documentName: filename,
    })
  }

  const document: DocumentRecord = {
    id: documentId,
    collectionId,
    filename,
    createdAt: Date.now(),
    chunkCount: chunks.length,
  }

  await putItem('documents', document)
  return document
}

export async function deleteDocument(documentId: string): Promise<void> {
  const chunks = await getAllFromIndex<ChunkRecord>('chunks', 'by-document', documentId)
  for (const chunk of chunks) {
    await deleteItem('chunks', chunk.id)
  }
  await deleteItem('documents', documentId)
}

export async function vectorSearch(options: {
  query: string
  collectionId?: string
  topK?: number
}): Promise<Array<{ text: string; source: string; score: number }>> {
  const { query, collectionId, topK = 4 } = options
  const queryVector = await embed(query)
  const chunks = collectionId
    ? await getAllFromIndex<ChunkRecord>('chunks', 'by-collection', collectionId)
    : await getAll<ChunkRecord>('chunks')

  const results = findMostSimilar(
    queryVector,
    chunks.map((chunk) => ({
      vector: chunk.vector,
      data: { text: chunk.text, source: chunk.documentName },
    })),
    topK
  )

  return results.map((result) => ({
    text: result.data.text,
    source: result.data.source,
    score: result.score,
  }))
}

export async function vectorRag(options: {
  query: string
  apiKey: string
  collectionId?: string
}): Promise<{ answer: string; sources: Array<{ name: string; score: number }> }> {
  const { query, apiKey, collectionId } = options
  const results = await vectorSearch({ query, collectionId, topK: 3 })
  if (results.length === 0) {
    return {
      answer: 'No relevant documents found. Upload a document to improve results.',
      sources: [],
    }
  }
  const contexts = results.map((result) => result.text)
  const answer = await generateAnswer(query, contexts, apiKey)

  const sourceMap = new Map<string, number>()
  for (const result of results) {
    const existingScore = sourceMap.get(result.source) ?? 0
    sourceMap.set(result.source, Math.max(existingScore, result.score))
  }

  const sources = Array.from(sourceMap.entries()).map(([name, score]) => ({
    name,
    score: Math.round(score * 100),
  }))

  return { answer, sources }
}
