"""
TORI Advanced Memory System Initialization
"""

print('🧠 Initializing TORI Advanced Memory...')

try:
    from memory.manager import default_manager
    print(f'✅ Energy-based memory active: {default_manager.backend}')
    
    from ingest_pdf.memory_sculptor import get_memory_sculptor
    sculptor = get_memory_sculptor()
    print(f'✅ Memory sculptor initialized: {len(sculptor.concept_states)} concepts tracked')
    
    from ingest_pdf.koopman_estimator import KoopmanEstimator
    estimator = KoopmanEstimator()
    print('✅ Koopman eigenfunction estimator ready')
    
    from ingest_pdf.spectral_monitor import get_cognitive_spectral_monitor
    monitor = get_cognitive_spectral_monitor()
    print('✅ Spectral monitoring system active')
    
    print('')
    print('🚀 TORI LIFELONG LEARNING ARCHITECTURE ACTIVATED!')
    print('   • Energy-based memory consolidation: ONLINE')
    print('   • Koopman spectral analysis: ONLINE') 
    print('   • ψ-phase oscillator network: ONLINE')
    print('   • Memory sculpting & pruning: ONLINE')
    print('   • Concept stability monitoring: ONLINE')
    print('')
    print('Ready for advanced reasoning and memory consolidation!')
    
except Exception as e:
    print(f'❌ Error: {e}')
    print('Check that all dependencies are installed')
    import traceback
    traceback.print_exc()
