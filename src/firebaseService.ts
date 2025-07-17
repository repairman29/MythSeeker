import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  off, 
  push, 
  update,
  remove
} from 'firebase/database';

// Firebase configuration for mythseekers-rpg project
const firebaseConfig = {
  apiKey: "AIzaSyAVJvau3Hit06q1pNYCTOF-pVuutmk4oNQ",
  authDomain: "mythseekers-rpg.firebaseapp.com",
  databaseURL: "https://mythseekers-rpg-default-rtdb.firebaseio.com",
  projectId: "mythseekers-rpg",
  storageBucket: "mythseekers-rpg.firebasestorage.app",
  messagingSenderId: "659018227506",
  appId: "1:659018227506:web:82425e7adaf80c2e3c412b",
  measurementId: "G-E3T1V81ZX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Types
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: number;
  lastSeen: number;
  totalPlayTime: number;
  campaignsHosted: number;
  campaignsJoined: number;
}

export interface Character {
  id?: string;
  userId: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  gold: number;
  inventory: Record<string, number>;
  equipment: Record<string, any>;
  stats: Record<string, number>;
  skills: Record<string, any>;
  achievements: string[];
  createdAt: number;
  lastPlayed: number;
  totalPlayTime: number;
}

export interface GameSession {
  id?: string;
  code: string;
  theme: string;
  background: string;
  hostId: string;
  players: Array<{
    id: string;
    name: string;
    characterId: string;
    isHost: boolean;
    isOnline: boolean;
    lastSeen: number;
  }>;
  messages: Array<{
    id: string;
    type: 'player' | 'dm' | 'system';
    content: string;
    character?: string;
    playerId?: string;
    playerName?: string;
    timestamp: number;
  }>;
  started: boolean;
  customPrompt: string;
  maxPlayers: number;
  createdAt: number;
  lastActivity: number;
  completedAt?: number;
}

class FirebaseService {
  private listeners: { [key: string]: () => void } = {};

  // Authentication with fallback strategy
  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      
      // Configure provider to reduce popup issues
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Add scopes for better compatibility
      provider.addScope('profile');
      provider.addScope('email');

