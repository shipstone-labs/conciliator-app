import { type NextRequest, NextResponse } from 'next/server'
import 'firebase-admin/storage'
import { getBucket } from '@/app/api/firebase'
import { initAPIConfig } from '@/lib/apiUtils'

// Set extremely long cache since IPFS content is immutable (1 year)
const CACHE_CONTROL =
  'public, max-age=31536000, immutable, stale-while-revalidate=31536000'

// Define cache options for the route handler
export const dynamic = 'force-dynamic' // Allow dynamic handling for first request
export const revalidate = false // Don't revalidate automatically
export const fetchCache = 'force-cache' // Use cache when possible

export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ cid: string[] }> }
) {
  await initAPIConfig()

  // Handle splat route - join all segments
  const params = await _params
  const cidPath = params.cid.join('/')

  // Validate CID to prevent path traversal attacks
  if (!cidPath || !cidPath.match(/^[a-zA-Z0-9/]+$/)) {
    return new NextResponse('Invalid CID path', { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const width = searchParams.get('width') || '800'
  const quality = searchParams.get('quality') || '75'

  // Base storage path (without extension)
  const basePath = `ipfs-cache/${cidPath}_${width}_${quality}`

  try {
    // Initialize Firebase
    const bucket = getBucket()

    // Look for files with this base path (regardless of extension)
    const file = bucket.file(basePath)
    // Get the file's metadata to get the correct content type
    const [metadata] = await file.getMetadata().catch(() => [null])

    // If we found a cached file
    if (metadata) {
      const contentType = metadata.contentType || 'application/octet-stream'

      // Create a readable stream from the file
      const fileStream = file.createReadStream()

      // Use NextResponse.json() to create a streaming response
      return new NextResponse(fileStream as unknown as ReadableStream, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': CACHE_CONTROL,
        },
      })
    }

    // Image not cached, fetch from IPFS with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const ipfsUrl = `https://w3s.link/ipfs/${cidPath}`
      const response = await fetch(ipfsUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 Next.js Image Optimization',
        },
      })

      if (!response.ok) {
        throw new Error(`IPFS fetch failed with status: ${response.status}`)
      }

      // Get the content type from the response
      const contentType =
        response.headers.get('Content-Type') || 'application/octet-stream'

      // Create a storage path with the proper extension
      const finalStoragePath = `${basePath}`

      // Create a file reference in Firebase Storage
      const file = bucket.file(finalStoragePath)

      // Create a writable stream to Firebase Storage
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: contentType,
          cacheControl: CACHE_CONTROL,
          metadata: {
            originalCid: cidPath,
            width: width,
            quality: quality,
            cachedAt: new Date().toISOString(),
          },
        },
      })

      // Get the response body as a readable stream
      const responseStream = response.body

      if (!responseStream) {
        throw new Error('No response body stream available')
      }

      // Create a clone of the response to use for the client
      const clonedResponse = response.clone()
      const clientStream = clonedResponse.body

      if (!clientStream) {
        throw new Error('Failed to clone response stream')
      }

      // We'll need to buffer the response for Firebase Storage
      // since stream conversion is tricky in this environment
      const responseBuffer = Buffer.from(await response.arrayBuffer())

      // Write the buffer to Firebase Storage
      const streamPromise = new Promise((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        writeStream.end(responseBuffer)
      })

      // Start the streaming process in the background
      streamPromise.catch((err) => {
        console.error('Error saving to Firebase Storage:', err)
      })

      // Return the image stream directly to the client without waiting for caching to complete
      return new NextResponse(clientStream, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': CACHE_CONTROL,
        },
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error('Image caching error:', error)

    // If the error is a timeout, return a 504 Gateway Timeout
    if ((error as { name: string }).name === 'AbortError') {
      return new NextResponse('Image fetch timed out', { status: 504 })
    }

    // Return error response
    return new NextResponse(
      `Image fetch failed:${(error as { message?: string }).message || 'Unknown error'}`,
      {
        status: 500,
      }
    )
  }
}
