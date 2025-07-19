import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Trophy, ArrowLeft } from 'lucide-react';
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

  // Combat state management
  const [combatState, setCombatState] = useState<any>(null);
  const [combatLoading, setCombatLoading] = useState(false);

  const handleStartCombat = async (character: any) => {
    setSelectedCharacter(character);
    setCombatLoading(true);
    
    try {
      // Start combat with backend
      const result = await firebaseService.startCombat({
        gameId: 'test-combat',
        enemies: [
          { name: 'Goblin', health: 10, armorClass: 12, initiative: 10 }
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
            enemies: result.combatState.participants.filter((p: any) => p.type === 'enemy')
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
        timestamp: new Date().toISOString()
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Combat Simulator */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Combat Simulator</h3>
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
              <div className="space-y-4">
                <p className="text-blue-200 mb-4">Choose a character to start combat:</p>
                {characters.map((character) => (
                  <div key={character.id} className="flex justify-between items-center p-3 bg-slate-700/30 rounded">
                    <div>
                      <p className="text-white font-medium">{character.name}</p>
                      <p className="text-blue-200 text-sm">Level {character.level || 1} {character.class}</p>
                    </div>
                    <button 
                      onClick={() => handleStartCombat(character)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      Fight
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Combat History */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Combat History</h3>
            {combatHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-blue-200">No combat history</p>
                <p className="text-slate-400 text-sm">Start a combat to see your results here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {combatHistory.map((combat) => (
                  <div key={combat.id} className="p-3 bg-slate-700/30 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{combat.character}</p>
                        <p className="text-blue-200 text-sm">
                          {combat.result.victory ? 'Victory' : 'Defeat'} - {combat.result.enemies?.length || 0} enemies
                        </p>
                      </div>
                      <span className="text-slate-400 text-xs">
                        {new Date(combat.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombatPage; 