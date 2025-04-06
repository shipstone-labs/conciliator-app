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
import {
  AUTH_METHOD_SCOPE,
  capacityDelegationAuthSig,
  LIT_ABILITY,
  LitPKPResource,
} from "lit-wrapper";

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
          // const litResource = new LitAccessControlConditionResource("*");
          // Get session signatures for the given PKP public key and auth method
          // const sessionSigs = await provider.getSessionSigs({
          //   authMethod,
          //   pkpPublicKey: pkps[0].publicKey,
          //   sessionSigsParams: {
          //     chain: "ethereum",
          //     resourceAbilityRequests: [
          //       {
          //         resource: litResource,
          //         ability: LIT_ABILITY.AccessControlConditionSigning,
          //       },
          //     ],
          //   },
          // });
          // const authNeededCallback = async (
          //   params: Record<string, unknown>
          // ) => {
          //   const response = await litClient.signSessionKey({
          //     statement: params.statement,
          //     authMethods: [authMethod], // Use your authentication method here
          //     pkpPublicKey: pkps[0].publicKey, // Your PKP public key
          //     expiration: params.expiration,
          //     resources: params.resources,
          //     chainId: 1,
          //   });
          //   return response.authSig;
          // };
          // const sessionSigs = await litClient.getSessionSigs({
          //   chain: "ethereum",
          //   expiration: new Date(
          //     Date.now() + 1000 * 60 * 60 * 24
          //   ).toISOString(), // 24 hours
          //   resourceAbilityRequests: [
          //     {
          //       resource: litResource,
          //       ability: LIT_ABILITY.AccessControlConditionDecryption,
          //     },
          //   ],
          //   authNeededCallback,
          // });
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
          console.log("authMethod", authMethod, pkps, sessionSigs);
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
