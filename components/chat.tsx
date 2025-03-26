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

  // Simply toggle auto-complete state
  const onAutoComplete = useCallback(() => {
    setAutoCompleting((prev) => !prev);
  }, []);

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

  // State to track when a request is in progress
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);

  // Main auto-complete function - runs once and manages a single question generation
  const generateNextQuestion = useCallback(async () => {
    // Don't start if auto-complete is off or we've reached a stop
    if (!autoCompleting || hasStop) {
      setRequestInProgress(false);
      return;
    }

    // Don't run if there's already a request in progress
    if (requestInProgress) {
      setPendingRequest(true);
      return;
    }

    // Only start if the last message was from the assistant
    const lastMessage =
      messages.length > 0 ? messages[messages.length - 1] : null;
    const canStartCycle = !lastMessage || lastMessage.role === "assistant";

    if (!canStartCycle) {
      setRequestInProgress(false);
      return;
    }

    try {
      setRequestInProgress(true);
      setPendingRequest(false);

      // First show user skeleton
      setLoading("user");
      await new Promise((r) => setTimeout(r, 500)); // Show for 500ms

      // Make sure we're still in auto-complete mode
      if (!autoCompleting) {
        setLoading("none");
        setRequestInProgress(false);
        return;
      }

      // Call the seeker API
      const response = await fetch("/api/seeker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      // Check if we're still active
      if (!autoCompleting) {
        setLoading("none");
        setRequestInProgress(false);
        return;
      }

      if (!response.ok) {
        console.error("Error from seeker API");
        setLoading("none");
        setRequestInProgress(false);
        return;
      }

      const data = await response.json();

      // Check if we're still active
      if (!autoCompleting) {
        setLoading("none");
        setRequestInProgress(false);
        return;
      }

      if (!data.success || !data.messages?.length) {
        console.error("No messages returned from seeker");
        setLoading("none");
        setRequestInProgress(false);
        return;
      }

      const content = data.messages[data.messages.length - 1]?.content;
      if (!content) {
        console.error("Empty content from seeker");
        setLoading("none");
        setRequestInProgress(false);
        return;
      }

      // Switch to assistant skeleton
      setLoading("assistant");

      // Send to conciliator
      await onSend(content, degraded);

      // Final check if we're still active
      if (!autoCompleting) {
        setLoading("none");
        setRequestInProgress(false);
        return;
      }

      // Done - reset loading state
      setLoading("none");

      // Request is complete
      setRequestInProgress(false);

      // Schedule the next cycle if auto-complete is still on
      if (autoCompleting && !hasStop) {
        setTimeout(() => {
          if (autoCompleting && !hasStop) {
            generateNextQuestion();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error in auto-complete cycle:", error);
      setLoading("none");
      setRequestInProgress(false);
    }
  }, [autoCompleting, hasStop, messages, onSend, degraded, requestInProgress]);

  // Effect to initiate auto-complete when turned on or status changes
  useEffect(() => {
    if (autoCompleting && !requestInProgress && !hasStop) {
      generateNextQuestion();
    }
  }, [autoCompleting, requestInProgress, hasStop, generateNextQuestion]);

  // Effect to process pending requests when the current one finishes
  useEffect(() => {
    if (pendingRequest && !requestInProgress && autoCompleting && !hasStop) {
      setPendingRequest(false);
      generateNextQuestion();
    }
  }, [
    pendingRequest,
    requestInProgress,
    autoCompleting,
    hasStop,
    generateNextQuestion,
  ]);

  // Handle user sending a message
  const handleSend = useCallback(async () => {
    if (!input.trim() || requestInProgress) return;

    try {
      setRequestInProgress(true);
      setLoading("user");

      // Show user skeleton briefly
      await new Promise((r) => setTimeout(r, 300));

      // Switch to assistant skeleton
      setLoading("assistant");

      // Send to conciliator
      await onSend(input, degraded);
      setInput("");
    } finally {
      setTimeout(() => {
        setLoading("none");
        setRequestInProgress(false);
      }, 500);
    }
  }, [input, onSend, degraded, requestInProgress]);

  // Handle saving chat snapshot
  const handleSave = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      if (!onSave || messages.length === 0 || requestInProgress) return;

      try {
        setRequestInProgress(true);
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
        setTimeout(() => {
          setLoading("none");
          setRequestInProgress(false);
        }, 500);
      }
    },
    [downloads, messages.length, onSave, requestInProgress]
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
                  disabled={requestInProgress || hasStop || input === ""} // Disable condition
                  className={`absolute bottom-3 right-3 flex items-center justify-center w-12 h-12 rounded-full border transition ${
                    requestInProgress || hasStop
                      ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                      : "bg-white border-blue-500 hover:bg-blue-50"
                  }`}
                  aria-label="Send"
                >
                  {requestInProgress ? (
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
                        loading !== "none" || hasStop || input === ""
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
                disabled={hasStop || (requestInProgress && !autoCompleting)}
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
                  disabled={requestInProgress || messages.length < 2}
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
