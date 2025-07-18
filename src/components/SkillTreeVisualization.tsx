import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SkillTree, SkillNode, CharacterProgression } from '../types/characterProgression';
import { characterProgressionService } from '../services/characterProgressionService';

interface SkillTreeVisualizationProps {
  skillTree: SkillTree;
  progression: CharacterProgression;
  onNodePurchase?: (nodeId: string) => void;
}

export const SkillTreeVisualization: React.FC<SkillTreeVisualizationProps> = ({
  skillTree,
  progression,
  onNodePurchase
}) => {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const treeProgress = progression.skillTreeProgress[skillTree.id] || {
    unlockedNodes: [],
    purchasedNodes: [],
    availablePoints: 0,
    totalPointsSpent: 0
  };

  // Calculate node states
  const nodeStates = useMemo(() => {
    const states: { [nodeId: string]: 'locked' | 'available' | 'purchased' } = {};
    
    skillTree.nodes.forEach(node => {
      if (treeProgress.purchasedNodes.includes(node.id)) {
        states[node.id] = 'purchased';
      } else {
        // Check prerequisites
        const hasPrerequisites = node.prerequisites.every(prereq => 
          treeProgress.purchasedNodes.includes(prereq)
        );
        
        if (hasPrerequisites || node.prerequisites.length === 0) {
          states[node.id] = 'available';
        } else {
          states[node.id] = 'locked';
        }
      }
    });
    
    return states;
  }, [skillTree.nodes, treeProgress.purchasedNodes]);

  // Group nodes by tier
  const nodesByTier = useMemo(() => {
    const tiers: { [tier: number]: SkillNode[] } = {};
    
    skillTree.nodes.forEach(node => {
      if (!tiers[node.tier]) {
        tiers[node.tier] = [];
      }
      tiers[node.tier].push(node);
    });
    
    return tiers;
  }, [skillTree.nodes]);

  const handleNodeClick = (node: SkillNode) => {
    if (nodeStates[node.id] === 'available' && treeProgress.availablePoints >= node.cost) {
      setSelectedNode(node);
    }
  };

  const handlePurchaseConfirm = async () => {
    if (selectedNode && onNodePurchase) {
      onNodePurchase(selectedNode.id);
      setSelectedNode(null);
    }
  };

  const getNodeColor = (nodeId: string, tier: number) => {
    const state = nodeStates[nodeId];
    const isHovered = hoveredNode === nodeId;
    
    switch (state) {
      case 'purchased':
        return isHovered ? '#10B981' : '#059669'; // Green
      case 'available':
        return isHovered ? '#8B5CF6' : '#7C3AED'; // Purple
      case 'locked':
      default:
        return isHovered ? '#6B7280' : '#9CA3AF'; // Gray
    }
  };

  const getConnectionColor = (fromNodeId: string, toNodeId: string) => {
    const fromState = nodeStates[fromNodeId];
    const toState = nodeStates[toNodeId];
    
    if (fromState === 'purchased' && toState !== 'locked') {
      return '#8B5CF6'; // Purple for active paths
    } else if (fromState === 'purchased') {
      return '#D1D5DB'; // Light gray for potential paths
    } else {
      return '#F3F4F6'; // Very light gray for inactive paths
    }
  };

  const renderConnections = () => {
    return skillTree.layout.connections.map((connection, index) => {
      const fromNode = skillTree.nodes.find(n => n.id === connection.from);
      const toNode = skillTree.nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;
      
      const fromX = fromNode.position.x;
      const fromY = fromNode.position.y;
      const toX = toNode.position.x;
      const toY = toNode.position.y;
      
      return (
        <line
          key={index}
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={getConnectionColor(connection.from, connection.to)}
          strokeWidth="2"
          className="transition-colors duration-200"
        />
      );
    });
  };

  const renderNodes = () => {
    return skillTree.nodes.map(node => {
      const state = nodeStates[node.id];
      const canAfford = treeProgress.availablePoints >= node.cost;
      
      return (
        <g key={node.id}>
          {/* Node Circle */}
          <circle
            cx={node.position.x}
            cy={node.position.y}
            r="25"
            fill={getNodeColor(node.id, node.tier)}
            stroke="#FFFFFF"
            strokeWidth="3"
            className="cursor-pointer transition-all duration-200"
            onClick={() => handleNodeClick(node)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              filter: state === 'locked' ? 'grayscale(100%)' : 'none',
              opacity: state === 'available' && !canAfford ? 0.6 : 1
            }}
          />
          
          {/* Node Icon/Text */}
          <text
            x={node.position.x}
            y={node.position.y + 5}
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            {node.icon || node.name.charAt(0)}
          </text>
          
          {/* Cost indicator */}
          {state !== 'purchased' && (
            <text
              x={node.position.x}
              y={node.position.y + 40}
              textAnchor="middle"
              fill="#6B7280"
              fontSize="10"
              fontWeight="medium"
              className="pointer-events-none select-none"
            >
              {node.cost}
            </text>
          )}
          
          {/* Purchased checkmark */}
          {state === 'purchased' && (
            <text
              x={node.position.x + 20}
              y={node.position.y - 15}
              textAnchor="middle"
              fill="#10B981"
              fontSize="16"
              className="pointer-events-none select-none"
            >
              ✓
            </text>
          )}
        </g>
      );
    });
  };

  const renderTierLabels = () => {
    return Object.keys(nodesByTier).map(tier => {
      const tierNum = parseInt(tier);
      const nodes = nodesByTier[tierNum];
      const minY = Math.min(...nodes.map(n => n.position.y));
      
      return (
        <text
          key={tier}
          x="20"
          y={minY}
          fill="#6B7280"
          fontSize="14"
          fontWeight="bold"
          className="select-none"
        >
          Tier {tierNum}
        </text>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{skillTree.name}</h3>
          <p className="text-gray-600">{skillTree.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Available Points</p>
          <p className="text-2xl font-bold text-purple-600">
            {treeProgress.availablePoints}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex space-x-6 mb-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          <span className="text-gray-600">Locked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-purple-600"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-600"></div>
          <span className="text-gray-600">Purchased</span>
        </div>
      </div>

      {/* Skill Tree SVG */}
      <div className="relative overflow-x-auto">
        <svg
          ref={svgRef}
          width="800"
          height="600"
          viewBox="0 0 800 600"
          className="border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50"
        >
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Tier labels */}
          {renderTierLabels()}
          
          {/* Connections */}
          {renderConnections()}
          
          {/* Nodes */}
          {renderNodes()}
        </svg>
      </div>

      {/* Node Details Panel */}
      {hoveredNode && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {(() => {
            const node = skillTree.nodes.find(n => n.id === hoveredNode);
            if (!node) return null;
            
            const state = nodeStates[node.id];
            const canAfford = treeProgress.availablePoints >= node.cost;
            
            return (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800">{node.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    state === 'purchased' ? 'bg-green-100 text-green-800' :
                    state === 'available' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {state === 'purchased' ? 'Owned' : 
                     state === 'available' ? `${node.cost} points` : 'Locked'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{node.description}</p>
                
                {node.effects.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Effects:</p>
                    {node.effects.map((effect, index) => (
                      <p key={index} className="text-xs text-gray-600">
                        • {effect.description}
                      </p>
                    ))}
                  </div>
                )}
                
                {node.prerequisites.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-1">Prerequisites:</p>
                    <div className="flex flex-wrap gap-1">
                      {node.prerequisites.map(prereq => {
                        const prereqNode = skillTree.nodes.find(n => n.id === prereq);
                        const isMetNode = treeProgress.purchasedNodes.includes(prereq);
                        return (
                          <span
                            key={prereq}
                            className={`px-2 py-1 rounded text-xs ${
                              isMetNode ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {prereqNode?.name || prereq}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Purchase Skill Node</h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800">{selectedNode.name}</h4>
              <p className="text-gray-600 text-sm mt-1">{selectedNode.description}</p>
              
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Cost:</span> {selectedNode.cost} points
                </p>
                <p className="text-sm">
                  <span className="font-medium">Available:</span> {treeProgress.availablePoints} points
                </p>
                <p className="text-sm">
                  <span className="font-medium">After purchase:</span>{' '}
                  {treeProgress.availablePoints - selectedNode.cost} points
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedNode(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseConfirm}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sample Skill Trees for different classes
export const createSampleSkillTrees = (): SkillTree[] => {
  return [
    {
      id: 'fighter_combat_mastery',
      name: 'Combat Mastery',
      description: 'Advanced martial techniques and weapon expertise',
      classId: 'fighter',
      nodes: [
        {
          id: 'weapon_focus',
          name: 'Weapon Focus',
          description: '+1 attack bonus with chosen weapon type',
          icon: '⚔️',
          type: 'passive',
          tier: 1,
          cost: 1,
          prerequisites: [],
          effects: [
            {
              type: 'stat_increase',
              target: 'attack_bonus',
              value: 1,
              description: '+1 attack bonus with chosen weapon'
            }
          ],
          position: { x: 150, y: 150 },
          unlocked: false,
          purchased: false
        },
        {
          id: 'power_attack',
          name: 'Power Attack',
          description: 'Trade accuracy for devastating damage',
          icon: '💥',
          type: 'ability',
          tier: 2,
          cost: 2,
          prerequisites: ['weapon_focus'],
          effects: [
            {
              type: 'new_ability',
              target: 'power_attack',
              value: 'special_attack',
              description: 'Can take -2 attack for +4 damage'
            }
          ],
          position: { x: 150, y: 250 },
          unlocked: false,
          purchased: false
        },
        {
          id: 'combat_reflexes',
          name: 'Combat Reflexes',
          description: 'Enhanced reaction time in combat',
          icon: '⚡',
          type: 'passive',
          tier: 1,
          cost: 1,
          prerequisites: [],
          effects: [
            {
              type: 'stat_increase',
              target: 'initiative',
              value: 2,
              description: '+2 bonus to initiative rolls'
            }
          ],
          position: { x: 300, y: 150 },
          unlocked: false,
          purchased: false
        },
        {
          id: 'whirlwind_attack',
          name: 'Whirlwind Attack',
          description: 'Attack all adjacent enemies',
          icon: '🌪️',
          type: 'ability',
          tier: 3,
          cost: 3,
          prerequisites: ['power_attack', 'combat_reflexes'],
          effects: [
            {
              type: 'new_ability',
              target: 'whirlwind',
              value: 'area_attack',
              description: 'Attack all enemies within reach'
            }
          ],
          position: { x: 225, y: 350 },
          unlocked: false,
          purchased: false
        }
      ],
      layout: {
        tiers: 3,
        maxNodesPerTier: 4,
        connections: [
          { from: 'weapon_focus', to: 'power_attack', type: 'prerequisite' },
          { from: 'combat_reflexes', to: 'whirlwind_attack', type: 'prerequisite' },
          { from: 'power_attack', to: 'whirlwind_attack', type: 'prerequisite' }
        ]
      }
    },
    {
      id: 'wizard_arcane_mastery',
      name: 'Arcane Mastery',
      description: 'Advanced spellcasting techniques and magical knowledge',
      classId: 'wizard',
      nodes: [
        {
          id: 'spell_focus',
          name: 'Spell Focus',
          description: '+1 to spell save DC for chosen school',
          icon: '🔮',
          type: 'passive',
          tier: 1,
          cost: 1,
          prerequisites: [],
          effects: [
            {
              type: 'stat_increase',
              target: 'spell_dc',
              value: 1,
              description: '+1 spell save DC for chosen school'
            }
          ],
          position: { x: 150, y: 150 },
          unlocked: false,
          purchased: false
        },
        {
          id: 'metamagic_extend',
          name: 'Extend Spell',
          description: 'Double the duration of your spells',
          icon: '⏱️',
          type: 'ability',
          tier: 2,
          cost: 2,
          prerequisites: ['spell_focus'],
          effects: [
            {
              type: 'new_ability',
              target: 'extend_spell',
              value: 'metamagic',
              description: 'Double spell duration (uses spell slot +1 level)'
            }
          ],
          position: { x: 150, y: 250 },
          unlocked: false,
          purchased: false
        }
      ],
      layout: {
        tiers: 3,
        maxNodesPerTier: 4,
        connections: [
          { from: 'spell_focus', to: 'metamagic_extend', type: 'prerequisite' }
        ]
      }
    }
  ];
};

export default SkillTreeVisualization; 