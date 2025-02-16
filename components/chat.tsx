"use client";

import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { type MouseEvent, useCallback, useState } from "react";

export default function ChatUI({
  messages,
  onSend,
  onNewIP,
  onSave,
}: {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  onSend: (message: string) => Promise<void>;
  onNewIP?: (event: MouseEvent<HTMLButtonElement>) => void;
  onSave?: (
    event: MouseEvent<HTMLButtonElement>
  ) => Promise<{ IpfsHash: string } | undefined>;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [downloads, setDownloads] = useState<{ url: string; title: string }[]>(
    []
  );
  const hasStop =
    (messages || []).find((message) => {
      return (
        message?.role === "assistant" &&
        /^(STOP),(\d+)$/i.test(message?.content)
      );
    }) != null;
  const handleSend = useCallback(async () => {
    if (input.trim()) {
      setSending(true);
      try {
        await onSend(input);
        setInput("");
      } finally {
        setSending(false);
      }
    }
  }, [input, onSend]);

  const handleSave = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      if (!onSave) {
        return;
      }
      if (messages.length > 0) {
        setSending(true);
        try {
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

          const newDownloads = [
            ...downloads,
            {
              title: IpfsHash,
              url: `/api/download/${IpfsHash}`,
            },
          ];
          setDownloads(newDownloads);
        } finally {
          setSending(false);
        }
      }
    },
    [downloads, messages.length, onSave]
  );
  const getHighlightClass = (answer: string) => {
    switch (answer) {
      case "YES":
        return "bg-green-100 border-green-500";
      case "NO":
        return "bg-red-100 border-red-500";
      case "STOP":
        return "bg-yellow-100 border-yellow-500";
      default:
        return "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey || e.ctrlKey) {
        // Insert a linefeed
        setInput((prev) => `${prev}\n`);
      } else {
        // Prevent default behavior of adding a new line
        e.preventDefault();
        // Trigger the send action
        handleSend();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {(messages || []).map((message, index) => {
          const isSpecial =
            message?.role === "assistant" &&
            /^(Yes|No|STOP),(\d+)$/i.test(message?.content);
          let highlightClass = "";
          let rating = "";
          let answer = "";
          if (isSpecial) {
            const [, extractedAnswer, extractedRating] =
              /^(Yes|No|STOP),(\d+)$/i.exec(message?.content) || [];
            highlightClass = getHighlightClass(answer.toUpperCase());
            rating = extractedRating;
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
                  className={`p-4 flex flex-row justify-between items-center rounded-lg border w-full ${highlightClass}`}
                >
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
                  <div>
                    {/STOP/i.test(answer)
                      ? "Thank you for your chat. My job as conciliator is to ensure that you have enough information to gauge your level of interest in this project, and you have reached that point. We look forward to your bid for this IP."
                      : answer}
                  </div>
                  <div className="text-sm">
                    <strong>Rating</strong> {rating}/10
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
                    {message.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="bg-gray-50 border-t p-4">
        <div className="relative">
          {/* Textarea */}
          <Textarea
            autoFocus
            placeholder={
              hasStop ? "The conversation has ended" : "Type your question..."
            }
            value={input}
            disabled={sending || hasStop}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} // Handle Enter and Shift + Enter
            className="resize-none bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-full h-[120px] pr-16 rounded-lg" // Adjust height and padding for the button
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || hasStop || input === ""} // Disable condition
            className={`absolute bottom-3 right-3 flex items-center justify-center w-12 h-12 rounded-full border transition ${
              sending || hasStop
                ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                : "bg-white border-blue-500 hover:bg-blue-50"
            }`}
            aria-label="Send"
          >
            {sending ? (
              // Stop Button
              <div className="w-6 h-6 bg-black" /> // Black square for "Stop"
            ) : (
              // Up Arrow Button
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5 transition"
                fill="none"
                stroke={
                  sending || hasStop || input === "" ? "#A0AEC0" : "#3B82F6"
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
        </div>

        {/* Buttons Below */}
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
          {onSave ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={sending || messages.length < 2}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition 
      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 
      hover:bg-gray-300 
      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:focus:ring-0"
            >
              Save Chat Snapshot
            </button>
          ) : null}
        </div>
      </div>
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
  );
}
