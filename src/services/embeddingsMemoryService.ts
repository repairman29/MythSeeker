// Core interfaces for semantic memory system
export interface SemanticMemory {
  id: string;
  content: string;
  embedding: number[]; // Vector representation
  type: 'character_interaction' | 'world_event' | 'player_action' | 'emotional_moment' | 'relationship_change' | 'story_milestone';
  importance: number; // 1-10, affects retention and retrieval priority
  timestamp: number;
  connections: string[]; // Related memory IDs for narrative threading
  emotionalWeight: number; // -5 to +5, emotional significance
  context: {
    characters: string[]; // NPCs or players involved
    location: string; // Where this happened
    emotions: string[]; // Emotional themes
    themes: string[]; // Narrative themes
    realm: string; // Game realm/setting
    sessionId?: string; // Session context
    campaignId?: string; // Campaign context
  };
  metadata: {
    playerArchetype?: string; // Player behavior pattern
    npcRelationships?: Record<string, number>; // Relationship changes
    worldImpact?: string; // How this affected the world
    narrativeSignificance?: string; // Story importance
  };
}

export interface SemanticQueryOptions {
  limit?: number;
  threshold?: number; // Similarity threshold (0-1)
  timeWeight?: number; // How much to weight recent memories (0-1)
  importanceWeight?: number; // How much to weight important memories (0-1)
  contextFilters?: {
    characters?: string[];
    locations?: string[];
    themes?: string[];
    realm?: string;
    timeRange?: { start: number; end: number };
  };
}

export interface MemoryAnalysis {
  themes: string[];
  emotions: string[];
  characters: string[];
  narrativeArcs: string[];
  playerBehaviorPatterns: string[];
  relationshipDynamics: Record<string, number>;
}

// Enhanced Embeddings Memory Service with OpenAI Integration
// Production-ready embeddings configuration
interface EmbeddingsConfig {
  useOpenAI: boolean;
  openAIModel: string;
  fallbackToLocal: boolean;
  maxRetries: number;
  batchSize: number;
}

const EMBEDDINGS_CONFIG: EmbeddingsConfig = {
  useOpenAI: true,
  openAIModel: 'text-embedding-3-small', // Latest OpenAI model
  fallbackToLocal: true,
  maxRetries: 3,
  batchSize: 20
};

class EnhancedEmbeddingsMemoryService {
  private memories: Map<string, SemanticMemory> = new Map();
  private memoryIndex: Map<string, number[]> = new Map(); // For fast similarity search
  private playerMemories: Map<string, SemanticMemory[]> = new Map();
  private isInitialized = false;
  private openAIApiKey: string | null = null;
  private readonly MAX_MEMORIES_PER_PLAYER = 1000;
  private readonly EMBEDDING_DIMENSION = 384; // Smaller dimension for fallback
  private readonly SIMILARITY_THRESHOLD = 0.75;
  private readonly STORAGE_KEY = 'mythseeker_ai_memories';
  private readonly FIREBASE_STORAGE_KEY = 'ai_memories';

  constructor() {
    console.log('🧠 Initializing Enhanced Embeddings Memory Service...');
  }

  /**
   * Initialize with OpenAI API key for production embeddings
   */
  async initialize(openAIApiKey?: string): Promise<void> {
    if (openAIApiKey) {
      this.openAIApiKey = openAIApiKey;
    }
    
    await this.loadMemoriesFromStorage();
    this.isInitialized = true;
    console.log('🧠 Enhanced Embeddings Memory Service initialized with OpenAI support');
  }

  /**
   * Generate embeddings using OpenAI API (production) or local fallback
   */
  private async generateEmbeddings(text: string): Promise<number[]> {
    if (EMBEDDINGS_CONFIG.useOpenAI && this.openAIApiKey) {
      try {
        return await this.generateOpenAIEmbeddings(text);
      } catch (error) {
        console.warn('OpenAI embeddings failed, falling back to local:', error);
        if (EMBEDDINGS_CONFIG.fallbackToLocal) {
          return this.generateSimpleEmbeddings(text);
        }
        throw error;
      }
    }
    
    return this.generateSimpleEmbeddings(text);
  }

