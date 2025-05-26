@echo off
echo ╔═══════════════════════════════════════╗
echo ║ TORI Chat - Fixing Dependencies       ║
echo ║ Soliton Memory Repair Initiated       ║
echo ╚═══════════════════════════════════════╝

echo.
echo [1/4] Installing missing express-session...
npm install express-session --legacy-peer-deps

echo.
echo [2/4] Removing problematic react-codemirror2...
npm uninstall react-codemirror2

echo.
echo [3/4] Installing React 18 compatible CodeMirror...
npm install @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-css @codemirror/lang-html @codemirror/lang-json --legacy-peer-deps

echo.
echo [4/4] Installing any other missing session dependencies...
npm install express-rate-limit helmet cors --legacy-peer-deps

echo.
echo ╔═══════════════════════════════════════╗
echo ║ Dependencies Fixed! Ready for TORI    ║
echo ╚═══════════════════════════════════════╝
pause
