/**
 * State Manager Service
 * 
 * Centralized state management for the MythSeeker application
 * Handles global state, persistence, and state synchronization across components
 */

export interface GlobalState {
  // User & Authentication
  currentUser: any | null;
  isAuthenticated: boolean;
  userCharacters: any[];
  
  // Navigation & UI
  activeNav: string;
  activeTab: string;
  drawerOpen: boolean;
  mobileNavOpen: boolean;
  isMobile: boolean;
  
  // Game State
  currentCampaign: any | null;
  campaigns: any[];
  character: any | null;
  messages: any[];
  isAIThinking: boolean;
  currentEnvironment: string;
  
  // World State
  worldState: {
    locations: Record<string, any>;
    npcs: Record<string, any>;
    factions: Record<string, any>;
    events: any[];
    weather: string;
    timeOfDay: string;
    currentLocation: string | null;
    playerReputation: Record<string, number>;
    discoveredSecrets: string[];
    activeQuests: any[];
    completedQuests: any[];
    worldEvents: any[];
  };
  
  // Combat State
  combatState: any | null;
  combatLog: any[];
  battleMap: any | null;
  
  // DM Center State
  dmCenterData: {
    ruleSystem: string;
    contentLibrary: {
      encounters: any[];
      npcs: any[];
      locations: any[];
      plotHooks: any[];
      customRules: any[];
    };
    campaignTemplates: any[];
    dmTools: {
      initiativeTracker: any[];
      sessionNotes: string;
      playerAnalytics: Record<string, any>;
    };
  };
  
  // Multiplayer State
  isConnected: boolean;
  partyState: {
    players: any[];
    isHost: boolean;
    lastSync: Date | null;
  };
  
  // AI Memory
  aiMemory: {
    playerActions: any[];
    npcInteractions: Record<string, any>;
    combatHistory: any[];
    explorationHistory: any[];
    playerPreferences: Record<string, any>;
    storyThreads: any[];
    consequences: any[];
  };
  
  // Achievements & Progress
  achievements: any[];
  showAchievements: boolean;
  pendingChoices: any[];
  
  // UI State
  showWorldEvents: boolean;
  showLevelUp: any | null;
  pendingLevelUp: any | null;
  activeDrawerTab: string;
  drawerWidth: number;
}

export class StateManagerService {
  private state: GlobalState;
  private subscribers: Map<string, (state: GlobalState) => void> = new Map();
  private persistenceKey = 'mythseeker_global_state';
  
  constructor() {
    this.state = this.getInitialState();
    this.loadPersistedState();
  }
  
  private getInitialState(): GlobalState {
    return {
      // User & Authentication
      currentUser: null,
      isAuthenticated: false,
      userCharacters: [],
      
      // Navigation & UI
      activeNav: 'dashboard',
      activeTab: 'gameplay',
      drawerOpen: false,
      mobileNavOpen: false,
      isMobile: false,
      
      // Game State
      currentCampaign: null,
      campaigns: [],
      character: null,
      messages: [],
      isAIThinking: false,
      currentEnvironment: 'default',
      
      // World State
      worldState: {
        locations: {},
        npcs: {},
        factions: {},
        events: [],
        weather: 'clear',
        timeOfDay: 'day',
        currentLocation: null,
        playerReputation: {},
        discoveredSecrets: [],
        activeQuests: [],
        completedQuests: [],
        worldEvents: []
      },
      
      // Combat State
      combatState: null,
      combatLog: [],
      battleMap: null,
      
      // DM Center State
      dmCenterData: {
        ruleSystem: 'dnd5e',
        contentLibrary: {
          encounters: [],
          npcs: [],
          locations: [],
          plotHooks: [],
          customRules: []
        },
        campaignTemplates: [],
        dmTools: {
          initiativeTracker: [],
          sessionNotes: '',
          playerAnalytics: {}
        }
      },
      
      // Multiplayer State
      isConnected: false,
      partyState: {
        players: [],
        isHost: false,
        lastSync: null
      },
      
      // AI Memory
      aiMemory: {
        playerActions: [],
        npcInteractions: {},
        combatHistory: [],
        explorationHistory: [],
        playerPreferences: {},
        storyThreads: [],
        consequences: []
      },
      
      // Achievements & Progress
      achievements: [],
      showAchievements: false,
      pendingChoices: [],
      
      // UI State
      showWorldEvents: false,
      showLevelUp: null,
      pendingLevelUp: null,
      activeDrawerTab: 'chat',
      drawerWidth: 400
    };
  }
  
