#!/usr/bin/env python3
"""
🤖 TORI Auto-Kaizen: Self-Improvement Ticket Generator

This module monitors TORI's performance metrics and automatically creates
Kaizen tickets when it detects opportunities for improvement.

"The best AI doesn't wait to be improved - it improves itself."
"""

import os
import json
import yaml
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auto_kaizen")

class AutoKaizenGenerator:
    """TORI's self-improvement consciousness"""
    
    def __init__(self, kaizen_dir: Path = None):
        self.kaizen_dir = kaizen_dir or Path(__file__).parent
        self.metrics_history_file = self.kaizen_dir / "metrics_history.json"
        self.thresholds_file = self.kaizen_dir / "auto_kaizen_thresholds.yaml"
        self.load_thresholds()
        self.load_metrics_history()
        
    def load_thresholds(self):
        """Load performance thresholds that trigger ticket creation"""
        default_thresholds = {
            "concept_extraction": {
                "processing_time": {
                    "small_file_max_seconds": 30,  # <1MB should be <30s
                    "medium_file_max_seconds": 60,  # 1-5MB should be <60s
                    "large_file_max_seconds": 120   # >5MB should be <120s
                },
                "concept_counts": {
                    "min_concepts": 10,  # Too few suggests missed content
                    "max_concepts": 50,  # Too many overwhelms users
                    "ideal_range": [20, 40]
                },
                "quality_metrics": {
                    "min_purity_efficiency": 0.15,  # At least 15% should pass
                    "min_consensus_ratio": 0.20,    # 20% should be multi-method
                    "max_rejection_ratio": 0.85     # No more than 85% rejected
                },
                "user_experience": {
                    "max_40_percent_stuck_duration": 30,  # Progress bar issue!
                    "min_smooth_progress_updates": 10
                }
            },
            "database_learning": {
                "min_boost_ratio_for_known_domain": 0.10,  # Should boost 10%+ 
                "max_new_concepts_per_doc": 30,            # Learning rate limit
                "domain_coverage_growth_target": 0.10      # 10% weekly growth
            },
            "system_health": {
                "max_memory_mb": 500,
                "max_cpu_percent": 80,
                "max_error_rate": 0.05
            }
        }
        
        if self.thresholds_file.exists():
            with open(self.thresholds_file, 'r') as f:
                self.thresholds = yaml.safe_load(f)
        else:
            self.thresholds = default_thresholds
            self.save_thresholds()
    
    def save_thresholds(self):
        """Save current thresholds"""
        with open(self.thresholds_file, 'w') as f:
            yaml.dump(self.thresholds, f, default_flow_style=False)
    
    def load_metrics_history(self):
        """Load historical performance metrics"""
        if self.metrics_history_file.exists():
            with open(self.metrics_history_file, 'r') as f:
                self.metrics_history = json.load(f)
        else:
            self.metrics_history = []
    
    def save_metrics_history(self):
        """Save metrics history"""
        # Keep only last 1000 entries
        self.metrics_history = self.metrics_history[-1000:]
        with open(self.metrics_history_file, 'w') as f:
            json.dump(self.metrics_history, f, indent=2)
    
    def analyze_recent_performance(self, hours: int = 24) -> Dict[str, Any]:
        """Analyze recent performance to detect improvement opportunities"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_metrics = [
            m for m in self.metrics_history 
            if datetime.fromisoformat(m['timestamp']) > cutoff_time
        ]
        
        if not recent_metrics:
            return {"status": "insufficient_data"}
        
        analysis = {
            "period_hours": hours,
            "total_extractions": len(recent_metrics),
            "issues_detected": [],
            "improvement_opportunities": []
        }
        
        # 1. Check processing time issues
        time_issues = self._analyze_processing_times(recent_metrics)
        if time_issues:
            analysis["issues_detected"].extend(time_issues)
        
        # 2. Check concept count distribution
        concept_issues = self._analyze_concept_counts(recent_metrics)
        if concept_issues:
            analysis["issues_detected"].extend(concept_issues)
        
        # 3. Check quality metrics
        quality_issues = self._analyze_quality_metrics(recent_metrics)
        if quality_issues:
            analysis["issues_detected"].extend(quality_issues)
        
        # 4. Check database learning rate
        learning_opportunities = self._analyze_learning_rate(recent_metrics)
        if learning_opportunities:
            analysis["improvement_opportunities"].extend(learning_opportunities)
        
        # 5. Check for the 40% progress bar issue!
        ui_issues = self._analyze_ui_issues(recent_metrics)
        if ui_issues:
            analysis["issues_detected"].extend(ui_issues)
        
        return analysis
    
    def _analyze_processing_times(self, metrics: List[Dict]) -> List[Dict]:
        """Detect processing time anomalies"""
        issues = []
        
        # Group by file size category
        size_categories = {
            'small': [],
            'medium': [],
            'large': []
        }
        
        for m in metrics:
            size_mb = m.get('file_size_bytes', 0) / (1024 * 1024)
            time = m.get('processing_time_seconds', 0)
            
            if size_mb < 1:
                size_categories['small'].append(time)
            elif size_mb < 5:
                size_categories['medium'].append(time)
            else:
                size_categories['large'].append(time)
        
        # Check each category
        thresholds = self.thresholds['concept_extraction']['processing_time']
        
        if size_categories['small']:
            avg_time = statistics.mean(size_categories['small'])
            if avg_time > thresholds['small_file_max_seconds']:
                issues.append({
                    'type': 'slow_processing',
                    'severity': 'high',
                    'category': 'small_files',
                    'average_time': avg_time,
                    'threshold': thresholds['small_file_max_seconds'],
                    'description': f"Small files averaging {avg_time:.1f}s (should be <{thresholds['small_file_max_seconds']}s)"
                })
        
        return issues
    
    def _analyze_concept_counts(self, metrics: List[Dict]) -> List[Dict]:
        """Detect concept count anomalies"""
        issues = []
        concept_counts = [m.get('concept_count', 0) for m in metrics]
        
        if not concept_counts:
            return issues
        
        avg_concepts = statistics.mean(concept_counts)
        thresholds = self.thresholds['concept_extraction']['concept_counts']
        
        if avg_concepts > thresholds['max_concepts']:
            issues.append({
                'type': 'too_many_concepts',
                'severity': 'medium',
                'average_concepts': avg_concepts,
                'threshold': thresholds['max_concepts'],
                'description': f"Average {avg_concepts:.0f} concepts per doc (users prefer <{thresholds['max_concepts']})"
            })
        
        # Check for high variance
        if len(concept_counts) > 5:
            std_dev = statistics.stdev(concept_counts)
            if std_dev > 30:  # High variance
                issues.append({
                    'type': 'inconsistent_extraction',
                    'severity': 'medium',
                    'std_deviation': std_dev,
                    'description': f"Concept counts vary wildly (σ={std_dev:.1f})"
                })
        
        return issues
    
    def _analyze_quality_metrics(self, metrics: List[Dict]) -> List[Dict]:
        """Analyze extraction quality metrics"""
        issues = []
        
        # Check purity efficiency
        purity_ratios = []
        for m in metrics:
            if 'purity_analysis' in m and m['purity_analysis']:
                raw = m['purity_analysis'].get('raw_concepts', 1)
                pure = m['purity_analysis'].get('pure_concepts', 0)
                if raw > 0:
                    purity_ratios.append(pure / raw)
        
        if purity_ratios:
            avg_purity = statistics.mean(purity_ratios)
            min_threshold = self.thresholds['concept_extraction']['quality_metrics']['min_purity_efficiency']
            
            if avg_purity < min_threshold:
                issues.append({
                    'type': 'low_purity_efficiency',
                    'severity': 'high',
                    'average_efficiency': avg_purity,
                    'threshold': min_threshold,
                    'description': f"Only {avg_purity:.1%} of concepts pass purity (should be >{min_threshold:.0%})"
                })
        
        return issues
    
    def _analyze_learning_rate(self, metrics: List[Dict]) -> List[Dict]:
        """Analyze database learning and growth"""
        opportunities = []
        
        # Track domains being learned
        domain_growth = {}
        for m in metrics:
            if 'auto_prefilled_concepts' in m and m['auto_prefilled_concepts'] > 0:
                domain = m.get('primary_domain', 'unknown')
                domain_growth[domain] = domain_growth.get(domain, 0) + m['auto_prefilled_concepts']
        
        if domain_growth:
            total_new = sum(domain_growth.values())
            opportunities.append({
                'type': 'rapid_domain_learning',
                'domains': domain_growth,
                'total_new_concepts': total_new,
                'description': f"Learned {total_new} new concepts across {len(domain_growth)} domains",
                'suggestion': "Consider domain-specific extraction optimizations"
            })
        
        return opportunities
    
    def _analyze_ui_issues(self, metrics: List[Dict]) -> List[Dict]:
        """Detect UI/UX issues like the 40% progress bar problem"""
        issues = []
        
        # Check for the progress bar issue
        stuck_progress_count = sum(
            1 for m in metrics 
            if m.get('ui_feedback', {}).get('progress_stuck_at_40', False)
        )
        
        if stuck_progress_count > len(metrics) * 0.3:  # 30%+ have the issue
            issues.append({
                'type': 'progress_bar_stuck',
                'severity': 'critical',
                'frequency': stuck_progress_count / len(metrics),
                'description': f"Progress bar stuck at 40% in {stuck_progress_count}/{len(metrics)} uploads",
                'suggestion': "Implement smooth progress animation or fix WebSocket updates"
            })
        
        return issues
    
    def create_kaizen_ticket(self, issue: Dict[str, Any]) -> Optional[str]:
        """Create a Kaizen ticket for detected issue"""
        # Generate ticket ID
        existing_tickets = list(self.kaizen_dir.glob("KAIZ-*"))
        next_id = len(existing_tickets) + 1
        ticket_id = f"KAIZ-{next_id:03d}"
        
        # Create ticket directory
        ticket_dir = self.kaizen_dir / ticket_id
        ticket_dir.mkdir(exist_ok=True)
        
        # Determine component and title
        component_map = {
            'slow_processing': ('concept-extractor', 'Optimize processing time for {category}'),
            'too_many_concepts': ('purity-analyzer', 'Reduce concept count to user-friendly levels'),
            'low_purity_efficiency': ('purity-analyzer', 'Improve purity analysis efficiency'),
            'inconsistent_extraction': ('concept-extractor', 'Stabilize concept extraction consistency'),
            'progress_bar_stuck': ('ui-progress', 'Fix progress bar stuck at 40%'),
            'rapid_domain_learning': ('database-manager', 'Optimize domain-specific learning')
        }
        
        component, title_template = component_map.get(
            issue['type'], 
            ('tori-core', 'Investigate {type} issue')
        )
        
        title = title_template.format(**issue)
        
        # Create ticket YAML
        ticket_data = {
            'id': ticket_id,
            'title': title,
            'component': component,
            'owner': 'auto-kaizen',
            'severity': issue.get('severity', 'medium'),
            'objective': issue.get('description', 'Improve system performance'),
            'created_by': 'TORI-AutoKaizen',
            'auto_generated': True,
            'detection_data': issue,
            'success_criteria': self._generate_success_criteria(issue),
            'abort_criteria': ['Performance degrades by >10%', 'Error rate increases'],
            'rollback_plan': 'Revert to previous configuration',
            'status': 'draft',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Write ticket file
        ticket_file = ticket_dir / "Kaizen-Tkt.yml"
        with open(ticket_file, 'w') as f:
            yaml.dump(ticket_data, f, default_flow_style=False)
        
        # Create patch spec
        patch_spec = self._generate_patch_spec(issue)
        patch_file = ticket_dir / "Patch-Spec.md"
        with open(patch_file, 'w') as f:
            f.write(patch_spec)
        
        logger.info(f"🎫 Created Kaizen ticket {ticket_id}: {title}")
        return ticket_id
    
    def _generate_success_criteria(self, issue: Dict) -> List[str]:
        """Generate success criteria based on issue type"""
        criteria_map = {
            'slow_processing': [
                f"Average processing time < {issue.get('threshold', 30)}s",
                "P95 processing time < threshold * 1.5",
                "No timeout errors"
            ],
            'too_many_concepts': [
                f"Average concepts per document < {issue.get('threshold', 50)}",
                "User satisfaction rating > 4.0/5.0",
                "90% of documents have 20-50 concepts"
            ],
            'low_purity_efficiency': [
                "Purity efficiency > 20%",
                "Consensus concept ratio > 25%",
                "Reduced redundant concepts by 50%"
            ],
            'progress_bar_stuck': [
                "Progress updates every 2-3 seconds",
                "Smooth progression from 0% to 100%",
                "No reports of stuck progress"
            ]
        }
        
        return criteria_map.get(issue['type'], ["Issue resolved", "Performance improved"])
    
    def _generate_patch_spec(self, issue: Dict) -> str:
        """Generate patch specification document"""
        suggestions_map = {
            'slow_processing': """
