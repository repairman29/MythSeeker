import { firebaseService } from '../firebaseService';
import { diceService } from './diceService';
import { achievementService } from './achievementService';

export interface RealtimeEvent {
  id: string;
  type: 'dice_roll' | 'chat_message' | 'combat_action' | 'world_update' | 'achievement_unlocked' | 'player_join' | 'player_leave';
  timestamp: number;
  userId: string;
  userName: string;
  data: any;
  campaignId?: string;
}

export interface RealtimeState {
  connected: boolean;
  users: { [userId: string]: { name: string; online: boolean; lastSeen: number } };
  events: RealtimeEvent[];
  campaignState: any;
}

export interface DiceRollEvent {
  sides: number;
  result: number;
  diceSet: string;
  context?: string;
  isPublic: boolean;
}

export interface CombatActionEvent {
  action: string;
  target?: string;
  damage?: number;
  effects?: string[];
}

export interface WorldUpdateEvent {
  location: string;
  description: string;
  changes: any[];
}

class RealtimeService {
  private listeners: { [key: string]: (data: any) => void } = {};
  private state: RealtimeState = {
    connected: false,
    users: {},
    events: [],
    campaignState: {}
  };
  private currentCampaignId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Initialize realtime service
  async initialize(campaignId?: string): Promise<void> {
    if (campaignId) {
      this.currentCampaignId = campaignId;
      await this.joinCampaign(campaignId);
    }
  }

  // Join a campaign's realtime session
  async joinCampaign(campaignId: string): Promise<void> {
    try {
      this.currentCampaignId = campaignId;
      
      // Set up realtime listeners for the campaign
      await this.setupCampaignListeners(campaignId);
      
      // Broadcast join event
      await this.broadcastEvent({
        type: 'player_join',
        data: {
          timestamp: Date.now(),
          message: 'joined the campaign'
        }
      });

      this.state.connected = true;
      this.reconnectAttempts = 0;
      
      console.log(`Joined realtime session for campaign: ${campaignId}`);
    } catch (error) {
      console.error('Error joining campaign:', error);
      this.handleConnectionError();
    }
  }

  // Set up realtime listeners for a campaign
  private async setupCampaignListeners(campaignId: string): Promise<void> {
    // For now, we'll use a simplified approach without Firebase realtime listeners
    // This can be enhanced later with proper Firebase integration
    
    // Simulate realtime connection
    this.state.connected = true;
    this.notifyListeners('campaign_update', { id: campaignId, status: 'active' });
    
    // Set up periodic presence updates
    setInterval(() => {
      this.updatePresence(true);
    }, 30000); // Update presence every 30 seconds
  }

  // Handle incoming realtime events
  private handleRealtimeEvent(event: RealtimeEvent): void {
    this.state.events.unshift(event);
    
    // Keep only last 100 events
    if (this.state.events.length > 100) {
      this.state.events = this.state.events.slice(0, 100);
    }

    // Notify listeners based on event type
    switch (event.type) {
      case 'dice_roll':
        this.handleDiceRollEvent(event);
        break;
      case 'combat_action':
        this.handleCombatActionEvent(event);
        break;
      case 'world_update':
        this.handleWorldUpdateEvent(event);
        break;
      case 'achievement_unlocked':
        this.handleAchievementEvent(event);
        break;
    }

    this.notifyListeners('event_received', event);
  }

  // Handle dice roll events
  private handleDiceRollEvent(event: RealtimeEvent): void {
    const diceData = event.data as DiceRollEvent;
    
    // Add to local dice history if it's a public roll
    if (diceData.isPublic) {
      diceService.addRoll({
        sides: diceData.sides,
        result: diceData.result,
        diceSet: diceData.diceSet,
        context: diceData.context || `Rolled by ${event.userName}`,
        campaignId: this.currentCampaignId || undefined
      });
    }

    // Show notification
    this.showNotification(`${event.userName} rolled a ${diceData.result} on a d${diceData.sides}!`, 'dice');
  }

  // Handle combat action events
  private handleCombatActionEvent(event: RealtimeEvent): void {
    const combatData = event.data as CombatActionEvent;
    
    let message = `${event.userName} ${combatData.action}`;
    if (combatData.target) {
      message += ` ${combatData.target}`;
    }
    if (combatData.damage) {
      message += ` for ${combatData.damage} damage`;
    }

    this.showNotification(message, 'combat');
  }

  // Handle world update events
  private handleWorldUpdateEvent(event: RealtimeEvent): void {
    const worldData = event.data as WorldUpdateEvent;
    
    this.showNotification(`${event.userName} discovered: ${worldData.description}`, 'world');
  }

