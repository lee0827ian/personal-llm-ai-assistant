import * as pdfjsLib from 'pdfjs-dist'
import Anthropic from '@anthropic-ai/sdk'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export async function extractText(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      fullText += `${pageText}\n\n`
    }

    return fullText.trim()
  }

  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text()
  }

  throw new Error('Unsupported file type. Please upload PDF or TXT files.')
}

export async function generateAnswer(
  query: string,
  contexts: string[],
  apiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const contextText = contexts.join('\n\n---\n\n')

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Based on the following context from documents, answer the question. If the answer is not clearly in the context, say so honestly.\n\nContext:\n${contextText}\n\nQuestion: ${query}\n\nAnswer (be concise but complete):`,
      },
    ],
  })

  return message.content[0]?.type === 'text' ? message.content[0].text : ''
}
