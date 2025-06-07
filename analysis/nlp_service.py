#!/usr/bin/env python3
"""
TORI NLP Analysis Service - Natural Language Processing for Multimodal Integration

This service provides comprehensive natural language processing capabilities including:
- Named Entity Recognition (NER)
- Concept extraction and classification
- Relationship detection
- Semantic embeddings generation
- Cross-linguistic analysis

The service integrates with the Rust multimodal integration system to provide
high-quality text analysis for the TORI cognitive architecture.
"""

import asyncio
import argparse
import json
import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import traceback

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# NLP Libraries
import spacy
import numpy as np
from transformers import AutoTokenizer, AutoModel, pipeline
import torch
from sentence_transformers import SentenceTransformer
import nltk
from nltk.corpus import wordnet
import networkx as nx

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===================================================================
# DATA MODELS
# ===================================================================

class TextAnalysisRequest(BaseModel):
    text: str
    language: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    extract_entities: bool = True
    extract_concepts: bool = True
    extract_relationships: bool = True
    compute_embeddings: bool = True

class ExtractedEntity(BaseModel):
    name: str
    label: str
    start: int
    end: int
    confidence: float
    attributes: Dict[str, Any] = Field(default_factory=dict)

class ExtractedConcept(BaseModel):
    name: str
    confidence: float
    category: str
    attributes: Dict[str, Any] = Field(default_factory=dict)
    embeddings: Optional[List[float]] = None

class ExtractedRelationship(BaseModel):
    subject: str
    predicate: str
    object: str
    confidence: float
    evidence: List[str] = Field(default_factory=list)

class TextAnalysisResponse(BaseModel):
    entities: List[ExtractedEntity]
    concepts: List[ExtractedConcept]
    relationships: List[ExtractedRelationship]
    embeddings: Optional[List[float]] = None
    language_detected: Optional[str] = None
    processing_time: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

# ===================================================================
# NLP ANALYSIS ENGINE
# ===================================================================

