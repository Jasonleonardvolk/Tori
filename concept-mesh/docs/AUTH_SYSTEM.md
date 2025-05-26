# Concept Mesh Authentication System

The Concept Mesh authentication system provides OAuth-based identity, persona selection, and session management for the Concept Mesh. It integrates user identity with the ConceptDiff system, ensuring that all operations are properly attributed to specific users and personas.

## Architecture

The authentication system consists of several key components:

1. **OAuth Provider Integration**: Support for GitHub, Google, Apple, Discord, and Auth0
2. **User Identity Management**: Persistent storage of user identities with provider-specific information
3. **Persona Management**: Multiple operational modes per user (Creative Agent, Glyphsmith, etc.)
4. **Session Management**: Tracking of active user and persona
5. **ConceptDiff Attribution**: Extension of the ConceptDiff system to include user context
6. **CLI Impersonation**: Development-time authentication without OAuth

## Getting Started

### 1. Configure OAuth Providers

Create a `.env.oauth` file in the project root (use `.env.oauth.example` as a template):

```
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/callback

# Additional providers...
```

For GitHub:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the callback URL to match your `GITHUB_REDIRECT_URI`
4. Copy the Client ID and Client Secret to your `.env.oauth` file

Similar steps apply for other providers.

### 2. Load Environment Variables

In your application startup code, load the OAuth environment variables:

```rust
use dotenv::from_filename;

fn main() {
    from_filename(".env.oauth").ok(); // Ignore errors if file doesn't exist
    
    // Rest of your application...
}
```

### 3. Register Tauri Commands

In your `main.rs` for Tauri:

```rust
#[tauri::command]
fn register_auth_commands() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            concept_mesh::ui::auth_commands::login_oauth,
            concept_mesh::ui::auth_commands::handle_oauth_callback,
            concept_mesh::ui::auth_commands::get_persona_modes,
            concept_mesh::ui::auth_commands::select_persona,
            concept_mesh::ui::auth_commands::get_current_session,
            concept_mesh::ui::auth_commands::switch_persona,
            concept_mesh::ui::auth_commands::logout,
        ])
        // ...rest of your Tauri setup
}
```

### 4. Use the UI Components

In your Svelte app:

```svelte
<script>
  import LoginScreen from './components/LoginScreen.svelte';
  import PersonaSelector from './components/PersonaSelector.svelte';
  
  let currentUser = null;
  let currentSession = null;
  
  function handleLogin(event) {
    currentUser = event.detail.user;
  }
  
  function handlePersonaSelection(event) {
    currentSession = event.detail.session;
  }
</script>

{#if !currentUser}
  <LoginScreen on:loginSuccess={handleLogin} />
{:else if !currentSession}
  <PersonaSelector user={currentUser} on:personaSelected={handlePersonaSelection} />
{:else}
  <!-- Your main application -->
{/if}
```

### 5. Adding User Context to ConceptDiffs

When creating ConceptDiffs, use the `with_user_context` extension method:

```rust
use concept_mesh::diff::{ConceptDiffBuilder, UserContextExt};

// Using the builder pattern
let diff = ConceptDiffBuilder::new(frame_id)
    .create("concept_id", "ConceptType", properties)
    .with_user_context() // Add user context if a session is active
    .build();

// Or with an existing diff
use concept_mesh::diff::user_context::add_user_context;
let mut diff = ConceptDiff::new(frame_id);
// Add operations...
add_user_context(&mut diff);
```

## CLI Impersonation (for Development)

During development, you can use CLI impersonation to bypass the OAuth flow:

### 1. Using Command-Line Arguments

```bash
cargo run -- --impersonate jason --persona glyphsmith
```

### 2. Using Environment Variables

In your `.env.oauth` file:

```
TORI_IMPERSONATE=jason
TORI_PERSONA=glyphsmith
```

### 3. Programmatically

```rust
use concept_mesh::auth::{User, PersonaMode, Session, set_current_session};

let user = User::new("cli", "jason", Some("jason@example.com"), Some("Jason"), None);
let session = Session::new(user, PersonaMode::Glyphsmith);
set_current_session(session);
```

## Persona Modes

The system provides several predefined persona modes:

1. **Creative Agent**: Design, synthesis, and creative exploration
2. **Glyphsmith**: ELFIN compiler, visual expressiveness, and glyph editing
3. **Memory Pruner**: Timeline reflection, psiarc editing, and memory organization
4. **Researcher**: AV/hologram ingestion, psiarc emission, and knowledge acquisition

Each persona can have different agent packs, settings, and phase values.

## User, Session, and ConceptDiff Metadata

When a session is active, ConceptDiffs are extended with the following metadata:

```json
{
  "user_id": "USER_abcdef1",
  "persona_id": "glyphsmith",
  "session_id": "ψ-2025-05-23T09:01:00.000Z",
  "phase_state": {
    "phase": 0.42,
    "frequency": 1.0
  }
}
```

This metadata is used for:
- Filtering concept operations by user
- Phase synchronization between users
- Persona-specific agent activation
- Attribution and provenance tracking

## Security Considerations

1. Never commit `.env.oauth` with real credentials
2. Store user data in a secure location
3. Use HTTPS for OAuth callbacks in production
4. Apply proper validation for all inputs
5. Protect your client secrets in production deployments

## Extending the System

### Adding a New OAuth Provider

1. Add the provider to the `OAuthProvider` enum in `src/auth/oauth.rs`
2. Implement the provider-specific endpoints and token exchange
3. Add a configuration function (e.g., `new_provider_oauth_config()`)
4. Update the UI components to include the new provider

### Adding a New Persona Mode

1. Add the mode to the `PersonaMode` enum in `src/auth/persona.rs`
2. Update the `as_str()`, `from_str()`, `display_name()`, and `description()` methods
3. Add the mode to the `PersonaMode::all()` method
4. The new mode will automatically appear in the persona selector UI
