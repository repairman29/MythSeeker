// Combat System Types for Turn-Based Tactical Combat

import { DiceRoll as EnhancedDiceRoll } from './dice';

export type CombatPhase = 'setup' | 'initiative' | 'combat' | 'resolution' | 'ended';
export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'movement' | 'free';
export type AttackType = 'melee' | 'ranged' | 'spell' | 'special';
export type DamageType = 'bludgeoning' | 'piercing' | 'slashing' | 'fire' | 'cold' | 'lightning' | 'thunder' | 'poison' | 'acid' | 'psychic' | 'radiant' | 'necrotic' | 'force';

// Core Combat Entities
export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'enemy' | 'ally';
  level: number;
  
  // Core Stats
  health: {
    current: number;
    maximum: number;
    temporary?: number;
  };
  
  // Ability Scores (D&D 5e style)
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  // Combat Stats
  armorClass: number;
  speed: number;
  proficiencyBonus: number;
  initiative: number;
  initiativeRoll?: EnhancedDiceRoll;
  
  // Position (grid-based)
  position: {
    x: number;
    y: number;
    z?: number; // For 3D combat
  };
  
  // Combat State
  conditions: CombatCondition[];
  concentratingOn?: Spell;
  reactions: {
    used: boolean;
    available: string[]; // Available reaction types
  };
  
  // Action Economy
  actions: {
    action: boolean; // Has used action
    bonusAction: boolean; // Has used bonus action
    movement: number; // Movement used this turn
    reactions: number; // Reactions used this round
  };
  
  // Equipment and Abilities
  weapons: Weapon[];
  spells: Spell[];
  features: CombatFeature[];
  
  // AI Behavior (for NPCs)
  aiPersonality?: {
    aggression: number; // 0-10
    strategy: 'aggressive' | 'defensive' | 'tactical' | 'protective' | 'random';
    priorities: string[]; // Target priorities
  };
}

// Combat Actions
export interface CombatAction {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  actionCost: ActionType;
  
  // Requirements
  requirements: {
    minimumLevel?: number;
    conditions?: string[];
    resources?: { [key: string]: number };
    range?: number;
    targets?: number;
  };
  
  // Effects
  effects: CombatEffect[];
  
  // Dice rolls involved
  attackRoll?: {
    bonus: number;
    advantage?: boolean;
    disadvantage?: boolean;
  };
  
  damageRolls?: DamageRoll[];
  savingThrow?: {
    ability: keyof Combatant['abilities'];
    dc: number;
    successEffect?: CombatEffect[];
    failureEffect?: CombatEffect[];
  };
}

// Weapons and Equipment
export interface Weapon {
  id: string;
  name: string;
  type: AttackType;
  damage: {
    dice: string; // e.g., "1d8"
    type: DamageType;
    bonus?: number;
  };
  properties: WeaponProperty[];
  range: {
    normal: number;
    maximum?: number;
  };
  attackBonus: number;
  criticalRange?: number; // Default 20
  criticalMultiplier?: number; // Default 2
}

export interface WeaponProperty {
  name: string;
  description: string;
  mechanical?: boolean; // Affects combat mechanics
}

// Spells and Magic
export interface Spell {
  id: string;
  name: string;
  level: number;
  school: 'abjuration' | 'conjuration' | 'divination' | 'enchantment' | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';
  
  castingTime: {
    type: ActionType;
    duration?: string; // For longer casting times
  };
  
  range: number | 'self' | 'touch';
  components: {
    verbal: boolean;
    somatic: boolean;
    material?: string;
  };
  
  duration: {
    type: 'instantaneous' | 'concentration' | 'permanent' | 'timed';
    length?: string; // e.g., "1 hour", "until dispelled"
  };
  
  description: string;
  effects: CombatEffect[];
  
  // Spell-specific mechanics
  attackRoll?: boolean;
  savingThrow?: {
    ability: keyof Combatant['abilities'];
    dc: number;
  };
  
  damageRolls?: DamageRoll[];
  areaOfEffect?: AreaOfEffect;
  upcastEffects?: { [level: number]: CombatEffect[] };
}

