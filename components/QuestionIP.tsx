'use client'

import { type MouseEvent, useCallback, useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Chat from './chat'
// Logo removed from non-home pages
import Loading from './Loading'
import { useIP } from '@/hooks/useIP'
import { useStytch } from '@stytch/nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const AppStates = {
  LOADING: 'loading',
  START: 'start',
  DISCUSSION: 'discussion',
  EVALUATION: 'evaluation',
  END: 'end',
}

const QuestionIP = ({
  docId,
  onNewIP,
}: {
  docId: string
  onNewIP: (event: MouseEvent<HTMLButtonElement>) => void
}) => {
  const router = useRouter()
  const ideaData = useIP(docId) // Get idea data for context
  const [appState, setAppState] = useState(AppStates.LOADING)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant' | 'system'; content: string }[]
  >([])
  const ipDoc = useIP(docId)
  const stytchClient = useStytch()

  useEffect(() => {
    if (docId) {
      if (!messages.length) {
        ;(async () => {
          setIsLoading(true)
          const { messages: _resultMessages } = await fetch('/api/concilator', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${
                stytchClient?.session?.getTokens()?.session_jwt
              }`,
            },
            body: JSON.stringify({
              id: docId,
              messages,
            }),
          }).then((res) => {
            if (!res.ok) {
              throw new Error('Failed to store invention')
            }
            return res.json()
          })
          setMessages(_resultMessages)
          setIsLoading(false)
          setAppState(AppStates.DISCUSSION)
        })()
      }
    } else {
      setAppState(AppStates.START)
    }
  }, [docId, messages, stytchClient?.session])

  const handleAskQuestion = useCallback(
    async (question: string) => {
      setIsLoading(true)
      try {
        // First update the messages array with the user's question so it's visible immediately
        const userMessage = { role: 'user' as const, content: question }
        setMessages((prevMessages) => [...prevMessages, userMessage])

        // Then make the API request
        const { messages: _resultMessages } = await fetch('/api/concilator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${
              stytchClient?.session?.getTokens?.()?.session_jwt
            }`,
          },
          body: JSON.stringify({
            id: docId,
            messages: [...messages, userMessage],
          }),
        }).then((res) => {
          if (!res.ok) {
            throw new Error('Failed to process request')
          }
          return res.json()
        })

        setMessages(_resultMessages)
      } catch (error) {
        console.error('Error processing request:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [messages, docId, stytchClient?.session]
  )

  const handleSave = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetch('/api/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: docId,
          messages,
        }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error('Failed to store invention')
        }
        return res.json()
      })
      return data
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [messages, docId])

  // Function to navigate back to details page
  const goToDetails = useCallback(() => {
    router.push(`/details/${docId}`)
  }, [router, docId])

  if (appState === AppStates.LOADING || !ipDoc) {
    return (
      <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <Loading />
          <p className="text-white/70 mt-4">Loading discovery session...</p>
        </div>
      </Card>
    )
  }

  const renderDiscussionState = () => (
    <div className="space-y-4">
      {/* Add Return to Details button above chat */}
      <div className="mb-4">
        <Button
          onClick={goToDetails}
          variant="outline"
          className="text-white/90 hover:bg-white/10 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Details
        </Button>
      </div>

      <Chat
        messages={messages}
        onSend={handleAskQuestion}
        onNewIP={onNewIP}
        onSave={handleSave}
        doc={ipDoc}
        isLoading={isLoading}
      />
    </div>
  )

  const renderEvaluationState = () => (
    <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
      <CardHeader className="pb-4 border-b border-white/10">
        <CardTitle className="text-2xl font-bold text-primary">
          Value Assessment
        </CardTitle>
        <CardDescription className="text-white/90 mt-2">
          Based on the information exchanged, evaluate the potential value
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex space-x-3">
          <Button
            onClick={() => setAppState(AppStates.END)}
            variant="outline"
            className="flex-1 border-white/20 text-white/90 hover:bg-muted/30 py-3"
          >
            Insufficient Value
          </Button>
          <Button
            onClick={() => setAppState(AppStates.END)}
            className="flex-1 bg-primary hover:bg-primary/80 text-black font-medium py-3 transition-all shadow-lg"
          >
            Pursue Further
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderEndState = () => (
    <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
      <CardHeader className="pb-4 border-b border-white/10">
        <CardTitle className="text-2xl font-bold text-primary">
          Session Complete
        </CardTitle>
        <CardDescription className="text-white/90 mt-2">
          Thank you for using the Discovery Session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => {
            setAppState(AppStates.DISCUSSION)
            setMessages([])
          }}
          className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-4 rounded-md transition-all shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          Start New Session
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto space-y-8 px-4">
        {/* Unified header with details page */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {ideaData?.name || 'Untitled Idea'}
          </h1>
          {ideaData && (
            <div className="mt-1 mb-4">
              <h2 className="text-xl font-medium text-white/90">Agent View</h2>
              <div className="flex justify-center mt-2 gap-2">
                {Array.isArray(ideaData.tags) && ideaData.tags.length > 0 ? (
                  ideaData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 text-xs font-medium bg-white/10 text-white/60 rounded-full">
                    {ideaData.category || 'Intellectual Property'}
                  </span>
                )}
              </div>
            </div>
          )}
          <p className="text-white/70">
            Explore your idea through interactive conversation
          </p>
        </div>

        {/* Render appropriate state */}
        {appState === AppStates.DISCUSSION && renderDiscussionState()}
        {appState === AppStates.EVALUATION && renderEvaluationState()}
        {appState === AppStates.END && renderEndState()}
      </div>
    </div>
  )
}

export default QuestionIP
