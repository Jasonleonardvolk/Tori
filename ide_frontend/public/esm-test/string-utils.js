/**
 * String utility functions for ESM browser testing
 */

// Import math utilities to test module-to-module imports
import { sum } from './math-utils.js';

/**
 * Formats a name with proper capitalization
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - Formatted full name
 */
export function formatName(firstName, lastName) {
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export function capitalize(str) {
  if (!str || str.length === 0) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Reverses a string
 * @param {string} str - String to reverse
 * @returns {string} - Reversed string
 */
export function reverse(str) {
  return str.split('').reverse().join('');
}

/**
 * Truncates a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Optional suffix to add, default is '...'
 * @returns {string} - Truncated string
 */
export function truncate(str, maxLength, suffix = '...') {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
}

/**
 * Counts characters in a string
 * @param {string} str - String to count
 * @returns {number} - Character count
 */
export function countChars(str) {
  return str.length;
}

/**
 * Combines a number from math-utils with a string
 * Used to demonstrate module interoperability
 * @param {string} prefix - String prefix
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {string} - Combined string with sum
 */
export function combineWithSum(prefix, a, b) {
  return `${prefix}: ${sum(a, b)}`;
}
