import spellsData from '../data/dnd5e/spells.json';
import monstersData from '../data/dnd5e/monsters.json';

// Types for the rules engine
export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  higherLevels?: string;
  damage?: {
    type: string;
    dice: string;
    modifier?: number | string;
    scaling?: any;
  };
  healing?: {
    dice: string;
    modifier: string;
    scaling: string;
  };
  savingThrow?: string;
  classes: string[];
  automation: {
    type: string;
    [key: string]: any;
  };
}

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  health: number;
  maxHealth: number;
  armorClass: number;
  proficiencyBonus: number;
  spellcastingAbility?: string;
  spellSlots?: Record<number, number>;
  knownSpells?: string[];
  skills?: Record<string, number>;
  savingThrows?: Record<string, number>;
}

export interface Monster {
  id: string;
  name: string;
  size: string;
  type: string;
  armorClass: number;
  hitPoints: number;
  hitDice?: string;
  speed: Record<string, number>;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
  languages?: string[];
  challengeRating: number;
  proficiencyBonus: number;
  abilities?: any[];
  actions?: any[];
  legendaryActions?: any[];
}

export interface CombatAction {
  type: 'attack' | 'spell' | 'skill' | 'move' | 'item' | 'other';
  actorId: string;
  targetId?: string;
  spellId?: string;
  weaponId?: string;
  itemId?: string;
  position?: { x: number; y: number };
  description: string;
}

export interface RollResult {
  total: number;
  rolls: number[];
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
  critical?: boolean;
  success?: boolean;
  description: string;
}

export interface EncounterDifficulty {
  easy: number;
  medium: number;
  hard: number;
  deadly: number;
}

export interface AttackResult {
  hit: boolean;
  critical: boolean;
  damage: number;
  damageType: string;
  additionalEffects?: string[];
  rollDetails: RollResult[];
}

export class RulesEngine {
  private spells: Map<string, Spell>;
  private monsters: Map<string, Monster>;
  
