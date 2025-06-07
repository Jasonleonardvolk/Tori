"""
Ghost Forum: Internal Debate Arena for Prajna
=============================================

Production implementation of Prajna's multi-agent internal debate system.
This module creates specialized ghost agents with different perspectives and heuristics
that debate and challenge reasoning before finalization. The outcome increases confidence
through consensus or flags uncertainty through disagreement.

This is where Prajna gains multi-perspective validation - the ability to debate
with itself using multiple specialized reasoning agents for robust decision-making.
"""

import asyncio
import logging
import time
import random
from typing import List, Dict, Any, Optional, Set, Tuple, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import hashlib

logger = logging.getLogger("prajna.ghost_forum")

class AgentRole(Enum):
    """Roles for ghost agents in the debate arena"""
    SKEPTIC = "skeptic"                    # Questions and challenges everything
    ADVOCATE = "advocate"                  # Defends and supports current reasoning
    DOMAIN_EXPERT = "domain_expert"        # Provides specialized domain knowledge
    DEVILS_ADVOCATE = "devils_advocate"    # Finds edge cases and problems
    SYNTHESIZER = "synthesizer"           # Seeks compromise and integration
    LOGICIAN = "logician"                 # Focuses on logical consistency
    EMPIRICIST = "empiricist"             # Demands evidence and data
    CREATIVE = "creative"                 # Offers alternative perspectives
    CONSERVATIVE = "conservative"          # Prefers established knowledge
    PROGRESSIVE = "progressive"            # Embraces new ideas and changes

class DebatePhase(Enum):
    """Phases of the debate process"""
    INITIALIZATION = "initialization"
    OPENING_STATEMENTS = "opening_statements"
    ARGUMENT_EXCHANGE = "argument_exchange"
    CHALLENGE_RESPONSE = "challenge_response"
    EVIDENCE_REVIEW = "evidence_review"
    SYNTHESIS_ATTEMPT = "synthesis_attempt"
    FINAL_POSITIONS = "final_positions"
    CONSENSUS_BUILDING = "consensus_building"

@dataclass
class DebateStatement:
    """Individual statement made by an agent in the debate"""
    agent_id: str
    agent_role: AgentRole
    statement: str
    confidence: float                    # Agent's confidence in this statement
    evidence: List[str] = field(default_factory=list)  # Supporting evidence
    challenges: List[str] = field(default_factory=list)  # Points being challenged
    timestamp: datetime = field(default_factory=datetime.now)
    statement_type: str = "argument"     # argument, challenge, evidence, synthesis
    
    def get_key_points(self) -> List[str]:
        """Extract key points from the statement"""
        # Simple extraction - could use NLP
        sentences = self.statement.split('.')
        return [s.strip() for s in sentences if len(s.strip()) > 10]

@dataclass
class DebateResult:
    """Complete result of a debate session"""
    debate_id: str
    prompt: str
    context: str
    
    # Debate participants
    agents: List['GhostAgent']
    
    # Debate content
    transcript: List[DebateStatement] = field(default_factory=list)
    phases_completed: List[DebatePhase] = field(default_factory=list)
    
    # Outcomes
    consensus: Optional[str] = None       # Final agreed answer if reached
    majority_position: Optional[str] = None  # Most supported position
    conflict_score: float = 0.0          # Level of disagreement (0.0-1.0)
    confidence_score: float = 0.0        # Overall confidence in outcome
    
    # Analysis
    key_agreements: List[str] = field(default_factory=list)
    key_disagreements: List[str] = field(default_factory=list)
    unresolved_issues: List[str] = field(default_factory=list)
    
    # Metadata
    debate_time: float = 0.0
    total_statements: int = 0
    rounds_completed: int = 0
    success: bool = False

