import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AuthModal } from "./AuthModal";
import { authContext } from "@/app/authLayout";
import { useStytchUser } from "@stytch/nextjs";
import Loading from "./Loading";
import {
  AUTH_METHOD_SCOPE,
  capacityDelegationAuthSig,
  LIT_ABILITY,
  type LitNodeClient,
  LitPKPResource,
} from "lit-wrapper";

export type Session = {
  litClient?: LitNodeClient;
  sessionSigs?: {
    authMethod: string;
    pkpPublicKey: string;
    sessionSigs: unknown;
  };
};
export const sessionContext = createContext<Session>({});
export default function Authenticated({
  children,
  requireLit = false,
}: PropsWithChildren<{ requireLit?: boolean }>) {
  const { user, isInitialized } = useStytchUser();
  const { loggingOff, stytchClient } = useContext(authContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<Session>({});
  const litActive = useRef(false);
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
          if (!litActive.current) {
            litActive.current = true;
            try {
              const litClient = await litModule.createLitClient({
                litNetwork: litModule.LitNetworks.Datil,
              });
              litClient.connect();
              const { authMethod, provider } = await litModule.authenticate(
                litClient,
                {
                  userId: user.user_id,
                  appId: process.env.NEXT_PUBLIC_STYTCH_APP_ID,
                  accessToken: stytchClient.session.getTokens()?.session_jwt,
                  relayApiKey: process.env.NEXT_PUBLIC_LIT_RELAY_API_KEY,
                }
              );
              // -- setting scope for the auth method
              // <https://developer.litprotocol.com/v3/sdk/wallets/auth-methods/#auth-method-scopes>
              const options = {
                permittedAuthMethodScopes: [[AUTH_METHOD_SCOPE.SignAnything]],
              };
              let pkps = await provider.fetchPKPsThroughRelayer(authMethod);
              if (pkps.length <= 0) {
                const auth = await provider.mintPKPThroughRelayer(
                  authMethod,
                  options
                );
                console.log("auth", auth);
                pkps = await provider.fetchPKPsThroughRelayer(authMethod);
              }
              const sessionSigs = await litClient.getPkpSessionSigs({
                pkpPublicKey: pkps[0].publicKey,
                capabilityAuthSigs: [capacityDelegationAuthSig],
                authMethods: [authMethod],
                resourceAbilityRequests: [
                  {
                    resource: new LitPKPResource("*"),
                    ability: LIT_ABILITY.PKPSigning,
                  },
                ],
                expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
              });
              setSessionSigs({ litClient, sessionSigs });
              console.log("authMethod", authMethod, pkps, sessionSigs);
            } catch {
              litActive.current = false;
            }
          }
        } catch (initError) {
          console.error("Error initializing Lit client:", initError);
        }
      };
      if (requireLit) {
        task();
      }
    }
  }, [isInitialized, user, stytchClient.session, requireLit]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
  }, []);
  return (
    <>
      <sessionContext.Provider value={sessionSigs}>
        {(requireLit
          ? isInitialized &&
            user &&
            sessionSigs.litClient &&
            sessionSigs.sessionSigs
          : isInitialized && user) && !loggingOff ? (
          children
        ) : (
          <Loading />
        )}
      </sessionContext.Provider>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
