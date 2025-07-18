import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Zap, Flame, Snowflake, Shield, 
  Heart, Eye, Wind, Mountain, Droplets, Sun, Moon, Star,
  Search, Filter, Plus, Minus, RotateCcw, Target, Clock
} from 'lucide-react';

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  components: string[];
  description: string;
  damage?: string;
  saveType?: string;
  prepared: boolean;
  known: boolean;
  canCast: boolean;
  manaCost: number;
  cooldown?: number;
  remainingCooldown?: number;
}

interface MagicSystemProps {
  character?: any;
  worldState?: any;
  onCastSpell?: (spell: Spell, target?: any) => void;
  onPrepareSpell?: (spellId: string) => void;
  onUnprepareSpell?: (spellId: string) => void;
}

const MagicSystem: React.FC<MagicSystemProps> = ({ 
  character, 
  worldState, 
  onCastSpell, 
  onPrepareSpell, 
  onUnprepareSpell 
}) => {
  const [activeTab, setActiveTab] = useState<'spellbook' | 'prepared' | 'research' | 'components'>('spellbook');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  // Sample spells data (would normally come from character/database)
  const [spells, setSpells] = useState<Spell[]>([
    {
      id: 'magic-missile',
      name: 'Magic Missile',
      level: 1,
      school: 'Evocation',
      castingTime: '1 action',
      range: '120 feet',
      duration: 'Instantaneous',
      components: ['V', 'S'],
      description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range.',
      damage: '1d4+1 force',
      prepared: true,
      known: true,
      canCast: true,
      manaCost: 15
    },
    {
      id: 'fireball',
      name: 'Fireball',
      level: 3,
      school: 'Evocation',
      castingTime: '1 action',
      range: '150 feet',
      duration: 'Instantaneous',
      components: ['V', 'S', 'M'],
      description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame.',
      damage: '8d6 fire',
      saveType: 'Dexterity',
      prepared: true,
      known: true,
      canCast: true,
      manaCost: 45
    },
    {
      id: 'shield',
      name: 'Shield',
      level: 1,
      school: 'Abjuration',
      castingTime: '1 reaction',
      range: 'Self',
      duration: '1 round',
      components: ['V', 'S'],
      description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC.',
      prepared: true,
      known: true,
      canCast: true,
      manaCost: 20
    },
    {
      id: 'healing-word',
      name: 'Healing Word',
      level: 1,
      school: 'Evocation',
      castingTime: '1 bonus action',
      range: '60 feet',
      duration: 'Instantaneous',
      components: ['V'],
      description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier.',
      damage: '1d4+3 healing',
      prepared: false,
      known: true,
      canCast: false,
      manaCost: 18
    },
    {
      id: 'mage-armor',
      name: 'Mage Armor',
      level: 1,
      school: 'Abjuration',
      castingTime: '1 action',
      range: 'Touch',
      duration: '8 hours',
      components: ['V', 'S', 'M'],
      description: 'You touch a willing creature who isn\'t wearing armor, and a protective magical force surrounds it until the spell ends.',
      prepared: true,
      known: true,
      canCast: true,
      manaCost: 25
    },
    {
      id: 'detect-magic',
      name: 'Detect Magic',
      level: 1,
      school: 'Divination',
      castingTime: '1 action',
      range: 'Self',
      duration: '10 minutes',
      components: ['V', 'S'],
      description: 'For the duration, you sense the presence of magic within 30 feet of you.',
      prepared: false,
      known: true,
      canCast: false,
      manaCost: 15
    }
  ]);

  const [spellComponents, setSpellComponents] = useState([
    { name: 'Bat Guano', quantity: 3, required: ['Fireball'], rarity: 'common' },
    { name: 'Sulfur', quantity: 5, required: ['Fireball'], rarity: 'common' },
    { name: 'Diamond Dust', quantity: 1, required: ['Stoneskin'], rarity: 'rare' },
    { name: 'Ruby Dust', quantity: 2, required: ['Continual Flame'], rarity: 'uncommon' },
    { name: 'Pearl', quantity: 4, required: ['Identify'], rarity: 'uncommon' },
    { name: 'Silver Wire', quantity: 10, required: ['Message'], rarity: 'common' }
  ]);

  const schools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
  
  const getSchoolIcon = (school: string) => {
    switch (school) {
      case 'Abjuration': return <Shield className="text-blue-400" size={16} />;
      case 'Conjuration': return <Plus className="text-purple-400" size={16} />;
      case 'Divination': return <Eye className="text-yellow-400" size={16} />;
      case 'Enchantment': return <Heart className="text-pink-400" size={16} />;
      case 'Evocation': return <Zap className="text-orange-400" size={16} />;
      case 'Illusion': return <Moon className="text-indigo-400" size={16} />;
      case 'Necromancy': return <Minus className="text-red-400" size={16} />;
      case 'Transmutation': return <RotateCcw className="text-green-400" size={16} />;
      default: return <Sparkles className="text-gray-400" size={16} />;
    }
  };

  const getSchoolColor = (school: string) => {
    switch (school) {
      case 'Abjuration': return 'from-blue-500 to-blue-600';
      case 'Conjuration': return 'from-purple-500 to-purple-600';
      case 'Divination': return 'from-yellow-500 to-yellow-600';
      case 'Enchantment': return 'from-pink-500 to-pink-600';
      case 'Evocation': return 'from-orange-500 to-orange-600';
      case 'Illusion': return 'from-indigo-500 to-indigo-600';
      case 'Necromancy': return 'from-red-500 to-red-600';
      case 'Transmutation': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'very-rare': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const filteredSpells = spells.filter(spell => {
    const matchesSearch = spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spell.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = schoolFilter === 'all' || spell.school === schoolFilter;
    const matchesLevel = levelFilter === 'all' || spell.level.toString() === levelFilter;
    
    return matchesSearch && matchesSchool && matchesLevel;
  });

  const preparedSpells = spells.filter(spell => spell.prepared);
  const maxPreparedSpells = character ? Math.max(1, (character.level || 1) + Math.floor((character.intelligence || 10) - 10) / 2) : 8;

  const currentMana = character?.mana || 100;
  const maxMana = character?.maxMana || 100;

  const canPrepareMoreSpells = preparedSpells.length < maxPreparedSpells;

  const handlePrepareSpell = (spell: Spell) => {
    if (canPrepareMoreSpells && !spell.prepared) {
      setSpells(prev => prev.map(s => 
        s.id === spell.id ? { ...s, prepared: true, canCast: true } : s
      ));
      onPrepareSpell?.(spell.id);
    }
  };

  const handleUnprepareSpell = (spell: Spell) => {
    setSpells(prev => prev.map(s => 
      s.id === spell.id ? { ...s, prepared: false, canCast: false } : s
    ));
    onUnprepareSpell?.(spell.id);
  };

  const handleCastSpell = (spell: Spell) => {
    if (spell.canCast && currentMana >= spell.manaCost) {
      onCastSpell?.(spell);
      // Could update mana, add cooldowns, etc.
    }
  };

  const renderSpellbook = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search spells..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="all">All Schools</option>
            {schools.map(school => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="all">All Levels</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
              <option key={level} value={level.toString()}>
                {level === 0 ? 'Cantrips' : `Level ${level}`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-blue-200">
          Showing {filteredSpells.length} of {spells.length} spells
        </div>
      </div>

      {/* Spells Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpells.map(spell => (
          <div
            key={spell.id}
            className={`bg-white/10 rounded-lg p-4 border border-white/20 cursor-pointer transition-all duration-300 hover:border-blue-400/50 ${
              selectedSpell?.id === spell.id ? 'ring-2 ring-blue-400' : ''
            } ${!spell.known ? 'opacity-50' : ''}`}
            onClick={() => setSelectedSpell(spell)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getSchoolIcon(spell.school)}
                <h3 className={`font-semibold ${spell.known ? 'text-white' : 'text-gray-400'}`}>
                  {spell.name}
                </h3>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-300">
                  {spell.level === 0 ? 'Cantrip' : `L${spell.level}`}
                </span>
                {spell.prepared && (
                  <span className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-300">
                    Prepared
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-blue-200 mb-3 line-clamp-2">{spell.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{spell.castingTime}</span>
                <span>•</span>
                <span>{spell.range}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <Zap size={12} className="text-blue-400" />
                <span className="text-blue-300">{spell.manaCost}</span>
              </div>
            </div>
            
            {spell.known && (
              <div className="mt-3 flex space-x-2">
                {!spell.prepared && canPrepareMoreSpells && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrepareSpell(spell); }}
                    className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition-colors"
                  >
                    Prepare
                  </button>
                )}
                {spell.prepared && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnprepareSpell(spell); }}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-xs transition-colors"
                    >
                      Unprepare
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCastSpell(spell); }}
                      disabled={currentMana < spell.manaCost}
                      className="flex-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-xs transition-colors"
                    >
                      Cast
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreparedSpells = () => (
    <div className="space-y-4">
      {/* Mana Bar */}
      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Zap className="text-blue-400" size={20} />
            <span className="font-semibold text-white">Mana</span>
          </div>
          <span className="text-blue-300">{currentMana}/{maxMana}</span>
        </div>
        <div className="w-full bg-blue-900 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(currentMana / maxMana) * 100}%` }}
          />
        </div>
      </div>

      {/* Spell Slots */}
      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
        <h3 className="font-semibold text-white mb-3">Prepared Spells ({preparedSpells.length}/{maxPreparedSpells})</h3>
        {preparedSpells.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {preparedSpells.map(spell => (
              <div
                key={spell.id}
                className="bg-black/20 rounded-lg p-3 border border-white/10 hover:border-blue-400/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getSchoolIcon(spell.school)}
                    <span className="font-medium text-white">{spell.name}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-300">
                    L{spell.level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{spell.castingTime}</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-blue-300 flex items-center space-x-1">
                      <Zap size={10} />
                      <span>{spell.manaCost}</span>
                    </span>
                    <button
                      onClick={() => handleCastSpell(spell)}
                      disabled={currentMana < spell.manaCost}
                      className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-xs transition-colors"
                    >
                      Cast
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-blue-200">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No Spells Prepared</p>
            <p className="text-sm">Visit your spellbook to prepare spells for use</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSpellComponents = () => (
    <div className="space-y-4">
      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Material Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spellComponents.map((component, index) => (
            <div key={index} className="bg-black/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${getRarityColor(component.rarity)}`}>
                  {component.name}
                </span>
                <span className="text-white bg-blue-600/20 px-2 py-1 rounded text-sm">
                  {component.quantity}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Rarity: <span className={getRarityColor(component.rarity)}>{component.rarity}</span>
              </div>
              {component.required.length > 0 && (
                <div className="text-xs text-blue-200">
                  Required for: {component.required.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMagicalResearch = () => (
    <div className="space-y-4">
      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Magical Research</h3>
        <div className="space-y-4">
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <h4 className="font-medium text-purple-300 mb-2">New Spell Research</h4>
            <p className="text-sm text-blue-200 mb-3">
              You're currently researching a new 2nd level spell from the Evocation school.
            </p>
            <div className="w-full bg-purple-900 rounded-full h-2 mb-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress: 65%</span>
              <span>Est. 3 days remaining</span>
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <h4 className="font-medium text-yellow-300 mb-2">Spell Modification</h4>
            <p className="text-sm text-blue-200 mb-3">
              Experimenting with extending the duration of Mage Armor spell.
            </p>
            <div className="w-full bg-yellow-900 rounded-full h-2 mb-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress: 30%</span>
              <span>Est. 7 days remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-purple-400" />
          <h2 className="text-xl font-bold mb-2">Magic Awaits</h2>
          <p className="text-blue-200">Create a character to access the magical arts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-purple-900/20 to-indigo-900/20">
      {/* Header */}
      <div className="bg-black/30 border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-purple-400" size={24} />
            <div>
              <h1 className="text-xl font-bold text-white">Magic System</h1>
              <p className="text-blue-200 text-sm">
                {character?.name || 'Mage'} - Level {character?.level || 1} {character?.class || 'Wizard'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <BookOpen className="text-blue-400" size={16} />
              <span className="text-blue-200">Known: {spells.filter(s => s.known).length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-400" size={16} />
              <span className="text-blue-200">Prepared: {preparedSpells.length}/{maxPreparedSpells}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/20 border-b border-white/20 p-4">
        <div className="flex space-x-1">
          {[
            { key: 'spellbook', label: 'Spellbook', icon: <BookOpen size={18} /> },
            { key: 'prepared', label: 'Prepared Spells', icon: <Star size={18} /> },
            { key: 'components', label: 'Components', icon: <Flame size={18} /> },
            { key: 'research', label: 'Research', icon: <Search size={18} /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'spellbook' && renderSpellbook()}
        {activeTab === 'prepared' && renderPreparedSpells()}
        {activeTab === 'components' && renderSpellComponents()}
        {activeTab === 'research' && renderMagicalResearch()}
      </div>

      {/* Spell Detail Modal */}
      {selectedSpell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSchoolIcon(selectedSpell.school)}
                  <h3 className="text-lg font-bold text-white">{selectedSpell.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedSpell(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="flex space-x-2 mt-2">
                <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-300">
                  {selectedSpell.level === 0 ? 'Cantrip' : `Level ${selectedSpell.level}`}
                </span>
                <span className={`text-xs px-2 py-1 rounded bg-gradient-to-r ${getSchoolColor(selectedSpell.school)} text-white`}>
                  {selectedSpell.school}
                </span>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-blue-200">{selectedSpell.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Casting Time:</span>
                  <div className="text-white">{selectedSpell.castingTime}</div>
                </div>
                <div>
                  <span className="text-gray-400">Range:</span>
                  <div className="text-white">{selectedSpell.range}</div>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <div className="text-white">{selectedSpell.duration}</div>
                </div>
                <div>
                  <span className="text-gray-400">Components:</span>
                  <div className="text-white">{selectedSpell.components.join(', ')}</div>
                </div>
                {selectedSpell.damage && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Damage/Healing:</span>
                    <div className="text-white">{selectedSpell.damage}</div>
                  </div>
                )}
                {selectedSpell.saveType && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Saving Throw:</span>
                    <div className="text-white">{selectedSpell.saveType}</div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 pt-4 border-t border-white/20">
                {selectedSpell.known && !selectedSpell.prepared && canPrepareMoreSpells && (
                  <button
                    onClick={() => { handlePrepareSpell(selectedSpell); setSelectedSpell(null); }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                  >
                    Prepare Spell
                  </button>
                )}
                {selectedSpell.prepared && (
                  <button
                    onClick={() => { handleCastSpell(selectedSpell); setSelectedSpell(null); }}
                    disabled={currentMana < selectedSpell.manaCost}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors"
                  >
                    Cast Spell ({selectedSpell.manaCost} mana)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagicSystem; 