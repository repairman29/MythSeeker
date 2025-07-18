/**
 * Dice Roll Message Component
 * 
 * Displays dice roll results in chat messages with TTRPG-style transparency
 * Shows individual dice, totals, and context for all players to see
 */

import React from 'react';

interface DiceRollData {
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

interface DiceRollMessageProps {
  rollData: DiceRollData;
  isOwnRoll?: boolean;
}

export const DiceRollMessage: React.FC<DiceRollMessageProps> = ({ 
  rollData, 
  isOwnRoll = false 
}) => {
  const { diceType, results, total, context, player, isAdvantage, isDisadvantage } = rollData;

  // Determine if this was a critical hit/fail for d20 rolls
  const hasCritical = results.some(result => {
    const isDTwenty = diceType.includes('d20');
    return isDTwenty && (result === 20 || result === 1);
  });

  const criticalType = results.some(result => result === 20) ? 'success' : 
                      results.some(result => result === 1) ? 'fail' : null;

  return (
    <div className={`
      p-4 rounded-lg border-l-4 ${
        isOwnRoll 
          ? 'bg-blue-900/30 border-blue-400' 
          : 'bg-purple-900/30 border-purple-400'
      } ${hasCritical ? 'animate-pulse' : ''}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🎲</span>
          <span className="font-bold text-white">
            {player || 'Player'} rolled {diceType}
          </span>
          {(isAdvantage || isDisadvantage) && (
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              isAdvantage ? 'bg-green-600/30 text-green-200' : 'bg-red-600/30 text-red-200'
            }`}>
              {isAdvantage ? 'ADV' : 'DIS'}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {new Date(rollData.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Individual Dice Results */}
      <div className="flex flex-wrap gap-2 mb-3">
        {results.map((result, index) => {
          // Determine dice type for this result (approximate)
          const isDTwenty = diceType.includes('d20');
          const isCritSuccess = isDTwenty && result === 20;
          const isCritFail = isDTwenty && result === 1;
          
          return (
            <div
              key={index}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
                transition-all transform hover:scale-110
                ${isCritSuccess ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black animate-bounce' :
                  isCritFail ? 'bg-gradient-to-br from-red-500 to-red-700 text-white animate-bounce' :
                  'bg-gradient-to-br from-blue-500 to-purple-600 text-white'}
                shadow-lg
              `}
              title={`Die ${index + 1}: ${result}`}
            >
              {result}
            </div>
          );
        })}
      </div>

      {/* Total and Context */}
      <div className="space-y-2">
        <div className={`
          text-center p-3 rounded-lg font-bold text-xl
          ${criticalType === 'success' ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-200' :
            criticalType === 'fail' ? 'bg-gradient-to-r from-red-500/30 to-red-700/30 text-red-200' :
            'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-200'}
          border ${criticalType === 'success' ? 'border-yellow-400/50' :
                   criticalType === 'fail' ? 'border-red-400/50' :
                   'border-blue-400/50'}
        `}>
          <div className="flex items-center justify-center space-x-2">
            <span>Total:</span>
            <span className="text-2xl">
              {total}
            </span>
            {criticalType === 'success' && <span>🎉</span>}
            {criticalType === 'fail' && <span>💥</span>}
          </div>
          
          {criticalType && (
            <div className="text-sm mt-1">
              {criticalType === 'success' ? 'CRITICAL SUCCESS!' : 'CRITICAL FAILURE!'}
            </div>
          )}
        </div>

        {context && (
          <div className="text-center text-gray-300 text-sm bg-gray-800/30 rounded px-3 py-2">
            <span className="italic">{context}</span>
          </div>
        )}
      </div>

      {/* Breakdown for complex rolls */}
      {results.length > 1 && (
        <div className="mt-3 text-xs text-gray-400 text-center">
          Individual results: {results.join(' + ')} = {results.reduce((sum, r) => sum + r, 0)}
          {total !== results.reduce((sum, r) => sum + r, 0) && (
            <span> (with modifiers: {total})</span>
          )}
        </div>
      )}
    </div>
  );
};

export default DiceRollMessage; 