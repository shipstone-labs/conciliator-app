'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import NavigationHeader from '@/components/NavigationHeader'

/**
 * Layout component for the subscription section
 */
export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Determine if we're on a specific subscription page
  const isHomePage = pathname === '/subscription/home'
  const isAssessment = pathname === '/subscription/assessment'
  const isPlansPage = pathname === '/subscription/plans'

  return (
    <>
      <NavigationHeader />

      {/* Breadcrumb navigation for subscription pages */}
      {!isHomePage && (
        <div className="container mx-auto px-4 py-3 flex items-center text-sm">
          <Link
            href="/subscription/home"
            className="text-primary hover:text-primary/80"
          >
            Subscription
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-foreground/80">
            {isAssessment && 'Assessment'}
            {isPlansPage && 'Plans'}
            {!isAssessment && !isPlansPage && 'Details'}
          </span>
        </div>
      )}

      {/* Logo for home page */}
      {isHomePage && (
        <div className="container mx-auto flex justify-center py-8">
          <Logo />
        </div>
      )}

      {/* Main content */}
      <main>{children}</main>
    </>
  )
}