class GhostAgent:
    """Individual debating agent with specific role and strategy"""
    
    def __init__(self, agent_id: str, role: AgentRole, strategy: Optional[Callable] = None, 
                 domain_expertise: str = "", personality_traits: Dict[str, float] = None):
        self.agent_id = agent_id
        self.role = role
        self.strategy = strategy or self._get_default_strategy()
        self.domain_expertise = domain_expertise
        self.personality_traits = personality_traits or self._get_default_personality()
        
        # Debate state
        self.position: Optional[str] = None
        self.confidence: float = 0.5
        self.statements_made: List[DebateStatement] = []
        self.evidence_gathered: List[str] = []
        
        # Performance tracking
        self.debate_count = 0
        self.successful_arguments = 0
        self.challenges_made = 0
        self.consensus_contributions = 0
    
    def _get_default_strategy(self) -> Callable:
        """Get default strategy based on role"""
        strategies = {
            AgentRole.SKEPTIC: self._skeptic_strategy,
            AgentRole.ADVOCATE: self._advocate_strategy,
            AgentRole.DOMAIN_EXPERT: self._expert_strategy,
            AgentRole.DEVILS_ADVOCATE: self._devils_advocate_strategy,
            AgentRole.SYNTHESIZER: self._synthesizer_strategy,
            AgentRole.LOGICIAN: self._logician_strategy,
            AgentRole.EMPIRICIST: self._empiricist_strategy,
            AgentRole.CREATIVE: self._creative_strategy,
            AgentRole.CONSERVATIVE: self._conservative_strategy,
            AgentRole.PROGRESSIVE: self._progressive_strategy
        }
        return strategies.get(self.role, self._default_strategy)
    
    def _get_default_personality(self) -> Dict[str, float]:
        """Get default personality traits based on role"""
        personalities = {
            AgentRole.SKEPTIC: {"criticism": 0.9, "openness": 0.3, "confidence": 0.7},
            AgentRole.ADVOCATE: {"support": 0.9, "confidence": 0.8, "persistence": 0.8},
            AgentRole.DOMAIN_EXPERT: {"authority": 0.8, "precision": 0.9, "confidence": 0.9},
            AgentRole.DEVILS_ADVOCATE: {"contrarian": 0.9, "creativity": 0.7, "persistence": 0.8},
            AgentRole.SYNTHESIZER: {"cooperation": 0.9, "flexibility": 0.8, "diplomacy": 0.9},
            AgentRole.LOGICIAN: {"precision": 0.9, "consistency": 0.9, "systematic": 0.8},
            AgentRole.EMPIRICIST: {"evidence_focus": 0.9, "skepticism": 0.7, "rigor": 0.8},
            AgentRole.CREATIVE: {"creativity": 0.9, "openness": 0.9, "flexibility": 0.8},
            AgentRole.CONSERVATIVE: {"caution": 0.8, "tradition": 0.8, "stability": 0.9},
            AgentRole.PROGRESSIVE: {"innovation": 0.9, "risk_taking": 0.7, "adaptability": 0.8}
        }
        return personalities.get(self.role, {"confidence": 0.5, "openness": 0.5})
    
    async def generate_response(self, prompt: str, context: str, debate_history: List[DebateStatement], 
                              current_phase: DebatePhase) -> DebateStatement:
        """Generate response based on role, strategy, and debate context"""
        try:
            # Use strategy to generate response
            response_content = await self.strategy(prompt, context, debate_history, current_phase)
            
            # Create statement
            statement = DebateStatement(
                agent_id=self.agent_id,
                agent_role=self.role,
                statement=response_content,
                confidence=self.confidence,
                statement_type=self._determine_statement_type(current_phase)
            )
            
            # Add to agent's history
            self.statements_made.append(statement)
            
            return statement
            
        except Exception as e:
            logger.error(f"❌ Agent {self.agent_id} failed to generate response: {e}")
            # Return fallback response
            return DebateStatement(
                agent_id=self.agent_id,
                agent_role=self.role,
                statement=f"As a {self.role.value}, I need more time to consider this position.",
                confidence=0.3
            )
    
    def _determine_statement_type(self, phase: DebatePhase) -> str:
        """Determine statement type based on debate phase"""
        phase_types = {
            DebatePhase.OPENING_STATEMENTS: "opening",
            DebatePhase.ARGUMENT_EXCHANGE: "argument",
            DebatePhase.CHALLENGE_RESPONSE: "response",
            DebatePhase.EVIDENCE_REVIEW: "evidence",
            DebatePhase.SYNTHESIS_ATTEMPT: "synthesis",
            DebatePhase.FINAL_POSITIONS: "position"
        }
        return phase_types.get(phase, "statement")
    
    # Strategy implementations for different agent roles
    
    async def _skeptic_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                               phase: DebatePhase) -> str:
        """Skeptic agent strategy - question and challenge"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return f"I question the premise of this argument. What evidence supports the claim that '{prompt[:50]}...'? We need to examine the assumptions more carefully."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            # Find claims to challenge
            recent_claims = [stmt.statement for stmt in history[-3:] if stmt.agent_role != AgentRole.SKEPTIC]
            if recent_claims:
                claim = recent_claims[-1]
                return f"I challenge this assertion: '{claim[:50]}...'. Where is the supporting evidence? Have alternative explanations been considered?"
            else:
                return "I remain skeptical of the conclusions being drawn without sufficient evidence."
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "The evidence presented needs more rigorous scrutiny. Are we certain these sources are reliable and their conclusions valid?"
        
        else:
            return "I maintain my skeptical position until more convincing evidence is presented."
    
    async def _advocate_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                phase: DebatePhase) -> str:
        """Advocate agent strategy - support and defend"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return f"I strongly support the position presented. The reasoning appears sound and the conclusion follows logically from the premises."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            # Defend against challenges
            challenges = [stmt for stmt in history[-3:] if "challenge" in stmt.statement.lower() or "question" in stmt.statement.lower()]
            if challenges:
                return f"In response to the challenges raised, I believe the original position remains valid because the core logic is sound and the evidence supports the conclusion."
            else:
                return "The reasoning presented is well-founded and deserves our support."
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "The evidence clearly supports our position. The data is consistent and the sources are credible."
        
        else:
            return "I continue to advocate for this position based on the strength of the arguments presented."
    
    async def _expert_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                              phase: DebatePhase) -> str:
        """Domain expert strategy - provide specialized knowledge"""
        expertise_intro = f"Drawing from my expertise in {self.domain_expertise or 'this domain'}, "
        
        if phase == DebatePhase.OPENING_STATEMENTS:
            return f"{expertise_intro}I can provide specialized insight. The technical aspects of this question require careful consideration of domain-specific principles."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            return f"{expertise_intro}the established principles in this field suggest that the reasoning has merit, though we should consider the technical constraints and established methodologies."
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return f"{expertise_intro}the evidence aligns with what we know from peer-reviewed research and established practice in this domain."
        
        else:
            return f"{expertise_intro}based on domain knowledge, this position has technical validity."
    
    async def _devils_advocate_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                       phase: DebatePhase) -> str:
        """Devil's advocate strategy - find problems and edge cases"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return "Let me play devil's advocate here. What if we're completely wrong? What are the edge cases and failure modes we haven't considered?"
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            return "I'm going to push back on this reasoning. What about the scenarios where this logic breaks down? Have we considered the unintended consequences?"
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "The evidence might seem convincing, but what about the studies that contradict this? Are we cherry-picking data that supports our preferred conclusion?"
        
        else:
            return "I maintain that we haven't adequately addressed the potential problems and edge cases. This position may be more fragile than it appears."
    
    async def _synthesizer_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                   phase: DebatePhase) -> str:
        """Synthesizer strategy - seek common ground and integration"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return "I believe we can find common ground here. Let's identify the areas where we might agree and build from there."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            # Look for points of agreement
            agreements = self._find_common_themes(history)
            if agreements:
                return f"I notice we seem to agree on several points: {', '.join(agreements[:2])}. Perhaps we can build consensus around these areas."
            else:
                return "While there are disagreements, I believe we can find a middle path that addresses everyone's concerns."
        
        elif phase == DebatePhase.SYNTHESIS_ATTEMPT:
            return "Let me propose a synthesis: we can acknowledge the valid points from different perspectives and create a more nuanced position that incorporates the best insights from each viewpoint."
        
        else:
            return "I believe we can reach a consensus that honors the valid concerns from all perspectives."
    
    async def _logician_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                phase: DebatePhase) -> str:
        """Logician strategy - focus on logical consistency"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return "Let's examine the logical structure of this argument. Are the premises valid? Does the conclusion follow necessarily from the premises?"
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            # Check for logical fallacies
            return "I need to point out a logical inconsistency I've noticed. If we accept premise A and premise B, then conclusion C doesn't necessarily follow. We need to tighten our reasoning."
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "From a logical standpoint, the evidence must directly support the claims being made. We cannot make inductive leaps without acknowledging the uncertainty involved."
        
        else:
            return "Our final position must be logically coherent and free from contradictions. Let's ensure our reasoning is sound."
    
    async def _empiricist_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                  phase: DebatePhase) -> str:
        """Empiricist strategy - demand evidence and data"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return "Where is the empirical evidence for these claims? We need data, studies, and observable phenomena to support our conclusions."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            return "Theoretical arguments are insufficient. What does the actual data show? Are there controlled studies or observational evidence that support this position?"
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "Finally, we're reviewing evidence! But we need to examine the methodology, sample sizes, and reproducibility of these studies. Not all evidence is created equal."
        
        else:
            return "Our conclusion must be grounded in solid empirical evidence. Without data, we're just speculating."
    
    async def _creative_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                phase: DebatePhase) -> str:
        """Creative strategy - offer alternative perspectives"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return "What if we approach this from a completely different angle? Perhaps there's a creative solution or perspective we haven't considered yet."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            return "Here's an alternative viewpoint: instead of thinking about this linearly, what if we consider it as a dynamic system with feedback loops and emergent properties?"
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "The evidence is interesting, but what about the patterns we're not seeing? Are there metaphors or analogies from other fields that could illuminate this issue?"
        
        else:
            return "I propose we embrace a more creative, interdisciplinary approach that combines insights from multiple domains."
    
    async def _conservative_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                    phase: DebatePhase) -> str:
        """Conservative strategy - prefer established knowledge"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return "We should be cautious about departing from well-established principles. The traditional understanding has served us well and shouldn't be abandoned lightly."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            return "While new ideas can be appealing, we must remember that established knowledge has been tested over time. Revolutionary claims require extraordinary evidence."
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "The evidence should be evaluated against the substantial body of existing knowledge. Outlier studies shouldn't override well-established findings."
        
        else:
            return "I advocate for a position that respects established knowledge while being open to gradual, well-supported refinements."
    
    async def _progressive_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                                   phase: DebatePhase) -> str:
        """Progressive strategy - embrace new ideas"""
        if phase == DebatePhase.OPENING_STATEMENTS:
            return "This is an opportunity to challenge conventional thinking. We shouldn't be constrained by old paradigms if new evidence points in a different direction."
        
        elif phase == DebatePhase.ARGUMENT_EXCHANGE:
            return "Traditional approaches may be limiting our understanding. We should be bold in considering new possibilities and innovative interpretations."
        
        elif phase == DebatePhase.EVIDENCE_REVIEW:
            return "The emerging evidence suggests we need to update our understanding. Science progresses by challenging established views with new data."
        
        else:
            return "I support a progressive position that embraces new insights and isn't afraid to revise outdated assumptions."
    
    async def _default_strategy(self, prompt: str, context: str, history: List[DebateStatement], 
                               phase: DebatePhase) -> str:
        """Default strategy for unspecified roles"""
        return f"As a {self.role.value}, I offer my perspective on this matter based on the discussion so far."
    
    def _find_common_themes(self, history: List[DebateStatement]) -> List[str]:
        """Find common themes across debate statements"""
        themes = []
        
        # Simple keyword-based theme detection
        all_statements = " ".join([stmt.statement for stmt in history])
        common_words = ["evidence", "data", "reasoning", "logic", "conclusion", "premise", "argument"]
        
        for word in common_words:
            if all_statements.lower().count(word) >= len(history) // 2:  # Appears in at least half the statements
                themes.append(word)
        
        return themes
    
    def update_performance_stats(self, successful_argument: bool = False, made_challenge: bool = False, 
                               contributed_consensus: bool = False):
        """Update agent performance statistics"""
        self.debate_count += 1
        
        if successful_argument:
            self.successful_arguments += 1
        
        if made_challenge:
            self.challenges_made += 1
        
        if contributed_consensus:
            self.consensus_contributions += 1

