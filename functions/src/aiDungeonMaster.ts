import * as functions from 'firebase-functions';
import admin from './init';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fetch from 'node-fetch';
import { validateAIPrompt, checkRateLimit } from './validation';

const db = admin.firestore();
const secretClient = new SecretManagerServiceClient();

// Enhanced rate limiting configuration
const RATE_LIMITS = {
  aiDungeonMaster: { requests: 15, windowMs: 60000 }, // 15 requests per minute
  aiDungeonMasterPremium: { requests: 30, windowMs: 60000 } // 30 requests per minute for premium users
};

// Helper to access secrets with caching
const secretCache = new Map<string, { value: string; expires: number }>();
// Enhanced secret management with better error handling
async function getSecret(secretName: string): Promise<string> {
  const cacheKey = secretName;
  const cached = secretCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && cached.expires > now) {
    return cached.value;
  }

  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${secretName}/versions/latest`
    });
    const value = version.payload?.data?.toString() || '';
    
    if (!value || value.trim() === '') {
      throw new Error(`Empty secret value for ${secretName}`);
    }
    
    // Cache for 1 hour
    secretCache.set(cacheKey, { value, expires: now + 3600000 });
    console.log(`✅ Successfully retrieved secret: ${secretName}`);
    return value;
  } catch (error: any) {
    console.error(`❌ Failed to access secret ${secretName}:`, error);
    
    // Check if it's a missing secret vs access error
    if (error?.message?.includes('not found') || error?.message?.includes('does not exist')) {
      console.log(`⚠️ Secret ${secretName} does not exist - needs to be created in Secret Manager`);
      throw new Error(`Secret not found: ${secretName}. Please create this secret in Google Secret Manager.`);
    } else {
      console.log(`⚠️ Secret ${secretName} access denied - check IAM permissions`);
      throw new Error(`Secret access failed: ${secretName}. Check IAM permissions.`);
    }
  }
}

// OpenAI fallback integration
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'I understand your message, but I need a moment to think...';
}

// Intelligent local response generator  
function generateIntelligentLocalResponse(prompt: string, context: any): string {
  console.log('🧠 Generating intelligent local response...');
  
  // Analyze prompt for character information
  const isGhostCharacter = prompt.includes('You are Ghost') || prompt.includes('Ghost,');
  const isDMPrompt = prompt.includes('You are SAGE') || prompt.includes('Dungeon Master');
  const isPostApocalyptic = prompt.includes('Post-Apocalyptic') || prompt.includes('wasteland');
  
  if (isGhostCharacter && isPostApocalyptic) {
    const ghostResponses = [
      "*scans the area nervously* Something's not right here. We should move quickly and quietly.",
      "*checks their gear* The radiation's getting worse. We need to find shelter soon.",
      "*whispers* I hear movement... could be raiders. Stay low and follow my lead.",
      "*examines some debris* This place was hit hard. Might be useful scrap, but watch for traps.",
      "*looks around cautiously* Too quiet. In the wasteland, quiet usually means danger.",
      "*adjusts their mask* Air's getting thick. We don't want to stay here long."
    ];
    return ghostResponses[Math.floor(Math.random() * ghostResponses.length)];
  }
  
  if (isDMPrompt && isPostApocalyptic) {
    const dmResponses = [
      "The wasteland stretches endlessly before you, filled with the remnants of a world that once was. The air shimmers with heat and radiation as you make your way through the desolate landscape.",
      "In the distance, you see the twisted remains of what was once a great city. The wind carries with it the sound of metal creaking and the distant howl of some unknown creature.",
      "Your Geiger counter begins to click more rapidly as you approach a particularly devastated area. The ground here is still scarred from whatever catastrophe befell this place.",
      "As you move through the ruins, you notice signs of recent activity - footprints in the dust, disturbed debris. You're not alone in this wasteland."
    ];
    return dmResponses[Math.floor(Math.random() * dmResponses.length)];
  }
  
  // Generic intelligent responses
  const genericResponses = [
    "The story continues to unfold as your actions shape the world around you.",
    "Your choices have consequences in this adventure. What will you do next?",
    "The realm responds to your presence as new possibilities emerge.",
    "Adventure awaits as you navigate the challenges ahead."
  ];
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

// Enhanced Vertex AI Gemini Pro integration
async function callVertexAIGeminiPro(prompt: string, context: any, apiKey: string): Promise<string> {
  
  // Extract context information
  const session = context?.session || {};
  const player = context?.player || {};
  const world = context?.world || {};
  const history = context?.history || [];
  
  // Build rich context for the AI
  const sessionInfo = `
