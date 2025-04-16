import {
  createWalletClient,
  type Hex,
  hashMessage,
  bytesToHex,
  getAddress,
} from 'viem'
import { publicKeyToAddress } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { KeyManagementServiceClient } from '@google-cloud/kms'

/**
 * KMSWalletClient is a client for interacting with Google Cloud KMS
 * to sign messages and transactions for Ethereum.
 * It uses the KeyManagementServiceClient from the @google-cloud/kms package.
 *
 * NOTE: This is a simplified implementation.
 */
// Create a client for a specific KMS key
export class KMSWalletClient {
  private kmsClient: KeyManagementServiceClient
  private kmsKeyPath: string
  public address: `0x${string}`
  private walletClient: any

  constructor(kmsKeyPath: string, address: `0x${string}`, transport: any) {
    this.kmsClient = new KeyManagementServiceClient()
    this.kmsKeyPath = kmsKeyPath
    this.address = address

    // Create a custom account
    const kmsAccount = {
      address,
      // Custom signing method using KMS
      signMessage: async ({ message }: { message: string | Hex }) => {
        return this.signMessage(message)
      },

      // Sign a transaction with KMS
      signTransaction: async ({ transaction }: { transaction: any }) => {
        return this.signTransaction(transaction)
      },
    }

    // Create the wallet client
    this.walletClient = createWalletClient({
      account: kmsAccount.address,
      chain: mainnet,
      transport,
    })
  }

  // Get the wallet client
  getClient() {
    return this.walletClient
  }

  // Sign a message with KMS
  async signMessage(message: string | Hex): Promise<Hex> {
    // Hash the message in Ethereum format
    const messageHash = hashMessage(message)
    const digest = Buffer.from(messageHash.slice(2), 'hex')

    // Sign with KMS
    const [response] = await this.kmsClient.asymmetricSign({
      name: this.kmsKeyPath,
      digest: {
        sha256: digest,
      },
    })

    // Convert KMS signature to Ethereum format
    if (!response.signature) {
      throw new Error('No signature returned from KMS')
    }

    // Handle signature which could be Uint8Array or string
    const signatureBuffer = Buffer.from(response.signature as Uint8Array)
    const r = signatureBuffer.slice(0, 32)
    const s = signatureBuffer.slice(32, 64)

    // Determine recovery ID (v) - simplified logic
    // In practice, we need to try both v=0 and v=1 to see which one recovers
    // to our address
    const v = 27 // or 28

    // Combine r, s, v into Ethereum signature format
    const ethSignature = bytesToHex(new Uint8Array([...r, ...s, v])) as Hex

    return ethSignature
  }

  // Sign a transaction with KMS
  async signTransaction(transaction: unknown): Promise<Hex> {
    // We need to import specific viem functions to handle transactions
    // This implementation assumes transaction is a properly formatted viem transaction

    // 1. Serialize and hash the transaction
    // For a proper implementation, you would:
    // - Check transaction type (legacy, EIP-1559, etc)
    // - Properly serialize based on type
    // - Hash the transaction

    // For now, simplified example assuming we have a hash to sign
    const transactionObj = transaction as { hash?: Hex }

    if (!transactionObj.hash) {
      throw new Error('Transaction must contain a hash field')
    }

    const digest = Buffer.from(transactionObj.hash.slice(2), 'hex')

    // 2. Sign with KMS
    const [response] = await this.kmsClient.asymmetricSign({
      name: this.kmsKeyPath,
      digest: {
        sha256: digest,
      },
    })

    // 3. Process signature
    if (!response.signature) {
      throw new Error('No signature returned from KMS')
    }

    const signatureBuffer = Buffer.from(response.signature as Uint8Array)
    const r = signatureBuffer.slice(0, 32)
    const s = signatureBuffer.slice(32, 64)

    // 4. Determine recovery ID - in practice need to compute this correctly
    const v = 27 // or 28 depending on recovery

    // 5. Combine r, s, v into Ethereum signature format
    return bytesToHex(new Uint8Array([...r, ...s, v])) as Hex
  }

