import React, { useState, useEffect } from 'react';
import { diceService } from '../services/diceService';
// import { DiceSystem3D } from './DiceSystem3D'; // Temporarily disabled due to React version conflicts
import { DiceRoll as EnhancedDiceRoll, DiceConfig, DiceType, DICE_PRESETS } from '../types/dice';

interface DiceRollResult {
  total: number;
  rolls: number[];
  sides: number;
  modifier?: number;
}

interface DiceRollerProps {
  sides?: number;
  count?: number;
  modifier?: number;
  onRoll?: (result: DiceRollResult) => void;
  className?: string;
}

// Temporary 2D dice roller component
const Simple2DDice: React.FC<DiceRollerProps> = ({ 
  sides = 6, 
  count = 1, 
  modifier = 0, 
  onRoll, 
  className = '' 
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);

  const rollDice = () => {
    setIsRolling(true);
    
    setTimeout(() => {
      const rolls = Array.from({ length: count }, () => 
        Math.floor(Math.random() * sides) + 1
      );
      const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
      
      const result: DiceRollResult = {
        total,
        rolls,
        sides,
        modifier: modifier !== 0 ? modifier : undefined
      };
      
      setLastResult(result);
      setIsRolling(false);
      onRoll?.(result);
    }, 1000);
  };

  return (
    <div className={`dice-roller-2d ${className}`}>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Dice Roller</h3>
        
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">
            {isRolling ? '🎲' : '⚀'}
          </div>
          <div className="text-sm text-slate-400">
            {count}d{sides}{modifier !== 0 ? ` + ${modifier}` : ''}
          </div>
        </div>

        {lastResult && (
          <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-center text-green-400">
              {lastResult.total}
            </div>
            <div className="text-sm text-center text-slate-400">
              Rolls: {lastResult.rolls.join(', ')}
              {lastResult.modifier && ` + ${lastResult.modifier}`}
            </div>
          </div>
        )}

        <button
          onClick={rollDice}
          disabled={isRolling}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>
    </div>
  );
};

export default Simple2DDice; 