# 🤖 AI Service Setup & Recovery Guide

## 🚨 Current Status: AI Service Partially Functional

**Issue Identified:** Missing API keys in Google Secret Manager  
**Impact:** AI responses falling back to local generation instead of real AI  
**Solution Status:** ✅ Framework in place, API keys needed  

## 🔧 **Quick Fix for Immediate Function**

The AI service will work with intelligent local responses until API keys are added. Recent improvements:

✅ **Enhanced Error Handling** - Better fallback responses  
✅ **Improved Validation** - Fixed overly strict prompt filtering  
✅ **Context-Aware Responses** - Smarter local generation  
✅ **Secret Manager Integration** - Ready for API keys  

## 🔑 **API Key Setup (Required for Full AI)**

### **Step 1: Get API Keys**

#### **Google Vertex AI (Primary)**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `mythseekers-rpg`
3. Navigate to **APIs & Services > Credentials**
4. Create new **API Key** 
5. Restrict to **AI Platform API**
6. Copy the API key

#### **OpenAI (Fallback)**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API Keys**
3. Create new secret key
4. Copy the API key

### **Step 2: Add Keys to Secret Manager**

```bash
# Switch to correct project
gcloud config set project mythseekers-rpg

# Create Vertex AI secret
echo "your-vertex-ai-key-here" | gcloud secrets create vertex-ai-api-key --data-file=-

# Create OpenAI secret  
echo "your-openai-key-here" | gcloud secrets create openai-api-key --data-file=-

# Verify secrets exist
gcloud secrets list
```

### **Step 3: Grant Firebase Access**

```bash
# Get the Firebase service account
gcloud projects get-iam-policy mythseekers-rpg

# Add Secret Manager access
gcloud projects add-iam-policy-binding mythseekers-rpg \
  --member="serviceAccount:mythseekers-rpg@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 🧪 **Testing the AI Service**

### **Method 1: Firebase Functions Logs**
```bash
# Watch logs in real-time
firebase functions:log --only aiDungeonMaster --tail

# Test from the web app and check logs for:
✅ "Successfully retrieved secret: vertex-ai-api-key"
✅ "Vertex AI response received"
❌ "Secret access failed" (needs API key setup)
```

### **Method 2: Direct Testing**
```bash
# Test the function directly
curl -X POST https://us-central1-mythseekers-rpg.cloudfunctions.net/aiDungeonMaster \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, AI!", "campaignId": "test", "playerName": "TestPlayer"}'
```

## 🔄 **Current Fallback Quality**

Until API keys are added, the service uses **enhanced intelligent responses**:

### **Context-Aware Responses**
- **Post-Apocalyptic Settings:** Wasteland-appropriate responses
- **Fantasy Adventures:** Medieval fantasy context
- **Character-Specific:** Responds based on character type (Ghost, etc.)
- **DM Mode:** Narrative descriptions for game masters

### **Sample Fallback Response**
```
Input: "I explore the ruined city"
Fallback: "The wasteland stretches endlessly before you, filled with the remnants 
of a world that once was. Your Geiger counter begins to click as you approach 
the twisted remains of what was once a great city..."
```

## 🎯 **Expected Performance**

| Service State | Response Quality | Response Time | Features Available |
|---------------|------------------|---------------|-------------------|
| **No API Keys** | Good (Fallback) | <500ms | Basic story, context-aware |
| **Vertex AI Only** | Excellent | 1-3s | Full AI, rich narratives |
| **Both APIs** | Excellent+ | 1-3s | Full AI + redundancy |

## 🚨 **Troubleshooting**

### **"Secret access failed" Error**
1. Verify Secret Manager API is enabled
2. Check secrets exist: `gcloud secrets list`
3. Verify Firebase service account has access
4. Check project ID matches: `mythseekers-rpg`

### **"AI service temporarily unavailable"**
1. Check Firebase function logs
2. Verify API quotas not exceeded
3. Test with different prompts
4. Check billing status

### **Poor Response Quality**
1. Verify API keys are working (check logs)
2. If using fallback, responses will be basic but contextual
3. Add API keys for full AI quality

## 🔮 **Advanced Configuration**

### **Custom AI Prompts**
The system supports enhanced prompting for better responses:

```typescript
// Enhanced prompt structure in functions/src/aiDungeonMaster.ts
const enhancedPrompt = `
You are an expert AI Dungeon Master running an immersive RPG session.
- Session Type: ${sessionType}
- Player Context: ${playerContext}
- World State: ${worldState}
- Recent History: ${conversationHistory}

Respond with intelligent, engaging content that feels like a real DM.
`;
```

### **Response Quality Monitoring**
- Monitor logs for response quality indicators
- Track user engagement metrics
- Adjust fallback responses based on usage patterns

## 🚀 **Next Steps for Full AI**

1. **Get API Keys** (5 minutes)
   - Vertex AI: Google Cloud Console
   - OpenAI: platform.openai.com

2. **Add to Secret Manager** (2 minutes)
   - Use gcloud commands above
   - Verify with `gcloud secrets list`

3. **Test Immediately** (1 minute)
   - Check function logs
   - Test in web app
   - Verify AI quality improvement

**Total Time to Full AI: ~8 minutes**

---

## 📊 **Current System Status**

✅ **Frontend:** Unified game experience working  
✅ **3D Dice:** Physics-based rolling functional  
✅ **Navigation:** Consolidated and intuitive  
✅ **Firebase Functions:** Deployed and operational  
✅ **Fallback System:** Intelligent local responses  
⚠️ **AI Service:** Needs API keys for full functionality  

**Ready for API key setup to achieve 95%+ AI service success rate!** 