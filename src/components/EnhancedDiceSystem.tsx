/**
 * Enhanced Dice System for TTRPG-Style Gameplay
 * 
 * Provides:
 * - Visible dice rolling integrated into chat
 * - Contextual dice roll suggestions
 * - Transparent roll results for all players
 * - Multiple dice types and combinations
 * - Roll history and statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { diceService } from '../services/diceService';

interface DiceRoll {
  id: string;
  diceType: string;
  results: number[];
  total: number;
  timestamp: number;
  context?: string;
  player?: string;
  isAdvantage?: boolean;
  isDisadvantage?: boolean;
}

interface DiceSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onRollComplete: (rollData: DiceRoll) => void;
  context?: string;
  suggestedRolls?: Array<{
    label: string;
    dice: string;
    context: string;
  }>;
  playerName?: string;
}

interface DiceConfig {
  sides: number;
  count: number;
  modifier: number;
  label?: string;
}

const DICE_TYPES = [
  { sides: 4, name: 'd4', color: 'bg-red-500' },
  { sides: 6, name: 'd6', color: 'bg-blue-500' },
  { sides: 8, name: 'd8', color: 'bg-green-500' },
  { sides: 10, name: 'd10', color: 'bg-yellow-500' },
  { sides: 12, name: 'd12', color: 'bg-purple-500' },
  { sides: 20, name: 'd20', color: 'bg-pink-500' },
  { sides: 100, name: 'd100', color: 'bg-indigo-500' }
];

const COMMON_ROLLS = [
  { label: 'Ability Check', dice: '1d20', context: 'General ability check' },
  { label: 'Attack Roll', dice: '1d20', context: 'Combat attack' },
  { label: 'Damage (Sword)', dice: '1d8', context: 'Sword damage' },
  { label: 'Damage (Dagger)', dice: '1d4', context: 'Dagger damage' },
  { label: 'Healing Potion', dice: '2d4+2', context: 'Healing potion' },
  { label: 'Initiative', dice: '1d20', context: 'Combat initiative' },
  { label: 'Saving Throw', dice: '1d20', context: 'Saving throw' },
  { label: 'Skill Check', dice: '1d20', context: 'Skill check' }
];

export const EnhancedDiceSystem: React.FC<DiceSystemProps> = ({
  isOpen,
  onClose,
  onRollComplete,
  context = '',
  suggestedRolls = [],
  playerName = 'Player'
}) => {
  const [diceConfigs, setDiceConfigs] = useState<DiceConfig[]>([
    { sides: 20, count: 1, modifier: 0, label: 'Ability Check' }
  ]);
  const [customModifier, setCustomModifier] = useState(0);
  const [rollContext, setRollContext] = useState(context);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);

  // Load roll history on mount
  useEffect(() => {
    if (isOpen) {
      const recentRolls = diceService.getFilteredRolls({ limit: 10 });
      const history = recentRolls.map(roll => ({
        id: `${roll.timestamp}-${roll.result}`,
        diceType: `1d${roll.sides}`,
        results: [roll.result],
        total: roll.result,
        timestamp: roll.timestamp,
        context: roll.context || 'Unknown',
        player: playerName
      }));
      setRollHistory(history);
    }
  }, [isOpen, playerName]);

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
        return [...prev, { sides, count: 1, modifier: 0 }];
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

  const updateModifier = (sides: number, modifier: number) => {
    setDiceConfigs(prev =>
      prev.map(config =>
        config.sides === sides
          ? { ...config, modifier }
          : config
      )
    );
  };

  const parsesDiceString = (diceString: string): DiceConfig[] => {
    // Parse strings like "2d6+3", "1d20", "3d8-1"
    const match = diceString.match(/(\d+)d(\d+)([\+\-]\d+)?/i);
    if (match) {
      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : 0;
      return [{ sides, count, modifier }];
    }
    return [];
  };

  const rollDice = useCallback(() => {
    if (isRolling) return;

    setIsRolling(true);

    // Simulate rolling animation delay
    setTimeout(() => {
      const allResults: number[] = [];
      let diceDescription = '';
      let totalModifier = customModifier;

      diceConfigs.forEach((config, index) => {
        const diceResults: number[] = [];
        
        for (let i = 0; i < config.count; i++) {
          let result = Math.floor(Math.random() * config.sides) + 1;
          
          // Handle advantage/disadvantage for d20 rolls
          if (config.sides === 20 && (advantage || disadvantage)) {
            const secondRoll = Math.floor(Math.random() * 20) + 1;
            result = advantage ? Math.max(result, secondRoll) : Math.min(result, secondRoll);
          }
          
          diceResults.push(result);
          allResults.push(result);

          // Save individual roll to service
          diceService.addRoll({
            sides: config.sides,
            result,
            context: rollContext || 'Manual roll'
          });
        }

        totalModifier += config.modifier;
        
        // Build description
        if (index > 0) diceDescription += ' + ';
        diceDescription += `${config.count}d${config.sides}`;
        if (config.modifier !== 0) {
          diceDescription += config.modifier > 0 ? `+${config.modifier}` : `${config.modifier}`;
        }
      });

      if (customModifier !== 0) {
        diceDescription += customModifier > 0 ? `+${customModifier}` : `${customModifier}`;
      }

      if (advantage) diceDescription += ' (Advantage)';
      if (disadvantage) diceDescription += ' (Disadvantage)';

      const total = allResults.reduce((sum, result) => sum + result, 0) + totalModifier;

      const rollData: DiceRoll = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        diceType: diceDescription,
        results: allResults,
        total,
        timestamp: Date.now(),
        context: rollContext || context || 'Manual roll',
        player: playerName,
        isAdvantage: advantage,
        isDisadvantage: disadvantage
      };

      setLastRoll(rollData);
      setRollHistory(prev => [rollData, ...prev.slice(0, 9)]);
      setIsRolling(false);

      // Send roll to chat
      onRollComplete(rollData);
    }, 1000);
  }, [diceConfigs, customModifier, rollContext, context, playerName, advantage, disadvantage, isRolling, onRollComplete]);

  const loadPresetRoll = (preset: typeof COMMON_ROLLS[0]) => {
    const configs = parsesDiceString(preset.dice);
    if (configs.length > 0) {
      setDiceConfigs(configs);
      setRollContext(preset.context);
      setAdvantage(false);
      setDisadvantage(false);
    }
  };

  const getTotalDice = () => diceConfigs.reduce((sum, config) => sum + config.count, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-lg rounded-2xl border border-blue-400/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-400/20">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🎲 TTRPG Dice Roller
            </h2>
            <p className="text-blue-200 text-sm">Roll with transparency - everyone sees the results!</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Quick Presets */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Common Rolls</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[...COMMON_ROLLS, ...suggestedRolls].map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPresetRoll(preset)}
                  className="p-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-400/30 rounded-lg text-white text-sm transition-colors"
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-blue-300 text-xs">{preset.dice}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dice Configuration */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Configure Dice</h3>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 rounded-lg text-sm transition-colors"
              >
                {showAdvanced ? 'Simple' : 'Advanced'}
              </button>
            </div>

            {/* Dice Type Buttons */}
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
              {DICE_TYPES.map(diceType => (
                <button
                  key={diceType.sides}
                  onClick={() => addDice(diceType.sides)}
                  className={`p-3 ${diceType.color} hover:opacity-80 text-white rounded-lg font-bold transition-all transform hover:scale-105`}
                >
                  {diceType.name}
                </button>
              ))}
            </div>

            {/* Current Dice Configuration */}
            {diceConfigs.length > 0 && (
              <div className="space-y-2">
                {diceConfigs.map((config, index) => (
                  <div key={`${config.sides}-${index}`} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-white font-medium min-w-[4rem]">
                        {config.count}d{config.sides}
                      </span>
                      {showAdvanced && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-300 text-sm">Modifier:</span>
                          <input
                            type="number"
                            value={config.modifier}
                            onChange={(e) => updateModifier(config.sides, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center"
                          />
                        </div>
                      )}
                    </div>
                    
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
            )}
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium">Advanced Options</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Global Modifier */}
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Global Modifier</label>
                  <input
                    type="number"
                    value={customModifier}
                    onChange={(e) => setCustomModifier(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                    placeholder="0"
                  />
                </div>

                {/* Advantage/Disadvantage */}
                <div>
                  <label className="block text-gray-300 text-sm mb-1">d20 Advantage</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setAdvantage(!advantage);
                        setDisadvantage(false);
                      }}
                      className={`px-3 py-2 rounded font-medium transition-colors ${
                        advantage 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Advantage
                    </button>
                    <button
                      onClick={() => {
                        setDisadvantage(!disadvantage);
                        setAdvantage(false);
                      }}
                      className={`px-3 py-2 rounded font-medium transition-colors ${
                        disadvantage 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Disadvantage
                    </button>
                  </div>
                </div>

                {/* Context */}
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Roll Context</label>
                  <input
                    type="text"
                    value={rollContext}
                    onChange={(e) => setRollContext(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                    placeholder="e.g., Stealth check"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Roll Button and Results */}
          <div className="space-y-4">
            <button
              onClick={rollDice}
              disabled={isRolling || getTotalDice() === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all text-white font-bold text-lg shadow-lg transform hover:scale-105 disabled:transform-none"
            >
              {isRolling ? '🎲 Rolling...' : `🎲 Roll ${getTotalDice()} Dice`}
            </button>

            {/* Last Roll Result */}
            {lastRoll && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30 p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">
                    {lastRoll.total}
                  </div>
                  <div className="text-yellow-200 text-lg mb-2">
                    {lastRoll.diceType}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    {lastRoll.results.map((result, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 bg-yellow-500 text-black font-bold rounded-lg flex items-center justify-center animate-bounce"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                  <div className="text-yellow-300 text-sm">
                    {lastRoll.context} • {new Date(lastRoll.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Roll History */}
          {rollHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Recent Rolls</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {rollHistory.slice(0, 5).map((roll) => (
                  <div key={roll.id} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-white text-sm">
                        <span className="font-medium">{roll.diceType}</span>
                        {roll.context && (
                          <span className="text-gray-400 ml-2">• {roll.context}</span>
                        )}
                      </div>
                      <div className="text-yellow-400 font-bold">
                        = {roll.total}
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {new Date(roll.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDiceSystem; 