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
  const createSession = useCallback(async (config: AutomatedGameConfig): Promise<string | null> => {
    if (!user) {
      setError('User must be authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionId = await automatedGameService.createAutomatedSession(config);
      refreshSessions();
      return sessionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshSessions]);

  // Resume a persisted session
  const resumeSession = useCallback(async (sessionId: string): Promise<GameSession | null> => {
    if (!user) {
      setError('User must be authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await automatedGameService.resumeSession(sessionId);
      if (session) {
        setCurrentSession(session);
        refreshSessions();
        console.log(`✅ Successfully resumed session: ${sessionId}`);
      } else {
        setError('Session could not be found or resumed');
      }
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshSessions]);

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

  // Clean up expired sessions
  const cleanupExpiredSessions = useCallback(() => {
    const cleanedCount = automatedGameService.cleanupExpiredSessions();
    if (cleanedCount > 0) {
      refreshSessions();
    }
    return cleanedCount;
  }, [refreshSessions]);

  // Join session
  const joinSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const player: PlayerContext = {
        id: user.uid,
        name: user.displayName || user.email || 'Anonymous',
        experience: 'intermediate',
        preferences: [],
        joinTime: Date.now()
      };

      const success = await automatedGameService.addPlayerToSession(sessionId, player);
      if (success) {
        const session = automatedGameService.getSession(sessionId);
        setCurrentSession(session || null);
        refreshSessions();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshSessions]);

  // Leave session
  const leaveSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await automatedGameService.removePlayerFromSession(sessionId, user.uid);
      if (success) {
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
        }
        refreshSessions();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSession, refreshSessions]);

  // Send message to session
  const sendMessage = useCallback(async (sessionId: string, message: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated');
      return false;
    }

    setError(null);

    try {
      await automatedGameService.processPlayerInput(sessionId, user.uid, message);
      
      // Update current session if it matches
      if (currentSession?.id === sessionId) {
        const updatedSession = automatedGameService.getSession(sessionId);
        setCurrentSession(updatedSession || null);
      }
      
      refreshSessions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [user, currentSession, refreshSessions]);

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