import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = `${
    process.env.PINATA_GATEWAY
  }/ipfs/${req.nextUrl.pathname.replace(
    '/api/download/',
    ''
  )}?pinataGatewayToken=${process.env.PINATA_TOKEN}${
    req.nextUrl.search ? `&${req.nextUrl.search.slice(1)}` : ''
  }`
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
