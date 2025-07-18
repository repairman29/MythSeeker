/**
 * Unified AI Service
 * 
 * Ensures AI conversation capabilities are available across all game modes:
 * - Automated games (already implemented)
 * - Single-player campaigns 
 * - Multiplayer campaigns
 * - Custom campaigns
 * 
 * This service bridges the gap between different game systems to provide
 * consistent AI party member experiences regardless of game mode.
 */

import { AIPartyMember, GameSession } from './automatedGameService';
import { aiService } from './aiService';
import { sentientAI } from './sentientAIService';

export interface UnifiedGameContext {
  gameId: string;
  gameType: 'automated' | 'campaign' | 'multiplayer' | 'single-player';
  realm: string;
  theme: string;
  participants: Array<{
    id: string;
    name: string;
    character?: any;
    isHost?: boolean;
  }>;
  aiPartyMembers?: AIPartyMember[];
  worldState?: any;
  messages?: any[];
  sessionMetadata?: any;
}

export interface UnifiedAIResponse {
  aiPartyResponses: Array<{
    characterName: string;
    content: string;
    metadata: {
      isAI: true;
      characterClass: string;
      conversationType?: string;
      emotionalTone?: string;
    };
  }>;
  aiToAiConversations: Array<{
    speaker: string;
    target: string;
    content: string;
    conversationType: string;
  }>;
  dmResponse?: string;
  supportiveInteractions: Array<{
    characterName: string;
    content: string;
    supportType: string;
  }>;
}

class UnifiedAIService {
  
  /**
   * Process player input and generate appropriate AI responses
   * for any game mode (automated, campaign, multiplayer)
   */
  async processPlayerInputUnified(
    context: UnifiedGameContext,
    playerId: string,
    playerInput: string
  ): Promise<UnifiedAIResponse> {
    console.log('🔗 UnifiedAIService: Processing input for', context.gameType, 'game');
    
    const response: UnifiedAIResponse = {
      aiPartyResponses: [],
      aiToAiConversations: [],
      supportiveInteractions: []
    };

    // Ensure AI party members exist for this game context
    if (!context.aiPartyMembers || context.aiPartyMembers.length === 0) {
      console.log('🤖 No AI party members found, generating for', context.gameType);
      context.aiPartyMembers = await this.generateAIPartyMembersForContext(context);
    }

    // Generate AI party member responses
    response.aiPartyResponses = await this.generateUnifiedAIResponses(
      context, 
      playerInput
    );

    // Generate AI-to-AI conversations
    response.aiToAiConversations = await this.generateUnifiedAIToAIConversations(
      context, 
      playerInput
    );

    // Generate supportive interactions
    response.supportiveInteractions = await this.generateUnifiedSupportiveInteractions(
      context, 
      playerInput
    );

    // Generate DM response if needed (for non-automated games)
    if (context.gameType !== 'automated') {
      response.dmResponse = await this.generateUnifiedDMResponse(context, playerInput);
    }

    return response;
  }

  /**
   * Generate AI party members for campaigns that don't have them
   */
  async generateAIPartyMembersForContext(context: UnifiedGameContext): Promise<AIPartyMember[]> {
    console.log('🎭 Generating AI party members for', context.realm, context.gameType);
    
    const partyMembers: AIPartyMember[] = [];
    
    // Determine how many AI members to create based on game type and player count
    const humanPlayerCount = context.participants.length;
    const maxAIMembers = context.gameType === 'single-player' ? 2 : 
                        context.gameType === 'multiplayer' ? Math.max(1, 4 - humanPlayerCount) : 2;
    
    const memberCount = Math.min(maxAIMembers, 3); // Cap at 3 AI members
    
    const characterTemplates = this.getCharacterTemplatesForRealm(context.realm);
    const selectedTemplates = this.shuffleArray(characterTemplates).slice(0, memberCount);
    
    selectedTemplates.forEach((template, index) => {
      const member: AIPartyMember = {
        id: `unified_ai_${Date.now()}_${index}`,
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
          level: Math.floor(Math.random() * 3) + 1,
          health: template.stats.baseHealth + Math.floor(Math.random() * 10),
          mana: template.stats.baseMana ? template.stats.baseMana + Math.floor(Math.random() * 10) : undefined,
          primaryStat: template.stats.primaryStat
        },
        relationships: new Map<string, number>(),
        lastSpokeAt: 0,
        conversationContext: []
      };
      
      // Initialize relationships with human players
      context.participants.forEach(participant => {
        member.relationships.set(participant.id, Math.floor(Math.random() * 20) - 10); // Start with slight variation
      });
      
      partyMembers.push(member);
    });
    
