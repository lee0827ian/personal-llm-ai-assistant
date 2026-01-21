const VECTOR_SIZE = 256

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
}

function fnv1aHash(value: string, seed = 0x811c9dc5): number {
  let hash = seed
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function normalize(vector: number[]): number[] {
  let sumSquares = 0
  for (const value of vector) {
    sumSquares += value * value
  }
  const magnitude = Math.sqrt(sumSquares)
  if (!magnitude) return vector
  return vector.map((value) => value / magnitude)
}

export async function embed(text: string): Promise<number[]> {
  const tokens = tokenize(text.slice(0, 4000))
  const vector = new Array<number>(VECTOR_SIZE).fill(0)

  for (const token of tokens) {
    const hash = fnv1aHash(token)
    const index = hash % VECTOR_SIZE
    const sign = hash & 1 ? 1 : -1
    vector[index] += sign
  }

  return normalize(vector)
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
