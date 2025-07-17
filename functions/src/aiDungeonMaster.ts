import * as functions from 'firebase-functions';
import admin from './init';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fetch from 'node-fetch';
import { validateAIPrompt, checkRateLimit } from './validation';

const db = admin.firestore();
const secretClient = new SecretManagerServiceClient();

// Enhanced rate limiting configuration
const RATE_LIMITS = {
  aiDungeonMaster: { requests:15windowMs: 60000 }, // 15 requests per minute
  aiDungeonMasterPremium: { requests:30 windowMs: 60000// 30 requests per minute for premium users
};

// Helper to access secrets with caching
const secretCache = new Map<string, { value: string; expires: number }>();
async function getSecret(secretName: string): Promise<string> {
  const cacheKey = secretName;
  const now = Date.now();
  
  // Check cache first
  const cached = secretCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return cached.value;
  }
  
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${secretName}/versions/latest`
    });
    const value = version.payload?.data?.toString() || '';
    
    // Cache for1ur
    secretCache.set(cacheKey, { value, expires: now + 3600000 });
    return value;
  } catch (error) {
    console.error(`Failed to access secret ${secretName}:`, error);
    throw new Error(`Secret access failed: ${secretName}`);
  }
}

// Enhanced Vertex AI Gemini Pro integration
async function callVertexAIGeminiPro(prompt: string, context: string, apiKey: string): Promise<string> {
  
  // Enhanced prompt engineering for better RPG responses
  const enhancedPrompt = `You are an expert AI Dungeon Master for a tabletop RPG game. You must respond with engaging, dynamic storytelling that adapts to player actions.

CONTEXT:
${context}

PLAYER INPUT:
${prompt}

INSTRUCTIONS:
- Respond in character as the Dungeon Master
- Be descriptive and atmospheric
- Provide 3-4 meaningful choices for the player
- Consider the campaign context and history
- Keep responses engaging but concise
- Use natural, conversational language
- Include environmental details and NPC reactions
- Make the world feel alive and responsive

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "narrative": "Your descriptive response to the player's action,",
  "choices": ["Choice1", "Choice2", "Choice 3", "Choice4"],
  "atmosphere": {
    "mood": "current mood",
    "tension": "low|medium|high",
    "environmentalDetails": "specific details about surroundings"
  }
}

