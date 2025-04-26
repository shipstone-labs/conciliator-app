'use client'

import {
  Component,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { AuthModal } from './AuthModal'
import { usePathname } from 'next/navigation'

// Custom Promise type that we can recognize as a login request
export type LoginPromise = Promise<void> & {
  resolve: () => void
  reject: (error: unknown) => void
  isLoginRequest?: boolean
}

// Error boundary component that catches thrown login promises
class AuthErrorBoundary extends Component<
  {
    children: ReactNode
    fallback: ReactNode
    onLoginRequest: (promise: LoginPromise) => void
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error | Promise<unknown>, info: React.ErrorInfo) {
    // Check if the thrown object is a login promise
    if (
      error instanceof Promise &&
      'then' in error &&
      'resolve' in error &&
      'reject' in error
    ) {
      const loginPromise = error as unknown as LoginPromise

      // If this is a login request, handle it
      if (loginPromise.isLoginRequest) {
        this.props.onLoginRequest(loginPromise)
        loginPromise.then(() => {
          this.setState({ hasError: false })
        })
        return
      }
    }
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || null
    }
    return this.props.children
  }
}

// AuthSuspense component that manages authentication state
export function AuthSuspense({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const [showAuthModal, setShowAuthModal] = useState<
    | (Promise<void> & {
        resolve: () => void
        reject: (error: unknown) => void
      })
    | undefined
  >(undefined)

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    if (showAuthModal) {
      showAuthModal.resolve()
    }
    setShowAuthModal(undefined)
  }, [showAuthModal])

  const pathname = usePathname()
  const onClose = useMemo(
    (event?: MouseEvent<HTMLElement>) => {
      if (!event) {
        return () => {
          if (showAuthModal) {
            showAuthModal.reject(new Error('User closed the modal'))
          }
          setShowAuthModal(undefined)
        }
      }
      if (pathname === '/') {
        return () => {
          if (showAuthModal) {
            showAuthModal.reject(new Error('User closed the modal'))
          }
          setShowAuthModal(undefined)
        }
      }
      return () => {
        if (showAuthModal) {
          showAuthModal.reject(new Error('User closed the modal'))
        }
        setShowAuthModal(undefined)
        window.location.href = '/'
      }
    },
    [pathname, showAuthModal]
  )
  const handleLoginRequest = useCallback(
    (
      promise: Promise<void> & {
        resolve: () => void
        reject: (error: unknown) => void
      }
    ) => {
      setShowAuthModal(promise)
    },
    []
  )
  return (
    <>
      <AuthErrorBoundary
        fallback={fallback}
        onLoginRequest={handleLoginRequest}
      >
        {children}
      </AuthErrorBoundary>
      <AuthModal
        onClose={onClose}
        isOpen={showAuthModal != null}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
