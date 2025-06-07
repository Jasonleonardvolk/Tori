# 🔐 TORI Authentication Troubleshooting Guide

## ✅ **The Complete Solution**

The 403 "Not authenticated" error occurs because **every protected endpoint requires a Bearer token**. Here's the complete working solution:

## 🎯 **Step-by-Step Authentication**

### **1️⃣ Get Authentication Token**
```bash
curl -X POST "http://localhost:8443/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"operator123"}'
```

**Expected Response:**
```json
{
  "token": "BXBdtRSIosgJ77U6FF-v2X9dpPWHEjoR1iuMFJEhe1Y",
  "user_id": "operator",
  "role": "operator",
  "permissions": ["view_dashboard", "view_metrics", "trigger_evolution"],
  "full_name": "Operator User"
}
```

### **2️⃣ Upload with Bearer Token (CRITICAL)**
```bash
curl -X POST "http://localhost:8443/api/upload" \
  -H "Authorization: Bearer BXBdtRSIosgJ77U6FF-v2X9dpPWHEjoR1iuMFJEhe1Y" \
  -F "file=@your_file.pdf;type=application/pdf"
```

## 🔴 **Common Mistakes & Fixes**

### **❌ WRONG - Missing Authorization Header:**
```bash
curl -X POST "http://localhost:8443/api/upload" \
  -F "file=@file.pdf"
```
**Result:** 403 "Not authenticated"

### **✅ CORRECT - With Authorization Header:**
```bash
curl -X POST "http://localhost:8443/api/upload" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@file.pdf"
```
**Result:** 200 Success

### **❌ WRONG - Observer Role (No Upload Permission):**
```bash
# Login with observer
curl -X POST "http://localhost:8443/api/auth/login" \
  -d '{"username":"observer","password":"observer123"}'
```
**Result:** Token works for login, but 403 on upload (no trigger_evolution permission)

### **✅ CORRECT - Operator+ Role:**
```bash
# Login with operator, approver, or admin
curl -X POST "http://localhost:8443/api/auth/login" \
  -d '{"username":"operator","password":"operator123"}'
```
**Result:** Token works for both login and upload

## 🎛️ **User Roles & Permissions**

| Role | Username | Password | Can Upload? | Permissions |
|------|----------|----------|-------------|-------------|
| **Observer** | `observer` | `observer123` | ❌ No | Read-only |
| **Operator** | `operator` | `operator123` | ✅ Yes | Upload + Trigger |
| **Approver** | `approver` | `approver123` | ✅ Yes | Upload + Approve |
| **Admin** | `admin` | `admin123` | ✅ Yes | Full Control |

## 🛠️ **Test Scripts Created**

### **Bash Script (Linux/Mac):**
```bash
./test_proper_auth.sh
```

### **Batch Script (Windows):**
```cmd
test_proper_auth.bat
```

### **Python Script (Cross-platform):**
```bash
python test_auth_python.py
```

## 🔍 **Debugging Steps**

### **1. Check TORI is Running:**
```bash
curl http://localhost:8443/health
```
**Expected:** `{"status":"healthy",...}`

### **2. Test Login:**
```bash
curl -X POST "http://localhost:8443/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"operator123"}'
```
**Expected:** JSON with `"token":"..."`

### **3. Test Upload with Token:**
```bash
curl -X POST "http://localhost:8443/api/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
```
**Expected:** 200 success, not 403

## 🚨 **Error Codes & Solutions**

### **403 Forbidden**
- **Cause:** Missing `Authorization: Bearer` header
- **Fix:** Add the header with valid token

### **401 Unauthorized**
- **Cause:** Invalid or expired token
- **Fix:** Get new token via login

### **400 Bad Request**
- **Cause:** Wrong file type or missing file
- **Fix:** Use `.pdf` file with correct form data

### **404 Not Found**
- **Cause:** Wrong endpoint URL
- **Fix:** Use correct endpoints: `/api/auth/login`, `/api/upload`

## 💡 **Quick Fix Commands**

### **Complete Working Example:**
```bash
# Step 1: Get token
TOKEN=$(curl -s -X POST "http://localhost:8443/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"operator123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Step 2: Upload with token
curl -X POST "http://localhost:8443/api/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@your_file.pdf;type=application/pdf"
```

### **Windows PowerShell:**
```powershell
# Step 1: Get token
$response = Invoke-RestMethod -Uri "http://localhost:8443/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"operator","password":"operator123"}'
$token = $response.token

# Step 2: Upload with token
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:8443/api/upload" `
  -Method POST -Headers $headers `
  -InFile "your_file.pdf" -ContentType "multipart/form-data"
```

## 🎆 **Success Indicators**

### **Successful Login Response:**
```json
{
  "token": "BXBdtRSIosgJ77U6FF-v2X9dpPWHEjoR1iuMFJEhe1Y",
  "user_id": "operator",
  "role": "operator",
  "permissions": ["view_dashboard", "view_metrics", "trigger_evolution"]
}
```

### **Successful Upload Response:**
```json
{
  "success": true,
  "message": "PDF uploaded successfully",
  "file_path": "uploads/your_file.pdf",
  "filename": "your_file.pdf",
  "file_size": 1234567
}
```

## 🔧 **Advanced Troubleshooting**

### **Check Active Sessions:**
Visit `http://localhost:8443/docs` and use the FastAPI interface:
1. Click "Authorize" button
2. Paste your token
3. Try endpoints through the web interface

### **Token Expiration:**
- Tokens expire after 8 hours
- Get a new token if you get 401 errors
- Sessions persist across browser refreshes (localStorage)

### **Permission Issues:**
- Observer role cannot upload (no `trigger_evolution` permission)
- Use Operator, Approver, or Admin roles for uploads
- Check user permissions in login response

## 🎯 **Summary**

The **critical requirement** is the `Authorization: Bearer` header. Without it, you will **always** get 403 errors on protected endpoints like `/api/upload` and `/api/extract`.

**Working Formula:**
1. Login → Get Token
2. Use Token in Authorization Header → Success

---
*This guide resolves all TORI authentication issues for PDF upload and concept extraction.*
