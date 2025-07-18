import { 
  Spell, 
  Spellcaster, 
  SpellLevel, 
  SpellcastingResult, 
  SpellSlot,
  ConcentrationCheck,
  SpellEffect,
  CANTRIPS,
  FIRST_LEVEL_SPELLS,
  canCastSpell,
  consumeSpellSlot,
  getSpellAttackBonus,
  getSpellSaveDC,
  calculateSpellDamage
} from '../types/spells';

import { diceService } from './diceService';
import { DiceRoll as EnhancedDiceRoll } from '../types/dice';

export class SpellcastingService {
  private spellDatabase: Map<string, Spell> = new Map();
  private spellcasters: Map<string, Spellcaster> = new Map();
  private concentrationTracking: Map<string, string> = new Map(); // caster ID -> spell ID
  
  constructor() {
    this.initializeSpellDatabase();
  }
  
  // Initialize with basic spells
  private initializeSpellDatabase(): void {
    // Add cantrips
    CANTRIPS.forEach(spell => {
      this.spellDatabase.set(spell.id, spell);
    });
    
    // Add 1st level spells
    FIRST_LEVEL_SPELLS.forEach(spell => {
      this.spellDatabase.set(spell.id, spell);
    });
    
    // Add more spells for a complete system
    this.addAdditionalSpells();
  }
  
  private addAdditionalSpells(): void {
    // Add some essential spells for combat
    const additionalSpells: Spell[] = [
      {
        id: 'shield',
        name: 'Shield',
        level: 1,
        school: 'abjuration',
        castingTime: { type: 'reaction', condition: 'when you are hit by an attack or targeted by magic missile' },
        range: { type: 'self' },
        components: { verbal: true, somatic: true, material: false },
        duration: { type: 'timed', length: 'until the start of your next turn' },
        description: 'An invisible barrier of magical force appears and protects you.',
        effects: [
          {
            type: 'stat_change',
            stat: 'armorClass',
            modifier: 5,
            duration: 1
          }
        ],
        targets: { type: 'self' },
        source: 'PHB',
        classes: ['sorcerer', 'wizard']
      },
      
      {
        id: 'cure_wounds',
        name: 'Cure Wounds',
        level: 1,
        school: 'evocation',
        castingTime: { type: 'action' },
        range: { type: 'touch' },
        components: { verbal: true, somatic: true, material: false },
        duration: { type: 'instantaneous' },
        description: 'A creature you touch regains a number of hit points.',
        effects: [],
        targets: { type: 'single' },
        healing: [{ dice: '1d8', modifier: 1 }],
        upcastScaling: { type: 'healing', amount: '+1d8', interval: 1 },
        source: 'PHB',
        classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger']
      },
      
      {
        id: 'counterspell',
        name: 'Counterspell',
        level: 3,
        school: 'abjuration',
        castingTime: { type: 'reaction', condition: 'when you see a creature within 60 feet casting a spell' },
        range: { type: 60 },
        components: { somatic: true, verbal: false, material: false },
        duration: { type: 'instantaneous' },
        description: 'You attempt to interrupt a creature in the process of casting a spell.',
        effects: [
          {
            type: 'special',
            special: 'counterspell',
            parameters: { autoSuccess: 3 } // Auto-succeeds against 3rd level or lower
          }
        ],
        targets: { type: 'single' },
        source: 'PHB',
        classes: ['sorcerer', 'warlock', 'wizard']
      },
      
      {
        id: 'lightning_bolt',
        name: 'Lightning Bolt',
        level: 3,
        school: 'evocation',
        castingTime: { type: 'action' },
        range: { type: 'self' },
        components: { verbal: true, somatic: true, material: true, materialComponent: 'a bit of fur and a rod of amber, crystal, or glass' },
        duration: { type: 'instantaneous' },
        description: 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you.',
        effects: [],
        targets: { type: 'area' },
        areaOfEffect: { type: 'line', size: 100, origin: 'caster' },
        savingThrow: { ability: 'dexterity', halfDamageOnSave: true },
        damage: [{ dice: '8d6', type: 'lightning' }],
        upcastScaling: { type: 'damage', amount: '+1d6', interval: 1 },
        source: 'PHB',
        classes: ['sorcerer', 'wizard']
      }
    ];
    
    additionalSpells.forEach(spell => {
      this.spellDatabase.set(spell.id, spell);
    });
  }
  
  // Spellcaster Management
  
  /**
   * Register a new spellcaster
   */
  registerSpellcaster(spellcaster: Spellcaster): void {
    this.spellcasters.set(spellcaster.id, spellcaster);
  }
  
