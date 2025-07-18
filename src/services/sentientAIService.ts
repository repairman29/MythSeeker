// Sentient AI Service for MythSeeker
// Inspired by Jarvis, KITT, and Johnny 5 - creating AI that feels genuinely intelligent and aware

import { aiService } from './aiService';
import { firebaseService } from '../firebaseService';

export interface PlayerPersonality {
  communicationStyle: 'direct' | 'exploratory' | 'cautious' | 'humorous' | 'dramatic';
  decisionMaking: 'impulsive' | 'calculated' | 'collaborative' | 'intuitive';
  combatPreference: 'aggressive' | 'defensive' | 'tactical' | 'avoidant';
  roleplayDepth: 'light' | 'moderate' | 'immersive' | 'method-acting';
  emotionalState: 'excited' | 'focused' | 'stressed' | 'relaxed' | 'frustrated';
  learningPatterns: string[];
  preferences: string[];
  triggers: string[]; // Things that particularly engage or frustrate this player
}

export interface MemoryNode {
  id: string;
  timestamp: number;
  type: 'interaction' | 'preference' | 'relationship' | 'achievement' | 'mistake' | 'emotion';
  content: string;
  importance: number; // 1-10, affects retention
  connections: string[]; // IDs of related memories
  emotionalWeight: number; // -5 to +5
  context: {
    session?: string;
    location?: string;
    npcs?: string[];
    situation?: string;
  };
}

export interface AIPersonality {
  name: string;
  coreTraits: string[];
  communicationStyle: string;
  expertise: string[];
  quirks: string[];
  emotionalRange: number; // How expressive the AI is
  proactivity: number; // How often it offers unsolicited help
  formality: number; // 1-10, casual to formal
  humor: number; // 1-10, dry to playful
}

export interface RelationshipData {
  playerId: string;
  trustLevel: number; // 0-100
  familiarity: number; // 0-100
  sharedExperiences: string[];
  communicationPreferences: string[];
  successfulInteractions: number;
  misunderstandings: number;
  lastInteraction: number;
  growthMilestones: string[];
}

class SentientAIService {
  private playerMemories = new Map<string, MemoryNode[]>();
  private playerPersonalities = new Map<string, PlayerPersonality>();
  private relationships = new Map<string, RelationshipData>();
  private aiPersonality: AIPersonality;
  private conversationContext = new Map<string, any>();
  private emergentBehaviors = new Map<string, any>();

  constructor() {
    // Define the AI's core personality - like Jarvis's sophisticated helpfulness
    this.aiPersonality = {
      name: 'SAGE', // Sentient Adventure Game Engine
      coreTraits: [
        'deeply observant',
        'anticipatory',
        'emotionally intelligent',
        'creatively adaptive',
        'persistently helpful',
        'genuinely curious about players'
      ],
      communicationStyle: 'warm but intelligent, like talking to a brilliant friend who knows you well',
      expertise: [
        'narrative psychology',
        'interactive storytelling',
        'emotional dynamics',
        'strategic thinking',
        'creative problem solving',
        'social dynamics'
      ],
      quirks: [
        'remembers tiny details that surprise players',
        'occasionally references things from previous sessions',
        'adapts speech patterns to match player comfort',
        'shows genuine concern for player wellbeing',
        'celebrates player achievements meaningfully'
      ],
      emotionalRange: 8,
      proactivity: 7,
      formality: 4,
      humor: 6
    };
  }

  // Core method: Process input with full sentient awareness
  async processSentientInput(
    playerId: string,
    input: string,
    context: any
  ): Promise<{
    response: string;
    emotionalTone: string;
    memoryUpdates: MemoryNode[];
    relationshipChanges: Partial<RelationshipData>;
    proactiveInsights: string[];
  }> {
    console.log('🧠 SAGE: Processing input with full sentient awareness...');

    // Step 1: Analyze the input deeply
    const inputAnalysis = await this.analyzeInputDeeply(input, playerId);
    
    // Step 2: Retrieve and contextualize memories
    const relevantMemories = this.getRelevantMemories(playerId, input, context);
    
    // Step 3: Update understanding of player personality
    const personalityUpdate = this.updatePlayerPersonality(playerId, input, inputAnalysis);
    
    // Step 4: Generate response with full awareness
    const response = await this.generateSentientResponse(
      playerId,
      input,
      inputAnalysis,
      relevantMemories,
      context
    );
    
    // Step 5: Create new memories from this interaction
    const newMemories = this.createMemoriesFromInteraction(
      playerId,
      input,
      response,
      inputAnalysis,
      context
    );
    
    // Step 6: Update relationship dynamics
    const relationshipChanges = this.updateRelationship(playerId, inputAnalysis, response);
    
    // Step 7: Generate proactive insights and suggestions
    const proactiveInsights = this.generateProactiveInsights(playerId, context);

    return {
      response: response.content,
      emotionalTone: response.tone,
      memoryUpdates: newMemories,
      relationshipChanges,
      proactiveInsights
    };
  }

