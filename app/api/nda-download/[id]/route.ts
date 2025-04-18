import { NextRequest } from 'next/server'
import { getFirestore } from '@/app/api/firebase'
import { getUser } from '@/app/api/stytch'
import { pinata } from '@/app/api/utils'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    await getUser(req)
    
    const { id } = params
    
    // Get Firestore
    const fs = getFirestore()
    const ideaDoc = await fs.collection('ip').doc(id).get()
    
    if (!ideaDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Idea not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const ideaData = ideaDoc.data()
    
    // Check if NDA exists
    if (!ideaData.ndaCid) {
      return new Response(
        JSON.stringify({ error: 'No NDA available for this idea' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Fetch the NDA PDF from IPFS
    const ndaUrl = `${process.env.PINATA_GATEWAY}/ipfs/${ideaData.ndaCid}`
    const ndaResponse = await fetch(ndaUrl)
    
    if (!ndaResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve NDA document' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const ndaBuffer = await ndaResponse.arrayBuffer()
    
    // Return the PDF file
    return new Response(ndaBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="nda_idea_${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('NDA download error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}