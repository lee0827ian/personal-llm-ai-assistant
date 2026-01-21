const VECTOR_SIZE = 128

function hashToken(token: string): number {
  let hash = 5381
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 33) ^ token.charCodeAt(index)
  }
  return Math.abs(hash)
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
}

export async function embed(text: string): Promise<number[]> {
  const vector = new Array<number>(VECTOR_SIZE).fill(0)
  const tokens = tokenize(text)

  for (const token of tokens) {
    const index = hashToken(token) % VECTOR_SIZE
    vector[index] += 1
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (magnitude > 0) {
    return vector.map((value) => value / magnitude)
  }

  return vector
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
