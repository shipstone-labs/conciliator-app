# Welcome to SafeIdea (Formerly Known as Conciliator) Project

SafeIdea is an open source project designed to support creators and inventors of digital content. While copying is inevitable in the digital realm, we want to provide a framework for makers to benefit from their work.

Our design encrypts digital IP and enables secure sharing, giving creators control over their content. We're also developing tools to improve content discovery and streamline transactions, making it easier for users to find and access digital creations legitimately.

This is a new project, and we're actively seeking community feedback on our approach. We believe there's a significant need for this solution - especially for intellectual property, which is our primary focus. We're building a decentralized ecosystem that respects creator rights while facilitating appropriate sharing and use.

Here's a [document](https://docs.google.com/document/d/1sihbZLf_Fe7XpKER9ZvnDbRSwZmdB2FG01aRiHBhEa4/edit?usp=sharing)
that describes what we're doing in a little more detail. If you don't want to read it, you might try the [podcast version](https://drive.google.com/file/d/1AK3WYfvAfL9b75VW3unMNIjBW35LRDLt/view?usp=sharing) made by [notebooklm](https://notebooklm.google.com/).  There's also a slideshow [here](https://shipstone.com/preso).

Thanks for your interest!

## Getting Started

Initially make a copy of .env.example to .env and then
fill in all the secrets in .env

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

## Support

If you have questions about the Conciliator Project, please reach out to the team at Cart@shipstone.com.

## Deployment

This project is configured for deployment on Cloudflare Pages with automatic builds and previews for each PR.
Currently we have moved to a cloudbuild.yaml and corresponding Docker build.
This is due to the fact that the LIT and Storacha libraries are not 100% compatible with runtime = 'edge'.
So instead this is currently being deployed using runtime = 'nodejs'
To do the deployment in cloudrun. Setup a google secret and put the .env content in it. Then map the file
to /env/.env inside of the container instance.

## Support

If you have questions about SafeIdea, please ping us at dev@safeidea.ai
