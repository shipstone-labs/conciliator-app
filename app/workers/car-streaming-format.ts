/**
 * CAR-based streaming format that supports efficient range requests
 *
 * Instead of packaging all encrypted chunks in a single CBOR file,
 * we create a manifest + separate chunk files approach:
 *
 * 1. Manifest file (small CBOR file) contains:
 *    - LIT protocol metadata
 *    - Chunk metadata with CIDs
 *    - File metadata
 *
 * 2. Individual chunk files:
 *    - Each chunk stored as separate CAR/raw file
 *    - Enables direct range requests to IPFS gateway
 *    - Only requested chunks are fetched
 */

// Export the chunk size constant
export const CHUNK_SIZE = 1024 * 1024 // 1MB chunks

export interface ChunkInfo {
  cid: string // CID of the encrypted chunk
  offset: number // Byte offset in original file
  size: number // Original chunk size
  encryptedSize: number // Encrypted chunk size
  counter: number // AES-CTR counter for this chunk
}

export interface ManifestV3 {
  version: 'LIT-ENCRYPTED-V3'
  network: string
  contractName: string
  contract: `0x${string}`
  to: `0x${string}`
  dataToEncryptHash: `0x${string}`
  unifiedAccessControlConditions: any[]
  fileMetadata: {
    name: string
    size: number
    type: string
    chunkSize: number
  }
  chunks: ChunkInfo[]
  created: number
}

// V4: Public wrapper with access control conditions
export interface ManifestV4 {
  version: 'LIT-ENCRYPTED-V4'
  accessControlConditions: any[] // Cleartext - needed for LIT to decrypt
  encryptedManifest: string // LIT-encrypted manifest data
  created: number
}

// V4: Encrypted manifest (contains everything including key)
export interface MetadataV4 {
  symmetricKey: Uint8Array // The actual AES key
  iv: Uint8Array // IV for file decryption
  fileHash: `0x${string}` // Hash of original file
  dataToEncryptHash: `0x${string}` // Hash of the symmetric key
  fileMetadata: {
    name: string
    size: number
    type: string
    chunkSize: number
  }
  chunks: ChunkInfo[] // All chunk information
}

/**
 * Calculate byte range needed from a specific chunk
 */
export function getChunkByteRange(
  chunk: ChunkInfo,
  requestedStart: number,
  requestedEnd: number
): { start: number; end: number } | null {
  const chunkEnd = chunk.offset + chunk.size - 1

  // Check if this chunk overlaps with requested range
  if (chunk.offset > requestedEnd || chunkEnd < requestedStart) {
    return null
  }

  // Calculate the byte range within this chunk
  const start = Math.max(0, requestedStart - chunk.offset)
  const end = Math.min(chunk.size - 1, requestedEnd - chunk.offset)

  return { start, end }
}

/**
 * Get chunks needed for a byte range with their internal ranges
 */
export function getChunksForByteRange(
  manifest: ManifestV3,
  start: number,
  end: number
): Array<{ chunk: ChunkInfo; start: number; end: number }> {
  const needed: Array<{ chunk: ChunkInfo; start: number; end: number }> = []

  for (const chunk of manifest.chunks) {
    const range = getChunkByteRange(chunk, start, end)
    if (range) {
      needed.push({ chunk, ...range })
    }
  }

  return needed
}

/**
 * Create a manifest for uploaded chunks
 */
export async function createManifestV3(
  metadata: Omit<ManifestV3, 'version' | 'created'>
): Promise<{ bytes: Uint8Array }> {
  const manifest: ManifestV3 = {
    version: 'LIT-ENCRYPTED-V3',
    created: Date.now(),
    ...metadata,
  }

  // Encode as CBOR
  const { encode } = await import('cbor-x')
  const bytes = encode(manifest)

  return { bytes }
}

/**
 * Parse a manifest from bytes
 */
export async function parseManifestV3(bytes: Uint8Array): Promise<ManifestV3> {
  const { decode } = await import('cbor-x')
  const manifest = decode(bytes) as ManifestV3

  if (manifest.version !== 'LIT-ENCRYPTED-V3') {
    throw new Error('Invalid manifest version')
  }

  return manifest
}

/**
 * Helper to construct gateway URLs for chunks
 */
export function getChunkUrl(
  chunkCid: string,
  gateway = '/api/download'
): string {
  return `${gateway}/${chunkCid}`
}

/**
 * Create a V4 manifest
 */
export async function createManifestV4(
  accessControlConditions: any[],
  encryptedManifest: string
): Promise<{ bytes: Uint8Array }> {
  const manifest: ManifestV4 = {
    version: 'LIT-ENCRYPTED-V4',
    accessControlConditions,
    encryptedManifest,
    created: Date.now(),
  }

  // Encode as CBOR
  const { encode } = await import('cbor-x')
  const bytes = encode(manifest)

  return { bytes }
}

/**
 * Parse a V4 manifest from bytes
 */
export async function parseManifestV4(bytes: Uint8Array): Promise<ManifestV4> {
  const { decode } = await import('cbor-x')
  const manifest = decode(bytes) as ManifestV4

  if (manifest.version !== 'LIT-ENCRYPTED-V4') {
    throw new Error('Invalid manifest version')
  }

  return manifest
}

/**
 * Create metadata bundle for V4
 */
export async function createMetadataV4(
  metadata: MetadataV4
): Promise<{ bytes: Uint8Array }> {
  // Encode as CBOR
  const { encode } = await import('cbor-x')
  const bytes = encode(metadata)

  return { bytes }
}

/**
 * Parse metadata from bytes
 */
export async function parseMetadataV4(bytes: Uint8Array): Promise<MetadataV4> {
  const { decode } = await import('cbor-x')
  return decode(bytes) as MetadataV4
}

/**
 * Fetch only required chunks for a byte range
 */
export async function fetchChunksForRange(
  manifest: ManifestV3,
  start: number,
  end: number,
  gateway = '/api/download'
): Promise<Map<string, ArrayBuffer>> {
  const needed = getChunksForByteRange(manifest, start, end)
  const chunks = new Map<string, ArrayBuffer>()

  // Fetch chunks in parallel
  await Promise.all(
    needed.map(async ({ chunk }) => {
      if (!chunks.has(chunk.cid)) {
        const response = await fetch(getChunkUrl(chunk.cid, gateway))
        if (!response.ok) {
          throw new Error(`Failed to fetch chunk ${chunk.cid}`)
        }
        chunks.set(chunk.cid, await response.arrayBuffer())
      }
    })
  )

  return chunks
}
