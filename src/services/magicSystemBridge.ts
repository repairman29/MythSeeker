// Bridge between legacy MagicSystem and new SpellCasting system

import { spellcastingService } from './spellcastingService';
import { 
  Spell as NewSpell, 
  Spellcaster, 
  SpellLevel,
  SpellcastingResult 
} from '../types/spells';

// Legacy spell interface from MagicSystem.tsx
interface LegacySpell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  components: string[];
  description: string;
  damage?: string;
  saveType?: string;
  prepared: boolean;
  known: boolean;
  canCast: boolean;
  manaCost: number;
  cooldown?: number;
  remainingCooldown?: number;
}

// Bridge configuration for different magic systems
export interface MagicSystemConfig {
  type: 'slot_based' | 'mana_based' | 'hybrid';
  useConcentration: boolean;
  allowUpcast: boolean;
  useMaterialComponents: boolean;
  conversionRatio?: number; // Mana to spell slot conversion
}

export class MagicSystemBridge {
  private config: MagicSystemConfig;
  private manaToSlotRatio = 15; // 15 mana = 1 first level slot
  
  constructor(config: MagicSystemConfig = {
    type: 'hybrid',
    useConcentration: true,
    allowUpcast: true,
    useMaterialComponents: true
  }) {
    this.config = config;
  }
  
  /**
   * Convert legacy spell to new spell format
   */
  convertLegacySpell(legacySpell: LegacySpell): NewSpell {
    return {
      id: legacySpell.id,
      name: legacySpell.name,
      level: this.normalizeSpellLevel(legacySpell.level),
      school: this.convertSchool(legacySpell.school),
      
      castingTime: {
        type: this.convertCastingTime(legacySpell.castingTime)
      },
      
      range: {
        type: this.convertRange(legacySpell.range)
      },
      
      components: {
        verbal: legacySpell.components.includes('V'),
        somatic: legacySpell.components.includes('S'),
        material: legacySpell.components.includes('M'),
        materialComponent: legacySpell.components.includes('M') ? 
          this.getMaterialComponent(legacySpell.id) : undefined
      },
      
      duration: {
        type: this.convertDuration(legacySpell.duration),
        length: legacySpell.duration,
        concentration: this.requiresConcentration(legacySpell.duration)
      },
      
      description: legacySpell.description,
      
      effects: [],
      
      targets: {
        type: this.inferTargetType(legacySpell.range, legacySpell.description)
      },
      
      // Convert damage if present
      ...(legacySpell.damage && {
        damage: [this.parseDamage(legacySpell.damage)],
        ...(legacySpell.damage.includes('healing') && {
          healing: [this.parseHealing(legacySpell.damage)]
        })
      }),
      
      // Convert saving throw
      ...(legacySpell.saveType && {
        savingThrow: {
          ability: legacySpell.saveType.toLowerCase() as any,
          halfDamageOnSave: legacySpell.damage?.includes('fire') || legacySpell.damage?.includes('damage')
        }
      }),
      
      source: 'Legacy System',
      classes: ['wizard', 'sorcerer'], // Default classes
      
      // Add mana cost as custom property for hybrid systems
      tags: [`mana_cost:${legacySpell.manaCost}`]
    };
  }
  
  /**
   * Convert new spell to legacy format for compatibility
   */
  convertToLegacySpell(newSpell: NewSpell, caster?: Spellcaster): LegacySpell {
    const manaCost = this.calculateManaCost(newSpell);
    
    return {
      id: newSpell.id,
      name: newSpell.name,
      level: newSpell.level,
      school: newSpell.school.charAt(0).toUpperCase() + newSpell.school.slice(1),
             castingTime: String(newSpell.castingTime.duration || 
         (typeof newSpell.castingTime.type === 'string' ? `1 ${newSpell.castingTime.type}` : '1 action')),
      range: typeof newSpell.range.type === 'number' ? 
        `${newSpell.range.type} feet` : newSpell.range.type,
      duration: newSpell.duration.length || newSpell.duration.type,
      components: this.convertComponents(newSpell.components),
      description: newSpell.description,
      damage: this.formatDamage(newSpell),
      saveType: newSpell.savingThrow?.ability,
      prepared: caster ? caster.preparedSpells.includes(newSpell.id) : false,
      known: caster ? caster.knownSpells.includes(newSpell.id) : false,
      canCast: caster ? this.canCastSpell(caster, newSpell) : false,
      manaCost
    };
  }
  
