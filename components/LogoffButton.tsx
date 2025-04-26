import { useStytch, useStytchUser } from '@stytch/nextjs'
import { type PropsWithChildren, useCallback } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { useSession } from './AuthLayout'

export default function LogoffButton({
  children,
  ...rest
}: PropsWithChildren<Record<string, unknown>>) {
  // Handle logout
  const router = useRouter()
  const { user, isInitialized } = useStytchUser()
  const { isLoggingOff, setLoggingOff } = useSession()
  const stytchClient = useStytch()
  const doLogout = useCallback(() => {
    if (isLoggingOff) return
    setLoggingOff(true)
    stytchClient.session
      .revoke()
      .catch(() => {
        alert('Unable to log out, try again later')
        setLoggingOff(false)
      })
      .then(() => {
        router.replace('/')
      })
  }, [setLoggingOff, isLoggingOff, stytchClient, router])
  if (!isInitialized || !user) {
    return null
  }
  if (children) {
    return (
      <Button
        onClick={doLogout}
        variant="ghost"
        disabled={isLoggingOff}
        asChild
        {...rest}
      >
        {children}
      </Button>
    )
  }
  return <Button onClick={doLogout}>Logout</Button>
}
