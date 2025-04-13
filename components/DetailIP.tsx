'use client'

import { MouseEvent, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useIP } from '@/hooks/useIP'
import { formatDate } from '@/lib/types'
import { cidAsURL } from '@/lib/internalTypes'
import { Modal } from '@/components/ui/modal'

const DetailIP = ({
  docId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNewIP,
}: {
  docId: string
  onNewIP: (event: MouseEvent<HTMLButtonElement>) => void
}) => {
  const router = useRouter()
  const [ndaChecked, setNdaChecked] = useState(false)
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)

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
              src={ideaData.image?.cid ? (cidAsURL(ideaData.image.cid) || '/svg/Black+Yellow.svg') : '/svg/Black+Yellow.svg'}
              alt={ideaData.name || 'Idea Image'}
              width={160}
              height={160}
              className="rounded-xl object-cover shadow-md border border-white/10 hover:border-primary/30 transition-all mb-4"
              priority
            />
            <h1 className="text-3xl font-bold text-primary mb-2">{ideaData.name}</h1>
            <p className="text-white/70">
              Review your idea information and proceed to discovery
            </p>
          </div>
        </div>

        {/* Main idea card - only show when not loading and no error */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/10">
            <div className="flex flex-wrap gap-2 justify-center">
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
                    <div className="bg-primary/20 p-1.5 rounded-full flex items-center justify-center">
                      <div className="text-primary" role="img" aria-label="Lock">🔒</div>
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
                    <div className="bg-primary/20 p-1.5 rounded-full flex items-center justify-center">
                      <div className="text-primary" role="img" aria-label="Timer">⏱️</div>
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

                  {/* Access Options - Show if pricing information exists */}
                  {ideaData.terms.pricing && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-white/70 mb-2">Access Options:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Day Price */}
                        <div 
                          className={`p-3 border rounded-xl transition-all ${
                            ndaChecked 
                              ? 'border-primary/30 bg-muted/30 cursor-pointer hover:bg-muted/40 hover:scale-[1.02] hover:border-primary/50' 
                              : 'border-white/10 bg-muted/20 opacity-50'
                          }`}
                          onClick={() => ndaChecked && setIsAccessModalOpen(true)}
                          role={ndaChecked ? "button" : ""}
                          tabIndex={ndaChecked ? 0 : -1}
                        >
                          <p className="text-white/70 text-xs">One Day</p>
                          <p className="text-primary font-medium mt-1">
                            $
                            {parseFloat(
                              ideaData.terms.pricing.dayPrice || '5.00'
                            ).toFixed(2)}
                          </p>
                        </div>

                        {/* Week Price */}
                        <div 
                          className={`p-3 border rounded-xl transition-all ${
                            ndaChecked 
                              ? 'border-primary/30 bg-muted/30 cursor-pointer hover:bg-muted/40 hover:scale-[1.02] hover:border-primary/50' 
                              : 'border-white/10 bg-muted/20 opacity-50'
                          }`}
                          onClick={() => ndaChecked && setIsAccessModalOpen(true)}
                          role={ndaChecked ? "button" : ""}
                          tabIndex={ndaChecked ? 0 : -1}
                        >
                          <p className="text-white/70 text-xs">One Week</p>
                          <p className="text-primary font-medium mt-1">
                            $
                            {parseFloat(
                              ideaData.terms.pricing.weekPrice || '25.00'
                            ).toFixed(2)}
                          </p>
                        </div>

                        {/* Month Price */}
                        <div 
                          className={`p-3 border rounded-xl transition-all ${
                            ndaChecked 
                              ? 'border-primary/30 bg-muted/30 cursor-pointer hover:bg-muted/40 hover:scale-[1.02] hover:border-primary/50' 
                              : 'border-white/10 bg-muted/20 opacity-50'
                          }`}
                          onClick={() => ndaChecked && setIsAccessModalOpen(true)}
                          role={ndaChecked ? "button" : ""}
                          tabIndex={ndaChecked ? 0 : -1}
                        >
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
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/20 p-1.5 rounded-full flex items-center justify-center">
                          <div className="text-primary text-xs" role="img" aria-label="Document">📝</div>
                        </div>
                        <div>
                          <p className="text-white/90 mb-2">
                            {ideaData.terms.ndaRequired
                              ? 'NDA Required: Access to this idea requires a signed Non-Disclosure Agreement.'
                              : 'NDA Not Required: This idea can be accessed without a signed NDA.'}
                          </p>
                          {ideaData.terms.ndaRequired && (
                            <div className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                id="nda-confirmation"
                                checked={ndaChecked}
                                onChange={(e) => setNdaChecked(e.target.checked)}
                                className="mr-2 rounded border-white/20 bg-muted/30 text-primary"
                              />
                              <label htmlFor="nda-confirmation" className="text-white/80 text-sm">
                                I have signed the required Non-Disclosure Agreement (NDA).
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer buttons removed */}
          
        </Card>

        {/* Clickable Discovery Mode card */}
        <div 
          onClick={goToDiscovery}
          className="cursor-pointer transform transition-transform hover:scale-[1.01] active:scale-[0.99]"
          role="button"
          tabIndex={0}
          aria-label="Go to Discovery Mode"
          onKeyDown={(e) => e.key === 'Enter' && goToDiscovery()}
        >
          <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all">
            <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center">
              <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                <Image
                  src="/svg/Black+Yellow.svg"
                  alt="Discovery Mode Icon"
                  width={32}
                  height={32}
                  className="rounded-full"
                  priority
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                  Discovery Mode <ArrowRight className="w-4 h-4 inline-block" aria-hidden="true" />
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

        {/* Access Option Modal */}
        <Modal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          title="Select Access Option"
        >
          <div className="space-y-4">
            <p className="text-white/90">
              Click on the Access Option you wish to acquire.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => setIsAccessModalOpen(false)}
                className="bg-primary hover:bg-primary/80 text-black font-medium px-5 py-2 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default DetailIP
