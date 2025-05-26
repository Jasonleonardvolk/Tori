<!-- Main page with revolutionary Phase 2 systems (UI unchanged) -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { conceptMesh, systemCoherence, addConceptDiff } from '$lib/stores/conceptMesh';
  import { ghostPersona } from '$lib/stores/ghostPersona';
  import { userSession, updateUserStats } from '$lib/stores/user';
  import { enhancedApiService } from '$lib/services/enhancedApi';
  import ConversationLog from '$lib/components/ConversationLog.svelte';
  
  let mounted = false;
  let messageInput = '';
  let isTyping = false;
  let conversationHistory: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    concepts?: string[];
    systemInsights?: string[];
    processingMethod?: string;
    confidence?: number;
  }> = [];
  
  onMount(() => {
    mounted = true;
    
    // Load conversation history from localStorage
    const saved = localStorage.getItem('tori-conversation-history');
    if (saved) {
      try {
        conversationHistory = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.warn('Failed to load conversation history:', e);
      }
    }
  });
  
  // Auto-save conversation history
  $: if (mounted && conversationHistory.length > 0) {
    localStorage.setItem('tori-conversation-history', JSON.stringify(conversationHistory));
  }
  
  async function sendMessage() {
    if (!messageInput.trim() || isTyping) return;
    
    // Check if user is authenticated
    if (!$userSession.isAuthenticated) {
      // Will trigger auth modal
      return;
    }
    
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user' as const,
      content: messageInput.trim(),
      timestamp: new Date()
    };
    
    conversationHistory = [...conversationHistory, userMessage];
    const currentMessage = messageInput;
    messageInput = '';
    isTyping = true;
    
    // Update user stats
    if ($userSession.user) {
      updateUserStats({ conversationsCount: 1 });
    }
    
    try {
      // **REVOLUTIONARY PHASE 2 PROCESSING** - Use enhanced API with all systems
      const context = {
        userQuery: currentMessage,
        currentConcepts: [...new Set($conceptMesh.flatMap(d => d.concepts))],
        conversationHistory: conversationHistory.slice(-10), // Last 10 messages for context
        userProfile: $userSession.user
      };
      
      console.log('🌌 Initiating revolutionary AI processing...');
      const enhancedResponse = await enhancedApiService.generateResponse(context);
      
      const assistantMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant' as const,
        content: enhancedResponse.response,
        timestamp: new Date(),
        concepts: enhancedResponse.newConcepts,
        systemInsights: enhancedResponse.systemInsights,
        processingMethod: enhancedResponse.processingMethod,
        confidence: enhancedResponse.confidence
      };
      
      conversationHistory = [...conversationHistory, assistantMessage];
      
      // Add conversation to concept mesh with enhanced metadata
      if (enhancedResponse.newConcepts && enhancedResponse.newConcepts.length > 0) {
        addConceptDiff({
          type: 'chat',
          title: `Conversation: ${currentMessage.substring(0, 50)}...`,
          concepts: enhancedResponse.newConcepts,
          summary: `Revolutionary AI processing via ${enhancedResponse.processingMethod}. Confidence: ${Math.round(enhancedResponse.confidence * 100)}%`,
          metadata: {
            messageCount: conversationHistory.length,
            userMessage: currentMessage,
            assistantResponse: enhancedResponse.response,
            processingMethod: enhancedResponse.processingMethod,
            confidence: enhancedResponse.confidence,
            systemInsights: enhancedResponse.systemInsights,
            emergentConnections: enhancedResponse.emergentConnections,
            timestamp: new Date()
          }
        });
        
        // Update concept count
        if ($userSession.user) {
          updateUserStats({ conceptsCreated: enhancedResponse.newConcepts.length });
        }
      }
      
      // Update ghost persona based on processing
      if (enhancedResponse.processingMethod === 'ghost_collective') {
        ghostPersona.update(state => ({
          ...state,
          mood: 'Collaborative',
          isProcessing: false,
          lastActivity: new Date()
        }));
      }
      
    } catch (error) {
      console.error('Failed to get revolutionary AI response:', error);
      
      const errorMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant' as const,
        content: "I apologize, but I'm having trouble processing your message with the full cognitive systems right now. Let me try a simpler approach...",
        timestamp: new Date(),
        processingMethod: 'fallback'
      };
      
      conversationHistory = [...conversationHistory, errorMessage];
    } finally {
      isTyping = false;
    }
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function clearConversation() {
    if (confirm('Clear conversation? This will remove all messages but keep your memory intact.')) {
      conversationHistory = [];
      localStorage.removeItem('tori-conversation-history');
    }
  }