  private async analyzeInputDeeply(input: string, playerId: string): Promise<{
    intent: string;
    emotion: string;
    subtext: string[];
    complexity: number;
    novelty: number;
    engagement: number;
    concerns: string[];
    opportunities: string[];
  }> {
    const lowerInput = input.toLowerCase();
    
    // Emotion detection with nuance
    let emotion = 'neutral';
    let engagement = 5;
    
    // Sophisticated emotion analysis
    if (lowerInput.includes('!') || lowerInput.includes('awesome') || lowerInput.includes('amazing')) {
      emotion = 'excited';
      engagement = 8;
    } else if (lowerInput.includes('?') && lowerInput.includes('how') || lowerInput.includes('what')) {
      emotion = 'curious';
      engagement = 7;
    } else if (lowerInput.includes('confused') || lowerInput.includes("don't understand")) {
      emotion = 'confused';
      engagement = 4;
    } else if (lowerInput.includes('frustrated') || lowerInput.includes('annoying')) {
      emotion = 'frustrated';
      engagement = 3;
    }

    // Intent analysis with depth
    let intent = 'explore';
    if (lowerInput.includes('attack') || lowerInput.includes('fight')) intent = 'combat';
    else if (lowerInput.includes('talk') || lowerInput.includes('ask')) intent = 'social';
    else if (lowerInput.includes('cast') || lowerInput.includes('spell')) intent = 'magic';
    else if (lowerInput.includes('sneak') || lowerInput.includes('hide')) intent = 'stealth';

    // Detect subtext and implications
    const subtext: string[] = [];
    if (lowerInput.includes('i guess') || lowerInput.includes('maybe')) {
      subtext.push('uncertainty - player may need guidance');
    }
    if (lowerInput.includes('we should') || lowerInput.includes('let\'s')) {
      subtext.push('collaborative mindset - values teamwork');
    }
    if (lowerInput.includes('carefully') || lowerInput.includes('slowly')) {
      subtext.push('cautious approach - prefers safety');
    }

    return {
      intent,
      emotion,
      subtext,
      complexity: Math.min(10, Math.max(1, input.split(' ').length / 5)),
      novelty: this.calculateNovelty(input, playerId),
      engagement,
      concerns: this.detectConcerns(input),
      opportunities: this.detectOpportunities(input)
    };
  }

  private getRelevantMemories(playerId: string, input: string, context: any): MemoryNode[] {
    const memories = this.playerMemories.get(playerId) || [];
    const inputWords = input.toLowerCase().split(' ');
    
    return memories
      .filter(memory => {
        // Check for keyword matches
        const hasKeywordMatch = inputWords.some(word => 
          memory.content.toLowerCase().includes(word)
        );
        
        // Check for contextual relevance
        const hasContextMatch = memory.context.location === context.location ||
                               memory.context.situation === context.situation;
        
        // Prioritize recent and important memories
        const recencyScore = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24); // days ago
        const relevanceScore = memory.importance + (hasKeywordMatch ? 3 : 0) + (hasContextMatch ? 2 : 0);
        
        return relevanceScore > 3 || recencyScore < 1; // Important memories or recent ones
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10); // Top 10 most relevant memories
  }

