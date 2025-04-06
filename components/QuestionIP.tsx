"use client";

import { type MouseEvent, useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Chat from "./chat";
// Logo removed from non-home pages
import Loading from "./Loading";
// Link and Image imports removed - no longer needed

const AppStates = {
  LOADING: "loading",
  START: "start",
  DISCUSSION: "discussion",
  EVALUATION: "evaluation",
  END: "end",
};

const QuestionIP = ({
  tokenId,
  onNewIP,
}: {
  tokenId: string;
  onNewIP: (event: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const [appState, setAppState] = useState(AppStates.LOADING);
  const [name, setName] = useState("");
  const [degraded, setDegraded] = useState(false);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant" | "system"; content: string }[]
  >([]);

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

  const handleAskQuestion = useCallback(
    async (question: string) => {
      setIsLoading(true);
      try {
        // First update the messages array with the user's question so it's visible immediately
        const userMessage = { role: "user" as const, content: question };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        // Then make the API request
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
            messages: [...messages, userMessage],
            degraded,
          }),
        }).then((res) => {
          if (!res.ok) {
            throw new Error("Failed to process request");
          }
          return res.json();
        });

        setDescription(description);
        setName(name);
        setMessages(_resultMessages);
      } catch (error) {
        console.error("Error processing request:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, tokenId, degraded]
  );

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetch("/api/snapshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          messages,
        }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to store invention");
        }
        return res.json();
      });
      return data as { IpfsHash: string };
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, [description, messages, name]);

  const renderDiscussionState = () => (
    <Chat
      messages={messages}
      onSend={handleAskQuestion}
      onNewIP={onNewIP}
      onSave={handleSave}
      name={name}
      degraded={degraded}
      setDegraded={setDegraded}
      description={description}
      isLoading={isLoading}
    />
  );

  const renderEvaluationState = () => (
    <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
      <CardHeader className="pb-4">
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
  );

  const renderEndState = () => (
    <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Session Complete
        </CardTitle>
        <CardDescription className="text-white/90 mt-2">
          Thank you for using the Discovery Session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => {
            setAppState(AppStates.DISCUSSION);
            setMessages([]);
          }}
          className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-4 rounded-md transition-all shadow-lg hover:shadow-primary/30 hover:scale-105"
        >
          Start New Session
        </Button>
      </CardContent>
    </Card>
  );

  if (appState === AppStates.LOADING && tokenId) {
    return <Loading />;
  }
  return (
    <div className="min-h-screen bg-background p-6 bg-gradient-to-b from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Home link removed - now available in global header */}
        {appState === AppStates.DISCUSSION && renderDiscussionState()}
        {appState === AppStates.EVALUATION && renderEvaluationState()}
        {appState === AppStates.END && renderEndState()}
      </div>
    </div>
  );
};

export default QuestionIP;
