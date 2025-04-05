"use client";

import { StytchProvider } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
import {
  createContext,
  type PropsWithChildren,
  useMemo,
  useState,
} from "react";

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
  stytchClient: stytchClient,
});

export default function AuthLayout({ children }: PropsWithChildren) {
  const [loggingOff, setLoggingOff] = useState(false);
  const value = useMemo(
    () => ({ loggingOff, setLoggingOff, stytchClient }),
    [loggingOff]
  );
  return (
    <StytchProvider stytch={stytchClient}>
      <authContext.Provider value={value}>{children}</authContext.Provider>
    </StytchProvider>
  );
}
