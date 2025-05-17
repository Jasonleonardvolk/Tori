//! ELFIN language support
//!
//! This module provides support for the ELFIN domain-specific language (DSL)
//! in the ALAN system, including token definitions and concept graph conversions.

// Re-export token definitions
pub use self::tokens::TokenKind;

/// Token definitions for the ELFIN language
///
/// These match the token IDs defined in the JavaScript and Python implementations,
/// ensuring cross-language compatibility.
pub mod tokens {
    use std::fmt;

    /// Token types for the ELFIN language
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    #[repr(u16)]
    pub enum TokenKind {
        // This is a placeholder that will be auto-generated from
        // elfin/grammar/elfin_v1.ebnf by scripts/gen_tokens.py
        
        // Keyword tokens
        CONCEPT = 5271,
        SYSTEM = 4509,
        RELATION = 1392,
        LYAPUNOV = 9836,
        KOOPMAN = 2380,
        REVERSIBLE = 7149,
        CONSTRAINT = 3064,
        SPINVEC = 8764,
        
        // Type tokens
        FLOAT = 6019,
        INT = 2341,
        BOOL = 9023,
        STRING = 7852,
        
        // Symbol tokens
        PSI_MODE = 3947,
        PHI = 8561,
        
        // Literal tokens
        IDENTIFIER = 1234,
        STRING_LITERAL = 5678,
        INTEGER = 9101,
        NUMBER = 1121,
        BOOLEAN = 3141,
        
        // Special tokens
        EOF = 0,
        ERROR = 9999,
    }

    impl fmt::Display for TokenKind {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            match self {
                // This will be expanded with the full token list
                TokenKind::CONCEPT => write!(f, "CONCEPT"),
                TokenKind::SYSTEM => write!(f, "SYSTEM"),
                TokenKind::RELATION => write!(f, "RELATION"),
                TokenKind::LYAPUNOV => write!(f, "LYAPUNOV"),
                TokenKind::KOOPMAN => write!(f, "KOOPMAN"),
                TokenKind::REVERSIBLE => write!(f, "REVERSIBLE"),
                TokenKind::CONSTRAINT => write!(f, "CONSTRAINT"),
                TokenKind::SPINVEC => write!(f, "SPINVEC"),
                TokenKind::FLOAT => write!(f, "FLOAT"),
                TokenKind::INT => write!(f, "INT"),
                TokenKind::BOOL => write!(f, "BOOL"),
                TokenKind::STRING => write!(f, "STRING"),
                TokenKind::PSI_MODE => write!(f, "PSI_MODE"),
                TokenKind::PHI => write!(f, "PHI"),
                TokenKind::IDENTIFIER => write!(f, "IDENTIFIER"),
                TokenKind::STRING_LITERAL => write!(f, "STRING_LITERAL"),
                TokenKind::INTEGER => write!(f, "INTEGER"),
                TokenKind::NUMBER => write!(f, "NUMBER"),
                TokenKind::BOOLEAN => write!(f, "BOOLEAN"),
                TokenKind::EOF => write!(f, "EOF"),
                TokenKind::ERROR => write!(f, "ERROR"),
            }
        }
    }

    impl TokenKind {
        /// Check if the token is a keyword
        pub fn is_keyword(&self) -> bool {
            matches!(
                self,
                TokenKind::CONCEPT | 
                TokenKind::SYSTEM | 
                TokenKind::RELATION |
                TokenKind::LYAPUNOV |
                TokenKind::KOOPMAN |
                TokenKind::REVERSIBLE |
                TokenKind::CONSTRAINT
            )
        }
        
        /// Get the token ID
        pub fn id(&self) -> u16 {
            *self as u16
        }
        
        /// Create a token from its numeric ID
        pub fn from_id(id: u16) -> Option<Self> {
            // This will be expanded with a match for all IDs
            match id {
                5271 => Some(TokenKind::CONCEPT),
                4509 => Some(TokenKind::SYSTEM),
                1392 => Some(TokenKind::RELATION),
                9836 => Some(TokenKind::LYAPUNOV),
                2380 => Some(TokenKind::KOOPMAN),
                7149 => Some(TokenKind::REVERSIBLE),
                3064 => Some(TokenKind::CONSTRAINT),
                8764 => Some(TokenKind::SPINVEC),
                6019 => Some(TokenKind::FLOAT),
                2341 => Some(TokenKind::INT),
                9023 => Some(TokenKind::BOOL),
                7852 => Some(TokenKind::STRING),
                3947 => Some(TokenKind::PSI_MODE),
                8561 => Some(TokenKind::PHI),
                1234 => Some(TokenKind::IDENTIFIER),
                5678 => Some(TokenKind::STRING_LITERAL),
                9101 => Some(TokenKind::INTEGER),
                1121 => Some(TokenKind::NUMBER),
                3141 => Some(TokenKind::BOOLEAN),
                0 => Some(TokenKind::EOF),
                9999 => Some(TokenKind::ERROR),
                _ => None,
            }
        }
    }
}

// Placeholder for future Symbol impl that will be filled in by the real ELFIN parser
pub struct ElfinSymbol {
    pub kind: TokenKind,
    pub value: String,
}

/// A converter between ELFIN concepts and ψ-graph nodes
pub mod concept_graph {
    /// Import ELFIN symbols into the concept graph
    ///
    /// This function is a stub that will be replaced with the real implementation
    /// that links ELFIN concepts to ψ-graph nodes.
    pub fn import_elfin(source: &str) -> Result<(), super::ElfinError> {
        // Placeholder for real implementation
        Ok(())
    }
}

/// Errors that can occur when working with ELFIN
#[derive(Debug, thiserror::Error)]
pub enum ElfinError {
    #[error("Parse error: {0}")]
    ParseError(String),
    
    #[error("Type error: {0}")]
    TypeError(String),
    
    #[error("Semantic error: {0}")]
    SemanticError(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_token_id_roundtrip() {
        let token = TokenKind::CONCEPT;
        let id = token.id();
        let token2 = TokenKind::from_id(id).unwrap();
        assert_eq!(token, token2);
    }
    
    #[test]
    fn test_is_keyword() {
        assert!(TokenKind::CONCEPT.is_keyword());
        assert!(TokenKind::SYSTEM.is_keyword());
        assert!(!TokenKind::IDENTIFIER.is_keyword());
        assert!(!TokenKind::NUMBER.is_keyword());
    }
}