  /**
   * Generate embeddings using OpenAI API for production quality
   */
  private async generateOpenAIEmbeddings(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.substring(0, 8000), // OpenAI token limit
        model: EMBEDDINGS_CONFIG.openAIModel,
        encoding_format: 'float'
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Enhanced memory storage with OpenAI embeddings
   */
  async storeMemory(content: string, options: {
    type: string;
    importance: number;
    timestamp?: number;
    context?: {
      characters?: string[];
      location?: string;
      emotions?: string[];
      themes?: string[];
      realm?: string;
      sessionId?: string;
      campaignId?: string;
    };
  }): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate high-quality embeddings
      const embedding = await this.generateEmbeddings(content);
      
      const memory: SemanticMemory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        embedding,
        type: options.type,
        importance: options.importance,
        timestamp: options.timestamp || Date.now(),
        context: {
          characters: options.context?.characters || [],
          location: options.context?.location || 'unknown',
          emotions: options.context?.emotions || [],
          themes: options.context?.themes || [],
          realm: options.context?.realm || 'universal',
          sessionId: options.context?.sessionId || 'default',
          campaignId: options.context?.campaignId || 'default'
        }
      };

      // Store in memory maps
      this.memories.set(memory.id, memory);
      this.memoryIndex.set(memory.id, embedding);

      // Organize by characters for fast player lookup
      memory.context.characters.forEach(character => {
        if (!this.playerMemories.has(character)) {
          this.playerMemories.set(character, []);
        }
        this.playerMemories.get(character)!.push(memory);
      });

      // Cleanup old memories to maintain performance
      await this.cleanupMemories();
      
      // Persist to storage
      await this.persistToStorage();
      
