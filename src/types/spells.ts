// Comprehensive Spell System Types

import { DiceRoll as EnhancedDiceRoll } from './dice';
import { CombatEffect, DamageType, AreaOfEffect } from './combat';

export type SpellSchool = 'abjuration' | 'conjuration' | 'divination' | 'enchantment' | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';
export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 0 = cantrip
export type CastingTime = 'action' | 'bonus_action' | 'reaction' | 'ritual' | 'long';
export type SpellDuration = 'instantaneous' | 'concentration' | 'permanent' | 'timed';
export type SpellRange = number | 'self' | 'touch' | 'sight' | 'unlimited';
export type ComponentType = 'verbal' | 'somatic' | 'material';

// Core Spell Definition
export interface Spell {
  id: string;
  name: string;
  level: SpellLevel;
  school: SpellSchool;
  
  // Casting mechanics
  castingTime: {
    type: CastingTime;
    duration?: string; // For longer casting times like "1 minute"
    condition?: string; // For reactions like "when you take damage"
  };
  
  range: {
    type: SpellRange;
    distance?: number; // In feet, if range is number
  };
  
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialComponent?: string; // Description of material component
    materialCost?: number; // GP cost if consumed
    consumed?: boolean; // Whether component is consumed
    focus?: boolean; // Can use spellcasting focus instead
  };
  
  duration: {
    type: SpellDuration;
    length?: string; // e.g., "1 hour", "until dispelled"
    concentration?: boolean;
  };
  
  // Spell mechanics
  description: string;
  higherLevelDescription?: string; // Effects when cast at higher levels
  
  // Combat effects
  effects: SpellEffect[];
  
  // Targeting
  targets: {
    type: 'single' | 'multiple' | 'area' | 'self' | 'special';
    count?: number; // Number of targets if multiple
    restrictions?: string[]; // Target restrictions like "willing creature"
  };
  
  areaOfEffect?: AreaOfEffect;
  
  // Spell attack/save mechanics
  spellAttack?: {
    type: 'melee' | 'ranged';
    bonus?: number; // Additional bonus beyond spellcasting modifier
  };
  
  savingThrow?: {
    ability: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
    halfDamageOnSave?: boolean;
    noEffectOnSave?: boolean;
  };
  
  // Damage and healing
  damage?: SpellDamage[];
  healing?: SpellHealing[];
  
  // Scaling with spell level
  upcastScaling?: UpcastScaling;
  
  // Special properties
  ritual?: boolean; // Can be cast as ritual
  concentration?: boolean; // Requires concentration
  tags?: string[]; // Spell tags for categorization
  
  // Source and availability
  source: string; // Spell source (PHB, etc.)
  classes: string[]; // Classes that have access to this spell
  
  // Visual and audio effects
  visualEffect?: {
    color?: string;
    shape?: string;
    animation?: string;
  };
  
  soundEffect?: string;
}

// Spell effects that can be applied
export interface SpellEffect extends CombatEffect {
  // Additional spell-specific properties
  scalingDice?: string; // How damage scales with spell level
  scalingModifier?: number; // Fixed scaling amount
  condition?: SpellCondition;
  summon?: SummonedCreature;
  teleport?: TeleportEffect;
  transform?: TransformEffect;
}

// Spell damage definition
export interface SpellDamage {
  dice: string; // e.g., "3d6"
  type: DamageType;
  modifier?: number; // Add spellcasting modifier
  scalingDice?: string; // Additional dice per spell level above base
  scalingModifier?: number; // Additional flat damage per spell level
}

// Spell healing definition
export interface SpellHealing {
  dice: string; // e.g., "2d4"
  modifier?: number; // Add spellcasting modifier
  scalingDice?: string;
  scalingModifier?: number;
  temporaryHP?: boolean; // Grants temporary HP instead of healing
}

// How spells scale when cast at higher levels
export interface UpcastScaling {
  type: 'damage' | 'healing' | 'targets' | 'duration' | 'area' | 'special';
  amount: string; // e.g., "+1d6 damage", "+1 target", "double duration"
  interval: number; // Every X spell levels (usually 1)
}

