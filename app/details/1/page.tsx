"use client";

export const runtime = "edge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Shield
} from "lucide-react";

export default function EnhancedDetailPage() {
  const router = useRouter();
  const tokenId = "1"; // Hardcoded for this specific page
  
  // Data for idea #1
  const ideaData = {
    title: "Decentralized Carbon Credit Marketplace",
    description: "A blockchain-based platform that enables transparent trading of verified carbon credits, connecting carbon offset projects directly with businesses and individuals seeking to reduce their environmental footprint. The platform uses blockchain technology to track carbon credit ownership, retirement, and environmental impact with complete transparency and provides tools for project verification and impact measurement.",
    createdAt: "January 15, 2025",
    creator: "EcoBlock Foundation",
    category: "Sustainability",
    tags: ["Blockchain", "Carbon Credits", "Climate Tech", "Sustainability"],
    price: 0,
    views: 3257,
    reviews: 42,
    rating: 4.7,
    keyFeatures: [
      "Transparent tracking of carbon credit lifecycle",
      "Direct connection between projects and buyers",
      "Automated verification through IoT integration",
      "Fractional credit ownership for retail investors",
      "Real-time impact dashboards"
    ],
    marketOpportunity: "The voluntary carbon market is projected to grow from $2 billion in 2022 to over $50 billion by 2030. However, the current market is plagued by fragmentation, lack of transparency, and high intermediary costs. This decentralized marketplace solves these problems by connecting carbon project developers directly with buyers, reducing costs by up to 30% while ensuring that more funding goes to actual climate projects.",
    accessTerms: [
      "Open-source protocol",
      "Free access to core marketplace",
      "Small transaction fee on trades (0.5%)",
      "Premium tools available via subscription",
      "Developer API available for enterprises"
    ]
  };

  const handleCreateNewIP = () => {
    // Redirect to the root page
    window.location.href = "/";
  };

  // Function to navigate to the discovery page
  const goToDiscovery = () => {
    router.push(`/discovery/${tokenId}`);
  };

  return (
    <div className="min-h-screen bg-background p-6 bg-gradient-to-b from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
      <div className="max-w-7xl mx-auto">
        {/* Header with page title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Idea Details</h1>
          <p className="text-white/70">Review idea information and explore its potential</p>
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
                      <span>Published on {ideaData.createdAt}</span>
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
                <CardTitle className="text-xl font-semibold text-primary">Full Description</CardTitle>
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
                <CardTitle className="text-xl font-semibold text-primary">Key Features</CardTitle>
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
                <CardTitle className="text-xl font-semibold text-primary">Market Opportunity</CardTitle>
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
                  <span className="text-3xl font-bold text-primary">Free</span>
                  <span className="text-white/60 ml-2">open-source project</span>
                </div>
                
                <p className="text-white/80 text-sm mb-5">
                  This is an open-source project with free access to its core functionality and documentation.
                </p>
                
                <div className="space-y-3">
                  <Button className="w-full bg-primary hover:bg-primary/80 text-black font-medium">
                    Access Repository
                  </Button>
                  
                  <Button variant="outline" className="w-full border-white/20 text-white/80 hover:bg-white/10">
                    Contact Creator
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
                  <h3 className="text-lg font-medium text-primary mb-1">Discovery Mode</h3>
                  <p className="text-white/80 text-sm mb-4">
                    In Discovery mode, you can interact with AI agents to explore this idea&apos;s potential
                    applications and receive valuable feedback from simulated stakeholders.
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
  );
}