import type { NextRequest } from 'next/server'
import { getFirestore } from '../../firebase'
import { getUser } from '../../stytch'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request (optional - remove if you want to make the search public)
    try {
      await getUser(req)
    } catch (_error) {
      // Allow search without authentication
      console.log('Non-authenticated MCP search request')
    }

    // Parse the query from the request
    const { query } = await req.json()
    
    if (!query) {
      return new Response(
        JSON.stringify({
          error: 'No query provided',
          message: 'Please provide a search query'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the MCP search request
    console.log(`MCP Search Request: ${new Date().toISOString()}`)
    console.log(`Query: ${query}`)

    // Process the query to extract keywords
    const searchTerms = query.toLowerCase()
      .replace(/[^\w\s,]/g, '')
      .split(/[\s,]+/)
      .filter(term => term.length > 1)
    
    console.log('Extracted search terms:', searchTerms.join(', '))

    // Query the Firestore database
    const fb = getFirestore()
    const snapshot = await fb.collection('ip').orderBy('createdAt', 'desc').get()
    
    // Filter the results based on the search terms
    let results = []
    if (searchTerms.length > 0) {
      results = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.name || 'Untitled',
            description: data.description || '',
            tokenId: data.tokenId || doc.id,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            type: 'document'
          }
        })
        .filter(item => {
          // Check if any search term is in the title or description
          return searchTerms.some(term => 
            item.title.toLowerCase().includes(term) || 
            item.description.toLowerCase().includes(term)
          )
        })
        
      // Sort by relevance (number of matching terms)
      results.sort((a, b) => {
        const aMatches = searchTerms.filter(term => 
          a.title.toLowerCase().includes(term) || 
          a.description.toLowerCase().includes(term)
        ).length
        
        const bMatches = searchTerms.filter(term => 
          b.title.toLowerCase().includes(term) || 
          b.description.toLowerCase().includes(term)
        ).length
        
        return bMatches - aMatches
      })
    }

    console.log(`Found ${results.length} matching results`)
    
    // Return results in MCP-compatible format
    const responseData = {
      results: results.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        url: `/details/${item.tokenId}`,
        tokenId: item.tokenId,
        type: item.type
      })),
      query: {
        original: query,
        terms: searchTerms
      },
      meta: {
        total: results.length,
        timestamp: new Date().toISOString()
      }
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('Error processing MCP search:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An error occurred while processing your search'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}