// Handle handlebars templates
declare module '*.hbs' {
  const content: string
  export default content
}

declare module 'cbor-web' {
  export function decodeAll(data: Buffer | Uint8Array): Promise<any[]>
  export function encode(data: any): Buffer | Uint8Array
  export function decode(data: Buffer | Uint8Array): any

  // Add additional functions as needed
  export function decodeFirst(data: Buffer | Uint8Array): Promise<any>
  export function encodeAsync(data: any): Promise<Buffer | Uint8Array>

  // Add the default export as well
  const cbor: {
    decodeAll: typeof decodeAll
    encode: typeof encode
    decode: typeof decode
    decodeFirst: typeof decodeFirst
    encodeAsync: typeof encodeAsync
  }
  export default cbor
}
