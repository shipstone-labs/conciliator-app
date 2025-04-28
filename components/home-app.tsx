'use client'

import Link from 'next/link'
import { Logo } from './Logo'
import { useStytchUser } from '@stytch/nextjs'
// LogoffButton import removed
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import WelcomeHome from './welcome-home'

// Logged in version of the home page
function LoggedInHome() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <Logo />

        {/* Description Section */}
        <Card className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/30 border-border mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">
              Welcome to{' '}
              <span className="text-primary font-semibold">SafeIdea.net</span>
            </CardTitle>
            <CardDescription className="text-lg text-foreground/90">
              The alpha version of our IP protection platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-foreground/90">
              SafeIdea is a new decentralized service designed to help creators
              and inventors securely store, share and benefit from their digital
              creations.
            </p>
            <div className="mt-6 text-lg leading-relaxed text-foreground/90">
              <p>
                This alpha version was launched as part of the{' '}
                <a
                  href="https://www.encode.club/ai-blueprints"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Filecoin AI Blueprints
                </a>{' '}
                hackathon, and incorporates Storacha and Lilypad to support
                encrypted digital asset sharing and monetization using agentic
                collaboration.
              </p>
            </div>
            <div className="mt-6 text-lg leading-relaxed text-foreground/90">
              <p>
                To get started, log in with our passwordless access, add a new
                secret document, or learn more about the ideas in our database!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Button Section */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link
            href="/add-ip"
            className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
          >
            Add Idea
          </Link>
          <Link
            href="/list-ip/mine"
            className="px-8 py-4 bg-accent hover:bg-accent/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-accent/30 hover:scale-105 text-center"
          >
            My Ideas
          </Link>
          <Link
            href="/list-ip"
            className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-secondary/30 hover:scale-105 text-center"
          >
            Explore Ideas
          </Link>
        </div>
      </div>
    </>
  )
}

// This is the main component that decides which version to show
function HomeApp() {
  const { user, isInitialized } = useStytchUser()

  // If not initialized, show nothing
  if (!isInitialized) {
    return null
  }

  // Show the appropriate version based on login status
  if (user) {
    return <LoggedInHome />
  }

  return <WelcomeHome />
}

function RootHomeApp() {
  return <HomeApp />
}

export default RootHomeApp
