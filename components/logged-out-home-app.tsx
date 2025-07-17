'use client'

import Link from 'next/link'
import { Logo } from './Logo'
import { AuthButton } from './AuthButton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { SubscriptionBanner } from './SubscriptionBanner'
import { useVocabulary } from '@/lib/vocabulary'

// Dedicated component for logged-out users
// No auth checks inside - assumes user is not authenticated
export default function LoggedOutHomeApp() {
  const { getTerm } = useVocabulary()

  // Note: AI site detection removed since we're not using different routes
  // for logged-out users. All logged-out users see the same experience.

  return (
    <>
      <SubscriptionBanner />

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
              Welcome to SafeIdea
            </CardTitle>
            <CardDescription className="text-lg text-foreground/90">
              Protect and monetize your intellectual property
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
                no-wallet-required access. Sign in to register a new{' '}
                {getTerm('item').toLowerCase()}, manage your assets, or explore
                existing ideas!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Button Section */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          {/* Add Idea - Opens Auth Modal */}
          <AuthButton
            text={getTerm('item.add')}
            className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
          />

          {/* My Ideas - Opens Auth Modal */}
          <AuthButton
            text={getTerm('item.my')}
            className="px-8 py-4 bg-accent hover:bg-accent/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-accent/30 hover:scale-105 text-center"
          />

          {/* Explore Ideas - Active Link */}
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
