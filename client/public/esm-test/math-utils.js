/**
 * Math Utilities Module
 * Browser-compatible ES Module
 */

// Named exports
export const sum = (a, b) => a + b;
export const multiply = (a, b) => a * b;
export const subtract = (a, b) => a - b;
export const divide = (a, b) => {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
};
export const square = (a) => a * a;

// Log that the module was loaded
console.log('Math utilities module loaded successfully');
