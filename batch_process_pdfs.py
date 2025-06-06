#!/usr/bin/env python3
"""batch_process_pdfs.py - Batch compute Lyapunov predictability for a collection of documents.

This script reads a list of documents or precomputed concept trajectories, computes the Lyapunov 
predictability metric for each using functions from lyapunov.py, and outputs the results in both NPZ and JSON formats. 
It supports parallel processing and various configuration options to tune performance and output.

Usage:
    python batch_process_pdfs.py --input_dir PATH [--output_dir PATH] [--parallelism N] 
                               [--chunk_size M] [--max_file_size BYTES] [--verbose] [--profile]

The results include:
    - An NPZ file (or files if sharded) containing numeric results for internal use.
    - A JSON file with results for visualization.
    - A batch_processing.log text file with detailed logs.
    - A batch_processing.json file with per-document log details.
    - A last_run_summary.json file with summary statistics of the run.
"""

import os
import sys
import json
import argparse
import logging
import time
from typing import List, Optional, Tuple
import numpy as np

# Import the compute_lyapunov function from the lyapunov module
from ingest_pdf.lyapunov import compute_lyapunov

def process_document(doc_path: str, assume_concept_input: bool=False) -> Tuple[str, dict]:
    """
    Process a single document: extract concept trajectory if needed, compute Lyapunov exponent.
    
    Parameters:
        doc_path : str
            Path to the document file. This could be a text file or a precomputed concept data file.
        assume_concept_input : bool, default False
            If True, treat the input file as containing pre-extracted concept data (e.g., an NPZ or CSV of vectors).
            If False, treat the file as raw text and attempt concept extraction (requires pipeline integration).
    
    Returns:
        A tuple (doc_id, result_dict) where:
            doc_id : str is an identifier for the document (e.g., filename without extension).
            result_dict : dict containing the results and metadata for this document. Keys include:
                - "lyapunov_exponent": float or None
                - "divergence_curve": list of floats (the average log divergence curve)
                - "length": int (number of points in the trajectory analyzed)
                - "status": str ("OK" or "Error" or "Insufficient Data")
                - "error": str, optional error message if an error occurred.
    """
    doc_id = os.path.splitext(os.path.basename(doc_path))[0]
    result = {
        "doc_id": doc_id,
        "lyapunov_exponent": None,
        "divergence_curve": None,
        "length": 0,
        "status": "OK"
    }
    try:
        # Load or extract concept trajectory
        if assume_concept_input:
            # If the file is an NPZ or NPY containing the concept sequence
            if doc_path.lower().endswith((".npz", ".npy")):
                data = np.load(doc_path, allow_pickle=True)
                # If NPZ, assume the first array or a known key contains the sequence
                if isinstance(data, np.lib.npyio.NpzFile):
                    # Try common keys or take first array
                    keys = list(data.keys())
                    if keys:
                        concept_seq = data[keys[0]]
                    else:
                        raise ValueError("NPZ file has no arrays.")
                else:
                    # It's an NPY (np.load returns array directly for npy)
                    concept_seq = data
            elif doc_path.lower().endswith(".json"):
                # If concept data is stored as JSON (e.g., list of concept vectors or values)
                with open(doc_path, 'r') as jf:
                    json_data = json.load(jf)
                # Assume the JSON directly contains the sequence (list of numbers or list of list)
                concept_seq = np.array(json_data, dtype=float)
            elif doc_path.lower().endswith((".txt", ".csv")):
                # If it's a text or CSV containing numeric data
                # Attempt to read lines of numbers
                with open(doc_path, 'r') as f:
                    lines = [line.strip() for line in f if line.strip()]
                # Parse into floats, assume space or comma separated if multi-dimensional
                concept_seq = []
                for line in lines:
                    # Split by comma or whitespace
                    parts = [p for p in line.replace(',', ' ').split()]
                    nums = [float(x) for x in parts]
                    concept_seq.append(nums[0] if len(nums) == 1 else nums)
                concept_seq = np.array(concept_seq, dtype=float)
            else:
                # Unsupported file format for concept input
                raise ValueError(f"Unsupported concept input file format: {doc_path}")
        else:
            # Raw text input: integrate with concept extraction pipeline.
            # Use proper concept extraction using existing components
            with open(doc_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
                
            # Extract blocks using the proper block extractor
            # If this is a text file not PDF, split into paragraphs
            if doc_path.lower().endswith('.pdf'):
                try:
                    from ingest_pdf.extract_blocks import extract_concept_blocks
                    blocks = extract_concept_blocks(doc_path)
                except Exception as e:
                    # Fallback if PDF extraction fails
                    blocks = [p.strip() for p in text.split('\n\n') if p.strip()]
                    logger.warning(f"PDF extraction failed for '{doc_id}', using text fallback: {e}")
            else:
                # For text files, split by paragraphs
                blocks = [p.strip() for p in text.split('\n\n') if p.strip()]
                
            if not blocks:
                raise ValueError(f"No content blocks extracted from document: {doc_path}")
                
            # Create feature matrix from blocks
            from ingest_pdf.features import build_feature_matrix
            feats, _ = build_feature_matrix(blocks)
            
            # Convert to concept sequence (using the feature matrix directly)
            # This provides a much richer representation than sentence length
            concept_seq = feats
            
            # Ensure we have concepts
            if concept_seq.size == 0:
                raise ValueError("Concept extraction returned empty sequence.")
                
            logger.info(f"Extracted {len(blocks)} concept blocks from '{doc_id}' with {concept_seq.shape[1]} features")
        result["length"] = len(concept_seq)
        # Compute Lyapunov exponent using the lyapunov module
        exponent, divergence_curve = compute_lyapunov(concept_seq)
        result["lyapunov_exponent"] = exponent if exponent is not None else None
        if divergence_curve is not None:
            # Convert divergence_curve to list for JSON serializability (and maybe trim infs)
            divergence_list = divergence_curve.tolist()
            # Remove any -inf placeholders for clarity in JSON (mark them as null)
            divergence_list_cleaned = []
            for val in divergence_list:
                if isinstance(val, float) and (not np.isfinite(val)):
                    divergence_list_cleaned.append(None)
                else:
                    divergence_list_cleaned.append(val)
            result["divergence_curve"] = divergence_list_cleaned
        if exponent is None:
            result["status"] = "Insufficient Data"
            logger.warning(f"Document '{doc_id}' has insufficient data for Lyapunov exponent calculation.")
    except Exception as e:
        # Catch any unexpected errors
        result["status"] = "Error"
        result["error"] = str(e)
        # Log the full exception traceback in the batch log for debugging
        logger.exception(f"Error processing document '{doc_id}': {e}")
    return doc_id, result

# Set up argument parser for CLI
parser = argparse.ArgumentParser(description="Batch process documents to compute Lyapunov predictability metrics.")
parser.add_argument("--input_dir", type=str, required=True, 
                    help="Path to the directory containing input documents or concept data files.")
parser.add_argument("--output_dir", type=str, default=".", 
                    help="Directory to store output files (NPZ/JSON logs). Defaults to current directory.")
parser.add_argument("--parallelism", type=int, default=1, 
                    help="Number of parallel processes to use. Default 1 (no parallelism).")
parser.add_argument("--chunk_size", type=int, default=None, 
                    help="Maximum number of documents per output shard. If not set, all results in one file (unless file size limit is set).")
parser.add_argument("--max_file_size", type=int, default=None, 
                    help="Maximum size (in bytes) for each output file. If exceeded, results will spill over to a new shard file.")
parser.add_argument("--assume_concept_input", action="store_true", 
                    help="If set, treat files in input_dir as precomputed concept trajectories (NPZ, CSV, etc.). If not set, assumes raw text that needs concept extraction.")
parser.add_argument("--verbose", action="store_true", help="Increase verbosity of console output.")
parser.add_argument("--profile", action="store_true", help="Enable performance profiling for the run.")
args = parser.parse_args()

# Configure logging
if not os.path.exists(args.output_dir):
    os.makedirs(args.output_dir, exist_ok=True)
log_path = os.path.join(args.output_dir, "batch_processing.log")
logger = logging.getLogger("batch_processing")
logger.setLevel(logging.DEBUG)
# File handler for detailed logs
fh = logging.FileHandler(log_path, mode='w', encoding='utf-8')
fh.setLevel(logging.DEBUG)
fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
logger.addHandler(fh)
# Console handler for minimal output
ch = logging.StreamHandler(stream=sys.stdout)
if args.verbose:
    ch.setLevel(logging.INFO)
else:
    ch.setLevel(logging.WARNING)
ch.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
logger.addHandler(ch)

# Main batch processing logic
def main():
    start_time = time.time()
    input_dir = args.input_dir
    output_dir = args.output_dir
    assume_concept = args.assume_concept_input
    # Gather list of files to process
    all_files: List[str] = []
    try:
        for fname in os.listdir(input_dir):
            # Skip hidden files or directories
            if fname.startswith('.'):
                continue
            path = os.path.join(input_dir, fname)
            if os.path.isfile(path):
                all_files.append(path)
        all_files.sort()  # sort for consistent order
    except Exception as e:
        logger.error(f"Failed to list files in input directory: {e}")
        sys.exit(1)

    total_docs = len(all_files)
    logger.info(f"Found {total_docs} documents to process in '{input_dir}'.")
    if total_docs == 0:
        print("No documents found in the input directory. Exiting.")
        return

    # Prepare for parallel processing if requested
    results = []        # will hold result dicts for each doc
    doc_logs = []       # list of per-document logs (for JSON output)
    errors_count = 0
    insufficient_count = 0

    if args.parallelism and args.parallelism > 1:
        logger.info(f"Processing in parallel with {args.parallelism} workers...")
        import concurrent.futures
        with concurrent.futures.ProcessPoolExecutor(max_workers=args.parallelism) as executor:
            # Submit tasks for each document
            future_to_doc = {executor.submit(process_document, doc_path, assume_concept): doc_path for doc_path in all_files}
            for future in concurrent.futures.as_completed(future_to_doc):
                doc_path = future_to_doc[future]
                doc_id = os.path.splitext(os.path.basename(doc_path))[0]
                try:
                    _, result = future.result()  # result is the dict from process_document
                except Exception as exc:
                    # This handles exceptions that escaped process_document (shouldn't usually happen since we catch inside)
                    logger.error(f"Unhandled exception for doc {doc_id}: {exc}")
                    errors_count += 1
                    result = {
                        "doc_id": doc_id,
                        "lyapunov_exponent": None,
                        "divergence_curve": None,
                        "length": 0,
                        "status": "Error",
                        "error": f"Unhandled exception: {exc}"
                    }
                results.append(result)
                doc_logs.append(result)
                if result.get("status") == "Error":
                    errors_count += 1
                elif result.get("status") == "Insufficient Data":
                    insufficient_count += 1
    else:
        # Sequential processing
        logger.info("Processing documents sequentially...")
        for doc_path in all_files:
            doc_id, result = process_document(doc_path, assume_concept)
            results.append(result)
            doc_logs.append(result)
            if result.get("status") == "Error":
                errors_count += 1
            elif result.get("status") == "Insufficient Data":
                insufficient_count += 1

    # Save per-document logs to JSON file
    log_json_path = os.path.join(output_dir, "batch_processing.json")
    try:
        with open(log_json_path, 'w', encoding='utf-8') as ljf:
            json.dump(doc_logs, ljf, indent=2)
        logger.info(f"Per-document log saved to {log_json_path}")
    except Exception as e:
        logger.error(f"Failed to write JSON log file: {e}")

    # Prepare output data structures for results (for NPZ and visualization JSON)
    # We will shard the results if chunk_size or max_file_size is specified.
    chunk_size = args.chunk_size
    max_file_size = args.max_file_size
    # If neither chunking nor size limit is provided, we'll put all results in one file.
    if not chunk_size and not max_file_size:
        chunk_size = total_docs  # one chunk containing all
    # Determine grouping of documents into chunks
    chunks = []
    if chunk_size:
        # Simple chunking by fixed count
        for i in range(0, total_docs, chunk_size):
            chunks.append(results[i:i+chunk_size])
    elif max_file_size:
        # Chunk by size: accumulate until serialized size exceeds limit
        current_chunk = []
        current_size_est = 0
        for res in results:
            # Rough estimate: size of JSON string of res (as proxy for NPZ size)
            res_str = json.dumps(res)
            bytes_len = len(res_str.encode('utf-8'))
            if current_chunk and max_file_size and (current_size_est + bytes_len > max_file_size):
                chunks.append(current_chunk)
                current_chunk = []
                current_size_est = 0
            current_chunk.append(res)
            current_size_est += bytes_len
        if current_chunk:
            chunks.append(current_chunk)
    else:
        chunks = [results]  # fallback, all in one

    # Save results in NPZ and combined JSON for visualization
    viz_records = []  # for combined visualization JSON
    shard_index = 1
    for chunk in chunks:
        if not chunk:
            continue
        # Build arrays or data for NPZ
        exp_values = []
        div_curves = []
        doc_ids = []
        for res in chunk:
            doc_ids.append(res["doc_id"])
            exp = res["lyapunov_exponent"]
            exp_values.append(exp if exp is not None else np.nan)
            # divergence_curve could be None or list
            curve = res.get("divergence_curve")
            if curve is None:
                div_curves.append(np.array([]))
            else:
                div_curves.append(np.array([v if v is not None else np.nan for v in curve], dtype=float))
            # For visualization record (one per doc)
            viz_records.append({
                "doc_id": res["doc_id"],
                "lyapunov_exponent": exp,
                "divergence_curve": res.get("divergence_curve")
            })
        # Save NPZ for this chunk
        out_npz_name = "predictability_results"
        if len(chunks) > 1:
            out_npz_name += f"_part{shard_index}"
        out_npz_path = os.path.join(output_dir, out_npz_name + ".npz")
        try:
            # Save arrays with identifiable names
            np.savez_compressed(out_npz_path, doc_ids=np.array(doc_ids), lyap_exponent=np.array(exp_values),
                                 divergence_curves=np.array(div_curves, dtype=object))
            logger.info(f"Saved results for {len(chunk)} docs to {out_npz_path}")
        except Exception as e:
            logger.error(f"Failed to write NPZ output {out_npz_path}: {e}")
        shard_index += 1

    # Save combined visualization JSON (all docs or per shard if needed)
    viz_json_path = os.path.join(output_dir, "predictability_results.json")
    try:
        with open(viz_json_path, 'w', encoding='utf-8') as vf:
            json.dump(viz_records, vf, indent=2)
        logger.info(f"Saved visualization JSON to {viz_json_path}")
    except Exception as e:
        logger.error(f"Failed to write visualization JSON: {e}")

    # Write summary JSON
    summary = {
        "total_documents": total_docs,
        "processed_documents": total_docs,  # we attempted all; for future could count differently
        "error_count": errors_count,
        "insufficient_data_count": insufficient_count,
        "successful_count": total_docs - errors_count - insufficient_count,
        "average_exponent": None,
        "min_exponent": None,
        "max_exponent": None,
        "std_exponent": None,
        "total_time_seconds": round(time.time() - start_time, 3),
        "parallelism": args.parallelism,
        "chunk_count": len(chunks),
        "chunk_size": args.chunk_size,
        "max_file_size": args.max_file_size
    }
    # Compute summary stats for exponents if available
    exps = [res["lyapunov_exponent"] for res in results if res["lyapunov_exponent"] is not None]
    if exps:
        exps_arr = np.array(exps, dtype=float)
        summary["average_exponent"] = float(np.nanmean(exps_arr))
        summary["min_exponent"] = float(np.nanmin(exps_arr))
        summary["max_exponent"] = float(np.nanmax(exps_arr))
        summary["std_exponent"] = float(np.nanstd(exps_arr))
    summary_path = os.path.join(output_dir, "last_run_summary.json")
    try:
        with open(summary_path, 'w', encoding='utf-8') as sf:
            json.dump(summary, sf, indent=2)
        logger.info(f"Run summary saved to {summary_path}")
    except Exception as e:
        logger.error(f"Failed to write summary JSON: {e}")

    elapsed = time.time() - start_time
    # Print a concise summary to console
    print(f"Processed {total_docs} documents in {elapsed:.2f} seconds. ",
          f"Errors: {errors_count}, Insufficient data: {insufficient_count}.")
    logger.info(f"Batch processing completed in {elapsed:.2f} seconds.")

# If profiling is requested, run the main under cProfile
if __name__ == "__main__":
    if args.profile:
        import cProfile, pstats
        profile_path = os.path.join(args.output_dir, "profile_stats.txt")
        pr = cProfile.Profile()
        pr.enable()
        main()
        pr.disable()
        with open(profile_path, 'w') as pf:
            ps = pstats.Stats(pr, stream=pf)
            ps.strip_dirs().sort_stats("cumtime").print_stats(50)
        print(f"Profile stats saved to {profile_path}")
    else:
        main()
