import { NextRequest } from 'next/server'
import { getFirestore } from './firebase'
import { getUser } from './stytch'
import { storeNdaPdf } from '@/lib/ndaUtils'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

// This endpoint attaches the standard NDA to an idea
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const userResponse = await getUser(req)
    
    const { id, pdfBase64 } = await req.json()
    
    if (!id || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Get Firestore
    const fs = getFirestore()
    const ideaDoc = await fs.collection('ip').doc(id).get()
    
    if (!ideaDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Idea not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Store the PDF
    const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64')
    const cid = await storeNdaPdf(pdfBuffer, `nda_${id}.pdf`)
    
    // Update the idea document with NDA information
    await fs.collection('ip').doc(id).update({
      ndaCid: cid,
      updatedAt: FieldValue.serverTimestamp()
    })
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        ndaCid: cid 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('NDA attachment error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}