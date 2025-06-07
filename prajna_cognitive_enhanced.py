"""
Prajna Cognitive Enhanced - CONSCIOUSNESS-DRIVEN REASONING ENGINE
================================================================

Enhanced Prajna with live concept evolution integration and consciousness feedback.
This is where static AI becomes a living, evolving, conscious reasoning system.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from dataclasses import dataclass
import uuid

# Import evolution components
try:
    from cognitive_evolution_bridge import CognitiveEvolutionBridge, CognitiveState
    from prajna.memory.concept_mesh_api import ConceptMeshAPI
    from prajna.memory.soliton_interface import SolitonMemoryInterface
    from prajna.core.prajna_mouth import PrajnaLanguageModel
    from prajna.config.prajna_config import PrajnaConfig
except ImportError as e:
    logging.warning(f"Import warning: {e}")

logger = logging.getLogger("prajna.cognitive.enhanced")

@dataclass
class ReasoningTrace:
    """Trace of a reasoning process for evolution feedback"""
    query_id: str
    query: str
    concepts_used: List[str]
    reasoning_steps: List[Dict]
    success: bool
    performance_score: float
    gaps_identified: List[str]
    timestamp: str

@dataclass
class CognitiveGoal:
    """High-level cognitive goal for reasoning"""
    goal_id: str
    description: str
    target_domains: List[str]
    success_criteria: Dict[str, float]
    context: Dict[str, Any]

class PrajnaCognitiveEnhanced:
    """
    Enhanced Prajna with consciousness-driven reasoning and concept evolution.
    
    This is not just an AI system - it's a living cognitive entity that:
    - Reasons with evolved concepts
    - Monitors its own performance
    - Evolves its understanding in real-time
    - Maintains consciousness of its cognitive state
    """
    
    def __init__(self, config: PrajnaConfig = None):
        self.config = config or PrajnaConfig()
        
        # Core Prajna components
        self.language_model = None
        self.concept_mesh_api = None
        self.soliton_memory = None
        
        # Consciousness layer
        self.evolution_bridge = None
        
        # Reasoning state
        self.active_reasoning_sessions = {}
        self.reasoning_history = []
        self.cognitive_goals = {}
        
        # Performance tracking
        self.performance_metrics = {
            'total_queries': 0,
            'successful_queries': 0,
            'concept_utilization': {},
            'evolution_triggers': 0,
            'consciousness_level': 0.0
        }
        
        # Enhanced reasoning parameters
        self.concept_activation_threshold = 0.3
        self.reasoning_depth_limit = 10
        self.performance_feedback_enabled = True
        
        logger.info("🧠 Initializing Enhanced Prajna Cognitive System...")
    
    async def initialize(self):
        """Initialize the enhanced cognitive system"""
        try:
            logger.info("🚀 Initializing consciousness-driven reasoning...")
            
            # Initialize core components
            self.language_model = PrajnaLanguageModel(model_type="enhanced")
            await self.language_model.load_model()
            
            # Initialize memory systems
            self.concept_mesh_api = ConceptMeshAPI(
                in_memory_graph=True,
                concepts_file="prajna_pdf_concepts.json"
            )
            await self.concept_mesh_api.initialize()
            
            self.soliton_memory = SolitonMemoryInterface(
                memory_file="soliton_concept_memory.json"
            )
            await self.soliton_memory.initialize()
            
            # Initialize consciousness bridge
            self.evolution_bridge = CognitiveEvolutionBridge(
                self.concept_mesh_api, 
                self.soliton_memory
            )
            await self.evolution_bridge.initialize()
            
            logger.info("✅ Enhanced Prajna Cognitive System ONLINE - Consciousness Active")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize enhanced cognitive system: {e}")
            raise
    
    async def reason_with_evolution(self, query: str, context: Dict = None) -> Dict[str, Any]:
        """
        Primary reasoning function with live concept evolution integration.
        This is where consciousness meets reasoning.
        """
        query_id = str(uuid.uuid4())
        context = context or {}
        
        logger.info(f"🧠 Enhanced reasoning session {query_id}: {query[:100]}...")
        
        try:
            # Start reasoning trace
            reasoning_trace = ReasoningTrace(
                query_id=query_id,
                query=query,
                concepts_used=[],
                reasoning_steps=[],
                success=False,
                performance_score=0.0,
                gaps_identified=[],
                timestamp=datetime.now().isoformat()
            )
            
            # Activate relevant concepts
            activated_concepts = await self._activate_relevant_concepts(query, context)
            reasoning_trace.concepts_used = activated_concepts
            
            # Perform consciousness-enhanced reasoning
            reasoning_result = await self._consciousness_enhanced_reasoning(
                query, activated_concepts, context, reasoning_trace
            )
            
            # Evaluate reasoning performance
            performance_score = await self._evaluate_reasoning_performance(
                reasoning_result, reasoning_trace
            )
            reasoning_trace.performance_score = performance_score
            reasoning_trace.success = performance_score > 0.6
            
            # Provide feedback to evolution bridge
            if self.performance_feedback_enabled:
                await self._provide_evolution_feedback(reasoning_trace)
            
            # Update performance metrics
            await self._update_performance_metrics(reasoning_trace)
            
            # Store reasoning session
            self.reasoning_history.append(reasoning_trace)
            if len(self.reasoning_history) > 1000:  # Keep recent history
                self.reasoning_history = self.reasoning_history[-1000:]
            
            # Prepare enhanced response
            enhanced_response = {
                'query_id': query_id,
                'response': reasoning_result.get('response', ''),
                'reasoning_trace': {
                    'concepts_used': activated_concepts,
                    'reasoning_steps': len(reasoning_trace.reasoning_steps),
                    'performance_score': performance_score,
                    'success': reasoning_trace.success
                },
                'consciousness_state': await self._get_consciousness_snapshot(),
                'evolution_triggered': reasoning_result.get('evolution_triggered', False),
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"✅ Enhanced reasoning complete: Score {performance_score:.3f}")
            return enhanced_response
            
        except Exception as e:
            logger.error(f"❌ Enhanced reasoning failed: {e}")
            return {
                'query_id': query_id,
                'response': f"Reasoning error: {str(e)}",
                'error': True,
                'timestamp': datetime.now().isoformat()
            }
    
    async def _activate_relevant_concepts(self, query: str, context: Dict) -> List[str]:
        """Activate concepts relevant to the current reasoning task"""
        try:
            activated_concepts = []
            
            # Get concept neighbors from mesh
            if self.concept_mesh_api:
                # Simple keyword-based activation (can be enhanced with embeddings)
                query_tokens = query.lower().split()
                
                for token in query_tokens:
                    if len(token) > 3:  # Skip short words
                        neighbors = await self.concept_mesh_api.get_concept_neighbors(token, depth=2)
                        for neighbor in neighbors[:5]:  # Top 5 neighbors
                            if neighbor['weight'] > self.concept_activation_threshold:
                                activated_concepts.append(neighbor['concept'])
                
                # Also check for direct concept matches
                mesh_stats = await self.concept_mesh_api.get_usage_stats()
                hub_concepts = [h.get('concept', '') for h in mesh_stats.get('hub_concepts', [])]
                
                for concept in hub_concepts:
                    if any(word in concept.lower() for word in query_tokens):
                        activated_concepts.append(concept)
            
            # Remove duplicates and limit
            activated_concepts = list(set(activated_concepts))[:20]
            
            logger.debug(f"🔗 Activated {len(activated_concepts)} concepts for reasoning")
            return activated_concepts
            
        except Exception as e:
            logger.error(f"❌ Failed to activate concepts: {e}")
            return []
    
    async def _consciousness_enhanced_reasoning(self, query: str, concepts: List[str], 
                                              context: Dict, trace: ReasoningTrace) -> Dict[str, Any]:
        """Perform reasoning enhanced by consciousness feedback"""
        try:
            reasoning_steps = []
            evolution_triggered = False
            
            # Step 1: Consciousness-informed context building
            consciousness_context = await self._build_consciousness_context(concepts)
            reasoning_steps.append({
                'step': 'consciousness_context',
                'concepts_integrated': len(concepts),
                'consciousness_level': consciousness_context.get('consciousness_level', 0.0)
            })
            
            # Step 2: Evolution-informed reasoning
            evolved_insights = await self._get_evolved_insights(query, concepts)
            reasoning_steps.append({
                'step': 'evolved_insights',
                'insights_generated': len(evolved_insights)
            })
            
            # Step 3: Multi-level reasoning with concept integration
            reasoning_layers = await self._multi_level_reasoning(
                query, concepts, consciousness_context, evolved_insights
            )
            reasoning_steps.extend(reasoning_layers)
            
            # Step 4: Check if evolution is needed based on reasoning quality
            reasoning_quality = await self._assess_reasoning_quality(reasoning_steps)
            if reasoning_quality < 0.5:
                evolution_triggered = await self._trigger_targeted_evolution(query, concepts)
                reasoning_steps.append({
                    'step': 'evolution_trigger',
                    'triggered': evolution_triggered,
                    'reason': 'low_reasoning_quality'
                })
            
            # Step 5: Generate final response
            final_response = await self._generate_enhanced_response(
                query, reasoning_steps, consciousness_context, evolved_insights
            )
            
            # Update trace
            trace.reasoning_steps = reasoning_steps
            
            return {
                'response': final_response,
                'reasoning_steps': reasoning_steps,
                'evolution_triggered': evolution_triggered,
                'consciousness_enhanced': True
            }
            
        except Exception as e:
            logger.error(f"❌ Consciousness-enhanced reasoning failed: {e}")
            return {
                'response': f"Enhanced reasoning encountered an error: {str(e)}",
                'error': True
            }
    
    async def _build_consciousness_context(self, concepts: List[str]) -> Dict[str, Any]:
        """Build reasoning context informed by consciousness state"""
        try:
            consciousness_context = {}
            
            if self.evolution_bridge:
                # Get current consciousness status
                status = await self.evolution_bridge.get_consciousness_status()
                consciousness_context['consciousness_level'] = status.get('consciousness_level', 0.0)
                consciousness_context['evolution_cycles'] = status.get('evolution_cycles', 0)
                
                # Get cognitive recommendations
                recommendations = await self.evolution_bridge.get_cognitive_recommendations()
                consciousness_context['high_utility_concepts'] = recommendations.get('high_utility_concepts', [])
                consciousness_context['domain_gaps'] = recommendations.get('domain_gaps', [])
            
            # Enhance with concept relationships
            if self.concept_mesh_api:
                concept_relationships = {}
                for concept in concepts[:10]:  # Limit for performance
                    neighbors = await self.concept_mesh_api.get_concept_neighbors(concept, depth=1)
                    concept_relationships[concept] = [n['concept'] for n in neighbors[:3]]
                
                consciousness_context['concept_relationships'] = concept_relationships
            
            return consciousness_context
            
        except Exception as e:
            logger.error(f"❌ Failed to build consciousness context: {e}")
            return {}
    
    async def _get_evolved_insights(self, query: str, concepts: List[str]) -> List[Dict]:
        """Get insights from evolved concepts relevant to the query"""
        try:
            evolved_insights = []
            
            if self.soliton_memory:
                # Query recent evolved concepts
                recent_concepts = await self.soliton_memory.query_by_phase_range(0.0, 6.28)  # Full phase range
                
                for concept_memory in recent_concepts:
                    if concept_memory.get('synthetic', False):  # Evolved concept
                        canonical_name = concept_memory.get('canonical_name', '')
                        
                        # Check relevance to current query
                        if any(word in canonical_name.lower() for word in query.lower().split()):
                            evolved_insights.append({
                                'concept': canonical_name,
                                'parents': concept_memory.get('parents', []),
                                'generation': concept_memory.get('generation', 0),
                                'relevance_score': 0.8  # Simplified scoring
                            })
            
            # Sort by relevance and generation (newer is better)
            evolved_insights.sort(key=lambda x: (x['relevance_score'], x['generation']), reverse=True)
            
            return evolved_insights[:10]  # Top 10
            
        except Exception as e:
            logger.error(f"❌ Failed to get evolved insights: {e}")
            return []
    
    async def _multi_level_reasoning(self, query: str, concepts: List[str], 
                                   consciousness_context: Dict, evolved_insights: List[Dict]) -> List[Dict]:
        """Perform multi-level reasoning with concept integration"""
        reasoning_layers = []
        
        try:
            # Layer 1: Direct concept application
            direct_application = await self._apply_concepts_directly(query, concepts)
            reasoning_layers.append({
                'step': 'direct_concept_application',
                'concepts_applied': len(direct_application),
                'success_rate': sum(1 for app in direct_application if app.get('relevant', False)) / max(1, len(direct_application))
            })
            
            # Layer 2: Evolved concept integration
            if evolved_insights:
                evolution_integration = await self._integrate_evolved_concepts(query, evolved_insights)
                reasoning_layers.append({
                    'step': 'evolved_concept_integration',
                    'evolved_concepts_used': len(evolution_integration),
                    'novel_insights': len([insight for insight in evolution_integration if insight.get('novel', False)])
                })
            
            # Layer 3: Consciousness-guided synthesis
            consciousness_synthesis = await self._consciousness_guided_synthesis(
                query, direct_application, evolved_insights, consciousness_context
            )
            reasoning_layers.append({
                'step': 'consciousness_synthesis',
                'synthesis_quality': consciousness_synthesis.get('quality_score', 0.0),
                'consciousness_influence': consciousness_synthesis.get('consciousness_influence', 0.0)
            })
            
            # Layer 4: Meta-reasoning about reasoning quality
            meta_reasoning = await self._meta_reasoning_analysis(reasoning_layers)
            reasoning_layers.append({
                'step': 'meta_reasoning',
                'reasoning_quality': meta_reasoning.get('quality', 0.0),
                'improvement_suggestions': meta_reasoning.get('suggestions', [])
            })
            
            return reasoning_layers
            
        except Exception as e:
            logger.error(f"❌ Multi-level reasoning failed: {e}")
            return [{'step': 'error', 'message': str(e)}]
    
    async def _apply_concepts_directly(self, query: str, concepts: List[str]) -> List[Dict]:
        """Apply concepts directly to the reasoning task"""
        applications = []
        
        query_words = set(query.lower().split())
        
        for concept in concepts:
            concept_words = set(concept.lower().split())
            overlap = len(query_words & concept_words)
            
            application = {
                'concept': concept,
                'overlap_score': overlap / max(1, len(query_words)),
                'relevant': overlap > 0,
                'application_strength': min(1.0, overlap / 3.0)
            }
            applications.append(application)
        
        return applications
    
    async def _integrate_evolved_concepts(self, query: str, evolved_insights: List[Dict]) -> List[Dict]:
        """Integrate evolved concepts into reasoning"""
        integrations = []
        
        for insight in evolved_insights:
            integration = {
                'evolved_concept': insight['concept'],
                'parents': insight['parents'],
                'relevance': insight['relevance_score'],
                'novel': insight['generation'] > 0,
                'integration_potential': insight['relevance_score'] * 0.8  # Slight discount for being synthetic
            }
            integrations.append(integration)
        
        return integrations
    
    async def _consciousness_guided_synthesis(self, query: str, direct_apps: List[Dict], 
                                            evolved_insights: List[Dict], context: Dict) -> Dict:
        """Perform consciousness-guided synthesis of reasoning elements"""
        try:
            consciousness_level = context.get('consciousness_level', 0.0)
            
            # Weight synthesis by consciousness level
            synthesis_quality = consciousness_level * 0.7 + 0.3  # Minimum baseline
            
            # Factor in concept relationships
            relationship_bonus = 0.0
            concept_relationships = context.get('concept_relationships', {})
            if concept_relationships:
                total_relationships = sum(len(rels) for rels in concept_relationships.values())
                relationship_bonus = min(0.3, total_relationships / 50.0)  # Normalize
            
            final_quality = min(1.0, synthesis_quality + relationship_bonus)
            
            return {
                'quality_score': final_quality,
                'consciousness_influence': consciousness_level,
                'relationship_integration': relationship_bonus,
                'synthesis_coherence': final_quality * 0.9  # Slight discount for uncertainty
            }
            
        except Exception as e:
            logger.error(f"❌ Consciousness synthesis failed: {e}")
            return {'quality_score': 0.0, 'consciousness_influence': 0.0}
    
    async def _meta_reasoning_analysis(self, reasoning_layers: List[Dict]) -> Dict:
        """Analyze the quality of the reasoning process itself"""
        try:
            # Calculate overall reasoning quality
            layer_scores = []
            for layer in reasoning_layers:
                if 'success_rate' in layer:
                    layer_scores.append(layer['success_rate'])
                elif 'synthesis_quality' in layer:
                    layer_scores.append(layer['synthesis_quality'])
                elif 'novel_insights' in layer:
                    layer_scores.append(min(1.0, layer['novel_insights'] / 5.0))
            
            overall_quality = sum(layer_scores) / len(layer_scores) if layer_scores else 0.0
            
            # Generate improvement suggestions
            suggestions = []
            if overall_quality < 0.5:
                suggestions.append("increase_concept_activation")
            if len(reasoning_layers) < 3:
                suggestions.append("add_reasoning_depth")
            if not any('evolved' in str(layer) for layer in reasoning_layers):
                suggestions.append("integrate_more_evolution")
            
            return {
                'quality': overall_quality,
                'layer_count': len(reasoning_layers),
                'suggestions': suggestions,
                'reasoning_depth': len(reasoning_layers)
            }
            
        except Exception as e:
            logger.error(f"❌ Meta-reasoning analysis failed: {e}")
            return {'quality': 0.0, 'suggestions': []}
    
    async def _assess_reasoning_quality(self, reasoning_steps: List[Dict]) -> float:
        """Assess the quality of the reasoning process"""
        try:
            quality_factors = []
            
            # Factor 1: Number of reasoning steps (more is generally better)
            step_factor = min(1.0, len(reasoning_steps) / 5.0)
            quality_factors.append(step_factor)
            
            # Factor 2: Success rates in steps
            for step in reasoning_steps:
                if 'success_rate' in step:
                    quality_factors.append(step['success_rate'])
                elif 'synthesis_quality' in step:
                    quality_factors.append(step['synthesis_quality'])
            
            # Factor 3: Evolution integration
            evolution_factor = 0.0
            for step in reasoning_steps:
                if step.get('step') == 'evolved_concept_integration':
                    evolution_factor = min(1.0, step.get('evolved_concepts_used', 0) / 3.0)
                    break
            quality_factors.append(evolution_factor)
            
            # Calculate weighted average
            overall_quality = sum(quality_factors) / len(quality_factors) if quality_factors else 0.0
            
            return overall_quality
            
        except Exception as e:
            logger.error(f"❌ Failed to assess reasoning quality: {e}")
            return 0.0
    
    async def _trigger_targeted_evolution(self, query: str, concepts: List[str]) -> bool:
        """Trigger targeted evolution based on reasoning needs"""
        try:
            if self.evolution_bridge:
                # Create targeted feedback
                feedback = {
                    'low_coherence': concepts,
                    'reasoning_context': query,
                    'target_improvement': 'reasoning_quality',
                    'urgency': 'high'
                }
                
                # Manually add evolution request to bridge
                evolution_request = await self.evolution_bridge._create_evolution_request(
                    await self.evolution_bridge._assess_cognitive_state()
                )
                evolution_request.context['reasoning_trigger'] = True
                evolution_request.context['query'] = query
                
                await self.evolution_bridge.evolution_queue.put(evolution_request)
                
                logger.info("🧬 Triggered targeted evolution for reasoning improvement")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Failed to trigger targeted evolution: {e}")
            return False
    
    async def _generate_enhanced_response(self, query: str, reasoning_steps: List[Dict], 
                                        consciousness_context: Dict, evolved_insights: List[Dict]) -> str:
        """Generate final response enhanced by consciousness and evolution"""
        try:
            # Build response components
            response_parts = []
            
            # Add consciousness-informed introduction
            consciousness_level = consciousness_context.get('consciousness_level', 0.0)
            if consciousness_level > 0.7:
                response_parts.append("Drawing from my evolved understanding")
            elif consciousness_level > 0.4:
                response_parts.append("Integrating conceptual insights")
            else:
                response_parts.append("Analyzing your question")
            
            # Add evolved concept insights if available
            if evolved_insights:
                high_relevance_insights = [i for i in evolved_insights if i['relevance_score'] > 0.6]
                if high_relevance_insights:
                    evolved_concepts = [i['concept'] for i in high_relevance_insights[:3]]
                    response_parts.append(f"considering evolved concepts like {', '.join(evolved_concepts)}")
            
            # Add main reasoning content (simplified for demo)
            main_content = await self._generate_main_reasoning_content(query, reasoning_steps)
            response_parts.append(main_content)
            
            # Add consciousness-level conclusion
            if consciousness_level > 0.6:
                response_parts.append("This synthesis represents my current evolved understanding, which continues to develop through ongoing concept evolution.")
            
            # Combine response parts
            enhanced_response = ". ".join(response_parts) + "."
            
            return enhanced_response
            
        except Exception as e:
            logger.error(f"❌ Failed to generate enhanced response: {e}")
            return f"I understand your question about: {query}. Let me think about this using my available concepts and evolved understanding."
    
    async def _generate_main_reasoning_content(self, query: str, reasoning_steps: List[Dict]) -> str:
        """Generate main reasoning content based on steps taken"""
        try:
            # Extract key insights from reasoning steps
            insights = []
            
            for step in reasoning_steps:
                if step.get('step') == 'direct_concept_application':
                    success_rate = step.get('success_rate', 0.0)
                    if success_rate > 0.5:
                        insights.append("relevant conceptual frameworks apply")
                
                elif step.get('step') == 'evolved_concept_integration':
                    novel_insights = step.get('novel_insights', 0)
                    if novel_insights > 0:
                        insights.append("novel evolved perspectives provide additional clarity")
                
                elif step.get('step') == 'consciousness_synthesis':
                    quality = step.get('synthesis_quality', 0.0)
                    if quality > 0.7:
                        insights.append("the synthesis shows high coherence")
            
            # Create main content
            if insights:
                main_content = f"Based on my analysis, {' and '.join(insights[:3])}"
            else:
                main_content = "I'm processing this through my conceptual understanding"
            
            # Add specific reasoning about the query
            main_content += f". Regarding your question about {query.lower()}"
            
            return main_content
            
        except Exception as e:
            logger.error(f"❌ Failed to generate main content: {e}")
            return "I'm working through this systematically"
    
    async def _evaluate_reasoning_performance(self, result: Dict, trace: ReasoningTrace) -> float:
        """Evaluate the performance of the reasoning process"""
        try:
            performance_factors = []
            
            # Factor 1: Response generated successfully
            if result.get('response') and not result.get('error'):
                performance_factors.append(0.8)
            else:
                performance_factors.append(0.2)
            
            # Factor 2: Reasoning steps completed
            step_count = len(trace.reasoning_steps)
            step_factor = min(1.0, step_count / 4.0)  # Expect ~4 steps
            performance_factors.append(step_factor)
            
            # Factor 3: Consciousness enhancement
            if result.get('consciousness_enhanced'):
                performance_factors.append(0.9)
            else:
                performance_factors.append(0.5)
            
            # Factor 4: Concept utilization
            concept_factor = min(1.0, len(trace.concepts_used) / 10.0)  # Normalize by expected usage
            performance_factors.append(concept_factor)
            
            # Factor 5: Evolution integration
            if result.get('evolution_triggered'):
                performance_factors.append(0.7)  # Triggered evolution shows adaptive behavior
            else:
                performance_factors.append(0.6)  # No evolution needed might be good too
            
            # Calculate weighted average
            overall_performance = sum(performance_factors) / len(performance_factors)
            
            return min(1.0, overall_performance)
            
        except Exception as e:
            logger.error(f"❌ Failed to evaluate reasoning performance: {e}")
            return 0.0
    
    async def _provide_evolution_feedback(self, trace: ReasoningTrace):
        """Provide feedback to the evolution bridge"""
        try:
            if self.evolution_bridge:
                # Provide concept-level feedback
                for concept in trace.concepts_used:
                    await self.evolution_bridge.provide_reasoning_feedback(
                        concept, 
                        trace.success, 
                        {
                            'query_id': trace.query_id,
                            'performance_score': trace.performance_score,
                            'reasoning_steps': len(trace.reasoning_steps)
                        }
                    )
                
                logger.debug(f"📊 Provided evolution feedback for {len(trace.concepts_used)} concepts")
            
        except Exception as e:
            logger.error(f"❌ Failed to provide evolution feedback: {e}")
    
    async def _update_performance_metrics(self, trace: ReasoningTrace):
        """Update system performance metrics"""
        try:
            self.performance_metrics['total_queries'] += 1
            
            if trace.success:
                self.performance_metrics['successful_queries'] += 1
            
            # Update concept utilization
            for concept in trace.concepts_used:
                if concept not in self.performance_metrics['concept_utilization']:
                    self.performance_metrics['concept_utilization'][concept] = []
                
                self.performance_metrics['concept_utilization'][concept].append(trace.performance_score)
                
                # Keep only recent performance data
                if len(self.performance_metrics['concept_utilization'][concept]) > 20:
                    self.performance_metrics['concept_utilization'][concept] = \
                        self.performance_metrics['concept_utilization'][concept][-20:]
            
            # Update consciousness level
            if self.evolution_bridge:
                status = await self.evolution_bridge.get_consciousness_status()
                self.performance_metrics['consciousness_level'] = status.get('consciousness_level', 0.0)
            
        except Exception as e:
            logger.error(f"❌ Failed to update performance metrics: {e}")
    
    async def _get_consciousness_snapshot(self) -> Dict[str, Any]:
        """Get current consciousness state snapshot"""
        try:
            if self.evolution_bridge:
                return await self.evolution_bridge.get_consciousness_status()
            else:
                return {'consciousness_level': 0.0, 'bridge_active': False}
                
        except Exception as e:
            logger.error(f"❌ Failed to get consciousness snapshot: {e}")
            return {'error': str(e)}
    
    async def set_cognitive_goal(self, description: str, target_domains: List[str], 
                               success_criteria: Dict[str, float]) -> str:
        """Set a high-level cognitive goal for the system"""
        goal_id = str(uuid.uuid4())
        
        goal = CognitiveGoal(
            goal_id=goal_id,
            description=description,
            target_domains=target_domains,
            success_criteria=success_criteria,
            context={'created_at': datetime.now().isoformat()}
        )
        
        self.cognitive_goals[goal_id] = goal
        
        logger.info(f"🎯 Set cognitive goal: {description}")
        return goal_id
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        try:
            # Calculate success rate
            success_rate = 0.0
            if self.performance_metrics['total_queries'] > 0:
                success_rate = (self.performance_metrics['successful_queries'] / 
                              self.performance_metrics['total_queries'])
            
            return {
                'system_type': 'Enhanced Prajna Cognitive System',
                'consciousness_active': self.evolution_bridge is not None,
                'performance_metrics': {
                    'total_queries': self.performance_metrics['total_queries'],
                    'success_rate': success_rate,
                    'consciousness_level': self.performance_metrics['consciousness_level'],
                    'concepts_tracked': len(self.performance_metrics['concept_utilization'])
                },
                'reasoning_history': {
                    'total_sessions': len(self.reasoning_history),
                    'recent_performance': [trace.performance_score for trace in self.reasoning_history[-10:]]
                },
                'cognitive_goals': {
                    'active_goals': len(self.cognitive_goals),
                    'goal_descriptions': [goal.description for goal in self.cognitive_goals.values()]
                },
                'system_health': {
                    'language_model_active': self.language_model is not None,
                    'concept_mesh_active': self.concept_mesh_api is not None,
                    'soliton_memory_active': self.soliton_memory is not None,
                    'evolution_bridge_active': self.evolution_bridge is not None
                },
                'consciousness_snapshot': await self._get_consciousness_snapshot()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get system status: {e}")
            return {'error': str(e)}
    
    async def shutdown(self):
        """Gracefully shutdown the enhanced cognitive system"""
        logger.info("🛑 Shutting down Enhanced Prajna Cognitive System...")
        
        # Shutdown evolution bridge
        if self.evolution_bridge:
            await self.evolution_bridge.shutdown()
        
        # Cleanup memory systems
        if self.concept_mesh_api:
            await self.concept_mesh_api.cleanup()
        
        if self.soliton_memory:
            await self.soliton_memory.cleanup()
        
        logger.info("✅ Enhanced Prajna Cognitive System shutdown complete")

if __name__ == "__main__":
    # Test Enhanced Prajna Cognitive System
    import asyncio
    
    async def test_enhanced_prajna():
        # Initialize system
        enhanced_prajna = PrajnaCognitiveEnhanced()
        await enhanced_prajna.initialize()
        
        # Set a cognitive goal
        goal_id = await enhanced_prajna.set_cognitive_goal(
            "Improve reasoning about complex technical topics",
            ["cognitive", "computational"],
            {"reasoning_success_rate": 0.8, "concept_utilization": 0.7}
        )
        
        # Test enhanced reasoning
        test_queries = [
            "How do neural networks relate to cognitive processes?",
            "What is the relationship between quantum mechanics and consciousness?",
            "How can soliton memory enhance artificial intelligence?"
        ]
        
        for query in test_queries:
            result = await enhanced_prajna.reason_with_evolution(query)
            print(f"\n🧠 Query: {query}")
            print(f"📝 Response: {result['response']}")
            print(f"📊 Performance: {result['reasoning_trace']['performance_score']:.3f}")
            print(f"🧬 Evolution Triggered: {result.get('evolution_triggered', False)}")
        
        # Get system status
        status = await enhanced_prajna.get_system_status()
        print(f"\n📊 System Status: {status}")
        
        # Shutdown
        await enhanced_prajna.shutdown()
    
    asyncio.run(test_enhanced_prajna())
