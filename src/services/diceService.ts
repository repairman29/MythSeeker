export interface DiceRoll {
  id: string;
  sides: number;
  result: number;
  timestamp: number;
  diceSet?: string;
  campaignId?: string;
  characterId?: string;
  context?: string;
}

export interface DiceStats {
  totalRolls: number;
  averageRoll: number;
  highestRoll: number;
  lowestRoll: number;
  mostRolledSides: number;
  rollDistribution: { [sides: number]: number };
  recentRolls: DiceRoll[];
}

export interface DiceSet {
  id: string;
  name: string;
  color: number;
  roughness: number;
  metalness: number;
  emissive?: number;
  emissiveIntensity?: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

class DiceService {
  private readonly STORAGE_KEY = 'mythseeker_dice_rolls';
  private readonly STATS_KEY = 'mythseeker_dice_stats';
  private readonly SETTINGS_KEY = 'mythseeker_dice_settings';

  // Get all rolls
  getRolls(): DiceRoll[] {
    try {
      const rolls = localStorage.getItem(this.STORAGE_KEY);
      return rolls ? JSON.parse(rolls) : [];
    } catch (error) {
      console.error('Error loading dice rolls:', error);
      return [];
    }
  }

  // Add a new roll
  addRoll(roll: Omit<DiceRoll, 'id' | 'timestamp'>): DiceRoll {
    const newRoll: DiceRoll = {
      ...roll,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const rolls = this.getRolls();
    rolls.unshift(newRoll); // Add to beginning for recent first

    // Keep only last 1000 rolls to prevent storage bloat
    if (rolls.length > 1000) {
      rolls.splice(1000);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rolls));
    this.updateStats();
    return newRoll;
  }

