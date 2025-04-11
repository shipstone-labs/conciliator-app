'use client'

import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import Link from 'next/link'
import type { IPDoc } from '@/lib/types'
import { useStytch } from '@stytch/nextjs'

// Skeleton loader component for messages
const MessageSkeleton = ({
  type = 'user',
}: {
  type?: 'user' | 'assistant'
}) => {
  const isAssistant = type === 'assistant'
  return (
    <div className="flex items-start space-x-4 animate-pulse">
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A1B25] border border-[#FFD700]/50 flex items-center justify-center">
          <div className="w-6 h-6 bg-muted/20 rounded-full" />
        </div>
      )}
      <div
        className={`p-4 rounded-lg max-w-3xl backdrop-blur-sm ${
          isAssistant
            ? 'bg-background/30 border border-white/10 w-24'
            : 'bg-primary/10 border border-primary/30 w-4/5'
        }`}
      >
        {isAssistant ? (
          // Assistant skeleton - just a single short word (Yes/No)
          <div className="h-4 bg-white/10 rounded w-16" />
        ) : (
          // User skeleton - one short line for a question
          <>
            <div className="h-4 bg-white/20 rounded w-full mb-2" />
            <div className="h-4 bg-white/20 rounded w-1/2" />
          </>
        )}
      </div>
    </div>
  )
}

function parseAnswer(message: { content: string }) {
  return /^(?<answer>Yes|No|Stop)/i.exec(message.content || '')?.groups
}

