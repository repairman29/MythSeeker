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

/**
 * Advanced Embeddings-Based Memory Service
 * 
 * This service provides semantic memory storage and retrieval for AI characters,
 * enabling context-aware, long-term memory that understands meaning and emotional significance.
 */
export class EmbeddingsMemoryService {
  private memories: Map<string, SemanticMemory> = new Map();
  private embeddingsCache: Map<string, number[]> = new Map();
  private isInitialized = false;
  private readonly MAX_MEMORIES_PER_PLAYER = 1000;
  private readonly EMBEDDING_DIMENSION = 384; // Smaller dimension for fallback

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the embeddings service
   */
  private async initializeService(): Promise<void> {
    try {
      console.log('🧠 Initializing EmbeddingsMemoryService...');
      
      // Load existing memories from localStorage
      await this.loadMemoriesFromStorage();
      
      // Clean up old or low-importance memories
      await this.cleanupMemories();
      
      this.isInitialized = true;
      console.log(`✅ EmbeddingsMemoryService initialized with ${this.memories.size} memories`);
    } catch (error) {
      console.error('❌ Failed to initialize EmbeddingsMemoryService:', error);
      this.isInitialized = true; // Continue with empty state
    }
  }

  /**
   * Store a new memory with semantic embedding
   */
  async storeMemory(
    content: string, 
    type: SemanticMemory['type'],
    context: SemanticMemory['context'],
    importance: number = 5,
    emotionalWeight: number = 0,
    metadata: SemanticMemory['metadata'] = {}
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initializeService();
    }

    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(content);
      
      // Create unique ID
      const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create semantic memory
      const memory: SemanticMemory = {
        id,
        content,
        embedding,
        type,
        importance: Math.max(1, Math.min(10, importance)),
        timestamp: Date.now(),
        connections: [],
        emotionalWeight: Math.max(-5, Math.min(5, emotionalWeight)),
        context,
        metadata
      };

      // Store memory
      this.memories.set(id, memory);

      // Save to persistent storage
      await this.saveMemoriesToStorage();
      
      console.log(`🧠 Stored semantic memory: ${content.substring(0, 50)}... (${type}, importance: ${importance})`);
      return id;
    } catch (error) {
      console.error('❌ Failed to store memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve memories relevant to a query with semantic understanding
   */
  async retrieveRelevantMemories(
    query: string, 
    options: SemanticQueryOptions = {}
  ): Promise<SemanticMemory[]> {
    if (!this.isInitialized) {
      await this.initializeService();
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
      const queryEmbedding = await this.generateEmbedding(query);
      
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

  // ======= PRIVATE HELPER METHODS =======

  /**
   * Generate embedding for text using simple hash-based approach
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // For now, use a simple hash-based embedding
    // In production, this would call OpenAI's embedding API
    return this.generateSimpleEmbedding(text);
  }

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

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Generate simple hash-based embedding for development/fallback
   */
  private generateSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = this.hashString(word);
      const index = Math.abs(hash) % this.EMBEDDING_DIMENSION;
      embedding[index] += 1 / words.length;
    }
    
    return embedding;
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Load memories from localStorage
   */
  private async loadMemoriesFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('mythseeker_semantic_memories');
      if (stored) {
        const memoriesArray: SemanticMemory[] = JSON.parse(stored);
        this.memories.clear();
        memoriesArray.forEach(memory => {
          this.memories.set(memory.id, memory);
        });
        console.log(`📱 Loaded ${memoriesArray.length} memories from localStorage`);
      }
    } catch (error) {
      console.error('❌ Failed to load memories from storage:', error);
    }
  }

  /**
   * Save memories to localStorage
   */
  private async saveMemoriesToStorage(): Promise<void> {
    try {
      const memoriesArray = Array.from(this.memories.values());
      localStorage.setItem('mythseeker_semantic_memories', JSON.stringify(memoriesArray));
    } catch (error) {
      console.error('❌ Failed to save memories to storage:', error);
    }
  }

  /**
   * Clean up old or low-importance memories
   */
  private async cleanupMemories(): Promise<void> {
    const memories = Array.from(this.memories.values());
    
    if (memories.length <= this.MAX_MEMORIES_PER_PLAYER) return;
    
    // Sort by importance and recency, keep the best ones
    const sortedMemories = memories.sort((a, b) => {
      const scoreA = a.importance + (Date.now() - a.timestamp) / (1000 * 60 * 60 * 24) * -0.1;
      const scoreB = b.importance + (Date.now() - b.timestamp) / (1000 * 60 * 60 * 24) * -0.1;
      return scoreB - scoreA;
    });
    
    const toKeep = sortedMemories.slice(0, this.MAX_MEMORIES_PER_PLAYER);
    const toRemove = sortedMemories.slice(this.MAX_MEMORIES_PER_PLAYER);
    
    // Remove old memories
    toRemove.forEach(memory => this.memories.delete(memory.id));
    
    console.log(`🧹 Cleaned up ${toRemove.length} old memories, keeping ${toKeep.length}`);
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
export const embeddingsMemoryService = new EmbeddingsMemoryService(); 