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
// Helper to access secrets
async function getSecret(secretName) {
    var _a, _b;
    const [version] = await secretClient.accessSecretVersion({
        name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${secretName}/versions/latest`
    });
    return ((_b = (_a = version.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString()) || '';
}
// Helper to call Vertex AI Gemini (chat-bison)
async function callVertexAI(prompt, context, apiKey) {
    const endpoint = 'https://us-central1-aiplatform.googleapis.com/v1/projects/' + process.env.GCLOUD_PROJECT + '/locations/us-central1/publishers/google/models/gemini-pro:predict';
    const body = {
        instances: [{ prompt: prompt, context: context }],
        parameters: { temperature: 0.8, maxOutputTokens: 1024 }
    };
    const res = await (0, node_fetch_1.default)(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.predictions && data.predictions[0].content) {
        return data.predictions[0].content;
    }
    throw new Error('Vertex AI response error: ' + JSON.stringify(data));
}
// Main function
exports.aiDungeonMaster = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Rate limiting - 10 AI requests per minute per user
    if (!(0, validation_1.checkRateLimit)(context.auth.uid, 'aiDungeonMaster', 10, 60000)) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before making another AI request.');
    }
    // Validate input data
    const validation = (0, validation_1.validateAIPrompt)(data);
    if (!validation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid AI prompt data: ${validation.errors.join(', ')}`);
    }
    const { campaignId, prompt, playerName } = validation.sanitizedData;
    if (!campaignId || !prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing campaignId or prompt');
    }
    // Get campaign doc
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }
    // Verify user is a participant in the campaign
    const campaignData = campaignSnap.data();
    if (!((_a = campaignData === null || campaignData === void 0 ? void 0 : campaignData.participants) === null || _a === void 0 ? void 0 : _a[context.auth.uid])) {
        throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this campaign');
    }
    // Get rules and history
    const rulesSnap = await campaignRef.collection('rules').doc('main').get();
    const historySnap = await campaignRef.collection('history').doc('main').get();
    const rules = rulesSnap.exists ? ((_b = rulesSnap.data()) === null || _b === void 0 ? void 0 : _b.content) || '' : '';
    const history = historySnap.exists ? ((_c = historySnap.data()) === null || _c === void 0 ? void 0 : _c.content) || '' : '';
    // Compose context for AI
    const contextText = `CAMPAIGN RULES:\n${rules}\n\nHISTORY SO FAR:\n${history}`;
    try {
        // Get Vertex AI API key from Secret Manager
        const apiKey = await getSecret('vertex-ai-api-key');
        // Call Vertex AI
        const aiResponse = await callVertexAI(prompt, contextText, apiKey);
        // Append to history
        const newHistory = history + `\n${playerName}: ${prompt}\nDM: ${aiResponse}`;
        await campaignRef.collection('history').doc('main').set({ content: newHistory }, { merge: true });
        return { response: aiResponse };
    }
    catch (error) {
        console.error('AI Dungeon Master error:', error);
        throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable. Please try again later.');
    }
});
//# sourceMappingURL=aiDungeonMaster.js.map