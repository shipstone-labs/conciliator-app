import { type NextRequest, NextResponse } from 'next/server'
import * as firebase from 'firebase-admin'
import 'firebase-admin/storage'
import { getBucket } from '@/app/api/firebase'

export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ cid: string[] }> }
) {
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

  // Path in Firebase Storage
  const storagePath = `ipfs-cache/${cidPath}_${width}_${quality}.jpg`

  try {
    // Initialize Firebase (also initializes Firestore from your existing code)
    const bucket = getBucket()

    // Check if image exists in Firebase Storage
    const [exists] = await bucket.file(storagePath).exists()

    if (exists) {
      console.log(
        `Serving cached image for CID: ${cidPath} from Firebase Storage`
      )

      // Get image from Firebase Storage
      const [buffer] = await bucket.file(storagePath).download()

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    // Image not cached, fetch from IPFS with timeout
    console.log(`Fetching image for CID: ${cidPath} from IPFS`)
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

      // Get image buffer
      const buffer = Buffer.from(await response.arrayBuffer())

      // Save to Firebase Storage
      const file = bucket.file(storagePath)

      await file.save(buffer, {
        metadata: {
          contentType: response.headers.get('Content-Type') || 'image/jpeg',
          cacheControl: 'public, max-age=31536000, immutable',
        },
      })

      console.log(`Cached image for CID: ${cidPath} in Firebase Storage`)

      // Return the image
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
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