// Spell conditions (different from combat conditions)
export interface SpellCondition {
  name: string;
  description: string;
  effects: CombatEffect[];
  duration: {
    type: 'rounds' | 'minutes' | 'hours' | 'days' | 'permanent';
    amount?: number;
  };
  savingThrow?: {
    ability: string;
    frequency: 'start_of_turn' | 'end_of_turn' | 'once_per_round';
    dc?: number; // Override spell save DC
  };
}

// Summoned creatures
export interface SummonedCreature {
  name: string;
  statBlock: any; // Reference to creature stats
  duration: string;
  control: 'friendly' | 'allied' | 'hostile' | 'uncontrolled';
  scaling?: {
    property: string; // What scales (HP, damage, etc.)
    amount: string; // How it scales
  };
}

// Teleportation effects
export interface TeleportEffect {
  range: number;
  restrictions?: string[];
  bringTargets?: boolean;
  requiresLineOfSight?: boolean;
  accuracyCheck?: boolean;
}

// Transformation effects
export interface TransformEffect {
  targetType: string; // What the target becomes
  duration: string;
  retainsMentalStats?: boolean;
  retainsEquipment?: boolean;
  newStatBlock?: any;
}

// Spell slots and preparation
export interface SpellSlot {
  level: SpellLevel;
  total: number;
  used: number;
  expended: number; // Used + expended should not exceed total
}

export interface SpellcastingAbility {
  ability: 'intelligence' | 'wisdom' | 'charisma';
  modifier: number;
  spellAttackBonus: number;
  spellSaveDC: number;
  proficiencyBonus: number;
}

// Character's spellcasting information
export interface Spellcaster {
  id: string;
  class: string;
  level: number;
  
  // Spellcasting ability
  spellcastingAbility: SpellcastingAbility;
  
  // Spell slots
  spellSlots: SpellSlot[];
  
  // Known/prepared spells
  knownSpells: string[]; // Spell IDs
  preparedSpells: string[]; // Subset of known spells (for prepared casters)
  
  // Spellcasting features
  ritualCasting: boolean;
  spellcastingFocus: boolean;
  
  // Special abilities
  metamagic?: MetamagicOption[];
  cantripsKnown: number;
  spellsKnown?: number; // For known casters
  
  // Concentration
  concentratingOn?: {
    spellId: string;
    level: SpellLevel;
    startTime: number;
    duration: number;
  };
}

// Metamagic options (Sorcerer feature)
export interface MetamagicOption {
  name: string;
  description: string;
  cost: number; // Sorcery points cost
  applicableSpells: string[]; // Which spells this can be applied to
  effect: (spell: Spell, level: SpellLevel) => Spell; // How it modifies the spell
}

// Spell casting results
export interface SpellcastingResult {
  success: boolean;
  spell: Spell;
  level: SpellLevel;
  caster: Spellcaster;
  targets: string[]; // Target IDs
  
  // Rolls made
  attackRolls?: EnhancedDiceRoll[];
  damageRolls?: EnhancedDiceRoll[];
  healingRolls?: EnhancedDiceRoll[];
  
  // Effects applied
  effectsApplied: SpellEffect[];
  
  // Resource consumption
  slotUsed?: SpellLevel;
  componentsConsumed?: string[];
  
  // Special results
  critical?: boolean;
  upcast?: boolean;
  metamagic?: string[];
  
  timestamp: number;
}

// Concentration management
export interface ConcentrationCheck {
  damage: number;
  dc: number; // 10 or half damage, whichever is higher
  result: EnhancedDiceRoll;
  success: boolean;
  spell: string; // Spell being concentrated on
}

// Spell preparation and learning
export interface SpellProgression {
  class: string;
  level: number;
  cantripsKnown: number;
  spellsKnown?: number;
  spellSlots: { [level: number]: number };
  spellsPerDay?: { [level: number]: number }; // For older edition compatibility
}

