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
          <div className="w-6 h-6 bg-blue-200 rounded-full" />
        </div>
      )}
      <div
        className={`p-4 rounded-lg max-w-3xl ${
          isAssistant ? "bg-gray-100 w-24" : "bg-blue-100 w-4/5"
        }`}
      >
        {isAssistant ? (
          // Assistant skeleton - just a single short word (Yes/No)
          <div className="h-4 bg-gray-300 rounded w-16" />
        ) : (
          // User skeleton - one short line for a question
          <>
            <div className="h-4 bg-gray-300 rounded w-full mb-2" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
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

  // State to track if we're in the process of stopping auto-discovery
  const [isStopping, setIsStopping] = useState(false);

  // Toggle auto-complete state with proper ref handling
  const onAutoComplete = useCallback(() => {
    const newState = !autoCompleting;

    if (newState) {
      // Starting auto-discovery
      console.log("🟢 Starting auto-discovery");
      // CRITICAL: Update both the React state and our ref
      setAutoCompleting(true);
      isAutoDiscoveryActive.current = true;
      setIsStopping(false);
      // Note: The useEffect will trigger the first cycle
    } else {
      // Stopping auto-discovery - graceful stop
      console.log("🔴 Gracefully stopping auto-discovery");

      // 1. Set the stopping state to true to indicate we're in transition
      setIsStopping(true);

      // 2. Set the React state to false, but keep the ref true until operations complete
      setAutoCompleting(false);
      // NOTE: We intentionally keep isAutoDiscoveryActive.current = true for now
      // This allows in-progress operations to complete

      // 3. Let current operations complete
      console.log(
        "🟠 Auto-discovery will complete current operations before stopping"
      );

      // The in-progress operations will self-terminate when they're done
      // because they check isAutoDiscoveryActive.current before scheduling the next cycle
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

  // CRITICAL: We use a ref to keep track of auto-discovery state so it can be
  // accessed from anywhere, including inside closures, without stale values
  const isAutoDiscoveryActive = useRef(false);

  // Main function to run a complete cycle (seeker → conciliator)
  const runDiscoveryCycle = useCallback(async () => {
    // Don't start if we're stopped or already running
    // CRITICAL: Check our ref instead of the React state
    if (!isAutoDiscoveryActive.current || hasStop) {
      console.log("⛔ Auto-discovery not active, not starting cycle");
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

      // Check if auto-complete was turned off - use our ref
      if (!isAutoDiscoveryActive.current) {
        console.log("❌ Auto-complete turned off, aborting");
        // Make sure to reset flags when aborting
        cycleRunning.current = false;
        setCycleInProgress(false);
        setLoading("none");
        return;
      }

      // Now show user question skeleton - only right before the actual API call
      setLoading("user");

      // 2. Call seeker API to generate question
      console.log("📤 Calling seeker API");

      // Create an abort controller for canceling the fetch if needed
      const abortController = new AbortController();
      const signal = abortController.signal;

      // Set up a check to abort if autoComplete is turned off
      // But only abort if we're NOT in the "stopping" state (we want to complete in-progress operations)
      const checkInterval = setInterval(() => {
        // Check our ref value which is always current
        // Only abort if auto-discovery is turned off AND we're not in the stopping state
        if (!isAutoDiscoveryActive.current && !isStopping) {
          console.log(
            "🛑 Aborting seeker API call because auto-complete was turned off"
          );
          abortController.abort();
          clearInterval(checkInterval);
        }
      }, 100);

      let seekerResponse;
      try {
        seekerResponse = await fetch("/api/seeker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
          signal,
        });

        // Clear the checking interval since we don't need it anymore
        clearInterval(checkInterval);
      } catch (error) {
        // Handle fetch abort or network errors
        if (error.name === "AbortError") {
          console.log("🛑 Seeker API fetch aborted by user");
        } else {
          console.log("❌ Seeker API fetch failed:", error);
        }

        // Always clear the interval
        clearInterval(checkInterval);

        // Wait a brief moment to show the user the skeleton is cancelling
        // This provides better visual feedback that something is happening
        await new Promise((r) => setTimeout(r, 800));

        // Now reset all states
        cycleRunning.current = false;
        setCycleInProgress(false);
        setLoading("none");
        return;
      }

      // Handle errors - use our ref
      if (!seekerResponse.ok || !isAutoDiscoveryActive.current) {
        console.log("❌ Seeker API error or auto-complete turned off");
        // Make sure to reset flags when aborting
        cycleRunning.current = false;
        setCycleInProgress(false);
        setLoading("none");
        return;
      }

      const seekerData = await seekerResponse.json();

      // Validate response - use our ref
      if (
        !seekerData.success ||
        !seekerData.messages?.length ||
        !isAutoDiscoveryActive.current
      ) {
        console.log("❌ Invalid seeker response or auto-complete turned off");
        // Make sure to reset flags when aborting
        cycleRunning.current = false;
        setCycleInProgress(false);
        setLoading("none");
        return;
      }

      const question =
        seekerData.messages[seekerData.messages.length - 1]?.content;
      if (!question || !isAutoDiscoveryActive.current) {
        console.log("❌ Empty question or auto-complete turned off");
        // Make sure to reset flags when aborting
        cycleRunning.current = false;
        setCycleInProgress(false);
        setLoading("none");
        return;
      }

      console.log("✅ Got question from seeker");

      // One more check before calling conciliator - use our ref
      if (!isAutoDiscoveryActive.current) {
        console.log("❌ Auto-complete turned off before conciliator call");
        // Make sure to reset flags when aborting
        cycleRunning.current = false;
        setCycleInProgress(false);
        setLoading("none");
        return;
      }

      // Only now switch to assistant skeleton - immediately before the API call
      setLoading("assistant");

      // 4. Call conciliator API with the generated question
      console.log("📤 Calling conciliator API");
      await onSend(question, degraded);

      // Clear loading state immediately after the API call completes
      if (!isAutoDiscoveryActive.current) {
        setLoading("none");
      }

      console.log("✅ Got response from conciliator");

      // 5. Reset loading state
      setLoading("none");

      // Check if we're in the "stopping" state
      if (isStopping) {
        // We've completed the current operation while in stopping state
        // Now it's safe to fully stop auto-discovery
        console.log(
          "✅ Current operation completed while stopping - now fully stopping"
        );
        isAutoDiscoveryActive.current = false;
        setIsStopping(false);
        cycleRunning.current = false;
        setCycleInProgress(false);
        return;
      }

      // Only continue auto-discovery if it's still enabled
      if (isAutoDiscoveryActive.current && !hasStop) {
        // Important: We need to schedule the next cycle *after* we've reset all flags
        // to ensure we don't kick off multiple cycles

        // Reset flags first
        cycleRunning.current = false;
        setCycleInProgress(false);

        // Use requestAnimationFrame for better timing and to ensure we're out of this
        // execution context before starting the next cycle
        console.log("🔄 Scheduling next cycle");
        requestAnimationFrame(() => {
          // Double-check that auto-discovery is still wanted using our ref
          if (
            isAutoDiscoveryActive.current &&
            !hasStop &&
            !cycleRunning.current
          ) {
            console.log("🔄 Starting next cycle");
            runDiscoveryCycle();
          } else {
            console.log("⏹ Not starting next cycle - auto-discovery inactive");
          }
        });
      } else {
        // If auto-complete was turned off, just reset the flags
        console.log("⏹ Auto-discovery inactive - not scheduling next cycle");
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
  }, [hasStop, messages, onSend, degraded, isStopping]);

  // Effect to start the discovery cycle when auto-complete is turned on
  useEffect(() => {
    // Sync our ref with the state whenever autoCompleting changes
    isAutoDiscoveryActive.current = autoCompleting;

    // Start the cycle if needed
    if (isAutoDiscoveryActive.current && !hasStop && !cycleRunning.current) {
      console.log("🔄 Auto-discovery turned on - starting first cycle");
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

      // Show user's message being sent - right before the API call
      setLoading("user");

      // Create a temp variable to store the input since we'll clear it
      const messageToSend = input.trim();
      setInput("");

      // Briefly wait to allow UI to update
      await new Promise((r) => setTimeout(r, 100));

      // Show conciliator thinking - right before the API call
      setLoading("assistant");

      // Send to conciliator
      await onSend(messageToSend, degraded);
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
                  disabled={
                    cycleInProgress || hasStop || input === "" || autoCompleting
                  } // Disable condition
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
                disabled={hasStop}
                className={`px-6 py-2 rounded-lg font-medium transition 
      focus:outline-none focus:ring-2 focus:ring-opacity-50 
      ${
        autoCompleting
          ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-400"
          : isStopping
          ? "bg-orange-500 text-white focus:ring-orange-400 cursor-wait"
          : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-400"
      } 
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                {autoCompleting ? "Stop" : isStopping ? "Stopping..." : "Start"}{" "}
                Auto-Discovery
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
