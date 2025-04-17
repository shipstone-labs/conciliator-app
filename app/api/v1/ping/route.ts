// File: /app/api/v1/ping/route.ts
// Purpose: Simple endpoint to confirm MCP connectivity

import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime (not Edge)

export async function GET() {
  // Log to console when the endpoint is hit
  console.log("MCP endpoint pinged at:", new Date().toISOString());
  
  // Return a simple success response
  return NextResponse.json({ 
    status: "success",
    message: "MCP endpoint is working",
    timestamp: new Date().toISOString()
  });
}