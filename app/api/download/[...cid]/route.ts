import { initAPIConfig } from '@/lib/apiUtils'
import { cidAsURL } from '@/lib/internalTypes'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ cid: string[] }> }
) {
  await initAPIConfig()

  const { cid } = await context.params
  const url = cidAsURL(cid.join('/'))
  if (!url) {
    return new Response('Invalid CID', { status: 400 })
  }
  const response = await fetch(url, { cache: 'no-store' })

  // Get a reader to read the response body as a stream
  const reader = response?.body?.getReader()

  // If the response is not OK, return an error
  if (!response.ok || !reader) {
    return new Response('Failed to fetch resource', { status: 500 })
  }

  // Collect headers from the response
  const headers: Record<string, string> = {}
  for (const [key, value] of Array.from(response.headers.entries())) {
    if (/content-type/i.test(key)) {
      headers[key] = value
    }
  }
  if (headers['Content-Type'] === 'application/json') {
    headers['Content-Disposition'] =
      'attachment; filename="Conciliator Chat.json"'
  }
  // Create a new ReadableStream to manually handle the data chunks
  const stream = new ReadableStream({
    async start(controller) {
      // Continuously read the data from the response body
      while (true) {
        const { done, value } = await reader.read()

        // If there's no more data, close the stream
        if (done) {
          controller.close()
          break
        }

        // Otherwise, enqueue the chunk into the stream
        controller.enqueue(value)
      }
    },
  })

  // Return the new ReadableStream with headers
  return new Response(stream, {
    headers,
  })
}