  // Static method to create a client from a KMS key
  static async fromKMSKey(
    kmsKeyPath: string,
    transport: any
  ): Promise<KMSWalletClient> {
    // Get the Ethereum address from the KMS public key
    const address = await getEthereumAddressFromKMS(kmsKeyPath)

    // Create the client
    return new KMSWalletClient(kmsKeyPath, address, transport)
  }
}

/**
 * Derives an Ethereum address from a Google Cloud KMS key
 * @param kmsKeyPath The full path to the KMS key
 * @returns The Ethereum address as a 0x-prefixed string
 */
export async function getEthereumAddressFromKMS(
  kmsKeyPath: string
): Promise<`0x${string}`> {
  const kmsClient = new KeyManagementServiceClient()

  // Get the public key from KMS
  const [publicKeyResponse] = await kmsClient.getPublicKey({
    name: kmsKeyPath,
  })

  if (!publicKeyResponse.pem) {
    throw new Error('No public key returned from KMS')
  }

  // Extract the public key from PEM format
  const pemContent = publicKeyResponse.pem

  // Parse the PEM to extract the raw public key
  // PEM format typically looks like:
  // -----BEGIN PUBLIC KEY-----
  // Base64EncodedData
  // -----END PUBLIC KEY-----
  const base64Key = pemContent
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')

  const derKey = Buffer.from(base64Key, 'base64')

  // For Ethereum, we need the uncompressed public key without the prefix
  // This is a simplified implementation - in practice, you need to parse the ASN.1 DER structure
  // and extract the actual EC point data

  // If the key is already in the right format, you can skip the ASN.1 parsing
  // and use this simpler approach, assuming you can extract just the EC point coordinates:

  // Example - this assumes you've already extracted just the X and Y coordinates (65 bytes, uncompressed)
  // For a real implementation, you'd need to parse the ASN.1 structure properly

  // Let's say we've extracted the public key in the uncompressed format: 0x04 + X + Y
  // This is a placeholder - replace with proper ASN.1 parsing
  const uncompressedPublicKey = extractUncompressedPublicKeyFromDER(derKey)

  // Convert the uncompressed public key to an Ethereum address using viem
  const address = publicKeyToAddress(uncompressedPublicKey)

  // Ensure the address is checksummed
  return getAddress(address)
}

/**
 * Extract the uncompressed public key from a DER-encoded structure
 * Note: This is a simplified implementation. For production, use a proper ASN.1 parser
 *
 * @param derKey DER-encoded key data
 * @returns Uncompressed public key as a 0x-prefixed hexadecimal string
 */
function extractUncompressedPublicKeyFromDER(derKey: Buffer): `0x${string}` {
  // This is a simplified implementation - in a real-world scenario,
  // you would need to properly parse the ASN.1 DER structure

  // In practice, the DER format for EC public keys contains several nested structures:
  // 1. The outer SEQUENCE container
  // 2. The algorithm identifier (another SEQUENCE)
  // 3. The BIT STRING containing the actual key data

  // For demonstration purposes, let's assume we can find the bit string with the key data
  // You would replace this with a proper ASN.1 parser in production code

  // Find the BIT STRING tag (0x03) - this is a simplification
  let index = 0
  while (index < derKey.length) {
    if (derKey[index] === 0x03) {
      // Found the BIT STRING
      // Skip the tag, length, and unused bits byte
      const bitStringStart = index + 2 // Skip tag and length byte
      const bitStringLength = derKey[index + 1]

      // The first byte of the bit string is the number of unused bits (usually 0)
      const keyDataStart = bitStringStart + 1

      // Extract the key data - this may need to be adjusted based on the actual format
      // For EC keys, this is typically the uncompressed point format (0x04 | X | Y)
      const keyData = derKey.slice(
        keyDataStart,
        keyDataStart + bitStringLength - 1
      )

      // Check if it already has the 0x04 prefix (uncompressed point format)
      if (keyData[0] === 0x04) {
        // It's already in the right format
        return bytesToHex(keyData) as `0x${string}`
      }
      // This is just a placeholder - you might need different logic based on the actual format
      throw new Error('Unexpected public key format')
    }
    index++
  }

  throw new Error('Could not extract public key from DER encoding')
}
