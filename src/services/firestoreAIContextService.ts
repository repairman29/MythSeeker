import { db, auth } from '../firebaseService';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { embeddingsMemoryService } from './embeddingsMemoryService';

// Firestore-optimized AI context interfaces based on spec
export interface FirestoreGameState {
  campaignId: string;
  currentTurnNumber: number;
  globalEvents: Array<{
    timestamp: number;
    type: string;
    description: string;
    affectedEntities: string[];
  }>;
  weatherConditions: string;
  timeOfDay: string;
  activeQuests: Array<{
    id: string;
    status: string;
    objectives: string[];
    associatedNpcs: string[];
  }>;
  lastUpdated: any; // serverTimestamp
}

export interface FirestorePlayerProfile {
  playerId: string;
  lastKnownLocation: string;
  lastLoginTimestamp: any; // serverTimestamp
  progressInCampaigns: Record<string, any>;
  interactionHistoryWithNpcs: Array<{
    npcId: string;
    timestamp: number;
    summaryOfInteraction: string;
  }>;
  playerArchetype: string;
  preferences: string[];
  emotionalProfile: {
    dominantTones: string[];
    relationshipStyle: string;
    preferredNarrativeStyle: string;
  };
}

export interface FirestoreNPCProfile {
  npcId: string;
  name: string;
  personalityTraits: string[];
  backstory: string;
  goalsMotivations: string[];
  relationshipsWithOtherNpcs: Record<string, {
    relationshipType: string;
    intensity: number;
  }>;
  relationshipsWithPlayers: Record<string, {
    relationshipType: string;
    intensity: number;
    trust: number;
    lastInteraction: number;
  }>;
  dialogueHistory: Array<{
    playerId: string;
    timestamp: number;
    dialogueSegment: string;
    emotionalTone: string;
  }>;
  knowledgeBase: string[];
  currentGoals: string[];
  emotionalState: string;
}

export interface FirestoreWorldLore {
  loreId: string;
  topic: string;
  description: string;
  relatedEntities: string[];
  historicalEvents: Array<{
    eventId: string;
    timestamp: number;
    description: string;
    consequences: string[];
  }>;
  relevanceScore: number;
  realm: string;
}

/**
 * Firestore-Based AI Context Service
 * 
 * Implements the Firebase spec architecture with our enhanced AI framework
 * for scalable, persistent, and context-aware AI responses.
 */
export class FirestoreAIContextService {
  private readonly COLLECTIONS = {
    gameStates: 'gameStates',
    playerProfiles: 'playerProfiles', 
    npcProfiles: 'npcProfiles',
    worldLore: 'worldLore',
    aiInteractions: 'aiInteractions'
  };

  /**
   * Get comprehensive context for NPC interaction (spec implementation)
   */
  async getContextForNPCInteraction(
    playerId: string,
    npcId: string,
    playerInput: string,
    campaignId: string
  ): Promise<{
    playerContext: FirestorePlayerProfile;
    npcContext: FirestoreNPCProfile;
    gameContext: FirestoreGameState;
    relevantLore: FirestoreWorldLore[];
    semanticMemories: any[];
    contextPrompt: string;
  }> {
    console.log('🏛️ Firestore AI Context: Building comprehensive context...');

    try {
      // Parallel data fetching for performance
      const [playerProfile, npcProfile, gameState] = await Promise.all([
        this.getPlayerProfile(playerId),
        this.getNPCProfile(npcId),
        this.getGameState(campaignId)
      ]);

      // Get relevant world lore based on current context
      const relevantLore = await this.getRelevantWorldLore(
        gameState?.activeQuests || [],
        gameState?.currentTurnNumber || 0,
        npcProfile?.knowledgeBase || []
      );

      // Get semantic memories for enhanced context
      const semanticMemories = await embeddingsMemoryService.retrieveRelevantMemories(
        playerInput,
        {
          limit: 8,
          threshold: 0.7,
          contextFilters: {
            characters: [playerId, npcId],
            realm: gameState?.weatherConditions || 'fantasy' // Using weatherConditions as realm proxy
          }
        }
      );

      // Build comprehensive context prompt
      const contextPrompt = this.buildNPCInteractionPrompt({
        playerProfile,
        npcProfile,
        gameState,
        relevantLore,
        semanticMemories,
        playerInput
      });

      return {
        playerContext: playerProfile,
        npcContext: npcProfile,
        gameContext: gameState,
        relevantLore,
        semanticMemories,
        contextPrompt
      };
    } catch (error) {
      console.error('❌ Failed to get NPC interaction context:', error);
      throw error;
    }
  }

