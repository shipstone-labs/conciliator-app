"use client";

import { Textarea } from "@/components/ui/textarea";
import { type MouseEvent, useCallback, useState } from "react";

export default function ChatUI({
  messages,
  onSend,
  onNewIP,
}: {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  onSend: (message: string) => Promise<void>;
  onNewIP?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

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
          console.log(message, isSpecial, highlightClass, rating);
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
                      A
                    </div>
                  )}
                  <div>{answer}</div>
                  <div className="text-sm">
                    <strong>Rating</strong> {rating}/10
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-4">
                  {/* Optional Avatar for Assistant */}
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      A
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
        <div className="flex items-center space-x-4">
          <Textarea
            placeholder="Type your message..."
            value={input}
            disabled={sending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} // Handle Enter and Shift + Enter
            className="flex-1 resize-none bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex-shrink-0 flex flex-col space-y-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Send
            </button>
            {onNewIP ? (
              <button
                type="button"
                onClick={onNewIP}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Create a New IP
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
