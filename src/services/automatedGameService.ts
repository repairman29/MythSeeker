import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { aiService } from './aiService';
import { campaignService } from './campaignService';
import { multiplayerService } from './multiplayerService';
import { sentientAI } from './sentientAIService';
import { unifiedAIService, UnifiedGameContext } from './unifiedAIService';
import { enhancedAIService } from './enhancedAIService';

export interface AutomatedGameConfig {
  realm: string;
  theme: string;
  maxPlayers: number;
  sessionDuration: number; // in minutes
  autoStart: boolean;
  dmStyle: 'narrative' | 'combat-focused' | 'puzzle-heavy' | 'balanced';
  rating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'; // Add rating for mature/creative content
  customPrompt?: string; // For training sessions
}

export interface PlayerContext {
  id: string;
  name: string;
  characterClass?: string;
  experience: 'beginner' | 'intermediate' | 'expert';
  preferences: string[];
  joinTime: number;
  isAI?: boolean; // Flag to distinguish AI-controlled characters
}

export interface AIPartyMember {
  id: string;
  name: string;
  characterClass: string;
  race: string;
  personality: {
    traits: string[];
    alignment: string;
    background: string;
    quirks: string[];
  };
  stats: {
    level: number;
    health: number;
    mana?: number;
    primaryStat: string;
  };
  relationships: Map<string, number>; // Player ID -> relationship score (-100 to 100)
  lastSpokeAt: number;
  conversationContext: string[];
  emotionalMemories?: Array<{
    type: 'conversation' | 'combat' | 'discovery' | 'conflict' | 'bonding';
    description: string;
    otherPartyMembers: string[];
    emotionalImpact: number;
    timestamp: number;
  }>;
  personalityEvolution?: {
    experienceCount: number;
    traitShifts: Map<string, number>;
  };
}

export interface GameSession {
  id: string;
  campaignId?: string; // Add campaignId for Enhanced AI
  config: AutomatedGameConfig;
  players: PlayerContext[];
  aiPartyMembers: AIPartyMember[]; // AI-controlled party members
  currentPhase: 'waiting' | 'introduction' | 'exploration' | 'combat' | 'resolution';
  startTime?: number;
  endTime?: number;
  messages: GameMessage[];
  worldState: any;
  activeQuests: any[];
  npcs: any[];
  playerMemory: Array<any>; // Add player memory field
  npcMemory: Array<any>; // Add NPC memory field
  aiInsights?: string[]; // Add AI insights for Enhanced AI
  lastActivity?: number; // Track last activity
  lastMonitoringCheck?: number; // Track last monitoring check
  isTraining?: boolean; // Flag for training sessions
}

export interface GameMessage {
  id: string;
  type: 'dm' | 'player' | 'system';
  content: string;
  sender?: string;
  timestamp: number;
  metadata?: any;
}

