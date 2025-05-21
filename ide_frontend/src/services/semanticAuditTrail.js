// semanticAuditTrail.js
// Hooks code/commit events to inferred intents for explainable, intent-driven version control
import intentSpecificationTracker from './intentSpecificationTracker';

/**
 * Record a semantic commit event, linking code changes to the most recent inferred intent
 * @param {Object} commitInfo - { commitId, filesChanged, message, user, timestamp }
 * @param {string} intentId - The inferred intent ID
 */
export async function recordSemanticCommit(commitInfo, intentId) {
  // Attach commit info to the intent in the tracker
  if (!intentId) return { stored: false, error: 'No intentId' };
  const intent = intentSpecificationTracker.getIntentDetails(intentId);
  if (!intent) return { stored: false, error: 'Intent not found' };
  // Attach commit info to intent
  if (!intent.commits) intent.commits = [];
  intent.commits.push(commitInfo);
  // Optionally, persist this link in a backend or file
  return { stored: true, intentId, commitId: commitInfo.commitId };
}

/**
 * Example: Call this function from a commit/save/PR event handler
 *
 * import { recordSemanticCommit } from './semanticAuditTrail';
 * recordSemanticCommit({
 *   commitId: 'abc123',
 *   filesChanged: ['src/foo.js'],
 *   message: 'Refactor login flow',
 *   user: 'alice',
 *   timestamp: Date.now()
 * }, currentIntentId);
 */
