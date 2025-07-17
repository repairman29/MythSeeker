import { ref, set, get, onValue, off, push, update, remove, serverTimestamp, onDisconnect } from 'firebase/database';
import { database } from '../firebase';
import { auth } from '../firebase';

export interface PlayerPresence {
  id: string;
  name: string;
  characterId: string;
  isOnline: boolean;
  lastSeen: number;
  status: 'idle' | 'typing' | 'in-combat' | 'exploring';
  position?: { x: number; y: number };
}

export interface LiveMessage {
  id: string;
  type: 'chat' | 'system' | 'combat' | 'movement';
  content: string;
  playerId: string;
  playerName: string;
  characterId?: string;
  timestamp: number;
  metadata?: any;
}

export interface SharedState {
  gameId: string;
  worldState: {
    currentLocation: string;
    weather: string;
    timeOfDay: string;
    activeNPCs: Array<{ id: string; name: string; position: { x: number; y: number } }>;
  };
  partyState: {
    members: PlayerPresence[];
    formation: 'scattered' | 'formation' | 'stealth';
    sharedInventory: Record<string, number>;
  };
  combatState?: {
    isActive: boolean;
    participants: string[];
    currentTurn: string;
    round: number;
  };
}

export interface MultiplayerEvent {
  type: 'player_joined' | 'player_left' | 'message' | 'state_update' | 'combat_start' | 'combat_end' | 'movement';
  data: any;
  timestamp: number;
}

class MultiplayerService {
  private gameId: string | null = null;
  private playerId: string | null = null;
  private listeners: { [key: string]: () => void } = {};
  private presenceRef: any = null;
  private messagesRef: any = null;
  private stateRef: any = null;
  private eventsRef: any = null;
  private isConnected = false;

  // Initialize real-time multiplayer for a game session
  async initializeGame(gameId: string, playerData: { id: string; name: string; characterId: string }): Promise<void> {
    this.gameId = gameId;
    this.playerId = playerData.id;

    // Set up presence tracking
    this.presenceRef = ref(database, `games/${gameId}/presence/${playerData.id}`);
    await set(this.presenceRef, {
      id: playerData.id,
      name: playerData.name,
      characterId: playerData.characterId,
      isOnline: true,
      lastSeen: Date.now(),
      status: 'idle'
    });

    // Set up disconnect cleanup
    const disconnectRef = ref(database, `games/${gameId}/presence/${playerData.id}`);
    await onDisconnect(disconnectRef).update({
      isOnline: false,
      lastSeen: Date.now()
    });

    // Set up real-time listeners
    this.setupRealtimeListeners();
    this.isConnected = true;
  }

