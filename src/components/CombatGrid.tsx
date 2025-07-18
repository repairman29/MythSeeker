import React, { useState, useEffect, useCallback, useRef } from 'react';
import { combatEngine } from '../services/combatEngine';
// import { DiceSystem3D } from './DiceSystem3D'; // Temporarily disabled due to React version conflicts
import { 
  CombatEncounter, 
  Combatant, 
  CombatAction, 
  AttackResult,
  MovementPath,
  CombatLogEntry
} from '../types/combat';
import { DiceRoll as EnhancedDiceRoll } from '../types/dice';

interface CombatGridProps {
  encounterId: string;
  onCombatEnd?: (encounter: CombatEncounter) => void;
  onError?: (error: string) => void;
}

interface SelectedCell {
  x: number;
  y: number;
  type: 'movement' | 'attack' | 'spell';
}

const CombatGrid: React.FC<CombatGridProps> = ({ 
  encounterId, 
  onCombatEnd, 
  onError 
}) => {
  const [encounter, setEncounter] = useState<CombatEncounter | null>(null);
  const [selectedCombatant, setSelectedCombatant] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [movementPath, setMovementPath] = useState<MovementPath | null>(null);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [pendingRoll, setPendingRoll] = useState<{ action: CombatAction; targets: string[] } | null>(null);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const CELL_SIZE = 40; // pixels

  // Load encounter data
  useEffect(() => {
    const loadEncounter = () => {
      const enc = combatEngine.getEncounterById(encounterId);
      if (enc) {
        setEncounter(enc);
        setCombatLog(enc.actionLog.slice(-10)); // Show last 10 actions
      } else if (onError) {
        onError(`Encounter ${encounterId} not found`);
      }
    };

    loadEncounter();
    
    // Set up event listeners for combat updates
    const handleCombatEvent = () => {
      loadEncounter();
    };

    combatEngine.addEventListener('turn_start', handleCombatEvent);
    combatEngine.addEventListener('turn_end', handleCombatEvent);
    combatEngine.addEventListener('combat_end', handleCombatEvent);

    return () => {
      combatEngine.removeEventListener('turn_start', handleCombatEvent);
      combatEngine.removeEventListener('turn_end', handleCombatEvent);
      combatEngine.removeEventListener('combat_end', handleCombatEvent);
    };
  }, [encounterId, onError]);

  // Handle combat end
  useEffect(() => {
    if (encounter?.phase === 'ended' && onCombatEnd) {
      onCombatEnd(encounter);
    }
  }, [encounter?.phase, onCombatEnd]);

  // Get current combatant
  const getCurrentCombatant = useCallback((): Combatant | null => {
    return combatEngine.getCurrentCombatant(encounterId);
  }, [encounterId]);

  // Handle cell click
  const handleCellClick = useCallback((x: number, y: number) => {
    if (!encounter || encounter.phase !== 'combat') return;

    const currentCombatant = getCurrentCombatant();
    if (!currentCombatant) return;

    // Check if there's a combatant at this position
    const targetCombatant = encounter.combatants.find(
      c => c.position.x === x && c.position.y === y
    );

    if (selectedAction) {
      // Execute action on target
      if (targetCombatant) {
        executeAction(selectedAction, [targetCombatant.id]);
      } else {
        // Clear selection if clicking empty space
        setSelectedAction(null);
        setSelectedCells([]);
      }
    } else if (targetCombatant?.id === currentCombatant.id) {
      // Select current combatant
      setSelectedCombatant(currentCombatant.id);
    } else if (selectedCombatant === currentCombatant.id) {
      // Move current combatant
      const success = combatEngine.moveCombatant(encounterId, currentCombatant.id, { x, y });
      if (success) {
        setSelectedCombatant(null);
        setMovementPath(null);
        // Refresh encounter data
        const updatedEncounter = combatEngine.getEncounterById(encounterId);
        if (updatedEncounter) {
          setEncounter(updatedEncounter);
        }
      }
    }
  }, [encounter, selectedAction, selectedCombatant, getCurrentCombatant, encounterId]);

  // Handle mouse hover for movement preview
  const handleCellHover = useCallback((x: number, y: number) => {
    setHoveredCell({ x, y });

    if (!encounter || !selectedCombatant) return;

    const combatant = encounter.combatants.find(c => c.id === selectedCombatant);
    if (!combatant) return;

    // Calculate movement path
    const path = combatEngine.calculateMovement(encounter, combatant, { x, y });
    setMovementPath(path);
  }, [encounter, selectedCombatant]);

  // Execute combat action
  const executeAction = useCallback(async (action: CombatAction, targetIds: string[]) => {
    try {
      if (action.attackRoll || action.damageRolls) {
        // Show dice roller for actions with rolls
        setPendingRoll({ action, targets: targetIds });
        setShowDiceRoller(true);
      } else {
        // Execute action directly
        const results = await combatEngine.executeAction(encounterId, action, targetIds);
        handleActionResults(action, targetIds, results);
      }
    } catch (error) {
      if (onError) {
        onError(`Failed to execute action: ${error}`);
      }
    }
  }, [encounterId, onError]);

  // Handle dice roll completion
  const handleDiceRollComplete = useCallback(async (roll: EnhancedDiceRoll) => {
    setShowDiceRoller(false);

    if (!pendingRoll) return;

    try {
      const results = await combatEngine.executeAction(
        encounterId, 
        pendingRoll.action, 
        pendingRoll.targets
      );
      handleActionResults(pendingRoll.action, pendingRoll.targets, results);
    } catch (error) {
      if (onError) {
        onError(`Failed to execute action: ${error}`);
      }
    } finally {
      setPendingRoll(null);
    }
  }, [encounterId, pendingRoll, onError]);

  // Handle action results
  const handleActionResults = useCallback((
    action: CombatAction, 
    targetIds: string[], 
    results: AttackResult[]
  ) => {
    setSelectedAction(null);
    setSelectedCells([]);
    
    // Refresh encounter data
    const updatedEncounter = combatEngine.getEncounterById(encounterId);
    if (updatedEncounter) {
      setEncounter(updatedEncounter);
      setCombatLog(updatedEncounter.actionLog.slice(-10));
    }
  }, [encounterId]);

  // End current turn
  const endTurn = useCallback(() => {
    combatEngine.endTurn(encounterId);
    setSelectedCombatant(null);
    setSelectedAction(null);
    setSelectedCells([]);
    setMovementPath(null);
  }, [encounterId]);

  // Get cell color based on state
  const getCellColor = useCallback((x: number, y: number): string => {
    if (!encounter) return 'bg-gray-100';

    const combatant = encounter.combatants.find(c => c.position.x === x && c.position.y === y);
    
    if (combatant) {
      switch (combatant.type) {
        case 'player': return 'bg-blue-500';
        case 'ally': return 'bg-green-500';
        case 'enemy': return 'bg-red-500';
        case 'npc': return 'bg-yellow-500';
        default: return 'bg-gray-500';
      }
    }

    if (selectedCells.some(cell => cell.x === x && cell.y === y)) {
      return 'bg-purple-300';
    }

    if (movementPath?.path.some(pos => pos.x === x && pos.y === y)) {
      return movementPath.valid ? 'bg-green-200' : 'bg-red-200';
    }

    if (hoveredCell?.x === x && hoveredCell?.y === y) {
      return 'bg-gray-200';
    }

    return 'bg-gray-100';
  }, [encounter, selectedCells, movementPath, hoveredCell]);

  // Render grid
  const renderGrid = () => {
    if (!encounter) return null;

    const { width, height } = encounter.battlefield.size;
    const cells = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const combatant = encounter.combatants.find(c => c.position.x === x && c.position.y === y);
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={`
              border border-gray-300 cursor-pointer transition-colors duration-150
              flex items-center justify-center text-xs font-bold
              ${getCellColor(x, y)}
            `}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              gridColumn: x + 1,
              gridRow: y + 1
            }}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => handleCellHover(x, y)}
            onMouseLeave={() => setHoveredCell(null)}
          >
            {combatant && (
              <div className="text-white text-center">
                <div className="text-xs truncate" style={{ maxWidth: CELL_SIZE - 4 }}>
                  {combatant.name.substring(0, 3)}
                </div>
                <div className="text-xs">
                  {combatant.health.current}/{combatant.health.maximum}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div
        ref={gridRef}
        className="inline-grid gap-0 border-2 border-gray-400"
        style={{
          gridTemplateColumns: `repeat(${width}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${height}, ${CELL_SIZE}px)`
        }}
      >
        {cells}
      </div>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    const currentCombatant = getCurrentCombatant();
    if (!currentCombatant) return null;

    const availableActions = combatEngine.getAvailableActions(encounterId, currentCombatant.id);

    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Basic actions */}
          <button
            onClick={() => setSelectedCombatant(currentCombatant.id)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            disabled={currentCombatant.actions.movement >= currentCombatant.speed}
          >
            Move
          </button>
          
          <button
            onClick={() => {
              // TODO: Implement basic attack action
              executeAction({
                id: 'basic_attack',
                type: 'action',
                name: 'Attack',
                description: 'Make a basic attack',
                actionCost: 'action',
                requirements: {},
                effects: [],
                attackRoll: { bonus: 5 },
                damageRolls: [{ dice: '1d8', type: 'slashing', bonus: 3 }]
              }, []);
            }}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            disabled={currentCombatant.actions.action}
          >
            Attack
          </button>

          <button
            onClick={endTurn}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            End Turn
          </button>
        </div>
      </div>
    );
  };

  // Render combat status
  const renderCombatStatus = () => {
    if (!encounter) return null;

    const currentCombatant = getCurrentCombatant();

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">{encounter.name}</h2>
          <div className="text-sm space-y-1">
            <div>Round: {encounter.round}</div>
            <div>Phase: {encounter.phase}</div>
            {currentCombatant && (
              <div className="font-semibold text-blue-600">
                Current Turn: {currentCombatant.name}
              </div>
            )}
          </div>
        </div>

        {/* Initiative Order */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Initiative Order</h3>
          <div className="space-y-1">
            {encounter.turnOrder.map((combatantId, index) => {
              const combatant = encounter.combatants.find(c => c.id === combatantId);
              if (!combatant) return null;

              const isCurrent = index === encounter.currentTurn;
              
              return (
                <div
                  key={combatantId}
                  className={`
                    flex justify-between items-center p-2 rounded text-sm
                    ${isCurrent ? 'bg-blue-200 font-semibold' : 'bg-white'}
                  `}
                >
                  <span>{combatant.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">
                      {combatant.health.current}/{combatant.health.maximum} HP
                    </span>
                    <span className="text-xs bg-gray-200 px-1 rounded">
                      {combatant.initiative}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {encounter.phase === 'combat' && renderActionButtons()}
      </div>
    );
  };

  // Render combat log
  const renderCombatLog = () => {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Combat Log</h3>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {combatLog.map((entry) => (
            <div key={entry.id} className="text-sm bg-white p-2 rounded">
              <div className="font-medium text-gray-600">
                Round {entry.round}, Turn {entry.turn + 1}
              </div>
              <div>{entry.description}</div>
              {entry.results.damage && (
                <div className="text-red-600 font-semibold">
                  {entry.results.damage} damage
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!encounter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading combat encounter...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Combat Grid */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">⚔️ Combat Grid</h2>
            <p className="text-gray-600">Click to move, select actions to target</p>
          </div>
          
          <div className="overflow-auto">
            {renderGrid()}
          </div>

          {/* Movement info */}
          {movementPath && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <div className="text-sm">
                Movement: {movementPath.cost} ft 
                {movementPath.valid ? 
                  ` (${movementPath.remainingMovement} ft remaining)` : 
                  ' (insufficient movement)'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Combat Controls */}
      <div className="w-full lg:w-80 space-y-6">
        {renderCombatStatus()}
        {renderCombatLog()}
      </div>

      {/* 3D Dice Roller */}
      {/* <DiceSystem3D
        isOpen={showDiceRoller}
        onClose={() => {
          setShowDiceRoller(false);
          setPendingRoll(null);
        }}
        onRollComplete={handleDiceRollComplete}
        rollContext={pendingRoll?.action.name}
        playerName={getCurrentCombatant()?.name}
      /> */}
    </div>
  );
};

export default CombatGrid; 