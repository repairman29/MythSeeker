import { dynamicDMService } from './dynamicDMService';
import { firebaseService } from '../firebaseService';
import { multiplayerService } from './multiplayerService';
import { validateChatMessage, sanitizeInput } from '../utils/validation';
import { unifiedAIService, UnifiedGameContext } from './unifiedAIService';
import { AIPartyMember } from './automatedGameService';

// Types
export interface GameState {
  currentCampaign: any;
  character: any;
  messages: any[];
  worldState: any;
  aiMemory: any;
  currentEnvironment: any;
  isAIThinking: boolean;
  chatError: string | null;
}

export interface CharacterUpdate {
  playerId: string;
  xpGain?: number;
  statChanges?: {
    health?: number;
    mana?: number;
    [key: string]: any;
  };
  newItems?: {[key: string]: any};
  reputationChanges?: {[key: string]: any};
  [key: string]: any;
}

export interface WorldStateUpdate {
  newLocation?: string;
  newNPCs?: Array<{name: string; [key: string]: any}>;
  newEvents?: Array<{[key: string]: any}>;
  weatherChange?: string;
  timeChange?: string;
  [key: string]: any;
}

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'enemy';
  character?: any;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  actionPoints: { move: number; action: number; bonus: number; reaction: number };
  currentActionPoints: { move: number; action: number; bonus: number; reaction: number };
  stats: {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
    armorClass: number;
  };
  statusEffects: any[];
  isActive: boolean;
  hasActed: boolean;
  reach: number;
  skills: {[key: string]: any};
}

export interface CombatAction {
  type: string;
  target?: any;
  weapon?: any;
  spell?: any;
}

// Rate Limiter Class
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(userKey: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userKey) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(userKey, validRequests);
    return true;
  }

  getTimeUntilReset(userKey: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userKey) || [];
    const oldestRequest = Math.min(...userRequests);
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }
}

// Game State Management Service
export class GameStateService {
  private state: GameState;
  private chatRateLimiter: RateLimiter;
  private callbacks: {
    onStateChange?: (state: GameState) => void;
    onMessageSent?: (message: any) => void;
    onCombatStart?: (enemies: any[]) => void;
    onCombatEnd?: () => void;
  } = {};

  // Add AI party members support
  private aiPartyMembers: AIPartyMember[] = [];
  private aiEnabled: boolean = true;

  constructor() {
    this.state = {
      currentCampaign: null,
      character: null,
      messages: [],
      worldState: {},
      aiMemory: {},
      currentEnvironment: null,
      isAIThinking: false,
      chatError: null
    };
    
    this.chatRateLimiter = new RateLimiter(10, 60000); // 10 messages per minute
  }

  // State Management
  getState(): GameState {
    return { ...this.state };
  }

  setState(newState: Partial<GameState>) {
    this.state = { ...this.state, ...newState };
    this.callbacks.onStateChange?.(this.state);
  }

  // Callback Management
  onStateChange(callback: (state: GameState) => void) {
    this.callbacks.onStateChange = callback;
  }

  onMessageSent(callback: (message: any) => void) {
    this.callbacks.onMessageSent = callback;
  }

  onCombatStart(callback: (enemies: any[]) => void) {
    this.callbacks.onCombatStart = callback;
  }

  onCombatEnd(callback: () => void) {
    this.callbacks.onCombatEnd = callback;
  }

