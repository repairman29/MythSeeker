import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, User } from 'lucide-react';
import WorldMap from './WorldMap';
import { firebaseService } from '../firebaseService';

interface WorldPageProps {
  user: any;
}

const WorldPage: React.FC<WorldPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [worldState, setWorldState] = useState<any>({
    currentLocation: 'Starting Village',
    discoveredAreas: ['Starting Village', 'Forest Path'],
    weather: 'Clear',
    timeOfDay: 'Day',
    npcs: [
      { id: '1', name: 'Village Elder', location: 'Starting Village', status: 'friendly' },
      { id: '2', name: 'Mysterious Traveler', location: 'Forest Path', status: 'neutral' }
    ]
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user's characters
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters || []);
        
        // Load world state from localStorage
        const savedWorldState = JSON.parse(localStorage.getItem('mythseeker_world_state') || '{}');
        if (Object.keys(savedWorldState).length > 0) {
          setWorldState(savedWorldState);
        }
      } catch (error) {
        console.error('Error loading world data:', error);
      }
    };
    loadData();
  }, [user.uid]);

  const handleExploreWorld = (character: any) => {
    setSelectedCharacter(character);
    setShowWorldMap(true);
  };

  const handleWorldUpdate = (updates: any) => {
    const newWorldState = { ...worldState, ...updates };
    setWorldState(newWorldState);
    localStorage.setItem('mythseeker_world_state', JSON.stringify(newWorldState));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">World</h1>
          <p className="text-blue-200">Explore the realm and discover its secrets</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* World Map */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">World Map</h3>
            {characters.length === 0 ? (
              <div className="aspect-video bg-slate-700/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-blue-200 mb-4">No characters available</p>
                  <button 
                    onClick={() => navigate('/characters')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Create Character
                  </button>
                </div>
              </div>
            ) : showWorldMap && selectedCharacter ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-blue-200">Exploring as {selectedCharacter.name}</p>
                  <button 
                    onClick={() => setShowWorldMap(false)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Close Map
                  </button>
                </div>
                <WorldMap 
                  character={selectedCharacter}
                  worldState={worldState}
                  onWorldUpdate={handleWorldUpdate}
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-700/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-blue-200 mb-4">Choose a character to explore</p>
                  <div className="space-y-2">
                    {characters.map((character) => (
                      <button 
                        key={character.id}
                        onClick={() => handleExploreWorld(character)}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        Explore as {character.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* World Info */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Current Location</h3>
              <p className="text-blue-200">{worldState.currentLocation}</p>
              <p className="text-slate-400 text-sm mt-2">Weather: {worldState.weather}</p>
              <p className="text-slate-400 text-sm">Time: {worldState.timeOfDay}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Discovered Areas</h3>
              {worldState.discoveredAreas?.length > 0 ? (
                <div className="space-y-2">
                  {worldState.discoveredAreas.map((area: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-blue-200 text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No areas discovered yet</p>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Known NPCs</h3>
              {worldState.npcs?.length > 0 ? (
                <div className="space-y-2">
                  {worldState.npcs.map((npc: any) => (
                    <div key={npc.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-blue-200 text-sm font-medium">{npc.name}</p>
                        <p className="text-slate-400 text-xs">{npc.location}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        npc.status === 'friendly' ? 'bg-green-600/20 text-green-400' :
                        npc.status === 'neutral' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>
                        {npc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No NPCs encountered yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldPage; 