  /**
   * Get context for game join stage-setting (spec implementation)
   */
  async getContextForGameJoin(
    playerId: string,
    campaignId: string
  ): Promise<{
    playerContext: FirestorePlayerProfile;
    gameContext: FirestoreGameState;
    relevantLore: FirestoreWorldLore[];
    stageSettingPrompt: string;
  }> {
    console.log('🎭 Firestore AI Context: Building stage-setting context...');

    try {
      const [playerProfile, gameState] = await Promise.all([
        this.getPlayerProfile(playerId),
        this.getGameState(campaignId)
      ]);

      // Get world lore relevant to current campaign state
      const relevantLore = await this.getRelevantWorldLore(
        gameState?.globalEvents || [],
        gameState?.currentTurnNumber || 0,
        []
      );

      // Build stage-setting prompt
      const stageSettingPrompt = this.buildStageSettingPrompt({
        playerProfile,
        gameState,
        relevantLore
      });

      return {
        playerContext: playerProfile,
        gameContext: gameState,
        relevantLore,
        stageSettingPrompt
      };
    } catch (error) {
      console.error('❌ Failed to get game join context:', error);
      throw error;
    }
  }

  /**
   * Update player profile with interaction data
   */
  async updatePlayerProfile(playerId: string, updates: Partial<FirestorePlayerProfile>): Promise<void> {
    try {
      const playerDoc = doc(db, this.COLLECTIONS.playerProfiles, playerId);
      await updateDoc(playerDoc, {
        ...updates,
        lastLoginTimestamp: serverTimestamp()
      });
      console.log('👤 Updated player profile for:', playerId);
    } catch (error) {
      console.error('❌ Failed to update player profile:', error);
    }
  }

  /**
   * Update NPC profile with interaction data
   */
  async updateNPCProfile(npcId: string, updates: Partial<FirestoreNPCProfile>): Promise<void> {
    try {
      const npcDoc = doc(db, this.COLLECTIONS.npcProfiles, npcId);
      await updateDoc(npcDoc, updates);
      console.log('🤖 Updated NPC profile for:', npcId);
    } catch (error) {
      console.error('❌ Failed to update NPC profile:', error);
    }
  }

