"use client";

import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@radix-ui/react-label";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Link from "next/link";

// Skeleton loader component for messages
const MessageSkeleton = ({
  type = "user",
}: {
  type?: "user" | "assistant";
}) => {
  const isAssistant = type === "assistant";
  return (
    <div className="flex items-start space-x-4 animate-pulse">
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center">
          <div className="w-6 h-6 bg-blue-200 rounded-full"></div>
        </div>
      )}
      <div
        className={`p-4 rounded-lg max-w-3xl ${
          isAssistant ? "bg-gray-100 w-24" : "bg-blue-100 w-4/5"
        }`}
      >
        {isAssistant ? (
          // Assistant skeleton - just a single short word (Yes/No)
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        ) : (
          // User skeleton - one short line for a question
          <>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </>
        )}
      </div>
    </div>
  );
};

function parseAnswer(message: { content: string }) {
  return /^Question #(?<question>\d+): (?<answer>Yes|No|Stop)/i.exec(
    message.content || ""
  )?.groups;
}

export default function ChatUI({
  messages,
  name,
  description,
  onSend,
  onNewIP,
  onSave,
  degraded,
  setDegraded,
}: {
  name: string;
  description: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  degraded: boolean;
  setDegraded: (checked: boolean) => void;
  onSend: (message: string, degraded: boolean) => Promise<void>;
  onNewIP?: (event: MouseEvent<HTMLButtonElement>) => void;
  onSave?: (
    event: MouseEvent<HTMLButtonElement>
  ) => Promise<{ IpfsHash: string } | undefined>;
  isLoading?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState<"none" | "user" | "assistant">("none");
  const [downloads, setDownloads] = useState<{ url: string; title: string }[]>(
    []
  );
  const [autoCompleting, setAutoCompleting] = useState(false);

  // Toggle auto-complete state with proper ref handling
  const onAutoComplete = useCallback(() => {
    const newState = !autoCompleting;
    
    if (newState) {
      // Starting auto-discovery
      console.log("🟢 Starting auto-discovery");
      setAutoCompleting(true);
      // Note: The useEffect will trigger the first cycle
    } else {
      // Stopping auto-discovery
      console.log("🔴 Stopping auto-discovery");
      setAutoCompleting(false);
      // Reset UI state immediately
      setLoading("none");
      // cycleRunning ref will be checked in the cycle function
    }
  }, [autoCompleting]);

  const hasStop = useMemo(
    () =>
      (messages || []).find((message) => {
        return (
          message?.role === "assistant" &&
          /^(STOP),\s*(\d+)/i.test(message?.content)
        );
      }) != null,
    [messages]
  );

  // Simple flag to track if a discovery cycle is running
  const [cycleInProgress, setCycleInProgress] = useState(false);

  // This acts as a semaphore to ensure only one discovery cycle runs at a time
  const cycleRunning = useRef(false);
  
  // Main function to run a complete cycle (seeker → conciliator)
  const runDiscoveryCycle = useCallback(async () => {
    // Don't start if we're stopped or already running
    if (!autoCompleting || hasStop) {
      return;
    }
    
    // Double-check our ref that nothing is running
    if (cycleRunning.current) {
      console.log("🚫 Already running a cycle, not starting another");
      return;
    }
    
    // Set flags to show we're running
    cycleRunning.current = true;
    setCycleInProgress(true);
    
    try {
      console.log("🔍 Starting seeker");
      
      // 1. Show user question skeleton
      setLoading("user");
      await new Promise(r => setTimeout(r, 400));
      
      // Check if auto-complete was turned off during the delay
      if (!autoCompleting) {
        console.log("❌ Auto-complete turned off, aborting");
        return;
      }
      
      // 2. Call seeker API to generate question
      console.log("📤 Calling seeker API");
      const seekerResponse = await fetch("/api/seeker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      
      // Handle errors
      if (!seekerResponse.ok || !autoCompleting) {
        console.log("❌ Seeker API error or auto-complete turned off");
        return;
      }
      
      const seekerData = await seekerResponse.json();
      
      // Validate response
      if (!seekerData.success || !seekerData.messages?.length || !autoCompleting) {
        console.log("❌ Invalid seeker response or auto-complete turned off");
        return;
      }
      
      const question = seekerData.messages[seekerData.messages.length - 1]?.content;
      if (!question || !autoCompleting) {
        console.log("❌ Empty question or auto-complete turned off");
        return;
      }
      
      console.log("✅ Got question from seeker");
      
      // 3. Switch to assistant skeleton for conciliator
      setLoading("assistant");
      
      // 4. Call conciliator API with the generated question
      console.log("📤 Calling conciliator API");
      await onSend(question, degraded);
      
      console.log("✅ Got response from conciliator");
      
      // 5. Reset loading state
      setLoading("none");
      
      // Only continue auto-discovery if it's still enabled
      if (autoCompleting && !hasStop) {
        // Important: We need to schedule the next cycle *after* we've reset all flags
        // to ensure we don't kick off multiple cycles
        
        // Reset flags first
        cycleRunning.current = false;
        setCycleInProgress(false);
        
        // Use requestAnimationFrame for better timing and to ensure we're out of this
        // execution context before starting the next cycle
        console.log("🔄 Scheduling next cycle");
        requestAnimationFrame(() => {
          // Double-check that auto-discovery is still wanted
          if (autoCompleting && !hasStop && !cycleRunning.current) {
            console.log("🔄 Starting next cycle");
            runDiscoveryCycle();
          }
        });
      } else {
        // If auto-complete was turned off, just reset the flags
        cycleRunning.current = false;
        setCycleInProgress(false);
      }
    } catch (error) {
      console.error("Error in discovery cycle:", error);
    } finally {
      // Always ensure we reset if there was an unhandled error
      setLoading("none");
      cycleRunning.current = false;
      setCycleInProgress(false);
    }
  }, [autoCompleting, hasStop, messages, onSend, degraded]);
  
  // Effect to start the discovery cycle when auto-complete is turned on
  useEffect(() => {
    if (autoCompleting && !hasStop && !cycleRunning.current) {
      runDiscoveryCycle();
    }
  }, [autoCompleting, hasStop, runDiscoveryCycle]);

  // Handle user sending a message
  const handleSend = useCallback(async () => {
    if (!input.trim() || cycleRunning.current) return;

    try {
      // Don't allow manual messages during auto-discovery
      if (autoCompleting) {
        console.log("Cannot send message while auto-discovery is in progress");
        return;
      }
      
      // Set flags to prevent other operations
      cycleRunning.current = true;
      setCycleInProgress(true);
      
      // Show user's message being sent
      setLoading("user");
      await new Promise((r) => setTimeout(r, 300));

      // Show conciliator thinking
      setLoading("assistant");

      // Send to conciliator
      await onSend(input, degraded);
      setInput("");
    } finally {
      // Reset all flags
      setLoading("none");
      cycleRunning.current = false;
      setCycleInProgress(false);
    }
  }, [input, onSend, degraded, autoCompleting]);

  // Handle saving chat snapshot
  const handleSave = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      if (!onSave || messages.length === 0 || cycleRunning.current) return;

      // Don't allow saving during auto-discovery
      if (autoCompleting) {
        console.log("Cannot save while auto-discovery is in progress");
        return;
      }

      try {
        // Set flag to prevent other operations
        cycleRunning.current = true;
        setCycleInProgress(true);
        setLoading("assistant");

        const result = await onSave(event);

        if (!result) {
          alert("Failed to save the snapshot.");
          return;
        }

        const { IpfsHash } = result;

        if (downloads.find((file) => file.title === IpfsHash)) {
          alert("This snapshot has already been saved.");
          return;
        }

        setDownloads([
          ...downloads,
          {
            title: IpfsHash,
            url: `/api/download/${IpfsHash}`,
          },
        ]);
      } finally {
        // Reset all flags
        setLoading("none");
        cycleRunning.current = false;
        setCycleInProgress(false);
      }
    },
    [downloads, messages.length, onSave, autoCompleting]
  );
  const getHighlightClass = (answer: string) => {
    switch (answer.toUpperCase()) {
      case "YES":
        return "bg-green-50 border border-green-500";
      case "NO":
        return "bg-red-50 border border-red-500";
      case "STOP":
        return "bg-yellow-50 border border-yellow-500";
      default:
        return "bg-gray-50 border border-gray-300";
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        if (e.shiftKey || e.ctrlKey) {
          // Insert a linefeed
          setInput((prev) => `${prev}\n`);
        } else {
          // Prevent default behavior of adding a new line
          e.preventDefault();
          // Trigger the send action
          if (!autoCompleting) {
            handleSend();
          }
        }
      }
    },
    [autoCompleting, handleSend]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useLayoutEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, downloads, loading]); // Dependencies to trigger the effect

  const messageWithIndex: { role: string; content: string; index?: number }[] =
    useMemo(() => {
      let index = 1;
      return (messages || []).map((message, _index) => {
        if (message.role === "assistant" && _index !== 0) {
          return {
            ...message,
            index: index++,
          };
        }
        return message;
      });
    }, [messages]);
  return (
    <Card ref={cardRef} className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Discovery Session</CardTitle>
        <CardDescription>
          {name} - {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(messageWithIndex || []).map((message, index) => {
          const isSpecial =
            message?.role === "assistant" && parseAnswer(message) != null;
          let highlightClass = "";
          // let questionNumber = 0;
          let answer = "";
          if (isSpecial) {
            const parsedAnswer = parseAnswer(message);
            const extractedAnswer = parsedAnswer?.answer || "";
            highlightClass = getHighlightClass(extractedAnswer);
            answer = extractedAnswer;
          }
          return (
            <div
              key={`${message.role}-${message.content}-${index}`}
              className="flex flex-col space-y-2"
            >
              {/* Highlight the previous user message if the current assistant message is special */}
              {isSpecial ? (
                <div
                  className={`p-4 flex flex-row items-center rounded-lg border w-full ${highlightClass}`}
                >
                  {/* Avatar for Assistant */}
                  {message.role === "assistant" && (
                    <div className="flex flex-row items-center space-x-2 mr-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        {message.index || ""}
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Image
                          src="/logo.png"
                          alt="Logo"
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
                          {answer === "You have reached your question limit."
                            ? "Thank you for your chat. My job as conciliator is to ensure that you have enough information to gauge your level of interest in this project, and you have reached that point. We look forward to your bid for this IP."
                            : answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-4">
                  {/* Optional Avatar for Assistant */}
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        width={32}
                        height={32}
                      />
                    </div>
                  )}

                  {/* Chat Bubble */}
                  <div
                    className={`p-4 rounded-lg max-w-3xl ${
                      message.role === "user"
                        ? "bg-blue-100"
                        : message.role === "assistant"
                        ? "bg-gray-100"
                        : "bg-gray-50 text-sm italic"
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
          );
        })}

        {/* Show skeleton loader when loading */}
        {loading !== "none" && (
          <div className="mt-4">
            {loading === "user" && <MessageSkeleton type="user" />}
            {loading === "assistant" && <MessageSkeleton type="assistant" />}
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
                    ? "The conversation has ended"
                    : "Type your question..."
                }
                value={input}
                disabled={loading !== "none" || hasStop}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown} // Handle Enter and Shift + Enter
                className="resize-none bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-full h-[120px] pr-16 rounded-lg" // Adjust height and padding for the button
              />
              {!autoCompleting ? (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={cycleInProgress || hasStop || input === "" || autoCompleting} // Disable condition
                  className={`absolute bottom-3 right-3 flex items-center justify-center w-12 h-12 rounded-full border transition ${
                    cycleInProgress || hasStop
                      ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                      : "bg-white border-blue-500 hover:bg-blue-50"
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
                        cycleInProgress || hasStop || input === ""
                          ? "#A0AEC0"
                          : "#3B82F6"
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
                <Checkbox
                  id="degraded"
                  checked={degraded}
                  onCheckedChange={(checked) => {
                    if (checked === "indeterminate") {
                      return;
                    }
                    setDegraded(checked);
                  }}
                />
                <Label htmlFor="degraded">Run in degraded mode</Label>
                
                {/* API state indicator for debugging */}
                <span className="ml-4 text-xs text-gray-500">
                  {cycleInProgress ? "Processing" : "Ready"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              {onNewIP ? (
                <button
                  type="button"
                  onClick={onNewIP}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition 
      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 
      hover:bg-gray-300 
      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:focus:ring-0"
                >
                  Create a New IP
                </button>
              ) : null}
              <button
                type="button"
                onClick={onAutoComplete}
                disabled={hasStop || cycleInProgress}
                className={`px-6 py-2 rounded-lg font-medium transition 
      focus:outline-none focus:ring-2 focus:ring-opacity-50 
      ${
        autoCompleting
          ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-400"
          : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-400"
      } 
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                {autoCompleting ? "Stop" : "Start"} Auto-Discovery
              </button>
              {onSave ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={cycleInProgress || messages.length < 2 || autoCompleting}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition 
      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 
      hover:bg-gray-300 
      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:focus:ring-0"
                >
                  Save Chat Snapshot
                </button>
              ) : null}
              <Link
                type="button"
                href="/list-ip"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition 
      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 
      hover:bg-gray-300 
      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:focus:ring-0"
              >
                IP Docs
              </Link>
            </div>
          </div>
          <div className="w-full">
            {downloads.length > 0 && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  Download Snapshots:
                </h3>
                <ul className="space-y-2">
                  {downloads.map((file) => (
                    <li key={file.url}>
                      <a
                        href={file.url}
                        download={file.title}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {file.title}
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
  );
}
