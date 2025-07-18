import React, { useState, useEffect } from 'react';
import { diceService } from '../services/diceService';
import { DiceSystem3D } from './DiceSystem3D';
import { DiceRoll as EnhancedDiceRoll, DiceConfig, DiceType, DICE_PRESETS } from '../types/dice';

interface DiceRollerProps {
  isOpen: boolean;
  onClose: (results?: number[]) => void;
  onRollComplete?: (results: number[]) => void;
  defaultDice?: Array<{ sides: number; count: number }>;
  mode?: '2d' | '3d';
  enableAdvanced?: boolean;
}

interface LegacyDiceConfig {
  sides: number;
  count: number;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ 
  isOpen, 
  onClose, 
  onRollComplete, 
  defaultDice = [{ sides: 20, count: 1 }],
  mode = '2d',
  enableAdvanced = true
}) => {
  // Legacy 2D state
  const [diceConfigs, setDiceConfigs] = useState<LegacyDiceConfig[]>(defaultDice);
  const [results, setResults] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<Array<{ dice: LegacyDiceConfig[]; results: number[]; total: number; timestamp: number }>>([]);
  
  // Enhanced features state
  const [currentMode, setCurrentMode] = useState<'2d' | '3d'>(mode);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advantage, setAdvantage] = useState<'advantage' | 'disadvantage' | 'normal'>('normal');
  const [modifier, setModifier] = useState(0);
  const [exploding, setExploding] = useState(false);
  const [rerollOnes, setRerollOnes] = useState(false);

  // Common dice types
  const commonDice = [4, 6, 8, 10, 12, 20, 100];

  useEffect(() => {
    if (isOpen) {
      // Load recent roll history
      const recentRolls = diceService.getFilteredRolls({ limit: 5 });
      // Convert to our format
      const history = recentRolls.map(roll => ({
        dice: [{ sides: roll.sides, count: 1 }],
        results: [roll.result],
        total: roll.result,
        timestamp: roll.timestamp
      }));
      setRollHistory(history);
    }
  }, [isOpen]);

  // Handle 3D dice roll completion
  const handle3DRollComplete = (roll: EnhancedDiceRoll) => {
    const resultValues = roll.results
      .filter(r => !r.discarded)
      .map(r => r.value);
    
    setResults(resultValues);
    
    // Add to history
    const historyEntry = {
      dice: [{ sides: roll.config.sides, count: roll.config.count }],
      results: resultValues,
      total: roll.total,
      timestamp: roll.timestamp
    };
    setRollHistory(prev => [historyEntry, ...prev.slice(0, 4)]);
    
    if (onRollComplete) {
      onRollComplete(resultValues);
    }
  };

  // Enhanced roll function
  const rollAdvanced = () => {
    if (isRolling || diceConfigs.length === 0) return;
    
    setIsRolling(true);
    setResults([]);

    // Convert to enhanced config
    const enhancedConfig: DiceConfig = {
      sides: diceConfigs[0].sides,
      count: diceConfigs[0].count,
      modifier,
      advantage: advantage === 'advantage',
      disadvantage: advantage === 'disadvantage',
      exploding,
      rerollOnes,
      label: `${diceConfigs[0].count}d${diceConfigs[0].sides}${modifier ? `+${modifier}` : ''}`
    };

    try {
      const roll = diceService.rollAdvanced(enhancedConfig);
      const resultValues = roll.results
        .filter(r => !r.discarded)
        .map(r => r.value);
      
      setResults(resultValues);
      
      // Add to history
      const historyEntry = {
        dice: diceConfigs,
        results: resultValues,
        total: roll.total,
        timestamp: roll.timestamp
      };
      setRollHistory(prev => [historyEntry, ...prev.slice(0, 4)]);
      
      if (onRollComplete) {
        onRollComplete(resultValues);
      }
    } catch (error) {
      console.error('Error rolling dice:', error);
    } finally {
      setTimeout(() => setIsRolling(false), 1000);
    }
  };

  // Legacy roll function (for backward compatibility)
  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setResults([]);

    // Simulate rolling animation
    setTimeout(() => {
      const newResults: number[] = [];
      
      diceConfigs.forEach(config => {
        for (let i = 0; i < config.count; i++) {
          const result = Math.floor(Math.random() * config.sides) + 1;
          newResults.push(result);
          
          // Save to dice service
          diceService.addRoll({
            sides: config.sides,
            result,
            context: `Dice Roller - ${config.count}d${config.sides}`
          });
        }
      });

      setResults(newResults);
      setIsRolling(false);

      // Add to history
      const total = newResults.reduce((sum, result) => sum + result, 0);
      const newHistoryEntry = {
        dice: [...diceConfigs],
        results: [...newResults],
        total,
        timestamp: Date.now()
      };
      setRollHistory(prev => [newHistoryEntry, ...prev.slice(0, 4)]);

      if (onRollComplete) {
        onRollComplete(newResults);
      }
    }, 1000);
  };

  const addDice = (sides: number) => {
    setDiceConfigs(prev => {
      const existing = prev.find(config => config.sides === sides);
      if (existing) {
        return prev.map(config => 
          config.sides === sides 
            ? { ...config, count: config.count + 1 }
            : config
        );
      } else {
        return [...prev, { sides, count: 1 }];
      }
    });
  };

  const removeDice = (sides: number) => {
    setDiceConfigs(prev => {
      const existing = prev.find(config => config.sides === sides);
      if (existing && existing.count > 1) {
        return prev.map(config => 
          config.sides === sides 
            ? { ...config, count: config.count - 1 }
            : config
        );
      } else {
        return prev.filter(config => config.sides !== sides);
      }
    });
  };

  const clearDice = () => {
    setDiceConfigs([]);
  };

  const getTotalDice = () => diceConfigs.reduce((sum, config) => sum + config.count, 0);
  const getTotalResult = () => results.reduce((sum, result) => sum + result, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-lg rounded-2xl p-6 border border-purple-400/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🎲 Dice Roller</h2>
          <button
            onClick={() => onClose(results.length > 0 ? results : undefined)}
            className="text-gray-300 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Dice Configuration */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Configure Dice</h3>
            <button
              onClick={clearDice}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Common Dice Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {commonDice.map(sides => (
              <button
                key={sides}
                onClick={() => addDice(sides)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                d{sides}
              </button>
            ))}
          </div>

          {/* Current Dice Configuration */}
          {diceConfigs.length > 0 ? (
            <div className="space-y-2">
              {diceConfigs.map(config => (
                <div key={config.sides} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <span className="text-white font-medium">
                    {config.count} × d{config.sides}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeDice(config.sides)}
                      className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="text-white font-bold min-w-[2rem] text-center">
                      {config.count}
                    </span>
                    <button
                      onClick={() => addDice(config.sides)}
                      className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              Select dice to roll
            </div>
          )}
        </div>

        {/* Roll Button */}
        <button
          onClick={rollDice}
          disabled={isRolling || getTotalDice() === 0}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all text-white font-bold text-lg shadow-lg transform hover:scale-105 disabled:transform-none mb-6"
        >
          {isRolling ? '🎲 Rolling...' : `🎲 Roll ${getTotalDice()} Dice`}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Results</h3>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30 p-4">
              {/* Individual Results */}
              <div className="flex flex-wrap gap-2 mb-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 bg-yellow-500 text-black font-bold rounded-lg flex items-center justify-center text-lg animate-bounce"
                  >
                    {result}
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  Total: {getTotalResult()}
                </div>
                <div className="text-yellow-200 text-sm">
                  {results.length > 1 ? `${results.length} dice rolled` : '1 die rolled'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roll History */}
        {rollHistory.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Recent Rolls</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rollHistory.map((entry, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-white text-sm">
                      {entry.dice.map((d, i) => (
                        <span key={i}>
                          {d.count}d{d.sides}
                          {i < entry.dice.length - 1 ? ' + ' : ''}
                        </span>
                      ))}
                    </div>
                    <div className="text-yellow-400 font-bold">
                      = {entry.total}
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceRoller; 