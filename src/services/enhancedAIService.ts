import { aiService } from './aiService';
import { embeddingsMemoryService, SemanticMemory } from './embeddingsMemoryService';
import { sentientAI } from './sentientAIService';
import { firestoreAIContextService } from './firestoreAIContextService';

// Production-ready AI configuration
interface ProductionAIConfig {
  useOpenAIEmbeddings: boolean;
  enableCaching: boolean;
  maxContextWindow: number;
  performanceThreshold: number;
  enableAnalytics: boolean;
}

const AI_CONFIG: ProductionAIConfig = {
  useOpenAIEmbeddings: true,
  enableCaching: true,
  maxContextWindow: 32000,
  performanceThreshold: 2000, // 2 seconds
  enableAnalytics: true
};

// Performance analytics
interface AIPerformanceMetrics {
  responseTime: number;
  confidenceScore: number;
  contextTokens: number;
  memoryRetrievalTime: number;
  cacheHitRate: number;
}

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
  private contextCache: Map<string, { context: any; timestamp: number }> = new Map();
  private responseCache: Map<string, { response: any; timestamp: number }> = new Map();
  private performanceMetrics: AIPerformanceMetrics[] = [];
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly CONTEXT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor() {
    console.log('🚀 Initializing Enhanced AI Service with advanced framework...');
  }

  /**
   * Enhanced caching system for production performance
   */
  private async getCachedResponse(cacheKey: string): Promise<any | null> {
    if (!AI_CONFIG.enableCaching) return null;
    
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🚀 Enhanced AI: Cache hit for response');
      return cached.response;
    }
    return null;
  }

  private setCachedResponse(cacheKey: string, response: any): void {
    if (!AI_CONFIG.enableCaching) return;
    
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    this.cleanCache();
  }

  private async getCachedContext(contextKey: string): Promise<any | null> {
    if (!AI_CONFIG.enableCaching) return null;
    
    const cached = this.contextCache.get(contextKey);
    if (cached && Date.now() - cached.timestamp < this.CONTEXT_CACHE_DURATION) {
      console.log('🧠 Enhanced AI: Cache hit for context');
      return cached.context;
    }
    return null;
  }

  private setCachedContext(contextKey: string, context: any): void {
    if (!AI_CONFIG.enableCaching) return;
    
    this.contextCache.set(contextKey, {
      context,
      timestamp: Date.now()
    });
  }

  private cleanCache(): void {
    const now = Date.now();
    
    // Clean response cache
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.responseCache.delete(key);
      }
    }
    
    // Clean context cache
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp > this.CONTEXT_CACHE_DURATION) {
        this.contextCache.delete(key);
      }
    }
  }

  /**
   * Performance monitoring and analytics
   */
  private recordPerformanceMetrics(metrics: AIPerformanceMetrics): void {
    if (!AI_CONFIG.enableAnalytics) return;
    
    this.performanceMetrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
    
    // Log slow responses
    if (metrics.responseTime > AI_CONFIG.performanceThreshold) {
      console.warn(`⚠️ Enhanced AI: Slow response detected (${metrics.responseTime}ms)`);
    }
  }

  /**
   * Get performance analytics for optimization
   */
  getPerformanceAnalytics(): {
    averageResponseTime: number;
    averageConfidence: number;
    cacheHitRate: number;
    slowResponseRate: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        averageConfidence: 0,
        cacheHitRate: 0,
        slowResponseRate: 0
      };
    }

    const totalMetrics = this.performanceMetrics.length;
    const avgResponseTime = this.performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalMetrics;
    const avgConfidence = this.performanceMetrics.reduce((sum, m) => sum + m.confidenceScore, 0) / totalMetrics;
    const avgCacheHitRate = this.performanceMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / totalMetrics;
    const slowResponses = this.performanceMetrics.filter(m => m.responseTime > AI_CONFIG.performanceThreshold).length;

    return {
      averageResponseTime: Math.round(avgResponseTime),
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      cacheHitRate: Math.round(avgCacheHitRate * 100) / 100,
      slowResponseRate: Math.round((slowResponses / totalMetrics) * 100) / 100
    };
  }

  /**
   * Generate context-aware response using Firestore + Enhanced AI (spec implementation)
   */
  async generateFirestoreContextAwareResponse(
    playerId: string,
    npcId: string,
    playerInput: string,
    campaignId: string
  ): Promise<RichAIResponse> {
    console.log('🏛️ Enhanced AI: Using Firestore context service...');

    try {
      // Get comprehensive context from Firestore
      const firestoreContext = await firestoreAIContextService.getContextForNPCInteraction(
        playerId,
        npcId,
        playerInput,
        campaignId
      );

      // Generate AI response using Firestore context
      const aiResponse = await this.generateWithModelOrchestration(
        this.buildRichContextFromFirestore(firestoreContext),
        {
          content: playerInput,
          playerId,
          gameContext: {
            realm: firestoreContext.gameContext.weatherConditions,
            location: firestoreContext.playerContext.lastKnownLocation,
            session: firestoreContext.gameContext,
            worldState: firestoreContext.gameContext
          },
          playerContext: {
            name: firestoreContext.playerContext.playerId,
            characterClass: firestoreContext.playerContext.playerArchetype,
            experience: 'intermediate',
            preferences: firestoreContext.playerContext.preferences
          }
        }
      );

      // Record interaction in Firestore
      await firestoreAIContextService.recordAIInteraction(
        playerId,
        npcId,
        playerInput,
        aiResponse.content,
        firestoreContext
      );

      // Store interaction in semantic memory
      await embeddingsMemoryService.storeInteraction(
        playerId,
        playerInput,
        aiResponse.content,
        {
          location: firestoreContext.playerContext.lastKnownLocation,
          emotions: [firestoreContext.npcContext.emotionalState],
          themes: firestoreContext.npcContext.personalityTraits,
          realm: firestoreContext.gameContext.weatherConditions
        },
        {
          emotionalTone: firestoreContext.npcContext.emotionalState,
          themes: firestoreContext.npcContext.personalityTraits,
          significance: 7
        }
      );

      return {
        response: aiResponse.content,
        worldStateUpdates: aiResponse.worldChanges || {},
        characterDevelopment: aiResponse.characterGrowth || {},
        proactiveInsights: [`Firestore context includes ${firestoreContext.relevantLore.length} lore entries`],
        memoryReferences: firestoreContext.semanticMemories.map(m => m.content.substring(0, 50)),
        confidenceScore: aiResponse.confidence || 0.85,
        emotionalTone: firestoreContext.npcContext.emotionalState,
        narrativeSignificance: 8
      };
    } catch (error) {
      console.error('❌ Firestore context AI failed:', error);
      // Fallback to standard enhanced AI
      return this.generateContextAwareResponse({
        content: playerInput,
        playerId,
        gameContext: {
          realm: 'fantasy',
          location: 'unknown',
          session: { id: campaignId },
          worldState: {}
        },
        playerContext: {
          name: playerId,
          characterClass: 'adventurer',
          experience: 'intermediate',
          preferences: []
        }
      });
    }
  }

  /**
   * Generate context-aware response using the full advanced AI framework
   */
  async generateContextAwareResponse(input: AdvancedAIInput): Promise<RichAIResponse> {
    const startTime = Date.now();
    console.log('🧠 Enhanced AI: Generating context-aware response...');

    try {
      // Generate cache keys
      const responseKey = this.generateCacheKey(input.content, input.playerId, input.gameContext.realm);
      const contextKey = this.generateContextCacheKey(input.playerId, input.gameContext.realm);

      // Check for cached response first
      const cachedResponse = await this.getCachedResponse(responseKey);
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        this.recordPerformanceMetrics({
          responseTime,
          confidenceScore: cachedResponse.confidenceScore || 0.9,
          contextTokens: 0,
          memoryRetrievalTime: 0,
          cacheHitRate: 1.0
        });
        return cachedResponse;
      }

      // 1. Analyze input for context clues
      const contextAnalysis = await this.analyzeInputContext(input);
      
      // 2. Retrieve semantic memories with performance tracking
      const memoryStartTime = Date.now();
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
      const memoryRetrievalTime = Date.now() - memoryStartTime;
      
      // 3. Check cached context
      let richContext = await this.getCachedContext(contextKey);
      if (!richContext) {
        // Build rich context
        richContext = await this.buildRichContext({
          input,
          memories: relevantMemories,
          contextAnalysis,
          gameState: input.gameContext,
          playerProfile: input.playerContext
        });
        this.setCachedContext(contextKey, richContext);
      }
      
      // 4. Generate response with optimal model selection
      const response = await this.generateWithModelOrchestration(richContext, input);
      
      // 5. Store new memories from this interaction
      await this.storeInteractionMemories(input, {
        response: response.content,
        worldStateUpdates: response.worldChanges || {},
        characterDevelopment: response.characterGrowth || {},
        proactiveInsights: [],
        memoryReferences: [],
        confidenceScore: response.confidence || 0.8,
        emotionalTone: contextAnalysis.emotionalTone || 'neutral',
        narrativeSignificance: contextAnalysis.significance || 5
      }, contextAnalysis);
      
      // 6. Generate proactive insights
      const proactiveInsights = await this.generateProactiveInsights(richContext);
      
      const finalResponse: RichAIResponse = {
        response: response.content,
        worldStateUpdates: response.worldChanges || {},
        characterDevelopment: response.characterGrowth || {},
        proactiveInsights,
        memoryReferences: relevantMemories.map(m => m.content),
        confidenceScore: response.confidence || 0.8,
        emotionalTone: contextAnalysis.emotionalTone || 'neutral',
        narrativeSignificance: contextAnalysis.significance || 5
      };

      // Cache the response
      this.setCachedResponse(responseKey, finalResponse);

      // Record performance metrics
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetrics({
        responseTime,
        confidenceScore: finalResponse.confidenceScore,
        contextTokens: JSON.stringify(richContext).length,
        memoryRetrievalTime,
        cacheHitRate: 0.0 // New response
      });

      return finalResponse;
    } catch (error) {
      console.error('❌ Enhanced AI: generateContextAwareResponse failed:', error);
      
      // Record error metrics
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetrics({
        responseTime,
        confidenceScore: 0.0,
        contextTokens: 0,
        memoryRetrievalTime: 0,
        cacheHitRate: 0.0
      });
      
      throw error;
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
          richContext: richContext,
          session: input.gameContext.session,
          playerName: input.playerContext.name
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

  /**
   * Build rich context from Firestore data
   */
  private buildRichContextFromFirestore(firestoreContext: any): RichContext {
    return {
      immediate: {
        lastPlayerAction: 'recent interaction',
        aiResponse: '',
        currentEmotionalTone: firestoreContext.npcContext.emotionalState,
        activeNPCs: [firestoreContext.npcContext]
      },
      session: {
        objectives: firestoreContext.gameContext.activeQuests.map((q: any) => q.id),
        narrativeArcs: [],
        worldEvents: firestoreContext.gameContext.globalEvents,
        playerChoices: [],
        config: {}
      },
      character: {
        playerArchetype: firestoreContext.playerContext.playerArchetype,
        relationshipDynamics: [],
        emotionalJourney: [],
        characterGrowth: []
      },
      world: {
        currentLocation: {
          name: firestoreContext.playerContext.lastKnownLocation,
          description: 'Current game location'
        },
        weatherAndTime: {
          weather: firestoreContext.gameContext.weatherConditions,
          timeOfDay: firestoreContext.gameContext.timeOfDay
        },
        activeQuests: firestoreContext.gameContext.activeQuests,
        npcs: [firestoreContext.npcContext],
        worldState: firestoreContext.gameContext
      },
      semantic: {
        relevantMemories: firestoreContext.semanticMemories,
        thematicConnections: firestoreContext.npcContext.personalityTraits,
        emotionalResonance: [firestoreContext.npcContext.emotionalState],
        narrativeParallels: firestoreContext.relevantLore.map((l: any) => l.topic)
      }
    };
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

  /**
   * Generate cache keys for efficient lookup
   */
  private generateCacheKey(content: string, playerId: string, realm: string): string {
    // Use content hash + player + realm for cache key
    const contentHash = this.simpleHash(content);
    return `resp_${contentHash}_${playerId}_${realm}`;
  }

  private generateContextCacheKey(playerId: string, realm: string): string {
    return `ctx_${playerId}_${realm}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cross-Application AI Sharing & Universal Context
   */

  /**
   * Get universal player profile that works across all game modes
   */
  async getUniversalPlayerProfile(playerId: string): Promise<any> {
    try {
      // Gather profile data from all sources
      const [firestoreProfile, localMemories, sentientData] = await Promise.all([
        this.getFirestorePlayerProfile(playerId),
        embeddingsMemoryService.getPlayerMemories(playerId),
        this.getSentientPlayerData(playerId)
      ]);

      // Merge into universal profile
      const universalProfile = {
        playerId,
        preferences: firestoreProfile?.preferences || [],
        archetype: this.determinePlayerArchetype(localMemories, sentientData),
        emotionalProfile: this.buildEmotionalProfile(localMemories),
        relationship_history: firestoreProfile?.relationships || {},
        gameplay_patterns: this.analyzeGameplayPatterns(localMemories),
        cross_campaign_data: {
          total_sessions: localMemories.length,
          favorite_themes: this.extractFavoriteThemes(localMemories),
          preferred_difficulty: this.calculatePreferredDifficulty(localMemories),
          social_tendencies: this.analyzeSocialTendencies(localMemories)
        },
        last_updated: Date.now()
      };

      // Cache for cross-component access
      this.setCachedContext(`universal_profile_${playerId}`, universalProfile);
      
      return universalProfile;
    } catch (error) {
      console.error('Error building universal player profile:', error);
      return { playerId, archetype: 'balanced', preferences: [] };
    }
  }

  /**
   * Share AI context between different game components
   */
  async shareAIContextBetweenModes(
    sourceMode: string,
    targetMode: string,
    playerId: string,
    contextData: any
  ): Promise<void> {
    console.log(`🔄 Enhanced AI: Sharing context from ${sourceMode} to ${targetMode}`);

    try {
      // Store in embeddings memory for semantic retrieval
      await embeddingsMemoryService.storeMemory(
        `Context transition from ${sourceMode} to ${targetMode}: ${JSON.stringify(contextData)}`,
        {
          type: 'context_transition',
          importance: 7,
          timestamp: Date.now(),
          context: {
            characters: [playerId],
            realm: contextData.realm || 'universal',
            emotions: [contextData.emotionalTone || 'neutral'],
            themes: [`${sourceMode}_to_${targetMode}_transition`],
            sourceMode,
            targetMode
          }
        }
      );

      // Update Firestore for persistence
      if (contextData.npcInteractions) {
        await firestoreAIContextService.updatePlayerProfile(playerId, {
          lastTransition: {
            from: sourceMode,
            to: targetMode,
            timestamp: Date.now(),
            contextData: contextData
          }
        });
      }

      // Update sentient AI memory
      if (contextData.relationships) {
        await sentientAI.updateCrossContextRelationships(playerId, contextData.relationships);
      }

      console.log('✅ Enhanced AI: Context successfully shared between modes');
    } catch (error) {
      console.error('❌ Enhanced AI: Failed to share context between modes:', error);
    }
  }

  /**
   * Get AI recommendations for optimal experience across components
   */
  async getAIRecommendationsForComponent(
    component: string,
    playerId: string,
    currentContext: any
  ): Promise<{
    recommended_npcs: string[];
    suggested_storylines: string[];
    optimal_difficulty: number;
    recommended_themes: string[];
    ai_insights: string[];
  }> {
    try {
      const universalProfile = await this.getUniversalPlayerProfile(playerId);
      
      const recommendations = {
        recommended_npcs: this.recommendNPCsForComponent(component, universalProfile),
        suggested_storylines: this.recommendStorylinesForComponent(component, universalProfile),
        optimal_difficulty: this.calculateOptimalDifficulty(universalProfile, currentContext),
        recommended_themes: this.recommendThemesForComponent(component, universalProfile),
        ai_insights: this.generateComponentAIInsights(component, universalProfile, currentContext)
      };

      console.log(`🎯 Enhanced AI: Generated recommendations for ${component}`, recommendations);
      return recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return {
        recommended_npcs: [],
        suggested_storylines: [],
        optimal_difficulty: 5,
        recommended_themes: [],
        ai_insights: []
      };
    }
  }

  // Helper methods for universal AI features
  private async getFirestorePlayerProfile(playerId: string): Promise<any> {
    try {
      return await firestoreAIContextService.getPlayerProfile(playerId);
    } catch (error) {
      return null;
    }
  }

  private async getSentientPlayerData(playerId: string): Promise<any> {
    try {
      return sentientAI.getPlayerPersonality(playerId);
    } catch (error) {
      return null;
    }
  }

  private determinePlayerArchetype(memories: any[], sentientData: any): string {
    // Analyze patterns to determine archetype
    const archetypes = ['explorer', 'warrior', 'diplomat', 'trickster', 'scholar', 'leader'];
    
    if (sentientData?.archetype) {
      return sentientData.archetype;
    }

    // Analyze memories for patterns
    const combatActions = memories.filter(m => m.content.includes('combat') || m.content.includes('fight')).length;
    const socialActions = memories.filter(m => m.content.includes('talk') || m.content.includes('convince')).length;
    const explorationActions = memories.filter(m => m.content.includes('explore') || m.content.includes('search')).length;

    if (combatActions > socialActions && combatActions > explorationActions) return 'warrior';
    if (socialActions > combatActions && socialActions > explorationActions) return 'diplomat';
    if (explorationActions > combatActions && explorationActions > socialActions) return 'explorer';
    
    return 'balanced';
  }

  private buildEmotionalProfile(memories: any[]): any {
    const emotions = {
      joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, trust: 0
    };

    memories.forEach(memory => {
      if (memory.context?.emotions) {
        memory.context.emotions.forEach((emotion: string) => {
          if (emotions.hasOwnProperty(emotion)) {
            emotions[emotion as keyof typeof emotions]++;
          }
        });
      }
    });

    return emotions;
  }

  private analyzeGameplayPatterns(memories: any[]): any {
    return {
      session_length_preference: 'medium',
      interaction_frequency: memories.length > 50 ? 'high' : memories.length > 20 ? 'medium' : 'low',
      complexity_preference: 'adaptive',
      social_vs_solo: 'balanced'
    };
  }

  private extractFavoriteThemes(memories: any[]): string[] {
    const themes = new Map<string, number>();
    
    memories.forEach(memory => {
      if (memory.context?.themes) {
        memory.context.themes.forEach((theme: string) => {
          themes.set(theme, (themes.get(theme) || 0) + 1);
        });
      }
    });

    return Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme]) => theme);
  }

  private calculatePreferredDifficulty(memories: any[]): number {
    // Analyze success/failure patterns to determine preferred difficulty
    const successfulActions = memories.filter(m => 
      m.content.includes('success') || m.content.includes('achieve')
    ).length;
    
    const totalActions = memories.length;
    const successRate = totalActions > 0 ? successfulActions / totalActions : 0.5;

    // Prefer difficulty that gives 60-70% success rate
    if (successRate > 0.8) return 7; // Increase difficulty
    if (successRate < 0.4) return 3; // Decrease difficulty
    return 5; // Balanced
  }

  private analyzeSocialTendencies(memories: any[]): string {
    const socialMemories = memories.filter(m => 
      m.type === 'character_interaction' || m.content.includes('talk') || m.content.includes('npc')
    ).length;
    
    const totalMemories = memories.length;
    const socialRatio = totalMemories > 0 ? socialMemories / totalMemories : 0.5;

    if (socialRatio > 0.6) return 'highly_social';
    if (socialRatio < 0.3) return 'prefers_solo';
    return 'balanced_social';
  }

  private recommendNPCsForComponent(component: string, profile: any): string[] {
    const { archetype, emotionalProfile, relationship_history } = profile;
    
    // Component-specific NPC recommendations
    const npcRecommendations = {
      'automated-games': ['Ghost', 'Sage', 'Warrior', 'Merchant'],
      'campaigns': ['Innkeeper', 'Village Elder', 'Quest Giver', 'Rival'],
      'combat': ['Combat Instructor', 'Healer', 'Strategist'],
      'exploration': ['Guide', 'Scholar', 'Scout', 'Cartographer']
    };

    let baseNPCs = npcRecommendations[component as keyof typeof npcRecommendations] || [];
    
    // Customize based on archetype
    if (archetype === 'scholar') baseNPCs = ['Sage', 'Scholar', 'Librarian', ...baseNPCs];
    if (archetype === 'warrior') baseNPCs = ['Combat Instructor', 'Warrior', 'Blacksmith', ...baseNPCs];
    if (archetype === 'diplomat') baseNPCs = ['Ambassador', 'Merchant', 'Noble', ...baseNPCs];

    return [...new Set(baseNPCs)].slice(0, 4);
  }

  private recommendStorylinesForComponent(component: string, profile: any): string[] {
    const { archetype, cross_campaign_data } = profile;
    const favoriteThemes = cross_campaign_data?.favorite_themes || [];
    
    const storylineRecommendations = [];
    
    // Add archetype-specific storylines
    if (archetype === 'explorer') {
      storylineRecommendations.push('Ancient ruins discovery', 'Uncharted territory mapping');
    }
    if (archetype === 'diplomat') {
      storylineRecommendations.push('Political intrigue', 'Peace negotiations');
    }
    if (archetype === 'warrior') {
      storylineRecommendations.push('Epic battles', 'Tournament competition');
    }

    // Add theme-based storylines
    favoriteThemes.forEach(theme => {
      if (theme.includes('mystery')) storylineRecommendations.push('Mystery investigation');
      if (theme.includes('magic')) storylineRecommendations.push('Magical artifact quest');
      if (theme.includes('horror')) storylineRecommendations.push('Supernatural encounters');
    });

    return [...new Set(storylineRecommendations)].slice(0, 3);
  }

  private calculateOptimalDifficulty(profile: any, currentContext: any): number {
    const baseDifficulty = profile.cross_campaign_data?.preferred_difficulty || 5;
    
    // Adjust based on current context
    if (currentContext?.recentFailures > 2) return Math.max(1, baseDifficulty - 1);
    if (currentContext?.recentSuccesses > 3) return Math.min(10, baseDifficulty + 1);
    
    return baseDifficulty;
  }

  private recommendThemesForComponent(component: string, profile: any): string[] {
    const favoriteThemes = profile.cross_campaign_data?.favorite_themes || [];
    const archetype = profile.archetype;
    
    const themeRecommendations = [...favoriteThemes];
    
    // Add archetype-specific themes
    if (archetype === 'scholar') themeRecommendations.push('ancient_lore', 'magical_research');
    if (archetype === 'warrior') themeRecommendations.push('epic_battles', 'heroic_deeds');
    if (archetype === 'diplomat') themeRecommendations.push('political_intrigue', 'social_dynamics');
    if (archetype === 'explorer') themeRecommendations.push('discovery', 'adventure');

    return [...new Set(themeRecommendations)].slice(0, 4);
  }

  private generateComponentAIInsights(component: string, profile: any, currentContext: any): string[] {
    const insights = [];
    
    // General insights based on profile
    if (profile.cross_campaign_data?.social_tendencies === 'highly_social') {
      insights.push('Player enjoys character interactions - emphasize NPC dialogue');
    }
    
    if (profile.archetype === 'explorer') {
      insights.push('Player loves discovery - include hidden secrets and exploration rewards');
    }
    
    // Component-specific insights
    if (component === 'combat' && profile.cross_campaign_data?.preferred_difficulty > 7) {
      insights.push('Player prefers challenging combat - use advanced tactics');
    }
    
    if (component === 'campaigns' && profile.emotionalProfile?.trust > 5) {
      insights.push('Player forms strong NPC relationships - develop long-term character arcs');
    }

    // Context-specific insights
    if (currentContext?.timeSinceLastPlay > 7 * 24 * 60 * 60 * 1000) { // 7 days
      insights.push('Player returning after break - provide gentle reintroduction to story');
    }

    return insights.slice(0, 3);
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService(); 