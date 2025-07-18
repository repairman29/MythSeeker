import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameInterface } from './GameInterface';
import { AutomatedGameManager } from './AutomatedGameManager';
import { useAutomatedGame } from '../hooks/useAutomatedGame';
import { AutomatedGameConfig } from '../services/automatedGameService';
import { campaignService } from '../services/campaignService';

export type GameType = 'campaign' | 'automated';

interface UniversalGameInterfaceProps {
  gameType: GameType;
  gameId: string;
  user: any;
  onBackToLobby?: () => void;
  // Campaign-specific props
  initialCampaign?: any;
  // Automated game-specific props
  showManager?: boolean;
}

export const UniversalGameInterface: React.FC<UniversalGameInterfaceProps> = ({
  gameType,
  gameId,
  user,
  onBackToLobby,
  initialCampaign,
  showManager = true
}) => {
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
  const isLoading = gameType === 'automated' ? automatedLoading : campaignLoading;
  const error = gameType === 'automated' ? automatedError : campaignError;

  // Load campaign data if needed
  useEffect(() => {
    if (gameType === 'campaign' && gameId && !campaign) {
      // For now, use the initialCampaign or load from local storage
      // This will be properly implemented in Phase 3
      if (initialCampaign) {
        setCampaign(initialCampaign);
        setMessages(initialCampaign.messages || []);
      }
    }
  }, [gameType, gameId, campaign, initialCampaign]);

  // Unified send message function
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    try {
      setIsAIThinking(true);
      
      if (gameType === 'automated') {
        // Use automated game service
        await sendAutomatedMessage(inputMessage);
        setInputMessage('');
      } else {
        // Use campaign service
        const result = await campaignService.sendMessage(gameId, { content: inputMessage, playerId: user.uid });
        if (result.success) {
          setInputMessage('');
          // Reload messages or handle real-time updates
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsAIThinking(false);
    }
  }, [gameType, inputMessage, gameId, user.uid, sendAutomatedMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Get current game data
  const getCurrentGameData = () => {
    if (gameType === 'automated') {
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

  // Show automated game manager for automated games
  if (gameType === 'automated' && showManager && !currentSession) {
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
        <div className="text-white text-xl">Loading {gameType} game...</div>
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
      />
    </div>
  );
};

export default UniversalGameInterface; 