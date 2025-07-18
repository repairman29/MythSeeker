import { 
  CharacterProgression, 
  Experience, 
  ExperienceSource, 
  LevelUpData, 
  ProgressionEvent,
  AbilityScore,
  AbilityScoreChoice,
  Feat,
  SkillTree,
  SkillNode,
  CharacterClass,
  ClassFeature,
  getXPForLevel,
  getLevelFromXP,
  getXPToNextLevel,
  getProficiencyBonus,
  getAbilityModifier,
  XP_TABLE,
  DND5E_CLASSES
} from '../types/characterProgression';
import { firebaseService } from '../firebaseService';

export class CharacterProgressionService {
  private static instance: CharacterProgressionService;
  
  static getInstance(): CharacterProgressionService {
    if (!CharacterProgressionService.instance) {
      CharacterProgressionService.instance = new CharacterProgressionService();
    }
    return CharacterProgressionService.instance;
  }

  // Experience Management
  async addExperience(
    characterId: string, 
    amount: number, 
    source: Omit<ExperienceSource, 'id' | 'timestamp'>
  ): Promise<{ leveledUp: boolean; newLevel?: number; levelUpData?: LevelUpData }> {
    try {
      const progression = await this.getCharacterProgression(characterId);
      if (!progression) {
        throw new Error('Character progression not found');
      }

      const experienceSource: ExperienceSource = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...source,
        amount
      };

      const oldLevel = progression.level;
      const newTotalXP = progression.experience.current + amount;
      const newLevel = getLevelFromXP(newTotalXP);
      
      progression.experience.current = newTotalXP;
      progression.experience.total = newTotalXP;
      progression.experience.sources.push(experienceSource);
      progression.experience.nextLevelXP = getXPToNextLevel(newTotalXP);

      const leveledUp = newLevel > oldLevel;
      let levelUpData: LevelUpData | undefined;

      if (leveledUp) {
        levelUpData = await this.processLevelUp(progression, oldLevel, newLevel);
        progression.level = newLevel;
        
        // Create progression event
        const event: ProgressionEvent = {
          id: `levelup_${Date.now()}`,
          type: 'level_up',
          characterId,
          timestamp: new Date(),
          details: { oldLevel, newLevel, levelUpData },
          processed: false
        };
        
        await this.saveProgressionEvent(event);
      }

      await this.saveCharacterProgression(progression);

      return {
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
        levelUpData
      };

    } catch (error) {
      console.error('Error adding experience:', error);
      throw error;
    }
  }

  // Level Up Processing
  private async processLevelUp(
    progression: CharacterProgression, 
    oldLevel: number, 
    newLevel: number
  ): Promise<LevelUpData> {
    const levelUpData: LevelUpData = {
      newLevel,
      hitPointIncrease: 0,
      newFeatures: [],
      abilityScoreImprovement: false,
      featChoice: false,
      skillTreePoints: 0,
      spellSlotsGained: {},
      spellsLearned: []
    };

    // Process each level gained
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      await this.processSingleLevel(progression, level, levelUpData);
    }

    return levelUpData;
  }

  private async processSingleLevel(
    progression: CharacterProgression, 
    level: number, 
    levelUpData: LevelUpData
  ): Promise<void> {
    const characterClass = progression.class;
    
    // Hit Points increase
    const hitDieValue = this.getHitDieValue(characterClass.hitDie);
    const conModifier = getAbilityModifier(progression.abilityScores.constitution.total);
    const hpIncrease = Math.floor(hitDieValue / 2) + 1 + conModifier; // Average + CON modifier
    
    levelUpData.hitPointIncrease += hpIncrease;
    progression.hitPoints.max += hpIncrease;

    // Class features
    const levelFeatures = this.getClassFeaturesForLevel(characterClass, level);
    levelUpData.newFeatures.push(...levelFeatures);
    progression.classFeatures.push(...levelFeatures.map(f => f.id));

    // Ability Score Improvement/Feat (levels 4, 8, 12, 16, 19 for most classes)
    if (this.isAbilityScoreImprovementLevel(characterClass, level)) {
      levelUpData.abilityScoreImprovement = true;
      levelUpData.featChoice = true;
    }

    // Skill Tree Points
    levelUpData.skillTreePoints += this.getSkillTreePointsForLevel(level);

    // Spellcasting progression
    if (characterClass.spellcaster) {
      const spellSlots = this.getSpellSlotsForLevel(characterClass, level);
      Object.assign(levelUpData.spellSlotsGained, spellSlots);
    }

    // Proficiency bonus increase
    const newProficiencyBonus = getProficiencyBonus(level);
    // Update any features that depend on proficiency bonus
  }

  // Ability Score Management
  async applyAbilityScoreImprovement(
    characterId: string,
    level: number,
    choices: AbilityScoreChoice[]
  ): Promise<void> {
    try {
      const progression = await this.getCharacterProgression(characterId);
      if (!progression) {
        throw new Error('Character progression not found');
      }

      for (const choice of choices) {
        if (choice.type === 'increase' && choice.abilityScore) {
          progression.abilityScores[choice.abilityScore].improvement += 1;
          progression.abilityScores[choice.abilityScore].total += 1;
        } else if (choice.type === 'feat' && choice.featId) {
          await this.applyFeat(progression, choice.featId);
        }
      }

      progression.abilityScoreImprovements.push({ level, choices });
      await this.saveCharacterProgression(progression);

    } catch (error) {
      console.error('Error applying ability score improvement:', error);
      throw error;
    }
  }

  // Feat Management
  async applyFeat(progression: CharacterProgression, featId: string): Promise<void> {
    const feat = await this.getFeat(featId);
    if (!feat) {
      throw new Error(`Feat ${featId} not found`);
    }

    // Check prerequisites
    if (!this.meetsFeatPrerequisites(progression, feat)) {
      throw new Error(`Character does not meet prerequisites for feat ${feat.name}`);
    }

    // Apply feat effects
    for (const effect of feat.effects) {
      switch (effect.type) {
        case 'ability_increase':
          const ability = effect.target as AbilityScore;
          progression.abilityScores[ability].improvement += effect.value;
          progression.abilityScores[ability].total += effect.value;
          break;
          
        case 'skill_proficiency':
          const skill = effect.target as any;
          if (!progression.skillProficiencies.includes(skill)) {
            progression.skillProficiencies.push(skill);
          }
          break;
          
        case 'new_ability':
          // Add to class features for now - could be expanded to separate feat abilities
          progression.classFeatures.push(`feat_${featId}_${effect.target}`);
          break;
      }
    }

    progression.feats.push(featId);
  }

  // Skill Tree Management
  async unlockSkillTreeNode(
    characterId: string,
    treeId: string,
    nodeId: string
  ): Promise<void> {
    try {
      const progression = await this.getCharacterProgression(characterId);
      if (!progression) {
        throw new Error('Character progression not found');
      }

      const skillTree = await this.getSkillTree(treeId);
      if (!skillTree) {
        throw new Error(`Skill tree ${treeId} not found`);
      }

      const node = skillTree.nodes.find(n => n.id === nodeId);
      if (!node) {
        throw new Error(`Skill tree node ${nodeId} not found`);
      }

      const treeProgress = progression.skillTreeProgress[treeId] || {
        unlockedNodes: [],
        purchasedNodes: [],
        availablePoints: 0,
        totalPointsSpent: 0
      };

      // Check prerequisites
      const hasPrerequisites = node.prerequisites.every(prereq => 
        treeProgress.purchasedNodes.includes(prereq)
      );

      if (!hasPrerequisites) {
        throw new Error('Prerequisites not met for this skill tree node');
      }

      // Check available points
      if (treeProgress.availablePoints < node.cost) {
        throw new Error('Insufficient skill tree points');
      }

      // Purchase node
      treeProgress.purchasedNodes.push(nodeId);
      treeProgress.availablePoints -= node.cost;
      treeProgress.totalPointsSpent += node.cost;

      // Apply node effects
      await this.applySkillTreeNodeEffects(progression, node);

      progression.skillTreeProgress[treeId] = treeProgress;
      await this.saveCharacterProgression(progression);

    } catch (error) {
      console.error('Error unlocking skill tree node:', error);
      throw error;
    }
  }

  private async applySkillTreeNodeEffects(
    progression: CharacterProgression,
    node: SkillNode
  ): Promise<void> {
    for (const effect of node.effects) {
      switch (effect.type) {
        case 'stat_increase':
          const ability = effect.target as AbilityScore;
          progression.abilityScores[ability].improvement += effect.value;
          progression.abilityScores[ability].total += effect.value;
          break;
          
        case 'new_ability':
          progression.classFeatures.push(`skilltree_${node.id}_${effect.target}`);
          break;
      }
    }
  }

  // Data Management
  async getCharacterProgression(characterId: string): Promise<CharacterProgression | null> {
    try {
      const doc = await firebaseService.db
        .collection('characterProgression')
        .doc(characterId)
        .get();
      
      if (!doc.exists) {
        return null;
      }

      return doc.data() as CharacterProgression;
    } catch (error) {
      console.error('Error getting character progression:', error);
      throw error;
    }
  }

  async saveCharacterProgression(progression: CharacterProgression): Promise<void> {
    try {
      await firebaseService.db
        .collection('characterProgression')
        .doc(progression.characterId)
        .set(progression);
    } catch (error) {
      console.error('Error saving character progression:', error);
      throw error;
    }
  }

  async createCharacterProgression(
    characterId: string,
    characterClass: CharacterClass,
    startingLevel: number = 1
  ): Promise<CharacterProgression> {
    const progression: CharacterProgression = {
      characterId,
      experience: {
        current: getXPForLevel(startingLevel),
        total: getXPForLevel(startingLevel),
        level: startingLevel,
        nextLevelXP: getXPToNextLevel(getXPForLevel(startingLevel)),
        sources: []
      },
      level: startingLevel,
      class: characterClass,
      hitPoints: {
        max: this.getHitDieValue(characterClass.hitDie) + 10, // Max HP at level 1
        current: this.getHitDieValue(characterClass.hitDie) + 10,
        temporary: 0
      },
      abilityScores: this.createBaseAbilityScores(),
      skillProficiencies: [],
      skillExpertise: [],
      feats: [],
      classFeatures: [],
      skillTreeProgress: {},
      abilityScoreImprovements: []
    };

    await this.saveCharacterProgression(progression);
    return progression;
  }

  private createBaseAbilityScores() {
    const abilities: CharacterProgression['abilityScores'] = {} as any;
    
    const abilityNames: AbilityScore[] = [
      'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
    ];

    for (const ability of abilityNames) {
      abilities[ability] = {
        base: 10,
        racial: 0,
        improvement: 0,
        equipment: 0,
        temporary: 0,
        total: 10
      };
    }

    return abilities;
  }

  // Utility Methods
  private getHitDieValue(hitDie: string): number {
    const dieMap: { [key: string]: number } = {
      'd6': 6, 'd8': 8, 'd10': 10, 'd12': 12
    };
    return dieMap[hitDie] || 8;
  }

  private getClassFeaturesForLevel(characterClass: CharacterClass, level: number): ClassFeature[] {
    return characterClass.classFeatures.filter(feature => feature.level === level);
  }

  private isAbilityScoreImprovementLevel(characterClass: CharacterClass, level: number): boolean {
    // Most classes get ASI at levels 4, 8, 12, 16, 19
    // Fighters and Rogues get extra ones
    const standardLevels = [4, 8, 12, 16, 19];
    const fighterExtraLevels = [6, 14];
    const rogueExtraLevels = [10];

    let asiLevels = [...standardLevels];
    
    if (characterClass.id === 'fighter') {
      asiLevels.push(...fighterExtraLevels);
    } else if (characterClass.id === 'rogue') {
      asiLevels.push(...rogueExtraLevels);
    }

    return asiLevels.includes(level);
  }

  private getSkillTreePointsForLevel(level: number): number {
    // Give 1 skill tree point per level, with bonus points at certain milestones
    let points = 1;
    
    if (level % 5 === 0) points += 1; // Extra point every 5 levels
    if (level === 10 || level === 20) points += 1; // Milestone bonuses
    
    return points;
  }

  private getSpellSlotsForLevel(characterClass: CharacterClass, level: number): { [level: number]: number } {
    // This would be populated based on the class's spellcasting progression
    // For now, return empty object
    return {};
  }

  private meetsFeatPrerequisites(progression: CharacterProgression, feat: Feat): boolean {
    for (const prereq of feat.prerequisites) {
      switch (prereq.type) {
        case 'ability_score':
          const ability = prereq.target as AbilityScore;
          if (progression.abilityScores[ability].total < (prereq.value as number)) {
            return false;
          }
          break;
          
        case 'class_level':
          if (progression.level < (prereq.value as number)) {
            return false;
          }
          break;
          
        case 'skill_proficiency':
          if (!progression.skillProficiencies.includes(prereq.target as any)) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  // Data Loading Methods
  private async getFeat(featId: string): Promise<Feat | null> {
    try {
      const doc = await firebaseService.db
        .collection('feats')
        .doc(featId)
        .get();
      
      return doc.exists ? (doc.data() as Feat) : null;
    } catch (error) {
      console.error('Error getting feat:', error);
      return null;
    }
  }

  private async getSkillTree(treeId: string): Promise<SkillTree | null> {
    try {
      const doc = await firebaseService.db
        .collection('skillTrees')
        .doc(treeId)
        .get();
      
      return doc.exists ? (doc.data() as SkillTree) : null;
    } catch (error) {
      console.error('Error getting skill tree:', error);
      return null;
    }
  }

  private async saveProgressionEvent(event: ProgressionEvent): Promise<void> {
    try {
      await firebaseService.db
        .collection('progressionEvents')
        .doc(event.id)
        .set(event);
    } catch (error) {
      console.error('Error saving progression event:', error);
      throw error;
    }
  }

  // Experience calculation helpers
  getCombatXP(challengeRating: number, partySize: number = 4): number {
    const baseXP: { [cr: number]: number } = {
      0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
      1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
      6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
      11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
      16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000
    };

    const xp = baseXP[challengeRating] || 0;
    return Math.floor(xp / partySize);
  }

  getRoleplayXP(difficulty: 'easy' | 'medium' | 'hard', characterLevel: number): number {
    const multipliers = { easy: 0.25, medium: 0.5, hard: 1.0 };
    const baseXP = characterLevel * 100;
    return Math.floor(baseXP * multipliers[difficulty]);
  }

  getDiscoveryXP(importance: 'minor' | 'major' | 'legendary', characterLevel: number): number {
    const multipliers = { minor: 0.1, major: 0.25, legendary: 0.5 };
    const baseXP = characterLevel * 100;
    return Math.floor(baseXP * multipliers[importance]);
  }
}

export const characterProgressionService = CharacterProgressionService.getInstance(); 