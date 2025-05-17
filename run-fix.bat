@echo off
echo 🚀 Starting ALAN IDE Test Fix...
cd /d C:\Users\jason\Desktop\tori\kha
node master-test-fix.js > logs\fix-output.log 2>&1
echo ✅ Fix execution complete!
echo Check logs\fix-output.log for details
pause