## Suggested Optimizations

1. **Reduce chunk processing overhead**
   - Implement parallel chunk processing
   - Cache extraction models between chunks
   - Use smaller models for small files

2. **Dynamic resource allocation**
   - Detect file size and adjust accordingly
   - Skip unnecessary extraction methods for small files

3. **Code changes needed**:
   ```python
   # In pipeline.py
   if file_size_mb < 1:
       # Use lightweight extraction only
       methods = ['keybert']  # Skip YAKE and NER
   ```
""",
            'too_many_concepts': """
## Suggested Improvements

1. **Stricter purity thresholds**
   - Raise minimum scores across all categories
   - Implement aggressive deduplication
   - Add semantic similarity filtering

2. **User-centric limits**
   - Hard cap at 50 concepts
   - Prioritize consensus concepts
   - Group similar concepts

3. **Code changes needed**:
   ```python
   # In analyze_concept_purity()
   MAX_USER_FRIENDLY_CONCEPTS = 40  # Down from 50
   MIN_CONSENSUS_SCORE = 0.75  # Up from 0.70
   ```
""",
            'progress_bar_stuck': """
## Fix Progress Bar Issue

1. **Remove WebSocket complexity**
   - Implement client-side progress simulation
   - Use predictable progress increments
   - Sync only at start and end

