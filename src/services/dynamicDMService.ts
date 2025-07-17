import { firebaseService } from '../firebaseService';
import { aiService } from './aiService';
import { NPCService } from './npcService';

// Types for the Dynamic DM System
export interface PlayerInput {
  message: string;
  playerId: string;
  timestamp: Date;
  campaignId: string;
}

export interface SentimentAnalysis {
  emotion: 'frustrated' | 'excited' | 'confused' | 'bored' | 'engaged' | 'neutral';
  intensity: number; // 0-1 scale
  confidence: number; // 0-1 scale
}

export interface IntentRecognition {
  intent: 'attack' | 'investigate' | 'talk_to_npc' | 'ask_question' | 'express_feeling' | 'use_skill' | 'cast_spell' | 'move' | 'other';
  confidence: number;
  subIntent?: string;
}

export interface EntityExtraction {
  characters: string[];
  items: string[];
  locations: string[];
  actions: string[];
  spells: string[];
  skills: string[];
}

export interface GameState {
  current_location: {
    id: string;
    description: string;
    encounters: any[];
    npcs: any[];
    items: any[];
  };
  active_npcs: Array<{
    id: string;
    name: string;
    hp: number;
    status: 'neutral' | 'friendly' | 'hostile' | 'aggro';
    dialogue_tree?: string;
    personality?: string;
  }>;
  party_position: { x: number; y: number };
  active_quests: Array<{
    id: string;
    title: string;
    status: 'in_progress' | 'completed' | 'failed';
    objectives: string[];
  }>;
  inventory: Array<{
    item_id: string;
    name: string;
    owner: string;
    quantity: number;
  }>;
  campaign_context: {
    theme: string;
    current_scene: string;
    tension_level: number;
    last_major_event: string;
  };
}

export interface PlayerProfile {
  character_sheet: {
    name: string;
    class: string;
    level: number;
    stats: Record<string, number>;
    abilities: string[];
  };
  preferences: {
    combat_preference: 'high' | 'medium' | 'low';
    roleplay_preference: 'high' | 'medium' | 'low';
    puzzle_preference: 'high' | 'medium' | 'low';
    humor_style: 'witty' | 'sarcastic' | 'silly' | 'serious';
    narrative_style: 'cinematic' | 'tactical' | 'immersive';
  };
  backstory_keywords: string[];
  out_of_character_notes: string[];
  interaction_history: Array<{
    timestamp: Date;
    context: string;
    ai_response_type: string;
    player_satisfaction?: number;
  }>;
}

export interface DMPersona {
  tone: 'witty' | 'serious' | 'dramatic' | 'humorous' | 'mysterious' | 'friendly';
  humor_level: 'none' | 'low' | 'medium' | 'high';
  descriptiveness: 'minimal' | 'moderate' | 'high' | 'verbose';
  challenge_level: 'easy' | 'moderate' | 'hard' | 'deadly';
  narrative_focus: 'action' | 'character' | 'exploration' | 'puzzle' | 'balanced';
  improvisation_style: 'conservative' | 'moderate' | 'wild';
}

export interface DynamicResponse {
  narrative_text: string;
  npc_dialogue?: string;
  system_actions: Array<{
    type: 'dice_roll' | 'stat_update' | 'image_display' | 'sound_effect' | 'state_change';
    parameters: Record<string, any>;
  }>;
  game_state_updates: Partial<GameState>;
  follow_up_prompts?: string[];
  mood_adjustment?: {
    tension_delta: number;
    engagement_boost: boolean;
  };
}

export class DynamicDMService {
  private static instance: DynamicDMService;
  private sentimentKeywords: Record<string, string[]> = {};
  private intentPatterns: Record<string, RegExp[]> = {};
  private entityMatchers: Record<string, RegExp> = {};
  private npcService: NPCService;

  constructor() {
    this.initializeNLPComponents();
    this.npcService = new NPCService();
  }

