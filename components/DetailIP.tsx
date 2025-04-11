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
import { ArrowRight } from 'lucide-react'
import Loading from './Loading'
import { useIP } from '@/hooks/useIP'

const DetailIP = ({
  docId,
  onNewIP,
}: {
  docId: string
  onNewIP: (event: MouseEvent<HTMLButtonElement>) => void
}) => {
  const router = useRouter()

  const ideaData = useIP(docId)

  // For now, use placeholder data
  // const ideaData = {
  //   title: "Advanced AI-Powered Content Generator",
  //   description:
  //     "A sophisticated AI system that generates high-quality content tailored to specific industries and audiences. The system leverages cutting-edge machine learning models to understand context, brand voice, and audience preferences to create engaging articles, social media posts, and marketing materials that resonate with target demographics.",
  //   createdAt: new Date().toLocaleDateString(),
  //   creator: "Demo User",
  //   category: "Artificial Intelligence",
  //   tags: ["AI", "Content Creation", "Machine Learning", "Marketing"],
  // };

  // Function to navigate to the discovery page
  const goToDiscovery = () => {
    router.push(`/discovery/${docId}`)
  }

  if (!ideaData) {
    return <Loading />
  }
  return (
    <div className="min-h-screen bg-background p-6 bg-gradient-to-b from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with page title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Idea Details</h1>
          <p className="text-white/70">
            Review your idea information and proceed to discovery
          </p>
        </div>

        {/* Main idea card */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/10">
            <CardTitle className="text-2xl font-bold text-primary">
              {ideaData.name || 'Unknown Title'}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {ideaData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full"
                >
                  {tag}
                </span>
              )) || null}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">
                Description
              </h3>
              <p className="text-white/90 leading-relaxed">
                {ideaData.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-white/50 mb-1">
                  Created On
                </h3>
                <p className="text-white/90">
                  {ideaData.createdAt?.toLocaleDateString?.() || 'Unknown Date'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/50 mb-1">
                  Category
                </h3>
                <p className="text-white/90">{ideaData.category}</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center border-t border-white/10 pt-5">
            <Button
              onClick={onNewIP}
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
          </CardFooter>
        </Card>

        {/* Info card about the Discovery feature */}
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl">
          <CardContent className="p-5 flex gap-4 items-center">
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
