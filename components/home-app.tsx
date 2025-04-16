'use client'

import Link from 'next/link'
import { Logo } from './Logo'
import AuthenticatedLayout from '@/app/authLayout'
import { AuthButton } from './AuthButton'
import { useStytchUser } from '@stytch/nextjs'
import Loading from './Loading'
// LogoffButton import removed
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

// This is a placeholder for the actual login detection logic
function HomeApp() {
  const { user, isInitialized } = useStytchUser()
  return (
    <>
      {' '}
      {/* Logout button removed - now in hamburger menu */}
      {/* Top-right Auth Button (below menubar) */}
      {!isInitialized ? null : !user ? (
        <div className="fixed top-20 right-4 z-20">
          <AuthButton
            text="Sign In / Register"
            className="bg-primary hover:bg-primary/80 text-black font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
          />
        </div>
      ) : null}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <Logo />

        {/* Description Section */}
        <Card className="max-w-3xl mx-auto text-center shadow-md mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome to{' '}
              <span className="text-primary font-semibold">SafeIdea.net</span>
            </CardTitle>
            <CardDescription className="text-lg">
              The alpha version of our IP protection platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              SafeIdea is a new decentralized service designed to help creators and inventors securely store, share and benefit from their digital creations.
            </p>
            <div className="mt-6 text-lg leading-relaxed">
              <p>
                This alpha version was launched as part of the <a href="https://www.encode.club/ai-blueprints" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Filecoin AI Blueprints</a> hackathon, and incorporates Storacha and Lilypad to support encrypted digital asset sharing and monetization using agentic collaboration.
              </p>
            </div>
            <div className="mt-6 text-lg leading-relaxed">
              <p>
                To get started, log in with our passwordless access, add a new secret document, or learn more about the ideas in our database!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Button Section */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          {
            !isInitialized ? (
              <Loading />
            ) : isInitialized && user ? (
              <>
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
              </>
            ) : null /* Removed AuthButton from here */
          }
        </div>
      </div>
    </>
  )
}

function RootHomeApp() {
  return (
    <AuthenticatedLayout>
      <HomeApp />
    </AuthenticatedLayout>
  )
}

export default RootHomeApp
