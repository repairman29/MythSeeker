import React, { useState, useEffect } from 'react';
import { automatedGameService, AutomatedGameConfig, PlayerContext, GameSession } from '../services/automatedGameService';
import { useAuth } from '../hooks/useAuth';

interface AutomatedGameManagerProps {
  onSessionJoin?: (sessionId: string) => void;
}

export const AutomatedGameManager: React.FC<AutomatedGameManagerProps> = ({ onSessionJoin }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [playerInput, setPlayerInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedRating, setSelectedRating] = useState<'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'>('PG-13');

  // Default game configurations
  const defaultConfigs: AutomatedGameConfig[] = [
    {
      realm: 'Fantasy',
      theme: 'Medieval Adventure',
      maxPlayers: 4,
      sessionDuration: 60,
      autoStart: true,
      dmStyle: 'balanced'
    },
    {
      realm: 'Sci-Fi',
      theme: 'Space Exploration',
      maxPlayers: 6,
      sessionDuration: 90,
      autoStart: true,
      dmStyle: 'narrative'
    },
    {
      realm: 'Post-Apocalyptic',
      theme: 'Survival Horror',
      maxPlayers: 4,
      sessionDuration: 75,
      autoStart: true,
      dmStyle: 'combat-focused'
    },
    {
      realm: 'Medieval',
      theme: 'Political Intrigue',
      maxPlayers: 5,
      sessionDuration: 120,
      autoStart: true,
      dmStyle: 'puzzle-heavy'
    }
  ];

  useEffect(() => {
    // Refresh sessions list
    const refreshSessions = () => {
      const activeSessions = automatedGameService.getAllSessions();
      setSessions(activeSessions);
    };

    refreshSessions();
    const interval = setInterval(refreshSessions, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const createSession = async (config: AutomatedGameConfig) => {
    if (!user) return;

    try {
      const sessionId = await automatedGameService.createAutomatedSession(config);
      setShowCreateForm(false);
      
      // Auto-join the created session
      await joinSession(sessionId);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!user) return;

    setIsJoining(true);
    try {
      const playerContext: PlayerContext = {
        id: user.uid,
        name: user.displayName || 'Adventurer',
        experience: 'intermediate',
        preferences: ['exploration', 'story'],
        joinTime: Date.now()
      };

      await automatedGameService.addPlayerToSession(sessionId, playerContext);
      const session = automatedGameService.getSession(sessionId);
      if (session) {
        setSelectedSession(session);
        onSessionJoin?.(sessionId);
      }
    } catch (error) {
      console.error('Error joining session:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedSession || !playerInput.trim() || !user) return;

    try {
      await automatedGameService.processPlayerInput(selectedSession.id, user.uid, playerInput);
      setPlayerInput('');
      
      // Refresh session data
      const updatedSession = automatedGameService.getSession(selectedSession.id);
      if (updatedSession) {
        setSelectedSession(updatedSession);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const leaveSession = () => {
    if (!selectedSession || !user) return;

    automatedGameService.removePlayerFromSession(selectedSession.id, user.uid);
    setSelectedSession(null);
  };

  const getRealmIcon = (realm: string) => {
    switch (realm.toLowerCase()) {
      case 'fantasy': return '⚔️';
      case 'sci-fi': return '🚀';
      case 'post-apocalyptic': return '☢️';
      case 'medieval': return '🏰';
      default: return '🎮';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'waiting': return 'text-yellow-600';
      case 'introduction': return 'text-blue-600';
      case 'exploration': return 'text-green-600';
      case 'combat': return 'text-red-600';
      case 'resolution': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (selectedSession) {
    return (
      <div className="flex h-full bg-gray-900 text-white">
        {/* Main Game Area */}
        <div className="flex flex-col flex-1">
          {/* Session Header */}
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  {getRealmIcon(selectedSession.config.realm)} {selectedSession.config.realm} Adventure
                </h2>
                <p className="text-gray-400">
                  Phase: <span className={getPhaseColor(selectedSession.currentPhase)}>
                    {selectedSession.currentPhase.charAt(0).toUpperCase() + selectedSession.currentPhase.slice(1)}
                  </span>
                </p>
              </div>
              <button
                onClick={leaveSession}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Leave Session
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedSession.messages.map((message) => {
              const isAIPartyMember = message.metadata?.isAI;
              return (
                <div key={message.id} className={`p-3 rounded-lg ${
                  message.type === 'dm' ? 'bg-blue-900 border-l-4 border-blue-400' :
                  isAIPartyMember ? 'bg-purple-900/50 border-l-4 border-purple-400' :
                  message.type === 'player' ? 'bg-gray-800 border-l-4 border-green-400' :
                  'bg-gray-700 border-l-4 border-yellow-400'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {message.type === 'dm' ? '🎭 DM' :
                       isAIPartyMember ? `🤖 ${message.sender}` :
                       message.type === 'player' ? `👤 ${message.sender}` :
                       '⚙️ System'}
                    </span>
                    {isAIPartyMember && (
                      <span className="text-xs bg-purple-700 px-2 py-1 rounded">
                        {message.metadata.characterClass}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your action or message..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!playerInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* World State and Memory Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* World State */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">🌍 World State</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="font-medium text-gray-300">Location</div>
                  <div className="text-white">{selectedSession.worldState?.currentLocation || 'Unknown'}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="font-medium text-gray-300">Weather</div>
                  <div className="text-white">{selectedSession.worldState?.weather || 'Clear'}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="font-medium text-gray-300">Time</div>
                  <div className="text-white">{selectedSession.worldState?.timeOfDay || 'Day'}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="font-medium text-gray-300">Mood</div>
                  <div className="text-white">{selectedSession.worldState?.currentMood || 'Neutral'}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="font-medium text-gray-300">Tension</div>
                  <div className="text-white">{selectedSession.worldState?.currentTension || 'Medium'}</div>
                </div>
              </div>
            </div>

            {/* Player Memory */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-400">🧠 Player Memory</h3>
              <div className="space-y-2">
                {selectedSession.playerMemory && selectedSession.playerMemory.length > 0 ? (
                  selectedSession.playerMemory.slice(-5).map((memory, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg text-sm">
                      <div className="font-medium text-gray-300">{memory.action}</div>
                      <div className="text-white">Outcome: {memory.outcome}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(memory.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm italic">No player actions recorded yet</div>
                )}
              </div>
            </div>

            {/* NPC Memory */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-400">👥 NPC Memory</h3>
              <div className="space-y-2">
                {selectedSession.npcMemory && selectedSession.npcMemory.length > 0 ? (
                  selectedSession.npcMemory.slice(-5).map((npc, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg text-sm">
                      <div className="font-medium text-gray-300">{npc.name}</div>
                      <div className="text-white">
                        Traits: {npc.traits?.join(', ') || 'None'}
                      </div>
                      <div className="text-white">
                        Relationship: {npc.relationship || 'Neutral'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(npc.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm italic">No NPC interactions recorded yet</div>
                )}
              </div>
            </div>

            {/* Active NPCs */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">🎭 Active NPCs</h3>
              <div className="space-y-2">
                {selectedSession.npcs && selectedSession.npcs.length > 0 ? (
                  selectedSession.npcs.map((npc, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg text-sm">
                      <div className="font-medium text-gray-300">{npc.name}</div>
                      <div className="text-white">Role: {npc.role}</div>
                      <div className="text-white">Location: {npc.location}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm italic">No NPCs currently active</div>
                )}
              </div>
            </div>

            {/* AI Party Members Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">🤖 AI Party Members</h3>
              <div className="space-y-2">
                {selectedSession.aiPartyMembers && selectedSession.aiPartyMembers.length > 0 ? (
                  selectedSession.aiPartyMembers.map((member, index) => (
                    <div key={index} className="bg-blue-900/30 p-3 rounded-lg text-sm border border-blue-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium text-blue-300">{member.name}</div>
                        <span className="text-xs bg-blue-700 px-2 py-1 rounded">{member.characterClass}</span>
                      </div>
                      <div className="text-white text-xs mb-1">
                        {member.race} • Level {member.stats.level} • {member.personality.alignment}
                      </div>
                      <div className="text-gray-300 text-xs mb-2">
                        {member.personality.background}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {member.personality.traits.map((trait, traitIndex) => (
                          <span key={traitIndex} className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {trait}
                          </span>
                        ))}
                      </div>
                      {member.personality.quirks.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400 italic">
                          Quirk: {member.personality.quirks[0]}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm italic">No AI party members active</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎮 Automated Game Sessions</h1>
          <p className="text-gray-400">Join an AI-powered RPG adventure or create your own!</p>
        </div>

        {/* Create Session Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create New Session'}
          </button>
        </div>

        {/* Create Session Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Session</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Game Rating</label>
              <select
                value={selectedRating}
                onChange={e => setSelectedRating(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="G">G - General Audiences</option>
                <option value="PG">PG - Parental Guidance</option>
                <option value="PG-13">PG-13 - Teens</option>
                <option value="R">R - Mature</option>
                <option value="NC-17">NC-17 - Adults Only</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultConfigs.map((config, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getRealmIcon(config.realm)}</span>
                    <h3 className="font-semibold">{config.realm}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{config.theme}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Max Players: {config.maxPlayers}</p>
                    <p>Duration: {config.sessionDuration} min</p>
                    <p>Style: {config.dmStyle}</p>
                  </div>
                  <button
                    onClick={() => createSession({ ...config, rating: selectedRating })}
                    className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Create Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No active sessions. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <div key={session.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getRealmIcon(session.config.realm)}</span>
                    <h3 className="font-semibold">{session.config.realm}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{session.config.theme}</p>
                  <div className="text-xs text-gray-500 space-y-1 mb-3">
                    <p>Players: {session.players.length}/{session.config.maxPlayers}</p>
                    <p>Phase: <span className={getPhaseColor(session.currentPhase)}>
                      {session.currentPhase.charAt(0).toUpperCase() + session.currentPhase.slice(1)}
                    </span></p>
                    <p>Style: {session.config.dmStyle}</p>
                  </div>
                  <button
                    onClick={() => joinSession(session.id)}
                    disabled={session.players.length >= session.config.maxPlayers || isJoining}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
                  >
                    {isJoining ? 'Joining...' : 
                     session.players.length >= session.config.maxPlayers ? 'Full' : 'Join Session'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 