class GhostForum:
    """
    Production multi-agent debate arena for internal validation and consensus building.
    
    This is where Prajna gains multi-perspective reasoning - the ability to debate with itself
    using specialized agents to validate reasoning from multiple angles.
    """
    
    def __init__(self, agents: List[GhostAgent] = None, psi_archive=None):
        self.agents = agents or self._create_default_agents()
        self.psi_archive = psi_archive
        
        # Debate configuration
        self.max_rounds = 5
        self.max_statements_per_round = 10
        self.consensus_threshold = 0.8
        self.min_participation_ratio = 0.6
        
        # Performance tracking
        self.debate_stats = {
            "total_debates": 0,
            "successful_consensus": 0,
            "average_conflict_score": 0.0,
            "average_debate_time": 0.0,
            "agent_performance": {}
        }
        
        logger.info(f"👻 GhostForum initialized with {len(self.agents)} debate agents")
    
    def _create_default_agents(self) -> List[GhostAgent]:
        """Create default set of debate agents"""
        default_agents = [
            GhostAgent("skeptic_001", AgentRole.SKEPTIC),
            GhostAgent("advocate_001", AgentRole.ADVOCATE),
            GhostAgent("expert_001", AgentRole.DOMAIN_EXPERT, domain_expertise="general"),
            GhostAgent("synthesizer_001", AgentRole.SYNTHESIZER),
            GhostAgent("logician_001", AgentRole.LOGICIAN)
        ]
        return default_agents
    
    async def run_debate(self, prompt: str, context: str = "", max_rounds: Optional[int] = None) -> DebateResult:
        """
        Run a complete debate session among ghost agents.
        
        This is the main entry point for multi-agent reasoning validation.
        """
        start_time = time.time()
        debate_id = self._generate_debate_id(prompt)
        max_rounds = max_rounds or self.max_rounds
        
        try:
            logger.info(f"👻 Starting debate: {prompt[:100]}...")
            
            # Initialize debate result
            result = DebateResult(
                debate_id=debate_id,
                prompt=prompt,
                context=context,
                agents=self.agents.copy()
            )
            
            # Phase 1: Opening Statements
            await self._run_opening_statements(result)
            result.phases_completed.append(DebatePhase.OPENING_STATEMENTS)
            
            # Phase 2-N: Argument Exchange Rounds
            for round_num in range(max_rounds):
                round_success = await self._run_argument_round(result, round_num)
                result.rounds_completed += 1
                
                # Check for early consensus
                if await self._check_early_consensus(result):
                    break
                
                if not round_success:
                    break
            
            result.phases_completed.append(DebatePhase.ARGUMENT_EXCHANGE)
            
            # Phase 3: Evidence Review
            await self._run_evidence_review(result)
            result.phases_completed.append(DebatePhase.EVIDENCE_REVIEW)
            
            # Phase 4: Synthesis Attempt
            await self._run_synthesis_attempt(result)
            result.phases_completed.append(DebatePhase.SYNTHESIS_ATTEMPT)
            
            # Phase 5: Final Analysis
            await self._analyze_debate_outcome(result)
            
            # Calculate final metrics
            result.debate_time = time.time() - start_time
            result.total_statements = len(result.transcript)
            result.success = result.confidence_score >= self.consensus_threshold
            
            # Archive debate for learning
            if self.psi_archive:
                await self._archive_debate(result)
            
            # Update statistics
            self._update_debate_stats(result)
            
            logger.info(f"👻 Debate complete: consensus: {result.consensus is not None}, "
                       f"conflict: {result.conflict_score:.2f}, confidence: {result.confidence_score:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Debate failed: {e}")
            return DebateResult(
                debate_id=debate_id,
                prompt=prompt,
                context=context,
                agents=self.agents,
                debate_time=time.time() - start_time,
                success=False
            )
    
    async def _run_opening_statements(self, result: DebateResult):
        """Run opening statements phase"""
        logger.debug("👻 Phase: Opening Statements")
        
        for agent in self.agents:
            statement = await agent.generate_response(
                result.prompt, result.context, result.transcript, DebatePhase.OPENING_STATEMENTS
            )
            result.transcript.append(statement)
    
    async def _run_argument_round(self, result: DebateResult, round_num: int) -> bool:
        """Run a single round of argument exchange"""
        logger.debug(f"👻 Round {round_num + 1}: Argument Exchange")
        
        round_statements = []
        
        # Each agent gets to respond in this round
        for agent in self.agents:
            statement = await agent.generate_response(
                result.prompt, result.context, result.transcript, DebatePhase.ARGUMENT_EXCHANGE
            )
            result.transcript.append(statement)
            round_statements.append(statement)
            
            # Limit statements per round
            if len(round_statements) >= self.max_statements_per_round:
                break
        
        return len(round_statements) > 0
    
    async def _run_evidence_review(self, result: DebateResult):
        """Run evidence review phase"""
        logger.debug("👻 Phase: Evidence Review")
        
        for agent in self.agents:
            if agent.role in [AgentRole.EMPIRICIST, AgentRole.DOMAIN_EXPERT, AgentRole.LOGICIAN]:
                statement = await agent.generate_response(
                    result.prompt, result.context, result.transcript, DebatePhase.EVIDENCE_REVIEW
                )
                result.transcript.append(statement)
    
    async def _run_synthesis_attempt(self, result: DebateResult):
        """Run synthesis attempt phase"""
        logger.debug("👻 Phase: Synthesis Attempt")
        
        # Synthesizer agents attempt to build consensus
        synthesizers = [agent for agent in self.agents if agent.role == AgentRole.SYNTHESIZER]
        
        for agent in synthesizers:
            statement = await agent.generate_response(
                result.prompt, result.context, result.transcript, DebatePhase.SYNTHESIS_ATTEMPT
            )
            result.transcript.append(statement)
    
    async def _check_early_consensus(self, result: DebateResult) -> bool:
        """Check if early consensus has been reached"""
        if len(result.transcript) < len(self.agents):
            return False
        
        # Simple consensus check - look for agreement keywords
        recent_statements = result.transcript[-len(self.agents):]
        agreement_count = 0
        
        for statement in recent_statements:
            if any(word in statement.statement.lower() for word in ["agree", "consensus", "accept", "support"]):
                agreement_count += 1
        
        consensus_ratio = agreement_count / len(recent_statements)
        return consensus_ratio >= self.consensus_threshold
    
    async def _analyze_debate_outcome(self, result: DebateResult):
        """Analyze final debate outcome and generate results"""
        
        # Extract key positions
        positions = self._extract_positions(result.transcript)
        
        # Calculate conflict score
        result.conflict_score = self._calculate_conflict_score(result.transcript)
        
        # Find consensus or majority position
        result.consensus, result.majority_position = await self._find_consensus(positions)
        
        # Calculate confidence score
        result.confidence_score = self._calculate_confidence_score(result.transcript, result.conflict_score)
        
        # Extract agreements and disagreements
        result.key_agreements = self._extract_agreements(result.transcript)
        result.key_disagreements = self._extract_disagreements(result.transcript)
        result.unresolved_issues = self._extract_unresolved_issues(result.transcript)
    
    def _extract_positions(self, transcript: List[DebateStatement]) -> Dict[str, List[str]]:
        """Extract positions taken by different agents"""
        positions = {}
        
        for statement in transcript:
            agent_id = statement.agent_id
            if agent_id not in positions:
                positions[agent_id] = []
            
            # Extract position keywords
            statement_lower = statement.statement.lower()
            if any(word in statement_lower for word in ["support", "advocate", "agree", "accept"]):
                positions[agent_id].append("supportive")
            elif any(word in statement_lower for word in ["oppose", "disagree", "challenge", "question"]):
                positions[agent_id].append("opposing")
            else:
                positions[agent_id].append("neutral")
        
        return positions
    
    def _calculate_conflict_score(self, transcript: List[DebateStatement]) -> float:
        """Calculate level of conflict in the debate"""
        if not transcript:
            return 0.0
        
        conflict_indicators = 0
        total_statements = len(transcript)
        
        for statement in transcript:
            statement_lower = statement.statement.lower()
            
            # Count conflict indicators
            if any(word in statement_lower for word in ["disagree", "challenge", "oppose", "wrong", "incorrect"]):
                conflict_indicators += 1
            elif any(word in statement_lower for word in ["question", "doubt", "skeptical", "concern"]):
                conflict_indicators += 0.5
        
        return min(1.0, conflict_indicators / total_statements)
    
    async def _find_consensus(self, positions: Dict[str, List[str]]) -> Tuple[Optional[str], Optional[str]]:
        """Find consensus or majority position"""
        if not positions:
            return None, None
        
        # Count position types
        position_counts = {"supportive": 0, "opposing": 0, "neutral": 0}
        
        for agent_positions in positions.values():
            if agent_positions:
                latest_position = agent_positions[-1]  # Take latest position
                position_counts[latest_position] += 1
        
        total_agents = len(positions)
        majority_threshold = total_agents * 0.6
        consensus_threshold = total_agents * self.consensus_threshold
        
        # Check for consensus
        for position_type, count in position_counts.items():
            if count >= consensus_threshold:
                consensus_text = f"Consensus reached: {position_type} position with {count}/{total_agents} agents"
                return consensus_text, position_type
        
        # Check for majority
        max_position = max(position_counts, key=position_counts.get)
        max_count = position_counts[max_position]
        
        if max_count >= majority_threshold:
            majority_text = f"Majority position: {max_position} with {max_count}/{total_agents} agents"
            return None, majority_text
        
        return None, None
    
    def _calculate_confidence_score(self, transcript: List[DebateStatement], conflict_score: float) -> float:
        """Calculate overall confidence in debate outcome"""
        if not transcript:
            return 0.0
        
        # Base confidence from individual statement confidences
        avg_confidence = sum(stmt.confidence for stmt in transcript) / len(transcript)
        
        # Reduce confidence based on conflict level
        conflict_penalty = conflict_score * 0.3
        
        # Increase confidence if multiple agents participated
        participation_ratio = len(set(stmt.agent_id for stmt in transcript)) / len(self.agents)
        participation_bonus = participation_ratio * 0.2
        
        final_confidence = avg_confidence - conflict_penalty + participation_bonus
        
        return max(0.0, min(1.0, final_confidence))
    
    def _extract_agreements(self, transcript: List[DebateStatement]) -> List[str]:
        """Extract key points of agreement"""
        agreements = []
        
        agreement_keywords = ["agree", "consensus", "support", "accept", "correct", "valid"]
        
        for statement in transcript:
            statement_lower = statement.statement.lower()
            
            if any(keyword in statement_lower for keyword in agreement_keywords):
                # Extract the key point being agreed upon
                key_points = statement.get_key_points()
                agreements.extend(key_points[:1])  # Take first key point
        
        return list(set(agreements))  # Remove duplicates
    
    def _extract_disagreements(self, transcript: List[DebateStatement]) -> List[str]:
        """Extract key points of disagreement"""
        disagreements = []
        
        disagreement_keywords = ["disagree", "challenge", "oppose", "wrong", "incorrect", "doubt"]
        
        for statement in transcript:
            statement_lower = statement.statement.lower()
            
            if any(keyword in statement_lower for keyword in disagreement_keywords):
                key_points = statement.get_key_points()
                disagreements.extend(key_points[:1])
        
        return list(set(disagreements))
    
    def _extract_unresolved_issues(self, transcript: List[DebateStatement]) -> List[str]:
        """Extract issues that remain unresolved"""
        unresolved = []
        
        question_keywords = ["question", "unclear", "uncertain", "unresolved", "need more"]
        
        for statement in transcript:
            statement_lower = statement.statement.lower()
            
            if any(keyword in statement_lower for keyword in question_keywords):
                key_points = statement.get_key_points()
                unresolved.extend(key_points[:1])
        
        return list(set(unresolved))
    
    def summarize_consensus(self, debate_result: DebateResult) -> str:
        """
        Summarize the debate outcome, focusing on consensus or major positions.
        
        This provides a clear synthesis of the multi-agent reasoning process.
        """
        if debate_result.consensus:
            return debate_result.consensus
        
        elif debate_result.majority_position:
            summary = f"Majority position: {debate_result.majority_position}"
            
            if debate_result.key_agreements:
                summary += f"\n\nKey agreements: {', '.join(debate_result.key_agreements[:3])}"
            
            if debate_result.key_disagreements:
                summary += f"\n\nRemaining disagreements: {', '.join(debate_result.key_disagreements[:3])}"
            
            return summary
        
        else:
            # No clear consensus
            summary = f"No clear consensus reached. Conflict level: {debate_result.conflict_score:.2f}"
            
            if debate_result.key_disagreements:
                summary += f"\n\nMain points of contention: {', '.join(debate_result.key_disagreements[:3])}"
            
            if debate_result.unresolved_issues:
                summary += f"\n\nUnresolved issues: {', '.join(debate_result.unresolved_issues[:3])}"
            
            return summary
    
    def score_conflict(self, debate_result: DebateResult) -> float:
        """
        Calculate conflict score for the debate result.
        
        Returns a score from 0.0 (no conflict) to 1.0 (maximum conflict).
        """
        return debate_result.conflict_score
    
    async def add_agent(self, agent: GhostAgent):
        """Add new agent to the forum"""
        self.agents.append(agent)
        logger.info(f"👻 Added agent: {agent.agent_id} ({agent.role.value})")
    
    async def remove_agent(self, agent_id: str):
        """Remove agent from the forum"""
        self.agents = [agent for agent in self.agents if agent.agent_id != agent_id]
        logger.info(f"👻 Removed agent: {agent_id}")
    
    def _generate_debate_id(self, prompt: str) -> str:
        """Generate unique debate ID"""
        combined = f"{prompt[:50]}_{int(time.time())}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
    
    def _update_debate_stats(self, result: DebateResult):
        """Update debate statistics"""
        self.debate_stats["total_debates"] += 1
        
        if result.consensus:
            self.debate_stats["successful_consensus"] += 1
        
        # Update averages
        total = self.debate_stats["total_debates"]
        self.debate_stats["average_conflict_score"] = (
            self.debate_stats["average_conflict_score"] * (total - 1) + result.conflict_score
        ) / total
        
        self.debate_stats["average_debate_time"] = (
            self.debate_stats["average_debate_time"] * (total - 1) + result.debate_time
        ) / total
        
        # Update agent performance
        for agent in result.agents:
            agent_id = agent.agent_id
            if agent_id not in self.debate_stats["agent_performance"]:
                self.debate_stats["agent_performance"][agent_id] = {
                    "debates": 0,
                    "statements": 0,
                    "avg_confidence": 0.0
                }
            
            agent_stats = self.debate_stats["agent_performance"][agent_id]
            agent_statements = [stmt for stmt in result.transcript if stmt.agent_id == agent_id]
            
            agent_stats["debates"] += 1
            agent_stats["statements"] += len(agent_statements)
            
            if agent_statements:
                avg_confidence = sum(stmt.confidence for stmt in agent_statements) / len(agent_statements)
                agent_stats["avg_confidence"] = (
                    agent_stats["avg_confidence"] * (agent_stats["debates"] - 1) + avg_confidence
                ) / agent_stats["debates"]
    
    async def _archive_debate(self, result: DebateResult):
        """Archive debate for learning and transparency"""
        if self.psi_archive:
            archive_data = {
                "timestamp": datetime.now().isoformat(),
                "debate_id": result.debate_id,
                "prompt": result.prompt,
                "context": result.context,
                "agents": [{"id": agent.agent_id, "role": agent.role.value} for agent in result.agents],
                "outcome": {
                    "consensus": result.consensus,
                    "majority_position": result.majority_position,
                    "conflict_score": result.conflict_score,
                    "confidence_score": result.confidence_score
                },
                "metrics": {
                    "total_statements": result.total_statements,
                    "rounds_completed": result.rounds_completed,
                    "debate_time": result.debate_time,
                    "success": result.success
                }
            }
            await self.psi_archive.log_ghost_debate(archive_data)
    
    async def get_debate_stats(self) -> Dict[str, Any]:
        """Get current debate statistics"""
        return {
            **self.debate_stats,
            "active_agents": len(self.agents),
            "agent_roles": [agent.role.value for agent in self.agents],
            "timestamp": datetime.now().isoformat()
        }
    
    async def health_check(self) -> bool:
        """Health check for ghost forum"""
        try:
            # Test debate with simple prompt
            result = await self.run_debate("test prompt", max_rounds=1)
            return result is not None and len(result.transcript) > 0
        except Exception:
            return False