Ensure your response is valid JSON and maintains the immersive RPG experience.`;

  const requestBody = {
    contents: [{
        parts: [{
            text: enhancedPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.8, maxOutputTokens: 2048
      topP:0.9, topK: 40
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  try {
    const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GCLOUD_PROJECT}/locations/us-central1/publishers/google/models/gemini-pro:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'MythSeeker-AI-DM/10'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI API error:', response.status, errorText);
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      
      // Validate JSON response
      try {
        const parsed = JSON.parse(content);
        if (parsed.narrative && parsed.choices) {
          return content;
        }
      } catch (parseError) {
        // If not valid JSON, wrap in proper format
        return JSON.stringify({
          narrative: content,
          choices: ["Continue exploring", "Ask questions", "Take action", "Rest and recover"],
          atmosphere: {
            mood: "neutral",
            tension: "medium",
            environmentalDetails: "The adventure continues..."
          }
        });
      }
    }
    
    throw new Error('Invalid response format from Vertex AI');
  } catch (error) {
    console.error('Vertex AI call failed:', error);
    throw error;
  }
}

// Enhanced error handling and logging
function logAIRequest(userId: string, campaignId: string, promptLength: number, responseTime: number, success: boolean, error?: string) {
  const logEntry = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    userId,
    campaignId,
    promptLength,
    responseTime,
    success,
    error: error || null,
    model: 'gemini-pro',
    version: 1.0 };
  
  // Log to Firestore for monitoring
  db.collection('ai_logs').add(logEntry).catch(err => {
    console.error('Failed to log AI request:', err);
  });
  
  // Also log to console for immediate debugging
  console.log('AI Request Log:', logEntry);
}

// Main enhanced function
export const aiDungeonMaster = functions.https.onCall(async (data, context) => {
  const startTime = Date.now();
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  
  // Enhanced rate limiting with user tier support
  const userTier = await getUserTier(userId);
  const rateLimit = userTier === 'premium' ? RATE_LIMITS.aiDungeonMasterPremium : RATE_LIMITS.aiDungeonMaster;
  
  if (!checkRateLimit(userId, 'aiDungeonMaster', rateLimit.requests, rateLimit.windowMs)) {
    logAIRequest(userId, data.campaignId || 'unknown', data.prompt?.length || 0, Date.now() - startTime, false, 'Rate limit exceeded');
    throw new functions.https.HttpsError('resource-exhausted', 
      `Rate limit exceeded. You can make ${rateLimit.requests} AI requests per minute. Please wait before making another request.`);
  }

  // Validate input data
  const validation = validateAIPrompt(data);
  if (!validation.isValid) {
    logAIRequest(userId, data.campaignId || 'unknown', data.prompt?.length || 0, Date.now() - startTime, false, `Validation failed: ${validation.errors.join(', ')}`);
    throw new functions.https.HttpsError('invalid-argument', `Invalid AI prompt data: ${validation.errors.join(', ')}`);
  }

  const { campaignId, prompt, playerName } = validation.sanitizedData;
  
  if (!campaignId || !prompt) {
    logAIRequest(userId, campaignId || 'unknown', prompt?.length || 0, Date.now() - startTime, false, 'Missing campaignId or prompt');
    throw new functions.https.HttpsError('invalid-argument', 'Missing campaignId or prompt');
  }

  try {
    // Get campaign doc with enhanced error handling
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();
    
    if (!campaignSnap.exists) {
      logAIRequest(userId, campaignId, prompt.length, Date.now() - startTime, false, 'Campaign not found');
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }

    // Verify user is a participant in the campaign
    const campaignData = campaignSnap.data();
    if (!campaignData?.participants?.[userId] && !campaignData?.players?.some((p: any) => p.id === userId)) {
      logAIRequest(userId, campaignId, prompt.length, Date.now() - startTime, false, 'User not participant in campaign');
      throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this campaign');
    }

    // Enhanced context gathering
    const [rulesSnap, historySnap, worldStateSnap] = await Promise.all([
      campaignRef.collection('rules').doc('main').get(),
      campaignRef.collection('history').doc('main').get(),
      campaignRef.collection('worldState').doc('current').get()
    ]);

    const rules = rulesSnap.exists ? rulesSnap.data()?.content || '' : '';
    const history = historySnap.exists ? historySnap.data()?.content || ''; 
    const worldState = worldStateSnap.exists ? worldStateSnap.data() || {} : {};

    // Enhanced context composition
    const contextText = `CAMPAIGN RULES:
${rules}

WORLD STATE:
${JSON.stringify(worldState, null, 2)}

HISTORY SO FAR:
${history}

PLAYER NAME: ${playerName}`;

    // Get Vertex AI API key from Secret Manager
    const apiKey = await getSecret('vertex-ai-api-key');

    // Call enhanced Vertex AI
    const aiResponse = await callVertexAIGeminiPro(prompt, contextText, apiKey);
    const responseTime = Date.now() - startTime;

    // Log successful request
    logAIRequest(userId, campaignId, prompt.length, responseTime, true);

    // Update campaign history with enhanced data
    const historyUpdate = {
      content: history + `\n${new Date().toISOString()}: ${playerName}: ${prompt}\nDM: ${aiResponse}`,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      totalRequests: admin.firestore.FieldValue.increment(1)
    };
    
    await campaignRef.collection('history').doc('main').set(historyUpdate, { merge: true });

    return {      response: aiResponse,
      metadata: {
        responseTime,
        model: 'gemini-pro',
        userTier,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logAIRequest(userId, campaignId || 'unknown', prompt?.length || 0, responseTime, false, errorMessage);
    
    console.error('AI Dungeon Master error:', error);
    
    // Provide more specific error messages
    if (errorMessage.includes('Vertex AI API error')) {
      throw new functions.https.HttpsError('internal', 'AI service is experiencing high demand. Please try again in a moment.');
    } else if (errorMessage.includes('Secret access failed')) {
      throw new functions.https.HttpsError('internal', 'AI service configuration error. Please contact support.');
    } else {
      throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable. Please try again later.');
    }
  }
});

// Helper function to get user tier (free/premium)
async function getUserTier(userId: string): Promise<'free' | 'premium'> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData?.tier === 'premium' ? 'premium' : 'free';
    }
    return 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
} 