"""
Ψ-Archive: Complete Transparency and Learning System for Prajna
==============================================================

Production implementation of Prajna's comprehensive logging and learning infrastructure.
This module creates complete transparency by archiving every metacognitive operation,
enables continuous learning from past experiences, and provides full audit trails
for all conscious reasoning processes.

This is where Prajna gains perfect memory and transparency - the ability to learn
from every thought and provide complete accountability for all cognitive operations.
"""

import asyncio
import logging
import time
import json
import gzip
from typing import Dict, List, Any, Optional, Set, Tuple, Union
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import hashlib
import pickle
from collections import defaultdict, deque
import sqlite3
import threading

logger = logging.getLogger("prajna.psi_archive")

class ArchiveType(Enum):
    """Types of operations that can be archived"""
    REFLECTION = "reflection"
    GOAL_FORMULATION = "goal_formulation"
    PLAN_CREATION = "plan_creation"
    CONCEPT_SYNTHESIS = "concept_synthesis"
    WORLD_SIMULATION = "world_simulation"
    GHOST_DEBATE = "ghost_debate"
    REASONING_PATH = "reasoning_path"
    METACOGNITIVE_SESSION = "metacognitive_session"
    CONSCIOUSNESS_EVENT = "consciousness_event"
    LEARNING_UPDATE = "learning_update"

class CompressionLevel(Enum):
    """Compression levels for archived data"""
    NONE = 0
    LOW = 3
    MEDIUM = 6
    HIGH = 9

@dataclass
class ArchiveRecord:
    """Individual record in the Ψ-archive"""
    record_id: str
    archive_type: ArchiveType
    timestamp: datetime
    data: Dict[str, Any]
    
    # Metadata
    session_id: str
    user_query: str = ""
    confidence: float = 0.0
    processing_time: float = 0.0
    
    # Relationships
    parent_records: List[str] = field(default_factory=list)
    child_records: List[str] = field(default_factory=list)
    related_records: List[str] = field(default_factory=list)
    
    # Archive management
    compression_level: CompressionLevel = CompressionLevel.MEDIUM
    retention_priority: float = 1.0  # Higher values retained longer
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    
    def update_access(self):
        """Update access statistics"""
        self.access_count += 1
        self.last_accessed = datetime.now()

@dataclass
class ArchiveQuery:
    """Query for searching the Ψ-archive"""
    archive_types: List[ArchiveType] = field(default_factory=list)
    date_range: Tuple[Optional[datetime], Optional[datetime]] = (None, None)
    session_id: Optional[str] = None
    confidence_range: Tuple[float, float] = (0.0, 1.0)
    contains_text: Optional[str] = None
    min_processing_time: Optional[float] = None
    max_processing_time: Optional[float] = None
    limit: int = 100
    sort_by: str = "timestamp"  # timestamp, confidence, processing_time, access_count
    sort_order: str = "desc"    # asc, desc

@dataclass
class ArchiveStats:
    """Statistics about the Ψ-archive"""
    total_records: int
    records_by_type: Dict[str, int]
    oldest_record: Optional[datetime]
    newest_record: Optional[datetime]
    total_size_bytes: int
    compression_ratio: float
    average_confidence: float
    most_accessed_types: List[Tuple[str, int]]
    learning_insights: List[str]

@dataclass
class LearningPattern:
    """Pattern identified through archive analysis"""
    pattern_id: str
    pattern_type: str  # "performance_improvement", "common_error", "successful_strategy"
    description: str
    evidence: List[str]  # Record IDs supporting this pattern
    confidence: float
    discovered_at: datetime
    applications: int = 0  # How many times this pattern has been applied

