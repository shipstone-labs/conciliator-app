'use client'

import Link from 'next/link'
import { Logo } from './Logo'
import { AuthButton } from './AuthButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// This is the logged-out version of the home page
function WelcomeHome() {
  return (
    <>
      {/* Top-right Auth Button (below menubar) */}
      <div className="fixed top-20 right-4 z-20">
        <AuthButton
          text="Sign In / Register"
          className="bg-primary hover:bg-primary/80 text-black font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
        />
      </div>

      {/* Alpha Banner */}
      <div className="fixed top-4 right-4 z-30 bg-warning text-black font-medium py-2 px-4 rounded-lg shadow-lg transform rotate-2 border-2 border-warning/50">
        Work in progress: Try us out, but don&apos;t put real secrets in yet
      </div>

      <div className="flex flex-col items-center min-h-screen pt-16">
        <Logo />

        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl tracking-tight font-extrabold text-foreground sm:text-5xl md:text-6xl">
                    <span className="block">Secure, Share, and</span>
                    <span className="block text-primary">
                      Sell Your Digital Assets
                    </span>
                  </h1>
                  <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Protect your intellectual property with advanced encryption,
                    share it securely with partners, and monetize your digital
                    assets with our AI-powered sales agent.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 min-[400px]:gap-6">
                  <AuthButton
                    text="Start Protecting Your Ideas"
                    className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center text-base md:text-lg"
                  />
                  <Link
                    href="#how-it-works"
                    className="px-8 py-4 bg-card hover:bg-card/80 text-primary font-bold rounded-xl transition-all shadow-lg hover:shadow-border border border-border text-center text-base md:text-lg"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="mx-auto max-w-[500px] lg:ml-auto">
                <div className="rounded-xl overflow-hidden shadow-lg bg-card border border-border p-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-accent/20">
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src="/assets/Black+Yellow.svg"
                        alt="SafeIdea Platform"
                        className="w-3/4 h-3/4 object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 bg-card border-y border-border"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
                Our Services
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
                Complete Protection for Your Intellectual Property
              </p>
              <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
                <span className="font-semibold text-primary">Now in Beta:</span>{' '}
                From protecting trade secrets to monetizing patents, we're
                developing tools to secure, prove ownership, and profit from
                your intellectual property.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 - Protection */}
              <Card className="bg-card border-border">
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
                        Free for first year
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
              <Card className="bg-card border-border">
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
                    Share your intellectual property with potential partners or
                    investors under controlled conditions with time-limited
                    access.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-secondary/20 text-secondary mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        $100 per year
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

              {/* Feature 3 - Sales Agent */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                    <img src="/chatbot.svg" alt="AI" className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-card-foreground text-xl">
                    AI-Powered Sales Agent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Turn your digital assets into revenue. Our AI Sales Agent
                    optimizes visibility and handles transactions with multiple
                    pricing models.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-accent/20 text-accent mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        Custom pricing (contact us)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-accent/20 text-accent mr-2 mt-0.5">
                        ✓
                      </span>
                      <span className="text-foreground text-sm">
                        Fixed, subscription, or royalty models
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24">
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
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary-foreground">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  Create Account
                </h3>
                <p className="text-muted-foreground">
                  Sign up in seconds with our passwordless authentication
                  system.
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
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-secondary-foreground">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  Upload Idea
                </h3>
                <p className="text-muted-foreground">
                  Upload your documents, describe your idea, and set visibility
                  preferences.
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
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-accent-foreground">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  Secure & Share
                </h3>
                <p className="text-muted-foreground">
                  Your idea is timestamped, encrypted, and ready for safe
                  sharing and collaboration.
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
        <section className="w-full py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                Trusted by Industry Advisors
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-muted-foreground sm:mt-4">
                See what our advisors say about SafeIdea.ai's beta program
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
                        Mark Chandler
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
                          MC
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
                      Advisor, Partner, Bramson & Pressman
                    </p>
                    <div className="block mt-2">
                      <p className="text-foreground font-semibold">
                        Rob Pressman
                      </p>
                      <blockquote className="mt-3 text-base text-muted-foreground italic">
                        "This is something that clients with trade secrets need
                        right now."
                      </blockquote>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                          RP
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12 text-center">
              <AuthButton
                text="Join SafeIdea Today"
                className="px-6 py-3 bg-primary hover:bg-primary/80 text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-from">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="lg:flex lg:items-center lg:justify-between max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  <span className="block">Ready to protect your ideas?</span>
                  <span className="block text-primary">
                    Start with a free year of protection today.
                  </span>
                </h2>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-4">
                <div className="inline-flex rounded-md shadow">
                  <AuthButton
                    text="Get Started"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/80"
                  />
                </div>
                <div className="inline-flex rounded-md shadow">
                  <Link
                    href="/list-ip"
                    className="inline-flex items-center justify-center px-5 py-3 border border-border text-base font-medium rounded-md text-foreground bg-card hover:bg-card/80"
                  >
                    Explore Options
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default WelcomeHome
