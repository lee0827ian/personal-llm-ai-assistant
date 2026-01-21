type ClaudeMessageResponse = {
  content?: Array<{ type: string; text?: string }>
}

export async function extractText(file: File): Promise<string> {
  if (
    file.type === 'text/plain' ||
    file.type === 'text/markdown' ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.markdown')
  ) {
    return await file.text()
  }

  throw new Error('Unsupported file type. Please upload TXT or Markdown files.')
}

export async function generateAnswer(
  query: string,
  contexts: string[],
  apiKey: string
): Promise<string> {
  const contextText = contexts.join('\n\n---\n\n')
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content:
            'Based on the following context from documents, answer the question. If the answer is not clearly in the context, say so honestly.\n\n' +
            `Context:\n${contextText}\n\nQuestion: ${query}\n\nAnswer (be concise but complete):`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API request failed: ${response.status} ${errorText}`)
  }

  const message = (await response.json()) as ClaudeMessageResponse
  const textBlock = message.content?.find((block) => block.type === 'text')
  return textBlock?.text ?? ''
}
