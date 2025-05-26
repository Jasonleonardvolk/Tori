//! Authentication and identity module for Concept Mesh
//!
//! This module provides OAuth-based authentication, user identity management,
//! persona selection, and session tracking for the Concept Mesh. It integrates
//! with the ConceptDiff system to ensure all operations are properly attributed
//! to specific users and personas.

pub mod oauth;
pub mod session;
pub mod user;
pub mod persona;
pub mod cli;

// Re-export key components
pub use oauth::{OAuthProvider, OAuthCredentials, OAuthUser};
pub use session::{Session, SessionManager, get_current_session, set_current_session};
pub use user::{User, UserStore};
pub use persona::{Persona, PersonaMode};
pub use cli::handle_cli_auth;
