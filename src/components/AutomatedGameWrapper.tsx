import React, { useState, useRef } from 'react';
import { UniversalGameInterface } from './UniversalGameInterface';
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
  const [localLoading, setLocalLoading] = useState(false);
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
      await sendMessage(inputMessage);
      setInputMessage('');
      console.log('✅ Message sent successfully');
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
      leaveSession();
    }
  };

  // Helper functions for quick start and session management
  const handleQuickStartFantasy = async () => {
    const quickConfig: AutomatedGameConfig = {
      realm: 'Fantasy',
      theme: 'Epic Adventure',
      maxPlayers: 4,
      sessionDuration: 60,
      autoStart: true,
      dmStyle: 'balanced' as const,
      rating: 'PG-13' as const
    };
    await handleCreateAndJoinSession(quickConfig);
  };

  const handleQuickStartSciFi = async () => {
    const quickConfig: AutomatedGameConfig = {
      realm: 'Sci-Fi',
      theme: 'Space Exploration',
      maxPlayers: 4,
      sessionDuration: 60,
      autoStart: true,
      dmStyle: 'narrative' as const,
      rating: 'PG-13' as const
    };
    await handleCreateAndJoinSession(quickConfig);
  };

  const handleCreateAndJoinSession = async (config: AutomatedGameConfig) => {
    if (!user) return;
    
    try {
      setLocalLoading(true);
      console.log('🎮 Quick start: Creating session with config:', config);
      
      const sessionId = await createSession(config);
      if (sessionId) {
        console.log('🎮 Quick start: Session created, auto-joining...');
        // The hook will automatically detect the new session and set it as current
      }
    } catch (error) {
      console.error('❌ Quick start failed:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleJoinSessionLocal = async (sessionId: string) => {
    if (!user) return;
    
    try {
      setLocalLoading(true);
      const session = await joinSession(sessionId);
      if (session) {
        console.log('✅ Joined session successfully');
      }
    } catch (error) {
      console.error('❌ Failed to join session:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const getRealmIcon = (realm: string): string => {
    const icons: Record<string, string> = {
      'Fantasy': '🏰',
      'Sci-Fi': '🚀',
      'Post-Apocalyptic': '☢️',
      'Medieval': '⚔️',
      'Cyberpunk': '🌃',
      'Horror': '🎃',
      'Steampunk': '⚙️'
    };
    return icons[realm] || '🎮';
  };

  const getPhaseColor = (phase: string): string => {
    const colors: Record<string, string> = {
      'waiting': 'bg-yellow-600 text-yellow-100',
      'introduction': 'bg-blue-600 text-blue-100',
      'exploration': 'bg-green-600 text-green-100',
      'combat': 'bg-red-600 text-red-100',
      'resolution': 'bg-purple-600 text-purple-100'
    };
    return colors[phase] || 'bg-gray-600 text-gray-100';
  };

  // If we have a current session, show the unified game interface
  if (currentSession) {
    return (
      <div className="h-full">
        <UniversalGameInterface
          gameType="automated"
          gameId={currentSession.id}
          user={user}
          onBackToLobby={onBackToLobby}
          showManager={false}
        />
      </div>
    );
  }

  // If we have no session, show the main interface
  return (
    <div className="relative h-full bg-gradient-to-br from-blue-950 via-purple-900 to-slate-900 text-white">
      <div className="p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">⚡ AI-Powered Adventures</h1>
          <p className="text-blue-200 text-lg">Epic quests with intelligent AI companions</p>
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

        {/* Quick Start Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={handleQuickStartFantasy}
            className="p-6 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg hover:scale-105 transition-transform"
            disabled={isLoading}
          >
            <div className="text-3xl mb-2">🏰</div>
            <div className="font-bold">Quick Fantasy</div>
            <div className="text-sm opacity-75">Start immediately</div>
          </button>

          <button
            onClick={handleQuickStartSciFi}
            className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:scale-105 transition-transform"
            disabled={isLoading}
          >
            <div className="text-3xl mb-2">🚀</div>
            <div className="font-bold">Quick Sci-Fi</div>
            <div className="text-sm opacity-75">Space adventure</div>
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
            onClick={() => setShowConfig(true)}
            className="p-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg hover:scale-105 transition-transform"
            disabled={isLoading}
          >
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-bold">Custom Game</div>
            <div className="text-sm opacity-75">Advanced options</div>
          </button>
        </div>

        {/* Join Active Games Section */}
        {sessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🎮</span>
              Join Active Games
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 6).map((session) => (
                <button
                  key={session.id}
                                        onClick={() => handleJoinSessionLocal(session.id)}
                  className="p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-all text-left"
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getRealmIcon(session.config.realm)}</span>
                    <h3 className="font-semibold">{session.config.realm}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${getPhaseColor(session.currentPhase)}`}>
                      {session.currentPhase}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{session.config.theme}</p>
                  <div className="text-xs text-gray-400">
                    Players: {session.players.length}/{session.config.maxPlayers} • 
                    {session.aiPartyMembers?.length || 0} AI companions
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Configuration Modal */}
        {showConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <AutomatedGameManager
                onSessionJoin={(sessionId) => {
                  console.log('🎮 Session joined:', sessionId);
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
            <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Resume Adventures</h2>
                  <button
                    onClick={() => setShowPersisted(false)}
                    className="text-gray-400 hover:text-white text-xl"
                  >
                    ×
                  </button>
                </div>
                
                {persistedSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No saved sessions found.</p>
                    <p className="text-sm mt-2">Start a new adventure to begin!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {persistedSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getRealmIcon(session.config.realm)}</span>
                            <h3 className="font-medium">{session.config.realm}</h3>
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                              {session.config.theme}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {session.messages.length} messages • 
                            {session.aiPartyMembers?.length || 0} AI companions
                          </p>
                          <p className="text-xs text-gray-500">
                            Last played: {new Date(session.startTime || 0).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleResumeSession(session.id)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDeletePersistedSession(session.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}; 