  /**
   * Create a hybrid spellcaster that supports both systems
   */
  createHybridCaster(
    legacyData: any,
    baseSpellcaster: Partial<Spellcaster>
  ): Spellcaster {
    const caster: Spellcaster = {
      id: legacyData.id || 'hybrid_caster',
      class: legacyData.class || 'wizard',
      level: legacyData.level || 1,
      
      spellcastingAbility: {
        ability: 'intelligence',
        modifier: legacyData.spellcastingModifier || 3,
        spellAttackBonus: legacyData.spellAttackBonus || 5,
        spellSaveDC: legacyData.spellSaveDC || 13,
        proficiencyBonus: legacyData.proficiencyBonus || 2
      },
      
      // Convert mana to spell slots if in hybrid mode
      spellSlots: this.convertManaToSlots(legacyData.currentMana || 100, legacyData.maxMana || 100),
      
      knownSpells: legacyData.knownSpells || [],
      preparedSpells: legacyData.preparedSpells || [],
      
      ritualCasting: true,
      spellcastingFocus: true,
      cantripsKnown: Math.floor(legacyData.level / 3) + 2,
      
      ...baseSpellcaster
    };
    
    // Register with spellcasting service
    spellcastingService.registerSpellcaster(caster);
    
    return caster;
  }
  
  /**
   * Cast spell using either system based on configuration
   */
  async castSpell(
    casterId: string,
    spellId: string,
    options: {
      usingMana?: boolean;
      level?: SpellLevel;
      targets?: string[];
      targetPosition?: { x: number; y: number };
    } = {}
  ): Promise<SpellcastingResult | { success: boolean; manaCost: number }> {
    const spell = spellcastingService.getSpell(spellId);
    if (!spell) {
      throw new Error(`Spell ${spellId} not found`);
    }
    
    if (this.config.type === 'mana_based' || options.usingMana) {
      return this.castWithMana(casterId, spell, options);
    } else {
      return spellcastingService.castSpell(
        casterId, 
        spellId, 
        options.level || spell.level,
        options.targets,
        options.targetPosition
      );
    }
  }
  
  /**
   * Migrate legacy spells to new system
   */
  migrateLegacySpells(legacySpells: LegacySpell[]): void {
    for (const legacySpell of legacySpells) {
      const newSpell = this.convertLegacySpell(legacySpell);
      spellcastingService.addSpell(newSpell);
    }
  }
  
  /**
   * Get unified spell list for UI components
   */
  getUnifiedSpellList(casterId: string, format: 'legacy' | 'new' = 'new') {
    const caster = spellcastingService.getSpellcaster(casterId);
    if (!caster) return [];
    
    const readySpells = spellcastingService.getReadySpells(casterId);
    
    if (format === 'legacy') {
      return readySpells.map(({ spell }) => this.convertToLegacySpell(spell, caster));
    }
    
    return readySpells;
  }
  
  // Helper methods
  
  private normalizeSpellLevel(level: number): SpellLevel {
    return Math.max(0, Math.min(9, level)) as SpellLevel;
  }
  
  private convertSchool(school: string): any {
    const schoolMap: { [key: string]: string } = {
      'Evocation': 'evocation',
      'Abjuration': 'abjuration',
      'Conjuration': 'conjuration',
      'Divination': 'divination',
      'Enchantment': 'enchantment',
      'Illusion': 'illusion',
      'Necromancy': 'necromancy',
      'Transmutation': 'transmutation'
    };
    return schoolMap[school] || 'evocation';
  }
  
  private convertCastingTime(castingTime: string): any {
    if (castingTime.includes('action')) return 'action';
    if (castingTime.includes('bonus')) return 'bonus_action';
    if (castingTime.includes('reaction')) return 'reaction';
    return 'action';
  }
  
  private convertRange(range: string): any {
    if (range.toLowerCase() === 'self') return 'self';
    if (range.toLowerCase() === 'touch') return 'touch';
    const feetMatch = range.match(/(\d+)\s*feet?/i);
    return feetMatch ? parseInt(feetMatch[1]) : 'touch';
  }
  
  private convertDuration(duration: string): any {
    if (duration.toLowerCase().includes('instantaneous')) return 'instantaneous';
    if (duration.toLowerCase().includes('concentration')) return 'concentration';
    return 'timed';
  }
  
  private requiresConcentration(duration: string): boolean {
    return duration.toLowerCase().includes('concentration');
  }
  
  private inferTargetType(range: string, description: string): any {
    if (range.toLowerCase() === 'self') return 'self';
    if (description.toLowerCase().includes('creature')) return 'single';
    if (description.toLowerCase().includes('area') || description.toLowerCase().includes('explosion')) return 'area';
    return 'single';
  }
  
