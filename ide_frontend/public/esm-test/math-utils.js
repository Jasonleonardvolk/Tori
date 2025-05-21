/**
 * Math utility functions for ESM browser testing
 */

/**
 * Adds two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - Sum of a and b
 */
export function sum(a, b) {
  return a + b;
}

/**
 * Multiplies two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - Product of a and b
 */
export function multiply(a, b) {
  return a * b;
}

/**
 * Squares a number
 * @param {number} a - Number to square
 * @returns {number} - Square of the number
 */
export function square(a) {
  return a * a;
}

/**
 * Divides two numbers
 * @param {number} a - Dividend
 * @param {number} b - Divisor
 * @returns {number} - Result of division
 */
export function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

/**
 * Calculates the power of a number
 * @param {number} base - Base number
 * @param {number} exponent - Exponent
 * @returns {number} - Power result
 */
export function power(base, exponent) {
  return Math.pow(base, exponent);
}
