"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  small?: boolean;
  className?: string;
  showText?: boolean;
  text?: string;
}

const Loading = ({
  small = false,
  className = "",
  showText = true,
  text = "Loading the Idea Database",
}: LoadingProps) => (
  <div
    className={cn(
      "flex items-center justify-center",
      small ? "h-auto" : "h-screen",
      "bg-transparent",
      className
    )}
  >
    <div className="text-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
      <p className="mt-4 text-lg font-medium text-gray-700">{text}</p>
    </div>
  </div>
);

export default Loading;
