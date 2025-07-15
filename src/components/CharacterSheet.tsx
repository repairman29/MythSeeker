import React from 'react';
import { Heart, Zap, Shield, Sword, Star, TrendingUp, Award, Package } from 'lucide-react';

interface CharacterSheetProps {
  character: any;
  calculateStats?: (character: any) => any;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, calculateStats }) => {
  if (!character) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-bold mb-2">No Character Selected</h2>
          <p className="text-blue-200">Create a character to view their sheet</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats ? calculateStats(character) : character.baseStats;

  return (
    <div className="h-full overflow-auto p-6 text-white">
      {/* Header */}
      <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{character.name}</h1>
            <p className="text-blue-200 text-lg">Level {character.level} {character.class}</p>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 text-sm">Experience</div>
            <div className="text-2xl font-bold">{character.experience} XP</div>
            <div className="text-green-400 text-sm">{character.gold || 0} Gold</div>
          </div>
        </div>
        
        {/* Health and Mana Bars */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Heart size={16} className="text-red-400" />
              <span className="text-sm">Health</span>
              <span className="text-sm text-red-400">{character.health}/{character.maxHealth + (stats?.health || 0)}</span>
            </div>
            <div className="w-full bg-red-900 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(character.health / (character.maxHealth + (stats?.health || 0))) * 100}%` }}
              />
            </div>
          </div>
          
          {character.mana !== undefined && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Zap size={16} className="text-blue-400" />
                <span className="text-sm">Mana</span>
                <span className="text-sm text-blue-400">{character.mana}/{character.maxMana + (stats?.mana || 0)}</span>
              </div>
              <div className="w-full bg-blue-900 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(character.mana / (character.maxMana + (stats?.mana || 0))) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Core Stats */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <TrendingUp size={20} className="text-green-400" />
            <span>Core Stats</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-sm text-blue-200">Strength</div>
              <div className="text-2xl font-bold">{stats?.strength || 0}</div>
              <div className="text-xs text-green-400">+{Math.floor(((stats?.strength || 0) - 10) / 2)}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-sm text-blue-200">Dexterity</div>
              <div className="text-2xl font-bold">{stats?.dexterity || 0}</div>
              <div className="text-xs text-green-400">+{Math.floor(((stats?.dexterity || 0) - 10) / 2)}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-sm text-blue-200">Intelligence</div>
              <div className="text-2xl font-bold">{stats?.intelligence || 0}</div>
              <div className="text-xs text-green-400">+{Math.floor(((stats?.intelligence || 0) - 10) / 2)}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-sm text-blue-200">Charisma</div>
              <div className="text-2xl font-bold">{stats?.charisma || 0}</div>
              <div className="text-xs text-green-400">+{Math.floor(((stats?.charisma || 0) - 10) / 2)}</div>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <Sword size={20} className="text-red-400" />
            <span>Combat Stats</span>
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Attack Bonus</span>
              <span className="text-white font-semibold">+{stats?.attack || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Defense</span>
              <span className="text-white font-semibold">{stats?.defense || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Magic Power</span>
              <span className="text-white font-semibold">+{stats?.magic || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Critical Chance</span>
              <span className="text-white font-semibold">{stats?.crit || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <Shield size={20} className="text-yellow-400" />
          <span>Equipment</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {character.equipment?.weapon && (
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-blue-200 mb-1">Weapon</div>
              <div className="text-lg font-semibold">{character.equipment.weapon.name}</div>
            </div>
          )}
          {character.equipment?.armor && (
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-blue-200 mb-1">Armor</div>
              <div className="text-lg font-semibold">{character.equipment.armor.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      {character.unlockedSkills && character.unlockedSkills.length > 0 && (
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <Star size={20} className="text-purple-400" />
            <span>Unlocked Skills</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {character.unlockedSkills.map((skillLevel: number) => (
              <div key={skillLevel} className="bg-black/20 rounded-lg p-4">
                <div className="text-sm text-purple-400 mb-1">Level {skillLevel} Skill</div>
                <div className="text-lg font-semibold">Skill Name</div>
                <div className="text-sm text-blue-200">Skill description would go here</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSheet; 