export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'character' | 'combat' | 'social' | 'exploration' | 'collection' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  color: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: number;
  rewards?: {
    diceSets?: string[];
    titles?: string[];
    badges?: string[];
    xp?: number;
  };
  conditions: {
    type: string;
    value: any;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'count';
  }[];
}

export interface AchievementProgress {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  categories: {
    [key: string]: {
      total: number;
      unlocked: number;
      percentage: number;
    };
  };
  recentUnlocks: Achievement[];
}

class AchievementService {
  private readonly STORAGE_KEY = 'mythseeker_achievements';
  private readonly PROGRESS_KEY = 'mythseeker_achievement_progress';

  // Define all achievements
  private readonly ACHIEVEMENTS: Achievement[] = [
    // Character Achievements
    {
      id: 'first_character',
      title: 'First Steps',
      description: 'Create your first character',
      category: 'character',
      rarity: 'common',
      icon: '👤',
      color: 'from-blue-500 to-cyan-500',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 100 },
      conditions: [{ type: 'characters_created', value: 1, operator: 'greater_than' }]
    },
    {
      id: 'character_level_5',
      title: 'Experienced Hero',
      description: 'Reach level 5 with any character',
      category: 'character',
      rarity: 'common',
      icon: '⭐',
      color: 'from-yellow-500 to-orange-500',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 200, diceSets: ['golden'] },
      conditions: [{ type: 'character_level', value: 5, operator: 'greater_than' }]
    },
    {
      id: 'character_level_10',
      title: 'Veteran Adventurer',
      description: 'Reach level 10 with any character',
      category: 'character',
      rarity: 'rare',
      icon: '🌟',
      color: 'from-purple-500 to-pink-500',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 500, diceSets: ['emerald'] },
      conditions: [{ type: 'character_level', value: 10, operator: 'greater_than' }]
    },
    {
      id: 'multiple_characters',
      title: 'Character Creator',
      description: 'Create 5 different characters',
      category: 'character',
      rarity: 'rare',
      icon: '👥',
      color: 'from-green-500 to-emerald-500',
      progress: 0,
      maxProgress: 5,
      unlocked: false,
      rewards: { xp: 300 },
      conditions: [{ type: 'characters_created', value: 5, operator: 'greater_than' }]
    },

    // Combat Achievements
    {
      id: 'first_combat_win',
      title: 'Warrior',
      description: 'Win your first combat',
      category: 'combat',
      rarity: 'common',
      icon: '⚔️',
      color: 'from-red-500 to-pink-500',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 150 },
      conditions: [{ type: 'combats_won', value: 1, operator: 'greater_than' }]
    },
    {
      id: 'combat_master',
      title: 'Combat Master',
      description: 'Win 10 combats',
      category: 'combat',
      rarity: 'rare',
      icon: '🗡️',
      color: 'from-red-600 to-purple-600',
      progress: 0,
      maxProgress: 10,
      unlocked: false,
      rewards: { xp: 400, diceSets: ['ruby'] },
      conditions: [{ type: 'combats_won', value: 10, operator: 'greater_than' }]
    },
    {
      id: 'perfect_combat',
      title: 'Perfect Victory',
      description: 'Win a combat without taking damage',
      category: 'combat',
      rarity: 'epic',
      icon: '🛡️',
      color: 'from-yellow-400 to-orange-400',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 600, titles: ['The Untouchable'] },
      conditions: [{ type: 'perfect_combat', value: 1, operator: 'greater_than' }]
    },

    // Social Achievements
    {
      id: 'first_campaign',
      title: 'Adventure Begins',
      description: 'Start your first campaign',
      category: 'social',
      rarity: 'common',
      icon: '📖',
      color: 'from-green-500 to-emerald-500',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 100 },
      conditions: [{ type: 'campaigns_started', value: 1, operator: 'greater_than' }]
    },
    {
      id: 'multiplayer_party',
      title: 'Party Leader',
      description: 'Play in a multiplayer campaign',
      category: 'social',
      rarity: 'common',
      icon: '👥',
      color: 'from-blue-500 to-indigo-500',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 200 },
      conditions: [{ type: 'multiplayer_campaigns', value: 1, operator: 'greater_than' }]
    },
    {
      id: 'campaign_completion',
      title: 'Storyteller',
      description: 'Complete a campaign',
      category: 'social',
      rarity: 'rare',
      icon: '📚',
      color: 'from-purple-500 to-indigo-500',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 500, diceSets: ['neon'] },
      conditions: [{ type: 'campaigns_completed', value: 1, operator: 'greater_than' }]
    },

    // Exploration Achievements
    {
      id: 'world_explorer',
      title: 'World Explorer',
      description: 'Visit 5 different locations',
      category: 'exploration',
      rarity: 'common',
      icon: '🗺️',
      color: 'from-green-400 to-blue-400',
      progress: 0,
      maxProgress: 5,
      unlocked: false,
      rewards: { xp: 250 },
      conditions: [{ type: 'locations_visited', value: 5, operator: 'greater_than' }]
    },
    {
      id: 'treasure_hunter',
      title: 'Treasure Hunter',
      description: 'Find 10 hidden treasures',
      category: 'exploration',
      rarity: 'rare',
      icon: '💎',
      color: 'from-yellow-500 to-orange-500',
      progress: 0,
      maxProgress: 10,
      unlocked: false,
      rewards: { xp: 400, badges: ['Treasure Hunter'] },
      conditions: [{ type: 'treasures_found', value: 10, operator: 'greater_than' }]
    },

    // Collection Achievements
    {
      id: 'dice_collector',
      title: 'Dice Collector',
      description: 'Unlock 5 different dice sets',
      category: 'collection',
      rarity: 'rare',
      icon: '🎲',
      color: 'from-purple-500 to-pink-500',
      progress: 0,
      maxProgress: 5,
      unlocked: false,
      rewards: { xp: 300, diceSets: ['obsidian'] },
      conditions: [{ type: 'dice_sets_unlocked', value: 5, operator: 'greater_than' }]
    },
    {
      id: 'spell_master',
      title: 'Spell Master',
      description: 'Learn 20 different spells',
      category: 'collection',
      rarity: 'epic',
      icon: '✨',
      color: 'from-indigo-500 to-purple-500',
      progress: 0,
      maxProgress: 20,
      unlocked: false,
      rewards: { xp: 600, titles: ['Archmage'] },
      conditions: [{ type: 'spells_learned', value: 20, operator: 'greater_than' }]
    },

    // Special Achievements
    {
      id: 'natural_20_master',
      title: 'Critical Master',
      description: 'Roll 10 natural 20s',
      category: 'special',
      rarity: 'epic',
      icon: '🎯',
      color: 'from-green-500 to-emerald-500',
      progress: 0,
      maxProgress: 10,
      unlocked: false,
      rewards: { xp: 500, badges: ['Critical Master'] },
      conditions: [{ type: 'natural_20s', value: 10, operator: 'greater_than' }]
    },
    {
      id: 'lucky_streak',
      title: 'Lucky Streak',
      description: 'Roll the same number 5 times in a row',
      category: 'special',
      rarity: 'legendary',
      icon: '🍀',
      color: 'from-yellow-400 to-orange-400',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rewards: { xp: 1000, titles: ['The Lucky One'], diceSets: ['neon'] },
      conditions: [{ type: 'lucky_streak', value: 5, operator: 'greater_than' }]
    },
    {
      id: 'dedicated_player',
      title: 'Dedicated Player',
      description: 'Play for 7 consecutive days',
      category: 'special',
      rarity: 'rare',
      icon: '🔥',
      color: 'from-red-500 to-orange-500',
      progress: 0,
      maxProgress: 7,
      unlocked: false,
      rewards: { xp: 400, badges: ['Dedicated'] },
      conditions: [{ type: 'consecutive_days', value: 7, operator: 'greater_than' }]
    }
  ];

  constructor() {
    this.initializeAchievements();
  }

  // Initialize achievements from storage or defaults
  private initializeAchievements(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const storedAchievements = JSON.parse(stored);
        // Merge stored achievements with defaults to ensure all exist
        this.ACHIEVEMENTS.forEach(achievement => {
          const stored = storedAchievements.find((a: Achievement) => a.id === achievement.id);
          if (stored) {
            Object.assign(achievement, stored);
          }
        });
      }
      this.saveAchievements();
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  }

  // Get all achievements
  getAchievements(): Achievement[] {
    return this.ACHIEVEMENTS;
  }

  // Get achievements by category
  getAchievementsByCategory(category: string): Achievement[] {
    return this.ACHIEVEMENTS.filter(a => a.category === category);
  }

  // Get unlocked achievements
  getUnlockedAchievements(): Achievement[] {
    return this.ACHIEVEMENTS.filter(a => a.unlocked);
  }

  // Get achievement progress
  getProgress(): AchievementProgress {
    const totalAchievements = this.ACHIEVEMENTS.length;
    const unlockedAchievements = this.getUnlockedAchievements().length;
    const completionPercentage = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;

    // Calculate category progress
    const categories: { [key: string]: { total: number; unlocked: number; percentage: number } } = {};
    const categoryList = ['character', 'combat', 'social', 'exploration', 'collection', 'special'];
    
    categoryList.forEach(category => {
      const categoryAchievements = this.getAchievementsByCategory(category);
      const unlocked = categoryAchievements.filter(a => a.unlocked).length;
      categories[category] = {
        total: categoryAchievements.length,
        unlocked,
        percentage: categoryAchievements.length > 0 ? (unlocked / categoryAchievements.length) * 100 : 0
      };
    });

    return {
      totalAchievements,
      unlockedAchievements,
      completionPercentage,
      categories,
      recentUnlocks: this.getUnlockedAchievements()
        .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
        .slice(0, 5)
    };
  }

  // Check and update achievement progress
  checkAchievements(gameData: any): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    this.ACHIEVEMENTS.forEach(achievement => {
      if (achievement.unlocked) return;

      let progress = 0;
      let shouldUnlock = false;

      // Calculate progress based on conditions
      achievement.conditions.forEach(condition => {
        const value = this.getGameDataValue(gameData, condition.type);
        
        switch (condition.operator) {
          case 'equals':
            if (value === condition.value) progress++;
            break;
          case 'greater_than':
            if (value >= condition.value) progress++;
            break;
          case 'less_than':
            if (value <= condition.value) progress++;
            break;
          case 'contains':
            if (Array.isArray(value) && value.includes(condition.value)) progress++;
            break;
          case 'count':
            progress = Math.min(value, condition.value);
            break;
        }
      });

      // Update progress
      achievement.progress = progress;
      
      // Check if should unlock
      if (progress >= achievement.maxProgress && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        newlyUnlocked.push(achievement);
        
        // Grant rewards
        this.grantRewards(achievement);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveAchievements();
    }

    return newlyUnlocked;
  }

  // Get value from game data
  private getGameDataValue(gameData: any, type: string): any {
    switch (type) {
      case 'characters_created':
        return gameData.characters?.length || 0;
      case 'character_level':
        return Math.max(...(gameData.characters?.map((c: any) => c.level || 1) || [1]));
      case 'combats_won':
        return gameData.stats?.combatsWon || 0;
      case 'perfect_combat':
        return gameData.stats?.perfectCombats || 0;
      case 'campaigns_started':
        return gameData.campaigns?.length || 0;
      case 'multiplayer_campaigns':
        return gameData.campaigns?.filter((c: any) => c.isMultiplayer)?.length || 0;
      case 'campaigns_completed':
        return gameData.campaigns?.filter((c: any) => c.status === 'completed')?.length || 0;
      case 'locations_visited':
        return gameData.stats?.locationsVisited || 0;
      case 'treasures_found':
        return gameData.stats?.treasuresFound || 0;
      case 'dice_sets_unlocked':
        return gameData.diceSets?.filter((d: any) => d.unlocked)?.length || 0;
      case 'spells_learned':
        return gameData.stats?.spellsLearned || 0;
      case 'natural_20s':
        return gameData.stats?.natural20s || 0;
      case 'lucky_streak':
        return gameData.stats?.luckyStreak || 0;
      case 'consecutive_days':
        return gameData.stats?.consecutiveDays || 0;
      default:
        return 0;
    }
  }

  // Grant rewards for unlocked achievement
  private grantRewards(achievement: Achievement): void {
    if (!achievement.rewards) return;

    // Grant XP
    if (achievement.rewards.xp) {
      // TODO: Add XP to user profile
      console.log(`Granted ${achievement.rewards.xp} XP for achievement: ${achievement.title}`);
    }

    // Unlock dice sets
    if (achievement.rewards.diceSets) {
      achievement.rewards.diceSets.forEach(setId => {
        // TODO: Unlock dice set in dice service
        console.log(`Unlocked dice set: ${setId}`);
      });
    }

    // Add titles
    if (achievement.rewards.titles) {
      // TODO: Add titles to user profile
      console.log(`Granted titles: ${achievement.rewards.titles.join(', ')}`);
    }

    // Add badges
    if (achievement.rewards.badges) {
      // TODO: Add badges to user profile
      console.log(`Granted badges: ${achievement.rewards.badges.join(', ')}`);
    }
  }

  // Save achievements to storage
  private saveAchievements(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.ACHIEVEMENTS));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  // Reset all achievements (for testing)
  resetAchievements(): void {
    this.ACHIEVEMENTS.forEach(achievement => {
      achievement.unlocked = false;
      achievement.progress = 0;
      delete achievement.unlockedAt;
    });
    this.saveAchievements();
  }

  // Export achievements data
  exportData(): string {
    return JSON.stringify({
      achievements: this.ACHIEVEMENTS,
      progress: this.getProgress(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  // Import achievements data
  importData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);
      if (data.achievements) {
        data.achievements.forEach((importedAchievement: Achievement) => {
          const existing = this.ACHIEVEMENTS.find(a => a.id === importedAchievement.id);
          if (existing) {
            Object.assign(existing, importedAchievement);
          }
        });
        this.saveAchievements();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing achievements:', error);
      return false;
    }
  }
}

export const achievementService = new AchievementService(); 