SESSION DETAILS:
- Phase: ${session.currentPhase || 'exploration'}
- Realm: ${session.config?.realm || 'Fantasy'}
- Theme: ${session.config?.theme || 'Adventure'}
- DM Style: ${session.config?.dmStyle || 'balanced'}
- Content Rating: ${session.config?.rating || 'PG-13'}
- Players: ${session.players?.map((p: any) => p.name).join(', ') || 'Unknown'}
`;

  const playerInfo = `
PLAYER CONTEXT:
- Name: ${player.name || 'Adventurer'}
- Character Class: ${player.characterClass || 'Hero'}
- Experience Level: ${player.experience || 'intermediate'}
- Preferences: ${player.preferences?.join(', ') || 'None specified'}
`;

  const worldInfo = `
WORLD STATE:
- Current Location: ${world.locations?.current || 'Unknown'}
- Atmosphere: ${world.atmosphere?.mood || 'neutral'} (${world.atmosphere?.tension || 'medium'} tension)
- Active Quests: ${world.activeQuests?.length || 0}
- NPCs Present: ${world.npcs?.length || 0}
- Environmental Details: ${world.atmosphere?.environmentalDetails || 'Standard environment'}
`;

  const conversationHistory = history.length > 0 ? `
RECENT CONVERSATION:
${history.map((msg: any) => `${msg.type}: ${msg.content}`).join('\n')}
` : 'This is the beginning of the conversation.';

  // Enhanced prompt engineering for Gemini-quality responses
  const enhancedPrompt = `You are an expert AI Dungeon Master running an immersive, dynamic RPG session. You must respond with the same level of intelligence, creativity, and engagement that users experience when talking to Gemini directly.

${sessionInfo}
${playerInfo}
${worldInfo}
${conversationHistory}

PLAYER'S LATEST ACTION: ${prompt}

RESPONSE REQUIREMENTS:
1. **Be Conversational & Natural**: Respond like you're having a real conversation, not reading from a script
2. **Show Intelligence**: Reference past events, remember NPCs, acknowledge player choices
3. **Be Descriptive**: Paint vivid pictures with words, include sensory details
4. **Provide Meaningful Choices**: Give 3-4 options that actually matter and lead to different outcomes
5. **Adapt to Player Style**: If they're cautious, offer safe options. If they're bold, present challenges
6. **Maintain Continuity**: Reference previous actions, consequences, and world changes
7. **Be Engaging**: Use humor, tension, mystery, and emotional hooks appropriately
8. **Show Personality**: Let your DM style shine through in your responses

RESPONSE FORMAT:
Respond with a JSON object:
{
  "narrative": "Your rich, descriptive response that feels like a real DM talking to a player",
  "choices": ["Meaningful choice 1", "Meaningful choice 2", "Meaningful choice 3", "Meaningful choice 4"],
  "atmosphere": {
    "mood": "current emotional tone",
    "tension": "low|medium|high",
    "environmentalDetails": "specific sensory details about the surroundings"
  },
  "worldUpdates": {
    "newLocation": "if location changed",
    "newNPCs": ["any new characters introduced"],
    "questProgress": "any quest updates",
    "consequences": ["immediate consequences of player's action"]
  },
  "characterUpdates": {
    "xpGain": 0,
    "healthChange": 0,
    "newItems": [],
    "reputationChanges": {}
  }
}

