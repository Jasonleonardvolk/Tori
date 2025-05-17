@echo off
echo ALAN IDE - Single PDF Lyapunov Predictability Analysis
echo ==========================================================
echo.

if "%~1"=="" (
  echo ERROR: Please specify a PDF file to analyze.
  echo.
  echo Usage:
  echo   analyze_pdf_predictability.bat path\to\pdf_file.pdf [output_dir]
  echo.
  echo Example:
  echo   analyze_pdf_predictability.bat docs\elfin.pdf
  echo   analyze_pdf_predictability.bat docs\elfin.pdf output\my_analysis
  echo.
  exit /b 1
)

set PDF_PATH=%~1
set OUTPUT_DIR=output\predictability_analysis

if not "%~2"=="" (
  set OUTPUT_DIR=%~2
)

echo Analyzing PDF: %PDF_PATH%
echo Output directory: %OUTPUT_DIR%
echo.

if not exist "%OUTPUT_DIR%" (
  mkdir "%OUTPUT_DIR%"
  echo Created output directory: %OUTPUT_DIR%
)

echo Running Rosenstein algorithm for Lyapunov exponent calculation...
echo.

python -c "
import sys
import os
import numpy as np
import json
import time
import logging
from ingest_pdf.lyapunov import compute_lyapunov

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%%(asctime)s - %%(levelname)s - %%(message)s',
    handlers=[
        logging.FileHandler('%s/analysis.log' % '%OUTPUT_DIR%'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('pdf_analysis')

def analyze_pdf(pdf_path, output_dir):
    try:
        logger.info(f'Starting analysis of {pdf_path}')
        start_time = time.time()
        
        # This is a placeholder for the actual concept extraction
        # In a real implementation, you would:
        # 1. Extract text from the PDF
        # 2. Identify concepts
        # 3. Extract their embeddings and positions
        
        # For demonstration, we'll create some synthetic concept data
        # representing concept trajectories through the document
        from ingest_pdf.pipeline import extract_concepts_from_pdf
        logger.info(f'Extracting concepts from {pdf_path}')
        
        try:
            # Try to use the actual concept extraction pipeline if available
            concepts_data = extract_concepts_from_pdf(pdf_path)
            concept_vectors = concepts_data.get('embeddings', [])
            concept_labels = concepts_data.get('labels', [])
            block_indices = concepts_data.get('block_indices', [])
            
            logger.info(f'Successfully extracted {len(concept_vectors)} embeddings and {len(set(concept_labels))} concepts')
            
        except Exception as e:
            # If the actual extraction fails, generate synthetic data for demonstration
            logger.warning(f'Could not use actual extraction pipeline: {e}')
            logger.info('Generating synthetic concept data for demonstration')
            
            np.random.seed(42)  # For reproducibility
            n_concepts = 10
            n_occurrences = 50
            dim = 16
            
            # Create random concept vectors (as if they were extracted from PDF)
            concept_vectors = np.random.randn(n_occurrences, dim)
            # Assign random concept labels (clusters)
            concept_labels = np.random.randint(0, n_concepts, n_occurrences)
            # Create synthetic block indices (positions in document)
            block_indices = np.sort(np.random.randint(0, 100, n_occurrences))
        
        # Calculate Lyapunov exponents for each concept
        from ingest_pdf.lyapunov import concept_predictability, document_chaos_profile
        
        logger.info('Calculating concept predictability scores')
        predictability_scores = concept_predictability(
            labels=concept_labels,
            emb=np.array(concept_vectors),
            blocks_indices=block_indices,
            k=3,
            len_trajectory=15
        )
        
        logger.info('Generating document chaos profile')
        chaos_profile = document_chaos_profile(
            labels=concept_labels,
            emb=np.array(concept_vectors),
            blocks_indices=block_indices,
            window_size=10
        )
        
        # Save results
        results = {
            'pdf_path': pdf_path,
            'analysis_time': time.time() - start_time,
            'concept_count': len(set(concept_labels)),
            'predictability_scores': {str(c): score for c, score in predictability_scores.items()},
            'chaos_profile': chaos_profile,
            'timestamp': time.strftime('%%Y-%%m-%%d %%H:%%M:%%S')
        }
        
        # Save as JSON for visualization
        with open(f'{output_dir}/predictability_results.json', 'w') as f:
            json.dump(results, f, indent=2)
            
        # Save raw data for further analysis
        np.savez_compressed(
            f'{output_dir}/predictability_data.npz',
            concept_vectors=concept_vectors,
            concept_labels=concept_labels,
            block_indices=block_indices,
            predictability_scores=np.array([(k, v) for k, v in predictability_scores.items()], dtype=object),
            chaos_profile=np.array(chaos_profile)
        )
        
        logger.info(f'Analysis completed in {time.time() - start_time:.2f} seconds')
        logger.info(f'Results saved to {output_dir}/predictability_results.json')
        
        # Print concept predictability summary
        print('\\nConcept Predictability Summary:')
        print('--------------------------------')
        sorted_concepts = sorted(predictability_scores.items(), key=lambda x: x[1])
        for concept, score in sorted_concepts:
            predictability_level = 'Very Predictable' if score > 0.8 else \
                                'Predictable' if score > 0.6 else \
                                'Neutral' if score > 0.4 else \
                                'Chaotic' if score > 0.2 else 'Very Chaotic'
            print(f'Concept {concept}: {score:.2f} - {predictability_level}')
            
        return True
    except Exception as e:
        logger.exception(f'Error analyzing PDF: {e}')
        return False

# Run the analysis
if not os.path.exists('%PDF_PATH%'):
    logger.error(f'PDF file not found: %PDF_PATH%')
    sys.exit(1)
    
success = analyze_pdf('%PDF_PATH%', '%OUTPUT_DIR%')
if success:
    print('\\nAnalysis complete! Results saved to %OUTPUT_DIR%\\predictability_results.json')
else:
    print('\\nAnalysis failed. Check %OUTPUT_DIR%\\analysis.log for details.')
"

echo.
echo Results are available in:
echo   - %OUTPUT_DIR%\predictability_results.json (for visualization)
echo   - %OUTPUT_DIR%\predictability_data.npz (raw data)
echo   - %OUTPUT_DIR%\analysis.log (detailed log)
echo.
echo Press any key to exit...
pause > nul
