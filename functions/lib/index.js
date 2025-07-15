"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserGameHistory = exports.completeCampaign = exports.saveGameProgress = exports.startGameSession = exports.leaveGameSession = exports.joinGameSession = exports.createGameSession = exports.getUserCharacters = exports.saveCharacter = exports.updateUserLastSeen = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
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
    const characterData = Object.assign(Object.assign({}, data), { userId: context.auth.uid, lastPlayed: Date.now() });
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
    const gameSession = {
        id: '',
        code: data.code || generateGameCode(),
        theme: data.theme || 'Classic Fantasy',
        background: data.background || 'fantasy',
        hostId: context.auth.uid,
        players: data.players || [],
        messages: data.messages || [],
        started: false,
        customPrompt: data.customPrompt || '',
        maxPlayers: data.maxPlayers || 6,
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
    // Find game by code
    const gamesSnapshot = await admin.firestore()
        .collection('games')
        .where('code', '==', data.code)
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
    const characterDoc = await admin.firestore().collection('characters').doc(data.characterId).get();
    if (!characterDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Character not found');
    }
    const characterData = characterDoc.data();
    // Add player to game
    const newPlayer = {
        id: context.auth.uid,
        name: characterData.name,
        characterId: data.characterId,
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
    const gameDoc = await admin.firestore().collection('games').doc(data.gameId).get();
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
    const gameDoc = await admin.firestore().collection('games').doc(data.gameId).get();
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
    // Update character with new progress
    await admin.firestore().collection('characters').doc(data.characterId).update(Object.assign(Object.assign({}, data.progress), { lastPlayed: Date.now() }));
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
    const gameDoc = await admin.firestore().collection('games').doc(data.gameId).get();
    if (!gameDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Game not found');
    }
    const gameData = gameDoc.data();
    // Save campaign history
    await admin.firestore().collection('campaigns').add({
        gameId: data.gameId,
        hostId: gameData.hostId,
        participants: gameData.players.map(p => p.id),
        theme: gameData.theme,
        startedAt: gameData.createdAt,
        completedAt: Date.now(),
        duration: Date.now() - gameData.createdAt,
        messages: gameData.messages,
        campaignData: data.campaignData
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