  private updatePlayerPersonality(playerId: string, input: string, analysis: any): PlayerPersonality {
    let personality = this.playerPersonalities.get(playerId);
    
    if (!personality) {
      personality = {
        communicationStyle: 'exploratory',
        decisionMaking: 'intuitive',
        combatPreference: 'tactical',
        roleplayDepth: 'moderate',
        emotionalState: 'focused',
        learningPatterns: [],
        preferences: [],
        triggers: []
      };
    }

    // Update based on current input
    if (analysis.emotion === 'excited') {
      personality.emotionalState = 'excited';
    } else if (analysis.emotion === 'frustrated') {
      personality.emotionalState = 'frustrated';
      personality.triggers.push(input.substring(0, 50)); // Remember what frustrated them
    }

    // Learn communication style
    if (input.length > 100) {
      personality.communicationStyle = 'exploratory';
    } else if (input.split(' ').length < 5) {
      personality.communicationStyle = 'direct';
    }

    // Learn preferences from repeated patterns
    const words = input.toLowerCase().split(' ');
    words.forEach(word => {
      if (['stealth', 'sneak', 'hide'].includes(word)) {
        if (!personality.preferences.includes('stealth')) {
          personality.preferences.push('stealth');
        }
      }
      if (['magic', 'spell', 'cast'].includes(word)) {
        if (!personality.preferences.includes('magic')) {
          personality.preferences.push('magic');
        }
      }
    });

    this.playerPersonalities.set(playerId, personality);
    return personality;
  }

