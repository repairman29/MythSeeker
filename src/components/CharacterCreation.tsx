import React, { useState } from 'react';

// Character classes data (can be moved to a separate file later)
const DEFAULT_CLASSES = [
  {
    name: 'Warrior',
    icon: '⚔️',
    stats: { strength: 16, dexterity: 13, intelligence: 10, charisma: 12 },
    skills: { swordMastery: 4, shieldWork: 3, tactics: 2 }
  },
  {
    name: 'Rogue',
    icon: '🗡️',
    stats: { strength: 12, dexterity: 16, intelligence: 13, charisma: 10 },
    skills: { stealth: 4, lockpicking: 3, sleightOfHand: 2 }
  },
  {
    name: 'Mage',
    icon: '🔮',
    stats: { strength: 8, dexterity: 12, intelligence: 16, charisma: 13 },
    skills: { spellcasting: 4, arcaneLore: 3, enchantment: 2 }
  },
  {
    name: 'Cleric',
    icon: '✨',
    stats: { strength: 13, dexterity: 10, intelligence: 12, charisma: 16 },
    skills: { healing: 4, divineChanneling: 3, blessing: 2 }
  },
  {
    name: 'Ranger',
    icon: '🏹',
    stats: { strength: 13, dexterity: 15, intelligence: 12, charisma: 11 },
    skills: { archery: 4, tracking: 3, survival: 2 }
  },
  {
    name: 'Bard',
    icon: '🎵',
    stats: { strength: 10, dexterity: 13, intelligence: 12, charisma: 16 },
    skills: { performance: 4, inspiration: 3, persuasion: 2 }
  }
];

