export interface DiceSet {
  id: string;
  name: string;
  color: number;
  roughness: number;
  metalness: number;
  emissive?: number;
  emissiveIntensity?: number;
}

export interface DiceRoll {
  id: string;
  timestamp: Date;
  result: number;
  sides: number;
  diceSet: string;
  campaignId?: string;
  userId?: string;
}

export interface DiceRollHistory {
  rolls: DiceRoll[];
  totalRolls: number;
  averageResult: number;
  mostRolledSides: number;
} 