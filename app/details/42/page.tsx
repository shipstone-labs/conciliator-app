'use client'

export const runtime = 'nodejs'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Calendar,
  User,
  Tag,
  Eye,
  Star,
  MessageCircle,
  Check,
  DollarSign,
  Shield,
} from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { formatDate } from '@/lib/types'

export default function EnhancedDetailPage() {
  const router = useRouter()
  const tokenId = '42' // Hardcoded for this specific page

  // Data for idea #42
  const ideaData = {
    title: 'Neuromorphic Computing Platform for Edge AI',
    description:
      'A hardware and software platform that mimics brain architecture for ultra-efficient AI processing at the edge. This system combines memristor-based computing elements with specialized neural network architectures to achieve 100x better energy efficiency compared to traditional GPUs, enabling advanced AI capabilities in resource-constrained environments like IoT devices, wearables, and autonomous vehicles.',
    createdAt: Timestamp.fromDate(new Date('2025-03-14')),
    creator: 'NeuroEdge Systems',
    category: 'Artificial Intelligence',
    tags: ['Neuromorphic Computing', 'Edge AI', 'IoT', 'Energy Efficiency'],
    price: 3499,
    views: 834,
    reviews: 12,
    rating: 4.9,
    keyFeatures: [
      'Brain-inspired spiking neural network architecture',
      'On-device learning with minimal power consumption',
      'Compatible with TensorFlow and PyTorch models',
      'SDK for optimizing neural networks for the hardware',
      'Development kits available for researchers and startups',
    ],
    marketOpportunity:
      'The edge AI hardware market is projected to reach $38 billion by 2027, growing at a CAGR of 21%. Traditional AI hardware is too power-hungry for edge deployment, creating a critical need for energy-efficient solutions. This neuromorphic platform reduces power consumption by two orders of magnitude while maintaining inference accuracy, enabling AI capabilities in previously unsuitable environments like battery-powered devices and remote sensors.',
    accessTerms: [
      'Hardware development kit with full documentation',
      'Academic license includes 5 prototype chips',
      'Commercial license includes production rights',
      'SDK updates for 3 years',
      'Technical support via dedicated portal',
    ],
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
      <div className="max-w-7xl mx-auto">
        {/* Header with page title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Idea Details</h1>
          <p className="text-white/70">
            Review idea information and explore its potential
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero section with image and key details */}
            <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Image section */}
                <div className="md:w-1/3 p-6 flex items-center justify-center bg-gradient-to-br from-primary/10 to-background/50">
                  <Image
                    src="/svg/Black+Yellow.svg"
                    alt={ideaData.title}
                    width={180}
                    height={180}
                    className="rounded-xl shadow-lg border border-white/10"
                  />
                </div>

                {/* Details section */}
                <div className="md:w-2/3 p-6">
                  <CardTitle className="text-2xl font-bold text-primary mb-3">
                    {ideaData.title}
                  </CardTitle>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-white/70">
                      <User className="h-4 w-4" />
                      <span>{ideaData.creator}</span>
                    </div>

                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="h-4 w-4" />
                      <span>Published on {formatDate(ideaData.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-white/70">
                      <Tag className="h-4 w-4" />
                      <span>{ideaData.category}</span>
                    </div>
                  </div>

                  <p className="text-white/90 leading-relaxed mb-4">
                    {ideaData.description.split(' ').slice(0, 25).join(' ')}...
                  </p>

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

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <Eye className="h-4 w-4 text-primary/80" />
                      <span>{ideaData.views.toLocaleString()} Views</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-white/80">
                      <MessageCircle className="h-4 w-4 text-primary/80" />
                      <span>{ideaData.reviews} Reviews</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-white/80">
                      <Star className="h-4 w-4 text-primary/80" />
                      <span>{ideaData.rating} Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description section */}
            <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary">
                  Full Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-white/90 leading-relaxed">
                  {ideaData.description}
                </p>
              </CardContent>
            </Card>

            {/* Key Features section */}
            <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary">
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {ideaData.keyFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="bg-primary/20 p-1 rounded-full mt-0.5">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Market Opportunity section */}
            <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary">
                  Market Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 leading-relaxed">
                  {ideaData.marketOpportunity}
                </p>
              </CardContent>
            </Card>

            {/* Buttons */}
            <div className="flex justify-between items-center">
              <Button
                onClick={handleCreateNewIP}
                variant="outline"
                className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
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
          </div>

          {/* Sidebar - 1/3 width on large screens */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Card */}
            <Card className="backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
              <CardHeader className="bg-primary/20 border-b border-white/10">
                <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-primary">
                    ${ideaData.price}
                  </span>
                  <span className="text-white/60 ml-2">developer kit</span>
                </div>

                <p className="text-white/80 text-sm mb-5">
                  Includes hardware development kit, SDK, and full documentation
                  for academic or commercial use.
                </p>

                <div className="space-y-3">
                  <Button className="w-full bg-primary hover:bg-primary/80 text-black font-medium">
                    Purchase Developer Kit
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white/80 hover:bg-white/10"
                  >
                    Contact for Enterprise Pricing
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Access Terms */}
            <Card className="backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
              <CardHeader className="bg-primary/20 border-b border-white/10">
                <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <ul className="space-y-3">
                  {ideaData.accessTerms.map((term, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="bg-primary/20 p-1 rounded-full mt-0.5">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-white/90 text-sm">{term}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Discovery Card */}
            <Card className="backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl overflow-hidden">
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
                    In Discovery mode, you can interact with AI agents to
                    explore this idea&apos;s potential applications and receive
                    valuable feedback from simulated stakeholders.
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
      </div>
    </div>
  )
}
