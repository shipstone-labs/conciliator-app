# Secure Upload & Download System

This system provides streaming file processing with AES encryption, CBOR packaging in LIT Protocol format, secure key management, and range-request support for media streaming.

## Features

### Upload

- **Full Streaming Pipeline**: Files are processed in chunks without loading into memory
- **AES-CTR Encryption**: Uses streaming-compatible AES-CTR mode for chunk-by-chunk encryption
- **LIT Protocol CBOR Format**: Packages encrypted data in LIT-compatible CBOR structure
- **Storacha Upload**: Direct upload to decentralized storage with authentication
- **Multi-file Support**: Process and package multiple files together
- **Progress Tracking**: Real-time upload progress updates

### Download

- **Service Worker Integration**: Transparent decryption via service worker
- **Range Request Support**: Enables media streaming and partial downloads
- **LIT Protocol Key Management**: Keys are encrypted and access-controlled via LIT
- **IndexedDB Storage**: Session signatures and key metadata stored securely
- **Automatic Format Detection**: Supports both V1 and V2 encrypted formats

## Architecture

### Worker Thread (`upload-worker.ts`)

- Handles all heavy processing in a separate thread
- Manages Storacha client initialization with UCAN delegation
- Creates a streaming pipeline: File → Progress Tracking → Encryption → CBOR Encoding
- Uses TransformStream for chunk-by-chunk processing
- Uploads to Storacha and returns CID

### Streaming Pipeline

1. **File Stream**: Native file.stream() API
2. **Hash Calculation**: SHA-256 hash of original file data
3. **Progress Transform**: Tracks bytes processed
4. **Encryption Transform**: AES-CTR mode for streaming encryption
5. **LIT CBOR Format**: Each file encoded as: `['LIT-ENCRYPTED', network, contractName, contract, to, dataHash, conditions, ...encryptedChunks]`
6. **File Creation**: Converts final stream to File for upload

### V3 File Format - Efficient Range Support

The system uses a manifest + chunks approach for all files:

- **Manifest**: Small CBOR file containing:
  - LIT protocol metadata (contract, access conditions)
  - File metadata (name, size, type)
  - Chunk information (CID, offset, size, counter for each chunk)
  
- **Individual Chunks**: Each 1MB chunk stored separately:
  - Enables true range requests to IPFS gateway
  - Only requested chunks are fetched and decrypted
  - Perfect for streaming large media files
  - Works efficiently even for small files

### Main Thread Client (`upload-worker-client.ts`)

- Provides a clean async/await interface
- Manages worker lifecycle
- Handles progress callbacks
- Includes helper functions for key management

## Usage

### Complete Upload & Download Flow

```typescript
import { UploadWorkerClient } from './upload-worker-client'
import { DownloadClient } from './download-client'
import * as LitJsSdk from '@lit-protocol/lit-node-client'

// 1. Initialize LIT client
const litClient = new LitJsSdk.LitNodeClient({
  litNetwork: 'datil-dev',
})
await litClient.connect()

// 2. Initialize upload client with LIT integration
const uploadClient = new UploadWorkerClient(litClient)
await uploadClient.initKeyManager()

// 3. Get UCAN delegation from your API
const delegation = await fetch('/api/ucan', {
  method: 'POST',
  body: JSON.stringify({ id, did })
}).then(r => r.arrayBuffer())

// 4. Configure LIT protocol parameters
const litConfig = {
  contract: '0x...' as `0x${string}`,
  contractName: 'YourContract',
  to: '0x...' as `0x${string}`,
  unifiedAccessControlConditions: [
    {
      conditionType: 'evmBasic',
      contractAddress: '0x...',
      standardContractType: 'ERC1155',
      chain: 'filecoinCalibrationTestnet',
      method: 'balanceOf',
      parameters: [':userAddress', 'tokenId'],
      returnValueTest: { comparator: '>', value: '0' }
    }
  ]
}

// 5. Upload files (keys are automatically encrypted with LIT)
const result = await uploadClient.uploadFiles({
  files: [file1, file2],
  delegation,
  litClient,
  ...litConfig,
  onProgress: (progress) => console.log(`${progress}% complete`)
})

// 6. Set up download client
const downloadClient = new DownloadClient(litClient)

// 7. Download file (automatic decryption if access conditions are met)
await downloadClient.downloadFile(result.cid, 'myfile.pdf')

// 8. Or stream media with range support
const videoElement = createStreamingMediaElement(result.cid, 'video')
document.body.appendChild(videoElement)
```

### Manual Key Management (without LIT)

```typescript
// Upload without LIT integration
const uploadClient = new UploadWorkerClient()
const result = await uploadClient.uploadFiles({
  files: [file1],
  delegation,
  ...litConfig,
  onProgress: (progress) => console.log(`${progress}% complete`)
})

// Manually store the key securely
const { encryptedKey, iv } = result
// Store these values in your backend...
```

## Security Considerations

1. **LIT Protocol Integration**:
   - Symmetric keys are encrypted using LIT Protocol with access control conditions
   - Only users meeting the conditions can decrypt files
   - Session signatures are stored in IndexedDB with expiry checking

2. **Service Worker Security**:
   - Keys are never stored in plain text in the service worker
   - Communication uses BroadcastChannel for cross-context messaging
   - IndexedDB provides isolated storage per origin

3. **Encryption Details**:
   - AES-CTR mode enables streaming and range requests
   - Each 1MB chunk has its own counter value for proper seeking
   - Original file hash is included for integrity verification

4. **Range Request Support**:
   - V2 format stores chunk metadata for efficient seeking
   - Only required chunks are decrypted for range requests
   - Enables smooth media streaming without full file download

## File Reconstruction

To retrieve and decrypt files:

1. Fetch the encrypted CBOR data using the CID
2. Decrypt using the stored AES key and IV
3. Decode the CBOR data
4. Extract individual files from the decoded structure

## Integration Example

See `example-usage.tsx` for a complete React component demonstrating:

- File selection and upload
- Progress tracking
- Key encryption with password
- Error handling
