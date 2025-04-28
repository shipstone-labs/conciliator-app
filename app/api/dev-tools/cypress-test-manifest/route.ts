import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export async function GET() {
  try {
    const manifestPath = path.join(
      process.cwd(),
      'dev-tools',
      'cypress-test-manifest.json'
    )
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    return NextResponse.json(manifest)
  } catch (error) {
    console.error('Error reading test manifest:', error)
    return NextResponse.json(
      { error: 'Failed to read test manifest' },
      { status: 500 }
    )
  }
}
