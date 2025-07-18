/**
 * Characters Page Component
 * 
 * Character management interface extracted from the original monolithic App.tsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService, Character } from '../firebaseService';
import { Plus, Edit, Trash2, User, Sword, Shield, Heart } from 'lucide-react';

interface CharactersPageProps {
  user: any;
}

const CharactersPage: React.FC<CharactersPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters || []);
      } catch (error) {
        console.error('Error loading characters:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCharacters();
  }, [user.uid]);

  const handleCreateCharacter = () => {
    navigate('/characters/create');
  };

  const handleEditCharacter = (character: Character) => {
    navigate(`/characters/create?edit=${character.id}`);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      await firebaseService.deleteCharacter(user.uid, characterId);
      setCharacters(prev => prev.filter(char => char.id !== characterId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    // You can implement character selection logic here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg">Loading your characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Your Characters</h1>
            <p className="text-blue-200">
              Manage your characters and their progression
            </p>
          </div>
          <button
            onClick={handleCreateCharacter}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Create Character</span>
          </button>
        </div>

        {/* Characters Grid */}
        {characters.length === 0 ? (
          <div className="text-center py-16">
            <User size={64} className="mx-auto text-blue-300/50 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Characters Yet</h3>
            <p className="text-blue-200 mb-6">
              Create your first character to begin your adventure
            </p>
            <button
              onClick={handleCreateCharacter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors"
            >
              Create Your First Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map((character) => (
              <div
                key={character.id}
                className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 cursor-pointer ${
                  selectedCharacter?.id === character.id
                    ? 'border-blue-400 ring-2 ring-blue-400/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => handleSelectCharacter(character)}
              >
                {/* Character Portrait */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <User size={24} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                </div>

                {/* Character Info */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {character.name}
                  </h3>
                  <p className="text-blue-200 text-sm">
                    Level {character.level || 1} {character.race} {character.class}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div className="text-center p-2 bg-slate-700/50 rounded">
                    <div className="flex items-center justify-center mb-1">
                      <Heart size={14} className="text-red-400" />
                    </div>
                    <div className="text-white font-medium">
                      {character.hitPoints || character.maxHitPoints || 20}
                    </div>
                    <div className="text-slate-400 text-xs">HP</div>
                  </div>
                  <div className="text-center p-2 bg-slate-700/50 rounded">
                    <div className="flex items-center justify-center mb-1">
                      <Shield size={14} className="text-blue-400" />
                    </div>
                    <div className="text-white font-medium">
                      {character.armorClass || 10}
                    </div>
                    <div className="text-slate-400 text-xs">AC</div>
                  </div>
                  <div className="text-center p-2 bg-slate-700/50 rounded">
                    <div className="flex items-center justify-center mb-1">
                      <Sword size={14} className="text-yellow-400" />
                    </div>
                    <div className="text-white font-medium">
                      {character.proficiencyBonus || 2}
                    </div>
                    <div className="text-slate-400 text-xs">Prof</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCharacter(character);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(character.id);
                    }}
                    className="flex items-center justify-center bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Experience Bar */}
                {character.experience !== undefined && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Experience</span>
                      <span>{character.experience} XP</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            ((character.experience || 0) % 1000) / 10,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete Character
            </h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this character? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCharacter(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharactersPage; 