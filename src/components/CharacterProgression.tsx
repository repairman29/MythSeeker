import React, { useState, useEffect, useMemo } from 'react';
import { 
  CharacterProgression as ProgressionData, 
  LevelUpData, 
  AbilityScore, 
  AbilityScoreChoice,
  Feat,
  getAbilityModifier,
  getProficiencyBonus 
} from '../types/characterProgression';
import { characterProgressionService } from '../services/characterProgressionService';

interface CharacterProgressionProps {
  characterId: string;
  onProgressionUpdate?: (progression: ProgressionData) => void;
}

export const CharacterProgression: React.FC<CharacterProgressionProps> = ({
  characterId,
  onProgressionUpdate
}) => {
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'levelup' | 'feats' | 'skills'>('overview');
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelUpData | null>(null);
  const [selectedASIChoices, setSelectedASIChoices] = useState<AbilityScoreChoice[]>([]);

  useEffect(() => {
    loadProgression();
  }, [characterId]);

  const loadProgression = async () => {
    try {
      setLoading(true);
      const data = await characterProgressionService.getCharacterProgression(characterId);
      setProgression(data);
      if (onProgressionUpdate && data) {
        onProgressionUpdate(data);
      }
    } catch (error) {
      console.error('Error loading character progression:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExperience = async (amount: number, type: string, description: string) => {
    if (!progression) return;

    try {
      const result = await characterProgressionService.addExperience(characterId, amount, {
        type: type as any,
        description,
        amount
      });

      if (result.leveledUp && result.levelUpData) {
        setPendingLevelUp(result.levelUpData);
        setActiveTab('levelup');
      }

      await loadProgression();
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const handleAbilityScoreImprovement = async () => {
    if (!progression || !pendingLevelUp || selectedASIChoices.length === 0) return;

    try {
      await characterProgressionService.applyAbilityScoreImprovement(
        characterId,
        pendingLevelUp.newLevel,
        selectedASIChoices
      );

      setPendingLevelUp(null);
      setSelectedASIChoices([]);
      await loadProgression();
    } catch (error) {
      console.error('Error applying ability score improvement:', error);
    }
  };

  const experienceProgress = useMemo(() => {
    if (!progression) return 0;
    
    const currentLevelXP = progression.experience.current;
    const nextLevelXP = currentLevelXP + progression.experience.nextLevelXP;
    const prevLevelXP = progression.level > 1 ? 
      (currentLevelXP - progression.experience.nextLevelXP) : 0;
    
    const progress = ((currentLevelXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
    return Math.max(0, Math.min(100, progress));
  }, [progression]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!progression) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Character progression data not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Character Progression</h1>
            <p className="text-purple-200">Level {progression.level} {progression.class.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-200">Experience</p>
            <p className="text-xl font-bold">
              {progression.experience.current.toLocaleString()} XP
            </p>
            <p className="text-sm text-purple-200">
              {progression.experience.nextLevelXP} to next level
            </p>
          </div>
        </div>
        
        {/* Experience Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-purple-200 mb-1">
            <span>Level {progression.level}</span>
            <span>Level {progression.level + 1}</span>
          </div>
          <div className="w-full bg-purple-800 rounded-full h-3">
            <div 
              className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${experienceProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'levelup', label: 'Level Up', badge: pendingLevelUp ? '!' : null },
          { id: 'feats', label: 'Feats & Features' },
          { id: 'skills', label: 'Skill Trees' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors relative ${
              activeTab === tab.id 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            progression={progression}
            onAddExperience={handleAddExperience}
          />
        )}
        
        {activeTab === 'levelup' && (
          <LevelUpTab
            progression={progression}
            levelUpData={pendingLevelUp}
            selectedChoices={selectedASIChoices}
            onChoicesChange={setSelectedASIChoices}
            onConfirm={handleAbilityScoreImprovement}
          />
        )}
        
        {activeTab === 'feats' && (
          <FeatsTab progression={progression} />
        )}
        
        {activeTab === 'skills' && (
          <SkillTreesTab progression={progression} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  progression: ProgressionData;
  onAddExperience: (amount: number, type: string, description: string) => void;
}> = ({ progression, onAddExperience }) => {
  const [xpAmount, setXpAmount] = useState('');
  const [xpType, setXpType] = useState('combat');
  const [xpDescription, setXpDescription] = useState('');

  const handleAddXP = () => {
    const amount = parseInt(xpAmount);
    if (amount > 0 && xpDescription.trim()) {
      onAddExperience(amount, xpType, xpDescription);
      setXpAmount('');
      setXpDescription('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Ability Scores */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Ability Scores</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {Object.entries(progression.abilityScores).map(([ability, scores]) => (
            <div key={ability} className="text-center p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-all transform hover:scale-105 cursor-pointer group">
              <div className="text-xs uppercase text-blue-300 mb-1 group-hover:text-blue-200 transition-colors">
                {ability.slice(0, 3)}
              </div>
              <div className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                {scores.total}
              </div>
              <div className="text-sm text-blue-200 group-hover:text-white transition-colors">
                {getAbilityModifier(scores.total) >= 0 ? '+' : ''}
                {getAbilityModifier(scores.total)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Base: {scores.base}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Character Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Character Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
              <span className="text-blue-200">Hit Points</span>
              <span className="font-medium text-white">
                {progression.hitPoints.current} / {progression.hitPoints.max}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
              <span className="text-blue-200">Proficiency Bonus</span>
              <span className="font-medium text-white">+{getProficiencyBonus(progression.level)}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
              <span className="text-blue-200">Hit Die</span>
              <span className="font-medium text-white">{progression.class.hitDie}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
              <span className="text-blue-200">Class Features</span>
              <span className="font-medium text-white">{progression.classFeatures.length}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
              <span className="text-blue-200">Feats</span>
              <span className="font-medium text-white">{progression.feats.length}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Experience Management</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Experience Amount
              </label>
              <input
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-md text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter XP amount (e.g. 100)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Source Type
              </label>
              <select
                value={xpType}
                onChange={(e) => setXpType(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="combat" className="bg-gray-800 text-white">⚔️ Combat</option>
                <option value="roleplay" className="bg-gray-800 text-white">🎭 Roleplay</option>
                <option value="discovery" className="bg-gray-800 text-white">🔍 Discovery</option>
                <option value="quest" className="bg-gray-800 text-white">📜 Quest Completion</option>
                <option value="milestone" className="bg-gray-800 text-white">🏆 Milestone</option>
                <option value="bonus" className="bg-gray-800 text-white">⭐ Bonus</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Description
              </label>
              <input
                type="text"
                value={xpDescription}
                onChange={(e) => setXpDescription(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/30 rounded-md text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. Defeated goblin warband"
              />
            </div>
            
            <button
              onClick={handleAddXP}
              disabled={!xpAmount || !xpDescription.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-md hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 font-semibold shadow-lg"
            >
              {xpAmount && xpDescription.trim() ? `Add ${xpAmount} XP` : 'Add Experience'}
            </button>
            
            {/* Quick XP Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <button
                onClick={() => {
                  setXpAmount('50');
                  setXpType('combat');
                  setXpDescription('Minor encounter');
                }}
                className="px-2 py-1 bg-red-600/20 border border-red-500/30 rounded text-red-300 text-xs hover:bg-red-600/30 transition-colors"
              >
                +50 Combat
              </button>
              <button
                onClick={() => {
                  setXpAmount('100');
                  setXpType('roleplay');
                  setXpDescription('Good roleplay');
                }}
                className="px-2 py-1 bg-green-600/20 border border-green-500/30 rounded text-green-300 text-xs hover:bg-green-600/30 transition-colors"
              >
                +100 RP
              </button>
              <button
                onClick={() => {
                  setXpAmount('200');
                  setXpType('quest');
                  setXpDescription('Quest completed');
                }}
                className="px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-blue-300 text-xs hover:bg-blue-600/30 transition-colors"
              >
                +200 Quest
              </button>
              <button
                onClick={() => {
                  setXpAmount('500');
                  setXpType('milestone');
                  setXpDescription('Major milestone');
                }}
                className="px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded text-yellow-300 text-xs hover:bg-yellow-600/30 transition-colors"
              >
                +500 Epic
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Experience */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Experience</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {progression.experience.sources.slice(-10).reverse().map((source, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
              <div>
                <p className="font-medium text-white">{source.description}</p>
                <p className="text-sm text-blue-300 capitalize">📍 {source.type}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">+{source.amount} XP</p>
                <p className="text-xs text-gray-400">
                  {new Date(source.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Level Up Tab Component
const LevelUpTab: React.FC<{
  progression: ProgressionData;
  levelUpData: LevelUpData | null;
  selectedChoices: AbilityScoreChoice[];
  onChoicesChange: (choices: AbilityScoreChoice[]) => void;
  onConfirm: () => void;
}> = ({ progression, levelUpData, selectedChoices, onChoicesChange, onConfirm }) => {
  if (!levelUpData) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Pending Level Up</h3>
        <p className="text-gray-600">Gain more experience to level up!</p>
      </div>
    );
  }

  const handleAbilityChoice = (ability: AbilityScore) => {
    const newChoices = [...selectedChoices];
    const existingIndex = newChoices.findIndex(c => c.abilityScore === ability);
    
    if (existingIndex >= 0) {
      newChoices[existingIndex] = { type: 'increase', abilityScore: ability };
    } else if (newChoices.length < 2) {
      newChoices.push({ type: 'increase', abilityScore: ability });
    }
    
    onChoicesChange(newChoices);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎊</div>
        <h3 className="text-2xl font-bold text-purple-600 mb-2">
          Congratulations! Level {levelUpData.newLevel}
        </h3>
        <p className="text-gray-600">Your character has gained new abilities and power!</p>
      </div>

      {/* Level Up Benefits */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">New Benefits</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-800">Hit Points</span>
              <span className="font-bold text-green-600">+{levelUpData.hitPointIncrease}</span>
            </div>
            
            {levelUpData.skillTreePoints > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-800">Skill Tree Points</span>
                <span className="font-bold text-blue-600">+{levelUpData.skillTreePoints}</span>
              </div>
            )}
            
            {levelUpData.newFeatures.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 font-medium mb-2">New Features</p>
                <ul className="text-sm text-purple-700 space-y-1">
                  {levelUpData.newFeatures.map((feature, index) => (
                    <li key={index}>• {feature.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Ability Score Improvement */}
        {levelUpData.abilityScoreImprovement && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Ability Score Improvement</h4>
            <p className="text-sm text-gray-600 mb-4">
              Choose two different abilities to increase by 1, or select a feat.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(progression.abilityScores).map(([ability, scores]) => (
                <button
                  key={ability}
                  onClick={() => handleAbilityChoice(ability as AbilityScore)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    selectedChoices.some(c => c.abilityScore === ability)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  disabled={scores.total >= 20}
                >
                  <div className="text-xs uppercase text-gray-500">
                    {ability.slice(0, 3)}
                  </div>
                  <div className="font-bold">
                    {scores.total} → {scores.total + 1}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              Selected: {selectedChoices.length} / 2
            </div>
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="text-center pt-6 border-t">
        <button
          onClick={onConfirm}
          disabled={levelUpData.abilityScoreImprovement && selectedChoices.length === 0}
          className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Confirm Level Up
        </button>
      </div>
    </div>
  );
};

// Feats Tab Component
const FeatsTab: React.FC<{
  progression: ProgressionData;
}> = ({ progression }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Feats & Class Features</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Active Feats</h4>
          {progression.feats.length > 0 ? (
            <div className="space-y-2">
              {progression.feats.map((featId, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium">{featId}</p>
                  <p className="text-sm text-gray-600">Feat benefits applied</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No feats selected</p>
          )}
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Class Features</h4>
          {progression.classFeatures.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {progression.classFeatures.map((featureId, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{featureId}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No class features yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Skill Trees Tab Component
const SkillTreesTab: React.FC<{
  progression: ProgressionData;
}> = ({ progression }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Skill Trees</h3>
      
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🌳</div>
        <h4 className="text-xl font-semibold text-gray-800 mb-2">Skill Trees Coming Soon</h4>
        <p className="text-gray-600">
          Unlock powerful abilities and customize your character's progression path.
        </p>
      </div>
    </div>
  );
};

export default CharacterProgression; 