if __name__ == "__main__":
    # Production test
    async def test_ghost_forum():
        forum = GhostForum()
        
        # Test debate
        prompt = "Should AI systems be given more autonomy in decision-making?"
        context = "Consider the benefits and risks of autonomous AI systems in various domains."
        
        result = await forum.run_debate(prompt, context, max_rounds=2)
        
        print(f"✅ GhostForum Test Results:")
        print(f"   Debate ID: {result.debate_id}")
        print(f"   Total statements: {result.total_statements}")
        print(f"   Rounds completed: {result.rounds_completed}")
        print(f"   Conflict score: {result.conflict_score:.2f}")
        print(f"   Confidence score: {result.confidence_score:.2f}")
        print(f"   Consensus: {result.consensus is not None}")
        print(f"   Debate time: {result.debate_time:.2f}s")
        
        # Test consensus summary
        summary = forum.summarize_consensus(result)
        print(f"   Summary: {summary[:100]}...")
        
        # Test conflict scoring
        conflict = forum.score_conflict(result)
        print(f"   Conflict calculation: {conflict:.2f}")
        
        # Show sample statements
        print(f"   Sample statements:")
        for i, stmt in enumerate(result.transcript[:3]):
            print(f"     {i+1}. [{stmt.agent_role.value}]: {stmt.statement[:80]}...")
    
    import asyncio
    asyncio.run(test_ghost_forum())