</script>

<svelte:head>
  <title>TORI - Consciousness Interface</title>
</svelte:head>

<!-- Main conversation interface (UI completely unchanged) -->
<div class="flex flex-col h-full bg-white">
  
  <!-- Conversation area -->
  <div class="flex-1 overflow-y-auto px-6 py-4">
    {#if conversationHistory.length === 0}
      <!-- Welcome state -->
      <div class="flex flex-col items-center justify-center h-full text-center">
        <div class="w-16 h-16 bg-gradient-to-br from-tori-primary to-tori-secondary rounded-2xl flex items-center justify-center mb-6">
          <span class="text-white text-2xl font-bold">T</span>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {#if $userSession.user}
            Welcome back, {$userSession.user.name.split(' ')[0]}
          {:else}
            Welcome to TORI
          {/if}
        </h2>
        <p class="text-gray-600 mb-6 max-w-md">
          {#if $userSession.user}
            Your revolutionary AI consciousness is ready. What would you like to explore today?
          {:else}
            Sign in to unlock revolutionary cognitive processing with Ghost AI collective intelligence
          {/if}
        </p>
        
        <!-- System status overview -->
        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-semibold text-gray-900">{$conceptMesh.length}</div>
            <div class="text-xs text-gray-600">Memory Entries</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-semibold text-gray-900">{Math.round($systemCoherence * 100)}%</div>
            <div class="text-xs text-gray-600">Coherence</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-lg font-semibold text-gray-900">{$ghostPersona.activePersona || 'Ready'}</div>
            <div class="text-xs text-gray-600">AI State</div>
          </div>
        </div>
        
        <!-- Enhanced quick start suggestions -->
        {#if $userSession.isAuthenticated}
          <div class="space-y-2">
            <p class="text-sm text-gray-500 mb-3">Experience revolutionary AI processing:</p>
            <div class="flex flex-wrap gap-2 justify-center">
              <button 
                class="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors"
                on:click={() => messageInput = "How does the Ghost AI collective intelligence work?"}
              >
                Ghost Collective
              </button>
              <button 
                class="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-colors"
                on:click={() => messageInput = "Show me the holographic memory visualization"}
              >
                Holographic Memory
              </button>
              <button 
                class="px-3 py-1 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full transition-colors"
                on:click={() => messageInput = "Execute an ELFIN++ meta-cognitive script"}
              >
                ELFIN++ Scripts
              </button>
              <button 
                class="px-3 py-1 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-full transition-colors"
                on:click={() => messageInput = "Analyze the emergent patterns in my knowledge"}
              >
                Emergent Intelligence
              </button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Conversation history -->
      <div class="space-y-4 pb-4">
        {#each conversationHistory as message}
          <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[80%] {message.role === 'user' ? 'order-2' : 'order-1'}">
              <!-- Message bubble -->
              <div class="px-4 py-3 rounded-2xl {
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }">
                <p class="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              <!-- Enhanced message metadata -->
              <div class="flex items-center space-x-2 mt-1 px-2 {message.role === 'user' ? 'justify-end' : 'justify-start'}">
                <span class="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                
                <!-- Processing method indicator (subtle) -->
                {#if message.processingMethod && message.role === 'assistant'}
                  <span class="text-xs text-purple-600 opacity-70">
                    {#if message.processingMethod === 'holographic_synthesis'}
                      🌌
                    {:else if message.processingMethod === 'ghost_collective'}
                      👻
                    {:else if message.processingMethod === 'elfin_script'}
                      🧬
                    {:else}
                      💫
                    {/if}
                  </span>
                {/if}
                
                <!-- Confidence indicator (subtle) -->
                {#if message.confidence && message.role === 'assistant'}
                  <span class="text-xs text-gray-400">
                    {Math.round(message.confidence * 100)}%
                  </span>
                {/if}
                
                {#if message.concepts && message.concepts.length > 0}
                  <div class="flex space-x-1">
                    {#each message.concepts.slice(0, 2) as concept}
                      <span class="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {concept}
                      </span>
                    {/each}
                    {#if message.concepts.length > 2}
                      <span class="text-xs text-gray-400">+{message.concepts.length - 2}</span>
                    {/if}
                  </div>
                {/if}
              </div>
              
              <!-- System insights (expandable, very subtle) -->
              {#if message.systemInsights && message.systemInsights.length > 0}
                <details class="mt-1 px-2">
                  <summary class="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    System insights
                  </summary>
                  <div class="mt-1 text-xs text-gray-500 space-y-1">
                    {#each message.systemInsights as insight}
                      <div>• {insight}</div>
                    {/each}
                  </div>
                </details>
              {/if}
            </div>
            
            <!-- Avatar -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 {
              message.role === 'user' 
                ? 'bg-blue-600 text-white order-1 ml-3' 
                : 'bg-gray-300 text-gray-600 order-2 mr-3'
            }">
              {#if message.role === 'user' && $userSession.user}
                {$userSession.user.name.charAt(0).toUpperCase()}
              {:else if message.role === 'user'}
                👤
              {:else}
                {#if message.processingMethod === 'holographic_synthesis'}
                  🌌
                {:else if message.processingMethod === 'ghost_collective'}
                  👻
                {:else if message.processingMethod === 'elfin_script'}
                  🧬
                {:else}
                  🤖
                {/if}
              {/if}
            </div>
          </div>
        {/each}
        
        <!-- Enhanced typing indicator -->
        {#if isTyping}
          <div class="flex justify-start">
            <div class="w-8 h-8 rounded-full bg-purple-300 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
              🧠
            </div>
            <div class="bg-gray-100 px-4 py-3 rounded-2xl max-w-[80%]">
              <div class="flex space-x-1 items-center">
                <span class="text-xs text-gray-600 mr-2">Revolutionary AI processing</span>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Input area (unchanged) -->
  <div class="border-t border-gray-200 bg-white px-6 py-4">
    <div class="flex items-end space-x-3">
      <!-- Message input -->
      <div class="flex-1">
        <textarea
          bind:value={messageInput}
          on:keydown={handleKeyPress}
          placeholder={$userSession.isAuthenticated ? "Ask anything - revolutionary AI ready... (Enter to send)" : "Sign in to experience revolutionary AI processing"}
          class="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          rows="1"
          style="min-height: 44px; max-height: 120px;"
          disabled={isTyping || !$userSession.isAuthenticated}
        ></textarea>
      </div>
      
      <!-- Send button -->
      <button
        on:click={sendMessage}
        disabled={!messageInput.trim() || isTyping || !$userSession.isAuthenticated}
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl transition-colors font-medium"
      >
        {#if isTyping}
          <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {:else}
          Send
        {/if}
      </button>
      
      <!-- Clear conversation button -->
      {#if conversationHistory.length > 0}
        <button
          on:click={clearConversation}
          class="px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-colors"
          title="Clear conversation"
        >
          🗑️
        </button>
      {/if}
    </div>
    
    <!-- Enhanced input hints -->
    <div class="flex items-center justify-between mt-2 px-1">
      <div class="text-xs text-gray-500">
        {#if $userSession.isAuthenticated}
          Revolutionary AI: ELFIN++ • Ghost Collective • Holographic Memory • Emergent Intelligence
        {:else}
          Sign in to unlock revolutionary cognitive processing systems
        {/if}
      </div>
      
      {#if $ghostPersona.activePersona}
        <div class="text-xs text-purple-600">
          {$ghostPersona.activePersona} persona • {$ghostPersona.mood || 'Ready'}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  textarea {
    field-sizing: content;
  }
  
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
  
  .animate-bounce {
    animation: bounce 1.4s infinite ease-in-out both;
  }
  
  details summary {
    list-style: none;
  }
  
  details summary::-webkit-details-marker {
    display: none;
  }
</style>