Bump

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