  // Subscribe to state changes
  subscribe(key: string, callback: (state: GlobalState) => void): () => void {
    this.subscribers.set(key, callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(key);
    };
  }
  
  // Get current state
  getState(): GlobalState {
    return { ...this.state };
  }
  
  // Update state
  setState(updates: Partial<GlobalState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      callback(this.state);
    });
    
    // Persist critical state changes
    this.persistState();
  }
  
  // Update nested state properties
  updateState(path: string, value: any): void {
    const pathArray = path.split('.');
    const newState = { ...this.state };
    
    let current = newState;
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      current[key] = { ...current[key] };
      current = current[key];
    }
    
    const finalKey = pathArray[pathArray.length - 1];
    current[finalKey] = value;
    
    this.state = newState;
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      callback(this.state);
    });
    
    this.persistState();
  }
  
  // Merge state objects
  mergeState(path: string, updates: any): void {
    const pathArray = path.split('.');
    const newState = { ...this.state };
    
    let current = newState;
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      current[key] = { ...current[key] };
      current = current[key];
    }
    
    const finalKey = pathArray[pathArray.length - 1];
    current[finalKey] = { ...current[finalKey], ...updates };
    
    this.state = newState;
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      callback(this.state);
    });
    
    this.persistState();
  }
  
  // Reset state to initial values
  resetState(): void {
    this.state = this.getInitialState();
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      callback(this.state);
    });
    
    // Clear persisted state
    localStorage.removeItem(this.persistenceKey);
  }
  
  // Persist state to localStorage
  private persistState(): void {
    try {
      // Only persist critical state that should survive page refreshes
      const persistedState = {
        currentUser: this.state.currentUser,
        userCharacters: this.state.userCharacters,
        campaigns: this.state.campaigns,
        worldState: this.state.worldState,
        aiMemory: this.state.aiMemory,
        achievements: this.state.achievements,
        dmCenterData: this.state.dmCenterData,
        activeNav: this.state.activeNav,
        drawerWidth: this.state.drawerWidth
      };
      
      localStorage.setItem(this.persistenceKey, JSON.stringify(persistedState));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }
  
  // Load persisted state from localStorage
  private loadPersistedState(): void {
    try {
      const persistedData = localStorage.getItem(this.persistenceKey);
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        this.state = { ...this.state, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }
  
  // Get specific state slice
  getStateSlice(path: string): any {
    const pathArray = path.split('.');
    let current = this.state;
    
    for (const key of pathArray) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
  
  // Utility methods for common state operations
  setUser(user: any): void {
    this.setState({
      currentUser: user,
      isAuthenticated: !!user
    });
  }
  
  setNavigation(nav: string): void {
    this.setState({ activeNav: nav });
  }
  
  addMessage(message: any): void {
    this.setState({
      messages: [...this.state.messages, message]
    });
  }
  
  clearMessages(): void {
    this.setState({ messages: [] });
  }
  
  setAIThinking(thinking: boolean): void {
    this.setState({ isAIThinking: thinking });
  }
  
  updateWorldState(updates: Partial<GlobalState['worldState']>): void {
    this.mergeState('worldState', updates);
  }
  
  addCampaign(campaign: any): void {
    this.setState({
      campaigns: [...this.state.campaigns, campaign]
    });
  }
  
  updateCampaign(campaignId: string, updates: any): void {
    this.setState({
      campaigns: this.state.campaigns.map(campaign => 
        campaign.id === campaignId ? { ...campaign, ...updates } : campaign
      )
    });
  }
  
  removeCampaign(campaignId: string): void {
    this.setState({
      campaigns: this.state.campaigns.filter(campaign => campaign.id !== campaignId)
    });
  }
  
  setCurrentCampaign(campaign: any): void {
    this.setState({ currentCampaign: campaign });
  }
  
  addCharacter(character: any): void {
    this.setState({
      userCharacters: [...this.state.userCharacters, character]
    });
  }
  
  updateCharacter(characterId: string, updates: any): void {
    this.setState({
      userCharacters: this.state.userCharacters.map(character => 
        character.id === characterId ? { ...character, ...updates } : character
      )
    });
  }
  
  setCurrentCharacter(character: any): void {
    this.setState({ character });
  }
}

// Export singleton instance
export const stateManagerService = new StateManagerService(); 