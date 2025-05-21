"""
Ingest service for managing document processing jobs.

This module provides services for creating, updating, and querying ingest jobs.
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
import logging

from ..models.job import IngestJob, JobStatus, ProcessingStage, ChunkInfo
from ..utils.delta_encoder import DeltaEncoder

# Configure logging
logger = logging.getLogger(__name__)


class IngestService:
    """
    Service for managing ingest jobs

    Provides functionality to create, update, and query ingest jobs.
    Uses file-based storage for job state (can be replaced with database).
    """
    
    def __init__(self, data_dir: str = "./data/jobs"):
        """
        Initialize the ingest service
        
        Args:
            data_dir: Directory to store job data
        """
        self.data_dir = data_dir
        self.jobs: Dict[str, IngestJob] = {}
        self.delta_encoders: Dict[str, DeltaEncoder] = {}
        self.subscribers: Dict[str, Set[Any]] = {}
        self._ensure_data_dir()
        self._load_jobs()
    
    async def queue_job(self, 
                       file_url: str, 
                       track: str = None, 
                       file_sha256: Optional[str] = None,
                       file_name: Optional[str] = None,
                       file_size: Optional[int] = None,
                       metadata: Dict[str, Any] = None) -> IngestJob:
        """
        Queue a new ingest job
        
        Args:
            file_url: URL to the file to process
            track: Track to assign the document to
            file_sha256: SHA-256 hash of the file (if available)
            file_name: Name of the file (if available)
            file_size: Size of the file in bytes (if available)
            metadata: Additional metadata
            
        Returns:
            The created job
        """
        # Detect track from URL if not provided
        if not track and file_url:
            track = self._detect_track_from_url(file_url)
        
        # Extract file name from URL if not provided
        if not file_name and file_url:
            file_name = os.path.basename(file_url.split('?')[0])
        
        # Create new job
        job = IngestJob(
            file_url=file_url,
            file_name=file_name,
            file_size=file_size,
            file_sha256=file_sha256,
            track=track,
            metadata=metadata
        )
        
        # Add to jobs dictionary
        self.jobs[job.job_id] = job
        
        # Create delta encoder for job updates
        self.delta_encoders[job.job_id] = DeltaEncoder(require_ack=False)
        
        # Save job to disk
        await self._save_job(job)
        
        # Notify subscribers about new job
        await self._notify_subscribers('jobs', job.to_dict())
        
        logger.info(f"Queued new job {job.job_id} for {file_url}")
        
        return job
    
    async def get_job(self, job_id: str) -> Optional[IngestJob]:
        """
        Get a job by ID
        
        Args:
            job_id: Job ID
            
        Returns:
            The job if found, None otherwise
        """
        return self.jobs.get(job_id)
    
    async def get_jobs(self, 
                     limit: int = 100, 
                     offset: int = 0,
                     status: Optional[JobStatus] = None,
                     track: Optional[str] = None) -> List[IngestJob]:
        """
        Get jobs, optionally filtered by status and track
        
        Args:
            limit: Maximum number of jobs to return
            offset: Number of jobs to skip
            status: Filter by status
            track: Filter by track
            
        Returns:
            List of matching jobs
        """
        filtered_jobs = []
        
        for job in self.jobs.values():
            if status and job.status != status:
                continue
            
            if track and job.track != track:
                continue
            
            filtered_jobs.append(job)
        
        # Sort by created_at (newest first)
        filtered_jobs.sort(key=lambda j: j.created_at, reverse=True)
        
        # Apply pagination
        paginated_jobs = filtered_jobs[offset:offset + limit]
        
        return paginated_jobs
    
    async def update_job_status(self, 
                              job_id: str, 
                              status: JobStatus, 
                              error: Optional[str] = None) -> Optional[IngestJob]:
        """
        Update a job's status
        
        Args:
            job_id: Job ID
            status: New status
            error: Error message (if failed)
            
        Returns:
            Updated job if found, None otherwise
        """
        job = await self.get_job(job_id)
        if not job:
            return None
        
        job.update_status(status, error)
        
        # Save job to disk
        await self._save_job(job)
        
        # Notify subscribers
        await self._notify_subscribers(job_id, job.to_dict())
        
        return job
    
    async def update_job_progress(self, 
                                job_id: str, 
                                stage: ProcessingStage, 
                                progress: float) -> Optional[IngestJob]:
        """
        Update a job's processing progress
        
        Args:
            job_id: Job ID
            stage: Current processing stage
            progress: Progress percentage (0-100)
            
        Returns:
            Updated job if found, None otherwise
        """
        job = await self.get_job(job_id)
        if not job:
            return None
        
        job.update_progress(stage, progress)
        
        # Save job to disk
        await self._save_job(job)
        
        # Notify subscribers
        await self._notify_subscribers(job_id, job.to_dict())
        
        return job
    
    async def add_job_chunk(self, 
                          job_id: str, 
                          chunk: ChunkInfo) -> Optional[IngestJob]:
        """
        Add a chunk to a job
        
        Args:
            job_id: Job ID
            chunk: Chunk information
            
        Returns:
            Updated job if found, None otherwise
        """
        job = await self.get_job(job_id)
        if not job:
            return None
        
        job.add_chunk(chunk)
        
        # Save job to disk
        await self._save_job(job)
        
        # Notify subscribers about chunk count update
        # (don't send entire chunk data to avoid large payloads)
        update = {
            "job_id": job.job_id,
            "chunk_count": job.chunk_count,
            "updated_at": job.updated_at.isoformat()
        }
        await self._notify_subscribers(job_id, update)
        
        return job
    
    async def add_job_concept_id(self, 
                               job_id: str, 
                               concept_id: str) -> Optional[IngestJob]:
        """
        Add a concept ID to a job
        
        Args:
            job_id: Job ID
            concept_id: Concept ID in knowledge graph
            
        Returns:
            Updated job if found, None otherwise
        """
        job = await self.get_job(job_id)
        if not job:
            return None
        
        job.add_concept_id(concept_id)
        
        # Save job to disk
        await self._save_job(job)
        
        # Notify subscribers
        update = {
            "job_id": job.job_id,
            "concept_ids": job.concept_ids,
            "updated_at": job.updated_at.isoformat()
        }
        await self._notify_subscribers(job_id, update)
        
        return job
    
    async def subscribe(self, topic: str, subscriber: Any) -> None:
        """
        Subscribe to job updates
        
        Args:
            topic: Topic to subscribe to (job_id or 'jobs' for all jobs)
            subscriber: Subscriber object (must have send_update method)
        """
        if topic not in self.subscribers:
            self.subscribers[topic] = set()
        
        self.subscribers[topic].add(subscriber)
    
    async def unsubscribe(self, topic: str, subscriber: Any) -> None:
        """
        Unsubscribe from job updates
        
        Args:
            topic: Topic to unsubscribe from
            subscriber: Subscriber object
        """
        if topic in self.subscribers:
            self.subscribers[topic].discard(subscriber)
            
            # Remove empty subscriber sets
            if not self.subscribers[topic]:
                del self.subscribers[topic]
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about jobs
        
        Returns:
            Dictionary with job statistics
        """
        # Count jobs by status
        status_counts = {}
        for status in JobStatus:
            status_counts[status.value] = 0
        
        for job in self.jobs.values():
            status_counts[job.status.value] += 1
        
        # Count jobs by track
        track_counts = {}
        for job in self.jobs.values():
            if job.track:
                track_counts[job.track] = track_counts.get(job.track, 0) + 1
        
        # Calculate MTTR (Mean Time To Resolution)
        completed_jobs = [j for j in self.jobs.values() 
                        if j.status == JobStatus.COMPLETED and j.completed_at]
        
        mttr_seconds = 0
        if completed_jobs:
            total_seconds = sum((j.completed_at - j.created_at).total_seconds() 
                                for j in completed_jobs)
            mttr_seconds = total_seconds / len(completed_jobs)
        
        # Calculate success rate
        total_finished = len([j for j in self.jobs.values() 
                            if j.status in (JobStatus.COMPLETED, JobStatus.FAILED)])
        
        success_rate = 0
        if total_finished > 0:
            successes = len([j for j in self.jobs.values() if j.status == JobStatus.COMPLETED])
            success_rate = successes / total_finished
        
        # Get counts of chunks and concepts
        total_chunks = sum(j.chunk_count for j in self.jobs.values())
        total_concepts = sum(len(j.concept_ids) for j in self.jobs.values())
        
        # Return stats
        return {
            "total_jobs": len(self.jobs),
            "status_counts": status_counts,
            "track_counts": track_counts,
            "mttr_seconds": mttr_seconds,
            "success_rate": success_rate,
            "total_chunks": total_chunks,
            "total_concepts": total_concepts,
            "average_chunks_per_job": total_chunks / len(self.jobs) if self.jobs else 0
        }
    
    async def cleanup_old_jobs(self, days: int = 30) -> int:
        """
        Remove old completed jobs
        
        Args:
            days: Remove jobs older than this many days
            
        Returns:
            Number of jobs removed
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        job_ids_to_remove = []
        
        for job_id, job in self.jobs.items():
            if (job.status in (JobStatus.COMPLETED, JobStatus.FAILED) and 
                job.updated_at < cutoff_date):
                job_ids_to_remove.append(job_id)
        
        for job_id in job_ids_to_remove:
            del self.jobs[job_id]
            
            # Remove related files
            job_file = os.path.join(self.data_dir, f"{job_id}.json")
            if os.path.exists(job_file):
                os.remove(job_file)
            
            # Remove delta encoder
            if job_id in self.delta_encoders:
                del self.delta_encoders[job_id]
        
        return len(job_ids_to_remove)
    
    def _ensure_data_dir(self) -> None:
        """Ensure the data directory exists"""
        os.makedirs(self.data_dir, exist_ok=True)
    
    def _load_jobs(self) -> None:
        """Load jobs from disk"""
        if not os.path.exists(self.data_dir):
            return
        
        for filename in os.listdir(self.data_dir):
            if not filename.endswith('.json'):
                continue
            
            job_id = filename[:-5]  # Remove .json extension
            job_file = os.path.join(self.data_dir, filename)
            
            try:
                with open(job_file, 'r') as f:
                    job_data = json.load(f)
                
                job = IngestJob.from_dict(job_data)
                self.jobs[job_id] = job
                
                # Create delta encoder for each job
                self.delta_encoders[job_id] = DeltaEncoder(require_ack=False)
                
                logger.debug(f"Loaded job {job_id} from disk")
            except Exception as e:
                logger.error(f"Error loading job {job_id}: {str(e)}")
    
    async def _save_job(self, job: IngestJob) -> None:
        """
        Save job to disk
        
        Args:
            job: Job to save
        """
        self._ensure_data_dir()
        
        job_file = os.path.join(self.data_dir, f"{job.job_id}.json")
        
        # Only store partial chunk data to avoid excessive file sizes
        job_dict = job.to_dict()
        
        # If there are many chunks, store only metadata
        if len(job.chunks) > 10:
            chunk_preview = [c.to_dict() for c in job.chunks[:5]]
            job_dict['chunks'] = chunk_preview
            job_dict['chunks_truncated'] = True
        
        try:
            with open(job_file, 'w') as f:
                json.dump(job_dict, f, indent=2)
            
            logger.debug(f"Saved job {job.job_id} to disk")
        except Exception as e:
            logger.error(f"Error saving job {job.job_id}: {str(e)}")
    
    def _detect_track_from_url(self, url: str) -> Optional[str]:
        """
        Detect track from URL
        
        Args:
            url: File URL
            
        Returns:
            Detected track or None
        """
        # Extract track from path components
        path_parts = url.lower().split('/')
        
        track_keywords = {
            'math': 'math_physics',
            'physics': 'math_physics',
            'programming': 'programming',
            'prog': 'programming',
            'code': 'programming',
            'ai': 'ai_ml',
            'ml': 'ai_ml',
            'machine': 'ai_ml',
            'auto': 'domain',
            'auction': 'domain',
            'car': 'domain',
            'ops': 'ops_sre',
            'sre': 'ops_sre',
            'observability': 'ops_sre'
        }
        
        for part in path_parts:
            for keyword, track in track_keywords.items():
                if keyword in part:
                    return track
        
        return None
    
    async def _notify_subscribers(self, topic: str, data: Dict[str, Any]) -> None:
        """
        Notify subscribers about updates
        
        Args:
            topic: Topic (job_id or 'jobs')
            data: Update data
        """
        # Always notify 'jobs' topic subscribers
        all_subscribers = set(self.subscribers.get('jobs', set()))
        
        # Add topic-specific subscribers
        if topic in self.subscribers:
            all_subscribers.update(self.subscribers[topic])
        
        if not all_subscribers:
            return
        
        # Check if we have a delta encoder for this topic
        encoder = self.delta_encoders.get(topic)
        if not encoder and topic != 'jobs':
            # Create a new encoder for this topic
            encoder = DeltaEncoder(require_ack=False)
            self.delta_encoders[topic] = encoder
        
        # Create update packet
        packet = data
        
        # Apply delta encoding if available
        if encoder:
            packet = encoder.encode(data)
        
        # Send updates to subscribers
        for subscriber in all_subscribers:
            try:
                if hasattr(subscriber, 'send_update'):
                    asyncio.create_task(subscriber.send_update(topic, packet))
            except Exception as e:
                logger.error(f"Error notifying subscriber: {str(e)}")
                
                # Unsubscribe failed subscribers
                await self.unsubscribe(topic, subscriber)
