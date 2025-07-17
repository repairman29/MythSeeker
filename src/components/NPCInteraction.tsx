import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingCart, Gift, Users, Heart, Star, X, ChevronRight, ChevronLeft, Brain, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { NPC, NPCMemory, NPCEmotionalState } from '../types/npc';

export interface DialogueOption {
  id: string;
  text: string;
  nextDialogueId?: string;
  action?: 'quest' | 'trade' | 'gift' | 'relationship' | 'exit';
  questId?: string;
  itemId?: string;
  relationshipChange?: number;
  emotionalImpact?: {
    joy?: number;
    anger?: number;
    fear?: number;
    trust?: number;
    respect?: number;
  };
  requirements?: {
    level?: number;
    reputation?: number;
    items?: Array<{ name: string; quantity: number }>;
    completedQuests?: string[];
  };
}

export interface DialogueNode {
  id: string;
  npcText: string;
  options: DialogueOption[];
  mood?: 'friendly' | 'neutral' | 'hostile' | 'sad' | 'excited' | 'anxious' | 'confident' | 'suspicious';
  conditions?: {
    relationship?: number;
    completedQuests?: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    emotionalState?: {
      joy?: number;
      anger?: number;
      fear?: number;
      trust?: number;
      respect?: number;
    };
  };
}

interface NPCInteractionProps {
  npc: NPC;
  onClose: () => void;
  onTrade?: (npcId: string, itemId: string, quantity: number) => void;
  onAcceptQuest?: (questId: string) => void;
  onGiveGift?: (npcId: string, itemId: string) => void;
  onUpdateNPC?: (npcId: string, updates: Partial<NPC>) => void;
  playerLevel?: number;
  playerReputation?: number;
  playerInventory?: Array<{ name: string; quantity: number }>;
  completedQuests?: string[];
}

