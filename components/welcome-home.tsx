'use client'

import Link from 'next/link'
import { Logo } from './Logo'
import { AuthButton } from './AuthButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscriptionBanner } from './SubscriptionBanner'
import { useVocabulary } from '@/lib/vocabulary'

// This is the logged-out version of the home page
function WelcomeHome() {
  const { getTerm } = useVocabulary()

  return (
    <>
      {/* Top-right Auth Button (below menubar) */}
      <div
        className="fixed top-20 right-4 z-20"
        data-testid="welcome-auth-login"
      >
        <AuthButton
          text="Sign In / Register"
          className="bg-primary hover:bg-primary/80 text-black font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
        />
      </div>

      {/* Subscription banner at the top */}
      <SubscriptionBanner />

      <div className="flex flex-col items-center min-h-screen pt-16">
        <div data-testid="welcome-logo">
          <Logo />
        </div>

        {/* Hero Section */}
        <section
          className="w-full py-12 md:py-24 lg:py-32"
          data-testid="welcome-hero"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
              <div className="space-y-4">
                <h1 className="text-4xl tracking-tight font-extrabold text-foreground sm:text-5xl md:text-6xl">
                  <span className="block text-primary">
                    {getTerm('hero.title')}
                  </span>
                </h1>
                <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
                  {getTerm('hero.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 min-[400px]:gap-6 justify-center mt-6">
                  <div data-testid="welcome-auth-signup">
                    <AuthButton
                      text={getTerm('hero.cta')}
                      className="px-6 py-3 bg-primary hover:bg-primary/80 text-black font-medium rounded-md transition-all shadow-lg hover:shadow-primary/30 text-center text-base"
                    />
                  </div>
                  <Link
                    href="#how-it-works"
                    className="px-6 py-3 bg-card hover:bg-card/80 text-primary font-medium rounded-md transition-all shadow-lg hover:shadow-border border border-border text-center text-base"
                    data-testid="welcome-learn-more"
                  >
                    Learn More
                  </Link>
                </div>
                <div className="mt-4" data-testid="welcome-plan-link">
                  <Link
                    href="/subscription/home"
                    className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-black font-medium rounded-md transition-all shadow-lg hover:shadow-secondary/30 text-center text-base inline-block"
                  >
                    Patent and Trade Secret Services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 bg-card border-y border-border"
          data-testid="welcome-features"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
                Our Services
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
                Complete Protection for Your {getTerm('item.full')}
              </p>
              <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
                {getTerm('feature.description')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 - Protection */}
              <Card
                className="bg-card border-border"
                data-testid="welcome-feature-card-1"
              >
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <img src="/secure.svg" alt="Secure" className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-card-foreground text-xl">
                    Secure Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Upload your trade secrets, provisional patents, and other IP
                    to our platform and get immediate protection with immutable
                    proof of ownership.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-primary/20 text-primary mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        <span className="pricing-blur">
                          Free for first year
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-primary/20 text-primary mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        Immutable storage on Filecoin/IPFS
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 2 - Sharing */}
              <Card
                className="bg-card border-border"
                data-testid="welcome-feature-card-2"
              >
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                    <img
                      src="/patent-law.svg"
                      alt="Legal"
                      className="w-8 h-8"
                    />
                  </div>
                  <CardTitle className="text-card-foreground text-xl">
                    Secured Sharing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Share your {getTerm('item').toLowerCase()} with potential
                    partners or investors under controlled conditions with
                    time-limited access.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-secondary/20 text-secondary mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        <span className="pricing-blur">$100 per year</span>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-secondary/20 text-secondary mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        NDA integration and tracking
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 3 - Agent */}
              <Card
                className="bg-card border-border"
                data-testid="welcome-feature-card-3"
              >
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                    <img src="/chatbot.svg" alt="AI" className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-card-foreground text-xl">
                    AI-Powered Agent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Protect your {getTerm('item').toLowerCase()} with continuous
                    monitoring. Our AI Agents scan the internet for unauthorized
                    use of your {getTerm('item')} and provide comprehensive
                    reports with evidence and recommended actions to defend your
                    innovations.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-accent/20 text-accent mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        24/7 automated monitoring
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-accent/20 text-accent mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        Detailed infringement reports
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          className="w-full py-12 md:py-24"
          data-testid="welcome-how-it-works"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                How SafeIdea Works
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-[800px] mx-auto">
                Three simple steps to protect your intellectual property
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div
                className="text-center space-y-4"
                data-testid="welcome-step-1"
              >
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary-foreground">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  Secure Your IP
                </h3>
                <p className="text-muted-foreground">
                  Sign up in seconds and upload and encrypt your IP to set the
                  record straight.
                </p>
                <div className="rounded-xl overflow-hidden shadow-lg bg-card border border-border p-3 h-64 mx-auto max-w-xs">
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
                    <img
                      src="/safeidea_cycle/1_protecting_ideas.png"
                      alt="Create Account"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="text-center space-y-4"
                data-testid="welcome-step-2"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-secondary-foreground">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  Upload Idea
                </h3>
                <p className="text-muted-foreground">
                  If desired, add the ability to securely share your secret with
                  potential investors or partners. Give your NDA some teeth.
                </p>
                <div className="rounded-xl overflow-hidden shadow-lg bg-card border border-border p-3 h-64 mx-auto max-w-xs">
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
                    <img
                      src="/safeidea_cycle/2_sharing_ideas.png"
                      alt="Upload Idea"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="text-center space-y-4"
                data-testid="welcome-step-3"
              >
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-accent-foreground">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  Get Yourself An Agent
                </h3>
                <p className="text-muted-foreground">
                  SafeIdea AI Agents work for you to monitor the internet for
                  unauthorized use of your intellectual property. Get
                  comprehensive protection with continuous monitoring and
                  detailed infringement reports.
                </p>
                <div className="rounded-xl overflow-hidden shadow-lg bg-card border border-border p-3 h-64 mx-auto max-w-xs">
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
                    <img
                      src="/safeidea_cycle/3_sales_agent.png"
                      alt="Share Ideas"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section
          className="w-full py-12 md:py-24 bg-muted"
          data-testid="welcome-testimonials"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                Trusted by Industry Advisors
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-muted-foreground sm:mt-4">
                See what our advisors say about SafeIdea.ai's digital asset
                services
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
              {/* Testimonial 1 */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-primary">
                      Advisor, Partner at Upright
                    </p>
                    <div className="block mt-2">
                      <p className="text-foreground font-semibold">
                        Drew Bandler
                      </p>
                      <blockquote className="mt-3 text-base text-muted-foreground italic">
                        "SafeIdea.ai solves a fundamental problem for creators
                        and inventors: how do you prove that you own your IP and
                        that a potential customer has had access to it. Doing it
                        immutably changes the game."
                      </blockquote>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          DB
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 2 */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-secondary">
                      Advisor, Partner, Simpson & Young
                    </p>
                    <div className="block mt-2">
                      <p className="text-foreground font-semibold">
                        Lia Simpson
                      </p>
                      <blockquote className="mt-3 text-base text-muted-foreground italic">
                        "This is something that my clients with trade secrets
                        need right now."
                      </blockquote>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                          LS
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12 text-center">
              <div data-testid="welcome-auth-join">
                <AuthButton
                  text="Join SafeIdea Today"
                  className="px-6 py-3 bg-primary hover:bg-primary/80 text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-from">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="lg:flex lg:items-center lg:justify-between max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  <span className="block">{getTerm('cta.ready')}</span>
                  <span className="block text-primary">
                    Start with a free year of protection today.
                  </span>
                </h2>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-4">
                <div data-testid="welcome-auth-get-started">
                  <AuthButton
                    text="Get Started"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/80"
                  />
                </div>
                <Link
                  href="/subscription/home"
                  className="inline-flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-md text-foreground bg-card hover:bg-card/80"
                  data-testid="welcome-explore"
                >
                  Explore Options
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default WelcomeHome
