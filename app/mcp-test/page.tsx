'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MCPTestPage() {
  const [response, setResponse] = useState<string>(
    'Click a button to test an MCP method'
  )
  const [loading, setLoading] = useState<boolean>(false)

  async function testMethod(method: string) {
    setLoading(true)
    setResponse('Loading...')

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          id: Date.now(),
        }),
      })

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setResponse(`Error: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto space-y-8 px-4">
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              MCP API Test
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-4">
              <p className="text-white/90 leading-relaxed">
                Test the Multi-Context Protocol (MCP) API endpoints. Click the
                buttons below to test various methods:
              </p>

              <div className="flex space-x-3 py-4">
                <Button
                  onClick={() => testMethod('initialize')}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                >
                  Initialize
                </Button>

                <Button
                  onClick={() => testMethod('ping')}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                >
                  Ping
                </Button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-white/70 mb-2">
                  Response:
                </h3>
                <pre className="bg-muted/20 p-4 rounded-xl overflow-auto text-sm text-white/90 h-60">
                  {response}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
