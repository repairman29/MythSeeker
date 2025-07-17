import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';

// Import Firebase services from existing configuration
import { auth, db } from '../firebaseService';

// Firebase is already initialized in firebaseService.ts

// Types
export interface Player {
  id: string;
  name: string;
  character: any;
  isHost: boolean;
  isOnline: boolean;
  lastSeen: Timestamp;
  status: 'ready' | 'not-ready' | 'in-game' | 'away';
  position?: { x: number; y: number };
  health?: number;
  mana?: number;
}

export interface GameMessage {
  id: string;
  type: 'player' | 'dm' | 'system';
  content: string;
  character?: string;
  playerId?: string;
  playerName?: string;
  timestamp: Timestamp;
  campaignId: string;
}

export interface MultiplayerGame {
  id: string;
  code: string;
  theme: string;
  background: string;
  players: Player[];
  messages: GameMessage[];
  systemMessages: any[];
  started: boolean;
  status?: 'active' | 'paused' | 'completed';
  customPrompt: string;
  isMultiplayer: boolean;
  maxPlayers: number;
  createdAt: Timestamp;
  lastActivity: Timestamp;
  worldState?: any;
  currentEnvironment?: string;
  combatState?: any;
  participants?: Record<string, boolean>; // Added for Firebase function compatibility
}

export interface PartyState {
  players: Player[];
  campaign: MultiplayerGame | null;
  isHost: boolean;
  isConnected: boolean;
  lastSync: Date | null;
}

class MultiplayerService {
  private unsubscribeFunctions: (() => void)[] = [];
  private currentUser: FirebaseUser | null = null;
  private currentCampaignId: string | null = null;
  private listeners: Map<string, (data: any) => void> = new Map();
  private isFirebaseAvailable: boolean;

  constructor() {
    this.isFirebaseAvailable = !!(db && auth);
    if (this.isFirebaseAvailable) {
      this.initializeAuth();
    } else {
      console.warn('MultiplayerService: Firebase not available, using demo mode');
    }
  }

