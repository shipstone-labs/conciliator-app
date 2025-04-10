"use client";

export const runtime = "edge";

import DetailIP from "@/components/DetailIP";
import { useParams } from "next/navigation";

export default function Token() {
  const params = useParams();
  const tokenId = "24"; // Hardcoded for this specific page

  const handleCreateNewIP = () => {
    // Redirect to the root page
    window.location.href = "/";
  };
  
  return <DetailIP tokenId={tokenId} onNewIP={handleCreateNewIP} />;
}