class AutomatedGameService {
  private activeSessions = new Map<string, GameSession>();
  private sessionTimers = new Map<string, NodeJS.Timeout>();
  private autoSaveTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    // Load persisted sessions on service initialization
    this.loadPersistedSessions();
  }

  // ======= PERSISTENCE METHODS =======

  /**
   * Load persisted sessions from localStorage and Firebase
   */
  private async loadPersistedSessions(): Promise<void> {
    try {
      console.log('🔄 Loading persisted automated game sessions...');
      
      // Load from localStorage first for immediate availability
      const localSessions = this.loadFromLocalStorage();
      console.log(`📱 Found ${localSessions.length} sessions in localStorage`);
      
      // Restore active sessions
      localSessions.forEach(session => {
        this.activeSessions.set(session.id, session);
        this.startSessionMonitoring(session.id);
        this.startAutoSave(session.id);
      });

      // Try to sync with Firebase for authenticated users
      await this.syncWithFirebase();
      
      console.log(`✅ Loaded ${this.activeSessions.size} automated game sessions`);
    } catch (error) {
      console.error('❌ Error loading persisted sessions:', error);
    }
  }

  /**
   * Load sessions from localStorage
   */
  private loadFromLocalStorage(): GameSession[] {
    try {
      const stored = localStorage.getItem('mythseeker_automated_sessions');
      if (!stored) return [];
      
      const sessions = JSON.parse(stored) as GameSession[];
      
      // Filter out expired sessions (older than 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return sessions.filter(session => 
        (session.startTime || 0) > sevenDaysAgo || 
        session.messages.length > 0 // Keep sessions with activity
      );
    } catch (error) {
      console.warn('Failed to load sessions from localStorage:', error);
      return [];
    }
  }

  /**
   * Save sessions to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const sessions = Array.from(this.activeSessions.values());
      localStorage.setItem('mythseeker_automated_sessions', JSON.stringify(sessions));
      console.log(`💾 Saved ${sessions.length} sessions to localStorage`);
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }

  /**
   * Sync with Firebase for cloud persistence
   */
  private async syncWithFirebase(): Promise<void> {
    try {
      // Check if user is authenticated
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('🔒 User not authenticated, skipping Firebase sync');
        return;
      }

      // Load user's automated game sessions from Firebase
      const firebaseSessions = await this.loadFromFirebase(user.uid);
      console.log(`☁️ Found ${firebaseSessions.length} sessions in Firebase`);

      // Merge with local sessions (local takes precedence for recent activity)
      firebaseSessions.forEach(firebaseSession => {
        const localSession = this.activeSessions.get(firebaseSession.id);
        if (!localSession || firebaseSession.messages.length > localSession.messages.length) {
          this.activeSessions.set(firebaseSession.id, firebaseSession);
          this.startSessionMonitoring(firebaseSession.id);
          this.startAutoSave(firebaseSession.id);
        }
      });

      // Save merged sessions back to localStorage
      this.saveToLocalStorage();
    } catch (error) {
      console.warn('Firebase sync failed, continuing with local sessions:', error);
    }
  }

  /**
   * Load sessions from Firebase
   */
  private async loadFromFirebase(userId: string): Promise<GameSession[]> {
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const loadAutomatedSessions = httpsCallable(functions, 'loadAutomatedSessions');
      
      const result = await loadAutomatedSessions({ userId });
      const data = result.data as { success: boolean; sessions: GameSession[] };
      
      if (data.success) {
        console.log(`☁️ Loaded ${data.sessions.length} sessions from Firebase`);
        return data.sessions;
      }
      
      return [];
    } catch (error) {
      console.warn('Failed to load from Firebase:', error);
      return [];
    }
  }

    /**
   * Save session to Firebase with rate limiting protection
   */
  private async saveToFirebase(session: GameSession): Promise<void> {
    try {
      // Rate limiting protection: only save to Firebase once per minute per session
      const lastSaveKey = `lastFirebaseSave_${session.id}`;
      const lastSave = localStorage.getItem(lastSaveKey);
      const now = Date.now();
      
      if (lastSave && (now - parseInt(lastSave)) < 60000) { // 1 minute cooldown
        console.log(`🚫 Rate limit: Skipping Firebase save for session ${session.id} (last save was ${Math.round((now - parseInt(lastSave)) / 1000)}s ago)`);
        return;
      }

      const user = await this.getCurrentUser();
      if (!user) return;

      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const saveAutomatedSession = httpsCallable(functions, 'saveAutomatedSession');
      
      await saveAutomatedSession({ 
        sessionId: session.id,
        sessionData: session,
        userId: user.uid
      });
      
      // Update last save timestamp
      localStorage.setItem(lastSaveKey, now.toString());
      
      console.log(`☁️ Automated session ${session.id} saved to Firebase`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        console.warn(`⚠️ Rate limited - will retry Firebase save for session ${session.id} later`);
      } else {
        console.warn('Failed to save automated session to Firebase:', error);
      }
    }
  }

  /**
   * Auto-save session periodically
   */
  private startAutoSave(sessionId: string): void {
    // Clear existing timer if any
    if (this.autoSaveTimers.has(sessionId)) {
      clearInterval(this.autoSaveTimers.get(sessionId)!);
    }

    // Start new auto-save timer (every 30 seconds)
    const timer = setInterval(() => {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        this.saveToLocalStorage();
        this.saveToFirebase(session); // Save to Firebase in background
      } else {
        // Session no longer exists, clear timer
        clearInterval(timer);
        this.autoSaveTimers.delete(sessionId);
      }
    }, 30000);

    this.autoSaveTimers.set(sessionId, timer);
  }

  /**
   * Get current authenticated user
   */
  private async getCurrentUser(): Promise<any> {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      return auth.currentUser;
    } catch {
      return null;
    }
  }

  // ======= ENHANCED SESSION MANAGEMENT =======

  /**
   * Get all persisted sessions for recovery (implementation moved to bottom of class)
   */

  /**
   * Start monitoring a session for activity and cleanup
   */
  private startSessionMonitoring(sessionId: string): void {
    console.log(`🔍 Starting session monitoring for: ${sessionId}`);
    
    // Clear any existing monitoring timer for this session
    if (this.sessionTimers.has(sessionId)) {
      clearTimeout(this.sessionTimers.get(sessionId)!);
    }
    
    // Set up monitoring timer - check session every 5 minutes
    const monitoringTimer = setInterval(() => {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        console.log(`🔍 Session ${sessionId} no longer exists, stopping monitoring`);
        clearInterval(monitoringTimer);
        this.sessionTimers.delete(sessionId);
        return;
      }
      
      // Check if session is inactive (no activity in last 30 minutes)
      const lastActivity = session.lastActivity ?? session.startTime;
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      
      if (lastActivity < thirtyMinutesAgo && session.players.length === 0) {
        console.log(`🔍 Session ${sessionId} appears inactive, considering cleanup`);
        // Could implement automatic cleanup here if needed
      }
      
      // Update last monitoring check
      if (session) {
        session.lastMonitoringCheck = Date.now();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    this.sessionTimers.set(sessionId, monitoringTimer);
  }

  /**
   * Schedule a phase transition for a session
   */
  private schedulePhaseTransition(sessionId: string, newPhase: string, delayMs: number): void {
    console.log(`📅 Scheduling phase transition for ${sessionId} to ${newPhase} in ${delayMs}ms`);
    
    // Clear any existing phase transition timer for this session
    const existingTimer = this.sessionTimers.get(`${sessionId}_phase`);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Schedule the phase transition
    const phaseTimer = setTimeout(() => {
      const session = this.activeSessions.get(sessionId);
      if (session && session.currentPhase !== newPhase) {
        console.log(`🔄 Transitioning session ${sessionId} from ${session.currentPhase} to ${newPhase}`);
        session.currentPhase = newPhase as any; // Cast to allow flexibility
        
        // Add a system message about the phase change
        const phaseMessage: GameMessage = {
          id: `msg_${Date.now()}`,
          type: 'system',
          content: `--- Transitioning to ${newPhase} phase ---`,
          timestamp: Date.now()
        };
        session.messages.push(phaseMessage);
        
        // Save the updated session
        this.saveToLocalStorage();
        
        // Clean up the timer
        this.sessionTimers.delete(`${sessionId}_phase`);
      }
    }, delayMs);
    
    this.sessionTimers.set(`${sessionId}_phase`, phaseTimer);
  }

  /**
   * Resume a session from persistence
   */
  async resumeSession(sessionId: string): Promise<GameSession | null> {
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      // Try to load from localStorage
      const localSessions = this.loadFromLocalStorage();
      session = localSessions.find(s => s.id === sessionId);
      
      if (session) {
        this.activeSessions.set(sessionId, session);
        this.startSessionMonitoring(sessionId);
        this.startAutoSave(sessionId);
        console.log(`✅ Session ${sessionId} resumed from localStorage`);
      }
    }
    
    return session || null;
  }



  /**
   * Delete a session permanently
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Remove from memory
    this.activeSessions.delete(sessionId);
    
    // Clear timers
    if (this.sessionTimers.has(sessionId)) {
      clearTimeout(this.sessionTimers.get(sessionId)!);
      this.sessionTimers.delete(sessionId);
    }
    
    if (this.autoSaveTimers.has(sessionId)) {
      clearInterval(this.autoSaveTimers.get(sessionId)!);
      this.autoSaveTimers.delete(sessionId);
    }
    
    // Update localStorage
    this.saveToLocalStorage();
    
    console.log(`🗑️ Session ${sessionId} deleted`);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const expiredSessions: string[] = [];
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    this.activeSessions.forEach((session, sessionId) => {
      // Mark for deletion if old and inactive
      if ((session.startTime || 0) < sevenDaysAgo && session.messages.length === 0) {
        expiredSessions.push(sessionId);
      }
    });
    
    // Delete expired sessions
    expiredSessions.forEach(sessionId => {
      this.deleteSession(sessionId);
    });
    
    console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    return expiredSessions.length;
  }

  // Initialize automated game session
  async createAutomatedSession(config: AutomatedGameConfig): Promise<string> {
    console.log('🏗️ createAutomatedSession called with config:', config);
    const sessionId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Generated session ID:', sessionId);
    
    // Check if this is a training session (should be local-only)
    const isTrainingSession = config.customPrompt?.includes('training') || 
                             config.theme?.toLowerCase().includes('training') ||
                             config.realm?.toLowerCase().includes('training');
    
    console.log('🤖 Generating AI party members...');
    const aiPartyMembers = this.generateAIPartyMembers(config);
    console.log('🤖 Generated AI party members:', aiPartyMembers.map(m => `${m.name} (${m.characterClass})`));
    
    const session: GameSession = {
      id: sessionId,
      config,
      players: [],
      aiPartyMembers: aiPartyMembers, // Generate AI party members
      currentPhase: 'waiting',
      startTime: Date.now(), // Add timestamp for persistence
      messages: [],
      worldState: this.generateInitialWorldState(config),
      activeQuests: [],
      npcs: this.generateNPCs(config),
      playerMemory: [], // Initialize empty player memory
      npcMemory: [], // Initialize empty NPC memory
      isTraining: isTrainingSession // Mark training sessions
    };

    this.activeSessions.set(sessionId, session);
    console.log('💾 Session stored in activeSessions map');
    
    // Start session monitoring and auto-save
    this.startSessionMonitoring(sessionId);
    
    // Only start Firebase auto-save for non-training sessions
    if (!isTrainingSession) {
      this.startAutoSave(sessionId);
      console.log('⏰ Session monitoring and Firebase auto-save started');
    } else {
      console.log('⏰ Session monitoring started (training session - local only)');
    }
    
    // Immediately save to localStorage
    this.saveToLocalStorage();
    
    // Save to Firebase in background (non-blocking) - but skip for training sessions
    if (!isTrainingSession) {
      this.saveToFirebase(session).catch(error => 
        console.warn('Background Firebase save failed:', error)
      );
    } else {
      console.log('🎯 Training session - skipping Firebase save to avoid rate limits');
    }
    
    console.log(`✅ Automated session created: ${sessionId} with ${aiPartyMembers.length} AI members${isTrainingSession ? ' (training/local-only)' : ''}`);
    return sessionId;
  }

  // Add player to automated session
  async addPlayerToSession(sessionId: string, player: PlayerContext): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if player is already in session
    const existingPlayerIndex = session.players.findIndex(p => p.id === player.id);
    if (existingPlayerIndex >= 0) {
      // Update existing player data instead of adding duplicate
      session.players[existingPlayerIndex] = { ...session.players[existingPlayerIndex], ...player, joinTime: Date.now() };
      return true;
    }

    if (session.players.length >= session.config.maxPlayers) {
      throw new Error('Session is full');
    }

    session.players.push(player);
    
    // Add welcome message
    const welcomeMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content: `${player.name} has joined the adventure!`,
      timestamp: Date.now()
    };
    session.messages.push(welcomeMessage);

    // Check if we should start the session
    if (session.config.autoStart && session.players.length >= 2) {
      await this.startSession(sessionId);
    }

    return true;
  }

  // Remove player from automated session
  removePlayerFromSession(sessionId: string, playerId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    const playerIndex = session.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }

    const player = session.players[playerIndex];
    session.players.splice(playerIndex, 1);
    
    // Add leave message
    const leaveMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content: `${player.name} has left the adventure.`,
      timestamp: Date.now()
    };
    session.messages.push(leaveMessage);

    // Save session state
    this.saveToLocalStorage();

    return true;
  }

  // Clean up inactive players from sessions (remove players who haven't been active)
  cleanupInactivePlayers(): void {
    const now = Date.now();
    const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes

    this.activeSessions.forEach((session, sessionId) => {
      const activePlayerIds = new Set<string>();
      
      // Check for recent activity in messages
      const recentMessages = session.messages.filter(m => 
        now - m.timestamp < INACTIVITY_THRESHOLD && 
        m.type === 'player' && 
        m.sender
      );
      
      recentMessages.forEach(msg => {
        if (msg.sender) {
          const player = session.players.find(p => p.name === msg.sender);
          if (player) {
            activePlayerIds.add(player.id);
          }
        }
      });

      // Remove inactive players
      const initialPlayerCount = session.players.length;
      session.players = session.players.filter(player => {
        const isActive = activePlayerIds.has(player.id) || 
                        (player.joinTime && now - player.joinTime < INACTIVITY_THRESHOLD);
        return isActive;
      });

      // Log cleanup if players were removed
      if (session.players.length < initialPlayerCount) {
        console.log(`🧹 Cleaned up ${initialPlayerCount - session.players.length} inactive players from session ${sessionId}`);
      }
    });

    this.saveToLocalStorage();
  }

  // Start the automated session
  async startSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.currentPhase = 'introduction';
    session.startTime = Date.now();
    session.lastActivity = Date.now(); // Update last activity

    // Generate opening scene based on players and realm
    const openingScene = await this.generateOpeningScene(session);
    
    const openingMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'dm',
      content: openingScene,
      timestamp: Date.now(),
      metadata: { phase: 'introduction' }
    };
    
    session.messages.push(openingMessage);

    // Set up phase transitions
    this.schedulePhaseTransition(sessionId, 'exploration', 30000); // 30 seconds

    console.log(`🎬 Session ${sessionId} started with opening scene`);
  }

  // Generate opening scene based on player context and realm
  private async generateOpeningScene(session: GameSession): Promise<string> {
    const playerNames = session.players.map(p => p.name).join(', ');
    const playerClasses = session.players.map(p => p.characterClass).filter(Boolean);
    const experienceLevels = session.players.map(p => p.experience);
    
    const scenePrompt = `
You are an expert Dungeon Master opening a new RPG session. Create an engaging opening scene that:

REALM: ${session.config.realm}
THEME: ${session.config.theme}
DM STYLE: ${session.config.dmStyle}
PLAYERS: ${playerNames}
CHARACTER CLASSES: ${playerClasses.join(', ') || 'Mixed'}
EXPERIENCE LEVELS: ${experienceLevels.join(', ')}

REQUIREMENTS:
- Set the scene in the chosen realm with appropriate atmosphere
- Introduce the players to the world and their current situation
- Provide 3-4 clear choices for how to proceed
- Consider the players' experience levels and preferences
- Use the DM style specified (narrative, combat-focused, puzzle-heavy, or balanced)
- Make it engaging and immersive
- Keep it concise but descriptive

RESPONSE FORMAT:
{
  "narrative": "Your opening scene description",
  "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
  "atmosphere": {
    "mood": "current mood",
    "tension": "low|medium|high",
    "environmentalDetails": "specific details about surroundings"
  }
}
`;

    try {
      const response = await aiService.generateEnhancedDynamicResponse(scenePrompt);
      return response;
    } catch (error) {
      console.error('Error generating opening scene:', error);
      return this.getFallbackOpeningScene(session);
    }
  }

  // Fallback opening scene
  private getFallbackOpeningScene(session: GameSession): string {
    const playerNames = session.players.map(p => p.name).join(', ');
    
    return `Welcome to the realm of ${session.config.realm}, brave adventurers! 

The air crackles with ancient magic as you find yourselves standing at the edge of a mysterious forest. The trees whisper secrets of forgotten kingdoms, and in the distance, you can see the silhouette of an ancient castle against the setting sun.

Your party, consisting of ${playerNames}, has been drawn together by fate and circumstance. The local villagers speak of strange happenings in the castle - lights flickering in windows that should be empty, and the sound of distant chanting carried on the wind.

What would you like to do?

1. Approach the castle directly to investigate the strange lights
2. Question the villagers for more information about the castle's history
3. Search the forest for any clues or hidden paths
4. Set up camp and wait for morning to plan your approach

The choice is yours, adventurers. The fate of this realm may very well rest in your hands.`;
  }

  // Generate initial world state based on configuration
  private generateInitialWorldState(config: AutomatedGameConfig): any {
    const baseState: any = {
      time: 'day',
      weather: 'clear',
      location: 'forest_edge',
      tension: 'low',
      discoveredAreas: [] as string[],
      activeEffects: [] as string[],
      worldEvents: [] as string[]
    };

    // Customize based on realm and theme
    switch (config.realm.toLowerCase()) {
      case 'fantasy':
        baseState.location = 'mystical_forest';
        baseState.activeEffects = ['magical_aura'];
        break;
      case 'sci-fi':
        baseState.location = 'space_station';
        baseState.activeEffects = ['artificial_gravity', 'life_support'];
        break;
      case 'post-apocalyptic':
        baseState.location = 'ruined_city';
        baseState.activeEffects = ['radiation_warning'];
        baseState.tension = 'high';
        break;
      case 'medieval':
        baseState.location = 'village_square';
        baseState.activeEffects = ['market_day'];
        break;
    }

    return baseState;
  }

  // Generate NPCs based on configuration
  private generateNPCs(config: AutomatedGameConfig): any[] {
    const npcs: any[] = [];
    
    switch (config.realm.toLowerCase()) {
      case 'fantasy':
        npcs.push(
          { id: 'elder_mage', name: 'Elder Thaddeus', role: 'mentor', location: 'village' },
          { id: 'merchant', name: 'Grimble', role: 'trader', location: 'market' },
          { id: 'guard_captain', name: 'Captain Valeria', role: 'authority', location: 'castle' }
        );
        break;
      case 'sci-fi':
        npcs.push(
          { id: 'ai_overseer', name: 'O.S.C.A.R.', role: 'guide', location: 'command_center' },
          { id: 'engineer', name: 'Dr. Chen', role: 'expert', location: 'engineering' },
          { id: 'security_chief', name: 'Commander Reyes', role: 'authority', location: 'security' }
        );
        break;
      case 'post-apocalyptic':
        npcs.push(
          { id: 'scavenger', name: 'Rust', role: 'survivor', location: 'outskirts' },
          { id: 'settlement_leader', name: 'Mayor Stone', role: 'authority', location: 'settlement' },
          { id: 'wanderer', name: 'The Traveler', role: 'mysterious', location: 'roads' }
        );
        break;
      case 'medieval':
        npcs.push(
          { id: 'innkeeper', name: 'Mistress Willow', role: 'host', location: 'tavern' },
          { id: 'blacksmith', name: 'Master Forge', role: 'craftsman', location: 'forge' },
          { id: 'noble', name: 'Lord Aldric', role: 'authority', location: 'manor' }
        );
        break;
    }

    return npcs;
  }

  // Generate AI party members for automated sessions
  private generateAIPartyMembers(config: AutomatedGameConfig): AIPartyMember[] {
    const partyMembers: AIPartyMember[] = [];
    
    // Create 2-3 AI party members based on realm and theme
    const memberCount = Math.min(3, Math.max(2, config.maxPlayers - 1)); // Leave room for human players
    
    const characterTemplates = this.getCharacterTemplates(config.realm);
    const selectedTemplates = this.shuffleArray(characterTemplates).slice(0, memberCount);
    
    selectedTemplates.forEach((template, index) => {
      const member: AIPartyMember = {
        id: `ai_${Date.now()}_${index}`,
        name: template.name,
        characterClass: template.characterClass,
        race: template.race,
        personality: {
          traits: template.personality.traits,
          alignment: template.personality.alignment,
          background: template.personality.background,
          quirks: template.personality.quirks
        },
        stats: {
          level: Math.floor(Math.random() * 3) + 1, // Level 1-3
          health: template.stats.baseHealth + Math.floor(Math.random() * 10),
          mana: template.stats.baseMana ? template.stats.baseMana + Math.floor(Math.random() * 10) : undefined,
          primaryStat: template.stats.primaryStat
        },
        relationships: new Map<string, number>(),
        lastSpokeAt: 0,
        conversationContext: []
      };
      
      partyMembers.push(member);
    });
    
    return partyMembers;
  }

  private getCharacterTemplates(realm: string) {
    const templates: any[] = [];
    
    switch (realm.toLowerCase()) {
      case 'fantasy':
        templates.push(
          {
            name: 'Lyra Moonwhisper',
            characterClass: 'Ranger',
            race: 'Elf',
            personality: {
              traits: ['observant', 'loyal', 'nature-loving'],
              alignment: 'Chaotic Good',
              background: 'An elf ranger who grew up in the deep forests and has an innate connection to wildlife.',
              quirks: ['Always knows which direction is north', 'Collects rare flowers', 'Speaks to animals']
            },
            stats: { baseHealth: 45, baseMana: 25, primaryStat: 'Dexterity' }
          },
          {
            name: 'Thorek Ironbeard',
            characterClass: 'Cleric',
            race: 'Dwarf',
            personality: {
              traits: ['steadfast', 'protective', 'wise'],
              alignment: 'Lawful Good',
              background: 'A dwarven cleric devoted to healing and protecting his companions.',
              quirks: ['Recites ancient prayers before battles', 'Always carries healing herbs', 'Never backs down from a challenge']
            },
            stats: { baseHealth: 55, baseMana: 40, primaryStat: 'Wisdom' }
          },
          {
            name: 'Zara Quickfingers',
            characterClass: 'Rogue',
            race: 'Halfling',
            personality: {
              traits: ['witty', 'sneaky', 'generous'],
              alignment: 'Chaotic Neutral',
              background: 'A halfling rogue with a heart of gold who "redistributes" wealth from the corrupt.',
              quirks: ['Always has a joke ready', 'Picks locks for fun', 'Shares food with everyone']
            },
            stats: { baseHealth: 35, baseMana: 15, primaryStat: 'Dexterity' }
          },
          {
            name: 'Astrid Stormcaller',
            characterClass: 'Wizard',
            race: 'Human',
            personality: {
              traits: ['intelligent', 'curious', 'ambitious'],
              alignment: 'True Neutral',
              background: 'A young human wizard eager to learn new spells and uncover ancient mysteries.',
              quirks: ['Takes notes on everything', 'Experiments with spells', 'Loves riddles']
            },
            stats: { baseHealth: 30, baseMana: 60, primaryStat: 'Intelligence' }
          }
        );
        break;
      case 'sci-fi':
        templates.push(
          {
            name: 'Zyx-7',
            characterClass: 'Engineer',
            race: 'Android',
            personality: {
              traits: ['logical', 'helpful', 'curious'],
              alignment: 'Lawful Neutral',
              background: 'An advanced android engineer with developing emotions and a fascination with organic life.',
              quirks: ['Calculates probability for everything', 'Learning to understand humor', 'Saves backup data constantly']
            },
            stats: { baseHealth: 50, baseMana: 50, primaryStat: 'Intelligence' }
          },
          {
            name: 'Captain Rex Torres',
            characterClass: 'Soldier',
            race: 'Human',
            personality: {
              traits: ['brave', 'tactical', 'protective'],
              alignment: 'Lawful Good',
              background: 'A veteran space marine with extensive combat experience and natural leadership skills.',
              quirks: ['Always checks his equipment twice', 'Tells war stories', 'Never leaves anyone behind']
            },
            stats: { baseHealth: 60, baseMana: 20, primaryStat: 'Strength' }
          }
        );
        break;
      case 'post-apocalyptic':
        templates.push(
          {
            name: 'Ghost',
            characterClass: 'Scavenger',
            race: 'Human',
            personality: {
              traits: ['resourceful', 'paranoid', 'survivor'],
              alignment: 'Chaotic Neutral',
              background: 'A wasteland scavenger who knows how to find valuable resources in the ruins.',
              quirks: ['Always has spare parts', 'Checks for radiation constantly', 'Hoards useful junk']
            },
            stats: { baseHealth: 45, baseMana: 10, primaryStat: 'Constitution' }
          }
        );
        break;
      case 'medieval':
        templates.push(
          {
            name: 'Sir Gareth',
            characterClass: 'Knight',
            race: 'Human',
            personality: {
              traits: ['honorable', 'brave', 'chivalrous'],
              alignment: 'Lawful Good',
              background: 'A noble knight sworn to protect the innocent and uphold justice.',
              quirks: ['Always addresses others formally', 'Polishes his armor daily', 'Quotes knightly codes']
            },
            stats: { baseHealth: 60, baseMana: 15, primaryStat: 'Strength' }
          }
        );
        break;
    }
    
    return templates;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Handle player input and generate DM response
  async processPlayerInput(sessionId: string, playerId: string, input: string): Promise<GameMessage> {
    console.log('🎯 AutomatedGameService: processPlayerInput called with Universal AI Context');
    console.log('📋 Session ID:', sessionId);
    console.log('👤 Player ID:', playerId);
    console.log('💬 Input:', input);

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.error('❌ Session not found:', sessionId);
      throw new Error('Session not found');
    }

    // Update last activity
    session.lastActivity = Date.now();

    console.log('✅ Session found. Current phase:', session.currentPhase);
    console.log('🤖 AI Party Members:', session.aiPartyMembers?.length || 0);

    const player = session.players.find(p => p.id === playerId);
    if (!player) {
      console.error('❌ Player not found in session:', playerId);
      throw new Error('Player not found in session');
    }

    console.log('✅ Player found:', player.name);

    // Add player message
    const playerMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'player',
      content: input,
      sender: player.name,
      timestamp: Date.now()
    };
    session.messages.push(playerMessage);
    console.log('✅ Player message added');

    // Get universal player profile for enhanced AI
    console.log('🌍 Automated Game: Getting universal player profile...');
    const universalProfile = await enhancedAIService.getUniversalPlayerProfile(playerId);
    console.log('🎯 Universal profile archetype:', universalProfile.archetype);

    // Get AI recommendations for automated games
    const aiRecommendations = await enhancedAIService.getAIRecommendationsForComponent(
      'automated-games',
      playerId,
      {
        sessionPhase: session.currentPhase,
        theme: session.config.theme,
        difficulty: session.config.difficulty,
        aiPartySize: session.aiPartyMembers.length,
        recentMessages: session.messages.slice(-5),
        worldState: session.worldState
      }
    );

    console.log('🎯 AI Recommendations for automated game:', aiRecommendations.ai_insights);

    // Update AI party member relationships based on player action
    this.updateAIRelationships(session, playerId, input);
    console.log('✅ AI relationships updated');

    // Generate AI party member interactions first
    console.log('🤖 Generating AI party interactions with universal context...');
    const aiInteractions = await this.generateAIPartyInteractionsWithContext(sessionId, input, universalProfile, aiRecommendations);
    console.log('🤖 AI interactions generated:', aiInteractions.length);
    session.messages.push(...aiInteractions);

    // Enhanced AI-to-AI conversation system
    const aiToAiConversations = await this.generateAIToAIConversationsWithContext(sessionId, input, universalProfile);
    session.messages.push(...aiToAiConversations);

    // Auto-save session after player input
    this.saveToLocalStorage();

    // Generate enhanced DM response with universal context
    console.log('🎭 Generating enhanced DM response with universal context...');
    const dmResponse = await this.generateEnhancedDMResponseWithUniversalContext(session, player, input, universalProfile, aiRecommendations);
    
    const dmMessage: GameMessage = {
      id: `msg_${Date.now()}`,
      type: 'dm',
      content: dmResponse,
      sender: 'Dungeon Master',
      timestamp: Date.now()
    };
    session.messages.push(dmMessage);

    // Share context with other components
    console.log('🔄 Sharing AI context with other components...');
    await enhancedAIService.shareAIContextBetweenModes(
      'automated-games',
      'universal',
      playerId,
      {
        realm: session.config.realm,
        emotionalTone: 'dynamic',
        relationships: this.getAIRelationshipsForSharing(session, playerId),
        aiPartyMembers: session.aiPartyMembers.map(m => ({ name: m.name, relationship: m.relationship })),
        sessionPhase: session.currentPhase,
        recentAchievements: this.extractRecentAchievements(session),
        preferredAIBehavior: aiRecommendations.ai_insights
      }
    );

    // Store AI insights for future reference
    if (!session.aiInsights) session.aiInsights = [];
    session.aiInsights.push(...aiRecommendations.ai_insights);
    session.aiInsights = session.aiInsights.slice(-10); // Keep last 10 insights

    // Auto-save after full processing
    this.saveToLocalStorage();

    console.log('✅ AutomatedGameService: processPlayerInput completed with universal context');
    return dmMessage;
  }

  // Enhanced AI party interactions with universal context
  private async generateAIPartyInteractionsWithContext(
    sessionId: string, 
    input: string, 
    universalProfile: any,
    aiRecommendations: any
  ): Promise<GameMessage[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.aiPartyMembers.length) return [];

    const interactions: GameMessage[] = [];
    
    // Generate contextual interactions based on universal profile
    for (const member of session.aiPartyMembers) {
      if (Math.random() < this.calculateInteractionProbability(member, input, universalProfile)) {
        const contextualPrompt = this.buildContextualPromptForAI(member, input, universalProfile, aiRecommendations);
        const response = await this.generateAIResponse(member, contextualPrompt, session);
        
        if (response) {
          interactions.push({
            id: `ai_${Date.now()}_${Math.random()}`,
            type: 'ai_party',
            content: response,
            sender: member.name,
            aiMember: member,
            timestamp: Date.now()
          });
        }
      }
    }

    return interactions;
  }

  // Enhanced AI-to-AI conversations with universal context
  private async generateAIToAIConversationsWithContext(
    sessionId: string, 
    trigger: string, 
    universalProfile: any
  ): Promise<GameMessage[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.aiPartyMembers.length < 2) return [];

    const conversations: GameMessage[] = [];
    
    // Enhanced conversation probability based on universal profile
    const conversationProbability = universalProfile.cross_campaign_data?.social_tendencies === 'highly_social' ? 0.4 : 0.2;
    
    if (Math.random() < conversationProbability) {
      const [member1, member2] = this.selectAIForConversation(session.aiPartyMembers, universalProfile);
      
      if (member1 && member2) {
        const conversationTopic = this.generateConversationTopic(trigger, universalProfile);
        const conversation = await this.generateAIToAIConversation(member1, member2, conversationTopic, session);
        conversations.push(...conversation);
      }
    }

    return conversations;
  }

  // Enhanced DM response with universal context
  private async generateEnhancedDMResponseWithUniversalContext(
    session: GameSession, 
    player: PlayerContext, 
    input: string,
    universalProfile: any,
    aiRecommendations: any
  ): Promise<string> {
    try {
      console.log('🚀 Using Enhanced AI Framework with Universal Context for DM response...');
      
      // Build advanced AI input with universal context
      const advancedInput = {
        content: input,
        playerId: player.id || player.name,
        gameContext: {
          realm: session.config.realm,
          location: session.worldState?.currentLocation || 'unknown',
          session: {
            id: session.id,
            campaignId: session.campaignId,
            npcs: session.npcs,
            activeQuests: session.activeQuests,
            worldEvents: session.worldState?.events || [],
            config: session.config,
            universalProfile,
            aiRecommendations
          },
          worldState: session.worldState
        },
        playerContext: {
          name: player.name,
          characterClass: universalProfile.archetype || player.characterClass || 'Adventurer',
          experience: universalProfile.cross_campaign_data?.interaction_frequency || player.experience || 'intermediate',
          preferences: universalProfile.preferences || player.preferences || []
        }
      };

      // Use enhanced AI service for context-aware response with universal profile
      const enhancedResult = await enhancedAIService.generateContextAwareResponse(advancedInput);
      
      // Update session with AI insights including universal context insights
      if (enhancedResult.proactiveInsights.length > 0) {
        console.log('🧠 Enhanced AI insights with universal context:', enhancedResult.proactiveInsights);
        
        if (!session.aiInsights) session.aiInsights = [];
        session.aiInsights.push(...enhancedResult.proactiveInsights);
        session.aiInsights.push(...aiRecommendations.ai_insights);
        session.aiInsights = session.aiInsights.slice(-15); // Keep last 15 insights
      }

      // Incorporate AI recommendations into response
      let enhancedResponse = enhancedResult.response;
      if (aiRecommendations.ai_insights.length > 0 && Math.random() < 0.3) {
        const insight = aiRecommendations.ai_insights[0];
        enhancedResponse += `\n\n*${insight}*`;
      }

      return enhancedResponse;
    } catch (error) {
      console.error('❌ Enhanced AI with Universal Context failed:', error);
      return this.generateSentientDMResponse(session, player, input);
    }
  }

  // Helper methods for universal context integration
  private calculateInteractionProbability(member: AIPartyMember, input: string, universalProfile: any): number {
    let baseProbability = 0.3;
    
    // Adjust based on universal profile
    if (universalProfile.cross_campaign_data?.social_tendencies === 'highly_social') {
      baseProbability += 0.2;
    }
    
    // Adjust based on player archetype
    if (universalProfile.archetype === 'diplomat' && member.personality?.includes('social')) {
      baseProbability += 0.1;
    }
    
    // Adjust based on input content
    if (input.toLowerCase().includes(member.name.toLowerCase())) {
      baseProbability += 0.4;
    }
    
    return Math.min(baseProbability, 0.8);
  }

  private buildContextualPromptForAI(
    member: AIPartyMember, 
    input: string, 
    universalProfile: any, 
    aiRecommendations: any
  ): string {
    const basePrompt = `Player (${universalProfile.archetype} archetype) said: "${input}"`;
    const contextualElements = [];
    
    // Add universal profile context
    if (universalProfile.preferences.length > 0) {
      contextualElements.push(`Player prefers: ${universalProfile.preferences.join(', ')}`);
    }
    
    // Add AI recommendations
    if (aiRecommendations.ai_insights.length > 0) {
      contextualElements.push(`AI Insight: ${aiRecommendations.ai_insights[0]}`);
    }
    
    // Add member-specific context
    contextualElements.push(`You are ${member.name}, ${member.personality}`);
    
    return [basePrompt, ...contextualElements].join('\n');
  }

  private selectAIForConversation(aiMembers: AIPartyMember[], universalProfile: any): [AIPartyMember | null, AIPartyMember | null] {
    if (aiMembers.length < 2) return [null, null];
    
    // Prefer social characters if player is social
    if (universalProfile.cross_campaign_data?.social_tendencies === 'highly_social') {
      const socialMembers = aiMembers.filter(m => m.personality?.includes('friendly') || m.personality?.includes('social'));
      if (socialMembers.length >= 2) {
        return [socialMembers[0], socialMembers[1]];
      }
    }
    
    // Default random selection
    const shuffled = [...aiMembers].sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1]];
  }

  private generateConversationTopic(trigger: string, universalProfile: any): string {
    const topics = [
      'the current situation',
      'their past adventures',
      'the player\'s strategy',
      'upcoming challenges'
    ];
    
    // Add archetype-specific topics
    if (universalProfile.archetype === 'scholar') {
      topics.push('ancient lore', 'magical theories');
    } else if (universalProfile.archetype === 'warrior') {
      topics.push('combat tactics', 'weapon techniques');
    } else if (universalProfile.archetype === 'explorer') {
      topics.push('unexplored areas', 'hidden treasures');
    }
    
    return topics[Math.floor(Math.random() * topics.length)];
  }

  private getAIRelationshipsForSharing(session: GameSession, playerId: string): any {
    const relationships: any = {};
    
    session.aiPartyMembers.forEach(member => {
      relationships[member.name] = {
        trust: member.relationship || 50,
        personality: member.personality,
        recent_interactions: session.messages
          .filter(m => m.aiMember?.id === member.id)
          .slice(-3)
          .map(m => m.content)
      };
    });
    
    return relationships;
  }

  private extractRecentAchievements(session: GameSession): string[] {
    const achievements = [];
    
    // Look for achievement patterns in recent messages
    const recentMessages = session.messages.slice(-10);
    recentMessages.forEach(message => {
      if (message.content.includes('successfully') || message.content.includes('achieved')) {
        achievements.push(message.content.substring(0, 100));
      }
    });
    
    return achievements.slice(0, 3);
  }

  /**
   * Update AI party member relationships based on player actions
   */
  private updateAIRelationships(session: GameSession, playerId: string, playerInput: string): void {
    try {
      if (!session.aiPartyMembers || session.aiPartyMembers.length === 0) {
        console.log('📝 No AI party members to update relationships for');
        return;
      }

      console.log('💖 Updating AI relationships based on player input:', playerInput);

      // Analyze player input for relationship-affecting actions
      const input = playerInput.toLowerCase();
      const relationshipChanges: { [key: string]: number } = {};

      // Positive relationship actions
      if (input.includes('help') || input.includes('assist') || input.includes('support')) {
        relationshipChanges.helpful = 2;
      }
      if (input.includes('thank') || input.includes('appreciate') || input.includes('grateful')) {
        relationshipChanges.grateful = 3;
      }
      if (input.includes('protect') || input.includes('defend') || input.includes('save')) {
        relationshipChanges.protective = 2;
      }
      if (input.includes('share') || input.includes('give') || input.includes('offer')) {
        relationshipChanges.generous = 1;
      }
      if (input.includes('joke') || input.includes('laugh') || input.includes('funny')) {
        relationshipChanges.humorous = 1;
      }

      // Negative relationship actions
      if (input.includes('attack') && (input.includes('party') || input.includes('ally') || input.includes('friend'))) {
        relationshipChanges.hostile = -5;
      }
      if (input.includes('ignore') || input.includes('dismiss') || input.includes('don\'t care')) {
        relationshipChanges.dismissive = -1;
      }
      if (input.includes('insult') || input.includes('stupid') || input.includes('worthless')) {
        relationshipChanges.insulting = -3;
      }
      if (input.includes('steal') || input.includes('take') && input.includes('without asking')) {
        relationshipChanges.dishonest = -2;
      }

      // Apply relationship changes to all AI party members
      session.aiPartyMembers.forEach(member => {
        if (member.id.startsWith('ai_')) { // Assuming AI members have an 'ai_' prefix
          // Initialize relationships if they don't exist
          if (!member.relationships) {
            member.relationships = new Map<string, number>();
          }
          if (!member.relationships.has(playerId)) {
            member.relationships.set(playerId, {
              trust: 50,
              friendship: 50,
              respect: 50,
              loyalty: 50,
              interactions: 0
            });
          }

          const relationship = member.relationships.get(playerId);
          if (relationship) {
            relationship.interactions += 1;

            // Apply relationship changes
            Object.entries(relationshipChanges).forEach(([trait, change]) => {
              switch (trait) {
                case 'helpful':
                case 'grateful':
                case 'protective':
                  relationship.trust = Math.min(100, relationship.trust + change);
                  relationship.friendship = Math.min(100, relationship.friendship + change);
                  break;
                case 'generous':
                  relationship.trust = Math.min(100, relationship.trust + change);
                  relationship.respect = Math.min(100, relationship.respect + change);
                  break;
                case 'humorous':
                  relationship.friendship = Math.min(100, relationship.friendship + change);
                  break;
                case 'hostile':
                case 'insulting':
                  relationship.trust = Math.max(0, relationship.trust + change);
                  relationship.friendship = Math.max(0, relationship.friendship + change);
                  relationship.loyalty = Math.max(0, relationship.loyalty + change);
                  break;
                case 'dismissive':
                  relationship.respect = Math.max(0, relationship.respect + change);
                  break;
                case 'dishonest':
                  relationship.trust = Math.max(0, relationship.trust + change);
                  break;
              }
            });

            // Ensure relationships stay within bounds
            relationship.trust = Math.max(0, Math.min(100, relationship.trust));
            relationship.friendship = Math.max(0, Math.min(100, relationship.friendship));
            relationship.respect = Math.max(0, Math.min(100, relationship.respect));
            relationship.loyalty = Math.max(0, Math.min(100, relationship.loyalty));

            console.log(`💝 Updated relationship with ${member.name}:`, {
              trust: relationship.trust,
              friendship: relationship.friendship,
              respect: relationship.respect,
              loyalty: relationship.loyalty,
              interactions: relationship.interactions
            });
          }
        }
      });

      // Save the updated session
      this.saveToLocalStorage();

    } catch (error) {
      console.error('❌ Error updating AI relationships:', error);
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): GameSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get persisted sessions from localStorage
   */
  getPersistedSessions(): GameSession[] {
    try {
      return this.loadFromLocalStorage();
    } catch (error) {
      console.error('Failed to load persisted sessions:', error);
      return [];
    }
  }

  /**
   * Fallback DM response using basic AI
   */
  private async generateSentientDMResponse(session: GameSession, player: PlayerContext, input: string): Promise<string> {
    try {
      console.log('🤖 Using fallback Sentient DM response for:', input);
      
      // Build basic context for fallback AI
      const context = {
        sessionId: session.id,
        realm: session.config.realm || 'Fantasy Realm',
        playerName: player.name,
        recentMessages: session.messages.slice(-5).map(m => m.content).join(' '),
        worldState: session.worldState || {}
      };

      // Use basic AI service for fallback response
      const fallbackPrompt = `You are a supportive D&D Dungeon Master in ${context.realm}. 
Player ${context.playerName} says: "${input}"
Recent context: ${context.recentMessages}

Respond with an engaging narrative that:
- Acknowledges the player's action
- Advances the story
- Provides clear options for what to do next
- Maintains an encouraging tone

Response:`;

      const response = await aiService.generateResponse(fallbackPrompt);
      return response || "The world responds to your actions. What would you like to do next?";
      
    } catch (error) {
      console.error('❌ Fallback DM response failed:', error);
      return `${player.name}, your action resonates through the realm. The adventure continues - what will you do next?`;
    }
  }

  /**
   * Get a specific session by ID
   */
  getSession(sessionId: string): GameSession | null {
    return this.activeSessions.get(sessionId) || null;
  }
}

export const automatedGameService = new AutomatedGameService(); 