# AI-Native Version Control System

This implementation provides an AI-native version control system as an alternative to traditional Git. It focuses on intent-driven development rather than line-by-line code changes.

## Core Concepts

Traditional version control systems track changes at the file and line level, but with AI-driven development, this approach is becoming less meaningful. When AI agents write or modify code, developers care more about the intent and outcome than the exact changes to each line.

Our AI-native version control system shifts the focus to:

1. **Intent Tracking**: Recording the developer's intention behind changes rather than just the changes themselves
2. **Semantic Conflicts**: Detecting conflicts based on meaning and purpose rather than just textual overlap
3. **Test-Driven Validation**: Measuring success by whether changes meet the intended behavior rather than by the specific implementation
4. **Prompt + Test Bundles**: Storing the inputs that generated code (prompts, specifications, constraints) along with the tests that verify its behavior

## Components

### 1. Intent Specification Tracker (`intentSpecificationTracker.js`)

The core service that manages:

- Recording developer intents and their specifications
- Tracking which code elements are affected by which intents
- Detecting semantic conflicts between intents
- Resolving conflicts through various strategies
- Storing prompt history, behavior specifications, and test cases

### A traditional Git history vs. Intent-based history

**Git history**:

```
A -> B -> C (where A, B, C are commits representing textual changes)
```

**Intent history**:

```
Intent 1: "Implement responsive navigation" -> Affects: [nav.jsx, styles.css] -> Commits: [A, D]
Intent 2: "Fix mobile layout" -> Affects: [layout.jsx, styles.css] -> Commits: [B, E]
Intent 3: "Add dark mode" -> Affects: [theme.js, styles.css] -> Conflicts with: [Intent 1]
```

### 2. Semantic Conflict Service (`semanticConflictServiceEnhanced.js`)

Detects conflicts between intent specifications by:

- Building knowledge graphs from intent specifications
- Identifying overlapping or contradictory intents
- Ranking conflicts by severity and likelihood
- Providing reasoning about why conflicts exist

### 3. UI Components

#### Semantic Commit Panel (`SemanticCommitPanel.jsx`)

A user interface for:

- Creating and viewing intent specifications
- Resolving conflicts between intents
- Recording commits linked to intents
- Finding all intents related to a specific code element

## Using the System

### Creating an Intent Specification

When starting work on a feature or change:

1. Create an intent specification describing what you intend to build or change
2. List the code elements (files, components, etc.) that will be affected
3. The system will detect conflicts with existing intents
4. If conflicts exist, you can resolve them through various strategies:
   - Override the conflicting intent
   - Merge the intents
   - Keep both intents (marking as non-conflicting)
   - Delete one of the intents

### Recording Commits

As you implement the changes:

1. Record commits with references to the intent
2. Link the affected code elements
3. This builds a relationship between your intent and the actual changes

### Linking Tests

To validate that the implementation meets the intent:

1. Add test cases to the intent
2. When tests pass, they verify that the implementation satisfies the intent

## Benefits

- **Focus on Purpose**: Track why changes were made, not just what changed
- **AI Integration**: Better suited for code written or modified by AI agents
- **Semantic Understanding**: Detect conflicts in meaning and purpose, not just text
- **Intent-Driven Development**: Shift from tracking text changes to tracking developer intentions

## Demo and Testing

You can test the system using:

1. The Semantic Commit Panel in the UI (`/semantic-commit` route)
2. The test script (`client/test-intent-tracker.js`)
3. The standalone HTML demo (`client/public/intent-tracker-test.html`)

## Future Work

- Integration with testing frameworks to automatically link test results
- Enhanced visualization of intent relationships and conflict resolution
- AI-assisted intent specification writing
- Synchronization with traditional version control
