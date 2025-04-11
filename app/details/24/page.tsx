'use client'

export const runtime = 'nodejs'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  Shield,
  Download,
  Upload,
  FileText,
  CheckCircle,
  Edit,
} from 'lucide-react'

export default function EnhancedDetailPage() {
  const router = useRouter()
  const tokenId = '24' // Hardcoded for this specific page

  // Simulate checking if user is the creator (for demo purposes)
  const isCreator = true // Toggle this to see different views

  // Sample data for the idea
  const ideaData = {
    // Public information
    title: 'Smart Home Energy Optimization System',
    description:
      'An AI-powered system that intelligently manages and optimizes energy usage in homes based on weather patterns, occupancy, and utility rates. The system uses machine learning to predict energy needs, automate climate control, and schedule appliance usage during off-peak hours to reduce electricity bills and environmental impact.',

    // Access terms
    businessModel: 'Protected Evaluation',

    // Creator-editable fields (normally hidden from users)
    tags: [
      'Smart Home',
      'Energy Efficiency',
      'AI',
      'IoT',
      'Sustainability',
      'Machine Learning',
    ],
    keyFeatures: [
      'Self-learning algorithms adapt to household routines',
      'Integration with major smart home ecosystems (Google Home, Amazon Alexa, Apple HomeKit)',
      'Real-time energy usage monitoring and alerts',
      'Automated energy sourcing from lowest-cost providers',
      'Predictive climate control based on weather forecasts',
      'Mobile app with intuitive dashboard and controls',
    ],
    additionalInfo:
      'This system has been tested in 50 homes across various climate zones with average energy savings of 23%. The technology includes proprietary machine learning models trained on 3 years of energy consumption data, weather patterns, and occupancy information. Hardware components include smart thermostats, outlet controls, and an optional central hub that integrates with existing home automation systems.',

    // Access pricing
    pricingOptions: [
      { period: 'One Day', price: 5.0 },
      { period: 'One Week', price: 25.0 },
      { period: 'One Month', price: 90.0 },
    ],

    // NDA status (for demo purposes)
    ndaStatus: 'pending', // Options: none, pending, approved
  }

  const handleCreateNewIP = () => {
    // Redirect to the root page
    window.location.href = '/'
  }

  // Function to navigate to the discovery page
  const goToDiscovery = () => {
    router.push(`/discovery/${tokenId}`)
  }

  return (
    <div className="min-h-screen bg-background p-6 bg-gradient-to-b from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with page title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Idea Details</h1>
          <p className="text-white/70">
            Review idea information and access options
          </p>
        </div>

        {/* Public Information Section */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/10">
            <CardTitle className="text-2xl font-bold text-primary">
              {ideaData.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">
                Public Description
              </h3>
              <p className="text-white/90 leading-relaxed">
                {ideaData.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Access Terms Section */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-white/10">
            <CardTitle className="text-xl font-bold text-primary">
              Access Terms
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-white/90 font-medium">Business Model:</span>
              <span className="text-white">{ideaData.businessModel}</span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium text-white/70">
                  Available Evaluation Periods:
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {ideaData.pricingOptions.map((option, index) => (
                    <div
                      key={index}
                      className="p-3 border border-white/10 rounded-xl bg-muted/20 flex justify-between items-center"
                    >
                      <span className="text-white/90">{option.period}</span>
                      <span className="text-primary font-medium">
                        ${option.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator-Editable Fields Section */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-white/10">
            <CardTitle className="text-xl font-bold text-primary">
              Additional Details
            </CardTitle>
            {isCreator && (
              <p className="text-white/60 text-sm mt-1">
                These fields are visible to users after NDA approval
              </p>
            )}
          </CardHeader>

          <CardContent className="pt-4 space-y-6">
            {/* Tags */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/70">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {ideaData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="bg-primary/20 text-primary border-none hover:bg-primary/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {isCreator && (
                <button
                  className="text-xs text-primary/70 hover:text-primary mt-1 flex items-center gap-1"
                  type="button"
                >
                  <Edit className="h-3 w-3" /> Edit tags
                </button>
              )}
            </div>

            {/* Key Features */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/70">
                Key Features:
              </h3>
              <ul className="space-y-2">
                {ideaData.keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-white/90 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {isCreator && (
                <button
                  className="text-xs text-primary/70 hover:text-primary mt-1 flex items-center gap-1"
                  type="button"
                >
                  <Edit className="h-3 w-3" /> Edit features
                </button>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/70">
                Additional Information:
              </h3>
              <p className="text-white/90 text-sm leading-relaxed">
                {ideaData.additionalInfo}
              </p>
              {isCreator && (
                <button
                  className="text-xs text-primary/70 hover:text-primary mt-1 flex items-center gap-1"
                  type="button"
                >
                  <Edit className="h-3 w-3" /> Edit information
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* NDA Section */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-white/10">
            <CardTitle className="text-xl font-bold text-primary">
              NDA Requirements
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <p className="text-white/90 text-sm leading-relaxed">
              Access to this idea requires a signed Non-Disclosure Agreement
              (NDA).
            </p>

            {/* NDA Actions - Different views based on creator status and NDA status */}
            <div className="flex flex-col space-y-4">
              {/* For non-creators viewing the idea */}
              {!isCreator && (
                <div className="flex gap-4">
                  <Button className="flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download NDA for Review
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload Signed NDA
                  </Button>
                </div>
              )}

              {/* For creators reviewing their idea */}
              {isCreator && ideaData.ndaStatus === 'pending' && (
                <div className="space-y-4">
                  <div className="p-3 border border-primary/30 rounded-xl bg-primary/10 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-grow">
                      <p className="text-white/90 text-sm font-medium">
                        Signed NDA Received
                      </p>
                      <p className="text-white/70 text-xs">
                        From: potential_buyer@example.com - 12 hours ago
                      </p>
                    </div>
                    <Button size="sm" className="flex items-center gap-1">
                      <Download className="w-3 h-3" /> View
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex items-center gap-2 bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4" /> Approve NDA
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-red-400 border-red-400/30 hover:bg-red-500/10"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* NDA has already been approved */}
              {isCreator && ideaData.ndaStatus === 'approved' && (
                <div className="p-3 border border-green-500/30 rounded-xl bg-green-500/10 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-white/90 text-sm font-medium">
                      NDA Approved
                    </p>
                    <p className="text-white/70 text-xs">
                      Access granted to potential_buyer@example.com
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Buttons at the bottom */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handleCreateNewIP}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Create New Idea
          </Button>

          <Button
            onClick={goToDiscovery}
            className="bg-primary hover:bg-primary/80 text-black font-medium py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 flex items-center gap-2"
          >
            Explore in Discovery <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Discovery Mode Info */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl">
          <CardContent className="p-5 flex gap-4 items-start">
            <div className="bg-primary/20 p-3 rounded-full">
              <Image
                src="/svg/Black+Yellow.svg"
                alt="Discovery"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-primary mb-1">
                Discovery Mode
              </h3>
              <p className="text-white/80 text-sm mb-4">
                In Discovery mode, you can interact with AI agents to explore
                this idea&apos;s potential applications and receive valuable
                feedback from simulated stakeholders.
              </p>
              <Button
                onClick={goToDiscovery}
                className="bg-primary hover:bg-primary/80 text-black font-medium py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-sm"
              >
                Start Discovery Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
