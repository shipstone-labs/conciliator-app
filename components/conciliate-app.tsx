"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { DEFAULT_INVENTION } from "@/lib/constants";
import { Textarea } from "./ui/textarea";
import Chat from "./chat";

const Logo = () => (
  <svg viewBox="0 0 400 120" className="w-full max-w-md mx-auto mb-8">
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
      Conciliate
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
  START: "start",
  DISCUSSION: "discussion",
  EVALUATION: "evaluation",
  END: "end",
};

const ConciliateApp = ({ tokenId }: { tokenId?: string }) => {
  const [appState, setAppState] = useState(AppStates.START);
  const [content, setContent] = useState(DEFAULT_INVENTION);
  const [name, setName] = useState("Untitled Invention");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant" | "system"; content: string }[]
  >([]);
  const handleStart = async () => {
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
  };

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
    if (tokenId && !messages.length) {
      (async () => {
        setAppState(AppStates.DISCUSSION);
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
        console.log(_resultMessages, description, name);
        setIsLoading(false);
      })();
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
          placeholder="IP Document"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleStart} className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying connectivity to my brain...
            </>
          ) : (
            "Start Discovery Session"
          )}
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
        <Chat messages={messages} onSend={handleAskQuestion} />
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
