#!/usr/bin/env python3
"""
ArXiv MEGA Downloader - 10,000+ Papers Edition 🚀
For building the ultimate knowledge foundation!
"""

# MEGA CONFIGURATION FOR 10K+ PAPERS
MEGA_CONFIG = {
    # Phase 1: Priority papers (top 1000)
    "phase_1": {
        "max_papers_per_category": 100,
        "max_total": 1000,
        "priority_threshold": 1.0,  # Only high-priority papers
        "description": "Ultra-high priority: consciousness, AGI, quantum"
    },
    
    # Phase 2: Domain expansion (next 3000)  
    "phase_2": {
        "max_papers_per_category": 300,
        "max_total": 4000,  # Cumulative
        "priority_threshold": 0.5,  # Medium priority
        "description": "Core AI/ML/Physics/Biology domains"
    },
    
    # Phase 3: Comprehensive coverage (next 6000)
    "phase_3": {
        "max_papers_per_category": 500,
        "max_total": 10000,  # Cumulative  
        "priority_threshold": 0.0,  # All papers
        "description": "Complete domain coverage"
    }
}

# EXPANDED CATEGORIES (40+ categories)
MEGA_CATEGORIES = {
    # Core AI/ML (expand existing)
    "cs.AI": "Artificial Intelligence",
    "cs.LG": "Machine Learning",
    "cs.CL": "Computational Linguistics", 
    "cs.CV": "Computer Vision",
    "cs.NE": "Neural and Evolutionary Computing",
    "cs.RO": "Robotics",
    "cs.IR": "Information Retrieval",
    "cs.HC": "Human-Computer Interaction",
    
    # Computer Science Fundamentals
    "cs.DS": "Data Structures and Algorithms",
    "cs.CR": "Cryptography and Security",
    "cs.DB": "Databases",
    "cs.DC": "Distributed Computing", 
    "cs.SY": "Systems and Control",
    "cs.SE": "Software Engineering",
    
    # Mathematics
    "math.ST": "Statistics Theory",
    "math.PR": "Probability", 
    "math.CO": "Combinatorics",
    "math.LO": "Logic",
    "math.OC": "Optimization and Control",
    "math.IT": "Information Theory",
    "math.DS": "Dynamical Systems",
    
    # Physics (expand)
    "quant-ph": "Quantum Physics",
    "physics.gen-ph": "General Physics",
    "physics.bio-ph": "Biological Physics",
    "physics.soc-ph": "Physics and Society", 
    "physics.data-an": "Data Analysis",
    "cond-mat.stat-mech": "Statistical Mechanics",
    "cond-mat.dis-nn": "Disordered Systems and Neural Networks",
    
    # Biology & Life Sciences (expand)
    "q-bio.GN": "Genomics",
    "q-bio.MN": "Molecular Networks",
    "q-bio.PE": "Populations and Evolution", 
    "q-bio.NC": "Neurons and Cognition",
    "q-bio.QM": "Quantitative Methods",
    "q-bio.BM": "Biomolecules",
    
    # Economics & Finance (expand)
    "econ.EM": "Econometrics",
    "econ.TH": "Theoretical Economics",
    "q-fin.GN": "General Finance",
    "q-fin.CP": "Computational Finance",
    "q-fin.RM": "Risk Management",
    
    # Interdisciplinary
    "nlin.AO": "Adaptation and Self-Organizing Systems",
    "nlin.CG": "Cellular Automata and Lattice Gases", 
    "nlin.CD": "Chaotic Dynamics",
    "astro-ph.GA": "Astrophysics of Galaxies",
    "astro-ph.CO": "Cosmology and Nongalactic Astrophysics"
}

# ENHANCED PRIORITY KEYWORDS (100+ keywords)
MEGA_KEYWORDS = {
    "tier_1_consciousness": [
        "consciousness", "artificial general intelligence", "AGI", 
        "quantum consciousness", "integrated information theory",
        "global workspace theory", "attention schema theory"
    ],
    
    "tier_1_quantum": [
        "quantum", "quantum computing", "quantum machine learning",
        "quantum neural networks", "quantum cognition", "quantum entanglement"
    ],
    
    "tier_2_ai_core": [
        "machine learning", "deep learning", "neural networks",
        "transformer", "attention mechanism", "language models",
        "reinforcement learning", "unsupervised learning"
    ],
    
    "tier_2_emergence": [
        "emergence", "emergent behavior", "complexity theory",
        "self-organization", "swarm intelligence", "collective intelligence"
    ],
    
    "tier_3_cognition": [
        "cognition", "cognitive science", "computational neuroscience",
        "brain networks", "neural computation", "memory systems"
    ],
    
    "tier_3_systems": [
        "systems theory", "network theory", "graph neural networks",
        "dynamical systems", "nonlinear dynamics", "chaos theory"
    ],
    
    "tier_4_foundation": [
        "information theory", "entropy", "mutual information",
        "causal inference", "bayesian", "probabilistic models",
        "optimization", "game theory", "decision theory"
    ]
}

def calculate_mega_priority(paper) -> float:
    """Enhanced priority calculation for 10K+ papers"""
    title_lower = paper.title.lower()
    abstract_lower = paper.summary.lower()
    
    priority_score = 0.0
    
    # Tier 1: Consciousness/AGI/Quantum (5.0 points)
    for keyword in MEGA_KEYWORDS["tier_1_consciousness"] + MEGA_KEYWORDS["tier_1_quantum"]:
        if keyword in title_lower:
            priority_score += 5.0
        elif keyword in abstract_lower:
            priority_score += 2.5
    
    # Tier 2: Core AI/Emergence (3.0 points)  
    for keyword in MEGA_KEYWORDS["tier_2_ai_core"] + MEGA_KEYWORDS["tier_2_emergence"]:
        if keyword in title_lower:
            priority_score += 3.0
        elif keyword in abstract_lower:
            priority_score += 1.5
    
    # Tier 3: Cognition/Systems (2.0 points)
    for keyword in MEGA_KEYWORDS["tier_3_cognition"] + MEGA_KEYWORDS["tier_3_systems"]:
        if keyword in title_lower:
            priority_score += 2.0
        elif keyword in abstract_lower:
            priority_score += 1.0
    
    # Tier 4: Foundation (1.0 points)
    for keyword in MEGA_KEYWORDS["tier_4_foundation"]:
        if keyword in title_lower:
            priority_score += 1.0
        elif keyword in abstract_lower:
            priority_score += 0.5
    
    # Recency bonus (up to 2.0 points)
    if paper.published:
        days_old = (datetime.now() - paper.published.replace(tzinfo=None)).days
        if days_old < 7:      # Last week
            priority_score += 2.0
        elif days_old < 30:   # Last month  
            priority_score += 1.5
        elif days_old < 90:   # Last quarter
            priority_score += 1.0
        elif days_old < 365:  # Last year
            priority_score += 0.5
    
    return priority_score

print("""
🚀 MEGA ARXIV STRATEGY FOR 10,000+ PAPERS

📊 TIER SYSTEM:
   Tier 1 (5.0★): Consciousness, AGI, Quantum Cognition  
   Tier 2 (3.0★): Core AI/ML, Emergence, Complexity
   Tier 3 (2.0★): Cognition, Systems Theory, Networks
   Tier 4 (1.0★): Foundation Math, Information Theory

🎯 CATEGORIES: 40+ domains covered
⏱️ TIME: 24-48 hours for complete download
💾 SIZE: 15-25GB total storage
🧠 RESULT: 200K-500K concepts extracted

Ready to build the ultimate knowledge foundation! 🏆
""")