      console.log(`🧠 Enhanced memory stored with OpenAI embeddings: ${memory.id}`);
    } catch (error) {
      console.error('Failed to store memory with embeddings:', error);
      throw error;
    }
  }

  /**
   * Enhanced semantic similarity search with OpenAI quality
   */
  async retrieveRelevantMemories(
    query: string, 
    options: SemanticQueryOptions = {}
  ): Promise<SemanticMemory[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      limit = 10,
      threshold = 0.75,
      timeWeight = 0.3,
      importanceWeight = 0.4,
      contextFilters
    } = options;

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbeddings(query);
      
      // Get all memories and calculate relevance scores
      const memoriesWithScores = Array.from(this.memories.values())
        .map(memory => ({
          memory,
          score: this.calculateRelevanceScore(memory, queryEmbedding, {
            timeWeight,
            importanceWeight,
            threshold
          })
        }))
        .filter(({ score, memory }) => {
          // Apply threshold filter
          if (score < threshold) return false;
          
          // Apply context filters
          if (contextFilters) {
            if (contextFilters.characters && !contextFilters.characters.some(char => 
              memory.context.characters.includes(char))) return false;
            
            if (contextFilters.locations && !contextFilters.locations.includes(memory.context.location)) return false;
            
            if (contextFilters.themes && !contextFilters.themes.some(theme => 
              memory.context.themes.includes(theme))) return false;
            
            if (contextFilters.realm && memory.context.realm !== contextFilters.realm) return false;
            
            if (contextFilters.timeRange) {
              const { start, end } = contextFilters.timeRange;
              if (memory.timestamp < start || memory.timestamp > end) return false;
            }
          }
          
          return true;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ memory }) => memory);

      console.log(`🔍 Retrieved ${memoriesWithScores.length} relevant memories for: "${query.substring(0, 30)}..."`);
      return memoriesWithScores;
    } catch (error) {
      console.error('❌ Failed to retrieve memories:', error);
      return [];
    }
  }



  /**
   * Store an interaction (player input + AI response) as contextual memories
   */
  async storeInteraction(
    playerId: string,
    playerInput: string,
    aiResponse: string,
    context: Omit<SemanticMemory['context'], 'characters'>,
    analysis?: {
      emotionalTone: string;
      themes: string[];
      significance: number;
      relationshipChanges?: Record<string, number>;
    }
  ): Promise<{ inputMemoryId: string; responseMemoryId: string }> {
    const characters = [playerId];
    const fullContext = { ...context, characters };

    // Store player input memory
    const inputMemoryId = await this.storeMemory(
      `Player (${playerId}) said: "${playerInput}"`,
      'player_action',
      fullContext,
      analysis?.significance || 5,
      analysis?.emotionalTone === 'positive' ? 1 : analysis?.emotionalTone === 'negative' ? -1 : 0,
      {
        playerArchetype: this.inferPlayerArchetype(playerInput),
        npcRelationships: analysis?.relationshipChanges
      }
    );

    // Store AI response memory
    const responseMemoryId = await this.storeMemory(
      `AI responded: "${aiResponse}"`,
      'character_interaction',
      fullContext,
      analysis?.significance || 4,
      0,
      {
        narrativeSignificance: analysis?.themes?.join(', ')
      }
    );

    return { inputMemoryId, responseMemoryId };
  }

  /**
   * Get memory statistics for monitoring and optimization
   */
  getMemoryStats(): {
    totalMemories: number;
    memoryTypes: Record<string, number>;
    averageImportance: number;
    oldestMemory: Date;
    newestMemory: Date;
    topThemes: string[];
  } {
    const memories = Array.from(this.memories.values());
    
    const memoryTypes = memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageImportance = memories.length > 0 ? memories.reduce((sum, m) => sum + m.importance, 0) / memories.length : 0;
    
    const timestamps = memories.map(m => m.timestamp);
    const oldestMemory = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date();
    const newestMemory = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();
    
    const allThemes = memories.flatMap(m => m.context.themes);
    const themeCounts = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topThemes = Object.entries(themeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme]) => theme);

    return {
      totalMemories: memories.length,
      memoryTypes,
      averageImportance,
      oldestMemory,
      newestMemory,
      topThemes
    };
  }

  /**
   * Get player-specific memories for universal AI context
   */
  async getPlayerMemories(playerId: string): Promise<SemanticMemory[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const playerMemories = this.playerMemories.get(playerId) || [];
    
    // Sort by importance and recency
    return playerMemories
      .sort((a, b) => {
        const importanceDiff = b.importance - a.importance;
        if (Math.abs(importanceDiff) < 1) {
          return b.timestamp - a.timestamp; // More recent if importance is similar
        }
        return importanceDiff;
      })
      .slice(0, 50); // Return top 50 memories
  }

  /**
   * Get embedding quality analytics
   */
  getEmbeddingAnalytics(): {
    totalMemories: number;
    usingOpenAI: boolean;
    averageSimilarityScore: number;
    memoryDistribution: Record<string, number>;
  } {
    const totalMemories = this.memories.size;
    const memoryTypes = Array.from(this.memories.values()).reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMemories,
      usingOpenAI: EMBEDDINGS_CONFIG.useOpenAI && !!this.openAIApiKey,
      averageSimilarityScore: 0.75, // Placeholder - would calculate from recent queries
      memoryDistribution: memoryTypes
    };
  }

  // ======= PRIVATE HELPER METHODS =======

  /**
   * Calculate relevance score combining semantic similarity, importance, and recency
   */
  private calculateRelevanceScore(
    memory: SemanticMemory,
    queryEmbedding: number[],
    weights: { timeWeight: number; importanceWeight: number; threshold: number }
  ): number {
    // Semantic similarity (primary factor)
    const semanticScore = this.cosineSimilarity(memory.embedding, queryEmbedding);
    
    // Importance score (normalized 0-1)
    const importanceScore = memory.importance / 10;
    
    // Recency score (more recent = higher score)
    const daysSinceCreation = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceCreation / 30); // 30-day decay
    
    // Emotional significance bonus
    const emotionalBonus = Math.abs(memory.emotionalWeight) / 10; // 0-0.5 bonus
    
    // Combine scores with weights
    const combinedScore = 
      semanticScore * (1 - weights.timeWeight - weights.importanceWeight) +
      recencyScore * weights.timeWeight +
      importanceScore * weights.importanceWeight +
      emotionalBonus;

    return combinedScore;
  }

  private async loadMemoriesFromStorage(): Promise<void> {
    try {
      // Load from localStorage first (immediate)
      const localData = localStorage.getItem(this.STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        parsed.memories?.forEach((memory: any) => {
          this.memories.set(memory.id, memory);
          this.memoryIndex.set(memory.id, memory.embedding);
          
          // Organize by characters
          memory.context.characters?.forEach((character: string) => {
            if (!this.playerMemories.has(character)) {
              this.playerMemories.set(character, []);
            }
            this.playerMemories.get(character)!.push(memory);
          });
        });
        console.log(`🧠 Loaded ${this.memories.size} memories from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load memories from storage:', error);
    }
  }

  private async persistToStorage(): Promise<void> {
    try {
      const data = {
        memories: Array.from(this.memories.values()),
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist memories to localStorage:', error);
    }
  }

  private generateSimpleEmbeddings(text: string): number[] {
    // Simple fallback embedding generation
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0);
    
    normalized.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % this.EMBEDDING_DIMENSION] += 1;
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private matchesFilters(memory: SemanticMemory, filters?: any): boolean {
    if (!filters) return true;
    
    if (filters.characters && !filters.characters.some((char: string) => 
      memory.context.characters.includes(char))) {
      return false;
    }
    
    if (filters.realm && memory.context.realm !== filters.realm) {
      return false;
    }
    
    return true;
  }

  private async cleanupMemories(): Promise<void> {
    if (this.memories.size <= this.MAX_MEMORIES_PER_PLAYER) return;
    
    // Sort by importance and timestamp, keep top memories
    const sortedMemories = Array.from(this.memories.values()).sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (Math.abs(importanceDiff) < 1) {
        return b.timestamp - a.timestamp;
      }
      return importanceDiff;
    });
    
    // Keep only the top memories
    const toKeep = sortedMemories.slice(0, this.MAX_MEMORIES_PER_PLAYER);
    const toRemove = sortedMemories.slice(this.MAX_MEMORIES_PER_PLAYER);
    
    // Remove old memories
    toRemove.forEach(memory => {
      this.memories.delete(memory.id);
      this.memoryIndex.delete(memory.id);
    });
    
    // Rebuild player memories map
    this.playerMemories.clear();
    toKeep.forEach(memory => {
      memory.context.characters.forEach(character => {
        if (!this.playerMemories.has(character)) {
          this.playerMemories.set(character, []);
        }
        this.playerMemories.get(character)!.push(memory);
      });
    });
    
    console.log(`🧹 Cleaned up memories: kept ${toKeep.length}, removed ${toRemove.length}`);
  }

  /**
   * Infer player archetype from input text
   */
  private inferPlayerArchetype(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (/attack|fight|battle|kill|destroy/i.test(lowerInput)) return 'warrior';
    if (/sneak|hide|steal|pickpocket|backstab/i.test(lowerInput)) return 'rogue';
    if (/talk|convince|persuade|negotiate|diplomacy/i.test(lowerInput)) return 'diplomat';
    if (/cast|spell|magic|enchant/i.test(lowerInput)) return 'mage';
    if (/explore|search|investigate|examine/i.test(lowerInput)) return 'explorer';
    if (/help|heal|protect|save|aid/i.test(lowerInput)) return 'helper';
    
    return 'balanced';
  }
}

// Export singleton instance
export const embeddingsMemoryService = new EnhancedEmbeddingsMemoryService(); 