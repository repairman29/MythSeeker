import * as functions from 'firebase-functions';
import admin from './init';
import { 
  validateCharacter, 
  validateGameSession, 
  validateGameCode, 
  validateCharacterId, 
  validateGameId, 
  validateCampaignData,
  checkRateLimit
} from './validation';
import { aiDungeonMaster } from './aiDungeonMaster';

// Types
// interface UserProfile {
//   uid: string;
//   displayName: string;
//   email: string;
//   photoURL?: string;
//   createdAt: number;
//   lastSeen: number;
//   totalPlayTime: number;
//   campaignsHosted: number;
//   campaignsJoined: number;
// }

interface Character {
  id: string;
  userId: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  gold: number;
  inventory: Record<string, number>;
  equipment: Record<string, any>;
  stats: Record<string, number>;
  skills: Record<string, any>;
  achievements: string[];
  createdAt: number;
  lastPlayed: number;
  totalPlayTime: number;
}

interface GameSession {
  id: string;
  code: string;
  theme: string;
  background: string;
  hostId: string;
  players: Array<{
    id: string;
    name: string;
    characterId: string;
    isHost: boolean;
    isOnline: boolean;
    lastSeen: number;
  }>;
  messages: Array<{
    id: string;
    type: 'player' | 'dm' | 'system';
    content: string;
    character?: string;
    playerId?: string;
    playerName?: string;
    timestamp: number;
  }>;
  started: boolean;
  customPrompt: string;
  maxPlayers: number;
  createdAt: number;
  lastActivity: number;
  completedAt?: number;
}

// Create user profile when user signs up
// export const createUserProfile = functions.auth.user().onCreate(async (user) => {
//   const userProfile: UserProfile = {
//     uid: user.uid,
//     displayName: user.displayName || 'Adventurer',
//     email: user.email || '',
//     photoURL: user.photoURL || '',
//     createdAt: Date.now(),
//     lastSeen: Date.now(),
//     totalPlayTime: 0,
//     campaignsHosted: 0,
//     campaignsJoined: 0
//   };

//   await admin.firestore().collection('users').doc(user.uid).set(userProfile);
// });

// Update user last seen
export const updateUserLastSeen = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  await admin.firestore().collection('users').doc(context.auth.uid).update({
    lastSeen: Date.now()
  });
});

// Create or update character
export const saveCharacter = functions.https.onCall(async (data: Character, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'saveCharacter', 10, 60000)) { // 10 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before saving again.');
  }

  // Validate character data
  const validation = validateCharacter(data);
  if (!validation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid character data: ${validation.errors.join(', ')}`);
  }

  const characterData = {
    ...validation.sanitizedData,
    userId: context.auth.uid,
    lastPlayed: Date.now()
  };

  if (data.id) {
    // Update existing character
    await admin.firestore().collection('characters').doc(data.id).update(characterData);
    return { characterId: data.id };
  } else {
    // Create new character
    const docRef = await admin.firestore().collection('characters').add(characterData);
    return { characterId: docRef.id };
  }
});

// Get user characters
export const getUserCharacters = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const snapshot = await admin.firestore()
    .collection('characters')
    .where('userId', '==', context.auth.uid)
    .orderBy('lastPlayed', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Create game session
export const createGameSession = functions.https.onCall(async (data: Partial<GameSession>, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'createGameSession', 5, 60000)) { // 5 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before creating another game.');
  }

  // Validate game session data
  const validation = validateGameSession(data);
  if (!validation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid game session data: ${validation.errors.join(', ')}`);
  }

  const gameSession: GameSession = {
    id: '',
    code: validation.sanitizedData.code || generateGameCode(),
    theme: validation.sanitizedData.theme || 'Classic Fantasy',
    background: validation.sanitizedData.background || 'fantasy',
    hostId: context.auth.uid,
    players: validation.sanitizedData.players || [],
    messages: validation.sanitizedData.messages || [],
    started: false,
    customPrompt: validation.sanitizedData.customPrompt || '',
    maxPlayers: validation.sanitizedData.maxPlayers || 6,
    createdAt: Date.now(),
    lastActivity: Date.now()
  };

  const docRef = await admin.firestore().collection('games').add(gameSession);
  
  // Update user stats
  await admin.firestore().collection('users').doc(context.auth.uid).update({
    campaignsHosted: admin.firestore.FieldValue.increment(1)
  });

  return { gameId: docRef.id, code: gameSession.code };
});