  // Message Handling
  async sendMessage(inputMessage: string, playerId: string, playerName: string): Promise<boolean> {
    // Validate message
    const validation = validateChatMessage(inputMessage);
    if (!validation.isValid) {
      this.setState({ chatError: validation.error || 'Invalid message' });
      return false;
    }

    // Check rate limiting
    const userKey = playerId || 'anonymous';
    if (!this.chatRateLimiter.isAllowed(userKey)) {
      const remainingTime = this.chatRateLimiter.getTimeUntilReset(userKey);
      this.setState({ 
        chatError: `Please wait ${Math.ceil(remainingTime / 1000)} seconds before sending another message` 
      });
      return false;
    }

    this.setState({ chatError: null });
    if (this.state.isAIThinking) return false;

    // Check if character exists
    if (!this.state.character) {
      this.setState({ chatError: 'No character selected. Please create or select a character first.' });
      return false;
    }

    const sanitizedMessage = sanitizeInput(inputMessage);
    const playerMessage = {
      id: Date.now(),
      type: 'player',
      content: sanitizedMessage,
      character: this.state.character.name,
      playerId: playerId,
      playerName: playerName,
      timestamp: new Date()
    };

    const updatedMessages = [...this.state.messages, playerMessage];
    this.setState({ 
      messages: updatedMessages,
      isAIThinking: true 
    });

    this.callbacks.onMessageSent?.(playerMessage);

    try {
      // Enhanced AI processing with unified service
      if (this.aiEnabled && this.state.currentCampaign) {
        try {
          // Create unified game context
          const gameContext: UnifiedGameContext = {
            gameId: this.state.currentCampaign.id || 'single-player',
            gameType: 'single-player',
            realm: this.inferRealmFromTheme(this.state.currentCampaign.theme),
            theme: this.state.currentCampaign.theme,
            participants: [{
              id: playerId,
              name: playerName,
              character: this.state.character
            }],
            aiPartyMembers: this.aiPartyMembers,
            worldState: this.state.worldState,
            messages: this.state.messages.slice(-10)
          };

          // Process with unified AI service
          const unifiedResponse = await unifiedAIService.processPlayerInputUnified(
            gameContext,
            playerId,
            sanitizedMessage
          );

          // Add AI party member responses
          const aiMessages = [
            ...unifiedResponse.aiPartyResponses.map(response => ({
              id: Date.now() + Math.random(),
              type: 'player' as const,
              content: response.content,
              sender: response.characterName,
              timestamp: new Date(),
              metadata: response.metadata
            })),
            ...unifiedResponse.aiToAiConversations.map(conv => ({
              id: Date.now() + Math.random(),
              type: 'player' as const,
              content: conv.content,
              sender: conv.speaker,
              timestamp: new Date(),
              metadata: { 
                isAI: true, 
                conversationType: 'ai_to_ai',
                targetAI: conv.target
              }
            })),
            ...unifiedResponse.supportiveInteractions.map(support => ({
              id: Date.now() + Math.random(),
              type: 'player' as const,
              content: support.content,
              sender: support.characterName,
              timestamp: new Date(),
              metadata: { 
                isAI: true, 
                messageType: 'supportive',
                supportType: support.supportType
              }
            }))
          ];

          // Update AI party members if they were created
          if (gameContext.aiPartyMembers && gameContext.aiPartyMembers.length > 0) {
            this.aiPartyMembers = gameContext.aiPartyMembers;
            await unifiedAIService.saveAIPartyMembers(gameContext.gameId, gameContext.aiPartyMembers);
          }

          // Add AI messages to state
          if (aiMessages.length > 0) {
            this.setState({
              messages: [...this.state.messages, ...aiMessages]
            });
          }

          // Generate DM response using unified service or fallback to dynamic DM
          let dmResponse: any;
          if (unifiedResponse.dmResponse) {
            dmResponse = {
              narrative: unifiedResponse.dmResponse,
              choices: ['Explore', 'Investigate', 'Ask questions'],
              atmosphere: {
                mood: 'dynamic',
                tension: 'medium'
              }
            };
          } else {
            // Fallback to dynamic DM service
            const dynamicResponse = await dynamicDMService.processPlayerInput({
              message: sanitizedMessage,
              playerId: playerId,
              campaignId: this.state.currentCampaign?.id || 'single-player',
              timestamp: new Date()
            });

            dmResponse = {
              narrative: dynamicResponse.narrative_text,
              choices: (dynamicResponse.follow_up_prompts || ['Explore', 'Investigate', 'Ask questions']),
              atmosphere: {
                mood: 'dynamic',
                tension: 'medium',
                environmentalDetails: 'The world responds to your actions'
              }
            };

            // Add NPC dialogue if present
            if (dynamicResponse.npc_dialogue) {
              dmResponse.narrative += `\n\n${dynamicResponse.npc_dialogue}`;
            }

            // Process system actions
            if (dynamicResponse.system_actions && dynamicResponse.system_actions.length > 0) {
              dynamicResponse.system_actions.forEach((action: any) => {
                if (action.type === 'dice_roll') {
                  const roll = this.rollDice(20);
                  dmResponse.narrative += `\n\n[Roll: ${roll}]`;
                }
              });
            }
          }

          // Add DM response
          const dmMessage = {
            id: Date.now() + 1,
            type: 'dm' as const,
            content: dmResponse.narrative,
            choices: dmResponse.choices,
            timestamp: new Date(),
            atmosphere: dmResponse.atmosphere
          };

          this.setState({
            messages: [...this.state.messages, dmMessage],
            isAIThinking: false,
            currentChoices: dmResponse.choices
          });

          // Update world state if present
          if (dmResponse.worldStateUpdates) {
            this.updateWorldState(dmResponse.worldStateUpdates);
          }

          return true;

        } catch (enhancedAIError) {
          console.error('Enhanced AI processing failed, using fallback:', enhancedAIError);
          // Fall through to original dynamic DM processing
        }
      }

      // Original dynamic DM processing as fallback
      const dynamicResponse = await dynamicDMService.processPlayerInput({
        message: sanitizedMessage,
        playerId: playerId,
        campaignId: this.state.currentCampaign?.id || 'single-player',
        timestamp: new Date()
      });

      // Process the enhanced response
      const dmResponse: any = {
        narrative: dynamicResponse.narrative_text,
        choices: (dynamicResponse.follow_up_prompts || ['Explore', 'Investigate', 'Ask questions']),
        atmosphere: {
          mood: 'dynamic',
          tension: 'medium',
          environmentalDetails: 'The world responds to your actions'
        }
      };

      // Add NPC dialogue if present
      if (dynamicResponse.npc_dialogue) {
        dmResponse.narrative += `\n\n${dynamicResponse.npc_dialogue}`;
      }

      // Process system actions (dice rolls, stat changes, etc.)
      if (dynamicResponse.system_actions && dynamicResponse.system_actions.length > 0) {
        dynamicResponse.system_actions.forEach((action: any) => {
          if (action.type === 'dice_roll') {
            const roll = this.rollDice(20);
            dmResponse.narrative += `\n\n[Roll: ${roll}]`;
          }
        });
      }
      
      // Update world state based on AI response
      if (dmResponse.worldStateUpdates) {
        this.updateWorldState(dmResponse.worldStateUpdates);
      }
      
      if (dmResponse.environment) {
        this.setState({ currentEnvironment: dmResponse.environment });
      }

      // Handle character updates
      if (dmResponse.characterUpdates) {
        dmResponse.characterUpdates.forEach((update: CharacterUpdate) => {
          if (update.playerId === playerId) {
            this.updateCharacter(update);
          }
        });
      }

      // Add DM message
      const dmMessage = {
        id: Date.now() + 1,
        type: 'dm' as const,
        content: dmResponse.narrative,
        choices: dmResponse.choices,
        timestamp: new Date(),
        atmosphere: dmResponse.atmosphere
      };

      this.setState({
        messages: [...this.state.messages, dmMessage],
        isAIThinking: false,
        currentChoices: dmResponse.choices
      });

      return true;
    } catch (error) {
      console.error('Error processing message:', error);
      this.setState({ isAIThinking: false });
      return false;
    }
  }

