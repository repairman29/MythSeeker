import React, { useState, useRef } from 'react';
import { Heart, Zap, Shield, Sword, Star, TrendingUp, Award, Package, Camera, Upload, Edit3, Save, X, Palette, Users, MapPin, Clock } from 'lucide-react';

interface CharacterSheetProps {
  character: any;
  calculateStats?: (character: any) => any;
  onUpdateCharacter?: (updates: any) => void;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, calculateStats, onUpdateCharacter }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showPortraitUpload, setShowPortraitUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Character portrait and visual representation
  const getCharacterPortrait = () => {
    if (character.portrait) {
      return character.portrait;
    }
    
    // Default portraits based on class
    const defaultPortraits: Record<string, string> = {
      'Warrior': '⚔️',
      'Rogue': '🗡️',
      'Mage': '🔮',
      'Cleric': '⚡',
      'Ranger': '🏹',
      'Bard': '🎵'
    };
    
    return defaultPortraits[character.class] || '👤';
  };

  const getEquipmentVisual = (equipmentType: string) => {
    const equipment = character.equipment?.[equipmentType];
    if (!equipment) return null;

    const equipmentIcons: Record<string, Record<string, string>> = {
      weapon: {
        'Iron Sword': '⚔️',
        'Steel Blade': '🗡️',
        'Enchanted Sword': '✨⚔️',
        'Dragon Slayer': '🔥⚔️',
        'Basic Staff': '🔮',
        'Crystal Staff': '💎🔮',
        'War Bow': '🏹',
        'Elven Bow': '🌿🏹'
      },
      armor: {
        'Leather Armor': '🛡️',
        'Chain Mail': '⛓️🛡️',
        'Plate Armor': '⚔️🛡️',
        'Dragon Scale': '🐉🛡️',
        'Mage Robes': '🔮👘',
        'Archmage Robes': '✨🔮👘'
      }
    };

    return equipmentIcons[equipmentType]?.[equipment.name] || '📦';
  };

  const handlePortraitUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpdateCharacter) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onUpdateCharacter({ portrait: e.target?.result });
      };
      reader.readAsDataURL(file);
      setShowPortraitUpload(false);
    }
  };

  const handleEditField = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveEdit = () => {
    if (editingField && onUpdateCharacter) {
      onUpdateCharacter({ [editingField]: editValue });
      setEditingField(null);
      setEditValue('');
    }
  };

  const getRarityColor = (itemName: string) => {
    if (itemName.toLowerCase().includes('legendary')) return 'text-yellow-400';
    if (itemName.toLowerCase().includes('rare')) return 'text-purple-400';
    if (itemName.toLowerCase().includes('uncommon')) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="h-full overflow-auto p-6 text-white">
      {/* Header with Portrait */}
      <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Character Portrait */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-3xl border-4 border-white/20">
                {typeof getCharacterPortrait() === 'string' && getCharacterPortrait().startsWith('data:') ? (
                  <img 
                    src={getCharacterPortrait()} 
                    alt="Character Portrait" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{getCharacterPortrait()}</span>
                )}
              </div>
              <button
                onClick={() => setShowPortraitUpload(true)}
                className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 rounded-full p-1 transition-colors"
                title="Change portrait"
              >
                <Camera size={12} />
              </button>
            </div>

            {/* Character Info */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                {isEditing && editingField === 'name' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-black/30 text-white px-2 py-1 rounded text-2xl font-bold"
                      autoFocus
                    />
                    <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300">
                      <Save size={16} />
                    </button>
                    <button onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold flex items-center space-x-2">
                    <span>{character.name}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleEditField('name', character.name)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                  </h1>
                )}
              </div>
              <p className="text-blue-200 text-lg">Level {character.level} {character.class}</p>
              
              {/* Character Tags */}
              <div className="flex items-center space-x-4 mt-2 text-sm text-blue-200">
                <div className="flex items-center space-x-1">
                  <MapPin size={12} />
                  <span>{character.location || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{Math.floor(character.totalPlayTime / 60000)}m played</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={12} />
                  <span>{character.campaignsJoined || 0} campaigns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Experience and Gold */}
          <div className="text-right">
            <div className="text-yellow-400 text-sm">Experience</div>
            <div className="text-2xl font-bold">{character.experience} XP</div>
            <div className="text-green-400 text-sm">{character.gold || 0} Gold</div>
            
            {/* Edit Mode Toggle */}
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
              <button
                onClick={() => window.location.href = '/progression'}
                className="px-3 py-1 rounded text-sm bg-purple-600 hover:bg-purple-700 transition-colors flex items-center space-x-1"
                title="View character progression and advancement"
              >
                <TrendingUp size={12} />
                <span>Progress</span>
              </button>
            </div>
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

      {/* 2D Character Model */}
      <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <Palette size={20} className="text-purple-400" />
          <span>Character Model</span>
        </h2>
        
        <div className="flex justify-center">
          <div className="relative w-32 h-48 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-white/20 flex flex-col items-center justify-center">
            {/* Character Body */}
            <div className="text-4xl mb-2">{getCharacterPortrait()}</div>
            
            {/* Equipment Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {character.equipment?.weapon && (
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-2xl">
                  {getEquipmentVisual('weapon')}
                </div>
              )}
              {character.equipment?.armor && (
                <div className="absolute top-2 text-xl">
                  {getEquipmentVisual('armor')}
                </div>
              )}
            </div>
            
            {/* Character Name */}
            <div className="absolute bottom-2 text-xs text-center text-white bg-black/50 px-2 py-1 rounded">
              {character.name}
            </div>
          </div>
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

      {/* Enhanced Equipment Display */}
      <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <Shield size={20} className="text-yellow-400" />
          <span>Equipment</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {character.equipment?.weapon && (
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getEquipmentVisual('weapon')}</div>
                <div className="flex-1">
                  <div className={`font-semibold ${getRarityColor(character.equipment.weapon.name)}`}>
                    {character.equipment.weapon.name}
                  </div>
                  <div className="text-sm text-blue-200">Weapon</div>
                  {character.equipment.weapon.stats && (
                    <div className="text-xs text-green-400 mt-1">
                      +{character.equipment.weapon.stats.attack || 0} Attack
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {character.equipment?.armor && (
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getEquipmentVisual('armor')}</div>
                <div className="flex-1">
                  <div className={`font-semibold ${getRarityColor(character.equipment.armor.name)}`}>
                    {character.equipment.armor.name}
                  </div>
                  <div className="text-sm text-blue-200">Armor</div>
                  {character.equipment.armor.stats && (
                    <div className="text-xs text-green-400 mt-1">
                      +{character.equipment.armor.stats.defense || 0} Defense
                    </div>
                  )}
                </div>
              </div>
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
              <div key={skillLevel} className="bg-black/20 rounded-lg p-4 border border-white/10">
                <div className="text-sm text-purple-400 mb-1">Level {skillLevel} Skill</div>
                <div className="text-lg font-semibold">Skill Name</div>
                <div className="text-sm text-blue-200">Skill description would go here</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portrait Upload Modal */}
      {showPortraitUpload && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Upload Character Portrait</h3>
            <p className="text-blue-200 mb-4">Choose an image to represent your character</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePortraitUpload}
              className="hidden"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Upload size={16} />
                <span>Choose File</span>
              </button>
              <button
                onClick={() => setShowPortraitUpload(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSheet; 