// Combat Effects and Conditions
export interface CombatEffect {
  type: 'damage' | 'healing' | 'condition' | 'movement' | 'stat_change' | 'special';
  value?: number;
  duration?: number; // In rounds
  
  // For damage/healing
  damageType?: DamageType;
  
  // For conditions
  condition?: string;
  
  // For stat changes
  stat?: string;
  modifier?: number;
  
  // For special effects
  special?: string;
  parameters?: { [key: string]: any };
}

export interface CombatCondition {
  name: string;
  description: string;
  duration: number; // Rounds remaining, -1 for permanent
  source: string; // What caused this condition
  effects: CombatEffect[];
  
  // Condition mechanics
  endsOnSave?: {
    ability: keyof Combatant['abilities'];
    dc: number;
    frequency: 'start_of_turn' | 'end_of_turn' | 'immediate';
  };
  
  stackable?: boolean;
  suppressedBy?: string[]; // Other conditions that suppress this one
}

// Damage and Rolls
export interface DamageRoll {
  dice: string; // e.g., "2d6"
  type: DamageType;
  bonus?: number;
  criticalDice?: string; // Additional dice on critical
}

export interface AttackResult {
  hit: boolean;
  critical: boolean;
  attackRoll: EnhancedDiceRoll;
  damageRolls: EnhancedDiceRoll[];
  totalDamage: number;
  damageTypes: { [type in DamageType]?: number };
}

// Area of Effect
export interface AreaOfEffect {
  type: 'sphere' | 'cube' | 'cylinder' | 'cone' | 'line';
  size: number; // Radius for sphere, side length for cube, etc.
  origin: 'caster' | 'point' | 'target';
}

// Combat Features (class abilities, racial traits, etc.)
export interface CombatFeature {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'reaction' | 'triggered';
  
  // Usage limitations
  uses?: {
    maximum: number;
    current: number;
    rechargeOn: 'short_rest' | 'long_rest' | 'dawn' | 'never';
  };
  
  // Trigger conditions (for reactions and triggered abilities)
  triggers?: string[];
  
  // Effects
  effects: CombatEffect[];
  modifiers?: StatModifier[];
}

export interface StatModifier {
  stat: string;
  value: number;
  type: 'bonus' | 'penalty' | 'set' | 'multiply';
  condition?: string; // When this modifier applies
}

// Combat Encounter Management
export interface CombatEncounter {
  id: string;
  name: string;
  description: string;
  phase: CombatPhase;
  round: number;
  currentTurn: number; // Index in turnOrder
  
  // Participants
  combatants: Combatant[];
  turnOrder: string[]; // Combatant IDs in initiative order
  
  // Environment
  battlefield: Battlefield;
  
  // Combat Rules
  rules: CombatRules;
  
  // History and Logs
  actionLog: CombatLogEntry[];
  damageDealt: { [combatantId: string]: number };
  
  // Victory Conditions
  victoryConditions: VictoryCondition[];
  
  // Metadata
  startTime: number;
  endTime?: number;
  experience?: number;
  loot?: string[];
}

export interface Battlefield {
  type: 'grid' | 'theater_of_mind' | 'hex';
  size: {
    width: number;
    height: number;
  };
  
  // Terrain and obstacles
  terrain: TerrainFeature[];
  obstacles: Obstacle[];
  
  // Environmental effects
  lighting: 'bright' | 'dim' | 'darkness' | 'magical_darkness';
  weather?: string;
  specialConditions?: string[];
}

export interface TerrainFeature {
  id: string;
  type: 'difficult' | 'hazardous' | 'cover' | 'special';
  positions: { x: number; y: number }[];
  effects: CombatEffect[];
  description: string;
}

export interface Obstacle {
  id: string;
  name: string;
  positions: { x: number; y: number }[];
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
  cover: 'none' | 'half' | 'three_quarters' | 'full';
  health?: number;
  armorClass?: number;
}

export interface CombatRules {
  // House rules and variants
  criticalHitRule: 'double_dice' | 'max_damage_plus_roll' | 'double_damage';
  initiativeVariant: 'standard' | 'group' | 'popcorn' | 'side';
  flanking: boolean;
  diagonalMovement: 'standard' | 'no_cost' | 'alternating';
  