  // Handle achievement events
  private handleAchievementEvent(event: RealtimeEvent): void {
    const achievementData = event.data;
    
    this.showNotification(`🎉 ${event.userName} unlocked: ${achievementData.title}!`, 'achievement');
  }

  // Broadcast a realtime event
  async broadcastEvent(eventData: Omit<RealtimeEvent, 'id' | 'timestamp' | 'userId' | 'userName'>): Promise<void> {
    if (!this.currentCampaignId) return;

    const user = firebaseService.getCurrentUser();
    if (!user) return;

    const event: RealtimeEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      userId: user.uid,
      userName: user.displayName || 'Unknown Player',
      campaignId: this.currentCampaignId,
      ...eventData
    };

    try {
      // For now, we'll simulate broadcasting by adding to local events
      this.handleRealtimeEvent(event);
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  // Broadcast dice roll
  async broadcastDiceRoll(diceData: DiceRollEvent): Promise<void> {
    await this.broadcastEvent({
      type: 'dice_roll',
      data: diceData
    });
  }

  // Broadcast combat action
  async broadcastCombatAction(combatData: CombatActionEvent): Promise<void> {
    await this.broadcastEvent({
      type: 'combat_action',
      data: combatData
    });
  }

  // Broadcast world update
  async broadcastWorldUpdate(worldData: WorldUpdateEvent): Promise<void> {
    await this.broadcastEvent({
      type: 'world_update',
      data: worldData
    });
  }

  // Broadcast achievement unlock
  async broadcastAchievement(achievement: any): Promise<void> {
    await this.broadcastEvent({
      type: 'achievement_unlocked',
      data: achievement
    });
  }

  // Update user presence
  async updatePresence(online: boolean): Promise<void> {
    if (!this.currentCampaignId) return;

    const user = firebaseService.getCurrentUser();
    if (!user) return;

    try {
      // For now, we'll simulate presence updates locally
      this.state.users[user.uid] = {
        name: user.displayName || 'Unknown Player',
        online,
        lastSeen: Date.now()
      };
      this.notifyListeners('presence_update', this.state.users);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  // Show notification
  private showNotification(message: string, type: string): void {
    // Create custom notification
    const notification = {
      id: this.generateEventId(),
      message,
      type,
      timestamp: Date.now()
    };

    this.notifyListeners('notification', notification);
  }

  // Add event listener
  addListener(eventType: string, callback: (data: any) => void): void {
    this.listeners[eventType] = callback;
  }

  // Remove event listener
  removeListener(eventType: string): void {
    delete this.listeners[eventType];
  }

  // Notify all listeners
  private notifyListeners(eventType: string, data: any): void {
    const callback = this.listeners[eventType];
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    }
  }

  // Get current state
  getState(): RealtimeState {
    return { ...this.state };
  }

  // Get recent events
  getRecentEvents(limit: number = 20): RealtimeEvent[] {
    return this.state.events.slice(0, limit);
  }

  // Get online users
  getOnlineUsers(): { [userId: string]: { name: string; online: boolean; lastSeen: number } } {
    return Object.fromEntries(
      Object.entries(this.state.users).filter(([, user]) => user.online)
    );
  }

  // Handle connection errors
  private handleConnectionError(): void {
    this.state.connected = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        if (this.currentCampaignId) {
          this.joinCampaign(this.currentCampaignId);
        }
      }, delay);
    }
  }

  // Leave campaign
  async leaveCampaign(): Promise<void> {
    if (!this.currentCampaignId) return;

    try {
      // Broadcast leave event
      await this.broadcastEvent({
        type: 'player_leave',
        data: {
          timestamp: Date.now(),
          message: 'left the campaign'
        }
      });

      // Update presence
      await this.updatePresence(false);

      // Clean up listeners (simplified for now)
      // TODO: Implement proper Firebase listener cleanup

      this.currentCampaignId = null;
      this.state.connected = false;
      this.state.events = [];
      this.state.users = {};
      
      console.log('Left campaign realtime session');
    } catch (error) {
      console.error('Error leaving campaign:', error);
    }
  }

  // Disconnect from all realtime services
  async disconnect(): Promise<void> {
    if (this.currentCampaignId) {
      await this.leaveCampaign();
    }
    
    this.listeners = {};
    this.state.connected = false;
  }

  // Generate unique event ID
  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Check if connected
  isConnected(): boolean {
    return this.state.connected;
  }

  // Get current campaign ID
  getCurrentCampaignId(): string | null {
    return this.currentCampaignId;
  }
}

export const realtimeService = new RealtimeService(); 