    console.log(`✅ Generated ${partyMembers.length} AI party members:`, 
      partyMembers.map(m => `${m.name} (${m.characterClass})`));
    
    return partyMembers;
  }

  /**
   * Generate AI party member responses using the enhanced system
   */
  async generateUnifiedAIResponses(
    context: UnifiedGameContext,
    playerInput: string
  ): Promise<UnifiedAIResponse['aiPartyResponses']> {
    const responses = [];
    
    if (!context.aiPartyMembers || context.aiPartyMembers.length === 0) {
      return responses;
    }

    // Determine which AI members should respond
    const activeMembers = context.aiPartyMembers.filter(member => {
      const timeSinceLastSpoke = Date.now() - member.lastSpokeAt;
      const shouldSpeak = timeSinceLastSpoke > 30000 || // 30 seconds minimum
                         this.shouldRespondToContext(member, playerInput) ||
                         Math.random() < 0.3; // 30% chance to interject
      return shouldSpeak;
    });

    // Limit to 1-2 responses to avoid spam
    const respondingMembers = activeMembers.slice(0, Math.random() < 0.7 ? 1 : 2);
    
    for (const member of respondingMembers) {
      try {
        const response = await this.generateAICharacterResponse(member, playerInput, context);
        if (response) {
          responses.push({
            characterName: member.name,
            content: response,
            metadata: {
              isAI: true,
              characterClass: member.characterClass,
              conversationType: 'response'
            }
          });
          
          member.lastSpokeAt = Date.now();
          member.conversationContext.push(playerInput);
          
          // Keep only last 5 context entries
          if (member.conversationContext.length > 5) {
            member.conversationContext.shift();
          }
        }
      } catch (error) {
        console.error(`Error generating response for ${member.name}:`, error);
      }
    }

    return responses;
  }

  /**
   * Generate AI-to-AI conversations for any game type
   */
  async generateUnifiedAIToAIConversations(
    context: UnifiedGameContext,
    triggerInput: string
  ): Promise<UnifiedAIResponse['aiToAiConversations']> {
    const conversations = [];
    
    if (!context.aiPartyMembers || context.aiPartyMembers.length < 2) {
      return conversations;
    }

    // Use the same conversation pair logic from automated games
    const conversationPairs = this.identifyConversationPairs(context.aiPartyMembers, triggerInput);
    
    for (const { member1, member2, conversationType } of conversationPairs) {
      try {
        const conversation = await this.generateAIToAIExchange(
          member1, 
          member2, 
          conversationType, 
          context, 
          triggerInput
        );
        
        conversations.push(...conversation);
      } catch (error) {
        console.error(`Error generating AI-to-AI conversation between ${member1.name} and ${member2.name}:`, error);
      }
    }

    return conversations;
  }

  /**
   * Generate supportive interactions for any game type
   */
  async generateUnifiedSupportiveInteractions(
    context: UnifiedGameContext,
    playerInput: string
  ): Promise<UnifiedAIResponse['supportiveInteractions']> {
    const supportiveInteractions = [];
    
    if (!context.aiPartyMembers) {
      return supportiveInteractions;
    }

    // Detect if player needs support
    const supportEvent = this.detectSupportNeeded(playerInput);
    
    if (supportEvent) {
      const supportiveMembers = context.aiPartyMembers.filter(member => 
        this.shouldProvideSupport(member, supportEvent)
      );

      for (const member of supportiveMembers.slice(0, 2)) { // Limit to 2 supportive responses
        try {
          const supportResponse = await this.generateSupportiveResponse(member, supportEvent, context);
          if (supportResponse) {
            supportiveInteractions.push({
              characterName: member.name,
              content: supportResponse,
              supportType: supportEvent.type
            });
          }
        } catch (error) {
          console.error(`Error generating supportive response for ${member.name}:`, error);
        }
      }
    }

    return supportiveInteractions;
  }

  /**
   * Generate DM response for campaigns using the enhanced AI system
   */
  async generateUnifiedDMResponse(
    context: UnifiedGameContext,
    playerInput: string
  ): Promise<string | undefined> {
    try {
      const sentientContext = {
        location: context.worldState?.currentLocation || 'unknown',
        situation: 'exploration',
        sessionType: context.gameType,
        realm: context.realm,
        theme: context.theme,
        participants: context.participants,
        aiPartyMembers: context.aiPartyMembers,
        worldState: context.worldState,
        recentMessages: context.messages?.slice(-10) || []
      };

      const sentientResult = await sentientAI.processSentientInput(
        context.participants[0]?.id || 'unknown-player',
        playerInput,
        sentientContext
      );

      return sentientResult.response;
    } catch (error) {
      console.error('Error generating unified DM response:', error);
      return undefined;
    }
  }

  /**
   * Helper methods (reusing logic from automatedGameService)
   */
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
    return keywords.some(keyword => contextLower.includes(keyword));
  }

  private identifyConversationPairs(aiMembers: AIPartyMember[], context: string): Array<{
    member1: AIPartyMember;
    member2: AIPartyMember;
    conversationType: string;
  }> {
    const pairs = [];
    const contextLower = context.toLowerCase();

    for (let i = 0; i < aiMembers.length; i++) {
      for (let j = i + 1; j < aiMembers.length; j++) {
        const member1 = aiMembers[i];
        const member2 = aiMembers[j];
        
        const recentInteractionGap = Math.min(
          Date.now() - member1.lastSpokeAt,
          Date.now() - member2.lastSpokeAt
        );

        // 30% chance for AI-to-AI conversation if enough time has passed
        if (recentInteractionGap > 45000 && Math.random() < 0.3) {
          let conversationType = 'friendly_banter';
          
          if (contextLower.includes('danger') || contextLower.includes('combat')) {
            conversationType = 'strategic_discussion';
          } else if (contextLower.includes('remember') || contextLower.includes('past')) {
            conversationType = 'memory_sharing';
          }

          pairs.push({ member1, member2, conversationType });
        }
      }
    }

    return pairs.slice(0, 1); // Limit to 1 conversation pair per round
  }

  private detectSupportNeeded(input: string): { type: string; context: string } | null {
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('overwhelmed') || inputLower.includes('scared') || inputLower.includes('worried')) {
      return { type: 'emotional_support', context: input };
    }
    
    if (inputLower.includes('confused') || inputLower.includes('lost') || inputLower.includes('help')) {
      return { type: 'guidance', context: input };
    }
    
    if (inputLower.includes('tired') || inputLower.includes('hurt') || inputLower.includes('injured')) {
      return { type: 'physical_support', context: input };
    }
    
    return null;
  }

  private shouldProvideSupport(member: AIPartyMember, supportEvent: any): boolean {
    const traits = member.personality.traits;
    
    switch (supportEvent.type) {
      case 'emotional_support':
        return traits.includes('protective') || traits.includes('empathetic') || traits.includes('loyal');
      case 'guidance':
        return traits.includes('wise') || traits.includes('experienced') || traits.includes('helpful');
      case 'physical_support':
        return traits.includes('healer') || traits.includes('protective') || member.characterClass === 'Cleric';
      default:
        return Math.random() < 0.3;
    }
  }

  private async generateAICharacterResponse(
    member: AIPartyMember,
    context: string,
    gameContext: UnifiedGameContext
  ): Promise<string | null> {
    try {
      const sentientContext = {
        location: gameContext.worldState?.currentLocation || 'unknown',
        situation: 'conversation',
        sessionType: gameContext.gameType,
        realm: gameContext.realm,
        aiCharacter: member,
        recentMessages: gameContext.messages?.slice(-5) || []
      };

      const sentientResult = await sentientAI.processSentientInput(
        member.id,
        context,
        sentientContext
      );

      return sentientResult.response;
    } catch (error) {
      console.error(`Error generating sentient response for ${member.name}:`, error);
      return this.generateFallbackResponse(member, context);
    }
  }

  private async generateAIToAIExchange(
    member1: AIPartyMember,
    member2: AIPartyMember,
    conversationType: string,
    context: UnifiedGameContext,
    triggerInput: string
  ): Promise<Array<{ speaker: string; target: string; content: string; conversationType: string }>> {
    const exchanges = [];
    
    try {
      // Generate conversation starter
      const starterPrompt = this.buildConversationPrompt(member1, member2, conversationType, 'starter', context, triggerInput);
      const starterResponse = await aiService.complete(starterPrompt);
      
      if (starterResponse) {
        exchanges.push({
          speaker: member1.name,
          target: member2.name,
          content: starterResponse,
          conversationType
        });

        // Generate response
        const responsePrompt = this.buildConversationPrompt(member2, member1, conversationType, 'response', context, triggerInput, starterResponse);
        const memberResponse = await aiService.complete(responsePrompt);
        
        if (memberResponse) {
          exchanges.push({
            speaker: member2.name,
            target: member1.name,
            content: memberResponse,
            conversationType
          });
        }
      }
    } catch (error) {
      console.error('Error generating AI-to-AI exchange:', error);
    }

    return exchanges;
  }

  private async generateSupportiveResponse(
    member: AIPartyMember,
    supportEvent: any,
    context: UnifiedGameContext
  ): Promise<string | null> {
    try {
      const prompt = `You are ${member.name}, a ${member.race} ${member.characterClass}.
Your personality: ${member.personality.traits.join(', ')}

A party member said: "${supportEvent.context}"
They seem to need ${supportEvent.type.replace('_', ' ')}.

Provide a supportive response that fits your character. Keep it 1-2 sentences and genuine.

${member.name} says:`;

      return await aiService.complete(prompt);
    } catch (error) {
      console.error(`Error generating supportive response for ${member.name}:`, error);
      return null;
    }
  }

  private buildConversationPrompt(
    speaker: AIPartyMember,
    target: AIPartyMember,
    conversationType: string,
    role: 'starter' | 'response',
    context: UnifiedGameContext,
    triggerInput: string,
    previousMessage?: string
  ): string {
    const conversationContexts = {
      friendly_banter: role === 'starter' 
        ? `Make a light, friendly comment to ${target.name}. Show your personality.`
        : `Respond to ${speaker.name}'s comment in a friendly way.`,
      
      strategic_discussion: role === 'starter'
        ? `Start a tactical discussion with ${target.name} about the current situation.`
        : `Respond to ${speaker.name}'s strategic input with your own perspective.`,
      
      memory_sharing: role === 'starter'
        ? `Share a relevant memory or experience with ${target.name}.`
        : `Relate to ${speaker.name}'s memory with your own experience.`
    };

    return `You are ${speaker.name}, a ${speaker.race} ${speaker.characterClass} with these traits: ${speaker.personality.traits.join(', ')}.

You're talking to ${target.name}, a ${target.race} ${target.characterClass} in your party.

CURRENT SITUATION: ${triggerInput}
CONVERSATION TYPE: ${conversationType}
${previousMessage ? `THEY JUST SAID: "${previousMessage}"` : ''}

${conversationContexts[conversationType as keyof typeof conversationContexts]}

Keep it to 1-2 sentences and stay in character.

${speaker.name} says:`;
  }

  private generateFallbackResponse(member: AIPartyMember, context: string): string {
    const fallbackResponses = [
      `*${member.name} nods thoughtfully*`,
      `*${member.name} considers the situation carefully*`,
      `"Interesting perspective," ${member.name} says.`,
      `*${member.name} looks around cautiously*`,
      `"We should proceed carefully," ${member.name} suggests.`
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  private getCharacterTemplatesForRealm(realm: string): any[] {
    // Reuse the character templates from automatedGameService
    const templates = {
      'Post-Apocalyptic': [
        {
          name: 'Ghost',
          characterClass: 'Scavenger',
          race: 'Human',
          personality: {
            traits: ['paranoid', 'resourceful', 'survivor', 'cautious'],
            alignment: 'Chaotic Neutral',
            background: 'Wasteland Survivor',
            quirks: ['Always checks for traps', 'Hoards useful items', 'Distrusts authority']
          },
          stats: { baseHealth: 80, baseMana: 30, primaryStat: 'Dexterity' }
        },
        {
          name: 'Zara',
          characterClass: 'Medic',
          race: 'Human',
          personality: {
            traits: ['compassionate', 'determined', 'practical', 'protective'],
            alignment: 'Neutral Good',
            background: 'Former Doctor',
            quirks: ['Always carries medical supplies', 'Tries to save everyone', 'Hates violence']
          },
          stats: { baseHealth: 60, baseMana: 80, primaryStat: 'Wisdom' }
        }
      ],
      'Fantasy': [
        {
          name: 'Elara',
          characterClass: 'Cleric',
          race: 'Elf',
          personality: {
            traits: ['wise', 'compassionate', 'devoted', 'peaceful'],
            alignment: 'Lawful Good',
            background: 'Temple Acolyte',
            quirks: ['Prays before meals', 'Collects rare herbs', 'Speaks to animals']
          },
          stats: { baseHealth: 70, baseMana: 100, primaryStat: 'Wisdom' }
        },
        {
          name: 'Thane',
          characterClass: 'Fighter',
          race: 'Dwarf',
          personality: {
            traits: ['brave', 'loyal', 'stubborn', 'honorable'],
            alignment: 'Lawful Good',
            background: 'Mountain Clan Warrior',
            quirks: ['Loves ale and stories', 'Never backs down', 'Crafts in spare time']
          },
          stats: { baseHealth: 120, baseMana: 20, primaryStat: 'Strength' }
        }
      ]
    };

    return templates[realm as keyof typeof templates] || templates['Fantasy'];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Save AI party members to persistent storage for campaigns
   */
  async saveAIPartyMembers(gameId: string, aiPartyMembers: AIPartyMember[]): Promise<void> {
    try {
      // Convert relationships Map to plain object for storage
      const serializedMembers = aiPartyMembers.map(member => ({
        ...member,
        relationships: Object.fromEntries(member.relationships)
      }));

      localStorage.setItem(`ai_party_${gameId}`, JSON.stringify(serializedMembers));
      console.log(`💾 Saved ${aiPartyMembers.length} AI party members for game ${gameId}`);
    } catch (error) {
      console.error('Error saving AI party members:', error);
    }
  }

  /**
   * Load AI party members from persistent storage for campaigns
   */
  async loadAIPartyMembers(gameId: string): Promise<AIPartyMember[] | null> {
    try {
      const stored = localStorage.getItem(`ai_party_${gameId}`);
      if (!stored) return null;

      const serializedMembers = JSON.parse(stored);
      
      // Convert relationships object back to Map
      return serializedMembers.map((member: any) => ({
        ...member,
        relationships: new Map(Object.entries(member.relationships || {}))
      }));
    } catch (error) {
      console.error('Error loading AI party members:', error);
      return null;
    }
  }
}

export const unifiedAIService = new UnifiedAIService();
export { UnifiedAIService }; 