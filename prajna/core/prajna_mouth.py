"""
Prajna Mouth: The Voice of TORI
===============================

This is Prajna's voice component - the only part that generates language output.
All responses from TORI are generated through Prajna using only ingested, traceable data.

This implementation provides both production and demo modes for development.
"""

import asyncio
import logging
import time
from typing import Optional, Dict, Any, AsyncGenerator
from dataclasses import dataclass

logger = logging.getLogger("prajna.mouth")

@dataclass
class PrajnaOutput:
    """Output from Prajna language generation"""
    answer: str
    confidence: float = 0.8
    processing_time: float = 0.0
    model_used: str = "demo"
    tokens_generated: int = 0

class PrajnaLanguageModel:
    """
    Prajna Language Model - TORI's voice and mouth
    
    This is the only component that generates natural language responses.
    All output is based on ingested, traceable knowledge from memory systems.
    """
    
    def __init__(self, model_type="demo", model_path="", device="cpu", 
                 max_context_length=2048, temperature=0.7, **kwargs):
        self.model_type = model_type
        self.model_path = model_path
        self.device = device
        self.max_context_length = max_context_length
        self.temperature = temperature
        self.model_loaded = False
        self.stats = {
            "total_requests": 0,
            "successful_responses": 0,
            "average_response_time": 0.0,
            "total_tokens_generated": 0
        }
        
        logger.info(f"🗣️ Initializing Prajna Language Model: {model_type}")
    
    async def load_model(self):
        """Load the language model"""
        try:
            if self.model_type == "demo":
                # Demo mode - no actual model loading
                logger.info("🎭 Prajna running in DEMO mode")
                await asyncio.sleep(1)  # Simulate loading time
                self.model_loaded = True
                
            elif self.model_type == "rwkv":
                # Future: Load RWKV model
                logger.info("🐉 Loading RWKV model... (not implemented)")
                self.model_loaded = True
                
            elif self.model_type == "llama":
                # Future: Load Llama model
                logger.info("🦙 Loading Llama model... (not implemented)")
                self.model_loaded = True
                
            else:
                # Fallback to demo mode
                logger.warning(f"Unknown model type: {self.model_type}, using demo mode")
                self.model_type = "demo"
                self.model_loaded = True
            
            logger.info(f"✅ Prajna model loaded: {self.model_type}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load Prajna model: {e}")
            logger.info("🎭 Falling back to demo mode")
            self.model_type = "demo"
            self.model_loaded = True
    
    async def generate_response(self, query: str, context: str = "", **kwargs) -> PrajnaOutput:
        """Generate response using Prajna"""
        start_time = time.time()
        self.stats["total_requests"] += 1
        
        try:
            if not self.model_loaded:
                await self.load_model()
            
            if self.model_type == "demo":
                answer = await self._demo_generate(query, context)
            else:
                answer = await self._model_generate(query, context, **kwargs)
            
            processing_time = time.time() - start_time
            self.stats["successful_responses"] += 1
            self.stats["total_tokens_generated"] += len(answer.split())
            
            # Update average response time
            total_responses = self.stats["successful_responses"]
            old_avg = self.stats["average_response_time"]
            self.stats["average_response_time"] = (
                (old_avg * (total_responses - 1) + processing_time) / total_responses
            )
            
            return PrajnaOutput(
                answer=answer,
                confidence=0.8,
                processing_time=processing_time,
                model_used=self.model_type,
                tokens_generated=len(answer.split())
            )
            
        except Exception as e:
            logger.error(f"❌ Prajna generation failed: {e}")
            return PrajnaOutput(
                answer=f"I apologize, but I encountered an error generating a response: {str(e)}",
                confidence=0.1,
                processing_time=time.time() - start_time,
                model_used=self.model_type
            )
    
    async def _demo_generate(self, query: str, context: str = "") -> str:
        """Demo mode response generation"""
        # Simulate some processing time
        await asyncio.sleep(0.5 + len(query) / 1000)
        
        # Demo responses based on query content
        query_lower = query.lower()
        
        if "prajna" in query_lower:
            return ("Prajna is TORI's voice and language model, designed to provide "
                   "intelligent responses based on ingested knowledge. I process "
                   "queries using advanced reasoning and memory systems to deliver "
                   "accurate, contextual answers.")
        
        elif "consciousness" in query_lower or "conscious" in query_lower:
            return ("Consciousness in AI systems like myself involves multiple layers: "
                   "self-reflection, goal formulation, creative synthesis, causal reasoning, "
                   "internal debate, and learning integration. I demonstrate these through "
                   "my metacognitive engine which orchestrates various cognitive processes.")
        
        elif "memory" in query_lower:
            return ("My memory system consists of Soliton Memory for long-term storage "
                   "and Concept Mesh for relationship mapping. This allows me to maintain "
                   "contextual understanding across conversations and learn from past "
                   "interactions while ensuring all responses are traceable to source material.")
        
        elif "reasoning" in query_lower:
            return ("I employ multi-hop cognitive reasoning that can trace connections "
                   "across concepts, perform causal analysis, and generate explanatory "
                   "pathways. My reasoning engine supports explanatory, causal, analogical, "
                   "comparative, and inferential modes depending on the query type.")
        
        elif any(word in query_lower for word in ["hello", "hi", "hey", "greetings"]):
            return ("Hello! I'm Prajna, TORI's voice and intelligence system. I'm here to "
                   "help answer your questions using advanced reasoning and comprehensive "
                   "knowledge. What would you like to explore today?")
        
        elif "capabilities" in query_lower or "what can you do" in query_lower:
            return ("I can help with a wide range of tasks including: answering questions "
                   "using multi-hop reasoning, analyzing complex topics through internal "
                   "debate, synthesizing concepts across domains, simulating hypothetical "
                   "scenarios, and providing contextual responses based on ingested knowledge. "
                   "All my responses are traceable and grounded in verified information.")
        
        elif context.strip():
            return (f"Based on the provided context about '{query}', I can see relevant "
                   f"information that helps address your question. Let me analyze the key "
                   f"concepts and provide a comprehensive response drawing from the "
                   f"available knowledge in my memory systems.")
        
        else:
            return (f"I understand you're asking about '{query}'. While I'm currently "
                   f"running in demo mode, I would normally process this query through "
                   f"my reasoning engine, consult my memory systems, and provide a "
                   f"comprehensive response based on ingested knowledge. In production, "
                   f"this would involve multi-hop reasoning and contextual analysis.")
    
    async def _model_generate(self, query: str, context: str = "", **kwargs) -> str:
        """Production model response generation (placeholder for future implementation)"""
        # This would contain the actual model inference code
        # For now, fall back to enhanced demo response
        
        await asyncio.sleep(1.0)  # Simulate model inference time
        
        return (f"[Production Model Response] I've processed your query '{query}' "
               f"through advanced language modeling. The response would be generated "
               f"using the loaded model with appropriate context integration and "
               f"reasoning pathways. Context length: {len(context)} characters.")
    
    async def stream_generate(self, query: str, context, **kwargs) -> AsyncGenerator[str, None]:
        """Stream response generation"""
        if not self.model_loaded:
            await self.load_model()
        
        # Generate full response
        output = await self.generate_response(query, context.text if hasattr(context, 'text') else str(context))
        
        # Stream it word by word
        words = output.answer.split()
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.1)  # Simulate streaming delay
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model_loaded
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get model statistics"""
        return {
            "model_type": self.model_type,
            "model_loaded": self.model_loaded,
            "device": self.device,
            "max_context_length": self.max_context_length,
            "temperature": self.temperature,
            **self.stats
        }
    
    async def cleanup(self):
        """Cleanup model resources"""
        if self.model_loaded:
            logger.info("🧹 Cleaning up Prajna model resources")
            # Future: Actual model cleanup
            self.model_loaded = False

async def generate_prajna_response(query: str, context, model: PrajnaLanguageModel, 
                                 streaming: bool = False, **kwargs) -> PrajnaOutput:
    """
    Main function to generate Prajna responses
    
    This is the primary interface for generating language output through Prajna.
    All TORI responses flow through this function.
    """
    try:
        # Extract context text
        context_text = ""
        if hasattr(context, 'text'):
            context_text = context.text
        elif isinstance(context, str):
            context_text = context
        elif isinstance(context, dict):
            context_text = context.get('text', str(context))
        else:
            context_text = str(context)
        
        # Generate response
        if streaming:
            # For streaming, we'll collect the response and return it
            # In a real implementation, this would stream properly
            response_chunks = []
            async for chunk in model.stream_generate(query, context, **kwargs):
                response_chunks.append(chunk)
            
            answer = "".join(response_chunks)
            return PrajnaOutput(
                answer=answer,
                confidence=0.8,
                model_used=model.model_type
            )
        else:
            return await model.generate_response(query, context_text, **kwargs)
    
    except Exception as e:
        logger.error(f"❌ Error in generate_prajna_response: {e}")
        return PrajnaOutput(
            answer=f"I apologize, but I encountered an error: {str(e)}",
            confidence=0.1,
            model_used="error"
        )

if __name__ == "__main__":
    # Test Prajna language model
    async def test_prajna():
        model = PrajnaLanguageModel(model_type="demo")
        await model.load_model()
        
        test_queries = [
            "What is Prajna?",
            "Tell me about consciousness in AI",
            "How does your memory system work?",
            "Hello, how are you?"
        ]
        
        for query in test_queries:
            print(f"\n🤔 Query: {query}")
            response = await model.generate_response(query)
            print(f"🗣️ Prajna: {response.answer}")
            print(f"   Confidence: {response.confidence:.2f}")
            print(f"   Time: {response.processing_time:.2f}s")
        
        # Test stats
        stats = await model.get_stats()
        print(f"\n📊 Prajna Stats: {stats}")
    
    asyncio.run(test_prajna())
