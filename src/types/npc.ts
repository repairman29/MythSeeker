export interface NPCEmotionalState {
  joy: number; // -100 to 100
  anger: number; // -100 to 100
  fear: number; // -100 to 100
  trust: number; // -100 to 100
  respect: number; // -100 to 100
  currentMood: 'friendly' | 'neutral' | 'hostile' | 'sad' | 'excited' | 'anxious' | 'confident' | 'suspicious';
  moodIntensity: number; // 0 to 10
  lastMoodChange: Date;
  stressLevel: number; // 0 to 10
  confidence: number; // 0 to 10
}

export interface NPCMemory {
  id: string;
  timestamp: Date;
  type: 'conversation' | 'gift' | 'quest' | 'trade' | 'conflict' | 'help';
  description: string;
  emotionalImpact: {
    joy: number;
    anger: number;
    fear: number;
    trust: number;
    respect: number;
  };
  relationshipChange: number;
  context: string;
}

export interface NPC {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  type: 'merchant' | 'quest_giver' | 'companion' | 'enemy' | 'neutral';
  personality: string;
  relationship: number; // -100 to 100
  dialogue: any[];
  inventory?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    rarity: string;
  }>;
  quests?: string[];
  location?: string;
  schedule?: {
    morning?: string;
    afternoon?: string;
    evening?: string;
    night?: string;
  };
  emotionalState: NPCEmotionalState;
  memories: NPCMemory[];
  personalityTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  background: {
    origin: string;
    occupation: string;
    goals: string[];
    fears: string[];
    secrets: string[];
  };
  interactionHistory: Array<{
    timestamp: Date;
    playerAction: string;
    npcResponse: string;
    relationshipChange: number;
    emotionalImpact: Partial<NPCEmotionalState>;
  }>;
} 