// pages/_app.jsx
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
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";

// optional object for configuring SDK cookie behavior, currently showing defaults
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
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (isInitialized && !user && pathname !== "/authenticate") {
      // Redirect the user to the login page if they are not logged in
      router.replace(`/authenticate?redirect=${pathname}`);
    }
  }, [user, isInitialized, router, pathname]);
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
  return (
    <main>
      {isInitialized && (alwaysShow || user) && !loggingOff ? (
        <div>
          {!alwaysShow ? <Button onClick={doLogout}>Logout</Button> : null}
          {children}
        </div>
      ) : (
        <Loading />
      )}
    </main>
  );
}
export default function AuthenticatedLayout({
  children,
  ignore,
  alwaysShow,
}: PropsWithChildren<{ ignore?: boolean; alwaysShow?: boolean }>) {
  if (ignore) {
    return <>{children}</>;
  }
  return (
    <StytchProvider stytch={stytchClient}>
      <Content alwaysShow={alwaysShow}>{children}</Content>
    </StytchProvider>
  );
}
