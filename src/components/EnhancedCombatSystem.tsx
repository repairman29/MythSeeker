import React, { useState, useEffect } from 'react';
import { 
  Sword, Shield, Target, Heart, Zap, Move, RotateCcw, 
  TrendingUp, Award, Book, Eye, Clock, Users, ArrowRight,
  Crosshair, Mountain, Wind, FlameKindling, Snowflake
} from 'lucide-react';

interface Weapon {
  id: string;
  name: string;
  type: string;
  damage: string;
  range: string;
  properties: string[];
  mastery: number;
  maxMastery: number;
  equipped: boolean;
}

interface CombatTechnique {
  id: string;
  name: string;
  description: string;
  type: 'offensive' | 'defensive' | 'utility';
  learned: boolean;
  cooldown: number;
  requirements: string[];
}

interface CombatStats {
  totalFights: number;
  victories: number;
  defeats: number;
  damageDealt: number;
  damageTaken: number;
  criticalHits: number;
  favoriteWeapon: string;
}

interface EnhancedCombatSystemProps {
  character?: any;
  worldState?: any;
  isInCombat?: boolean;
  onStartTraining?: (type: string) => void;
  onEquipWeapon?: (weaponId: string) => void;
}

const EnhancedCombatSystem: React.FC<EnhancedCombatSystemProps> = ({ 
  character, 
  worldState, 
  isInCombat = false,
  onStartTraining,
  onEquipWeapon 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'weapons' | 'techniques' | 'training' | 'history'>('overview');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<Record<string, number>>({});

  // Sample data (would normally come from character/database)
  const [weapons, setWeapons] = useState<Weapon[]>([
    {
      id: 'iron-sword',
      name: 'Iron Sword',
      type: 'Melee',
      damage: '1d8 + STR',
      range: '5 feet',
      properties: ['Versatile', 'Finesse'],
      mastery: 75,
      maxMastery: 100,
      equipped: true
    },
    {
      id: 'longbow',
      name: 'Longbow',
      type: 'Ranged',
      damage: '1d8 + DEX',
      range: '150/600 feet',
      properties: ['Two-handed', 'Ammunition'],
      mastery: 45,
      maxMastery: 100,
      equipped: false
    },
    {
      id: 'magic-staff',
      name: 'Staff of Power',
      type: 'Magic',
      damage: '1d6 + INT',
      range: '5 feet / 120 feet (spells)',
      properties: ['Versatile', 'Magic Focus'],
      mastery: 60,
      maxMastery: 100,
      equipped: false
    }
  ]);

  const [combatTechniques, setCombatTechniques] = useState<CombatTechnique[]>([
    {
      id: 'power-attack',
      name: 'Power Attack',
      description: 'Sacrifice accuracy for devastating damage. -2 to hit, +4 damage.',
      type: 'offensive',
      learned: true,
      cooldown: 0,
      requirements: ['Strength 13+']
    },
    {
      id: 'defensive-stance',
      name: 'Defensive Stance',
      description: 'Focus on defense. +2 AC, movement reduced by half.',
      type: 'defensive',
      learned: true,
      cooldown: 0,
      requirements: ['Constitution 12+']
    },
    {
      id: 'whirlwind-attack',
      name: 'Whirlwind Attack',
      description: 'Attack all enemies within reach. Requires 5 stamina.',
      type: 'offensive',
      learned: false,
      cooldown: 3,
      requirements: ['Dexterity 15+', 'Level 5+']
    },
    {
      id: 'combat-reflexes',
      name: 'Combat Reflexes',
      description: 'Gain additional opportunity attacks. Passive ability.',
      type: 'utility',
      learned: true,
      cooldown: 0,
      requirements: ['Dexterity 13+']
    }
  ]);

  const [combatStats, setCombatStats] = useState<CombatStats>({
    totalFights: 23,
    victories: 18,
    defeats: 5,
    damageDealt: 1247,
    damageTaken: 523,
    criticalHits: 15,
    favoriteWeapon: 'Iron Sword'
  });

  const [recentCombats, setRecentCombats] = useState([
    {
      id: 1,
      enemy: 'Goblin Raiders',
      result: 'Victory',
      duration: '3 rounds',
      experience: 450,
      loot: ['Gold Coins', 'Health Potion'],
      date: '2 hours ago'
    },
    {
      id: 2,
      enemy: 'Shadow Wolf',
      result: 'Victory',
      duration: '5 rounds',
      experience: 300,
      loot: ['Wolf Pelt', 'Silver Coin'],
      date: '1 day ago'
    },
    {
      id: 3,
      enemy: 'Orc Warrior',
      result: 'Defeat',
      duration: '4 rounds',
      experience: 0,
      loot: [],
      date: '3 days ago'
    }
  ]);

  const getWeaponIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'melee': return <Sword className="text-red-400" size={20} />;
      case 'ranged': return <Target className="text-green-400" size={20} />;
      case 'magic': return <Zap className="text-purple-400" size={20} />;
      default: return <Sword className="text-gray-400" size={20} />;
    }
  };

  const getTechniqueIcon = (type: string) => {
    switch (type) {
      case 'offensive': return <Sword className="text-red-400" size={16} />;
      case 'defensive': return <Shield className="text-blue-400" size={16} />;
      case 'utility': return <Eye className="text-yellow-400" size={16} />;
      default: return <Target className="text-gray-400" size={16} />;
    }
  };

  const getMasteryColor = (mastery: number, maxMastery: number) => {
    const percentage = (mastery / maxMastery) * 100;
    if (percentage >= 90) return 'from-yellow-500 to-orange-500';
    if (percentage >= 70) return 'from-purple-500 to-pink-500';
    if (percentage >= 50) return 'from-blue-500 to-indigo-500';
    if (percentage >= 25) return 'from-green-500 to-blue-500';
    return 'from-gray-500 to-gray-600';
  };

  const winRate = combatStats.totalFights > 0 ? Math.round((combatStats.victories / combatStats.totalFights) * 100) : 0;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Combat Status */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Sword className="text-red-400" />
          <span>Combat Status</span>
        </h3>
        
        {isInCombat ? (
          <div className="bg-red-600/20 rounded-lg p-4 border border-red-400/30">
            <div className="flex items-center space-x-2 text-red-300">
              <Target className="animate-pulse" size={20} />
              <span className="font-semibold">Currently in Combat</span>
            </div>
            <p className="text-red-200 mt-2">You are engaged in battle! Use the combat interface to take actions.</p>
          </div>
        ) : (
          <div className="bg-green-600/20 rounded-lg p-4 border border-green-400/30">
            <div className="flex items-center space-x-2 text-green-300">
              <Shield size={20} />
              <span className="font-semibold">Ready for Combat</span>
            </div>
            <p className="text-green-200 mt-2">You are prepared and ready to face any challenge.</p>
          </div>
        )}
      </div>

      {/* Combat Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="text-yellow-400" size={20} />
            <span className="text-white font-semibold">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{winRate}%</div>
          <div className="text-sm text-gray-400">{combatStats.victories}/{combatStats.totalFights} fights</div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Sword className="text-red-400" size={20} />
            <span className="text-white font-semibold">Damage Dealt</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{combatStats.damageDealt.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total damage</div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="text-orange-400" size={20} />
            <span className="text-white font-semibold">Critical Hits</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{combatStats.criticalHits}</div>
          <div className="text-sm text-gray-400">Perfect strikes</div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="text-pink-400" size={20} />
            <span className="text-white font-semibold">Survivability</span>
          </div>
          <div className="text-2xl font-bold text-pink-400">
            {combatStats.totalFights > 0 ? Math.round((1 - combatStats.damageTaken / combatStats.damageDealt) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-400">Damage ratio</div>
        </div>
      </div>

      {/* Equipped Weapon */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Currently Equipped</h3>
        {weapons.filter(w => w.equipped).map(weapon => (
          <div key={weapon.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getWeaponIcon(weapon.type)}
                <div>
                  <h4 className="font-semibold text-white">{weapon.name}</h4>
                  <p className="text-sm text-blue-200">{weapon.type} Weapon</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Mastery</div>
                <div className="text-lg font-bold text-white">{weapon.mastery}%</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-400">Damage:</span>
                <div className="text-white">{weapon.damage}</div>
              </div>
              <div>
                <span className="text-gray-400">Range:</span>
                <div className="text-white">{weapon.range}</div>
              </div>
            </div>
            
            <div className="mb-3">
              <span className="text-gray-400 text-sm">Properties:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {weapon.properties.map(prop => (
                  <span key={prop} className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                    {prop}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Weapon Mastery</span>
                <span className="text-white">{weapon.mastery}/{weapon.maxMastery}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${getMasteryColor(weapon.mastery, weapon.maxMastery)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${(weapon.mastery / weapon.maxMastery) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeapons = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weapons.map(weapon => (
          <div
            key={weapon.id}
            className={`bg-white/10 rounded-lg p-4 border border-white/20 cursor-pointer transition-all hover:border-blue-400/50 ${
              weapon.equipped ? 'ring-2 ring-green-400' : ''
            }`}
            onClick={() => setSelectedWeapon(weapon)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getWeaponIcon(weapon.type)}
                <div>
                  <h3 className="font-semibold text-white">{weapon.name}</h3>
                  <p className="text-sm text-blue-200">{weapon.type}</p>
                </div>
              </div>
              {weapon.equipped && (
                <span className="text-xs px-2 py-1 bg-green-600/20 text-green-300 rounded">
                  Equipped
                </span>
              )}
            </div>
            
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Damage:</span>
                <span className="text-white">{weapon.damage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Range:</span>
                <span className="text-white">{weapon.range}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Mastery</span>
                <span className="text-white">{weapon.mastery}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${getMasteryColor(weapon.mastery, weapon.maxMastery)} h-2 rounded-full`}
                  style={{ width: `${(weapon.mastery / weapon.maxMastery) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              {!weapon.equipped && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEquipWeapon?.(weapon.id); }}
                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors"
                >
                  Equip
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onStartTraining?.(`weapon-${weapon.id}`); }}
                className="flex-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors"
              >
                Train
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTechniques = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {combatTechniques.map(technique => (
          <div
            key={technique.id}
            className={`bg-white/10 rounded-lg p-4 border border-white/20 ${
              !technique.learned ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getTechniqueIcon(technique.type)}
                <h3 className="font-semibold text-white">{technique.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                {technique.learned ? (
                  <span className="text-xs px-2 py-1 bg-green-600/20 text-green-300 rounded">
                    Learned
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-gray-600/20 text-gray-300 rounded">
                    Locked
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  technique.type === 'offensive' ? 'bg-red-600/20 text-red-300' :
                  technique.type === 'defensive' ? 'bg-blue-600/20 text-blue-300' :
                  'bg-yellow-600/20 text-yellow-300'
                }`}>
                  {technique.type}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-blue-200 mb-3">{technique.description}</p>
            
            {technique.cooldown > 0 && (
              <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                <Clock size={12} />
                <span>Cooldown: {technique.cooldown} rounds</span>
              </div>
            )}
            
            <div className="text-xs text-gray-400 mb-3">
              Requirements: {technique.requirements.join(', ')}
            </div>
            
            {!technique.learned && (
              <button
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors"
                onClick={() => onStartTraining?.(`technique-${technique.id}`)}
              >
                Learn Technique
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6">
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Combat Training</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-3">
              <Sword className="text-red-400" size={20} />
              <h4 className="font-semibold text-white">Weapon Training</h4>
            </div>
            <p className="text-sm text-blue-200 mb-4">
              Improve your mastery with specific weapons through focused practice.
            </p>
            <button 
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
              onClick={() => onStartTraining?.('weapon-training')}
            >
              Start Training
            </button>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="text-green-400" size={20} />
              <h4 className="font-semibold text-white">Accuracy Practice</h4>
            </div>
            <p className="text-sm text-blue-200 mb-4">
              Enhance your precision and critical hit chance through target practice.
            </p>
            <button 
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
              onClick={() => onStartTraining?.('accuracy-training')}
            >
              Start Training
            </button>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="text-blue-400" size={20} />
              <h4 className="font-semibold text-white">Defense Training</h4>
            </div>
            <p className="text-sm text-blue-200 mb-4">
              Learn to better avoid and mitigate incoming damage.
            </p>
            <button 
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              onClick={() => onStartTraining?.('defense-training')}
            >
              Start Training
            </button>
          </div>
        </div>
      </div>

      {/* Training Progress */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Current Training</h3>
        
        <div className="space-y-4">
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Sword Mastery Training</span>
              <span className="text-sm text-blue-300">In Progress</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: '67%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress: 67%</span>
              <span>Est. 2 hours remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Combat History</h3>
        
        <div className="space-y-3">
          {recentCombats.map(combat => (
            <div key={combat.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    combat.result === 'Victory' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-semibold text-white">{combat.enemy}</span>
                </div>
                <span className="text-xs text-gray-400">{combat.date}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Result:</span>
                  <div className={`font-semibold ${
                    combat.result === 'Victory' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {combat.result}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <div className="text-white">{combat.duration}</div>
                </div>
                <div>
                  <span className="text-gray-400">Experience:</span>
                  <div className="text-yellow-400">{combat.experience} XP</div>
                </div>
                <div>
                  <span className="text-gray-400">Loot:</span>
                  <div className="text-blue-300">
                    {combat.loot.length > 0 ? combat.loot.join(', ') : 'None'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Sword size={48} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Combat Training Awaits</h2>
          <p className="text-blue-200">Create a character to access combat systems</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-red-900/20 to-orange-900/20">
      {/* Header */}
      <div className="bg-black/30 border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sword className="text-red-400" size={24} />
            <div>
              <h1 className="text-xl font-bold text-white">Combat System</h1>
              <p className="text-blue-200 text-sm">
                {character?.name || 'Warrior'} - Level {character?.level || 1} {character?.class || 'Fighter'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Award className="text-yellow-400" size={16} />
              <span className="text-blue-200">Win Rate: {winRate}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="text-orange-400" size={16} />
              <span className="text-blue-200">Crits: {combatStats.criticalHits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/20 border-b border-white/20 p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: <Eye size={18} /> },
            { key: 'weapons', label: 'Weapons', icon: <Sword size={18} /> },
            { key: 'techniques', label: 'Techniques', icon: <Target size={18} /> },
            { key: 'training', label: 'Training', icon: <TrendingUp size={18} /> },
            { key: 'history', label: 'History', icon: <Book size={18} /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white'
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'weapons' && renderWeapons()}
        {activeTab === 'techniques' && renderTechniques()}
        {activeTab === 'training' && renderTraining()}
        {activeTab === 'history' && renderHistory()}
      </div>
    </div>
  );
};

export default EnhancedCombatSystem; 