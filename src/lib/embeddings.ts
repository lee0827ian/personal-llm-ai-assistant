import { pipeline, type Pipeline } from '@xenova/transformers'

let embedder: Pipeline | null = null

export async function initEmbedder() {
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

  return Array.from(output.data as Float32Array)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dotProduct += a[index] * b[index]
    normA += a[index] * a[index]
    normB += b[index] * b[index]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function findMostSimilar<T>(
  queryVector: number[],
  vectors: Array<{ vector: number[]; data: T }>,
  topK = 5
): Array<{ data: T; score: number }> {
  return vectors
    .map((item) => ({ data: item.data, score: cosineSimilarity(queryVector, item.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
