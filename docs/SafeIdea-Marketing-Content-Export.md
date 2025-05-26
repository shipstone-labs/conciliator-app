# SafeIdea Platform - Marketing Content Export

> **Exported from**: SafeIdea Conciliator App Repository  
> **Date**: January 25, 2025  
> **Source Repository**: https://github.com/shipstone-labs/conciliator-app

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Marketing & Subscription Pages](#marketing--subscription-pages)
   - [Homepage (Marketing)](#homepage-marketing)
   - [How It Works](#how-it-works)
   - [Subscription Assessment](#subscription-assessment)
   - [Plans Comparison](#plans-comparison)
   - [Basic Plan Details](#basic-plan-details)
   - [Secure Plan Details](#secure-plan-details)
   - [Complete Plan Details](#complete-plan-details)
   - [FAQ Page](#faq-page)
   - [Portfolio Interest Research](#portfolio-interest-research)
3. [Technical Architecture](#technical-architecture)
4. [Getting Started](#getting-started)

---

## Repository Overview

**SafeIdea** is an open-source platform for creators to securely store, share, and monetize their **ideas** (digital intellectual property and other digital assets).

### What We Offer

* **Secure Storage**: Protect your ideas with blockchain-based encryption
* **Controlled Sharing**: Share your ideas without risking theft
* **Monetization**: Sell access to your intellectual property
* **AI Sales Agents**: Custom agents designed for each idea

### How It Works

SafeIdea uses a downsampling technique to support discovery while protecting your IP. Our platform encrypts your content and only shows downsampled versions during AI interactions.

### Technology Stack

* **Storage**: Filecoin and Storacha for secure, decentralized storage
* **Computation**: Lilypad for decentralized AI processing
* **Access Control**: LIT Protocol for token-gated encryption
* **Authentication**: Stytch OTP with LIT PKP wallets

### Current Status

Add, share, sell access to, and create agents for your ideas at https://SafeIdea.net

* No crypto wallet required
* Web2-friendly interface
* Working toward beta release this month
* Currently running on testnets

---

## Marketing & Subscription Pages

### Homepage (Marketing)

**Route**: `/subscription/home` (shown to non-authenticated users)

#### Hero Section
**Headline**: "Because Your Ideas Are Worth Protecting"

**Subtitle**: Securely store your intellectual property with encryption, share it safely with partners, and protect it from unauthorized use – all from just $9/month.

**Primary CTA**: "Protect My Idea Now" → `/subscription/assessment`  
**Secondary CTA**: "Learn How It Works" → `/subscription/how-it-works`

#### Key Benefits Section
**Heading**: "Your IP Protection Should Be As Innovative As Your Ideas"

1. **Establish Provenance**
   - Secure timestamped records create legally defensible proof of your invention's existence and ownership.

2. **You Maintain Control**
   - Your intellectual property remains yours alone. We provide the tools to help you protect and manage it.

3. **Security Made Simple**
   - Complex IP protection streamlined into an easy-to-use platform that works for inventors, not lawyers.

4. **Focus on Innovation**
   - Stop worrying about your ideas being stolen and concentrate on what you do best — creating and inventing.

#### Services Overview Section
**Heading**: "Complete Protection Throughout Your Invention Journey"

1. **Basic Plan - Secure Storage & Timestamping ($9/month)**
   - Encrypted storage with immutable timestamps that create provable documentation of your intellectual property.
   - Link: `/subscription/basic`

2. **Secure Plan - Controlled Access & NDA Integration ($19/month)** [Most Popular]
   - Share your IP with partners and investors while maintaining control through secure access protocols and NDA tracking.
   - Link: `/subscription/secure`

3. **Complete Plan - Monitoring & Infringement Detection ($29/month)**
   - Active monitoring of the web for unauthorized use of your intellectual property with quarterly reports and alerts.
   - Link: `/subscription/complete`

4. **Portfolio Management Research (Join Research)**
   - Help us build the tools IP portfolio managers need. We're researching features for late 2025.
   - Link: `/portfolio-interest`

#### Testimonials Section
**Heading**: "Trusted by Inventors and Creators"

1. **Michaela Rodriguez** - Independent Inventor, 3 Patents Filed
   - "SafeIdea has transformed how I document my inventions. The timestamp feature alone has already helped me prove my ownership in a dispute with a former colleague."

2. **Alex Johnson** - Founder, NanoTech Solutions
   - "The secure sharing feature saved us countless hours of back-and-forth with NDAs. Now we can safely share our IP with potential investors with just a few clicks."

3. **Sarah Williams, Esq.** - Patent Attorney
   - "I recommend SafeIdea to all my clients as a first step in their IP protection strategy. It creates an excellent foundation of documentation before we even file a provisional patent."

#### Final CTA Section
**Heading**: "Ready to Protect Your Innovative Ideas?"

**Primary CTA**: "Start Your Protection Now" → `/subscription/assessment`  
**Guarantee**: Try risk-free with our 30-day money-back guarantee.

---

### How It Works

**Route**: `/subscription/how-it-works`

#### Introduction
**Heading**: "How SafeIdea Works For You"

SafeIdea provides a complete ecosystem for protecting your intellectual property at every stage—from initial documentation to secure sharing and continuous protection.

#### The Protection Process

**Step 1: Document & Encrypt**
- Upload your ideas, documents, and intellectual property assets to our secure platform
- Create an immutable timestamp proof of existence that can be verified at any time
- Features: Tamper-proof, Encrypted, Timestamped

**Step 2: Share Securely**
- Share your ideas with potential partners, investors, or team members under controlled conditions
- Use standard NDAs or customized NDAs to enforce agreements with timestamped proof of access
- Features: NDA Integration, Viewer Tracking, Time-limited Access

**Step 3: Protect Your IP**
- AI agents continuously monitor the internet for unauthorized use of your intellectual property
- Comprehensive reports and actionable insights
- Features: AI-powered, Detailed Reports, Automated

#### Key Protection Features

1. **Immutable Timestamps**
   - Create unforgeable documentation of when your intellectual property was created and uploaded
   - Permanently stored on decentralized infrastructure, impossible to tamper with
   - **Why it matters**: In IP disputes, proving who created something first is often the key to establishing ownership

2. **Enforceable NDAs**
   - System records exactly when someone accessed your information and under what terms
   - Clear chain of evidence if your IP is misused
   - **Why it matters**: Traditional NDAs are difficult to enforce without proof that someone actually had access

3. **AI Agents**
   - Specialized AI agents trained on your IP continuously scan the internet for potential infringement
   - Detailed reports and evidence when unauthorized use is detected
   - **Why it matters**: Most creators don't have time to continuously monitor for unauthorized use

4. **Fraud Prevention**
   - Establishes clear timeline of creation and ownership
   - Helps prevent others from claiming your work as their own
   - **Why it matters**: In today's digital world, ideas can be copied instantly

#### Common Questions

**Q: How is this different from a patent?**
A: Patents require public disclosure. SafeIdea complements patents by protecting trade secrets, early-stage ideas, and digital assets while maintaining confidentiality.

**Q: Is my data secure?**
A: Absolutely. End-to-end encryption means your data is encrypted before it leaves your device. Not even SafeIdea staff can access your unencrypted information.

**Q: How do the AI agents work?**
A: AI agents are trained on your IP documents and business preferences. They can engage with potential customers within parameters you set and facilitate introductions.

**Final CTA**: "Take the Assessment" → `/subscription/assessment`

---

### Subscription Assessment

**Route**: `/subscription/assessment`

#### Introduction
**Heading**: "Find Your Perfect Protection Plan"

Answer a few quick questions so we can recommend the best plan for your intellectual property needs.

#### Assessment Questions

**Question 1: Type of IP**
"What type of intellectual property are you looking to protect?"

Options:
- Invention or Innovation (New technologies or products that could potentially be patented)
- Trade Secrets / Confidential Information (Internal processes, formulas, or methods)
- Business Model or Strategy (Innovative business approaches, marketing plans)
- Creative Works (Written content, designs, music, software code)
- I'm not sure yet

**Question 2: Sharing Needs**
"Do you need to share your intellectual property with others?"

Options:
- No, I just need secure documentation
- Yes, with a small team or select partners
- Yes, with potential investors or partners
- Yes, with controlled licensing or sales
- I'm not sure yet

**Question 3: Main Concern**
"What's your biggest concern about your intellectual property?"

Options:
- Theft or unauthorized copying
- Proving I created it first
- Making sure NDAs are enforceable
- Monitoring for unauthorized use
- Getting more visibility

**Question 4: Budget**
"What's your monthly budget for intellectual property protection?"

Options:
- Less than $10/month (Basic protection with minimal features)
- $10-20/month (Standard protection with essential features)
- $20-30/month (Enhanced protection with advanced features)
- More than $30/month (Comprehensive protection with all features)
- I'm evaluating options

**Question 5: Timeline**
"How soon do you need protection in place?"

Options:
- Immediately (within days)
- Soon (within weeks)
- Planning ahead (within months)
- Just exploring options
- My work is already public

#### Recommendation Logic
The assessment uses a point-based system to determine the best plan based on user responses across all questions.

#### Results Display
Shows recommended plan with:
- Plan name and description
- Summary of user's responses
- Link to view all plans for comparison

---

### Plans Comparison

**Route**: `/subscription/plans`

#### Overview
**Heading**: "Choose Your IP Protection Plan"

Select the plan that best fits your intellectual property needs and business goals.

#### View Options
- Card View: Visual plan cards with features and pricing
- Table View: Detailed feature comparison table

#### Plan Details

**Basic Plan - $9/month**
- **Description**: Essential protection for solo creators with documentation needs
- **Ideal for**: Solo creators looking to establish idea provenance
- **Features**:
  - End-to-end encryption ✓
  - Immutable timestamps ✓
  - 5GB storage
  - Limited sharing (3 recipients)
  - Email support
  - Up to 10 documents

**Secure Plan - $19/month** [Most Popular]
- **Description**: Enhanced protection with controlled sharing and NDA integration
- **Ideal for**: Teams and businesses sharing IP with partners
- **Features**:
  - End-to-end encryption ✓
  - Immutable timestamps ✓
  - 15GB storage
  - Unlimited sharing
  - NDA integration ✓
  - Email & chat support
  - Up to 50 documents
  - Activity tracking ✓

**Complete Plan - $29/month**
- **Description**: Comprehensive protection with monitoring and AI-powered assistance
- **Ideal for**: Businesses with valuable IP requiring continuous protection
- **Features**:
  - End-to-end encryption ✓
  - Immutable timestamps ✓
  - 50GB storage
  - Unlimited sharing
  - NDA integration ✓
  - IP monitoring ✓
  - AI agent ✓
  - Priority support
  - Unlimited documents
  - Quarterly consultations ✓

#### FAQ Section
- Can I change plans later? (Yes, upgrade/downgrade anytime)
- Is there a free trial? (30-day money-back guarantee)
- What happens at storage limit? (Notification at 80%, can upgrade or manage)

**Final CTA**: "Get Started Now" with 30-day money-back guarantee

---

### Basic Plan Details

**Route**: `/subscription/basic`

#### Hero Section
**Plan**: Basic IP Protection Plan  
**Price**: $9/month  
**Description**: Essential protection for establishing and securing your intellectual property

#### Main Features

1. **End-to-End Encryption**
   - Military-grade encryption keeps your IP completely private
   - Documents encrypted before they leave your device

2. **Immutable Timestamps**
   - Legally-defensible proof of when you created your IP
   - Cryptographically secured and independently verifiable

3. **5GB Secure Storage**
   - Store documents, designs, code, and other IP assets
   - Encrypted and redundantly backed up

4. **Email Support**
   - Responsive email support team
   - Help with platform usage and IP protection

#### Complete Feature List
- End-to-end encryption for all documents
- Immutable timestamps for provenance
- 5GB secure document storage
- Limited sharing (up to 3 recipients)
- Basic document versioning
- Email support (24-48 hour response)
- Up to 10 documents
- Access to basic documentation guides

#### Ideal Use Cases

**Solo Creators & Inventors**
- Individual creators establishing timeline of creation
- Perfect for books, designs, inventions

**Early-Stage Development**
- Projects in early development stages
- Establish timeline before seeking patents or sharing

**Students & Researchers**
- Academic work requiring priority establishment
- Document research findings and innovations

#### FAQ
- Can I upgrade later? (Yes, seamlessly transfer to higher plans)
- What if I need more storage? (5GB included, can upgrade or purchase additional)
- Document type limits? (Wide variety supported, 100MB per file)
- How to share documents? (Up to 3 recipients via secure links)

**Guarantee**: 30-day money-back guarantee, no long-term contracts

---

### Secure Plan Details

**Route**: `/subscription/secure`

#### Hero Section
**Plan**: Secure IP Protection Plan [Most Popular]  
**Price**: $19/month  
**Description**: Enhanced protection with controlled sharing and NDA integration for teams and businesses

#### Main Features

1. **Unlimited Controlled Sharing**
   - Share with unlimited recipients
   - Complete control over access permissions, expiration dates, download restrictions

2. **NDA Integration**
   - Automatically require legally-binding NDAs before access
   - Track agreement acceptance with timestamps and digital signatures

3. **Activity Tracking**
   - Monitor who views documents, when they access them, what actions they take
   - Receive notifications for important activities
   - Complete audit trail

4. **Priority Support**
   - Email and chat support from IP specialists
   - Shorter response times and priority issue resolution

#### Complete Feature List
- End-to-end encryption for all documents
- Immutable timestamps for provenance
- 15GB secure document storage
- Unlimited sharing with access controls
- Automated NDA generation and tracking
- Email & chat support (12-24 hour response)
- Up to 50 documents
- Advanced document versioning
- View and download analytics
- Customizable access expiration
- Watermarking capabilities
- Team collaboration features

#### Ideal Use Cases

**Startups & Small Businesses**
- Share IP with investors, partners, team members
- Legal protections and controls needed

**Collaborative Teams**
- Teams working together on IP assets
- Careful sharing and access management required

**Consultants & Freelancers**
- Share confidential work with clients
- NDA integration ensures legal protection

#### Comparison with Basic Plan
- **Secure**: Unlimited sharing vs **Basic**: 3 recipients only
- **Secure**: NDA integration vs **Basic**: No NDA capabilities
- **Secure**: 15GB storage vs **Basic**: 5GB storage
- **Secure**: Activity tracking vs **Basic**: Limited tracking

#### FAQ
- How does NDA integration work? (Customizable templates, digital signatures, timestamped)
- Can I customize access permissions? (Fine-grained control per recipient)
- How many team members? (Up to 5 included, $3/month per additional)
- Are NDAs legally binding? (Yes, drafted by IP attorneys, e-signature compliant)

**Guarantee**: 30-day money-back guarantee, no long-term contracts

---

### Complete Plan Details

**Route**: `/subscription/complete`

#### Hero Section
**Plan**: Complete IP Protection Plan  
**Price**: $29/month  
**Description**: Comprehensive protection with monitoring, AI-powered assistance, and advanced security features

#### Main Features

1. **IP Monitoring & Infringement Detection**
   - Continuous web scanning for unauthorized use
   - Potential infringement identification
   - Quarterly reports with findings

2. **AI Agent**
   - Specialized AI agents work 24/7 to monitor internet
   - Comprehensive reports with evidence and suggested actions
   - Potential infringement detection

3. **Real-time Alerts**
   - Instant notifications about important activities
   - Unauthorized access attempts, potential infringements
   - Sharing activity and licensing opportunities

4. **Priority Support & Consulting**
   - VIP access to IP specialists
   - Priority support channels
   - Quarterly consultation sessions for strategy optimization

#### Complete Feature List
- End-to-end encryption for all documents
- Immutable timestamps for provenance
- 50GB secure document storage
- Unlimited sharing with advanced controls
- Automated NDA generation and tracking
- Priority support (4-8 hour response)
- Unlimited documents
- Web monitoring for infringement
- AI-powered agent
- Quarterly infringement reports
- Unlimited team members
- Quarterly IP strategy consultation
- Custom integration options
- Custom watermarking & tracking
- Dedicated account manager
- Real-time access alerts

#### Ideal Use Cases

**Established Businesses & IP Owners**
- Significant IP assets needing comprehensive protection
- IP as core business asset

**High-Value IP Assets**
- Exceptional value IP requiring monitoring
- Critical to identify potential theft and misuse

**IP Protection Focus**
- Organizations actively protecting IP from unauthorized use
- Continuous monitoring and comprehensive reports needed

#### Comparison with Secure Plan
- **Complete**: IP monitoring vs **Secure**: No monitoring
- **Complete**: AI agent vs **Secure**: No AI agent
- **Complete**: 50GB storage vs **Secure**: 15GB storage
- **Complete**: Strategy consultation vs **Secure**: Standard support only

#### FAQ
- How does IP monitoring work? (AI and web crawling, scans websites/marketplaces/repositories)
- Can I control the AI agent? (Complete control over parameters, pricing, boundaries)
- What's in quarterly consultation? (1-hour sessions with IP specialists)
- What if infringement is detected? (Immediate alerts, evidence, next steps guidance)

**Guarantee**: 30-day money-back guarantee, no long-term contracts

---

### FAQ Page

**Route**: `/subscription/faq`

#### General Questions

**What is SafeIdea?**
SafeIdea is a comprehensive intellectual property protection platform that helps creators, inventors, and businesses secure, document, share, and protect their intellectual property. Services include secure documentation with immutable timestamps, controlled sharing with NDA integration, and advanced monitoring for potential infringement.

**How is SafeIdea different from a patent?**
Patents are government-granted monopolies requiring public disclosure. SafeIdea complements patents by protecting trade secrets, early-stage ideas, and digital assets that may not qualify for patent protection, while maintaining confidentiality.

**What types of intellectual property can I protect?**
SafeIdea can protect virtually any type of IP: written works, software code, designs, artwork, trade secrets, business plans, inventions, formulas, processes, and methodologies.

**Does SafeIdea provide legal protection?**
SafeIdea provides important documentation and evidence for legal proceedings, but is not a substitute for legal registration or professional legal advice. Immutable timestamps and access logs create legally defensible evidence.

#### Plans & Pricing

**What are the differences between the plans?**
- Basic ($9/month): Essential protection with secure storage, encryption, and timestamping
- Secure ($19/month): Adds unlimited sharing, access controls, NDA integration, activity tracking
- Complete ($29/month): Includes all features plus IP monitoring, infringement detection, AI agent, expert consultation

**Can I change plans later?**
Yes, upgrade or downgrade anytime. Changes take effect at next billing cycle. When upgrading, immediately gain new features while keeping existing documentation.

**Do you offer a free trial?**
30-day money-back guarantee on all plans. Full refund if not satisfied within first 30 days.

**Can I purchase additional storage?**
Yes, additional storage available in 10GB increments for $3/month. Add via account settings.

#### Security & Privacy

**How secure is my data?**
End-to-end encryption ensures IP security. Documents encrypted before leaving your device. Uses AES-256 encryption, stored in redundant secure data centers.

**Can SafeIdea staff access my documents?**
No, staff cannot access encrypted document contents. Zero-knowledge encryption means we don't have decryption keys.

**How are my documents backed up?**
Encrypted documents stored with redundancy across multiple secure data centers. Continuous backups protect against data loss.

**Who owns the IP I store?**
You retain 100% ownership. Terms of Service explicitly state we claim no rights or ownership over your content.

#### Features & Functionality

**How do immutable timestamps work?**
System creates cryptographic hash (unique digital fingerprint) of files and records in tamper-proof database with timestamp. Creates verifiable proof without revealing contents.

**Are the NDAs legally enforceable?**
Yes, created by IP attorneys and legally binding in most jurisdictions. Uses proper electronic signature technology complying with e-signature laws.

**How does the AI agent work?**
Continuously monitors internet for potential unauthorized use. Scans websites, marketplaces, digital platforms to detect copying, derivative works, or misappropriation.

**What does the monitoring system check for?**
Scans websites, marketplaces, code repositories, academic papers for content matching or substantially similar to your protected IP.

#### Technical Questions

**What file types are supported?**
Wide variety including PDFs, Word docs, Excel, PowerPoint, images, CAD files, code files, text docs, ZIP archives. 100MB max per document.

**Which browsers are supported?**
Modern browsers including Chrome and Safari. Recommend latest version for optimal security and performance. Supports desktop and mobile.

**Do you offer API access?**
Yes, API access available for Enterprise customers wanting to integrate SafeIdea features into existing workflows. REST API for timestamps, sharing, access tracking.

**Can I export my data?**
Yes, export all data anytime including documents, timestamp certificates, access logs, sharing histories in industry-standard formats.

**How do I know my IP will remain safe over time?**
Partnership with Filecoin establishes immutable security. Filecoin is the largest decentralized storage network (~3.8 exabytes) used by Internet Archive, Wikipedia, MIT, Smithsonian. Creates unalterable blockchain record with cryptographic verification.

---

### Portfolio Interest Research

**Route**: `/portfolio-interest`

#### Introduction
**Heading**: "Help Shape SafeIdea for Portfolio Managers"

We're researching features for IP portfolio managers, patent attorneys, and research teams. Your insights will help us build the right tools for managing multiple IP assets.

**Research Phase**: Targeting late 2025 for portfolio management features. Early participants will help define what we build and get priority access when available.

#### Form Fields

**Required Information:**
- Name
- Email
- Organization Name
- Organization Type (Law Firm, University, Research Lab, Corporation, Other)
- Expected Timeline (Q3 2025, Q4 2025, H1 2026, H2 2026, Unsure)

**Optional Information:**
- Current pain points in managing IP portfolios
- How did you hear about SafeIdea?

#### Form Submission
Integrates with Google Forms for data collection. Shows success message after submission with options to:
- Return to homepage
- Explore individual plans

#### Success Message
"Thank You for Your Interest! Your information has been submitted successfully. We'll be in touch as we develop features for IP portfolio managers. Your input will help shape what we build."

---

## Technical Architecture

### Frontend Framework
- **Next.js 13** with App Router
- **React 19** for component framework
- **Tailwind CSS** for styling with glassmorphism effects
- **Dark-theme-first** design approach

### Authentication & Security
- **Stytch** for passwordless authentication
- **LIT Protocol** for threshold cryptography and token-gated encryption
- **End-to-end encryption** for all IP content
- **Client-side cryptography** for security

### Data Storage & Infrastructure
- **Firebase Firestore** for metadata and user information
- **IPFS/Filecoin** via Storacha for decentralized storage
- **Immutable timestamps** using blockchain technology
- **ERC-1155 tokens** for IP ownership verification

### AI & Processing
- **Lilypad** for decentralized AI processing
- **AI Sales Agents** for IP promotion and monitoring
- **OpenAI** for image generation (temporary solution)

### Deployment
- **Google Cloud Run** using cloudbuild.yaml
- **Runtime**: Node.js (edge runtime compatibility issues with LIT/Storacha)
- **Previously**: Cloudflare Pages (deprecated due to runtime incompatibilities)

---

## Getting Started

### Prerequisites
- Node.js 22.13.1 (defined in mise)
- PNPM 10.7.1
- GCP using Cloudrun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shipstone-labs/conciliator-app.git
   cd conciliator-app
   ```

2. **Install mise and dependencies:**
   ```bash
   mise install
   pnpm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.local.example .env.local
   cp hardhat/.env.example hardhat/.env
   # Fill out .env.local and hardhat/.env.example
   ```

4. **Deploy IPDocV8 Token:**
   ```bash
   cd hardhat
   npm install
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network hyperspace
   ```

5. **Configuration Requirements:**
   - LIT Protocol capacity token and relay API key
   - Storacha space, key and delegation proof
   - Stytch project setup
   - Firebase configuration (Firestore, Auth, Storage)
   - Lilypad API key for anura-testnet
   - OpenAI credentials for image generation

### Development

Start the development server:
```bash
pnpm dev
```

Connect with browser to http://localhost:3000

### Key Commands
- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm pages:build`: Build for Cloudflare Pages (deprecated)

### Current Deployment
Using Google Cloud Run with cloudbuild.yaml due to LIT Protocol and Storacha library compatibility requirements with Node.js runtime.

---

*This document contains the complete marketing content and technical overview from the SafeIdea Conciliator App repository as of January 25, 2025.*