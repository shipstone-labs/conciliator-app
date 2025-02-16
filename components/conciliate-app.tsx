"use client";

import React, {
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Textarea } from "./ui/textarea";
import Chat from "./chat";

const Logo = () => (
  <svg viewBox="0 0 600 120" className="w-full max-w-md mx-auto mb-8">
    <title>logo</title>
    <circle cx="85" cy="60" r="28" fill="#60A5FA" opacity="0.15" />
    <text
      x="130"
      y="75"
      fontFamily="Arial, sans-serif"
      fontSize="48"
      fontWeight="bold"
      fill="#3B82F6"
    >
      Conciliator Project
    </text>
    <path
      d="M45 60 Q85 30 125 60"
      stroke="#3B82F6"
      fill="none"
      strokeWidth="2.5"
      opacity="0.7"
    />
    <circle cx="258" cy="45" r="5" fill="#3B82F6" />
    <text
      x="130"
      y="95"
      fontFamily="Arial, sans-serif"
      fontSize="14"
      fill="#3B82F6"
    >
      Valuing Agreement
    </text>
  </svg>
);

const AppStates = {
  LOADING: "loading",
  START: "start",
  DISCUSSION: "discussion",
  EVALUATION: "evaluation",
  END: "end",
};

const ConciliateApp = ({
  tokenId,
  onNewIP,
}: {
  tokenId?: string;
  onNewIP?: (event: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const [appState, setAppState] = useState(AppStates.LOADING);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant" | "system"; content: string }[]
  >([]);
  const handleStart = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await fetch("/api/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          content,
          description,
        }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to store invention");
        }
        return res.json();
      });
      const { tokenId } = data;
      window.location.href = `/${tokenId}`;
    } catch (err) {
      console.error("API Key validation error:", err);
      setError((err as { message: string }).message);
    } finally {
      setIsLoading(false);
    }
  }, [content, description, name]);

  const handleClear = useCallback(() => {
    setContent("");
    setDescription("");
    setName("");
  }, []);

  const handleAskQuestion = useCallback(
    async (question: string) => {
      setIsLoading(true);
      const request = [...messages, { role: "user", content: question }];
      const {
        messages: _resultMessages,
        name,
        description,
      } = await fetch("/api/concilator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId,
          messages: request,
        }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to store invention");
        }
        return res.json();
      });
      setDescription(description);
      setName(name);
      setMessages(_resultMessages);
      console.log(_resultMessages, description, name);
    },
    [messages, tokenId]
  );

  useEffect(() => {
    if (tokenId) {
      if (!messages.length) {
        (async () => {
          setIsLoading(true);
          const {
            messages: _resultMessages,
            name,
            description,
          } = await fetch("/api/concilator", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tokenId,
              messages,
            }),
          }).then((res) => {
            if (!res.ok) {
              throw new Error("Failed to store invention");
            }
            return res.json();
          });
          setDescription(description);
          setName(name);
          setMessages(_resultMessages);
          setIsLoading(false);
          setAppState(AppStates.DISCUSSION);
        })();
      }
    } else {
      setAppState(AppStates.START);
    }
  }, [tokenId, messages]);

  //   const handleGenerateQuestion = useCallback(async () => {
  //     setIsLoading(true);
  //     setError(null);

  //     try {
  //       const seekerData = await makeOpenAIRequest([
  //         {
  //           role: "system",
  //           content: `You are the Seeker in an invention value discovery session. You represent potential users/buyers of innovations, seeking to understand their value and applicability.
  // Context:
  // - The Matcher requires yes/no questions to control information flow
  // - Your goal is to understand the innovation's value and applicability
  // - Craft questions strategically to build understanding within the yes/no format

  // Previous exchanges: ${JSON.stringify(exchanges)}

  // Generate your next strategic question. It must be answerable with yes/no. Respond with ONLY the question, no other text.`,
  //         },
  //       ]);

  //       const generatedQuestion = seekerData.choices[0].message.content.trim();
  //     } catch (err) {
  //       setError((err as { message: string }).message);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }, [exchanges]);

  const renderStartState = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">IP Value Discovery</CardTitle>
        <CardDescription>
          Discover the value of intellectual property through structured
          dialogue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Public Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
        <Textarea
          placeholder="Public Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />
        <Textarea
          placeholder="IP Document (Secret)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to the Consiliator (this make take a minute or so)
            </>
          ) : (
            "Start Discovery Session"
          )}
        </Button>
        {/* Note below the Start Button */}
        <div className="mt-2 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-700">
            This creates a new page for your IP. Share the address to the new
            page with others to test the Conciliator with the IP you added.
          </p>
        </div>
        <Button
          onClick={handleClear}
          variant="ghost"
          className="w-full border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounded-md"
          disabled={isLoading}
        >
          Reset Fields
        </Button>
      </CardContent>
    </Card>
  );

  const renderDiscussionState = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Discovery Session</CardTitle>
        <CardDescription>
          {name} - {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Chat
          messages={messages}
          onSend={handleAskQuestion}
          onNewIP={onNewIP}
        />
      </CardContent>
    </Card>
  );

  const renderEvaluationState = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Value Assessment</CardTitle>
        <CardDescription>
          Based on the information exchanged, evaluate the potential value
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button
            onClick={() => setAppState(AppStates.END)}
            variant="outline"
            className="flex-1"
          >
            Insufficient Value
          </Button>
          <Button onClick={() => setAppState(AppStates.END)} className="flex-1">
            Pursue Further
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEndState = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Session Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => {
            setAppState(AppStates.START);
            setError(null);
          }}
          className="w-full"
        >
          Start New Session
        </Button>
      </CardContent>
    </Card>
  );

  if (appState === AppStates.LOADING && tokenId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading IP Conciliate
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Logo />
        {appState === AppStates.START && renderStartState()}
        {appState === AppStates.DISCUSSION && renderDiscussionState()}
        {appState === AppStates.EVALUATION && renderEvaluationState()}
        {appState === AppStates.END && renderEndState()}
      </div>
    </div>
  );
};

export default ConciliateApp;
