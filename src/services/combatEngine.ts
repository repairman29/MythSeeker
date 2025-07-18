import { 
  CombatEncounter, 
  Combatant, 
  CombatAction, 
  CombatPhase, 
  AttackResult, 
  CombatLogEntry, 
  CombatContext,
  CombatEvent,
  CombatEventHandler,
  RangeCalculation,
  MovementPath,
  VictoryCondition,
  COMBAT_PRESETS
} from '../types/combat';

import { diceService } from './diceService';
import { DiceRoll as EnhancedDiceRoll, DiceConfig } from '../types/dice';

export class CombatEngine {
  private encounters: Map<string, CombatEncounter> = new Map();
  private eventHandlers: Map<string, CombatEventHandler[]> = new Map();
  
  // Combat Management
  
  /**
   * Create a new combat encounter
   */
  createEncounter(
    name: string, 
    combatants: Combatant[], 
    preset: keyof typeof COMBAT_PRESETS = 'QUICK_SKIRMISH'
  ): CombatEncounter {
    const encounterId = `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const presetData = COMBAT_PRESETS[preset];
    
    const encounter: CombatEncounter = {
      id: encounterId,
      name,
      description: `Combat encounter: ${name}`,
      phase: 'setup',
      round: 0,
      currentTurn: 0,
      combatants: combatants.map(c => ({
        ...c,
        actions: {
          action: false,
          bonusAction: false,
          movement: 0,
          reactions: 0
        },
        reactions: {
          used: false,
          available: []
        },
        conditions: []
      })),
      turnOrder: [],
      battlefield: {
        terrain: [],
        obstacles: [],
        ...presetData.battlefield
      },
      rules: presetData.rules,
      actionLog: [],
      damageDealt: {},
      victoryConditions: [
        {
          type: 'defeat_all',
          description: 'Defeat all enemies',
          parameters: {},
          completed: false
        }
      ],
      startTime: Date.now()
    };
    
    this.encounters.set(encounterId, encounter);
    this.emitEvent('combat_start', { encounterId });
    
    return encounter;
  }
  
  /**
   * Start combat by rolling initiative
   */
  async rollInitiative(encounterId: string): Promise<void> {
    const encounter = this.getEncounter(encounterId);
    if (encounter.phase !== 'setup') {
      throw new Error('Combat must be in setup phase to roll initiative');
    }
    
    encounter.phase = 'initiative';
    
    // Roll initiative for all combatants
    const initiativeRolls: Array<{ combatant: Combatant; roll: EnhancedDiceRoll }> = [];
    
    for (const combatant of encounter.combatants) {
      const dexModifier = Math.floor((combatant.abilities.dexterity - 10) / 2);
      const roll = diceService.rollInitiative(dexModifier);
      
      combatant.initiative = roll.total;
      combatant.initiativeRoll = roll;
      
      initiativeRolls.push({ combatant, roll });
      
      this.logAction(encounter, {
        actor: combatant.id,
        action: 'Initiative',
        description: `${combatant.name} rolls initiative: ${roll.total}`,
        results: { success: true },
        rolls: [roll]
      });
    }
    
    // Sort by initiative (highest first, with dex tiebreaker)
    encounter.turnOrder = encounter.combatants
      .sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        return b.abilities.dexterity - a.abilities.dexterity;
      })
      .map(c => c.id);
    
    encounter.phase = 'combat';
    encounter.round = 1;
    encounter.currentTurn = 0;
    
    this.emitEvent('round_start', { encounterId, round: 1 });
    this.startTurn(encounterId);
  }
  
  /**
   * Start the current combatant's turn
   */
  private startTurn(encounterId: string): void {
    const encounter = this.getEncounter(encounterId);
    const currentCombatantId = encounter.turnOrder[encounter.currentTurn];
    const combatant = this.getCombatant(encounter, currentCombatantId);
    
    // Reset action economy
    combatant.actions = {
      action: false,
      bonusAction: false,
      movement: 0,
      reactions: 0
    };
    
    // Process start-of-turn effects
    this.processConditions(encounter, combatant, 'start_of_turn');
    
    this.emitEvent('turn_start', { encounterId, combatantId: currentCombatantId });
    
    this.logAction(encounter, {
      actor: combatant.id,
      action: 'Turn Start',
      description: `${combatant.name}'s turn begins`,
      results: { success: true }
    });
  }
  
  /**
   * End the current combatant's turn
   */
  endTurn(encounterId: string): void {
    const encounter = this.getEncounter(encounterId);
    const currentCombatantId = encounter.turnOrder[encounter.currentTurn];
    const combatant = this.getCombatant(encounter, currentCombatantId);
    
    // Process end-of-turn effects
    this.processConditions(encounter, combatant, 'end_of_turn');
    
    this.emitEvent('turn_end', { encounterId, combatantId: currentCombatantId });
    
    this.logAction(encounter, {
      actor: combatant.id,
      action: 'Turn End',
      description: `${combatant.name}'s turn ends`,
      results: { success: true }
    });
    
    // Move to next turn
    encounter.currentTurn++;
    
    if (encounter.currentTurn >= encounter.turnOrder.length) {
      // End of round
      this.endRound(encounterId);
    } else {
      // Start next turn
      this.startTurn(encounterId);
    }
  }
  
  /**
   * End the current round
   */
  private endRound(encounterId: string): void {
    const encounter = this.getEncounter(encounterId);
    
    this.emitEvent('round_end', { encounterId, round: encounter.round });
    
    // Check victory conditions
    if (this.checkVictoryConditions(encounter)) {
      this.endCombat(encounterId);
      return;
    }
    
    // Start new round
    encounter.round++;
    encounter.currentTurn = 0;
    
    this.emitEvent('round_start', { encounterId, round: encounter.round });
    this.startTurn(encounterId);
  }
  
  /**
   * Execute a combat action
   */
  async executeAction(
    encounterId: string, 
    action: CombatAction, 
    targetIds: string[] = []
  ): Promise<AttackResult[]> {
    const encounter = this.getEncounter(encounterId);
    const currentCombatantId = encounter.turnOrder[encounter.currentTurn];
    const actor = this.getCombatant(encounter, currentCombatantId);
    
    // Validate action can be performed
    if (!this.canPerformAction(actor, action)) {
      throw new Error(`${actor.name} cannot perform ${action.name}`);
    }
    
    // Mark action as used
    this.consumeAction(actor, action.actionCost);
    
    const results: AttackResult[] = [];
    const targets = targetIds.map(id => this.getCombatant(encounter, id));
    
    // Process action effects
    for (const target of targets) {
      const result = await this.processActionOnTarget(encounter, actor, target, action);
      if (result) {
        results.push(result);
      }
    }
    
    // Log the action
    this.logAction(encounter, {
      actor: actor.id,
      action: action.name,
      targets: targetIds,
      description: this.generateActionDescription(action, actor, targets, results),
      results: {
        success: results.some(r => r.hit),
        critical: results.some(r => r.critical),
        damage: results.reduce((sum, r) => sum + r.totalDamage, 0)
      },
      rolls: results.flatMap(r => [r.attackRoll, ...r.damageRolls]).filter(Boolean)
    });
    
    return results;
  }
  
  /**
   * Process an action against a specific target
   */
  private async processActionOnTarget(
    encounter: CombatEncounter,
    actor: Combatant,
    target: Combatant,
    action: CombatAction
  ): Promise<AttackResult | null> {
    // Handle attack roll if required
    if (action.attackRoll) {
      const attackAdvantage = action.attackRoll.advantage ? 'advantage' : 
                            action.attackRoll.disadvantage ? 'disadvantage' : 'normal';
      
      const attackRoll = diceService.rollAttack(attackAdvantage, action.attackRoll.bonus);
      
      const hit = attackRoll.total >= target.armorClass;
      const critical = attackRoll.results.some(r => r.isCritical && !r.discarded);
      
      if (!hit) {
        return {
          hit: false,
          critical: false,
          attackRoll,
          damageRolls: [],
          totalDamage: 0,
          damageTypes: {}
        };
      }
      
      // Calculate damage
      let totalDamage = 0;
      const damageTypes: { [key: string]: number } = {};
      const damageRolls: EnhancedDiceRoll[] = [];
      
      if (action.damageRolls) {
        for (const damageRoll of action.damageRolls) {
          let diceExpression = damageRoll.dice;
          
          // Double dice on critical hit
          if (critical && encounter.rules.criticalHitRule === 'double_dice') {
            const match = diceExpression.match(/(\d+)d(\d+)/);
            if (match) {
              const count = parseInt(match[1]) * 2;
              const sides = match[2];
              diceExpression = `${count}d${sides}`;
            }
          }
          
          const roll = diceService.rollDamage(
            `${diceExpression}${damageRoll.bonus ? `+${damageRoll.bonus}` : ''}`
          );
          
          let damage = roll.total;
          
          // Apply critical hit rules
          if (critical) {
            switch (encounter.rules.criticalHitRule) {
              case 'max_damage_plus_roll':
                const maxDamage = this.calculateMaxDamage(damageRoll.dice) + (damageRoll.bonus || 0);
                damage = maxDamage + roll.total;
                break;
              case 'double_damage':
                damage = roll.total * 2;
                break;
              // 'double_dice' is handled above
            }
          }
          
          totalDamage += damage;
          damageTypes[damageRoll.type] = (damageTypes[damageRoll.type] || 0) + damage;
          damageRolls.push(roll);
        }
      }
      
      // Apply damage to target
      this.applyDamage(target, totalDamage, damageTypes);
      
      return {
        hit: true,
        critical,
        attackRoll,
        damageRolls,
        totalDamage,
        damageTypes
      };
    }
    
    // Handle saving throw actions
    if (action.savingThrow) {
      const saveModifier = Math.floor((target.abilities[action.savingThrow.ability] - 10) / 2);
      const saveRoll = diceService.rollSkillCheck(saveModifier, action.savingThrow.dc);
      
      const effects = saveRoll.success ? 
        action.savingThrow.successEffect || [] : 
        action.savingThrow.failureEffect || [];
      
      // Apply effects
      for (const effect of effects) {
        this.applyEffect(target, effect);
      }
      
      this.logAction(encounter, {
        actor: target.id,
        action: `${action.savingThrow.ability} Save`,
        description: `${target.name} ${saveRoll.success ? 'succeeds' : 'fails'} ${action.savingThrow.ability} save (${saveRoll.total} vs DC ${action.savingThrow.dc})`,
        results: { success: saveRoll.success },
        rolls: [saveRoll]
      });
    }
    
    return null;
  }
  
  /**
   * Apply damage to a combatant
   */
  private applyDamage(target: Combatant, damage: number, damageTypes: { [key: string]: number }): void {
    // TODO: Apply resistances, immunities, vulnerabilities
    
    // Apply temporary HP first
    if (target.health.temporary && target.health.temporary > 0) {
      const tempDamage = Math.min(damage, target.health.temporary);
      target.health.temporary -= tempDamage;
      damage -= tempDamage;
      
      if (target.health.temporary <= 0) {
        target.health.temporary = 0;
      }
    }
    
    // Apply remaining damage to HP
    target.health.current = Math.max(0, target.health.current - damage);
    
    // Check for death/unconsciousness
    if (target.health.current <= 0) {
      // TODO: Handle death saves, unconsciousness
      this.addCondition(target, {
        name: 'Unconscious',
        description: 'The creature is unconscious',
        duration: -1, // Until healed
        source: 'damage',
        effects: []
      });
    }
  }
  
  /**
   * Calculate movement and positioning
   */
  calculateMovement(
    encounter: CombatEncounter,
    combatant: Combatant,
    targetPosition: { x: number; y: number }
  ): MovementPath {
    const start = combatant.position;
    const distance = Math.sqrt(
      Math.pow(targetPosition.x - start.x, 2) + 
      Math.pow(targetPosition.y - start.y, 2)
    );
    
    const remainingMovement = combatant.speed - combatant.actions.movement;
    
    // Simple path calculation (in a real implementation, use A* pathfinding)
    const path = [start, targetPosition];
    const cost = Math.ceil(distance * 5); // 5 feet per grid square
    
    return {
      valid: cost <= remainingMovement,
      path,
      cost,
      remainingMovement: Math.max(0, remainingMovement - cost)
    };
  }
  
  /**
   * Move a combatant
   */
  moveCombatant(
    encounterId: string,
    combatantId: string,
    targetPosition: { x: number; y: number }
  ): boolean {
    const encounter = this.getEncounter(encounterId);
    const combatant = this.getCombatant(encounter, combatantId);
    
    const movement = this.calculateMovement(encounter, combatant, targetPosition);
    
    if (!movement.valid) {
      return false;
    }
    
    combatant.position = targetPosition;
    combatant.actions.movement += movement.cost;
    
    this.logAction(encounter, {
      actor: combatant.id,
      action: 'Movement',
      description: `${combatant.name} moves to (${targetPosition.x}, ${targetPosition.y})`,
      results: { success: true }
    });
    
    return true;
  }
  
  // Utility Methods
  
  private getEncounter(encounterId: string): CombatEncounter {
    const encounter = this.encounters.get(encounterId);
    if (!encounter) {
      throw new Error(`Encounter ${encounterId} not found`);
    }
    return encounter;
  }
  
  private getCombatant(encounter: CombatEncounter, combatantId: string): Combatant {
    const combatant = encounter.combatants.find(c => c.id === combatantId);
    if (!combatant) {
      throw new Error(`Combatant ${combatantId} not found`);
    }
    return combatant;
  }
  
  private canPerformAction(combatant: Combatant, action: CombatAction): boolean {
    // Check if action type is available
    switch (action.actionCost) {
      case 'action':
        return !combatant.actions.action;
      case 'bonus_action':
        return !combatant.actions.bonusAction;
      case 'reaction':
        return !combatant.reactions.used;
      case 'movement':
        return combatant.actions.movement < combatant.speed;
      case 'free':
        return true;
      default:
        return false;
    }
  }
  
  private consumeAction(combatant: Combatant, actionType: string): void {
    switch (actionType) {
      case 'action':
        combatant.actions.action = true;
        break;
      case 'bonus_action':
        combatant.actions.bonusAction = true;
        break;
      case 'reaction':
        combatant.reactions.used = true;
        break;
    }
  }
  
  private processConditions(
    encounter: CombatEncounter, 
    combatant: Combatant, 
    timing: 'start_of_turn' | 'end_of_turn'
  ): void {
    // Process conditions that trigger at specific times
    for (const condition of [...combatant.conditions]) {
      if (condition.endsOnSave?.frequency === timing) {
        const saveModifier = Math.floor((combatant.abilities[condition.endsOnSave.ability] - 10) / 2);
        const saveRoll = diceService.rollSkillCheck(saveModifier, condition.endsOnSave.dc);
        
        if (saveRoll.success) {
          this.removeCondition(combatant, condition.name);
          this.logAction(encounter, {
            actor: combatant.id,
            action: 'Condition Save',
            description: `${combatant.name} saves against ${condition.name}`,
            results: { success: true },
            rolls: [saveRoll]
          });
        }
      }
      
      // Reduce duration
      if (condition.duration > 0) {
        condition.duration--;
        if (condition.duration <= 0) {
          this.removeCondition(combatant, condition.name);
        }
      }
    }
  }
  
  private addCondition(combatant: Combatant, condition: any): void {
    // TODO: Implement condition system properly
    combatant.conditions.push(condition);
  }
  
  private removeCondition(combatant: Combatant, conditionName: string): void {
    combatant.conditions = combatant.conditions.filter(c => c.name !== conditionName);
  }
  
  private applyEffect(target: Combatant, effect: any): void {
    // TODO: Implement effect system
    console.log(`Applying effect to ${target.name}:`, effect);
  }
  
  private calculateMaxDamage(diceExpression: string): number {
    const match = diceExpression.match(/(\d+)d(\d+)/);
    if (!match) return 0;
    
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    return count * sides;
  }
  
  private checkVictoryConditions(encounter: CombatEncounter): boolean {
    for (const condition of encounter.victoryConditions) {
      if (condition.completed) continue;
      
      switch (condition.type) {
        case 'defeat_all':
          const enemies = encounter.combatants.filter(c => c.type === 'enemy');
          const aliveEnemies = enemies.filter(c => c.health.current > 0);
          if (aliveEnemies.length === 0) {
            condition.completed = true;
            return true;
          }
          break;
      }
    }
    
    return false;
  }
  
  private endCombat(encounterId: string): void {
    const encounter = this.getEncounter(encounterId);
    encounter.phase = 'ended';
    encounter.endTime = Date.now();
    
    this.emitEvent('combat_end', { encounterId });
  }
  
  private logAction(encounter: CombatEncounter, entry: Partial<CombatLogEntry>): void {
    const logEntry: CombatLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      round: encounter.round,
      turn: encounter.currentTurn,
      timestamp: Date.now(),
      actor: entry.actor || '',
      action: entry.action || '',
      targets: entry.targets,
      results: entry.results || { success: false },
      rolls: entry.rolls,
      description: entry.description || ''
    };
    
    encounter.actionLog.push(logEntry);
  }
  
  private generateActionDescription(
    action: CombatAction,
    actor: Combatant,
    targets: Combatant[],
    results: AttackResult[]
  ): string {
    const targetNames = targets.map(t => t.name).join(', ');
    const totalDamage = results.reduce((sum, r) => sum + r.totalDamage, 0);
    const hits = results.filter(r => r.hit).length;
    const criticals = results.filter(r => r.critical).length;
    
    let description = `${actor.name} uses ${action.name}`;
    if (targets.length > 0) {
      description += ` against ${targetNames}`;
    }
    
    if (results.length > 0) {
      description += ` - ${hits}/${results.length} hit`;
      if (criticals > 0) {
        description += ` (${criticals} critical)`;
      }
      if (totalDamage > 0) {
        description += ` for ${totalDamage} damage`;
      }
    }
    
    return description;
  }
  
  // Event System
  
  addEventListener(eventType: string, handler: CombatEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }
  
  removeEventListener(eventType: string, handler: CombatEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  private emitEvent(type: string, data: any): void {
    const event: CombatEvent = {
      type: type as any,
      timestamp: Date.now(),
      ...data
    };
    
    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => handler(event));
  }
  
  // Public API
  
  getEncounterById(encounterId: string): CombatEncounter | null {
    return this.encounters.get(encounterId) || null;
  }
  
  getCurrentCombatant(encounterId: string): Combatant | null {
    const encounter = this.getEncounter(encounterId);
    if (encounter.phase !== 'combat' || encounter.currentTurn >= encounter.turnOrder.length) {
      return null;
    }
    
    const currentId = encounter.turnOrder[encounter.currentTurn];
    return this.getCombatant(encounter, currentId);
  }
  
  getAvailableActions(encounterId: string, combatantId: string): CombatAction[] {
    const encounter = this.getEncounter(encounterId);
    const combatant = this.getCombatant(encounter, combatantId);
    
    // TODO: Return available actions based on combatant's abilities, spells, etc.
    return [];
  }
}

export const combatEngine = new CombatEngine(); 