class PsiArchive:
    """
    Production transparency and learning system for complete metacognitive accountability.
    
    This is where Prajna gains perfect memory and learns from every cognitive operation
    to continuously improve its consciousness capabilities.
    """
    
    def __init__(self, archive_path: str = "prajna_psi_archive", enable_compression: bool = True,
                 enable_learning: bool = True, max_memory_cache: int = 10000):
        self.archive_path = Path(archive_path)
        self.enable_compression = enable_compression
        self.enable_learning = enable_learning
        self.max_memory_cache = max_memory_cache
        
        # Create archive directory structure
        self._initialize_archive_structure()
        
        # Database connection for metadata and queries
        self.db_path = self.archive_path / "metadata.db"
        self._initialize_database()
        
        # In-memory cache for frequently accessed records
        self.memory_cache: Dict[str, ArchiveRecord] = {}
        self.cache_access_order = deque(maxlen=max_memory_cache)
        
        # Learning system
        self.learned_patterns: Dict[str, LearningPattern] = {}
        self.learning_queue = deque()
        
        # Performance tracking
        self.archive_stats = {
            "total_archived": 0,
            "successful_retrievals": 0,
            "cache_hits": 0,
            "compression_savings": 0,
            "learning_patterns_discovered": 0,
            "total_archive_time": 0.0
        }
        
        # Background learning task
        self.learning_task = None
        if enable_learning:
            self.learning_task = asyncio.create_task(self._continuous_learning_loop())
        
        logger.info(f"📚 ΨArchive initialized at {self.archive_path}")
    
    def _initialize_archive_structure(self):
        """Create archive directory structure"""
        self.archive_path.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories by type and date
        for archive_type in ArchiveType:
            (self.archive_path / archive_type.value).mkdir(exist_ok=True)
        
        # Create learning directory
        (self.archive_path / "learning").mkdir(exist_ok=True)
        (self.archive_path / "patterns").mkdir(exist_ok=True)
        (self.archive_path / "insights").mkdir(exist_ok=True)
    
    def _initialize_database(self):
        """Initialize SQLite database for metadata"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS archive_records (
                    record_id TEXT PRIMARY KEY,
                    archive_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    session_id TEXT,
                    user_query TEXT,
                    confidence REAL,
                    processing_time REAL,
                    retention_priority REAL,
                    access_count INTEGER DEFAULT 0,
                    last_accessed TEXT,
                    file_path TEXT,
                    compressed BOOLEAN DEFAULT FALSE,
                    data_hash TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS archive_relationships (
                    record_id TEXT,
                    related_id TEXT,
                    relationship_type TEXT,
                    PRIMARY KEY (record_id, related_id, relationship_type)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS learning_patterns (
                    pattern_id TEXT PRIMARY KEY,
                    pattern_type TEXT,
                    description TEXT,
                    confidence REAL,
                    discovered_at TEXT,
                    applications INTEGER DEFAULT 0,
                    evidence TEXT
                )
            """)
            
            # Create indexes for performance
            conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON archive_records(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_archive_type ON archive_records(archive_type)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_session_id ON archive_records(session_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_confidence ON archive_records(confidence)")
            
            conn.commit()
    
    async def log_reflection(self, reflection_data: Dict[str, Any]) -> str:
        """Archive self-reflection analysis"""
        return await self._archive_record(
            ArchiveType.REFLECTION,
            reflection_data,
            session_id=reflection_data.get("session_id", ""),
            user_query=reflection_data.get("original_query", ""),
            confidence=reflection_data.get("reflection_confidence", 0.0),
            processing_time=reflection_data.get("processing_time", 0.0)
        )
    
    async def log_goal_formulation(self, goal_data: Dict[str, Any]) -> str:
        """Archive goal formulation process"""
        return await self._archive_record(
            ArchiveType.GOAL_FORMULATION,
            goal_data,
            session_id=goal_data.get("session_id", ""),
            user_query=goal_data.get("original_query", ""),
            confidence=goal_data.get("goal", {}).get("confidence", 0.0),
            processing_time=goal_data.get("processing_time", 0.0)
        )
    
    async def log_plan_creation(self, plan_data: Dict[str, Any]) -> str:
        """Archive plan creation process"""
        return await self._archive_record(
            ArchiveType.PLAN_CREATION,
            plan_data,
            session_id=plan_data.get("session_id", ""),
            confidence=plan_data.get("plan", {}).get("confidence", 0.0),
            processing_time=plan_data.get("processing_time", 0.0)
        )
    
    async def log_concept_synthesis(self, synthesis_data: Dict[str, Any]) -> str:
        """Archive concept synthesis operation"""
        return await self._archive_record(
            ArchiveType.CONCEPT_SYNTHESIS,
            synthesis_data,
            session_id=synthesis_data.get("session_id", ""),
            confidence=synthesis_data.get("overall_coherence", 0.0),
            processing_time=synthesis_data.get("synthesis_time", 0.0)
        )
    
    async def log_world_simulation(self, simulation_data: Dict[str, Any]) -> str:
        """Archive world model simulation"""
        return await self._archive_record(
            ArchiveType.WORLD_SIMULATION,
            simulation_data,
            session_id=simulation_data.get("session_id", ""),
            confidence=simulation_data.get("consistency_score", 0.0),
            processing_time=simulation_data.get("simulation_time", 0.0)
        )
    
    async def log_ghost_debate(self, debate_data: Dict[str, Any]) -> str:
        """Archive ghost forum debate"""
        return await self._archive_record(
            ArchiveType.GHOST_DEBATE,
            debate_data,
            session_id=debate_data.get("session_id", ""),
            user_query=debate_data.get("prompt", ""),
            confidence=debate_data.get("outcome", {}).get("confidence_score", 0.0),
            processing_time=debate_data.get("metrics", {}).get("debate_time", 0.0)
        )
    
    async def log_reasoning_path(self, reasoning_data: Dict[str, Any]) -> str:
        """Archive reasoning path/trajectory"""
        return await self._archive_record(
            ArchiveType.REASONING_PATH,
            reasoning_data,
            session_id=reasoning_data.get("session_id", ""),
            confidence=reasoning_data.get("confidence", 0.0),
            processing_time=reasoning_data.get("reasoning_time", 0.0)
        )
    
    async def log_metacognitive_session(self, session_data: Dict[str, Any]) -> str:
        """Archive complete metacognitive session"""
        return await self._archive_record(
            ArchiveType.METACOGNITIVE_SESSION,
            session_data,
            session_id=session_data.get("session_id", ""),
            user_query=session_data.get("original_query", ""),
            confidence=session_data.get("final_confidence", 0.0),
            processing_time=session_data.get("total_processing_time", 0.0)
        )
    
    async def log_consciousness_event(self, consciousness_data: Dict[str, Any]) -> str:
        """Archive consciousness-level events"""
        return await self._archive_record(
            ArchiveType.CONSCIOUSNESS_EVENT,
            consciousness_data,
            session_id=consciousness_data.get("session_id", ""),
            confidence=consciousness_data.get("consciousness_level", 0.0),
            processing_time=consciousness_data.get("processing_time", 0.0)
        )
    
    async def log_learning_update(self, learning_data: Dict[str, Any]) -> str:
        """Archive learning insights and improvements"""
        return await self._archive_record(
            ArchiveType.LEARNING_UPDATE,
            learning_data,
            session_id=learning_data.get("session_id", ""),
            confidence=learning_data.get("confidence", 0.0)
        )
    
    async def _archive_record(self, archive_type: ArchiveType, data: Dict[str, Any],
                             session_id: str = "", user_query: str = "", 
                             confidence: float = 0.0, processing_time: float = 0.0) -> str:
        """Core archiving function"""
        start_time = time.time()
        
        try:
            # Generate record ID
            record_id = self._generate_record_id(archive_type, data)
            
            # Create archive record
            record = ArchiveRecord(
                record_id=record_id,
                archive_type=archive_type,
                timestamp=datetime.now(),
                data=data,
                session_id=session_id,
                user_query=user_query,
                confidence=confidence,
                processing_time=processing_time
            )
            
            # Save to persistent storage
            file_path = await self._save_record_to_file(record)
            
            # Save metadata to database
            await self._save_record_metadata(record, file_path)
            
            # Add to memory cache
            self._add_to_cache(record)
            
            # Queue for learning analysis
            if self.enable_learning:
                self.learning_queue.append(record_id)
            
            # Update statistics
            self.archive_stats["total_archived"] += 1
            self.archive_stats["total_archive_time"] += time.time() - start_time
            
            logger.debug(f"📚 Archived {archive_type.value}: {record_id}")
            
            return record_id
            
        except Exception as e:
            logger.error(f"❌ Failed to archive {archive_type.value}: {e}")
            return ""
    
    async def _save_record_to_file(self, record: ArchiveRecord) -> str:
        """Save record data to file"""
        # Create date-based subdirectory
        date_str = record.timestamp.strftime("%Y/%m/%d")
        record_dir = self.archive_path / record.archive_type.value / date_str
        record_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        filename = f"{record.record_id}.json"
        if self.enable_compression:
            filename += ".gz"
        
        file_path = record_dir / filename
        
        # Serialize record data
        record_data = {
            "record_id": record.record_id,
            "archive_type": record.archive_type.value,
            "timestamp": record.timestamp.isoformat(),
            "data": record.data,
            "session_id": record.session_id,
            "user_query": record.user_query,
            "confidence": record.confidence,
            "processing_time": record.processing_time
        }
        
        # Save with optional compression
        if self.enable_compression:
            with gzip.open(file_path, 'wt', encoding='utf-8') as f:
                json.dump(record_data, f, indent=2)
        else:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(record_data, f, indent=2)
        
        return str(file_path.relative_to(self.archive_path))
    
    async def _save_record_metadata(self, record: ArchiveRecord, file_path: str):
        """Save record metadata to database"""
        data_hash = hashlib.sha256(json.dumps(record.data, sort_keys=True).encode()).hexdigest()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO archive_records 
                (record_id, archive_type, timestamp, session_id, user_query, 
                 confidence, processing_time, retention_priority, file_path, 
                 compressed, data_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.record_id,
                record.archive_type.value,
                record.timestamp.isoformat(),
                record.session_id,
                record.user_query,
                record.confidence,
                record.processing_time,
                record.retention_priority,
                file_path,
                self.enable_compression,
                data_hash
            ))
            conn.commit()
    
    def _add_to_cache(self, record: ArchiveRecord):
        """Add record to memory cache"""
        # Remove oldest if cache is full
        if len(self.memory_cache) >= self.max_memory_cache:
            oldest_id = self.cache_access_order.popleft()
            self.memory_cache.pop(oldest_id, None)
        
        # Add new record
        self.memory_cache[record.record_id] = record
        self.cache_access_order.append(record.record_id)
    
    async def query_archive(self, query: ArchiveQuery) -> List[ArchiveRecord]:
        """Query the archive for records matching criteria"""
        try:
            # Build SQL query
            sql_conditions = []
            params = []
            
            if query.archive_types:
                type_placeholders = ",".join(["?" for _ in query.archive_types])
                sql_conditions.append(f"archive_type IN ({type_placeholders})")
                params.extend([t.value for t in query.archive_types])
            
            if query.date_range[0]:
                sql_conditions.append("timestamp >= ?")
                params.append(query.date_range[0].isoformat())
            
            if query.date_range[1]:
                sql_conditions.append("timestamp <= ?")
                params.append(query.date_range[1].isoformat())
            
            if query.session_id:
                sql_conditions.append("session_id = ?")
                params.append(query.session_id)
            
            if query.confidence_range != (0.0, 1.0):
                sql_conditions.append("confidence >= ? AND confidence <= ?")
                params.extend([query.confidence_range[0], query.confidence_range[1]])
            
            if query.contains_text:
                sql_conditions.append("user_query LIKE ?")
                params.append(f"%{query.contains_text}%")
            
            if query.min_processing_time is not None:
                sql_conditions.append("processing_time >= ?")
                params.append(query.min_processing_time)
            
            if query.max_processing_time is not None:
                sql_conditions.append("processing_time <= ?")
                params.append(query.max_processing_time)
            
            # Build complete query
            where_clause = " AND ".join(sql_conditions) if sql_conditions else "1=1"
            order_clause = f"ORDER BY {query.sort_by} {query.sort_order.upper()}"
            limit_clause = f"LIMIT {query.limit}"
            
            sql = f"""
                SELECT record_id, file_path FROM archive_records 
                WHERE {where_clause} {order_clause} {limit_clause}
            """
            
            # Execute query
            records = []
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(sql, params)
                for record_id, file_path in cursor.fetchall():
                    record = await self._load_record(record_id, file_path)
                    if record:
                        records.append(record)
            
            self.archive_stats["successful_retrievals"] += len(records)
            
            return records
            
        except Exception as e:
            logger.error(f"❌ Archive query failed: {e}")
            return []
    
    async def _load_record(self, record_id: str, file_path: str) -> Optional[ArchiveRecord]:
        """Load record from file or cache"""
        # Check cache first
        if record_id in self.memory_cache:
            record = self.memory_cache[record_id]
            record.update_access()
            self.archive_stats["cache_hits"] += 1
            return record
        
        try:
            # Load from file
            full_path = self.archive_path / file_path
            
            if file_path.endswith('.gz'):
                with gzip.open(full_path, 'rt', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                with open(full_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            
            # Reconstruct record
            record = ArchiveRecord(
                record_id=data["record_id"],
                archive_type=ArchiveType(data["archive_type"]),
                timestamp=datetime.fromisoformat(data["timestamp"]),
                data=data["data"],
                session_id=data.get("session_id", ""),
                user_query=data.get("user_query", ""),
                confidence=data.get("confidence", 0.0),
                processing_time=data.get("processing_time", 0.0)
            )
            
            # Add to cache
            self._add_to_cache(record)
            
            return record
            
        except Exception as e:
            logger.error(f"❌ Failed to load record {record_id}: {e}")
            return None
    
    async def get_metacognitive_history(self, filters: Dict[str, Any] = None) -> List[ArchiveRecord]:
        """Get metacognitive history with optional filters"""
        query = ArchiveQuery()
        
        if filters:
            if "archive_types" in filters:
                query.archive_types = [ArchiveType(t) for t in filters["archive_types"]]
            
            if "timeframe" in filters:
                timeframe = filters["timeframe"]
                if timeframe == "last_hour":
                    query.date_range = (datetime.now() - timedelta(hours=1), None)
                elif timeframe == "last_day":
                    query.date_range = (datetime.now() - timedelta(days=1), None)
                elif timeframe == "last_week":
                    query.date_range = (datetime.now() - timedelta(weeks=1), None)
                elif timeframe == "last_month":
                    query.date_range = (datetime.now() - timedelta(days=30), None)
            
            if "session_id" in filters:
                query.session_id = filters["session_id"]
            
            if "min_confidence" in filters:
                query.confidence_range = (filters["min_confidence"], 1.0)
            
            if "limit" in filters:
                query.limit = filters["limit"]
        
        return await self.query_archive(query)
    
    async def analyze_performance_patterns(self) -> List[LearningPattern]:
        """Analyze archived data to identify performance patterns"""
        patterns = []
        
        try:
            # Get recent records for analysis
            recent_query = ArchiveQuery(
                date_range=(datetime.now() - timedelta(days=7), None),
                limit=1000,
                sort_by="timestamp"
            )
            recent_records = await self.query_archive(recent_query)
            
            if not recent_records:
                return patterns
            
            # Pattern 1: Performance improvement over time
            improvement_pattern = await self._analyze_performance_improvement(recent_records)
            if improvement_pattern:
                patterns.append(improvement_pattern)
            
            # Pattern 2: Common error types
            error_pattern = await self._analyze_common_errors(recent_records)
            if error_pattern:
                patterns.append(error_pattern)
            
            # Pattern 3: Successful reasoning strategies
            strategy_pattern = await self._analyze_successful_strategies(recent_records)
            if strategy_pattern:
                patterns.append(strategy_pattern)
            
            # Pattern 4: Metacognitive effectiveness
            metacognitive_pattern = await self._analyze_metacognitive_effectiveness(recent_records)
            if metacognitive_pattern:
                patterns.append(metacognitive_pattern)
            
            # Save patterns to database
            for pattern in patterns:
                await self._save_learning_pattern(pattern)
            
            return patterns
            
        except Exception as e:
            logger.error(f"❌ Pattern analysis failed: {e}")
            return patterns
    
    async def _analyze_performance_improvement(self, records: List[ArchiveRecord]) -> Optional[LearningPattern]:
        """Analyze if performance is improving over time"""
        if len(records) < 10:
            return None
        
        # Group records by day and calculate average confidence
        daily_confidence = defaultdict(list)
        
        for record in records:
            day = record.timestamp.strftime("%Y-%m-%d")
            daily_confidence[day].append(record.confidence)
        
        # Calculate daily averages
        daily_averages = {}
        for day, confidences in daily_confidence.items():
            daily_averages[day] = sum(confidences) / len(confidences)
        
        # Check for improvement trend
        sorted_days = sorted(daily_averages.keys())
        if len(sorted_days) < 3:
            return None
        
        early_avg = sum(daily_averages[day] for day in sorted_days[:len(sorted_days)//2]) / (len(sorted_days)//2)
        late_avg = sum(daily_averages[day] for day in sorted_days[len(sorted_days)//2:]) / (len(sorted_days) - len(sorted_days)//2)
        
        improvement = late_avg - early_avg
        
        if improvement > 0.1:  # Significant improvement
            return LearningPattern(
                pattern_id=f"improvement_{int(time.time())}",
                pattern_type="performance_improvement",
                description=f"Performance improved by {improvement:.2f} over recent period",
                evidence=[r.record_id for r in records],
                confidence=min(1.0, improvement * 2),
                discovered_at=datetime.now()
            )
        
        return None
    
    async def _analyze_common_errors(self, records: List[ArchiveRecord]) -> Optional[LearningPattern]:
        """Analyze common error patterns"""
        error_records = []
        
        for record in records:
            if record.archive_type == ArchiveType.REFLECTION:
                data = record.data
                if "issues" in data and data["issues"]:
                    error_records.append(record)
        
        if len(error_records) < 5:
            return None
        
        # Count error types
        error_types = defaultdict(int)
        for record in error_records:
            for issue in record.data.get("issues", []):
                if isinstance(issue, dict) and "type" in issue:
                    error_types[issue["type"]] += 1
        
        if error_types:
            most_common_error = max(error_types, key=error_types.get)
            
            return LearningPattern(
                pattern_id=f"error_{most_common_error}_{int(time.time())}",
                pattern_type="common_error",
                description=f"Common error type: {most_common_error} ({error_types[most_common_error]} occurrences)",
                evidence=[r.record_id for r in error_records],
                confidence=min(1.0, error_types[most_common_error] / len(error_records)),
                discovered_at=datetime.now()
            )
        
        return None
    
    async def _analyze_successful_strategies(self, records: List[ArchiveRecord]) -> Optional[LearningPattern]:
        """Analyze successful reasoning strategies"""
        high_confidence_records = [r for r in records if r.confidence > 0.8]
        
        if len(high_confidence_records) < 5:
            return None
        
        # Analyze reasoning modes that work well
        successful_modes = defaultdict(int)
        
        for record in high_confidence_records:
            if record.archive_type == ArchiveType.REASONING_PATH:
                mode = record.data.get("reasoning_mode", "unknown")
                successful_modes[mode] += 1
        
        if successful_modes:
            best_mode = max(successful_modes, key=successful_modes.get)
            
            return LearningPattern(
                pattern_id=f"strategy_{best_mode}_{int(time.time())}",
                pattern_type="successful_strategy",
                description=f"Most successful reasoning mode: {best_mode} ({successful_modes[best_mode]} successes)",
                evidence=[r.record_id for r in high_confidence_records],
                confidence=min(1.0, successful_modes[best_mode] / len(high_confidence_records)),
                discovered_at=datetime.now()
            )
        
        return None
    
    async def _analyze_metacognitive_effectiveness(self, records: List[ArchiveRecord]) -> Optional[LearningPattern]:
        """Analyze effectiveness of metacognitive processes"""
        metacognitive_records = [r for r in records if r.archive_type in [
            ArchiveType.REFLECTION, ArchiveType.GHOST_DEBATE, ArchiveType.WORLD_SIMULATION
        ]]
        
        if len(metacognitive_records) < 10:
            return None
        
        # Compare confidence before and after metacognitive processing
        sessions_with_metacognition = defaultdict(list)
        
        for record in metacognitive_records:
            if record.session_id:
                sessions_with_metacognition[record.session_id].append(record)
        
        improvement_count = 0
        total_sessions = len(sessions_with_metacognition)
        
        for session_records in sessions_with_metacognition.values():
            if len(session_records) >= 2:
                sorted_records = sorted(session_records, key=lambda r: r.timestamp)
                initial_confidence = sorted_records[0].confidence
                final_confidence = sorted_records[-1].confidence
                
                if final_confidence > initial_confidence + 0.1:
                    improvement_count += 1
        
        if improvement_count > total_sessions * 0.6:  # 60% of sessions improved
            return LearningPattern(
                pattern_id=f"metacognitive_effectiveness_{int(time.time())}",
                pattern_type="metacognitive_effectiveness",
                description=f"Metacognitive processing improves confidence in {improvement_count}/{total_sessions} sessions",
                evidence=[r.record_id for records in sessions_with_metacognition.values() for r in records],
                confidence=improvement_count / total_sessions,
                discovered_at=datetime.now()
            )
        
        return None
    
    async def _save_learning_pattern(self, pattern: LearningPattern):
        """Save learning pattern to database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO learning_patterns
                (pattern_id, pattern_type, description, confidence, discovered_at, applications, evidence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                pattern.pattern_id,
                pattern.pattern_type,
                pattern.description,
                pattern.confidence,
                pattern.discovered_at.isoformat(),
                pattern.applications,
                json.dumps(pattern.evidence)
            ))
            conn.commit()
        
        self.learned_patterns[pattern.pattern_id] = pattern
        self.archive_stats["learning_patterns_discovered"] += 1
    
    async def _continuous_learning_loop(self):
        """Background task for continuous learning from archived data"""
        while True:
            try:
                # Wait for learning queue to have items
                if not self.learning_queue:
                    await asyncio.sleep(60)  # Check every minute
                    continue
                
                # Analyze patterns every hour or when queue gets large
                if len(self.learning_queue) > 100:
                    await self.analyze_performance_patterns()
                    self.learning_queue.clear()
                
                await asyncio.sleep(3600)  # Analyze hourly
                
            except Exception as e:
                logger.error(f"❌ Continuous learning error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    async def get_archive_stats(self) -> ArchiveStats:
        """Get comprehensive archive statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Total records
                total_records = conn.execute("SELECT COUNT(*) FROM archive_records").fetchone()[0]
                
                # Records by type
                type_counts = {}
                cursor = conn.execute("SELECT archive_type, COUNT(*) FROM archive_records GROUP BY archive_type")
                for archive_type, count in cursor.fetchall():
                    type_counts[archive_type] = count
                
                # Date range
                oldest_record = None
                newest_record = None
                cursor = conn.execute("SELECT MIN(timestamp), MAX(timestamp) FROM archive_records")
                min_ts, max_ts = cursor.fetchone()
                if min_ts:
                    oldest_record = datetime.fromisoformat(min_ts)
                if max_ts:
                    newest_record = datetime.fromisoformat(max_ts)
                
                # Average confidence
                avg_confidence = conn.execute("SELECT AVG(confidence) FROM archive_records").fetchone()[0] or 0.0
                
                # Most accessed types
                cursor = conn.execute("""
                    SELECT archive_type, SUM(access_count) 
                    FROM archive_records 
                    GROUP BY archive_type 
                    ORDER BY SUM(access_count) DESC 
                    LIMIT 5
                """)
                most_accessed = cursor.fetchall()
            
            # Calculate total size
            total_size = sum(
                sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
                for path in self.archive_path.iterdir()
                if path.is_dir()
            )
            
            # Compression ratio estimate
            compression_ratio = 0.7 if self.enable_compression else 1.0
            
            # Learning insights
            learning_insights = [
                f"Discovered {len(self.learned_patterns)} learning patterns",
                f"Cache hit rate: {self.archive_stats['cache_hits'] / max(1, self.archive_stats['total_archived']):.1%}",
                f"Average archival time: {self.archive_stats['total_archive_time'] / max(1, self.archive_stats['total_archived']):.3f}s"
            ]
            
            return ArchiveStats(
                total_records=total_records,
                records_by_type=type_counts,
                oldest_record=oldest_record,
                newest_record=newest_record,
                total_size_bytes=total_size,
                compression_ratio=compression_ratio,
                average_confidence=avg_confidence,
                most_accessed_types=most_accessed,
                learning_insights=learning_insights
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to get archive stats: {e}")
            return ArchiveStats(
                total_records=0,
                records_by_type={},
                oldest_record=None,
                newest_record=None,
                total_size_bytes=0,
                compression_ratio=1.0,
                average_confidence=0.0,
                most_accessed_types=[],
                learning_insights=["Statistics unavailable due to error"]
            )
    
    def _generate_record_id(self, archive_type: ArchiveType, data: Dict[str, Any]) -> str:
        """Generate unique record ID"""
        timestamp = datetime.now().isoformat()
        data_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]
        return f"{archive_type.value}_{timestamp}_{data_hash}"
    
    async def cleanup_old_records(self, days_to_keep: int = 365):
        """Clean up old records based on retention policy"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Get old records
                cursor = conn.execute("""
                    SELECT record_id, file_path FROM archive_records 
                    WHERE timestamp < ? AND retention_priority < 0.5
                """, (cutoff_date.isoformat(),))
                
                old_records = cursor.fetchall()
                
                # Delete files and database records
                deleted_count = 0
                for record_id, file_path in old_records:
                    try:
                        full_path = self.archive_path / file_path
                        if full_path.exists():
                            full_path.unlink()
                        
                        conn.execute("DELETE FROM archive_records WHERE record_id = ?", (record_id,))
                        deleted_count += 1
                        
                    except Exception as e:
                        logger.warning(f"Failed to delete record {record_id}: {e}")
                
                conn.commit()
                
                logger.info(f"📚 Cleaned up {deleted_count} old archive records")
                
        except Exception as e:
            logger.error(f"❌ Archive cleanup failed: {e}")
    
    async def export_insights(self, output_path: str):
        """Export learning insights and patterns"""
        try:
            insights = {
                "timestamp": datetime.now().isoformat(),
                "archive_stats": asdict(await self.get_archive_stats()),
                "learning_patterns": [asdict(pattern) for pattern in self.learned_patterns.values()],
                "performance_stats": self.archive_stats.copy()
            }
            
            with open(output_path, 'w') as f:
                json.dump(insights, f, indent=2, default=str)
            
            logger.info(f"📚 Exported insights to {output_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to export insights: {e}")
    
    async def health_check(self) -> bool:
        """Health check for Ψ-archive"""
        try:
            # Test database connection
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("SELECT 1").fetchone()
            
            # Test archiving
            test_data = {"test": "health_check", "timestamp": time.time()}
            record_id = await self.log_consciousness_event(test_data)
            
            # Test retrieval
            query = ArchiveQuery(
                archive_types=[ArchiveType.CONSCIOUSNESS_EVENT],
                limit=1
            )
            results = await self.query_archive(query)
            
            return record_id != "" and len(results) > 0
            
        except Exception:
            return False
    
    async def shutdown(self):
        """Graceful shutdown of archive system"""
        try:
            # Cancel learning task
            if self.learning_task:
                self.learning_task.cancel()
                try:
                    await self.learning_task
                except asyncio.CancelledError:
                    pass
            
            # Process remaining learning queue
            if self.learning_queue:
                await self.analyze_performance_patterns()
            
            # Export final insights
            final_insights_path = self.archive_path / "final_insights.json"
            await self.export_insights(str(final_insights_path))
            
            logger.info("📚 ΨArchive shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Archive shutdown error: {e}")

if __name__ == "__main__":
    # Production test
    async def test_psi_archive():
        archive = PsiArchive("test_archive", enable_learning=True)
        
        # Test various archival operations
        test_reflection = {
            "session_id": "test_session_001",
            "original_query": "Test query for reflection",
            "reflection_confidence": 0.85,
            "processing_time": 1.5,
            "issues": [{"type": "minor_concern", "description": "Test issue"}]
        }
        
        reflection_id = await archive.log_reflection(test_reflection)
        print(f"✅ PsiArchive Test Results:")
        print(f"   Reflection archived: {reflection_id}")
        
        # Test goal formulation
        test_goal = {
            "session_id": "test_session_001",
            "original_query": "Test goal formulation",
            "goal": {"confidence": 0.9, "complexity": 0.6},
            "processing_time": 0.8
        }
        
        goal_id = await archive.log_goal_formulation(test_goal)
        print(f"   Goal archived: {goal_id}")
        
        # Test querying
        query = ArchiveQuery(
            archive_types=[ArchiveType.REFLECTION, ArchiveType.GOAL_FORMULATION],
            session_id="test_session_001",
            limit=10
        )
        
        results = await archive.query_archive(query)
        print(f"   Query results: {len(results)} records")
        
        # Test statistics
        stats = await archive.get_archive_stats()
        print(f"   Total records: {stats.total_records}")
        print(f"   Average confidence: {stats.average_confidence:.2f}")
        print(f"   Learning insights: {len(stats.learning_insights)}")
        
        # Test pattern analysis
        patterns = await archive.analyze_performance_patterns()
        print(f"   Learning patterns: {len(patterns)}")
        
        # Test health check
        health = await archive.health_check()
        print(f"   Health check: {health}")
        
        # Cleanup
        await archive.shutdown()
    
    import asyncio
    asyncio.run(test_psi_archive())
