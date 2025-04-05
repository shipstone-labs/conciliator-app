import {
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthModal } from "./AuthModal";
import { authContext } from "@/app/authLayout";
import { useStytchUser } from "@stytch/nextjs";
import Loading from "./Loading";

export default function Authenticated({
  children,
}: PropsWithChildren<{ alwaysShow?: boolean }>) {
  const { user, isInitialized } = useStytchUser();
  const { loggingOff, stytchClient } = useContext(authContext);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show auth modal if not authenticated and not ignored
  useEffect(() => {
    if (isInitialized && !user) {
      setShowAuthModal(true);
    }
    if (isInitialized && user) {
      const task = async () => {
        const litModule = await import("lit-wrapper");
        console.log("Lit wrapper imported successfully");

        try {
          // Try initializing the client
          const litClient = await litModule.createLitClient({
            litNetwork: litModule.LitNetworks.Datil,
          });
          litClient.connect();
          litModule.authenticate(litClient, {
            userId: user.user_id,
            appId: process.env.NEXT_PUBLIC_STYTCH_APP_ID,
            accessToken: stytchClient.session.getTokens()?.session_jwt,
            relayApiKey: process.env.NEXT_PUBLIC_LIT_RELAY_API_KEY,
          });
        } catch (initError) {
          console.error("Error initializing Lit client:", initError);
        }
      };
      task();
    }
  }, [isInitialized, user, stytchClient.session]);

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
