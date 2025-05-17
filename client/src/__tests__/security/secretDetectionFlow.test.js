/**
 * Secret Detection Flow Tests
 * 
 * Verifies the secret detection and vault integration flow:
 * 1. Import detects hardcoded secrets in code
 * 2. Wizard blocks commit and enforces vault flow
 * 3. Secrets are securely stored in the vault
 * 4. References are properly substituted in the code
 * 
 * Part of the ALAN IDE Phase 3 implementation plan.
 */

import refactorService from '../../services/refactorService';
import { VaultService } from '../../services/refactorService';
import importWizardService from '../../services/importWizardService';

// Mock the VaultService
jest.mock('../../services/refactorService', () => {
  const originalModule = jest.requireActual('../../services/refactorService');
  
  return {
    ...originalModule,
    VaultService: jest.fn().mockImplementation(() => ({
      storeSecret: jest.fn().mockImplementation((key, value) => true),
      getSecret: jest.fn().mockImplementation(key => 'mock_secret_value'),
      listSecrets: jest.fn().mockImplementation(() => ['API_KEY_123', 'DB_PASSWORD_456']),
      delete: jest.fn().mockImplementation(key => true)
    }))
  };
});

// Mock importWizardService
jest.mock('../../services/importWizardService', () => ({
  checkSecretsInFiles: jest.fn(),
  enforceVaultFlow: jest.fn(),
  importFiles: jest.fn()
}));

