import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// For now, we'll create a placeholder that logs submissions
// The Google Sheets integration will be added once credentials are configured
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, ipType } = body

    // Validate required fields
    if (!name || !email || !ipType) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // TODO: When Google credentials are configured, uncomment and update this section
    /*
    // Parse Google Service Account credentials
    const googleServiceAccount = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'
    )
    const sheetId = process.env.GOOGLE_SHEET_ID

    if (!googleServiceAccount.client_email || !sheetId) {
      console.error('Google Sheets configuration missing')
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // Create JWT client
    const jwtClient = new google.auth.JWT(
      googleServiceAccount.client_email,
      undefined,
      googleServiceAccount.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    )

    // Authorize and get sheets client
    await jwtClient.authorize()
    const sheets = google.sheets({ version: 'v4', auth: jwtClient })

    // Append to Google Sheet
    const timestamp = new Date().toISOString()
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[name, email, ipType, timestamp]]
      }
    })
    */

    // For now, just log the submission
    console.log('New AI signup submission:', {
      name,
      email,
      ipType,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully submitted',
    })
  } catch (error) {
    console.error('Error processing signup:', error)
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}

// Placeholder GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'AI Signup API endpoint',
    status: 'ready',
  })
}
