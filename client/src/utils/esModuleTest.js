/**
 * ES Module Test Utility
 * This file is used to verify ES Module functionality
 */

// Named exports
export const sum = (a, b) => a + b;
export const multiply = (a, b) => a * b;

// Default export
export default class MathUtility {
  static subtract(a, b) {
    return a - b;
  }
  
  static divide(a, b) {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
  
  static square(a) {
    return a * a;
  }
}

// Use a top-level await (ES Module feature)
export const apiData = await (async () => {
  try {
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { status: 'success', message: 'ES Modules functioning correctly!' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
})();
