import { authContext } from "@/app/authLayout";
import { useStytchUser } from "@stytch/nextjs";
import { useCallback, useContext } from "react";
import { Button } from "./ui/button";

export default function LogoffButton() {
  // Handle logout
  const { user, isInitialized } = useStytchUser();
  const { loggingOff, setLoggingOff, stytchClient } = useContext(authContext);
  const doLogout = useCallback(() => {
    if (loggingOff) return;
    setLoggingOff(true);
    stytchClient.session.revoke().catch(() => {
      alert("Unable to log out, try again later");
      setLoggingOff(false);
    });
  }, [setLoggingOff, loggingOff, stytchClient]);
  if (!isInitialized || !user) {
    return null;
  }
  return <Button onClick={doLogout}>Logout</Button>;
}
