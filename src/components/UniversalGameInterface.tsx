import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameInterface } from './GameInterface';
import { AutomatedGameManager } from './AutomatedGameManager';
import { useAutomatedGame } from '../hooks/useAutomatedGame';
import { AutomatedGameConfig } from '../services/automatedGameService';
import { campaignService } from '../services/campaignService';
import { DiceRoll } from '../types/dice';

export type GameType = 'campaign' | 'automated' | 'combat' | 'multiplayer';

interface UniversalGameInterfaceProps {
  user: any;
  mode?: GameType;
  gameId?: string;
  onBackToSelection?: () => void;
  onBackToLobby?: () => void;
  // Enhanced props for unified experience
  enableDiceIntegration?: boolean;
  onDiceRoll?: (roll: DiceRoll) => void;
  // Legacy props
  gameType?: GameType;
  initialCampaign?: any;
  showManager?: boolean;
}

export const UniversalGameInterface: React.FC<UniversalGameInterfaceProps> = ({
  user,
  mode = 'automated',
  gameId = 'unified-session',
  onBackToSelection,
  onBackToLobby,
  enableDiceIntegration = true,
  onDiceRoll,
  // Legacy props for backward compatibility
  gameType,
  initialCampaign,
  showManager = true
}) => {
  // Determine actual game type (support both new 'mode' and legacy 'gameType')
  const actualGameType = mode || gameType || 'automated';
  
  // Shared state
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [campaign, setCampaign] = useState(initialCampaign);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automated game specific hook (only used for automated games)
  const automatedGameHook = useAutomatedGame();
  const {
    sessions,
    currentSession,
    persistedSessions,
    isLoading: automatedLoading,
    error: automatedError,
    createSession,
    joinSession,
    resumeSession,
    deleteSession,
    sendMessage: sendAutomatedMessage,
    leaveSession,
    clearError
  } = automatedGameHook;

  // Campaign specific state
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  // Unified loading and error states
  const isLoading = actualGameType === 'automated' ? automatedLoading : campaignLoading;
  const error = actualGameType === 'automated' ? automatedError : campaignError;

  // Auto-create training session if we have initialCampaign with training data
  useEffect(() => {
    const autoCreateTrainingSession = async () => {
      if (actualGameType === 'automated' && initialCampaign && !currentSession && (initialCampaign.isTraining || initialCampaign.isCombat)) {
        console.log('🎯 Auto-creating training session for:', initialCampaign);
        
        try {
          // Create training session configuration
          const trainingConfig = {
            realm: initialCampaign.trainingType ? 'Training Grounds' : 'Combat Arena',
            theme: initialCampaign.theme || 'Training Session',
            maxPlayers: 1,
            sessionDuration: 30,
            autoStart: true,
            dmStyle: 'supportive' as const,
            rating: 'PG' as const,
            customPrompt: initialCampaign.customPrompt
          };
          
          console.log('🚀 Creating automated session with config:', trainingConfig);
          const sessionId = await createSession(trainingConfig);
          
          if (sessionId) {
            console.log('✅ Training session created:', sessionId);
            // Auto-join the created session
            await joinSession(sessionId);
          }
        } catch (error) {
          console.error('❌ Failed to create training session:', error);
        }
      }
    };

    autoCreateTrainingSession();
  }, [actualGameType, initialCampaign, currentSession, createSession, joinSession]);

  // Load campaign data if needed
  useEffect(() => {
    if (actualGameType === 'campaign' && gameId && !campaign) {
      // For now, use the initialCampaign or load from local storage
      // This will be properly implemented in Phase 3
      if (initialCampaign) {
        setCampaign(initialCampaign);
        setMessages(initialCampaign.messages || []);
      }
    }
  }, [actualGameType, gameId, campaign, initialCampaign]);

  // Unified send message function
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    try {
      setIsAIThinking(true);
      
      if (actualGameType === 'automated') {
        // Use automated game service
        await sendAutomatedMessage(inputMessage);
        setInputMessage('');
      } else {
        // Use campaign service
        const result = await campaignService.sendMessage(gameId, { 
          content: inputMessage, 
          playerId: user.uid,
          playerName: user.displayName || user.email || 'Player'
        });
        if (result.success) {
          setInputMessage('');
          
          // Update local messages with the new player message and AI response
          const updatedCampaign = await campaignService.getCampaign(gameId);
          setMessages(updatedCampaign.messages || []);
          setCampaign(updatedCampaign);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsAIThinking(false);
    }
  }, [actualGameType, inputMessage, gameId, user.uid, sendAutomatedMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Get current game data
  const getCurrentGameData = () => {
    if (actualGameType === 'automated') {
      return {
        session: currentSession,
        messages: currentSession?.messages || [],
        campaign: null
      };
    } else {
      return {
        session: null,
        messages: messages,
        campaign: campaign
      };
    }
  };

  const { session, messages: currentMessages, campaign: currentCampaign } = getCurrentGameData();

  // Show automated game manager for automated games (but not for training sessions with initial campaigns)
  if (actualGameType === 'automated' && showManager && !currentSession && !initialCampaign) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <AutomatedGameManager 
          onSessionJoin={(sessionId) => {
            console.log('Joining session:', sessionId);
            joinSession(sessionId);
          }}
        />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading {actualGameType} game...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
        {onBackToLobby && (
          <button 
            onClick={onBackToLobby}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Lobby
          </button>
        )}
      </div>
    );
  }

  // Render the unified game interface
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <GameInterface
        campaign={currentCampaign}
        messages={currentMessages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
        isAIThinking={isAIThinking}
        messagesEndRef={messagesEndRef}
        inputRef={inputRef}
        worldState={session?.worldState}
        enableDiceIntegration={enableDiceIntegration}
        onDiceRoll={onDiceRoll}
      />
    </div>
  );
};

export default UniversalGameInterface; 