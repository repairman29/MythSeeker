export interface Experience {
  current: number;
  total: number;
  level: number;
  nextLevelXP: number;
  sources: ExperienceSource[];
}

export interface ExperienceSource {
  id: string;
  type: 'combat' | 'roleplay' | 'discovery' | 'quest' | 'milestone' | 'bonus';
  amount: number;
  description: string;
  timestamp: Date;
  sessionId?: string;
}

export interface LevelProgression {
  level: number;
  requiredXP: number;
  proficiencyBonus: number;
  features: string[];
  abilityScoreImprovement: boolean;
  spellSlots?: SpellSlotProgression;
  hitDie: string;
}

export interface SpellSlotProgression {
  [level: number]: number; // spell level -> number of slots
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  hitDie: string;
  primaryAbility: AbilityScore[];
  savingThrowProficiencies: AbilityScore[];
  skillChoices: number;
  availableSkills: Skill[];
  equipment: StartingEquipment[];
  spellcaster: SpellcastingInfo | null;
  progression: LevelProgression[];
  classFeatures: ClassFeature[];
}

export interface SpellcastingInfo {
  type: 'full' | 'half' | 'third' | 'warlock' | 'ritual';
  spellcastingAbility: AbilityScore;
  ritualCasting: boolean;
  spellcastingFocus: string[];
  cantripsKnown: number[];
  spellsKnown?: number[];
  spellsPrepared?: 'all' | 'modifier' | 'fixed';
}

export interface ClassFeature {
  id: string;
  name: string;
  description: string;
  level: number;
  type: 'passive' | 'active' | 'choice' | 'improvement';
  choices?: FeatureChoice[];
  prerequisites?: string[];
  uses?: FeatureUses;
}

export interface FeatureChoice {
  id: string;
  name: string;
  description: string;
  effects: FeatureEffect[];
}

export interface FeatureUses {
  type: 'short_rest' | 'long_rest' | 'per_day' | 'charges' | 'unlimited';
  amount: number | string; // number or formula like "proficiency_bonus"
  recharge: 'short_rest' | 'long_rest' | 'dawn' | 'never';
}

export interface FeatureEffect {
  type: 'stat_bonus' | 'skill_bonus' | 'damage_bonus' | 'resistance' | 'immunity' | 'advantage' | 'special';
  target: string;
  value: number | string;
  condition?: string;
}

export type AbilityScore = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export type Skill = 
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics' | 'deception' 
  | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine'
  | 'nature' | 'perception' | 'performance' | 'persuasion' | 'religion'
  | 'sleightOfHand' | 'stealth' | 'survival';

export interface StartingEquipment {
  item: string;
  quantity: number;
  alternative?: StartingEquipment[];
}

// Skill Tree System
export interface SkillTree {
  id: string;
  name: string;
  description: string;
  classId: string;
  nodes: SkillNode[];
  layout: SkillTreeLayout;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'ability' | 'passive' | 'upgrade' | 'prerequisite';
  tier: number;
  cost: number;
  prerequisites: string[];
  effects: NodeEffect[];
  position: { x: number; y: number };
  unlocked: boolean;
  purchased: boolean;
}

export interface NodeEffect {
  type: 'stat_increase' | 'new_ability' | 'modify_ability' | 'unlock_spell' | 'bonus_action' | 'reaction';
  target: string;
  value: any;
  description: string;
}

export interface SkillTreeLayout {
  tiers: number;
  maxNodesPerTier: number;
  connections: NodeConnection[];
}

export interface NodeConnection {
  from: string;
  to: string;
  type: 'prerequisite' | 'enhancement' | 'alternative';
}

// Feat System
export interface Feat {
  id: string;
  name: string;
  description: string;
  prerequisites: FeatPrerequisite[];
  effects: FeatEffect[];
  type: 'combat' | 'utility' | 'social' | 'magic' | 'racial';
  source: string;
  repeatable: boolean;
}

export interface FeatPrerequisite {
  type: 'ability_score' | 'skill_proficiency' | 'class_level' | 'race' | 'feat' | 'spell';
  target: string;
  value: number | string;
}

export interface FeatEffect {
  type: 'ability_increase' | 'skill_proficiency' | 'new_ability' | 'spell_access' | 'bonus';
  target: string;
  value: any;
  description: string;
}

