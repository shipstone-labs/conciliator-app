'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

export default function MCPTestPage() {
  const [response, setResponse] = useState<string>(
    'Click a button to test an MCP method'
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [toolName, setToolName] = useState<string>('search_ideas')
  const [resourceId, setResourceId] = useState<string>('idea_catalog')
  const [promptId, setPromptId] = useState<string>('idea_discovery')

  async function testMethod(method: string, params?: any) {
    setLoading(true)
    setResponse('Loading...')

    try {
      const requestBody: any = {
        jsonrpc: '2.0',
        method,
        id: Date.now(),
      }

      if (params) {
        requestBody.params = params
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
                Test the Multi-Context Protocol (MCP) API endpoints. Use the
                tabs below to test various methods.
              </p>

              <Tabs defaultValue="basic">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="prompts">Prompts</TabsTrigger>
                </TabsList>

                {/* Basic Methods Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Methods</h3>
                  <div className="flex space-x-3 py-2">
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
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools" className="space-y-4">
                  <h3 className="text-lg font-medium">Tool Methods</h3>
                  <div className="flex space-x-3 py-2">
                    <Button
                      onClick={() => testMethod('listTools')}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                    >
                      List Tools
                    </Button>
                  </div>

                  <div className="space-y-2 py-2 border-t border-white/10 pt-4">
                    <h4 className="text-md font-medium">Call Tool</h4>
                    <div className="flex items-center space-x-3 max-w-md">
                      <Input
                        value={toolName}
                        onChange={(e) => setToolName(e.target.value)}
                        placeholder="Tool name"
                        className="flex-1"
                      />
                      <Button
                        onClick={() =>
                          testMethod('callTool', {
                            tool: toolName,
                            arguments: {},
                          })
                        }
                        disabled={loading}
                        className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                      >
                        Call Tool
                      </Button>
                    </div>
                    <p className="text-xs text-white/60">
                      Try: search_ideas, examine_idea
                    </p>
                  </div>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources" className="space-y-4">
                  <h3 className="text-lg font-medium">Resource Methods</h3>
                  <div className="flex space-x-3 py-2">
                    <Button
                      onClick={() => testMethod('listResources')}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                    >
                      List Resources
                    </Button>
                  </div>

                  <div className="space-y-2 py-2 border-t border-white/10 pt-4">
                    <h4 className="text-md font-medium">Read Resource</h4>
                    <div className="flex items-center space-x-3 max-w-md">
                      <Input
                        value={resourceId}
                        onChange={(e) => setResourceId(e.target.value)}
                        placeholder="Resource ID"
                        className="flex-1"
                      />
                      <Button
                        onClick={() =>
                          testMethod('readResource', { resource: resourceId })
                        }
                        disabled={loading}
                        className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                      >
                        Read Resource
                      </Button>
                    </div>
                    <p className="text-xs text-white/60">
                      Try: idea_catalog, idea/idea-001
                    </p>
                  </div>
                </TabsContent>

                {/* Prompts Tab */}
                <TabsContent value="prompts" className="space-y-4">
                  <h3 className="text-lg font-medium">Prompt Methods</h3>
                  <div className="flex space-x-3 py-2">
                    <Button
                      onClick={() => testMethod('listPrompts')}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                    >
                      List Prompts
                    </Button>
                  </div>

                  <div className="space-y-2 py-2 border-t border-white/10 pt-4">
                    <h4 className="text-md font-medium">Get Prompt</h4>
                    <div className="flex items-center space-x-3 max-w-md">
                      <Input
                        value={promptId}
                        onChange={(e) => setPromptId(e.target.value)}
                        placeholder="Prompt ID"
                        className="flex-1"
                      />
                      <Button
                        onClick={() =>
                          testMethod('getPrompt', { prompt: promptId })
                        }
                        disabled={loading}
                        className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
                      >
                        Get Prompt
                      </Button>
                    </div>
                    <p className="text-xs text-white/60">Try: idea_discovery</p>
                  </div>
                </TabsContent>
              </Tabs>

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
