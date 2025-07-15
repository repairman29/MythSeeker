import { Combatant, BattleMap, CombatAction } from '../components/CombatSystem';

export interface CombatState {
  isActive: boolean;
  currentTurn: number;
  turnOrder: string[];
  currentCombatantIndex: number;
  combatants: Combatant[];
  battleMap: BattleMap;
  combatLog: Array<{
    id: string;
    turn: number;
    combatantId: string;
    action: string;
    target?: string;
    result: string;
    timestamp: number;
  }>;
  round: number;
}

export class CombatService {
  private state: CombatState;

  constructor() {
    this.state = {
      isActive: false,
      currentTurn: 0,
      turnOrder: [],
      currentCombatantIndex: 0,
      combatants: [],
      battleMap: this.createDefaultBattleMap(),
      combatLog: [],
      round: 1
    };
  }

  private createDefaultBattleMap(): BattleMap {
    const width = 12;
    const height = 8;
    const tiles = [];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        // Create some basic terrain
        let type: 'floor' | 'wall' | 'difficult' | 'hazard' = 'floor';
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          type = 'wall';
        } else if (Math.random() < 0.1) {
          type = 'difficult';
        }

        row.push({
          type,
          elevation: 0,
          cover: 0,
          occupied: false
        });
      }
      tiles.push(row);
    }

    return { width, height, tiles };
  }

  public startCombat(combatants: Combatant[], customMap?: BattleMap): CombatState {
    // Initialize combatants with starting positions
    const positionedCombatants = this.assignStartingPositions(combatants, customMap || this.state.battleMap);
    
    // Determine turn order based on initiative
    const turnOrder = this.calculateInitiativeOrder(positionedCombatants);
    
    // Reset action points for all combatants
    const resetCombatants = positionedCombatants.map(combatant => ({
      ...combatant,
      currentActionPoints: { ...combatant.actionPoints },
      isActive: false,
      hasActed: false
    }));

    this.state = {
      isActive: true,
      currentTurn: 0,
      turnOrder,
      currentCombatantIndex: 0,
      combatants: resetCombatants,
      battleMap: customMap || this.state.battleMap,
      combatLog: [],
      round: 1
    };

    // Set first combatant as active
    this.setActiveCombatant(0);

    return this.getState();
  }

  private assignStartingPositions(combatants: Combatant[], battleMap: BattleMap): Combatant[] {
    const positionedCombatants = [...combatants];
    const centerX = Math.floor(battleMap.width / 2);
    const centerY = Math.floor(battleMap.height / 2);

    // Place players on the left side
    const players = positionedCombatants.filter(c => c.type === 'player');
    players.forEach((player, index) => {
      player.position = {
        x: Math.max(1, centerX - 3 + index),
        y: centerY
      };
    });

    // Place enemies on the right side
    const enemies = positionedCombatants.filter(c => c.type === 'enemy');
    enemies.forEach((enemy, index) => {
      enemy.position = {
        x: Math.min(battleMap.width - 2, centerX + 3 - index),
        y: centerY
      };
    });

    return positionedCombatants;
  }

  private calculateInitiativeOrder(combatants: Combatant[]): string[] {
    return combatants
      .map(combatant => ({
        id: combatant.id,
        initiative: this.rollInitiative(combatant)
      }))
      .sort((a, b) => b.initiative - a.initiative)
      .map(c => c.id);
  }

  private rollInitiative(combatant: Combatant): number {
    const dexMod = Math.floor((combatant.stats.dexterity - 10) / 2);
    return Math.floor(Math.random() * 20) + 1 + dexMod;
  }

  public getState(): CombatState {
    return { ...this.state };
  }

  public getActiveCombatant(): Combatant | null {
    if (!this.state.isActive || this.state.turnOrder.length === 0) return null;
    const activeId = this.state.turnOrder[this.state.currentCombatantIndex];
    return this.state.combatants.find(c => c.id === activeId) || null;
  }

  public isPlayerTurn(): boolean {
    const activeCombatant = this.getActiveCombatant();
    return activeCombatant?.type === 'player';
  }

  public executeAction(action: CombatAction): { success: boolean; message: string; newState?: CombatState } {
    const activeCombatant = this.getActiveCombatant();
    if (!activeCombatant) {
      return { success: false, message: 'No active combatant' };
    }

    switch (action.type) {
      case 'move':
        return this.executeMove(activeCombatant, action);
      case 'attack':
        return this.executeAttack(activeCombatant, action);
      case 'skill':
        return this.executeSkill(activeCombatant, action);
      case 'end-turn':
        return this.endTurn();
      default:
        return { success: false, message: 'Unknown action type' };
    }
  }

  private executeMove(combatant: Combatant, action: CombatAction): { success: boolean; message: string; newState?: CombatState } {
    if (combatant.currentActionPoints.move <= 0) {
      return { success: false, message: 'No movement points remaining' };
    }

    if (!action.target || typeof action.target === 'string') {
      return { success: false, message: 'Invalid move target' };
    }

    const targetX = action.target.x;
    const targetY = action.target.y;

    // Validate move
    if (targetX < 0 || targetX >= this.state.battleMap.width || 
        targetY < 0 || targetY >= this.state.battleMap.height) {
      return { success: false, message: 'Target position out of bounds' };
    }

    const targetTile = this.state.battleMap.tiles[targetY][targetX];
    if (targetTile.type === 'wall' || targetTile.occupied) {
      return { success: false, message: 'Cannot move to occupied or wall tile' };
    }

    // Calculate move cost
    const distance = Math.abs(targetX - combatant.position.x) + Math.abs(targetY - combatant.position.y);
    const moveCost = targetTile.type === 'difficult' ? distance * 2 : distance;

    if (moveCost > combatant.currentActionPoints.move) {
      return { success: false, message: 'Not enough movement points' };
    }

    // Execute move
    const updatedCombatants = this.state.combatants.map(c => {
      if (c.id === combatant.id) {
        return {
          ...c,
          position: { x: targetX, y: targetY },
          currentActionPoints: {
            ...c.currentActionPoints,
            move: c.currentActionPoints.move - moveCost
          }
        };
      }
      return c;
    });

    this.state.combatants = updatedCombatants;
    this.addCombatLog(combatant.id, 'move', `${combatant.name} moved to (${targetX}, ${targetY})`);

    return { 
      success: true, 
      message: `${combatant.name} moved to (${targetX}, ${targetY})`,
      newState: this.getState()
    };
  }

  private executeAttack(combatant: Combatant, action: CombatAction): { success: boolean; message: string; newState?: CombatState } {
    if (combatant.currentActionPoints.action <= 0) {
      return { success: false, message: 'No action points remaining' };
    }

    if (!action.target || typeof action.target === 'string') {
      return { success: false, message: 'Invalid attack target' };
    }

    const targetX = action.target.x;
    const targetY = action.target.y;

    // Find target combatant
    const targetCombatant = this.state.combatants.find(c => 
      c.position.x === targetX && c.position.y === targetY && c.id !== combatant.id
    );

    if (!targetCombatant) {
      return { success: false, message: 'No target at specified position' };
    }

    // Check range
    const distance = Math.abs(targetX - combatant.position.x) + Math.abs(targetY - combatant.position.y);
    if (distance > combatant.reach) {
      return { success: false, message: 'Target out of range' };
    }

    // Calculate attack
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const attackMod = Math.floor((combatant.stats.strength - 10) / 2);
    const totalAttack = attackRoll + attackMod;

    if (totalAttack >= targetCombatant.stats.armorClass) {
      // Hit! Calculate damage
      const damage = this.calculateDamage(combatant);
      
      // Apply damage
      const updatedCombatants = this.state.combatants.map(c => {
        if (c.id === targetCombatant.id) {
          const newHealth = Math.max(0, c.health - damage);
          return { ...c, health: newHealth };
        }
        return c;
      });

      this.state.combatants = updatedCombatants;
      this.addCombatLog(combatant.id, 'attack', `${combatant.name} hit ${targetCombatant.name} for ${damage} damage`);

      // Check if target is defeated
      if (targetCombatant.health - damage <= 0) {
        this.addCombatLog(targetCombatant.id, 'defeat', `${targetCombatant.name} was defeated!`);
      }

      // Use action point
      const updatedCombatant = this.state.combatants.find(c => c.id === combatant.id);
      if (updatedCombatant) {
        updatedCombatant.currentActionPoints.action--;
      }

      return { 
        success: true, 
        message: `${combatant.name} hit ${targetCombatant.name} for ${damage} damage`,
        newState: this.getState()
      };
    } else {
      // Miss
      this.addCombatLog(combatant.id, 'attack', `${combatant.name} missed ${targetCombatant.name}`);
      
      // Use action point even on miss
      const updatedCombatant = this.state.combatants.find(c => c.id === combatant.id);
      if (updatedCombatant) {
        updatedCombatant.currentActionPoints.action--;
      }

      return { 
        success: true, 
        message: `${combatant.name} missed ${targetCombatant.name}`,
        newState: this.getState()
      };
    }
  }

  private executeSkill(combatant: Combatant, action: CombatAction): { success: boolean; message: string; newState?: CombatState } {
    if (combatant.currentActionPoints.action <= 0) {
      return { success: false, message: 'No action points remaining' };
    }

    if (!action.skillId) {
      return { success: false, message: 'No skill specified' };
    }

    const skill = combatant.skills[action.skillId];
    if (!skill) {
      return { success: false, message: 'Skill not found' };
    }

    // For now, implement basic skill effects
    // In a full implementation, this would be much more complex
    this.addCombatLog(combatant.id, 'skill', `${combatant.name} used ${skill.name}`);
    
    // Use action point
    const updatedCombatant = this.state.combatants.find(c => c.id === combatant.id);
    if (updatedCombatant) {
      updatedCombatant.currentActionPoints.action--;
    }

    return { 
      success: true, 
      message: `${combatant.name} used ${skill.name}`,
      newState: this.getState()
    };
  }

  private endTurn(): { success: boolean; message: string; newState?: CombatState } {
    const activeCombatant = this.getActiveCombatant();
    if (!activeCombatant) {
      return { success: false, message: 'No active combatant' };
    }

    // Mark combatant as having acted
    const updatedCombatants = this.state.combatants.map(c => {
      if (c.id === activeCombatant.id) {
        return { ...c, hasActed: true };
      }
      return c;
    });

    this.state.combatants = updatedCombatants;
    this.addCombatLog(activeCombatant.id, 'end-turn', `${activeCombatant.name} ended their turn`);

    // Move to next combatant
    this.state.currentCombatantIndex = (this.state.currentCombatantIndex + 1) % this.state.turnOrder.length;

    // Check if round is complete
    if (this.state.currentCombatantIndex === 0) {
      this.state.round++;
      this.startNewRound();
    }

    this.setActiveCombatant(this.state.currentCombatantIndex);

    return { 
      success: true, 
      message: `Turn ended. Next: ${this.getActiveCombatant()?.name || 'Unknown'}`,
      newState: this.getState()
    };
  }

  private startNewRound(): void {
    // Reset action points for all combatants
    this.state.combatants = this.state.combatants.map(combatant => ({
      ...combatant,
      currentActionPoints: { ...combatant.actionPoints },
      hasActed: false
    }));

    this.addCombatLog('system', 'round', `Round ${this.state.round} begins!`);
  }

  private setActiveCombatant(index: number): void {
    // Clear previous active combatant
    this.state.combatants = this.state.combatants.map(c => ({
      ...c,
      isActive: false
    }));

    // Set new active combatant
    const activeId = this.state.turnOrder[index];
    const activeCombatant = this.state.combatants.find(c => c.id === activeId);
    if (activeCombatant) {
      activeCombatant.isActive = true;
    }
  }

  private calculateDamage(combatant: Combatant): number {
    // Basic damage calculation - in a full system this would be more complex
    const strMod = Math.floor((combatant.stats.strength - 10) / 2);
    return Math.max(1, Math.floor(Math.random() * 6) + 1 + strMod);
  }

  private addCombatLog(combatantId: string, action: string, message: string): void {
    const logEntry = {
      id: Date.now().toString(),
      turn: this.state.currentTurn,
      combatantId,
      action,
      result: message,
      timestamp: Date.now()
    };

    this.state.combatLog.push(logEntry);
  }

  public endCombat(): CombatState {
    this.state.isActive = false;
    return this.getState();
  }

  public checkCombatEnd(): { ended: boolean; winner?: 'players' | 'enemies' } {
    const players = this.state.combatants.filter(c => c.type === 'player');
    const enemies = this.state.combatants.filter(c => c.type === 'enemy');

    const alivePlayers = players.filter(p => p.health > 0);
    const aliveEnemies = enemies.filter(e => e.health > 0);

    if (alivePlayers.length === 0) {
      return { ended: true, winner: 'enemies' };
    }

    if (aliveEnemies.length === 0) {
      return { ended: true, winner: 'players' };
    }

    return { ended: false };
  }
}

export default CombatService; 