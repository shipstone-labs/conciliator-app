"use client";

import { useCallback, useState, useRef, useEffect } from "react";
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
// Imports below are commented as logo is now in global header
// import Link from 'next/link'
// import Image from 'next/image'
import LogoffButton from "@/components/LogoffButton";
import { useStytchUser } from "@stytch/nextjs";

const AppIP = () => {
  const { user, isInitialized } = useStytchUser();
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [businessModel, setBusinessModel] = useState("Protected Evaluation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleStore = useCallback(async () => {
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
      window.location.href = `/details/${tokenId}`;
    } catch (err) {
      console.error("API Key validation error:", err);
      setError((err as { message: string }).message);
    } finally {
      setIsLoading(false);
    }
  }, [content, description, name]);

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

  // Reset terms when content changes
  useEffect(() => {
    setTermsAccepted(false);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 bg-gradient-to-b from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Logo removed from non-home pages - now using global header logo
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
        */}

        {/* LogoffButton positioned in top-right corner */}
        {isInitialized && user ? (
          <div className="fixed top-20 right-4 z-20">
            <LogoffButton className="bg-primary hover:bg-primary/80 text-black font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105">
              Logout
            </LogoffButton>
          </div>
        ) : null}
        <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              Add Your Idea
            </CardTitle>
            <CardDescription className="text-white/90 mt-2 text-base">
              Complete all three steps below to create your secure idea page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2">
              <h3 className="font-semibold text-primary text-sm mb-1">
                Step 1: Public Information
              </h3>
              <p className="text-sm text-white/90">
                First enter the publicly available information you want to use
                to describe your idea. This information will be publicly
                available on the Internet.
              </p>
            </div>
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
                className="border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary rounded-xl h-11"
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
                className="min-h-24 border-white/20 bg-muted/50 text-white placeholder:text-white/60 focus:border-primary rounded-xl"
              />
            </div>

            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2 mt-4">
              <h3 className="font-semibold text-primary text-sm mb-1">
                Step 2: Private Document
              </h3>
              <p className="text-sm text-white/90">
                Now you need to add a text or markdown file that contains the
                details about your idea. The file will be encrypted so that only
                you can access it.
              </p>
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
                    className="text-secondary hover:text-secondary/80 hover:bg-muted/30 rounded-xl"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleOpenFileDialog}
                variant="outline"
                className="w-full border border-white/20 bg-muted/30 text-white hover:bg-muted/50 py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 h-12"
                disabled={isLoading || !name || !description}
              >
                Add and Encrypt your Idea
              </Button>
            )}

            {error && (
              <Alert
                variant="destructive"
                className="border-red-300 bg-red-500/20"
              >
                <AlertDescription className="text-white">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success message shown when content exists */}
            {content && (
              <div className="p-4 rounded-lg border border-primary/30 bg-muted/30 mb-2 mt-4">
                <p className="text-sm font-semibold text-primary mb-1">
                  ✓ Document Encrypted
                </p>
                <p className="text-sm text-white/90">
                  Your Idea is safely encrypted.
                </p>
              </div>
            )}

            {/* Step 3 section - always visible */}
            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2 mt-4">
              <h3 className="font-semibold text-primary text-sm mb-1">
                Step 3: Share Your Idea
              </h3>
              <p className="text-sm text-white/90">
                Now, you can choose how you want to share it. Click
                <strong> Set Terms </strong> to configure sharing options.
              </p>
            </div>

            {/* Set Terms button - disabled until content exists */}
            <Button
              onClick={() => setIsTermsModalOpen(true)}
              variant="outline"
              className="w-full border border-white/20 text-white/90 hover:bg-muted/30 py-3 px-4 rounded-xl transition-all h-12"
              disabled={isLoading || !content}
            >
              Set Terms
            </Button>

            {/* Create Page explanation */}
            <div className="p-4 rounded-lg border border-white/20 bg-muted/30 mb-2 mt-4">
              <p className="text-sm text-white/90">
                Clicking <strong>View Idea Page</strong> takes you to your new
                Idea page. You can share this page address with others to test
                the Conciliator.
              </p>
            </div>

            {/* Button moved below the note */}
            <Button
              onClick={handleStore}
              className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 h-12 mt-4"
              disabled={
                isLoading || !content || !name || !description || !termsAccepted
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to the Conciliator (this may take a minute or so)
                </>
              ) : (
                "View Idea Page"
              )}
            </Button>

            {/* File upload modal */}
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Upload Your Idea"
            >
              <div className="space-y-4">
                <p className="text-white/90">
                  Select a text or markdown file containing your idea
                  description. This file will be encrypted and stored securely.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelection}
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-xl"
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
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
                    className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-xl h-11"
                    disabled={true} // Only Protected Evaluation is available
                  >
                    <option value="Trade Secret" disabled>
                      Trade Secret
                    </option>
                    <option value="Provisional Patent" disabled>
                      Provisional Patent
                    </option>
                    <option value="Protected Evaluation">
                      Protected Evaluation
                    </option>
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
                      className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-xl h-11"
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
                      className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-xl h-11"
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
                    className="w-full p-3 border border-white/20 bg-muted/30 text-white rounded-xl h-11"
                  />
                </div>

                <div className="flex justify-between space-x-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsTermsModalOpen(false)}
                    className="text-white/90 hover:bg-muted/50 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Save terms logic would go here
                      setTermsAccepted(true);
                      setIsTermsModalOpen(false);
                    }}
                    className="bg-primary hover:bg-primary/80 text-black font-medium transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 rounded-xl h-11"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </Modal>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppIP;
