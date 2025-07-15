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
  lineOfSightCache: Record<string, Set<string>>;
}

export interface EnemyAI {
  personality: 'aggressive' | 'defensive' | 'tactical' | 'cowardly';
  preferredRange: 'melee' | 'ranged' | 'mixed';
  targetPriority: 'weakest' | 'strongest' | 'closest' | 'threat';
  retreatThreshold: number; // Health percentage to retreat
  flankingBonus: boolean;
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
      round: 1,
      lineOfSightCache: {}
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
      round: 1,
      lineOfSightCache: {}
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

  // Advanced Line of Sight Calculation
  private calculateLineOfSight(from: { x: number; y: number }, to: { x: number; y: number }): boolean {
    const key = `${from.x},${from.y}-${to.x},${to.y}`;
    if (this.state.lineOfSightCache[key]) {
      return this.state.lineOfSightCache[key].has('visible');
    }

    // Bresenham's line algorithm for line of sight
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;
    let err = dx - dy;

    let x = from.x;
    let y = from.y;

    while (x !== to.x || y !== to.y) {
      // Check if current tile blocks line of sight
      if (x >= 0 && x < this.state.battleMap.width && y >= 0 && y < this.state.battleMap.height) {
        const tile = this.state.battleMap.tiles[y][x];
        if (tile.type === 'wall' || tile.cover >= 3) {
          this.state.lineOfSightCache[key] = new Set(['blocked']);
          return false;
        }
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    this.state.lineOfSightCache[key] = new Set(['visible']);
    return true;
  }

  // Get visible targets for a combatant
  private getVisibleTargets(combatant: Combatant): Combatant[] {
    return this.state.combatants.filter(target => {
      if (target.id === combatant.id || target.health <= 0) return false;
      return this.calculateLineOfSight(combatant.position, target.position);
    });
  }

  // Calculate flanking bonus
  private calculateFlankingBonus(attacker: Combatant, target: Combatant): number {
    const allies = this.state.combatants.filter(c => 
      c.type === attacker.type && c.id !== attacker.id && c.health > 0
    );

    for (const ally of allies) {
      // Check if ally is on opposite side of target
      const allyToTarget = Math.abs(ally.position.x - target.position.x) + Math.abs(ally.position.y - target.position.y);
      const attackerToTarget = Math.abs(attacker.position.x - target.position.x) + Math.abs(attacker.position.y - target.position.y);
      
      if (allyToTarget <= 1 && attackerToTarget <= 1) {
        // Check if they're roughly on opposite sides
        const dx1 = ally.position.x - target.position.x;
        const dy1 = ally.position.y - target.position.y;
        const dx2 = attacker.position.x - target.position.x;
        const dy2 = attacker.position.y - target.position.y;
        
        if ((dx1 * dx2 < 0 || dy1 * dy2 < 0) && (dx1 !== 0 || dx2 !== 0) && (dy1 !== 0 || dy2 !== 0)) {
          return 2; // Flanking bonus
        }
      }
    }
    return 0;
  }

  // Advanced Enemy AI Decision Making
  private getEnemyAIAction(enemy: Combatant): CombatAction | null {
    const visibleTargets = this.getVisibleTargets(enemy);
    if (visibleTargets.length === 0) {
      // No visible targets, try to move towards last known player position
      return this.getMovementTowardsPlayers(enemy);
    }

    const ai: EnemyAI = {
      personality: 'aggressive',
      preferredRange: 'melee',
      targetPriority: 'closest',
      retreatThreshold: 0.3,
      flankingBonus: true
    };

    // Check if should retreat
    if (enemy.health / enemy.maxHealth < ai.retreatThreshold) {
      return this.getRetreatAction(enemy);
    }

    // Select target based on priority
    const target = this.selectTarget(visibleTargets, ai.targetPriority, enemy);

    // Determine action based on personality and situation
    switch (ai.personality) {
      case 'aggressive':
        return this.getAggressiveAction(enemy, target, ai);
      case 'defensive':
        return this.getDefensiveAction(enemy, target, ai);
      case 'tactical':
        return this.getTacticalAction(enemy, target, ai);
      case 'cowardly':
        return this.getCowardlyAction(enemy, target, ai);
      default:
        return this.getAggressiveAction(enemy, target, ai);
    }
  }

  private selectTarget(targets: Combatant[], priority: string, enemy: Combatant): Combatant {
    switch (priority) {
      case 'weakest':
        return targets.reduce((weakest, current) => 
          current.health < weakest.health ? current : weakest
        );
      case 'strongest':
        return targets.reduce((strongest, current) => 
          current.health > strongest.health ? current : strongest
        );
      case 'closest':
        return targets.reduce((closest, current) => {
          const closestDist = Math.abs(closest.position.x - enemy.position.x) + Math.abs(closest.position.y - enemy.position.y);
          const currentDist = Math.abs(current.position.x - enemy.position.x) + Math.abs(current.position.y - enemy.position.y);
          return currentDist < closestDist ? current : closest;
        });
      case 'threat':
        // Calculate threat based on damage potential and health
        return targets.reduce((highestThreat, current) => {
          const currentThreat = (current.maxHealth - current.health) * 2 + current.stats.strength;
          const highestThreatValue = (highestThreat.maxHealth - highestThreat.health) * 2 + highestThreat.stats.strength;
          return currentThreat > highestThreatValue ? current : highestThreat;
        });
      default:
        return targets[0];
    }
  }

  private getAggressiveAction(enemy: Combatant, target: Combatant, ai: EnemyAI): CombatAction {
    const distance = Math.abs(target.position.x - enemy.position.x) + Math.abs(target.position.y - enemy.position.y);
    
    if (distance <= enemy.reach && enemy.currentActionPoints.action > 0) {
      return {
        type: 'attack',
        target: target.position
      };
    } else if (enemy.currentActionPoints.move > 0) {
      // Move towards target
      const path = this.findPathToTarget(enemy, target);
      if (path.length > 1) {
        return {
          type: 'move',
          target: path[1],
          path: path
        };
      }
    }
    
    return { type: 'end-turn' };
  }

  private getDefensiveAction(enemy: Combatant, target: Combatant, ai: EnemyAI): CombatAction {
    // Defensive AI tries to maintain distance and use cover
    const distance = Math.abs(target.position.x - enemy.position.x) + Math.abs(target.position.y - enemy.position.y);
    
    if (distance <= 1 && enemy.currentActionPoints.move > 0) {
      // Too close, try to back away
      const retreatPosition = this.findRetreatPosition(enemy, target);
      if (retreatPosition) {
        return {
          type: 'move',
          target: retreatPosition
        };
      }
    } else if (distance <= enemy.reach && enemy.currentActionPoints.action > 0) {
      return {
        type: 'attack',
        target: target.position
      };
    }
    
    return { type: 'end-turn' };
  }

  private getTacticalAction(enemy: Combatant, target: Combatant, ai: EnemyAI): CombatAction {
    // Tactical AI considers positioning, flanking, and cover
    const flankingBonus = this.calculateFlankingBonus(enemy, target);
    
    if (flankingBonus > 0 && enemy.currentActionPoints.action > 0) {
      return {
        type: 'attack',
        target: target.position
      };
    }
    
    // Try to find better positioning
    const betterPosition = this.findTacticalPosition(enemy, target);
    if (betterPosition && enemy.currentActionPoints.move > 0) {
      return {
        type: 'move',
        target: betterPosition
      };
    }
    
    return this.getAggressiveAction(enemy, target, ai);
  }

  private getCowardlyAction(enemy: Combatant, target: Combatant, ai: EnemyAI): CombatAction {
    // Cowardly AI tries to avoid direct confrontation
    const distance = Math.abs(target.position.x - enemy.position.x) + Math.abs(target.position.y - enemy.position.y);
    
    if (distance <= 2) {
      // Too close, retreat
      const retreatPosition = this.findRetreatPosition(enemy, target);
      if (retreatPosition && enemy.currentActionPoints.move > 0) {
        return {
          type: 'move',
          target: retreatPosition
        };
      }
    }
    
    // Only attack if target is very weak
    if (target.health / target.maxHealth < 0.3 && enemy.currentActionPoints.action > 0) {
      return {
        type: 'attack',
        target: target.position
      };
    }
    
    return { type: 'end-turn' };
  }

  private findPathToTarget(enemy: Combatant, target: Combatant): Array<{ x: number; y: number }> {
    // Simple A* pathfinding
    const openSet = [{ x: enemy.position.x, y: enemy.position.y, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, { x: number; y: number }>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    gScore.set(`${enemy.position.x},${enemy.position.y}`, 0);
    fScore.set(`${enemy.position.x},${enemy.position.y}`, this.heuristic(enemy.position, target.position));
    
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.x},${current.y}`;
      
      if (current.x === target.position.x && current.y === target.position.y) {
        // Reconstruct path
        const path = [];
        let currentPos = { x: current.x, y: current.y };
        while (cameFrom.has(`${currentPos.x},${currentPos.y}`)) {
          path.unshift(currentPos);
          currentPos = cameFrom.get(`${currentPos.x},${currentPos.y}`)!;
        }
        path.unshift({ x: enemy.position.x, y: enemy.position.y });
        return path;
      }
      
      closedSet.add(currentKey);
      
      // Check neighbors
      const directions = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }];
      for (const dir of directions) {
        const neighbor = { x: current.x + dir.dx, y: current.y + dir.dy };
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (neighbor.x < 0 || neighbor.x >= this.state.battleMap.width ||
            neighbor.y < 0 || neighbor.y >= this.state.battleMap.height ||
            closedSet.has(neighborKey)) {
          continue;
        }
        
        const tile = this.state.battleMap.tiles[neighbor.y][neighbor.x];
        if (tile.type === 'wall' || tile.occupied) {
          continue;
        }
        
        const tentativeGScore = gScore.get(currentKey)! + (tile.type === 'difficult' ? 2 : 1);
        
        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)!) {
          cameFrom.set(neighborKey, { x: current.x, y: current.y });
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, target.position));
          
          if (!openSet.find(node => node.x === neighbor.x && node.y === neighbor.y)) {
            openSet.push({
              x: neighbor.x,
              y: neighbor.y,
              g: tentativeGScore,
              h: this.heuristic(neighbor, target.position),
              f: tentativeGScore + this.heuristic(neighbor, target.position),
              parent: null
            });
          }
        }
      }
    }
    
    return [{ x: enemy.position.x, y: enemy.position.y }];
  }

  private heuristic(from: { x: number; y: number }, to: { x: number; y: number }): number {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  }

  private findRetreatPosition(enemy: Combatant, target: Combatant): { x: number; y: number } | null {
    const directions = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }];
    
    for (const dir of directions) {
      const newX = enemy.position.x + dir.dx;
      const newY = enemy.position.y + dir.dy;
      
      if (newX >= 0 && newX < this.state.battleMap.width &&
          newY >= 0 && newY < this.state.battleMap.height) {
        const tile = this.state.battleMap.tiles[newY][newX];
        if (tile.type !== 'wall' && !tile.occupied) {
          const distance = Math.abs(newX - target.position.x) + Math.abs(newY - target.position.y);
          if (distance > 1) {
            return { x: newX, y: newY };
          }
        }
      }
    }
    
    return null;
  }

  private findTacticalPosition(enemy: Combatant, target: Combatant): { x: number; y: number } | null {
    // Find position that provides flanking or better cover
    const directions = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }];
    
    for (const dir of directions) {
      const newX = enemy.position.x + dir.dx;
      const newY = enemy.position.y + dir.dy;
      
      if (newX >= 0 && newX < this.state.battleMap.width &&
          newY >= 0 && newY < this.state.battleMap.height) {
        const tile = this.state.battleMap.tiles[newY][newX];
        if (tile.type !== 'wall' && !tile.occupied) {
          // Check if this position provides better tactical advantage
          const tempPosition = { x: newX, y: newY };
          const flankingBonus = this.calculateFlankingBonus({ ...enemy, position: tempPosition }, target);
          if (flankingBonus > 0 || tile.cover > 0) {
            return tempPosition;
          }
        }
      }
    }
    
    return null;
  }

  private getMovementTowardsPlayers(enemy: Combatant): CombatAction | null {
    const players = this.state.combatants.filter(c => c.type === 'player' && c.health > 0);
    if (players.length === 0) return { type: 'end-turn' };
    
    // Move towards the closest player
    const closestPlayer = players.reduce((closest, current) => {
      const closestDist = Math.abs(closest.position.x - enemy.position.x) + Math.abs(closest.position.y - enemy.position.y);
      const currentDist = Math.abs(current.position.x - enemy.position.x) + Math.abs(current.position.y - enemy.position.y);
      return currentDist < closestDist ? current : closest;
    });
    
    const path = this.findPathToTarget(enemy, closestPlayer);
    if (path.length > 1 && enemy.currentActionPoints.move > 0) {
      return {
        type: 'move',
        target: path[1],
        path: path
      };
    }
    
    return { type: 'end-turn' };
  }

  // Enhanced attack calculation with line of sight and flanking
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

    // Check line of sight
    if (!this.calculateLineOfSight(combatant.position, targetCombatant.position)) {
      return { success: false, message: 'Target not in line of sight' };
    }

    // Check range
    const distance = Math.abs(targetX - combatant.position.x) + Math.abs(targetY - combatant.position.y);
    if (distance > combatant.reach) {
      return { success: false, message: 'Target out of range' };
    }

    // Calculate attack with flanking bonus
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const attackMod = Math.floor((combatant.stats.strength - 10) / 2);
    const flankingBonus = this.calculateFlankingBonus(combatant, targetCombatant);
    const totalAttack = attackRoll + attackMod + flankingBonus;

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
      
      const flankingText = flankingBonus > 0 ? ' (flanking!)' : '';
      this.addCombatLog(combatant.id, 'attack', `${combatant.name} hit ${targetCombatant.name} for ${damage} damage${flankingText}`);

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
        message: `${combatant.name} hit ${targetCombatant.name} for ${damage} damage${flankingText}`,
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

  // Execute AI turn for enemies
  public executeAITurn(): { success: boolean; message: string; newState?: CombatState } {
    const activeCombatant = this.getActiveCombatant();
    if (!activeCombatant || activeCombatant.type !== 'enemy') {
      return { success: false, message: 'No enemy combatant active' };
    }

    const aiAction = this.getEnemyAIAction(activeCombatant);
    if (!aiAction) {
      return this.endTurn();
    }

    return this.executeAction(aiAction);
  }
}

export default CombatService; 