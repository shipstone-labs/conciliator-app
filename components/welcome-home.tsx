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
      
      <div className="flex flex-col items-center min-h-screen pt-16">
        <Logo />
        
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
                    Protect & Share Your Intellectual Property
                  </h1>
                  <p className="text-lg md:text-xl text-white/80 max-w-[600px]">
                    Your ideas deserve protection. SafeIdea offers decentralized storage, 
                    legal timestamps, and AI-powered discovery for creators and inventors.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 min-[400px]:gap-6">
                  <AuthButton
                    text="Get Started - It's Free"
                    className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center text-base md:text-lg"
                  />
                  <Link
                    href="/list-ip"
                    className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-secondary/30 hover:scale-105 text-center text-base md:text-lg"
                  >
                    Explore Ideas
                  </Link>
                </div>
              </div>
              <div className="mx-auto max-w-[500px] lg:ml-auto">
                <div className="rounded-xl overflow-hidden shadow-lg bg-card/30 backdrop-blur-sm border border-white/10 p-2">
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
        <section className="w-full py-12 md:py-24 bg-background/30 backdrop-blur-sm border-y border-white/10">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Powerful Protection Features
              </h2>
              <p className="text-base md:text-lg text-white/80 max-w-[800px] mx-auto">
                Our platform combines cutting-edge technologies to safeguard your intellectual property
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="bg-background/30 backdrop-blur-sm border-white/10">
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <img src="/secure.svg" alt="Secure" className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-white text-xl">Encrypted Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">
                    Your ideas are secured with military-grade encryption and stored on decentralized networks for maximum security.
                  </p>
                </CardContent>
              </Card>
              
              {/* Feature 2 */}
              <Card className="bg-background/30 backdrop-blur-sm border-white/10">
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                    <img src="/patent-law.svg" alt="Legal" className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-white text-xl">Blockchain Timestamping</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">
                    Immutable verification of your idea's existence at a specific point in time, providing legal protection.
                  </p>
                </CardContent>
              </Card>
              
              {/* Feature 3 */}
              <Card className="bg-background/30 backdrop-blur-sm border-white/10">
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                    <img src="/chatbot.svg" alt="AI" className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-white text-xl">AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">
                    Advanced AI agents help analyze, enhance, and maximize the potential of your intellectual property.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                How SafeIdea Works
              </h2>
              <p className="text-base md:text-lg text-white/80 max-w-[800px] mx-auto">
                Three simple steps to protect your intellectual property
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-background">1</span>
                </div>
                <h3 className="text-xl font-medium text-white">Create Account</h3>
                <p className="text-white/80">
                  Sign up in seconds with our passwordless authentication system.
                </p>
                <div className="rounded-xl overflow-hidden shadow-lg bg-card/30 backdrop-blur-sm border border-white/10 p-2 h-48 mx-auto">
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-primary/10">
                    <img 
                      src="/svg/Black+Yellow.svg" 
                      alt="Create Account" 
                      className="w-1/2 h-1/2 object-contain" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-background">2</span>
                </div>
                <h3 className="text-xl font-medium text-white">Upload Idea</h3>
                <p className="text-white/80">
                  Upload your documents, describe your idea, and set visibility preferences.
                </p>
                <div className="rounded-xl overflow-hidden shadow-lg bg-card/30 backdrop-blur-sm border border-white/10 p-2 h-48 mx-auto">
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-secondary/10">
                    <img 
                      src="/file.svg" 
                      alt="Upload Idea" 
                      className="w-1/2 h-1/2 object-contain" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-background">3</span>
                </div>
                <h3 className="text-xl font-medium text-white">Secure & Share</h3>
                <p className="text-white/80">
                  Your idea is timestamped, encrypted, and ready for safe sharing and collaboration.
                </p>
                <div className="rounded-xl overflow-hidden shadow-lg bg-card/30 backdrop-blur-sm border border-white/10 p-2 h-48 mx-auto">
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-accent/10">
                    <img 
                      src="/globe.svg" 
                      alt="Share Ideas" 
                      className="w-1/2 h-1/2 object-contain" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonial Section */}
        <section className="w-full py-12 md:py-24 bg-background/30 backdrop-blur-sm border-y border-white/10">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div className="order-2 lg:order-1">
                <Card className="bg-background/50 backdrop-blur-sm border-white/10">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <blockquote className="text-lg text-white italic">
                        "SafeIdea has completely transformed how I protect my creative work. 
                        The blockchain timestamping and AI analysis tools have been invaluable 
                        for my projects. I can now share my ideas with confidence."
                      </blockquote>
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full overflow-hidden bg-primary/20 w-12 h-12 flex items-center justify-center">
                          <span className="text-white font-bold">JD</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">Jane Doe</div>
                          <div className="text-sm text-white/70">Software Inventor</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4 order-1 lg:order-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Trusted by Creators Worldwide
                </h2>
                <p className="text-base md:text-lg text-white/80">
                  Join hundreds of innovators who secure their intellectual property with SafeIdea. 
                  Our platform provides the tools and protection inventors need in today's digital world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <AuthButton
                    text="Join SafeIdea Today"
                    className="px-6 py-3 bg-primary hover:bg-primary/80 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Final CTA Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-white">
                Ready to Protect Your Ideas?
              </h2>
              <p className="text-lg text-white/80 max-w-[600px] mx-auto">
                Join SafeIdea today and take the first step toward securing your intellectual property.
                Our platform is designed for creators, by creators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AuthButton
                  text="Create Free Account"
                  className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center text-lg"
                />
                <Link
                  href="/list-ip"
                  className="px-8 py-4 bg-background/30 backdrop-blur-sm border border-white/20 hover:bg-background/50 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-white/10 hover:scale-105 text-center text-lg"
                >
                  Browse Examples
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