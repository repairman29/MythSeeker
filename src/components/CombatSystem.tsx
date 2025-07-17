import React, { useState, useEffect, useCallback } from 'react';
import { Sword, Shield, Zap, Heart, Target, Move, X, RotateCcw, Play, Pause, SkipForward, Eye, Mountain, Shield as ShieldIcon } from 'lucide-react';

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'npc';
  character?: any;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  mana?: number;
  maxMana?: number;
  actionPoints: {
    move: number;
    action: number;
    bonus: number;
    reaction: number;
  };
  currentActionPoints: {
    move: number;
    action: number;
    bonus: number;
    reaction: number;
  };
  stats: {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
    armorClass: number;
  };
  statusEffects: Array<{
    name: string;
    duration: number;
    effect: any;
  }>;
  isActive: boolean;
  hasActed: boolean;
  reach: number;
  skills: Record<string, any>;
}

export interface BattleMap {
  width: number;
  height: number;
  tiles: Array<Array<{
    type: 'floor' | 'wall' | 'difficult' | 'hazard';
    elevation: number;
    cover: number;
    occupied: boolean;
  }>>;
}

export interface CombatAction {
  type: 'move' | 'attack' | 'skill' | 'item' | 'end-turn';
  target?: { x: number; y: number } | string;
  skillId?: string;
  itemId?: string;
  path?: Array<{ x: number; y: number }>;
}

interface CombatSystemProps {
  combatants: Combatant[];
  battleMap: BattleMap;
  currentTurn: number;
  activeCombatantId: string | null;
  onAction: (action: CombatAction) => void;
  onEndCombat: () => void;
  isPlayerTurn: boolean;
}

// --- Advanced Combat Utilities ---