  private parseDamage(damage: string): any {
    const parts = damage.split(' ');
    const dice = parts[0];
    const type = parts[1] || 'force';
    
    return {
      dice,
      type: type === 'healing' ? 'radiant' : type,
      scalingDice: dice
    };
  }
  
  private parseHealing(damage: string): any {
    const parts = damage.split(' ');
    return {
      dice: parts[0],
      modifier: 1
    };
  }
  
  private getMaterialComponent(spellId: string): string | undefined {
    const materialMap: { [key: string]: string } = {
      'fireball': 'a tiny ball of bat guano and sulfur',
      'magic-missile': undefined,
      'mage-armor': 'a piece of cured leather'
    };
    return materialMap[spellId];
  }
  
  private calculateManaCost(spell: NewSpell): number {
    const baseCost = spell.level === 0 ? 5 : spell.level * this.manaToSlotRatio;
    const schoolMultiplier = spell.school === 'evocation' ? 1.2 : 1.0;
    return Math.floor(baseCost * schoolMultiplier);
  }
  
  private convertComponents(components: any): string[] {
    const result: string[] = [];
    if (components.verbal) result.push('V');
    if (components.somatic) result.push('S');
    if (components.material) result.push('M');
    return result;
  }
  
  private formatDamage(spell: NewSpell): string | undefined {
    if (spell.damage && spell.damage.length > 0) {
      const damage = spell.damage[0];
      return `${damage.dice} ${damage.type}`;
    }
    if (spell.healing && spell.healing.length > 0) {
      const healing = spell.healing[0];
      return `${healing.dice} healing`;
    }
    return undefined;
  }
  
  private canCastSpell(caster: Spellcaster, spell: NewSpell): boolean {
    if (spell.level === 0) return true; // Cantrips
    
    const availableSlots = caster.spellSlots.filter(
      slot => slot.level >= spell.level && slot.used < slot.total
    );
    return availableSlots.length > 0;
  }
  
  private convertManaToSlots(currentMana: number, maxMana: number): any[] {
    const slots = [];
    let remainingMana = currentMana;
    
    // Convert mana to spell slots (higher levels first for efficiency)
    for (let level = 9; level >= 1; level--) {
      const slotCost = level * this.manaToSlotRatio;
      const availableSlots = Math.floor(remainingMana / slotCost);
      const totalSlots = Math.floor(maxMana / slotCost / level); // Rough calculation
      
      if (totalSlots > 0) {
        slots.push({
          level,
          total: Math.min(totalSlots, 4), // Cap slots per level
          used: Math.max(0, totalSlots - availableSlots),
          expended: 0
        });
        remainingMana -= availableSlots * slotCost;
      }
    }
    
    return slots.reverse(); // Sort by level ascending
  }
  
  private async castWithMana(
    casterId: string, 
    spell: NewSpell, 
    options: any
  ): Promise<{ success: boolean; manaCost: number }> {
    const manaCost = this.calculateManaCost(spell);
    
    // TODO: Implement mana-based casting logic
    // This would deduct mana instead of spell slots
    
    return {
      success: true,
      manaCost
    };
  }
}

// Create default bridge instance
export const magicSystemBridge = new MagicSystemBridge();

// Utility functions for easy integration

/**
 * Migrate legacy magic system to new spellcasting system
 */
export const migrateLegacyMagicSystem = async (legacyData: any): Promise<string> => {
  // Convert legacy spells
  if (legacyData.spells) {
    magicSystemBridge.migrateLegacySpells(legacyData.spells);
  }
  
  // Create hybrid caster
  const caster = magicSystemBridge.createHybridCaster(legacyData, {
    ritualCasting: true,
    spellcastingFocus: true
  });
  
  return caster.id;
};

/**
 * Get spells in format compatible with legacy MagicSystem component
 */
export const getLegacyCompatibleSpells = (casterId: string) => {
  return magicSystemBridge.getUnifiedSpellList(casterId, 'legacy');
};

/**
 * Cast spell with automatic system detection
 */
export const castUnifiedSpell = async (
  casterId: string,
  spellId: string,
  options: {
    preferMana?: boolean;
    level?: SpellLevel;
    targets?: string[];
  } = {}
) => {
  return magicSystemBridge.castSpell(casterId, spellId, {
    usingMana: options.preferMana,
    level: options.level,
    targets: options.targets
  });
}; 