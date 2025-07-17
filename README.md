# Conciliator - SafeIdea Platform

A decentralized platform for protecting and monitoring digital intellectual property using blockchain technology and AI.

**Try it out at [safeidea.net](https://safeidea.net)**

## Overview

Conciliator implements the SafeIdea protocol - infrastructure that bridges cryptographic ownership with practical control of digital assets. Built for the era where AI agents need to autonomously transact with digital content, we provide creators with tools to protect, share, and monitor their intellectual property without intermediaries.

## Core Features

* **Encrypted Storage**: Blockchain-based encryption via Filecoin and Storacha
* **Access Control**: Token-gated encryption using LIT Protocol
* **AI Monitoring**: Automated detection of unauthorized IP usage
* **Legal Evidence**: Generate court-admissible documentation for IP protection
* **No Wallet Required**: Stytch OTP authentication with LIT PKP wallets

## Tech Stack

* **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
* **Blockchain**: Ethers.js, Viem, LIT Protocol SDK
* **Storage**: Storacha Client, IPFS, Filecoin
* **AI**: Lilypad for decentralized computation
* **Auth**: Stytch Next.js SDK
* **Backend**: Firebase (Firestore, Storage, Functions)
* **Monitoring**: OpenTelemetry, Google Cloud Trace

## Quick Start

### Prerequisites

* Node.js 22.13.1 (use mise for version management)
* PNPM 10.11.0
* Google Cloud Platform account
* Firebase project

### Setup

```bash
# Clone and install
git clone https://github.com/shipstone-labs/conciliator-app.git
cd conciliator-app
mise install
pnpm install

# Configure environment
cp .env.local.example .env.local
cp hardhat/.env.example hardhat/.env
# Fill in required environment variables

# Deploy contracts
cd hardhat
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network hyperspace
# Update .env with deployed contract address
npx hardhat run scripts/verify.js --network hyperspace

# Start development
pnpm dev
```

## Architecture

```
/app                    # Next.js 15 App Router
├── api/               # API endpoints
├── details/[id]/      # IP detail views
├── discovery/[id]/    # Interactive Q&A for ideas
├── list-ip/           # Dashboard
└── ai-home/           # Landing page

/components            # React components
/hooks                 # Custom hooks
/lib                   # Utilities and types
/hardhat              # Smart contracts
/browser-testing      # Automated testing
```

## Key Environment Variables

```env
# LIT Protocol
NEXT_PUBLIC_LIT_CONTRACT_ADDRESS=
NEXT_PUBLIC_LIT_RELAY_API_KEY=
LIT_CAPACITY_TOKEN_ID=

# Storacha
STORACHA_AGENT_KEY=
STORACHA_AGENT_DID=
STORACHA_AGENT_PROOF=

# Stytch
STYTCH_APP_ID=
STYTCH_APP_SECRET=
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=

# Firebase
FIREBASE_SA=
FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_CONFIG=
```

## Testing

```bash
# Pre-commit tests
./pre-commit-testing.sh

# Visual regression
pnpm test:visual

# MCP Puppeteer tests
pnpm test:mcp
```

## Deployment

```bash
# Google Cloud Run
./gcp-deploy.sh

# Docker local
docker-compose up
```

## Recent Updates (June 2025)

* **AI Guard Agent**: Early version implementing FHE-based IP monitoring
* **Improved Testing**: Visual regression and automated IP creation testing
* **Performance**: Enhanced blockchain operation handling and session management
* **Claude PR Assistant**: Automated PR reviews
* **File Upload**: Increased limits and refined format support

## Known Issues

* Blockchain operation error handling needs improvement
* Session timeouts affect test runs (~20% failure rate)
* TypeScript compilation errors in pre-commit hooks (workaround: `--no-verify`)

## Contributing

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for guidelines.

## Support

Contact: [dev@safeidea.ai](mailto:dev@safeidea.ai)

## License

Apache License 2.0 - see [LICENSE](LICENSE)