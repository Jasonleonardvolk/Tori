# Concept Graph-based Semantic Conflict Detection

This document provides an overview of the concept graph-based semantic conflict detection system implemented in this project, based on the research paper "Semantic Commit: Helping Users Update Intent Specifications for AI Memory at Scale."

## Overview

When working with AI agents, users need to provide and update "intent specifications" - documents that ground AI decision-making and reify common ground between humans and AI systems. These specifications can include code style rules, design requirements, or agent memory about the user.

As users interact with agents over long periods, adding or updating information in intent specifications may introduce inconsistencies or conflicts with existing information. The concept graph approach provides a robust solution for detecting and resolving these semantic conflicts, allowing users to perform "impact analysis" before committing changes.

## Architecture

The implementation consists of several key components:

### 1. Concept Graph Service (`conceptGraphService.js`)

This service builds and maintains a knowledge graph representation of intent specifications:

- **Nodes**: Represent concepts, entities, functions, and properties extracted from intent specifications
- **Edges**: Represent relationships between concepts
- **Document Mapping**: Maps nodes to the original text chunks where they appear

The service includes methods for:

- Building the graph from text chunks
- Finding related documents through PageRank-based relevance assessment
- Visualizing the graph for debugging

### 2. Semantic Conflict Service (`semanticConflictService.js`)

This service provides the API for conflict detection and resolution:

- **Detection**: Identifies potential conflicts by finding related chunks and classifying them
- **Classification**: Categories conflicts as "direct," "ambiguous," or "none"
- **Resolution**: Suggests strategies for resolving conflicts
- **Visualization**: Creates impact visualizations showing how new information affects existing concepts

### 3. UI Components

Several UI components provide a user-friendly interface for interaction:

- **ConceptGraphVisualizer**: Visualizes the concept graph and ripple effects of changes
- **SemanticCommitPanel**: Interface for impact analysis and conflict resolution
- **SemanticCommitDemo**: Demo showcasing the semantic commit workflow

## How It Works

The workflow generally follows these steps:

1. The user enters new information they want to add to an intent specification
2. They perform "impact analysis" (Check for Conflicts) to see what might be affected
3. The system:
   - Extracts entities and relationships from the new information
   - Uses the concept graph to find potentially related existing statements
   - Classifies potential conflicts as direct or ambiguous
   - Visualizes the impact through the concept graph
4. The user reviews conflicts and can:
   - Choose from suggested resolution strategies
   - Make manual edits
   - Apply changes
   - Add the new information

## Key Features

### 1. Impact Analysis First

Unlike traditional approaches that make changes and then validate, this system allows users to see the potential impact before making any changes. The paper's user study found this approach was strongly preferred.

### 2. Heterarchical Structure

The concept graph recognizes that intent specifications have a heterarchical (not just hierarchical) structure, with cross-cutting relationships between concepts. This allows detection of conflicts that might be missed by simpler approaches.

### 3. Recall Over Precision

The system prioritizes recall (not missing any conflicts) over precision (only flagging true conflicts), as users view false negatives as catastrophic while false positives are easily handled with a quick review.

### 4. Local & Global Resolution

The system provides options for both global resolution (updating all affected items at once) and local resolution (handling conflicts one at a time with fine-grained control).

## Using the Demo

To use the Semantic Commit Demo:

1. Click the "Show Semantic Commit" button in the top right of the IDE
2. In the demo, you'll see:
   - A list of existing project rules (the intent specification)
   - Example conflicts you can try
   - An explanation of key features
3. Click on one of the example conflicts to see:
   - The impact analysis visualization
   - Detected conflicts
   - Resolution options

4. You can:
   - Check for conflicts to perform impact analysis
   - Apply suggested resolutions
   - Add new information
   - View the concept graph visualization

## Implementation Notes

The current implementation provides a functional demonstration of the concept, with some simplifications:

- Entity extraction uses regex patterns instead of a full NLP pipeline
- PageRank is implemented with a basic algorithm
- Conflict classification uses heuristics rather than a full NLI model

In a production environment, these components would be enhanced with more sophisticated NLP techniques and potentially an LLM-based classification system for higher accuracy.

## Related Papers and Resources

- "Semantic Commit: Helping Users Update Intent Specifications for AI Memory at Scale" - The primary paper this implementation is based on
- "Imagining a Future of Designing with AI: Dynamic Grounding, Constructive Negotiation, and Sustainable Motivation" - Related work on human-AI coordination through shared representations
- "HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models" - Inspiration for the knowledge graph architecture with PageRank relevance assessment
