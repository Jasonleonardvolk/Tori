/**
 * String Utilities Module
 * Browser-compatible ES Module
 */

// Import from another module to test module-to-module imports
import { multiply } from './math-utils.js';

// Helper functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Named exports
export const formatName = (firstName, lastName) => {
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const pluralize = (word, count) => {
  return count === 1 ? word : `${word}s`;
};

// Export a function that uses imported functionality
export const repeatString = (str, times) => {
  // Uses the multiply function from math-utils
  const safeRepeat = Math.max(0, multiply(1, times));
  return str.repeat(safeRepeat);
};

// Log that the module was loaded
console.log('String utilities module loaded successfully');