      try {
        // Try popup authentication first
        const result = await signInWithPopup(auth, provider);
        
        // Create user profile if it doesn't exist
        const userProfile = await this.getUserProfile(result.user.uid);
        if (!userProfile) {
          await this.createUserProfile(result.user);
        }
      } catch (popupError: any) {
        console.log('Popup authentication failed, trying redirect:', popupError);
        
        // Check if it's a COOP policy error or popup blocked
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message?.includes('Cross-Origin-Opener-Policy') ||
            popupError.message?.includes('window.closed')) {
          
          console.log('Falling back to redirect authentication');
          // Fall back to redirect authentication
          await signInWithRedirect(auth, provider);
        } else {
          // Re-throw other errors
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async handleRedirectSignIn(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        // const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential.accessToken;
        const user = result.user;
        const userProfile = await this.getUserProfile(user.uid);
        if (!userProfile) {
          await this.createUserProfile(user);
        }
        return user;
      }
      return null;
    } catch(error) {
      console.error("Error handling redirect sign in", error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // User Profile Management
  async createUserProfile(user: User): Promise<void> {
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Adventurer',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: Date.now(),
        lastSeen: Date.now(),
        totalPlayTime: 0,
        campaignsHosted: 0,
        campaignsJoined: 0
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.warn('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserLastSeen(uid: string): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      lastSeen: Date.now()
    });
  }

  // Character Management
  async saveCharacter(character: Character): Promise<string> {
    console.log('FirebaseService.saveCharacter called with:', character);
    
    if (!this.getCurrentUser()) {
      throw new Error('User not authenticated');
    }

    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    const characterData = {
      ...character,
      lastPlayed: Date.now()
    };

    try {
      if (character.id) {
        // Update existing character
        console.log('Updating existing character with ID:', character.id);
        const docRef = doc(db, 'characters', character.id);
        await updateDoc(docRef, characterData);
        console.log('Character updated successfully');
        return character.id;
      } else {
        // Create new character
        console.log('Creating new character');
        const docRef = await addDoc(collection(db, 'characters'), characterData);
        console.log('New character created with ID:', docRef.id);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving character to Firebase:', error);
      throw error;
    }
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    const q = query(
      collection(db, 'characters'),
      where('userId', '==', userId)
      // Removed orderBy to avoid composite index requirement
    );
    
    const querySnapshot = await getDocs(q);
    const characters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
    
    // Sort in memory instead
    return characters.sort((a, b) => b.lastPlayed - a.lastPlayed);
  }

  async getUserCampaigns(userId: string): Promise<GameSession[]> {
    const q = query(
      collection(db, 'games'),
      where('hostId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const campaigns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
    
    return campaigns.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async getCharacter(characterId: string): Promise<Character | null> {
    const docRef = doc(db, 'characters', characterId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Character;
    }
    return null;
  }

  // Game Session Management
  async createGameSession(gameData: Partial<GameSession>): Promise<{ gameId: string; code: string }> {
    const code = this.generateGameCode();
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const gameSession: GameSession = {
      code,
      theme: gameData.theme || 'Classic Fantasy',
      background: gameData.background || 'fantasy',
      hostId: currentUser.uid,
      players: gameData.players || [],
      messages: gameData.messages || [],
      started: false,
      customPrompt: gameData.customPrompt || '',
      maxPlayers: gameData.maxPlayers || 6,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    const docRef = await addDoc(collection(db, 'games'), gameSession);
    
    // Update user stats
    await this.updateUserStats(currentUser.uid, { campaignsHosted: 1 });

    return { gameId: docRef.id, code };
  }

  async joinGameSession(code: string, characterId: string): Promise<{ gameId: string; gameData: GameSession }> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Find game by code
    const q = query(
      collection(db, 'games'),
      where('code', '==', code),
      where('started', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Game not found or already started');
    }

    const gameDoc = querySnapshot.docs[0];
    const gameData = gameDoc.data() as GameSession;

    if (gameData.players.length >= gameData.maxPlayers) {
      throw new Error('Game is full');
    }

    // Check if player is already in the game
    const existingPlayer = gameData.players.find(p => p.id === currentUser.uid);
    if (existingPlayer) {
      throw new Error('Player already in game');
    }

    // Get character data
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Add player to game
    const newPlayer = {
      id: currentUser.uid,
      name: character.name,
      characterId,
      isHost: false,
      isOnline: true,
      lastSeen: Date.now()
    };

    await updateDoc(doc(db, 'games', gameDoc.id), {
      players: arrayUnion(newPlayer),
      lastActivity: Date.now()
    });

    // Update user stats
    await this.updateUserStats(currentUser.uid, { campaignsJoined: 1 });

    return { 
      gameId: gameDoc.id, 
      gameData: { ...gameData, players: [...gameData.players, newPlayer] } 
    };
  }

  async leaveGameSession(gameId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const gameDoc = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameDoc);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data() as GameSession;
    const updatedPlayers = gameData.players.filter(p => p.id !== currentUser.uid);

    if (updatedPlayers.length === 0) {
      // Delete game if no players left
      await deleteDoc(gameDoc);
    } else {
      // Update players list
      await updateDoc(gameDoc, {
        players: updatedPlayers,
        lastActivity: Date.now()
      });
    }
  }

  async startGameSession(gameId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const gameDoc = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameDoc);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data() as GameSession;
    
    if (gameData.hostId !== currentUser.uid) {
      throw new Error('Only host can start the game');
    }

    await updateDoc(gameDoc, {
      started: true,
      lastActivity: Date.now()
    });
  }

  // Real-time game updates
  onGameUpdate(gameId: string, callback: (game: GameSession) => void): () => void {
    const gameDoc = doc(db, 'games', gameId);
    
    const unsubscribe = onSnapshot(gameDoc, (doc) => {
      if (doc.exists()) {
        const game = { id: doc.id, ...doc.data() } as GameSession;
        callback(game);
      }
    });

    this.listeners[gameId] = unsubscribe;
    return unsubscribe;
  }

  // Message handling
  async sendMessage(gameId: string, message: Omit<GameSession['messages'][0], 'id' | 'timestamp'>): Promise<void> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const fullMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: Date.now()
    };

    const gameDoc = doc(db, 'games', gameId);
    await updateDoc(gameDoc, {
      messages: arrayUnion(fullMessage),
      lastActivity: Date.now()
    });
  }

  // Game progress and completion
  async saveGameProgress(gameId: string, characterId: string, progress: any): Promise<void> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Update character
    const characterDoc = doc(db, 'characters', characterId);
    await updateDoc(characterDoc, {
      ...progress,
      lastPlayed: Date.now()
    });

    // Update user play time
    await this.updateUserStats(currentUser.uid, { 
      totalPlayTime: progress.playTime || 0 
    });
  }

  async completeCampaign(gameId: string, campaignData: any): Promise<void> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const gameDoc = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameDoc);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data() as GameSession;

