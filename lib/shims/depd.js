// Complete replacement for depd
function createDeprecation(namespace) {
  // Return a function that creates deprecation warnings
  const deprecate = function(message) {
    return function() {
      // No-op function
      return;
    };
  };

  // Add properties to match the real depd API
  deprecate.function = function(fn, message) {
    return fn;
  };
  
  deprecate.property = function(obj, prop, message) {
    return obj;
  };
  
  deprecate.class = function(fn, message) {
    return fn;
  };
  
  // Support for calling directly
  const callable = function(message) {
    return deprecate(message);
  };
  
  // Copy all properties to the callable
  Object.assign(callable, deprecate);
  
  return callable;
}

// This matches depd's export pattern
module.exports = createDeprecation;