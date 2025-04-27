import { type FirebaseApp, initializeApp } from 'firebase/app'
import type { User as FirebaseUser } from 'firebase/auth'
import { getStripePayments } from '@invertase/firestore-stripe-payments'
import { createStytchUIClient } from '@stytch/nextjs/dist/index.ui'
import type { useStytch, useStytchUser } from '@stytch/nextjs'
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth'
import {
  type AuthMethod,
  type AuthSig,
  LitAccessControlConditionResource,
  type LitNodeClient,
  type SessionSigsMap,
} from 'lit-wrapper'
import type { Address } from 'viem'
import type { RawAppConfig } from './ConfigContext'

// Add revalidation to the page - revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

export type SessionState = {
  isStytchLoggedIn: boolean
  isStytchDialogOpen: boolean
  isInitialized: boolean
  isLitLoggedIn: boolean
  isLitDeletegated?: string
  isFirebaseLoggedIn: boolean
  isLitActivated: boolean
  isLoggingOff?: boolean
}

export const DefaultState: SessionState = {
  isStytchLoggedIn: false,
  isStytchDialogOpen: false,
  isInitialized: false,
  isLitActivated: false,
  isLitLoggedIn: false,
  isLitDeletegated: undefined,
  isFirebaseLoggedIn: false,
  isLoggingOff: false,
} as const

type Injected = {
  state: SessionState
  isLoggedIn: boolean
  isLoggingOff: boolean
  setLoggingOff: (loggingOff: boolean) => void
  setState: ((state: SessionState) => void) | null
  stytchClient: ReturnType<typeof useStytch>
  _stytchUser?: ReturnType<typeof useStytchUser>
  _fbUser?: FirebaseUser
  _litClient?: LitNodeClient
  _sessionSigsTimeout?: NodeJS.Timeout
  _delegatedSessionSigsTimeout?: NodeJS.Timeout
  [key: string]: unknown
  config: Record<string, unknown>
}

export type Session = Injected & {
  _didNotify: boolean
  _loggingOff?: Promise<void>
  _listeners?: Array<() => void>
  authPromise?: AuthPromise
  stytchStartup?: Promise<void>
  litClient: SuspendPromise<LitNodeClient>
  setState?: (state: SessionState) => void
  login?: (showAuthModal: boolean) => void
  sessionSigs: SuspendPromise<{
    authMethod: AuthMethod
    pkpPublicKey: string
    address: Address
    sessionSigs: SessionSigsMap
  }>
  delegatedSessionSigs: SuspendPromise<
    {
      sessionSigs: SessionSigsMap
      capacityDelegationAuthSig: AuthSig
      address: Address
    },
    [docId: string]
  >
  fbUser: SuspendPromise<FirebaseUser>
  stytchUser: SuspendPromise<
    ReturnType<typeof useStytchUser>['user'] | AuthPromise
  >
  inject: (inject: Partial<Injected>) => void
  logout: () => Promise<void>
  subscribe: (listener: () => void) => () => void
  notify: (
    name: keyof SessionState,
    value: string | boolean | undefined
  ) => void
}

export class SuspendPromise<T, A extends unknown[] = []> {
  object: Record<string, Promise<T> | T | undefined>
  constructor(
    object: unknown,
    private valueName: string,
    private callback: (...args: A) => Promise<T>,
    private _clear: () => Promise<void> = () => Promise.resolve()
  ) {
    this.object = object as Record<string, Promise<T> | T | undefined>
  }
  value(...args: A) {
    if (this.object[this.valueName]) {
      if (this.object[this.valueName] instanceof Promise) {
        throw this.object[this.valueName]
      }
      return this.object[this.valueName]
    }
    this.object[this.valueName] = this.callback(...args)
      .then((value) => {
        this.object[this.valueName] = value
        if (!value) {
          throw new Error('Invalid state')
        }
        return value
      })
      .catch((error) => {
        console.error('Error in suspendedGetter:', error)
        this.object[this.valueName] = undefined
        throw error
      })
    return this.object[this.valueName]
  }
  async wait(...args: A): Promise<T> {
    const value = this.object[this.valueName]
    if (value) {
      if (value && value instanceof Promise) {
        return await value
      }
      return value
    }
    this.object[this.valueName] = this.callback(...args)
      .then((value) => {
        this.object[this.valueName] = value
        if (!value) {
          throw new Error('Invalid state')
        }
        return value
      })
      .catch((error) => {
        console.error('Error in suspendedGetter:', error)
        this.object[this.valueName] = undefined
        throw error
      })
    return (await this.object[this.valueName]) as Promise<T>
  }
  async clear() {
    try {
      await this._clear()
    } catch (error) {
      console.error('Error in suspendedGetter clear:', error)
    }
    this.object[this.valueName] = undefined
  }
}