// Common spell databases
export const CANTRIPS: Spell[] = [
  {
    id: 'fire_bolt',
    name: 'Fire Bolt',
    level: 0,
    school: 'evocation',
    castingTime: { type: 'action' },
    range: { type: 120 },
    components: { verbal: true, somatic: true, material: false },
    duration: { type: 'instantaneous' },
    description: 'You hurl a mote of fire at a creature or object within range.',
    effects: [],
    targets: { type: 'single' },
    spellAttack: { type: 'ranged' },
    damage: [{ dice: '1d10', type: 'fire' }],
    upcastScaling: { type: 'damage', amount: '+1d10', interval: 5 }, // Cantrip scaling at 5th, 11th, 17th
    source: 'PHB',
    classes: ['sorcerer', 'wizard']
  },
  
  {
    id: 'mage_hand',
    name: 'Mage Hand',
    level: 0,
    school: 'conjuration',
    castingTime: { type: 'action' },
    range: { type: 30 },
    components: { verbal: true, somatic: true, material: false },
    duration: { type: 'concentration', length: '1 minute', concentration: true },
    description: 'A spectral, floating hand appears at a point you choose within range.',
    effects: [
      {
        type: 'special',
        special: 'summon_mage_hand',
        parameters: { weight: 10, range: 30 }
      }
    ],
    targets: { type: 'special' },
    source: 'PHB',
    classes: ['bard', 'sorcerer', 'warlock', 'wizard']
  }
];

export const FIRST_LEVEL_SPELLS: Spell[] = [
  {
    id: 'magic_missile',
    name: 'Magic Missile',
    level: 1,
    school: 'evocation',
    castingTime: { type: 'action' },
    range: { type: 120 },
    components: { verbal: true, somatic: true, material: false },
    duration: { type: 'instantaneous' },
    description: 'You create three glowing darts of magical force.',
    effects: [],
    targets: { type: 'multiple', count: 3 },
    damage: [{ dice: '1d4', type: 'force', modifier: 1 }],
    upcastScaling: { type: 'damage', amount: '+1 dart', interval: 1 },
    source: 'PHB',
    classes: ['sorcerer', 'wizard']
  },
  
  {
    id: 'healing_word',
    name: 'Healing Word',
    level: 1,
    school: 'evocation',
    castingTime: { type: 'bonus_action' },
    range: { type: 60 },
    components: { verbal: true, somatic: false, material: false },
    duration: { type: 'instantaneous' },
    description: 'A creature of your choice that you can see within range regains hit points.',
    effects: [],
    targets: { type: 'single' },
    healing: [{ dice: '1d4', modifier: 1 }],
    upcastScaling: { type: 'healing', amount: '+1d4', interval: 1 },
    source: 'PHB',
    classes: ['bard', 'cleric', 'druid']
  },
  
  {
    id: 'fireball',
    name: 'Fireball',
    level: 3,
    school: 'evocation',
    castingTime: { type: 'action' },
    range: { type: 150 },
    components: { verbal: true, somatic: true, material: true, materialComponent: 'a tiny ball of bat guano and sulfur' },
    duration: { type: 'instantaneous' },
    description: 'A bright flash of fire expands from a point you choose within range.',
    effects: [],
    targets: { type: 'area' },
    areaOfEffect: { type: 'sphere', size: 20, origin: 'point' },
    savingThrow: { ability: 'dexterity', halfDamageOnSave: true },
    damage: [{ dice: '8d6', type: 'fire' }],
    upcastScaling: { type: 'damage', amount: '+1d6', interval: 1 },
    source: 'PHB',
    classes: ['sorcerer', 'wizard']
  }
];

