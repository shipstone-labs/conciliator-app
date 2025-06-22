/// <reference lib="webworker" />

import { decode } from 'cbor-x'
import { ServiceWorkerKeyManager } from './lit-key-manager'
import {
  getChunksForByteRange,
  parseMetadataV4,
  type ManifestV3,
  type ManifestV4,
  type MetadataV4,
} from './car-streaming-format'

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

    // Get decryption key from LIT protocol
    const keyData = await keyManager.getDecryptionKey(cid)
    if (!keyData) {
      return new Response('Decryption key not available or access denied', {
        status: 403,
      })
    }

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

    // For V2 format with range support, we need to fetch metadata first
    // Try a small range request to get just the CBOR header
    const metadataResponse = await fetch(`/api/download/${cid}`, {
      headers: {
        Range: 'bytes=0-65535', // First 64KB should contain metadata
      },
    })

    if (!metadataResponse.ok && metadataResponse.status !== 206) {
      return new Response('Failed to fetch encrypted data', {
        status: metadataResponse.status,
      })
    }

    // Get the metadata portion
    const metadataBuffer = await metadataResponse.arrayBuffer()

    // Try to decode just the header to check version
    let decoded: any

    try {
      decoded = decode(new Uint8Array(metadataBuffer))
      // If we successfully decoded, we got the full structure in first 64KB
    } catch {
      // Partial decode failed, need to fetch more data for metadata
      // For now, fetch the whole file (can be optimized further)
      const fullResponse = await fetch(`/api/download/${cid}`)
      const fullData = await fullResponse.arrayBuffer()
      decoded = decode(new Uint8Array(fullData))
    }

    // Check format version
    const protocolVersion = decoded.version || decoded[0]

    if (protocolVersion === 'LIT-ENCRYPTED-V4') {
      // V4 format with encrypted metadata
      return handleV4Download(
        cid,
        decoded as ManifestV4,
        keyData,
        rangeStart,
        rangeEnd
      )
    }
    if (protocolVersion === 'LIT-ENCRYPTED-V3') {
      // V3 format with efficient chunk-based range support
      return handleV3Download(
        cid,
        decoded as ManifestV3,
        keyData,
        rangeStart,
        rangeEnd
      )
    }
    if (decoded.version === 'MULTI-FILE-INDEX') {
      // Multi-file index - return index for now
      return new Response(JSON.stringify(decoded, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    return new Response(
      'Unsupported file format. Please use V4 format for new uploads.',
      { status: 400 }
    )
  } catch (error) {
    console.error('Download error:', error)
    return new Response('Failed to decrypt file', { status: 500 })
  }
}

// Removed V1 and V2 handlers - only supporting V3 format

function guessContentType(data: Uint8Array): string {
  // Check magic bytes for common file types
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return 'image/png'
  }
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return 'image/gif'
  }
  if (
    data[0] === 0x25 &&
    data[1] === 0x50 &&
    data[2] === 0x44 &&
    data[3] === 0x46
  ) {
    return 'application/pdf'
  }
  if (
    data[0] === 0x50 &&
    data[1] === 0x4b &&
    data[2] === 0x03 &&
    data[3] === 0x04
  ) {
    return 'application/zip'
  }

  // Check if it's likely text
  const sample = data.slice(0, Math.min(512, data.length))
  const textDecoder = new TextDecoder('utf-8', { fatal: true })
  try {
    textDecoder.decode(sample)
    return 'text/plain'
  } catch {
    return 'application/octet-stream'
  }
}

