import React, { useState, useEffect } from 'react';
import { diceService, DiceRoll, DiceStats } from '../services/diceService';
import { BarChart3, Clock, Target, TrendingUp, Zap, X, Filter, Download, Upload, Trash2 } from 'lucide-react';

interface RollHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const RollHistory: React.FC<RollHistoryProps> = ({ isOpen, onClose }) => {
  const [rolls, setRolls] = useState<DiceRoll[]>([]);
  const [stats, setStats] = useState<DiceStats | null>(null);
  const [filters, setFilters] = useState({
    sides: 0,
    showFilters: false
  });
  const [selectedRoll, setSelectedRoll] = useState<DiceRoll | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRolls();
      loadStats();
    }
  }, [isOpen, filters.sides]);

  const loadRolls = () => {
    const filteredRolls = diceService.getFilteredRolls({
      sides: filters.sides || undefined,
      limit: 50
    });
    setRolls(filteredRolls);
  };

  const loadStats = () => {
    const currentStats = diceService.getStats();
    setStats(currentStats);
  };

  const handleExport = () => {
    const data = diceService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mythseeker-dice-rolls-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = diceService.importData(e.target?.result as string);
        if (success) {
          loadRolls();
          loadStats();
          alert('Dice data imported successfully!');
        } else {
          alert('Error importing dice data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all dice roll data? This action cannot be undone.')) {
      diceService.clearData();
      loadRolls();
      loadStats();
    }
  };

  const getDiceIcon = (sides: number) => {
    switch (sides) {
      case 4: return '🔺';
      case 6: return '⬜';
      case 8: return '🔷';
      case 10: return '🔟';
      case 12: return '🔶';
      case 20: return '🎯';
      default: return '🎲';
    }
  };

  const getResultColor = (result: number, sides: number) => {
    if (sides === 20) {
      if (result === 20) return 'text-green-400';
      if (result === 1) return 'text-red-400';
    }
    if (result >= sides * 0.8) return 'text-yellow-400';
    if (result <= sides * 0.2) return 'text-red-300';
    return 'text-white';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-800/95 backdrop-blur-lg border-l border-slate-700/50 shadow-2xl z-40 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Roll History</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <label className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleClearData}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {filters.showFilters && (
          <div className="p-4 border-b border-slate-700/50 bg-slate-700/30">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-blue-200">Filter by Dice</label>
              <select
                value={filters.sides}
                onChange={(e) => setFilters(prev => ({ ...prev, sides: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value={0}>All Dice</option>
                <option value={4}>d4</option>
                <option value={6}>d6</option>
                <option value={8}>d8</option>
                <option value={10}>d10</option>
                <option value={12}>d12</option>
                <option value={20}>d20</option>
              </select>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
            <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-slate-400">Total Rolls</div>
                <div className="text-white font-semibold">{stats.totalRolls}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-slate-400">Average</div>
                <div className="text-white font-semibold">{stats.averageRoll}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-slate-400">Highest</div>
                <div className="text-green-400 font-semibold">{stats.highestRoll}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-slate-400">Lowest</div>
                <div className="text-red-400 font-semibold">{stats.lowestRoll}</div>
              </div>
            </div>
            
            {/* Lucky/Unlucky Stats */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-green-900/20 rounded p-2 border border-green-500/30">
                <div className="text-green-400 text-xs">Natural 20s</div>
                <div className="text-green-300 font-semibold">{diceService.getLuckyRolls().natural20s}</div>
              </div>
              <div className="bg-red-900/20 rounded p-2 border border-red-500/30">
                <div className="text-red-400 text-xs">Natural 1s</div>
                <div className="text-red-300 font-semibold">{diceService.getLuckyRolls().natural1s}</div>
              </div>
            </div>
          </div>
        )}

        {/* Roll History */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent Rolls
            </h3>
            
            {rolls.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm">No rolls yet</p>
                <p className="text-slate-500 text-xs">Start rolling dice to see your history!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rolls.map((roll) => (
                  <div
                    key={roll.id}
                    onClick={() => setSelectedRoll(roll)}
                    className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getDiceIcon(roll.sides)}</div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">d{roll.sides}</span>
                            <span className={`text-lg font-bold ${getResultColor(roll.result, roll.sides)}`}>
                              {roll.result}
                            </span>
                          </div>
                          <div className="text-slate-400 text-xs">
                            {formatTimestamp(roll.timestamp)}
                          </div>
                        </div>
                      </div>
                      {roll.diceSet && (
                        <div className="text-xs text-slate-500">
                          {roll.diceSet}
                        </div>
                      )}
                    </div>
                    {roll.context && (
                      <div className="mt-2 text-xs text-slate-400 italic">
                        "{roll.context}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Roll Detail Modal */}
        {selectedRoll && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Roll Details</h3>
                <button
                  onClick={() => setSelectedRoll(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-2">{getDiceIcon(selectedRoll.sides)}</div>
                  <div className="text-3xl font-bold text-white">d{selectedRoll.sides}</div>
                  <div className={`text-4xl font-bold ${getResultColor(selectedRoll.result, selectedRoll.sides)}`}>
                    {selectedRoll.result}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-white">{new Date(selectedRoll.timestamp).toLocaleString()}</span>
                  </div>
                  {selectedRoll.diceSet && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dice Set:</span>
                      <span className="text-white">{selectedRoll.diceSet}</span>
                    </div>
                  )}
                  {selectedRoll.campaignId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Campaign:</span>
                      <span className="text-white">{selectedRoll.campaignId}</span>
                    </div>
                  )}
                  {selectedRoll.context && (
                    <div className="pt-2 border-t border-slate-700">
                      <div className="text-slate-400 mb-1">Context:</div>
                      <div className="text-white italic">"{selectedRoll.context}"</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RollHistory; 