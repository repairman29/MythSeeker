/**
 * AI Party Manager Component
 * 
 * Provides AI party member functionality that can be integrated into:
 * - Single-player campaigns
 * - Multiplayer campaigns  
 * - Custom game modes
 * 
 * This component handles AI conversation capabilities independently
 * of the underlying game system architecture.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { unifiedAIService, UnifiedGameContext, UnifiedAIResponse } from '../services/unifiedAIService';
import { AIPartyMember } from '../services/automatedGameService';

interface AIPartyManagerProps {
  gameId: string;
  gameType: 'automated' | 'campaign' | 'multiplayer' | 'single-player';
  realm: string;
  theme: string;
  participants: Array<{
    id: string;
    name: string;
    character?: any;
    isHost?: boolean;
  }>;
  onAIMessage: (message: {
    id: string;
    type: string;
    content: string;
    sender: string;
    timestamp: Date;
    metadata: any;
  }) => void;
  onAIPartyMembersUpdated?: (members: AIPartyMember[]) => void;
  worldState?: any;
  recentMessages?: any[];
  isEnabled?: boolean;
}

interface AIMessage {
  id: string;
  type: string;
  content: string;
  sender: string;
  timestamp: Date;
  metadata: any;
}

export const AIPartyManager: React.FC<AIPartyManagerProps> = ({
  gameId,
  gameType,
  realm,
  theme,
  participants,
  onAIMessage,
  onAIPartyMembersUpdated,
  worldState,
  recentMessages = [],
  isEnabled = true
}) => {
  const [aiPartyMembers, setAIPartyMembers] = useState<AIPartyMember[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPartyPanel, setShowPartyPanel] = useState(false);

  // Initialize AI party members
  useEffect(() => {
    if (isEnabled) {
      initializeAIPartyMembers();
    }
  }, [gameId, isEnabled]);

  const initializeAIPartyMembers = async () => {
    try {
      // Try to load existing AI party members
      const existingMembers = await unifiedAIService.loadAIPartyMembers(gameId);
      
      if (existingMembers && existingMembers.length > 0) {
        setAIPartyMembers(existingMembers);
        onAIPartyMembersUpdated?.(existingMembers);
        return;
      }

      // Generate new AI party members if none exist
      const gameContext: UnifiedGameContext = {
        gameId,
        gameType,
        realm,
        theme,
        participants,
        worldState,
        messages: recentMessages
      };

      const newMembers = await unifiedAIService.generateAIPartyMembersForContext(gameContext);
      setAIPartyMembers(newMembers);
      onAIPartyMembersUpdated?.(newMembers);
      
      // Save for persistence
      await unifiedAIService.saveAIPartyMembers(gameId, newMembers);
      
      console.log(`🎭 AI Party Manager: Initialized ${newMembers.length} AI party members for ${gameType} game`);
    } catch (error) {
      console.error('Error initializing AI party members:', error);
    }
  };

  // Process player input and generate AI responses
  const processPlayerInput = useCallback(async (
    playerId: string,
    playerInput: string
  ): Promise<void> => {
    if (!isEnabled || isProcessing || !aiPartyMembers.length) return;

    setIsProcessing(true);
    try {
      const gameContext: UnifiedGameContext = {
        gameId,
        gameType,
        realm,
        theme,
        participants,
        aiPartyMembers,
        worldState,
        messages: recentMessages
      };

      const unifiedResponse = await unifiedAIService.processPlayerInputUnified(
        gameContext,
        playerId,
        playerInput
      );

      // Send AI party member responses
      unifiedResponse.aiPartyResponses.forEach(response => {
        const message: AIMessage = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'player',
          content: response.content,
          sender: response.characterName,
          timestamp: new Date(),
          metadata: response.metadata
        };
        onAIMessage(message);
      });

      // Send AI-to-AI conversations
      unifiedResponse.aiToAiConversations.forEach(conv => {
        const message: AIMessage = {
          id: `ai_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'player',
          content: conv.content,
          sender: conv.speaker,
          timestamp: new Date(),
          metadata: { 
            isAI: true, 
            conversationType: 'ai_to_ai',
            targetAI: conv.target
          }
        };
        onAIMessage(message);
      });

      // Send supportive interactions
      unifiedResponse.supportiveInteractions.forEach(support => {
        const message: AIMessage = {
          id: `ai_support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'player',
          content: support.content,
          sender: support.characterName,
          timestamp: new Date(),
          metadata: { 
            isAI: true, 
            messageType: 'supportive',
            supportType: support.supportType
          }
        };
        onAIMessage(message);
      });

      // Update AI party members if they changed
      if (gameContext.aiPartyMembers && gameContext.aiPartyMembers.length > 0) {
        setAIPartyMembers(gameContext.aiPartyMembers);
        onAIPartyMembersUpdated?.(gameContext.aiPartyMembers);
        await unifiedAIService.saveAIPartyMembers(gameId, gameContext.aiPartyMembers);
      }

    } catch (error) {
      console.error('Error processing AI party input:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [gameId, gameType, realm, theme, participants, aiPartyMembers, worldState, recentMessages, isEnabled, onAIMessage, onAIPartyMembersUpdated, isProcessing]);

  // Trigger proactive AI conversations
  const triggerProactiveConversation = useCallback(async (): Promise<void> => {
    if (!isEnabled || isProcessing || aiPartyMembers.length < 2) return;

    setIsProcessing(true);
    try {
      const gameContext: UnifiedGameContext = {
        gameId,
        gameType,
        realm,
        theme,
        participants,
        aiPartyMembers,
        worldState,
        messages: recentMessages
      };

      const unifiedResponse = await unifiedAIService.processPlayerInputUnified(
        gameContext,
        'system',
        'The party has a moment to chat among themselves...'
      );

      // Only send AI-to-AI conversations for proactive triggers
      unifiedResponse.aiToAiConversations.forEach(conv => {
        const message: AIMessage = {
          id: `ai_proactive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'player',
          content: conv.content,
          sender: conv.speaker,
          timestamp: new Date(),
          metadata: { 
            isAI: true, 
            conversationType: 'proactive',
            targetAI: conv.target
          }
        };
        onAIMessage(message);
      });

    } catch (error) {
      console.error('Error triggering proactive conversation:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [gameId, gameType, realm, theme, participants, aiPartyMembers, worldState, recentMessages, isEnabled, onAIMessage, isProcessing]);

  // Auto-trigger proactive conversations occasionally
  useEffect(() => {
    if (!isEnabled || aiPartyMembers.length < 2) return;

    const proactiveTimer = setInterval(() => {
      if (Math.random() < 0.15) { // 15% chance every interval
        triggerProactiveConversation();
      }
    }, 120000); // Check every 2 minutes

    return () => clearInterval(proactiveTimer);
  }, [isEnabled, aiPartyMembers.length, triggerProactiveConversation]);

  // API for external components
  const aiPartyAPI = {
    processPlayerInput,
    triggerProactiveConversation,
    getPartyMembers: () => aiPartyMembers,
    isProcessing: () => isProcessing,
    reinitialize: initializeAIPartyMembers
  };

  // Store API in global scope for other components to access
  useEffect(() => {
    (window as any).aiPartyManager = aiPartyAPI;
    return () => {
      delete (window as any).aiPartyManager;
    };
  }, [aiPartyAPI]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="ai-party-manager">
      {/* AI Party Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowPartyPanel(!showPartyPanel)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          title={`${aiPartyMembers.length} AI Party Members`}
        >
          <span className="text-sm">🤖</span>
          <span className="text-xs">{aiPartyMembers.length}</span>
          {isProcessing && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      {/* AI Party Panel */}
      {showPartyPanel && (
        <div className="fixed top-16 right-4 z-40 bg-gray-800 text-white rounded-lg shadow-xl p-4 w-64">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">AI Party Members</h3>
            <button
              onClick={() => setShowPartyPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {aiPartyMembers.map(member => (
              <div key={member.id} className="bg-gray-700 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-purple-300">{member.name}</h4>
                    <p className="text-xs text-gray-300">{member.race} {member.characterClass}</p>
                  </div>
                  <div className="text-xs bg-gray-600 px-2 py-1 rounded">
                    Lv {member.stats.level}
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  <p><strong>Traits:</strong> {member.personality.traits.slice(0, 2).join(', ')}</p>
                  <p><strong>Background:</strong> {member.personality.background}</p>
                </div>
                
                <div className="mt-2 flex justify-between text-xs">
                  <span>❤️ {member.stats.health}</span>
                  {member.stats.mana && <span>💙 {member.stats.mana}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={triggerProactiveConversation}
              disabled={isProcessing || aiPartyMembers.length < 2}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Trigger Chat'}
            </button>
            
            <button
              onClick={initializeAIPartyMembers}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Reinitialize Party
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPartyManager;

// Hook for easy integration
export const useAIPartyManager = (props: Omit<AIPartyManagerProps, 'onAIMessage'>) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [aiPartyMembers, setAIPartyMembers] = useState<AIPartyMember[]>([]);

  const handleAIMessage = useCallback((message: AIMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleAIPartyMembersUpdated = useCallback((members: AIPartyMember[]) => {
    setAIPartyMembers(members);
  }, []);

  return {
    AIPartyManagerComponent: (
      <AIPartyManager
        {...props}
        onAIMessage={handleAIMessage}
        onAIPartyMembersUpdated={handleAIPartyMembersUpdated}
      />
    ),
    aiMessages: messages,
    aiPartyMembers,
    clearAIMessages: () => setMessages([])
  };
}; 