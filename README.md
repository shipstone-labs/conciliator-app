# SafeIdea Platform

SafeIdea is an open-source platform for creators to securely store, share, and protect their ideas and digital intellectual property using blockchain technology and AI monitoring.

## What We Offer

* **Secure Storage**: Protect your ideas with blockchain-based encryption via Filecoin and Storacha
* **Controlled Sharing**: Share your ideas with cryptographically verifiable access controls
* **AI Guard Agent**: Monitor and protect against unauthorized use of your intellectual property
* **Multi-page Creation Flow**: Three-step process to protect, share, and guard your ideas

## Architecture

SafeIdea uses Web3 technologies to ensure your intellectual property remains secure:

* **Storage**: Filecoin and Storacha for decentralized, encrypted storage
* **Access Control**: LIT Protocol for token-gated encryption and access management
* **Authentication**: Stytch OTP with LIT PKP wallets - no crypto wallet required
* **AI Processing**: Lilypad for decentralized AI computation
* **Smart Contracts**: Custom IPDocV8 token on Filecoin

## Technology Stack

* **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
* **Backend**: Next.js API Routes, Firebase Admin SDK
* **Blockchain**: Ethers.js, Viem, LIT Protocol SDK
* **Storage**: Storacha Client, Firebase Storage
* **Authentication**: Stytch Next.js SDK
* **Monitoring**: OpenTelemetry, Google Cloud Trace
* **Deployment**: Google Cloud Run

## Getting Started

### Prerequisites

* Node.js 22.13.1 (recommended via mise)
* PNPM 10.11.0
* Google Cloud Platform account with Cloud Run enabled
* Firebase project with Firestore, Auth, and Storage configured

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shipstone-labs/conciliator-app.git
   cd conciliator-app
   ```

2. Install mise for version management:
   ```bash
   # Install mise first, then:
   mise install
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   cp hardhat/.env.example hardhat/.env
   # Fill in all required environment variables
   ```

5. Deploy smart contracts:
   ```bash
   cd hardhat
   npm install
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network hyperspace
   # Note the deployed contract address and update .env files
   npx hardhat run scripts/verify.js --network hyperspace
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

## Project Structure

```
/app                    # Next.js 15 App Router
├── add-ip/            # Multi-page IP creation flow
│   ├── protect/       # Step 1: Basic protection setup
│   ├── share/         # Step 2: Sharing configuration
│   └── guard/         # Step 3: AI monitoring setup
├── api/               # API endpoints
├── details/[id]/      # IP detail views
├── discovery/[id]/    # Interactive Q&A for exploring ideas
├── list-ip/           # Dashboard for managing IP
├── subscription/      # Subscription management
└── ai-home/           # AI-enhanced landing page

/components            # Reusable React components
/hooks                 # Custom React hooks
/lib                   # Shared utilities and types
/browser-testing       # Visual regression and automated testing
/docs                  # Documentation
```

## Testing

The project includes comprehensive testing infrastructure:

* **Pre-commit Testing**: Run `./pre-commit-testing.sh` before committing
* **Visual Regression**: Automated screenshot comparison across devices
* **MCP Puppeteer**: Automated IP creation testing with Claude Code SDK

## Environment Variables

Key environment variables required:

```env
# LIT Protocol
NEXT_PUBLIC_LIT_CONTRACT_ADDRESS=
NEXT_PUBLIC_LIT_RELAY_API_KEY=
LIT_CAPACITY_TOKEN_ID=

# Storacha
STORACHA_AGENT_KEY=
STORACHA_AGENT_DID=
STORACHA_AGENT_PROOF=

# Stytch Authentication
STYTCH_APP_ID=
STYTCH_APP_SECRET=
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=

# Firebase
FIREBASE_SA=
FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_CONFIG=

# AI Services
COMPLETION_API_KEY=
IMAGE_API_KEY=
```

## Deployment

### Google Cloud Run

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or use the deployment script
./gcp-deploy.sh
```

### Local Development with Docker

```bash
# Build dependencies image
docker-compose build dependencies

# Run development environment
docker-compose up
```

## Recent Updates (June 2025)

Development velocity has significantly increased over the past three weeks, with major architectural improvements and feature additions based on user feedback.

* **Multi-Page Add IP Flow**: Implemented new three-step process for creating protected ideas (Protect → Share → Guard)
* **AI Guard Agent**: Beta site evaluators have been helpful in guiding the needs of creators and inventors with intellectual property. The new AI Guard agent was strongly requested, and we're implementing an early version this week
* **Focus Shift**: Transitioned from monetization to IP protection and monitoring based on user needs
* **Testing Infrastructure**: Added comprehensive visual regression testing and automated IP creation testing
* **Performance**: Improved blockchain operation handling and session management
* **Claude PR Assistant**: Integrated automated PR reviews using Claude AI
* **File Upload**: Increased file size limits and refined supported formats for IP documentation

## Known Issues

* Silent failures during blockchain operations need better error handling
* Session timeouts affect longer test runs (~20% failure rate)
* TypeScript compilation errors in pre-commit hooks (use `--no-verify` as workaround)

## Support

For questions about SafeIdea, please contact us at [dev@safeidea.ai](mailto:dev@safeidea.ai)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