class NLPAnalysisEngine:
    """Advanced NLP analysis engine with multiple models and techniques."""
    
    def __init__(self):
        self.app = None
        self.spacy_models = {}
        self.transformers_models = {}
        self.sentence_transformer = None
        self.concept_graph = nx.Graph()
        
        # Statistics
        self.total_requests = 0
        self.total_processing_time = 0.0
        self.error_count = 0
        
    async def initialize(self):
        """Initialize all NLP models and resources."""
        logger.info("Initializing NLP Analysis Engine...")
        
        try:
            # Load spaCy models for multiple languages
            self.load_spacy_models()
            
            # Load transformer models
            await self.load_transformer_models()
            
            # Load sentence transformer for embeddings
            self.load_sentence_transformer()
            
            # Build concept knowledge graph
            self.build_concept_graph()
            
            logger.info("NLP Analysis Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize NLP engine: {e}")
            raise
    
    def load_spacy_models(self):
        """Load spaCy models for different languages."""
        models_to_load = [
            ("en_core_web_sm", "en"),
            ("en_core_web_lg", "en_large"),
        ]
        
        for model_name, key in models_to_load:
            try:
                self.spacy_models[key] = spacy.load(model_name)
                logger.info(f"Loaded spaCy model: {model_name}")
            except IOError:
                logger.warning(f"Could not load spaCy model {model_name}, using fallback")
                if key == "en":
                    # Fallback to basic English model
                    try:
                        self.spacy_models[key] = spacy.load("en_core_web_sm")
                    except IOError:
                        logger.error("No English spaCy model available")
    
    async def load_transformer_models(self):
        """Load transformer models for advanced NLP tasks."""
        try:
            # BERT for embeddings and understanding
            self.transformers_models['bert'] = {
                'tokenizer': AutoTokenizer.from_pretrained('bert-base-uncased'),
                'model': AutoModel.from_pretrained('bert-base-uncased')
            }
            
            # RoBERTa for concept classification
            self.transformers_models['roberta'] = pipeline(
                "text-classification",
                model="cardiffnlp/twitter-roberta-base-emotion",
                return_all_scores=True
            )
            
            # Named Entity Recognition pipeline
            self.transformers_models['ner'] = pipeline(
                "ner",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                aggregation_strategy="simple"
            )
            
            logger.info("Loaded transformer models successfully")
            
        except Exception as e:
            logger.error(f"Error loading transformer models: {e}")
            # Continue with basic functionality
    
    def load_sentence_transformer(self):
        """Load sentence transformer for semantic embeddings."""
        try:
            self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Loaded sentence transformer model")
        except Exception as e:
            logger.error(f"Error loading sentence transformer: {e}")
    
    def build_concept_graph(self):
        """Build a knowledge graph of concepts and relationships."""
        # This would normally be loaded from a comprehensive knowledge base
        # For now, we'll create a simple demo graph
        
        concepts = [
            ("person", "human", {"category": "entity"}),
            ("animal", "creature", {"category": "entity"}),
            ("object", "thing", {"category": "entity"}),
            ("action", "activity", {"category": "event"}),
            ("location", "place", {"category": "location"}),
            ("time", "temporal", {"category": "temporal"}),
        ]
        
        for concept, related, attrs in concepts:
            self.concept_graph.add_node(concept, **attrs)
            self.concept_graph.add_node(related, **attrs)
            self.concept_graph.add_edge(concept, related, relation="related_to")
        
        logger.info(f"Built concept graph with {len(self.concept_graph.nodes)} concepts")
    
    async def analyze_text(self, request: TextAnalysisRequest) -> TextAnalysisResponse:
        """Perform comprehensive text analysis."""
        start_time = time.time()
        
        try:
            self.total_requests += 1
            
            # Detect language
            language = self.detect_language(request.text)
            
            # Get appropriate spaCy model
            spacy_model = self.get_spacy_model(language)
            
            # Process text with spaCy
            doc = spacy_model(request.text)
            
            # Extract entities
            entities = []
            if request.extract_entities:
                entities = await self.extract_entities(doc, request.text)
            
            # Extract concepts
            concepts = []
            if request.extract_concepts:
                concepts = await self.extract_concepts(doc, request.text)
            
            # Extract relationships
            relationships = []
            if request.extract_relationships:
                relationships = await self.extract_relationships(doc)
            
            # Generate embeddings
            embeddings = None
            if request.compute_embeddings and self.sentence_transformer:
                embeddings = self.sentence_transformer.encode(request.text).tolist()
            
            processing_time = time.time() - start_time
            self.total_processing_time += processing_time
            
            return TextAnalysisResponse(
                entities=entities,
                concepts=concepts,
                relationships=relationships,
                embeddings=embeddings,
                language_detected=language,
                processing_time=processing_time,
                metadata={
                    "text_length": len(request.text),
                    "num_tokens": len(doc),
                    "num_sentences": len(list(doc.sents))
                }
            )
            
        except Exception as e:
            self.error_count += 1
            logger.error(f"Error in text analysis: {e}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    def detect_language(self, text: str) -> str:
        """Detect the language of the input text."""
        # Simple heuristic-based language detection
        # In a production system, you'd use a proper language detection library
        if any(ord(char) > 127 for char in text):
            return "multilingual"
        return "en"
    
    def get_spacy_model(self, language: str):
        """Get the appropriate spaCy model for the given language."""
        if language in self.spacy_models:
            return self.spacy_models[language]
        elif "en" in self.spacy_models:
            return self.spacy_models["en"]
        else:
            raise ValueError("No spaCy model available for analysis")
    
    async def extract_entities(self, doc, text: str) -> List[ExtractedEntity]:
        """Extract named entities from the text."""
        entities = []
        
        # spaCy entities
        for ent in doc.ents:
            entities.append(ExtractedEntity(
                name=ent.text,
                label=ent.label_,
                start=ent.start_char,
                end=ent.end_char,
                confidence=0.85,  # spaCy doesn't provide confidence scores
                attributes={
                    "description": spacy.explain(ent.label_),
                    "source": "spacy"
                }
            ))
        
        # Transformer-based NER (if available)
        if 'ner' in self.transformers_models:
            try:
                ner_results = self.transformers_models['ner'](text)
                for result in ner_results:
                    entities.append(ExtractedEntity(
                        name=result['word'],
                        label=result['entity_group'],
                        start=result['start'],
                        end=result['end'],
                        confidence=result['score'],
                        attributes={
                            "source": "transformer"
                        }
                    ))
            except Exception as e:
                logger.warning(f"Transformer NER failed: {e}")
        
        # Remove duplicates and sort by confidence
        unique_entities = {}
        for entity in entities:
            key = (entity.name.lower(), entity.label)
            if key not in unique_entities or entity.confidence > unique_entities[key].confidence:
                unique_entities[key] = entity
        
        return sorted(unique_entities.values(), key=lambda x: x.confidence, reverse=True)
    
    async def extract_concepts(self, doc, text: str) -> List[ExtractedConcept]:
        """Extract semantic concepts from the text."""
        concepts = []
        
        # Extract concepts from noun chunks
        for chunk in doc.noun_chunks:
            concept_name = chunk.text.lower().strip()
            if len(concept_name) > 2:  # Filter very short concepts
                
                # Determine concept category
                category = self.classify_concept(chunk)
                
                # Calculate confidence based on various factors
                confidence = self.calculate_concept_confidence(chunk, doc)
                
                # Generate embeddings for the concept
                concept_embeddings = None
                if self.sentence_transformer:
                    concept_embeddings = self.sentence_transformer.encode(concept_name).tolist()
                
                concepts.append(ExtractedConcept(
                    name=concept_name,
                    confidence=confidence,
                    category=category,
                    attributes={
                        "pos_tags": [token.pos_ for token in chunk],
                        "dependency": chunk.root.dep_,
                        "head": chunk.root.head.text if chunk.root.head != chunk.root else None
                    },
                    embeddings=concept_embeddings
                ))
        
        # Extract concepts from entities
        for ent in doc.ents:
            concept_name = ent.text.lower().strip()
            category = self.entity_label_to_category(ent.label_)
            
            concept_embeddings = None
            if self.sentence_transformer:
                concept_embeddings = self.sentence_transformer.encode(concept_name).tolist()
            
            concepts.append(ExtractedConcept(
                name=concept_name,
                confidence=0.9,  # High confidence for named entities
                category=category,
                attributes={
                    "entity_type": ent.label_,
                    "source": "named_entity"
                },
                embeddings=concept_embeddings
            ))
        
        # Remove duplicates and sort by confidence
        unique_concepts = {}
        for concept in concepts:
            key = concept.name.lower()
            if key not in unique_concepts or concept.confidence > unique_concepts[key].confidence:
                unique_concepts[key] = concept
        
        return sorted(unique_concepts.values(), key=lambda x: x.confidence, reverse=True)
    
    def classify_concept(self, chunk) -> str:
        """Classify a concept into a category based on linguistic features."""
        root_token = chunk.root
        
        # Simple classification based on POS tags and dependencies
        if root_token.pos_ == "PROPN":
            return "proper_noun"
        elif root_token.pos_ == "NOUN":
            if root_token.dep_ in ["nsubj", "nsubjpass"]:
                return "agent"
            elif root_token.dep_ in ["dobj", "pobj"]:
                return "object"
            else:
                return "concept"
        elif root_token.pos_ == "VERB":
            return "action"
        elif root_token.pos_ in ["ADJ", "ADV"]:
            return "attribute"
        else:
            return "general"
    
    def calculate_concept_confidence(self, chunk, doc) -> float:
        """Calculate confidence score for a concept based on various factors."""
        base_confidence = 0.7
        
        # Boost confidence for longer phrases
        if len(chunk) > 1:
            base_confidence += 0.1
        
        # Boost confidence for proper nouns
        if any(token.pos_ == "PROPN" for token in chunk):
            base_confidence += 0.15
        
        # Boost confidence if concept appears multiple times
        text_lower = doc.text.lower()
        chunk_text_lower = chunk.text.lower()
        frequency = text_lower.count(chunk_text_lower)
        if frequency > 1:
            base_confidence += min(0.1 * (frequency - 1), 0.2)
        
        # Check against knowledge graph
        if chunk.text.lower() in self.concept_graph:
            base_confidence += 0.1
        
        return min(base_confidence, 1.0)
    
    def entity_label_to_category(self, label: str) -> str:
        """Convert spaCy entity labels to broader categories."""
        label_mapping = {
            "PERSON": "person",
            "ORG": "organization",
            "GPE": "location",
            "LOC": "location",
            "DATE": "temporal",
            "TIME": "temporal",
            "MONEY": "quantity",
            "PERCENT": "quantity",
            "CARDINAL": "quantity",
            "ORDINAL": "quantity",
            "EVENT": "event",
            "WORK_OF_ART": "artifact",
            "LAW": "artifact",
            "LANGUAGE": "language",
        }
        
        return label_mapping.get(label, "entity")
    
    async def extract_relationships(self, doc) -> List[ExtractedRelationship]:
        """Extract relationships between entities and concepts."""
        relationships = []
        
        # Extract subject-verb-object relationships
        for sent in doc.sents:
            # Find the main verb
            main_verb = None
            for token in sent:
                if token.pos_ == "VERB" and token.dep_ == "ROOT":
                    main_verb = token
                    break
            
            if main_verb:
                # Find subject
                subject = None
                for child in main_verb.children:
                    if child.dep_ in ["nsubj", "nsubjpass"]:
                        subject = child
                        break
                
                # Find object
                obj = None
                for child in main_verb.children:
                    if child.dep_ in ["dobj", "pobj"]:
                        obj = child
                        break
                
                if subject and obj:
                    relationships.append(ExtractedRelationship(
                        subject=subject.text,
                        predicate=main_verb.lemma_,
                        object=obj.text,
                        confidence=0.8,
                        evidence=[sent.text]
                    ))
        
        # Extract dependency-based relationships
        for token in doc:
            if token.dep_ in ["compound", "amod", "poss"]:
                relationships.append(ExtractedRelationship(
                    subject=token.head.text,
                    predicate=token.dep_,
                    object=token.text,
                    confidence=0.6,
                    evidence=[token.sent.text]
                ))
        
        return relationships
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get processing statistics."""
        avg_processing_time = (
            self.total_processing_time / self.total_requests 
            if self.total_requests > 0 else 0
        )
        
        error_rate = (
            self.error_count / self.total_requests 
            if self.total_requests > 0 else 0
        )
        
        return {
            "total_requests": self.total_requests,
            "total_processing_time": self.total_processing_time,
            "average_processing_time": avg_processing_time,
            "error_count": self.error_count,
            "error_rate": error_rate,
            "models_loaded": {
                "spacy": list(self.spacy_models.keys()),
                "transformers": list(self.transformers_models.keys()),
                "sentence_transformer": self.sentence_transformer is not None
            }
        }

# ===================================================================
# FASTAPI APPLICATION
# ===================================================================

# Global NLP engine instance
nlp_engine = NLPAnalysisEngine()

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="TORI NLP Analysis Service",
        description="Advanced Natural Language Processing for Multimodal Integration",
        version="1.0.0"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.on_event("startup")
    async def startup_event():
        """Initialize the NLP engine on startup."""
        await nlp_engine.initialize()
        logger.info("NLP Analysis Service started successfully")
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {"message": "TORI NLP Analysis Service", "status": "running"}
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        stats = nlp_engine.get_statistics()
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "statistics": stats
        }
    
    @app.post("/nlp", response_model=TextAnalysisResponse)
    async def analyze_text_endpoint(request: TextAnalysisRequest):
        """Main text analysis endpoint."""
        return await nlp_engine.analyze_text(request)
    
    @app.get("/stats")
    async def get_statistics():
        """Get detailed statistics about the service."""
        return nlp_engine.get_statistics()
    
    @app.post("/batch")
    async def batch_analyze(requests: List[TextAnalysisRequest]):
        """Batch analysis endpoint for multiple texts."""
        results = []
        for req in requests:
            try:
                result = await nlp_engine.analyze_text(req)
                results.append(result)
            except Exception as e:
                logger.error(f"Batch analysis error: {e}")
                results.append({"error": str(e)})
        
        return {"results": results, "total": len(requests), "successful": len([r for r in results if "error" not in r])}
    
    return app

# ===================================================================
# COMMAND LINE INTERFACE
# ===================================================================

def main():
    """Main entry point for the NLP service."""
    parser = argparse.ArgumentParser(description="TORI NLP Analysis Service")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8081, help="Port to bind to")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    parser.add_argument("--log-level", default="info", help="Log level")
    parser.add_argument("--service", default="nlp", help="Service identifier")
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Create the application
    app = create_app()
    
    # Run the server
    logger.info(f"Starting NLP Analysis Service on {args.host}:{args.port}")
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        workers=args.workers,
        log_level=args.log_level
    )

if __name__ == "__main__":
    main()
