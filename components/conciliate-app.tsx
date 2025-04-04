"use client";

import React, {
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
  useRef,
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
import { Modal } from "./ui/modal";
import Chat from "./chat";
import { Logo } from "./Logo";
import Loading from "./Loading";
import Link from "next/link";

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
  const [degraded, setDegraded] = useState(false);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant" | "system"; content: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  
  const handleOpenFileDialog = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const handleFileSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit");
      return;
    }
    
    // Check file type (only text and markdown)
    if (!file.type.includes('text') && !file.name.endsWith('.md')) {
      setError("Only text and markdown files are supported");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      setContent(fileContent);
      setIsModalOpen(false);
    };
    reader.readAsText(file);
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
          degraded,
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
          content,
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
  }, [content, description, messages, name]);

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
        <CardTitle className="text-2xl">Add Your Idea</CardTitle>
        <CardDescription>
          First enter the publically available information you want to use to describe your idea. 
          This information will be publically available on the Internet.
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
        {content ? (
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">File uploaded successfully</p>
              <Button 
                onClick={() => setContent("")} 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleOpenFileDialog}
            variant="outline"
            className="w-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-md"
            disabled={isLoading || !name || !description}
          >
            Add and Encrypt your Idea
          </Button>
        )}
        <div className="text-xs text-gray-500 -mt-2">
          Text and Markdown files under 2MB are requested
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          disabled={isLoading || !content || !name || !description}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to the Conciliator (this make take a minute or so)
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
        
        {/* File upload modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Your Idea">
          <div className="space-y-4">
            <p className="text-gray-600">
              Select a text or markdown file containing your idea description. 
              This file will be encrypted and stored securely.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelection}
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Select File
              </Button>
            </div>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );

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
    />
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
    return <Loading />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/"
          className="fixed top-6 left-6 bg-gray-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-700 transition-all"
        >
          🏠
        </Link>
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
