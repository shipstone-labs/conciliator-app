// Complete replacement for depd
function createDeprecation() {
  // Return a function that creates deprecation warnings
  const deprecate = () => {
    return () => {
      // No-op function
      return
    }
  }

  // Add properties to match the real depd API
  deprecate.function = (fn) => {
    return fn
  }

  deprecate.property = (obj) => {
    return obj
  }

  deprecate.class = (fn) => {
    return fn
  }

  // Support for calling directly
  const callable = () => {
    return deprecate()
  }

  // Copy all properties to the callable
  Object.assign(callable, deprecate)

  return callable
}

// This matches depd's export pattern
module.exports = createDeprecation