export default function ChatUI({
  messages,
  doc,
  onSend,
  onNewIP,
  onSave,
}: {
  doc: IPDoc
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  onSend: (message: string) => Promise<void>
  onNewIP?: (event: MouseEvent<HTMLButtonElement>) => void
  onSave?: (
    event: MouseEvent<HTMLButtonElement>
  ) => Promise<{ IpfsHash: string } | undefined>
  isLoading?: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState<'none' | 'user' | 'assistant'>('none')
  const [downloads, setDownloads] = useState<{ url: string; title: string }[]>(
    []
  )
  const [autoCompleting, setAutoCompleting] = useState(false)
  const stytchClient = useStytch()

  // State to track if we're in the process of stopping auto-discovery
  const [isStopping, setIsStopping] = useState(false)

  // Toggle auto-discovery state
  const onAutoComplete = useCallback(() => {
    const newState = !autoCompleting

    if (newState) {
      // Starting auto-discovery
      console.log('🟢 Starting auto-discovery')
      setAutoCompleting(true)
      isAutoDiscoveryActive.current = true
      // Note: The useEffect will trigger the first cycle
    } else {
      // Stopping auto-discovery
      console.log('🔴 Stopping auto-discovery')
      setAutoCompleting(false)
      isAutoDiscoveryActive.current = false

      // Show temporary stopping state
      setIsStopping(true)

      // Reset stopping state after a short delay
      setTimeout(() => {
        setIsStopping(false)
      }, 1000)
    }
  }, [autoCompleting])

  const hasStop = useMemo(
    () =>
      (messages || []).find((message) => {
        return (
          message?.role === 'assistant' && /^(STOP)/i.test(message?.content)
        )
      }) != null,
    [messages]
  )

  // Simple flag to track if a discovery cycle is running
  const [cycleInProgress, setCycleInProgress] = useState(false)

  // This acts as a semaphore to ensure only one discovery cycle runs at a time
  const cycleRunning = useRef(false)

  // CRITICAL: We use a ref to keep track of auto-discovery state so it can be
  // accessed from anywhere, including inside closures, without stale values
  const isAutoDiscoveryActive = useRef(false)

  // Main function to run a complete cycle (seeker → conciliator)
  const runDiscoveryCycle = useCallback(async () => {
    // Don't start if component unmounted, stopped, or already running
    if (!isMounted.current || !isAutoDiscoveryActive.current || hasStop) {
      console.log(
        '⛔ Auto-discovery not active or component unmounted, not starting cycle'
      )
      return
    }

    // CRITICAL: Strict enforcement of only one cycle running at a time
    // This ensures the ping-pong pattern
    if (cycleRunning.current) {
      console.log('🚫 Already running a cycle, not starting another')
      return
    }

    // Set lock flag FIRST before any async operations
    cycleRunning.current = true
    setCycleInProgress(true)

    try {
      console.log('🔍 Starting seeker')

      // Check if auto-complete was turned off - use our ref
      if (!isAutoDiscoveryActive.current) {
        console.log('❌ Auto-complete turned off, aborting')
        // Make sure to reset flags when aborting
        cycleRunning.current = false
        setCycleInProgress(false)
        setLoading('none')
        return
      }

      // Now show user question skeleton - only right before the actual API call
      setLoading('user')

      // 2. Call seeker API to generate question
      console.log('📤 Calling seeker API')

      // Create an abort controller for canceling the fetch if needed
      const abortController = new AbortController()
      const signal = abortController.signal

      // We'll no longer abort in-flight requests
      // Let any started API call complete for consistency
      const checkInterval = setInterval(() => {
        if (!isAutoDiscoveryActive.current) {
          console.log(
            'Auto-discovery turned off, but letting API call complete'
          )
          clearInterval(checkInterval)
        }
      }, 200)

      let seekerResponse: Response
      try {
        seekerResponse = await fetch('/api/seeker', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${
              stytchClient?.session?.getTokens?.()?.session_jwt || ''
            }`,
          },
          body: JSON.stringify({ messages, tokenId: doc.tokenId }),
          signal,
        })

        // Clear the checking interval since we don't need it anymore
        clearInterval(checkInterval)
      } catch (error) {
        // Simple error logging for API failures
        console.log('❌ API fetch failed:', error)

        // Always clear the interval
        clearInterval(checkInterval)

        // Wait a brief moment to show the user the skeleton is cancelling
        // This provides better visual feedback that something is happening
        await new Promise((r) => setTimeout(r, 800))

        // Now reset all states
        cycleRunning.current = false
        setCycleInProgress(false)
        setLoading('none')
        return
      }

      // Handle seeker API errors - CRITICAL: stop the entire process on API errors
      if (!seekerResponse.ok) {
        console.log('❌ Seeker API error - stopping auto-discovery')
        // Force stop auto-discovery completely on API error
        isAutoDiscoveryActive.current = false
        setAutoCompleting(false)
        if (isStopping) {
          setIsStopping(false)
        }
        // Make sure to reset flags when aborting
        cycleRunning.current = false
        setCycleInProgress(false)
        setLoading('none')
        return
      }

      // Check if auto-discovery was turned off
      if (!isAutoDiscoveryActive.current) {
        console.log('❌ Auto-discovery turned off')
        cycleRunning.current = false
        setCycleInProgress(false)
        setLoading('none')
        return
      }

      const seekerData = await seekerResponse.json()

      // Validate response - use our ref
      if (
        !seekerResponse.ok ||
        !seekerData.success ||
        !seekerData.messages?.length ||
        !isAutoDiscoveryActive.current
      ) {
        console.log('❌ Invalid seeker response or auto-complete turned off')
        // Reset stopping state if we're aborting
        if (isStopping) {
          setIsStopping(false)
        }
        // Make sure to reset flags when aborting
        cycleRunning.current = false
        setCycleInProgress(false)
        setLoading('none')
        return
      }

      const question =
        seekerData.messages[seekerData.messages.length - 1]?.content
      if (!question || !isAutoDiscoveryActive.current) {
        console.log('❌ Empty question or auto-complete turned off')
        // Reset stopping state if we're aborting
        if (isStopping) {
          setIsStopping(false)
        }
        // Make sure to reset flags when aborting
        cycleRunning.current = false
        setCycleInProgress(false)
        setLoading('none')
        return
      }

      console.log('✅ Got question from seeker')

      // Check if auto-discovery is still active before proceeding to next step
      if (!isAutoDiscoveryActive.current) {
        console.log('Auto-discovery turned off, not proceeding to conciliator')
        cycleRunning.current = false
        setCycleInProgress(false)
        setLoading('none')
        return
      }

      // Only now switch to assistant skeleton - immediately before the API call
      setLoading('assistant')

      // 4. Call conciliator API with the generated question
      console.log('📤 Calling conciliator API')
      try {
        await onSend(question)
      } catch (conciliatorError) {
        console.log(
          '❌ Conciliator API error - stopping auto-discovery',
          conciliatorError
        )
        // Force stop auto-discovery completely on API error
        isAutoDiscoveryActive.current = false
        setAutoCompleting(false)
        if (isStopping) {
          setIsStopping(false)
        }
        setLoading('none')
        cycleRunning.current = false
        setCycleInProgress(false)
        return
      }

      // Clear loading state immediately after the API call completes
      if (!isAutoDiscoveryActive.current) {
        setLoading('none')
      }

      console.log('✅ Got response from conciliator')

      // 5. Reset loading state
      setLoading('none')

      // Always reset the running flags to properly complete the current cycle
      cycleRunning.current = false
      setCycleInProgress(false)

      // Let's check if we should continue with auto-discovery
      if (!isMounted.current || !isAutoDiscoveryActive.current) {
        console.log(
          '⏹ Auto-discovery was turned off or component unmounted - not continuing'
        )
        return
      }

      // If we haven't reached a STOP, schedule next cycle
      if (!hasStop) {
        console.log('🔄 Scheduling next cycle')

        // IMPORTANT: Make sure we're not already running a cycle
        // This is critical to maintain the ping-pong pattern
        if (cycleRunning.current) {
          console.log(
            '⚠️ Warning: Cycle is still marked as running, not scheduling next cycle'
          )
          // Reset the flag to prevent deadlock
          cycleRunning.current = false
          return
        }

        // Use setTimeout for a small delay between cycles
        setTimeout(() => {
          // Critical safety checks before starting next cycle:
          // 1. Make sure component is still mounted
          // 2. Make sure auto-discovery is still active
          // 3. Make sure we're not already running a cycle
          // 4. Make sure we haven't reached STOP
          if (
            isMounted.current &&
            isAutoDiscoveryActive.current &&
            !hasStop &&
            !cycleRunning.current
          ) {
            console.log('🔄 Starting next cycle')
            runDiscoveryCycle()
          } else {
            console.log(
              '⏹ Next cycle canceled - component unmounted, discovery inactive, or cycle already running'
            )
          }
        }, 300)
      } else {
        console.log('⏹ Discovery finished with STOP - not continuing')
      }
    } catch (error) {
      console.error('Error in discovery cycle:', error)
    } finally {
      // Always ensure we reset state in case of errors
      setLoading('none')
      cycleRunning.current = false
      setCycleInProgress(false)
    }
  }, [
    hasStop,
    messages,
    onSend,
    isStopping,
    doc,
    stytchClient?.session?.getTokens,
  ])

  // Add a mounted ref to track component lifecycle
  const isMounted = useRef(true)

  // Handle component lifecycle for hot reloads
  useEffect(() => {
    // Set mounted flag when component mounts
    isMounted.current = true

    // Clean up function that runs when component unmounts (including during hot reloads)
    return () => {
      // Set mounted flag to false
      isMounted.current = false

      // Immediately cancel any auto-discovery in progress
      if (isAutoDiscoveryActive.current) {
        console.log('🛑 Component unmounting - canceling auto-discovery')
        isAutoDiscoveryActive.current = false
        cycleRunning.current = false
      }
    }
  }, [])

  // Effect to start the discovery cycle when auto-complete is turned on
  useEffect(() => {
    // Only run if component is still mounted
    if (!isMounted.current) return

    // Only sync from state to ref when turning ON auto-discovery
    if (autoCompleting) {
      isAutoDiscoveryActive.current = true
    }

    // Start the cycle if needed - with strict safety checks for the ping-pong pattern
    if (autoCompleting && !hasStop && !cycleRunning.current) {
      // Double-check we're not already running something
      console.log('🔄 Auto-discovery turned on - starting first cycle')
      // We're intentionally NOT setting cycleRunning.current here
      // runDiscoveryCycle will set it at the beginning to ensure atomicity
      runDiscoveryCycle()
    }
  }, [autoCompleting, hasStop, runDiscoveryCycle])

  // Handle user sending a message
  const handleSend = useCallback(async () => {
    if (!input.trim() || cycleRunning.current) return

    try {
      // Don't allow manual messages during auto-discovery
      if (autoCompleting) {
        console.log('Cannot send message while auto-discovery is in progress')
        return
      }

      // Set flags to prevent other operations
      cycleRunning.current = true
      setCycleInProgress(true)

      // Show user's message being sent - right before the API call
      setLoading('user')

      // Create a temp variable to store the input since we'll clear it
      const messageToSend = input.trim()
      setInput('')

      // Briefly wait to allow UI to update
      await new Promise((r) => setTimeout(r, 100))

      // Show conciliator thinking - right before the API call
      setLoading('assistant')

      // Send to conciliator
      await onSend(messageToSend)
    } finally {
      // Reset all flags
      setLoading('none')
      cycleRunning.current = false
      setCycleInProgress(false)
    }
  }, [input, onSend, autoCompleting])

  // Handle saving chat snapshot
  const handleSave = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      if (!onSave || messages.length === 0 || cycleRunning.current) return

      // Don't allow saving during auto-discovery
      if (autoCompleting) {
        console.log('Cannot save while auto-discovery is in progress')
        return
      }

      try {
        // Set flag to prevent other operations
        cycleRunning.current = true
        setCycleInProgress(true)
        setLoading('assistant')

        const result = await onSave(event)

        if (!result) {
          alert('Failed to save the snapshot.')
          return
        }

        const { IpfsHash } = result

        if (downloads.find((file) => file.title === IpfsHash)) {
          alert('This snapshot has already been saved.')
          return
        }

        setDownloads([
          ...downloads,
          {
            title: IpfsHash,
            url: `/api/download/${IpfsHash}`,
          },
        ])
      } finally {
        // Reset all flags
        setLoading('none')
        cycleRunning.current = false
        setCycleInProgress(false)
      }
    },
    [downloads, messages.length, onSave, autoCompleting]
  )
  const getHighlightClass = (answer: string) => {
    switch (answer.toUpperCase()) {
      case 'YES':
        return 'bg-primary/10 border border-primary'
      case 'NO':
        return 'bg-secondary/10 border border-secondary'
      case 'STOP':
        return 'bg-brand/10 border border-brand'
      default:
        return 'bg-background/40 border border-white/10'
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        if (e.shiftKey || e.ctrlKey) {
          // Insert a linefeed
          setInput((prev) => `${prev}\n`)
        } else {
          // Prevent default behavior of adding a new line
          e.preventDefault()
          // Trigger the send action
          if (!autoCompleting) {
            handleSend()
          }
        }
      }
    },
    [autoCompleting, handleSend]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useLayoutEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, downloads, loading]) // Dependencies to trigger the effect

  const messageWithIndex: { role: string; content: string; index?: number }[] =
    useMemo(() => {
      let index = 1
      return (messages || []).map((message, _index) => {
        if (message.role === 'assistant' && _index !== 0) {
          return {
            ...message,
            index: index++,
          }
        }
        return message
      })
    }, [messages])
  return (
    <Card
      ref={cardRef}
      className="w-full mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl"
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Discovery Session
        </CardTitle>
        <CardDescription>
          {doc.name} - {doc.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(messageWithIndex || []).map((message, index) => {
          const isSpecial =
            message?.role === 'assistant' && parseAnswer(message) != null
          let highlightClass = ''
          // let questionNumber = 0;
          let answer = ''
          if (isSpecial) {
            const parsedAnswer = parseAnswer(message)
            const extractedAnswer = parsedAnswer?.answer || ''
            highlightClass = getHighlightClass(extractedAnswer)
            answer = extractedAnswer
          }
          return (
            <div
              key={`${message.role}-${message.content}-${index}`}
              className="flex flex-col space-y-2"
            >
              {/* Highlight the previous user message if the current assistant message is special */}
              {isSpecial ? (
                <div
                  className={`p-4 flex flex-row items-center rounded-lg border w-full backdrop-blur-lg ${highlightClass}`}
                >
                  {/* Avatar for Assistant */}
                  {message.role === 'assistant' && (
                    <div className="flex flex-row items-center space-x-2 mr-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A1B25] border border-[#FFD700] text-white flex items-center justify-center">
                        {message.index || ''}
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A1B25] border border-[#FFD700] text-white flex items-center justify-center overflow-hidden">
                        <Image
                          src="/svg/Black+Yellow.svg"
                          alt="Conciliator Logo"
                          width={32}
                          height={32}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="p-1 rounded-lg">
                      <div className="whitespace-pre-wrap break-words markdown-content font-semibold text-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {answer === 'You have reached your question limit.'
                            ? 'Thank you for your chat. My job as conciliator is to ensure that you have enough information to gauge your level of interest in this project, and you have reached that point. We look forward to your bid for this IP.'
                            : answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-4">
                  {/* Optional Avatar for Assistant */}
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A1B25] border border-[#FFD700] text-white flex items-center justify-center overflow-hidden">
                      <Image
                        src="/svg/Black+Yellow.svg"
                        alt="Conciliator Logo"
                        width={32}
                        height={32}
                      />
                    </div>
                  )}

                  {/* Chat Bubble */}
                  <div
                    className={`p-4 rounded-lg max-w-3xl backdrop-blur-sm ${
                      message.role === 'user'
                        ? 'bg-primary/10 border border-primary/30'
                        : message.role === 'assistant'
                          ? 'bg-background/40 border border-white/10'
                          : 'bg-muted/30 text-sm italic border border-white/5'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Show skeleton loader when loading */}
        {loading !== 'none' && (
          <div className="mt-4">
            {loading === 'user' && <MessageSkeleton type="user" />}
            {loading === 'assistant' && <MessageSkeleton type="assistant" />}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex flex-col w-full">
          <div className="p-4 w-full">
            <div className="relative">
              {/* Textarea */}
              <Textarea
                autoFocus
                placeholder={
                  hasStop
                    ? 'The conversation has ended'
                    : 'Type your question...'
                }
                value={input}
                disabled={loading !== 'none' || hasStop}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown} // Handle Enter and Shift + Enter
                className="resize-none bg-background/40 border-white/10 focus:ring-primary focus:border-primary w-full h-[120px] pr-16 rounded-lg backdrop-blur-sm text-white placeholder:text-white/50" // Adjust height and padding for the button
              />
              {!autoCompleting ? (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    cycleInProgress || hasStop || input === '' || autoCompleting
                  } // Disable condition
                  className={`absolute bottom-3 right-3 flex items-center justify-center w-12 h-12 rounded-full border transition ${
                    cycleInProgress || hasStop
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                      : 'bg-white border-blue-500 hover:bg-blue-50'
                  }`}
                  aria-label="Send"
                >
                  {cycleInProgress ? (
                    // Loading indicator (black square)
                    <div className="w-6 h-6 bg-black" />
                  ) : (
                    // Up Arrow Button
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 transition"
                      fill="none"
                      stroke={
                        cycleInProgress || hasStop || input === ''
                          ? '#A0AEC0'
                          : '#3B82F6'
                      } // Gray when disabled, blue otherwise
                      strokeWidth="3" // Thicker arrow
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Send</title>
                      <path d="M12 19V7M5 12l7-7 7 7" />
                    </svg>
                  )}
                </button>
              ) : null}
            </div>

            {/* Buttons Below */}
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center space-x-2">
                {/* API state indicator for debugging */}
                <span className="ml-4 text-xs text-white/50 bg-background/30 px-2 py-1 rounded-full border border-white/10">
                  {cycleInProgress ? 'Processing' : 'Ready'}
                </span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              {onNewIP ? (
                <button
                  type="button"
                  onClick={onNewIP}
                  className="bg-background/40 text-white/80 px-6 py-2 rounded-lg transition
      backdrop-blur-sm border border-white/10
      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-opacity-50 
      hover:bg-background/60
      disabled:bg-background/20 disabled:text-white/30 disabled:cursor-not-allowed disabled:hover:bg-background/20 disabled:focus:ring-0"
                >
                  Create a New IP
                </button>
              ) : null}
              <button
                type="button"
                onClick={onAutoComplete}
                disabled={hasStop}
                className={`px-6 py-2 rounded-lg font-medium transition 
      focus:outline-none focus:ring-2 focus:ring-opacity-50 
      ${
        hasStop
          ? 'bg-gray-500 text-white focus:ring-gray-400'
          : autoCompleting
            ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground focus:ring-secondary/40'
            : isStopping
              ? 'bg-brand text-brand-foreground focus:ring-brand/40 cursor-wait'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary/40'
      } 
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                {hasStop
                  ? 'Discovery Finished'
                  : autoCompleting
                    ? 'Stop'
                    : isStopping
                      ? 'Stopping...'
                      : 'Start Auto-Discovery'}
              </button>
              {onSave ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    cycleInProgress ||
                    messages.length < 2 ||
                    autoCompleting ||
                    isStopping
                  }
                  className="bg-background/40 text-white/80 px-6 py-2 rounded-lg transition
      backdrop-blur-sm border border-white/10
      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-opacity-50 
      hover:bg-background/60
      disabled:bg-background/20 disabled:text-white/30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:focus:ring-0"
                >
                  Save Chat Snapshot
                </button>
              ) : null}
              <Link
                type="button"
                href="/list-ip"
                className="bg-background/40 text-white/80 px-6 py-2 rounded-lg transition
      backdrop-blur-sm border border-white/10
      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-opacity-50 
      hover:bg-background/60
      disabled:bg-background/20 disabled:text-white/30 disabled:cursor-not-allowed disabled:hover:bg-background/20 disabled:focus:ring-0"
              >
                IP Docs
              </Link>
            </div>
          </div>
          <div className="w-full">
            {downloads.length > 0 && (
              <div className="mt-4 p-4 rounded-lg border border-white/20 bg-background/40 backdrop-blur-lg shadow-md">
                <h3 className="text-lg font-bold text-white/90 mb-3 flex items-center">
                  <span className="mr-2">📦</span> Saved Snapshots
                </h3>
                <ul className="space-y-3">
                  {downloads.map((file) => (
                    <li key={file.url} className="flex items-center">
                      <a
                        href={file.url}
                        download={file.title}
                        className="text-primary hover:text-primary/80 transition-colors flex items-center px-3 py-2 rounded-md bg-muted/20 border border-primary/20 w-full"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <title>Download</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                          />
                        </svg>
                        <span className="truncate">{file.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
