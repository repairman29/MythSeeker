import { useState, useEffect, useCallback } from 'react';
import { automatedGameService, GameSession, PlayerContext, AutomatedGameConfig } from '../services/automatedGameService';
import { useAuth } from './useAuth';

export const useAutomatedGame = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh sessions list
  const refreshSessions = useCallback(() => {
    const activeSessions = automatedGameService.getAllSessions();
    setSessions(activeSessions);
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

  // Join session
  const joinSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated');
      return false;
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

      await automatedGameService.addPlayerToSession(sessionId, playerContext);
      
      // Update current session
      const session = automatedGameService.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
      }
      
      refreshSessions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshSessions]);

  // Leave session
  const leaveSession = useCallback(() => {
    if (!currentSession || !user) return;

    automatedGameService.removePlayerFromSession(currentSession.id, user.uid);
    setCurrentSession(null);
    refreshSessions();
  }, [currentSession, user, refreshSessions]);

  // Send message
  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!currentSession || !user || !message.trim()) return false;

    try {
      await automatedGameService.processPlayerInput(currentSession.id, user.uid, message);
      
      // Refresh current session
      const updatedSession = automatedGameService.getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [currentSession, user]);

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

  // Auto-refresh sessions
  useEffect(() => {
    refreshSessions();
    
    const interval = setInterval(refreshSessions, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [refreshSessions]);

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
    isLoading,
    error,
    
    // Actions
    createSession,
    joinSession,
    leaveSession,
    sendMessage,
    getSession,
    isUserInSession,
    refreshSessions,
    
    // Utilities
    clearError: () => setError(null)
  };
}; 