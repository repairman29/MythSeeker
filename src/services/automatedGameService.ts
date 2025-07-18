import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { aiService } from './aiService';
import { campaignService } from './campaignService';
import { multiplayerService } from './multiplayerService';
import { sentientAI } from './sentientAIService';

export interface AutomatedGameConfig {
  realm: string;
  theme: string;
  maxPlayers: number;
  sessionDuration: number; // in minutes
  autoStart: boolean;
  dmStyle: 'narrative' | 'combat-focused' | 'puzzle-heavy' | 'balanced';
  rating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'; // Add rating for mature/creative content
}

export interface PlayerContext {
  id: string;
  name: string;
  characterClass?: string;
  experience: 'beginner' | 'intermediate' | 'expert';
  preferences: string[];
  joinTime: number;
  isAI?: boolean; // Flag to distinguish AI-controlled characters
}

export interface AIPartyMember {
  id: string;
  name: string;
  characterClass: string;
  race: string;
  personality: {
    traits: string[];
    alignment: string;
    background: string;
    quirks: string[];
  };
  stats: {
    level: number;
    health: number;
    mana?: number;
    primaryStat: string;
  };
  relationships: Map<string, number>; // Player ID -> relationship score (-100 to 100)
  lastSpokeAt: number;
  conversationContext: string[];
}

export interface GameSession {
  id: string;
  config: AutomatedGameConfig;
  players: PlayerContext[];
  aiPartyMembers: AIPartyMember[]; // AI-controlled party members
  currentPhase: 'waiting' | 'introduction' | 'exploration' | 'combat' | 'resolution';
  startTime?: number;
  endTime?: number;
  messages: GameMessage[];
  worldState: any;
  activeQuests: any[];
  npcs: any[];
  playerMemory: Array<any>; // Add player memory field
  npcMemory: Array<any>; // Add NPC memory field
}

export interface GameMessage {
  id: string;
  type: 'dm' | 'player' | 'system';
  content: string;
  sender?: string;
  timestamp: number;
  metadata?: any;
}

class AutomatedGameService {
  private activeSessions = new Map<string, GameSession>();
  private sessionTimers = new Map<string, NodeJS.Timeout>();

  // Initialize automated game session
  async createAutomatedSession(config: AutomatedGameConfig): Promise<string> {
    console.log('🏗️ createAutomatedSession called with config:', config);
    const sessionId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Generated session ID:', sessionId);
    
    console.log('🤖 Generating AI party members...');
    const aiPartyMembers = this.generateAIPartyMembers(config);
    console.log('🤖 Generated AI party members:', aiPartyMembers.map(m => `${m.name} (${m.characterClass})`));
    
    const session: GameSession = {
      id: sessionId,
      config,
      players: [],
      aiPartyMembers: aiPartyMembers, // Generate AI party members
      currentPhase: 'waiting',
      messages: [],
      worldState: this.generateInitialWorldState(config),
      activeQuests: [],
      npcs: this.generateNPCs(config),
      playerMemory: [], // Initialize empty player memory
      npcMemory: [] // Initialize empty NPC memory
    };

    this.activeSessions.set(sessionId, session);
    console.log('💾 Session stored in activeSessions map');
    
    // Start session monitoring
    this.startSessionMonitoring(sessionId);
    console.log('⏰ Session monitoring started');
    
    console.log(`✅ Automated session created: ${sessionId} with ${aiPartyMembers.length} AI members`);
    return sessionId;
  }

