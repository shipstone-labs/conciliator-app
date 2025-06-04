## SafeIdea Platform

SafeIdea is an open-source platform for creators to securely store, share, and monetize their **ideas** (digital intellectual property and other digital assets).

## What We Offer

* Secure Storage: Protect your ideas with blockchain-based encryption
* Controlled Sharing: Share your ideas without risking theft
* Monetization: Sell access to your intellectual property
* AI Sales Agents: Custom agents designed for each idea

## How It Works

SafeIdea uses a downsampling technique to support discovery while protecting your IP. Our platform encrypts your content and only shows downsampled versions during AI interactions.

[View our detailed workflow PDF](https://drive.google.com/file/d/11snQ9pTAOlVYYIaHupaVc-TqXf16vEJe/view?usp=sharing)

## Technology Stack

* Storage: Filecoin and Storacha for secure, decentralized storage
* Computation: Lilypad for decentralized AI processing (temporarily disabled)
* Access Control: LIT Protocol for token-gated encryption
* Authentication: Stytch OTP with LIT PKP wallets

## Current Status

Add, share, sell access to, and create agents for your ideas at https://SafeIdea.net

* No crypto wallet required
* Web2-friendly interface
* Working toward beta release this month
* Currently running on testnets

Try it today! Tell us what you think!

## Getting Started

### Prerequisites

* Node.js 22.13.1 (defined in mise)
* PNPM 10.7.1
* GCP using Cloudrun (this should eventually work in cloudflare and vercel again, but currently runtime=edge has incompatibilities)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/shipstone-labs/conciliator-app.git
   cd conciliator-app
   ```

2. Install [mise](https://mise.jdx.dev/getting-started.html)
  first or manage node@22.13.1 and pnpm@10.7.1. Later versions will most likely work but these are the versions used. You're welcome to use asdf or nvm, but you'd have to manually assure all the versions.

    ```bash
    mise install
    ```

3. Install dependencies:

    ```bash
    pnpm install
    ```

4. Create a `.env.local` file with all the required environment variables in `.env.local.example`

    i.e.

    ```bash
    cp .env.local.example .env.local
    cp hardhat/.env.example hardhat/.env
    # Fill out .env.local and hardhat/.env.example
    ```

    and then fillin all the environment variables. The PK is in both .env files.

5. Deploy the IPDocV8 token

    ```bash
    cd hardhat
    npm install
    npx hardhat compile
    npx hardhat run scripts/deploy.js --network hyperspace
    ```

    Watch which new buildInfo is generated.
    Add the buildinfo path and the token address into the verify.js file.
    Put the deployed contract and your PK address (listed during deploy)

    ```.env
    NEXT_PUBLIC_LIT_CONTRACT_ADDRESS=0x79665408484fFf9dC7b0BC6b0d42CB18866b9311
    NEXT_PUBLIC_LIT_ADDRESS=0xa6985f885c29cff477212ba5b2fb7679f83555b6
    ```

    ```bash
    npx hardhat run script/verify.js --network hyperspace
    ```

    This will verify the contract on filfox for filecoin calibration.

6. Get a capacity token for LIT using the lit explorer and faucet and put the tokenID. And get a relayer api key (although I was able to get test-api-key to work for now)

    ```.env
    LIT_CAPACITY_TOKEN_ID=
    NEXT_PUBLIC_LIT_RELAY_API_KEY=test-api-key
    ```

7. Create a storacha space, key and delegation proof and put them

    ```.env
    STORACHA_AGENT_KEY=
    STORACHA_AGENT_DID=
    STORACHA_AGENT_PROOF=
    ```

    The proof has to be base64 encoded.

8. Create a stytch project and setup

    ```.env
    STYTCH_APP_ID=
    STYTCH_APP_SECRET=
    STYTCH_ENV=test
    NEXT_PUBLIC_STYTCH_PROJECT_ENV=test
    NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=
    NEXT_PUBLIC_STYTCH_APP_ID=
    ```

9. Create a firebase and store sa and credentials (this is assuming firestore, auth and storage is setup) It's not using firebase signing, so you don't need to setup any specific login.

    You'll need to single line the JSON to put them into the environment variables. `jq -c FILE` should do it.
    The SA is a service account using JSON and the Config is what you see when connecing a web app to firebase.

    ```.env
    FIREBASE_SA=
    FIREBASE_PROJECT_ID=c
    NEXT_PUBLIC_FIREBASE_CONFIG=
    ```

10. Get a anura-testnet lilypad api key and put it into.

    ```.env
    COMPLETION_API_KEY=
    ```

11. For image generation we're currently using openai due to time constraints (this will change soon.)

    ```.env
    IMAGE_API_KEY=
    IMAGE_PROJECT_ID=
    IMAGE_ORGANIZATION_ID=
    ```

### Development

1. Start the development server:

   ```bash
   pnpm dev
   ```

   Connect with browser to [dev](http://localhost:3000)

   Note that this has to be configured in stytch as a valid redirect and domain.

### Deployment (Deprecated Cloudflare due to runtime=edge problems)

This project is configured for deployment on Cloudflare Pages with automatic builds and previews for each PR.

The application is deployed on Cloudflare Pages.

1. Build for Cloudflare:

   ```bash
   pnpm pages:build
   ```

2. Deploy using Wrangler:

   ```bash
   pnpm wrangler publish
   ```

### Deployment (cloudrun using cloudbuild)

Currently we have moved to a cloudbuild.yaml and corresponding Docker build.
This is due to the fact that the LIT and Storacha libraries are not 100% compatible with runtime = 'edge'.
So instead this is currently being deployed using runtime = 'nodejs'
To do the deployment in cloudrun. Setup a google secret and put the .env content in it. Then map the file
to /env/.env inside of the container instance.
There is active work on trying to go back to cloudflare, vercel or fleek to make it easier to manage.

## Project Structure

SafeIdea follows a Next.js application structure:

* **`/app`**: Next.js 13 App Router pages and API routes
  * `/api`: Backend API endpoints for IPFS storage, authentication, and data retrieval
  * `/details/[id]`: Idea details view
  * `/discovery/[id]`: Interactive Q&A interface for exploring ideas
  * `/add-ip`: Form to add new intellectual property
  * `/list-ip`: Dashboard to view and manage IP

* **`/components`**: Reusable React components
  * UI components based on Shadcn UI
  * Auth components for user authentication
  * IP management components

* **`/hooks`**: Custom React hooks
  * `useIP`: Hook for IP data fetching and management
  * `useSession`: Authentication state management
  * `useConfig`: Configuration management

* **`/lib`**: Shared utilities and types
  * API client utilities
  * Type definitions
  * Constants

## Key Features

* **Secure IP Storage**: Store IP documents with encryption on IPFS
* **Authentication**: User authentication via Stytch
* **IP Discovery**: AI-driven Q&A interface for exploring IP details
* **IPFS Integration**: Decentralized storage for IP content and metadata
* **Blockchain Integration**: NFT creation for IP ownership verification

## Commands

* `pnpm dev`: Start the development server
* `pnpm build`: Build the application for production
* `pnpm start`: Start the production server
* `pnpm pages:build`: Build for Cloudflare Pages deployment

## Contributing

We welcome contributions to SafeIdea! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you have questions about SafeIdea, please contact us at [email](mailto:dev@safeidea.ai)

## force

Deploy 1
