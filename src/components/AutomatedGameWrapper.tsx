import React, { useState, useRef } from 'react';
import { GameInterface } from './GameInterface';
import { AutomatedGameManager } from './AutomatedGameManager';
import { useAutomatedGame } from '../hooks/useAutomatedGame';
import { AutomatedGameConfig } from '../services/automatedGameService';

interface AutomatedGameWrapperProps {
  user: any;
  onBackToLobby: () => void;
}

export const AutomatedGameWrapper: React.FC<AutomatedGameWrapperProps> = ({ user, onBackToLobby }) => {
  const {
    sessions,
    currentSession,
    persistedSessions,
    isLoading,
    error,
    createSession,
    joinSession,
    resumeSession,
    deleteSession,
    sendMessage,
    leaveSession,
    clearError
  } = useAutomatedGame();

  const [showConfig, setShowConfig] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showPersisted, setShowPersisted] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState<AutomatedGameConfig>({
    realm: 'fantasy',
    theme: 'exploration',
    maxPlayers: 4,
    sessionDuration: 60,
    autoStart: true,
    dmStyle: 'balanced',
    rating: 'PG-13'
  });

  console.log('🎮 AutomatedGameWrapper mounted with user:', user?.uid);
  
  const handleSignOut = () => {
    console.log('🎮 AutomatedGameWrapper: Sign out triggered');
    // This will trigger the auth state change and redirect to landing page
  };

  console.log('🎮 AutomatedGameWrapper rendering...');

  const handleResumeSession = async (sessionId: string) => {
    const session = await resumeSession(sessionId);
    if (session) {
      setShowPersisted(false);
    }
  };

  const handleDeletePersistedSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this session? This cannot be undone.')) {
      await deleteSession(sessionId);
    }
  };

  const formatSessionAge = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const hours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
    if (hours < 1) return 'Less than an hour ago';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Handle message sending for automated games
  const handleSendMessage = async () => {
    if (!currentSession || !inputMessage.trim()) return;
    
    console.log('🎮 AutomatedGameWrapper: Sending message:', inputMessage);
    setIsAIThinking(true);
    
    try {
      const success = await sendMessage(currentSession.id, inputMessage);
      if (success) {
        setInputMessage('');
        console.log('✅ Message sent successfully');
      } else {
        console.error('❌ Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    } finally {
      setIsAIThinking(false);
    }
  };

  // Handle key press for input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle leaving session
  const handleLeaveSession = async () => {
    if (!currentSession) return;
    
    if (window.confirm('Are you sure you want to leave this adventure? Your progress is saved and you can resume later.')) {
      await leaveSession(currentSession.id);
    }
  };

  // If we have a current session, show the game interface
  if (currentSession) {
    return (
      <div className="h-full">
        <GameInterface
          campaign={{
            id: currentSession.id,
            theme: currentSession.config.theme,
            background: currentSession.config.realm,
            started: currentSession.currentPhase !== 'waiting'
          }}
          messages={currentSession.messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          isAIThinking={isAIThinking}
          messagesEndRef={messagesEndRef}
          worldState={currentSession.worldState}
          character={{
            name: user?.displayName || user?.email || 'Player',
            id: user?.uid
          }}
          inputRef={inputRef}
        />
        
        {/* Session Controls Overlay */}
        <div className="absolute top-4 right-4 z-50">
          <div className="flex gap-2">
            <button
              onClick={handleLeaveSession}
              className="px-3 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg backdrop-blur-sm transition-colors"
              title="Leave Session (Progress Saved)"
            >
              ↩️ Leave
            </button>
            <button
              onClick={onBackToLobby}
              className="px-3 py-2 bg-gray-600/80 hover:bg-gray-700 text-white rounded-lg backdrop-blur-sm transition-colors"
              title="Back to Lobby"
            >
              🏠 Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
            ⚡ AI-Powered Adventures
          </h1>
          <p className="text-xl text-gray-300">
            Epic quests with intelligent AI companions
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-200">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setShowConfig(true)}
            className="p-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg hover:scale-105 transition-transform"
            disabled={isLoading}
          >
            <div className="text-3xl mb-2">🚀</div>
            <div className="font-bold">Start New Adventure</div>
            <div className="text-sm opacity-75">Create a new AI game</div>
          </button>

          <button
            onClick={() => setShowSessions(true)}
            className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:scale-105 transition-transform"
            disabled={isLoading}
          >
            <div className="text-3xl mb-2">🎮</div>
            <div className="font-bold">Join Active Games</div>
            <div className="text-sm opacity-75">{sessions.length} active sessions</div>
          </button>

          <button
            onClick={() => setShowPersisted(true)}
            className="p-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:scale-105 transition-transform"
            disabled={isLoading}
          >
            <div className="text-3xl mb-2">💾</div>
            <div className="font-bold">Resume Adventures</div>
            <div className="text-sm opacity-75">{persistedSessions.length} saved sessions</div>
          </button>

          <button
            onClick={onBackToLobby}
            className="p-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg hover:scale-105 transition-transform"
          >
            <div className="text-3xl mb-2">🏠</div>
            <div className="font-bold">Back to Lobby</div>
            <div className="text-sm opacity-75">Return to main menu</div>
          </button>
        </div>

        {/* Session Creation/Management Modals */}
        {(showConfig || showSessions) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <AutomatedGameManager
                onSessionJoin={(sessionId) => {
                  console.log('🎮 Session joined:', sessionId);
                  // The hook should automatically detect this and set currentSession
                  setShowConfig(false);
                  setShowSessions(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Resume Sessions Modal */}
        {showPersisted && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold">Resume Saved Adventures</h2>
                <p className="text-gray-400 mt-2">Continue your epic journeys where you left off</p>
              </div>
              
              <div className="p-6">
                {persistedSessions.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-6xl mb-4">📭</div>
                    <p>No saved adventures found</p>
                    <p className="text-sm mt-2">Start a new adventure to create your first save!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {persistedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {session.config.theme} Adventure in {session.config.realm}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {session.players.length} player{session.players.length !== 1 ? 's' : ''} • 
                              {session.aiPartyMembers?.length || 0} AI companions • 
                              {session.messages.length} messages
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-400">
                            <div>Started {formatSessionAge(session.startTime)}</div>
                            <div className="text-xs">Session ID: {session.id.slice(-8)}</div>
                          </div>
                        </div>
                        
                        {session.aiPartyMembers && session.aiPartyMembers.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">AI Party Members:</p>
                            <div className="flex flex-wrap gap-2">
                              {session.aiPartyMembers.slice(0, 3).map((ai) => (
                                <span
                                  key={ai.id}
                                  className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded text-xs"
                                >
                                  {ai.name} ({ai.characterClass})
                                </span>
                              ))}
                              {session.aiPartyMembers.length > 3 && (
                                <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                                  +{session.aiPartyMembers.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {session.messages.length > 0 && (
                          <div className="mb-3 p-3 bg-gray-700 rounded">
                            <p className="text-sm text-gray-400 mb-1">Last message:</p>
                            <p className="text-sm italic">
                              "{session.messages[session.messages.length - 1].content.slice(0, 100)}
                              {session.messages[session.messages.length - 1].content.length > 100 ? '...' : ''}"
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResumeSession(session.id)}
                            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors"
                            disabled={isLoading}
                          >
                            🚀 Resume Adventure
                          </button>
                          <button
                            onClick={() => handleDeletePersistedSession(session.id)}
                            className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded transition-colors"
                            disabled={isLoading}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-700">
                <button
                  onClick={() => setShowPersisted(false)}
                  className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}; 