"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiDungeonMaster = void 0;
const functions = require("firebase-functions");
const init_1 = require("./init");
const secret_manager_1 = require("@google-cloud/secret-manager");
const node_fetch_1 = require("node-fetch");
const validation_1 = require("./validation");
const db = init_1.default.firestore();
const secretClient = new secret_manager_1.SecretManagerServiceClient();
// Enhanced rate limiting configuration
const RATE_LIMITS = {
    aiDungeonMaster: { requests: 15, windowMs: 60000 },
    aiDungeonMasterPremium: { requests: 30, windowMs: 60000 } // 30 requests per minute for premium users
};
// Helper to access secrets with caching
const secretCache = new Map();
async function getSecret(secretName) {
    var _a, _b;
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
        const value = ((_b = (_a = version.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        // Cache for1ur
        secretCache.set(cacheKey, { value, expires: now + 3600000 });
        return value;
    }
    catch (error) {
        console.error(`Failed to access secret ${secretName}:`, error);
        throw new Error(`Secret access failed: ${secretName}`);
    }
}
// Enhanced Vertex AI Gemini Pro integration
async function callVertexAIGeminiPro(prompt, context, apiKey) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    // Extract context information
    const session = (context === null || context === void 0 ? void 0 : context.session) || {};
    const player = (context === null || context === void 0 ? void 0 : context.player) || {};
    const world = (context === null || context === void 0 ? void 0 : context.world) || {};
    const history = (context === null || context === void 0 ? void 0 : context.history) || [];
    // Build rich context for the AI
    const sessionInfo = `
SESSION DETAILS:
- Phase: ${session.currentPhase || 'exploration'}
- Realm: ${((_a = session.config) === null || _a === void 0 ? void 0 : _a.realm) || 'Fantasy'}
- Theme: ${((_b = session.config) === null || _b === void 0 ? void 0 : _b.theme) || 'Adventure'}
- DM Style: ${((_c = session.config) === null || _c === void 0 ? void 0 : _c.dmStyle) || 'balanced'}
- Content Rating: ${((_d = session.config) === null || _d === void 0 ? void 0 : _d.rating) || 'PG-13'}
- Players: ${((_e = session.players) === null || _e === void 0 ? void 0 : _e.map((p) => p.name).join(', ')) || 'Unknown'}
`;
    const playerInfo = `
PLAYER CONTEXT:
- Name: ${player.name || 'Adventurer'}
- Character Class: ${player.characterClass || 'Hero'}
- Experience Level: ${player.experience || 'intermediate'}
- Preferences: ${((_f = player.preferences) === null || _f === void 0 ? void 0 : _f.join(', ')) || 'None specified'}
`;
    const worldInfo = `
WORLD STATE:
- Current Location: ${((_g = world.locations) === null || _g === void 0 ? void 0 : _g.current) || 'Unknown'}
- Atmosphere: ${((_h = world.atmosphere) === null || _h === void 0 ? void 0 : _h.mood) || 'neutral'} (${((_j = world.atmosphere) === null || _j === void 0 ? void 0 : _j.tension) || 'medium'} tension)
- Active Quests: ${((_k = world.activeQuests) === null || _k === void 0 ? void 0 : _k.length) || 0}
- NPCs Present: ${((_l = world.npcs) === null || _l === void 0 ? void 0 : _l.length) || 0}
- Environmental Details: ${((_m = world.atmosphere) === null || _m === void 0 ? void 0 : _m.environmentalDetails) || 'Standard environment'}
`;
    const conversationHistory = history.length > 0 ? `
RECENT CONVERSATION:
${history.map((msg) => `${msg.type}: ${msg.content}`).join('\n')}
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
            temperature: 0.85,
            maxOutputTokens: 3072,
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
        const response = await (0, node_fetch_1.default)(`https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GCLOUD_PROJECT}/locations/us-central1/publishers/google/models/gemini-pro:generateContent`, {
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
            }
            catch (parseError) {
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
    }
    catch (error) {
        console.error('Vertex AI call failed:', error);
        throw error;
    }
}
// Enhanced error handling and logging
function logAIRequest(userId, campaignId, promptLength, responseTime, success, error) {
    const logEntry = {
        timestamp: init_1.default.firestore.FieldValue.serverTimestamp(),
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
function parseWorldStateUpdates(aiResponse) {
    const updates = {};
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
                    if (!updates.npcs)
                        updates.npcs = [];
                    updates.npcs.push(matches[1].trim());
                    break;
            }
        }
    });
    return updates;
}
function parsePlayerMemoryUpdates(aiResponse, playerName) {
    const updates = [];
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
function parseNPCMemoryUpdates(aiResponse) {
    const updates = [];
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
// Main enhanced function
exports.aiDungeonMaster = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    const startTime = Date.now();
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    // Enhanced rate limiting with user tier support
    const userTier = await getUserTier(userId);
    const rateLimit = userTier === 'premium' ? RATE_LIMITS.aiDungeonMasterPremium : RATE_LIMITS.aiDungeonMaster;
    if (!(0, validation_1.checkRateLimit)(userId, 'aiDungeonMaster', rateLimit.requests, rateLimit.windowMs)) {
        logAIRequest(userId, data.campaignId || 'unknown', ((_a = data.prompt) === null || _a === void 0 ? void 0 : _a.length) || 0, Date.now() - startTime, false, 'Rate limit exceeded');
        throw new functions.https.HttpsError('resource-exhausted', `Rate limit exceeded. You can make ${rateLimit.requests} AI requests per minute. Please wait before making another request.`);
    }
    // Validate input data
    const validation = (0, validation_1.validateAIPrompt)(data);
    if (!validation.isValid) {
        logAIRequest(userId, data.campaignId || 'unknown', ((_b = data.prompt) === null || _b === void 0 ? void 0 : _b.length) || 0, Date.now() - startTime, false, `Validation failed: ${validation.errors.join(', ')}`);
        throw new functions.https.HttpsError('invalid-argument', `Invalid AI prompt data: ${validation.errors.join(', ')}`);
    }
    const { campaignId, prompt, playerName, rating } = validation.sanitizedData;
    if (!campaignId || !prompt) {
        logAIRequest(userId, campaignId || 'unknown', (prompt === null || prompt === void 0 ? void 0 : prompt.length) || 0, Date.now() - startTime, false, 'Missing campaignId or prompt');
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
        if (!((_c = campaignData === null || campaignData === void 0 ? void 0 : campaignData.participants) === null || _c === void 0 ? void 0 : _c[userId]) && !((_d = campaignData === null || campaignData === void 0 ? void 0 : campaignData.players) === null || _d === void 0 ? void 0 : _d.some((p) => p.id === userId))) {
            logAIRequest(userId, campaignId, prompt.length, Date.now() - startTime, false, 'User not participant in campaign');
            throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this campaign');
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
        const sessionWorldState = (gameSessionData === null || gameSessionData === void 0 ? void 0 : gameSessionData.worldState) || {};
        const playerMemory = (gameSessionData === null || gameSessionData === void 0 ? void 0 : gameSessionData.playerMemory) || [];
        const npcMemory = (gameSessionData === null || gameSessionData === void 0 ? void 0 : gameSessionData.npcMemory) || [];
        // Get Vertex AI API key from Secret Manager
        const apiKey = await getSecret('vertex-ai-api-key');
        // Call enhanced Vertex AI with full context
        const aiResponse = await callVertexAIGeminiPro(prompt, data.context || { session: { config: { rating: rating || 'PG-13' } } }, apiKey);
        // Parse AI response for potential world state updates
        const worldStateUpdates = parseWorldStateUpdates(aiResponse);
        const playerMemoryUpdates = parsePlayerMemoryUpdates(aiResponse, playerName);
        const npcMemoryUpdates = parseNPCMemoryUpdates(aiResponse);
        // Update the game session with any new world state, player memory, or NPC memory
        if (Object.keys(worldStateUpdates).length > 0 || playerMemoryUpdates.length > 0 || npcMemoryUpdates.length > 0) {
            const updateData = {
                lastActivity: Date.now()
            };
            if (Object.keys(worldStateUpdates).length > 0) {
                updateData.worldState = Object.assign(Object.assign({}, sessionWorldState), worldStateUpdates);
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
        // Log successful request
        logAIRequest(userId, campaignId, prompt.length, responseTime, true);
        return { response: aiResponse };
    }
    catch (error) {
        logAIRequest(userId, campaignId, (prompt === null || prompt === void 0 ? void 0 : prompt.length) || 0, Date.now() - startTime, false, (error instanceof Error ? error.message : String(error)) || 'Unknown error');
        console.error('AI Dungeon Master error:', error);
        throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable');
    }
});
// Helper function to get user tier (free/premium)
async function getUserTier(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return (userData === null || userData === void 0 ? void 0 : userData.tier) === 'premium' ? 'premium' : 'free';
        }
        return 'free';
    }
    catch (error) {
        console.error('Error getting user tier:', error);
        return 'free';
    }
}
//# sourceMappingURL=aiDungeonMaster.js.map