export class AuthPromise extends Promise<
  ReturnType<typeof useStytchUser>['user'] | undefined
> {
  closed = false
  resolve = (
    _result: ReturnType<typeof useStytchUser>['user'] | undefined
  ) => {}
  reject = (_error: unknown) => {}
  constructor(private _close?: () => void) {
    let resolve: (
      result: ReturnType<typeof useStytchUser>['user'] | undefined
    ) => void = () => {}
    let reject: (error: unknown) => void = (_error: unknown) => {}
    super((res, rej) => {
      resolve = res
      reject = rej
    })
    this.resolve = resolve
    this.reject = reject
  }
  close() {
    this.closed = true
    if (this._close) {
      this._close()
    }
  }
}

function constructSession(inject: Partial<Injected>) {
  const session: Session = {
    _didNotify: false,
    state: Object.assign({}, DefaultState),
    notify(name: keyof SessionState, value: string | boolean | undefined) {
      if (session.state[name] === value) {
        return
      }
      session.state = {
        ...session.state,
        [name]: value,
      }
      for (const listener of session._listeners || []) {
        listener()
      }
    },
    subscribe(listener: () => void) {
      if (!session._listeners) {
        session._listeners = []
      }
      session._listeners.push(listener)
      return () => {
        session._listeners = session._listeners?.filter((l) => l !== listener)
      }
    },
    inject(inject: Partial<Injected>) {
      const oldSetState = session.setState
      session._didNotify = false
      const hadStytchClient = session.stytchClient
      for (const key in inject) {
        session[key] = inject[key] || undefined // This allow set or unset
      }
      if (!hadStytchClient && session.stytchClient) {
        getAuth().onIdTokenChanged((user) => {
          session._fbUser = user || undefined
          if (
            session._fbUser &&
            session._stytchUser?.isInitialized &&
            session._stytchUser?.user
          ) {
            session.notify('isFirebaseLoggedIn', true)
          }
        })
        session._stytchUser = {
          user: null,
          fromCache: false,
          isInitialized: session.stytchClient != null,
        } as ReturnType<typeof useStytchUser>
        session.stytchStartup = (async () => {
          const user = await session.stytchClient.user.get().catch(() => null)
          session._stytchUser = {
            user: user || null,
            fromCache: false,
            isInitialized: session.stytchClient != null,
          } as ReturnType<typeof useStytchUser>
          if (user) {
            session.notify('isStytchLoggedIn', user != null)
          }
          session.stytchClient.user.onChange((user) => {
            session._stytchUser = {
              user: user || null,
              fromCache: false,
              isInitialized: session.stytchClient != null,
            } as ReturnType<typeof useStytchUser>
            session.notify('isStytchLoggedIn', user != null)
            if (user && session.authPromise) {
              session.authPromise.closed = true
              session.authPromise.resolve(session._stytchUser?.user)
              session.authPromise = undefined
            }
            if (!user) {
              session.logout()
              session.notify('isStytchLoggedIn', false)
            }
          })
        })()
      }
      if (session._stytchUser?.isInitialized) {
        if (!session._stytchUser?.user) {
          if (!session._fbUser) {
            session.notify('isFirebaseLoggedIn', false)
            signOut(getAuth())
          }
          session.notify('isStytchLoggedIn', false)
        } else {
          session.notify('isStytchLoggedIn', true)
        }
      }
      if (
        session.setState &&
        oldSetState !== session.setState &&
        !session._didNotify
      ) {
        setTimeout(() => {
          session.setState?.(session.state)
        })
      }
    },
    async logout() {
      if (session._loggingOff) {
        return await session._loggingOff
      }
      session.notify('isLoggingOff', true)
      this._loggingOff = (async () => {
        await this.delegatedSessionSigs.clear()
        await this.sessionSigs.clear()
        await this.litClient.clear()
        await this.fbUser.clear()
        await this.stytchUser.clear()
        session.notify('isLoggingOff', false)
      })()
      await this._loggingOff
    },
  } as Session

  session.litClient = new SuspendPromise<LitNodeClient>(
    session,
    '_litClient',
    async () => {
      const litModule = await import('lit-wrapper')
      const litClient = await litModule.createLitClient({
        litNetwork: litModule.LIT_NETWORK.Datil,
      })
      await litClient.connect()
      session.notify('isLitActivated', true)
      return litClient
    },
    async () => {
      try {
        if (session._litClient) {
          await session._litClient.disconnect()
        }
      } catch (error) {
        console.error('Error disconnecting Lit client:', error)
      }
    }
  )

  session.sessionSigs = new SuspendPromise<{
    authMethod: AuthMethod
    pkpPublicKey: string
    address: Address
    sessionSigs: SessionSigsMap
  }>(
    session,
    '_sessionSigs',
    async () => {
      if (!session.config) {
        throw new Error('Config is not set')
      }
      const litModule = await import('lit-wrapper')
      const litClient = await session.litClient.wait()
      const stytchUser = await session.stytchUser.wait()
      if (!stytchUser?.user_id) {
        throw new Error('Stytch user not logged in')
      }
      const stytchClient = session.stytchClient
      if (!stytchClient || !stytchClient.session.getTokens()?.session_jwt) {
        throw new Error('Stytch client is not initialized')
      }
      const { authMethod, provider } = await litModule.authenticate(litClient, {
        userId: stytchUser.user_id,
        appId: session.config.STYTCH_APP_ID as string,
        accessToken: stytchClient.session.getTokens()?.session_jwt as string,
        relayApiKey: session.config.LIT_RELAY_API_KEY as string,
      })
      const pkps = await provider.fetchPKPsThroughRelayer(authMethod)
      const pkp = pkps[0]
      const duration = 1000 * 60 * 10
      const sessionSigs = await litClient.getPkpSessionSigs({
        pkpPublicKey: pkp.publicKey,
        chain: 'filecoinCalibrationTestnet',
        authMethods: [authMethod],
        resourceAbilityRequests: [
          {
            resource: new litModule.LitPKPResource('*'),
            ability: litModule.LIT_ABILITY.PKPSigning,
          },
          {
            resource: new LitAccessControlConditionResource('*'),
            ability: litModule.LIT_ABILITY.AccessControlConditionDecryption,
          },
        ],
        expiration: new Date(Date.now() + duration).toISOString(),
      })
      session._sessionSigsTimeout = setTimeout(() => {
        session.sessionSigs.clear()
      }, duration - 5000)
      session.notify('isLitLoggedIn', true)
      return {
        authMethod,
        address: pkp.ethAddress as `0x${string}`,
        pkpPublicKey: pkp.publicKey,
        sessionSigs,
      }
    },
    async () => {
      if (session._sessionSigsTimeout) {
        clearTimeout(session._sessionSigsTimeout)
        session._sessionSigsTimeout = undefined
      }
      session.notify('isLitLoggedIn', false)
    }
  )

  session.delegatedSessionSigs = new SuspendPromise<
    {
      sessionSigs: SessionSigsMap
      capacityDelegationAuthSig: AuthSig
      address: Address
    },
    [docId: string]
  >(
    session,
    '_delegatedSessionSigs',
    async (docId: string) => {
      if (!docId) {
        throw new Error('docId is required')
      }
      const litModule = await import('lit-wrapper')
      const litClient = await session.litClient.wait()
      const { address, pkpPublicKey, authMethod } =
        await session.sessionSigs.wait()
      await session.stytchUser.wait()
      const stytchClient = session.stytchClient
      if (!stytchClient || !stytchClient.session.getTokens()?.session_jwt) {
        throw new Error('Stytch client is not initialized')
      }
      const { capacityDelegationAuthSig } = await fetch('/api/delegate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${stytchClient.session.getTokens()?.session_jwt}`,
        },
        body: JSON.stringify({
          id: docId,
          pkp: address,
        }),
      }).then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch token')
        }
        return res.json()
      })

      const duration = 1000 * 60 * 10
      const sessionSigs = await litClient.getPkpSessionSigs({
        pkpPublicKey,
        // litNetwork: litModule.LIT_NETWORK.Datil,
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
            ability: litModule.LIT_ABILITY.AccessControlConditionDecryption,
          },
        ],
        expiration: new Date(Date.now() + duration).toISOString(), // 10 minutes
        // capacityDelegationAuthSig,
      })
      setTimeout(() => {
        session.delegatedSessionSigs.clear()
      }, duration - 5000)
      return {
        sessionSigs,
        capacityDelegationAuthSig,
        address,
      }
    },
    async () => {
      if (session._delegatedSessionSigsTimeout) {
        clearTimeout(session._delegatedSessionSigsTimeout)
        session._delegatedSessionSigsTimeout = undefined
      }
      session.notify('isLitDeletegated', undefined)
    }
  )

  session.fbUser = new SuspendPromise<FirebaseUser>(
    session,
    '_fbUser',
    async () => {
      const fbUser = getAuth().currentUser
      const stytchUser = await session.stytchUser.wait()
      if (!stytchUser || !stytchUser.user_id) {
        throw new Error('Stytch user not logged in')
      }
      if (
        fbUser?.uid === stytchUser.user_id &&
        session._fbUser?.uid === fbUser?.uid
      ) {
        return fbUser
      }
      const reponse = await fetch('/api/exchange', {
        headers: {
          Authorization: `Bearer ${session.stytchClient.session.getTokens?.()?.session_jwt}`,
        },
      })
      if (!reponse.ok) {
        throw new Error('Failed to fetch token')
      }
      const { token } = await reponse.json()
      const signedInUser = await signInWithCustomToken(getAuth(), token)
      if (!signedInUser) {
        throw new Error('Failed to sign in with custom token')
      }
      if (!session._fbUser) {
        throw new Error('Race condition: onIdTokenChanged not fired yet')
      }
      return session._fbUser
    },
    async () => {
      if (session._fbUser) {
        await signOut(getAuth())
      }
      session.notify('isFirebaseLoggedIn', false)
    }
  )

  session.stytchUser = new SuspendPromise<
    ReturnType<typeof useStytchUser>['user'] | AuthPromise
  >(
    session,
    '__stytchUser',
    async (): Promise<
      ReturnType<typeof useStytchUser>['user'] | AuthPromise
    > => {
      const stytchClient = session.stytchClient
      if (!stytchClient) {
        throw new Error('Stytch client is not initialized')
      }
      if (session.stytchStartup) {
        await session.stytchStartup
        session.stytchStartup = undefined
      }
      const stytchUser = session._stytchUser
      if (!stytchUser?.isInitialized) {
        throw new Error('Stytch user not logged in')
      }
      if (!stytchUser?.user) {
        if (!session.authPromise) {
          session.notify('isStytchDialogOpen', true)
          session.authPromise = new AuthPromise(() => {
            session.notify('isStytchDialogOpen', false)
          })
          session.notify('isStytchLoggedIn', true)
          return session.authPromise
            .then((user) => {
              session.authPromise = undefined
              session.notify('isStytchDialogOpen', false)
              session.notify('isStytchLoggedIn', true)
              return user
            })
            .catch((error) => {
              session.authPromise = undefined
              session.notify('isStytchDialogOpen', false)
              session.notify('isStytchLoggedIn', false)
              throw error
            })
        }
        return session.authPromise
      }
      return stytchUser.user
    },
    async () => {
      if (session._stytchUser?.user) {
        await session.stytchClient.session.revoke()
      }
      session.notify('isStytchLoggedIn', false)
    }
  )
  session.inject(inject)
  return session
}

