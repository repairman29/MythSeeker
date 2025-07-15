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
  Timestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';



// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
  customPrompt: string;
  isMultiplayer: boolean;
  maxPlayers: number;
  createdAt: Timestamp;
  lastActivity: Timestamp;
  worldState?: any;
  currentEnvironment?: string;
  combatState?: any;
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

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
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
    if (!this.currentUser) throw new Error('User not authenticated');

    const campaignRef = doc(collection(db, 'campaigns'));
    const campaign: MultiplayerGame = {
      ...campaignData,
      id: campaignRef.id,
      createdAt: serverTimestamp() as Timestamp,
      lastActivity: serverTimestamp() as Timestamp,
    };

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
    };

    await setDoc(campaignRef, campaign);
    return campaignRef.id;
  }

  // Real-time Campaign Subscription
  subscribeToCampaign(campaignId: string, callback: (campaign: MultiplayerGame) => void): () => void {
    if (this.currentCampaignId === campaignId) {
      return () => {}; // Already subscribed
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
    if (!this.currentUser) throw new Error('User not authenticated');

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

    const campaignRef = doc(db, 'campaigns', campaignId);
    await updateDoc(campaignRef, {
      ...updates,
      lastActivity: serverTimestamp(),
    });
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
    if (!this.currentUser) return false;
    return campaign.players.find(p => p.id === this.currentUser?.uid)?.isHost || false;
  }

  getCurrentPlayer(campaign: MultiplayerGame): Player | undefined {
    if (!this.currentUser) return undefined;
    return campaign.players.find(p => p.id === this.currentUser?.uid);
  }

  getOnlinePlayers(campaign: MultiplayerGame): Player[] {
    return campaign.players.filter(p => p.isOnline);
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