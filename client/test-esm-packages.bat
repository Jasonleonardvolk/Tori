@echo off
echo Testing ES Module compatibility with Node.js packages...
echo.
node src/esmPackageTest.js
echo.
echo To test browser compatibility, open this URL in your browser:
echo http://localhost:3000/esm-browser-test.html
echo (Make sure your React development server is running with 'npm start' or 'yarn start')
echo.
pause
