'use client'

import { useEffect, useCallback } from 'react'
import { useTracing, browserTracer } from '@/lib/browser-tracing'
import { SpanStatusCode } from '@opentelemetry/api'

export function useClientTracing() {
  const { traceFunction, tracePromise } = useTracing()

  /**
   * Trace a component mount and unmount
   * @param componentName Name of the component
   * @param props Optional component props to include in span
   */
  const traceComponent = useCallback(
    (componentName: string, props: Record<string, any> = {}) => {
      // biome-ignore lint/correctness/useExhaustiveDependencies: We are checking for values of props but not the actual object
      useEffect(() => {
        if (typeof window === 'undefined') return undefined

        // Create a span for component mount
        const attributes = {
          'component.name': componentName,
          'lifecycle.event': 'mount',
          ...Object.entries(props).reduce(
            (acc, [key, value]) => {
              // Only include serializable values
              if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
              ) {
                acc[`component.props.${key}`] = String(value)
              }
              return acc
            },
            {} as Record<string, string>
          ),
        }

        // Start a span for the component lifecycle
        const span = browserTracer.startSpan(
          `Component.${componentName}.Lifecycle`,
          {
            attributes,
          }
        )

        // Return cleanup function for unmount
        return () => {
          span.setAttributes({
            'lifecycle.event': 'unmount',
          })
          // Mark component lifecycle as successful
          span.setStatus({ code: SpanStatusCode.OK })
          span.end()
        }
      }, [componentName, Object.values(props)]) // eslint-disable-line react-hooks/exhaustive-deps
    },
    []
  )

  /**
   * Trace a user interaction
   * @param actionName Name of the action
   * @param fn Function to execute (can be async)
   * @param attributes Additional attributes to add to the span
   */
  const traceAction = useCallback(
    <T extends object | never>(
      actionName: string,
      fn?: () => T | Promise<T>,
      attributes: Record<string, any> = {}
    ) => {
      const isPromise =
        typeof fn === 'function' &&
        (fn.constructor.name === 'AsyncFunction' ||
          fn.toString().includes('Promise'))

      if (isPromise) {
        return tracePromise(
          `UserAction.${actionName}`,
          fn as () => Promise<T> | undefined,
          {
            'action.type': 'user_interaction',
            'action.name': actionName,
            ...attributes,
          }
        )
      }
      return traceFunction(`UserAction.${actionName}`, fn as () => T, {
        'action.type': 'user_interaction',
        'action.name': actionName,
        ...attributes,
      })
    },
    [traceFunction, tracePromise]
  )

  /**
   * Trace a route navigation
   * @param path The navigation path
   * @param metadata Additional metadata about the navigation
   */
  const traceNavigation = useCallback(
    (path: string, metadata: Record<string, any> = {}) => {
      return traceFunction(
        `Navigation.${path}`,
        () => {
          // This function intentionally left empty - just for tracing
        },
        {
          'navigation.path': path,
          'navigation.timestamp': new Date().toISOString(),
          ...metadata,
        }
      )
    },
    [traceFunction]
  )

  return {
    traceComponent,
    traceAction,
    traceNavigation,
    tracePromise,
    traceFunction,
  }
}
