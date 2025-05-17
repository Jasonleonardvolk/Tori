/**
 * VaultService
 * 
 * A service for securely storing and retrieving sensitive data
 * This is a mock implementation for testing purposes
 */
class VaultService {
  constructor() {
    this.vault = new Map();
  }

  /**
   * Store a secret in the vault
   * @param {string} key - The key to identify the secret
   * @param {any} value - The secret value to store
   * @returns {boolean} - Success status
   */
  storeSecret(key, value) {
    try {
      this.vault.set(key, value);
      return true;
    } catch (error) {
      console.error('Error storing secret:', error);
      return false;
    }
  }

  /**
   * Retrieve a secret from the vault
   * @param {string} key - The key identifying the secret
   * @returns {any} - The secret value, or null if not found
   */
  getSecret(key) {
    if (!this.vault.has(key)) {
      return null;
    }
    return this.vault.get(key);
  }

  /**
   * Delete a secret from the vault
   * @param {string} key - The key identifying the secret to delete
   * @returns {boolean} - Success status
   */
  deleteSecret(key) {
    if (!this.vault.has(key)) {
      return false;
    }
    
    try {
      this.vault.delete(key);
      return true;
    } catch (error) {
      console.error('Error deleting secret:', error);
      return false;
    }
  }

  /**
   * Check if a secret exists in the vault
   * @param {string} key - The key to check
   * @returns {boolean} - Whether the key exists
   */
  hasSecret(key) {
    return this.vault.has(key);
  }

  /**
   * Clear all secrets from the vault
   * @returns {boolean} - Success status
   */
  clearVault() {
    try {
      this.vault.clear();
      return true;
    } catch (error) {
      console.error('Error clearing vault:', error);
      return false;
    }
  }
}

export { VaultService };
export default new VaultService();
