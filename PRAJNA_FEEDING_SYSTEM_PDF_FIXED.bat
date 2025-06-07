@echo off
color 0C
echo.
echo  📚🧠 PRAJNA PDF-ONLY FEEDING SYSTEM 🧠📚
echo =============================================
echo.
echo Welcome to Prajna's PDF-Only Ingestion System!
echo.
echo 📂 Data directory: C:\Users\jason\Desktop\tori\kha\data
echo 📄 File types: PDF DOCUMENTS ONLY
echo.
echo This system will:
echo ✅ Scan ONLY for PDF files (.pdf)
echo ✅ Extract text content from PDFs
echo ✅ Analyze document metadata (title, author, subject)
echo ✅ Extract concepts and keywords
echo ✅ Classify document types (academic, technical, etc.)
echo ✅ Feed processed knowledge to Prajna's consciousness
echo.
echo Choose your PDF ingestion method:
echo.
echo [1] 🚀 MASSIVE PDF BATCH PROCESSING
echo     - Process ALL PDFs in your data directory
echo     - Advanced text extraction
echo     - Concept analysis and classification
echo     - High-performance parallel processing
echo.
echo [2] 🎯 LIMITED PDF PROCESSING (Testing)
echo     - Process first 50 PDFs only
echo     - Good for testing the system
echo     - Faster completion time
echo.
echo [3] 📊 ADVANCED PDF ANALYSIS
echo     - Detailed PDF content extraction
echo     - Academic paper recognition
echo     - Technical document classification
echo     - Rich metadata preservation
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
echo [6] 🧠 TEST PRAJNA CONNECTION
echo     - Verify Prajna is ready for PDFs
echo     - Quick system health check
echo.
echo [0] Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto massive_pdf_batch
if "%choice%"=="2" goto limited_pdf_test
if "%choice%"=="3" goto advanced_pdf_analysis
if "%choice%"=="4" goto pdf_discovery
if "%choice%"=="5" goto view_pdf_stats
if "%choice%"=="6" goto test_connection
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
pause
goto menu

:massive_pdf_batch
echo.
echo 🚀 Starting Massive PDF Batch Processing...
echo =============================================
echo.
echo 📚 Processing ALL PDF files in your data directory
echo ⚡ High-performance parallel processing enabled
echo 🧠 Full text extraction and concept analysis
echo.
python ingest_pdfs_only.py --data-dir "C:\Users\jason\Desktop\tori\kha\data" --batch-size 25 --workers 3
goto end

:limited_pdf_test
echo.
echo 🎯 Starting Limited PDF Processing (50 PDFs)...
echo ===============================================
echo.
echo 📚 Processing first 50 PDF files only
echo 🧪 Perfect for testing the system
echo ⚡ Faster completion time
echo.
python ingest_pdfs_only.py --data-dir "C:\Users\jason\Desktop\tori\kha\data" --max-pdfs 50 --batch-size 10 --workers 2
goto end

:advanced_pdf_analysis
echo.
echo 📊 Starting Advanced PDF Analysis...
echo ===================================
echo.
echo 🔬 Detailed content extraction and analysis
echo 📖 Academic paper recognition
echo 📋 Technical document classification
echo 🏷️ Rich metadata preservation
echo.
python advanced_pdf_processor.py
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
    echo ✅ PDF Knowledge Base Found
    python -c "import json; data=json.load(open('prajna_pdf_knowledge.json')); print(f'📚 Total PDFs: {len(data.get(\"pdf_documents\", []))}'); print(f'📃 Total Pages: {sum(doc.get(\"pages\", 0) for doc in data.get(\"pdf_documents\", []))}'); print(f'📅 Last Updated: {data.get(\"metadata\", {}).get(\"processing_date\", \"Unknown\")}');" 2>nul
) else (
    echo ❌ No PDF knowledge base found yet
    echo Run option 1, 2, or 3 first to process PDFs
)
echo.
if exist "prajna_pdf_concepts.json" (
    echo ✅ PDF Concepts Index Found
    python -c "import json; data=json.load(open('prajna_pdf_concepts.json')); print(f'🧠 Unique PDF Concepts: {len(data.get(\"concepts\", {}))}'); print(f'📄 Document Types Found: {list(data.get(\"document_types\", {}).keys())}');" 2>nul
) else (
    echo ❌ No PDF concepts index found yet
)
goto end

:test_connection
echo.
echo 🧠 Testing Prajna Connection...
echo ==============================
echo.
echo Testing if Prajna is ready for PDF processing...
python check_prajna_status.py
echo.
echo Checking PDF processing dependencies...
python -c "try: import PyPDF2; print('✅ PyPDF2 available'); except: print('❌ PyPDF2 not installed - run: pip install PyPDF2')"
python -c "try: import fitz; print('✅ PyMuPDF available (recommended)'); except: print('💡 PyMuPDF not installed - run: pip install PyMuPDF')"
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
echo 📚 Prajna's PDF consciousness has been enhanced!
echo.
set /p continue="Press Enter to return to menu or 'q' to quit: "
if /i "%continue%"=="q" goto exit

:menu
cls
color 0C
echo.
echo  📚🧠 PRAJNA PDF-ONLY FEEDING SYSTEM 🧠📚
echo =============================================
echo.
echo Welcome to Prajna's PDF-Only Ingestion System!
echo.
echo 📂 Data directory: C:\Users\jason\Desktop\tori\kha\data
echo 📄 File types: PDF DOCUMENTS ONLY
echo.
echo This system will:
echo ✅ Scan ONLY for PDF files (.pdf)
echo ✅ Extract text content from PDFs
echo ✅ Analyze document metadata (title, author, subject)
echo ✅ Extract concepts and keywords
echo ✅ Classify document types (academic, technical, etc.)
echo ✅ Feed processed knowledge to Prajna's consciousness
echo.
echo Choose your PDF ingestion method:
echo.
echo [1] 🚀 MASSIVE PDF BATCH PROCESSING
echo     - Process ALL PDFs in your data directory
echo     - Advanced text extraction
echo     - Concept analysis and classification
echo     - High-performance parallel processing
echo.
echo [2] 🎯 LIMITED PDF PROCESSING (Testing)
echo     - Process first 50 PDFs only
echo     - Good for testing the system
echo     - Faster completion time
echo.
echo [3] 📊 ADVANCED PDF ANALYSIS
echo     - Detailed PDF content extraction
echo     - Academic paper recognition
echo     - Technical document classification
echo     - Rich metadata preservation
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
echo [6] 🧠 TEST PRAJNA CONNECTION
echo     - Verify Prajna is ready for PDFs
echo     - Quick system health check
echo.
echo [0] Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto massive_pdf_batch
if "%choice%"=="2" goto limited_pdf_test
if "%choice%"=="3" goto advanced_pdf_analysis
if "%choice%"=="4" goto pdf_discovery
if "%choice%"=="5" goto view_pdf_stats
if "%choice%"=="6" goto test_connection
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
pause
goto menu
