import { type NextRequest, NextResponse } from 'next/server'
import 'firebase-admin/storage'
import { getBucket } from '@/app/api/firebase'
import { initAPIConfig } from '@/lib/apiUtils'
import sharp from 'sharp'

// Set extremely long cache since IPFS content is immutable (1 year)
const CACHE_CONTROL =
  'public, max-age=31536000, immutable, stale-while-revalidate=31536000'

// Define cache options for the route handler
export const dynamic = 'force-dynamic' // Allow dynamic handling for first request
export const revalidate = false // Don't revalidate automatically
export const fetchCache = 'force-cache' // Use cache when possible

// List of supported image formats for resizing
const RESIZABLE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/gif',
]

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
  const width = Number.parseInt(searchParams.get('width') || '800', 10)
  const quality = Number.parseInt(searchParams.get('quality') || '75', 10)
  const format = searchParams.get('format') || 'webp' // Default to webp for better compression

  // Base storage path (without extension)
  const basePath = `images-cache/${cidPath}_${width}_${quality}_${format}`

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

      // Return streaming response
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
      const sourceContentType =
        response.headers.get('Content-Type') || 'application/octet-stream'

      // Get buffer data from response
      const originalBuffer = Buffer.from(await response.arrayBuffer())

      // Determine output format and content type
      const isResizableFormat = RESIZABLE_FORMATS.includes(sourceContentType)
      const outputFormat = format === 'auto' ? 'webp' : format
      const contentType = `image/${outputFormat}`

      // Only resize if it's a supported image format
      let processedBuffer: Buffer<ArrayBufferLike> = originalBuffer
      let optimizedBuffer: Buffer<ArrayBufferLike> = originalBuffer

      if (isResizableFormat) {
        try {
          // Create Sharp instance from the buffer
          let image = sharp(originalBuffer)

          // Get image metadata
          const metadata = await image.metadata()
          const originalWidth = metadata.width || 0

          // Only resize if requested width is smaller than original or format conversion is needed
          if (
            width < originalWidth ||
            outputFormat !== (metadata.format || '')
          ) {
            // Resize the image
            image = image.resize({
              width: width,
              withoutEnlargement: true, // Don't enlarge if image is smaller than requested width
            })

            // Convert to desired format with quality setting
            switch (outputFormat) {
              case 'jpeg':
                optimizedBuffer = await image.jpeg({ quality }).toBuffer()
                break
              case 'png':
                optimizedBuffer = await image.png({ quality }).toBuffer()
                break
              case 'webp':
                optimizedBuffer = await image.webp({ quality }).toBuffer()
                break
              case 'avif':
                optimizedBuffer = await image.avif({ quality }).toBuffer()
                break
              default:
                optimizedBuffer = await image.webp({ quality }).toBuffer()
                break
            }

            // Use the optimized buffer
            processedBuffer = optimizedBuffer
          }
        } catch (resizeError) {
          console.error('Image resize failed:', resizeError)
          // Fall back to original buffer if resize fails
          processedBuffer = originalBuffer
        }
      }

      // Create a storage path with the proper extension
      const finalStoragePath = basePath

      // Create a file reference in Firebase Storage
      const file = bucket.file(finalStoragePath)

      // Create a writable stream to Firebase Storage
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: contentType,
          cacheControl: CACHE_CONTROL,
          metadata: {
            originalCid: cidPath,
            width: String(width),
            quality: String(quality),
            format: outputFormat,
            cachedAt: new Date().toISOString(),
            optimized: isResizableFormat ? 'true' : 'false',
          },
        },
      })

      // Write the buffer to Firebase Storage
      const streamPromise = new Promise((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        writeStream.end(processedBuffer)
      })

      // Start the storage process in the background
      streamPromise.catch((err) => {
        console.error('Error saving to Firebase Storage:', err)
      })

      // Return the processed image directly to the client
      return new NextResponse(processedBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': CACHE_CONTROL,
          'Content-Length': processedBuffer.length.toString(),
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
