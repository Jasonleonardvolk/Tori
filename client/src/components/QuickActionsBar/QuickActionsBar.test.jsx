import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickActionsBar from './QuickActionsBar';

describe('QuickActionsBar', () => {
  const mockSuggestions = [
    {
      id: 'test-1',
      persona: 'Tester',
      icon: '🧪',
      color: '#ff0000',
      label: 'Test Suggestion',
      explanation: 'This is a test suggestion'
    }
  ];
  
  const mockOnApply = jest.fn();
  const mockOnDismiss = jest.fn();
  const mockOnOpenPanel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders in collapsed state initially', () => {
    render(
      <QuickActionsBar 
        suggestions={mockSuggestions}
        onApply={mockOnApply}
        onDismiss={mockOnDismiss}
        onOpenPanel={mockOnOpenPanel}
      />
    );
    
    // Check that the component renders in collapsed state
    expect(screen.getByText('Agent Suggestions (1)')).toBeInTheDocument();
    expect(screen.getByText('Test Suggestion')).toBeInTheDocument();
    expect(screen.getByText('View All')).toBeInTheDocument();
  });
  
  it('expands when clicked on the header', () => {
    render(
      <QuickActionsBar 
        suggestions={mockSuggestions}
        onApply={mockOnApply}
        onDismiss={mockOnDismiss}
        onOpenPanel={mockOnOpenPanel}
      />
    );
    
    // Click on the title to expand
    fireEvent.click(screen.getByText('Agent Suggestions (1)'));
    
    // Check that it expanded
    expect(screen.getByText('Apply')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
  
  it('calls onApply when Apply button is clicked', () => {
    render(
      <QuickActionsBar 
        suggestions={mockSuggestions}
        onApply={mockOnApply}
        onDismiss={mockOnDismiss}
        onOpenPanel={mockOnOpenPanel}
      />
    );
    
    // Click on the title to expand
    fireEvent.click(screen.getByText('Agent Suggestions (1)'));
    
    // Click Apply button
    fireEvent.click(screen.getByText('Apply'));
    
    // Check that onApply was called with the suggestion
    expect(mockOnApply).toHaveBeenCalledWith(mockSuggestions[0]);
  });
  
  it('calls onDismiss when Dismiss button is clicked', () => {
    render(
      <QuickActionsBar 
        suggestions={mockSuggestions}
        onApply={mockOnApply}
        onDismiss={mockOnDismiss}
        onOpenPanel={mockOnOpenPanel}
      />
    );
    
    // Click on the title to expand
    fireEvent.click(screen.getByText('Agent Suggestions (1)'));
    
    // Click Dismiss button
    fireEvent.click(screen.getByText('Dismiss'));
    
    // Check that onDismiss was called with the suggestion
    expect(mockOnDismiss).toHaveBeenCalledWith(mockSuggestions[0]);
  });
  
  it('calls onOpenPanel when View All button is clicked', () => {
    render(
      <QuickActionsBar 
        suggestions={mockSuggestions}
        onApply={mockOnApply}
        onDismiss={mockOnDismiss}
        onOpenPanel={mockOnOpenPanel}
      />
    );
    
    // Click View All button
    fireEvent.click(screen.getByText('View All'));
    
    // Check that onOpenPanel was called
    expect(mockOnOpenPanel).toHaveBeenCalled();
  });
  
  it('renders string icons correctly', () => {
    const suggestionsWithStringIcon = [
      {
        ...mockSuggestions[0],
        icon: '🧪'
      }
    ];
    
    render(
      <QuickActionsBar 
        suggestions={suggestionsWithStringIcon}
        onApply={mockOnApply}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Check that the icon is rendered
    expect(screen.getByText('🧪')).toBeInTheDocument();
  });
  
  it('handles empty suggestions array', () => {
    render(
      <QuickActionsBar 
        suggestions={[]}
        onApply={mockOnApply}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Should still render but with 0 count
    expect(screen.getByText('Agent Suggestions (0)')).toBeInTheDocument();
  });
});
