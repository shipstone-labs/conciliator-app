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
  // Log HomeApp component render
  console.log(`[HYDRATION][${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'}] HomeApp component rendering`);
  
  const { user, isInitialized } = useStytchUser()
  
  // Log auth state
  console.log(`[HYDRATION][${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'}] HomeApp auth state:`, 
    { isInitialized, hasUser: !!user });
  return (
    <>
      {' '}
      {/* Logout button removed - now in hamburger menu */}
      {/* Top-right Auth Button (below menubar) - COMMENTED OUT TO TEST HYDRATION */}
      {/* {!isInitialized ? null : !user ? (
        <div className="fixed top-20 right-4 z-20">
          <AuthButton
            text="Sign In / Register"
            className="bg-primary hover:bg-primary/80 text-black font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
          />
        </div>
      ) : null} */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <Logo />

        {/* Description Section */}
        <Card className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/30 border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              Welcome to{' '}
              <span className="text-primary font-semibold">SafeIdea.net</span>
            </CardTitle>
            <CardDescription className="text-lg text-white/90">
              The alpha version of our IP protection platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-white/90">
              We help creators and inventors store, share, and monetize their
              ideas securely.
            </p>
            <div className="mt-6 text-lg leading-relaxed text-white/90">
              <p className="mb-3">SafeIdea provides three key benefits:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>
                  <span className="font-medium text-primary">
                    Secure storage
                  </span>{' '}
                  - Establishes proof that you had a specific idea at a
                  particular time
                </li>
                <li>
                  <span className="font-medium text-primary">
                    Controlled sharing
                  </span>{' '}
                  - Creates records of who accessed your work and when
                </li>
                <li>
                  <span className="font-medium text-primary">
                    Monetization opportunities
                  </span>{' '}
                  - Connects you with ways to monetize your ideas on your terms
                </li>
              </ul>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-white/90">
              SafeIdea leverages technology within the{' '}
              <a
                href="https://fil.org/ecosystem-explorer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-semibold hover:underline"
              >
                Filecoin ecosystem
              </a>
              . We&apos;re using tokens from the Filecoin system,
              Storacha&apos;s file storage tools and Lilypad&apos;s AI modules.
              We&apos;re using LIT Protocol for encryption, which is integrated
              with Storacha.
              <p className="mt-4 text-lg leading-relaxed text-white/90">
                SafeIdea is an open source project, necessary if you want to
                make sure the developers don&apos;t know about your secrets.
              </p>
            </p>
            <p className="mt-6 text-lg leading-relaxed text-white/90">
              SafeIdea plans to launch commercially in late 2025. Want early
              access? Apply now for our beta program. We&apos;re looking for
              inventors and creators ready to help us protect their intellectual
              property in the digital age.
            </p>
          </CardContent>
        </Card>

        {/* Button Section - COMMENTED OUT CONDITIONAL RENDERING TO TEST HYDRATION */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          {/* No buttons shown during initial render for consistent hydration */}
          {/* {
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
                  href="/list-ip"
                  className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-secondary/30 hover:scale-105 text-center"
                >
                  Explore Ideas
                </Link>
              </>
            ) : null 
          } */}
        </div>
      </div>
    </>
  )
}

function RootHomeApp({ detectLogin = false }: { detectLogin?: boolean }) {
  // Log RootHomeApp component render
  console.log(`[HYDRATION][${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'}] RootHomeApp component rendering`, 
    { detectLogin });

  if (detectLogin) {
    console.log(`[HYDRATION][${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'}] RootHomeApp rendering with AuthenticatedLayout`);
    return (
      <AuthenticatedLayout>
        <HomeApp />
      </AuthenticatedLayout>
    )
  }
  
  console.log(`[HYDRATION][${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'}] RootHomeApp rendering without AuthenticatedLayout`);
  return <HomeApp />
}

export default RootHomeApp