  // Character Management
  updateCharacter(update: CharacterUpdate) {
    if (!this.state.character) return;

    this.setState(prev => ({
      character: prev.character ? {
        ...prev.character,
        experience: prev.character.experience + (update.xpGain || 0),
        health: Math.max(1, Math.min(prev.character.maxHealth, prev.character.health + (update.statChanges?.health || 0))),
        mana: Math.max(0, Math.min(prev.character.maxMana, prev.character.mana + (update.statChanges?.mana || 0))),
        inventory: { ...prev.character.inventory, ...update.newItems }
      } : null
    }));

    // Update reputation
    if (update.reputationChanges) {
      this.setState(prev => ({
        worldState: {
          ...prev.worldState,
          playerReputation: { ...prev.worldState.playerReputation, ...update.reputationChanges }
        }
      }));
    }
  }

  // World State Management
  updateWorldState(updates: WorldStateUpdate) {
    this.setState(prev => ({
      worldState: {
        ...prev.worldState,
        ...updates
      }
    }));
  }

  // Combat Management
  startCombat(enemies: any[]) {
    if (!this.state.character) return;

    // Convert character and enemies to combatants
    const playerCombatant: Combatant = {
      id: this.state.character.id || 'player',
      name: this.state.character.name,
      type: 'player',
      character: this.state.character,
      position: { x: 0, y: 0 },
      health: this.state.character.health,
      maxHealth: this.state.character.maxHealth,
      mana: this.state.character.mana,
      maxMana: this.state.character.maxMana,
      actionPoints: this.state.character.actionPoints || { move: 6, action: 1, bonus: 1, reaction: 1 },
      currentActionPoints: { move: 6, action: 1, bonus: 1, reaction: 1 },
      stats: {
        strength: this.state.character.baseStats?.strength || 10,
        dexterity: this.state.character.baseStats?.dexterity || 10,
        intelligence: this.state.character.baseStats?.intelligence || 10,
        charisma: this.state.character.baseStats?.charisma || 10,
        armorClass: 10
      },
      statusEffects: [],
      isActive: false,
      hasActed: false,
      reach: 1,
      skills: this.state.character.skills || {}
    };

    const enemyCombatants: Combatant[] = enemies.map((enemy, index) => ({
      id: `enemy-${index}`,
      name: enemy.name || `Enemy ${index + 1}`,
      type: 'enemy',
      position: { x: 0, y: 0 },
      health: enemy.health || 25,
      maxHealth: enemy.health || 25,
      actionPoints: { move: 4, action: 1, bonus: 0, reaction: 1 },
      currentActionPoints: { move: 4, action: 1, bonus: 0, reaction: 1 },
      stats: {
        strength: enemy.strength || 12,
        dexterity: enemy.dexterity || 10,
        intelligence: enemy.intelligence || 8,
        charisma: enemy.charisma || 8,
        armorClass: enemy.armorClass || 12
      },
      statusEffects: [],
      isActive: false,
      hasActed: false,
      reach: 1,
      skills: {}
    }));

    this.callbacks.onCombatStart?.([playerCombatant, ...enemyCombatants]);
  }

