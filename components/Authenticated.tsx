"use client";

import { StytchProvider, useStytchUser } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
import Loading from "./Loading";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { AuthModal } from "./AuthModal";

// Stytch client configuration
const stytchOptions = {
  cookieOptions: {
    opaqueTokenCookieName: "stytch_session",
    jwtCookieName: "stytch_session_jwt",
    path: "",
    availableToSubdomains: false,
    domain: "",
  },
};

const stytchClient = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || "",
  stytchOptions
);

function Content({
  children,
  alwaysShow,
}: PropsWithChildren<{ alwaysShow?: boolean }>) {
  const { user, isInitialized } = useStytchUser();
  const [loggingOff, setLoggingOff] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  // Show auth modal if not authenticated and not ignored
  useEffect(() => {
    if (isInitialized && !user && !alwaysShow) {
      setShowAuthModal(true);
    }
  }, [isInitialized, user, alwaysShow]);

  // Handle logout
  const doLogout = useCallback(() => {
    setLoggingOff(true);
    stytchClient.session
      .revoke()
      .then(() => {
        router.replace("/");
      })
      .catch(() => {
        alert("Unable to log out, try again later");
        setLoggingOff(false);
      });
  }, [router]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  if (!isInitialized) {
    return <Loading text="Initializing" />;
  }

  return (
    <>
      {(alwaysShow || user) && !loggingOff ? (
        <div>
          {!alwaysShow && user ? (
            <Button onClick={doLogout}>Logout</Button>
          ) : null}
          {children}
        </div>
      ) : (
        <Loading text="Authentication required" />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
  return (
    <StytchProvider stytch={stytchClient}>
      <Content>{children}</Content>
    </StytchProvider>
  );
}
