"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserGameHistory = exports.completeCampaign = exports.saveGameProgress = exports.startGameSession = exports.leaveGameSession = exports.joinGameSession = exports.createGameSession = exports.getUserCharacters = exports.saveCharacter = exports.updateUserLastSeen = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const validation_1 = require("./validation");
admin.initializeApp();
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
exports.updateUserLastSeen = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    await admin.firestore().collection('users').doc(context.auth.uid).update({
        lastSeen: Date.now()
    });
});
// Create or update character
exports.saveCharacter = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Rate limiting
    if (!(0, validation_1.checkRateLimit)(context.auth.uid, 'saveCharacter', 10, 60000)) { // 10 per minute
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before saving again.');
    }
    // Validate character data
    const validation = (0, validation_1.validateCharacter)(data);
    if (!validation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid character data: ${validation.errors.join(', ')}`);
    }
    const characterData = Object.assign(Object.assign({}, validation.sanitizedData), { userId: context.auth.uid, lastPlayed: Date.now() });
    if (data.id) {
        // Update existing character
        await admin.firestore().collection('characters').doc(data.id).update(characterData);
        return { characterId: data.id };
    }
    else {
        // Create new character
        const docRef = await admin.firestore().collection('characters').add(characterData);
        return { characterId: docRef.id };
    }
});
// Get user characters
exports.getUserCharacters = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const snapshot = await admin.firestore()
        .collection('characters')
        .where('userId', '==', context.auth.uid)
        .orderBy('lastPlayed', 'desc')
        .get();
    return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
});
// Create game session
exports.createGameSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Rate limiting
    if (!(0, validation_1.checkRateLimit)(context.auth.uid, 'createGameSession', 5, 60000)) { // 5 per minute
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before creating another game.');
    }
    // Validate game session data
    const validation = (0, validation_1.validateGameSession)(data);
    if (!validation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid game session data: ${validation.errors.join(', ')}`);
    }
    const gameSession = {
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
exports.joinGameSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Rate limiting
    if (!(0, validation_1.checkRateLimit)(context.auth.uid, 'joinGameSession', 10, 60000)) { // 10 per minute
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before joining another game.');
    }
    // Validate input data
    const codeValidation = (0, validation_1.validateGameCode)(data.code);
    if (!codeValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid game code: ${codeValidation.errors.join(', ')}`);
    }
    const characterIdValidation = (0, validation_1.validateCharacterId)(data.characterId);
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
    const gameData = gameDoc.data();
    if (gameData.players.length >= gameData.maxPlayers) {
        throw new functions.https.HttpsError('resource-exhausted', 'Game is full');
    }
    // Check if player is already in the game
    const existingPlayer = gameData.players.find(p => p.id === context.auth.uid);
    if (existingPlayer) {
        throw new functions.https.HttpsError('already-exists', 'Player already in game');
    }
    // Get character data
    const characterDoc = await admin.firestore().collection('characters').doc(characterIdValidation.sanitizedData).get();
    if (!characterDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Character not found');
    }
    const characterData = characterDoc.data();
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
    return { gameId: gameDoc.id, gameData: Object.assign(Object.assign({}, gameData), { players: [...gameData.players, newPlayer] }) };
});
// Leave game session
exports.leaveGameSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Validate game ID
    const gameIdValidation = (0, validation_1.validateGameId)(data.gameId);
    if (!gameIdValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    const gameDoc = await admin.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
    if (!gameDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Game not found');
    }
    const gameData = gameDoc.data();
    const updatedPlayers = gameData.players.filter(p => p.id !== context.auth.uid);
    if (updatedPlayers.length === 0) {
        // Delete game if no players left
        await gameDoc.ref.delete();
    }
    else {
        // Update players list
        await gameDoc.ref.update({
            players: updatedPlayers,
            lastActivity: Date.now()
        });
    }
});
// Start game session
exports.startGameSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Validate game ID
    const gameIdValidation = (0, validation_1.validateGameId)(data.gameId);
    if (!gameIdValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    const gameDoc = await admin.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
    if (!gameDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Game not found');
    }
    const gameData = gameDoc.data();
    if (gameData.hostId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only host can start the game');
    }
    await gameDoc.ref.update({
        started: true,
        lastActivity: Date.now()
    });
});
// Save game progress
exports.saveGameProgress = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Rate limiting
    if (!(0, validation_1.checkRateLimit)(context.auth.uid, 'saveGameProgress', 20, 60000)) { // 20 per minute
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before saving again.');
    }
    // Validate input data
    const gameIdValidation = (0, validation_1.validateGameId)(data.gameId);
    if (!gameIdValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    const characterIdValidation = (0, validation_1.validateCharacterId)(data.characterId);
    if (!characterIdValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid character ID: ${characterIdValidation.errors.join(', ')}`);
    }
    // Validate progress data
    const progressValidation = (0, validation_1.validateCharacter)(data.progress);
    if (!progressValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid progress data: ${progressValidation.errors.join(', ')}`);
    }
    // Update character with new progress
    await admin.firestore().collection('characters').doc(characterIdValidation.sanitizedData).update(Object.assign(Object.assign({}, progressValidation.sanitizedData), { lastPlayed: Date.now() }));
    // Update user play time
    await admin.firestore().collection('users').doc(context.auth.uid).update({
        totalPlayTime: admin.firestore.FieldValue.increment(data.progress.playTime || 0)
    });
});
// Complete campaign
exports.completeCampaign = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Validate input data
    const gameIdValidation = (0, validation_1.validateGameId)(data.gameId);
    if (!gameIdValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    const campaignDataValidation = (0, validation_1.validateCampaignData)(data.campaignData);
    if (!campaignDataValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid campaign data: ${campaignDataValidation.errors.join(', ')}`);
    }
    const gameDoc = await admin.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
    if (!gameDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Game not found');
    }
    const gameData = gameDoc.data();
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
exports.getUserGameHistory = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const campaignsSnapshot = await admin.firestore()
        .collection('campaigns')
        .where('participants', 'array-contains', context.auth.uid)
        .orderBy('completedAt', 'desc')
        .limit(20)
        .get();
    return campaignsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
});
// Helper function to generate game codes
function generateGameCode() {
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
//# sourceMappingURL=index.js.map