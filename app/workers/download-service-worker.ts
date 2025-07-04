/// <reference lib="webworker" />

import { ServiceWorkerKeyManager } from './lit-key-manager'
import { getChunksForByteRange, type MetadataV4 } from './car-streaming-format'

declare const self: ServiceWorkerGlobalScope

// Initialize key manager
const keyManager = new ServiceWorkerKeyManager()
let keyManagerInitialized = false

// Initialize on first request
async function ensureKeyManager() {
  if (!keyManagerInitialized) {
    await keyManager.init()
    keyManagerInitialized = true
  }
}

// Message handler for initialization
self.addEventListener('message', async (event) => {
  if (event.data.type === 'INIT_KEY_MANAGER') {
    try {
      await ensureKeyManager()
      event.ports[0]?.postMessage({ success: true })
    } catch (error) {
      event.ports[0]?.postMessage({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize key manager',
      })
    }
  }
})

// Fetch handler for /download/CID routes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Check if this is a download request
  const match = url.pathname.match(/^\/download\/(.+)$/)
  if (!match) return

  const cid = match[1]
  event.respondWith(handleDownload(cid, event.request))
})

async function handleDownload(
  cid: string,
  request: Request
): Promise<Response> {
  try {
    // Ensure key manager is initialized
    await ensureKeyManager()

    // Get the manifest and crypto key (works for both CID and manifest-based downloads)
    const result = await keyManager.getManifestAndKey(cid)
    if (!result) {
      return new Response('Manifest not available or access denied', {
        status: 403,
      })
    }

    const { manifest, cryptoKey, iv } = result

    // Parse range header if present
    const range = request.headers.get('range')
    let rangeStart = 0
    let rangeEnd: number | undefined

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/)
      if (match) {
        rangeStart = Number.parseInt(match[1])
        rangeEnd = match[2] ? Number.parseInt(match[2]) : undefined
      }
    }

    // Now we have a unified manifest format, handle the download
    return handleManifestDownload(manifest, cryptoKey, iv, rangeStart, rangeEnd)
  } catch (error) {
    console.error('Download error:', error)
    return new Response('Failed to decrypt file', { status: 500 })
  }
}

function cidAsURL(cid?: string) {
  if (!cid) {
    throw new Error('Invalid CID')
  }
  const [seg0, ...segs] = cid.split('/')
  return `https://${seg0}.ipfs.w3s.link/${segs.join('/')}`
}

// Unified handler for manifest-based downloads
async function handleManifestDownload(
  manifest: MetadataV4,
  cryptoKey: CryptoKey,
  iv: Uint8Array,
  rangeStart: number,
  rangeEnd?: number
): Promise<Response> {
  const fileSize = manifest.fileMetadata.size
  const effectiveRangeEnd = rangeEnd ?? fileSize - 1

  // Get chunks needed for this range
  const neededChunks = getChunksForByteRange(
    manifest,
    rangeStart,
    effectiveRangeEnd
  )

  if (neededChunks.length === 0) {
    return new Response('Requested range not satisfiable', {
      status: 416,
      headers: {
        'Content-Range': `bytes */${fileSize}`,
      },
    })
  }

  // Create decryption stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const chunkRequest of neededChunks) {
          // Fetch encrypted chunk
          const chunkResponse = await fetch(cidAsURL(chunkRequest.chunk.cid))
          if (!chunkResponse.ok) {
            throw new Error(
              `Failed to fetch chunk ${chunkRequest.chunk.cid}: ${chunkResponse.status}`
            )
          }

          const encryptedData = new Uint8Array(
            await chunkResponse.arrayBuffer()
          )

          // Decrypt chunk with proper counter
          const decryptedChunk = await decryptChunk(
            encryptedData,
            cryptoKey,
            iv,
            chunkRequest.chunk.counter
          )

          // Extract only the requested portion
          const chunkData = decryptedChunk.slice(
            chunkRequest.start,
            chunkRequest.end + 1
          )
          controller.enqueue(chunkData)
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  const contentLength = effectiveRangeEnd - rangeStart + 1
  const headers: HeadersInit = {
    'Content-Type': manifest.fileMetadata.type || 'application/octet-stream',
    'Content-Length': contentLength.toString(),
    'Content-Disposition': `attachment; filename="${manifest.fileMetadata.name}"`,
    'Accept-Ranges': 'bytes',
  }

  if (rangeStart > 0 || effectiveRangeEnd < fileSize - 1) {
    headers['Content-Range'] =
      `bytes ${rangeStart}-${effectiveRangeEnd}/${fileSize}`
    return new Response(stream, { status: 206, headers })
  }

  return new Response(stream, { headers })
}

async function decryptChunk(
  encryptedData: Uint8Array,
  key: CryptoKey,
  baseIv: Uint8Array,
  counter: number
): Promise<Uint8Array> {
  // Create IV for this chunk by adding counter to base IV
  const chunkIv = new Uint8Array(16)
  chunkIv.set(baseIv)

  // Add counter to IV (big-endian)
  let carry = counter
  for (let i = 15; i >= 0 && carry > 0; i--) {
    const sum = chunkIv[i] + (carry & 0xff)
    chunkIv[i] = sum & 0xff
    carry = (carry >>> 8) + (sum >>> 8)
  }

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-CTR',
      counter: chunkIv,
      length: 128,
    },
    key,
    encryptedData
  )

  return new Uint8Array(decrypted)
}

// Install and activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
