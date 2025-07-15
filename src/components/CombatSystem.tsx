import React, { useState, useEffect, useCallback } from 'react';
import { Sword, Shield, Zap, Heart, Target, Move, X, RotateCcw, Play, Pause, SkipForward } from 'lucide-react';

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
  const [validTargets, setValidTargets] = useState<Array<{ x: number; y: number }>>([]);

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

  // Calculate valid targets for attacks/skills
  const calculateValidTargets = useCallback((combatant: Combatant, skillId?: string) => {
    const targets: Array<{ x: number; y: number }> = [];
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
            targets.push({ x, y });
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

  const getTileClass = (x: number, y: number) => {
    const tile = battleMap.tiles[y][x];
    let classes = 'w-8 h-8 border border-gray-600 cursor-pointer transition-all';
    
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
    
    return classes;
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
                {activeCombatant.name}'s turn
                {!isPlayerTurn && ' (AI thinking...)'}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
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
          <div className="bg-black/20 rounded-lg p-4">
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
                  >
                    {/* Combatant on this tile */}
                    {combatants.map(combatant => {
                      if (combatant.position.x === x && combatant.position.y === y) {
                        return (
                          <div
                            key={combatant.id}
                            className={`w-full h-full flex items-center justify-center text-lg cursor-pointer ${
                              combatant.id === activeCombatantId ? 'ring-2 ring-yellow-400' : ''
                            } ${combatant.health <= 0 ? 'opacity-50' : ''}`}
                            onClick={() => handleCombatantClick(combatant)}
                          >
                            {getCombatantIcon(combatant)}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ))
              )}
            </div>
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
                  <div>Health: {activeCombatant.health}/{activeCombatant.maxHealth}</div>
                  {activeCombatant.mana !== undefined && (
                    <div>Mana: {activeCombatant.mana}/{activeCombatant.maxMana}</div>
                  )}
                  <div className="mt-2">
                    <div>Move: {activeCombatant.currentActionPoints.move}</div>
                    <div>Action: {activeCombatant.currentActionPoints.action}</div>
                    <div>Bonus: {activeCombatant.currentActionPoints.bonus}</div>
                  </div>
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
                <div className="space-y-1">
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