// Join game session
export const joinGameSession = functions.https.onCall(async (data: { code: string; characterId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'joinGameSession', 10, 60000)) { // 10 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before joining another game.');
  }

  // Validate input data
  const codeValidation = validateGameCode(data.code);
  if (!codeValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid game code: ${codeValidation.errors.join(', ')}`);
  }

  const characterIdValidation = validateCharacterId(data.characterId);
  if (!characterIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid character ID: ${characterIdValidation.errors.join(', ')}`);
  }

  // Find game by code
  const gamesSnapshot = await admin.firestore()
    .collection('games')
    .where('code', '==', codeValidation.sanitizedData)
    .where('started', '==', false)
    .limit(1)
    .get();

  if (gamesSnapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Game not found or already started');
  }

  const gameDoc = gamesSnapshot.docs[0];
  const gameData = gameDoc.data() as GameSession;

  if (gameData.players.length >= gameData.maxPlayers) {
    throw new functions.https.HttpsError('resource-exhausted', 'Game is full');
  }

  // Check if player is already in the game
  const existingPlayer = gameData.players.find(p => p.id === context.auth!.uid);
  if (existingPlayer) {
    throw new functions.https.HttpsError('already-exists', 'Player already in game');
  }

  // Get character data
  const characterDoc = await admin.firestore().collection('characters').doc(characterIdValidation.sanitizedData).get();
  if (!characterDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Character not found');
  }

  const characterData = characterDoc.data() as Character;

  // Add player to game
  const newPlayer = {
    id: context.auth.uid,
    name: characterData.name,
    characterId: characterIdValidation.sanitizedData,
    isHost: false,
    isOnline: true,
    lastSeen: Date.now()
  };

  await gameDoc.ref.update({
    players: admin.firestore.FieldValue.arrayUnion(newPlayer),
    lastActivity: Date.now()
  });

  // Update user stats
  await admin.firestore().collection('users').doc(context.auth.uid).update({
    campaignsJoined: admin.firestore.FieldValue.increment(1)
  });

  return { gameId: gameDoc.id, gameData: { ...gameData, players: [...gameData.players, newPlayer] } };
});

// Leave game session
export const leaveGameSession = functions.https.onCall(async (data: { gameId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Validate game ID
  const gameIdValidation = validateGameId(data.gameId);
  if (!gameIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
  }

  const gameDoc = await admin.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
  if (!gameDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Game not found');
  }

  const gameData = gameDoc.data() as GameSession;
  const updatedPlayers = gameData.players.filter(p => p.id !== context.auth!.uid);

  if (updatedPlayers.length === 0) {
    // Delete game if no players left
    await gameDoc.ref.delete();
  } else {
    // Update players list
    await gameDoc.ref.update({
      players: updatedPlayers,
      lastActivity: Date.now()
    });
  }
});

// Start game session
export const startGameSession = functions.https.onCall(async (data: { gameId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Validate game ID
  const gameIdValidation = validateGameId(data.gameId);
  if (!gameIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
  }

  const gameDoc = await admin.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
  if (!gameDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Game not found');
  }

  const gameData = gameDoc.data() as GameSession;
  
  if (gameData.hostId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Only host can start the game');
  }

  await gameDoc.ref.update({
    started: true,
    lastActivity: Date.now()
  });
});

// Save game progress
export const saveGameProgress = functions.https.onCall(async (data: { gameId: string; characterId: string; progress: any }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'saveGameProgress', 20, 60000)) { // 20 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before saving again.');
  }

  // Validate input data
  const gameIdValidation = validateGameId(data.gameId);
  if (!gameIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
  }

  const characterIdValidation = validateCharacterId(data.characterId);
  if (!characterIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid character ID: ${characterIdValidation.errors.join(', ')}`);
  }

  // Validate progress data
  const progressValidation = validateCharacter(data.progress);
  if (!progressValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid progress data: ${progressValidation.errors.join(', ')}`);
  }

  // Update character with new progress
  await admin.firestore().collection('characters').doc(characterIdValidation.sanitizedData).update({
    ...progressValidation.sanitizedData,
    lastPlayed: Date.now()
  });

  // Update user play time
  await admin.firestore().collection('users').doc(context.auth.uid).update({
    totalPlayTime: admin.firestore.FieldValue.increment(data.progress.playTime || 0)
  });
});

// Complete campaign
export const completeCampaign = functions.https.onCall(async (data: { gameId: string; campaignData: any }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Validate input data
  const gameIdValidation = validateGameId(data.gameId);
  if (!gameIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
  }

  const campaignDataValidation = validateCampaignData(data.campaignData);
  if (!campaignDataValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid campaign data: ${campaignDataValidation.errors.join(', ')}`);
  }

  const gameDoc = await admin.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
  if (!gameDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Game not found');
  }

  const gameData = gameDoc.data() as GameSession;

  // Save campaign history
  await admin.firestore().collection('campaigns').add({
    gameId: gameIdValidation.sanitizedData,
    hostId: gameData.hostId,
    participants: gameData.players.map(p => p.id),
    theme: gameData.theme,
    startedAt: gameData.createdAt,
    completedAt: Date.now(),
    duration: Date.now() - gameData.createdAt,
    messages: gameData.messages,
    campaignData: campaignDataValidation.sanitizedData
  });

  // Mark game as completed
  await gameDoc.ref.update({
    completedAt: Date.now()
  });
});

// Get user game history
export const getUserGameHistory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const campaignsSnapshot = await admin.firestore()
    .collection('campaigns')
    .where('participants', 'array-contains', context.auth.uid)
    .orderBy('completedAt', 'desc')
    .limit(20)
    .get();

  return campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Helper function to generate game codes
function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Clean up old games (runs daily)
// export const cleanupOldGames = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
//   const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

//   const oldGamesSnapshot = await admin.firestore()
//     .collection('games')
//     .where('lastActivity', '<', cutoffTime)
//     .where('started', '==', false)
//     .get();

//   const batch = admin.firestore().batch();
//   oldGamesSnapshot.docs.forEach(doc => {
//     batch.delete(doc.ref);
//   });

//   await batch.commit();
//   console.log(`Cleaned up ${oldGamesSnapshot.docs.length} old games`);
// });

// Export AI Dungeon Master function
export { aiDungeonMaster }; 