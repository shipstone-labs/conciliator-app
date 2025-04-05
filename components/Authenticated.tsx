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
