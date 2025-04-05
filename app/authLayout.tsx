"use client";

import { StytchProvider, useStytchUser } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
import Loading from "@/components/Loading";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

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

export const authContext = createContext({
  loggingOff: false,
  setLoggingOff: (_loggingOff: boolean) => {},
});

export function LogoutButton() {
  // Handle logout
  const router = useRouter();
  const { user, isInitialized } = useStytchUser();
  const { loggingOff, setLoggingOff } = useContext(authContext);
  const doLogout = useCallback(() => {
    if (loggingOff) return;
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
  }, [router, setLoggingOff, loggingOff]);
  if (!isInitialized || !user) {
    return null;
  }
  return <Button onClick={doLogout}>Logout</Button>;
}
export function Authenticated({
  children,
}: PropsWithChildren<{ alwaysShow?: boolean }>) {
  const { user, isInitialized } = useStytchUser();
  const { loggingOff } = useContext(authContext);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show auth modal if not authenticated and not ignored
  useEffect(() => {
    if (isInitialized && !user) {
      setShowAuthModal(true);
    }
  }, [isInitialized, user]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <main>
      {isInitialized && user && !loggingOff ? children : <Loading />}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}

export default function AuthLayout({ children }: PropsWithChildren) {
  const [loggingOff, setLoggingOff] = useState(false);
  const value = useMemo(() => ({ loggingOff, setLoggingOff }), [loggingOff]);
  return (
    <StytchProvider stytch={stytchClient}>
      <authContext.Provider value={value}>{children}</authContext.Provider>
    </StytchProvider>
  );
}