Make this feel like the best human DM you've ever played with - intelligent, responsive, and genuinely engaging.`;

  const requestBody = {
    contents: [{
        parts: [{
            text: enhancedPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.85, // Slightly higher for more creativity
      maxOutputTokens: 3072, // Increased for richer responses
      topP: 0.95,
      topK: 40
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
        'User-Agent': 'MythSeeker-AI-DM/2.0'
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
          },
          worldUpdates: {},
          characterUpdates: {}
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
    version: 1.0
  };
  
  // Log to Firestore for monitoring
  db.collection('ai_logs').add(logEntry).catch(err => {
    console.error('Failed to log AI request:', err);
  });
  
  // Also log to console for immediate debugging
  console.log('AI Request Log:', logEntry);
}

// Helper functions to parse AI responses for updates
function parseWorldStateUpdates(aiResponse: string): Record<string, any> {
  const updates: Record<string, any> = {};
  
  // Look for patterns that indicate world state changes
  const worldStatePatterns = [
    /(?:new location|moved to|arrived at|entered):\s*([^.!?]+)/gi,
    /(?:weather changed to|weather is now):\s*([^.!?]+)/gi,
    /(?:time is now|current time):\s*([^.!?]+)/gi,
    /(?:new npc|met|encountered):\s*([^.!?]+)/gi
  ];

  worldStatePatterns.forEach((pattern, index) => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      switch (index) {
        case 0:
          updates.currentLocation = matches[1].trim();
          break;
        case 1:
          updates.weather = matches[1].trim();
          break;
        case 2:
          updates.timeOfDay = matches[1].trim();
          break;
        case 3:
          if (!updates.npcs) updates.npcs = [];
          updates.npcs.push(matches[1].trim());
          break;
      }
    }
  });

  return updates;
}

function parsePlayerMemoryUpdates(aiResponse: string, playerName: string): Array<any> {
  const updates: Array<any> = [];
  
  // Look for patterns that indicate player actions and outcomes
  const playerActionPatterns = [
    new RegExp(`${playerName}\\s+(?:chose|decided|opted)\\s+to\\s+([^.!?]+)`, 'gi'),
    new RegExp(`${playerName}\\s+(?:successfully|failed to)\\s+([^.!?]+)`, 'gi'),
    new RegExp(`${playerName}\\s+(?:gained|lost|found)\\s+([^.!?]+)`, 'gi')
  ];

  playerActionPatterns.forEach((pattern, index) => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      updates.push({
        action: matches[1].trim(),
        outcome: index === 1 ? (aiResponse.includes('successfully') ? 'success' : 'failure') : 'completed',
        timestamp: Date.now()
      });
    }
  });

  return updates;
}

function parseNPCMemoryUpdates(aiResponse: string): Array<any> {
  const updates: Array<any> = [];
  
  // Look for patterns that indicate NPC interactions and relationship changes
  const npcPatterns = [
    /(?:npc|character)\s+([^.!?]+?)\s+(?:is|became|now)\s+([^.!?]+)/gi,
    /([^.!?]+?)\s+(?:reacted|responded)\s+([^.!?]+)/gi,
    /([^.!?]+?)\s+(?:likes|dislikes|trusts|distrusts)\s+([^.!?]+)/gi
  ];

  npcPatterns.forEach((pattern, index) => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      updates.push({
        name: matches[1].trim(),
        traits: [matches[2].trim()],
        relationship: index === 2 ? matches[2].trim() : 'neutral',
        timestamp: Date.now()
      });
    }
  });

  return updates;
}

// Enhanced AI Dungeon Master with multi-tier fallback system
export const aiDungeonMaster = functions.https.onCall(async (data: any, context) => {
  return await handleAIDungeonMasterLogic(data, context);
});

