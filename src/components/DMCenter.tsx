import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Users, 
  Settings, 
  Database, 
  Brain, 
  Wand2, 
  Map, 
  FileText, 
  BarChart3,
  Plus,
  Edit,
  Save,
  Download,
  Upload,
  Search,
  Filter,
  Star,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react';

interface DMCenterProps {
  dmCenterData: any;
  onUpdateDMCenter: (data: any) => void;
  currentCampaign?: any;
}

const DMCenter: React.FC<DMCenterProps> = ({ dmCenterData, onUpdateDMCenter, currentCampaign }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [lastPersonaUpdate, setLastPersonaUpdate] = useState<number>(0);

  // Main navigation tabs for DM Center
  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 size={20} />, description: 'Campaign analytics and quick tools' },
    { id: 'content', name: 'Content Library', icon: <Database size={20} />, description: 'NPCs, encounters, locations, plot hooks' },
    { id: 'rules', name: 'Rules Engine', icon: <Book size={20} />, description: 'Rule systems, mechanics, and automation' },
    { id: 'ai-brain', name: 'AI Brain', icon: <Brain size={20} />, description: 'AI settings, personality, and training' },
    { id: 'world-builder', name: 'World Builder', icon: <Map size={20} />, description: 'Maps, locations, and world state' },
    { id: 'session-tools', name: 'Session Tools', icon: <Wand2 size={20} />, description: 'Live session management and tools' },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 size={20} />, description: 'Player engagement and story metrics' },
    { id: 'marketplace', name: 'Marketplace', icon: <Star size={20} />, description: 'Community content and sharing' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Campaign Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-blue-200">
              <span>Active Campaigns:</span>
              <span className="text-green-400 font-semibold">3</span>
            </div>
            <div className="flex justify-between text-blue-200">
              <span>Total Sessions:</span>
              <span className="text-white font-semibold">47</span>
            </div>
            <div className="flex justify-between text-blue-200">
              <span>Average Session Length:</span>
              <span className="text-white font-semibold">3.2 hrs</span>
            </div>
            <div className="flex justify-between text-blue-200">
              <span>Player Satisfaction:</span>
              <span className="text-yellow-400 font-semibold">4.8/5</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all text-white font-medium flex items-center space-x-2">
              <Plus size={16} />
              <span>New Encounter</span>
            </button>
            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all text-white font-medium flex items-center space-x-2">
              <Users size={16} />
              <span>Create NPC</span>
            </button>
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all text-white font-medium flex items-center space-x-2">
              <Map size={16} />
              <span>Build Location</span>
            </button>
            <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-all text-white font-medium flex items-center space-x-2">
              <FileText size={16} />
              <span>Plot Hook Generator</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-blue-200">Created &quot;Ancient Dragon&quot; encounter</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-blue-200">Updated &quot;Tavern Keeper&quot; NPC personality</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-blue-200">Generated new plot hooks for Act 2</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-blue-200">AI trained on session feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Progress */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">Development Roadmap Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-blue-200 mb-2">
              <span>Phase 1: Foundation Infrastructure</span>
              <span>85%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">✅ Auth, Multiplayer, Firebase, UI Components, Character System</p>
          </div>
          <div>
            <div className="flex justify-between text-blue-200 mb-2">
              <span>Phase 2: AI Intelligence Layer</span>
              <span>70%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">✅ Core AI DM, Memory System, Context Awareness, Dynamic Responses</p>
          </div>
          <div>
            <div className="flex justify-between text-blue-200 mb-2">
              <span>Phase 3: DM Mastery Features</span>
              <span>35%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">✅ DM Center, Combat System, NPC Framework, World Persistence</p>
          </div>
          <div>
            <div className="flex justify-between text-blue-200 mb-2">
              <span>User Story Completion (FTUE)</span>
              <span>78%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">✅ 5/6 Core User Stories Implemented, Needs Connection Polish</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContentLibrary = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search content library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
        >
          <option value="all">All Content</option>
          <option value="encounters">Encounters</option>
          <option value="npcs">NPCs</option>
          <option value="locations">Locations</option>
          <option value="plot-hooks">Plot Hooks</option>
          <option value="magic-items">Magic Items</option>
        </select>
      </div>

      {/* Content Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Encounters */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <span>⚔️</span>
              <span>Encounters</span>
            </h3>
            <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
              <Plus size={16} className="text-white" />
            </button>
          </div>
          <div className="space-y-3 mb-4">
            <div className="p-3 bg-black/20 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">Dragon&apos;s Lair</h4>
                <span className="text-xs bg-red-600 px-2 py-1 rounded text-white">Hard</span>
              </div>
              <p className="text-sm text-gray-300">Ancient red dragon in volcanic cave</p>
              <div className="flex space-x-2 mt-2">
                <button className="p-1 hover:bg-white/10 rounded"><Eye size={12} className="text-gray-400" /></button>
                <button className="p-1 hover:bg-white/10 rounded"><Edit size={12} className="text-gray-400" /></button>
                <button className="p-1 hover:bg-white/10 rounded"><Trash2 size={12} className="text-gray-400" /></button>
              </div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-400">12 encounters total</span>
          </div>
        </div>

        {/* NPCs */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <span>👥</span>
              <span>NPCs</span>
            </h3>
            <button className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all">
              <Plus size={16} className="text-white" />
            </button>
          </div>
          <div className="space-y-3 mb-4">
            <div className="p-3 bg-black/20 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">Gareth the Wise</h4>
                <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white">Ally</span>
              </div>
              <p className="text-sm text-gray-300">Elderly wizard, mentor figure</p>
              <div className="flex space-x-2 mt-2">
                <button className="p-1 hover:bg-white/10 rounded"><Eye size={12} className="text-gray-400" /></button>
                <button className="p-1 hover:bg-white/10 rounded"><Edit size={12} className="text-gray-400" /></button>
                <button className="p-1 hover:bg-white/10 rounded"><Trash2 size={12} className="text-gray-400" /></button>
              </div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-400">28 NPCs total</span>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <span>🏰</span>
              <span>Locations</span>
            </h3>
            <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all">
              <Plus size={16} className="text-white" />
            </button>
          </div>
          <div className="space-y-3 mb-4">
            <div className="p-3 bg-black/20 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">Moonhaven Tavern</h4>
                <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">Safe</span>
              </div>
              <p className="text-sm text-gray-300">Cozy roadside inn with secrets</p>
              <div className="flex space-x-2 mt-2">
                <button className="p-1 hover:bg-white/10 rounded"><Eye size={12} className="text-gray-400" /></button>
                <button className="p-1 hover:bg-white/10 rounded"><Edit size={12} className="text-gray-400" /></button>
                <button className="p-1 hover:bg-white/10 rounded"><Trash2 size={12} className="text-gray-400" /></button>
              </div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-400">15 locations total</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRulesEngine = () => (
    <div className="space-y-6">
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">Rules System Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Active Rule System</label>
            <select 
              value={dmCenterData?.ruleSystem || 'dnd5e'}
              onChange={(e) => onUpdateDMCenter({ ...dmCenterData, ruleSystem: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="dnd5e">D&D 5th Edition</option>
              <option value="pathfinder2e">Pathfinder 2e</option>
              <option value="callofcthulhu">Call of Cthulhu</option>
              <option value="custom">Custom System</option>
            </select>
          </div>
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Automation Level</label>
            <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option value="full">Full Automation</option>
              <option value="assisted">AI Assisted</option>
              <option value="manual">Manual Override</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Combat Rules</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
              <span className="text-blue-200">Automatic initiative tracking</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
              <span className="text-blue-200">Auto-calculate damage</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" />
              <span className="text-blue-200">Enable critical fumbles</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
              <span className="text-blue-200">Dynamic difficulty adjustment</span>
            </label>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Social & Exploration</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
              <span className="text-blue-200">Auto-generate skill DCs</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
              <span className="text-blue-200">NPC personality consistency</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" />
              <span className="text-blue-200">Consequence tracking</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
              <span className="text-blue-200">World state continuity</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIBrain = () => {
    // Get current AI settings from dmCenterData or use defaults
    const aiSettings = dmCenterData?.aiSettings || {
      dmStyle: 'balanced',
      difficulty: 6,
      descriptionLength: 'detailed',
      improvisationLevel: 7,
      npcComplexity: 'detailed',
      conflictFrequency: 5,
      continuityStrictness: 'moderate',
      worldReactivity: 8
    };

    // Get DMPersona settings or use defaults
    const dmPersona = dmCenterData?.dmPersona || {
      tone: 'friendly',
      humor_level: 'medium',
      descriptiveness: 'moderate',
      challenge_level: 'moderate',
      narrative_focus: 'balanced',
      improvisation_style: 'moderate'
    };

    // Get AI training and memory settings
    const aiTraining = dmCenterData?.aiTraining || {
      learningEnabled: true,
      feedbackCollection: true,
      personalityAdaptation: true,
      memoryRetention: 30,
      contextWindow: 10,
      longTermMemory: true,
      emotionalMemory: true,
      crossCampaignLearning: false
    };

    const updateAISetting = (key: string, value: any) => {
      onUpdateDMCenter({
        ...dmCenterData,
        aiSettings: {
          ...aiSettings,
          [key]: value
        }
      });
    };

    const updateDMPersona = (key: string, value: any) => {
      onUpdateDMCenter({
        ...dmCenterData,
        dmPersona: {
          ...dmPersona,
          [key]: value
        }
      });
    };

    const updateAITraining = (key: string, value: any) => {
      onUpdateDMCenter({
        ...dmCenterData,
        aiTraining: {
          ...aiTraining,
          [key]: value
        }
      });
    };

    return (
      <div className="space-y-6">
        {/* AI Personality & Behavior */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">AI Personality & Behavior</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">DM Style</label>
              <select 
                value={aiSettings.dmStyle}
                onChange={(e) => updateAISetting('dmStyle', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="balanced">Balanced (Recommended)</option>
                <option value="story-focused">Story-Focused</option>
                <option value="combat-heavy">Combat-Heavy</option>
                <option value="roleplay-intensive">Roleplay-Intensive</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Difficulty Preference</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={aiSettings.difficulty}
                onChange={(e) => updateAISetting('difficulty', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Easy</span>
                <span>Challenging</span>
                <span>Brutal</span>
              </div>
            </div>
          </div>
        </div>

        {/* DMPersona Configuration */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-6 border border-purple-400/30">
          <h3 className="text-xl font-semibold text-white mb-4">🎭 DM Persona Configuration</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Tone & Personality</label>
              <select 
                value={dmPersona.tone}
                onChange={(e) => updateDMPersona('tone', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-3"
              >
                <option value="friendly">Friendly & Approachable</option>
                <option value="witty">Witty & Clever</option>
                <option value="serious">Serious & Dramatic</option>
                <option value="humorous">Humorous & Light</option>
                <option value="mysterious">Mysterious & Enigmatic</option>
                <option value="dramatic">Dramatic & Epic</option>
              </select>
              
              <label className="block text-blue-200 text-sm font-medium mb-2">Humor Level</label>
              <select 
                value={dmPersona.humor_level}
                onChange={(e) => updateDMPersona('humor_level', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="none">No Humor</option>
                <option value="low">Subtle Humor</option>
                <option value="medium">Balanced Humor</option>
                <option value="high">High Humor</option>
              </select>
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Narrative Focus</label>
              <select 
                value={dmPersona.narrative_focus}
                onChange={(e) => updateDMPersona('narrative_focus', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-3"
              >
                <option value="balanced">Balanced</option>
                <option value="action">Action-Oriented</option>
                <option value="character">Character-Driven</option>
                <option value="exploration">Exploration-Focused</option>
                <option value="puzzle">Puzzle-Heavy</option>
              </select>

              <label className="block text-blue-200 text-sm font-medium mb-2">Improvisation Style</label>
              <select 
                value={dmPersona.improvisation_style}
                onChange={(e) => updateDMPersona('improvisation_style', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="wild">Wild & Creative</option>
              </select>
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">Description Style</label>
              <select 
                value={dmPersona.descriptiveness}
                onChange={(e) => updateDMPersona('descriptiveness', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white mb-3"
              >
                <option value="minimal">Minimal</option>
                <option value="moderate">Moderate</option>
                <option value="high">High Detail</option>
                <option value="verbose">Very Detailed</option>
              </select>

              <label className="block text-blue-200 text-sm font-medium mb-2">Challenge Level</label>
              <select 
                value={dmPersona.challenge_level}
                onChange={(e) => updateDMPersona('challenge_level', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
                <option value="deadly">Deadly</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Engine Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Narrative Engine</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-1">Description Length</label>
                <select 
                  value={aiSettings.descriptionLength}
                  onChange={(e) => updateAISetting('descriptionLength', e.target.value)}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="verbose">Verbose</option>
                </select>
              </div>
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-1">Improvisation Level</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={aiSettings.improvisationLevel}
                  onChange={(e) => updateAISetting('improvisationLevel', parseInt(e.target.value))}
                  className="w-full" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Social Director</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-1">NPC Complexity</label>
                <select 
                  value={aiSettings.npcComplexity}
                  onChange={(e) => updateAISetting('npcComplexity', e.target.value)}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                >
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                  <option value="complex">Complex</option>
                </select>
              </div>
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-1">Conflict Frequency</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={aiSettings.conflictFrequency}
                  onChange={(e) => updateAISetting('conflictFrequency', parseInt(e.target.value))}
                  className="w-full" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">World Keeper</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-1">Continuity Strictness</label>
                <select 
                  value={aiSettings.continuityStrictness}
                  onChange={(e) => updateAISetting('continuityStrictness', e.target.value)}
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                >
                  <option value="loose">Loose</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-1">World Reactivity</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={aiSettings.worldReactivity}
                  onChange={(e) => updateAISetting('worldReactivity', parseInt(e.target.value))}
                  className="w-full" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Training & Learning */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-6 border border-green-400/30">
          <h3 className="text-xl font-semibold text-white mb-4">🧠 AI Training & Learning</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">Learning Features</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={aiTraining.learningEnabled}
                    onChange={(e) => updateAITraining('learningEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-blue-200">Enable AI Learning</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={aiTraining.feedbackCollection}
                    onChange={(e) => updateAITraining('feedbackCollection', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-blue-200">Collect Player Feedback</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={aiTraining.personalityAdaptation}
                    onChange={(e) => updateAITraining('personalityAdaptation', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-blue-200">Adapt Personality to Players</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={aiTraining.crossCampaignLearning}
                    onChange={(e) => updateAITraining('crossCampaignLearning', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-blue-200">Cross-Campaign Learning</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">Memory Configuration</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-1">Memory Retention (Days)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="365" 
                    value={aiTraining.memoryRetention}
                    onChange={(e) => updateAITraining('memoryRetention', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-1">Context Window (Actions)</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="50" 
                    value={aiTraining.contextWindow}
                    onChange={(e) => updateAITraining('contextWindow', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={aiTraining.longTermMemory}
                    onChange={(e) => updateAITraining('longTermMemory', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-blue-200">Long-Term Memory Summarization</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={aiTraining.emotionalMemory}
                    onChange={(e) => updateAITraining('emotionalMemory', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-blue-200">Emotional Memory Tracking</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced AI Features */}
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg p-6 border border-orange-400/30">
          <h3 className="text-lg font-semibold text-white mb-4">Advanced AI Features</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Dynamic DM System</h4>
                <p className="text-blue-200 text-sm">Advanced NLP, sentiment analysis, and intent recognition</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-sm font-medium">ENABLED</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Enhanced Memory</h4>
                <p className="text-blue-200 text-sm">Long-term memory and context awareness</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-sm font-medium">ENABLED</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Tactical Combat AI</h4>
                <p className="text-blue-200 text-sm">Advanced enemy decision making and positioning</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-sm font-medium">ENABLED</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">NPC Emotional Intelligence</h4>
                <p className="text-blue-200 text-sm">Dynamic NPC personalities and emotional states</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-sm font-medium">ENABLED</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">World Consequence Engine</h4>
                <p className="text-blue-200 text-sm">Player actions ripple through the world</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400 text-sm font-medium">ENABLED</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded border border-white/20">
            <p className="text-xs text-gray-300 italic">
              &quot;Advanced AI features are now active! Experience enhanced NPC interactions, smarter combat, and deeper world persistence.&quot;
            </p>
          </div>
        </div>

        {/* AI Settings Preview */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-400/30">
          <h3 className="text-lg font-semibold text-white mb-4">AI Behavior Preview</h3>
          <div className="text-blue-200 text-sm space-y-2">
            <p><strong>DM Persona:</strong> {dmPersona.tone} tone with {dmPersona.humor_level} humor, {dmPersona.descriptiveness} descriptions</p>
            <p><strong>Narrative Focus:</strong> {dmPersona.narrative_focus} with {dmPersona.improvisation_style} improvisation</p>
            <p><strong>Challenge Level:</strong> {dmPersona.challenge_level} difficulty</p>
            <p><strong>Style:</strong> {aiSettings.dmStyle.replace('-', ' ')} DM with {aiSettings.descriptionLength} descriptions</p>
            <p><strong>Difficulty:</strong> {aiSettings.difficulty}/10 - {aiSettings.difficulty <= 3 ? 'Easy going' : aiSettings.difficulty <= 6 ? 'Balanced challenge' : 'High stakes'}</p>
            <p><strong>NPCs:</strong> {aiSettings.npcComplexity} personalities with {aiSettings.conflictFrequency}/10 conflict frequency</p>
            <p><strong>World:</strong> {aiSettings.continuityStrictness} continuity with {aiSettings.worldReactivity}/10 reactivity to player actions</p>
            <p><strong>Memory:</strong> {aiTraining.contextWindow} actions context, {aiTraining.memoryRetention} days retention</p>
            <p><strong>Learning:</strong> {aiTraining.learningEnabled ? 'Enabled' : 'Disabled'} with {aiTraining.crossCampaignLearning ? 'cross-campaign' : 'single-campaign'} learning</p>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded border border-white/20">
            <p className="text-xs text-gray-300 italic">
              &quot;These settings will be applied to all new campaigns and can be adjusted during gameplay. The AI will adapt its behavior based on your preferences and player feedback.&quot;
            </p>
          </div>
        </div>

        {/* AI Training Actions */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg p-6 border border-indigo-400/30">
          <h3 className="text-lg font-semibold text-white mb-4">AI Training Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all text-white font-medium flex items-center justify-center space-x-2">
              <Brain size={16} />
              <span>Train on Session Data</span>
            </button>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all text-white font-medium flex items-center justify-center space-x-2">
              <Download size={16} />
              <span>Export AI Model</span>
            </button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all text-white font-medium flex items-center justify-center space-x-2">
              <Upload size={16} />
              <span>Import AI Model</span>
            </button>
          </div>
          <div className="mt-4 p-3 bg-white/10 rounded border border-white/20">
            <p className="text-xs text-gray-300 italic">
              &quot;Advanced AI training features allow you to customize the AI's behavior based on your specific campaign needs and player preferences.&quot;
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSessionTools = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Initiative Tracker */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Initiative Tracker</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-600/20 rounded border border-green-600/30">
              <div>
                <span className="font-medium text-white">Aria (Fighter)</span>
                <span className="text-sm text-green-300 ml-2">PC</span>
              </div>
              <span className="text-white font-bold">18</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-600/20 rounded border border-red-600/30">
              <div>
                <span className="font-medium text-white">Goblin Warrior</span>
                <span className="text-sm text-red-300 ml-2">Enemy</span>
              </div>
              <span className="text-white font-bold">15</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-600/20 rounded border border-blue-600/30">
              <div>
                <span className="font-medium text-white">Zephyr (Rogue)</span>
                <span className="text-sm text-blue-300 ml-2">PC</span>
              </div>
              <span className="text-white font-bold">12</span>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm">
              Next Turn
            </button>
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">
              Add Combatant
            </button>
            <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm">
              End Combat
            </button>
          </div>
        </div>

        {/* Session Notes */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Session Notes</h3>
          <textarea
            placeholder="Keep track of important events, player decisions, and story developments..."
            className="w-full h-40 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
            value={dmCenterData?.dmTools?.sessionNotes || ''}
            onChange={(e) => onUpdateDMCenter({
              ...dmCenterData,
              dmTools: { ...dmCenterData?.dmTools, sessionNotes: e.target.value }
            })}
          />
          <div className="flex space-x-2 mt-4">
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center space-x-1">
              <Save size={14} />
              <span>Save</span>
            </button>
            <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center space-x-1">
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-200">Common DCs</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Easy: 10</div>
              <div>Medium: 15</div>
              <div>Hard: 20</div>
              <div>Very Hard: 25</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-200">Conditions</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Blinded: Can&apos;t see</div>
              <div>Charmed: Can&apos;t attack charmer</div>
              <div>Frightened: Disadvantage on rolls</div>
              <div>Prone: Speed 0, melee adv/disadv</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-200">Actions</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Attack: Weapon/spell attack</div>
              <div>Dash: Double movement</div>
              <div>Dodge: Attacks have disadvantage</div>
              <div>Help: Give ally advantage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'content':
        return renderContentLibrary();
      case 'rules':
        return renderRulesEngine();
      case 'ai-brain':
        return renderAIBrain();
      case 'session-tools':
        return renderSessionTools();
      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-white mb-2">{tabs.find(t => t.id === activeTab)?.name} Coming Soon</h3>
            <p className="text-blue-200">This feature is part of our development roadmap and will be available in future updates.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-b border-purple-500/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
              <span className="text-4xl">🧙‍♂️</span>
              <span>DM&apos;s Center</span>
            </h1>
            <p className="text-blue-200 mt-1">Command center for the ultimate AI Dungeon Master experience</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all text-white font-medium flex items-center space-x-2">
              <Upload size={16} />
              <span>Import Content</span>
            </button>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all text-white font-medium flex items-center space-x-2">
              <Download size={16} />
              <span>Export Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 flex items-center space-x-1 sm:space-x-2 transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-white border-blue-400'
                  : 'text-blue-200 hover:text-white hover:bg-white/5 border-transparent'
              }`}
              title={tab.description}
            >
              {tab.icon}
              <span className="font-medium text-sm sm:text-base hidden sm:inline">{tab.name}</span>
              <span className="font-medium text-xs sm:hidden">{tab.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DMCenter; 