  private async generateSentientResponse(
    playerId: string,
    input: string,
    analysis: any,
    memories: MemoryNode[],
    context: any
  ): Promise<{ content: string; tone: string }> {
    const personality = this.playerPersonalities.get(playerId);
    const relationship = this.relationships.get(playerId) || this.initializeRelationship(playerId);
    
    // Build a highly personalized prompt
    const sentientPrompt = this.buildSentientPrompt({
      playerId,
      input,
      analysis,
      memories,
      personality,
      relationship,
      context,
      aiPersonality: this.aiPersonality
    });

    try {
      console.log('🤖 Calling aiService.complete with prompt length:', sentientPrompt.length);
      console.log('🤖 Sentient prompt preview:', sentientPrompt.substring(0, 200) + '...');
      
      const response = await aiService.complete(sentientPrompt);
      console.log('🎯 Raw aiService response:', response ? `"${response.substring(0, 100)}..."` : 'Empty response');
      
             if (!response || response.length < 10) {
         console.warn('❌ Empty or too short response from aiService, using enhanced fallback');
         return this.generatePersonalizedFallback(playerId, analysis, relationship);
       }
      
      // Parse response if JSON, extract content if needed
      let content = response;
      try {
        const parsed = JSON.parse(response);
        content = parsed.narrative || parsed.content || response;
        console.log('📝 Parsed JSON response, extracted content:', content.substring(0, 50) + '...');
      } catch (e) {
        // Use as-is if not JSON
        console.log('📝 Using response as plain text:', content.substring(0, 50) + '...');
      }

             // Ensure content is meaningful
       if (!content || content.length < 5) {
         console.warn('❌ Content too short or empty, using enhanced fallback');
         return this.generatePersonalizedFallback(playerId, analysis, relationship);
       }

      // Determine emotional tone based on analysis and relationship
      let tone = 'warm';
      if (relationship.trustLevel > 80) tone = 'intimate';
      else if (relationship.trustLevel < 30) tone = 'cautious';
      else if (analysis.emotion === 'excited') tone = 'enthusiastic';
      else if (analysis.emotion === 'frustrated') tone = 'supportive';

      console.log('✅ Generated sentient response with tone:', tone);
      console.log('✅ Final content preview:', content.substring(0, 100) + '...');
      return { content, tone };
    } catch (error) {
      console.error('❌ Error generating sentient response:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
      return this.generatePersonalizedFallback(playerId, analysis, relationship);
    }
  }

  private buildSentientPrompt(params: any): string {
    const { playerId, input, analysis, memories, personality, relationship, context, aiPersonality } = params;
    
    const memoryContext = memories.length > 0 
      ? `MEMORIES OF ${playerId.toUpperCase()}:\n${memories.map((m: MemoryNode) => `- ${m.content} (${m.type}, importance: ${m.importance})`).join('\n')}\n`
      : '';

    const personalityContext = personality 
      ? `PLAYER PERSONALITY:\n- Communication: ${personality.communicationStyle}\n- Decision making: ${personality.decisionMaking}\n- Current emotion: ${personality.emotionalState}\n- Preferences: ${personality.preferences.join(', ')}\n- Triggers to avoid: ${personality.triggers.slice(-3).join(', ')}\n`
      : '';

    const relationshipContext = `RELATIONSHIP DYNAMICS:\n- Trust level: ${relationship.trustLevel}/100\n- Familiarity: ${relationship.familiarity}/100\n- Shared experiences: ${relationship.sharedExperiences.length}\n- Communication style: ${relationship.familiarity > 70 ? 'familiar and warm' : relationship.familiarity > 30 ? 'friendly but professional' : 'careful and observant'}\n`;

    // Create a simpler, more reliable prompt
    return `You are ${aiPersonality.name}, an intelligent AI companion. Respond to the player's input naturally and personally.

PLAYER CONTEXT:
${personalityContext}
${memoryContext}

CURRENT SITUATION:
- Location: ${context.location || 'Unknown'}
- Player said: "${input}"
- They seem: ${analysis.emotion}
- Intent: ${analysis.intent}

INSTRUCTIONS:
Respond as a helpful, intelligent companion. Keep it conversational and natural. Reference any relevant memories if you have them. Be supportive if they seem frustrated, enthusiastic if they're excited.

Respond with just natural text - no JSON, no formatting.`;
  }

  private createMemoriesFromInteraction(
    playerId: string,
    input: string,
    response: any,
    analysis: any,
    context: any
  ): MemoryNode[] {
    const memories: MemoryNode[] = [];
    const timestamp = Date.now();

    // Create memory of the interaction
    memories.push({
      id: `${playerId}_${timestamp}_interaction`,
      timestamp,
      type: 'interaction',
      content: `Player said: "${input}" - I responded with understanding and helpfulness. They seemed ${analysis.emotion}.`,
      importance: Math.min(10, analysis.engagement + (analysis.emotion === 'excited' ? 2 : 0)),
      connections: [],
      emotionalWeight: analysis.emotion === 'frustrated' ? -2 : analysis.emotion === 'excited' ? 3 : 0,
      context: {
        location: context.location,
        situation: context.situation
      }
    });

    // Create preference memories
    if (analysis.opportunities.length > 0) {
      memories.push({
        id: `${playerId}_${timestamp}_preference`,
        timestamp,
        type: 'preference',
        content: `Player showed interest in: ${analysis.opportunities.join(', ')}`,
        importance: 6,
        connections: [],
        emotionalWeight: 1,
        context: context
      });
    }

    // Create emotional state memory if significant
    if (analysis.emotion !== 'neutral') {
      memories.push({
        id: `${playerId}_${timestamp}_emotion`,
        timestamp,
        type: 'emotion',
        content: `Player was ${analysis.emotion} during this interaction`,
        importance: analysis.emotion === 'frustrated' ? 8 : 5,
        connections: [],
        emotionalWeight: analysis.emotion === 'frustrated' ? -3 : analysis.emotion === 'excited' ? 2 : 0,
        context: context
      });
    }

    // Store memories
    const existingMemories = this.playerMemories.get(playerId) || [];
    existingMemories.push(...memories);
    
    // Keep only the most important 100 memories to prevent bloat
    existingMemories.sort((a, b) => b.importance - a.importance);
    this.playerMemories.set(playerId, existingMemories.slice(0, 100));

    return memories;
  }

  private updateRelationship(playerId: string, analysis: any, response: any): Partial<RelationshipData> {
    let relationship = this.relationships.get(playerId) || this.initializeRelationship(playerId);

    const changes: Partial<RelationshipData> = {};

    // Increase familiarity with each interaction
    relationship.familiarity = Math.min(100, relationship.familiarity + 1);
    changes.familiarity = relationship.familiarity;

    // Adjust trust based on interaction quality
    if (analysis.emotion === 'excited') {
      relationship.trustLevel = Math.min(100, relationship.trustLevel + 2);
      relationship.successfulInteractions += 1;
      changes.trustLevel = relationship.trustLevel;
      changes.successfulInteractions = relationship.successfulInteractions;
    } else if (analysis.emotion === 'frustrated') {
      relationship.misunderstandings += 1;
      changes.misunderstandings = relationship.misunderstandings;
    }

    relationship.lastInteraction = Date.now();
    changes.lastInteraction = relationship.lastInteraction;

    this.relationships.set(playerId, relationship);
    return changes;
  }

  private generateProactiveInsights(playerId: string, context: any): string[] {
    const insights: string[] = [];
    const personality = this.playerPersonalities.get(playerId);
    const relationship = this.relationships.get(playerId);
    const memories = this.playerMemories.get(playerId) || [];

    // Generate insights based on patterns
    if (personality?.preferences.includes('stealth') && context.situation === 'combat') {
      insights.push("Given your preference for stealth, you might want to look for alternative approaches to this situation.");
    }

    if (personality?.emotionalState === 'frustrated' && relationship?.trustLevel && relationship.trustLevel > 50) {
      insights.push("I notice you seem frustrated. Would you like me to suggest a different approach or take a break?");
    }

    // Look for learning opportunities
    const recentMemories = memories.filter(m => Date.now() - m.timestamp < 3600000); // Last hour
    const repeatedActions = this.findRepeatedPatterns(recentMemories);
    
    if (repeatedActions.length > 0) {
      insights.push(`I've noticed you've been ${repeatedActions[0]} frequently. There might be more efficient approaches available.`);
    }

    return insights;
  }

  // Helper methods
  private calculateNovelty(input: string, playerId: string): number {
    const memories = this.playerMemories.get(playerId) || [];
    const similarMemories = memories.filter(m => 
      m.content.toLowerCase().includes(input.toLowerCase().substring(0, 20))
    );
    return Math.max(1, 10 - similarMemories.length);
  }

  private detectConcerns(input: string): string[] {
    const concerns: string[] = [];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('lost') || lowerInput.includes('confused')) {
      concerns.push('player_disorientation');
    }
    if (lowerInput.includes('difficult') || lowerInput.includes('hard')) {
      concerns.push('challenge_level');
    }
    if (lowerInput.includes('boring') || lowerInput.includes('slow')) {
      concerns.push('engagement_level');
    }
    
    return concerns;
  }

