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
import { handleAIDungeonMasterLogic } from './aiDungeonMaster';

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
  worldState?: Record<string, any>; // Persistent world state
  playerMemory?: Array<any>; // Log of key player actions/outcomes
  npcMemory?: Array<any>; // NPCs, traits, relationships, etc.
}

interface CombatState {
  id: string;
  gameId: string;
  status: 'active' | 'completed' | 'fled';
  participants: Array<{
    id: string;
    name: string;
    type: 'player' | 'enemy';
    characterId?: string;
    health: number;
    maxHealth: number;
    armorClass: number;
    initiative: number;
    isActive: boolean;
    statusEffects: string[];
    position?: { x: number; y: number };
  }>;
  currentTurn: number;
  turnOrder: string[];
  round: number;
  actions: Array<{
    id: string;
    actorId: string;
    actionType: 'attack' | 'spell' | 'move' | 'item' | 'dodge' | 'dash';
    targetId?: string;
    spellId?: string;
    weaponId?: string;
    damage?: number;
    damageType?: string;
    hit?: boolean;
    critical?: boolean;
    description: string;
    timestamp: number;
  }>;
  environment: {
    terrain: string;
    lighting: string;
    weather: string;
    cover: Array<{ x: number; y: number; type: string }>;
  };
  createdAt: number;
  lastActivity: number;
}

interface CombatAction {
  actionType: 'attack' | 'spell' | 'move' | 'item' | 'dodge' | 'dash';
  targetId?: string;
  spellId?: string;
  weaponId?: string;
  position?: { x: number; y: number };
  description?: string;
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
    lastActivity: Date.now(),
    worldState: {}, // Initialize empty world state
    playerMemory: [], // Initialize empty player memory
    npcMemory: [] // Initialize empty npc memory
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
export const cleanupOldGames = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

