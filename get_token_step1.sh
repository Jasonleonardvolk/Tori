#!/bin/bash

# Step 1: Get authentication token
echo "🔐 Step 1: Getting authentication token..."

curl -X POST "http://localhost:8443/api/auth/login" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"operator123"}'

echo ""
echo "👆 Copy the token from the response above"
echo ""
echo "🔴 CRITICAL: You MUST include the Authorization header in step 2!"
echo ""
echo "2️⃣ Next command (replace PASTE_YOUR_TOKEN_HERE):"
echo ""
echo "curl -X POST \"http://localhost:8443/api/upload\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: Bearer PASTE_YOUR_TOKEN_HERE\" \\"
echo "  -F \"file=@2407.15527v2.pdf;type=application/pdf\""