  // Experience point thresholds by character level
  private static readonly XP_THRESHOLDS: Record<number, EncounterDifficulty> = {
    1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
    2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
    3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
    4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
    5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
    6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
    7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
    8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
    9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
    10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
    11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
    12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
    13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
    14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
    15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
    16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
    17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
    18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
    19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
    20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 }
  };

  // CR to XP mapping
  private static readonly CR_TO_XP: Record<number, number> = {
    0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
    1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
    6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
    11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
    16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
    21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
    26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000
  };
  
  constructor() {
    this.spells = new Map();
    this.monsters = new Map();
    this.loadSpells();
    this.loadMonsters();
  }

  private loadSpells(): void {
    const spellsJson = spellsData as any;
    for (const [spellId, spellData] of Object.entries(spellsJson.spells)) {
      this.spells.set(spellId, spellData as Spell);
    }
  }

  private loadMonsters(): void {
    const monstersJson = monstersData as any;
    for (const [monsterId, monsterData] of Object.entries(monstersJson.monsters)) {
      this.monsters.set(monsterId, monsterData as Monster);
    }
  }

  // Core dice rolling mechanics
  rollDice(sides: number, count: number = 1, modifier: number = 0, advantage: boolean = false, disadvantage: boolean = false): RollResult {
    const rolls: number[] = [];
    
    if (advantage || disadvantage) {
      // Roll twice for advantage/disadvantage
      const roll1 = Math.floor(Math.random() * sides) + 1;
      const roll2 = Math.floor(Math.random() * sides) + 1;
      
      if (advantage) {
        rolls.push(Math.max(roll1, roll2));
      } else {
        rolls.push(Math.min(roll1, roll2));
      }
    } else {
      // Normal rolls
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
    }
    
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
    const critical = sides === 20 && rolls.some(roll => roll === 20);
    
    return {
      total,
      rolls,
      modifier,
      advantage,
      disadvantage,
      critical,
      description: this.formatRollDescription(rolls, modifier, advantage, disadvantage, critical)
    };
  }

  private formatRollDescription(rolls: number[], modifier: number, advantage: boolean, disadvantage: boolean, critical: boolean): string {
    let desc = `Rolled: ${rolls.join(', ')}`;
    if (modifier !== 0) {
      desc += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
    }
    if (advantage) desc += ' (Advantage)';
    if (disadvantage) desc += ' (Disadvantage)';
    if (critical) desc += ' (Critical!)';
    return desc;
  }

  // Ability score modifiers
  getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  // Proficiency bonus by level
  getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  }

  // Skill checks
  rollSkillCheck(character: Character, skill: string, dc: number, advantage: boolean = false, disadvantage: boolean = false): RollResult {
    const skillToAbility: Record<string, keyof Character['stats']> = {
      'acrobatics': 'dexterity',
      'animal_handling': 'wisdom',
      'arcana': 'intelligence',
      'athletics': 'strength',
      'deception': 'charisma',
      'history': 'intelligence',
      'insight': 'wisdom',
      'intimidation': 'charisma',
      'investigation': 'intelligence',
      'medicine': 'wisdom',
      'nature': 'intelligence',
      'perception': 'wisdom',
      'performance': 'charisma',
      'persuasion': 'charisma',
      'religion': 'intelligence',
      'sleight_of_hand': 'dexterity',
      'stealth': 'dexterity',
      'survival': 'wisdom'
    };

    const ability = skillToAbility[skill] || 'dexterity';
    const abilityModifier = this.getAbilityModifier(character.stats[ability]);
    const proficiencyBonus = character.proficiencyBonus || this.getProficiencyBonus(character.level);
    
    // Assume proficiency for now - in real implementation, check character's proficiencies
    const modifier = abilityModifier + proficiencyBonus;
    
    const result = this.rollDice(20, 1, modifier, advantage, disadvantage);
    result.success = result.total >= dc;
    result.description += ` vs DC ${dc} - ${result.success ? 'Success!' : 'Failure'}`;
    
    return result;
  }

  // Saving throws
  rollSavingThrow(character: Character, ability: keyof Character['stats'], dc: number, advantage: boolean = false, disadvantage: boolean = false): RollResult {
    const abilityModifier = this.getAbilityModifier(character.stats[ability]);
    const proficiencyBonus = character.proficiencyBonus || this.getProficiencyBonus(character.level);
    
    // In real implementation, check if character has proficiency in this save
    const modifier = abilityModifier + proficiencyBonus;
    
    const result = this.rollDice(20, 1, modifier, advantage, disadvantage);
    result.success = result.total >= dc;
    result.description = `${ability.charAt(0).toUpperCase() + ability.slice(1)} Save: ${result.description} vs DC ${dc} - ${result.success ? 'Success!' : 'Failure'}`;
    
    return result;
  }

  // Attack rolls
  rollAttack(attacker: Character, target: Character | Monster, weaponBonus: number = 0, advantage: boolean = false, disadvantage: boolean = false): RollResult {
    const abilityModifier = this.getAbilityModifier(attacker.stats.strength); // Simplified - would check weapon type
    const proficiencyBonus = attacker.proficiencyBonus || this.getProficiencyBonus(attacker.level);
    const modifier = abilityModifier + proficiencyBonus + weaponBonus;
    
    const result = this.rollDice(20, 1, modifier, advantage, disadvantage);
    const targetAC = target.armorClass;
    result.success = result.total >= targetAC;
    result.description = `Attack Roll: ${result.description} vs AC ${targetAC} - ${result.success ? 'Hit!' : 'Miss'}`;
    
    return result;
  }

  // Damage rolls
  rollDamage(damageDice: string, modifier: number = 0, critical: boolean = false): RollResult {
    const diceRegex = /(\d+)d(\d+)/g;
    const matches = [...damageDice.matchAll(diceRegex)];
    
    let totalDamage = 0;
    let allRolls: number[] = [];
    let description = '';

    for (const match of matches) {
      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);
      const multiplier = critical ? 2 : 1; // Double dice on crit
      
      const rolls: number[] = [];
      for (let i = 0; i < count * multiplier; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      
      allRolls.push(...rolls);
      totalDamage += rolls.reduce((sum, roll) => sum + roll, 0);
      description += `${count}d${sides}${critical ? ' (Crit)' : ''}: ${rolls.join(', ')} `;
    }
    
    totalDamage += modifier;
    if (modifier !== 0) {
      description += `${modifier >= 0 ? '+' : ''}${modifier}`;
    }
    
    return {
      total: totalDamage,
      rolls: allRolls,
      modifier,
      critical,
      description: `Damage: ${description} = ${totalDamage}`
    };
  }

  // Spell casting
  castSpell(caster: Character, spellId: string, target?: Character | Monster, slotLevel?: number): any {
    const spell = this.spells.get(spellId);
    if (!spell) {
      throw new Error(`Spell ${spellId} not found`);
    }

    const effectiveLevel = slotLevel || spell.level;
    const spellcastingModifier = this.getSpellcastingModifier(caster);
    const results: any = {
      spell: spell.name,
      level: effectiveLevel,
      success: true,
      effects: []
    };

    switch (spell.automation.type) {
      case 'damage_spell': {
        if (target && spell.savingThrow) {
          const dc = 8 + caster.proficiencyBonus + spellcastingModifier;
          const saveResult = this.rollSavingThrow(target as Character, spell.savingThrow as keyof Character['stats'], dc);
          results.savingThrow = saveResult;
          
          if (spell.damage) {
            const damageResult = this.rollSpellDamage(spell, effectiveLevel, !saveResult.success);
            results.damage = damageResult;
            
            if (spell.automation.saveForHalf && saveResult.success) {
              results.damage.total = Math.floor(results.damage.total / 2);
              results.damage.description += ' (Half damage on save)';
            }
          }
        }
        break;
      }
      case 'healing_spell': {
        if (spell.healing) {
          const healingResult = this.rollSpellHealing(spell, effectiveLevel, spellcastingModifier);
          results.healing = healingResult;
        }
        break;
      }
      case 'auto_hit_spell': {
        if (spell.damage) {
          const damageResult = this.rollSpellDamage(spell, effectiveLevel, false);
          results.damage = damageResult;
        }
        break;
      }
      default:
        break;
    }

    return results;
  }

  private getSpellcastingModifier(character: Character): number {
    const spellcastingAbility = character.spellcastingAbility || 'intelligence';
    return this.getAbilityModifier(character.stats[spellcastingAbility as keyof Character['stats']]);
  }

  private rollSpellDamage(spell: Spell, slotLevel: number, critical: boolean = false): RollResult {
    if (!spell.damage) {
      throw new Error('Spell has no damage component');
    }

    let baseDice = spell.damage.dice;
    let modifier = 0;

    // Handle scaling
    if (spell.damage.scaling && slotLevel > spell.level) {
      const extraLevels = slotLevel - spell.level;
      if (typeof spell.damage.scaling === 'string' && spell.damage.scaling.includes('+1d')) {
        const diceMatch = spell.damage.dice.match(/(\d+)d(\d+)/);
        if (diceMatch) {
          const baseDiceCount = parseInt(diceMatch[1]);
          const diceType = diceMatch[2];
          baseDice = `${baseDiceCount + extraLevels}d${diceType}`;
        }
      }
    }

    if (typeof spell.damage.modifier === 'number') {
      modifier = spell.damage.modifier;
    }

    return this.rollDamage(baseDice, modifier, critical);
  }

  private rollSpellHealing(spell: Spell, slotLevel: number, spellcastingModifier: number): RollResult {
    if (!spell.healing) {
      throw new Error('Spell has no healing component');
    }

    let baseDice = spell.healing.dice;
    let modifier = spellcastingModifier;

    // Handle scaling
    if (spell.healing.scaling && slotLevel > spell.level) {
      const extraLevels = slotLevel - spell.level;
      if (spell.healing.scaling.includes('+1d')) {
        const diceMatch = spell.healing.dice.match(/(\d+)d(\d+)/);
        if (diceMatch) {
          const baseDiceCount = parseInt(diceMatch[1]);
          const diceType = diceMatch[2];
          baseDice = `${baseDiceCount + extraLevels}d${diceType}`;
        }
      }
    }

    const result = this.rollDamage(baseDice, modifier, false);
    result.description = result.description.replace('Damage:', 'Healing:');
    return result;
  }

  // Difficulty Class calculations
  calculateSpellSaveDC(caster: Character): number {
    const spellcastingModifier = this.getSpellcastingModifier(caster);
    const proficiencyBonus = caster.proficiencyBonus || this.getProficiencyBonus(caster.level);
    return 8 + proficiencyBonus + spellcastingModifier;
  }

  calculateSkillDC(difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'very_hard' | 'nearly_impossible'): number {
    const dcMap = {
      'trivial': 5,
      'easy': 10,
      'medium': 15,
      'hard': 20,
      'very_hard': 25,
      'nearly_impossible': 30
    };
    return dcMap[difficulty];
  }

  // Combat initiative
  rollInitiative(character: Character): number {
    const dexModifier = this.getAbilityModifier(character.stats.dexterity);
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + dexModifier;
  }

  // Condition tracking
  applyCondition(character: Character, condition: string, duration?: number): void {
    // In a real implementation, this would modify character state
    console.log(`Applied ${condition} to ${character.name}${duration ? ` for ${duration} rounds` : ''}`);
  }

  // Level up calculations
  calculateExperienceToNextLevel(currentLevel: number): number {
    const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
    return xpTable[currentLevel] || 355000; // Cap at level 20
  }

  // Equipment and inventory
  calculateCarryingCapacity(character: Character): number {
    return character.stats.strength * 15; // Standard carrying capacity in pounds
  }

  // Rest mechanics
  shortRest(character: Character): { healthRestored: number; resourcesRestored: string[] } {
    // Simplified short rest - would normally involve hit dice
    const healthRestored = Math.floor(character.maxHealth * 0.1);
    return {
      healthRestored,
      resourcesRestored: ['Some spell slots', 'Short rest abilities']
    };
  }

  longRest(character: Character): { healthRestored: number; resourcesRestored: string[] } {
    const healthRestored = character.maxHealth - character.health;
    return {
      healthRestored,
      resourcesRestored: ['All hit points', 'All spell slots', 'Long rest abilities']
    };
  }

  // Utility functions for DM
  generateRandomTreasure(challengeRating: number): any[] {
    // Simplified treasure generation
    const treasure = [];
    const goldAmount = Math.floor(Math.random() * (challengeRating * 100)) + 50;
    treasure.push({ type: 'gold', amount: goldAmount });
    
    if (challengeRating >= 2 && Math.random() < 0.3) {
      treasure.push({ type: 'magic_item', rarity: 'common' });
    }
    
    return treasure;
  }

  // Monster Management Methods
  getMonster(monsterId: string): Monster | undefined {
    return this.monsters.get(monsterId);
  }

  getAllMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }

  getMonstersByCR(challengeRating: number): Monster[] {
    return this.getAllMonsters().filter(monster => monster.challengeRating === challengeRating);
  }

  getMonstersByType(type: string): Monster[] {
    return this.getAllMonsters().filter(monster => monster.type.toLowerCase().includes(type.toLowerCase()));
  }

  // Encounter Building
  calculateEncounterDifficulty(partyLevels: number[], monsterIds: string[]): {
    totalXP: number;
    adjustedXP: number;
    difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly' | 'impossible';
    thresholds: EncounterDifficulty;
  } {
    // Calculate party thresholds
    const thresholds = partyLevels.reduce((acc, level) => {
      const levelThresholds = RulesEngine.XP_THRESHOLDS[level] || RulesEngine.XP_THRESHOLDS[20];
      acc.easy += levelThresholds.easy;
      acc.medium += levelThresholds.medium;
      acc.hard += levelThresholds.hard;
      acc.deadly += levelThresholds.deadly;
      return acc;
    }, { easy: 0, medium: 0, hard: 0, deadly: 0 });

    // Calculate monster XP
    const totalXP = monsterIds.reduce((xp, monsterId) => {
      const monster = this.getMonster(monsterId);
      if (monster) {
        return xp + (RulesEngine.CR_TO_XP[monster.challengeRating] || 0);
      }
      return xp;
    }, 0);

    // Apply encounter multiplier based on number of monsters
    const monsterCount = monsterIds.length;
    let multiplier = 1;
    if (monsterCount === 2) multiplier = 1.5;
    else if (monsterCount === 3 || monsterCount === 6) multiplier = 2;
    else if (monsterCount >= 7 && monsterCount <= 10) multiplier = 2.5;
    else if (monsterCount >= 11 && monsterCount <= 14) multiplier = 3;
    else if (monsterCount >= 15) multiplier = 4;

    const adjustedXP = Math.floor(totalXP * multiplier);

    // Determine difficulty
    let difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly' | 'impossible';
    if (adjustedXP < thresholds.easy * 0.5) difficulty = 'trivial';
    else if (adjustedXP < thresholds.easy) difficulty = 'easy';
    else if (adjustedXP < thresholds.medium) difficulty = 'easy';
    else if (adjustedXP < thresholds.hard) difficulty = 'medium';
    else if (adjustedXP < thresholds.deadly) difficulty = 'hard';
    else if (adjustedXP < thresholds.deadly * 2) difficulty = 'deadly';
    else difficulty = 'impossible';

    return { totalXP, adjustedXP, difficulty, thresholds };
  }

  buildRandomEncounter(partyLevels: number[], targetDifficulty: 'easy' | 'medium' | 'hard' | 'deadly', environment?: string): {
    monsters: Monster[];
    difficulty: any;
    description: string;
  } {
    const partySize = partyLevels.length;
    const avgLevel = Math.floor(partyLevels.reduce((sum, level) => sum + level, 0) / partySize);
    
    // Get monsters appropriate for the environment and level
    let availableMonsters = this.getAllMonsters().filter(monster => 
      monster.challengeRating <= avgLevel + 2 && monster.challengeRating >= Math.max(0, avgLevel - 3)
    );

    if (environment) {
      // Filter by environment-appropriate monsters (simplified)
      availableMonsters = availableMonsters.filter(monster => {
        const envMap: Record<string, string[]> = {
          'forest': ['beast', 'fey', 'plant'],
          'dungeon': ['undead', 'aberration', 'humanoid'],
          'mountain': ['giant', 'dragon', 'elemental'],
          'swamp': ['undead', 'plant', 'monstrosity'],
          'urban': ['humanoid', 'construct']
        };
        const types = envMap[environment.toLowerCase()] || [];
        return types.some(type => monster.type.toLowerCase().includes(type));
      });
    }

    // Randomly select monsters for the encounter
    const selectedMonsters: Monster[] = [];
    const numMonsters = Math.floor(Math.random() * 3) + 1; // 1-3 monsters

    for (let i = 0; i < numMonsters && availableMonsters.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableMonsters.length);
      selectedMonsters.push(availableMonsters[randomIndex]);
    }

    const difficulty = this.calculateEncounterDifficulty(partyLevels, selectedMonsters.map(m => m.id));
    
    const description = this.generateEncounterDescription(selectedMonsters, environment);

    return { monsters: selectedMonsters, difficulty, description };
  }

  private generateEncounterDescription(monsters: Monster[], environment?: string): string {
    const envDescriptions: Record<string, string[]> = {
      'forest': ['among the twisted trees', 'in a moonlit clearing', 'near a babbling brook'],
      'dungeon': ['in the shadowy corridors', 'within a torch-lit chamber', 'beside ancient stone pillars'],
      'mountain': ['on a rocky outcrop', 'near a cave entrance', 'along a narrow mountain path'],
      'swamp': ['in the murky waters', 'among the gnarled roots', 'on a moss-covered island'],
      'urban': ['in the winding alleys', 'near the market square', 'by the old fountain']
    };

    const baseEnv = environment || 'an unknown location';
    const envDetail = environment && envDescriptions[environment] 
      ? envDescriptions[environment][Math.floor(Math.random() * envDescriptions[environment].length)]
      : 'in the area';

    if (monsters.length === 1) {
      return `A ${monsters[0].name} lurks ${envDetail}, ${this.getMonsterMotive(monsters[0])}.`;
    } else {
      const monsterList = monsters.map(m => m.name).join(', ');
      return `You encounter ${monsterList} ${envDetail}, appearing ${this.getGroupMotive(monsters)}.`;
    }
  }

  private getMonsterMotive(monster: Monster): string {
    const motives = [
      'guarding its territory',
      'hunting for prey',
      'protecting its young',
      'searching for treasure',
      'following ancient instincts'
    ];
    return motives[Math.floor(Math.random() * motives.length)];
  }

  private getGroupMotive(monsters: Monster[]): string {
    const motives = [
      'ready for battle',
      'coordinating their attack',
      'defending their lair',
      'on the hunt together',
      'surprisingly organized'
    ];
    return motives[Math.floor(Math.random() * motives.length)];
  }

  // Advanced Combat Methods
  resolveAttack(attacker: Character | Monster, target: Character | Monster, attackName: string): AttackResult {
    const isMonsterAttacker = 'challengeRating' in attacker;
    const isMonsterTarget = 'challengeRating' in target;
    
    // Find the attack action
    let attackAction;
    if (isMonsterAttacker) {
      attackAction = (attacker as Monster).actions?.find(action => action.name === attackName);
    }
    
    if (!attackAction) {
      throw new Error(`Attack "${attackName}" not found`);
    }

    // Roll attack
    const attackRoll = this.rollDice(20, 1, attackAction.attackBonus || 0);
    const targetAC = target.armorClass;
    
    const hit = attackRoll.total >= targetAC;
    const critical = attackRoll.rolls[0] === 20;

    let damage = 0;
    let damageType = 'unknown';
    const rollDetails: RollResult[] = [attackRoll];

    if (hit) {
      // Calculate damage
      const damageData = attackAction.damage;
      if (damageData) {
        const [diceCount, diceSides] = damageData.dice.split('d').map(Number);
        const damageRoll = this.rollDice(diceSides, critical ? diceCount * 2 : diceCount, damageData.modifier || 0);
        damage = damageRoll.total;
        damageType = damageData.damageType;
        rollDetails.push(damageRoll);

        // Additional damage (like fire damage on dragon bite)
        if (damageData.additional) {
          const [addDiceCount, addDiceSides] = damageData.additional.dice.split('d').map(Number);
          const additionalRoll = this.rollDice(addDiceSides, addDiceCount);
          damage += additionalRoll.total;
          rollDetails.push(additionalRoll);
        }
      }
    }

    return {
      hit,
      critical,
      damage,
      damageType,
      rollDetails,
      additionalEffects: attackAction.special ? [attackAction.special] : undefined
    };
  }

  resolveSavingThrow(creature: Character | Monster, abilityScore: string, dc: number): RollResult {
    const stats = creature.stats;
    const abilityMod = this.getAbilityModifier(stats[abilityScore as keyof typeof stats]);
    
    // Add proficiency if the creature is proficient in this save
    let profBonus = 0;
    if (creature.savingThrows && creature.savingThrows[abilityScore]) {
      profBonus = creature.savingThrows[abilityScore] - abilityMod;
    }
    
    const roll = this.rollDice(20, 1, abilityMod + profBonus);
    roll.success = roll.total >= dc;
    roll.description = `${abilityScore.charAt(0).toUpperCase() + abilityScore.slice(1)} saving throw vs DC ${dc}`;
    
    return roll;
  }

  // Monster stat block generation
  generateMonsterStatBlock(monster: Monster): string {
    const formatModifier = (score: number): string => {
      const mod = this.getAbilityModifier(score);
      return `${score} (${mod >= 0 ? '+' : ''}${mod})`;
    };

    return `
**${monster.name}**
*${monster.size} ${monster.type}, CR ${monster.challengeRating}*

**Armor Class** ${monster.armorClass}
**Hit Points** ${monster.hitPoints}${monster.hitDice ? ` (${monster.hitDice})` : ''}
**Speed** ${Object.entries(monster.speed).map(([type, speed]) => `${type} ${speed} ft.`).join(', ')}

**STR** ${formatModifier(monster.stats.strength)} **DEX** ${formatModifier(monster.stats.dexterity)} **CON** ${formatModifier(monster.stats.constitution)}
**INT** ${formatModifier(monster.stats.intelligence)} **WIS** ${formatModifier(monster.stats.wisdom)} **CHA** ${formatModifier(monster.stats.charisma)}

${monster.savingThrows ? `**Saving Throws** ${Object.entries(monster.savingThrows).map(([ability, bonus]) => `${ability.charAt(0).toUpperCase() + ability.slice(1)} +${bonus}`).join(', ')}\n` : ''}
${monster.skills ? `**Skills** ${Object.entries(monster.skills).map(([skill, bonus]) => `${skill.charAt(0).toUpperCase() + skill.slice(1)} +${bonus}`).join(', ')}\n` : ''}
${monster.damageResistances?.length ? `**Damage Resistances** ${monster.damageResistances.join(', ')}\n` : ''}
${monster.damageImmunities?.length ? `**Damage Immunities** ${monster.damageImmunities.join(', ')}\n` : ''}
${monster.damageVulnerabilities?.length ? `**Damage Vulnerabilities** ${monster.damageVulnerabilities.join(', ')}\n` : ''}
${monster.conditionImmunities?.length ? `**Condition Immunities** ${monster.conditionImmunities.join(', ')}\n` : ''}
${monster.senses?.length ? `**Senses** ${monster.senses.join(', ')}\n` : ''}
${monster.languages?.length ? `**Languages** ${monster.languages.join(', ')}\n` : ''}
**Proficiency Bonus** +${monster.proficiencyBonus}

${monster.abilities?.map(ability => `***${ability.name}.*** ${ability.description}`).join('\n') || ''}

**Actions**
${monster.actions?.map(action => `***${action.name}.*** ${action.description || this.formatAttackAction(action)}`).join('\n') || ''}
    `.trim();
  }

  private formatAttackAction(action: any): string {
    if (action.type === 'attack') {
      const range = action.attackType === 'melee' ? `reach ${action.reach} ft.` : `range ${action.range}`;
      return `*${action.attackType === 'melee' ? 'Melee' : 'Ranged'} Weapon Attack:* +${action.attackBonus} to hit, ${range}, one target. *Hit:* ${action.damage.dice}${action.damage.modifier ? ` + ${action.damage.modifier}` : ''} ${action.damage.damageType} damage.`;
    }
    return action.description || 'No description available.';
  }

  // Get spell by ID
  getSpell(spellId: string): Spell | undefined {
    return this.spells.get(spellId);
  }

  // Get all spells for a class
  getSpellsForClass(className: string, level?: number): Spell[] {
    return Array.from(this.spells.values()).filter(spell => 
      spell.classes.includes(className.toLowerCase()) && 
      (!level || spell.level <= level)
    );
  }

  // Validate action legality
  validateAction(action: CombatAction, character: Character): { valid: boolean; reason?: string } {
    // Basic action validation
    switch (action.type) {
      case 'spell': {
        if (!action.spellId) {
          return { valid: false, reason: 'No spell specified' };
        }
        const spell = this.getSpell(action.spellId);
        if (!spell) {
          return { valid: false, reason: 'Spell not found' };
        }
        if (!spell.classes.includes(character.class.toLowerCase())) {
          return { valid: false, reason: 'Character cannot cast this spell' };
        }
        break;
      }
      case 'attack': {
        if (!action.targetId) {
          return { valid: false, reason: 'No target specified for attack' };
        }
        break;
      }
    }
    
    return { valid: true };
  }
}

// Singleton instance
export const rulesEngine = new RulesEngine(); 