  private setupRealtimeListeners(): void {
    if (!this.gameId) return;

    // Listen for player presence changes
    const presenceRef = ref(database, `games/${this.gameId}/presence`);
    this.listeners.presence = onValue(presenceRef, (snapshot) => {
      const presence = snapshot.val();
      this.handlePresenceUpdate(presence);
    });

    // Listen for live messages
    const messagesRef = ref(database, `games/${this.gameId}/messages`);
    this.listeners.messages = onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val();
      this.handleMessageUpdate(messages);
    });

    // Listen for shared state changes
    const stateRef = ref(database, `games/${this.gameId}/sharedState`);
    this.listeners.state = onValue(stateRef, (snapshot) => {
      const state = snapshot.val();
      this.handleStateUpdate(state);
    });

    // Listen for multiplayer events
    const eventsRef = ref(database, `games/${this.gameId}/events`);
    this.listeners.events = onValue(eventsRef, (snapshot) => {
      const events = snapshot.val();
      this.handleEventUpdate(events);
    });
  }

  // Send a live message to all players
  async sendMessage(message: Omit<LiveMessage, 'id' | 'timestamp'>): Promise<void> {
    if (!this.gameId || !this.isConnected) return;

    const messageRef = ref(database, `games/${this.gameId}/messages`);
    const newMessageRef = push(messageRef);
    
    await set(newMessageRef, {
      ...message,
      id: newMessageRef.key,
      timestamp: Date.now()
    });
  }

  // Update player presence status
  async updatePresence(status: PlayerPresence['status'], position?: { x: number; y: number }): Promise<void> {
    if (!this.gameId || !this.playerId || !this.isConnected) return;

    const updates: any = {
      status,
      lastSeen: Date.now()
    };

    if (position) {
      updates.position = position;
    }

    await update(ref(database, `games/${this.gameId}/presence/${this.playerId}`), updates);
  }

  // Update shared game state
  async updateSharedState(updates: Partial<SharedState>): Promise<void> {
    if (!this.gameId || !this.isConnected) return;

    const stateRef = ref(database, `games/${this.gameId}/sharedState`);
    await update(stateRef, {
      ...updates,
      lastUpdated: Date.now()
    });
  }

  // Broadcast a multiplayer event
  async broadcastEvent(event: Omit<MultiplayerEvent, 'timestamp'>): Promise<void> {
    if (!this.gameId || !this.isConnected) return;

    const eventRef = ref(database, `games/${this.gameId}/events`);
    const newEventRef = push(eventRef);
    
    await set(newEventRef, {
      ...event,
      timestamp: Date.now()
    });
  }

  // Start combat and notify all players
  async startCombat(combatData: any): Promise<void> {
    if (!this.gameId || !this.isConnected) return;

    // Update shared state
    await this.updateSharedState({
      combatState: {
        isActive: true,
        participants: combatData.participants,
        currentTurn: combatData.currentTurn,
        round: 1
      }
    });

    // Broadcast combat start event
    await this.broadcastEvent({
      type: 'combat_start',
      data: combatData
    });

    // Update presence for all participants
    for (const participantId of combatData.participants) {
      await update(ref(database, `games/${this.gameId}/presence/${participantId}`), {
        status: 'in-combat',
        lastSeen: Date.now()
      });
    }
  }

  // End combat and notify all players
  async endCombat(result: any): Promise<void> {
    if (!this.gameId || !this.isConnected) return;

    // Update shared state
    await this.updateSharedState({
      combatState: {
        isActive: false,
        participants: [],
        currentTurn: null as any,
        round: 0
      }
    });

    // Broadcast combat end event
    await this.broadcastEvent({
      type: 'combat_end',
      data: result
    });

    // Reset presence for all players
    const presenceRef = ref(database, `games/${this.gameId}/presence`);
    const snapshot = await get(presenceRef);
    if (snapshot.exists()) {
      const presence = snapshot.val();
      const updates: any = {};
      
      Object.keys(presence).forEach(playerId => {
        updates[`${playerId}/status`] = 'idle';
        updates[`${playerId}/lastSeen`] = Date.now();
      });
      
      await update(presenceRef, updates);
    }
  }

  // Handle player movement and sync with other players
  async updatePlayerPosition(position: { x: number; y: number }): Promise<void> {
    if (!this.gameId || !this.playerId || !this.isConnected) return;

    // Update presence with new position
    await this.updatePresence('exploring', position);

    // Broadcast movement event
    await this.broadcastEvent({
      type: 'movement',
      data: {
        playerId: this.playerId,
        position,
        timestamp: Date.now()
      }
    });
  }

  // Get current online players
  async getOnlinePlayers(): Promise<PlayerPresence[]> {
    if (!this.gameId) return [];

    const presenceRef = ref(database, `games/${this.gameId}/presence`);
    const snapshot = await get(presenceRef);
    
    if (!snapshot.exists()) return [];

    const presence = snapshot.val();
    return Object.values(presence).filter((player: any) => player.isOnline) as PlayerPresence[];
  }

  // Get recent messages
  async getRecentMessages(limit: number = 50): Promise<LiveMessage[]> {
    if (!this.gameId) return [];

    const messagesRef = ref(database, `games/${this.gameId}/messages`);
    const snapshot = await get(messagesRef);
    
    if (!snapshot.exists()) return [];

    const messages = snapshot.val();
    const messageArray = Object.values(messages) as LiveMessage[];
    
    return messageArray
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get current shared state
  async getSharedState(): Promise<SharedState | null> {
    if (!this.gameId) return null;

    const stateRef = ref(database, `games/${this.gameId}/sharedState`);
    const snapshot = await get(stateRef);
    
    if (!snapshot.exists()) return null;

    return snapshot.val();
  }

  // Event handlers (to be overridden by components)
  private handlePresenceUpdate(presence: any): void {
    // Override in components that need presence updates
    console.log('Presence update:', presence);
  }

  private handleMessageUpdate(messages: any): void {
    // Override in components that need message updates
    console.log('Message update:', messages);
  }

  private handleStateUpdate(state: any): void {
    // Override in components that need state updates
    console.log('State update:', state);
  }

  private handleEventUpdate(events: any): void {
    // Override in components that need event updates
    console.log('Event update:', events);
  }

  // Set up event handlers
  onPresenceUpdate(callback: (presence: any) => void): void {
    this.handlePresenceUpdate = callback;
  }

  onMessageUpdate(callback: (messages: any) => void): void {
    this.handleMessageUpdate = callback;
  }

  onStateUpdate(callback: (state: any) => void): void {
    this.handleStateUpdate = callback;
  }

  onEventUpdate(callback: (events: any) => void): void {
    this.handleEventUpdate = callback;
  }

  // Cleanup and disconnect
  async disconnect(): Promise<void> {
    if (!this.gameId || !this.playerId) return;

    // Mark player as offline
    await update(ref(database, `games/${this.gameId}/presence/${this.playerId}`), {
      isOnline: false,
      lastSeen: Date.now()
    });

    // Remove all listeners
    Object.values(this.listeners).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    this.listeners = {};
    this.isConnected = false;
    this.gameId = null;
    this.playerId = null;
  }

  // Check connection status
  isGameConnected(): boolean {
    return this.isConnected && this.gameId !== null;
  }

  // Get current game ID
  getCurrentGameId(): string | null {
    return this.gameId;
  }

  // Get current player ID
  getCurrentPlayerId(): string | null {
    return this.playerId;
  }
}

// Export singleton instance
export const multiplayerService = new MultiplayerService(); 