import { aiService } from './aiService';
import { embeddingsMemoryService, SemanticMemory } from './embeddingsMemoryService';
import { sentientAI } from './sentientAIService';

// Enhanced AI interfaces for the market-leading framework
export interface RichContext {
  // Immediate Context (last 3 interactions)
  immediate: {
    lastPlayerAction: string;
    aiResponse: string;
    currentEmotionalTone: string;
    activeNPCs: any[];
  };
  
  // Session Context (current game session)
  session: {
    objectives: string[];
    narrativeArcs: any[];
    worldEvents: any[];
    playerChoices: any[];
    config: any;
  };
  
  // Character Context (evolving personalities)
  character: {
    playerArchetype: string;
    relationshipDynamics: any[];
    emotionalJourney: any[];
    characterGrowth: any[];
  };
  
  // World Context (living, breathing world)
  world: {
    currentLocation: any;
    weatherAndTime: any;
    politicalSituation?: any;
    economicFactors?: any;
    magicalEnergy?: any;
    activeQuests: any[];
    npcs: any[];
    worldState: any;
  };
  
  // Semantic Context (from embeddings)
  semantic: {
    relevantMemories: SemanticMemory[];
    thematicConnections: string[];
    emotionalResonance: string[];
    narrativeParallels: string[];
  };
}

export interface AdvancedAIInput {
  content: string;
  playerId: string;
  gameContext: {
    realm: string;
    location: string;
    session: any;
    worldState: any;
  };
  playerContext: {
    name: string;
    characterClass: string;
    experience: string;
    preferences: string[];
  };
}

export interface RichAIResponse {
  response: string;
  worldStateUpdates: any;
  characterDevelopment: any;
  proactiveInsights: string[];
  memoryReferences: string[];
  confidenceScore: number;
  emotionalTone: string;
  narrativeSignificance: number;
}

/**
 * Enhanced AI Service - Market-Leading AI Framework
 * 
 * This service provides context-aware, emotionally intelligent AI responses
 * with semantic memory, character evolution, and proactive storytelling.
 */
export class EnhancedAIService {
  private contextAnalysisCache = new Map<string, any>();
  private responseCache = new Map<string, RichAIResponse>();
  
  constructor() {
    console.log('🚀 Initializing Enhanced AI Service with advanced framework...');
  }

  /**
   * Generate context-aware response using the full advanced AI framework
   */
  async generateContextAwareResponse(input: AdvancedAIInput): Promise<RichAIResponse> {
    console.log('🧠 Enhanced AI: Generating context-aware response...');

    try {
      // 1. Analyze input for context clues
      const contextAnalysis = await this.analyzeInputContext(input);
      
      // 2. Retrieve semantic memories
      const relevantMemories = await embeddingsMemoryService.retrieveRelevantMemories(
        input.content,
        {
          limit: 10,
          threshold: 0.7,
          contextFilters: {
            characters: [input.playerId],
            realm: input.gameContext.realm,
            locations: [input.gameContext.location]
          }
        }
      );
      
      // 3. Build rich context
      const richContext = await this.buildRichContext({
        input,
        memories: relevantMemories,
        contextAnalysis,
        gameState: input.gameContext,
        playerProfile: input.playerContext
      });
      
      // 4. Generate response with optimal model selection
      const response = await this.generateWithModelOrchestration(richContext, input);
      
      // 5. Store new memories from this interaction
      await this.storeInteractionMemories(input, response, contextAnalysis);
      
      // 6. Generate proactive insights
      const proactiveInsights = await this.generateProactiveInsights(richContext);
      
      return {
        response: response.content,
        worldStateUpdates: response.worldChanges || {},
        characterDevelopment: response.characterGrowth || {},
        proactiveInsights,
        memoryReferences: relevantMemories.map(m => m.content.substring(0, 100)),
        confidenceScore: response.confidence || 0.8,
        emotionalTone: contextAnalysis.emotionalTone || 'neutral',
        narrativeSignificance: contextAnalysis.significance || 5
      };
    } catch (error) {
      console.error('❌ Enhanced AI error:', error);
      // Fallback to standard AI service
      return this.generateFallbackResponse(input);
    }
  }

