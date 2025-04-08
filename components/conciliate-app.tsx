"use client";

import {
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
// Logo removed from non-home pages
import Loading from "./Loading";
import Link from "next/link";
import Image from "next/image";

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
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [businessModel, setBusinessModel] = useState("Protected Evaluation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
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

  // Removed handleClear since Reset Fields button was removed

  const handleOpenFileDialog = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleFileSelection = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setError("File size exceeds 2MB limit");
        return;
      }

      // Check file type (only text and markdown)
      if (!file.type.includes("text") && !file.name.endsWith(".md")) {
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
    },
    []
  );

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

  const renderStartState = () => (
    <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-primary">
          Add Your Idea
        </CardTitle>
        <CardDescription className="text-white/90 mt-2 text-base">
          First enter the publicly available information you want to use to
          describe your idea. This information will be publicly available on the
          Internet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="public-title"
            className="text-sm font-medium text-white/90 block"
          >
            Public Title
          </label>
          <Input
            id="public-title"
            placeholder="Enter the title that will appear in public listings"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="public-description"
            className="text-sm font-medium text-white/90 block"
          >
            Public Description
          </label>
          <Textarea
            id="public-description"
            placeholder="Enter a description that will be visible to the public"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="min-h-24 border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary"
          />
        </div>

        {content ? (
          <div className="p-4 rounded-lg border border-primary/30 bg-muted/30">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-white">
                File uploaded successfully
              </p>
              <Button
                onClick={() => setContent("")}
                variant="ghost"
                size="sm"
                className="text-secondary hover:text-secondary/80"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleOpenFileDialog}
            variant="outline"
            className="w-full border border-white/20 bg-muted/30 text-white hover:bg-muted/50 py-3 px-4 rounded-md transition-all"
            disabled={isLoading || !name || !description}
          >
            Add and Encrypt your Idea
          </Button>
        )}
        <div className="text-xs text-white/70 -mt-2">
          Text and Markdown files under 2MB are supported
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-300 bg-red-500/20">
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleStart}
          className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-4 rounded-md transition-all shadow-lg hover:shadow-primary/30 hover:scale-105"
          disabled={isLoading || !content || !name || !description}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting to the Conciliator (this may take a minute or so)
            </>
          ) : (
            "Start Discovery Session"
          )}
        </Button>

        {/* Note below the Start Button */}
        <div className="mt-2 p-4 rounded-lg border border-white/20 bg-muted/30">
          <p className="text-sm text-white/90">
            This creates a new page for your IP. Share the address to the new
            page with others to test the Conciliator with the IP you added.
          </p>
        </div>

        {/* Set Terms button */}
        <Button
          onClick={() => setIsTermsModalOpen(true)}
          variant="outline"
          className="w-full border border-white/20 text-white/90 hover:bg-muted/30 py-3 px-4 rounded-md transition-all"
          disabled={isLoading}
        >
          Set Terms
        </Button>

        {/* File upload modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Upload Your Idea"
        >
          <div className="space-y-4">
            <p className="text-white/90">
              Select a text or markdown file containing your idea description.
              This file will be encrypted and stored securely.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelection}
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-md"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-white/90 hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
              >
                Select File
              </Button>
            </div>
          </div>
        </Modal>
        
        {/* Terms Modal */}
        <Modal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          title="Set Terms"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="business-model"
                className="text-sm font-medium text-white/90 block"
              >
                Business Model
              </label>
              <select
                id="business-model"
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value)}
                className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-md"
                disabled={true} // Only Protected Evaluation is available
              >
                <option value="Trade Secret" disabled>Trade Secret</option>
                <option value="Provisional Patent" disabled>Provisional Patent</option>
                <option value="Protected Evaluation">Protected Evaluation</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="start-date"
                  className="text-sm font-medium text-white/90 block"
                >
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label
                  htmlFor="end-date"
                  className="text-sm font-medium text-white/90 block"
                >
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-md"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label
                htmlFor="price"
                className="text-sm font-medium text-white/90 block"
              >
                Price (USD)
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-md"
              />
            </div>
            
            <div className="flex justify-between space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setIsTermsModalOpen(false)}
                className="text-white/90 hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Save terms logic would go here
                  setIsTermsModalOpen(false);
                }}
                className="bg-primary hover:bg-primary/80 text-black font-medium transition-all"
              >
                Accept
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
      isLoading={isLoading}
    />
  );

  const renderEvaluationState = () => (
    <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-primary">Value Assessment</CardTitle>
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
            setAppState(AppStates.START);
            setError(null);
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
        <Link
          href="/"
          className="fixed top-6 left-6 bg-[#1A1B25] w-12 h-12 flex items-center justify-center rounded-full shadow-xl hover:bg-[#1A1B25]/90 transition-all z-50 overflow-hidden border border-[#FFD700]"
        >
          <Image
            src="/svg/Black+Yellow.svg"
            alt="Home"
            width={26}
            height={26}
            className="transform scale-125"
          />
        </Link>
        {appState === AppStates.START && renderStartState()}
        {appState === AppStates.DISCUSSION && renderDiscussionState()}
        {appState === AppStates.EVALUATION && renderEvaluationState()}
        {appState === AppStates.END && renderEndState()}
      </div>
    </div>
  );
};

export default ConciliateApp;