// Character Progression State
export interface CharacterProgression {
  characterId: string;
  experience: Experience;
  level: number;
  class: CharacterClass;
  hitPoints: {
    max: number;
    current: number;
    temporary: number;
  };
  abilityScores: {
    [key in AbilityScore]: {
      base: number;
      racial: number;
      improvement: number;
      equipment: number;
      temporary: number;
      total: number;
    };
  };
  skillProficiencies: Skill[];
  skillExpertise: Skill[];
  feats: string[];
  classFeatures: string[];
  skillTreeProgress: {
    [treeId: string]: {
      unlockedNodes: string[];
      purchasedNodes: string[];
      availablePoints: number;
      totalPointsSpent: number;
    };
  };
  abilityScoreImprovements: {
    level: number;
    choices: AbilityScoreChoice[];
  }[];
}

export interface AbilityScoreChoice {
  type: 'increase' | 'feat';
  abilityScore?: AbilityScore;
  featId?: string;
}

// Progression Events
export interface ProgressionEvent {
  id: string;
  type: 'level_up' | 'feat_gained' | 'skill_tree_unlock' | 'ability_improvement';
  characterId: string;
  timestamp: Date;
  details: any;
  processed: boolean;
}

// Level Up Data
export interface LevelUpData {
  newLevel: number;
  hitPointIncrease: number;
  newFeatures: ClassFeature[];
  abilityScoreImprovement: boolean;
  featChoice: boolean;
  skillTreePoints: number;
  spellSlotsGained: { [level: number]: number };
  spellsLearned: string[];
}

// Preset Classes (D&D 5e)
export const DND5E_CLASSES: { [key: string]: CharacterClass } = {
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    description: 'A master of martial combat, skilled with a variety of weapons and armor.',
    hitDie: 'd10',
    primaryAbility: ['strength', 'dexterity'],
    savingThrowProficiencies: ['strength', 'constitution'],
    skillChoices: 2,
    availableSkills: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
    equipment: [
      { item: 'Chain Mail', quantity: 1 },
      { item: 'Shield', quantity: 1 },
      { item: 'Longsword', quantity: 1 }
    ],
    spellcaster: null,
    progression: [], // Will be populated with detailed progression
    classFeatures: []
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    description: 'A scholarly magic-user capable of manipulating the structures of spellcasting.',
    hitDie: 'd6',
    primaryAbility: ['intelligence'],
    savingThrowProficiencies: ['intelligence', 'wisdom'],
    skillChoices: 2,
    availableSkills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    equipment: [
      { item: 'Spellbook', quantity: 1 },
      { item: 'Dagger', quantity: 1 },
      { item: 'Component Pouch', quantity: 1 }
    ],
    spellcaster: {
      type: 'full',
      spellcastingAbility: 'intelligence',
      ritualCasting: true,
      spellcastingFocus: ['arcane focus', 'spellbook'],
      cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      spellsPrepared: 'modifier'
    },
    progression: [],
    classFeatures: []
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    description: 'A scoundrel who uses stealth and trickery to accomplish goals.',
    hitDie: 'd8',
    primaryAbility: ['dexterity'],
    savingThrowProficiencies: ['dexterity', 'intelligence'],
    skillChoices: 4,
    availableSkills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'],
    equipment: [
      { item: 'Leather Armor', quantity: 1 },
      { item: 'Shortsword', quantity: 2 },
      { item: 'Thieves\' Tools', quantity: 1 }
    ],
    spellcaster: null,
    progression: [],
    classFeatures: []
  }
};

// XP Table (D&D 5e)
export const XP_TABLE: { [level: number]: number } = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000
};

// Utility functions
export function getXPForLevel(level: number): number {
  return XP_TABLE[level] || 0;
}

export function getLevelFromXP(xp: number): number {
  for (let level = 20; level >= 1; level--) {
    if (xp >= getXPForLevel(level)) {
      return level;
    }
  }
  return 1;
}

export function getXPToNextLevel(currentXP: number): number {
  const currentLevel = getLevelFromXP(currentXP);
  const nextLevel = Math.min(currentLevel + 1, 20);
  return getXPForLevel(nextLevel) - currentXP;
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
} 