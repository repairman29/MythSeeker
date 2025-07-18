import { useState, useEffect, useCallback } from 'react';
import { automatedGameService, GameSession, PlayerContext, AutomatedGameConfig } from '../services/automatedGameService';
import { useAuth } from './useAuth';

export const useAutomatedGame = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [persistedSessions, setPersistedSessions] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh sessions list (including persisted sessions)
  const refreshSessions = useCallback(() => {
    const activeSessions = automatedGameService.getAllSessions();
    const persistedSessions = automatedGameService.getPersistedSessions();
    setSessions(activeSessions);
    setPersistedSessions(persistedSessions);
  }, []);

  // Create new session
  const createSession = async (config: AutomatedGameConfig): Promise<string | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎮 useAutomatedGame: Creating session with config:', config);
      const sessionId = await automatedGameService.createAutomatedSession(config);
      console.log('🎮 useAutomatedGame: Session created with ID:', sessionId);

      // Auto-join the created session
      const playerContext: PlayerContext = {
        id: user.uid,
        name: user.displayName || 'Adventurer',
        experience: 'intermediate',
        preferences: ['exploration', 'story'],
        joinTime: Date.now()
      };

      console.log('🎮 useAutomatedGame: Auto-joining session...');
      await automatedGameService.addPlayerToSession(sessionId, playerContext);
      
      // Get the updated session and set it as current
      const session = automatedGameService.getSession(sessionId);
      console.log('🎮 useAutomatedGame: Retrieved session after join:', session?.id);
      
      if (session) {
        setCurrentSession(session);
        console.log('✅ useAutomatedGame: Current session set, game should start');
      }

      // Refresh all sessions
      refreshSessions();
      
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      setError(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Resume a persisted session
  const resumeSession = async (sessionId: string): Promise<GameSession | null> => {
    console.log('🎮 useAutomatedGame: Resuming session:', sessionId);
    
    try {
      setIsLoading(true);
      const session = await automatedGameService.resumeSession(sessionId);
      
      if (session) {
        setCurrentSession(session);
        console.log('✅ useAutomatedGame: Session resumed successfully');
        refreshSessions();
        return session;
      } else {
        throw new Error('Failed to resume session');
      }
    } catch (error) {
      console.error('❌ Failed to resume session:', error);
      setError(`Failed to resume session: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a session permanently
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await automatedGameService.deleteSession(sessionId);
      
      // Clear current session if it was deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      
      refreshSessions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSession, refreshSessions]);

  // Clean up expired sessions and inactive players
  const cleanupExpiredSessions = useCallback(() => {
    const cleanedCount = automatedGameService.cleanupExpiredSessions();
    automatedGameService.cleanupInactivePlayers();
    if (cleanedCount > 0) {
      refreshSessions();
    }
    return cleanedCount;
  }, [refreshSessions]);

  // Join session
  const joinSession = async (sessionId: string): Promise<GameSession | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const playerContext: PlayerContext = {
        id: user.uid,
        name: user.displayName || 'Adventurer',
        experience: 'intermediate',
        preferences: ['exploration', 'story'],
        joinTime: Date.now()
      };

      console.log('🎮 useAutomatedGame: Joining session:', sessionId);
      await automatedGameService.addPlayerToSession(sessionId, playerContext);
      
      // Get the updated session and set it as current
      const session = automatedGameService.getSession(sessionId);
      console.log('🎮 useAutomatedGame: Retrieved session after join:', session?.id);
      
      if (session) {
        setCurrentSession(session);
        console.log('✅ useAutomatedGame: Current session set, transitioning to game');
        refreshSessions();
        return session;
      } else {
        throw new Error('Failed to retrieve session after joining');
      }
    } catch (error) {
      console.error('❌ Failed to join session:', error);
      setError(`Failed to join session: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Leave session
  const leaveSession = (): void => {
    if (currentSession && user) {
      console.log('🎮 useAutomatedGame: Leaving session:', currentSession.id);
      // Remove player from session on server side
      automatedGameService.removePlayerFromSession(currentSession.id, user.uid);
      setCurrentSession(null);
      refreshSessions();
    }
  };

  // Send message to session
  const sendMessage = async (content: string): Promise<void> => {
    if (!currentSession || !user) {
      setError('No active session or user not authenticated');
      return;
    }

    try {
      console.log('🎮 useAutomatedGame: Sending message:', content);
      const response = await automatedGameService.processPlayerInput(
        currentSession.id,
        user.uid,
        content
      );

      // Update the current session with the new message
      const updatedSession = automatedGameService.getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);
        console.log('✅ useAutomatedGame: Session updated with new message');
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Get session by ID
  const getSession = useCallback((sessionId: string): GameSession | undefined => {
    return automatedGameService.getSession(sessionId);
  }, []);

  // Check if user is in session
  const isUserInSession = useCallback((sessionId: string): boolean => {
    if (!user) return false;
    const session = automatedGameService.getSession(sessionId);
    return session?.players.some(p => p.id === user.uid) || false;
  }, [user]);

  // Auto-refresh sessions and cleanup on mount
  useEffect(() => {
    refreshSessions();
    
    // Clean up expired sessions on mount
    cleanupExpiredSessions();
    
    const interval = setInterval(() => {
      refreshSessions();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [refreshSessions, cleanupExpiredSessions]);

  // Auto-refresh current session
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      const updatedSession = automatedGameService.getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);
      } else {
        // Session no longer exists
        setCurrentSession(null);
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [currentSession]);

  return {
    // State
    sessions,
    currentSession,
    persistedSessions,
    isLoading,
    error,
    
    // Actions
    createSession,
    joinSession,
    leaveSession,
    resumeSession,
    deleteSession,
    sendMessage,
    cleanupExpiredSessions,
    getSession,
    isUserInSession,
    refreshSessions,
    
    // Utilities
    clearError: () => setError(null)
  };
}; 