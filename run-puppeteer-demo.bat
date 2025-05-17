@echo off
title Puppeteer Demo
color 0A

echo ============================================
echo           Puppeteer Demo Script
echo ============================================
echo.
echo This script will:
echo  1. Launch a browser window using Puppeteer
echo  2. Navigate to Google
echo  3. Perform a search
echo  4. Take screenshots
echo  5. Extract data from the page
echo.
echo Screenshots will be saved in the current directory.
echo.
echo Press any key to start the demo, or Ctrl+C to cancel...
pause > nul

node puppeteer-demo.js

echo.
echo Demo completed. Check for screenshots in the current directory.
echo.
pause
