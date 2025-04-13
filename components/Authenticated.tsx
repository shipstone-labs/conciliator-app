'use client'

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AuthModal } from './AuthModal'
import { useStytch, useStytchUser } from '@stytch/nextjs'
import Loading from './Loading'
import {
  LitAccessControlConditionResource,
  type LitNodeClient,
} from 'lit-wrapper'
import { publicKeyToAddress } from 'viem/utils'
import {
  getAuth,
  signInWithCustomToken,
  type UserCredential,
} from 'firebase/auth'
import { usePathname } from 'next/navigation'
import { useAppConfig } from '@/lib/ConfigContext'

export type Session = {
  litClient?: LitNodeClient
  sessionSigs?: {
    authMethod: string
    pkpPublicKey: string
    address: `0x${string}`
    sessionSigs: unknown
  }
  delegatedSessionSigs?: (
    docId: string
  ) => Promise<{ sessionSigs: unknown; capacityDelegationAuthSig: unknown }>
  fbUser?: UserCredential
  isLoggedIn: boolean
  isLoggingOff: boolean
  setLoggingOff: (loggingOff: boolean) => void
}

export const sessionContext = createContext<Session>({
  setLoggingOff: () => {},
  isLoggedIn: false,
  isLoggingOff: false,
})
export default function Authenticated({
  children,
  requireLit = false,
  requireFirebase = true,
}: PropsWithChildren<{ requireLit?: boolean; requireFirebase?: boolean }>) {
  const { user, isInitialized } = useStytchUser()
  const stytchClient = useStytch()
  const [isLoggingOff, setLoggingOff] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sessionSigs, setSessionSigs] = useState<Session>({
    isLoggingOff,
    setLoggingOff,
    isLoggedIn: false,
  })
  const config = useAppConfig()
  const litActive = useRef(false)
  const firebaseActive = useRef(false)
  // Show auth modal if not authenticated and not ignored
  const amendLoggedIn = useCallback(
    (state: Session) => {
      let isLoggedIn = true
      if (!user) {
        isLoggedIn = false
      } else if (requireLit && !state.sessionSigs) {
        isLoggedIn = false
      } else if (requireFirebase && !state.fbUser) {
        isLoggedIn = false
      }
      return { ...state, isLoggedIn }
    },
    [requireLit, requireFirebase, user]
  )

  useEffect(() => {
    if (isInitialized && !user) {
      setShowAuthModal(true)
    }
    if (isInitialized && user) {
      setSessionSigs((state) =>
        amendLoggedIn({
          ...state,
        })
      )
      const task = async () => {
        const litModule = await import('lit-wrapper')
        try {
          if (requireFirebase && !firebaseActive.current) {
            const { currentUser } = getAuth()
            const fbUser =
              user &&
              isInitialized &&
              currentUser &&
              currentUser?.uid === user?.user_id
                ? (currentUser as unknown as UserCredential)
                : undefined
            if (fbUser) {
              setSessionSigs((state) =>
                amendLoggedIn({
                  ...state,
                  fbUser,
                })
              )
              firebaseActive.current = true
            } else {
              firebaseActive.current = true
              await fetch('/api/exchange', {
                headers: {
                  Authorization: `Bearer ${
                    stytchClient.session.getTokens?.()?.session_jwt
                  }`,
                },
              })
                .then((res) => {
                  if (!res.ok) {
                    throw new Error('Failed to fetch token')
                  }
                  return res.json()
                })
                .catch((error) => {
                  console.error('Error fetching token', error)
                  firebaseActive.current = false
                })
                .then((res) => {
                  return signInWithCustomToken(getAuth(), res.token).then(
                    (fbUser) => {
                      setSessionSigs((state) =>
                        amendLoggedIn({
                          ...state,
                          fbUser,
                        })
                      )
                      firebaseActive.current = true
                    }
                  )
                })
                .catch((error) => {
                  console.error(error)
                  firebaseActive.current = false
                })
            }
          }
          if (requireLit && !litActive.current) {
            litActive.current = true
            try {
              const litClient = await litModule.createLitClient({
                litNetwork: litModule.LIT_NETWORK.Datil,
              })
              litClient.connect()
              const { authMethod, provider } = await litModule.authenticate(
                litClient,
                {
                  userId: user.user_id,
                  appId: config.STYTCH_APP_ID,
                  accessToken: stytchClient.session.getTokens()?.session_jwt,
                  relayApiKey: config.LIT_RELAY_API_KEY,
                }
              )
              // -- setting scope for the auth method
              // <https://developer.litprotocol.com/v3/sdk/wallets/auth-methods/#auth-method-scopes>
              const options = {
                permittedAuthMethodScopes: [
                  [litModule.AUTH_METHOD_SCOPE.SignAnything],
                ],
              }
              let pkps = await provider.fetchPKPsThroughRelayer(authMethod)
              if (pkps.length <= 0) {
                await provider.mintPKPThroughRelayer(authMethod, options)
                pkps = await provider.fetchPKPsThroughRelayer(authMethod)
              }
              const sessionSigs = await litClient.getPkpSessionSigs({
                pkpPublicKey: pkps[0].publicKey,
                litNetwork: litModule.LIT_NETWORK.Datil,
                chain: 'filecoinCalibrationTestnet',
                // capabilityAuthSigs: [capacityDelegationAuthSig],
                authMethods: [authMethod],
                resourceAbilityRequests: [
                  {
                    resource: new litModule.LitPKPResource('*'),
                    ability: litModule.LIT_ABILITY.PKPSigning,
                  },
                  {
                    resource: new LitAccessControlConditionResource('*'),
                    ability:
                      litModule.LIT_ABILITY.AccessControlConditionDecryption,
                  },
                ],
                expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
              })
              const delegatedSessionSigs = async (docId: string) => {
                if (!docId) {
                  throw new Error('docId is required')
                }
                const { capacityDelegationAuthSig } = await fetch(
                  '/api/delegate',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${stytchClient.session.getTokens()?.session_jwt}`,
                    },
                    body: JSON.stringify({
                      id: docId,
                      pkp: pkps[0].ethAddress,
                    }),
                  }
                ).then((res) => {
                  if (!res.ok) {
                    throw new Error('Failed to fetch token')
                  }
                  return res.json()
                })

                const sessionSigs = await litClient.getPkpSessionSigs({
                  pkpPublicKey: pkps[0].publicKey,
                  litNetwork: litModule.LIT_NETWORK.Datil,
                  chain: 'filecoinCalibrationTestnet',
                  capabilityAuthSigs: [capacityDelegationAuthSig],
                  authMethods: [authMethod],
                  resourceAbilityRequests: [
                    {
                      resource: new litModule.LitPKPResource('*'),
                      ability: litModule.LIT_ABILITY.PKPSigning,
                    },
                    {
                      resource: new LitAccessControlConditionResource('*'),
                      ability:
                        litModule.LIT_ABILITY.AccessControlConditionDecryption,
                    },
                  ],
                  expiration: new Date(
                    Date.now() + 1000 * 60 * 10
                  ).toISOString(), // 10 minutes
                  // capacityDelegationAuthSig,
                })
                return { sessionSigs, capacityDelegationAuthSig }
              }
              setSessionSigs((state) =>
                amendLoggedIn({
                  ...state,
                  litClient,
                  delegatedSessionSigs,
                  sessionSigs: {
                    authMethod,
                    pkpPublicKey: pkps[0].publicKey,
                    address: publicKeyToAddress(
                      pkps[0].publicKey as `0x${string}`
                    ),
                    sessionSigs,
                  },
                })
              )
            } catch {
              litActive.current = false
            }
          }
        } catch (initError) {
          console.error('Error initializing Lit client:', initError)
        }
      }
      task()
    }
  }, [
    isInitialized,
    user,
    requireLit,
    requireFirebase,
    amendLoggedIn,
    config,
    stytchClient,
  ])

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  const pathname = usePathname()
  const onClose = useMemo(() => {
    if (pathname === '/') {
      return () => {
        setShowAuthModal(false)
      }
    }
    return () => {
      setShowAuthModal(false)
      window.location.href = '/'
    }
  }, [pathname])
  return (
    <>
      <sessionContext.Provider value={sessionSigs}>
        {sessionSigs.isLoggedIn && !sessionSigs.isLoggingOff ? (
          children
        ) : (
          <Loading />
        )}
      </sessionContext.Provider>

      {/* Authentication Modal */}
      <AuthModal
        onClose={onClose}
        isOpen={showAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