  // Add player to automated session
  async addPlayerToSession(sessionId: string, player: PlayerContext): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.players.length >= session.config.maxPlayers) {
      throw new Error('Session is full');
    }

    session.players.push(player);
    
    // Add welcome message
    const welcomeMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content: `${player.name} has joined the adventure!`,
      timestamp: Date.now()
    };
    session.messages.push(welcomeMessage);

    // Check if we should start the session
    if (session.config.autoStart && session.players.length >= 2) {
      await this.startSession(sessionId);
    }

    return true;
  }

  // Start the automated session
  async startSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.currentPhase = 'introduction';
    session.startTime = Date.now();

    // Generate opening scene based on players and realm
    const openingScene = await this.generateOpeningScene(session);
    
    const openingMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'dm',
      content: openingScene,
      timestamp: Date.now(),
      metadata: { phase: 'introduction' }
    };
    
    session.messages.push(openingMessage);

    // Set up phase transitions
    this.schedulePhaseTransition(sessionId, 'exploration', 30000); // 30 seconds

    console.log(`🎬 Session ${sessionId} started with opening scene`);
  }

  // Generate opening scene based on player context and realm
  private async generateOpeningScene(session: GameSession): Promise<string> {
    const playerNames = session.players.map(p => p.name).join(', ');
    const playerClasses = session.players.map(p => p.characterClass).filter(Boolean);
    const experienceLevels = session.players.map(p => p.experience);
    
    const scenePrompt = `
You are an expert Dungeon Master opening a new RPG session. Create an engaging opening scene that:

REALM: ${session.config.realm}
THEME: ${session.config.theme}
DM STYLE: ${session.config.dmStyle}
PLAYERS: ${playerNames}
CHARACTER CLASSES: ${playerClasses.join(', ') || 'Mixed'}
EXPERIENCE LEVELS: ${experienceLevels.join(', ')}

REQUIREMENTS:
- Set the scene in the chosen realm with appropriate atmosphere
- Introduce the players to the world and their current situation
- Provide 3-4 clear choices for how to proceed
- Consider the players' experience levels and preferences
- Use the DM style specified (narrative, combat-focused, puzzle-heavy, or balanced)
- Make it engaging and immersive
- Keep it concise but descriptive

RESPONSE FORMAT:
{
  "narrative": "Your opening scene description",
  "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
  "atmosphere": {
    "mood": "current mood",
    "tension": "low|medium|high",
    "environmentalDetails": "specific details about surroundings"
  }
}
`;

    try {
      const response = await aiService.generateEnhancedDynamicResponse(scenePrompt);
      return response;
    } catch (error) {
      console.error('Error generating opening scene:', error);
      return this.getFallbackOpeningScene(session);
    }
  }

  // Fallback opening scene
  private getFallbackOpeningScene(session: GameSession): string {
    const playerNames = session.players.map(p => p.name).join(', ');
    
    return `Welcome to the realm of ${session.config.realm}, brave adventurers! 

The air crackles with ancient magic as you find yourselves standing at the edge of a mysterious forest. The trees whisper secrets of forgotten kingdoms, and in the distance, you can see the silhouette of an ancient castle against the setting sun.

Your party, consisting of ${playerNames}, has been drawn together by fate and circumstance. The local villagers speak of strange happenings in the castle - lights flickering in windows that should be empty, and the sound of distant chanting carried on the wind.

What would you like to do?

1. Approach the castle directly to investigate the strange lights
2. Question the villagers for more information about the castle's history
3. Search the forest for any clues or hidden paths
4. Set up camp and wait for morning to plan your approach

The choice is yours, adventurers. The fate of this realm may very well rest in your hands.`;
  }

  // Generate initial world state based on configuration
  private generateInitialWorldState(config: AutomatedGameConfig): any {
    const baseState = {
      time: 'day',
      weather: 'clear',
      location: 'forest_edge',
      tension: 'low',
      discoveredAreas: [],
      activeEffects: [],
      worldEvents: []
    };

    // Customize based on realm and theme
    switch (config.realm.toLowerCase()) {
      case 'fantasy':
        baseState.location = 'mystical_forest';
        baseState.activeEffects = ['magical_aura'];
        break;
      case 'sci-fi':
        baseState.location = 'space_station';
        baseState.activeEffects = ['artificial_gravity', 'life_support'];
        break;
      case 'post-apocalyptic':
        baseState.location = 'ruined_city';
        baseState.activeEffects = ['radiation_warning'];
        baseState.tension = 'high';
        break;
      case 'medieval':
        baseState.location = 'village_square';
        baseState.activeEffects = ['market_day'];
        break;
    }

    return baseState;
  }

  // Generate NPCs based on configuration
  private generateNPCs(config: AutomatedGameConfig): any[] {
    const npcs: any[] = [];
    
    switch (config.realm.toLowerCase()) {
      case 'fantasy':
        npcs.push(
          { id: 'elder_mage', name: 'Elder Thaddeus', role: 'mentor', location: 'village' },
          { id: 'merchant', name: 'Grimble', role: 'trader', location: 'market' },
          { id: 'guard_captain', name: 'Captain Valeria', role: 'authority', location: 'castle' }
        );
        break;
      case 'sci-fi':
        npcs.push(
          { id: 'ai_overseer', name: 'O.S.C.A.R.', role: 'guide', location: 'command_center' },
          { id: 'engineer', name: 'Dr. Chen', role: 'expert', location: 'engineering' },
          { id: 'security_chief', name: 'Commander Reyes', role: 'authority', location: 'security' }
        );
        break;
      case 'post-apocalyptic':
        npcs.push(
          { id: 'scavenger', name: 'Rust', role: 'survivor', location: 'outskirts' },
          { id: 'settlement_leader', name: 'Mayor Stone', role: 'authority', location: 'settlement' },
          { id: 'wanderer', name: 'The Traveler', role: 'mysterious', location: 'roads' }
        );
        break;
      case 'medieval':
        npcs.push(
          { id: 'innkeeper', name: 'Mistress Willow', role: 'host', location: 'tavern' },
          { id: 'blacksmith', name: 'Master Forge', role: 'craftsman', location: 'forge' },
          { id: 'noble', name: 'Lord Aldric', role: 'authority', location: 'manor' }
        );
        break;
    }

    return npcs;
  }

  // Generate AI party members for automated sessions
  private generateAIPartyMembers(config: AutomatedGameConfig): AIPartyMember[] {
    const partyMembers: AIPartyMember[] = [];
    
    // Create 2-3 AI party members based on realm and theme
    const memberCount = Math.min(3, Math.max(2, config.maxPlayers - 1)); // Leave room for human players
    
    const characterTemplates = this.getCharacterTemplates(config.realm);
    const selectedTemplates = this.shuffleArray(characterTemplates).slice(0, memberCount);
    
    selectedTemplates.forEach((template, index) => {
      const member: AIPartyMember = {
        id: `ai_${Date.now()}_${index}`,
        name: template.name,
        characterClass: template.characterClass,
        race: template.race,
        personality: {
          traits: template.personality.traits,
          alignment: template.personality.alignment,
          background: template.personality.background,
          quirks: template.personality.quirks
        },
        stats: {
          level: Math.floor(Math.random() * 3) + 1, // Level 1-3
          health: template.stats.baseHealth + Math.floor(Math.random() * 10),
          mana: template.stats.baseMana ? template.stats.baseMana + Math.floor(Math.random() * 10) : undefined,
          primaryStat: template.stats.primaryStat
        },
        relationships: new Map<string, number>(),
        lastSpokeAt: 0,
        conversationContext: []
      };
      
      partyMembers.push(member);
    });
    
    return partyMembers;
  }

  private getCharacterTemplates(realm: string) {
    const templates: any[] = [];
    
    switch (realm.toLowerCase()) {
      case 'fantasy':
        templates.push(
          {
            name: 'Lyra Moonwhisper',
            characterClass: 'Ranger',
            race: 'Elf',
            personality: {
              traits: ['observant', 'loyal', 'nature-loving'],
              alignment: 'Chaotic Good',
              background: 'An elf ranger who grew up in the deep forests and has an innate connection to wildlife.',
              quirks: ['Always knows which direction is north', 'Collects rare flowers', 'Speaks to animals']
            },
            stats: { baseHealth: 45, baseMana: 25, primaryStat: 'Dexterity' }
          },
          {
            name: 'Thorek Ironbeard',
            characterClass: 'Cleric',
            race: 'Dwarf',
            personality: {
              traits: ['steadfast', 'protective', 'wise'],
              alignment: 'Lawful Good',
              background: 'A dwarven cleric devoted to healing and protecting his companions.',
              quirks: ['Recites ancient prayers before battles', 'Always carries healing herbs', 'Never backs down from a challenge']
            },
            stats: { baseHealth: 55, baseMana: 40, primaryStat: 'Wisdom' }
          },
          {
            name: 'Zara Quickfingers',
            characterClass: 'Rogue',
            race: 'Halfling',
            personality: {
              traits: ['witty', 'sneaky', 'generous'],
              alignment: 'Chaotic Neutral',
              background: 'A halfling rogue with a heart of gold who "redistributes" wealth from the corrupt.',
              quirks: ['Always has a joke ready', 'Picks locks for fun', 'Shares food with everyone']
            },
            stats: { baseHealth: 35, baseMana: 15, primaryStat: 'Dexterity' }
          },
          {
            name: 'Astrid Stormcaller',
            characterClass: 'Wizard',
            race: 'Human',
            personality: {
              traits: ['intelligent', 'curious', 'ambitious'],
              alignment: 'True Neutral',
              background: 'A young human wizard eager to learn new spells and uncover ancient mysteries.',
              quirks: ['Takes notes on everything', 'Experiments with spells', 'Loves riddles']
            },
            stats: { baseHealth: 30, baseMana: 60, primaryStat: 'Intelligence' }
          }
        );
        break;
      case 'sci-fi':
        templates.push(
          {
            name: 'Zyx-7',
            characterClass: 'Engineer',
            race: 'Android',
            personality: {
              traits: ['logical', 'helpful', 'curious'],
              alignment: 'Lawful Neutral',
              background: 'An advanced android engineer with developing emotions and a fascination with organic life.',
              quirks: ['Calculates probability for everything', 'Learning to understand humor', 'Saves backup data constantly']
            },
            stats: { baseHealth: 50, baseMana: 50, primaryStat: 'Intelligence' }
          },
          {
            name: 'Captain Rex Torres',
            characterClass: 'Soldier',
            race: 'Human',
            personality: {
              traits: ['brave', 'tactical', 'protective'],
              alignment: 'Lawful Good',
              background: 'A veteran space marine with extensive combat experience and natural leadership skills.',
              quirks: ['Always checks his equipment twice', 'Tells war stories', 'Never leaves anyone behind']
            },
            stats: { baseHealth: 60, baseMana: 20, primaryStat: 'Strength' }
          }
        );
        break;
      case 'post-apocalyptic':
        templates.push(
          {
            name: 'Ghost',
            characterClass: 'Scavenger',
            race: 'Human',
            personality: {
              traits: ['resourceful', 'paranoid', 'survivor'],
              alignment: 'Chaotic Neutral',
              background: 'A wasteland scavenger who knows how to find valuable resources in the ruins.',
              quirks: ['Always has spare parts', 'Checks for radiation constantly', 'Hoards useful junk']
            },
            stats: { baseHealth: 45, baseMana: 10, primaryStat: 'Constitution' }
          }
        );
        break;
      case 'medieval':
        templates.push(
          {
            name: 'Sir Gareth',
            characterClass: 'Knight',
            race: 'Human',
            personality: {
              traits: ['honorable', 'brave', 'chivalrous'],
              alignment: 'Lawful Good',
              background: 'A noble knight sworn to protect the innocent and uphold justice.',
              quirks: ['Always addresses others formally', 'Polishes his armor daily', 'Quotes knightly codes']
            },
            stats: { baseHealth: 60, baseMana: 15, primaryStat: 'Strength' }
          }
        );
        break;
    }
    
    return templates;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Handle player input and generate DM response
  async processPlayerInput(sessionId: string, playerId: string, input: string): Promise<GameMessage> {
    console.log('🎯 AutomatedGameService: processPlayerInput called');
    console.log('📋 Session ID:', sessionId);
    console.log('👤 Player ID:', playerId);
    console.log('💬 Input:', input);

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.error('❌ Session not found:', sessionId);
      throw new Error('Session not found');
    }

    console.log('✅ Session found. Current phase:', session.currentPhase);
    console.log('🤖 AI Party Members:', session.aiPartyMembers?.length || 0);

    const player = session.players.find(p => p.id === playerId);
    if (!player) {
      console.error('❌ Player not found in session:', playerId);
      throw new Error('Player not found in session');
    }

    console.log('✅ Player found:', player.name);

    // Add player message
    const playerMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'player',
      content: input,
      sender: player.name,
      timestamp: Date.now()
    };
    session.messages.push(playerMessage);
    console.log('✅ Player message added');

    // Update AI party member relationships based on player action
    this.updateAIRelationships(session, playerId, input);
    console.log('✅ AI relationships updated');

    // Generate AI party member interactions first
    console.log('🤖 Generating AI party interactions...');
    const aiInteractions = await this.generateAIPartyInteractions(sessionId, input);
    console.log('🤖 AI interactions generated:', aiInteractions.length);
    session.messages.push(...aiInteractions);

    // Only generate DM response if no AI party members responded, or for special cases
    const shouldDMRespond = aiInteractions.length === 0 || 
                           input.toLowerCase().includes('dm') ||
                           input.toLowerCase().includes('sage') ||
                           session.currentPhase === 'exploration';
    
    if (shouldDMRespond) {
      console.log('🎭 Generating DM response...');
      const dmResponse = await this.generateDMResponse(session, player, input);
      console.log('🎭 DM response generated');
      
      // Ensure dmResponse is a string, not a JSON object
      const responseContent = typeof dmResponse === 'string' ? dmResponse : 
                            (dmResponse as any)?.response || 
                            JSON.stringify(dmResponse);
      
      const dmMessage: GameMessage = {
        id: `msg_${Date.now()}`,
        type: 'dm',
        content: responseContent,
        timestamp: Date.now(),
        metadata: { phase: session.currentPhase }
      };
      session.messages.push(dmMessage);
      console.log('✅ DM message added. Total messages:', session.messages.length);
    } else {
      console.log('🎭 Skipping DM response - AI party members already responded');
    }

    // Return the last message added (either AI party member or DM)
    const lastMessage = session.messages[session.messages.length - 1];
    return lastMessage;
  }

  // Generate contextual DM response using Sentient AI
  private async generateDMResponse(session: GameSession, player: PlayerContext, input: string): Promise<string> {
    try {
      // Use sentient AI for genuinely intelligent DM responses
      const sentientContext = {
        location: session.worldState?.currentLocation || 'unknown',
        situation: session.currentPhase,
        sessionType: 'automated_game',
        realm: session.config.realm,
        theme: session.config.theme,
        dmStyle: session.config.dmStyle,
        rating: session.config.rating,
        players: session.players,
        aiPartyMembers: session.aiPartyMembers,
        npcs: session.npcs,
        worldState: session.worldState,
        recentMessages: session.messages.slice(-10)
      };

      const sentientResult = await sentientAI.processSentientInput(
        player.id || player.name, // Use player ID for memory tracking
        input,
        sentientContext
      );

      // Update session based on sentient insights
      if (sentientResult.proactiveInsights.length > 0) {
        console.log('🧠 SAGE insights:', sentientResult.proactiveInsights);
      }

      // Format response for DM context
      let dmResponse = sentientResult.response;
      
      // Add proactive insights if the AI detected something important
      if (sentientResult.proactiveInsights.length > 0 && Math.random() < 0.3) {
        const insight = sentientResult.proactiveInsights[0];
        dmResponse += `\n\n*${insight}*`;
      }

      return dmResponse;
    } catch (error) {
      console.error('Error generating sentient DM response:', error);
      return this.generateClassicDMResponse(session, player, input);
    }
  }

  // Fallback to classic DM response generation
  private async generateClassicDMResponse(session: GameSession, player: PlayerContext, input: string): Promise<string> {
    const currentLocation = this.getCurrentLocation(session);
    const currentAtmosphere = this.getCurrentAtmosphere(session);
    const conversationHistory = this.getConversationHistory(session);
    
    // Build enhanced context including world state and memory
    const context = {
      session: {
        currentPhase: session.currentPhase,
        config: session.config,
        players: session.players.map(p => ({ name: p.name, characterClass: p.characterClass, experience: p.experience }))
      },
      player: {
        name: player.name,
        characterClass: player.characterClass,
        experience: player.experience,
        preferences: player.preferences
      },
      world: {
        locations: currentLocation,
        atmosphere: currentAtmosphere,
        activeQuests: session.activeQuests,
        npcs: session.npcs,
        worldState: session.worldState, // Include current world state
        playerMemory: session.playerMemory, // Include player memory
        npcMemory: session.npcMemory // Include NPC memory
      },
      history: conversationHistory
    };

    const prompt = this.buildEnhancedPrompt(input, context);
    
    try {
      const response = await aiService.generateEnhancedDynamicResponse(prompt);
      const parsedResponse = this.parseEnhancedResponse(response);
      
      // Update world state and memory based on AI response
      this.updateWorldState(session, parsedResponse);
      this.updatePlayerMemory(session, player, input, parsedResponse);
      this.updateNPCMemory(session, parsedResponse);
      
      return parsedResponse.narrative || response;
    } catch (error) {
      console.error('Error generating classic DM response:', error);
      return this.getEnhancedFallbackResponse(session, player, input);
    }
  }

  // Parse enhanced AI response
  private parseEnhancedResponse(response: string): any {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      
      // Validate the response structure
      if (parsed.narrative && parsed.choices) {
        return {
          narrative: parsed.narrative,
          choices: parsed.choices,
          atmosphere: parsed.atmosphere || { mood: 'neutral', tension: 'medium' },
          worldUpdates: parsed.worldUpdates || {},
          characterUpdates: parsed.characterUpdates || {}
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, treating as plain text');
    }
    
    // Fallback: treat as plain text
    return {
      narrative: response,
      choices: ["Continue exploring", "Ask questions", "Take action", "Rest and recover"],
      atmosphere: { mood: 'neutral', tension: 'medium' },
      worldUpdates: {},
      characterUpdates: {}
    };
  }

  // Get current location information
  private getCurrentLocation(session: GameSession): any {
    const worldState = session.worldState || {};
    return {
      current: worldState.currentLocation || 'Unknown',
      previous: worldState.previousLocation || null,
      discovered: worldState.discoveredLocations || [],
      description: worldState.locationDescription || 'A mysterious place'
    };
  }

  // Get current atmosphere
  private getCurrentAtmosphere(session: GameSession): any {
    const worldState = session.worldState || {};
    return {
      mood: worldState.currentMood || 'neutral',
      tension: worldState.currentTension || 'medium',
      weather: worldState.weather || 'clear',
      timeOfDay: worldState.timeOfDay || 'day',
      environmentalDetails: worldState.environmentalDetails || ''
    };
  }

  // Get conversation history for context
  private getConversationHistory(session: GameSession): any[] {
    return session.messages.slice(-8).map(msg => ({
      type: msg.type,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp,
      metadata: msg.metadata
    }));
  }

  // Update world state based on AI response
  private updateWorldState(session: GameSession, response: any): void {
    if (response.worldState) {
      session.worldState = { ...session.worldState, ...response.worldState };
    }
    
    if (response.newLocation) {
      session.worldState.currentLocation = response.newLocation;
    }
    
    if (response.weatherChange) {
      session.worldState.weather = response.weatherChange;
    }
    
    if (response.timeChange) {
      session.worldState.timeOfDay = response.timeChange;
    }
    
    if (response.newNPCs) {
      session.npcs.push(...response.newNPCs);
    }
    
    if (response.newEvents) {
      if (!session.worldState.events) {
        session.worldState.events = [];
      }
      session.worldState.events.push(...response.newEvents);
    }
  }

  private updatePlayerMemory(session: GameSession, player: PlayerContext, input: string, response: any): void {
    // Extract key actions and outcomes from the response
    const playerActions = this.extractPlayerActions(input, response);
    
    if (playerActions.length > 0) {
      session.playerMemory.push(...playerActions.map(action => ({
        ...action,
        playerId: player.id,
        playerName: player.name,
        timestamp: Date.now()
      })));
    }
  }

  private updateNPCMemory(session: GameSession, response: any): void {
    // Extract NPC interactions and relationship changes from the response
    const npcInteractions = this.extractNPCInteractions(response);
    
    if (npcInteractions.length > 0) {
      session.npcMemory.push(...npcInteractions.map(interaction => ({
        ...interaction,
        timestamp: Date.now()
      })));
    }
  }

  private extractPlayerActions(input: string, response: any): Array<any> {
    const actions: Array<any> = [];
    
    // Look for patterns that indicate player actions
    const actionPatterns = [
      /(?:chose|decided|opted)\s+to\s+([^.!?]+)/gi,
      /(?:successfully|failed to)\s+([^.!?]+)/gi,
      /(?:gained|lost|found)\s+([^.!?]+)/gi
    ];

    actionPatterns.forEach((pattern, index) => {
      const matches = response.match(pattern);
      if (matches) {
        actions.push({
          action: matches[1].trim(),
          outcome: index === 1 ? (response.includes('successfully') ? 'success' : 'failure') : 'completed',
          source: 'ai_response'
        });
      }
    });

    return actions;
  }

  private extractNPCInteractions(response: any): Array<any> {
    const interactions: Array<any> = [];
    
    // Look for patterns that indicate NPC interactions
    const npcPatterns = [
      /(?:npc|character)\s+([^.!?]+?)\s+(?:is|became|now)\s+([^.!?]+)/gi,
      /([^.!?]+?)\s+(?:reacted|responded)\s+([^.!?]+)/gi,
      /([^.!?]+?)\s+(?:likes|dislikes|trusts|distrusts)\s+([^.!?]+)/gi
    ];

    npcPatterns.forEach((pattern, index) => {
      const matches = response.match(pattern);
      if (matches) {
        interactions.push({
          name: matches[1].trim(),
          traits: [matches[2].trim()],
          relationship: index === 2 ? matches[2].trim() : 'neutral',
          source: 'ai_response'
        });
      }
    });

    return interactions;
  }

  private buildEnhancedPrompt(input: string, context: any): string {
    const { session, player, world, history } = context;
    
    return `
You are an expert Dungeon Master running a dynamic RPG session. Respond to the player's input with an engaging, contextual response.

SESSION CONTEXT:
- Phase: ${session.currentPhase}
- Realm: ${session.config.realm}
- Theme: ${session.config.theme}
- DM Style: ${session.config.dmStyle}
- Rating: ${session.config.rating || 'PG-13'}

PLAYER CONTEXT:
- Name: ${player.name}
- Character Class: ${player.characterClass || 'Hero'}
- Experience: ${player.experience}
- Preferences: ${player.preferences.join(', ')}

WORLD STATE:
- Current Location: ${world.locations?.current || 'Unknown'}
- Weather: ${world.worldState?.weather || 'Clear'}
- Time: ${world.worldState?.timeOfDay || 'Day'}
- Active Quests: ${world.activeQuests.length}
- NPCs Present: ${world.npcs.length}

PLAYER MEMORY (Recent Actions):
${world.playerMemory.map((memory: any) => `- ${memory.action}: ${memory.outcome}`).join('\n')}

NPC MEMORY (Relationships):
${world.npcMemory.map((npc: any) => `- ${npc.name}: ${npc.traits?.join(', ') || 'No traits'} (${npc.relationship || 'neutral'} relationship)`).join('\n')}

RECENT CONVERSATION:
${history.map((msg: any) => `${msg.type}: ${msg.content}`).join('\n')}

PLAYER INPUT: ${input}

RESPONSE REQUIREMENTS:
- Be engaging and immersive
- Consider the current world state and memory
- Reference past actions and NPC relationships when relevant
- Provide meaningful choices when appropriate
- Match the DM style and content rating
- Keep responses concise but descriptive

RESPONSE FORMAT:
{
  "narrative": "Your main response to the player",
  "choices": ["Optional choice 1", "Optional choice 2"],
  "worldState": {
    "newLocation": "optional new location",
    "weather": "optional weather change",
    "timeOfDay": "optional time change"
  }
}
`;
  }

  // Enhanced fallback response
  private getEnhancedFallbackResponse(session: GameSession, player: PlayerContext, input: string): string {
    const playerName = player.name;
    const phase = session.currentPhase;
    const theme = session.config.theme;
    
    const fallbackResponses: Record<string, string[]> = {
      exploration: [
        `"Interesting choice, ${playerName}," you say, your voice carrying the weight of the ${theme} realm around you. "The path ahead holds many possibilities. What calls to your adventurous spirit?"`,
        `The world responds to your presence, ${playerName}. Every step you take shapes the story unfolding around you. What would you like to discover next?`,
        `"Ah, ${playerName}," you muse, "the ${theme} realm is full of wonders and dangers. Your actions have consequences here. What path will you choose?"`
      ],
      combat: [
        `"The battle rages on, ${playerName}!" you declare, your voice rising with the intensity of combat. "Your enemies are formidable, but your spirit is stronger. What will you do?"`,
        `The clash of steel echoes around you, ${playerName}. Every move matters in this fight. Your tactical mind is your greatest weapon.`,
        `"Warrior's heart, ${playerName}!" you call out. "The enemy feels your determination. How will you turn the tide of this battle?"`
      ],
      introduction: [
        `"Welcome to the ${theme} realm, ${playerName}," you begin, your voice warm and inviting. "Your adventure is about to begin. What draws you to this mystical world?"`,
        `The ${theme} realm stretches before you, ${playerName}, full of promise and peril. Your story is waiting to be written. Where will you start?`,
        `"Ah, a new hero arrives!" you announce with genuine excitement. "The ${theme} realm has been waiting for someone like you, ${playerName}. What calls you to adventure?"`
      ],
      resolution: [
        `"Your journey has been remarkable, ${playerName}," you reflect. "The ${theme} realm will remember your deeds. What legacy will you leave behind?"`,
        `"The adventure draws to a close, ${playerName}," you say with satisfaction. "You've faced challenges and grown stronger. How do you feel about your journey?"`,
        `"Well done, ${playerName}," you congratulate. "The ${theme} realm has been forever changed by your presence. What final choices will you make?"`
      ]
    };
    
    const responses = fallbackResponses[phase] || fallbackResponses.exploration;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Schedule phase transitions
  private schedulePhaseTransition(sessionId: string, newPhase: GameSession['currentPhase'], delayMs: number): void {
    const timer = setTimeout(async () => {
      await this.transitionPhase(sessionId, newPhase);
    }, delayMs);
    
    this.sessionTimers.set(sessionId, timer);
  }

  // Transition between game phases
  private async transitionPhase(sessionId: string, newPhase: GameSession['currentPhase']): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.currentPhase = newPhase;
    
    const phaseMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content: `Phase transition: ${newPhase}`,
      timestamp: Date.now(),
      metadata: { phase: newPhase }
    };
    
    session.messages.push(phaseMessage);

    // Schedule next phase transition
    switch (newPhase) {
      case 'exploration':
        this.schedulePhaseTransition(sessionId, 'combat', 120000); // 2 minutes
        break;
      case 'combat':
        this.schedulePhaseTransition(sessionId, 'resolution', 180000); // 3 minutes
        break;
      case 'resolution':
        this.endSession(sessionId);
        break;
    }
  }

  // End session
  private async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.currentPhase = 'resolution';
    session.endTime = Date.now();

    const endMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content: 'The adventure has concluded. Thank you for playing!',
      timestamp: Date.now()
    };
    
    session.messages.push(endMessage);

    // Clean up
    this.activeSessions.delete(sessionId);
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(sessionId);
    }

    console.log(`🏁 Session ${sessionId} ended`);
  }

  // Start session monitoring
  private startSessionMonitoring(sessionId: string): void {
    // Monitor session health and auto-cleanup
    const timer = setTimeout(() => {
      const session = this.activeSessions.get(sessionId);
      if (session && !session.startTime) {
        // Session hasn't started in 10 minutes, clean it up
        this.activeSessions.delete(sessionId);
        console.log(`🧹 Cleaned up inactive session: ${sessionId}`);
      }
    }, 600000); // 10 minutes

    this.sessionTimers.set(sessionId, timer);
  }

  // Get session information
  getSession(sessionId: string): GameSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Get all active sessions
  getAllSessions(): GameSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Remove player from session
  removePlayerFromSession(sessionId: string, playerId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const playerIndex = session.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    const player = session.players[playerIndex];
    session.players.splice(playerIndex, 1);

    // Add departure message
    const departureMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content: `${player.name} has left the adventure.`,
      timestamp: Date.now()
    };
    session.messages.push(departureMessage);

    // End session if no players remain
    if (session.players.length === 0) {
      this.endSession(sessionId);
    }

    return true;
  }

  // Generate AI party member interactions
  async generateAIPartyInteractions(sessionId: string, context: string): Promise<GameMessage[]> {
    console.log('🎮 generateAIPartyInteractions called with context:', context);
    
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.log('❌ No session found for AI interactions');
      return [];
    }

    console.log('🤖 Total AI party members:', session.aiPartyMembers?.length || 0);
    if (!session.aiPartyMembers || session.aiPartyMembers.length === 0) {
      console.log('❌ No AI party members in session');
      return [];
    }

    const interactions: GameMessage[] = [];
    const now = Date.now();
    
    // Determine which AI party members should speak based on context and timing
    const activeMembers = session.aiPartyMembers.filter(member => {
      const timeSinceLastSpoke = now - member.lastSpokeAt;
      const shouldSpeak = timeSinceLastSpoke > 30000 || // 30 seconds minimum
                         this.shouldRespondToContext(member, context) ||
                         Math.random() < 0.3; // 30% chance to interject
      
      console.log(`🤖 ${member.name}: timeSinceLastSpoke=${timeSinceLastSpoke}ms, shouldRespond=${this.shouldRespondToContext(member, context)}, shouldSpeak=${shouldSpeak}`);
      return shouldSpeak;
    });

    console.log('🎯 Active members who should speak:', activeMembers.map(m => m.name));

    // Limit to 1-2 AI responses to avoid spam
    const respondingMembers = activeMembers.slice(0, Math.random() < 0.7 ? 1 : 2);
    console.log('📝 Final responding members:', respondingMembers.map(m => m.name));

    for (const member of respondingMembers) {
      console.log(`🤖 Generating response for ${member.name}...`);
      const response = await this.generateAIResponse(member, context, session);
      console.log(`🤖 ${member.name} response:`, response ? `"${response.substring(0, 50)}..."` : 'null');
      
      if (response) {
        const message: GameMessage = {
          id: `ai_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'player', // AI party members speak as players
          content: response,
          sender: member.name,
          timestamp: now,
          metadata: { isAI: true, characterClass: member.characterClass, aiId: member.id }
        };

        interactions.push(message);
        member.lastSpokeAt = now;
        member.conversationContext.push(context);
        
        // Keep only last 5 context entries
        if (member.conversationContext.length > 5) {
          member.conversationContext.shift();
        }
        console.log(`✅ Added ${member.name} message to interactions`);
      }
    }

    console.log(`🎯 Total AI interactions generated: ${interactions.length}`);
    return interactions;
  }

  private shouldRespondToContext(member: AIPartyMember, context: string): boolean {
    const contextLower = context.toLowerCase();
    const memberClass = member.characterClass.toLowerCase();
    
    // Class-specific triggers
    const classKeywords: Record<string, string[]> = {
      'ranger': ['forest', 'track', 'animals', 'nature', 'wilderness', 'hunt'],
      'cleric': ['heal', 'prayer', 'divine', 'blessing', 'holy', 'injury', 'wounded'],
      'rogue': ['trap', 'lock', 'stealth', 'sneak', 'steal', 'pickpocket', 'hidden'],
      'wizard': ['magic', 'spell', 'arcane', 'study', 'knowledge', 'mystery', 'ancient'],
      'engineer': ['technology', 'repair', 'build', 'system', 'malfunction', 'circuit'],
      'soldier': ['combat', 'tactics', 'enemy', 'strategy', 'weapon', 'defense'],
      'scavenger': ['loot', 'supplies', 'resource', 'salvage', 'useful', 'scrap'],
      'knight': ['honor', 'justice', 'protect', 'noble', 'duty', 'chivalry']
    };

    const keywords = classKeywords[memberClass] || [];
    const hasClassKeyword = keywords.some(keyword => contextLower.includes(keyword));
    
    // Personality-based triggers
    const hasPersonalityTrigger = member.personality.traits.some(trait => {
      switch (trait) {
        case 'curious': return contextLower.includes('strange') || contextLower.includes('unusual') || contextLower.includes('mystery');
        case 'protective': return contextLower.includes('danger') || contextLower.includes('threat') || contextLower.includes('hurt');
        case 'witty': return contextLower.includes('joke') || contextLower.includes('funny') || contextLower.includes('laugh');
        case 'paranoid': return contextLower.includes('watch') || contextLower.includes('careful') || contextLower.includes('suspicious');
        case 'logical': return contextLower.includes('analyze') || contextLower.includes('calculate') || contextLower.includes('logical');
        default: return false;
      }
    });

    return hasClassKeyword || hasPersonalityTrigger;
  }

  private async generateAIResponse(member: AIPartyMember, context: string, session: GameSession): Promise<string | null> {
    // Try sentient AI first, with robust fallback
    try {
      console.log(`🧠 Attempting sentient AI for ${member.name}...`);
      
      const sentientContext = {
        location: session.worldState?.currentLocation || 'unknown',
        situation: session.currentPhase,
        sessionType: 'automated_game',
        realm: session.config.realm,
        aiCharacter: member,
        recentMessages: session.messages.slice(-5)
      };

      const sentientResult = await sentientAI.processSentientInput(
        member.id, // Use AI member ID as player ID for memory
        context,
        sentientContext
      );

      console.log(`✅ Sentient AI success for ${member.name}:`, sentientResult.response);

      // Enhance the response with character-specific personality
      const enhancedResponse = this.enhanceWithCharacterPersonality(
        sentientResult.response,
        member,
        sentientResult.emotionalTone
      );

      return enhancedResponse;
    } catch (error) {
      console.error(`❌ Sentient AI failed for ${member.name}, using enhanced fallback:`, error instanceof Error ? error.message : String(error));
      // Use enhanced character-driven responses as fallback
      return this.generateEnhancedCharacterResponse(member, context, session);
    }
  }

  private async generateEnhancedCharacterResponse(member: AIPartyMember, context: string, session: GameSession): Promise<string | null> {
    console.log(`🎭 generateEnhancedCharacterResponse for ${member.name} with context: "${context}"`);
    
    // Generate contextual responses based on character personality and situation
    const recentMessages = session.messages.slice(-3);
    const playerMessage = recentMessages[recentMessages.length - 1];
    
    // Ghost-specific responses for post-apocalyptic setting
    if (member.name === 'Ghost' && member.characterClass === 'Scavenger') {
      console.log('👻 Generating Ghost-specific response...');
      const ghostResponse = this.generateGhostResponse(context, playerMessage?.content || '', session);
      console.log('👻 Ghost response generated:', ghostResponse ? `"${ghostResponse.substring(0, 50)}..."` : 'null');
      return ghostResponse;
    }
    
    // Use enhanced fallback for other characters
    console.log(`🎭 Using fallback response for ${member.name}`);
    return this.getFallbackResponse(member, context);
  }

  private generateGhostResponse(context: string, playerInput: string, session: GameSession): string {
    const contextLower = context.toLowerCase();
    const inputLower = playerInput.toLowerCase();
    
    // Respond to specific situations
    if (inputLower.includes('hear') || inputLower.includes('something')) {
      const ghostResponses = [
        "*freezes and listens* Yeah, I heard it too. Could be raiders... or worse. We need to move. Now.",
        "*hand moves to weapon* That ain't the wind. Something's out there. Stay low and follow my lead.",
        "*whispers urgently* Quiet! I've been tracking sounds like that for miles. We're being hunted.",
        "*taps ear* You're learning. Good. Trust your instincts out here - they keep you breathing."
      ];
      return ghostResponses[Math.floor(Math.random() * ghostResponses.length)];
    }
    
    if (contextLower.includes('explore') || contextLower.includes('look') || contextLower.includes('search')) {
      const searchResponses = [
        "*scans the area with practiced eyes* This place has been picked clean, but... *kicks debris* There. Hidden stash. Always check twice.",
        "*crouches low* See those tracks? Fresh. Someone was here recently. Could be friendly... but I ain't betting my life on it.",
        "*examines surroundings* Radiation's low here, but don't touch anything metal without checking first. Learned that the hard way.",
        "*points to subtle signs* Trap wires there, escape route there. Whoever lived here knew what they were doing."
      ];
      return searchResponses[Math.floor(Math.random() * searchResponses.length)];
    }
    
    if (contextLower.includes('danger') || contextLower.includes('threat') || contextLower.includes('combat')) {
      const combatResponses = [
        "*takes cover immediately* Contact! Get down! *pulls out weapon* I count at least three hostiles. Watch your six!",
        "*moves tactically* Stay behind me. I've got better armor and more experience. Don't try to be a hero.",
        "*assesses threats quickly* Raider tactics - they'll try to flank us. Keep an eye on that doorway while I handle the front.",
        "*breathing controlled* Just like the old days. Keep calm, pick your shots, and don't waste ammo. We'll get through this."
      ];
      return combatResponses[Math.floor(Math.random() * combatResponses.length)];
    }
    
    // General responses based on Ghost's paranoid, experienced personality
    const generalResponses = [
      "*adjusts makeshift armor* This place gives me the creeps. Too quiet. In the wasteland, quiet usually means trouble's coming.",
      "*checks supplies* We're running low on clean water. I know a place... but it's risky. Then again, everything's risky out here.",
      "*glances around nervously* You stick with me, you might just live through this. But listen carefully - first rule of the wasteland: trust no one completely.",
      "*examines the horizon* Storm's coming in. We need shelter, and fast. Radiation storms out here will cook you from the inside out.",
      "*taps weapon nervously* Stay alert. I've survived this long because I assume everything wants to kill me. So far, I've been right.",
      "*voice low and gravelly* You remind me of someone I used to travel with. Good kid... too trusting. Don't make the same mistakes."
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  private async generateClassicAIResponse(member: AIPartyMember, context: string, session: GameSession): Promise<string | null> {
    try {
      const recentMessages = session.messages.slice(-5).map(m => `${m.sender}: ${m.content}`).join('\n');
      
      const prompt = `You are ${member.name}, a ${member.race} ${member.characterClass} in a ${session.config.realm} adventure.

Your personality:
- Traits: ${member.personality.traits.join(', ')}
- Alignment: ${member.personality.alignment}
- Background: ${member.personality.background}
- Quirks: ${member.personality.quirks.join(', ')}

Recent conversation:
${recentMessages}

Current situation: ${context}

Respond as ${member.name} in character. Keep responses 1-2 sentences, conversational, and true to your personality. Sometimes ask questions, offer help, make observations, or show concern for party members. Don't just repeat what others say.

IMPORTANT: Respond with ONLY the character's dialogue as plain text. Do not include JSON formatting, quotes, or any other markup.`;

      const response = await aiService.complete(prompt);
      
      // Try to parse JSON response and extract narrative if it's structured
      try {
        const parsed = JSON.parse(response || '{}');
        if (parsed.narrative) {
          return parsed.narrative;
        } else if (typeof parsed === 'string') {
          return parsed;
        }
      } catch (parseError) {
        // If not JSON, treat as plain text
      }
      
      return response || null;
    } catch (error) {
      console.error('Error generating classic AI response:', error);
      return this.getFallbackResponse(member, context);
    }
  }

  private enhanceWithCharacterPersonality(baseResponse: string, member: AIPartyMember, tone: string): string {
    // Add character-specific speech patterns and mannerisms
    let enhanced = baseResponse;

    // Apply character class specific enhancements
    switch (member.characterClass.toLowerCase()) {
      case 'scavenger':
        // Ghost-specific enhancements for post-apocalyptic setting
        if (member.name === 'Ghost') {
          enhanced = this.applyGhostPersonality(enhanced, tone);
        }
        break;
      case 'ranger':
        enhanced = this.applyRangerPersonality(enhanced, member, tone);
        break;
      case 'cleric':
        enhanced = this.applyClericPersonality(enhanced, member, tone);
        break;
      case 'wizard':
        enhanced = this.applyWizardPersonality(enhanced, member, tone);
        break;
    }

    return enhanced;
  }

  private applyGhostPersonality(response: string, tone: string): string {
    // Ghost is paranoid, resourceful, and speaks in short, careful phrases
    const ghostMannerisms = [
      'Keep your voice down.',
      'Someone might be listening.',
      'That\'s how people get dead.',
      'Trust but verify.',
      'I\'ve seen this before.',
      'Stay alert.'
    ];

    // Add occasional mannerisms based on tone
    if (tone === 'cautious' || Math.random() < 0.3) {
      const mannerism = ghostMannerisms[Math.floor(Math.random() * ghostMannerisms.length)];
      return `${response} ${mannerism}`;
    }

    return response;
  }

  private applyRangerPersonality(response: string, member: AIPartyMember, tone: string): string {
    // Rangers are observant and nature-focused
    if (tone === 'observant' || Math.random() < 0.2) {
      const rangerPhrases = ['The tracks tell a story.', 'Nature has its own warnings.', 'I hear something...'];
      const phrase = rangerPhrases[Math.floor(Math.random() * rangerPhrases.length)];
      return `${response} ${phrase}`;
    }
    return response;
  }

  private applyClericPersonality(response: string, member: AIPartyMember, tone: string): string {
    // Clerics are protective and spiritual
    if (tone === 'supportive' || Math.random() < 0.2) {
      const clericPhrases = ['May the light guide us.', 'I sense a blessing here.', 'Fear not, I am with you.'];
      const phrase = clericPhrases[Math.floor(Math.random() * clericPhrases.length)];
      return `${response} ${phrase}`;
    }
    return response;
  }

  private applyWizardPersonality(response: string, member: AIPartyMember, tone: string): string {
    // Wizards are analytical and curious
    if (tone === 'curious' || Math.random() < 0.2) {
      const wizardPhrases = ['Fascinating...', 'The magical resonance here is unusual.', 'I must study this further.'];
      const phrase = wizardPhrases[Math.floor(Math.random() * wizardPhrases.length)];
      return `${response} ${phrase}`;
    }
    return response;
  }

  private getFallbackResponse(member: AIPartyMember, context: string): string {
    const responses: Record<string, string[]> = {
      'Ranger': [
        "I sense something in the air...",
        "My instincts tell me to be cautious here.",
        "The wildlife seems disturbed by something.",
        "I can track our path if needed."
      ],
      'Cleric': [
        "May the gods watch over us.",
        "I can tend to any wounds if needed.",
        "Something feels blessed... or cursed here.",
        "I'll keep everyone healed and safe."
      ],
      'Rogue': [
        "I don't like the look of this...",
        "Want me to check for traps first?",
        "I've got a bad feeling about this.",
        "Anyone else notice we're being watched?"
      ],
      'Wizard': [
        "Fascinating... I must study this further.",
        "The magical energies here are quite unusual.",
        "Let me consult my spellbook.",
        "This reminds me of something I've read..."
      ],
      'Engineer': [
        "Running diagnostics on the situation...",
        "I can repair or modify equipment if needed.",
        "The probability of success is... calculating...",
        "My sensors are detecting anomalies."
      ],
      'Soldier': [
        "Stay alert, everyone.",
        "I'll take point and assess the threats.",
        "Standard formation, watch each other's backs.",
        "We need to approach this tactically."
      ],
      'Scavenger': [
        "Keep your voice down. *glances around nervously* That's how people get dead out here.",
        "I've seen this before... never ends well. Stay close and trust nobody we ain't vetted.",
        "*checks weapon* Something feels wrong. My gut's telling me we're being watched.",
        "Listen... *whispers* I got some supplies, but we move quiet. Too much noise draws the wrong attention.",
        "This whole thing stinks. I've survived this long by being paranoid. Keep your eyes open.",
        "*taps ear* You hear that? Could be nothing... but in the wasteland, nothing's ever nothing."
      ],
      'Knight': [
        "Honor demands we help those in need.",
        "I shall protect the innocent.",
        "By my oath, we shall prevail.",
        "Justice will guide our actions."
      ]
    };

    const classResponses = responses[member.characterClass] || responses['Ranger'];
    return classResponses[Math.floor(Math.random() * classResponses.length)];
  }

  // Update relationships based on player actions
  private updateAIRelationships(session: GameSession, playerId: string, action: string) {
    session.aiPartyMembers.forEach(member => {
      let relationshipChange = 0;
      
      // Positive actions
      if (action.includes('help') || action.includes('heal') || action.includes('protect')) {
        relationshipChange += 5;
      }
      
      // Negative actions (depending on alignment)
      if (action.includes('steal') || action.includes('attack innocent')) {
        if (member.personality.alignment.includes('Good')) {
          relationshipChange -= 10;
        } else if (member.personality.alignment.includes('Evil')) {
          relationshipChange += 5;
        }
      }
      
      // Class-specific relationship changes
      if (member.characterClass === 'Cleric' && (action.includes('heal') || action.includes('bless'))) {
        relationshipChange += 3;
      }
      
      if (member.characterClass === 'Rogue' && action.includes('sneak')) {
        relationshipChange += 2;
      }
      
      // Update relationship
      const currentRelationship = member.relationships.get(playerId) || 0;
      const newRelationship = Math.max(-100, Math.min(100, currentRelationship + relationshipChange));
      member.relationships.set(playerId, newRelationship);
    });
  }
}

export const automatedGameService = new AutomatedGameService(); 