  handleCombatAction(action: CombatAction) {
    // Handle combat actions
    console.log('Combat action:', action);
  }

  endCombat() {
    this.callbacks.onCombatEnd?.();
  }

  // Utility Functions
  rollDice(sides = 20): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  getModifier(stat: number): number {
    return Math.floor((stat - 10) / 2);
  }

  calculateStats(character: any) {
    const baseStats = character.baseStats || {};
    const level = character.level || 1;
    
    return {
      strength: baseStats.strength || 10,
      dexterity: baseStats.dexterity || 10,
      intelligence: baseStats.intelligence || 10,
      charisma: baseStats.charisma || 10,
      armorClass: 10 + (baseStats.dexterity ? Math.floor((baseStats.dexterity - 10) / 2) : 0),
      initiative: baseStats.dexterity ? Math.floor((baseStats.dexterity - 10) / 2) : 0,
      hitPoints: (baseStats.strength ? Math.floor((baseStats.strength - 10) / 2) : 0) + (level * 5),
      mana: (baseStats.intelligence ? Math.floor((baseStats.intelligence - 10) / 2) : 0) + (level * 3)
    };
  }

  // Campaign Management
  async startCampaign(campaign: any) {
    this.setState({ currentCampaign: campaign });
    
    // Initialize real-time multiplayer if it's a multiplayer campaign
    if (campaign.isMultiplayer && campaign.id) {
      await multiplayerService.initializeGameSession(campaign.id);
    }
  }

  async pauseCampaign(campaignId: string) {
    // Save campaign state
    if (this.state.currentCampaign) {
      await firebaseService.saveCampaign({
        ...this.state.currentCampaign,
        status: 'paused',
        lastPaused: new Date()
      });
    }
  }

  async resumeCampaign(campaignId: string) {
    // Load campaign state
    const campaign = await firebaseService.loadCampaign(campaignId);
    if (campaign) {
      this.setState({ currentCampaign: campaign });
    }
  }

  // Enhanced AI party member management
  async enableAIPartyMembers(): Promise<boolean> {
    try {
      if (!this.state.currentCampaign) return false;

      // Check if AI party members already exist
      if (this.aiPartyMembers.length > 0) {
        this.aiEnabled = true;
        return true;
      }

      // Load existing AI party members
      const existingMembers = await unifiedAIService.loadAIPartyMembers(
        this.state.currentCampaign.id || 'single-player'
      );

      if (existingMembers && existingMembers.length > 0) {
        this.aiPartyMembers = existingMembers;
        this.aiEnabled = true;
        return true;
      }

      // Generate new AI party members
      const gameContext: UnifiedGameContext = {
        gameId: this.state.currentCampaign.id || 'single-player',
        gameType: 'single-player',
        realm: this.inferRealmFromTheme(this.state.currentCampaign.theme),
        theme: this.state.currentCampaign.theme,
        participants: [{
          id: 'player',
          name: 'Player',
          character: this.state.character
        }],
        worldState: this.state.worldState,
        messages: this.state.messages.slice(-10)
      };

      this.aiPartyMembers = await unifiedAIService.generateAIPartyMembersForContext(gameContext);
      this.aiEnabled = true;

      // Save AI party members
      await unifiedAIService.saveAIPartyMembers(gameContext.gameId, this.aiPartyMembers);

      return true;
    } catch (error) {
      console.error('Error enabling AI party members:', error);
      return false;
    }
  }

  disableAIPartyMembers(): void {
    this.aiEnabled = false;
  }

  getAIPartyMembers(): AIPartyMember[] {
    return this.aiPartyMembers;
  }

  isAIEnabled(): boolean {
    return this.aiEnabled;
  }

  private inferRealmFromTheme(theme: string): string {
    const themeRealms: Record<string, string> = {
      'Classic Fantasy': 'Fantasy',
      'Cyberpunk': 'Cyberpunk',
      'Post-Apocalyptic': 'Post-Apocalyptic',
      'Space Opera': 'Space Opera',
      'Horror': 'Horror',
      'Steampunk': 'Steampunk',
      'Wild West': 'Wild West',
      'Modern Day': 'Modern',
      'Custom Adventure': 'Fantasy'
    };

    return themeRealms[theme] || 'Fantasy';
  }
}

// Export singleton instance
export const gameStateService = new GameStateService(); 