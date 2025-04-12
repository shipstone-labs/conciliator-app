'use client'

import type { MouseEvent } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useIP } from '@/hooks/useIP'
import { formatDate } from '@/lib/types'
import { cidAsURL } from '@/lib/internalTypes'

const DetailIP = ({
  docId,
  onNewIP,
}: {
  docId: string
  onNewIP: (event: MouseEvent<HTMLButtonElement>) => void
}) => {
  const router = useRouter()

  const ideaData = useIP(docId)
  console.log(ideaData)
  // For now, use placeholder data
  // const ideaData = {
  //   title: "Advanced AI-Powered Content Generator",
  //   description:
  //     "A sophisticated AI system that generates high-quality content tailored to specific industries and audiences. The system leverages cutting-edge machine learning models to understand context, brand voice, and audience preferences to create engaging articles, social media posts, and marketing materials that resonate with target demographics.",
  //   createdAt: Timestamp.fromDate(new Date()),
  //   creator: "Demo User",
  //   category: "Artificial Intelligence",
  //   tags: ["AI", "Content Creation", "Machine Learning", "Marketing"],
  // };

  // Function to navigate to the discovery page
  const goToDiscovery = () => {
    router.push(`/discovery/${docId}`)
  }

  if (!ideaData) {
    return (
      <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-white/70">Loading idea details...</p>
        </div>
      </Card>
    )
  }
  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto space-y-8 px-4">
        {/* Header with page title and image */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center">
            <Image
              src={ideaData.image?.cid ? cidAsURL(ideaData.image.cid) : '/svg/Black+Yellow.svg'}
              alt={ideaData.name || 'Idea Image'}
              width={160}
              height={160}
              className="rounded-xl object-cover shadow-md border border-white/10 hover:border-primary/30 transition-all mb-4"
              priority
            />
            <h1 className="text-3xl font-bold text-primary mb-2">Idea Details</h1>
            <p className="text-white/70">
              Review your idea information and proceed to discovery
            </p>
          </div>
        </div>

        {/* Main idea card - only show when not loading and no error */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/10">
            <CardTitle className="text-2xl font-bold text-primary">
              {ideaData.name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {Array.isArray(ideaData.tags) && ideaData.tags.length > 0 ? (
                ideaData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 text-xs font-medium bg-white/10 text-white/60 rounded-full">
                  Intellectual Property
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">
                Description
              </h3>
              <p className="text-white/90 leading-relaxed">
                {ideaData.description || 'No description available.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">
                  Created On
                </h3>
                <p className="text-white/90">
                  {formatDate(ideaData.createdAt)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">
                  Category
                </h3>
                <p className="text-white/90">
                  {ideaData.category || 'Intellectual Property'}
                </p>
              </div>
            </div>

            {/* Access Terms Section - Show if terms information exists */}
            {ideaData.terms && (
              <div className="border-t border-white/10 pt-5 mt-5">
                <h3 className="text-lg font-medium text-primary mb-3">
                  Access Terms
                </h3>

                <div className="space-y-4">
                  {/* Business Model */}
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/20 p-1.5 rounded-full">
                      <div className="w-4 h-4 text-primary" role="img" aria-label="Lock">🔒</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/70">
                        Business Model:
                      </h4>
                      <p className="text-white/90">
                        {ideaData.terms.businessModel ||
                          ideaData.category ||
                          'Protected Evaluation'}
                      </p>
                    </div>
                  </div>

                  {/* Evaluation Period */}
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/20 p-1.5 rounded-full">
                      <div className="w-4 h-4 text-primary" role="img" aria-label="Timer">⏱️</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/70">
                        Evaluation Period:
                      </h4>
                      <p className="text-white/90">
                        {ideaData.terms.evaluationPeriod ||
                          (Array.isArray(ideaData.tags) &&
                          ideaData.tags.length > 1
                            ? ideaData.tags[1]
                            : 'Standard')}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Options - Show if pricing information exists */}
                  {ideaData.terms.pricing && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-white/70 mb-2">Pricing Options:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Day Price */}
                        <div className="p-3 border border-white/10 rounded-xl bg-muted/20">
                          <p className="text-white/70 text-xs">One Day</p>
                          <p className="text-primary font-medium mt-1">
                            $
                            {parseFloat(
                              ideaData.terms.pricing.dayPrice || '5.00'
                            ).toFixed(2)}
                          </p>
                        </div>

                        {/* Week Price */}
                        <div className="p-3 border border-white/10 rounded-xl bg-muted/20">
                          <p className="text-white/70 text-xs">One Week</p>
                          <p className="text-primary font-medium mt-1">
                            $
                            {parseFloat(
                              ideaData.terms.pricing.weekPrice || '25.00'
                            ).toFixed(2)}
                          </p>
                        </div>

                        {/* Month Price */}
                        <div className="p-3 border border-white/10 rounded-xl bg-muted/20">
                          <p className="text-white/70 text-xs">One Month</p>
                          <p className="text-primary font-medium mt-1">
                            $
                            {parseFloat(
                              ideaData.terms.pricing.monthPrice || '90.00'
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NDA Information */}
                  {ideaData.terms.ndaRequired !== undefined && (
                    <div className="mt-4 p-3 border border-white/20 rounded-xl bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/20 p-1.5 rounded-full">
                          <div className="w-4 h-4 text-primary" role="img" aria-label="Document">📝</div>
                        </div>
                        <p className="text-white/90">
                          {ideaData.terms.ndaRequired
                            ? 'NDA Required: Access to this idea requires a signed Non-Disclosure Agreement.'
                            : 'NDA Not Required: This idea can be accessed without a signed NDA.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between items-center border-t border-white/10 pt-5 gap-4">
            <Button
              onClick={onNewIP}
              variant="ghost"
              aria-label="Create a new idea"
              className="text-white/70 hover:text-white hover:bg-white/10 focus:ring-2 focus:ring-primary/40 focus:outline-none w-full sm:w-auto"
            >
              Create New Idea
            </Button>

            <Button
              onClick={goToDiscovery}
              aria-label="Explore this idea in Discovery mode"
              className="bg-primary hover:bg-primary/80 text-black font-medium py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 flex items-center gap-2 focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-auto"
            >
              Explore in Discovery <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </CardFooter>
        </Card>

        {/* Info card about the Discovery feature - only show when data is loaded */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-primary/20 p-3 rounded-full shrink-0">
              <Image
                src="/svg/Black+Yellow.svg"
                alt="Discovery Mode Icon"
                width={32}
                height={32}
                className="rounded-full"
                priority
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-primary mb-1 text-center sm:text-left">
                Discovery Mode
              </h3>
              <p className="text-white/80 text-sm">
                In Discovery mode, you can interact with AI agents to explore
                your idea&apos;s potential applications and receive valuable
                feedback from simulated stakeholders.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DetailIP
