<!-- Updated +layout.svelte with correct component imports -->
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  // Import components
  import MemoryPanel from '$lib/components/MemoryPanel.svelte';
  import ThoughtspaceRenderer from '$lib/components/ThoughtspaceRenderer.svelte';
  import UserAuth from '$lib/components/UserAuth.svelte';
  import UserSettings from '$lib/components/UserSettings.svelte';
  
  // Import stores
  import { conceptMesh } from '$lib/stores/conceptMesh';
  import { ghostPersona } from '$lib/stores/ghostPersona';
  import { userSession, initializeUserSession } from '$lib/stores/user';
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
    
    // Initialize TORI systems
    console.log('🧠 TORI Genesis UI Loading...');
    
    // Initialize user session (auto-login if saved)
    initializeUserSession();
    
    // Load concept mesh from memory
    const savedConceptMesh = localStorage.getItem('tori-concept-mesh');
    if (savedConceptMesh) {
      try {
        conceptMesh.set(JSON.parse(savedConceptMesh));
      } catch (e) {
        console.warn('Failed to load concept mesh from storage:', e);
      }
    }
    
    // Load ghost persona state if available
    const savedGhostPersona = localStorage.getItem('tori-ghost-persona');
    if (savedGhostPersona) {
      try {
        ghostPersona.set(JSON.parse(savedGhostPersona));
      } catch (e) {
        console.warn('Failed to load ghost persona from storage:', e);
      }
    }
    
    console.log('✅ TORI Genesis UI Ready');
  });
  
  // Auto-save state changes
  $: if (mounted && $conceptMesh) {
    localStorage.setItem('tori-concept-mesh', JSON.stringify($conceptMesh));
  }
  
  $: if (mounted && $ghostPersona) {
    localStorage.setItem('tori-ghost-persona', JSON.stringify($ghostPersona));
  }
  
  // Page metadata
  $: pageTitle = $page.url.pathname === '/' ? 'TORI - Consciousness Interface' : `TORI - ${$page.url.pathname.slice(1)}`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content="TORI - Temporal Ontological Reality Interface with advanced memory systems" />
</svelte:head>

<!-- Root layout: 3-panel structure -->
<div class="flex h-screen bg-tori-background text-tori-text overflow-hidden">
  
  <!-- Left Panel: Memory System -->
  <aside class="w-80 flex-shrink-0 h-full border-r border-gray-200">
    <MemoryPanel />
  </aside>

  <!-- Main Content Area -->
  <main class="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-white">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-br from-tori-primary to-tori-secondary rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">T</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">TORI</h1>
            <div class="text-xs text-gray-500">
              {#if $page.url.pathname === '/'}
                Consciousness Interface
              {:else if $page.url.pathname.startsWith('/vault')}
                Memory Vault
              {:else}
                {$page.url.pathname.slice(1).replace(/\b\w/g, l => l.toUpperCase())}
              {/if}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Header controls -->
      <div class="flex items-center space-x-4">
        <!-- System status -->
        <div class="flex items-center space-x-3">
          <div class="text-xs text-gray-500 flex items-center space-x-2">
            <span>Phase 3 • Cognitive Active</span>
            {#if $ghostPersona.activePersona}
              <span class="text-purple-600">• {$ghostPersona.activePersona} persona active</span>
            {/if}
          </div>
        </div>
        
        <!-- User settings (if authenticated) -->
        {#if $userSession.isAuthenticated}
          <UserSettings />
        {/if}
        
        <!-- User auth component -->
        <UserAuth />
      </div>
    </header>
    
    <!-- Main content slot -->
    <div class="flex-1 overflow-hidden">
      <slot />
    </div>
  </main>

  <!-- Right Panel: Thoughtspace Renderer -->
  <aside class="w-80 flex-shrink-0 h-full border-l border-gray-200">
    <ThoughtspaceRenderer />
  </aside>
</div>

<!-- Development indicator -->
{#if mounted && import.meta.env.DEV}
  <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
    <div class="bg-black/80 text-white px-3 py-1 rounded-full text-xs opacity-50 hover:opacity-100 transition-opacity">
      TORI Phase 3 • Cognitive Engine • {$page.url.pathname}
      {#if $userSession.user}
        • {$userSession.user.name.split(' ')[0]}
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    overflow: hidden;
  }
  
  /* Panel transitions */
  aside {
    transition: width 0.3s ease-in-out;
  }
  
  /* Custom scrollbar styling */
  :global(.overflow-y-auto) {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 transparent;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 6px;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: transparent;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background-color: #cbd5e0;
    border-radius: 3px;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background-color: #a0aec0;
  }
</style>