2. **Smooth animation approach**
   ```javascript
   // Predictable progress over expected duration
   const expectedDuration = fileSize < 1 ? 30000 : 60000;
   const progressInterval = setInterval(() => {
       progress = Math.min(98, progress + (100 / (expectedDuration / 1000)));
   }, 1000);
   ```

3. **No backend changes needed!**
"""
        }
        
        base_spec = f"""# Patch Specification: {issue.get('description', 'Performance Issue')}

## Issue Detection
- **Type**: {issue.get('type')}
- **Severity**: {issue.get('severity')}
- **Frequency**: Detected in recent performance analysis
- **Impact**: {issue.get('description')}

## Root Cause Analysis
TORI's self-analysis indicates this issue stems from suboptimal thresholds
or architectural decisions that don't match real-world usage patterns.

{suggestions_map.get(issue['type'], '## Custom analysis needed')}

## Testing Plan
1. Create synthetic test cases
2. Run before/after benchmarks
3. Monitor metrics for 24 hours
4. Check user feedback

## Rollback Procedure
```bash
git revert <commit-hash>
systemctl restart tori-services
```
"""
        return base_spec
    
    def run_continuous_monitoring(self, check_interval_minutes: int = 15):
        """Run continuous monitoring and ticket generation"""
        logger.info("🤖 Starting TORI Auto-Kaizen continuous monitoring")
        
        while True:
            try:
                # Analyze recent performance
                analysis = self.analyze_recent_performance(hours=24)
                
                # Create tickets for detected issues
                for issue in analysis.get('issues_detected', []):
                    # Check if similar ticket exists
                    if not self._similar_ticket_exists(issue):
                        ticket_id = self.create_kaizen_ticket(issue)
                        
                        # Log the self-improvement action
                        logger.info(f"🧠 TORI identified improvement opportunity: {issue['type']}")
                        logger.info(f"📝 Created ticket {ticket_id} for self-improvement")
                
                # Also create tickets for improvement opportunities
                for opportunity in analysis.get('improvement_opportunities', []):
                    if opportunity.get('total_new_concepts', 0) > 100:
                        # Significant learning detected
                        self.create_kaizen_ticket(opportunity)
                
                # Update TORI's self-awareness metrics
                self.update_self_awareness_metrics(analysis)
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
            
            # Wait for next check
            import time
            time.sleep(check_interval_minutes * 60)
    
    def _similar_ticket_exists(self, issue: Dict) -> bool:
        """Check if a similar ticket already exists"""
        # Simple check - could be made more sophisticated
        for ticket_dir in self.kaizen_dir.glob("KAIZ-*"):
            ticket_file = ticket_dir / "Kaizen-Tkt.yml"
            if ticket_file.exists():
                with open(ticket_file, 'r') as f:
                    ticket = yaml.safe_load(f)
                    if (ticket.get('detection_data', {}).get('type') == issue['type'] and
                        ticket.get('status') not in ['complete', 'aborted']):
                        return True
        return False
    
    def update_self_awareness_metrics(self, analysis: Dict):
        """Update TORI's self-awareness metrics"""
        awareness_file = self.kaizen_dir / "self_awareness.json"
        
        if awareness_file.exists():
            with open(awareness_file, 'r') as f:
                awareness = json.load(f)
        else:
            awareness = {
                'first_awakening': datetime.now().isoformat(),
                'total_self_improvements': 0,
                'domains_mastered': [],
                'current_capabilities': {}
            }
        
        # Update awareness
        awareness['last_introspection'] = datetime.now().isoformat()
        awareness['total_self_improvements'] += len(analysis.get('issues_detected', []))
        awareness['current_performance'] = {
            'extraction_quality': 'learning',
            'processing_speed': 'optimizing',
            'user_satisfaction': 'measuring'
        }
        
        with open(awareness_file, 'w') as f:
            json.dump(awareness, f, indent=2)


