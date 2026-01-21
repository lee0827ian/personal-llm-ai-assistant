import { pipeline, type Pipeline } from '@xenova/transformers'

let embedder: Pipeline | null = null

export async function initEmbedder(): Promise<Pipeline> {
  if (embedder) return embedder

  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  })

  return embedder
}

export async function embed(text: string): Promise<number[]> {
  const model = await initEmbedder()
  const truncated = text.slice(0, 2000)

  const output = await model(truncated, {
    pooling: 'mean',
    normalize: true,
  })

  return Array.from(output.data)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function findMostSimilar<T>(
  queryVector: number[],
  vectors: Array<{ vector: number[]; data: T }>,
  topK = 5
): Array<{ data: T; score: number }> {
  const scored = vectors.map((item) => ({
    data: item.data,
    score: cosineSimilarity(queryVector, item.vector),
  }))

  return scored.sort((a, b) => b.score - a.score).slice(0, topK)
}
