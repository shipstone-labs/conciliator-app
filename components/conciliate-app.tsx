"use client";

import React, { useState } from "react";
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
import { v4 } from "uuid";
import { DEFAULT_INVENTION, TUTORIAL_EXCHANGES } from "@/lib/constants";
import { makeOpenAIRequest } from "@/lib/utils";

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

const ConciliateApp = () => {
  const [appState, setAppState] = useState(AppStates.START);
  const [invention, setInvention] = useState(DEFAULT_INVENTION);
  const [isTutorialMode, setIsTutorialMode] = useState(true);
  const [exchanges, setExchanges] = useState<
    Array<{ question: string; answer: string; id: string }>
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorialIndex, setTutorialIndex] = useState(0);

  const handleStart = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await makeOpenAIRequest([{ role: "user", content: "Test" }]);
      setIsTutorialMode(false);
      setExchanges([]);
      setTutorialIndex(0);
      setAppState(AppStates.DISCUSSION);
    } catch (err) {
      console.error("API Key validation error:", err);
      setError((err as { message: string }).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!currentQuestion.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let answer = "";
      if (isTutorialMode) {
        answer = TUTORIAL_EXCHANGES[tutorialIndex].answer;
        setTutorialIndex((prev) => prev + 1);
      } else {
        const matcherData = await makeOpenAIRequest([
          {
            role: "system",
            content: `You are the Matcher in an invention value discovery session.
                     The innovation you're presenting is: \`${invention}\`
                     
                     Your Goals:
                     - Demonstrate value while preserving market worth
                     - Use yes/no answers to control information flow
                     - Stop when further details would risk devaluing the innovation
                     
                     Rules:
                     1. Answer ONLY with "Yes", "No", or "STOP: Question reveals too much"
                     2. Consider both individual answers and cumulative information revealed
                     3. Balance between showing value and protecting implementation details`,
          },
          {
            role: "user",
            content: currentQuestion,
          },
        ]);

        answer = matcherData.choices[0].message.content.trim();

        if (!["Yes", "No"].includes(answer) && !answer.startsWith("STOP")) {
          answer = "STOP: Invalid response format";
        }
      }

      setExchanges((prev) => [
        ...prev,
        { question: currentQuestion, answer, id: v4() },
      ]);
      setCurrentQuestion("");

      if (answer.startsWith("STOP") || exchanges.length >= 9) {
        setAppState(AppStates.EVALUATION);
      }
    } catch (err) {
      setError((err as { message: string }).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isTutorialMode) {
        setCurrentQuestion(TUTORIAL_EXCHANGES[tutorialIndex].question);
      } else {
        const seekerData = await makeOpenAIRequest([
          {
            role: "system",
            content: `You are the Seeker in an invention value discovery session. You represent potential users/buyers of innovations, seeking to understand their value and applicability.

                     Context:
                     - The Matcher requires yes/no questions to control information flow
                     - Your goal is to understand the innovation's value and applicability
                     - Craft questions strategically to build understanding within the yes/no format

                     Previous exchanges: ${JSON.stringify(exchanges)}

                     Generate your next strategic question. It must be answerable with yes/no. Respond with ONLY the question, no other text.`,
          },
        ]);

        const generatedQuestion = seekerData.choices[0].message.content.trim();
        setCurrentQuestion(generatedQuestion);
      }
    } catch (err) {
      setError((err as { message: string }).message);
    } finally {
      setIsLoading(false);
    }
  };

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
          placeholder="Invention Description"
          value={invention}
          onChange={(e) => setInvention(e.target.value)}
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
        <CardDescription>{invention}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {exchanges.map((exchange) => (
            <div key={exchange.id} className="space-y-1">
              <p className="font-medium">Q: {exchange.question}</p>
              <p className="text-blue-600">A: {exchange.answer}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Enter your question (yes/no answerable)"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            disabled={isLoading}
          />
          <div className="flex space-x-2">
            <Button
              onClick={handleQuestionSubmit}
              disabled={isLoading || !currentQuestion.trim()}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Question
            </Button>
            <Button
              onClick={handleGenerateQuestion}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Generate Question
            </Button>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isTutorialMode && (
          <Alert>
            <AlertDescription>
              Tutorial Mode: Using preset exchanges ({exchanges.length}/10)
            </AlertDescription>
          </Alert>
        )}
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
            setExchanges([]);
            setCurrentQuestion("");
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
