#!/bin/bash
# ELFIN Dashboard CI Test
# Tests basic functionality of the dashboard components

set -e  # Exit on error

echo "=== ELFIN Dashboard CI Test ==="
echo "Running basic functionality tests for dashboard components"

# Create temporary directory for testing
TEST_DIR=$(mktemp -d)
echo "Using temporary directory: $TEST_DIR"

# Clean up on exit
function cleanup {
  echo "Cleaning up..."
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Copy dashboard to test directory
cp -r dashboard "$TEST_DIR/"

# Change to test directory
cd "$TEST_DIR"

# Make sure Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is required but not installed"
  exit 1
fi

# Install dependencies
echo "Installing dashboard dependencies..."
cd dashboard
npm install --silent

# Run TypeScript check
echo "Running TypeScript type check..."
npx tsc --noEmit

# Create test file for useSSE hook
echo "Testing useSSE hook..."
mkdir -p src/__tests__
cat > src/__tests__/useSSE.test.tsx << 'EOF'
import { renderHook, act } from '@testing-library/react';
import { useSSE } from '../hooks/useSSE';

// Mock EventSource
class MockEventSource {
  onmessage: ((event: any) => void) | null = null;
  
  constructor(public url: string) {
    // Simulate connection established
    setTimeout(() => {
      // Send mock data
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify({ test: 'data' }) });
      }
    }, 100);
  }
  
  close() {
    // Clean up
  }
}

// Replace global EventSource with mock
global.EventSource = MockEventSource as any;

describe('useSSE hook', () => {
  it('should connect to SSE endpoint and receive data', async () => {
    const { result, rerender } = renderHook(() => 
      useSSE('/api/v1/stream/test', null, {})
    );
    
    // Initially null
    expect(result.current.data).toBeNull();
    expect(result.current.status).toBe('connecting');
    
    // Wait for mock data
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check received data
    expect(result.current.data).toEqual({ test: 'data' });
    expect(result.current.status).toBe('open');
    
    // Test cleanup
    rerender();
  });
});
EOF

# Create test file for SafetyTimeline component
echo "Testing SafetyTimeline component..."
cat > src/__tests__/SafetyTimeline.test.tsx << 'EOF'
import React from 'react';
import { render, screen } from '@testing-library/react';
import SafetyTimeline from '../components/SafetyTimeline';

// Mock the useSSE hook
jest.mock('../hooks/useSSE', () => ({
  useSSE: jest.fn(() => ({
    data: { t: 1.0, barrier: 0.75, thr: 0.5 },
    status: 'open'
  }))
}));

describe('SafetyTimeline', () => {
  it('renders the component with proper heading', () => {
    render(<SafetyTimeline sysId="test" />);
    expect(screen.getByText('Barrier Function Timeline')).toBeInTheDocument();
  });
  
  it('shows connection status', () => {
    render(<SafetyTimeline sysId="test" />);
    expect(screen.getByText('Status: open')).toBeInTheDocument();
  });
});
EOF

# Create jest config
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};
EOF

# Run tests
echo "Running component tests..."
npx jest --passWithNoTests

echo "All dashboard tests passed successfully!"