// Create a singleton instance to persist state across route changes
export let globalSession: Session | undefined
// Global instance state to prevent reinitializing during React Strict Mode
export let globalInstance: AppConfig | undefined

export interface AppConfig {
  [key: string]: unknown
  app: FirebaseApp
  payments: ReturnType<typeof getStripePayments>
  stytchClient: ReturnType<typeof createStytchUIClient>
}

const stytchOptions = {
  cookieOptions: {
    opaqueTokenCookieName: 'stytch_session',
    jwtCookieName: 'stytch_session_jwt',
    path: '',
    availableToSubdomains: false,
    domain: '',
  },
}

export function initializeConfig(appConfig: RawAppConfig) {
  if (globalInstance) {
    return globalInstance as AppConfig
  }
  if (typeof window !== 'undefined') {
    globalSession = constructSession({})

    const { FIREBASE_CONFIG, STYTCH_PUBLIC_TOKEN, ...rest } = appConfig

    // Initialize Firebase
    const app = initializeApp(FIREBASE_CONFIG)

    // Initialize Stripe Payments
    const payments = getStripePayments(app, {
      customersCollection: 'customers',
      productsCollection: 'products',
    })

    // Initialize Stytch client with public token
    const stytchClient = createStytchUIClient(
      (STYTCH_PUBLIC_TOKEN as string) || '',
      stytchOptions
    )

    // Store the instances both in ref and global variable
    globalInstance = { ...rest, app, payments, stytchClient } as AppConfig
    globalSession.inject({
      config: globalInstance,
      stytchClient,
    })
  }
  return globalInstance
}