  // Get rolls with filtering
  getFilteredRolls(filters: {
    sides?: number;
    campaignId?: string;
    characterId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): DiceRoll[] {
    let rolls = this.getRolls();

    if (filters.sides) {
      rolls = rolls.filter(roll => roll.sides === filters.sides);
    }
    if (filters.campaignId) {
      rolls = rolls.filter(roll => roll.campaignId === filters.campaignId);
    }
    if (filters.characterId) {
      rolls = rolls.filter(roll => roll.characterId === filters.characterId);
    }
    if (filters.startDate) {
      rolls = rolls.filter(roll => roll.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      rolls = rolls.filter(roll => roll.timestamp <= filters.endDate!);
    }
    if (filters.limit) {
      rolls = rolls.slice(0, filters.limit);
    }

    return rolls;
  }

  // Get statistics
  getStats(): DiceStats {
    try {
      const stats = localStorage.getItem(this.STATS_KEY);
      return stats ? JSON.parse(stats) : this.calculateStats();
    } catch (error) {
      console.error('Error loading dice stats:', error);
      return this.calculateStats();
    }
  }

  // Calculate statistics from rolls
  private calculateStats(): DiceStats {
    const rolls = this.getRolls();
    
    if (rolls.length === 0) {
      return {
        totalRolls: 0,
        averageRoll: 0,
        highestRoll: 0,
        lowestRoll: 0,
        mostRolledSides: 0,
        rollDistribution: {},
        recentRolls: []
      };
    }

    const totalRolls = rolls.length;
    const totalValue = rolls.reduce((sum, roll) => sum + roll.result, 0);
    const averageRoll = totalValue / totalRolls;
    const highestRoll = Math.max(...rolls.map(roll => roll.result));
    const lowestRoll = Math.min(...rolls.map(roll => roll.result));

    // Calculate roll distribution
    const distribution: { [sides: number]: number } = {};
    rolls.forEach(roll => {
      distribution[roll.sides] = (distribution[roll.sides] || 0) + 1;
    });

    // Find most rolled sides
    const mostRolledSides = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '0';

    return {
      totalRolls,
      averageRoll: Math.round(averageRoll * 100) / 100,
      highestRoll,
      lowestRoll,
      mostRolledSides: parseInt(mostRolledSides),
      rollDistribution: distribution,
      recentRolls: rolls.slice(0, 10)
    };
  }

  // Update statistics
  private updateStats(): void {
    const stats = this.calculateStats();
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }

  // Get dice sets
  getDiceSets(): DiceSet[] {
    const defaultSets: DiceSet[] = [
      { id: 'classic', name: 'Classic Purple', color: 0x8b5cf6, roughness: 0.5, metalness: 0.8, unlocked: true, rarity: 'common' },
      { id: 'crystal', name: 'Crystal Blue', color: 0x3b82f6, roughness: 0.1, metalness: 0.9, emissive: 0x0e40af, emissiveIntensity: 0.2, unlocked: true, rarity: 'common' },
      { id: 'golden', name: 'Golden', color: 0xfbbf24, roughness: 0.0, metalness: 1, unlocked: false, rarity: 'rare' },
      { id: 'emerald', name: 'Emerald', color: 0x10b981, roughness: 0.0, metalness: 0.7, unlocked: false, rarity: 'rare' },
      { id: 'ruby', name: 'Ruby', color: 0xef4444, roughness: 0.0, metalness: 0.6, unlocked: false, rarity: 'epic' },
      { id: 'obsidian', name: 'Obsidian', color: 0x1f2937, roughness: 0.8, metalness: 0.3, unlocked: false, rarity: 'legendary' },
      { id: 'wooden', name: 'Wooden', color: 0x92400e, roughness: 0.9, metalness: 1, unlocked: true, rarity: 'common' },
      { id: 'neon', name: 'Neon Pink', color: 0xec4899, roughness: 0.2, metalness: 0.8, emissive: 0xec4899, emissiveIntensity: 0.3, unlocked: false, rarity: 'epic' },
    ];

    try {
      const savedSets = localStorage.getItem('mythseeker_dice_sets');
      if (savedSets) {
        const parsed = JSON.parse(savedSets);
        // Merge with defaults to ensure all sets exist
        return defaultSets.map(defaultSet => ({
          ...defaultSet,
          ...parsed.find((s: DiceSet) => s.id === defaultSet.id)
        }));
      }
    } catch (error) {
      console.error('Error loading dice sets:', error);
    }

    return defaultSets;
  }

  // Unlock a dice set
  unlockDiceSet(setId: string): void {
    const sets = this.getDiceSets();
    const setIndex = sets.findIndex(set => set.id === setId);
    
    if (setIndex !== -1) {
      sets[setIndex].unlocked = true;
      localStorage.setItem('mythseeker_dice_sets', JSON.stringify(sets));
    }
  }

  // Get dice settings
  getSettings(): any {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error loading dice settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Update dice settings
  updateSettings(settings: any): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Get default settings
  private getDefaultSettings(): any {
    return {
      soundEnabled: true,
      hapticEnabled: true,
      shakeToRoll: true,
      showHistory: true,
      autoSaveRolls: true,
      defaultSides: 20,
      defaultDiceSet: 'classic'
    };
  }

  // Clear all data
  clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STATS_KEY);
    localStorage.removeItem(this.SETTINGS_KEY);
  }

  // Export data
  exportData(): string {
    const data = {
      rolls: this.getRolls(),
      stats: this.getStats(),
      settings: this.getSettings(),
      diceSets: this.getDiceSets(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  // Import data
  importData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);
      
      if (data.rolls) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.rolls));
      }
      if (data.stats) {
        localStorage.setItem(this.STATS_KEY, JSON.stringify(data.stats));
      }
      if (data.settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
      }
      if (data.diceSets) {
        localStorage.setItem('mythseeker_dice_sets', JSON.stringify(data.diceSets));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing dice data:', error);
      return false;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get roll streak (consecutive rolls of same number)
  getRollStreak(): { number: number; count: number } {
    const rolls = this.getRolls();
    if (rolls.length < 2) return { number: 0, count: 0 };

    let currentStreak = 1;
    let maxStreak = 1;
    let streakNumber = rolls[0].result;

    for (let i = 1; i < rolls.length; i++) {
      if (rolls[i].result === rolls[i - 1].result) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          streakNumber = rolls[i].result;
        }
      } else {
        currentStreak = 1;
      }
    }

    return { number: streakNumber, count: maxStreak };
  }

  // Get lucky/unlucky rolls (natural 20s and 1s)
  getLuckyRolls(): { natural20s: number; natural1s: number } {
    const rolls = this.getRolls();
    const natural20s = rolls.filter(roll => roll.sides === 20 && roll.result === 20).length;
    const natural1s = rolls.filter(roll => roll.result === 1).length;
    
    return { natural20s, natural1s };
  }
}

export const diceService = new DiceService(); 