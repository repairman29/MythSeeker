import { NPC, NPCMemory, NPCEmotionalState } from '../components/NPCInteraction';

export interface NPCServiceConfig {
  memoryRetentionDays: number;
  emotionalDecayRate: number;
  maxMemories: number;
  personalityStability: number;
}

export class NPCService {
  private config: NPCServiceConfig;

  constructor(config: Partial<NPCServiceConfig> = {}) {
    this.config = {
      memoryRetentionDays: 30,
      emotionalDecayRate: 0.1, // 10% decay per day
      maxMemories: 50,
      personalityStability: 0.8, // 80% stability
      ...config
    };
  }

  // Create a new NPC with default emotional state and personality
  createNPC(baseData: Partial<NPC>): NPC {
    const defaultEmotionalState: NPCEmotionalState = {
      joy: 0,
      anger: 0,
      fear: 0,
      trust: 0,
      respect: 0,
      currentMood: 'neutral',
      moodIntensity: 5,
      lastMoodChange: new Date(),
      stressLevel: 3,
      confidence: 5
    };

    const defaultPersonalityTraits = {
      openness: Math.floor(Math.random() * 10) + 1,
      conscientiousness: Math.floor(Math.random() * 10) + 1,
      extraversion: Math.floor(Math.random() * 10) + 1,
      agreeableness: Math.floor(Math.random() * 10) + 1,
      neuroticism: Math.floor(Math.random() * 10) + 1
    };

    return {
      id: baseData.id || Date.now().toString(),
      name: baseData.name || 'Unknown NPC',
      title: baseData.title,
      avatar: baseData.avatar,
      type: baseData.type || 'neutral',
      personality: baseData.personality || 'A mysterious individual',
      relationship: baseData.relationship || 0,
      dialogue: baseData.dialogue || [],
      inventory: baseData.inventory || [],
      quests: baseData.quests || [],
      location: baseData.location,
      schedule: baseData.schedule,
      emotionalState: baseData.emotionalState || defaultEmotionalState,
      memories: baseData.memories || [],
      personalityTraits: baseData.personalityTraits || defaultPersonalityTraits,
      background: baseData.background || {
        origin: 'Unknown',
        occupation: 'Unknown',
        goals: [],
        fears: [],
        secrets: []
      },
      interactionHistory: baseData.interactionHistory || []
    };
  }

  // Update NPC emotional state based on interaction
  updateEmotionalState(npc: NPC, emotionalImpact: Partial<NPCEmotionalState>): NPC {
    const updatedEmotionalState = { ...npc.emotionalState };

    // Apply emotional changes
    Object.entries(emotionalImpact).forEach(([emotion, change]) => {
      if (updatedEmotionalState[emotion as keyof NPCEmotionalState] !== undefined) {
        const currentValue = updatedEmotionalState[emotion as keyof NPCEmotionalState] as number;
        updatedEmotionalState[emotion as keyof NPCEmotionalState] = Math.max(-100, Math.min(100, currentValue + change));
      }
    });

    // Calculate new mood based on emotional state
    updatedEmotionalState.currentMood = this.calculateMood(updatedEmotionalState);
    updatedEmotionalState.lastMoodChange = new Date();
    updatedEmotionalState.moodIntensity = this.calculateMoodIntensity(updatedEmotionalState);

    // Update stress and confidence based on emotional state
    updatedEmotionalState.stressLevel = this.calculateStressLevel(updatedEmotionalState);
    updatedEmotionalState.confidence = this.calculateConfidence(updatedEmotionalState);

    return {
      ...npc,
      emotionalState: updatedEmotionalState
    };
  }