  private initializeAuth() {
    if (!auth) return;
    
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        console.log('User authenticated:', user.email);
      } else {
        console.log('User signed out');
        this.cleanup();
      }
    });
  }

  // Campaign Management
  async createCampaign(campaignData: Omit<MultiplayerGame, 'id' | 'createdAt' | 'lastActivity'>): Promise<string> {
    if (!this.isFirebaseAvailable) {
      // Fallback: create a demo campaign ID
      const demoId = 'demo-' + Date.now();
      console.log('Creating demo campaign:', demoId);
      return demoId;
    }

    if (!this.currentUser) throw new Error('User not authenticated');
    if (!db) throw new Error('Firebase not initialized');

    const campaignRef = doc(collection(db, 'campaigns'));
    
    // Create participants object from players array for Firebase function compatibility
    const participants: Record<string, boolean> = {};
    if (campaignData.players) {
      campaignData.players.forEach(player => {
        if (player.id) {
          participants[player.id] = true;
        }
      });
    }
    // Ensure current user is always a participant
    participants[this.currentUser.uid] = true;
    
    const campaign: MultiplayerGame & { participants: Record<string, boolean> } = {
      ...campaignData,
      id: campaignRef.id,
      participants, // Add participants field for Firebase function compatibility
      createdAt: serverTimestamp() as Timestamp,
      lastActivity: serverTimestamp() as Timestamp,
    };

    console.log('Creating campaign with participants:', participants);
    await setDoc(campaignRef, campaign);
    return campaignRef.id;
  }

  async joinCampaign(campaignCode: string, playerData: Omit<Player, 'id' | 'lastSeen'>): Promise<string> {
    if (!this.currentUser) throw new Error('User not authenticated');

    // Find campaign by code
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('code', '==', campaignCode.toUpperCase()));
    
    // For now, we'll create a new campaign if none exists (for demo purposes)
    // In production, you'd want to search existing campaigns
    const campaignRef = doc(collection(db, 'campaigns'));
    const campaign: MultiplayerGame = {
      id: campaignRef.id,
      code: campaignCode.toUpperCase(),
      theme: 'Classic Fantasy',
      background: 'fantasy',
      players: [{
        ...playerData,
        id: this.currentUser.uid,
        lastSeen: serverTimestamp() as Timestamp,
      }],
      messages: [],
      systemMessages: [],
      started: false,
      customPrompt: '',
      isMultiplayer: true,
      maxPlayers: 6,
      createdAt: serverTimestamp() as Timestamp,
      lastActivity: serverTimestamp() as Timestamp,
      participants: {}, // Initialize participants for new campaign
    };

    await setDoc(campaignRef, campaign);
    return campaignRef.id;
  }

  // Real-time Campaign Subscription
  subscribeToCampaign(campaignId: string, callback: (campaign: MultiplayerGame) => void): () => void {
    if (!this.isFirebaseAvailable) {
      // Fallback: return a no-op unsubscribe function
      console.log('Firebase not available, skipping campaign subscription');
      return () => {};
    }

    if (this.currentCampaignId === campaignId) {
      return () => {}; // Already subscribed
    }

    if (!db) {
      console.error('Firebase not initialized');
      return () => {};
    }

    this.currentCampaignId = campaignId;
    const campaignRef = doc(db, 'campaigns', campaignId);

    const unsubscribe = onSnapshot(campaignRef, (doc) => {
      if (doc.exists()) {
        const campaign = { id: doc.id, ...doc.data() } as MultiplayerGame;
        callback(campaign);
      }
    }, (error) => {
      console.error('Error subscribing to campaign:', error);
    });

    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  // Send message to campaign
  async sendMessage(campaignId: string, messageData: Omit<GameMessage, 'id' | 'timestamp' | 'campaignId'>): Promise<void> {
    if (!this.isFirebaseAvailable) {
      // Fallback: just log the message
      console.log('Demo mode - message would be sent:', messageData);
      return;
    }

    if (!this.currentUser) throw new Error('User not authenticated');
    if (!db) throw new Error('Firebase not initialized');

    const message: GameMessage = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: serverTimestamp() as Timestamp,
      campaignId,
    };

    const campaignRef = doc(db, 'campaigns', campaignId);
    const currentMessages = await this.getCampaignMessages(campaignId);
    await updateDoc(campaignRef, {
      messages: [...currentMessages, message],
      lastActivity: serverTimestamp(),
    });
  }

  // Player Management
  async updatePlayerStatus(campaignId: string, status: Player['status'], position?: { x: number; y: number }): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const campaignRef = doc(db, 'campaigns', campaignId);
    const playerUpdate: Partial<Player> = {
      isOnline: true,
      lastSeen: serverTimestamp() as Timestamp,
      status,
    };

    if (position) {
      playerUpdate.position = position;
    }

    await updateDoc(campaignRef, {
      [`players.${this.currentUser.uid}`]: playerUpdate,
      lastActivity: serverTimestamp(),
    });
  }

  async addPlayerToCampaign(campaignId: string, playerData: Omit<Player, 'id' | 'lastSeen'>): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const campaignRef = doc(db, 'campaigns', campaignId);
    const player: Player = {
      ...playerData,
      id: this.currentUser.uid,
      lastSeen: serverTimestamp() as Timestamp,
    };

    await updateDoc(campaignRef, {
      [`players.${this.currentUser.uid}`]: player,
      lastActivity: serverTimestamp(),
    });
  }

  async removePlayerFromCampaign(campaignId: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const campaignRef = doc(db, 'campaigns', campaignId);
    await updateDoc(campaignRef, {
      [`players.${this.currentUser.uid}`]: null,
      lastActivity: serverTimestamp(),
    });
  }



  private async getCampaignMessages(campaignId: string): Promise<GameMessage[]> {
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignRef);
    return campaignDoc.data()?.messages || [];
  }

  // Campaign State Management
  async updateCampaignState(campaignId: string, updates: Partial<MultiplayerGame>): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');
    if (!db) throw new Error('Firebase not initialized');
    
    console.log('Updating campaign state:', campaignId, updates);

    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      
      // First check if the campaign exists
      const campaignDoc = await getDoc(campaignRef);
      if (!campaignDoc.exists()) {
        throw new Error(`Campaign ${campaignId} does not exist in Firestore`);
      }
      
      // Prepare the update data
      const updateData = {
        ...updates,
        lastActivity: serverTimestamp(),
      };
      
      console.log('Sending update to Firestore:', updateData);
      await updateDoc(campaignRef, updateData);
      console.log('Campaign state updated successfully');
    } catch (error) {
      console.error('Error updating campaign state:', error);
      throw error;
    }
  }

  async startCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignState(campaignId, { started: true });
  }

  async endCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignState(campaignId, { started: false });
  }

  // World State Synchronization
  async updateWorldState(campaignId: string, worldState: any): Promise<void> {
    await this.updateCampaignState(campaignId, { worldState });
  }

  async updateEnvironment(campaignId: string, environment: string): Promise<void> {
    await this.updateCampaignState(campaignId, { currentEnvironment: environment });
  }

  // Combat State Management
  async updateCombatState(campaignId: string, combatState: any): Promise<void> {
    await this.updateCampaignState(campaignId, { combatState });
  }

  // Utility Methods
  isHost(campaign: MultiplayerGame): boolean {
    if (!this.currentUser || !campaign.players || !Array.isArray(campaign.players)) return false;
    return campaign.players.find(p => p.id === this.currentUser?.uid)?.isHost || false;
  }

  getCurrentPlayer(campaign: MultiplayerGame): Player | undefined {
    if (!this.currentUser || !campaign.players || !Array.isArray(campaign.players)) return undefined;
    return campaign.players.find(p => p.id === this.currentUser?.uid);
  }

  getOnlinePlayers(campaign: MultiplayerGame): Player[] {
    if (!campaign.players || !Array.isArray(campaign.players)) return [];
    return campaign.players.filter(p => p.isOnline);
  }

  // Campaign Management
  async getUserCampaigns(): Promise<MultiplayerGame[]> {
    if (!this.isFirebaseAvailable || !this.currentUser) {
      return [];
    }

    if (!db) {
      console.error('Firebase not initialized');
      return [];
    }

    try {
      const campaignsRef = collection(db, 'campaigns');
      // Get all campaigns and filter in memory since array-contains doesn't work with complex objects
      const q = query(campaignsRef);
      
      const querySnapshot = await getDocs(q);
      const campaigns: MultiplayerGame[] = [];
      
      querySnapshot.forEach((doc) => {
        const campaignData = { id: doc.id, ...doc.data() } as MultiplayerGame;
        // Check if current user is in the campaign
        if (campaignData.players && Array.isArray(campaignData.players)) {
          const isInCampaign = campaignData.players.some(player => player.id === this.currentUser?.uid);
          if (isInCampaign) {
            campaigns.push(campaignData);
          }
        }
      });
      
      return campaigns;
    } catch (error) {
      console.error('Error getting user campaigns:', error);
      return [];
    }
  }

  async getCampaign(campaignId: string): Promise<MultiplayerGame | null> {
    if (!this.isFirebaseAvailable) {
      return null;
    }

    if (!db) {
      console.error('Firebase not initialized');
      return null;
    }

    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignDoc = await getDoc(campaignRef);
      
      if (campaignDoc.exists()) {
        return { id: campaignDoc.id, ...campaignDoc.data() } as MultiplayerGame;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting campaign:', error);
      return null;
    }
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    if (!this.isFirebaseAvailable) {
      console.warn('Firebase not available, skipping Firebase deletion');
      return; // Don't throw error, just skip Firebase deletion
    }

    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    if (!db) {
      console.warn('Firebase not initialized, skipping Firebase deletion');
      return; // Don't throw error, just skip Firebase deletion
    }

    try {
      // Check if user is host of the campaign
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        console.warn('Campaign not found in Firebase, may have been deleted already');
        return; // Don't throw error if campaign doesn't exist
      }
      
      if (!this.isHost(campaign)) {
        throw new Error('Only the campaign host can delete the campaign');
      }

      const campaignRef = doc(db, 'campaigns', campaignId);
      await deleteDoc(campaignRef);
      console.log('Campaign deleted from Firebase:', campaignId);
    } catch (error) {
      console.error('Error deleting campaign from Firebase:', error);
      throw error;
    }
  }

  // Cleanup
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    this.currentCampaignId = null;
    this.listeners.clear();
  }

  // Heartbeat to keep players online
  startHeartbeat(campaignId: string): () => void {
    if (!this.isFirebaseAvailable) {
      // Fallback: return a no-op cleanup function
      console.log('Firebase not available, skipping heartbeat');
      return () => {};
    }

    const interval = setInterval(async () => {
      try {
        await this.updatePlayerStatus(campaignId, 'in-game');
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }
}

export const multiplayerService = new MultiplayerService();
export default multiplayerService; 