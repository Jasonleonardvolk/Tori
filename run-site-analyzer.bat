@echo off
title Website Analyzer
color 0E

echo ============================================
echo         Website Analyzer Tool
echo ============================================
echo.
echo This tool will:
echo  1. Launch a browser window using Puppeteer
echo  2. Analyze a website of your choice
echo  3. Generate a detailed HTML and JSON report
echo  4. Take screenshots in desktop and mobile views
echo.
echo The analysis includes SEO, accessibility, mobile-friendliness,
echo performance metrics, and more!
echo.

set /p website=Enter website URL to analyze (or press Enter for google.com): 

if "%website%"=="" (
  set website=https://www.google.com
) else (
  if not "%website:~0,4%"=="http" (
    set website=https://%website%
  )
)

echo.
echo Analyzing %website%...
echo.
echo This may take a minute or two. A browser window will open.
echo Please do not interact with it during analysis.
echo.

node puppeteer-analyzer.js %website%

echo.
echo Analysis complete! Reports are saved to:
echo  - site-analysis-report.html (open this in a browser to view)
echo  - site-analysis-report.json (raw data)
echo  - site-analysis.png (desktop screenshot)
echo  - site-analysis-mobile.png (mobile screenshot)
echo.
echo Press any key to exit...
pause > nul