// Export the main logic as a separate function for reuse
export async function handleAIDungeonMasterLogic(data: any, context: any) {
  const startTime = Date.now();
  let userId = 'anonymous';
  let campaignId = 'unknown';

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  userId = context.auth.uid;
  
  // Enhanced rate limiting with user tier support
  const userTier = await getUserTier(userId);
  const rateLimit = userTier === 'premium' ? RATE_LIMITS.aiDungeonMasterPremium : RATE_LIMITS.aiDungeonMaster;
  
  if (!checkRateLimit(userId, 'aiDungeonMaster', rateLimit.requests, rateLimit.windowMs)) {
    logAIRequest(userId, data.campaignId || 'unknown', data.prompt?.length || 0, Date.now() - startTime, false, 'Rate limit exceeded');
    throw new functions.https.HttpsError('resource-exhausted', 
      `Rate limit exceeded. You can make ${rateLimit.requests} AI requests per minute. Please wait before making another request.`);
  }

  // Enhanced logging for debugging
  console.log('🔍 AI Dungeon Master - Received data:', JSON.stringify({
    hasPrompt: !!data.prompt,
    hasCampaignId: !!data.campaignId,
    hasPlayerName: !!data.playerName,
    hasContext: !!data.context,
    promptLength: data.prompt?.length || 0,
    campaignId: data.campaignId,
    dataKeys: Object.keys(data || {})
  }));

  // Validate input data
  const validation = validateAIPrompt(data);
  if (!validation.isValid) {
    console.error('❌ Validation failed for data:', JSON.stringify(data, null, 2));
    console.error('❌ Validation errors:', validation.errors);
    logAIRequest(userId, data.campaignId || 'unknown', data.prompt?.length || 0, Date.now() - startTime, false, `Validation failed: ${validation.errors.join(', ')}`);
    throw new functions.https.HttpsError('invalid-argument', `Invalid AI prompt data: ${validation.errors.join(', ')}`);
  }

  const { prompt, playerName, rating } = validation.sanitizedData;
  campaignId = validation.sanitizedData.campaignId;
  
  if (!campaignId || !prompt) {
    logAIRequest(userId, campaignId || 'unknown', prompt?.length || 0, Date.now() - startTime, false, 'Missing campaignId or prompt');
    throw new functions.https.HttpsError('invalid-argument', 'Missing campaignId or prompt');
  }

  try {
    // Handle automated game sessions vs regular campaigns
    let campaignData = null;
    let isAutomatedSession = campaignId === 'sentient-ai-session' || 
                           campaignId === 'default-campaign' || 
                           campaignId.startsWith('automated-') ||
                           campaignId.startsWith('auto_');
    
    if (!isAutomatedSession) {
      // Get campaign doc for regular campaigns
      const campaignRef = db.collection('campaigns').doc(campaignId);
      const campaignSnap = await campaignRef.get();
      
      if (!campaignSnap.exists) {
        console.log(`⚠️ Campaign ${campaignId} not found in Firebase, treating as automated session`);
        // Instead of throwing error, treat as automated session
        isAutomatedSession = true;
        campaignData = {
          name: 'Local Campaign Session',
          setting: 'Dynamic',
          participants: { [userId]: true }
        };
      } else {
        campaignData = campaignSnap.data();
        
        // Verify user is a participant in the campaign
        if (!campaignData?.participants?.[userId] && !campaignData?.players?.some((p: any) => p.id === userId)) {
          logAIRequest(userId, campaignId, prompt.length, Date.now() - startTime, false, 'User not participant in campaign');
          throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this campaign');
        }
      }
    } else {
      // For automated sessions, create a minimal campaign context
      campaignData = {
        name: 'Automated Game Session',
        setting: 'Dynamic',
        participants: { [userId]: true }
      };
    }

    // Enhanced context gathering
    // Get rules and history (for future context enhancement)
    // const [rulesSnap, historySnap] = await Promise.all([
    //   campaignRef.collection('rules').doc('main').get(),
    //   campaignRef.collection('history').doc('main').get()
    // ]);

    // Get rules and history data (available for future enhancements)
    // const rules = rulesSnap.exists ? rulesSnap.data()?.content || '' : '';
    // const history = historySnap.exists ? historySnap.data()?.content || '' : '';

    // Get the current game session data for world state and memory
    const gameSessionRef = db.collection('games').doc(campaignId);
    const gameSessionSnap = await gameSessionRef.get();
    const gameSessionData = gameSessionSnap.exists ? gameSessionSnap.data() : {};
    
    const sessionWorldState = gameSessionData?.worldState || {};
    const playerMemory = gameSessionData?.playerMemory || [];
    const npcMemory = gameSessionData?.npcMemory || [];

    // Get Vertex AI API key from Secret Manager with error handling
    let aiResponse: string;
    try {
      console.log('🔑 Attempting to get API key from Secret Manager...');
      const apiKey = await getSecret('vertex-ai-api-key');
      console.log('✅ API key retrieved, calling Vertex AI...');
      
      // Call enhanced Vertex AI with full context
      aiResponse = await callVertexAIGeminiPro(prompt, data.context || { session: { config: { rating: rating || 'PG-13' } } }, apiKey);
      console.log('✅ Vertex AI response received');
      
    } catch (secretError) {
      console.error('❌ Secret Manager or Vertex AI failed:', secretError);
      
      // Try OpenAI as fallback
      try {
        console.log('🔄 Trying OpenAI as fallback...');
        const openaiKey = await getSecret('openai-api-key');
        aiResponse = await callOpenAI(prompt, openaiKey);
        console.log('✅ OpenAI fallback succeeded');
      } catch (openaiError) {
        console.error('❌ OpenAI fallback also failed:', openaiError);
        
        // Use intelligent local response as last resort
        console.log('🔄 Using intelligent local response...');
        aiResponse = generateIntelligentLocalResponse(prompt, data.context);
      }
    }

    // Parse AI response for potential world state updates
    const worldStateUpdates = parseWorldStateUpdates(aiResponse);
    const playerMemoryUpdates = parsePlayerMemoryUpdates(aiResponse, playerName);
    const npcMemoryUpdates = parseNPCMemoryUpdates(aiResponse);

    // Update the game session with any new world state, player memory, or NPC memory
    if (Object.keys(worldStateUpdates).length > 0 || playerMemoryUpdates.length > 0 || npcMemoryUpdates.length > 0) {
      const updateData: any = {
        lastActivity: Date.now()
      };

      if (Object.keys(worldStateUpdates).length > 0) {
        updateData.worldState = { ...sessionWorldState, ...worldStateUpdates };
      }

      if (playerMemoryUpdates.length > 0) {
        updateData.playerMemory = [...playerMemory, ...playerMemoryUpdates];
      }

      if (npcMemoryUpdates.length > 0) {
        updateData.npcMemory = [...npcMemory, ...npcMemoryUpdates];
      }

      await gameSessionRef.update(updateData);
    }
    const responseTime = Date.now() - startTime;

    // Ensure aiResponse is always a string for frontend compatibility
    let finalResponse: string;
    if (typeof aiResponse === 'string') {
      finalResponse = aiResponse;
    } else if (typeof aiResponse === 'object') {
      // If it's a JSON object, extract the narrative content
      try {
        const parsed = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
        finalResponse = parsed.narrative || parsed.content || JSON.stringify(parsed);
      } catch (e) {
        finalResponse = JSON.stringify(aiResponse);
      }
    } else {
      finalResponse = String(aiResponse);
    }

    // Log successful request
    logAIRequest(userId, campaignId, prompt.length, responseTime, true);
    return { response: finalResponse };
  } catch (error: any) {
    logAIRequest(userId, campaignId, prompt?.length || 0, Date.now() - startTime, false, (error instanceof Error ? error.message : String(error)) || 'Unknown error');
    console.error('AI Dungeon Master error:', error);
    throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable');
  }
}

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