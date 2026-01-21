export async function extractText(file: File): Promise<string> {
  if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    return await file.text()
  }

  throw new Error('Unsupported file type. Please upload text or markdown files.')
}

export async function generateAnswer(query: string, contexts: string[], apiKey: string): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error('API key not set')
  }

  const contextText = contexts.join('\n\n---\n\n')
  const endpoint = import.meta.env.VITE_ANTHROPIC_ENDPOINT ?? 'https://api.anthropic.com/v1/messages'
  const model = import.meta.env.VITE_ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Answer the question using the provided context. If the answer is not in the context, say so.\n\nContext:\n${contextText}\n\nQuestion: ${query}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const first = data.content?.[0]
  return first?.type === 'text' ? first.text ?? '' : ''
}
