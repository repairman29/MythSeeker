import { DiceRoll, DiceRollHistory } from '../types/dice';

class DiceService {
  private static instance: DiceService;
  private rollHistory: DiceRoll[] = [];
  private readonly STORAGE_KEY = 'mythseeker_dice_history';
  private readonly MAX_HISTORY_SIZE = 100;

  private constructor() {
    this.loadHistory();
  }

  public static getInstance(): DiceService {
    if (!DiceService.instance) {
      DiceService.instance = new DiceService();
    }
    return DiceService.instance;
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.rollHistory = parsed.map((roll: any) => ({
          ...roll,
          timestamp: new Date(roll.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load dice history:', error);
      this.rollHistory = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.rollHistory));
    } catch (error) {
      console.error('Failed to save dice history:', error);
    }
  }

  public addRoll(roll: Omit<DiceRoll, 'id' | 'timestamp'>): void {
    const newRoll: DiceRoll = {
      ...roll,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.rollHistory.unshift(newRoll);
    
    // Keep only the most recent rolls
    if (this.rollHistory.length > this.MAX_HISTORY_SIZE) {
      this.rollHistory = this.rollHistory.slice(0, this.MAX_HISTORY_SIZE);
    }

    this.saveHistory();
  }

  public getHistory(limit?: number): DiceRoll[] {
    return limit ? this.rollHistory.slice(0, limit) : this.rollHistory;
  }

  public getHistoryStats(): DiceRollHistory {
    const totalRolls = this.rollHistory.length;
    
    if (totalRolls === 0) {
      return {
        rolls: [],
        totalRolls: 0,
        averageResult: 0,
        mostRolledSides: 0
      };
    }

    const averageResult = this.rollHistory.reduce((sum, roll) => sum + roll.result, 0) / totalRolls;
    
    // Find most rolled dice sides
    const sidesCount = this.rollHistory.reduce((acc, roll) => {
      acc[roll.sides] = (acc[roll.sides] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const mostRolledSides = Object.entries(sidesCount).reduce((a, b) => {
      return a[1] > b[1] ? a : b;
    })[0];

    return {
      rolls: this.rollHistory,
      totalRolls,
      averageResult: Math.round(averageResult * 100) / 10,
      mostRolledSides: parseInt(mostRolledSides)
    };
  }

  public clearHistory(): void {
    this.rollHistory = [];
    this.saveHistory();
  }

  public getRollsBySides(sides: number): DiceRoll[] {
    return this.rollHistory.filter(roll => roll.sides === sides);
  }

  public getRollsByDiceSet(diceSet: string): DiceRoll[] {
    return this.rollHistory.filter(roll => roll.diceSet === diceSet);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default DiceService; 