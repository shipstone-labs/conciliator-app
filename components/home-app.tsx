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
import { useVocabulary } from '@/lib/vocabulary'
import { useFeature } from '@/hooks/useFeature'

// Logged in version of the home page
function LoggedInHome() {
  const { getTerm } = useVocabulary()
  const isAISite = useFeature('ai')

  // Determine if we're on AI site
  const isOnAISite =
    isAISite ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('conciliator-ai') ||
        window.location.hostname.includes('app.safeidea.ai')))

  // Determine the Add Idea route based on the site
  const addIdeaRoute = isOnAISite ? '/add-ip/protect' : '/add-ip'

  return (
    <>
      <div className="flex flex-col items-center min-h-screen px-6 pt-12 pb-16">
        {/* Logo Section */}
        <div className="mb-8" data-testid="home-logo">
          <Logo showText={false} />
        </div>

        {/* Description Section */}
        <Card
          className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/30 border-border"
          data-testid="home-welcome-card"
        >
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">
              Welcome to Your SafeIdea Account
            </CardTitle>
            <CardDescription className="text-lg text-foreground/90">
              We're excited you're here!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-foreground/90">
              SafeIdea is an open source, decentralized platform where creators
              and thinkers can safeguard their{' '}
              {getTerm('hero.description.assets')}. Our technology is built on
              the Protocol Labs ecosystem—Filecoin, IPFS, Storacha, and
              Lilypad—with encryption powered by LIT Protocol's threshold
              cryptography.
            </p>
            <div className="mt-6 text-lg leading-relaxed text-foreground/90">
              <p>
                While we prepare for our commercial launch later this year, we
                invite you to explore what we've built. Since we're still in
                testing mode, please experiment freely but save your truly
                valuable ideas for our full release.
              </p>
            </div>
            <div className="mt-6 text-lg leading-relaxed text-foreground/90">
              <p>
                Getting started is simple with our passwordless,
                no-wallet-required access. Register a new{' '}
                {getTerm('item').toLowerCase()}, browse existing assets, or dive
                right in!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Button Section */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link
            href={addIdeaRoute}
            className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
            data-testid="home-add-idea-button"
          >
            {getTerm('item.add')}
          </Link>
          <Link
            href="/list-ip/mine"
            className="px-8 py-4 bg-accent hover:bg-accent/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-accent/30 hover:scale-105 text-center"
            data-testid="home-my-ideas-button"
          >
            {getTerm('item.my')}
          </Link>
          <Link
            href="/list-ip"
            className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-secondary/30 hover:scale-105 text-center"
            data-testid="home-explore-button"
          >
            {getTerm('item.explore')}
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