  /**
   * Record AI interaction for analysis and improvement
   */
  async recordAIInteraction(
    playerId: string,
    npcId: string,
    playerInput: string,
    aiResponse: string,
    contextData: any
  ): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTIONS.aiInteractions), {
        playerId,
        npcId,
        playerInput,
        aiResponse,
        contextData,
        timestamp: serverTimestamp()
      });

      // Update player-NPC relationship
      await this.updatePlayerNPCRelationship(playerId, npcId, playerInput, aiResponse);
      
      console.log('📝 Recorded AI interaction');
    } catch (error) {
      console.error('❌ Failed to record AI interaction:', error);
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private async getPlayerProfile(playerId: string): Promise<FirestorePlayerProfile> {
    try {
      const playerDoc = await getDoc(doc(db, this.COLLECTIONS.playerProfiles, playerId));
      
      if (playerDoc.exists()) {
        return playerDoc.data() as FirestorePlayerProfile;
      } else {
        // Create default player profile
        const defaultProfile: FirestorePlayerProfile = {
          playerId,
          lastKnownLocation: 'Starting Area',
          lastLoginTimestamp: serverTimestamp(),
          progressInCampaigns: {},
          interactionHistoryWithNpcs: [],
          playerArchetype: 'balanced',
          preferences: [],
          emotionalProfile: {
            dominantTones: ['curious'],
            relationshipStyle: 'friendly',
            preferredNarrativeStyle: 'balanced'
          }
        };

        await setDoc(doc(db, this.COLLECTIONS.playerProfiles, playerId), defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('❌ Failed to get player profile:', error);
      // Return minimal profile as fallback
      return {
        playerId,
        lastKnownLocation: 'Unknown',
        lastLoginTimestamp: serverTimestamp(),
        progressInCampaigns: {},
        interactionHistoryWithNpcs: [],
        playerArchetype: 'balanced',
        preferences: [],
        emotionalProfile: {
          dominantTones: ['neutral'],
          relationshipStyle: 'cautious',
          preferredNarrativeStyle: 'balanced'
        }
      };
    }
  }

  private async getNPCProfile(npcId: string): Promise<FirestoreNPCProfile> {
    try {
      const npcDoc = await getDoc(doc(db, this.COLLECTIONS.npcProfiles, npcId));
      
      if (npcDoc.exists()) {
        return npcDoc.data() as FirestoreNPCProfile;
      } else {
        // Create default NPC profile based on ID
        const defaultProfile = this.createDefaultNPCProfile(npcId);
        await setDoc(doc(db, this.COLLECTIONS.npcProfiles, npcId), defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('❌ Failed to get NPC profile:', error);
      return this.createDefaultNPCProfile(npcId);
    }
  }

  private async getGameState(campaignId: string): Promise<FirestoreGameState> {
    try {
      const gameDoc = await getDoc(doc(db, this.COLLECTIONS.gameStates, campaignId));
      
      if (gameDoc.exists()) {
        return gameDoc.data() as FirestoreGameState;
      } else {
        // Create default game state
        const defaultState: FirestoreGameState = {
          campaignId,
          currentTurnNumber: 1,
          globalEvents: [],
          weatherConditions: 'Clear',
          timeOfDay: 'Day',
          activeQuests: [],
          lastUpdated: serverTimestamp()
        };

        await setDoc(doc(db, this.COLLECTIONS.gameStates, campaignId), defaultState);
        return defaultState;
      }
    } catch (error) {
      console.error('❌ Failed to get game state:', error);
      return {
        campaignId,
        currentTurnNumber: 1,
        globalEvents: [],
        weatherConditions: 'Clear',
        timeOfDay: 'Day',
        activeQuests: [],
        lastUpdated: serverTimestamp()
      };
    }
  }

  private async getRelevantWorldLore(
    activeQuests: any[],
    currentTurn: number,
    npcKnowledge: string[]
  ): Promise<FirestoreWorldLore[]> {
    try {
      // Build query based on current context
      const loreQuery = query(
        collection(db, this.COLLECTIONS.worldLore),
        orderBy('relevanceScore', 'desc'),
        limit(5)
      );

      const loreSnapshot = await getDocs(loreQuery);
      return loreSnapshot.docs.map(doc => doc.data() as FirestoreWorldLore);
    } catch (error) {
      console.error('❌ Failed to get world lore:', error);
      return [];
    }
  }

  private createDefaultNPCProfile(npcId: string): FirestoreNPCProfile {
    // Generate basic NPC profile based on ID patterns
    const npcName = npcId.charAt(0).toUpperCase() + npcId.slice(1);
    
    return {
      npcId,
      name: npcName,
      personalityTraits: ['mysterious', 'helpful'],
      backstory: `${npcName} is a local figure with their own motivations and goals.`,
      goalsMotivations: ['Help adventurers', 'Protect the community'],
      relationshipsWithOtherNpcs: {},
      relationshipsWithPlayers: {},
      dialogueHistory: [],
      knowledgeBase: ['local area', 'recent events'],
      currentGoals: ['Be helpful'],
      emotionalState: 'neutral'
    };
  }

  private buildNPCInteractionPrompt(params: {
    playerProfile: FirestorePlayerProfile;
    npcProfile: FirestoreNPCProfile;
    gameState: FirestoreGameState;
    relevantLore: FirestoreWorldLore[];
    semanticMemories: any[];
    playerInput: string;
  }): string {
    const { playerProfile, npcProfile, gameState, relevantLore, semanticMemories, playerInput } = params;

    return `You are ${npcProfile.name}, a ${npcProfile.personalityTraits.join(', ')} character in an RPG world.

CURRENT SITUATION:
- Time: ${gameState.timeOfDay}
- Weather: ${gameState.weatherConditions}  
- Location: ${playerProfile.lastKnownLocation}
- Turn: ${gameState.currentTurnNumber}

YOUR CHARACTER:
- Personality: ${npcProfile.personalityTraits.join(', ')}
- Current Goals: ${npcProfile.currentGoals.join(', ')}
- Emotional State: ${npcProfile.emotionalState}
- Knowledge: ${npcProfile.knowledgeBase.join(', ')}

PLAYER CONTEXT:
- Archetype: ${playerProfile.playerArchetype}
- Relationship: ${npcProfile.relationshipsWithPlayers[playerProfile.playerId]?.relationshipType || 'unknown'}
- Trust Level: ${npcProfile.relationshipsWithPlayers[playerProfile.playerId]?.trust || 0}/100

RELEVANT MEMORIES:
${semanticMemories.map(m => `- ${m.content.substring(0, 80)}...`).join('\n')}

WORLD CONTEXT:
${relevantLore.map(lore => `- ${lore.topic}: ${lore.description.substring(0, 100)}...`).join('\n')}

ACTIVE QUESTS:
${gameState.activeQuests.map(q => `- ${q.id}: ${q.objectives.join(', ')}`).join('\n')}

PLAYER SAYS: "${playerInput}"

Respond as ${npcProfile.name} would, considering your personality, goals, and relationship with this player. Keep responses concise but engaging.`;
  }

  private buildStageSettingPrompt(params: {
    playerProfile: FirestorePlayerProfile;
    gameState: FirestoreGameState;
    relevantLore: FirestoreWorldLore[];
  }): string {
    const { playerProfile, gameState, relevantLore } = params;

    return `Create an immersive stage-setting description for a player entering the game world.

PLAYER CONTEXT:
- Archetype: ${playerProfile.playerArchetype}
- Last Location: ${playerProfile.lastKnownLocation}
- Preferred Style: ${playerProfile.emotionalProfile.preferredNarrativeStyle}

WORLD STATE:
- Time: ${gameState.timeOfDay}
- Weather: ${gameState.weatherConditions}
- Current Events: ${gameState.globalEvents.slice(-3).map(e => e.description).join(', ')}
- Active Quests: ${gameState.activeQuests.length}

WORLD LORE:
${relevantLore.map(lore => `- ${lore.topic}: ${lore.description}`).join('\n')}

Create a vivid, engaging description that:
1. Sets the current scene and atmosphere
2. References relevant world events and lore
3. Provides clear direction for player action
4. Matches the player's preferred narrative style

Focus on immersion and giving the player a sense of purpose and direction.`;
  }

  private async updatePlayerNPCRelationship(
    playerId: string,
    npcId: string,
    playerInput: string,
    aiResponse: string
  ): Promise<void> {
    try {
      // Analyze interaction tone and update relationship
      const relationshipChange = this.analyzeRelationshipChange(playerInput, aiResponse);
      
      // Update NPC's record of this player
      const npcDoc = doc(db, this.COLLECTIONS.npcProfiles, npcId);
      const npcProfile = await getDoc(npcDoc);
      
      if (npcProfile.exists()) {
        const currentData = npcProfile.data() as FirestoreNPCProfile;
        const currentRelationship = currentData.relationshipsWithPlayers[playerId] || {
          relationshipType: 'neutral',
          intensity: 0,
          trust: 50,
          lastInteraction: 0
        };

        const updatedRelationship = {
          relationshipType: relationshipChange.newType || currentRelationship.relationshipType,
          intensity: Math.max(-100, Math.min(100, currentRelationship.intensity + relationshipChange.intensityDelta)),
          trust: Math.max(0, Math.min(100, currentRelationship.trust + relationshipChange.trustDelta)),
          lastInteraction: Date.now()
        };

        await updateDoc(npcDoc, {
          [`relationshipsWithPlayers.${playerId}`]: updatedRelationship,
          dialogueHistory: [...(currentData.dialogueHistory || []), {
            playerId,
            timestamp: Date.now(),
            dialogueSegment: playerInput.substring(0, 100),
            emotionalTone: relationshipChange.emotionalTone
          }].slice(-20) // Keep last 20 interactions
        });
      }
    } catch (error) {
      console.error('❌ Failed to update player-NPC relationship:', error);
    }
  }

  private analyzeRelationshipChange(playerInput: string, aiResponse: string): {
    intensityDelta: number;
    trustDelta: number;
    emotionalTone: string;
    newType?: string;
  } {
    const input = playerInput.toLowerCase();
    let intensityDelta = 0;
    let trustDelta = 0;
    let emotionalTone = 'neutral';

    // Positive interactions
    if (/help|assist|thank|please|kind|good/i.test(input)) {
      intensityDelta += 5;
      trustDelta += 3;
      emotionalTone = 'positive';
    }

    // Negative interactions
    if (/attack|threaten|rude|steal|lie/i.test(input)) {
      intensityDelta -= 8;
      trustDelta -= 10;
      emotionalTone = 'negative';
    }

    // Neutral but engaged
    if (/ask|question|tell|information/i.test(input)) {
      intensityDelta += 1;
      trustDelta += 1;
      emotionalTone = 'engaged';
    }

    return { intensityDelta, trustDelta, emotionalTone };
  }
}

// Export singleton instance
export const firestoreAIContextService = new FirestoreAIContextService(); 