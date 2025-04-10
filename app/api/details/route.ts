import type { NextRequest } from 'next/server'
import { getFirestore } from '../firebase'
import { getUser } from '@/app/api/stytch'
import type { IPDoc } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    try {
      await getUser(req)
    } catch (authError) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const body = await req.json()
    const { tokenId } = body

    if (!tokenId) {
      return new Response(JSON.stringify({ error: 'TokenId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch idea details from Firestore
    try {
      const db = await getFirestore()
      const ideaRef = db.collection('ideas').doc(tokenId.toString())
      const ideaDoc = await ideaRef.get()

      if (!ideaDoc.exists) {
        console.log(
          `Idea not found for tokenId: ${tokenId}, using fallback data`
        )

        // Fallback for development/testing
        // For tokens that were created before we implemented Firestore storage
        const mockIdeaData = {
          name: `Idea #${tokenId}`,
          description:
            'This is a development placeholder for an idea that was created before database integration.',
          createdAt: new Date().toLocaleDateString(),
          creator: 'Current User',
          category: 'Intellectual Property',
          tags: ['Innovation', 'Technology', 'IP'],
        }

        return new Response(JSON.stringify(mockIdeaData), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Return idea data from Firestore
      const ideaData: IPDoc | undefined = ideaDoc.data() as IPDoc | undefined
      console.log(`Retrieved idea data for tokenId: ${tokenId}`)

      // Format the response with defined fallbacks for any missing fields
      return new Response(
        JSON.stringify({
          ...ideaData,
          id: ideaDoc.id,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } catch (dbError) {
      console.error('Database error while fetching idea:', dbError)

      // Fallback for database errors
      return new Response(
        JSON.stringify({
          name: `Idea #${tokenId}`,
          description: 'Unable to retrieve full idea details at this time.',
          createdAt: new Date().toLocaleDateString(),
          creator: 'Unknown',
          category: 'Intellectual Property',
          tags: ['IP'],
          error: 'Database connection issue',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error fetching idea details:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
