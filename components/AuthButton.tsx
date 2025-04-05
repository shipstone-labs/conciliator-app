"use client";

import { Button } from "@/components/ui/button";
import { useStytchUser } from "@stytch/nextjs";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

interface AuthButtonProps {
  text?: string;
  className?: string;
}

export function AuthButton({
  text = "Sign In",
  className = "",
}: AuthButtonProps) {
  const { user } = useStytchUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (user) {
    return null; // Don't show button if user is authenticated
  }

  return (
    <>
      <Button onClick={() => setShowAuthModal(true)} className={className}>
        {text || "Sign In"}
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