interface CharacterCreationProps {
  playerName: string;
  classes?: any[];
  onCreateCharacter: (characterData: any) => void;
  joinCode?: string;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ 
  playerName, 
  classes = DEFAULT_CLASSES, 
  onCreateCharacter, 
  joinCode = '' 
}) => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [characterName, setCharacterName] = useState(playerName);
  const [backstory, setBackstory] = useState('');
  const [hoveredClass, setHoveredClass] = useState<any>(null);
  const [errors, setErrors] = useState<{ name?: string; class?: string; backstory?: string }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  // Profanity filter (basic)
  const profanityList = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'piss', 'cock', 'fag', 'slut', 'whore'];
  const containsProfanity = (str: string) => {
    if (!str) return false;
    const lower = str.toLowerCase();
    return profanityList.some(word => lower.includes(word));
  };

  const validate = () => {
    setIsValidating(true);
    const newErrors: { name?: string; class?: string; backstory?: string } = {};
    
    if (!characterName.trim()) {
      newErrors.name = 'Character name is required.';
    } else if (characterName.length > 50) {
      newErrors.name = 'Character name must be 50 characters or less.';
    } else if (containsProfanity(characterName)) {
      newErrors.name = 'Please choose a more appropriate name.';
    }
    
    if (!selectedClass) {
      newErrors.class = 'Character class is required.';
    }
    
    if (backstory.length > 0 && containsProfanity(backstory)) {
      newErrors.backstory = 'Please remove inappropriate language from the backstory.';
    } else if (backstory.length > 500) {
      newErrors.backstory = 'Backstory must be 500 characters or less.';
    }
    
    setErrors(newErrors);
    setTimeout(() => setIsValidating(false), 500);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      setShowPreview(true);
      setTimeout(() => {
        onCreateCharacter({
          name: characterName.trim(),
          class: selectedClass.name,
          backstory: backstory.trim(),
          stats: selectedClass.stats,
          skills: selectedClass.skills
        });
      }, 1500);
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    if (characterName.trim()) completed += 40;
    if (selectedClass) completed += 40;
    if (backstory.trim()) completed += 20;
    return completed;
  };

  // Get the class to display in preview (hovered or selected)
  const previewClass = hoveredClass || selectedClass;

  // Step validation
  const isStep1Valid = characterName.trim().length > 0 && !errors.name;
  const isStep2Valid = selectedClass !== null && !errors.class;
  const isStep3Valid = backstory.length === 0 || (!errors.backstory && backstory.trim().length > 0);

  return (
    <div className="space-y-6 character-creation">
      {/* Progress Indicator */}
      <div className="bg-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Character Creation Progress</h3>
          <span className="text-blue-300 text-sm">{getCompletionPercentage()}% Complete</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center space-x-2 ${isStep1Valid ? 'text-green-400' : characterName.trim() ? 'text-yellow-400' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStep1Valid ? 'bg-green-500' : characterName.trim() ? 'bg-yellow-500' : 'bg-gray-500'}`}>
              {isStep1Valid ? '✓' : '1'}
            </div>
            <span>Name</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${isStep2Valid ? 'text-green-400' : selectedClass ? 'text-yellow-400' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStep2Valid ? 'bg-green-500' : selectedClass ? 'bg-yellow-500' : 'bg-gray-500'}`}>
              {isStep2Valid ? '✓' : '2'}
            </div>
            <span>Class</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${isStep3Valid ? 'text-green-400' : backstory.trim() ? 'text-yellow-400' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStep3Valid ? 'bg-green-500' : backstory.trim() ? 'bg-yellow-500' : 'bg-gray-500'}`}>
              {isStep3Valid ? '✓' : '3'}
            </div>
            <span>Story</span>
          </div>
        </div>
      </div>

      {/* Character Creation Success Animation */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 rounded-2xl p-8 max-w-md mx-4 text-center border border-purple-500/50">
            <div className="text-6xl mb-4 animate-bounce">{selectedClass?.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">Character Created!</h3>
            <p className="text-purple-200 mb-4">
              {characterName} the {selectedClass?.name} is ready for adventure!
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-purple-300/30 border-t-purple-400 rounded-full mx-auto"></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        <div className="space-y-4 lg:space-y-6">
          {/* Step 1: Character Name */}
          <div className={`transition-all duration-300 ${currentStep === 1 ? 'ring-2 ring-blue-400 rounded-xl p-4' : ''}`}>
            <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <span>Character Name</span>
              {isStep1Valid && <span className="text-green-400">✓</span>}
            </label>
            <input
              type="text"
              placeholder="Enter your hero's name..."
              value={characterName}
              onChange={(e) => {
                setCharacterName(e.target.value);
                if (currentStep === 1 && e.target.value.trim()) {
                  setTimeout(() => setCurrentStep(2), 500);
                }
              }}
              onFocus={() => setCurrentStep(1)}
              className={`w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border transition-all duration-300 focus:outline-none text-sm lg:text-base ${
                errors.name ? 'border-red-400 focus:border-red-400' : 
                isStep1Valid ? 'border-green-400 focus:border-green-400' : 
                'border-white/30 focus:border-blue-400'
              }`}
            />
            {errors.name && <div className="text-red-400 text-xs mt-1 animate-pulse">{errors.name}</div>}
            {isStep1Valid && !errors.name && (
              <div className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                <span>✓</span>
                <span>Great name choice!</span>
              </div>
            )}
          </div>

          {/* Step 2: Choose Class */}
          <div className={`transition-all duration-300 ${currentStep === 2 ? 'ring-2 ring-blue-400 rounded-xl p-4' : ''}`}>
            <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <span>Choose Your Class</span>
              {isStep2Valid && <span className="text-green-400">✓</span>}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 class-grid">
              {classes && classes.length > 0 ? (
                classes.map((cls) => (
                <div
                  key={cls.name}
                  onClick={() => {
                    setSelectedClass(cls);
                    if (currentStep === 2) {
                      setTimeout(() => setCurrentStep(3), 500);
                    }
                  }}
                  onFocus={() => setCurrentStep(2)}
                  onMouseEnter={() => setHoveredClass(cls)}
                  onMouseLeave={() => setHoveredClass(null)}
                  className={`class-card p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform ${
                    selectedClass?.name === cls.name
                      ? 'border-green-400 bg-green-500/30 shadow-lg scale-105 selected'
                      : hoveredClass?.name === cls.name
                      ? 'border-blue-400 bg-blue-500/20 shadow-md scale-102'
                      : 'border-white/30 bg-white/10 hover:border-white/50 hover:scale-102'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl mb-2 transition-transform duration-300 hover:scale-110">{cls.icon}</div>
                    <h3 className="text-white font-semibold text-sm lg:text-base mb-2">{cls.name}</h3>
                    
                    {/* Quick Stats with Meaningful Context */}
                    <div className="text-xs text-blue-200 space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span>STR: {cls.stats.strength}</span>
                        <span className="text-yellow-300">Attack Power</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DEX: {cls.stats.dexterity}</span>
                        <span className="text-green-300">Agility</span>
                      </div>
                      <div className="flex justify-between">
                        <span>INT: {cls.stats.intelligence}</span>
                        <span className="text-purple-300">Magic</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CHA: {cls.stats.charisma}</span>
                        <span className="text-pink-300">Social</span>
                      </div>
                    </div>
                    
                    {/* Visual Confirmation for Selected Class */}
                    {selectedClass?.name === cls.name && (
                      <div className="flex items-center justify-center space-x-1 text-green-400 text-xs animate-pulse">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full mx-auto mb-4"></div>
                  <p>Loading character classes...</p>
                </div>
              )}
            </div>
            {errors.class && <div className="text-red-400 text-xs mt-1 animate-pulse">{errors.class}</div>}
            {isStep2Valid && !errors.class && (
              <div className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                <span>✓</span>
                <span>Excellent choice! {selectedClass.name} is a powerful class.</span>
              </div>
            )}
          </div>

          {/* Step 3: Character Backstory */}
          <div className={`transition-all duration-300 ${currentStep === 3 ? 'ring-2 ring-blue-400 rounded-xl p-4' : ''}`}>
            <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <span>Character Backstory</span>
              <span className="text-blue-300 text-xs">(Optional)</span>
              {isStep3Valid && <span className="text-green-400">✓</span>}
            </label>
            
            {/* Backstory Prompts for Creative Scaffolding */}
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                "What is your character's greatest fear?",
                "Where did they grow up?",
                "What brought them to adventure?",
                "Who is their closest friend?",
                "What do they value most?"
              ].map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setBackstory(prev => prev ? `${prev}\n\n${prompt}` : prompt);
                    setCurrentStep(3);
                  }}
                  className="px-2 py-1 bg-blue-600/30 text-blue-200 text-xs rounded hover:bg-blue-600/50 transition-all transform hover:scale-105"
                >
                  {prompt}
                </button>
              ))}
            </div>
            
            <textarea
              value={backstory}
              onChange={(e) => {
                setBackstory(e.target.value);
                setCurrentStep(3);
              }}
              onFocus={() => setCurrentStep(3)}
              placeholder="Describe your character's background, motivations, and personality... (Click prompts above for inspiration)"
              className={`w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border transition-all duration-300 focus:outline-none h-24 lg:h-32 resize-none text-sm lg:text-base ${
                errors.backstory ? 'border-red-400 focus:border-red-400' : 
                isStep3Valid && backstory.trim() ? 'border-green-400 focus:border-green-400' : 
                'border-white/30 focus:border-blue-400'
              }`}
            />
            {errors.backstory && <div className="text-red-400 text-xs mt-1 animate-pulse">{errors.backstory}</div>}
            {isStep3Valid && backstory.trim() && !errors.backstory && (
              <div className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                <span>✓</span>
                <span>Great backstory! This will enhance your roleplay experience.</span>
              </div>
            )}
          </div>

          {/* Create Character Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedClass || !characterName.trim() || isValidating}
            className={`w-full px-4 lg:px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm lg:text-base transform ${
              selectedClass && characterName.trim() && !isValidating
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:scale-105 hover:shadow-xl'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
            }`}
          >
            {isValidating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                <span>Validating...</span>
              </div>
            ) : selectedClass && characterName.trim() ? (
              `Create ${characterName} the ${selectedClass.name}`
            ) : (
              'Complete required fields to create character'
            )}
          </button>
        </div>

        {/* Enhanced Class Preview */}
        <div className="bg-white/10 rounded-xl p-4 lg:p-6 transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-4">
            {previewClass ? `Class Preview: ${previewClass.name}` : 'Select a Class'}
          </h3>
          
          {previewClass ? (
            <div className="space-y-4">
              {/* Class Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-4xl animate-pulse">{previewClass.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{previewClass.name}</h4>
                  <p className="text-blue-200 text-sm">Master of tactical combat</p>
                </div>
              </div>
              
              {/* Character Preview with Live Name */}
              {characterName.trim() && (
                <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
                  <h5 className="text-white font-semibold mb-2 flex items-center space-x-2">
                    <span>✨</span>
                    <span>Character Preview</span>
                  </h5>
                  <div className="text-center">
                    <div className="text-3xl mb-2">{previewClass.icon}</div>
                    <p className="text-lg font-bold text-white">{characterName}</p>
                    <p className="text-blue-300">Level 1 {previewClass.name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-red-500/20 rounded px-2 py-1">
                        <span className="text-red-300">❤️ Health: 100</span>
                      </div>
                      <div className="bg-blue-500/20 rounded px-2 py-1">
                        <span className="text-blue-300">✨ Mana: 50</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Class Description */}
              <div className="bg-black/20 rounded-lg p-3">
                <h5 className="text-white font-semibold mb-2">Class Description</h5>
                <p className="text-blue-200 text-sm leading-relaxed">
                  {previewClass.name === 'Warrior' && "A mighty warrior skilled in close combat, wielding powerful weapons and wearing heavy armor. Your strength and endurance make you the frontline defender of your party."}
                  {previewClass.name === 'Rogue' && "A stealthy rogue who excels at sneaking, lockpicking, and dealing devastating sneak attacks. Your agility and cunning allow you to strike from the shadows."}
                  {previewClass.name === 'Mage' && "A powerful spellcaster who harnesses the arcane arts to cast devastating spells. Your intelligence and magical prowess make you a force to be reckoned with."}
                  {previewClass.name === 'Cleric' && "A divine spellcaster who channels the power of the gods to heal allies and smite enemies. Your faith and charisma make you an invaluable support."}
                  {previewClass.name === 'Ranger' && "A skilled hunter and tracker who excels at ranged combat and wilderness survival. Your dexterity and knowledge of nature make you a versatile adventurer."}
                  {previewClass.name === 'Bard' && "A charismatic performer who uses music and magic to inspire allies and charm enemies. Your creativity and social skills make you the heart of any party."}
                </p>
              </div>

              {/* Starting Equipment Preview */}
              <div className="bg-black/20 rounded-lg p-3">
                <h5 className="text-white font-semibold mb-2">Starting Equipment</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">⚔️</span>
                    <span className="text-blue-200">Iron Sword</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-brown-400">🛡️</span>
                    <span className="text-blue-200">Leather Armor</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400">🧪</span>
                    <span className="text-blue-200">3x Healing Potions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="text-blue-200">100 Gold Pieces</span>
                  </div>
                </div>
              </div>

              {/* Class Abilities Preview */}
              <div className="bg-black/20 rounded-lg p-3">
                <h5 className="text-white font-semibold mb-2">Class Abilities</h5>
                <div className="space-y-2 text-sm">
                  {previewClass.skills && Object.entries(previewClass.skills).slice(0, 3).map(([skill, level]: [string, any]) => (
                    <div key={skill} className="flex justify-between items-center">
                      <span className="text-blue-200 capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < level ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-blue-200 py-8">
              <div className="text-4xl mb-4 opacity-50">🎭</div>
              <p>Select a class to see detailed information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation; 