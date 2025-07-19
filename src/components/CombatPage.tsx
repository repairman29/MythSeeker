import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Swords, 
  Shield, 
  Target, 
  Trophy, 
  Users, 
  Clock, 
  Zap, 
  Heart, 
  ArrowLeft,
  Play,
  Pause,
  Settings,
  BarChart3,
  Dice6,
  Sword,
  User,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import CombatSystem from './CombatSystem';
import { firebaseService } from '../firebaseService';

interface CombatPageProps {
  user: any;
}

const CombatPage: React.FC<CombatPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [showCombatSystem, setShowCombatSystem] = useState(false);
  const [combatHistory, setCombatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'simulator' | 'training' | 'history' | 'tactics'>('simulator');

  // Combat state management
  const [combatState, setCombatState] = useState<any>(null);
  const [combatLoading, setCombatLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user's characters
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters || []);
        
        // Load combat history from localStorage
        const history = JSON.parse(localStorage.getItem('mythseeker_combat_history') || '[]');
        setCombatHistory(history);
      } catch (error) {
        console.error('Error loading combat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user.uid]);

  const handleStartCombat = async (character: any) => {
    setSelectedCharacter(character);
    setCombatLoading(true);
    
    try {
      // Start combat with backend
      const result = await firebaseService.startCombat({
        gameId: 'test-combat',
        enemies: [
          { name: 'Goblin Warrior', health: 15, armorClass: 14, initiative: 12 },
          { name: 'Orc Berserker', health: 25, armorClass: 12, initiative: 8 }
        ]
      });

      if (result.success) {
        setCombatState(result.combatState);
        setShowCombatSystem(true);
      } else {
        console.error('Failed to start combat:', result.error);
      }
    } catch (error) {
      console.error('Combat initialization error:', error);
    } finally {
      setCombatLoading(false);
    }
  };

  const handleCombatAction = async (action: any) => {
    if (!combatState) return;

    try {
      const result = await firebaseService.resolveCombatAction({
        combatId: combatState.id,
        action
      });

      if (result.success) {
        setCombatState(result.combatState);
        
        // Check if combat ended
        if (result.combatState.status === 'completed') {
          handleCombatEnd({
            victory: result.combatState.participants.some((p: any) => p.type === 'player' && p.health > 0),
            enemies: result.combatState.participants.filter((p: any) => p.type === 'enemy'),
            rounds: result.combatState.round,
            experienceGained: 125 * result.combatState.participants.filter((p: any) => p.type === 'enemy').length
          });
        }
      }
    } catch (error) {
      console.error('Combat action error:', error);
    }
  };

  const handleCombatEnd = (result: any) => {
    // Save combat result to history
    const newHistory = [
      {
        id: Date.now(),
        character: selectedCharacter?.name || 'Unknown',
        result: result,
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 300) + 60 // Mock duration
      },
      ...combatHistory
    ].slice(0, 10); // Keep last 10 combats
    
    setCombatHistory(newHistory);
    localStorage.setItem('mythseeker_combat_history', JSON.stringify(newHistory));
    setShowCombatSystem(false);
    setSelectedCharacter(null);
    setCombatState(null);
  };

  const handleEndCombat = async () => {
    if (!combatState) return;

    try {
      await firebaseService.endCombat({ combatId: combatState.id });
      setCombatState(null);
      setShowCombatSystem(false);
      setSelectedCharacter(null);
    } catch (error) {
      console.error('End combat error:', error);
    }
  };

  const getCombatStats = () => {
    const victories = combatHistory.filter(h => h.result.victory).length;
    const totalCombats = combatHistory.length;
    const winRate = totalCombats > 0 ? Math.round((victories / totalCombats) * 100) : 0;
    const avgDuration = totalCombats > 0 ? Math.round(combatHistory.reduce((sum, h) => sum + (h.duration || 0), 0) / totalCombats) : 0;
    
    return { victories, totalCombats, winRate, avgDuration };
  };

  const renderCombatSimulator = () => (
    <div className="space-y-6">
      {/* Character Selection */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Select Character
        </h3>
        {characters.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-blue-200 mb-4">No characters available</p>
            <button 
              onClick={() => navigate('/characters')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Create Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 hover:border-blue-400/50 transition-colors cursor-pointer"
                onClick={() => setSelectedCharacter(character)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {character.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{character.name}</h4>
                    <p className="text-slate-400 text-sm">Level {character.level} {character.class}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Health:</span>
                    <span className="text-green-400">{character.health}/{character.maxHealth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AC:</span>
                    <span className="text-blue-400">{character.stats?.armorClass || 10}</span>
                  </div>
                </div>
                {selectedCharacter?.id === character.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCombat(character);
                    }}
                    disabled={combatLoading}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
                  >
                    {combatLoading ? 'Starting Combat...' : 'Start Combat'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Combat Options */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Swords className="w-5 h-5 mr-2" />
          Quick Combat Scenarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
            <h4 className="text-white font-semibold mb-2">Goblin Ambush</h4>
            <p className="text-slate-400 text-sm mb-3">Face off against 2-3 goblins in a forest clearing</p>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400 text-sm">Difficulty: Easy</span>
              <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Start
              </button>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
            <h4 className="text-white font-semibold mb-2">Orc Patrol</h4>
            <p className="text-slate-400 text-sm mb-3">Battle experienced orc warriors on a mountain pass</p>
            <div className="flex justify-between items-center">
              <span className="text-orange-400 text-sm">Difficulty: Medium</span>
              <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Start
              </button>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
            <h4 className="text-white font-semibold mb-2">Dragon Wyrmling</h4>
            <p className="text-slate-400 text-sm mb-3">Challenge a young dragon in its lair</p>
            <div className="flex justify-between items-center">
              <span className="text-red-400 text-sm">Difficulty: Hard</span>
              <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Combat Training
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Training Dummies</h4>
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Melee Combat</span>
                  <span className="text-green-400">Level 3</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-slate-400 text-sm mt-2">Practice sword, axe, and spear techniques</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Ranged Combat</span>
                  <span className="text-blue-400">Level 2</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-slate-400 text-sm mt-2">Improve bow and crossbow accuracy</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Spell Practice</h4>
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Evocation</span>
                  <span className="text-purple-400">Level 4</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <p className="text-slate-400 text-sm mt-2">Master offensive spell casting</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Abjuration</span>
                  <span className="text-cyan-400">Level 2</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <p className="text-slate-400 text-sm mt-2">Practice defensive magic</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCombatHistory = () => {
    const stats = getCombatStats();
    
    return (
      <div className="space-y-6">
        {/* Combat Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.victories}</div>
            <div className="text-slate-400 text-sm">Victories</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <Swords className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalCombats}</div>
            <div className="text-slate-400 text-sm">Total Battles</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.winRate}%</div>
            <div className="text-slate-400 text-sm">Win Rate</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.avgDuration}s</div>
            <div className="text-slate-400 text-sm">Avg Duration</div>
          </div>
        </div>

        {/* Recent Combat History */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Battles
          </h3>
          {combatHistory.length === 0 ? (
            <div className="text-center py-8">
              <Swords className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No combat history yet</p>
              <p className="text-slate-500 text-sm">Start a battle to see your combat record</p>
            </div>
          ) : (
            <div className="space-y-3">
              {combatHistory.map((combat) => (
                <div key={combat.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-semibold">{combat.character}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          combat.result.victory ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {combat.result.victory ? 'Victory' : 'Defeat'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        vs {combat.result.enemies?.length || 1} enemies • {combat.result.rounds || 'Unknown'} rounds
                      </p>
                      {combat.result.experienceGained && (
                        <p className="text-blue-400 text-sm">+{combat.result.experienceGained} XP gained</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-sm">
                        {new Date(combat.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {combat.duration}s duration
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTactics = () => (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Tactical Knowledge
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Combat Fundamentals</h4>
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Action Economy</h5>
                <p className="text-slate-400 text-sm">
                  Each turn you get one action, one move, and one bonus action. Use them wisely!
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Positioning</h5>
                <p className="text-slate-400 text-sm">
                  Control space with movement. Use cover, high ground, and chokepoints.
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Resource Management</h5>
                <p className="text-slate-400 text-sm">
                  Manage spell slots, hit dice, and special abilities across encounters.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Advanced Tactics</h4>
            <div className="space-y-3">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Focus Fire</h5>
                <p className="text-slate-400 text-sm">
                  Concentrate attacks on single targets to eliminate threats quickly.
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Battlefield Control</h5>
                <p className="text-slate-400 text-sm">
                  Use spells and abilities to control enemy movement and actions.
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Team Synergy</h5>
                <p className="text-slate-400 text-sm">
                  Coordinate with allies for devastating combination attacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-200">Loading combat tools...</p>
        </div>
      </div>
    );
  }

  if (showCombatSystem && selectedCharacter) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button 
              onClick={() => setShowCombatSystem(false)}
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Combat</span>
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Combat Simulator</h1>
            <p className="text-blue-200">Fighting as {selectedCharacter.name}</p>
          </div>
          {combatLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-200">Initializing combat...</p>
            </div>
          ) : combatState ? (
            <CombatSystem 
              combatants={combatState.participants}
              battleMap={combatState.battleMap || {
                width: 12,
                height: 8,
                tiles: Array(8).fill(null).map(() => Array(12).fill(null).map(() => ({
                  type: 'floor' as const,
                  elevation: 0,
                  cover: 0,
                  occupied: false
                })))
              }}
              currentTurn={combatState.round}
              activeCombatantId={combatState.turnOrder[combatState.currentTurn]}
              onAction={handleCombatAction}
              onEndCombat={handleEndCombat}
              isPlayerTurn={combatState.participants.find((p: any) => p.id === combatState.turnOrder[combatState.currentTurn])?.type === 'player'}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-red-400">Failed to load combat state</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Combat</h1>
          <p className="text-blue-200">Battle system & tactical combat tools</p>
        </div>
        
        {/* Combat Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'simulator', label: 'Combat Simulator', icon: Swords },
                { id: 'training', label: 'Training', icon: Target },
                { id: 'history', label: 'Battle History', icon: Clock },
                { id: 'tactics', label: 'Tactics Guide', icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'simulator' && renderCombatSimulator()}
        {activeTab === 'training' && renderTraining()}
        {activeTab === 'history' && renderCombatHistory()}
        {activeTab === 'tactics' && renderTactics()}
      </div>
    </div>
  );
};

export default CombatPage; 