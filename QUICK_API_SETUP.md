# 🚀 Quick API Setup Guide for MythSeeker

## ✅ **What We Just Completed**

All service accounts, permissions, and infrastructure are now properly configured! Here's what was set up:

### **1. APIs Enabled** ✅
```bash
gcloud services enable cloudfunctions.googleapis.com cloudbuild.googleapis.com storage-component.googleapis.com secretmanager.googleapis.com aiplatform.googleapis.com firebase.googleapis.com firestore.googleapis.com
```

### **2. Service Account Permissions** ✅
```bash
# Grant Secret Manager access to both Firebase service accounts
gcloud projects add-iam-policy-binding mythseekers-rpg \
  --member="serviceAccount:mythseekers-rpg@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding mythseekers-rpg \
  --member="serviceAccount:firebase-adminsdk-fbsvc@mythseekers-rpg.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant AI Platform access to both Firebase service accounts  
gcloud projects add-iam-policy-binding mythseekers-rpg \
  --member="serviceAccount:mythseekers-rpg@appspot.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding mythseekers-rpg \
  --member="serviceAccount:firebase-adminsdk-fbsvc@mythseekers-rpg.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### **3. Placeholder Secrets Created** ✅
```bash
# Created with placeholder values - ready for real API keys
echo "PLACEHOLDER_VERTEX_AI_KEY_REPLACE_WITH_REAL_KEY" | gcloud secrets create vertex-ai-api-key --data-file=-
echo "PLACEHOLDER_OPENAI_KEY_REPLACE_WITH_REAL_KEY" | gcloud secrets create openai-api-key --data-file=-
```

## 🔑 **To Add Real API Keys (5 minutes)**

### **Option 1: Get Free Vertex AI Credit**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **AI Platform** > **Vertex AI**
3. Google provides $300 in free credits for new users
4. No API key needed - uses your Google Cloud credentials automatically!

### **Option 2: Add OpenAI API Key**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create API key
3. Update the secret:
```bash
echo "your-real-openai-key-here" | gcloud secrets versions add openai-api-key --data-file=-
```

### **Option 3: Add Google AI Studio Key (Easiest)**
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Get free API key for Gemini
3. Update the secret:
```bash
echo "your-google-ai-studio-key-here" | gcloud secrets versions add vertex-ai-api-key --data-file=-
```

## 🧪 **Test the Setup**

The AI service will now:
1. ✅ **Access secrets successfully** (no more "Secret access failed" errors)
2. ⚠️ **Use intelligent fallbacks** until real API keys are added
3. ✅ **Provide proper error messages** about placeholder keys

### **Check the logs:**
```bash
firebase functions:log --only aiDungeonMaster --tail
```

### **Look for:**
✅ `"Successfully retrieved secret: vertex-ai-api-key"`  
⚠️ `"Placeholder key detected, using fallback"`  
❌ `"Secret access failed"` (should not appear anymore)

## 🎯 **Current System Status**

| Component | Status | Notes |
|-----------|---------|-------|
| **Service Accounts** | ✅ Configured | All permissions granted |
| **Secret Manager** | ✅ Ready | Placeholder secrets created |
| **Firebase Functions** | ✅ Deployed | Enhanced error handling |
| **AI Service** | ⚠️ Functional | Using intelligent fallbacks |
| **Frontend** | ✅ Production Ready | Unified game experience |

## 🚀 **Next Steps**

1. **Test the game** - Everything should work with intelligent responses
2. **Add real API key** - Choose any option above (5 minutes)
3. **Enjoy premium AI** - Immediate upgrade to high-quality responses

**The heavy lifting is done! Just add an API key when ready.** 🎉 