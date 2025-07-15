import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fetch from 'node-fetch';

admin.initializeApp();
const db = admin.firestore();
const secretClient = new SecretManagerServiceClient();

// Helper to access secrets
async function getSecret(secretName: string): Promise<string> {
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${secretName}/versions/latest`
  });
  return version.payload?.data?.toString() || '';
}

// Helper to call Vertex AI Gemini (chat-bison)
async function callVertexAI(prompt: string, context: string, apiKey: string): Promise<string> {
  const endpoint = 'https://us-central1-aiplatform.googleapis.com/v1/projects/' + process.env.GCLOUD_PROJECT + '/locations/us-central1/publishers/google/models/gemini-pro:predict';
  const body = {
    instances: [{ prompt: prompt, context: context }],
    parameters: { temperature: 0.8, maxOutputTokens: 1024 }
  };
  const res = await fetch(endpoint, {
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
export const aiDungeonMaster = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  const { campaignId, prompt, playerName } = data;
  if (!campaignId || !prompt) throw new functions.https.HttpsError('invalid-argument', 'Missing campaignId or prompt');

  // Get campaign doc
  const campaignRef = db.collection('campaigns').doc(campaignId);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) throw new functions.https.HttpsError('not-found', 'Campaign not found');

  // Get rules and history
  const rulesSnap = await campaignRef.collection('rules').doc('main').get();
  const historySnap = await campaignRef.collection('history').doc('main').get();
  const rules = rulesSnap.exists ? rulesSnap.data()?.content || '' : '';
  const history = historySnap.exists ? historySnap.data()?.content || '' : '';

  // Compose context for AI
  const contextText = `CAMPAIGN RULES:\n${rules}\n\nHISTORY SO FAR:\n${history}`;

  // Get Vertex AI API key from Secret Manager
  const apiKey = await getSecret('vertex-ai-api-key');

  // Call Vertex AI
  const aiResponse = await callVertexAI(prompt, contextText, apiKey);

  // Append to history
  const newHistory = history + `\n${playerName}: ${prompt}\nDM: ${aiResponse}`;
  await campaignRef.collection('history').doc('main').set({ content: newHistory }, { merge: true });

  return { response: aiResponse };
}); 