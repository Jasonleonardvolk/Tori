import agentSuggestionsService from './agentSuggestionsService';

// Mock fetch for testing API calls
global.fetch = jest.fn();

describe('Agent Suggestions Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should fetch suggestions from API', async () => {
    // Mock successful API response
    const mockSuggestions = [
      {
        id: 'test-1',
        persona: 'Tester',
        label: 'Test Suggestion'
      }
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuggestions
    });

    const result = await agentSuggestionsService.fetchSuggestions();
    
    expect(fetch).toHaveBeenCalledWith('/api/agent-suggestions');
    expect(result).toEqual(mockSuggestions);
  });

  it('should return mock data when API fails', async () => {
    // Mock API failure
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Spy on getMockSuggestions
    const mockDataSpy = jest.spyOn(agentSuggestionsService, 'getMockSuggestions');
    const mockData = agentSuggestionsService.getMockSuggestions();
    
    const result = await agentSuggestionsService.fetchSuggestions();
    
    expect(fetch).toHaveBeenCalledWith('/api/agent-suggestions');
    expect(mockDataSpy).toHaveBeenCalled();
    expect(result).toEqual(mockData);
    
    mockDataSpy.mockRestore();
  });

  it('should call API when applying a suggestion', async () => {
    const suggestionId = 'test-1';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await agentSuggestionsService.applySuggestion(suggestionId);
    
    expect(fetch).toHaveBeenCalledWith(`/api/agent-suggestions/${suggestionId}/apply`, {
      method: 'POST'
    });
  });

  it('should call API when dismissing a suggestion', async () => {
    const suggestionId = 'test-1';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await agentSuggestionsService.dismissSuggestion(suggestionId);
    
    expect(fetch).toHaveBeenCalledWith(`/api/agent-suggestions/${suggestionId}/dismiss`, {
      method: 'POST'
    });
  });
});