  /**
   * Analyze player input for emotional tone, themes, and significance
   */
  private async analyzeInputContext(input: AdvancedAIInput): Promise<{
    emotionalTone: string;
    themes: string[];
    significance: number;
    playerArchetype: string;
    urgency: number;
    complexity: number;
  }> {
    const cacheKey = `${input.playerId}_${this.hashString(input.content)}`;
    if (this.contextAnalysisCache.has(cacheKey)) {
      return this.contextAnalysisCache.get(cacheKey);
    }

    const content = input.content.toLowerCase();
    
    // Emotional tone analysis
    let emotionalTone = 'neutral';
    if (/happy|joy|excited|pleased|love|amazing/i.test(content)) emotionalTone = 'positive';
    else if (/angry|mad|frustrated|hate|terrible|awful/i.test(content)) emotionalTone = 'negative';
    else if (/scared|afraid|worried|nervous|anxious/i.test(content)) emotionalTone = 'fearful';
    else if (/curious|interested|wonder|explore|investigate/i.test(content)) emotionalTone = 'curious';
    
    // Theme analysis
    const themes: string[] = [];
    if (/combat|fight|battle|attack|war/i.test(content)) themes.push('combat');
    if (/talk|speak|conversation|negotiate|diplomacy/i.test(content)) themes.push('social');
    if (/explore|search|find|discover|investigate/i.test(content)) themes.push('exploration');
    if (/magic|spell|enchant|mystical|arcane/i.test(content)) themes.push('magic');
    if (/trade|buy|sell|merchant|gold/i.test(content)) themes.push('commerce');
    if (/quest|mission|task|goal|objective/i.test(content)) themes.push('quest');
    if (/secret|hidden|mystery|riddle|puzzle/i.test(content)) themes.push('mystery');
    
    // Significance analysis (1-10)
    let significance = 5; // default
    if (/important|urgent|critical|emergency/i.test(content)) significance += 3;
    if (/kill|death|destroy|war|battle/i.test(content)) significance += 2;
    if (/love|marry|relationship|friend/i.test(content)) significance += 2;
    if (/quest|mission|goal/i.test(content)) significance += 1;
    if (/hello|hi|thanks|please/i.test(content)) significance -= 2;
    significance = Math.max(1, Math.min(10, significance));
    
    // Player archetype inference
    const playerArchetype = this.inferAdvancedPlayerArchetype(content, input.playerContext);
    
    // Urgency analysis (1-10)
    let urgency = 5;
    if (/now|immediately|urgent|quickly|fast/i.test(content)) urgency += 3;
    if (/later|eventually|sometime|maybe/i.test(content)) urgency -= 2;
    urgency = Math.max(1, Math.min(10, urgency));
    
    // Complexity analysis (1-10)
    const complexity = Math.min(10, Math.max(1, 
      content.split(' ').length / 5 + // Word count factor
      themes.length + // Theme complexity
      (content.includes('?') ? 2 : 0) + // Question complexity
      (content.split(',').length - 1) // Multi-part requests
    ));

    const analysis = {
      emotionalTone,
      themes,
      significance,
      playerArchetype,
      urgency,
      complexity
    };

    this.contextAnalysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Build comprehensive context from all available sources
   */
  private async buildRichContext(params: {
    input: AdvancedAIInput;
    memories: SemanticMemory[];
    contextAnalysis: any;
    gameState: any;
    playerProfile: any;
  }): Promise<RichContext> {
    const { input, memories, contextAnalysis, gameState, playerProfile } = params;

    // Extract immediate context
    const immediate = {
      lastPlayerAction: input.content,
      aiResponse: '', // Will be filled by response
      currentEmotionalTone: contextAnalysis.emotionalTone,
      activeNPCs: gameState.session?.npcs || []
    };

    // Session context
    const session = {
      objectives: gameState.session?.activeQuests?.map((q: any) => q.title) || [],
      narrativeArcs: [], // Could be extracted from session data
      worldEvents: gameState.session?.worldEvents || [],
      playerChoices: [], // Could track recent player choices
      config: gameState.session?.config || {}
    };

    // Character context
    const character = {
      playerArchetype: contextAnalysis.playerArchetype,
      relationshipDynamics: [], // Could be extracted from NPC relationships
      emotionalJourney: [], // Could track emotional state over time
      characterGrowth: [] // Could track character development
    };

    // World context
    const world = {
      currentLocation: {
        name: gameState.location,
        description: gameState.worldState?.currentLocation || 'Unknown location'
      },
      weatherAndTime: {
        weather: gameState.worldState?.weather || 'clear',
        timeOfDay: gameState.worldState?.timeOfDay || 'day'
      },
      activeQuests: gameState.session?.activeQuests || [],
      npcs: gameState.session?.npcs || [],
      worldState: gameState.worldState || {}
    };

    // Semantic context from memories
    const semantic = {
      relevantMemories: memories,
      thematicConnections: [...new Set(memories.flatMap(m => m.context.themes))],
      emotionalResonance: [...new Set(memories.flatMap(m => m.context.emotions))],
      narrativeParallels: memories.filter(m => m.connections.length > 0).map(m => m.content.substring(0, 50))
    };

    return {
      immediate,
      session,
      character,
      world,
      semantic
    };
  }

  /**
   * Generate response using model orchestration
   */
  private async generateWithModelOrchestration(
    richContext: RichContext, 
    input: AdvancedAIInput
  ): Promise<{ content: string; confidence: number; worldChanges?: any; characterGrowth?: any }> {
    console.log('🎭 Enhanced AI: Using model orchestration...');

    // Build enhanced prompt with rich context
    const enhancedPrompt = this.buildEnhancedPrompt(richContext, input);

    try {
      // Try sentient AI first for best results
      const sentientResult = await sentientAI.processSentientInput(
        input.playerId,
        input.content,
        {
          location: input.gameContext.location,
          situation: 'enhanced_context',
          sessionType: 'advanced_ai',
          realm: input.gameContext.realm,
          richContext: richContext
        }
      );

      return {
        content: sentientResult.response,
        confidence: 0.9,
        worldChanges: {}, // Could extract from sentient insights
        characterGrowth: {} // Could track character development
      };
    } catch (error) {
      console.error('❌ Sentient AI failed, using enhanced fallback:', error);
      
      try {
        // Fallback to enhanced dynamic response
        const dynamicResponse = await aiService.generateEnhancedDynamicResponse(enhancedPrompt);
        return {
          content: dynamicResponse,
          confidence: 0.7
        };
      } catch (fallbackError) {
        console.error('❌ Enhanced fallback failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Build enhanced prompt with rich context
   */
  private buildEnhancedPrompt(richContext: RichContext, input: AdvancedAIInput): string {
    const memoryContext = richContext.semantic.relevantMemories.length > 0
      ? `\nRELEVANT MEMORIES:\n${richContext.semantic.relevantMemories.map(m => `- ${m.content.substring(0, 100)}...`).join('\n')}\n`
      : '';

    const thematicContext = richContext.semantic.thematicConnections.length > 0
      ? `\nTHEMATIC CONNECTIONS: ${richContext.semantic.thematicConnections.join(', ')}\n`
      : '';

    return `You are an advanced AI Dungeon Master with perfect memory and emotional intelligence. Generate a contextually rich, emotionally resonant response.

GAME CONTEXT:
- Realm: ${input.gameContext.realm}
- Location: ${richContext.world.currentLocation.name}
- Weather: ${richContext.world.weatherAndTime.weather}
- Time: ${richContext.world.weatherAndTime.timeOfDay}

PLAYER CONTEXT:
- Name: ${input.playerContext.name}
- Class: ${input.playerContext.characterClass}
- Archetype: ${richContext.character.playerArchetype}
- Emotional State: ${richContext.immediate.currentEmotionalTone}

WORLD STATE:
- Active NPCs: ${richContext.world.npcs.length}
- Active Quests: ${richContext.world.activeQuests.length}
- World Events: ${richContext.world.worldState}

${memoryContext}${thematicContext}

PLAYER INPUT: "${input.content}"

RESPONSE REQUIREMENTS:
- Reference relevant memories naturally
- Show emotional intelligence and context awareness
- Advance the narrative meaningfully
- Create opportunities for player engagement
- Maintain consistent world and character development

Generate an immersive, contextually perfect response:`;
  }

  /**
   * Store interaction memories with rich context
   */
  private async storeInteractionMemories(
    input: AdvancedAIInput,
    response: RichAIResponse,
    analysis: any
  ): Promise<void> {
    try {
      await embeddingsMemoryService.storeInteraction(
        input.playerId,
        input.content,
        response.response,
        {
          location: input.gameContext.location,
          emotions: [analysis.emotionalTone],
          themes: analysis.themes,
          realm: input.gameContext.realm,
          sessionId: input.gameContext.session?.id,
          campaignId: input.gameContext.session?.campaignId
        },
        {
          emotionalTone: analysis.emotionalTone,
          themes: analysis.themes,
          significance: analysis.significance,
          relationshipChanges: {} // Could extract from response
        }
      );
      
      console.log('💾 Stored interaction memories with rich context');
    } catch (error) {
      console.error('❌ Failed to store interaction memories:', error);
    }
  }

  /**
   * Generate proactive insights and suggestions
   */
  private async generateProactiveInsights(richContext: RichContext): Promise<string[]> {
    const insights: string[] = [];

    // Analyze player behavior patterns
    if (richContext.semantic.relevantMemories.length > 5) {
      const actionTypes = richContext.semantic.relevantMemories
        .filter(m => m.type === 'player_action')
        .map(m => m.metadata.playerArchetype)
        .filter(Boolean);
      
      const dominantArchetype = this.getMostCommon(actionTypes);
      if (dominantArchetype) {
        insights.push(`Player shows ${dominantArchetype} tendencies - consider introducing relevant challenges`);
      }
    }

    // Analyze emotional patterns
    const emotionalMemories = richContext.semantic.relevantMemories
      .filter(m => Math.abs(m.emotionalWeight) > 2);
    
    if (emotionalMemories.length > 3) {
      insights.push(`Player has strong emotional connections to this storyline - amplify emotional resonance`);
    }

    // Analyze narrative opportunities
    if (richContext.semantic.thematicConnections.length > 3) {
      insights.push(`Rich thematic connections available: ${richContext.semantic.thematicConnections.slice(0, 3).join(', ')}`);
    }

    return insights;
  }

  /**
   * Generate fallback response using standard AI
   */
  private async generateFallbackResponse(input: AdvancedAIInput): Promise<RichAIResponse> {
    try {
      const basicPrompt = `Player ${input.playerContext.name} said: "${input.content}" in ${input.gameContext.realm}. Respond as a helpful DM.`;
      const response = await aiService.generateEnhancedDynamicResponse(basicPrompt);
      
      return {
        response,
        worldStateUpdates: {},
        characterDevelopment: {},
        proactiveInsights: ['Fallback response generated'],
        memoryReferences: [],
        confidenceScore: 0.5,
        emotionalTone: 'neutral',
        narrativeSignificance: 3
      };
    } catch (error) {
      console.error('❌ Fallback response failed:', error);
      return {
        response: "I'm experiencing some technical difficulties, but I'm here to help! Could you try rephrasing your request?",
        worldStateUpdates: {},
        characterDevelopment: {},
        proactiveInsights: [],
        memoryReferences: [],
        confidenceScore: 0.1,
        emotionalTone: 'apologetic',
        narrativeSignificance: 1
      };
    }
  }

  // ======= UTILITY METHODS =======

  /**
   * Infer advanced player archetype with context
   */
  private inferAdvancedPlayerArchetype(content: string, playerContext: any): string {
    const lowerContent = content.toLowerCase();
    
    // Combat archetypes
    if (/attack|fight|battle|charge|strike/i.test(lowerContent)) return 'warrior';
    if (/sneak|stealth|assassinate|backstab/i.test(lowerContent)) return 'assassin';
    if (/defend|protect|guard|shield/i.test(lowerContent)) return 'guardian';
    
    // Social archetypes
    if (/negotiate|convince|persuade|charm/i.test(lowerContent)) return 'diplomat';
    if (/intimidate|threaten|demand/i.test(lowerContent)) return 'intimidator';
    if (/help|aid|support|heal/i.test(lowerContent)) return 'supporter';
    
    // Exploration archetypes
    if (/explore|search|investigate|examine/i.test(lowerContent)) return 'explorer';
    if (/trap|lockpick|disable|sneak/i.test(lowerContent)) return 'scout';
    if (/solve|puzzle|riddle|analyze/i.test(lowerContent)) return 'analyst';
    
    // Magic archetypes
    if (/cast|spell|magic|enchant/i.test(lowerContent)) return 'spellcaster';
    if (/ritual|summon|invoke|channel/i.test(lowerContent)) return 'ritualist';
    
    // Default based on player class
    const playerClass = playerContext.characterClass?.toLowerCase();
    if (playerClass?.includes('warrior') || playerClass?.includes('fighter')) return 'warrior';
    if (playerClass?.includes('rogue') || playerClass?.includes('thief')) return 'scout';
    if (playerClass?.includes('mage') || playerClass?.includes('wizard')) return 'spellcaster';
    if (playerClass?.includes('cleric') || playerClass?.includes('priest')) return 'supporter';
    
    return 'balanced';
  }

  /**
   * Get most common element in array
   */
  private getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    
    const counts = arr.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(counts));
    const mostCommon = Object.keys(counts).find(key => counts[key] === maxCount);
    
    return mostCommon as T || null;
  }

  /**
   * Simple string hashing for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService(); 