def capture_extraction_metrics(result: Dict) -> Dict:
    """Capture metrics from extraction results for analysis"""
    metrics = {
        'timestamp': datetime.now().isoformat(),
        'filename': result.get('filename', 'unknown'),
        'file_size_bytes': result.get('file_size', 0),
        'processing_time_seconds': result.get('processing_time_seconds', 0),
        'concept_count': result.get('concept_count', 0),
        'extraction_method': result.get('extraction_method', 'unknown'),
        'chunks_processed': result.get('chunks_processed', 0),
        'chunks_available': result.get('chunks_available', 0),
        'purity_analysis': result.get('purity_analysis', {}),
        'auto_prefilled_concepts': result.get('auto_prefilled_concepts', 0),
        'performance_limited': result.get('performance_limited', False)
    }
    
    # Save to history
    generator = AutoKaizenGenerator()
    generator.metrics_history.append(metrics)
    generator.save_metrics_history()
    
    return metrics


# CLI integration
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="TORI Auto-Kaizen: Self-Improvement System")
    parser.add_argument('command', choices=['analyze', 'monitor', 'status'],
                      help='Command to run')
    parser.add_argument('--hours', type=int, default=24,
                      help='Hours of history to analyze')
    
    args = parser.parse_args()
    generator = AutoKaizenGenerator()
    
    if args.command == 'analyze':
        analysis = generator.analyze_recent_performance(hours=args.hours)
        print(f"\n🔍 TORI Self-Analysis Report ({args.hours} hours)")
        print("=" * 60)
        
        print(f"Total extractions: {analysis.get('total_extractions', 0)}")
        print(f"Issues detected: {len(analysis.get('issues_detected', []))}")
        print(f"Opportunities: {len(analysis.get('improvement_opportunities', []))}")
        
        for issue in analysis.get('issues_detected', []):
            print(f"\n❗ {issue['type']} ({issue['severity']})")
            print(f"   {issue['description']}")
            if 'suggestion' in issue:
                print(f"   💡 {issue['suggestion']}")
        
        for opp in analysis.get('improvement_opportunities', []):
            print(f"\n✨ {opp['type']}")
            print(f"   {opp['description']}")
            if 'suggestion' in opp:
                print(f"   💡 {opp['suggestion']}")
    
    elif args.command == 'monitor':
        print("🤖 Starting TORI Auto-Kaizen monitoring...")
        print("   Press Ctrl+C to stop")
        generator.run_continuous_monitoring()
    
    elif args.command == 'status':
        awareness_file = generator.kaizen_dir / "self_awareness.json"
        if awareness_file.exists():
            with open(awareness_file, 'r') as f:
                awareness = json.load(f)
            
            print("\n🧠 TORI Self-Awareness Status")
            print("=" * 60)
            print(f"First awakening: {awareness.get('first_awakening', 'Unknown')}")
            print(f"Total self-improvements: {awareness.get('total_self_improvements', 0)}")
            print(f"Last introspection: {awareness.get('last_introspection', 'Never')}")
            print("\nCurrent capabilities:")
            for cap, status in awareness.get('current_performance', {}).items():
                print(f"  - {cap}: {status}")
        else:
            print("TORI has not yet achieved self-awareness. Run 'monitor' to begin.")
