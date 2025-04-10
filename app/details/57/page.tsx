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
  Shield,
  Dna
} from "lucide-react";

export default function EnhancedDetailPage() {
  const router = useRouter();
  const tokenId = "57"; // Hardcoded for this specific page
  
  // Data for idea #57
  const ideaData = {
    title: "Synthetic Biology Platform for Carbon Capture",
    description: "A platform for engineering microorganisms that efficiently capture atmospheric carbon dioxide and convert it into valuable materials. This biotechnology solution uses directed evolution and computational design to create specialized bacteria that can sequester CO2 at rates exceeding natural processes by 50x, while producing biodegradable plastics, building materials, or fuel precursors as valuable byproducts.",
    createdAt: "February 28, 2025",
    creator: "BioCarbonTech",
    category: "Biotechnology",
    tags: ["Synthetic Biology", "Carbon Capture", "Climate Tech", "Biomanufacturing"],
    price: 149,
    views: 1876,
    reviews: 35,
    rating: 4.6,
    keyFeatures: [
      "Engineered microorganisms optimized for carbon capture",
      "Scalable bioreactor design for industrial deployment",
      "Production of valuable materials as carbon byproducts",
      "Genetic safeguards to prevent environmental release",
      "Cloud-based monitoring and optimization platform"
    ],
    marketOpportunity: "The carbon capture market is expected to reach $7 billion by 2028, with biological approaches showing particular promise due to their scalability and lower energy requirements compared to mechanical systems. Additionally, the production of valuable materials from captured carbon creates a financially sustainable model, with potential revenues from both carbon credits and material sales. Early pilots show that each installation can generate approximately $500,000 in annual revenue while sequestering 1,000 tons of CO2.",
    accessTerms: [
      "Monthly subscription to platform",
      "Access to genetic designs and protocols",
      "Bioreactor blueprints included",
      "Technical support for implementation",
      "License for commercial deployment"
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
                  <span className="text-3xl font-bold text-primary">${ideaData.price}</span>
                  <span className="text-white/60 ml-2">/month</span>
                </div>
                
                <p className="text-white/80 text-sm mb-5">
                  Subscription includes platform access, genetic designs, and technical support for implementation.
                </p>
                
                <div className="space-y-3">
                  <Button className="w-full bg-primary hover:bg-primary/80 text-black font-medium">
                    Subscribe
                  </Button>
                  
                  <Button variant="outline" className="w-full border-white/20 text-white/80 hover:bg-white/10">
                    Request Demo
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