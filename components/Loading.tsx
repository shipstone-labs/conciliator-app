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
  text = "Loading" 
}: LoadingProps) => (
  <div className={cn(
    "flex items-center justify-center", 
    small ? "h-auto" : "h-screen", 
    "bg-transparent",
    className
  )}>
    <div className="text-center">
      <Loader2 
        className={cn(
          "mx-auto animate-spin text-primary",
          small ? "h-6 w-6" : "h-12 w-12"
        )} 
      />
      {showText && (
        <p className={cn(
          "mt-2 font-medium text-gray-300",
          small ? "text-sm" : "text-lg"
        )}>
          {text}
        </p>
      )}
    </div>
  </div>
);

export default Loading;