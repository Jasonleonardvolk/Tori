@echo off
color 0C
echo.
echo  📚🧠 PRAJNA PDF-ONLY FEEDING SYSTEM - FIXED VERSION 🧠📚
echo =======================================================
echo.
echo Welcome to Prajna's PDF-Only Ingestion System!
echo ✅ NOW SAVES RESULTS TO JSON FILES FOR STATS VIEWING!
echo.
echo 📂 Data directory: C:\Users\jason\Desktop\tori\kha\data
echo 📄 File types: PDF DOCUMENTS ONLY
echo 💾 Output files: prajna_pdf_knowledge.json, prajna_pdf_concepts.json
echo.
echo This system will:
echo ✅ Scan ONLY for PDF files (.pdf)
echo ✅ Extract text content from PDFs
echo ✅ Analyze document metadata (title, author, subject)
echo ✅ Extract concepts and keywords
echo ✅ Classify document types (academic, technical, etc.)
echo ✅ Feed processed knowledge to Prajna's consciousness
echo ✅ SAVE RESULTS TO JSON FILES FOR VIEWING!
echo.
echo Choose your PDF ingestion method:
echo.
echo [1] 🚀 MASSIVE PDF BATCH PROCESSING (FIXED)
echo     - Process ALL PDFs in your data directory
echo     - Advanced text extraction and analysis
echo     - Saves results to JSON files
echo     - High-performance parallel processing
echo.
echo [2] 🎯 LIMITED PDF PROCESSING - Testing (FIXED)
echo     - Process first 10 PDFs only
echo     - Good for testing the system
echo     - Saves results to JSON files
echo.
echo [3] 📊 SINGLE PDF TEST (FIXED)
echo     - Process just 1 PDF for testing
echo     - Fastest way to verify system works
echo     - Saves results to JSON files
echo.
echo [4] 🔍 PDF DISCOVERY SCAN
echo     - Just scan and count PDF files
echo     - No processing, just discovery
echo     - See what PDFs are available
echo.
echo [5] 📈 VIEW PDF PROCESSING STATS
echo     - Show previous PDF processing results
echo     - PDF knowledge base summary
echo.
echo [6] 🧠 TEST SYSTEM DEPENDENCIES
echo     - Check if PDF libraries are installed
echo     - Verify system is ready
echo.
echo [0] Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto massive_pdf_batch_fixed
if "%choice%"=="2" goto limited_pdf_test_fixed
if "%choice%"=="3" goto single_pdf_test
if "%choice%"=="4" goto pdf_discovery
if "%choice%"=="5" goto view_pdf_stats
if "%choice%"=="6" goto test_dependencies
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
pause
goto menu

:massive_pdf_batch_fixed
echo.
echo 🚀 Starting FIXED Massive PDF Batch Processing...
echo ================================================
echo.
echo 📚 Processing ALL PDF files in your data directory
echo ⚡ High-performance parallel processing enabled
echo 🧠 Full text extraction and concept analysis
echo 💾 Results will be saved to JSON files!
echo.
python ingest_pdfs_only_FIXED.py --data-dir "C:\Users\jason\Desktop\tori\kha\data" --batch-size 10 --workers 2
goto end

:limited_pdf_test_fixed
echo.
echo 🎯 Starting FIXED Limited PDF Processing (10 PDFs)...
echo ===================================================
echo.
echo 📚 Processing first 10 PDF files only
echo 🧪 Perfect for testing the FIXED system
echo ⚡ Faster completion time
echo 💾 Results will be saved to JSON files!
echo.
python ingest_pdfs_only_FIXED.py --data-dir "C:\Users\jason\Desktop\tori\kha\data" --max-pdfs 10 --batch-size 5 --workers 2
goto end

:single_pdf_test
echo.
echo 🎯 Starting Single PDF Test...
echo ==============================
echo.
echo 📚 Processing just 1 PDF file for testing
echo 🧪 Fastest way to verify system works
echo ⚡ Quick completion
echo 💾 Results will be saved to JSON files!
echo.
python ingest_pdfs_only_FIXED.py --data-dir "C:\Users\jason\Desktop\tori\kha\data" --max-pdfs 1 --batch-size 1 --workers 1
goto end

:pdf_discovery
echo.
echo 🔍 PDF Discovery Scan...
echo ========================
echo.
echo Scanning for PDF files in your data directory...
echo.
echo Finding PDF files...
for /r "C:\Users\jason\Desktop\tori\kha\data" %%f in (*.pdf) do (
    echo Found: %%~nxf (%%~zf bytes)
)
echo.
echo PDF discovery scan complete!
goto end

