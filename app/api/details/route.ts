import type { NextRequest } from "next/server";
import { ALLOWED_ORIGINS } from "../utils";
import { getFirestore } from "../firebase";
import { getUser } from "@/app/api/stytch";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Validate origin
    const origin = req.headers.get("origin") || req.headers.get("host") || "";
    const correctDomain = ALLOWED_ORIGINS.find((reg) => reg.test(origin));
    if (!correctDomain) {
      console.error("Invalid domain", origin);
      return new Response("Unauthorized", { status: 403 });
    }

    // Authenticate user
    try {
      await getUser(req);
    } catch (authError) {
      console.error("Authentication failed:", authError);
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { tokenId } = body;

    if (!tokenId) {
      return new Response(JSON.stringify({ error: "TokenId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch idea details
    // For testing/development, we'll return mock data for any tokenId
    // In production, this would be replaced with actual database queries
    
    // TEMPORARY: Mock data for development purposes
    // This simulates a database lookup without requiring the actual database to be set up
    const mockIdeaData = {
      name: `Idea #${tokenId}`,
      description: "This is a detailed description of the idea. It would typically include information about the concept, potential applications, and other relevant details that the creator wants to share.",
      createdAt: new Date().toLocaleDateString(),
      creator: "Current User",
      category: "Intellectual Property",
      tags: ["Innovation", "Technology", "IP"]
    };
    
    return new Response(JSON.stringify(mockIdeaData), {
      headers: { "Content-Type": "application/json" },
    });

    /* 
    // PRODUCTION CODE - Uncomment when database is ready
    const db = await getFirestore();
    const ideaRef = db.collection("ideas").doc(tokenId.toString());
    const ideaDoc = await ideaRef.get();

    if (!ideaDoc.exists) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return idea data
    const ideaData = ideaDoc.data();
    return new Response(JSON.stringify({
      name: ideaData.name || "Untitled Idea",
      description: ideaData.description || "No description provided",
      createdAt: ideaData.createdAt || new Date().toLocaleDateString(),
      creator: ideaData.creator || "Anonymous",
      category: ideaData.category || "Intellectual Property",
      tags: ideaData.tags || ["IP"]
    }), {
      headers: { "Content-Type": "application/json" },
    });
    */

  } catch (error) {
    console.error("Error fetching idea details:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}