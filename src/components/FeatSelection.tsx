import React, { useState, useEffect, useMemo } from 'react';
import { Feat, FeatPrerequisite, CharacterProgression } from '../types/characterProgression';
import { characterProgressionService } from '../services/characterProgressionService';

interface FeatSelectionProps {
  progression: CharacterProgression;
  onFeatSelect?: (featId: string) => void;
  selectedFeats?: string[];
  maxSelections?: number;
}

export const FeatSelection: React.FC<FeatSelectionProps> = ({
  progression,
  onFeatSelect,
  selectedFeats = [],
  maxSelections = 1
}) => {
  const [allFeats, setAllFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);

  useEffect(() => {
    loadFeats();
  }, []);

  const loadFeats = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would load from Firestore
      // For now, we'll use the sample feats
      const feats = getSampleFeats();
      setAllFeats(feats);
    } catch (error) {
      console.error('Error loading feats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeats = useMemo(() => {
    let filtered = allFeats;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(feat =>
        feat.name.toLowerCase().includes(term) ||
        feat.description.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(feat => feat.type === selectedType);
    }

    // Sort by whether prerequisites are met
    filtered.sort((a, b) => {
      const aMeetsPrereqs = meetsPrerequisites(a);
      const bMeetsPrereqs = meetsPrerequisites(b);
      
      if (aMeetsPrereqs && !bMeetsPrereqs) return -1;
      if (!aMeetsPrereqs && bMeetsPrereqs) return 1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [allFeats, searchTerm, selectedType, progression]);

  const meetsPrerequisites = (feat: Feat): boolean => {
    return feat.prerequisites.every(prereq => {
      switch (prereq.type) {
        case 'ability_score':
          const ability = prereq.target as keyof typeof progression.abilityScores;
          return progression.abilityScores[ability]?.total >= (prereq.value as number);
          
        case 'class_level':
          return progression.level >= (prereq.value as number);
          
        case 'skill_proficiency':
          return progression.skillProficiencies.includes(prereq.target as any);
          
        case 'feat':
          return progression.feats.includes(prereq.target);
          
        default:
          return true;
      }
    });
  };

  const handleFeatClick = (feat: Feat) => {
    setSelectedFeat(feat);
  };

  const handleSelectFeat = (feat: Feat) => {
    if (onFeatSelect && !selectedFeats.includes(feat.id)) {
      onFeatSelect(feat.id);
    }
  };

  const featTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'combat', label: 'Combat' },
    { value: 'utility', label: 'Utility' },
    { value: 'social', label: 'Social' },
    { value: 'magic', label: 'Magic' },
    { value: 'racial', label: 'Racial' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Feats</h2>
          <p className="text-gray-600">
            Choose {maxSelections} feat{maxSelections > 1 ? 's' : ''} to enhance your character's abilities.
            Selected: {selectedFeats.length} / {maxSelections}
          </p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Feats
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {featTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Feat List */}
        <div className="grid lg:grid-cols-2 gap-6 p-6">
          {/* Feat Cards */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredFeats.map(feat => {
              const meetsPrereqs = meetsPrerequisites(feat);
              const isSelected = selectedFeats.includes(feat.id);
              const canSelect = selectedFeats.length < maxSelections && !isSelected;
              
              return (
                <div
                  key={feat.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedFeat?.id === feat.id
                      ? 'border-purple-500 bg-purple-50'
                      : meetsPrereqs
                      ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  } ${
                    isSelected ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => handleFeatClick(feat)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${
                      meetsPrereqs ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {feat.name}
                    </h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        feat.type === 'combat' ? 'bg-red-100 text-red-800' :
                        feat.type === 'magic' ? 'bg-purple-100 text-purple-800' :
                        feat.type === 'utility' ? 'bg-blue-100 text-blue-800' :
                        feat.type === 'social' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {feat.type}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    meetsPrereqs ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {feat.description}
                  </p>
                  
                  {feat.prerequisites.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Prerequisites:</p>
                      <div className="flex flex-wrap gap-1">
                        {feat.prerequisites.map((prereq, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs ${
                              meetsPrerequisite(prereq)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {formatPrerequisite(prereq)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!meetsPrereqs && (
                    <p className="text-xs text-red-600 font-medium">
                      Prerequisites not met
                    </p>
                  )}
                </div>
              );
            })}
            
            {filteredFeats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No feats match your search criteria.</p>
              </div>
            )}
          </div>

          {/* Feat Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            {selectedFeat ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{selectedFeat.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedFeat.type === 'combat' ? 'bg-red-100 text-red-800' :
                    selectedFeat.type === 'magic' ? 'bg-purple-100 text-purple-800' :
                    selectedFeat.type === 'utility' ? 'bg-blue-100 text-blue-800' :
                    selectedFeat.type === 'social' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedFeat.type}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-6">{selectedFeat.description}</p>
                
                {selectedFeat.effects.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Effects</h4>
                    <div className="space-y-2">
                      {selectedFeat.effects.map((effect, index) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <p className="font-medium text-sm text-gray-800 mb-1">
                            {effect.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-600">{effect.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedFeat.prerequisites.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Prerequisites</h4>
                    <div className="space-y-2">
                      {selectedFeat.prerequisites.map((prereq, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded border ${
                            meetsPrerequisite(prereq)
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${
                              meetsPrerequisite(prereq) ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {meetsPrerequisite(prereq) ? '✓' : '✗'}
                            </span>
                            <p className={`text-sm ${
                              meetsPrerequisite(prereq) ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {formatPrerequisite(prereq)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  {selectedFeats.includes(selectedFeat.id) ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <span>✓</span>
                      <span className="font-medium">Selected</span>
                    </div>
                  ) : meetsPrerequisites(selectedFeat) && selectedFeats.length < maxSelections ? (
                    <button
                      onClick={() => handleSelectFeat(selectedFeat)}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Select This Feat
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed"
                    >
                      {!meetsPrerequisites(selectedFeat) 
                        ? 'Prerequisites Not Met' 
                        : 'Maximum Feats Selected'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Feat</h3>
                <p className="text-gray-500">Click on a feat to see detailed information.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function meetsPrerequisite(prereq: FeatPrerequisite): boolean {
    switch (prereq.type) {
      case 'ability_score':
        const ability = prereq.target as keyof typeof progression.abilityScores;
        return progression.abilityScores[ability]?.total >= (prereq.value as number);
        
      case 'class_level':
        return progression.level >= (prereq.value as number);
        
      case 'skill_proficiency':
        return progression.skillProficiencies.includes(prereq.target as any);
        
      case 'feat':
        return progression.feats.includes(prereq.target);
        
      default:
        return true;
    }
  }

  function formatPrerequisite(prereq: FeatPrerequisite): string {
    switch (prereq.type) {
      case 'ability_score':
        return `${prereq.target.charAt(0).toUpperCase() + prereq.target.slice(1)} ${prereq.value}+`;
      case 'class_level':
        return `Level ${prereq.value}+`;
      case 'skill_proficiency':
        return `Proficiency in ${prereq.target}`;
      case 'feat':
        return `Feat: ${prereq.target}`;
      default:
        return `${prereq.type}: ${prereq.target}`;
    }
  }
};

// Sample feats for demonstration
function getSampleFeats(): Feat[] {
  return [
    {
      id: 'alert',
      name: 'Alert',
      description: 'Always on the lookout for danger, you gain the following benefits: You gain a +5 bonus to initiative. You can\'t be surprised while you are conscious. Other creatures don\'t gain advantage on attack rolls against you as a result of being unseen by you.',
      prerequisites: [],
      effects: [
        {
          type: 'bonus',
          target: 'initiative',
          value: 5,
          description: '+5 bonus to initiative rolls'
        },
        {
          type: 'new_ability',
          target: 'alert_senses',
          value: 'special',
          description: 'Cannot be surprised while conscious'
        }
      ],
      type: 'utility',
      source: 'Player\'s Handbook',
      repeatable: false
    },
    {
      id: 'great_weapon_master',
      name: 'Great Weapon Master',
      description: 'You\'ve learned to put the weight of a weapon to your advantage. You gain the following benefits: On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack\'s damage roll.',
      prerequisites: [
        {
          type: 'ability_score',
          target: 'strength',
          value: 13
        }
      ],
      effects: [
        {
          type: 'new_ability',
          target: 'bonus_attack',
          value: 'conditional',
          description: 'Bonus attack on critical hit or kill'
        },
        {
          type: 'new_ability',
          target: 'power_attack',
          value: 'optional',
          description: '-5 attack for +10 damage with heavy weapons'
        }
      ],
      type: 'combat',
      source: 'Player\'s Handbook',
      repeatable: false
    },
    {
      id: 'magic_initiate',
      name: 'Magic Initiate',
      description: 'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips of your choice from that class\'s spell list. In addition, choose one 1st-level spell from that same list. You learn that spell and can cast it at its lowest level.',
      prerequisites: [],
      effects: [
        {
          type: 'spell_access',
          target: 'cantrips',
          value: 2,
          description: 'Learn 2 cantrips from chosen class'
        },
        {
          type: 'spell_access',
          target: '1st_level_spell',
          value: 1,
          description: 'Learn 1 first-level spell (once per long rest)'
        }
      ],
      type: 'magic',
      source: 'Player\'s Handbook',
      repeatable: true
    },
    {
      id: 'actor',
      name: 'Actor',
      description: 'Skilled at mimicry and dramatics, you gain the following benefits: Increase your Charisma score by 1, to a maximum of 20. You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person. You can mimic the speech of another person or the sounds made by other creatures.',
      prerequisites: [],
      effects: [
        {
          type: 'ability_increase',
          target: 'charisma',
          value: 1,
          description: '+1 Charisma (max 20)'
        },
        {
          type: 'new_ability',
          target: 'mimicry',
          value: 'special',
          description: 'Advantage on Deception/Performance for disguise'
        }
      ],
      type: 'social',
      source: 'Player\'s Handbook',
      repeatable: false
    },
    {
      id: 'lucky',
      name: 'Lucky',
      description: 'You have inexplicable luck that seems to kick in at just the right moment. You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20. You can choose to spend one of your luck points after you roll the die, but before the outcome is determined.',
      prerequisites: [],
      effects: [
        {
          type: 'new_ability',
          target: 'luck_points',
          value: 3,
          description: '3 luck points per long rest for rerolls'
        }
      ],
      type: 'utility',
      source: 'Player\'s Handbook',
      repeatable: false
    }
  ];
}

export default FeatSelection; 