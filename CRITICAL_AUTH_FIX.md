# 🔴 CRITICAL: Authorization Header Required

## ❌ **Why You're Getting 403**

**You are missing this EXACT line in your curl command:**
```bash
-H "Authorization: Bearer <YOUR_TOKEN>"
```

**Without this line, you will ALWAYS get "Not authenticated" (403 error).**

## ✅ **EXACT Steps to Fix**

### **1️⃣ Login to Get Token:**
```bash
curl -X POST "http://localhost:8443/api/auth/login" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","password":"operator123"}'
```

**Response will be:**
```json
{
  "token": "eyJhbGciOiJ...etc...",
  "user_id": "operator",
  "role": "operator"
}
```

### **2️⃣ Copy the Token**
**Copy the token value** (everything between the quotes after `"token":`)

### **3️⃣ Upload with Authorization Header:**
```bash
curl -X POST "http://localhost:8443/api/upload" \
  -H "accept: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJ...etc..." \
  -F "file=@2407.15527v2.pdf;type=application/pdf"
```

**🔴 REPLACE `eyJhbGciOiJ...etc...` with your ACTUAL token!**

## 🚨 **The Critical Difference**

### **❌ WRONG (Always gets 403):**
```bash
curl -X POST "http://localhost:8443/api/upload" \
  -F "file=@2407.15527v2.pdf;type=application/pdf"
```

### **✅ CORRECT (Works!):**
```bash
curl -X POST "http://localhost:8443/api/upload" \
  -H "Authorization: Bearer YOUR_ACTUAL_TOKEN_HERE" \
  -F "file=@2407.15527v2.pdf;type=application/pdf"
```

## 📋 **Test Scripts Available**

### **Linux/Mac:**
```bash
chmod +x exact_auth_steps.sh
./exact_auth_steps.sh
```

### **Windows:**
```cmd
exact_auth_steps.bat
```

## 🎯 **Summary**

**The ONLY thing that matters:**
1. Get token from login
2. Use token in `Authorization: Bearer` header
3. SUCCESS!

**If you don't include the Authorization header = 403 EVERY TIME**

---

**Run one of the exact scripts above and you'll see it work perfectly!** 🚀
