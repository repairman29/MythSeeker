import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Search, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Eye, 
  Globe, 
  Shield, 
  RefreshCw, 
  Heart, 
  Skull, 
  Swords 
} from 'lucide-react';
import { firebaseService } from '../firebaseService';

interface MagicPageProps {
  user: any;
}

const MagicPage: React.FC<MagicPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [spells, setSpells] = useState<any[]>([]);
  const [knownSpells, setKnownSpells] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterView, setFilterView] = useState<'all' | 'eligible' | 'known'>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadMagicData = async () => {
      try {
        // Load user's characters
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters || []);
        
        // Auto-select the first character if available
        if (userCharacters && userCharacters.length > 0 && !selectedCharacter) {
          setSelectedCharacter(userCharacters[0]);
        }
        
        // Load comprehensive spells from data
        const spellsData = JSON.parse(localStorage.getItem('mythseeker_spells') || '[]');
        if (spellsData.length === 0) {
          // Initialize with comprehensive spell list
          const defaultSpells = [
            // Cantrips (Level 0)
            { id: '1', name: 'Fire Bolt', level: 0, school: 'Evocation', description: 'You hurl a mote of fire at a creature or object within range.', damage: '1d10 fire', castingTime: '1 action', range: '120 feet' },
            { id: '2', name: 'Light', level: 0, school: 'Evocation', description: 'Makes an object glow like a torch.', damage: null, castingTime: '1 action', range: 'Touch' },
            { id: '3', name: 'Mage Hand', level: 0, school: 'Conjuration', description: 'Creates a spectral hand that manipulates objects.', damage: null, castingTime: '1 action', range: '30 feet' },
            { id: '4', name: 'Prestidigitation', level: 0, school: 'Transmutation', description: 'Minor magical trick that novice spellcasters use for practice.', damage: null, castingTime: '1 action', range: '10 feet' },
            
            // Level 1 Spells
            { id: '5', name: 'Magic Missile', level: 1, school: 'Evocation', description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range.', damage: '1d4+1 force', castingTime: '1 action', range: '120 feet' },
            { id: '6', name: 'Cure Wounds', level: 1, school: 'Evocation', description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.', damage: '1d8+mod healing', castingTime: '1 action', range: 'Touch' },
            { id: '7', name: 'Shield', level: 1, school: 'Abjuration', description: 'An invisible barrier of magical force appears and protects you.', damage: null, castingTime: '1 reaction', range: 'Self' },
            { id: '8', name: 'Sleep', level: 1, school: 'Enchantment', description: 'This spell sends creatures into a magical slumber.', damage: null, castingTime: '1 action', range: '90 feet' },
            { id: '9', name: 'Detect Magic', level: 1, school: 'Divination', description: 'For the duration, you sense the presence of magic within 30 feet of you.', damage: null, castingTime: '1 action', range: 'Self' },
            { id: '10', name: 'Charm Person', level: 1, school: 'Enchantment', description: 'You attempt to charm a humanoid you can see within range.', damage: null, castingTime: '1 action', range: '30 feet' },
            
            // Level 2 Spells
            { id: '11', name: 'Invisibility', level: 2, school: 'Illusion', description: 'A creature you touch and everything it is wearing and carrying becomes invisible until the spell ends.', damage: null, castingTime: '1 action', range: 'Touch' },
            { id: '12', name: 'Mirror Image', level: 2, school: 'Illusion', description: 'Three illusory duplicates of yourself appear in your space.', damage: null, castingTime: '1 action', range: 'Self' },
            { id: '13', name: 'Scorching Ray', level: 2, school: 'Evocation', description: 'You make three ranged spell attacks, each with its own ray of fire.', damage: '2d6 fire per ray', castingTime: '1 action', range: '120 feet' },
            { id: '14', name: 'Hold Person', level: 2, school: 'Enchantment', description: 'Choose a humanoid that you can see within range.', damage: null, castingTime: '1 action', range: '60 feet' },
            { id: '15', name: 'Spider Climb', level: 2, school: 'Transmutation', description: 'Until the spell ends, one willing creature you touch gains the ability to move up, down, and across vertical surfaces.', damage: null, castingTime: '1 action', range: 'Touch' },
            
            // Level 3 Spells
            { id: '16', name: 'Fireball', level: 3, school: 'Evocation', description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame.', damage: '8d6 fire', castingTime: '1 action', range: '150 feet' },
            { id: '17', name: 'Lightning Bolt', level: 3, school: 'Evocation', description: 'A stroke of lightning forming a line of 100 feet long and 5 feet wide blasts out from you in a direction you choose.', damage: '8d6 lightning', castingTime: '1 action', range: 'Self (100-foot line)' },
            { id: '18', name: 'Fly', level: 3, school: 'Transmutation', description: 'You touch a willing creature. The target gains a flying speed of 60 feet for the duration.', damage: null, castingTime: '1 action', range: 'Touch' },
            { id: '19', name: 'Counterspell', level: 3, school: 'Abjuration', description: 'You attempt to interrupt a creature in the process of casting a spell.', damage: null, castingTime: '1 reaction', range: '60 feet' },
            { id: '20', name: 'Dispel Magic', level: 3, school: 'Abjuration', description: 'Choose any creature, object, or magical effect within range.', damage: null, castingTime: '1 action', range: '120 feet' },
            
            // Level 4 Spells
            { id: '21', name: 'Polymorph', level: 4, school: 'Transmutation', description: 'This spell transforms a creature that you can see within range into a new form.', damage: null, castingTime: '1 action', range: '60 feet' },
            { id: '22', name: 'Wall of Fire', level: 4, school: 'Evocation', description: 'You create a wall of fire on a solid surface within range.', damage: '5d8 fire', castingTime: '1 action', range: '120 feet' },
            { id: '23', name: 'Greater Invisibility', level: 4, school: 'Illusion', description: 'You or a creature you touch becomes invisible until the spell ends.', damage: null, castingTime: '1 action', range: 'Touch' },
            { id: '24', name: 'Dimension Door', level: 4, school: 'Conjuration', description: 'You teleport yourself from your current location to any other spot within range.', damage: null, castingTime: '1 action', range: '500 feet' },
            
            // Level 5 Spells
            { id: '25', name: 'Cone of Cold', level: 5, school: 'Evocation', description: 'A blast of cold air erupts from your hands.', damage: '8d8 cold', castingTime: '1 action', range: 'Self (60-foot cone)' },
            { id: '26', name: 'Teleportation Circle', level: 5, school: 'Conjuration', description: 'As you cast the spell, you draw a 10-foot-diameter circle on the ground inscribed with sigils.', damage: null, castingTime: '1 minute', range: '10 feet' },
            { id: '27', name: 'Hold Monster', level: 5, school: 'Enchantment', description: 'Choose a creature that you can see within range.', damage: null, castingTime: '1 action', range: '90 feet' },
            
            // Level 6+ Spells
            { id: '28', name: 'Chain Lightning', level: 6, school: 'Evocation', description: 'You create a bolt of lightning that arcs toward a target of your choice that you can see within range.', damage: '10d8 lightning', castingTime: '1 action', range: '150 feet' },
            { id: '29', name: 'Teleport', level: 7, school: 'Conjuration', description: 'This spell instantly transports you and up to eight willing creatures of your choice that you can see within range.', damage: null, castingTime: '1 action', range: '10 feet' },
            { id: '30', name: 'Meteor Swarm', level: 9, school: 'Evocation', description: 'Blazing orbs of fire plummet to the ground at four different points you can see within range.', damage: '20d6 fire + 20d6 bludgeoning', castingTime: '1 action', range: '1 mile' }
          ];
          setSpells(defaultSpells);
          localStorage.setItem('mythseeker_spells', JSON.stringify(defaultSpells));
        } else {
          setSpells(spellsData);
        }
        
        // Load known spells from localStorage
        const known = JSON.parse(localStorage.getItem('mythseeker_known_spells') || '[]');
        setKnownSpells(known);
      } catch (error) {
        console.error('Error loading magic data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMagicData();
  }, [user.uid]);

  // Auto-select first character when characters are loaded
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0]);
    }
  }, [characters, selectedCharacter]);

  const handleLearnSpell = (spell: any) => {
    if (!selectedCharacter) {
      alert('Please select a character first');
      return;
    }
    
    const newKnownSpell = {
      ...spell,
      characterId: selectedCharacter.id,
      learnedAt: new Date().toISOString()
    };
    
    const updatedKnownSpells = [...knownSpells, newKnownSpell];
    setKnownSpells(updatedKnownSpells);
    localStorage.setItem('mythseeker_known_spells', JSON.stringify(updatedKnownSpells));
  };

  const handleForgetSpell = (spellId: string) => {
    const updatedKnownSpells = knownSpells.filter(s => s.id !== spellId);
    setKnownSpells(updatedKnownSpells);
    localStorage.setItem('mythseeker_known_spells', JSON.stringify(updatedKnownSpells));
  };

  const getSpellSchoolColor = (school: string) => {
    const colors: { [key: string]: string } = {
      'Evocation': 'from-red-500 to-pink-500',
      'Illusion': 'from-purple-500 to-indigo-500',
      'Conjuration': 'from-blue-500 to-cyan-500',
      'Abjuration': 'from-green-500 to-emerald-500',
      'Transmutation': 'from-yellow-500 to-orange-500',
      'Divination': 'from-indigo-500 to-purple-500',
      'Enchantment': 'from-pink-500 to-rose-500',
      'Necromancy': 'from-gray-500 to-slate-500'
    };
    return colors[school] || 'from-slate-500 to-gray-500';
  };

  const getSpellSchoolIcon = (school: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Evocation': <Zap className="w-4 h-4" />,
      'Illusion': <Eye className="w-4 h-4" />,
      'Conjuration': <Globe className="w-4 h-4" />,
      'Abjuration': <Shield className="w-4 h-4" />,
      'Transmutation': <RefreshCw className="w-4 h-4" />,
      'Divination': <Search className="w-4 h-4" />,
      'Enchantment': <Heart className="w-4 h-4" />,
      'Necromancy': <Skull className="w-4 h-4" />
    };
    return icons[school] || <Swords className="w-4 h-4" />;
  };

  const isSpellEligible = (spell: any) => {
    if (!selectedCharacter) return false;
    
    const characterLevel = selectedCharacter.level || 1;
    const characterClass = selectedCharacter.class?.toLowerCase() || 'wizard';
    
    // Check level requirement
    if (spell.level > characterLevel) return false;
    
    // Check class restrictions (simplified)
    const classSpells = {
      'wizard': ['Evocation', 'Illusion', 'Conjuration', 'Abjuration', 'Transmutation', 'Divination', 'Enchantment', 'Necromancy'],
      'sorcerer': ['Evocation', 'Illusion', 'Conjuration', 'Abjuration', 'Transmutation', 'Enchantment'],
      'cleric': ['Evocation', 'Abjuration', 'Divination', 'Enchantment', 'Necromancy'],
      'druid': ['Evocation', 'Abjuration', 'Transmutation', 'Divination', 'Conjuration'],
      'bard': ['Illusion', 'Enchantment', 'Divination', 'Transmutation'],
      'warlock': ['Evocation', 'Illusion', 'Conjuration', 'Abjuration', 'Enchantment', 'Necromancy'],
      'paladin': ['Abjuration', 'Evocation', 'Divination'],
      'ranger': ['Abjuration', 'Evocation', 'Divination', 'Transmutation']
    };
    
    return classSpells[characterClass]?.includes(spell.school) || true;
  };

  const getFilteredSpells = () => {
    let filtered = spells;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(spell => 
        spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.school.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply school filter
    if (schoolFilter !== 'all') {
      filtered = filtered.filter(spell => spell.school === schoolFilter);
    }
    
    // Apply level filter
    if (levelFilter > 0) {
      filtered = filtered.filter(spell => spell.level === levelFilter);
    }
    
    // Apply view filter
    switch (filterView) {
      case 'eligible':
        filtered = filtered.filter(spell => isSpellEligible(spell) && !knownSpells.some(s => s.id === spell.id && s.characterId === selectedCharacter?.id));
        break;
      case 'known':
        filtered = filtered.filter(spell => knownSpells.some(s => s.id === spell.id && s.characterId === selectedCharacter?.id));
        break;
      default:
        break;
    }
    
    return filtered.sort((a, b) => {
      // Sort by level first, then by name
      if (a.level !== b.level) return a.level - b.level;
      return a.name.localeCompare(b.name);
    });
  };

  const getCharacterSpellSlots = () => {
    if (!selectedCharacter) return {};
    
    const level = selectedCharacter.level || 1;
    const slots: { [key: number]: number } = {};
    
    // Simplified spell slot calculation
    if (level >= 1) slots[1] = Math.min(4, 2 + Math.floor(level / 2));
    if (level >= 3) slots[2] = Math.min(3, Math.floor(level / 3));
    if (level >= 5) slots[3] = Math.min(3, Math.floor(level / 5));
    if (level >= 7) slots[4] = Math.min(2, Math.floor(level / 7));
    if (level >= 9) slots[5] = Math.min(2, Math.floor(level / 9));
    if (level >= 11) slots[6] = 1;
    if (level >= 13) slots[7] = 1;
    if (level >= 15) slots[8] = 1;
    if (level >= 17) slots[9] = 1;
    
    return slots;
  };

  const getUsedSpellSlots = () => {
    if (!selectedCharacter) return {};
    
    const knownSpellsForChar = knownSpells.filter(s => s.characterId === selectedCharacter.id);
    const used: { [key: number]: number } = {};
    
    // Count used slots (simplified - just count spells of each level)
    knownSpellsForChar.forEach(spell => {
      if (spell.level > 0) {
        used[spell.level] = (used[spell.level] || 0) + 1;
      }
    });
    
    return used;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-200">Loading magic system...</p>
        </div>
      </div>
    );
  }

  const filteredSpells = getFilteredSpells();
  const spellSlots = getCharacterSpellSlots();
  const usedSlots = getUsedSpellSlots();
  const schools = ['Evocation', 'Illusion', 'Conjuration', 'Abjuration', 'Transmutation', 'Divination', 'Enchantment', 'Necromancy'];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Magic</h1>
          <p className="text-blue-200">Spells, abilities, and magical resources</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Character Selection & Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Character</h3>
              {characters.length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-blue-200 mb-3 text-sm">No characters available</p>
                  <button 
                    onClick={() => navigate('/characters')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    Create Character
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <select 
                    value={selectedCharacter?.id || ''}
                    onChange={(e) => {
                      const char = characters.find(c => c.id === e.target.value);
                      setSelectedCharacter(char);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="">Choose a character...</option>
                    {characters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name} - Level {character.level || 1}
                      </option>
                    ))}
                  </select>
                  
                  {selectedCharacter && (
                    <div className="space-y-2 pt-2 border-t border-slate-600">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">Class</span>
                        <span className="text-white capitalize">{selectedCharacter.class || 'Wizard'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">Level</span>
                        <span className="text-white">{selectedCharacter.level || 1}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">Mana</span>
                        <span className="text-white">{selectedCharacter.mana || 0}/{selectedCharacter.maxMana || 50}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">Known Spells</span>
                        <span className="text-white">
                          {knownSpells.filter(s => s.characterId === selectedCharacter.id).length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Spell Slots */}
            {selectedCharacter && (
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Spell Slots</h3>
                <div className="space-y-2">
                  {Object.entries(spellSlots).map(([level, maxSlots]) => {
                    const used = usedSlots[parseInt(level)] || 0;
                    const available = maxSlots - used;
                    return (
                      <div key={level} className="flex justify-between items-center">
                        <span className="text-blue-200 text-sm">Level {level}</span>
                        <div className="flex space-x-1">
                          {Array.from({ length: maxSlots }, (_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full border ${
                                i < available 
                                  ? 'bg-blue-500 border-blue-400' 
                                  : 'bg-slate-600 border-slate-500'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-white text-sm">{available}/{maxSlots}</span>
                      </div>
                    );
                  })}
                  {Object.keys(spellSlots).length === 0 && (
                    <p className="text-slate-400 text-sm">No spell slots available</p>
                  )}
                </div>
              </div>
            )}

            {/* Spell Schools Legend */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Spell Schools</h3>
              <div className="space-y-2">
                {schools.map((school) => (
                  <div key={school} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 bg-gradient-to-r ${getSpellSchoolColor(school)} rounded-full`}></div>
                    <span className="text-blue-200 text-sm">{school}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Spell Library */}
          <div className="lg:col-span-3 bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
              <h3 className="text-xl font-semibold text-white">Spell Library</h3>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                {/* View Filter */}
                <div className="flex bg-slate-700/50 rounded-lg p-1">
                  {[
                    { key: 'all', label: 'All Spells' },
                    { key: 'eligible', label: 'Eligible' },
                    { key: 'known', label: 'Known' }
                  ].map((view) => (
                    <button
                      key={view.key}
                      onClick={() => setFilterView(view.key as any)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        filterView === view.key
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>

                {/* School Filter */}
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="all">All Schools</option>
                  {schools.map((school) => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>

                {/* Level Filter */}
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(parseInt(e.target.value))}
                  className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value={0}>All Levels</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                    <option key={level} value={level}>
                      {level === 0 ? 'Cantrips' : `Level ${level}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search spells..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400"
              />
            </div>

            {/* Spells Grid */}
            {!selectedCharacter ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-blue-200 mb-2">Select a character to view spells</p>
                <p className="text-slate-400 text-sm">Choose a character from the dropdown to see available spells</p>
              </div>
            ) : filteredSpells.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-blue-200 mb-2">No spells found</p>
                <p className="text-slate-400 text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredSpells.map((spell) => {
                  const isKnown = knownSpells.some(s => s.id === spell.id && s.characterId === selectedCharacter?.id);
                  const isEligible = isSpellEligible(spell);
                  
                  return (
                    <div 
                      key={spell.id} 
                      className={`p-4 rounded-lg border transition-all ${
                        isKnown 
                          ? 'bg-green-900/20 border-green-600/50' 
                          : isEligible 
                            ? 'bg-blue-900/20 border-blue-600/50' 
                            : 'bg-slate-700/30 border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm">{spell.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              spell.level === 0 
                                ? 'bg-purple-600/30 text-purple-300' 
                                : 'bg-blue-600/30 text-blue-300'
                            }`}>
                              {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                            </span>
                            <span className="text-blue-200 text-xs">{spell.school}</span>
                          </div>
                        </div>
                        <div className={`w-8 h-8 bg-gradient-to-br ${getSpellSchoolColor(spell.school)} rounded-full flex items-center justify-center`}>
                          {getSpellSchoolIcon(spell.school)}
                        </div>
                      </div>
                      
                      <p className="text-slate-300 text-xs mb-3 line-clamp-2">{spell.description}</p>
                      
                      {spell.damage && (
                        <div className="mb-2">
                          <span className="text-orange-300 text-xs font-medium">Damage: {spell.damage}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>{spell.castingTime}</span>
                        <span>{spell.range}</span>
                      </div>
                      
                      {/* Eligibility Status */}
                      {!isKnown && (
                        <div className="mb-3">
                          {isEligible ? (
                            <div className="flex items-center space-x-1 text-green-400 text-xs">
                              <CheckCircle className="w-3 h-3" />
                              <span>Available to learn</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-slate-400 text-xs">
                              <XCircle className="w-3 h-3" />
                              <span>Not available</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => isKnown ? handleForgetSpell(spell.id) : handleLearnSpell(spell)}
                        disabled={!isKnown && !isEligible}
                        className={`w-full px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isKnown 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : isEligible
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isKnown ? 'Forget Spell' : 'Learn Spell'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicPage; 