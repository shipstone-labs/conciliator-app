import { authContext } from "@/app/authLayout";
import { useStytchUser } from "@stytch/nextjs";
import { type PropsWithChildren, useCallback, useContext } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function LogoffButton({
  children,
  ...rest
}: PropsWithChildren<any>) {
  // Handle logout
  const router = useRouter();
  const { user, isInitialized } = useStytchUser();
  const { loggingOff, setLoggingOff, stytchClient } = useContext(authContext);
  const doLogout = useCallback(() => {
    if (loggingOff) return;
    setLoggingOff(true);
    stytchClient.session
      .revoke()
      .catch(() => {
        alert("Unable to log out, try again later");
        setLoggingOff(false);
      })
      .then(() => {
        router.replace("/");
      });
  }, [setLoggingOff, loggingOff, stytchClient, router]);
  if (!isInitialized || !user) {
    return null;
  }
  if (children) {
    return (
      <Button
        onClick={doLogout}
        variant="ghost"
        disabled={loggingOff}
        asChild
        {...rest}
      >
        {children}
      </Button>
    );
  }
  return <Button onClick={doLogout}>Logout</Button>;
}
