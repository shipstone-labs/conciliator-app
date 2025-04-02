# Lilypad Wrapper

A browser and Cloudflare-compatible wrapper for Lilypad client with WebAssembly integration.

## Features

- Go WASM integration using TinyGo
- Works in both browser and Cloudflare environments
- No Node.js-specific dependencies in the runtime code
- Base64-encoded WASM embedded in JavaScript

## Development Setup

### Prerequisites

- Node.js 16+
- Go 1.18+
- TinyGo (for WASM compilation)

### Installing TinyGo

#### macOS:
```bash
brew install tinygo
```

#### Linux:
```bash
wget https://github.com/tinygo-org/tinygo/releases/download/v0.28.1/tinygo_0.28.1_amd64.deb
sudo dpkg -i tinygo_0.28.1_amd64.deb
```

#### Windows:
Download from [TinyGo releases](https://github.com/tinygo-org/tinygo/releases) and follow installation instructions.

## Building

```bash
npm run build
```

This will:
1. Compile the Go code to WebAssembly using TinyGo
2. Encode the WASM binary as base64 and embed it in JavaScript
3. Generate the JavaScript wrapper and TypeScript definitions

## Usage

```javascript
import { getLilypadClient } from 'lilypad-wrapper';

// Get a client instance
const lilypad = getLilypadClient();

// Use WASM functionality
async function runWasm() {
  const result = await lilypad.processData('Hello from WASM!');
  console.log(result);
}

// Use Lilypad API functionality
async function generateImage() {
  const imageUrl = await lilypad.generateImage('A beautiful sunset');
  console.log(imageUrl);
}
```

## Browser Usage

The package is designed to work in browsers and Cloudflare Workers without any changes. All WASM code is embedded directly in the JavaScript as base64, eliminating the need for separate file loading.

## Notes for Development

- The Go code in `go/mymodule.go` compiles to WebAssembly
- You don't need to manually run `encode_wasm.js` as it's handled by the build script
- If TinyGo is not installed, the build will use a placeholder WASM file