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

// Enhanced AI integration supporting both Vertex AI and Google AI Studio
async function callVertexAI(prompt: string, context: any, apiKey: string): Promise<string> {
  console.log('🔮 Calling Vertex AI (Gemini)...');
  
  const enrichedPrompt = buildEnrichedPrompt(prompt, context);
  
  try {
    const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GCLOUD_PROJECT}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: enrichedPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
          topP: 0.9,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH', 
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Vertex AI request failed:', response.status, errorText);
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Unexpected Vertex AI response structure:', data);
      throw new Error('Invalid response structure from Vertex AI');
    }

    const aiResponse = data.candidates[0].content.parts[0].text.trim();
    console.log('✅ Vertex AI response received:', aiResponse.substring(0, 100) + '...');
    return aiResponse;

  } catch (error: any) {
    console.error('❌ Vertex AI call failed:', error);
    throw error;
  }
}

// Enhanced Gemini AI integration using Google AI Studio API
async function callGeminiAI(prompt: string, context: any, apiKey: string): Promise<string> {
  console.log('🤖 Calling Google AI Studio (Gemini)...');
  
  const enrichedPrompt = buildEnrichedPrompt(prompt, context);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: enrichedPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
          topP: 0.9,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google AI Studio request failed:', response.status, errorText);
      throw new Error(`Google AI Studio API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Unexpected Google AI Studio response structure:', data);
      throw new Error('Invalid response structure from Google AI Studio');
    }

    const aiResponse = data.candidates[0].content.parts[0].text.trim();
    console.log('✅ Google AI Studio response received:', aiResponse.substring(0, 100) + '...');
    return aiResponse;

  } catch (error: any) {
    console.error('❌ Google AI Studio call failed:', error);
    throw error;
  }
}

// Helper function to build enriched prompts
function buildEnrichedPrompt(prompt: string, context: any): string {
  const session = context?.session || {};
  const player = context?.player || {};
  const world = context?.world || {};
  const history = context?.history || [];
  
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
PLAYER DETAILS:
- Name: ${player.name || 'Unknown'}
- Level: ${player.level || 1}
- Class: ${player.class || 'Adventurer'}
- Background: ${player.background || 'Mysterious'}
- Current HP: ${player.hp || 'Unknown'}/${player.maxHp || 'Unknown'}
`;

  const worldInfo = `
WORLD STATE:
- Location: ${world.currentLocation || 'Unknown realm'}
- Environment: ${world.environment || 'Varied terrain'}
- Weather: ${world.weather || 'Clear'}
- Time of Day: ${world.timeOfDay || 'Day'}
`;

  const recentHistory = history.length > 0 ? `
RECENT HISTORY:
${history.slice(-3).map((h: any, i: number) => `${i + 1}. ${h.content || h.text || h}`).join('\n')}
` : '';

  return `You are an expert Dungeon Master for a tabletop RPG. Respond in character as a skilled DM, providing immersive, engaging narrative that matches the session's tone and rating.

${sessionInfo}${playerInfo}${worldInfo}${recentHistory}

CURRENT SITUATION:
${prompt}

Please respond as the DM with:
- Rich, immersive descriptions
- Appropriate challenges and opportunities  
- Engaging dialogue for NPCs
- Clear options for player actions
- Tone appropriate for ${session.config?.rating || 'PG-13'} content

Response:`;
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

    // Try AI services in order: Vertex AI, Google AI Studio, OpenAI, then local fallback
    let aiResponse: string;
    let aiServiceUsed = 'unknown';
    
    try {
      console.log('🔑 Attempting Vertex AI...');
      const vertexKey = await getSecret('vertex-ai-api-key');
      aiResponse = await callVertexAI(prompt, data.context || { session: { config: { rating: rating || 'PG-13' } } }, vertexKey);
      aiServiceUsed = 'vertex-ai';
      console.log('✅ Vertex AI response received');
      
    } catch (vertexError) {
      console.error('❌ Vertex AI failed:', vertexError);
      
      try {
        console.log('🔄 Trying Google AI Studio as fallback...');
        const geminiKey = await getSecret('vertex-ai-api-key'); // Using same key for both
        aiResponse = await callGeminiAI(prompt, data.context || { session: { config: { rating: rating || 'PG-13' } } }, geminiKey);
        aiServiceUsed = 'google-ai-studio';
        console.log('✅ Google AI Studio fallback succeeded');
        
      } catch (geminiError) {
        console.error('❌ Google AI Studio fallback failed:', geminiError);
        
        try {
          console.log('🔄 Trying OpenAI as final AI fallback...');
          const openaiKey = await getSecret('openai-api-key');
          aiResponse = await callOpenAI(prompt, openaiKey);
          aiServiceUsed = 'openai';
          console.log('✅ OpenAI fallback succeeded');
          
        } catch (openaiError) {
          console.error('❌ All AI services failed:', openaiError);
          
          // Final fallback to intelligent local response
          console.log('🔄 Using intelligent local response as final fallback...');
          aiResponse = generateIntelligentLocalResponse(prompt, data.context);
          aiServiceUsed = 'local-fallback';
        }
      }
    }
    
    console.log(`📊 AI Service Used: ${aiServiceUsed}`);

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