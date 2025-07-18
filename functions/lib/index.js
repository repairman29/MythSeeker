"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiAIFunction = exports.aiDungeonMaster = exports.testEndpoint = exports.updateGameState = exports.endCombat = exports.resolveCombatAction = exports.getCombatState = exports.startCombat = exports.cleanupOldGames = exports.getUserGameHistory = exports.completeCampaign = exports.saveGameProgress = exports.startGameSession = exports.leaveGameSession = exports.joinGameSession = exports.createGameSession = exports.getUserCharacters = exports.saveCharacter = exports.updateUserLastSeen = void 0;
const functions = require("firebase-functions");
const init_1 = require("./init");
const validation_1 = require("./validation");
const aiDungeonMaster_1 = require("./aiDungeonMaster");
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
    await init_1.default.firestore().collection('users').doc(context.auth.uid).update({
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
        await init_1.default.firestore().collection('characters').doc(data.id).update(characterData);
        return { characterId: data.id };
    }
    else {
        // Create new character
        const docRef = await init_1.default.firestore().collection('characters').add(characterData);
        return { characterId: docRef.id };
    }
});
// Get user characters
exports.getUserCharacters = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const snapshot = await init_1.default.firestore()
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
        lastActivity: Date.now(),
        worldState: {},
        playerMemory: [],
        npcMemory: [] // Initialize empty npc memory
    };
    const docRef = await init_1.default.firestore().collection('games').add(gameSession);
    // Update user stats
    await init_1.default.firestore().collection('users').doc(context.auth.uid).update({
        campaignsHosted: init_1.default.firestore.FieldValue.increment(1)
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
    const gamesSnapshot = await init_1.default.firestore()
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
    const characterDoc = await init_1.default.firestore().collection('characters').doc(characterIdValidation.sanitizedData).get();
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
        players: init_1.default.firestore.FieldValue.arrayUnion(newPlayer),
        lastActivity: Date.now()
    });
    // Update user stats
    await init_1.default.firestore().collection('users').doc(context.auth.uid).update({
        campaignsJoined: init_1.default.firestore.FieldValue.increment(1)
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
    const gameDoc = await init_1.default.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
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
    const gameDoc = await init_1.default.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
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
    await init_1.default.firestore().collection('characters').doc(characterIdValidation.sanitizedData).update(Object.assign(Object.assign({}, progressValidation.sanitizedData), { lastPlayed: Date.now() }));
    // Update user play time
    await init_1.default.firestore().collection('users').doc(context.auth.uid).update({
        totalPlayTime: init_1.default.firestore.FieldValue.increment(data.progress.playTime || 0)
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
    const gameDoc = await init_1.default.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
    if (!gameDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Game not found');
    }
    const gameData = gameDoc.data();
    // Save campaign history
    await init_1.default.firestore().collection('campaigns').add({
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
    const campaignsSnapshot = await init_1.default.firestore()
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
exports.cleanupOldGames = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    try {
        // Clean up old unstarted games
        const oldGamesSnapshot = await init_1.default.firestore()
            .collection('games')
            .where('lastActivity', '<', cutoffTime)
            .where('started', '==', false)
            .get();
        const batch = init_1.default.firestore().batch();
        oldGamesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${oldGamesSnapshot.docs.length} old unstarted games`);
        // Clean up old completed games (older than 30 days)
        const oldCompletedGamesSnapshot = await init_1.default.firestore()
            .collection('games')
            .where('completedAt', '<', Date.now() - (30 * 24 * 60 * 60 * 1000))
            .get();
        const completedBatch = init_1.default.firestore().batch();
        oldCompletedGamesSnapshot.docs.forEach(doc => {
            completedBatch.delete(doc.ref);
        });
        await completedBatch.commit();
        console.log(`Cleaned up ${oldCompletedGamesSnapshot.docs.length} old completed games`);
        return {
            success: true,
            unstartedGamesCleaned: oldGamesSnapshot.docs.length,
            completedGamesCleaned: oldCompletedGamesSnapshot.docs.length
        };
    }
    catch (error) {
        console.error('Error cleaning up old games:', error);
        throw error;
    }
});
// Combat System Endpoints
// Start combat
exports.startCombat = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { gameId, enemies } = data;
    // Get game session and players
    const gameDoc = await init_1.default.firestore().collection('games').doc(gameId).get();
    if (!gameDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Game session not found');
    }
    const gameData = gameDoc.data();
    // Get player characters
    const playerCharacters = await Promise.all(gameData.players.map(async (player) => {
        var _a, _b;
        const charDoc = await init_1.default.firestore().collection('characters').doc(player.characterId).get();
        const charData = charDoc.data();
        return {
            id: player.id,
            name: charData.name,
            type: 'player',
            characterId: player.characterId,
            health: charData.health,
            maxHealth: charData.maxHealth,
            armorClass: ((_a = charData.stats) === null || _a === void 0 ? void 0 : _a.dexterity) ? 10 + Math.floor((charData.stats.dexterity - 10) / 2) : 10,
            initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((((_b = charData.stats) === null || _b === void 0 ? void 0 : _b.dexterity) || 10 - 10) / 2),
            isActive: true,
            statusEffects: []
        };
    }));
    // Create enemy participants
    const enemyParticipants = enemies.map((enemy, index) => ({
        id: `enemy-${index}`,
        name: enemy.name,
        type: 'enemy',
        health: enemy.health,
        maxHealth: enemy.health,
        armorClass: enemy.armorClass,
        initiative: enemy.initiative,
        isActive: true,
        statusEffects: []
    }));
    // Combine all participants and sort by initiative
    const allParticipants = [...playerCharacters, ...enemyParticipants];
    allParticipants.sort((a, b) => b.initiative - a.initiative);
    const turnOrder = allParticipants.map(p => p.id);
    const combatState = {
        id: '',
        gameId,
        status: 'active',
        participants: allParticipants,
        currentTurn: 0,
        turnOrder,
        round: 1,
        actions: [],
        environment: {
            terrain: 'forest',
            lighting: 'daylight',
            weather: 'clear',
            cover: []
        },
        createdAt: Date.now(),
        lastActivity: Date.now()
    };
    const docRef = await init_1.default.firestore().collection('combat').add(combatState);
    // Update game session to reference combat
    await init_1.default.firestore().collection('games').doc(gameId).update({
        currentCombatId: docRef.id,
        lastActivity: Date.now()
    });
    return {
        combatId: docRef.id,
        combatState: Object.assign(Object.assign({}, combatState), { id: docRef.id }),
        currentActor: allParticipants[0]
    };
});
// Get combat state
exports.getCombatState = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { combatId } = data;
    const combatDoc = await init_1.default.firestore().collection('combat').doc(combatId).get();
    if (!combatDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Combat session not found');
    }
    const combatData = combatDoc.data();
    const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
    return {
        combatState: Object.assign(Object.assign({}, combatData), { id: combatId }),
        currentActor,
        isPlayerTurn: (currentActor === null || currentActor === void 0 ? void 0 : currentActor.type) === 'player'
    };
});
// Resolve combat action
exports.resolveCombatAction = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { combatId, action } = data;
    const combatDoc = await init_1.default.firestore().collection('combat').doc(combatId).get();
    if (!combatDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Combat session not found');
    }
    const combatData = combatDoc.data();
    const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
    if (!currentActor) {
        throw new functions.https.HttpsError('failed-precondition', 'No active participant found');
    }
    // Process the action
    let actionResult = {
        id: `action-${Date.now()}`,
        actorId: currentActor.id,
        actionType: action.actionType,
        targetId: action.targetId,
        spellId: action.spellId,
        weaponId: action.weaponId,
        description: action.description || `${currentActor.name} performs ${action.actionType}`,
        timestamp: Date.now()
    };
    // Handle different action types
    switch (action.actionType) {
        case 'attack':
            if (action.targetId) {
                const target = combatData.participants.find(p => p.id === action.targetId);
                if (target) {
                    const attackRoll = Math.floor(Math.random() * 20) + 1;
                    const hit = attackRoll >= target.armorClass;
                    actionResult.hit = hit;
                    actionResult.critical = attackRoll === 20;
                    if (hit) {
                        const damage = Math.floor(Math.random() * 8) + 1; // 1d8 damage
                        actionResult.damage = damage;
                        actionResult.damageType = 'slashing';
                        // Update target health
                        const targetIndex = combatData.participants.findIndex(p => p.id === action.targetId);
                        if (targetIndex !== -1) {
                            combatData.participants[targetIndex].health = Math.max(0, target.health - damage);
                            if (combatData.participants[targetIndex].health === 0) {
                                combatData.participants[targetIndex].isActive = false;
                            }
                        }
                    }
                }
            }
            break;
        case 'spell':
            if (action.spellId && action.targetId) {
                const target = combatData.participants.find(p => p.id === action.targetId);
                if (target) {
                    const damage = Math.floor(Math.random() * 6) + 1; // 1d6 spell damage
                    actionResult.damage = damage;
                    actionResult.damageType = 'force';
                    // Update target health
                    const targetIndex = combatData.participants.findIndex(p => p.id === action.targetId);
                    if (targetIndex !== -1) {
                        combatData.participants[targetIndex].health = Math.max(0, target.health - damage);
                        if (combatData.participants[targetIndex].health === 0) {
                            combatData.participants[targetIndex].isActive = false;
                        }
                    }
                }
            }
            break;
        case 'move':
            if (action.position) {
                const actorIndex = combatData.participants.findIndex(p => p.id === currentActor.id);
                if (actorIndex !== -1) {
                    combatData.participants[actorIndex].position = action.position;
                }
            }
            break;
        default:
            // Handle other actions (dodge, dash, item)
            break;
    }
    // Add action to combat history
    combatData.actions.push(actionResult);
    // Move to next turn
    combatData.currentTurn = (combatData.currentTurn + 1) % combatData.turnOrder.length;
    // If we've completed a full round, increment round counter
    if (combatData.currentTurn === 0) {
        combatData.round++;
    }
    // Check if combat is complete
    const activePlayers = combatData.participants.filter(p => p.type === 'player' && p.isActive);
    const activeEnemies = combatData.participants.filter(p => p.type === 'enemy' && p.isActive);
    if (activePlayers.length === 0) {
        combatData.status = 'completed'; // Players defeated
    }
    else if (activeEnemies.length === 0) {
        combatData.status = 'completed'; // Enemies defeated
    }
    // Update combat state
    await init_1.default.firestore().collection('combat').doc(combatId).update({
        participants: combatData.participants,
        currentTurn: combatData.currentTurn,
        round: combatData.round,
        actions: combatData.actions,
        status: combatData.status,
        lastActivity: Date.now()
    });
    // Get next actor
    const nextActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
    return {
        actionResult,
        nextActor,
        combatStatus: combatData.status,
        round: combatData.round
    };
});
// End combat
exports.endCombat = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { combatId, result } = data;
    const combatDoc = await init_1.default.firestore().collection('combat').doc(combatId).get();
    if (!combatDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Combat session not found');
    }
    const combatData = combatDoc.data();
    // Update combat status
    await init_1.default.firestore().collection('combat').doc(combatId).update({
        status: result === 'fled' ? 'fled' : 'completed',
        lastActivity: Date.now()
    });
    // Remove combat reference from game session
    await init_1.default.firestore().collection('games').doc(combatData.gameId).update({
        currentCombatId: init_1.default.firestore.FieldValue.delete(),
        lastActivity: Date.now()
    });
    return { success: true, result };
});
// Update game state (world state, player memory, NPC memory)
exports.updateGameState = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Rate limiting
    if (!(0, validation_1.checkRateLimit)(context.auth.uid, 'updateGameState', 30, 60000)) { // 30 per minute
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before updating again.');
    }
    // Validate game ID
    const gameIdValidation = (0, validation_1.validateGameId)(data.gameId);
    if (!gameIdValidation.isValid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid game ID: ${gameIdValidation.errors.join(', ')}`);
    }
    const gameDoc = await init_1.default.firestore().collection('games').doc(gameIdValidation.sanitizedData).get();
    if (!gameDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Game not found');
    }
    const gameData = gameDoc.data();
    // Check if user is a participant in the game
    const isParticipant = gameData.players.some(p => p.id === context.auth.uid);
    if (!isParticipant && gameData.hostId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this game');
    }
    // Prepare update data
    const updateData = {
        lastActivity: Date.now()
    };
    if (data.worldState !== undefined) {
        updateData.worldState = data.worldState;
    }
    if (data.playerMemory !== undefined) {
        updateData.playerMemory = data.playerMemory;
    }
    if (data.npcMemory !== undefined) {
        updateData.npcMemory = data.npcMemory;
    }
    await gameDoc.ref.update(updateData);
    return { success: true, updatedFields: Object.keys(updateData).filter(key => key !== 'lastActivity') };
});
// Test endpoint for development (bypasses auth)
exports.testEndpoint = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Test-Mode');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Check if this is a test request
    const isTestMode = req.headers['x-test-mode'] === 'true';
    if (!isTestMode) {
        res.status(403).json({ error: 'Test mode required' });
        return;
    }
    const { action, data } = req.body;
    try {
        let result;
        switch (action) {
            case 'saveCharacter':
                result = await handleSaveCharacter(data, { auth: { uid: data.userId } });
                break;
            case 'getUserCharacters':
                result = await handleGetUserCharacters(data, { auth: { uid: data.userId } });
                break;
            case 'createGameSession':
                result = await handleCreateGameSession(data, { auth: { uid: data.hostId } });
                break;
            case 'joinGameSession':
                result = await handleJoinGameSession(data, { auth: { uid: data.playerId } });
                break;
            case 'startGameSession':
                result = await handleStartGameSession(data, { auth: { uid: 'test-user' } });
                break;
            case 'aiDungeonMaster':
                const { prompt: aiPrompt } = data;
                if (!aiPrompt) {
                    throw new Error('Prompt is required');
                }
                result = await (0, aiDungeonMaster_1.handleAIDungeonMasterLogic)(data, { auth: { uid: 'test-user' } });
                break;
            case 'saveGameProgress':
                result = await handleSaveGameProgress(data, { auth: { uid: 'test-user' } });
                break;
            case 'completeCampaign':
                result = await handleCompleteCampaign(data, { auth: { uid: 'test-user' } });
                break;
            case 'startCombat':
                result = await handleStartCombat(data, { auth: { uid: 'test-user' } });
                break;
            case 'getCombatState':
                result = await handleGetCombatState(data, { auth: { uid: 'test-user' } });
                break;
            case 'resolveCombatAction':
                result = await handleResolveCombatAction(data, { auth: { uid: 'test-user' } });
                break;
            case 'endCombat':
                result = await handleEndCombat(data, { auth: { uid: 'test-user' } });
                break;
            default:
                res.status(400).json({ error: 'Unknown action' });
                return;
        }
        res.status(200).json({ result });
    }
    catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Helper functions to handle the actual logic
async function handleSaveCharacter(data, context) {
    const characterData = Object.assign(Object.assign({}, data), { userId: context.auth.uid, lastPlayed: Date.now() });
    // Remove the ID if it's a test character to create new ones
    if (data.id && data.id.startsWith('char-')) {
        delete characterData.id;
    }
    if (data.id && !data.id.startsWith('char-')) {
        await init_1.default.firestore().collection('characters').doc(data.id).update(characterData);
        return { characterId: data.id };
    }
    else {
        const docRef = await init_1.default.firestore().collection('characters').add(characterData);
        return { characterId: docRef.id };
    }
}
async function handleGetUserCharacters(data, context) {
    const snapshot = await init_1.default.firestore()
        .collection('characters')
        .where('userId', '==', context.auth.uid)
        .orderBy('lastPlayed', 'desc')
        .get();
    return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
}
async function handleCreateGameSession(data, context) {
    const gameSession = {
        code: data.code || generateGameCode(),
        theme: data.theme || 'Classic Fantasy',
        background: 'fantasy',
        hostId: context.auth.uid,
        players: [],
        messages: [],
        started: false,
        customPrompt: data.customPrompt || '',
        maxPlayers: 6,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        worldState: {},
        playerMemory: [],
        npcMemory: [] // Initialize empty npc memory
    };
    const docRef = await init_1.default.firestore().collection('games').add(gameSession);
    return { gameId: docRef.id, code: gameSession.code };
}
async function handleJoinGameSession(data, context) {
    const { code, characterId } = data;
    const gameSnapshot = await init_1.default.firestore()
        .collection('games')
        .where('code', '==', code)
        .limit(1)
        .get();
    if (gameSnapshot.empty) {
        throw new Error('Game not found');
    }
    const gameDoc = gameSnapshot.docs[0];
    const gameData = gameDoc.data();
    // Check if game has already started
    if (gameData.started) {
        throw new Error('Game already started');
    }
    // Check if game is full
    if (gameData.players.length >= gameData.maxPlayers) {
        throw new Error('Game is full');
    }
    // Check if player is already in the game
    const existingPlayer = gameData.players.find((p) => p.id === context.auth.uid);
    if (existingPlayer) {
        throw new Error('Player already in game');
    }
    const player = {
        id: context.auth.uid,
        name: 'Test Player',
        characterId,
        isHost: false,
        isOnline: true,
        lastSeen: Date.now()
    };
    await gameDoc.ref.update({
        players: init_1.default.firestore.FieldValue.arrayUnion(player),
        lastActivity: Date.now()
    });
    return { gameId: gameDoc.id, success: true };
}
async function handleStartGameSession(data, context) {
    const { gameId } = data;
    await init_1.default.firestore().collection('games').doc(gameId).update({
        started: true,
        lastActivity: Date.now()
    });
    return { success: true };
}
// Note: handleAIDungeonMaster is now handled by the enhanced aiDungeonMaster function from aiDungeonMaster.ts
async function handleSaveGameProgress(data, context) {
    const { gameId, gameState } = data;
    await init_1.default.firestore().collection('games').doc(gameId).update({
        gameState,
        lastActivity: Date.now()
    });
    return { success: true };
}
async function handleCompleteCampaign(data, context) {
    const { gameId, finalState } = data;
    await init_1.default.firestore().collection('games').doc(gameId).update({
        completedAt: Date.now(),
        finalState,
        lastActivity: Date.now()
    });
    return { success: true };
}
// Combat helper functions for test endpoint
async function handleStartCombat(data, context) {
    const { gameId, enemies } = data;
    // Get game session and players
    const gameDoc = await init_1.default.firestore().collection('games').doc(gameId).get();
    if (!gameDoc.exists) {
        throw new Error('Game session not found');
    }
    const gameData = gameDoc.data();
    // Get player characters
    const playerCharacters = await Promise.all(gameData.players.map(async (player) => {
        var _a, _b;
        const charDoc = await init_1.default.firestore().collection('characters').doc(player.characterId).get();
        const charData = charDoc.data();
        return {
            id: player.id,
            name: charData.name,
            type: 'player',
            characterId: player.characterId,
            health: charData.health,
            maxHealth: charData.maxHealth,
            armorClass: ((_a = charData.stats) === null || _a === void 0 ? void 0 : _a.dexterity) ? 10 + Math.floor((charData.stats.dexterity - 10) / 2) : 10,
            initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((((_b = charData.stats) === null || _b === void 0 ? void 0 : _b.dexterity) || 10 - 10) / 2),
            isActive: true,
            statusEffects: []
        };
    }));
    // Create enemy participants
    const enemyParticipants = enemies.map((enemy, index) => ({
        id: `enemy-${index}`,
        name: enemy.name,
        type: 'enemy',
        health: enemy.health,
        maxHealth: enemy.health,
        armorClass: enemy.armorClass,
        initiative: enemy.initiative,
        isActive: true,
        statusEffects: []
    }));
    // Combine all participants and sort by initiative
    const allParticipants = [...playerCharacters, ...enemyParticipants];
    allParticipants.sort((a, b) => b.initiative - a.initiative);
    const turnOrder = allParticipants.map(p => p.id);
    const combatState = {
        id: '',
        gameId,
        status: 'active',
        participants: allParticipants,
        currentTurn: 0,
        turnOrder,
        round: 1,
        actions: [],
        environment: {
            terrain: 'forest',
            lighting: 'daylight',
            weather: 'clear',
            cover: []
        },
        createdAt: Date.now(),
        lastActivity: Date.now()
    };
    const docRef = await init_1.default.firestore().collection('combat').add(combatState);
    // Update game session to reference combat
    await init_1.default.firestore().collection('games').doc(gameId).update({
        currentCombatId: docRef.id,
        lastActivity: Date.now()
    });
    return {
        combatId: docRef.id,
        combatState: Object.assign(Object.assign({}, combatState), { id: docRef.id }),
        currentActor: allParticipants[0]
    };
}
async function handleGetCombatState(data, context) {
    const { combatId } = data;
    const combatDoc = await init_1.default.firestore().collection('combat').doc(combatId).get();
    if (!combatDoc.exists) {
        throw new Error('Combat session not found');
    }
    const combatData = combatDoc.data();
    const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
    return {
        combatState: Object.assign(Object.assign({}, combatData), { id: combatId }),
        currentActor,
        isPlayerTurn: (currentActor === null || currentActor === void 0 ? void 0 : currentActor.type) === 'player'
    };
}
async function handleResolveCombatAction(data, context) {
    const { combatId, action } = data;
    const combatDoc = await init_1.default.firestore().collection('combat').doc(combatId).get();
    if (!combatDoc.exists) {
        throw new Error('Combat session not found');
    }
    const combatData = combatDoc.data();
    const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
    if (!currentActor) {
        throw new Error('No active participant found');
    }
    // Process the action
    let actionResult = {
        id: `action-${Date.now()}`,
        actorId: currentActor.id,
        actionType: action.actionType,
        targetId: action.targetId,
        spellId: action.spellId,
        weaponId: action.weaponId,
        description: action.description || `${currentActor.name} performs ${action.actionType}`,
        timestamp: Date.now()
    };
    // Handle different action types
    switch (action.actionType) {
        case 'attack':
            if (action.targetId) {
                const target = combatData.participants.find(p => p.id === action.targetId);
                if (target) {
                    const attackRoll = Math.floor(Math.random() * 20) + 1;
                    const hit = attackRoll >= target.armorClass;
                    actionResult.hit = hit;
                    actionResult.critical = attackRoll === 20;
                    if (hit) {
                        const damage = Math.floor(Math.random() * 8) + 1; // 1d8 damage
                        actionResult.damage = damage;
                        actionResult.damageType = 'slashing';
                        // Update target health
                        const targetIndex = combatData.participants.findIndex(p => p.id === action.targetId);
                        if (targetIndex !== -1) {
                            combatData.participants[targetIndex].health = Math.max(0, target.health - damage);
                            if (combatData.participants[targetIndex].health === 0) {
                                combatData.participants[targetIndex].isActive = false;
                            }
                        }
                    }
                }
            }
            break;
        case 'spell':
            if (action.spellId && action.targetId) {
                const target = combatData.participants.find(p => p.id === action.targetId);
                if (target) {
                    const damage = Math.floor(Math.random() * 6) + 1; // 1d6 spell damage
                    actionResult.damage = damage;
                    actionResult.damageType = 'force';
                    // Update target health
                    const targetIndex = combatData.participants.findIndex(p => p.id === action.targetId);
                    if (targetIndex !== -1) {
                        combatData.participants[targetIndex].health = Math.max(0, target.health - damage);
                        if (combatData.participants[targetIndex].health === 0) {
                            combatData.participants[targetIndex].isActive = false;
                        }
                    }
                }
            }
            break;
        case 'move':
            if (action.position) {
                const actorIndex = combatData.participants.findIndex(p => p.id === currentActor.id);
                if (actorIndex !== -1) {
                    combatData.participants[actorIndex].position = action.position;
                }
            }
            break;
        default:
            // Handle other actions (dodge, dash, item)
            break;
    }
    // Add action to combat history
    combatData.actions.push(actionResult);
    // Move to next turn
    combatData.currentTurn = (combatData.currentTurn + 1) % combatData.turnOrder.length;
    // If we've completed a full round, increment round counter
    if (combatData.currentTurn === 0) {
        combatData.round++;
    }
    // Check if combat is complete
    const activePlayers = combatData.participants.filter(p => p.type === 'player' && p.isActive);
    const activeEnemies = combatData.participants.filter(p => p.type === 'enemy' && p.isActive);
    if (activePlayers.length === 0) {
        combatData.status = 'completed'; // Players defeated
    }
    else if (activeEnemies.length === 0) {
        combatData.status = 'completed'; // Enemies defeated
    }
    // Update combat state
    await init_1.default.firestore().collection('combat').doc(combatId).update({
        participants: combatData.participants,
        currentTurn: combatData.currentTurn,
        round: combatData.round,
        actions: combatData.actions,
        status: combatData.status,
        lastActivity: Date.now()
    });
    // Get next actor
    const nextActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
    return {
        actionResult,
        nextActor,
        combatStatus: combatData.status,
        round: combatData.round
    };
}
async function handleEndCombat(data, context) {
    const { combatId, result } = data;
    const combatDoc = await init_1.default.firestore().collection('combat').doc(combatId).get();
    if (!combatDoc.exists) {
        throw new Error('Combat session not found');
    }
    const combatData = combatDoc.data();
    // Update combat status
    await init_1.default.firestore().collection('combat').doc(combatId).update({
        status: result === 'fled' ? 'fled' : 'completed',
        lastActivity: Date.now()
    });
    // Remove combat reference from game session
    await init_1.default.firestore().collection('games').doc(combatData.gameId).update({
        currentCombatId: init_1.default.firestore.FieldValue.delete(),
        lastActivity: Date.now()
    });
    return { success: true, result };
}
// AI Dungeon Master function
exports.aiDungeonMaster = functions.https.onCall(async (data, context) => {
    try {
        console.log('AI Dungeon Master called with data:', data);
        const { prompt } = data;
        // Rate limiting
        if (context.auth && !(0, validation_1.checkRateLimit)(context.auth.uid, 'aiDungeonMaster', 20, 60000)) { // 20 per minute
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before making another request.');
        }
        if (!prompt) {
            throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
        }
        // Call the enhanced AI Dungeon Master service
        const response = await (0, aiDungeonMaster_1.handleAIDungeonMasterLogic)(data, context);
        return { response };
    }
    catch (error) {
        console.error('AI Dungeon Master error:', error);
        throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable');
    }
});
// Gemini AI Function (alias for aiDungeonMaster for compatibility)
exports.geminiAIFunction = functions.https.onCall(async (data, context) => {
    try {
        console.log('Gemini AI Function called with data:', data);
        const { prompt } = data;
        // Rate limiting
        if (context.auth && !(0, validation_1.checkRateLimit)(context.auth.uid, 'geminiAIFunction', 20, 60000)) { // 20 per minute
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before making another request.');
        }
        if (!prompt) {
            throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
        }
        // Call the enhanced AI Dungeon Master service
        const response = await (0, aiDungeonMaster_1.handleAIDungeonMasterLogic)(data, context);
        return { response };
    }
    catch (error) {
        console.error('Gemini AI Function error:', error);
        throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable');
    }
});
//# sourceMappingURL=index.js.map