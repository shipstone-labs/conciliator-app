import { useEffect, useState, useCallback, useRef } from 'react'

interface UseAsyncDataOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

interface UseAsyncDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  const { onSuccess, onError, enabled = true } = options

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      if (isMountedRef.current) {
        setData(result)
        onSuccess?.(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error =
          err instanceof Error ? err : new Error('An error occurred')
        setError(error)
        onError?.(error)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [asyncFn, enabled, onSuccess, onError])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    return () => {
      isMountedRef.current = false
    }
  }, [...deps, fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Specific hook for UCAN delegation
export function useUCANDelegation(
  did: string | undefined,
  sessionJwt: string | undefined
) {
  return useAsyncData(
    async () => {
      if (!did || !sessionJwt) {
        throw new Error('Missing required parameters')
      }

      const response = await fetch('/api/ucan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify({ did }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch UCAN delegation')
      }

      return response.arrayBuffer()
    },
    [did, sessionJwt],
    {
      enabled: !!did && !!sessionJwt,
    }
  )
}