// Bresenham's line algorithm for grid-based line-of-sight
function hasLineOfSight(
  from: { x: number; y: number },
  to: { x: number; y: number },
  battleMap: BattleMap
): boolean {
  let x0 = from.x, y0 = from.y;
  let x1 = to.x, y1 = to.y;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (!(x0 === x1 && y0 === y1)) {
    if (battleMap.tiles[y0][x0].type === 'wall' || battleMap.tiles[y0][x0].cover >= 2) {
      return false; // Blocked by wall or heavy cover
    }
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return true;
}

// Check if a tile provides cover from a given attacker position
function getCoverLevel(
  tile: { x: number; y: number },
  attacker: { x: number; y: number },
  battleMap: BattleMap
): number {
  // Simple: return the cover value of the tile (0 = none, 1 = partial, 2 = full)
  // Can be extended to directional cover in the future
  return battleMap.tiles[tile.y][tile.x].cover;
}

// Check if a tile is high ground relative to another
function isHighGround(
  tile: { x: number; y: number },
  reference: { x: number; y: number },
  battleMap: BattleMap
): boolean {
  return battleMap.tiles[tile.y][tile.x].elevation > battleMap.tiles[reference.y][reference.x].elevation;
}

// Movement penalty for terrain
function getMovementCost(
  tile: { x: number; y: number },
  battleMap: BattleMap
): number {
  const t = battleMap.tiles[tile.y][tile.x];
  if (t.type === 'difficult') return 2;
  if (t.type === 'hazard') return 3;
  return 1;
}

const CombatSystem: React.FC<CombatSystemProps> = ({
  combatants,
  battleMap,
  currentTurn,
  activeCombatantId,
  onAction,
  onEndCombat,
  isPlayerTurn
}) => {
  const [selectedCombatant, setSelectedCombatant] = useState<Combatant | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedAction, setSelectedAction] = useState<'move' | 'attack' | 'skill' | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<Array<{ x: number; y: number }>>([]);
  const [validTargets, setValidTargets] = useState<Array<{ x: number; y: number; cover?: number }>>([]);
  const [showTacticalInfo, setShowTacticalInfo] = useState(false);
  const [tacticalOverlay, setTacticalOverlay] = useState<'cover' | 'elevation' | 'movement' | null>(null);

  const activeCombatant = combatants.find(c => c.id === activeCombatantId);

  // Calculate valid moves for selected combatant
  const calculateValidMoves = useCallback((combatant: Combatant) => {
    if (!combatant || combatant.currentActionPoints.move <= 0) return [];
    
    const moves: Array<{ x: number; y: number }> = [];
    const visited = new Set<string>();
    const queue: Array<{ x: number; y: number; cost: number }> = [
      { x: combatant.position.x, y: combatant.position.y, cost: 0 }
    ];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      if (current.cost <= combatant.currentActionPoints.move) {
        moves.push({ x: current.x, y: current.y });
        
        // Check adjacent tiles
        const directions = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        
        for (const dir of directions) {
          const newX = current.x + dir.dx;
          const newY = current.y + dir.dy;
          
          if (newX >= 0 && newX < battleMap.width && 
              newY >= 0 && newY < battleMap.height) {
            const tile = battleMap.tiles[newY][newX];
            if (tile.type !== 'wall' && !tile.occupied) {
              const moveCost = tile.type === 'difficult' ? 2 : 1;
              queue.push({ x: newX, y: newY, cost: current.cost + moveCost });
            }
          }
        }
      }
    }
    
    return moves;
  }, [battleMap]);

  // Calculate valid targets for attacks/skills (now with LoS and cover)
  const calculateValidTargets = useCallback((combatant: Combatant, skillId?: string) => {
    const targets: Array<{ x: number; y: number; cover?: number }> = [];
    const skill = skillId ? combatant.skills[skillId] : null;
    const range = skill?.range || combatant.reach;
    
    for (let y = 0; y < battleMap.height; y++) {
      for (let x = 0; x < battleMap.width; x++) {
        const distance = Math.abs(x - combatant.position.x) + Math.abs(y - combatant.position.y);
        if (distance <= range) {
          // Check if there's a target at this position
          const targetCombatant = combatants.find(c => 
            c.position.x === x && c.position.y === y && c.id !== combatant.id
          );
          if (targetCombatant) {
            // Check line of sight
            if (hasLineOfSight(combatant.position, { x, y }, battleMap)) {
              // Optionally, annotate cover for overlays/AI
              const cover = getCoverLevel({ x, y }, combatant.position, battleMap);
              targets.push({ x, y, cover });
            }
          }
        }
      }
    }
    return targets;
  }, [combatants, battleMap]);

  useEffect(() => {
    if (activeCombatant && selectedAction === 'move') {
      setValidMoves(calculateValidMoves(activeCombatant));
    } else if (activeCombatant && (selectedAction === 'attack' || selectedAction === 'skill')) {
      setValidTargets(calculateValidTargets(activeCombatant, selectedSkill || undefined));
    } else {
      setValidMoves([]);
      setValidTargets([]);
    }
  }, [activeCombatant, selectedAction, selectedSkill, calculateValidMoves, calculateValidTargets]);

  const handleTileClick = (x: number, y: number) => {
    if (!activeCombatant || !isPlayerTurn) return;

    if (selectedAction === 'move' && validMoves.some(move => move.x === x && move.y === y)) {
      onAction({
        type: 'move',
        target: { x, y },
        path: [{ x: activeCombatant.position.x, y: activeCombatant.position.y }, { x, y }]
      });
      setSelectedAction(null);
    } else if ((selectedAction === 'attack' || selectedAction === 'skill') && 
               validTargets.some(target => target.x === x && target.y === y)) {
      onAction({
        type: selectedAction === 'attack' ? 'attack' : 'skill',
        target: { x, y },
        skillId: selectedSkill || undefined
      });
      setSelectedAction(null);
      setSelectedSkill(null);
    }
  };

  const handleCombatantClick = (combatant: Combatant) => {
    setSelectedCombatant(combatant);
  };

  const handleEndTurn = () => {
    onAction({ type: 'end-turn' });
    setSelectedAction(null);
    setSelectedSkill(null);
  };

  // Enhanced tile class with tactical overlays
  const getTileClass = (x: number, y: number) => {
    const tile = battleMap.tiles[y][x];
    let classes = 'w-8 h-8 border border-gray-600 cursor-pointer transition-all relative';
    
    // Base tile styling
    if (hoveredTile?.x === x && hoveredTile?.y === y) {
      classes += ' bg-blue-400/50';
    } else if (validMoves.some(move => move.x === x && move.y === y)) {
      classes += ' bg-green-400/30';
    } else if (validTargets.some(target => target.x === x && target.y === y)) {
      classes += ' bg-red-400/30';
    } else {
      switch (tile.type) {
        case 'floor':
          classes += ' bg-gray-700';
          break;
        case 'wall':
          classes += ' bg-gray-900';
          break;
        case 'difficult':
          classes += ' bg-yellow-700';
          break;
        case 'hazard':
          classes += ' bg-red-700';
          break;
      }
    }

    // Tactical overlay styling
    if (tacticalOverlay === 'cover' && tile.cover > 0) {
      const coverIntensity = tile.cover === 1 ? 400 : 700;
      classes += ` bg-orange-${coverIntensity}/30`;
    } else if (tacticalOverlay === 'elevation' && tile.elevation > 0) {
      const elevationIntensity = Math.min(tile.elevation * 20, 60);
      classes += ` bg-purple-${elevationIntensity}/30`;
    } else if (tacticalOverlay === 'movement') {
      const cost = getMovementCost({ x, y }, battleMap);
      if (cost > 1) {
        const costIntensity = cost === 2 ? 400 : 700;
        classes += ` bg-yellow-${costIntensity}/30`;
      }
    }
    
    return classes;
  };

  // Get tactical tooltip content
  const getTacticalTooltip = (x: number, y: number) => {
    const tile = battleMap.tiles[y][x];
    const combatant = combatants.find(c => c.position.x === x && c.position.y === y);
    const info = [];

    // Tile information
    info.push(`Tile: ${tile.type}`);
    if (tile.elevation > 0) info.push(`Elevation: +${tile.elevation}`);
    if (tile.cover > 0) info.push(`Cover: ${tile.cover === 1 ? 'Partial' : 'Full'}`);
    
    const moveCost = getMovementCost({ x, y }, battleMap);
    if (moveCost > 1) info.push(`Movement Cost: ${moveCost}`);

    // Combatant information
    if (combatant) {
      info.push(`\n${combatant.name} (${combatant.type})`);
      info.push(`Health: ${combatant.health}/${combatant.maxHealth}`);
      info.push(`AC: ${combatant.stats.armorClass}`);
      
      // Tactical analysis if active combatant exists
      if (activeCombatant && activeCombatant.id !== combatant.id) {
        const hasLoS = hasLineOfSight(activeCombatant.position, { x, y }, battleMap);
        const cover = getCoverLevel({ x, y }, activeCombatant.position, battleMap);
        const isHigh = isHighGround({ x, y }, activeCombatant.position, battleMap);
        
        info.push(`\nTactical:`);
        info.push(`Line of Sight: ${hasLoS ? 'Yes' : 'No'}`);
        if (cover > 0) info.push(`Cover from you: ${cover === 1 ? 'Partial' : 'Full'}`);
        if (isHigh) info.push('High Ground');
      }
    }

    return info.join('\n');
  };

  const getCombatantIcon = (combatant: Combatant) => {
    if (combatant.type === 'player') return '👤';
    if (combatant.type === 'enemy') return '👹';
    return '🤖';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Combat Header */}
      <div className="bg-black/30 border-b border-white/20 p-4">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h3 className="text-lg font-bold">Combat - Turn {currentTurn}</h3>
            {activeCombatant && (
              <p className="text-blue-200">
                {activeCombatant.name}&apos;s turn
                {!isPlayerTurn && ' (AI thinking...)'}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {/* Tactical Overlay Controls */}
            <div className="flex space-x-1">
              <button
                onClick={() => setTacticalOverlay(tacticalOverlay === 'cover' ? null : 'cover')}
                className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
                  tacticalOverlay === 'cover' 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                } transition-all`}
                title="Show Cover"
              >
                <ShieldIcon size={12} />
                <span>Cover</span>
              </button>
              <button
                onClick={() => setTacticalOverlay(tacticalOverlay === 'elevation' ? null : 'elevation')}
                className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
                  tacticalOverlay === 'elevation' 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                } transition-all`}
                title="Show Elevation"
              >
                <Mountain size={12} />
                <span>Height</span>
              </button>
              <button
                onClick={() => setTacticalOverlay(tacticalOverlay === 'movement' ? null : 'movement')}
                className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
                  tacticalOverlay === 'movement' 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                } transition-all`}
                title="Show Movement Cost"
              >
                <Move size={12} />
                <span>Move</span>
              </button>
            </div>
            <button
              onClick={onEndCombat}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all"
            >
              End Combat
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Battle Map */}
        <div className="flex-1 p-4">
          <div className="bg-black/20 rounded-lg p-4 relative">
            <div className="grid gap-1" style={{
              gridTemplateColumns: `repeat(${battleMap.width}, 1fr)`,
              width: 'fit-content'
            }}>
              {battleMap.tiles.map((row, y) =>
                row.map((tile, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={getTileClass(x, y)}
                    onClick={() => handleTileClick(x, y)}
                    onMouseEnter={() => setHoveredTile({ x, y })}
                    onMouseLeave={() => setHoveredTile(null)}
                    title={getTacticalTooltip(x, y)}
                  >
                    {/* Combatant on this tile */}
                    {combatants.map(combatant => {
                      if (combatant.position.x === x && combatant.position.y === y) {
                        return (
                          <div
                            key={combatant.id}
                            className={`w-full h-full flex items-center justify-center text-lg cursor-pointer relative ${
                              combatant.id === activeCombatantId ? 'ring-2 ring-yellow-400' : ''
                            } ${combatant.health <= 0 ? 'opacity-50' : ''}`}
                            onClick={() => handleCombatantClick(combatant)}
                          >
                            {getCombatantIcon(combatant)}
                            
                            {/* Health bar overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div 
                                className="h-full bg-green-500"
                                style={{ width: `${(combatant.health / combatant.maxHealth) * 100}%` }}
                              />
                            </div>
                            
                            {/* Status effect indicators */}
                            {combatant.statusEffects.length > 0 && (
                              <div className="absolute -top-1 right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                                {combatant.statusEffects.length}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                    
                    {/* Tactical indicators */}
                    {tacticalOverlay && (
                      <div className="absolute top-0 right-0 text-xs">
                        {tacticalOverlay === 'cover' && tile.cover > 0 && (
                          <div className="bg-orange-500/30 text-white px-1 rounded">
                            {tile.cover}
                          </div>
                        )}
                        {tacticalOverlay === 'elevation' && tile.elevation > 0 && (
                          <div className="bg-purple-500/30 text-white px-1 rounded">
                            +{tile.elevation}
                          </div>
                        )}
                        {tacticalOverlay === 'movement' && getMovementCost({ x, y }, battleMap) > 1 && (
                          <div className="bg-yellow-500/30 text-black px-1 rounded">
                            {getMovementCost({ x, y }, battleMap)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Legend */}
            {tacticalOverlay && (
              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded">
                <div className="font-semibold mb-1">
                  {tacticalOverlay === 'cover' && (
                    <>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border border-orange-500"></div>
                        <span>Partial Cover</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border border-orange-700"></div>
                        <span>Full Cover</span>
                      </div>
                    </>
                  )}
                  {tacticalOverlay === 'elevation' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-purple-500"></div>
                      <span>High Ground</span>
                    </div>
                  )}
                  {tacticalOverlay === 'movement' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-yellow-500"></div>
                      <span>Difficult Terrain</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Combat Controls */}
        <div className="w-80 bg-black/20 border-l border-white/20 p-4">
          {activeCombatant && isPlayerTurn ? (
            <div className="space-y-4">
              {/* Combatant Info */}
              <div className="bg-white/10 rounded-lg p-3">
                <h4 className="text-white font-semibold">{activeCombatant.name}</h4>
                <div className="text-sm text-blue-200">
                  <div className="flex items-center space-x-2">
                    <Heart size={14} />
                    <span>Health: {activeCombatant.health}/{activeCombatant.maxHealth}</span>
                  </div>
                  {activeCombatant.mana !== undefined && (
                    <div className="flex items-center space-x-2">
                      <Zap size={14} />
                      <span>Mana: {activeCombatant.mana}/{activeCombatant.maxMana}</span>
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Move size={14} />
                      <span>Move: {activeCombatant.currentActionPoints.move}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sword size={14} />
                      <span>Action: {activeCombatant.currentActionPoints.action}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap size={14} />
                      <span>Bonus: {activeCombatant.currentActionPoints.bonus}</span>
                    </div>
                  </div>
                  
                  {/* Status Effects */}
                  {activeCombatant.statusEffects.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-yellow-200 font-semibold">Status Effects:</div>
                      {activeCombatant.statusEffects.map((effect, index) => (
                        <div key={index} className="text-xs text-red-200">
                          {effect.name} ({effect.duration} turns)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedAction('move')}
                  disabled={activeCombatant.currentActionPoints.move <= 0}
                  className={`w-full px-3 py-2 rounded flex items-center space-x-2 ${
                    selectedAction === 'move' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  <Move size={16} />
                  <span>Move</span>
                </button>

                <button
                  onClick={() => setSelectedAction('attack')}
                  disabled={activeCombatant.currentActionPoints.action <= 0}
                  className={`w-full px-3 py-2 rounded flex items-center space-x-2 ${
                    selectedAction === 'attack' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  <Sword size={16} />
                  <span>Attack</span>
                </button>

                <button
                  onClick={() => setSelectedAction('skill')}
                  disabled={activeCombatant.currentActionPoints.action <= 0}
                  className={`w-full px-3 py-2 rounded flex items-center space-x-2 ${
                    selectedAction === 'skill' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  <Zap size={16} />
                  <span>Skills</span>
                </button>
              </div>

              {/* Skills List */}
              {selectedAction === 'skill' && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(activeCombatant.skills).map(([skillId, skill]: [string, any]) => (
                    <button
                      key={skillId}
                      onClick={() => setSelectedSkill(skillId)}
                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                        selectedSkill === skillId 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      } transition-all`}
                    >
                      <div className="font-semibold">{skill.name}</div>
                      <div className="text-xs text-blue-200">{skill.description}</div>
                      {skill.range && (
                        <div className="text-xs text-green-200">Range: {skill.range}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* End Turn */}
              <button
                onClick={handleEndTurn}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-all"
              >
                End Turn
              </button>
            </div>
          ) : (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Waiting for turn...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombatSystem; 