  // Optional rules
  cleave: boolean; // Attack multiple enemies
  massiveHP: boolean; // Instant death at negative max HP
  lingering: boolean; // Concentration saves on damage
  
  // Time limits
  turnTimeLimit?: number; // Seconds per turn
  combatTimeLimit?: number; // Maximum rounds
}

export interface VictoryCondition {
  type: 'defeat_all' | 'defeat_specific' | 'survive_rounds' | 'reach_location' | 'custom';
  description: string;
  parameters?: { [key: string]: any };
  completed: boolean;
}

export interface CombatLogEntry {
  id: string;
  round: number;
  turn: number;
  timestamp: number;
  actor: string; // Combatant ID
  action: string;
  targets?: string[]; // Target combatant IDs
  results: {
    success: boolean;
    critical?: boolean;
    damage?: number;
    healing?: number;
    effects?: string[];
  };
  rolls?: EnhancedDiceRoll[];
  description: string;
}

// Combat AI and Automation
export interface CombatAI {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  
  // Decision making
  evaluateTargets: (combatant: Combatant, enemies: Combatant[]) => string[]; // Ordered by priority
  selectAction: (combatant: Combatant, context: CombatContext) => CombatAction;
  evaluatePosition: (combatant: Combatant, battlefield: Battlefield) => { x: number; y: number };
  
  // Behavior patterns
  useResources: boolean; // Will use limited-use abilities
  coordinateWithAllies: boolean;
  retreatWhenLow: boolean;
  protectAllies: boolean;
}

export interface CombatContext {
  encounter: CombatEncounter;
  allies: Combatant[];
  enemies: Combatant[];
  neutrals: Combatant[];
  availableActions: CombatAction[];
  threatAssessment: { [enemyId: string]: number };
}

// Utility types for combat calculations
export interface RangeCalculation {
  inRange: boolean;
  distance: number;
  requiresMovement: number;
  lineOfSight: boolean;
  cover: 'none' | 'half' | 'three_quarters' | 'full';
}

export interface MovementPath {
  valid: boolean;
  path: { x: number; y: number }[];
  cost: number;
  remainingMovement: number;
}

// Preset combat scenarios
export const COMBAT_PRESETS = {
  QUICK_SKIRMISH: {
    rules: {
      criticalHitRule: 'double_dice' as const,
      initiativeVariant: 'standard' as const,
      flanking: true,
      diagonalMovement: 'standard' as const,
      cleave: false,
      massiveHP: true,
      lingering: true,
      turnTimeLimit: 30
    },
    battlefield: {
      type: 'grid' as const,
      size: { width: 20, height: 20 },
      lighting: 'bright' as const
    }
  },
  
  EPIC_BATTLE: {
    rules: {
      criticalHitRule: 'max_damage_plus_roll' as const,
      initiativeVariant: 'group' as const,
      flanking: true,
      diagonalMovement: 'alternating' as const,
      cleave: true,
      massiveHP: false,
      lingering: true,
      turnTimeLimit: 60
    },
    battlefield: {
      type: 'grid' as const,
      size: { width: 40, height: 40 },
      lighting: 'dim' as const
    }
  },
  
  THEATER_OF_MIND: {
    rules: {
      criticalHitRule: 'double_dice' as const,
      initiativeVariant: 'popcorn' as const,
      flanking: false,
      diagonalMovement: 'standard' as const,
      cleave: false,
      massiveHP: true,
      lingering: true
    },
    battlefield: {
      type: 'theater_of_mind' as const,
      size: { width: 0, height: 0 },
      lighting: 'bright' as const
    }
  }
} as const;

// Event system for combat
export interface CombatEvent {
  type: 'turn_start' | 'turn_end' | 'round_start' | 'round_end' | 'combat_start' | 'combat_end' | 'damage_dealt' | 'healing_done' | 'condition_applied' | 'condition_removed';
  combatant?: string;
  data?: any;
  timestamp: number;
}

export type CombatEventHandler = (event: CombatEvent) => void; 