  /**
   * Get spellcaster by ID
   */
  getSpellcaster(casterId: string): Spellcaster | null {
    return this.spellcasters.get(casterId) || null;
  }
  
  /**
   * Update spellcaster data
   */
  updateSpellcaster(casterId: string, updates: Partial<Spellcaster>): boolean {
    const caster = this.spellcasters.get(casterId);
    if (!caster) return false;
    
    Object.assign(caster, updates);
    return true;
  }
  
  // Spell Database Management
  
  /**
   * Get spell by ID
   */
  getSpell(spellId: string): Spell | null {
    return this.spellDatabase.get(spellId) || null;
  }
  
  /**
   * Add custom spell to database
   */
  addSpell(spell: Spell): void {
    this.spellDatabase.set(spell.id, spell);
  }
  
  /**
   * Get all spells for a specific class and level
   */
  getSpellsForClass(className: string, maxLevel?: SpellLevel): Spell[] {
    return Array.from(this.spellDatabase.values()).filter(spell => 
      spell.classes.includes(className.toLowerCase()) &&
      (maxLevel === undefined || spell.level <= maxLevel)
    );
  }
  
  /**
   * Search spells by name, school, or description
   */
  searchSpells(query: string): Spell[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.spellDatabase.values()).filter(spell =>
      spell.name.toLowerCase().includes(searchTerm) ||
      spell.school.includes(searchTerm) ||
      spell.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Spell Slot Management
  
  /**
   * Get available spell slots for a caster
   */
  getAvailableSlots(casterId: string): SpellSlot[] {
    const caster = this.getSpellcaster(casterId);
    if (!caster) return [];
    
    return caster.spellSlots.filter(slot => slot.used < slot.total);
  }
  
  /**
   * Consume a spell slot
   */
  useSpellSlot(casterId: string, level: SpellLevel): boolean {
    const caster = this.getSpellcaster(casterId);
    if (!caster) return false;
    
    return consumeSpellSlot(caster, level);
  }
  
  /**
   * Restore spell slots (short rest, long rest, etc.)
   */
  restoreSpellSlots(casterId: string, restType: 'short' | 'long'): void {
    const caster = this.getSpellcaster(casterId);
    if (!caster) return;
    
    if (restType === 'long') {
      // Long rest restores all spell slots
      caster.spellSlots.forEach(slot => {
        slot.used = 0;
        slot.expended = 0;
      });
    } else if (restType === 'short') {
      // Short rest - implement class-specific recovery (e.g., Warlock, some Wizard features)
      if (caster.class.toLowerCase() === 'warlock') {
        caster.spellSlots.forEach(slot => {
          slot.used = 0;
          slot.expended = 0;
        });
      }
    }
  }
  
  // Spell Casting
  
  /**
   * Cast a spell
   */
  async castSpell(
    casterId: string, 
    spellId: string, 
    level: SpellLevel, 
    targetIds: string[] = [],
    targetPosition?: { x: number; y: number }
  ): Promise<SpellcastingResult> {
    const caster = this.getSpellcaster(casterId);
    const spell = this.getSpell(spellId);
    
    if (!caster) {
      throw new Error(`Spellcaster ${casterId} not found`);
    }
    
    if (!spell) {
      throw new Error(`Spell ${spellId} not found`);
    }
    
    // Validate spell can be cast
    if (!canCastSpell(caster, spell, level)) {
      throw new Error(`Cannot cast ${spell.name} at level ${level}`);
    }
    
    // Check concentration
    if (spell.concentration && caster.concentratingOn) {
      // End previous concentration spell
      this.endConcentration(casterId);
    }
    
    // Consume spell slot (unless it's a cantrip)
    if (spell.level > 0) {
      if (!this.useSpellSlot(casterId, level)) {
        throw new Error(`No spell slots available at level ${level}`);
      }
    }
    
    // Execute spell effects
    const result = await this.executeSpellEffects(caster, spell, level, targetIds, targetPosition);
    
    // Start concentration if needed
    if (spell.concentration) {
      this.startConcentration(casterId, spellId, level);
    }
    
    return result;
  }
  
  /**
   * Execute the actual spell effects
   */
  private async executeSpellEffects(
    caster: Spellcaster,
    spell: Spell,
    level: SpellLevel,
    targetIds: string[],
    targetPosition?: { x: number; y: number }
  ): Promise<SpellcastingResult> {
    const result: SpellcastingResult = {
      success: true,
      spell,
      level,
      caster,
      targets: targetIds,
      effectsApplied: [],
      slotUsed: spell.level > 0 ? level : undefined,
      timestamp: Date.now()
    };
    
    // Handle spell attacks
    if (spell.spellAttack) {
      const attackBonus = getSpellAttackBonus(caster);
      result.attackRolls = [];
      
      for (const targetId of targetIds) {
        const attackRoll = diceService.rollAttack('normal', attackBonus);
        result.attackRolls.push(attackRoll);
        
        // TODO: Check if attack hits target's AC
        // For now, assume it hits
        const hit = attackRoll.total >= 15; // Placeholder AC
        
        if (hit || attackRoll.results.some(r => r.isCritical)) {
          result.critical = attackRoll.results.some(r => r.isCritical);
          
          // Roll damage
          if (spell.damage) {
            result.damageRolls = await this.rollSpellDamage(spell, level, caster, result.critical);
          }
        }
      }
    }
    
    // Handle saving throws
    if (spell.savingThrow) {
      // TODO: Implement saving throw mechanics
      // This would integrate with the combat system
    }
    
    // Handle direct damage spells (like Magic Missile)
    if (spell.damage && !spell.spellAttack && !spell.savingThrow) {
      result.damageRolls = await this.rollSpellDamage(spell, level, caster, false);
    }
    
    // Handle healing spells
    if (spell.healing) {
      result.healingRolls = await this.rollSpellHealing(spell, level, caster);
    }
    
    // Apply spell effects
    result.effectsApplied = spell.effects.map(effect => ({
      ...effect,
      // Apply any level scaling
    }));
    
    return result;
  }
  
  /**
   * Roll spell damage
   */
  private async rollSpellDamage(
    spell: Spell, 
    level: SpellLevel, 
    caster: Spellcaster, 
    critical: boolean
  ): Promise<EnhancedDiceRoll[]> {
    const rolls: EnhancedDiceRoll[] = [];
    
    if (!spell.damage) return rolls;
    
    for (const damage of spell.damage) {
      const diceExpression = this.calculateScaledDamage(damage, spell, level, caster);
      
      let roll = diceService.rollDamage(diceExpression);
      
      // Handle critical hits for spells
      if (critical) {
        // Double the dice (not the modifier)
        const baseDice = damage.dice;
        const criticalExpression = this.doubleDiceExpression(baseDice);
        roll = diceService.rollDamage(criticalExpression + (damage.modifier ? `+${damage.modifier}` : ''));
      }
      
      rolls.push(roll);
    }
    
    return rolls;
  }
  
  /**
   * Roll spell healing
   */
  private async rollSpellHealing(
    spell: Spell, 
    level: SpellLevel, 
    caster: Spellcaster
  ): Promise<EnhancedDiceRoll[]> {
    const rolls: EnhancedDiceRoll[] = [];
    
    if (!spell.healing) return rolls;
    
    for (const healing of spell.healing) {
      const diceExpression = this.calculateScaledHealing(healing, spell, level, caster);
      const roll = diceService.rollDamage(diceExpression); // Reuse damage roller for healing
      rolls.push(roll);
    }
    
    return rolls;
  }
  
  /**
   * Calculate scaled damage expression
   */
  private calculateScaledDamage(damage: any, spell: Spell, level: SpellLevel, caster: Spellcaster): string {
    let dice = damage.dice;
    let modifier = damage.modifier || 0;
    
    // Add spellcasting modifier if specified
    if (damage.modifier !== undefined) {
      modifier += caster.spellcastingAbility.modifier;
    }
    
    // Apply upcast scaling
    if (spell.upcastScaling && level > spell.level) {
      const levelsAboveBase = level - spell.level;
      const scalingInterval = spell.upcastScaling.interval;
      const scalingAmount = Math.floor(levelsAboveBase / scalingInterval);
      
      if (damage.scalingDice) {
        const scalingDiceMatch = damage.scalingDice.match(/(\d+)d(\d+)/);
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
      
      if (damage.scalingModifier) {
        modifier += damage.scalingModifier * scalingAmount;
      }
    }
    
    return modifier > 0 ? `${dice}+${modifier}` : dice;
  }
  
  /**
   * Calculate scaled healing expression
   */
  private calculateScaledHealing(healing: any, spell: Spell, level: SpellLevel, caster: Spellcaster): string {
    // Similar to damage scaling but for healing
    return this.calculateScaledDamage(healing, spell, level, caster);
  }
  
  /**
   * Double dice expression for critical hits
   */
  private doubleDiceExpression(diceExpression: string): string {
    const match = diceExpression.match(/(\d+)d(\d+)/);
    if (match) {
      const count = parseInt(match[1]) * 2;
      const sides = match[2];
      return `${count}d${sides}`;
    }
    return diceExpression;
  }
  
  // Concentration Management
  
  /**
   * Start concentrating on a spell
   */
  startConcentration(casterId: string, spellId: string, level: SpellLevel): void {
    const caster = this.getSpellcaster(casterId);
    if (!caster) return;
    
    caster.concentratingOn = {
      spellId,
      level,
      startTime: Date.now(),
      duration: 600000 // 10 minutes default
    };
    
    this.concentrationTracking.set(casterId, spellId);
  }
  
  /**
   * End concentration
   */
  endConcentration(casterId: string): void {
    const caster = this.getSpellcaster(casterId);
    if (!caster) return;
    
    caster.concentratingOn = undefined;
    this.concentrationTracking.delete(casterId);
  }
  
  /**
   * Make a concentration saving throw
   */
  async makeConcentrationSave(casterId: string, damage: number): Promise<ConcentrationCheck> {
    const caster = this.getSpellcaster(casterId);
    if (!caster || !caster.concentratingOn) {
      throw new Error('Caster is not concentrating on a spell');
    }
    
    const dc = Math.max(10, Math.floor(damage / 2));
    const constitutionModifier = Math.floor((caster.spellcastingAbility.modifier || 0));
    
    const result = diceService.rollSkillCheck(constitutionModifier, dc);
    
    const concentrationCheck: ConcentrationCheck = {
      damage,
      dc,
      result,
      success: result.success,
      spell: caster.concentratingOn.spellId
    };
    
    if (!result.success) {
      this.endConcentration(casterId);
    }
    
    return concentrationCheck;
  }
  
  // Utility Methods
  
  /**
   * Get spell description with current level scaling
   */
  getSpellDescription(spellId: string, level: SpellLevel, casterId?: string): string {
    const spell = this.getSpell(spellId);
    if (!spell) return '';
    
    let description = spell.description;
    
    if (spell.higherLevelDescription && level > spell.level) {
      description += '\n\nAt Higher Levels: ' + spell.higherLevelDescription;
    }
    
    // Add damage/healing info if caster is provided
    if (casterId) {
      const caster = this.getSpellcaster(casterId);
      if (caster) {
        if (spell.damage) {
          const damageExpression = calculateSpellDamage(spell, level, caster.spellcastingAbility.modifier);
          description += `\n\nDamage: ${damageExpression} ${spell.damage[0].type}`;
        }
        
        if (spell.healing) {
          const healingExpression = this.calculateScaledHealing(spell.healing[0], spell, level, caster);
          description += `\n\nHealing: ${healingExpression}`;
        }
      }
    }
    
    return description;
  }
  
  /**
   * Check if caster can cast any spells
   */
  canCastAnySpells(casterId: string): boolean {
    const caster = this.getSpellcaster(casterId);
    if (!caster) return false;
    
    // Check for available spell slots or cantrips
    const hasSlots = caster.spellSlots.some(slot => slot.used < slot.total);
    const hasCantrips = caster.knownSpells.some(spellId => {
      const spell = this.getSpell(spellId);
      return spell && spell.level === 0;
    });
    
    return hasSlots || hasCantrips;
  }
  
  /**
   * Get spells ready to cast (known/prepared and have slots)
   */
  getReadySpells(casterId: string): Array<{ spell: Spell; availableLevels: SpellLevel[] }> {
    const caster = this.getSpellcaster(casterId);
    if (!caster) return [];
    
    const readySpells: Array<{ spell: Spell; availableLevels: SpellLevel[] }> = [];
    
    for (const spellId of caster.knownSpells) {
      if (caster.preparedSpells.length > 0 && !caster.preparedSpells.includes(spellId)) {
        continue; // Skip unprepared spells for prepared casters
      }
      
      const spell = this.getSpell(spellId);
      if (!spell) continue;
      
      const availableLevels: SpellLevel[] = [];
      
      // Cantrips are always available
      if (spell.level === 0) {
        availableLevels.push(0);
      } else {
        // Check available spell slots
        for (const slot of caster.spellSlots) {
          if (slot.level >= spell.level && slot.used < slot.total) {
            availableLevels.push(slot.level);
          }
        }
      }
      
      if (availableLevels.length > 0) {
        readySpells.push({ spell, availableLevels });
      }
    }
    
    return readySpells;
  }
}

export const spellcastingService = new SpellcastingService(); 