:view_pdf_stats
echo.
echo 📈 Viewing PDF Processing Statistics...
echo ======================================
echo.
if exist "prajna_pdf_knowledge.json" (
    echo ✅ PDF Knowledge Base Found!
    python -c "import json; data=json.load(open('prajna_pdf_knowledge.json')); print(f'📚 Total PDFs: {len(data.get(\"pdf_documents\", []))}'); print(f'📃 Total Pages: {sum(doc.get(\"pages\", 0) for doc in data.get(\"pdf_documents\", []))}'); print(f'📅 Last Updated: {data.get(\"metadata\", {}).get(\"processing_date\", \"Unknown\")}');"
) else (
    echo ❌ No PDF knowledge base found yet
    echo    Try option 1, 2, or 3 first to process PDFs
)
echo.
if exist "prajna_pdf_concepts.json" (
    echo ✅ PDF Concepts Index Found!
    python -c "import json; data=json.load(open('prajna_pdf_concepts.json')); print(f'🧠 Unique PDF Concepts: {len(data.get(\"concepts\", {}))}'); print(f'📄 Document Types: {list(data.get(\"document_types\", {}).keys())}');"
) else (
    echo ❌ No PDF concepts index found yet
    echo    Try option 1, 2, or 3 first to process PDFs
)
goto end

:test_dependencies
echo.
echo 🧠 Testing System Dependencies...
echo =================================
echo.
echo Checking PDF processing dependencies...
python -c "try: import PyPDF2; print('✅ PyPDF2 available'); except: print('❌ PyPDF2 not installed - run: pip install PyPDF2')"
python -c "try: import fitz; print('✅ PyMuPDF available (recommended)'); except: print('💡 PyMuPDF not installed - run: pip install PyMuPDF')"
echo.
echo Checking if data directory exists...
if exist "C:\Users\jason\Desktop\tori\kha\data" (
    echo ✅ Data directory found
) else (
    echo ❌ Data directory not found
)
echo.
echo Checking if FIXED Python script exists...
if exist "ingest_pdfs_only_FIXED.py" (
    echo ✅ FIXED PDF processor found
) else (
    echo ❌ FIXED PDF processor not found
)
goto end

:exit
echo.
echo 👋 Goodbye! Prajna's PDF consciousness awaits more documents.
pause
exit /b 0

:end
echo.
echo ✅ PDF Operation completed!
echo.
if exist "prajna_pdf_knowledge.json" (
    echo 📚 Check your results in the JSON files:
    echo    📄 prajna_pdf_knowledge.json
    echo    🧠 prajna_pdf_concepts.json
) else (
    echo 💡 If processing failed, try option 6 to check dependencies
)
echo.
set /p continue="Press Enter to return to menu or 'q' to quit: "
if /i "%continue%"=="q" goto exit

:menu
cls
color 0C
echo.
echo  📚🧠 PRAJNA PDF-ONLY FEEDING SYSTEM - FIXED VERSION 🧠📚
echo =======================================================
echo.
echo Welcome to Prajna's PDF-Only Ingestion System!
echo ✅ NOW SAVES RESULTS TO JSON FILES FOR STATS VIEWING!
echo.
echo 📂 Data directory: C:\Users\jason\Desktop\tori\kha\data
echo 📄 File types: PDF DOCUMENTS ONLY
echo 💾 Output files: prajna_pdf_knowledge.json, prajna_pdf_concepts.json
echo.
echo This system will:
echo ✅ Scan ONLY for PDF files (.pdf)
echo ✅ Extract text content from PDFs
echo ✅ Analyze document metadata (title, author, subject)
echo ✅ Extract concepts and keywords
echo ✅ Classify document types (academic, technical, etc.)
echo ✅ Feed processed knowledge to Prajna's consciousness
echo ✅ SAVE RESULTS TO JSON FILES FOR VIEWING!
echo.
echo Choose your PDF ingestion method:
echo.
echo [1] 🚀 MASSIVE PDF BATCH PROCESSING (FIXED)
echo     - Process ALL PDFs in your data directory
echo     - Advanced text extraction and analysis
echo     - Saves results to JSON files
echo     - High-performance parallel processing
echo.
echo [2] 🎯 LIMITED PDF PROCESSING - Testing (FIXED)
echo     - Process first 10 PDFs only
echo     - Good for testing the system
echo     - Saves results to JSON files
echo.
echo [3] 📊 SINGLE PDF TEST (FIXED)
echo     - Process just 1 PDF for testing
echo     - Fastest way to verify system works
echo     - Saves results to JSON files
echo.
echo [4] 🔍 PDF DISCOVERY SCAN
echo     - Just scan and count PDF files
echo     - No processing, just discovery
echo     - See what PDFs are available
echo.
echo [5] 📈 VIEW PDF PROCESSING STATS
echo     - Show previous PDF processing results
echo     - PDF knowledge base summary
echo.
echo [6] 🧠 TEST SYSTEM DEPENDENCIES
echo     - Check if PDF libraries are installed
echo     - Verify system is ready
echo.
echo [0] Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto massive_pdf_batch_fixed
if "%choice%"=="2" goto limited_pdf_test_fixed
if "%choice%"=="3" goto single_pdf_test
if "%choice%"=="4" goto pdf_discovery
if "%choice%"=="5" goto view_pdf_stats
if "%choice%"=="6" goto test_dependencies
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
pause
goto menu