  // Add a memory to the NPC
  addMemory(npc: NPC, memory: Omit<NPCMemory, 'id' | 'timestamp'>): NPC {
    const newMemory: NPCMemory = {
      ...memory,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    const updatedMemories = [...npc.memories, newMemory];

    // Limit memories to maxMemories
    if (updatedMemories.length > this.config.maxMemories) {
      updatedMemories.splice(0, updatedMemories.length - this.config.maxMemories);
    }

    return {
      ...npc,
      memories: updatedMemories
    };
  }

  // Process emotional decay over time
  processEmotionalDecay(npc: NPC, daysPassed: number = 1): NPC {
    const decayFactor = Math.pow(1 - this.config.emotionalDecayRate, daysPassed);
    const updatedEmotionalState = { ...npc.emotionalState };

    // Decay emotions towards neutral (0)
    Object.keys(updatedEmotionalState).forEach(key => {
      if (typeof updatedEmotionalState[key as keyof NPCEmotionalState] === 'number') {
        const currentValue = updatedEmotionalState[key as keyof NPCEmotionalState] as number;
        const decayedValue = currentValue * decayFactor;
        updatedEmotionalState[key as keyof NPCEmotionalState] = decayedValue as any;
      }
    });

    // Recalculate mood after decay
    updatedEmotionalState.currentMood = this.calculateMood(updatedEmotionalState);
    updatedEmotionalState.moodIntensity = this.calculateMoodIntensity(updatedEmotionalState);

    return {
      ...npc,
      emotionalState: updatedEmotionalState
    };
  }

  // Clean old memories
  cleanOldMemories(npc: NPC): NPC {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.memoryRetentionDays);

    const filteredMemories = npc.memories.filter(memory => 
      memory.timestamp > cutoffDate
    );

    return {
      ...npc,
      memories: filteredMemories
    };
  }

  // Get NPC's current disposition towards player
  getDisposition(npc: NPC): 'friendly' | 'neutral' | 'hostile' | 'loving' | 'fearful' {
    const { emotionalState, relationship } = npc;
    const { trust, respect, fear, joy } = emotionalState;

    if (relationship > 70 && trust > 50 && joy > 30) return 'loving';
    if (relationship > 30 && trust > 20) return 'friendly';
    if (fear > 50 || relationship < -30) return 'hostile';
    if (fear > 30) return 'fearful';
    return 'neutral';
  }

  // Get NPC's current emotional summary
  getEmotionalSummary(npc: NPC): string {
    const { emotionalState } = npc;
    const { joy, anger, fear, trust, respect } = emotionalState;

    const emotions = [];
    if (joy > 30) emotions.push('joyful');
    if (anger > 30) emotions.push('angry');
    if (fear > 30) emotions.push('fearful');
    if (trust > 30) emotions.push('trusting');
    if (respect > 30) emotions.push('respectful');

    if (emotions.length === 0) return 'neutral';
    return emotions.join(', ');
  }

