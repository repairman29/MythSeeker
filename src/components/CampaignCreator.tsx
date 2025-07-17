import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../firebaseService';

interface CampaignCreatorProps {
  user: any;
  onClose: () => void;
  onCampaignCreated: (gameId: string, code: string) => void;
}

interface AdventureTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  difficulty: string;
  duration: string;
  description: string;
  setting: string;
  themes: string[];
  features: string[];
  aiPrompt: string;
  recommendedLevel: string;
}

interface AISettings {
  dmStyle: string;
  descriptionStyle: string;
  difficulty: string;
  combatIntensity: string;
  puzzleComplexity: string;
  roleplayDepth: string;
}

interface GameplaySettings {
  xpGain: string;
  lootRarity: string;
  deathPenalty: string;
  savePoints: string;
  fastTravel: boolean;
  crafting: boolean;
}

interface EnvironmentSettings {
  weatherSystem: boolean;
  dayNightCycle: boolean;
  npcSchedules: boolean;
  dynamicEvents: boolean;
  worldPersistence: boolean;
}

const CampaignCreator: React.FC<CampaignCreatorProps> = ({ user, onClose, onCampaignCreated }) => {
  const navigate = useNavigate();
  const [setupMode, setSetupMode] = useState<'simple' | 'advanced'>('simple');
  const [selectedAdventure, setSelectedAdventure] = useState<AdventureTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    dmStyle: 'balanced',
    descriptionStyle: 'immersive',
    difficulty: 'medium',
    combatIntensity: 'moderate',
    puzzleComplexity: 'medium',
    roleplayDepth: 'deep'
  });
  const [gameplaySettings, setGameplaySettings] = useState<GameplaySettings>({
    xpGain: 'standard',
    lootRarity: 'balanced',
    deathPenalty: 'moderate',
    savePoints: 'frequent',
    fastTravel: true,
    crafting: false
  });
  const [environmentSettings, setEnvironmentSettings] = useState<EnvironmentSettings>({
    weatherSystem: true,
    dayNightCycle: true,
    npcSchedules: true,
    dynamicEvents: true,
    worldPersistence: true
  });

  // Comprehensive Adventure Catalog
  const adventureCatalog: AdventureTemplate[] = [
    {
      id: 'fantasy-epic',
      name: 'The Lost Crown of Eldoria',
      category: 'Fantasy',
      icon: '👑',
      difficulty: 'Medium',
      duration: '20-30 hours',
      description: 'A classic fantasy epic where players must recover the stolen crown and restore peace to the kingdom.',
      setting: 'Medieval fantasy kingdom with magic and dragons',
      themes: ['Quest', 'Politics', 'Magic', 'Combat'],
      features: ['Multiple endings', 'Faction system', 'Magic schools', 'Dragon encounters'],
      aiPrompt: 'You are a wise and experienced Dungeon Master running a classic fantasy epic. The world is rich with magic, political intrigue, and ancient secrets. Focus on immersive storytelling, meaningful choices, and epic battles.',
      recommendedLevel: '1-10'
    },
    {
      id: 'sci-fi-exploration',
      name: 'Stellar Drift: The Void Between',
      category: 'Sci-Fi',
      icon: '🚀',
      difficulty: 'Hard',
      duration: '25-35 hours',
      description: 'Explore the vast reaches of space, discover alien civilizations, and uncover the mystery of the cosmic void.',
      setting: 'Far-future space exploration with advanced technology',
      themes: ['Exploration', 'Diplomacy', 'Technology', 'Mystery'],
      features: ['Space combat', 'Alien races', 'Tech upgrades', 'Multiple planets'],
      aiPrompt: 'You are a master of science fiction storytelling, creating a vast universe filled with wonder and danger. Focus on exploration, technological advancement, and the unknown.',
      recommendedLevel: '1-15'
    },
    {
      id: 'mystery-detective',
      name: 'Shadows of the Old City',
      category: 'Mystery',
      icon: '🔍',
      difficulty: 'Medium',
      duration: '15-25 hours',
      description: 'Solve a series of connected murders in a noir-style city filled with corruption and secrets.',
      setting: 'Gritty urban environment with supernatural elements',
      themes: ['Investigation', 'Corruption', 'Supernatural', 'Social'],
      features: ['Clue system', 'Multiple suspects', 'Moral choices', 'Hidden areas'],
      aiPrompt: 'You are a master of mystery and intrigue, creating complex plots with multiple layers. Focus on investigation, character development, and moral ambiguity.',
      recommendedLevel: '1-8'
    },
    {
      id: 'horror-survival',
      name: 'The Haunting of Blackwood Manor',
      category: 'Horror',
      icon: '👻',
      difficulty: 'Hard',
      duration: '10-20 hours',
      description: 'Survive a night in a haunted mansion while uncovering the dark history of the Blackwood family.',
      setting: 'Gothic mansion with supernatural horrors',
      themes: ['Survival', 'Horror', 'Investigation', 'Psychological'],
      features: ['Sanity system', 'Limited resources', 'Multiple endings', 'Hidden lore'],
      aiPrompt: 'You are a master of horror and suspense, creating an atmosphere of dread and tension. Focus on psychological horror, resource management, and survival.',
      recommendedLevel: '1-6'
    },
    {
      id: 'post-apocalyptic',
      name: 'Wasteland Wanderers',
      category: 'Post-Apocalyptic',
      icon: '🌆',
      difficulty: 'Medium',
      duration: '20-30 hours',
      description: 'Navigate a dangerous post-apocalyptic world, build settlements, and fight for survival.',
      setting: 'Post-nuclear wasteland with scattered communities',
      themes: ['Survival', 'Community', 'Exploration', 'Conflict'],
      features: ['Base building', 'Faction wars', 'Scavenging', 'Radiation system'],
      aiPrompt: 'You are a master of post-apocalyptic storytelling, creating a harsh but hopeful world. Focus on survival, community building, and moral choices.',
      recommendedLevel: '1-12'
    },
    {
      id: 'steampunk-adventure',
      name: 'Clockwork Revolution',
      category: 'Steampunk',
      icon: '⚙️',
      difficulty: 'Medium',
      duration: '18-28 hours',
      description: 'Join a revolution against the oppressive clockwork empire in a world of steam and brass.',
      setting: 'Victorian-era city with advanced steam technology',
      themes: ['Revolution', 'Technology', 'Social', 'Adventure'],
      features: ['Steam-powered gadgets', 'Underground resistance', 'Social classes', 'Political intrigue'],
      aiPrompt: 'You are a master of steampunk aesthetics and revolutionary storytelling. Focus on social justice, technological wonder, and political intrigue.',
      recommendedLevel: '1-10'
    },
    {
      id: 'western-frontier',
      name: 'The Lawless Frontier',
      category: 'Western',
      icon: '🤠',
      difficulty: 'Easy',
      duration: '12-20 hours',
      description: 'Become a legendary gunslinger in the untamed American frontier.',
      setting: 'Wild West with supernatural elements',
      themes: ['Justice', 'Freedom', 'Adventure', 'Supernatural'],
      features: ['Gunfights', 'Horse riding', 'Ghost towns', 'Native spirits'],
      aiPrompt: 'You are a master of Western storytelling, creating a world of freedom, danger, and adventure. Focus on justice, personal freedom, and the frontier spirit.',
      recommendedLevel: '1-8'
    },
    {
      id: 'cyberpunk-heist',
      name: 'Neon Dreams',
      category: 'Cyberpunk',
      icon: '🌃',
      difficulty: 'Hard',
      duration: '15-25 hours',
      description: 'Pull off the ultimate heist in a neon-lit cyberpunk city controlled by megacorporations.',
      setting: 'Futuristic city with cybernetic enhancements',
      themes: ['Heist', 'Corruption', 'Technology', 'Identity'],
      features: ['Cybernetics', 'Hacking', 'Corporate espionage', 'Multiple approaches'],
      aiPrompt: 'You are a master of cyberpunk aesthetics and heist storytelling. Focus on corporate corruption, technological advancement, and high-stakes action.',
      recommendedLevel: '1-10'
    }
  ];

  const handleCreateCampaign = async () => {
    try {
      const campaignData = {
        theme: selectedAdventure?.name || 'Custom Adventure',
        background: selectedAdventure?.id || 'custom',
        customPrompt: customPrompt || selectedAdventure?.aiPrompt || '',
        maxPlayers: isMultiplayer ? maxPlayers : 1,
        players: [],
        aiSettings,
        gameplaySettings,
        environmentSettings,
        adventureType: selectedAdventure?.id || 'custom'
      };

      const { gameId, code } = await firebaseService.createGameSession(campaignData);
      onCampaignCreated(gameId, code);
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedAdventure(null);
    setCustomPrompt('');
    setIsMultiplayer(true);
    setMaxPlayers(6);
    setSetupMode('simple');
    setAiSettings({
      dmStyle: 'balanced',
      descriptionStyle: 'immersive',
      difficulty: 'medium',
      combatIntensity: 'moderate',
      puzzleComplexity: 'medium',
      roleplayDepth: 'deep'
    });
    setGameplaySettings({
      xpGain: 'standard',
      lootRarity: 'balanced',
      deathPenalty: 'moderate',
      savePoints: 'frequent',
      fastTravel: true,
      crafting: false
    });
    setEnvironmentSettings({
      weatherSystem: true,
      dayNightCycle: true,
      npcSchedules: true,
      dynamicEvents: true,
      worldPersistence: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-slate-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Create New Campaign</h2>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Setup Mode Toggle */}
          <div className="flex space-x-4">
            <button
              onClick={() => setSetupMode('simple')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                setupMode === 'simple'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🚀 Quick Start
            </button>
            <button
              onClick={() => setSetupMode('advanced')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                setupMode === 'advanced'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ⚙️ Advanced Setup
            </button>
          </div>

          {/* Adventure Catalog */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Choose Your Adventure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adventureCatalog.map((adventure) => (
                <div
                  key={adventure.id}
                  onClick={() => setSelectedAdventure(adventure)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAdventure?.id === adventure.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{adventure.icon}</span>
                    <div>
                      <h4 className="text-white font-medium">{adventure.name}</h4>
                      <p className="text-slate-400 text-sm">{adventure.category}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{adventure.description}</p>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Difficulty: {adventure.difficulty}</span>
                    <span>{adventure.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Campaign Type</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={isMultiplayer}
                    onChange={() => setIsMultiplayer(true)}
                    className="text-blue-600"
                  />
                  <span className="text-white">Multiplayer Campaign</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!isMultiplayer}
                    onChange={() => setIsMultiplayer(false)}
                    className="text-blue-600"
                  />
                  <span className="text-white">Solo Adventure</span>
                </label>
              </div>
            </div>

            {isMultiplayer && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Players</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                  <option value={6}>6 Players</option>
                </select>
              </div>
            )}
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add any specific instructions or modifications to your adventure..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Advanced Settings */}
          {setupMode === 'advanced' && (
            <div className="space-y-6">
              {/* AI Settings */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">🤖 AI Dungeon Master Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">DM Style</label>
                    <select
                      value={aiSettings.dmStyle}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, dmStyle: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="balanced">Balanced</option>
                      <option value="narrative">Narrative-Focused</option>
                      <option value="combat">Combat-Heavy</option>
                      <option value="puzzle">Puzzle-Master</option>
                      <option value="roleplay">Roleplay-Intensive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description Style</label>
                    <select
                      value={aiSettings.descriptionStyle}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, descriptionStyle: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="immersive">Immersive & Detailed</option>
                      <option value="concise">Concise & Fast</option>
                      <option value="atmospheric">Atmospheric & Moody</option>
                      <option value="cinematic">Cinematic & Dynamic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                    <select
                      value={aiSettings.difficulty}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="brutal">Brutal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Combat Intensity</label>
                    <select
                      value={aiSettings.combatIntensity}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, combatIntensity: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="intense">Intense</option>
                      <option value="deadly">Deadly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Gameplay Settings */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">🎮 Gameplay Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">XP Gain</label>
                    <select
                      value={gameplaySettings.xpGain}
                      onChange={(e) => setGameplaySettings(prev => ({ ...prev, xpGain: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="slow">Slow & Steady</option>
                      <option value="standard">Standard</option>
                      <option value="fast">Fast Progression</option>
                      <option value="epic">Epic Advancement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Loot Rarity</label>
                    <select
                      value={gameplaySettings.lootRarity}
                      onChange={(e) => setGameplaySettings(prev => ({ ...prev, lootRarity: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="scarce">Scarce</option>
                      <option value="balanced">Balanced</option>
                      <option value="generous">Generous</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Death Penalty</label>
                    <select
                      value={gameplaySettings.deathPenalty}
                      onChange={(e) => setGameplaySettings(prev => ({ ...prev, deathPenalty: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="none">No Penalty</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Save Points</label>
                    <select
                      value={gameplaySettings.savePoints}
                      onChange={(e) => setGameplaySettings(prev => ({ ...prev, savePoints: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                    >
                      <option value="frequent">Frequent</option>
                      <option value="moderate">Moderate</option>
                      <option value="rare">Rare</option>
                      <option value="checkpoint">Checkpoint Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Environment Settings */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">🌍 World Environment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={environmentSettings.weatherSystem}
                      onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, weatherSystem: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-white">Dynamic Weather System</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={environmentSettings.dayNightCycle}
                      onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, dayNightCycle: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-white">Day/Night Cycle</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={environmentSettings.npcSchedules}
                      onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, npcSchedules: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-white">NPC Schedules</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={environmentSettings.dynamicEvents}
                      onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, dynamicEvents: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-white">Dynamic Events</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={environmentSettings.worldPersistence}
                      onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, worldPersistence: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-white">World Persistence</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Create Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700/50">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={!selectedAdventure}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCreator; 