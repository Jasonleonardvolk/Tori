/**
 * Fuzzy Logic Utilities for Affective Computing
 * 
 * This module provides fuzzy logic functions for affective computing analysis.
 * It includes membership functions, fuzzy operators, and defuzzification methods.
 */

/**
 * Modified Laplace Membership Function
 * μ_ML(x|m,λ) = e^(-λ|x-m|)
 * 
 * @param {Number} x - Input value
 * @param {Number} m - Center value (location parameter)
 * @param {Number} lambda - Width factor (scale parameter)
 * @returns {Number} - Membership value [0,1]
 */
export function modifiedLaplaceMembership(x, m, lambda) {
  return Math.exp(-lambda * Math.abs(x - m));
}

/**
 * Triangular Membership Function
 * 
 * @param {Number} x - Input value
 * @param {Number} a - Left boundary
 * @param {Number} b - Center value
 * @param {Number} c - Right boundary
 * @returns {Number} - Membership value [0,1]
 */
export function triangularMembership(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

/**
 * Trapezoidal Membership Function
 * 
 * @param {Number} x - Input value
 * @param {Number} a - Left boundary
 * @param {Number} b - Left plateau
 * @param {Number} c - Right plateau
 * @param {Number} d - Right boundary
 * @returns {Number} - Membership value [0,1]
 */
export function trapezoidalMembership(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

/**
 * Gaussian Membership Function
 * 
 * @param {Number} x - Input value
 * @param {Number} m - Center value
 * @param {Number} sigma - Standard deviation
 * @returns {Number} - Membership value [0,1]
 */
export function gaussianMembership(x, m, sigma) {
  return Math.exp(-0.5 * Math.pow((x - m) / sigma, 2));
}

/**
 * Sigmoid Membership Function
 * 
 * @param {Number} x - Input value
 * @param {Number} a - Steepness
 * @param {Number} c - Center value
 * @returns {Number} - Membership value [0,1]
 */
export function sigmoidMembership(x, a, c) {
  return 1 / (1 + Math.exp(-a * (x - c)));
}

/**
 * Fuzzy AND operator (t-norm)
 * 
 * @param {Number} a - First membership value
 * @param {Number} b - Second membership value
 * @param {String} method - Method: 'min', 'product', 'lukasiewicz'
 * @returns {Number} - Result of the AND operation
 */
export function fuzzyAnd(a, b, method = 'min') {
  switch (method) {
    case 'min':
      return Math.min(a, b);
    case 'product':
      return a * b;
    case 'lukasiewicz':
      return Math.max(0, a + b - 1);
    default:
      return Math.min(a, b);
  }
}

/**
 * Fuzzy OR operator (s-norm)
 * 
 * @param {Number} a - First membership value
 * @param {Number} b - Second membership value
 * @param {String} method - Method: 'max', 'probor', 'lukasiewicz'
 * @returns {Number} - Result of the OR operation
 */
export function fuzzyOr(a, b, method = 'max') {
  switch (method) {
    case 'max':
      return Math.max(a, b);
    case 'probor': // probabilistic OR
      return a + b - a * b;
    case 'lukasiewicz':
      return Math.min(1, a + b);
    default:
      return Math.max(a, b);
  }
}

/**
 * Fuzzy NOT operator (complement)
 * 
 * @param {Number} a - Membership value
 * @returns {Number} - Result of the NOT operation
 */
export function fuzzyNot(a) {
  return 1 - a;
}

/**
 * Calculate confidence score for a suggestion using fuzzy logic
 * 
 * @param {Object} context - Context parameters
 * @param {Number} context.relevanceToCurrentTask - Relevance score
 * @param {Number} context.pastAcceptanceRate - Past acceptance rate
 * @param {Number} context.styleCohesion - Style cohesion score
 * @param {Number} context.technicalCorrectness - Technical correctness score
 * @returns {Number} - Confidence score [0,1]
 */
export function calculateSuggestionConfidence(context) {
  const defaults = {
    relevanceToCurrentTask: 0.7,
    pastAcceptanceRate: 0.5,
    styleCohesion: 0.8,
    technicalCorrectness: 0.9
  };
  
  // Use defaults for missing values
  const ctx = { ...defaults, ...context };
  
  // Apply membership functions with different centers and widths
  const relevanceMembership = modifiedLaplaceMembership(
    ctx.relevanceToCurrentTask, 
    0.8,  // Center parameter (ideal relevance)
    3.0   // Width parameter (sensitivity)
  );
  
  const acceptanceMembership = modifiedLaplaceMembership(
    ctx.pastAcceptanceRate,
    0.7,  // Center parameter (ideal acceptance rate)
    2.5   // Width parameter (sensitivity)
  );
  
  const styleMembership = modifiedLaplaceMembership(
    ctx.styleCohesion,
    0.9,  // Center parameter (ideal style cohesion)
    2.0   // Width parameter (sensitivity)
  );
  
  const correctnessMembership = modifiedLaplaceMembership(
    ctx.technicalCorrectness,
    1.0,  // Center parameter (ideal correctness)
    4.0   // Width parameter (sensitivity)
  );
  
  // Calculate final confidence using product t-norm (fuzzy AND operation)
  const confidenceScore = 
    relevanceMembership * 
    acceptanceMembership * 
    styleMembership * 
    correctnessMembership;
  
  return confidenceScore;
}

/**
 * Adaptive prioritization of suggestions based on developer state
 * 
 * @param {Object} suggestion - Suggestion to prioritize
 * @param {Object} developerState - Developer state
 * @returns {Number} - Priority score [0,1]
 */
export function calculateAdaptivePriority(suggestion, developerState) {
  const { focusLevel = 0.5, frustrationLevel = 0.1, explorationLevel = 0.5 } = developerState;
  const hierarchyLevel = suggestion.hierarchyLevel || 'tactical';
  
  let priority = 0.5; // Default neutral priority
  
  // When focused, prioritize immediate, non-disruptive suggestions
  if (focusLevel > 0.7) {
    if (hierarchyLevel === 'immediate') {
      priority += 0.3;
    } else {
      priority -= 0.2; // Reduce priority of complex suggestions during focus
    }
  }
  
  // When frustrated, prioritize helpful quick wins
  if (frustrationLevel > 0.6) {
    if (hierarchyLevel === 'immediate') {
      priority += 0.4; // Boost priority of immediate fixes
    }
    // Also boost clear, easy to understand suggestions
    if (suggestion.explanation && suggestion.explanation.length < 100) {
      priority += 0.2;
    }
  }
  
  // When exploring, prioritize strategic suggestions
  if (explorationLevel > 0.7) {
    if (hierarchyLevel === 'strategic') {
      priority += 0.4;
    }
  }
  
  // Factor in confidence score
  if (suggestion.confidence) {
    priority = 0.7 * priority + 0.3 * suggestion.confidence;
  }
  
  // Ensure priority is in [0,1] range
  return Math.max(0, Math.min(1, priority));
}
