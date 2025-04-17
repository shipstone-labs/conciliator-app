// File: /app/api/v1/ping/route.ts
// Purpose: Simple endpoint to confirm MCP connectivity

import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime (not Edge)

export async function GET(request: Request) {
  // Log to console when the endpoint is hit
  console.log("MCP endpoint pinged at:", new Date().toISOString());
  
  // Check if URL includes script parameter
  if (request.url.includes('script=true')) {
    return new NextResponse('console.log("ping");', {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Otherwise return JSON as usual
  return NextResponse.json({ 
    status: "success",
    message: "MCP endpoint is working",
    timestamp: new Date().toISOString()
  });
}