const NPCInteraction: React.FC<NPCInteractionProps> = ({
  npc,
  onClose,
  onTrade,
  onAcceptQuest,
  onGiveGift,
  onUpdateNPC,
  playerLevel = 1,
  playerReputation = 0,
  playerInventory = [],
  completedQuests = []
}) => {
  const [currentDialogueId, setCurrentDialogueId] = useState('greeting');
  const [interactionMode, setInteractionMode] = useState<'dialogue' | 'trade' | 'quests' | 'memory' | 'emotions'>('dialogue');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [showEmotionalDetails, setShowEmotionalDetails] = useState(false);

  const currentDialogue = npc.dialogue.find(d => d.id === currentDialogueId) || npc.dialogue[0];

  const getRelationshipColor = (relationship: number) => {
    if (relationship >= 50) return 'text-green-400';
    if (relationship >= 20) return 'text-blue-400';
    if (relationship >= -20) return 'text-yellow-400';
    if (relationship >= -50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRelationshipText = (relationship: number) => {
    if (relationship >= 80) return 'Beloved';
    if (relationship >= 50) return 'Friendly';
    if (relationship >= 20) return 'Acquainted';
    if (relationship >= -20) return 'Neutral';
    if (relationship >= -50) return 'Unfriendly';
    return 'Hostile';
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'friendly': return <Heart className="text-green-400" size={20} />;
      case 'excited': return <Star className="text-yellow-400" size={20} />;
      case 'sad': return <Heart className="text-blue-400" size={20} />;
      case 'hostile': return <X className="text-red-400" size={20} />;
      case 'anxious': return <TrendingDown className="text-orange-400" size={20} />;
      case 'confident': return <TrendingUp className="text-purple-400" size={20} />;
      case 'suspicious': return <X className="text-yellow-400" size={20} />;
      default: return <Users className="text-gray-400" size={20} />;
    }
  };

  const getEmotionalColor = (value: number) => {
    if (value >= 50) return 'text-green-400';
    if (value >= 20) return 'text-blue-400';
    if (value >= -20) return 'text-yellow-400';
    if (value >= -50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getEmotionalBarColor = (value: number) => {
    if (value >= 50) return 'bg-green-500';
    if (value >= 20) return 'bg-blue-500';
    if (value >= -20) return 'bg-yellow-500';
    if (value >= -50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const canSelectOption = (option: DialogueOption): boolean => {
    if (!option.requirements) return true;
    
    const { level, reputation, items, completedQuests } = option.requirements;
    
    if (level && playerLevel < level) return false;
    if (reputation && playerReputation < reputation) return false;
    
    if (items) {
      for (const requiredItem of items) {
        const playerItem = playerInventory.find(item => item.name === requiredItem.name);
        if (!playerItem || playerItem.quantity < requiredItem.quantity) return false;
      }
    }
    
    if (completedQuests) {
      for (const questId of completedQuests) {
        if (!completedQuests.includes(questId)) return false;
      }
    }
    
    return true;
  };

  const handleDialogueOption = (option: DialogueOption) => {
    // Update NPC emotional state and relationship
    if (option.emotionalImpact || option.relationshipChange) {
      const updatedEmotionalState = { ...npc.emotionalState };
      const updatedRelationship = npc.relationship + (option.relationshipChange || 0);

      if (option.emotionalImpact) {
        const mutableEmotionalState: any = { ...updatedEmotionalState };
        (Object.entries(option.emotionalImpact) as [keyof NPCEmotionalState, unknown][]).forEach(([emotion, change]: [string, unknown]) => {
          if (["joy", "anger", "fear", "trust", "respect"].includes(emotion)) {
            const current = typeof mutableEmotionalState[emotion] === 'number' ? mutableEmotionalState[emotion] : 0;
            const delta = typeof change === 'number' ? change : Number(change) || 0;
            mutableEmotionalState[emotion] = Math.max(-100, Math.min(100, current + delta));
          }
        });
        Object.assign(updatedEmotionalState, mutableEmotionalState);
      }

      // Update current mood based on emotional state
      updatedEmotionalState.currentMood = calculateCurrentMood(updatedEmotionalState);
      updatedEmotionalState.lastMoodChange = new Date();

      // Add to interaction history
      const interactionRecord = {
        timestamp: new Date(),
        playerAction: option.text,
        npcResponse: currentDialogue.npcText,
        relationshipChange: option.relationshipChange || 0,
        emotionalImpact: option.emotionalImpact || {
          joy: 0,
          anger: 0,
          fear: 0,
          trust: 0,
          respect: 0,
          currentMood: 'neutral' as const,
          moodIntensity: 0,
          lastMoodChange: new Date(),
          stressLevel: 0,
          confidence: 0
        } as NPCEmotionalState,
      };

      // Add memory
      const memory: NPCMemory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'conversation',
        description: `Player said: "${option.text}"`,
        emotionalImpact: {
          joy: option.emotionalImpact?.joy ?? 0,
          anger: option.emotionalImpact?.anger ?? 0,
          fear: option.emotionalImpact?.fear ?? 0,
          trust: option.emotionalImpact?.trust ?? 0,
          respect: option.emotionalImpact?.respect ?? 0
        },
        relationshipChange: option.relationshipChange || 0,
        context: currentDialogue.npcText
      };

      const updatedNPC: Partial<NPC> = {
        relationship: updatedRelationship,
        emotionalState: updatedEmotionalState,
        interactionHistory: [...npc.interactionHistory, interactionRecord],
        memories: [...npc.memories, memory]
      };

      if (onUpdateNPC) {
        onUpdateNPC(npc.id, updatedNPC);
      }
    }

    switch (option.action) {
      case 'quest':
        if (option.questId && onAcceptQuest) {
          onAcceptQuest(option.questId);
        }
        break;
      case 'trade':
        setInteractionMode('trade');
        break;
      case 'gift':
        if (option.itemId && onGiveGift) {
          onGiveGift(npc.id, option.itemId);
        }
        break;
      case 'exit':
        onClose();
        return;
    }

    if (option.nextDialogueId) {
      setCurrentDialogueId(option.nextDialogueId);
    }
  };

  const calculateCurrentMood = (emotionalState: NPCEmotionalState): NPCEmotionalState['currentMood'] => {
    const { joy, anger, fear, trust, respect } = emotionalState;
    
    if (joy > 50 && trust > 30) return 'friendly';
    if (joy > 70) return 'excited';
    if (anger > 50) return 'hostile';
    if (fear > 50) return 'anxious';
    if (respect > 50 && trust > 20) return 'confident';
    if (trust < -30) return 'suspicious';
    if (joy < -30) return 'sad';
    return 'neutral';
  };

  const handleTrade = () => {
    if (selectedItem && onTrade) {
      onTrade(npc.id, selectedItem, tradeQuantity);
      setSelectedItem(null);
      setTradeQuantity(1);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 rounded-t-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {npc.avatar || npc.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{npc.name}</h2>
              {npc.title && <p className="text-blue-200 text-sm">{npc.title}</p>}
              <div className="flex items-center space-x-2 text-sm">
                <span className={getRelationshipColor(npc.relationship)}>
                  {getRelationshipText(npc.relationship)}
                </span>
                {getMoodIcon(npc.emotionalState.currentMood)}
                <span className="text-gray-400">
                  {npc.emotionalState.currentMood}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setInteractionMode('dialogue')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                interactionMode === 'dialogue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <MessageCircle size={16} />
            </button>
            {npc.type === 'merchant' && (
              <button
                onClick={() => setInteractionMode('trade')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  interactionMode === 'trade'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ShoppingCart size={16} />
              </button>
            )}
            {npc.quests && npc.quests.length > 0 && (
              <button
                onClick={() => setInteractionMode('quests')}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  interactionMode === 'quests'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Gift size={16} />
              </button>
            )}
            <button
              onClick={() => setInteractionMode('emotions')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                interactionMode === 'emotions'
                  ? 'bg-pink-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Heart size={16} />
            </button>
            <button
              onClick={() => setInteractionMode('memory')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                interactionMode === 'memory'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Brain size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-red-600 text-white hover:bg-red-700 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {interactionMode === 'dialogue' && (
            <div className="space-y-4">
              {/* NPC Dialogue */}
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/90 text-lg leading-relaxed">{currentDialogue.npcText}</p>
              </div>

              {/* Dialogue Options */}
              <div className="space-y-2">
                {currentDialogue.options.map((option: DialogueOption) => (
                  <button
                    key={option.id}
                    onClick={() => handleDialogueOption(option)}
                    disabled={!canSelectOption(option)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      canSelectOption(option)
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.text}</span>
                      <div className="flex items-center space-x-2">
                        {option.relationshipChange && (
                          <span className={`text-xs ${option.relationshipChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {option.relationshipChange > 0 ? '+' : ''}{option.relationshipChange}
                          </span>
                        )}
                        {option.emotionalImpact && (
                          <div className="flex space-x-1">
                            {Object.entries(option.emotionalImpact || {}).map(([emotion, change]: [string, unknown]) => (
                              <span key={emotion} className={`text-xs ${Number(change) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {emotion}: {Number(change) > 0 ? '+' : ''}{Number(change)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {interactionMode === 'emotions' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Emotional State</h3>
              
              {/* Current Mood */}
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {getMoodIcon(npc.emotionalState.currentMood)}
                  <span className="text-white font-semibold">
                    {npc.emotionalState.currentMood.charAt(0).toUpperCase() + npc.emotionalState.currentMood.slice(1)}
                  </span>
                  <span className="text-gray-400">
                    Intensity: {npc.emotionalState.moodIntensity}/10
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Stress Level</span>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${npc.emotionalState.stressLevel > 7 ? 'bg-red-500' : npc.emotionalState.stressLevel > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${(npc.emotionalState.stressLevel / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Confidence</span>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${npc.emotionalState.confidence > 7 ? 'bg-green-500' : npc.emotionalState.confidence > 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${(npc.emotionalState.confidence / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emotional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  joy: npc.emotionalState.joy,
                  anger: npc.emotionalState.anger,
                  fear: npc.emotionalState.fear,
                  trust: npc.emotionalState.trust,
                  respect: npc.emotionalState.respect
                }).map(([emotion, value]) => (
                  <div key={emotion} className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-semibold ${getEmotionalColor(value)} capitalize`}>
                        {emotion}
                      </span>
                      <span className={`text-sm ${getEmotionalColor(value)}`}>
                        {value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getEmotionalBarColor(value)}`}
                        style={{ width: `${((value + 100) / 200) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Personality Traits */}
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Personality Traits</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(npc.personalityTraits).map(([trait, value]) => (
                    <div key={trait} className="text-center">
                      <div className="text-xs text-gray-400 capitalize mb-1">{trait}</div>
                      <div className="text-lg font-bold text-white">{value}/10</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {interactionMode === 'memory' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Memories & History</h3>
              
              {/* Recent Memories */}
              <div className="space-y-3">
                {npc.memories.slice(-5).reverse().map((memory) => (
                  <div key={memory.id} className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-medium">{memory.description}</span>
                      <span className="text-gray-400 text-sm">{formatTimeAgo(memory.timestamp)}</span>
                    </div>
                    <div className="text-gray-300 text-sm mb-2">{memory.context}</div>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={`${memory.relationshipChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Relationship: {memory.relationshipChange > 0 ? '+' : ''}{memory.relationshipChange}
                      </span>
                      <div className="flex space-x-2">
                        {Object.entries(memory.emotionalImpact).map(([emotion, impact]) => (
                          <span key={emotion} className={`${impact > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {emotion}: {impact > 0 ? '+' : ''}{impact}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interaction History */}
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Recent Interactions</h4>
                <div className="space-y-2">
                  {npc.interactionHistory.slice(-3).reverse().map((interaction, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-white">{interaction.playerAction}</span>
                        <span className="text-gray-400">{formatTimeAgo(interaction.timestamp)}</span>
                      </div>
                      <div className="text-gray-300 text-xs ml-2">{interaction.npcResponse}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {interactionMode === 'trade' && npc.inventory && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Trade with {npc.name}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NPC Inventory */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Available Items</h4>
                  <div className="space-y-2">
                    {npc.inventory.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedItem === item.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-300">{item.rarity}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{item.price} gold</div>
                            <div className="text-sm text-gray-300">Qty: {item.quantity}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trade Controls */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Trade Details</h4>
                  {selectedItem && (
                    <div className="bg-white/10 rounded-lg p-4 space-y-4">
                      <div>
                        <label className="text-white text-sm">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={tradeQuantity}
                          onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                          className="w-full mt-1 p-2 bg-white/20 text-white rounded border border-white/30"
                        />
                      </div>
                      <button
                        onClick={handleTrade}
                        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                      >
                        Complete Trade
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {interactionMode === 'quests' && npc.quests && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Available Quests</h3>
              
              <div className="space-y-3">
                {npc.quests.map(questId => (
                  <div key={questId} className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Quest #{questId}</h4>
                    <p className="text-gray-300 mb-3">Quest description would go here...</p>
                    <button
                      onClick={() => onAcceptQuest?.(questId)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all"
                    >
                      Accept Quest
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NPCInteraction; 