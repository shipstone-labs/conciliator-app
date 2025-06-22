/**
 * Utility functions for base64 encoding/decoding of binary data
 * Used for passing binary data through postMessage between workers and main thread
 */

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000 // Process in chunks to avoid call stack issues
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  // If the Uint8Array is a view into a larger buffer, we need to slice out just the relevant portion
  // Create a new ArrayBuffer with just the data we need
  const buffer = new ArrayBuffer(uint8Array.byteLength)
  new Uint8Array(buffer).set(uint8Array)
  return arrayBufferToBase64(buffer)
}

export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(base64))
}