  public static getInstance(): DynamicDMService {
    if (!DynamicDMService.instance) {
      DynamicDMService.instance = new DynamicDMService();
    }
    return DynamicDMService.instance;
  }

  private initializeNLPComponents(): void {
    // Sentiment analysis keywords
    this.sentimentKeywords = {
      frustrated: ['stuck', 'confused', 'annoyed', 'tired', 'bored', 'what', 'help', 'don\'t understand'],
      excited: ['awesome', 'amazing', 'cool', 'yes!', 'let\'s go', 'epic', 'love this', 'fantastic'],
      confused: ['what', 'how', 'why', 'huh', 'confused', 'lost', 'don\'t get it'],
      bored: ['boring', 'meh', 'whatever', 'ok', 'sure', 'I guess'],
      engaged: ['tell me more', 'what happens', 'I want to', 'let me', 'can I', 'interesting']
    };

    // Intent recognition patterns
    this.intentPatterns = {
      attack: [/I attack/i, /I fight/i, /I strike/i, /I hit/i, /combat/i, /charge/i],
      investigate: [/I look/i, /I search/i, /I examine/i, /I check/i, /I investigate/i, /perception/i],
      talk_to_npc: [/I talk to/i, /I speak with/i, /I ask/i, /I tell/i, /conversation/i, /say/i],
      ask_question: [/what is/i, /who is/i, /where is/i, /how do/i, /can I/i, /\?/],
      use_skill: [/I use/i, /skill check/i, /I try to/i, /attempt/i, /roll/i],
      cast_spell: [/I cast/i, /spell/i, /magic/i, /incantation/i],
      move: [/I go/i, /I move/i, /I walk/i, /I run/i, /direction/i, /north|south|east|west/i]
    };

    // Entity extraction patterns
    this.entityMatchers = {
      characters: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Proper names
      items: /\b(sword|shield|potion|staff|bow|armor|helmet|ring|amulet|scroll)\b/gi,
      locations: /\b(forest|cave|castle|tavern|dungeon|mountain|river|bridge|door|room)\b/gi,
      actions: /\b(attack|defend|cast|drink|equip|move|search|talk|investigate|climb|jump)\b/gi,
      spells: /\b(fireball|heal|magic missile|shield|invisibility|teleport|charm)\b/gi,
      skills: /\b(perception|stealth|athletics|acrobatics|persuasion|deception|insight)\b/gi
    };
  }

  // CORE LOOP IMPLEMENTATION
  public async processPlayerInput(input: PlayerInput): Promise<DynamicResponse> {
    console.log('🎲 Dynamic DM: Processing player input...', input.message);

    try {
      // Step 1: Pre-processing
      const sentiment = this.analyzeSentiment(input.message);
      const intent = this.recognizeIntent(input.message);
      const entities = this.extractEntities(input.message);

      console.log('📊 Sentiment:', sentiment);
      console.log('🎯 Intent:', intent);
      console.log('🔍 Entities:', entities);

      // Step 2: Contextual Awareness & Memory Retrieval
      const gameState = await this.getGameState(input.campaignId);
      const playerProfile = await this.getPlayerProfile(input.playerId);
      const dmPersona = await this.getDMPersona(input.campaignId);

      // Step 3: AI Processing & Decision Making
      const richPrompt = this.constructRichPrompt({
        originalInput: input.message,
        sentiment,
        intent,
        entities,
        gameState,
        playerProfile,
        dmPersona
      });

      // Step 4: Dynamic Response Generation
      const aiResponse = await aiService.generateEnhancedDynamicResponse(richPrompt);
      const dynamicResponse = await this.processAIResponse(aiResponse, {
        sentiment,
        intent,
        gameState,
        playerProfile,
        campaignId: input.campaignId
      });

      // Step 5: Action Execution & Output Generation
      await this.executeSystemActions(dynamicResponse.system_actions, input.campaignId);
      await this.updateGameState(input.campaignId, dynamicResponse.game_state_updates);
      await this.logInteraction(input, dynamicResponse);

      return dynamicResponse;

    } catch (error) {
      console.error('❌ Dynamic DM Error:', error);
      return this.generateFallbackResponse(input.message);
    }
  }

