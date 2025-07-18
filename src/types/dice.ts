// Enhanced Dice Types for 3D System and Advanced Mechanics

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceConfig {
  sides: number;
  count: number;
  modifier?: number;
  advantage?: boolean; // Roll twice, take higher
  disadvantage?: boolean; // Roll twice, take lower
  exploding?: boolean; // Roll again on max value
  rerollOnes?: boolean; // Reroll 1s once
  rerollBelow?: number; // Reroll values below this number
  successThreshold?: number; // For success/failure dice pools
  criticalRange?: number; // Crit on this value or higher (default max)
  label?: string; // Custom label for the roll
}

export interface DiceRoll {
  id: string;
  config: DiceConfig;
  results: DiceResult[];
  total: number;
  timestamp: number;
  context?: string; // What the roll was for
  player?: string;
  metadata?: DiceRollMetadata;
}

export interface DiceResult {
  value: number;
  diceType: DiceType;
  isMax: boolean;
  isMin: boolean;
  isCritical: boolean;
  wasRerolled?: boolean;
  exploded?: boolean;
  discarded?: boolean; // For advantage/disadvantage
  position?: [number, number, number]; // 3D position when rolled
  rotation?: [number, number, number]; // Final 3D rotation
}

export interface DiceRollMetadata {
  rollType: 'attack' | 'damage' | 'skill' | 'save' | 'initiative' | 'custom';
  difficulty?: number; // Target number for skill checks
  success?: boolean; // Whether the roll succeeded
  margin?: number; // How much over/under the target
  advantage?: 'advantage' | 'disadvantage' | 'normal';
  bonuses?: string[]; // Sources of bonuses applied
  penalties?: string[]; // Sources of penalties applied
}

// 3D Dice Rendering Configuration
export interface Dice3DConfig {
  material: 'plastic' | 'metal' | 'wood' | 'crystal' | 'stone';
  color: string;
  size: number;
  physicsSolver?: 'cannon' | 'bullet';
  bounceForce?: number;
  spinForce?: number;
  surface?: 'felt' | 'wood' | 'metal' | 'marble';
}

// Dice Pool System (for games like Shadowrun, World of Darkness)
export interface DicePool {
  id: string;
  dice: DiceConfig[];
  target: number; // Target number for success
  threshold: number; // Number of successes needed
  results?: DicePoolResult;
}

export interface DicePoolResult {
  rolls: DiceRoll[];
  successes: number;
  failures: number;
  criticalSuccesses: number; // Usually on max value
  criticalFailures: number; // Usually on 1
  outcome: 'success' | 'failure' | 'critical_success' | 'critical_failure';
  margin: number; // Successes over/under threshold
}

// Preset dice configurations for common RPG systems
export const DICE_PRESETS = {
  D20_SYSTEM: {
    attack: { sides: 20, count: 1, label: 'Attack Roll' },
    damage: { sides: 8, count: 1, label: 'Damage' },
    skill: { sides: 20, count: 1, label: 'Skill Check' },
    save: { sides: 20, count: 1, label: 'Saving Throw' },
    initiative: { sides: 20, count: 1, label: 'Initiative' }
  },
  ADVANTAGE: {
    attack: { sides: 20, count: 2, advantage: true, label: 'Attack with Advantage' },
    skill: { sides: 20, count: 2, advantage: true, label: 'Skill with Advantage' }
  },
  DISADVANTAGE: {
    attack: { sides: 20, count: 2, disadvantage: true, label: 'Attack with Disadvantage' },
    skill: { sides: 20, count: 2, disadvantage: true, label: 'Skill with Disadvantage' }
  },
  SHADOWRUN: {
    skill: { sides: 6, count: 6, successThreshold: 5, label: 'Skill Test' },
    combat: { sides: 6, count: 8, successThreshold: 5, label: 'Combat Test' }
  },
  WORLD_OF_DARKNESS: {
    skill: { sides: 10, count: 5, successThreshold: 8, exploding: true, label: 'Skill Roll' },
    difficulty: { sides: 10, count: 6, successThreshold: 6, exploding: true, label: 'Difficult Task' }
  }
} as const;

// 3D Dice Materials and Themes
export const DICE_THEMES = {
  CLASSIC: {
    material: 'plastic' as const,
    colors: {
      d4: '#FF6B6B',
      d6: '#4ECDC4', 
      d8: '#45B7D1',
      d10: '#96CEB4',
      d12: '#FFEAA7',
      d20: '#DDA0DD',
      d100: '#FFB347'
    }
  },
  METAL: {
    material: 'metal' as const,
    colors: {
      d4: '#C0C0C0',
      d6: '#FFD700',
      d8: '#CD7F32',
      d10: '#E5E4E2',
      d12: '#B87333',
      d20: '#708090',
      d100: '#36454F'
    }
  },
  MYSTICAL: {
    material: 'crystal' as const,
    colors: {
      d4: '#9932CC',
      d6: '#00CED1',
      d8: '#FF1493',
      d10: '#32CD32',
      d12: '#FF4500',
      d20: '#8A2BE2',
      d100: '#DC143C'
    }
  }
} as const;

// Dice Rolling Animation Events
export interface DiceAnimationEvent {
  type: 'roll_start' | 'dice_thrown' | 'dice_settled' | 'roll_complete';
  diceId: string;
  timestamp: number;
  data?: any;
}

// Dice Sound Effects
export interface DiceSounds {
  throw: string; // Sound when dice are thrown
  bounce: string; // Sound when dice hit surface
  settle: string; // Sound when dice stop rolling
  critical: string; // Special sound for critical hits/failures
}

export const DEFAULT_DICE_SOUNDS: DiceSounds = {
  throw: '/sounds/dice-throw.mp3',
  bounce: '/sounds/dice-bounce.mp3', 
  settle: '/sounds/dice-settle.mp3',
  critical: '/sounds/dice-critical.mp3'
};

// Utility functions for dice calculations
export const calculateDiceTotal = (results: DiceResult[]): number => {
  return results
    .filter(result => !result.discarded)
    .reduce((sum, result) => sum + result.value, 0);
};

export const applyAdvantageDisadvantage = (results: DiceResult[]): DiceResult[] => {
  if (results.length !== 2) return results;
  
  const [first, second] = results;
  if (first.value > second.value) {
    return [first, { ...second, discarded: true }];
  } else {
    return [{ ...first, discarded: true }, second];
  }
};

export const checkCritical = (result: DiceResult, criticalRange: number = 20): boolean => {
  return result.value >= criticalRange;
};

export const shouldExplode = (result: DiceResult, config: DiceConfig): boolean => {
  return config.exploding === true && result.isMax;
};

export const shouldReroll = (result: DiceResult, config: DiceConfig): boolean => {
  if (config.rerollOnes && result.value === 1) return true;
  if (config.rerollBelow && result.value < config.rerollBelow) return true;
  return false;
}; 