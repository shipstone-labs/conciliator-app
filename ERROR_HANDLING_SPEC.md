# SafeIdea Error Handling Specification

This document outlines the error handling standards for the SafeIdea application, based on analysis of existing patterns and best practices.

## Core Principles

1. **Contextual Errors**: All errors should include context about where they occurred
2. **Consistent Formats**: Error responses should follow standardized formats
3. **Appropriate Logging**: Use console methods according to error severity
4. **State Cleanup**: Properly handle state during errors to prevent invalid states
5. **User-Friendly Messages**: End users should receive sanitized, helpful messages
6. **Developer Details**: Full error information should be available for debugging

## Error Handling Patterns

### 1. API Route Error Handling

All API routes should use the `withAPITracing` higher-order function for consistent error handling:

```typescript
export const POST = withAPITracing(async (req: NextRequest) => {
  try {
    // API implementation
  } catch (error) {
    console.error('Specific context of error:', error)
    const { message, request_id, status, name } = error as {
      message?: string
      request_id?: string
      status?: number
      name?: string
    }
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          message: message || 'Internal Server Error',
          request_id,
          status,
          name,
        },
      }),
      {
        status: error?.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
```

### 2. Firebase Operation Error Handling

Firebase operations should use dedicated error handlers for consistent logging:

```typescript
export function handleError(
  docRef: DocumentReference | CollectionReference | string
): (error: Error) => void {
  return (error) => {
    console.warn(
      'Error fetching document:',
      typeof docRef === 'string' ? docRef : docRef.path,
      error
    )
  }
}

// Usage example
onSnapshot(
  query(collection(fs, 'ip')),
  (snapshot) => { /* handle success */ },
  handleError(collection(fs, 'ip'))
)
```

### 3. Promise Chain Error Handling

When working with Promise chains, ensure proper error handling and state cleanup:

```typescript
someOperation()
  .then((result) => {
    // validate result even after success
    if (!isValid(result)) {
      throw new Error('Invalid result from operation')
    }
    return processResult(result)
  })
  .catch((error) => {
    console.error('Error in operation:', error)
    // Clean up any partial state changes
    resetState()
    // Either re-throw for higher-level handling or return a default
    throw error
  })
```

### 4. React Component Error Handling

React components should gracefully handle errors in data fetching:

```typescript
const MyComponent = () => {
  const [data, setData] = useState<DataType | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      try {
        const result = await fetchSomeData()
        if (isMounted) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        console.error('Error fetching data for MyComponent:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <Loading />
  if (error) return <ErrorDisplay message={error.message} />
  if (!data) return <EmptyState />
  
  return <DisplayData data={data} />
}
```

### 5. Form Submission Error Handling

Form submissions should handle validation errors separately from system errors:

```typescript
const handleSubmit = async (event) => {
  event.preventDefault()
  setSystemError(null)
  setValidationErrors({})
  
  // First check for validation errors
  const errors = validateForm(formData)
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors)
    return
  }
  
  try {
    setSubmitting(true)
    await submitForm(formData)
    setSuccess(true)
  } catch (error) {
    console.error('Error submitting form:', error)
    
    // Check if this is a validation error from the server
    if (error.validationErrors) {
      setValidationErrors(error.validationErrors)
    } else {
      // This is a system error
      setSystemError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      )
    }
  } finally {
    setSubmitting(false)
  }
}
```

## Console Logging Guidelines

Use appropriate console methods based on the error severity:

- `console.error()`: For critical errors that prevent functionality
- `console.warn()`: For handled issues that may affect user experience
- `console.log()`: For debugging information, not for errors

Include contextual information in all error logs:
- What operation was being attempted
- Where in the code it failed
- What resources were involved (IDs, paths)
- The full error object

## Error Response Format

API error responses should follow this standard format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE", // Optional error code
    "details": {}, // Optional additional details
    "request_id": "unique_request_id" // If available
  }
}
```

## Implementation Checklist

When implementing error handling:

1. ✅ Wrap API routes with `withAPITracing`
2. ✅ Use dedicated error handlers for Firebase operations
3. ✅ Include context in all error messages and logs
4. ✅ Clean up state when errors occur
5. ✅ Present user-friendly messages to end users
6. ✅ Log detailed information for developers
7. ✅ Follow established patterns for similar operations
8. ✅ Use appropriate HTTP status codes for API errors