  // NLP PREPROCESSING METHODS
  private analyzeSentiment(message: string): SentimentAnalysis {
    const lowerMessage = message.toLowerCase();
    let detectedEmotion: SentimentAnalysis['emotion'] = 'neutral';
    let maxMatchCount = 0;

    // Check each emotion's keywords
    for (const [emotion, keywords] of Object.entries(this.sentimentKeywords)) {
      const matchCount = keywords.filter(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      ).length;

      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        detectedEmotion = emotion as SentimentAnalysis['emotion'];
      }
    }

    // Calculate intensity based on punctuation and caps
    const exclamationCount = (message.match(/!/g) || []).length;
    const questionCount = (message.match(/\?/g) || []).length;
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    
    const intensity = Math.min(1, (exclamationCount * 0.3 + questionCount * 0.2 + capsRatio * 0.5 + maxMatchCount * 0.4));
    const confidence = maxMatchCount > 0 ? 0.7 + (maxMatchCount * 0.1) : 0.3;

    return {
      emotion: detectedEmotion,
      intensity,
      confidence: Math.min(1, confidence)
    };
  }

  private recognizeIntent(message: string): IntentRecognition {
    let bestIntent: IntentRecognition['intent'] = 'other';
    let maxConfidence = 0;

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      const matchCount = patterns.filter(pattern => pattern.test(message)).length;
      const confidence = matchCount > 0 ? 0.8 + (matchCount * 0.1) : 0;
      
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestIntent = intent as IntentRecognition['intent'];
      }
    }

    return {
      intent: bestIntent,
      confidence: Math.min(1, maxConfidence)
    };
  }

  private extractEntities(message: string): EntityExtraction {
    const entities: EntityExtraction = {
      characters: [],
      items: [],
      locations: [],
      actions: [],
      spells: [],
      skills: []
    };

    for (const [entityType, matcher] of Object.entries(this.entityMatchers)) {
      const matches = message.match(matcher) || [];
      entities[entityType as keyof EntityExtraction] = [...new Set(matches.map(m => m.toLowerCase()))];
    }

    return entities;
  }

  // CONTEXTUAL AWARENESS METHODS
  private async getGameState(campaignId: string): Promise<GameState> {
    try {
      // TODO: Implement proper Firebase integration when methods are available
      // For now, return default state
      return this.getDefaultGameState();
    } catch (error) {
      console.warn('Could not retrieve game state, using default');
      return this.getDefaultGameState();
    }
  }

  private async getPlayerProfile(playerId: string): Promise<PlayerProfile> {
    try {
      // TODO: Implement proper Firebase integration when methods are available
      // For now, return default profile
      return this.getDefaultPlayerProfile();
    } catch (error) {
      console.warn('Could not retrieve player profile, using default');
      return this.getDefaultPlayerProfile();
    }
  }

  private async getDMPersona(campaignId: string): Promise<DMPersona> {
    try {
      // TODO: Implement proper Firebase integration when methods are available
      // For now, return default persona
      return this.getDefaultDMPersona();
    } catch (error) {
      console.warn('Could not retrieve DM persona, using default');
      return this.getDefaultDMPersona();
    }
  }

  // PROMPT CONSTRUCTION
  private constructRichPrompt(context: {
    originalInput: string;
    sentiment: SentimentAnalysis;
    intent: IntentRecognition;
    entities: EntityExtraction;
    gameState: GameState;
    playerProfile: PlayerProfile;
    dmPersona: DMPersona;
  }): string {
    const { originalInput, sentiment, intent, entities, gameState, playerProfile, dmPersona } = context;

    return `
🎲 DYNAMIC DM SYSTEM 🎲

PLAYER INPUT: "${originalInput}"

EMOTIONAL CONTEXT:
- Sentiment: ${sentiment.emotion} (intensity: ${sentiment.intensity.toFixed(2)})
- Player seems: ${sentiment.emotion === 'frustrated' ? 'They might need help or encouragement' : 
                 sentiment.emotion === 'excited' ? 'They\'re engaged! Keep the energy up' :
                 sentiment.emotion === 'confused' ? 'Provide clear guidance' : 'Maintain current flow'}

INTENT & ENTITIES:
- Primary Intent: ${intent.intent}
- Detected: Characters[${entities.characters.join(', ')}] Items[${entities.items.join(', ')}] Locations[${entities.locations.join(', ')}]

CURRENT SITUATION:
- Location: ${gameState.current_location.description}
- Active NPCs: ${gameState.active_npcs.map(npc => `${npc.name}(${npc.status})`).join(', ')}
- Current Scene: ${gameState.campaign_context.current_scene}
- Tension Level: ${gameState.campaign_context.tension_level}/10

PLAYER PERSONALITY:
- Prefers: ${playerProfile.preferences.combat_preference} combat, ${playerProfile.preferences.roleplay_preference} roleplay
- Humor Style: ${playerProfile.preferences.humor_style}
- Backstory Elements: ${playerProfile.backstory_keywords.join(', ')}

DM PERSONA SETTINGS:
- Tone: ${dmPersona.tone}
- Humor Level: ${dmPersona.humor_level}
- Descriptiveness: ${dmPersona.descriptiveness}
- Challenge: ${dmPersona.challenge_level}

INSTRUCTIONS:
Generate a response that:
1. ${sentiment.emotion === 'frustrated' ? 'Provides gentle guidance or lowers difficulty slightly' :
     sentiment.emotion === 'excited' ? 'Maintains high energy and dramatic tension' :
     sentiment.emotion === 'confused' ? 'Clarifies the situation clearly' : 'Continues the narrative flow'}

2. Matches the ${dmPersona.tone} tone with ${dmPersona.humor_level} humor

3. ${intent.intent === 'attack' ? 'Describes combat outcome, possibly rolling dice' :
     intent.intent === 'investigate' ? 'Reveals information based on perception' :
     intent.intent === 'talk_to_npc' ? 'Provides NPC dialogue and personality' :
     'Responds appropriately to the detected intent'}

4. Weaves in relevant backstory elements: ${playerProfile.backstory_keywords.slice(0, 2).join(', ')}

5. Uses vivid, ${dmPersona.descriptiveness} descriptions

Format your response as:
NARRATIVE: [Main story response]
NPC_DIALOGUE: [If applicable, NPC speech in quotes]
SYSTEM_ACTION: [Any dice rolls, stat changes, or effects needed]
MOOD: [How this affects scene tension: +1/0/-1]
`;
  }

  // AI RESPONSE PROCESSING
  private async processAIResponse(aiResponse: string, context: any): Promise<DynamicResponse> {
    // Parse AI response for different components
    const narrative = this.extractSection(aiResponse, 'NARRATIVE') || aiResponse;
    const npcDialogue = this.extractSection(aiResponse, 'NPC_DIALOGUE');
    const systemAction = this.extractSection(aiResponse, 'SYSTEM_ACTION');
    const moodChange = this.extractSection(aiResponse, 'MOOD');

    const systemActions = [];
    const gameStateUpdates: Partial<GameState> = {};

    // Process system actions
    if (systemAction) {
      if (systemAction.includes('roll')) {
        systemActions.push({
          type: 'dice_roll' as const,
          parameters: { dice: '1d20', reason: 'action_resolution' }
        });
      }
      if (systemAction.includes('damage') || systemAction.includes('heal')) {
        systemActions.push({
          type: 'stat_update' as const,
          parameters: { type: 'health', change: this.extractNumber(systemAction) }
        });
      }
    }

    // Process mood changes
    if (moodChange) {
      const tensionDelta = this.extractNumber(moodChange);
      if (tensionDelta !== 0) {
        gameStateUpdates.campaign_context = {
          ...context.gameState.campaign_context,
          tension_level: Math.max(0, Math.min(10, context.gameState.campaign_context.tension_level + tensionDelta))
        };
      }
    }

    return {
      narrative_text: narrative,
      npc_dialogue: npcDialogue,
      system_actions: systemActions,
      game_state_updates: gameStateUpdates,
      mood_adjustment: moodChange ? {
        tension_delta: this.extractNumber(moodChange),
        engagement_boost: context.sentiment.emotion === 'excited'
      } : undefined
    };
  }

  // Enhanced NPC Processing Method
  private async processNPCInteractions(npcNames: string[], playerAction: string, npcDialogue: string): Promise<any[]> {
    const updatedNPCs = [];
    for (const npcName of npcNames) {
      try {
        // Create or get NPC from service
        let npc = this.npcService.createNPC({ name: npcName });
        
        // Analyze emotional impact of player action
        const emotionalImpact = this.analyzeEmotionalImpact(playerAction, npcDialogue);
        
        // Update NPC emotional state
        npc = this.npcService.updateEmotionalState(npc, emotionalImpact);
        
        // Add memory of this interaction
        npc = this.npcService.addMemory(npc, {
          type: 'conversation',
          description: `Player said:${playerAction}"`,
          context: 'player_interaction',
          emotionalImpact: emotionalImpact,
          relationshipChange: this.calculateMemoryImportance(playerAction, emotionalImpact)
        });
        
        // Convert to game state format
        updatedNPCs.push({
          id: npc.id,
          name: npc.name,
          hp: 10, // Placeholder for HP, needs actual NPCService
          status: this.npcService.getDisposition(npc),
          personality: npc.personality,
          emotionalState: npc.emotionalState
        });
        
        console.log(`🧠 NPC ${npcName} emotional state updated:`, npc.emotionalState.currentMood);
      } catch (error) {
        console.warn(`Failed to process NPC ${npcName}:`, error);
      }
    }
    
    return updatedNPCs;
  }

  // Analyze emotional impact of player actions
  private analyzeEmotionalImpact(playerAction: string, npcDialogue: string): any {
    const impact = { joy: 0, anger: 0, fear: 0, trust: 0, respect: 0 };
    
    // Analyze player action sentiment
    const actionSentiment = this.analyzeSentiment(playerAction);
    
    // Analyze NPC dialogue sentiment
    const dialogueSentiment = this.analyzeSentiment(npcDialogue);
    
    // Determine emotional impact based on sentiment and context
    if (actionSentiment.emotion === 'excited' && dialogueSentiment.emotion === 'excited') {
      impact.joy += 10;
      impact.trust += 5;
    } else if (actionSentiment.emotion === 'frustrated' && dialogueSentiment.emotion === 'frustrated') {
      impact.anger += 10;
      impact.fear += 5;
    } else if (actionSentiment.emotion === 'confused') {
      impact.fear += 5;
      impact.trust -= 5;
    }
    
    // Check for specific keywords that might affect emotions
    const threateningWords = ['attack', 'kill', 'hurt', 'destroy', 'threaten'];
    const friendlyWords = ['help', 'save', 'protect', 'friend', 'ally', 'respectful'];
    
    if (threateningWords.some(word => playerAction.toLowerCase().includes(word))) {
      impact.fear += 15;
      impact.trust -= 10;
    }
    
    if (friendlyWords.some(word => playerAction.toLowerCase().includes(word))) {
      impact.trust += 10;
      impact.joy += 5;
    }
    
    if (friendlyWords.some(word => playerAction.toLowerCase().includes(word))) {
      impact.respect += 10;
      impact.trust += 5;
    }
    
    return impact;
  }

  // Calculate memory importance based on emotional impact
  private calculateMemoryImportance(playerAction: string, emotionalImpact: any): number {
    const totalImpact = Math.abs(emotionalImpact.joy) + Math.abs(emotionalImpact.anger) + 
                       Math.abs(emotionalImpact.fear) + Math.abs(emotionalImpact.trust) + 
                       Math.abs(emotionalImpact.respect);
    
    // Scale importance from 1-10 on total emotional impact
    return Math.min(10, Math.max(1, Math.floor(totalImpact / 10)));
  }

  // UTILITY METHODS
  private extractSection(text: string, section: string): string | undefined {
    const regex = new RegExp(`${section}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private extractNumber(text: string): number {
    const match = text.match(/[+-]?\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  private async executeSystemActions(actions: DynamicResponse['system_actions'], campaignId: string): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'dice_roll':
          // Trigger dice roll in UI
          console.log('🎲 Rolling dice:', action.parameters);
          break;
        case 'stat_update':
          // Update character stats
          console.log('📊 Updating stats:', action.parameters);
          break;
        case 'sound_effect':
          // Trigger sound effect
          console.log('🔊 Playing sound:', action.parameters);
          break;
        default:
          console.log('⚡ System action:', action);
      }
    }
  }

  private async updateGameState(campaignId: string, updates: Partial<GameState>): Promise<void> {
    if (Object.keys(updates).length > 0) {
      try {
        // TODO: Implement proper Firebase integration when methods are available
        console.log('💾 Game state updates (Firebase integration pending):', updates);
        console.log('💾 Game state updated:', updates);
      } catch (error) {
        console.error('Failed to update game state:', error);
      }
    }
  }

  private async logInteraction(input: PlayerInput, response: DynamicResponse): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      player_input: input.message,
      ai_response: response.narrative_text,
      system_actions: response.system_actions,
      mood_change: response.mood_adjustment
    };

    try {
      // TODO: Implement proper Firebase integration when methods are available
      console.log('📝 Interaction logged (Firebase integration pending):', logEntry);
    } catch (error) {
      console.warn('Failed to log interaction:', error);
    }
  }

  private generateFallbackResponse(message: string): DynamicResponse {
    return {
      narrative_text: "The mists of magic swirl around you as reality shifts. Something unexpected has occurred, but your adventure continues...",
      system_actions: [],
      game_state_updates: {}
    };
  }

  // DEFAULT DATA STRUCTURES
  private getDefaultGameState(): GameState {
    return {
      current_location: {
        id: 'starting_area',
        description: 'You find yourself in a mystical realm where adventure awaits.',
        encounters: [],
        npcs: [],
        items: []
      },
      active_npcs: [],
      party_position: { x: 0, y: 0 },
      active_quests: [],
      inventory: [],
      campaign_context: {
        theme: 'Fantasy',
        current_scene: 'Beginning of Adventure',
        tension_level: 3,
        last_major_event: 'Campaign started'
      }
    };
  }

  private getDefaultPlayerProfile(): PlayerProfile {
    return {
      character_sheet: {
        name: 'Adventurer',
        class: 'Fighter',
        level: 1,
        stats: { strength: 12, dexterity: 12, constitution: 12, intelligence: 12, wisdom: 12, charisma: 12 },
        abilities: []
      },
      preferences: {
        combat_preference: 'medium',
        roleplay_preference: 'medium',
        puzzle_preference: 'medium',
        humor_style: 'witty',
        narrative_style: 'immersive'
      },
      backstory_keywords: [],
      out_of_character_notes: [],
      interaction_history: []
    };
  }

  private getDefaultDMPersona(): DMPersona {
    return {
      tone: 'friendly',
      humor_level: 'medium',
      descriptiveness: 'moderate',
      challenge_level: 'moderate',
      narrative_focus: 'balanced',
      improvisation_style: 'moderate'
    };
  }
}

// Export singleton instance
export const dynamicDMService = DynamicDMService.getInstance(); 