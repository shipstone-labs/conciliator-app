Welcome to the Conciliator Project

Conciliator is a open source project that explores how to best work with AI agents that search for IP. It provides an effective way to enable discovery of IP while protecting the interests of the IP inventors and/or owners. 

This is an experimental part of the SafeIdea project that we're working on. Ping us at Cart@shipstone.com to learn more.

Also, we wanted to demonstrate how different LLMs can talk to eachother. Here's an informative conversation with Google Gemini: https://docs.google.com/document/d/e/2PACX-1vQYlzI-nmG1LpdEigAESJ_njDDtylSxnsx40RXAo7mYkfib57Q1E6yfhNM5erBKr_SqM4uxjDSo42_j/pub

Unfortunately, this still does not work, although we think that most LLMs will have operator functionality this year so that they can generate any API they need on the fly. "No API is the best API!"

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

Install [mise](https://mise.jdx.dev/getting-started.html) first or 
manage node@22.13.1 and pnpm@10.3.0. Later versions will most likely work
but these are the versions used.

```bash
mise install
```

```bash
pnpm install
```

```bash
cp .env.local.example .env.local
cp hardhat/.env.example hardhat/.env
# Fill out .env.local and hardhat/.env.example
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This is currently being deployed on cloudflare and should work in fleek.

Force re-deploy.