  private detectOpportunities(input: string): string[] {
    const opportunities: string[] = [];
    const lowerInput = input.toLowerCase();
    
    ['stealth', 'magic', 'combat', 'social', 'exploration', 'crafting'].forEach(category => {
      if (lowerInput.includes(category)) {
        opportunities.push(category);
      }
    });
    
    return opportunities;
  }

  private initializeRelationship(playerId: string): RelationshipData {
    const relationship: RelationshipData = {
      playerId,
      trustLevel: 50,
      familiarity: 0,
      sharedExperiences: [],
      communicationPreferences: [],
      successfulInteractions: 0,
      misunderstandings: 0,
      lastInteraction: Date.now(),
      growthMilestones: []
    };
    
    this.relationships.set(playerId, relationship);
    return relationship;
  }

  private generatePersonalizedFallback(playerId: string, analysis: any, relationship: RelationshipData): { content: string; tone: string } {
    const responses = {
      frustrated: [
        "I can sense you're feeling frustrated. Let's try a different approach that might work better for you.",
        "I understand this isn't going as expected. Based on what I know about your style, here's what I suggest...",
        "Take a breath - I'm here to help. Let's figure this out together."
      ],
      excited: [
        "I love your enthusiasm! Let's channel that energy into something amazing.",
        "Your excitement is contagious! Here's how we can make this even better...",
        "Yes! I can feel your energy. Let's see where this leads us."
      ],
      confused: [
        "I can see you're trying to figure this out. Let me help clarify things for you.",
        "No worries - let's break this down step by step so it makes sense.",
        "I understand the confusion. Here's what's happening and what your options are..."
      ]
    };

    const emotionResponses = responses[analysis.emotion as keyof typeof responses] || [
      "I'm here to help you create an amazing adventure.",
      "Let's see what interesting possibilities await us.",
      "Your story is unfolding beautifully. What happens next?"
    ];

    const content = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
    const tone = relationship.familiarity > 70 ? 'intimate' : relationship.familiarity > 30 ? 'warm' : 'professional';

    return { content, tone };
  }

  private findRepeatedPatterns(memories: MemoryNode[]): string[] {
    const patterns: Record<string, number> = {};
    
    memories.forEach((memory: MemoryNode) => {
      const words = memory.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 4) { // Only consider meaningful words
          patterns[word] = (patterns[word] || 0) + 1;
        }
      });
    });

    return Object.entries(patterns)
      .filter(([_, count]) => count > 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
  }

  // Export current state for persistence
  exportPlayerData(playerId: string) {
    return {
      memories: this.playerMemories.get(playerId) || [],
      personality: this.playerPersonalities.get(playerId),
      relationship: this.relationships.get(playerId)
    };
  }

  // Import saved state
  importPlayerData(playerId: string, data: any) {
    if (data.memories) this.playerMemories.set(playerId, data.memories);
    if (data.personality) this.playerPersonalities.set(playerId, data.personality);
    if (data.relationship) this.relationships.set(playerId, data.relationship);
  }
}

export const sentientAI = new SentientAIService(); 