async function handleV4Download(
  _manifestCid: string,
  manifest: ManifestV4,
  _keyData: { key: CryptoKey; iv: Uint8Array }, // Not used - key is in metadata
  rangeStart: number,
  rangeEnd?: number
): Promise<Response> {
  try {
    // Fetch metadata
    const metadataResponse = await fetch(
      `/api/download/${manifest.metadataCID}`
    )
    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch metadata')
    }

    const metadataBuffer = await metadataResponse.arrayBuffer()

    // Parse metadata (it might be RSA encrypted or plain)
    let metadata: MetadataV4
    try {
      // Try to parse as CBOR directly
      metadata = await parseMetadataV4(new Uint8Array(metadataBuffer))
    } catch {
      // If parsing failed, it might be RSA encrypted
      // In production, you'd handle RSA decryption here
      throw new Error(
        'Enhanced security decryption not implemented in service worker'
      )
    }

    // Extract key and IV from metadata
    const key = await crypto.subtle.importKey(
      'raw',
      metadata.symmetricKey,
      { name: 'AES-CTR', length: 256 },
      false,
      ['decrypt']
    )

    const keyData = { key, iv: metadata.iv }

    // Now use the metadata to handle the download
    return handleV3DownloadWithMetadata(metadata, keyData, rangeStart, rangeEnd)
  } catch (error) {
    console.error('V4 download error:', error)
    return new Response('Failed to process V4 manifest', { status: 500 })
  }
}

async function handleV3DownloadWithMetadata(
  metadata: MetadataV4,
  keyData: { key: CryptoKey; iv: Uint8Array },
  rangeStart: number,
  rangeEnd?: number
): Promise<Response> {
  // Create a V3-compatible manifest from V4 metadata
  const v3Manifest: ManifestV3 = {
    version: 'LIT-ENCRYPTED-V3',
    network: metadata.network,
    contractName: metadata.contractName,
    contract: metadata.contract,
    to: metadata.to,
    dataToEncryptHash: metadata.fileHash, // Using fileHash for compatibility
    unifiedAccessControlConditions: metadata.unifiedAccessControlConditions,
    fileMetadata: metadata.fileMetadata,
    chunks: metadata.chunks,
    created: Date.now(),
  }

  // Use existing V3 logic
  return handleV3Download('', v3Manifest, keyData, rangeStart, rangeEnd)
}

async function handleV3Download(
  _manifestCid: string,
  manifest: ManifestV3,
  keyData: { key: CryptoKey; iv: Uint8Array },
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

  // Fetch only the required chunks from IPFS
  const decryptedChunks: Uint8Array[] = []
  let totalDecryptedSize = 0

  for (const { chunk, start, end } of neededChunks) {
    // Fetch encrypted chunk from IPFS
    const chunkResponse = await fetch(`/api/download/${chunk.cid}`)
    if (!chunkResponse.ok) {
      throw new Error(`Failed to fetch chunk ${chunk.cid}`)
    }

    const encryptedData = await chunkResponse.arrayBuffer()

    // Create counter for this chunk
    const chunkIv = new Uint8Array(16)
    chunkIv.set(keyData.iv.slice(0, 12))
    const view = new DataView(chunkIv.buffer)
    view.setUint32(12, chunk.counter, false)

    // Decrypt chunk
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CTR', counter: chunkIv, length: 64 },
      keyData.key,
      new Uint8Array(encryptedData)
    )

    // Extract only the needed bytes from this chunk
    const chunkData = new Uint8Array(decrypted).slice(start, end + 1)
    decryptedChunks.push(chunkData)
    totalDecryptedSize += chunkData.length
  }

  // Combine decrypted chunks
  const decryptedData = new Uint8Array(totalDecryptedSize)
  let offset = 0

  for (const chunk of decryptedChunks) {
    decryptedData.set(chunk, offset)
    offset += chunk.length
  }

  // Determine content type
  const contentType =
    manifest.fileMetadata.type || guessContentType(decryptedData)

  // Create response with appropriate status and headers
  const status = rangeStart > 0 || rangeEnd !== undefined ? 206 : 200
  const headers: HeadersInit = {
    'Content-Type': contentType,
    'Content-Length': decryptedData.length.toString(),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  }

  if (status === 206) {
    headers['Content-Range'] =
      `bytes ${rangeStart}-${rangeStart + decryptedData.length - 1}/${fileSize}`
  }

  // Add Content-Disposition header if we have filename
  if (manifest.fileMetadata.name) {
    headers['Content-Disposition'] =
      `inline; filename="${manifest.fileMetadata.name}"`
  }

  return new Response(decryptedData, { status, headers })
}

// Install and activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
