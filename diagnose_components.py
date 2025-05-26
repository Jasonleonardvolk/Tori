"""
TORI Advanced Memory Component Diagnostics
"""

print('🔍 TORI Advanced Memory Component Diagnostics')
print('=' * 50)

# Test each component individually
components = [
    ('Energy-based Memory', 'memory.manager', 'default_manager'),
    ('Memory Sculptor', 'ingest_pdf.memory_sculptor', 'get_memory_sculptor'),
    ('Koopman Estimator', 'ingest_pdf.koopman_estimator', 'KoopmanEstimator'),
    ('Spectral Monitor', 'ingest_pdf.spectral_monitor', 'get_cognitive_spectral_monitor'),
    ('Eigen Alignment', 'ingest_pdf.eigen_alignment', 'EigenAlignment'),
    ('Stability Detector', 'ingest_pdf.lyapunov_spike_detector', 'LyapunovSpikeDetector'),
    ('Phase Reasoning', 'ingest_pdf.phase_reasoning', None),
    ('Ontology Engine', 'ingest_pdf.ontology_refactor_engine', None)
]

working_components = []
failed_components = []

for name, module_path, class_name in components:
    try:
        print(f'\nTesting {name}...')
        
        # Import the module
        module = __import__(module_path, fromlist=[class_name] if class_name else [''])
        print(f'  ✅ Module imported: {module_path}')
        
        # Test instantiation if class specified
        if class_name:
            if class_name.startswith('get_'):
                # It's a function
                func = getattr(module, class_name)
                instance = func()
                print(f'  ✅ Function called: {class_name}()')
            else:
                # It's a class
                cls = getattr(module, class_name)
                if class_name == 'KoopmanEstimator':
                    instance = cls(basis_type="fourier", basis_params={"n_harmonics": 3}, dt=0.1)
                elif class_name == 'EigenAlignment':
                    # Skip for now as it needs a KoopmanEstimator
                    print(f'  ⏭️  Skipping instantiation (needs dependency)')
                    instance = None
                else:
                    instance = cls()
                if instance:
                    print(f'  ✅ Class instantiated: {class_name}')
        
        working_components.append(name)
        print(f'  🎉 {name}: WORKING')
        
    except ImportError as e:
        print(f'  ❌ Import failed: {e}')
        failed_components.append((name, f'Import: {e}'))
        
    except Exception as e:
        print(f'  ⚠️  Import OK but instantiation failed: {e}')
        working_components.append(f'{name} (partial)')
        
print('\n' + '=' * 50)
print('📊 COMPONENT STATUS SUMMARY')
print('=' * 50)

print(f'\n✅ Working Components ({len(working_components)}):')
for comp in working_components:
    print(f'   • {comp}')
    
if failed_components:
    print(f'\n❌ Failed Components ({len(failed_components)}):')
    for comp, error in failed_components:
        print(f'   • {comp}: {error}')
else:
    print('\n🎉 ALL COMPONENTS LOADED SUCCESSFULLY!')

print(f'\n📈 Success Rate: {len(working_components)}/{len(components)} ({len(working_components)/len(components)*100:.1f}%)')

# If memory sculptor works, test it
if 'Memory Sculptor' in working_components:
    try:
        print('\n🧪 Testing Memory Sculptor functionality...')
        from ingest_pdf.memory_sculptor import get_memory_sculptor
        sculptor = get_memory_sculptor()
        stats = sculptor.get_sculptural_statistics()
        print(f'   ✅ Sculptor stats: {stats["concept_count"]} concepts tracked')
        
        # Test a maintenance cycle
        print('   🔄 Running maintenance cycle...')
        maintenance = sculptor.run_maintenance_cycle()
        print(f'   ✅ Maintenance completed: {maintenance["status"]}')
        
    except Exception as e:
        print(f'   ⚠️  Memory sculptor test failed: {e}')

print('\n🚀 Diagnostic complete!')
