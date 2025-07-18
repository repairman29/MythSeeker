import React, { useState, useEffect } from 'react';
import { CharacterProgression } from './CharacterProgression';
import { SkillTreeVisualization, createSampleSkillTrees } from './SkillTreeVisualization';
import { FeatSelection } from './FeatSelection';
import { 
  CharacterProgression as ProgressionData,
  DND5E_CLASSES,
  AbilityScore 
} from '../types/characterProgression';
import { TrendingUp, User, Zap, Star, ArrowLeft } from 'lucide-react';

interface ProgressionDemoProps {
  onBack?: () => void;
}

export const ProgressionDemo: React.FC<ProgressionDemoProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'skilltrees' | 'feats'>('overview');
  const [demoProgression, setDemoProgression] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDemoData();
  }, []);

  const initializeDemoData = async () => {
    try {
      setLoading(true);
      
      // Create mock demo character progression (no Firebase needed)
      const demoCharacter = DND5E_CLASSES.fighter;
      const mockProgression: ProgressionData = {
        id: 'demo-character',
        characterId: 'demo-character',
        class: demoCharacter,
        level: 3,
        experience: {
          current: 2000,
          total: 2000,
          level: 3,
          nextLevelXP: 2700,
          sources: [
            {
              id: 'demo-1',
              type: 'combat',
              amount: 800,
              description: 'Defeated goblin warband',
              timestamp: new Date(Date.now() - 86400000) // Yesterday
            },
            {
              id: 'demo-2',
              type: 'roleplay',
              amount: 600,
              description: 'Negotiated peace treaty',
              timestamp: new Date(Date.now() - 172800000) // 2 days ago
            },
            {
              id: 'demo-3',
              type: 'quest',
              amount: 600,
              description: 'Completed village rescue mission',
              timestamp: new Date(Date.now() - 259200000) // 3 days ago
            }
          ]
        },
        abilityScores: {
          strength: { base: 16, racial: 0, improvement: 1, equipment: 0, temporary: 0, total: 17 },
          dexterity: { base: 13, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 13 },
          constitution: { base: 15, racial: 0, improvement: 1, equipment: 0, temporary: 0, total: 16 },
          intelligence: { base: 10, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 10 },
          wisdom: { base: 12, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 12 },
          charisma: { base: 8, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 8 }
        },
        hitPoints: {
          max: 32,
          current: 32,
          temporary: 0
        },
        classFeatures: [
          'fighting_style_defense',
          'second_wind',
          'action_surge'
        ],
        feats: [
          {
            id: 'great-weapon-master',
            name: 'Great Weapon Master',
            description: '+10 damage with -5 attack penalty option',
            prerequisites: [],
            benefits: ['+10 damage option', 'Bonus attack on crit/kill']
          }
        ],
        skillTreeProgress: {
          'fighter_combat_mastery': {
            treeId: 'fighter_combat_mastery',
            purchasedNodes: ['basic_attack', 'power_strike'],
            availablePoints: 3,
            totalPointsSpent: 2
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setDemoProgression(mockProgression);
    } catch (error) {
      console.error('Error initializing demo data:', error);
      // Still set some basic demo data even if there's an error
      setDemoProgression({
        id: 'demo-character',
        characterId: 'demo-character',
        class: DND5E_CLASSES.fighter,
        level: 3,
        experience: { current: 2000, total: 2000, level: 3, nextLevelXP: 2700, sources: [] },
        abilityScores: {
          strength: { base: 16, racial: 0, improvement: 1, equipment: 0, temporary: 0, total: 17 },
          dexterity: { base: 13, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 13 },
          constitution: { base: 15, racial: 0, improvement: 1, equipment: 0, temporary: 0, total: 16 },
          intelligence: { base: 10, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 10 },
          wisdom: { base: 12, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 12 },
          charisma: { base: 8, racial: 0, improvement: 0, equipment: 0, temporary: 0, total: 8 }
        },
        hitPoints: { max: 32, current: 32, temporary: 0 },
        classFeatures: [],
        feats: [],
        skillTreeProgress: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExperience = async (amount: number, type: string, description: string) => {
    if (!demoProgression) return;

    try {
      // Mock experience addition without Firebase
      const newSource = {
        id: `demo-${Date.now()}`,
        type: type as any,
        amount,
        description,
        timestamp: new Date()
      };

      const updatedProgression = {
        ...demoProgression,
        experience: {
          ...demoProgression.experience,
          current: demoProgression.experience.current + amount,
          total: demoProgression.experience.total + amount,
          sources: [...demoProgression.experience.sources, newSource]
        }
      };

      setDemoProgression(updatedProgression);
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const handleSkillTreeNodePurchase = (nodeId: string) => {
    if (!demoProgression) return;

    // Update the demo progression locally for immediate feedback
    const treeProgress = demoProgression.skillTreeProgress['fighter_combat_mastery'];
    if (treeProgress) {
      treeProgress.purchasedNodes.push(nodeId);
      treeProgress.availablePoints -= 1; // Assuming 1 point cost for demo
      treeProgress.totalPointsSpent += 1;
      
      setDemoProgression({ ...demoProgression });
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Character Progression',
      icon: <User size={20} />,
      description: 'Experience, levels, and ability scores'
    },
    {
      id: 'skilltrees',
      label: 'Skill Trees',
      icon: <Zap size={20} />,
      description: 'Unlock powerful abilities'
    },
    {
      id: 'feats',
      label: 'Feat Selection',
      icon: <Star size={20} />,
      description: 'Choose character feats'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Character Progression...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Character Progression System</h1>
                  <p className="text-blue-200">Sprint 2 - Character Advancement Demo</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-blue-200">Demo Character</p>
              <p className="text-lg font-semibold text-white">
                {demoProgression?.class.name} Level {demoProgression?.level}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white border-b-2 border-purple-400'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && demoProgression && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <CharacterProgression
              characterId="demo-character"
              progressionData={demoProgression}
              onProgressionUpdate={(progression) => {
                setDemoProgression(progression);
              }}
            />
          </div>
        )}

        {activeTab === 'skilltrees' && demoProgression && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Fighter Skill Trees</h2>
              <p className="text-blue-200 mb-6">
                Unlock powerful combat abilities by spending skill tree points earned through leveling up.
              </p>
              
              {createSampleSkillTrees().map(skillTree => (
                <div key={skillTree.id} className="mb-8">
                  <SkillTreeVisualization
                    skillTree={skillTree}
                    progression={demoProgression}
                    onNodePurchase={handleSkillTreeNodePurchase}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'feats' && demoProgression && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Feat Selection</h2>
            <p className="text-blue-200 mb-6">
              Choose feats to customize your character's abilities at certain levels.
            </p>
            
            <FeatSelection
              progression={demoProgression}
              onFeatSelect={(featId) => {
                console.log('Selected feat:', featId);
                // In a real implementation, this would apply the feat
              }}
              selectedFeats={demoProgression.feats}
              maxSelections={1}
            />
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h3 className="text-xl font-bold text-white mb-6">Sprint 2 Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h4 className="font-semibold text-white">Experience System</h4>
              </div>
              <p className="text-blue-200 text-sm">
                Comprehensive XP tracking with multiple sources: combat, roleplay, discovery, and quest completion.
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
                <h4 className="font-semibold text-white">Skill Trees</h4>
              </div>
              <p className="text-blue-200 text-sm">
                Interactive skill trees with node dependencies, visual connections, and progression tracking.
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-3">
                <Star className="w-6 h-6 text-yellow-400" />
                <h4 className="font-semibold text-white">Feat System</h4>
              </div>
              <p className="text-blue-200 text-sm">
                D&D 5e compatible feat selection with prerequisites, search functionality, and detailed descriptions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressionDemo; 