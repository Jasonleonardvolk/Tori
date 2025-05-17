/**
 * Performance Utilities
 * 
 * Collection of utilities for performance optimization.
 * Part of Sprint 2 - Phase 3 ALAN IDE implementation.
 */

/**
 * Creates a debounced function that delays invoking func until after 
 * wait milliseconds have elapsed since the last time the debounced 
 * function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait, options = {}) => {
  const { leading = false, trailing = true } = options;
  let timeout;
  let result;
  
  const debounced = function(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (trailing) result = func.apply(context, args);
    };
    
    const callNow = leading && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) result = func.apply(context, args);
    
    return result;
  };
  
  debounced.cancel = function() {
    clearTimeout(timeout);
    timeout = null;
  };
  
  return debounced;
};

/**
 * Creates a throttled function that only invokes func at most once per 
 * every wait milliseconds.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout
 * @returns {Function} - The throttled function
 */
export const throttle = (func, wait, options = {}) => {
  const { leading = true, trailing = true } = options;
  let timeout;
  let context;
  let args;
  let result;
  let previous = 0;
  
  const later = function() {
    previous = leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  
  const throttled = function(..._args) {
    const now = Date.now();
    if (!previous && leading === false) previous = now;
    const remaining = wait - (now - previous);
    context = this;
    args = _args;
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    
    return result;
  };
  
  throttled.cancel = function() {
    clearTimeout(timeout);
    previous = 0;
    timeout = context = args = null;
  };
  
  return throttled;
};

/**
 * Memoizes a function, caching its results for faster repeated calls.
 * 
 * @param {Function} func - The function to memoize
 * @param {Function} resolver - A function that determines the cache key for storing the result
 * @returns {Function} - The memoized function
 */
export const memoize = (func, resolver) => {
  const memoized = function(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    const cache = memoized.cache;
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  
  memoized.cache = new Map();
  return memoized;
};

/**
 * Run a function after the browser's next paint frame.
 * 
 * @param {Function} callback - Function to run after next paint
 * @returns {number} - Request ID for cancelation
 */
export const afterNextPaint = (callback) => {
  return window.requestAnimationFrame(() => {
    const timeAtStart = performance.now();
    
    // Wait for next frame after current one completes
    window.requestAnimationFrame(() => {
      callback(performance.now() - timeAtStart);
    });
  });
};

/**
 * Cancel a scheduled afterNextPaint callback.
 * 
 * @param {number} id - The ID returned from afterNextPaint
 */
export const cancelAfterNextPaint = (id) => {
  window.cancelAnimationFrame(id);
};

/**
 * Batch multiple state updates into a single render cycle.
 * For use with React state updates.
 * 
 * @param {Function} callback - Function that contains multiple state updates
 */
export const batchUpdates = (callback) => {
  if (typeof window.ReactDOM !== 'undefined' && window.ReactDOM.unstable_batchedUpdates) {
    window.ReactDOM.unstable_batchedUpdates(callback);
  } else {
    callback();
  }
};

/**
 * Measures the execution time of a function.
 * 
 * @param {Function} func - Function to measure
 * @param {string} label - Label for console output
 * @returns {Function} - Wrapped function that logs timing
 */
export const measurePerformance = (func, label = 'Performance') => {
  return function(...args) {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  };
};
