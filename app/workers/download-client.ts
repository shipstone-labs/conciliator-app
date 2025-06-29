import { LitKeyManager, setupMainThreadKeyListener } from './lit-key-manager'
import type { LitNodeClient, SessionSigsMap } from 'lit-wrapper'

export class DownloadClient {
  private keyManager: LitKeyManager
  private serviceWorkerReady: Promise<void>
  private cleanupKeyListener: (() => void) | null = null

  constructor(litClient: LitNodeClient) {
    this.keyManager = new LitKeyManager(litClient)
    this.serviceWorkerReady = this.initServiceWorker()
  }

  private async initServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported')
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register(
      '/workers/download-service-worker.js',
      { scope: '/download/' }
    )

    // Wait for activation
    const sw =
      registration.installing || registration.waiting || registration.active
    if (sw && sw.state !== 'activated') {
      await new Promise<void>((resolve) => {
        sw.addEventListener('statechange', function onStateChange() {
          if (sw.state === 'activated') {
            sw.removeEventListener('statechange', onStateChange)
            resolve()
          }
        })
      })
    }

    // Initialize key manager
    await this.keyManager.init()

    // Set up broadcast channel listener
    this.cleanupKeyListener = setupMainThreadKeyListener(this.keyManager)

    // Initialize service worker's key manager
    await this.sendMessageToServiceWorker({ type: 'INIT_KEY_MANAGER' })
  }

  private async sendMessageToServiceWorker(message: any): Promise<any> {
    await this.serviceWorkerReady

    const channel = new MessageChannel()
    const response = new Promise((resolve, reject) => {
      channel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data)
        } else {
          reject(new Error(event.data.error || 'Service worker error'))
        }
      }
    })

    const sw = await navigator.serviceWorker.ready
    sw.active?.postMessage(message, [channel.port2])

    return response
  }

  async updateSessionSigs(sessionSigs: SessionSigsMap): Promise<void> {
    await this.keyManager.storeSessionSigs(sessionSigs)
  }

  async storeEncryptedKey(
    cid: string,
    dataToEncryptHash: `0x${string}`,
    fileHash: `0x${string}`,
    unifiedAccessControlConditions: any[],
    encryptedSymmetricKey: ArrayBuffer,
    iv: Uint8Array
  ): Promise<void> {
    // Combine key and IV
    const combinedKey = new Uint8Array(
      encryptedSymmetricKey.byteLength + iv.length
    )
    combinedKey.set(new Uint8Array(encryptedSymmetricKey), 0)
    combinedKey.set(iv, encryptedSymmetricKey.byteLength)

    // Encrypt with LIT
    const litEncryptedResult = await this.keyManager.encryptSymmetricKey(
      combinedKey.buffer,
      dataToEncryptHash,
      unifiedAccessControlConditions
    )

    // Store metadata
    await this.keyManager.storeKeyMetadata(
      cid,
      dataToEncryptHash,
      fileHash,
      unifiedAccessControlConditions,
      litEncryptedResult.encryptedKey
    )
  }

  async downloadFile(cid: string, filename?: string): Promise<void> {
    await this.serviceWorkerReady

    // The service worker will handle decryption automatically
    const url = `/download/${cid}`

    if (filename) {
      // Download with specific filename
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      // Open in new tab/window
      window.open(url, '_blank')
    }
  }

  async fetchDecryptedFile(cid: string): Promise<Response> {
    await this.serviceWorkerReady

    // Fetch through service worker
    return fetch(`/download/${cid}`)
  }

  cleanup(): void {
    if (this.cleanupKeyListener) {
      this.cleanupKeyListener()
      this.cleanupKeyListener = null
    }
  }
}

// Helper to create download URLs that work with range requests
export function createStreamingMediaElement(
  cid: string,
  type: 'video' | 'audio'
): HTMLVideoElement | HTMLAudioElement {
  const element = document.createElement(type)
  element.src = `/download/${cid}`
  element.preload = 'metadata'

  // Enable range request support
  if (type === 'video') {
    ;(element as HTMLVideoElement).playsInline = true
  }

  return element
}

// Example usage
export async function setupDownloadClient(
  litClient: LitNodeClient,
  options: Parameters<LitNodeClient['getSessionSigs']>[0]
): Promise<DownloadClient> {
  const client = new DownloadClient(litClient)

  // Update session sigs when available
  const sessionSigs = await litClient.getSessionSigs(options)
  if (sessionSigs) {
    await client.updateSessionSigs(sessionSigs)
  }

  return client
}