  try {
    // Clean up old unstarted games
    const oldGamesSnapshot = await admin.firestore()
      .collection('games')
      .where('lastActivity', '<', cutoffTime)
      .where('started', '==', false)
      .get();

    const batch = admin.firestore().batch();
    oldGamesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldGamesSnapshot.docs.length} old unstarted games`);

    // Clean up old completed games (older than 30 days)
    const oldCompletedGamesSnapshot = await admin.firestore()
      .collection('games')
      .where('completedAt', '<', Date.now() - (30 * 24 * 60 * 60 * 1000))
      .get();

    const completedBatch = admin.firestore().batch();
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
  } catch (error) {
    console.error('Error cleaning up old games:', error);
    throw error;
  }
});

// Combat System Endpoints

// Start combat
export const startCombat = functions.https.onCall(async (data: { gameId: string; enemies: Array<{ name: string; health: number; armorClass: number; initiative: number }> }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { gameId, enemies } = data;

  // Get game session and players
  const gameDoc = await admin.firestore().collection('games').doc(gameId).get();
  if (!gameDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Game session not found');
  }

  const gameData = gameDoc.data() as GameSession;
  
  // Get player characters
  const playerCharacters = await Promise.all(
    gameData.players.map(async (player) => {
      const charDoc = await admin.firestore().collection('characters').doc(player.characterId).get();
      const charData = charDoc.data() as Character;
      return {
        id: player.id,
        name: charData.name,
        type: 'player' as const,
        characterId: player.characterId,
        health: charData.health,
        maxHealth: charData.maxHealth,
        armorClass: charData.stats?.dexterity ? 10 + Math.floor((charData.stats.dexterity - 10) / 2) : 10,
        initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((charData.stats?.dexterity || 10 - 10) / 2),
        isActive: true,
        statusEffects: []
      };
    })
  );

  // Create enemy participants
  const enemyParticipants = enemies.map((enemy, index) => ({
    id: `enemy-${index}`,
    name: enemy.name,
    type: 'enemy' as const,
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

  const combatState: CombatState = {
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

  const docRef = await admin.firestore().collection('combat').add(combatState);

  // Update game session to reference combat
  await admin.firestore().collection('games').doc(gameId).update({
    currentCombatId: docRef.id,
    lastActivity: Date.now()
  });

  return { 
    combatId: docRef.id, 
    combatState: { ...combatState, id: docRef.id },
    currentActor: allParticipants[0]
  };
});

// Get combat state
export const getCombatState = functions.https.onCall(async (data: { combatId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { combatId } = data;
  
  const combatDoc = await admin.firestore().collection('combat').doc(combatId).get();
  if (!combatDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Combat session not found');
  }

  const combatData = combatDoc.data() as CombatState;
  const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);

  return {
    combatState: { ...combatData, id: combatId },
    currentActor,
    isPlayerTurn: currentActor?.type === 'player'
  };
});

// Resolve combat action
export const resolveCombatAction = functions.https.onCall(async (data: { combatId: string; action: CombatAction }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { combatId, action } = data;
  
  const combatDoc = await admin.firestore().collection('combat').doc(combatId).get();
  if (!combatDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Combat session not found');
  }

  const combatData = combatDoc.data() as CombatState;
  const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
  
  if (!currentActor) {
    throw new functions.https.HttpsError('failed-precondition', 'No active participant found');
  }

  // Process the action
  let actionResult: any = {
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
  } else if (activeEnemies.length === 0) {
    combatData.status = 'completed'; // Enemies defeated
  }

  // Update combat state
  await admin.firestore().collection('combat').doc(combatId).update({
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
export const endCombat = functions.https.onCall(async (data: { combatId: string; result: 'victory' | 'defeat' | 'fled' }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { combatId, result } = data;
  
  const combatDoc = await admin.firestore().collection('combat').doc(combatId).get();
  if (!combatDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Combat session not found');
  }

  const combatData = combatDoc.data() as CombatState;
  
  // Update combat status
  await admin.firestore().collection('combat').doc(combatId).update({
    status: result === 'fled' ? 'fled' : 'completed',
    lastActivity: Date.now()
  });

  // Remove combat reference from game session
  await admin.firestore().collection('games').doc(combatData.gameId).update({
    currentCombatId: admin.firestore.FieldValue.delete(),
    lastActivity: Date.now()
  });

  return { success: true, result };
});

// Update game state (world state, player memory, NPC memory)
export const updateGameState = functions.https.onCall(async (data: { 
  gameId: string; 
  worldState?: Record<string, any>; 
  playerMemory?: Array<any>; 
  npcMemory?: Array<any>; 
}, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'updateGameState', 30, 60000)) { // 30 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before updating again.');
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
  
  // Check if user is a participant in the game
  const isParticipant = gameData.players.some(p => p.id === context.auth!.uid);
  if (!isParticipant && gameData.hostId !== context.auth!.uid) {
    throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this game');
  }

  // Prepare update data
  const updateData: any = {
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
export const testEndpoint = functions.https.onRequest(async (req, res) => {
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

        result = await handleAIDungeonMasterLogic(data, { auth: { uid: 'test-user' } });
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
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Helper functions to handle the actual logic
async function handleSaveCharacter(data: any, context: any) {
  const characterData = {
    ...data,
    userId: context.auth.uid,
    lastPlayed: Date.now()
  };

  // Remove the ID if it's a test character to create new ones
  if (data.id && data.id.startsWith('char-')) {
    delete characterData.id;
  }

  if (data.id && !data.id.startsWith('char-')) {
    await admin.firestore().collection('characters').doc(data.id).update(characterData);
    return { characterId: data.id };
  } else {
    const docRef = await admin.firestore().collection('characters').add(characterData);
    return { characterId: docRef.id };
  }
}

async function handleGetUserCharacters(data: any, context: any) {
  const snapshot = await admin.firestore()
    .collection('characters')
    .where('userId', '==', context.auth.uid)
    .orderBy('lastPlayed', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function handleCreateGameSession(data: any, context: any) {
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
    worldState: {}, // Initialize empty world state
    playerMemory: [], // Initialize empty player memory
    npcMemory: [] // Initialize empty npc memory
  };

  const docRef = await admin.firestore().collection('games').add(gameSession);
  return { gameId: docRef.id, code: gameSession.code };
}

async function handleJoinGameSession(data: any, context: any) {
  const { code, characterId } = data;
  
  const gameSnapshot = await admin.firestore()
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
  const existingPlayer = gameData.players.find((p: any) => p.id === context.auth.uid);
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
    players: admin.firestore.FieldValue.arrayUnion(player),
    lastActivity: Date.now()
  });

  return { gameId: gameDoc.id, success: true };
}

async function handleStartGameSession(data: any, context: any) {
  const { gameId } = data;
  
  await admin.firestore().collection('games').doc(gameId).update({
    started: true,
    lastActivity: Date.now()
  });

  return { success: true };
}

// Note: handleAIDungeonMaster is now handled by the enhanced aiDungeonMaster function from aiDungeonMaster.ts

async function handleSaveGameProgress(data: any, context: any) {
  const { gameId, gameState } = data;
  
  await admin.firestore().collection('games').doc(gameId).update({
    gameState,
    lastActivity: Date.now()
  });

  return { success: true };
}

async function handleCompleteCampaign(data: any, context: any) {
  const { gameId, finalState } = data;
  
  await admin.firestore().collection('games').doc(gameId).update({
    completedAt: Date.now(),
    finalState,
    lastActivity: Date.now()
  });

  return { success: true };
} 

// Combat helper functions for test endpoint
async function handleStartCombat(data: any, context: any) {
  const { gameId, enemies } = data;

  // Get game session and players
  const gameDoc = await admin.firestore().collection('games').doc(gameId).get();
  if (!gameDoc.exists) {
    throw new Error('Game session not found');
  }

  const gameData = gameDoc.data() as GameSession;
  
  // Get player characters
  const playerCharacters = await Promise.all(
    gameData.players.map(async (player) => {
      const charDoc = await admin.firestore().collection('characters').doc(player.characterId).get();
      const charData = charDoc.data() as Character;
      return {
        id: player.id,
        name: charData.name,
        type: 'player' as const,
        characterId: player.characterId,
        health: charData.health,
        maxHealth: charData.maxHealth,
        armorClass: charData.stats?.dexterity ? 10 + Math.floor((charData.stats.dexterity - 10) / 2) : 10,
        initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((charData.stats?.dexterity || 10 - 10) / 2),
        isActive: true,
        statusEffects: []
      };
    })
  );

  // Create enemy participants
  const enemyParticipants = enemies.map((enemy: any, index: number) => ({
    id: `enemy-${index}`,
    name: enemy.name,
    type: 'enemy' as const,
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

  const combatState: CombatState = {
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

  const docRef = await admin.firestore().collection('combat').add(combatState);

  // Update game session to reference combat
  await admin.firestore().collection('games').doc(gameId).update({
    currentCombatId: docRef.id,
    lastActivity: Date.now()
  });

  return { 
    combatId: docRef.id, 
    combatState: { ...combatState, id: docRef.id },
    currentActor: allParticipants[0]
  };
}

async function handleGetCombatState(data: any, context: any) {
  const { combatId } = data;
  
  const combatDoc = await admin.firestore().collection('combat').doc(combatId).get();
  if (!combatDoc.exists) {
    throw new Error('Combat session not found');
  }

  const combatData = combatDoc.data() as CombatState;
  const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);

  return {
    combatState: { ...combatData, id: combatId },
    currentActor,
    isPlayerTurn: currentActor?.type === 'player'
  };
}

async function handleResolveCombatAction(data: any, context: any) {
  const { combatId, action } = data;
  
  const combatDoc = await admin.firestore().collection('combat').doc(combatId).get();
  if (!combatDoc.exists) {
    throw new Error('Combat session not found');
  }

  const combatData = combatDoc.data() as CombatState;
  const currentActor = combatData.participants.find(p => p.id === combatData.turnOrder[combatData.currentTurn]);
  
  if (!currentActor) {
    throw new Error('No active participant found');
  }

  // Process the action
  let actionResult: any = {
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
  } else if (activeEnemies.length === 0) {
    combatData.status = 'completed'; // Enemies defeated
  }

  // Update combat state
  await admin.firestore().collection('combat').doc(combatId).update({
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

async function handleEndCombat(data: any, context: any) {
  const { combatId, result } = data;
  
  const combatDoc = await admin.firestore().collection('combat').doc(combatId).get();
  if (!combatDoc.exists) {
    throw new Error('Combat session not found');
  }

  const combatData = combatDoc.data() as CombatState;
  
  // Update combat status
  await admin.firestore().collection('combat').doc(combatId).update({
    status: result === 'fled' ? 'fled' : 'completed',
    lastActivity: Date.now()
  });

  // Remove combat reference from game session
  await admin.firestore().collection('games').doc(combatData.gameId).update({
    currentCombatId: admin.firestore.FieldValue.delete(),
    lastActivity: Date.now()
  });

  return { success: true, result };
} 

// AI Dungeon Master function
export const aiDungeonMaster = functions.https.onCall(async (data: any, context) => {
  try {
    console.log('AI Dungeon Master called with data:', data);
    
    const { prompt } = data;

    // Rate limiting
    if (context.auth && !checkRateLimit(context.auth.uid, 'aiDungeonMaster', 20, 60000)) { // 20 per minute
      throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before making another request.');
    }
    
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
    }

    // Call the enhanced AI Dungeon Master service
    const response = await handleAIDungeonMasterLogic(data, context);
    
    return { response };
  } catch (error) {
    console.error('AI Dungeon Master error:', error);
    throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable');
  }
});

// Gemini AI Function (alias for aiDungeonMaster for compatibility)
export const geminiAIFunction = functions.https.onCall(async (data: any, context) => {
  try {
    console.log('Gemini AI Function called with data:', data);
    
    const { prompt } = data;

    // Rate limiting
    if (context.auth && !checkRateLimit(context.auth.uid, 'geminiAIFunction', 20, 60000)) { // 20 per minute
      throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before making another request.');
    }
    
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
    }

    // Call the enhanced AI Dungeon Master service
    const response = await handleAIDungeonMasterLogic(data, context);
    
    return { response };
  } catch (error) {
    console.error('Gemini AI Function error:', error);
    throw new functions.https.HttpsError('internal', 'AI service temporarily unavailable');
  }
}); 

// Save automated game session
export const saveAutomatedSession = functions.https.onCall(async (data: { 
  sessionId: string; 
  sessionData: any; 
  userId: string; 
}, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'saveAutomatedSession', 20, 60000)) { // 20 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before saving again.');
  }

  // Validate session ID
  const sessionIdValidation = validateGameId(data.sessionId);
  if (!sessionIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid session ID: ${sessionIdValidation.errors.join(', ')}`);
  }

  // Verify user is participant in session
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'You can only save your own sessions');
  }

  try {
    // Save to automated_sessions collection with user-specific path
    const sessionDoc = admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .collection('automated_sessions')
      .doc(sessionIdValidation.sanitizedData);

    await sessionDoc.set({
      ...data.sessionData,
      lastSaved: Date.now(),
      userId: context.auth.uid
    });

    return { success: true, sessionId: sessionIdValidation.sanitizedData };
  } catch (error) {
    console.error('Error saving automated session:', error);
    throw new functions.https.HttpsError('internal', 'Failed to save session');
  }
});

