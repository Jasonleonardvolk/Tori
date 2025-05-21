/**
 * Import Wizard Secret Detection Test
 * 
 * Tests the user interface aspects of the secret detection flow, focusing on:
 * 1. The visual indicators when secrets are detected
 * 2. The wizard's blocking UI for handling secrets
 * 3. The vault storage confirmation flow
 * 4. The completion state showing secured code
 * 
 * Part of the ALAN IDE Phase 3 implementation plan.
 */

import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import ImportWizard from '../../components/ImportWizard/ImportWizard';
import importWizardService from '../../services/importWizardService';
import { renderWithProviders } from '../test-utils';

// Mock the import wizard service
jest.mock('../../services/importWizardService', () => ({
  checkSecretsInFiles: jest.fn(),
  enforceVaultFlow: jest.fn(),
  importFiles: jest.fn(),
  getImportSummary: jest.fn()
}));

describe('Import Wizard Secret Detection UI', () => {
  // Sample file with secrets for testing
  const sampleFile = {
    name: 'config.js',
    content: `
      // Configuration with hardcoded secrets
      const config = {
        apiKey: "sk_live_51KmVEBC33JkPQ0kcZ9MeLA9qs892jd02jZO1", // Stripe-like API key
        dbPassword: "p@ssw0rd_very_secret!123",
        githubToken: "ghp_J5tY0QBcejLmT6kyZK9c3PxCGf0zFq1A2bC3", // GitHub-like token
      };
      
      export default config;
    `
  };
  
  // Sample secrets found
  const sampleSecretsFound = [
    {
      filename: 'config.js',
      type: 'API Key',
      secret: '"sk_live_51KmVEBC33JkPQ0kcZ9MeLA9qs892jd02jZO1"',
      lineNumber: 4
    },
    {
      filename: 'config.js',
      type: 'Password',
      secret: '"p@ssw0rd_very_secret!123"',
      lineNumber: 5
    },
    {
      filename: 'config.js',
      type: 'Access Token',
      secret: '"ghp_J5tY0QBcejLmT6kyZK9c3PxCGf0zFq1A2bC3"',
      lineNumber: 6
    }
  ];
  
  // Sample secured secrets after vault storage
  const sampleSecuredSecrets = sampleSecretsFound.map(secret => ({
    ...secret,
    vaultKey: `${secret.type.toUpperCase().replace(/\s/g, '_')}_${Math.floor(Math.random() * 1000)}`,
    secured: true
  }));
  
  // Sample import summary
  const sampleImportSummary = {
    totalFiles: 1,
    importedFiles: 1,
    secretsFound: 3,
    secretsSecured: 3,
    warnings: 0
  };
  
  // Sample before/after code for visualization
  const sampleSecuredCode = `
    // Configuration with hardcoded secrets
    const config = {
      apiKey: process.env.API_KEY_123 /* Vault: API Key */,
      dbPassword: process.env.PASSWORD_456 /* Vault: Password */,
      githubToken: process.env.ACCESS_TOKEN_789 /* Vault: Access Token */,
    };
    
    export default config;
  `;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    importWizardService.checkSecretsInFiles.mockResolvedValue(sampleSecretsFound);
    importWizardService.enforceVaultFlow.mockResolvedValue(sampleSecuredSecrets);
    importWizardService.importFiles.mockResolvedValue({
      success: true,
      files: { 'config.js': sampleSecuredCode },
      secretsSecured: 3
    });
    importWizardService.getImportSummary.mockReturnValue(sampleImportSummary);
  });
  
  test('displays warning when secrets are detected during import', async () => {
    // Render import wizard
    renderWithProviders(<ImportWizard files={[sampleFile]} />);
    
    // Begin import process (usually triggered by clicking "Import" button)
    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);
    
    // Wait for secret detection
    await waitFor(() => {
      expect(importWizardService.checkSecretsInFiles).toHaveBeenCalled();
    });
    
    // Should display warning about found secrets
    expect(screen.getByText(/secrets detected/i)).toBeInTheDocument();
    expect(screen.getByText(/3 secrets found/i)).toBeInTheDocument();
    
    // Should show each type of secret
    expect(screen.getByText(/API Key/i)).toBeInTheDocument();
    expect(screen.getByText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Access Token/i)).toBeInTheDocument();
    
    // Import should be blocked with a warning
    expect(screen.getByText(/cannot continue with secrets/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /secure secrets/i })).toBeInTheDocument();
  });
  
  test('explains the risk of hardcoded secrets', async () => {
    // Render import wizard
    renderWithProviders(<ImportWizard files={[sampleFile]} />);
    
    // Begin import process
    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);
    
    // Wait for secret detection
    await waitFor(() => {
      expect(importWizardService.checkSecretsInFiles).toHaveBeenCalled();
    });
    
    // Should explain the risk of hardcoded secrets
    expect(screen.getByText(/security risk/i)).toBeInTheDocument();
    
    // Look for risk explanation text elements
    const riskExplanations = screen.getAllByText(/risk/i);
    expect(riskExplanations.length).toBeGreaterThan(0);
    
    // Check for specific explanations
    expect(screen.getByText(/could be exposed in version control/i)).toBeInTheDocument();
    
    // Should offer the vault as a solution
    expect(screen.getByText(/securely store in vault/i)).toBeInTheDocument();
  });
  
  test('allows securing secrets through vault flow', async () => {
    // Render import wizard
    renderWithProviders(<ImportWizard files={[sampleFile]} />);
    
    // Begin import process
    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);
    
    // Wait for secret detection
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /secure secrets/i })).toBeInTheDocument();
    });
    
    // Click on "Secure Secrets" button
    const secureButton = screen.getByRole('button', { name: /secure secrets/i });
    fireEvent.click(secureButton);
    
    // Should trigger enforce vault flow
    await waitFor(() => {
      expect(importWizardService.enforceVaultFlow).toHaveBeenCalledWith(sampleSecretsFound);
    });
    
    // Should show securing in progress
    expect(screen.getByText(/securing secrets/i)).toBeInTheDocument();
    
    // Should show success after completion
    await waitFor(() => {
      expect(screen.getByText(/3 secrets secured/i)).toBeInTheDocument();
    });
    
    // Should allow continuing the import
    expect(screen.getByRole('button', { name: /continue import/i })).toBeInTheDocument();
  });
  
  test('shows diff of before and after securing secrets', async () => {
    // Render import wizard
    renderWithProviders(<ImportWizard files={[sampleFile]} />);
    
    // Begin import, detect secrets, and trigger vault flow
    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /secure secrets/i })).toBeInTheDocument();
    });
    
    const secureButton = screen.getByRole('button', { name: /secure secrets/i });
    fireEvent.click(secureButton);
    
    // Wait for vault flow to complete
    await waitFor(() => {
      expect(screen.getByText(/secrets secured/i)).toBeInTheDocument();
    });
    
    // Should show "View Changes" button
    const viewChangesButton = screen.getByRole('button', { name: /view changes/i });
    expect(viewChangesButton).toBeInTheDocument();
    
    // Click to view changes
    fireEvent.click(viewChangesButton);
    
    // Should show diff view
    expect(screen.getByText(/before/i)).toBeInTheDocument();
    expect(screen.getByText(/after/i)).toBeInTheDocument();
    
    // Should show diff view
    expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    
    // Original secrets should be marked as removed
    expect(screen.getByText(/sk_live_/i)).toHaveClass('removed-line');
    
    // Vault references should be marked as added
    expect(screen.getByText(/process\.env/i)).toHaveClass('added-line');
  });
  
  test('completes import with secured code', async () => {
    // Render import wizard
    renderWithProviders(<ImportWizard files={[sampleFile]} />);
    
    // Begin import, detect secrets, and trigger vault flow
    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /secure secrets/i })).toBeInTheDocument();
    });
    
    const secureButton = screen.getByRole('button', { name: /secure secrets/i });
    fireEvent.click(secureButton);
    
    // Wait for vault flow to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue import/i })).toBeInTheDocument();
    });
    
    // Continue import with secured code
    const continueButton = screen.getByRole('button', { name: /continue import/i });
    fireEvent.click(continueButton);
    
    // Wait for import to complete
    await waitFor(() => {
      expect(importWizardService.importFiles).toHaveBeenCalled();
    });
    
    // Should show import success message
    expect(screen.getByText(/import complete/i)).toBeInTheDocument();
    
    // Should show summary of secured secrets
    expect(screen.getByText(/3 secrets secured/i)).toBeInTheDocument();
    
    // Should show "Done" button
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
  });
  
  test('preserves import summary in the final step', async () => {
    // Render import wizard
    renderWithProviders(<ImportWizard files={[sampleFile]} />);
    
    // Run through the import flow
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /secure secrets/i })).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /secure secrets/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue import/i })).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /continue import/i }));
    
    // Wait for import to complete
    await waitFor(() => {
      expect(importWizardService.importFiles).toHaveBeenCalled();
    });
    
    // Import summary should be preserved
    expect(screen.getByText(/1 file imported/i)).toBeInTheDocument();
    expect(screen.getByText(/3 secrets found/i)).toBeInTheDocument();
    expect(screen.getByText(/3 secrets secured/i)).toBeInTheDocument();
    
    // Should indicate all secrets were properly secured
    expect(screen.getByText(/0 secrets remaining/i)).toBeInTheDocument();
  });
  
  test('allows user to skip vault flow but warns about security risks', async () => {
    // Modify the mock to show a "skip" option
    importWizardService.enforceVaultFlow.mockImplementation(async () => {
      return []; // No secured secrets
    });
    
    // Render import wizard
    renderWithProviders(<ImportWizard files={[sampleFile]} />);
    
    // Begin import, detect secrets
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /secure secrets/i })).toBeInTheDocument();
    });
    
    // There should be a Skip option, but with a warning
    const skipButton = screen.getByRole('button', { name: /skip\/proceed anyway/i });
    expect(skipButton).toBeInTheDocument();
    
    // Click skip button
    fireEvent.click(skipButton);
    
    // Should show a security warning dialog
    expect(screen.getByText(/security warning/i)).toBeInTheDocument();
    expect(screen.getByText(/secrets will be imported as-is/i)).toBeInTheDocument();
    
    // Should require explicit confirmation
    const confirmButton = screen.getByRole('button', { name: /i understand the risks/i });
    expect(confirmButton).toBeInTheDocument();
    
    // Confirm skipping vault flow
    fireEvent.click(confirmButton);
    
    // Should proceed with import but without securing secrets
    await waitFor(() => {
      expect(importWizardService.importFiles).toHaveBeenCalledWith(
        [sampleFile],
        [] // No secured secrets
      );
    });
    
    // Should warn in import summary
    await waitFor(() => {
      expect(screen.getByText(/3 unsecured secrets/i)).toBeInTheDocument();
    });
    
    // Security risk warning should be visible
    expect(screen.getByText(/security risk/i)).toBeInTheDocument();
  });
});