    // Save campaign history
    await addDoc(collection(db, 'campaigns'), {
      gameId,
      hostId: gameData.hostId,
      participants: gameData.players.map(p => p.id),
      theme: gameData.theme,
      startedAt: gameData.createdAt,
      completedAt: Date.now(),
      duration: Date.now() - gameData.createdAt,
      messages: gameData.messages,
      campaignData
    });

    // Mark game as completed
    await updateDoc(gameDoc, {
      completedAt: Date.now()
    });
  }

  // User stats management
  private async updateUserStats(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, updates);
  }

  // Achievement management
  async getUserAchievements(uid: string): Promise<any[]> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const q = query(achievementsRef, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      
      const achievements: any[] = [];
      querySnapshot.forEach((doc) => {
        achievements.push({ id: doc.id, ...doc.data() });
      });
      
      return achievements;
    } catch (error) {
      console.warn('Error getting user achievements:', error);
      return [];
    }
  }

  // Player statistics
  async getPlayerStats(uid: string): Promise<any> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        return {
          totalPlayTime: 0,
          campaignsHosted: 0,
          campaignsJoined: 0,
          charactersCreated: 0,
          totalXP: 0,
          combatWins: 0,
          questsCompleted: 0,
          npcsInteracted: 0,
          locationsDiscovered: 0,
          achievementsUnlocked: 0,
          lastActive: new Date(),
          joinDate: new Date()
        };
      }

      // Get character count
      const characters = await this.getUserCharacters(uid);
      
      // Get achievements count
      const achievements = await this.getUserAchievements(uid);

      return {
        totalPlayTime: userProfile.totalPlayTime || 0,
        campaignsHosted: userProfile.campaignsHosted || 0,
        campaignsJoined: userProfile.campaignsJoined || 0,
        charactersCreated: characters.length,
        totalXP: characters.reduce((sum, char) => sum + (char.experience || 0), 0),
        combatWins: 0, // TODO: Implement combat tracking
        questsCompleted: 0, // TODO: Implement quest tracking
        npcsInteracted: 0, // TODO: Implement NPC tracking
        locationsDiscovered: 0, // TODO: Implement location tracking
        achievementsUnlocked: achievements.length,
        lastActive: new Date(userProfile.lastSeen),
        joinDate: new Date(userProfile.createdAt)
      };
    } catch (error) {
      console.warn('Error getting player stats:', error);
      return {
        totalPlayTime: 0,
        campaignsHosted: 0,
        campaignsJoined: 0,
        charactersCreated: 0,
        totalXP: 0,
        combatWins: 0,
        questsCompleted: 0,
        npcsInteracted: 0,
        locationsDiscovered: 0,
        achievementsUnlocked: 0,
        lastActive: new Date(),
        joinDate: new Date()
      };
    }
  }

  // Helper functions
  private generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Cleanup
  cleanup(): void {
    Object.values(this.listeners).forEach(unsubscribe => unsubscribe());
    this.listeners = {};
  }
}

export const firebaseService = new FirebaseService(); 