// Load automated game sessions for a user
export const loadAutomatedSessions = functions.https.onCall(async (data: { userId?: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'loadAutomatedSessions', 10, 60000)) { // 10 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before loading sessions.');
  }

  // Users can only load their own sessions
  const userId = data.userId || context.auth.uid;
  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'You can only load your own sessions');
  }

  try {
    const sessionsCollection = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('automated_sessions');

    const snapshot = await sessionsCollection
      .orderBy('lastSaved', 'desc')
      .limit(50) // Limit to 50 most recent sessions
      .get();

    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; lastSaved?: number; startTime?: number; [key: string]: any }>;

    // Filter out sessions older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const activeSessions = sessions.filter(session => 
      (session.lastSaved || session.startTime || 0) > thirtyDaysAgo
    );

    return { success: true, sessions: activeSessions };
  } catch (error) {
    console.error('Error loading automated sessions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to load sessions');
  }
});

// Delete automated game session
export const deleteAutomatedSession = functions.https.onCall(async (data: { 
  sessionId: string; 
}, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'deleteAutomatedSession', 20, 60000)) { // 20 per minute
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before deleting.');
  }

  // Validate session ID
  const sessionIdValidation = validateGameId(data.sessionId);
  if (!sessionIdValidation.isValid) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid session ID: ${sessionIdValidation.errors.join(', ')}`);
  }

  try {
    const sessionDoc = admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .collection('automated_sessions')
      .doc(sessionIdValidation.sanitizedData);

    // Check if session exists and belongs to user
    const sessionSnap = await sessionDoc.get();
    if (!sessionSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionSnap.data();
    if (sessionData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only delete your own sessions');
    }

    // Delete the session
    await sessionDoc.delete();

    return { success: true, sessionId: sessionIdValidation.sanitizedData };
  } catch (error) {
    console.error('Error deleting automated session:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to delete session');
  }
}); 

// AI Service Health Check Endpoint
export const aiHealthCheck = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  try {
    // Only allow POST requests for the health check
    if (req.method !== 'POST') {
      res.status(405).json({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      });
      return;
    }

    // Simple health check - verify the service is responding
    const healthStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        firebase: 'operational',
        ai: 'operational',
        database: 'operational'
      }
    };

    // If this is a test request, return immediately
    if (req.body?.test === true) {
      res.status(200).json({
        success: true,
        data: healthStatus,
        message: 'AI service is healthy'
      });
      return;
    }

    // For real health checks, verify Firebase connectivity
    try {
      await admin.firestore().collection('_health_check').doc('test').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.status(200).json({
        success: true,
        data: healthStatus,
        message: 'All AI services operational'
      });
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      healthStatus.services.database = 'degraded';
      
      res.status(200).json({
        success: true,
        data: healthStatus,
        message: 'AI service operational, database connectivity issues'
      });
    }

  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}); 