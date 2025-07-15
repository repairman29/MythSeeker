import React, { useState } from 'react';
import { MessageCircle, ShoppingCart, Gift, Users, Heart, Star, X, ChevronRight, ChevronLeft } from 'lucide-react';

export interface DialogueOption {
  id: string;
  text: string;
  nextDialogueId?: string;
  action?: 'quest' | 'trade' | 'gift' | 'relationship' | 'exit';
  questId?: string;
  itemId?: string;
  relationshipChange?: number;
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
  mood?: 'friendly' | 'neutral' | 'hostile' | 'sad' | 'excited';
  conditions?: {
    relationship?: number;
    completedQuests?: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export interface NPC {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  type: 'merchant' | 'quest_giver' | 'companion' | 'enemy' | 'neutral';
  personality: string;
  relationship: number; // -100 to 100
  dialogue: DialogueNode[];
  inventory?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    rarity: string;
  }>;
  quests?: string[]; // quest IDs this NPC can give
  location?: string;
  schedule?: {
    morning?: string;
    afternoon?: string;
    evening?: string;
    night?: string;
  };
}

interface NPCInteractionProps {
  npc: NPC;
  onClose: () => void;
  onTrade?: (npcId: string, itemId: string, quantity: number) => void;
  onAcceptQuest?: (questId: string) => void;
  onGiveGift?: (npcId: string, itemId: string) => void;
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
  playerLevel = 1,
  playerReputation = 0,
  playerInventory = [],
  completedQuests = []
}) => {
  const [currentDialogueId, setCurrentDialogueId] = useState('greeting');
  const [interactionMode, setInteractionMode] = useState<'dialogue' | 'trade' | 'quests'>('dialogue');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(1);

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
      default: return <Users className="text-gray-400" size={20} />;
    }
  };

  const canSelectOption = (option: DialogueOption): boolean => {
    if (!option.requirements) return true;

    const { requirements } = option;
    
    if (requirements.level && playerLevel < requirements.level) return false;
    if (requirements.reputation && playerReputation < requirements.reputation) return false;
    
    if (requirements.items) {
      for (const requiredItem of requirements.items) {
        const playerItem = playerInventory.find(item => item.name === requiredItem.name);
        if (!playerItem || playerItem.quantity < requiredItem.quantity) return false;
      }
    }
    
    if (requirements.completedQuests) {
      for (const questId of requirements.completedQuests) {
        if (!completedQuests.includes(questId)) return false;
      }
    }
    
    return true;
  };

  const handleDialogueOption = (option: DialogueOption) => {
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

  const handleTrade = () => {
    if (selectedItem && onTrade) {
      onTrade(npc.id, selectedItem, tradeQuantity);
      setSelectedItem(null);
      setTradeQuantity(1);
    }
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
                {getMoodIcon(currentDialogue?.mood)}
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
                {currentDialogue.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleDialogueOption(option)}
                    disabled={!canSelectOption(option)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      canSelectOption(option)
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.text}</span>
                      <ChevronRight size={16} />
                    </div>
                    {!canSelectOption(option) && option.requirements && (
                      <div className="text-xs text-red-400 mt-1">
                        Requirements not met
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {interactionMode === 'trade' && npc.inventory && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Available Items</h3>
              <div className="grid grid-cols-2 gap-4">
                {npc.inventory.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedItem === item.id
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">{item.name}</h4>
                        <p className="text-blue-200 text-sm">{item.price} gold</p>
                        <p className={`text-xs ${
                          item.rarity === 'common' ? 'text-gray-400' :
                          item.rarity === 'uncommon' ? 'text-green-400' :
                          item.rarity === 'rare' ? 'text-blue-400' :
                          item.rarity === 'epic' ? 'text-purple-400' :
                          'text-yellow-400'
                        }`}>
                          {item.rarity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">x{item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedItem && (
                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Purchase</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-white text-sm">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        value={tradeQuantity}
                        onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 rounded bg-white/20 text-white border border-white/30"
                      />
                    </div>
                    <button
                      onClick={handleTrade}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {interactionMode === 'quests' && npc.quests && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Available Quests</h3>
              <div className="space-y-3">
                {npc.quests.map(questId => (
                  <div key={questId} className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-semibold">Quest: {questId}</h4>
                    <p className="text-white/70 text-sm mb-3">
                      Quest description would go here...
                    </p>
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