// Spell school properties and themes
export const SPELL_SCHOOL_INFO = {
  abjuration: {
    name: 'Abjuration',
    description: 'Protective magic and barriers',
    color: '#4A90E2',
    icon: '🛡️',
    keywords: ['protection', 'barrier', 'ward', 'dispel']
  },
  conjuration: {
    name: 'Conjuration',
    description: 'Summoning and creation magic',
    color: '#7ED321',
    icon: '✨',
    keywords: ['summon', 'create', 'teleport', 'dimension']
  },
  divination: {
    name: 'Divination',
    description: 'Information and foresight magic',
    color: '#F5A623',
    icon: '👁️',
    keywords: ['detect', 'scry', 'foresee', 'reveal']
  },
  enchantment: {
    name: 'Enchantment',
    description: 'Mind-affecting magic',
    color: '#BD10E0',
    icon: '💫',
    keywords: ['charm', 'compel', 'dominate', 'mind']
  },
  evocation: {
    name: 'Evocation',
    description: 'Energy and damage magic',
    color: '#D0021B',
    icon: '⚡',
    keywords: ['damage', 'energy', 'force', 'elemental']
  },
  illusion: {
    name: 'Illusion',
    description: 'Deception and misdirection magic',
    color: '#9013FE',
    icon: '🎭',
    keywords: ['illusion', 'invisible', 'disguise', 'phantom']
  },
  necromancy: {
    name: 'Necromancy',
    description: 'Death and undeath magic',
    color: '#4A4A4A',
    icon: '💀',
    keywords: ['death', 'undead', 'drain', 'animate']
  },
  transmutation: {
    name: 'Transmutation',
    description: 'Transformation magic',
    color: '#50E3C2',
    icon: '🔄',
    keywords: ['transform', 'alter', 'enhance', 'polymorph']
  }
} as const;

// Utility functions for spell management
export const getSpellAttackBonus = (caster: Spellcaster): number => {
  return caster.spellcastingAbility.spellAttackBonus;
};

export const getSpellSaveDC = (caster: Spellcaster): number => {
  return caster.spellcastingAbility.spellSaveDC;
};

export const canCastSpell = (caster: Spellcaster, spell: Spell, level: SpellLevel): boolean => {
  // Check if spell is known/prepared
  if (!caster.knownSpells.includes(spell.id)) return false;
  if (caster.preparedSpells.length > 0 && !caster.preparedSpells.includes(spell.id)) return false;
  
  // Check spell slot availability
  if (spell.level > 0) {
    const slot = caster.spellSlots.find(s => s.level === level && s.level >= spell.level);
    return slot ? slot.used < slot.total : false;
  }
  
  return true; // Cantrips can always be cast
};

export const getAvailableSpellSlots = (caster: Spellcaster, minimumLevel: SpellLevel): SpellSlot[] => {
  return caster.spellSlots.filter(slot => 
    slot.level >= minimumLevel && slot.used < slot.total
  );
};

export const consumeSpellSlot = (caster: Spellcaster, level: SpellLevel): boolean => {
  const slot = caster.spellSlots.find(s => s.level === level);
  if (slot && slot.used < slot.total) {
    slot.used++;
    return true;
  }
  return false;
};

export const calculateSpellDamage = (spell: Spell, level: SpellLevel, casterModifier: number): string => {
  if (!spell.damage || spell.damage.length === 0) return '';
  
  const baseDamage = spell.damage[0];
  let dice = baseDamage.dice;
  let modifier = (baseDamage.modifier ? casterModifier : 0) + (baseDamage.modifier || 0);
  
  // Apply upcast scaling
  if (spell.upcastScaling && level > spell.level) {
    const levelsAboveBase = level - spell.level;
    const scalingInterval = spell.upcastScaling.interval;
    const scalingAmount = Math.floor(levelsAboveBase / scalingInterval);
    
    if (spell.upcastScaling.type === 'damage' && baseDamage.scalingDice) {
      const scalingDiceMatch = baseDamage.scalingDice.match(/(\d+)d(\d+)/);
      if (scalingDiceMatch) {
        const scalingCount = parseInt(scalingDiceMatch[1]) * scalingAmount;
        const scalingSides = scalingDiceMatch[2];
        
        const baseDiceMatch = dice.match(/(\d+)d(\d+)/);
        if (baseDiceMatch) {
          const baseCount = parseInt(baseDiceMatch[1]);
          const baseSides = baseDiceMatch[2];
          dice = `${baseCount + scalingCount}d${baseSides}`;
        }
      }
    }
    
    if (baseDamage.scalingModifier) {
      modifier += baseDamage.scalingModifier * scalingAmount;
    }
  }
  
  return modifier > 0 ? `${dice}+${modifier}` : dice;
}; 