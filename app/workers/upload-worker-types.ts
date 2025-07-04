import type { SessionSigsMap } from 'lit-wrapper'
import type { MetadataV4 } from './car-streaming-format'

export interface UploadProgress {
  progress: number
  speed: number
  unit?: string
}

export interface WorkerMessage {
  type: 'init' | 'process-file' | 'upload' | 'upload-metadata'
  sessionToken?: string // JWT token for auth
  firebaseToken?: string // Firebase token if needed
  sessionKeys?: SessionSigsMap
  file?: File
  files?: File[]
  encryptionKey?: Uint8Array // base64 encoded
  iv?: Uint8Array // base64 encoded
  contract?: `0x${string}`
  contractName?: string
  to?: `0x${string}`
  unifiedAccessControlConditions?: any
  transportPublicKey?: Uint8Array // base64 encoded
  returnMetadata?: boolean
  useLit?: boolean
  encryptedMetadata?: FileItem[]
}

export interface FileStats {
  total: number
  saved: number
  start: number
}

export interface FileItem {
  metadataBuffer?: Uint8Array
  dataToEncryptHash?: string
  metadata?: MetadataV4
  cid?: string
  fileMetadata: {
    name: string
    size: number
    type: string
    chunkSize: number
  }
  stats: FileStats
}

export interface WorkerResponse {
  type: 'ready' | 'progress' | 'complete' | 'error'
  progress?: UploadProgress
  cid?: string
  result: Array<FileItem>
  error?: string
}
