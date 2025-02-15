"use client";

import ConciliateApp from "@/components/conciliate-app";
import { useParams } from "next/navigation";

export default function Token() {
  const params = useParams();
  const tokenId = params?.tokenId as string; // Retrieve the tokenId from the dynamic route
  return (
    <main>
      <ConciliateApp tokenId={tokenId} />
    </main>
  );
}