  // Get relevant memories for current context
  getRelevantMemories(npc: NPC, context: string, limit: number = 5): NPCMemory[] {
    const relevantMemories = npc.memories
      .filter(memory => 
        memory.description.toLowerCase().includes(context.toLowerCase()) ||
        memory.context.toLowerCase().includes(context.toLowerCase())
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return relevantMemories;
  }

  // Calculate personality influence on behavior
  getPersonalityInfluence(npc: NPC, situation: string): number {
    const { personalityTraits } = npc;
    let influence = 0;

    switch (situation) {
      case 'social':
        influence = (personalityTraits.extraversion + personalityTraits.agreeableness) / 2;
        break;
      case 'conflict':
        influence = personalityTraits.neuroticism - personalityTraits.agreeableness;
        break;
      case 'exploration':
        influence = personalityTraits.openness;
        break;
      case 'responsibility':
        influence = personalityTraits.conscientiousness;
        break;
      default:
        influence = 5; // Neutral
    }

    return Math.max(0, Math.min(10, influence));
  }

  // Private helper methods
  private calculateMood(emotionalState: NPCEmotionalState): NPCEmotionalState['currentMood'] {
    const { joy, anger, fear, trust, respect } = emotionalState;
    
    if (joy > 50 && trust > 30) return 'friendly';
    if (joy > 70) return 'excited';
    if (anger > 50) return 'hostile';
    if (fear > 50) return 'anxious';
    if (respect > 50 && trust > 20) return 'confident';
    if (trust < -30) return 'suspicious';
    if (joy < -30) return 'sad';
    return 'neutral';
  }

  private calculateMoodIntensity(emotionalState: NPCEmotionalState): number {
    const { joy, anger, fear, trust, respect } = emotionalState;
    const maxEmotion = Math.max(Math.abs(joy), Math.abs(anger), Math.abs(fear), Math.abs(trust), Math.abs(respect));
    return Math.min(10, Math.floor(maxEmotion / 10));
  }

  private calculateStressLevel(emotionalState: NPCEmotionalState): number {
    const { anger, fear, neuroticism } = emotionalState;
    const stressFactors = [Math.abs(anger), Math.abs(fear)];
    const averageStress = stressFactors.reduce((sum, factor) => sum + factor, 0) / stressFactors.length;
    return Math.min(10, Math.floor(averageStress / 10));
  }

  private calculateConfidence(emotionalState: NPCEmotionalState): number {
    const { respect, trust, joy } = emotionalState;
    const confidenceFactors = [respect, trust, joy];
    const averageConfidence = confidenceFactors.reduce((sum, factor) => sum + factor, 0) / confidenceFactors.length;
    return Math.min(10, Math.max(0, Math.floor((averageConfidence + 100) / 20)));
  }

  // Generate NPC response based on emotional state and personality
  generateResponse(npc: NPC, playerAction: string): string {
    const disposition = this.getDisposition(npc);
    const emotionalSummary = this.getEmotionalSummary(npc);
    const personalityInfluence = this.getPersonalityInfluence(npc, 'social');

    // Base response templates
    const responses = {
      loving: [
        "I'm so glad to see you! You've always been kind to me.",
        "You're like family to me. How can I help you today?",
        "My heart warms when I see you approach."
      ],
      friendly: [
        "Hello there! It's good to see you again.",
        "Welcome! How can I assist you today?",
        "Greetings, friend. What brings you here?"
      ],
      neutral: [
        "Hello. What do you need?",
        "I see you've returned. What is it?",
        "Yes? How can I help you?"
      ],
      fearful: [
        "Oh! You startled me... What do you want?",
        "Please, don't hurt me. I'll help if I can.",
        "I... I'm not sure what you want from me."
      ],
      hostile: [
        "What do you want? I don't have time for this.",
        "You again. What trouble are you causing now?",
        "Leave me alone. I have nothing to say to you."
      ]
    };

    const baseResponses = responses[disposition] || responses.neutral;
    const selectedResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];

    // Add emotional context
    if (emotionalSummary !== 'neutral') {
      return `${selectedResponse} (${npc.name} seems ${emotionalSummary})`;
    }

    return selectedResponse;
  }

  // Save NPC state to storage
  saveNPCState(npc: NPC): void {
    try {
      const npcData = JSON.stringify(npc);
      localStorage.setItem(`npc_${npc.id}`, npcData);
    } catch (error) {
      console.error('Error saving NPC state:', error);
    }
  }

  // Load NPC state from storage
  loadNPCState(npcId: string): NPC | null {
    try {
      const npcData = localStorage.getItem(`npc_${npcId}`);
      if (npcData) {
        const npc = JSON.parse(npcData);
        // Convert date strings back to Date objects
        npc.emotionalState.lastMoodChange = new Date(npc.emotionalState.lastMoodChange);
        npc.memories = npc.memories.map((memory: any) => ({
          ...memory,
          timestamp: new Date(memory.timestamp)
        }));
        npc.interactionHistory = npc.interactionHistory.map((interaction: any) => ({
          ...interaction,
          timestamp: new Date(interaction.timestamp)
        }));
        return npc;
      }
    } catch (error) {
      console.error('Error loading NPC state:', error);
    }
    return null;
  }
}

export const npcService = new NPCService(); 