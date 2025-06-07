#!/bin/bash

# 🔐 TORI EXACT Authentication Steps - STEP BY STEP
# This script shows the EXACT commands with Authorization header

echo "🚀 TORI EXACT Authentication Steps"
echo "================================="
echo ""
echo "🔴 CRITICAL: You MUST include -H \"Authorization: Bearer <TOKEN>\" or you get 403!"
echo ""

# Step 1: Show exact login command
echo "1️⃣ STEP 1: Login to get token"
echo "Command to run:"
echo ""
echo "curl -X POST \"http://localhost:8443/api/auth/login\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"username\":\"operator\",\"password\":\"operator123\"}'"
echo ""
echo "📋 Running login now..."

# Execute login
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8443/api/auth/login" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"operator123"}')

echo "Response:"
echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$TOKEN" ]]; then
    echo "❌ Failed to get token. Make sure TORI is running!"
    exit 1
fi

echo "✅ Token extracted: $TOKEN"
echo ""

# Step 2: Show exact upload command with Authorization header
echo "2️⃣ STEP 2: Upload with Authorization header (THE CRITICAL PART)"
echo "Command to run:"
echo ""
echo "curl -X POST \"http://localhost:8443/api/upload\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -F \"file=@2407.15527v2.pdf;type=application/pdf\""
echo ""
echo "🔴 NOTICE: The -H \"Authorization: Bearer ...\" line is REQUIRED!"
echo "🔴 Without it, you get 403 EVERY TIME!"
echo ""

# Check if PDF exists, create dummy if not
PDF_FILE="2407.15527v2.pdf"
if [[ ! -f "$PDF_FILE" ]]; then
    echo "📄 Creating test PDF file: $PDF_FILE"
    echo "Test PDF content for TORI authentication" > "$PDF_FILE"
fi

echo "📋 Running upload now with Authorization header..."

# Execute upload with Authorization header
UPLOAD_RESPONSE=$(curl -s -X POST "http://localhost:8443/api/upload" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$PDF_FILE;type=application/pdf")

echo "Upload Response:"
echo "$UPLOAD_RESPONSE"
echo ""

# Check if successful
if echo "$UPLOAD_RESPONSE" | grep -q "success\|uploaded"; then
    echo "🎆 SUCCESS! Upload worked with Authorization header!"
else
    echo "❌ Upload failed. Check response above."
fi

echo ""
echo "📋 SUMMARY - These are the EXACT commands you need:"
echo ""
echo "1. Login:"
echo "   curl -X POST \"http://localhost:8443/api/auth/login\" \\"
echo "     -H \"accept: application/json\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"username\":\"operator\",\"password\":\"operator123\"}'"
echo ""
echo "2. Copy the token from the response"
echo ""
echo "3. Upload with Authorization header:"
echo "   curl -X POST \"http://localhost:8443/api/upload\" \\"
echo "     -H \"accept: application/json\" \\"
echo "     -H \"Authorization: Bearer YOUR_ACTUAL_TOKEN_HERE\" \\"
echo "     -F \"file=@2407.15527v2.pdf;type=application/pdf\""
echo ""
echo "🔴 CRITICAL: Replace YOUR_ACTUAL_TOKEN_HERE with the real token!"
echo "🔴 The Authorization header is MANDATORY!"
