export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  maxProgress: number;
  type: 'kill' | 'collect' | 'explore' | 'talk' | 'craft' | 'deliver';
  target?: string;
  location?: string;
}

export interface QuestReward {
  experience: number;
  gold: number;
  items?: Array<{
    name: string;
    quantity: number;
    rarity: string;
  }>;
  reputation?: Array<{
    faction: string;
    amount: number;
  }>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'weekly' | 'faction';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';
  level: number;
  objectives: QuestObjective[];
  rewards: QuestReward;
  status: 'available' | 'active' | 'completed' | 'failed';
  timeLimit?: number; // in minutes
  startTime?: number;
  completedTime?: number;
  giver?: string;
  location?: string;
  prerequisites?: string[]; // quest IDs that must be completed first
} 