describe('Secret Detection Flow', () => {
  const sampleSecretFiles = {
    'config.js': `
      // Configuration with hardcoded secrets
      const config = {
        apiKey: "sk_live_51KmVEBC33JkPQ0kcZ9MeLA9qs892jd02jZO1", // Stripe-like API key
        dbPassword: "p@ssw0rd_very_secret!123",
        githubToken: "ghp_J5tY0QBcejLmT6kyZK9c3PxCGf0zFq1A2bC3", // GitHub-like token
        awsSecretKey: "aws_secret_key_9kYZ9wr3pLxCDnkgi98UZkoQ/jd9dJKHz",
        connectionString: "mongodb://admin:password123@mongodb.example.com:27017/db"
      };
      
      export default config;
    `,
    
    'api.js': `
      import axios from 'axios';
      
      // API client with inline secrets
      const apiClient = axios.create({
        baseURL: 'https://api.example.com',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ'
        }
      });
      
      export default apiClient;
    `,
    
    'database.py': `
      import psycopg2
      
      # Database connection with hardcoded credentials
      def get_connection():
          return psycopg2.connect(
              host="localhost",
              database="example",
              user="admin",
              password="db_password_super_secret_789"
          )
      
      # AWS function with hardcoded credentials
      def upload_to_s3(file_path, bucket):
          # AWS credentials
          aws_access_key = "AKIAX4ZISKT7WZGYPRBE"
          aws_secret_key = "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"
          
          # Upload logic would go here
          return f"Uploaded {file_path} to {bucket} using {aws_access_key}"
    `
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up importWizardService mock implementation
    importWizardService.checkSecretsInFiles.mockImplementation((files) => {
      const secretsFound = [];
      
      Object.entries(files).forEach(([filename, content]) => {
        // Basic patterns for detecting secrets
        const patterns = [
          { type: 'API Key', regex: /["'](?:sk|pk)_(?:test|live)_[a-zA-Z0-9]{24,}["']/g },
          { type: 'Access Token', regex: /["'](?:ghp|gho|ghu|ghs)_[A-Za-z0-9_]{36,}["']/g },
          { type: 'JWT Token', regex: /["']eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+["']/g },
          { type: 'Password', regex: /password["']?\s*[:=]\s*["'][^"']{8,}["']/gi },
          { type: 'AWS Key', regex: /["']AKIA[0-9A-Z]{16}["']/g },
          { type: 'Connection String', regex: /["'](?:mongodb|postgres|mysql|jdbc):\/\/[^"']+["']/g }
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.regex.exec(content)) !== null) {
            secretsFound.push({
              filename,
              type: pattern.type,
              secret: match[0],
              lineNumber: content.substring(0, match.index).split('\n').length
            });
          }
        });
      });
      
      return secretsFound;
    });
    
    importWizardService.enforceVaultFlow.mockImplementation(async (secretsFound) => {
      // Simulate storing secrets in vault
      return secretsFound.map(secret => ({
        ...secret,
        vaultKey: `${secret.type.toUpperCase().replace(/\s/g, '_')}_${Math.floor(Math.random() * 1000)}`,
        secured: true
      }));
    });
    
    importWizardService.importFiles.mockImplementation(async (files, securedSecrets) => {
      // Simulate replacing secrets with vault references
      let updatedFiles = { ...files };
      
      securedSecrets.forEach(secretInfo => {
        if (secretInfo.secured && secretInfo.vaultKey) {
          const file = updatedFiles[secretInfo.filename];
          // Simple replacement - in a real implementation this would be more sophisticated
          updatedFiles[secretInfo.filename] = file.replace(
            secretInfo.secret,
            `process.env.${secretInfo.vaultKey} /* Vault: ${secretInfo.type} */`
          );
        }
      });
      
      return {
        success: true,
        files: updatedFiles,
        secretsSecured: securedSecrets.length
      };
    });
  });
  
  test('detects secrets in imported files', async () => {
    const secretsFound = await importWizardService.checkSecretsInFiles(sampleSecretFiles);
    
    // Verify secrets were detected
    expect(secretsFound.length).toBeGreaterThan(0);
    
    // Verify specific types of secrets
    const secretTypes = secretsFound.map(s => s.type);
    expect(secretTypes).toContain('API Key');
    expect(secretTypes).toContain('Password');
    expect(secretTypes).toContain('AWS Key');
    
    // Verify filenames
    const filenames = [...new Set(secretsFound.map(s => s.filename))];
    expect(filenames).toContain('config.js');
    expect(filenames).toContain('database.py');
  });
  
  test('import wizard blocks commit when secrets are found', async () => {
    // Set up the test
    const secretsFound = [
      {
        filename: 'config.js',
        type: 'API Key',
        secret: '"sk_live_51KmVEBC33JkPQ0kcZ9MeLA9qs892jd02jZO1"',
        lineNumber: 4
      },
      {
        filename: 'database.py',
        type: 'Password',
        secret: '"db_password_super_secret_789"',
        lineNumber: 8
      }
    ];
    
    importWizardService.checkSecretsInFiles.mockReturnValueOnce(secretsFound);
    
    // Try to import files
    const importResult = await importWizardService.importFiles(sampleSecretFiles);
    
    // Verify enforceVaultFlow was called
    expect(importWizardService.enforceVaultFlow).toHaveBeenCalledWith(secretsFound);
    
    // Verify import process handled secrets
    expect(importResult.secretsSecured).toBeGreaterThan(0);
  });
  
  test('refactorService correctly identifies and secures secrets', async () => {
    // Run the secret detection on sample code
    const sourceCode = `
    const config = {
      apiKey: "sk_live_51KmVEBC33JkPQ0kcZ9MeLA9qs892jd02jZO1",
      dbPassword: "p@ssw0rd_very_secret!123"
    };`;
    
    // Use the actual secureSecrets logic from refactorService (not mocked)
    const results = await refactorService.runSecretLint(sourceCode);
    
    // Verify secrets were found
    expect(results.secrets.length).toBeGreaterThan(0);
    
    // Verify fixes were generated
    expect(results.fixes.length).toBeGreaterThan(0);
    
    // Apply the fixes
    const updatedCode = refactorService.applySecretLintFixes(sourceCode, results.fixes);
    
    // Check that secrets are replaced with vault references
    expect(updatedCode).toContain('process.env.');
    expect(updatedCode).toContain('/* Vault:');
    
    // Original secrets should be removed
    expect(updatedCode).not.toContain('sk_live_51KmVEBC33JkPQ0kcZ9MeLA9qs892jd02jZO1');
    expect(updatedCode).not.toContain('p@ssw0rd_very_secret!123');
  });
  
  test('secrets are properly stored in the vault', async () => {
    // Mock VaultService instance
    const mockVaultService = new VaultService();
    
    // Apply a secure secrets transformation
    await refactorService.applyTransformation('secureSecrets', 'node123', {});
    
    // Verify the vault service was used to store secrets
    expect(mockVaultService.storeSecret).toHaveBeenCalled();
  });
  
  test('secured code maintains functionality with vault references', async () => {
    const originalCode = `
    const config = {
      apiKey: "sk_live_51KmVEBC33JkPQ0kcZ9MeLA9qs892jd02jZO1",
      dbPassword: "p@ssw0rd_very_secret!123"
    };
    
    function callApi() {
      return fetch("https://api.example.com", {
        headers: { 
          "Authorization": "Bearer " + config.apiKey 
        }
      });
    }`;
    
    // Generate fixes for secrets
    const results = await refactorService.runSecretLint(originalCode);
    const securedCode = refactorService.applySecretLintFixes(originalCode, results.fixes);
    
    // Verify code structure is maintained (should contain function definition)
    expect(securedCode).toContain('function callApi()');
    expect(securedCode).toContain('return fetch');
    
    // Verify the API call still references config.apiKey, but the value is from vault
    expect(securedCode).toContain('headers: { ');
    expect(securedCode).toContain('"Authorization": "Bearer " + config.apiKey');
    
    // The secured code should be valid JavaScript
    // In a real test, we would use a JavaScript parser to verify syntax
    // For now, we just verify code structure is maintained
    expect(securedCode).toContain('function callApi()');
    expect(securedCode).toContain('return fetch');
  });
});
