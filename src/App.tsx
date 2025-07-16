import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseService, UserProfile, Character } from './firebaseService';
import { aiService } from './services/aiService';
import { MultiplayerGame, Player } from './services/multiplayerService';
import Tooltip from './components/Tooltip';
import ErrorBoundary from './components/ErrorBoundary';
import ToastNotifications from './components/ToastNotifications';
import { multiplayerService } from './services/multiplayerService';
import { 
  validateCharacterName, 
  validateCampaignName, 
  validateChatMessage, 
  sanitizeInput,
  RateLimiter 
} from './utils/validation';
import { 
  analyticsService,
  trackPageView,
  trackUserAction,
  trackGameEvent,
  trackPerformance,
  trackError,
  trackSessionStart,
  trackSessionEnd,
  trackDeviceInfo
} from './services/analytics';
import { CombatService } from './services/combatService';
import { Combatant } from './components/CombatSystem';
import { Swords, TrendingUp, Globe, HelpCircle, User, Book, Users, Sword, Plus, Edit, Trash2, Copy, ChevronDown, Send } from 'lucide-react';

// Lazy load components
const NavBar = lazy(() => import('./components/NavBar'));
const TopBar = lazy(() => import('./components/TopBar'));
const WelcomeOverlay = lazy(() => import('./components/WelcomeOverlay'));
const CombatSystem = lazy(() => import('./components/CombatSystem'));
const RightDrawer = lazy(() => import('./components/RightDrawer'));
const FloatingActionButton = lazy(() => import('./components/FloatingActionButton'));
const SimpleHelp = lazy(() => import('./components/SimpleHelp'));
const HelpSystem = lazy(() => import('./components/HelpSystem'));

// Components will be defined inline in this file

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
        <div className="w-12 h-12 border-4 border-purple-300/30 border-t-purple-400 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2 -rotate-45" style={{ animationDuration: '1.5s' }}></div>
      </div>
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-lg">Loading MythSeeker</h3>
        <p className="text-blue-200 text-sm">Preparing your adventure...</p>
      </div>
      <div className="flex justify-center space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

// Types
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  icon?: React.ReactNode;
}

interface CombatAction {
  type: string;
  target?: any;
  weapon?: any;
  spell?: any;
}

// Toast message generator
const generateToastMessage = (action: string, context?: any): ToastMessage => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const messages: Record<string, { message: string; type: ToastMessage['type'] }> = {
    characterCreated: { message: 'Character created successfully!', type: 'success' },
    campaignCreated: { message: 'Campaign created successfully!', type: 'success' },
    campaignPaused: { message: 'Campaign paused', type: 'info' },
    campaignResumed: { message: 'Campaign resumed', type: 'success' },
    welcomeBack: { message: 'Welcome back to your adventure!', type: 'success' },
    ftueSkipped: { message: 'Tutorial skipped', type: 'info' },
  };
  
  const defaultMessage = { message: 'Action completed', type: 'success' as const };
  const toastData = messages[action] || defaultMessage;
  
  return {
    id,
    message: toastData.message,
    type: toastData.type,
  };
};

const AIDungeonMaster = () => {
  // Combat service instance
  const combatService = React.useMemo(() => new CombatService(), []);
  
  // Success feedback state
  const [successFeedback, setSuccessFeedback] = useState<{
    message: string;
    icon: React.ReactNode;
    duration: number;
  } | null>(null);
  
  // Toast notifications state
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  
  // Welcome overlay state
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  
  // Simple help state
  const [showHelp, setShowHelp] = useState(false);
  const [helpScreen, setHelpScreen] = useState('welcome');
  
  // Firebase authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Navigation state
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('gameplay');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Game state
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [playerName, setPlayerName] = useState('');
  const [character, setCharacter] = useState<any>(null);
  const [currentCampaign, setCurrentCampaign] = useState<MultiplayerGame | null>(null);
  const [campaigns, setCampaigns] = useState<MultiplayerGame[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState('default');
  const [statusEffects, setStatusEffects] = useState<Record<string, any>>({});
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showLevelUp, setShowLevelUp] = useState<any>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState<any>(null);
  const [combatState, setCombatState] = useState<any>(null);
  const [combatLog, setCombatLog] = useState<any[]>([]);
  const [battleMap, setBattleMap] = useState<any>(null);
  const [selectedCombatant, setSelectedCombatant] = useState<any>(null);
  const [hoveredTile, setHoveredTile] = useState<any>(null);
  const [targetingMode, setTargetingMode] = useState<any>(null);
  const [lineOfSightCache, setLineOfSightCache] = useState<Record<string, any>>({});
  const [worldState, setWorldState] = useState<any>({
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
  });
  const [showWorldEvents, setShowWorldEvents] = useState(false);
  const [pendingChoices, setPendingChoices] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const gameInputRef = useRef<HTMLInputElement>(null);

  // Multiplayer state
  const [isConnected, setIsConnected] = useState(false);
  const [partyState, setPartyState] = useState<{
    players: Player[];
    isHost: boolean;
    lastSync: Date | null;
  }>({
    players: [],
    isHost: false,
    lastSync: null
  });

  // Drawer tab state for right drawer
  const [activeDrawerTab, setActiveDrawerTab] = useState('chat');

  // Enhanced AI Dungeon Master System
  const [aiMemory, setAiMemory] = useState<any>({
    playerActions: [],
    npcInteractions: {},
    combatHistory: [],
    explorationHistory: [],
    playerPreferences: {},
    storyThreads: [],
    consequences: []
  });

  // Add at the top of AIDungeonMaster
  const [drawerWidth, setDrawerWidth] = useState(400);
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 600;

  // Show success feedback
  const showSuccessFeedback = (type: string) => {
    // Convert to toast notification instead
    addToast(type);
  };
  
  // Toast notification functions
  const addToast = (action: string, context?: any) => {
    const toast = generateToastMessage(action, context);
    setToastMessages(prev => [...prev, toast]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => dismissToast(toast.id), 5000);
    
    // Show success feedback for certain actions
    if (action === 'characterCreated') {
      showSuccessFeedback('character');
    } else if (action === 'campaignCreated') {
      showSuccessFeedback('campaign');
    } else if (action === 'campaignPaused') {
      showSuccessFeedback('pause');
    } else if (action === 'campaignResumed') {
      showSuccessFeedback('resume');
    }
  };
  
  const dismissToast = (id: string) => {
    setToastMessages(prev => prev.filter(toast => toast.id !== id));
  };

  // Generate unique player ID on load
  useEffect(() => {
    if (!playerId) {
      setPlayerId(Date.now().toString(36) + Math.random().toString(36).substr(2));
    }
  }, [playerId]);

  // Firebase authentication and data loading
  useEffect(() => {
    // Track session start and device info
    analyticsService.trackSessionStart();
    analyticsService.trackDeviceInfo();
    analyticsService.trackPageView('welcome', 'MythSeeker - Welcome');

    // Track performance metrics
    const startTime = performance.now();
    const trackLoadTime = () => {
      const loadTime = performance.now() - startTime;
      analyticsService.trackPerformance('app_load_time', loadTime);
    };

    // Track when app is fully loaded
    if (document.readyState === 'complete') {
      trackLoadTime();
    } else {
      window.addEventListener('load', trackLoadTime);
    }

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - startTime;
      analyticsService.trackSessionEnd(sessionDuration);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    const unsubscribe = firebaseService.onAuthStateChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? `User signed in (${firebaseUser.uid})` : 'User signed out');
      
      if (firebaseUser) {
        try {
          // Track authentication success
          analyticsService.trackUserAction('user_authenticated', {
            user_id: firebaseUser.uid,
            display_name: firebaseUser.displayName
          });

          // Set analytics user ID and properties
          analyticsService.setUserId(firebaseUser.uid);
          analyticsService.setUserProperties({
            user_type: firebaseUser.displayName ? 'authenticated' : 'anonymous',
            account_created: firebaseUser.metadata?.creationTime || 'unknown'
          });

          // Get user profile
          console.log('Loading user profile for:', firebaseUser.uid);
          const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
          if (userProfile) {
            setCurrentUser(userProfile);
            setPlayerName(userProfile.displayName);
            setIsAuthenticated(true);
            
            // Load user's characters
            console.log('Loading characters for user:', firebaseUser.uid);
            const characters = await firebaseService.getUserCharacters(firebaseUser.uid);
            setUserCharacters(characters);
            
            // Track user profile loaded
            analyticsService.trackUserAction('profile_loaded', {
              characters_count: characters.length,
              has_characters: characters.length > 0
            });
            
            // If user has characters, show character selection or resume game
            if (characters.length > 0) {
              setCurrentScreen('character-select');
              analyticsService.trackPageView('character-select', 'MythSeeker - Character Selection');
            } else {
              setCurrentScreen('welcome');
              analyticsService.trackPageView('welcome', 'MythSeeker - Welcome');
            }
          } else {
            setCurrentScreen('welcome');
            analyticsService.trackPageView('welcome', 'MythSeeker - Welcome');
          }
        } catch (firebaseError) {
          console.warn('Firebase error loading user data (falling back to local storage):', firebaseError);
          // If Firebase fails, try to load from local storage
          const localCharacters = JSON.parse(localStorage.getItem('mythseeker_characters') || '[]');
          if (localCharacters.length > 0) {
            setUserCharacters(localCharacters);
            setCurrentScreen('character-select');
            analyticsService.trackPageView('character-select', 'MythSeeker - Character Selection');
          } else {
            setCurrentScreen('welcome');
            analyticsService.trackPageView('welcome', 'MythSeeker - Welcome');
          }
          
          // User not authenticated
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // Track user sign out
        analyticsService.trackUserAction('user_signed_out');
        
        // User not authenticated - try to load from local storage
        console.log('User not authenticated, loading from local storage');
        const localCharacters = JSON.parse(localStorage.getItem('mythseeker_characters') || '[]');
        if (localCharacters.length > 0) {
          setUserCharacters(localCharacters);
          setCurrentScreen('character-select');
          analyticsService.trackPageView('character-select', 'MythSeeker - Character Selection');
        } else {
          setCurrentScreen('welcome');
          analyticsService.trackPageView('welcome', 'MythSeeker - Welcome');
        }
        
        // User not authenticated
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('load', trackLoadTime);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleSignInRedirect = async () => {
      try {
        const user = await firebaseService.handleRedirectSignIn();
        if (user) {
          // The onAuthStateChanged listener will handle the rest.
          console.log("Redirect sign in successful for user:", user.uid);
        }
      } catch (error) {
        console.error("Error during redirect sign in handling", error);
        addToast('error', { message: 'Failed to sign in. Please try again.' });
      }
    }
    handleSignInRedirect();
  }, []);

  // Initialize AI service
  useEffect(() => {
    // Ensure AI service is available
    if (typeof window !== 'undefined' && !(window as any).claude) {
      (window as any).claude = {
        complete: (prompt: string) => aiService.complete(prompt)
      };
    }
  }, []);

  // Character management functions
  const saveCharacter = async (characterData: any) => {
    console.log('saveCharacter called with:', characterData);
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('No current user found, saving to local storage');
      // Save to local storage for unauthenticated users
      const localCharacter: Character = {
        id: Date.now().toString(),
        userId: 'local', // Use 'local' as userId for local characters
        name: characterData.name,
        class: characterData.class,
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        gold: 100,
        inventory: {
          'Healing Potion': 3,
          'Iron Ore': 2,
          'Herb': 5
        },
        equipment: {
          weapon: { name: 'Iron Sword', type: 'weapon' },
          armor: { name: 'Leather Armor', type: 'armor' }
        },
        stats: characterData.baseStats,
        skills: characterData.skills || {},
        achievements: [],
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        totalPlayTime: 0
      };

      // Save to localStorage
      const localCharacters = JSON.parse(localStorage.getItem('mythseeker_characters') || '[]');
      localCharacters.push(localCharacter);
      localStorage.setItem('mythseeker_characters', JSON.stringify(localCharacters));
      
      addToast('characterCreated', { character: characterData });
      
      // Update local state
      setUserCharacters(prev => [localCharacter, ...prev]);
      setCharacter(localCharacter);
      setCurrentScreen('lobby');
      
      console.log('Character saved to local storage, navigating to lobby');
      return;
    }

    try {
      const firebaseCharacter: Character = {
        userId: currentUser.uid,
        name: characterData.name,
        class: characterData.class,
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        gold: 100,
        inventory: {
          'Healing Potion': 3,
          'Iron Ore': 2,
          'Herb': 5
        },
        equipment: {
          weapon: { name: 'Iron Sword', type: 'weapon' },
          armor: { name: 'Leather Armor', type: 'armor' }
        },
        stats: characterData.baseStats,
        skills: characterData.skills || {},
        achievements: [],
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        totalPlayTime: 0
      };

      console.log('Saving character to Firebase:', firebaseCharacter);
      const characterId = await firebaseService.saveCharacter(firebaseCharacter);
      console.log('Character saved with ID:', characterId);
      
      addToast('characterCreated', { character: characterData });
      
      // Update local state
      const savedCharacter = { ...firebaseCharacter, id: characterId };
      setUserCharacters(prev => [savedCharacter, ...prev]);
      setCharacter(savedCharacter);
      setCurrentScreen('lobby');
      
      console.log('Character state updated, navigating to lobby');
    } catch (error) {
      console.error('Error saving character:', error);
      addToast('error', { message: 'Failed to save character. Please try signing in again.' });
    }
  };

  const loadCharacter = async (characterId: string) => {
    try {
      // First try to load from local storage
      const localCharacters = JSON.parse(localStorage.getItem('mythseeker_characters') || '[]');
      const localCharacter = localCharacters.find((c: any) => c.id === characterId);
      
      if (localCharacter) {
        setCharacter(localCharacter);
        setCurrentScreen('lobby');
        addToast('characterLoaded', { character: localCharacter.name });
        return;
      }
      
      // If not found locally and user is authenticated, try Firebase
      if (currentUser) {
        const character = await firebaseService.getCharacter(characterId);
        if (character) {
          setCharacter(character);
          setCurrentScreen('lobby');
          addToast('characterLoaded', { character: character.name });
        }
      } else {
        addToast('error', { message: 'Character not found' });
      }
    } catch (error) {
      console.error('Error loading character:', error);
      addToast('error', { message: 'Failed to load character' });
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await firebaseService.signInWithGoogle();
      addToast('welcome', { message: 'Welcome to MythSeeker!' });
    } catch (error) {
      console.error('Error signing in:', error);
      addToast('error', { message: 'Failed to sign in' });
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseService.signOut();
      setCharacter(null);
      setCurrentCampaign(null);
      setUserCharacters([]);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('welcome');
      addToast('goodbye', { message: 'See you next time, adventurer!' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Multiplayer campaign subscription
  useEffect(() => {
    if (currentCampaign?.id) {
      const unsubscribe = multiplayerService.subscribeToCampaign(
        currentCampaign.id,
        (updatedCampaign) => {
          setCurrentCampaign(updatedCampaign);
          setMessages(updatedCampaign.messages || []);
          setPartyState({
            players: updatedCampaign.players || [],
            isHost: multiplayerService.isHost(updatedCampaign),
            lastSync: new Date()
          });
          setIsConnected(true);
        }
      );

      // Start heartbeat
      const heartbeatCleanup = multiplayerService.startHeartbeat(currentCampaign.id);

      return () => {
        unsubscribe();
        heartbeatCleanup();
      };
    }
  }, [currentCampaign?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Restore focus to input field after AI responses
  useEffect(() => {
    if (!isAIThinking && gameInputRef.current) {
      gameInputRef.current.focus();
    }
  }, [isAIThinking]);

  // Navigation handlers
  const handleNavChange = (navKey: string) => {
    setActiveNav(navKey);
    
    // Map navigation keys to screens
    switch (navKey) {
      case 'dashboard':
        setCurrentScreen('dashboard');
        break;
      case 'campaigns':
        setCurrentScreen('lobby');
        break;
      case 'characters':
        setCurrentScreen('character');
        break;
      case 'party':
        setCurrentScreen('party');
        break;
      case 'world':
        setCurrentScreen('world');
        break;
      case 'combat':
        setCurrentScreen('combat');
        break;
      case 'magic':
        setCurrentScreen('magic');
        break;
      default:
        setCurrentScreen('dashboard');
    }
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
  };

  const handleHelpAction = (action: string, data?: any) => {
    switch (action) {
      case 'close':
        setShowHelp(false);
        break;
      case 'navigate':
        setHelpScreen(data.screen);
        break;
      case 'search':
        // Handle help search
        break;
      default:
        console.log('Help action:', action, data);
    }
    analyticsService.trackUserAction('help_action', { action, data });
  };

  const handleNewCampaign = () => {
    setActiveNav('campaigns');
    setCurrentScreen('lobby');
  };

  const sendMultiplayerMessage = async (message: string) => {
    if (!message.trim() || !currentCampaign?.id) return;

    try {
      await multiplayerService.sendMessage(currentCampaign.id, {
        type: 'player',
        content: message,
        character: character?.name,
        playerId: playerId!,
        playerName: playerName
      });
      showSuccessFeedback('messageSent');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Campaign persistence and management
  const saveCampaign = async (campaign: any) => {
    if (!campaign?.id) {
      console.warn('Attempted to save campaign without ID');
      return;
    }
    
    try {
      console.log('Saving campaign:', campaign.id, campaign.theme);
      
      // Always save to local storage first for immediate persistence
      const savedCampaigns = JSON.parse(localStorage.getItem('mythseeker_campaigns') || '[]');
      const existingIndex = savedCampaigns.findIndex((c: any) => c.id === campaign.id);
      
      if (existingIndex >= 0) {
        savedCampaigns[existingIndex] = campaign;
      } else {
        savedCampaigns.push(campaign);
      }
      
      localStorage.setItem('mythseeker_campaigns', JSON.stringify(savedCampaigns));
      console.log('Campaign saved to localStorage:', campaign.id);
      
      // Update local state immediately
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? campaign : c));
      
      // Try to save to Firebase if multiplayer and authenticated
      if (campaign.isMultiplayer && isAuthenticated && currentUser) {
        try {
          await multiplayerService.updateCampaignState(campaign.id, {
            messages: campaign.messages || [],
            systemMessages: campaign.systemMessages || [],
            started: campaign.started,
            worldState: campaign.worldState,
            currentEnvironment: campaign.currentEnvironment,
            combatState: campaign.combatState,
            lastActivity: new Date() as any
          });
          console.log('Campaign saved to Firebase:', campaign.id);
        } catch (firebaseError) {
          console.error('Error saving to Firebase, but localStorage backup exists:', firebaseError);
        }
      }
      
      console.log('Campaign saved successfully:', campaign.id);
    } catch (error) {
      console.error('Error saving campaign:', error);
      // Even if there's an error, try to save to localStorage as last resort
      try {
        const savedCampaigns = JSON.parse(localStorage.getItem('mythseeker_campaigns') || '[]');
        const existingIndex = savedCampaigns.findIndex((c: any) => c.id === campaign.id);
        
        if (existingIndex >= 0) {
          savedCampaigns[existingIndex] = campaign;
        } else {
          savedCampaigns.push(campaign);
        }
        
        localStorage.setItem('mythseeker_campaigns', JSON.stringify(savedCampaigns));
        console.log('Campaign saved to localStorage as fallback:', campaign.id);
      } catch (localStorageError) {
        console.error('Failed to save campaign even to localStorage:', localStorageError);
      }
    }
  };

  const loadCampaigns = async () => {
    try {
      console.log('Loading campaigns...');
      
      // Always load from local storage first for immediate availability
      const savedCampaigns = JSON.parse(localStorage.getItem('mythseeker_campaigns') || '[]');
      console.log('Found campaigns in localStorage:', savedCampaigns.length);
      
      // Set campaigns immediately from localStorage
      setCampaigns(savedCampaigns);
      
      // Try to load from Firebase for multiplayer campaigns (if authenticated)
      if (isAuthenticated && currentUser) {
        try {
          const firebaseCampaigns = await multiplayerService.getUserCampaigns();
          console.log('Found campaigns in Firebase:', firebaseCampaigns.length);
          
          // Merge campaigns, prioritizing Firebase data for multiplayer campaigns
          const mergedCampaigns = savedCampaigns.map((localCampaign: any) => {
            const firebaseCampaign = firebaseCampaigns.find((fc: any) => fc.id === localCampaign.id);
            return firebaseCampaign || localCampaign;
          });
          
          // Add Firebase-only campaigns
          firebaseCampaigns.forEach((firebaseCampaign: any) => {
            if (!mergedCampaigns.find((c: any) => c.id === firebaseCampaign.id)) {
              mergedCampaigns.push(firebaseCampaign);
            }
          });
          
          // Update state and localStorage with merged data
          setCampaigns(mergedCampaigns);
          localStorage.setItem('mythseeker_campaigns', JSON.stringify(mergedCampaigns));
          
          console.log('Total campaigns after merge:', mergedCampaigns.length);
        } catch (firebaseError) {
          console.error('Error loading from Firebase, using localStorage only:', firebaseError);
          // Keep using localStorage campaigns
        }
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      // Fallback to empty array
      setCampaigns([]);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      console.log('Deleting campaign:', campaignId);
      
      // Find the campaign to delete
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        console.error('Campaign not found:', campaignId);
        addToast('error', { message: 'Campaign not found' });
        return;
      }
      
      // Try to remove from Firebase if multiplayer and authenticated
      if (campaign.isMultiplayer && isAuthenticated && currentUser) {
        try {
          await multiplayerService.deleteCampaign(campaignId);
          console.log('Campaign deleted from Firebase:', campaignId);
        } catch (firebaseError) {
          console.warn('Failed to delete from Firebase, but will continue with localStorage:', firebaseError);
          // Continue with localStorage deletion even if Firebase fails
        }
      }
      
      // Always remove from local storage (primary storage)
      const savedCampaigns = JSON.parse(localStorage.getItem('mythseeker_campaigns') || '[]');
      const filteredCampaigns = savedCampaigns.filter((c: any) => c.id !== campaignId);
      localStorage.setItem('mythseeker_campaigns', JSON.stringify(filteredCampaigns));
      console.log('Campaign deleted from localStorage:', campaignId);
      
      // Update local state
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      
      // Clear current campaign if it's the one being deleted
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(null);
        setCurrentScreen('lobby');
      }
      
      addToast('campaignDeleted', { campaign });
      console.log('Campaign deleted successfully:', campaignId);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      addToast('error', { message: 'Failed to delete campaign. Please try again.' });
    }
  };

  const joinCampaign = async (campaignCode: string) => {
    if (!campaignCode.trim() || !character) return;
    
    try {
      const campaignId = await multiplayerService.joinCampaign(campaignCode, {
        name: playerName,
        character: character,
        isHost: false,
        isOnline: true,
        status: 'ready' as const
      });
      
      // Load the joined campaign
      const joinedCampaign = await multiplayerService.getCampaign(campaignId);
      if (joinedCampaign) {
        setCurrentCampaign(joinedCampaign);
        setCampaigns(prev => {
          const existing = prev.find(c => c.id === joinedCampaign.id);
          return existing ? prev.map(c => c.id === joinedCampaign.id ? joinedCampaign : c) : [...prev, joinedCampaign];
        });
        
        if (joinedCampaign.started) {
          setCurrentScreen('game');
        } else {
          setCurrentScreen('waiting');
        }
        
        addToast('campaignJoined', { campaign: joinedCampaign });
      }
    } catch (error) {
      console.error('Error joining campaign:', error);
      alert('Failed to join campaign. Please check the code and try again.');
    }
  };

  // Auto-save campaign when it changes
  useEffect(() => {
    if (currentCampaign && currentCampaign.started) {
      const autoSaveTimer = setTimeout(() => {
        saveCampaign(currentCampaign);
      }, 30000); // Auto-save every 30 seconds
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [currentCampaign]);

  // Load campaigns on app start and when character changes
  useEffect(() => {
    loadCampaigns();
  }, [character, isAuthenticated]);

  // Load campaigns from localStorage on initial load (before authentication)
  useEffect(() => {
    const savedCampaigns = JSON.parse(localStorage.getItem('mythseeker_campaigns') || '[]');
    if (savedCampaigns.length > 0) {
      setCampaigns(savedCampaigns);
      console.log('Loaded campaigns from localStorage:', savedCampaigns.length);
    }
  }, []);

  // Save campaign when messages change
  useEffect(() => {
    if (currentCampaign && messages.length > 0) {
      const updatedCampaign = { ...currentCampaign, messages };
      saveCampaign(updatedCampaign);
    }
  }, [messages]);

  // Classes with enhanced skill system
  const classes = [
    { 
      name: 'Warrior', 
      icon: '⚔️', 
      stats: { strength: 16, dexterity: 12, intelligence: 10, charisma: 8 },
      actionPoints: { move: 6, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Power Strike', description: 'Deal +50% damage on next attack', cost: 'Action', type: 'attack', range: 1 },
        3: { name: 'Shield Wall', description: 'Reduce all damage by 3 for 3 turns', cost: 'Action', type: 'defense', range: 0 },
        5: { name: 'Berserker Rage', description: 'Double damage but take +50% damage for 3 turns', cost: 'Bonus Action', type: 'buff', range: 0 },
        7: { name: 'Intimidating Shout', description: 'Fear nearby enemies for 2 turns', cost: 'Action', type: 'control', range: 3, aoe: true },
        10: { name: 'Legendary Strike', description: 'Guaranteed critical hit', cost: 'Action', type: 'attack', range: 1 }
      }
    },
    { 
      name: 'Rogue', 
      icon: '🗡️', 
      stats: { strength: 10, dexterity: 16, intelligence: 12, charisma: 8 },
      actionPoints: { move: 8, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Sneak Attack', description: 'Deal double damage if target is unaware', cost: 'Free', type: 'attack', range: 1 },
        3: { name: 'Shadow Step', description: 'Teleport behind enemy and gain advantage', cost: 'Movement', type: 'movement', range: 6 },
        5: { name: 'Poison Blade', description: 'Next 3 attacks apply poison (3 damage/turn)', cost: 'Bonus Action', type: 'buff', range: 0 },
        7: { name: 'Smoke Bomb', description: 'Become invisible for 2 turns', cost: 'Action', type: 'stealth', range: 0, aoe: true, radius: 2 },
        10: { name: 'Assassinate', description: 'Instant kill if target below 25% health', cost: 'Action', type: 'attack', range: 1 }
      }
    },
    { 
      name: 'Mage', 
      icon: '🔮', 
      stats: { strength: 8, dexterity: 10, intelligence: 16, charisma: 12 },
      actionPoints: { move: 5, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Magic Missile', description: 'Deal 1d4+1 force damage, never misses', cost: '1 Spell Slot', type: 'attack', range: 8 },
        3: { name: 'Shield Spell', description: 'Gain +5 AC until start of next turn', cost: 'Reaction', type: 'defense', range: 0 },
        5: { name: 'Fireball', description: 'Deal 3d6 fire damage in large area', cost: '1 Spell Slot', type: 'aoe', range: 10, radius: 3 },
        7: { name: 'Counterspell', description: 'Cancel enemy spell or ability', cost: 'Reaction', type: 'control', range: 8 },
        10: { name: 'Meteor Storm', description: 'Devastate entire battlefield', cost: '2 Spell Slots', type: 'aoe', range: 15, radius: 5 }
      }
    },
    { 
      name: 'Cleric', 
      icon: '⚡', 
      stats: { strength: 12, dexterity: 8, intelligence: 12, charisma: 16 },
      actionPoints: { move: 5, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Healing Word', description: 'Restore 1d4+CHA mod HP to ally', cost: '1 Spell Slot', type: 'heal', range: 8 },
        3: { name: 'Turn Undead', description: 'Force undead creatures to flee', cost: 'Action', type: 'control', range: 6, aoe: true },
        5: { name: 'Sacred Flame', description: 'Divine damage that ignores armor', cost: '1 Spell Slot', type: 'attack', range: 8 },
        7: { name: 'Mass Healing', description: 'Heal all allies for 2d4+CHA', cost: '2 Spell Slots', type: 'heal', range: 6, aoe: true },
        10: { name: 'Divine Intervention', description: 'Call upon divine aid in dire situations', cost: '3 Spell Slots', type: 'special', range: 0 }
      }
    },
    { 
      name: 'Ranger', 
      icon: '🏹', 
      stats: { strength: 14, dexterity: 14, intelligence: 10, charisma: 8 },
      actionPoints: { move: 7, action: 1, bonus: 1, reaction: 1 },
      reach: 10,
      skills: {
        1: { name: 'Hunter\'s Mark', description: 'Mark target for +1d6 damage on attacks', cost: 'Bonus Action', type: 'buff', range: 10 },
        3: { name: 'Multi-Shot', description: 'Attack up to 3 enemies with ranged weapon', cost: 'Action', type: 'attack', range: 10 },
        5: { name: 'Animal Companion', description: 'Summon beast ally for entire combat', cost: 'Action', type: 'summon', range: 3 },
        7: { name: 'Explosive Shot', description: 'Ranged attack that damages nearby enemies', cost: 'Action', type: 'aoe', range: 10, radius: 2 },
        10: { name: 'Rain of Arrows', description: 'Attack all enemies in large area', cost: 'Action', type: 'aoe', range: 12, radius: 4 }
      }
    },
    { 
      name: 'Bard', 
      icon: '🎵', 
      stats: { strength: 8, dexterity: 12, intelligence: 10, charisma: 16 },
      actionPoints: { move: 6, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Inspiration', description: 'Give ally advantage on next roll', cost: 'Bonus Action', type: 'support', range: 6 },
        3: { name: 'Cutting Words', description: 'Reduce enemy attack/damage by 1d6', cost: 'Reaction', type: 'debuff', range: 6 },
        5: { name: 'Song of Rest', description: 'Party heals +1d6 HP during short rest', cost: 'Short Rest', type: 'heal', range: 0 },
        7: { name: 'Mass Suggestion', description: 'Control multiple enemies for 1 turn', cost: 'Action', type: 'control', range: 8, aoe: true },
        10: { name: 'Power Word Kill', description: 'Instantly kill enemy below 100 HP', cost: 'Action', type: 'attack', range: 8 }
      }
    }
  ];

  // Campaign themes
  const campaignThemes = [
    { name: 'Classic Fantasy', description: 'Dragons, magic, and heroic quests in a medieval world', icon: '🏰', bg: 'fantasy' },
    { name: 'Sci-Fi Adventure', description: 'Space exploration, alien encounters, and futuristic technology', icon: '🚀', bg: 'scifi' },
    { name: 'Horror Mystery', description: 'Dark secrets, supernatural threats, and psychological tension', icon: '👻', bg: 'horror' },
    { name: 'Urban Fantasy', description: 'Magic hidden in the modern world, supernatural creatures in cities', icon: '🌃', bg: 'urban' },
    { name: 'Post-Apocalyptic', description: 'Surviving in a world after civilization has collapsed', icon: '☢️', bg: 'apocalypse' },
    { name: 'Pirate Adventure', description: 'High seas, treasure hunting, and swashbuckling action', icon: '🏴‍☠️', bg: 'pirate' }
  ];

  // Environment gradients
  const environments = {
    default: 'from-purple-900 via-blue-900 to-indigo-900',
    fantasy: 'from-emerald-900 via-green-800 to-teal-900',
    dungeon: 'from-gray-900 via-slate-800 to-stone-900',
    forest: 'from-green-900 via-emerald-800 to-lime-900',
    tavern: 'from-amber-900 via-orange-800 to-yellow-900',
    scifi: 'from-cyan-900 via-blue-800 to-indigo-900',
    horror: 'from-red-900 via-purple-900 to-black',
    urban: 'from-slate-900 via-gray-800 to-zinc-900',
    apocalypse: 'from-orange-900 via-red-800 to-yellow-900',
    pirate: 'from-blue-900 via-teal-800 to-cyan-900'
  };

  // Equipment system
  const equipmentTypes: Record<string, Record<string, any>> = {
    weapon: {
      'Iron Sword': { attack: 3, durability: 100, rarity: 'common', price: 50 },
      'Steel Blade': { attack: 5, durability: 120, rarity: 'uncommon', price: 150 },
      'Enchanted Sword': { attack: 7, magic: 2, durability: 150, rarity: 'rare', price: 500 },
      'Dragon Slayer': { attack: 10, crit: 2, durability: 200, rarity: 'legendary', price: 2000 },
      'Basic Staff': { magic: 4, mana: 10, durability: 80, rarity: 'common', price: 75 },
      'Crystal Staff': { magic: 7, mana: 20, durability: 100, rarity: 'rare', price: 400 },
      'War Bow': { attack: 4, range: true, durability: 90, rarity: 'common', price: 80 },
      'Elven Bow': { attack: 6, crit: 1, range: true, durability: 120, rarity: 'uncommon', price: 300 }
    },
    armor: {
      'Leather Armor': { defense: 2, durability: 80, rarity: 'common', price: 40 },
      'Chain Mail': { defense: 4, durability: 120, rarity: 'uncommon', price: 120 },
      'Plate Armor': { defense: 6, durability: 180, rarity: 'rare', price: 400 },
      'Dragon Scale': { defense: 8, magic: 3, durability: 250, rarity: 'legendary', price: 1500 },
      'Mage Robes': { magic: 3, mana: 15, durability: 60, rarity: 'uncommon', price: 100 },
      'Archmage Robes': { magic: 6, mana: 30, durability: 100, rarity: 'rare', price: 600 }
    }
  };

  // Achievement system
  const achievementCategories = {
    combat: {
      name: 'Combat Mastery',
      icon: '⚔️',
      achievements: [
        { id: 'first_blood', name: 'First Blood', description: 'Win your first combat', points: 10 },
        { id: 'critical_master', name: 'Critical Master', description: 'Score 10 critical hits', points: 25 },
        { id: 'untouchable', name: 'Untouchable', description: 'Win a combat without taking damage', points: 50 },
        { id: 'legendary_warrior', name: 'Legendary Warrior', description: 'Defeat a legendary enemy', points: 100 }
      ]
    },
    exploration: {
      name: 'World Explorer',
      icon: '🗺️',
      achievements: [
        { id: 'first_steps', name: 'First Steps', description: 'Start your first adventure', points: 5 },
        { id: 'dungeon_delver', name: 'Dungeon Delver', description: 'Explore 5 different dungeons', points: 30 },
        { id: 'world_traveler', name: 'World Traveler', description: 'Visit 10 different locations', points: 75 },
        { id: 'master_explorer', name: 'Master Explorer', description: 'Discover all secret areas', points: 200 }
      ]
    },
    social: {
      name: 'Diplomatic',
      icon: '👥',
      achievements: [
        { id: 'first_friend', name: 'First Friend', description: 'Gain positive reputation with a faction', points: 15 },
        { id: 'peacemaker', name: 'Peacemaker', description: 'Resolve a conflict without violence', points: 40 },
        { id: 'faction_leader', name: 'Faction Leader', description: 'Become leader of a major faction', points: 150 },
        { id: 'world_shaper', name: 'World Shaper', description: 'Change the course of history', points: 300 }
      ]
    }
  };

  // Utility functions
  const rollDice = (sides = 20) => Math.floor(Math.random() * sides) + 1;
  const getModifier = (stat: number) => Math.floor((stat - 10) / 2);
  const generateCampaignCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

  const calculateStats = (character: any) => {
    if (!character) return null;
    
    let totalStats: Record<string, number> = character.baseStats ? { ...character.baseStats } : { strength: 10, dexterity: 10, intelligence: 10, charisma: 10 };
    let bonuses = { attack: 0, defense: 0, magic: 0, health: 0, mana: 0, crit: 0 };
    
    // Equipment bonuses
    if (character.equipment) {
      Object.values(character.equipment).forEach((item: any) => {
        if (item && equipmentTypes[item.type] && equipmentTypes[item.type][item.name]) {
          const itemStats = equipmentTypes[item.type][item.name];
          Object.keys(itemStats).forEach((stat: string) => {
            if (stat !== 'durability' && stat !== 'rarity' && stat !== 'price' && stat !== 'range') {
              if (typeof totalStats[stat] === 'number') {
                totalStats[stat] += itemStats[stat];
              } else if (typeof bonuses[stat as keyof typeof bonuses] === 'number') {
                bonuses[stat as keyof typeof bonuses] += itemStats[stat];
              }
            }
          });
        }
      });
    }
    
    // Level bonuses
    const levelBonus = Math.floor((character.level || 1) / 2);
    Object.keys(totalStats).forEach(stat => {
      totalStats[stat] += levelBonus;
    });
    
    return { ...totalStats, ...bonuses };
  };

  const checkAchievements = (action: string, context: any = {}) => {
    // Achievement checking logic would go here
    // This is a simplified version
    const newAchievements: any[] = [];
    
    if (action === 'combat_win' && !achievements.find(a => a.id === 'first_blood')) {
      newAchievements.push(achievementCategories.combat.achievements[0]);
    }
    
    if (action === 'adventure_start' && !achievements.find(a => a.id === 'first_steps')) {
      newAchievements.push(achievementCategories.exploration.achievements[0]);
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      // Show achievement notification
      newAchievements.forEach(achievement => {
        setTimeout(() => {
          alert(`🏆 Achievement Unlocked: ${achievement.name}! (+${achievement.points} points)`);
        }, 500);
      });
    }
  };

  const createCharacter = (characterData: any) => {
    const classData = classes.find(c => c.name === characterData.class);
    if (!classData) {
      addToast('error', { message: 'Invalid character class' });
      return;
    }

    const newCharacter = {
      ...characterData,
      baseStats: classData.stats,
      skills: classData.skills,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      level: 1,
      experience: 0,
      gold: 100,
      inventory: {
        'Healing Potion': 3,
        'Iron Ore': 2,
        'Herb': 5
      },
      equipment: {
        weapon: { name: 'Iron Sword', type: 'weapon' },
        armor: { name: 'Leather Armor', type: 'armor' }
      },
      unlockedSkills: [1], // Start with level 1 skill
      id: playerId,
      playerId: playerId
    };

    // Save character to Firebase
    saveCharacter(newCharacter);
  };

  const createCampaign = async (theme: any, customPrompt = '', isMultiplayer = true) => {
    const campaignCode = generateCampaignCode();
    
    const newCampaign = {
      code: campaignCode,
      theme: theme.name,
      background: theme.bg,
      players: [{ 
        id: playerId || 'unknown', 
        name: playerName, 
        character: { ...character, playerId },
        isHost: true,
        isOnline: true,
        status: 'ready' as const
      }],
      messages: [],
      systemMessages: [],
      started: false,
      customPrompt,
      isMultiplayer,
      maxPlayers: isMultiplayer ? 6 : 1
    };

    try {
      let createdCampaign;
      
      // Only try to create in Firebase if authenticated and multiplayer
      if (isMultiplayer && isAuthenticated && currentUser) {
        try {
          const gameId = await multiplayerService.createCampaign(newCampaign as any);
          createdCampaign = { ...newCampaign, id: gameId } as any;
        } catch (firebaseError) {
          console.warn('Failed to create campaign in Firebase, creating local only:', firebaseError);
          // Fallback to local campaign creation
          createdCampaign = { ...newCampaign, id: Date.now().toString() } as any;
        }
      } else {
        // Create local campaign only
        createdCampaign = { ...newCampaign, id: Date.now().toString() } as any;
      }
      
      // Save the campaign
      await saveCampaign(createdCampaign);
      
      setCampaigns([...campaigns, createdCampaign]);
      setCurrentCampaign(createdCampaign);
      setCurrentEnvironment(theme.bg);
      
      // Add fun toast notification
      addToast('campaignCreated', { campaign: createdCampaign });
      
      checkAchievements('adventure_start');
      
      if (isMultiplayer) {
        setCurrentScreen('waiting');
      } else {
        await startCampaign(createdCampaign);
      }
      // handleFTUEStepComplete('create-campaign'); // Removed as per edit hint
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  const startCampaign = async (campaign: any) => {
    setIsAIThinking(true);
    
    // Add null checks and fallbacks
    if (!campaign) {
      console.error('Campaign is undefined');
      setIsAIThinking(false);
      return;
    }
    
    // Ensure campaign.players is always a valid array
    if (!campaign.players || !Array.isArray(campaign.players)) {
      console.warn('Campaign players is undefined or not an array, creating fallback:', campaign.players);
      
      // Handle case where players might be stored as an object
      let playersArray: any[] = [];
      if (campaign.players && typeof campaign.players === 'object' && !Array.isArray(campaign.players)) {
        // Convert object to array if needed
        playersArray = Object.values(campaign.players).filter((p: any) => p !== null);
      }
      
      // If still no valid players, create fallback
      if (playersArray.length === 0) {
        playersArray = [{
          id: playerId || 'unknown',
          name: playerName || 'Unknown Player',
          character: character || { name: 'Unknown', level: 1, class: 'Adventurer' },
          isHost: true,
          isOnline: true,
          status: 'ready' as const
        }];
      }
      
      campaign.players = playersArray;
    }

    // Initialize world state for the campaign
    const initialWorldState = {
      ...worldState,
      currentLocation: 'tavern', // Start in a tavern
      weather: 'clear',
      timeOfDay: 'evening',
      locations: {
        tavern: {
          name: 'The Prancing Pony',
          description: 'A cozy tavern with warm firelight and the sound of laughter',
          npcs: [],
          connections: ['market', 'inn', 'streets']
        }
      }
    };
    setWorldState(initialWorldState);

    // Generate enhanced initial prompt
    const initPrompt = generateAIPrompt('', true);

    try {
      console.log('Calling AI service with prompt:', initPrompt.substring(0, 200) + '...');
      const response = await aiService.complete(initPrompt, campaign);
      console.log('AI service response received:', response.substring(0, 200) + '...');
      const dmResponse = JSON.parse(response);
      
      // Update world state based on AI response
      if (dmResponse.worldStateUpdates) {
        updateWorldState(dmResponse.worldStateUpdates);
      }
      
      if (dmResponse.environment) {
        setCurrentEnvironment(dmResponse.environment);
      }
      
      const openingMessage = {
        id: Date.now(),
        type: 'dm',
        content: dmResponse.narrative,
        choices: dmResponse.choices,
        timestamp: new Date(),
        atmosphere: dmResponse.atmosphere
      };
      
      setMessages([openingMessage]);
      
      const startedCampaign = { ...campaign, started: true, status: 'active' };
      setCurrentCampaign(startedCampaign);
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? startedCampaign : c));
      
      setCurrentScreen('game');
    } catch (error) {
      console.error('Error starting campaign:', error);
      const fallbackMessage = {
        id: Date.now(),
        type: 'dm',
        content: `Welcome, brave adventurers, to your ${campaign.theme} journey! Your party stands at the threshold of an epic quest. What will you do?`,
        choices: ['Explore ahead', 'Gather information', 'Prepare equipment'],
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setCurrentScreen('game');
    }
    
    setIsAIThinking(false);
  };

  const pauseCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const pausedCampaign: MultiplayerGame = { ...campaign, status: 'paused' as const };
    setCampaigns(prev => prev.map(c => c.id === campaignId ? pausedCampaign : c));
    
    // If this is the current campaign, update it too
    if (currentCampaign?.id === campaignId) {
      setCurrentCampaign(pausedCampaign);
    }

    // Save to Firebase if multiplayer
    if (campaign.isMultiplayer) {
      try {
        await multiplayerService.updateCampaign(campaignId, { status: 'paused' });
      } catch (error) {
        console.error('Error pausing campaign:', error);
      }
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const resumedCampaign: MultiplayerGame = { ...campaign, status: 'active' as const };
    setCampaigns(prev => prev.map(c => c.id === campaignId ? resumedCampaign : c));
    
    // If this is the current campaign, update it too
    if (currentCampaign?.id === campaignId) {
      setCurrentCampaign(resumedCampaign);
    }

    // Save to Firebase if multiplayer
    if (campaign.isMultiplayer) {
      try {
        await multiplayerService.updateCampaign(campaignId, { status: 'active' });
      } catch (error) {
        console.error('Error resuming campaign:', error);
      }
    }
  };

  const [chatError, setChatError] = useState<string | null>(null);
  
  // Rate limiter for chat messages
  const chatRateLimiter = React.useMemo(() => new RateLimiter(10, 60000), []); // 10 messages per minute

  const sendMessage = async () => {
    // Validate message using new validation utility
    const validation = validateChatMessage(inputMessage);
    if (!validation.isValid) {
      setChatError(validation.error || 'Invalid message');
      return;
    }

    // Check rate limiting
    const userKey = playerId || 'anonymous';
    if (!chatRateLimiter.isAllowed(userKey)) {
      const remainingTime = chatRateLimiter.getTimeUntilReset(userKey);
      setChatError(`Please wait ${Math.ceil(remainingTime / 1000)} seconds before sending another message`);
      return;
    }

    setChatError(null);
    if (isAIThinking) return;

    const sanitizedMessage = sanitizeInput(inputMessage);
    const playerMessage = {
      id: Date.now(),
      type: 'player',
      content: sanitizedMessage,
      character: character.name,
      playerId: playerId,
      playerName: playerName,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, playerMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsAIThinking(true);

    // Generate enhanced AI prompt with full context
    const dmPrompt = generateAIPrompt(sanitizedMessage, false);

    try {
      // Call AI service directly
      const response = await aiService.complete(dmPrompt, currentCampaign);
      const dmResponse = JSON.parse(response);
      
      // Update world state based on AI response
      if (dmResponse.worldStateUpdates) {
        updateWorldState(dmResponse.worldStateUpdates);
      }
      
      if (dmResponse.environment) {
        setCurrentEnvironment(dmResponse.environment);
      }

      // Handle character updates
      if (dmResponse.characterUpdates) {
        dmResponse.characterUpdates.forEach((update: CharacterUpdate) => {
          if (update.playerId === playerId) {
            setCharacter(prev => prev ? {
              ...prev,
              experience: prev.experience + (update.xpGain || 0),
              health: Math.max(1, Math.min(prev.maxHealth, prev.health + (update.statChanges?.health || 0))),
              mana: Math.max(0, Math.min(prev.maxMana, prev.mana + (update.statChanges?.mana || 0))),
              inventory: { ...prev.inventory, ...update.newItems }
            } : null);

            // Update reputation
            if (update.reputationChanges) {
              setWorldState(prev => ({
                ...prev,
                playerReputation: { ...prev.playerReputation, ...update.reputationChanges }
              }));
            }
          }
        });
      }
      
      const dmMessage = {
        id: Date.now() + 1,
        type: 'dm',
        content: dmResponse.narrative,
        choices: dmResponse.choices,
        timestamp: new Date(),
        atmosphere: dmResponse.atmosphere,
        worldStateUpdates: dmResponse.worldStateUpdates
      };
      
      setMessages(prev => [...prev, dmMessage]);

      // Handle combat encounters
      if (dmResponse.combatEncounter) {
        startCombat(dmResponse.combatEncounter.enemies);
      }
    } catch (error) {
      console.error('Error getting DM response:', error);
      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'dm',
        content: `The story continues to unfold... (AI temporarily unavailable)`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
    
    setIsAIThinking(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Allow all other keys to work normally for typing
  };

  // Combat functions
  const startCombat = (enemies: any[]) => {
    if (!character) return;

    // Convert character and enemies to combatants
    const playerCombatant: Combatant = {
      id: character.id || playerId || 'player',
      name: character.name,
      type: 'player',
      character: character,
      position: { x: 0, y: 0 }, // Will be set by combat service
      health: character.health,
      maxHealth: character.maxHealth,
      mana: character.mana,
      maxMana: character.maxMana,
      actionPoints: character.actionPoints || { move: 6, action: 1, bonus: 1, reaction: 1 },
      currentActionPoints: { move: 6, action: 1, bonus: 1, reaction: 1 },
      stats: {
        strength: character.baseStats?.strength || 10,
        dexterity: character.baseStats?.dexterity || 10,
        intelligence: character.baseStats?.intelligence || 10,
        charisma: character.baseStats?.charisma || 10,
        armorClass: 10
      },
      statusEffects: [],
      isActive: false,
      hasActed: false,
      reach: 1,
      skills: character.skills || {}
    };

    const enemyCombatants: Combatant[] = enemies.map((enemy, index) => ({
      id: `enemy-${index}`,
      name: enemy.name || `Enemy ${index + 1}`,
      type: 'enemy',
      position: { x: 0, y: 0 }, // Will be set by combat service
      health: enemy.health || 25,
      maxHealth: enemy.health || 25,
      actionPoints: { move: 4, action: 1, bonus: 0, reaction: 1 },
      currentActionPoints: { move: 4, action: 1, bonus: 0, reaction: 1 },
      stats: {
        strength: enemy.strength || 12,
        dexterity: enemy.dexterity || 10,
        intelligence: enemy.intelligence || 8,
        charisma: enemy.charisma || 8,
        armorClass: enemy.armorClass || 12
      },
      statusEffects: [],
      isActive: false,
      hasActed: false,
      reach: 1,
      skills: {}
    }));

    const allCombatants = [playerCombatant, ...enemyCombatants];
    const combatState = combatService.startCombat(allCombatants);
    setCombatState(combatState);
    setCurrentScreen('combat');
  };

  const handleCombatAction = (action: CombatAction) => {
    const result = combatService.executeAction(action);
    
    if (result.success && result.newState) {
      setCombatState(result.newState);
      
      // Check if combat has ended
      const combatEnd = combatService.checkCombatEnd();
      if (combatEnd.ended) {
        if (combatEnd.winner === 'players') {
          alert('Victory! You have defeated your enemies!');
          // Award experience and loot
          setCharacter(prev => prev ? {
            ...prev,
            experience: prev.experience + 50,
            health: Math.min(prev.maxHealth, prev.health + 20)
          } : null);
        } else {
          alert('Defeat! Your party has been defeated...');
          // Handle defeat - maybe respawn or game over
          setCharacter(prev => prev ? {
            ...prev,
            health: Math.max(1, prev.health - 10)
          } : null);
        }
        
        combatService.endCombat();
        setCombatState(null);
        setCurrentScreen('game');
      }
    } else {
      alert(result.message);
    }
  };

  const endCombat = () => {
    combatService.endCombat();
    setCombatState(null);
    setCurrentScreen('game');
  };

  // Generate dynamic AI prompt with context
  const generateAIPrompt = (playerInput: string, isInitialPrompt: boolean = false) => {
    const characterStats = calculateStats(character);
    const currentLocation = worldState.currentLocation || 'unknown';
    const timeOfDay = worldState.timeOfDay;
    const weather = worldState.weather;
    
    // Build context from recent actions
    const recentActions = aiMemory.playerActions.slice(-5);
    const recentConsequences = aiMemory.consequences.slice(-3);
    
    // Build NPC context
    const activeNPCs = Object.entries(worldState.npcs)
      .filter(([_, npc]: [string, any]) => npc.currentLocation === currentLocation)
      .map(([id, npc]: [string, any]) => `${npc.name} (${npc.role}): ${npc.currentMood}, ${npc.currentAction}`)
      .join('\n');

    // Build faction context
    const activeFactions = Object.entries(worldState.factions)
      .filter(([_, faction]: [string, any]) => faction.influence > 0)
      .map(([id, faction]: [string, any]) => `${faction.name}: ${faction.currentGoal}, Influence: ${faction.influence}`)
      .join('\n');

    // Build quest context
    const activeQuests = worldState.activeQuests
      .map((quest: any) => `${quest.title}: ${quest.description} (${quest.progress}/${quest.totalSteps})`)
      .join('\n');

    const basePrompt = `You are an advanced AI Dungeon Master for a ${currentCampaign?.theme || 'fantasy'} campaign. You must create dynamic, responsive, and truly intelligent storytelling.

**CORE PRINCIPLES:**
- NEVER give generic responses. Every response must be specific to the current situation, character actions, and world state.
- ALWAYS consider consequences of player actions that ripple through the world.
- NPCs have personalities, memories, and react to player behavior.
- The world is alive and changes based on player decisions.
- Combat should be tactical and meaningful, not just "you hit, they hit back."
- Environmental factors (weather, time, location) affect everything.

**CURRENT WORLD STATE:**
- Location: ${currentLocation}
- Time: ${timeOfDay}
- Weather: ${weather}
- Player Level: ${character.level} ${character.class}
- Player Stats: STR ${characterStats?.strength}, DEX ${characterStats?.dexterity}, INT ${characterStats?.intelligence}, CHA ${characterStats?.charisma}

**ACTIVE NPCS IN AREA:**
${activeNPCs || 'None currently present'}

**ACTIVE FACTIONS:**
${activeFactions || 'No major faction activity'}

**ACTIVE QUESTS:**
${activeQuests || 'No active quests'}

**RECENT PLAYER ACTIONS:**
${recentActions.map((action: any) => `- ${action.description} (${action.timestamp})`).join('\n') || 'No recent actions'}

**RECENT CONSEQUENCES:**
${recentConsequences.map((consequence: any) => `- ${consequence.description}`).join('\n') || 'No recent consequences'}

**PLAYER REPUTATION:**
${Object.entries(worldState.playerReputation).map(([faction, rep]: [string, any]) => `${faction}: ${rep}`).join(', ') || 'No reputation established'}

**CUSTOM CAMPAIGN PROMPT:**
${currentCampaign?.customPrompt || 'Standard fantasy adventure'}

${isInitialPrompt ? `
**INITIAL SCENE REQUIREMENTS:**
- Create a vivid, atmospheric opening that establishes the world and tone
- Introduce at least one NPC with a clear personality and motivation
- Present multiple meaningful choices that affect the story direction
- Include environmental details that make the scene feel alive
- Set up potential story threads that can be developed later
` : `
**RESPONSE REQUIREMENTS:**
- Analyze the player's action and determine realistic consequences
- Consider how NPCs would react based on their personalities and current situation
- Update the world state based on player choices
- Provide 3-4 meaningful choices that lead to different outcomes
- Include environmental reactions (weather changes, time passing, etc.)
- Reference previous actions and their consequences
- Make combat encounters tactical and challenging
- Include character development opportunities
`}

**PLAYER INPUT:** "${playerInput}"

Respond with a JSON object:
{
  "narrative": "Detailed, atmospheric description that responds specifically to the player's action",
  "choices": ["Specific choice 1", "Specific choice 2", "Specific choice 3", "Specific choice 4"],
  "environment": "${currentLocation}",
  "worldStateUpdates": {
    "newLocation": "location_name",
    "newNPCs": [{"name": "NPC Name", "role": "Role", "personality": "Personality", "currentMood": "Mood", "currentAction": "What they're doing"}],
    "factionChanges": [{"faction": "Faction Name", "change": "What changed", "reason": "Why"}],
    "questUpdates": [{"quest": "Quest Name", "progress": "What happened", "newObjective": "New goal"}],
    "consequences": [{"type": "immediate|long-term", "description": "What happens as a result", "affectedAreas": ["area1", "area2"]}]
  },
  "combatEncounter": null,
  "characterUpdates": [{"playerId": "${playerId}", "xpGain": 0, "xpReason": "Why", "statChanges": {"health": 0, "mana": 0}, "newItems": [], "reputationChanges": {}}],
  "atmosphere": {
    "mood": "current_mood",
    "tension": "low|medium|high",
    "environmentalDetails": "specific details about the surroundings"
  }
}

Your response MUST be a single, valid JSON object. Make it dynamic, specific, and truly responsive to the player's actions.`;

    return basePrompt;
  };

  // Types for better TypeScript support
  interface WorldStateUpdate {
    newLocation?: string;
    newNPCs?: Array<{name: string; [key: string]: any}>;
    newEvents?: Array<{[key: string]: any}>;
    weatherChange?: string;
    timeChange?: string;
    [key: string]: any;
  }

  interface CharacterUpdate {
    playerId: string;
    xpGain?: number;
    statChanges?: {
      health?: number;
      mana?: number;
      [key: string]: any;
    };
    newItems?: {[key: string]: any};
    [key: string]: any;
  }

  // Update world state based on AI response
  const updateWorldState = (updates: WorldStateUpdate) => {
    if (!updates) return;

    setWorldState(prev => {
      const newState = { ...prev };

      // Update location
      if (updates.newLocation) {
        newState.currentLocation = updates.newLocation;
      }

      // Add new NPCs
      if (updates.newNPCs) {
        updates.newNPCs.forEach((npc: any) => {
          newState.npcs[npc.name] = {
            ...npc,
            id: Date.now().toString(),
            firstEncounter: new Date(),
            relationship: 'neutral',
            knownSecrets: [],
            currentLocation: newState.currentLocation
          };
        });
      }

      // Update factions
      if (updates.factionChanges) {
        updates.factionChanges.forEach((change: any) => {
          if (!newState.factions[change.faction]) {
            newState.factions[change.faction] = {
              name: change.faction,
              influence: 10,
              goals: [],
              members: []
            };
          }
          // Apply faction changes
          if (change.change.includes('influence')) {
            newState.factions[change.faction].influence += 5;
          }
        });
      }

      // Update quests
      if (updates.questUpdates) {
        updates.questUpdates.forEach((update: any) => {
          const questIndex = newState.activeQuests.findIndex((q: any) => q.title === update.quest);
          if (questIndex >= 0) {
            newState.activeQuests[questIndex] = {
              ...newState.activeQuests[questIndex],
              progress: update.progress,
              currentObjective: update.newObjective
            };
          }
        });
      }

      return newState;
    });

    // Update AI memory
    setAiMemory(prev => ({
      ...prev,
      playerActions: [...prev.playerActions, {
        description: `Player action: ${inputMessage}`,
        timestamp: new Date(),
        location: worldState.currentLocation
      }],
      consequences: [...prev.consequences, ...(updates.consequences || [])]
    }));
  };

  // World State Display Component
  const WorldStateDisplay: React.FC<{ worldState: any, aiMemory: any }> = ({ worldState, aiMemory }) => (
    <div className="bg-black/30 rounded-lg p-3 mb-4">
      <h3 className="text-white font-semibold mb-2 flex items-center">
        <Globe size={16} className="mr-2" />
        World State
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-blue-200">
          <span className="font-semibold">Location:</span> {worldState.currentLocation || 'Unknown'}
        </div>
        <div className="text-blue-200">
          <span className="font-semibold">Time:</span> {worldState.timeOfDay}
        </div>
        <div className="text-blue-200">
          <span className="font-semibold">Weather:</span> {worldState.weather}
        </div>
        <div className="text-blue-200">
          <span className="font-semibold">Active NPCs:</span> {Object.keys(worldState.npcs).length}
        </div>
        <div className="text-blue-200">
          <span className="font-semibold">Active Quests:</span> {worldState.activeQuests.length}
        </div>
        <div className="text-blue-200">
          <span className="font-semibold">Factions:</span> {Object.keys(worldState.factions).length}
        </div>
      </div>
      
      {/* Recent Consequences */}
      {aiMemory.consequences.length > 0 && (
        <div className="mt-2">
          <h4 className="text-yellow-400 font-semibold text-xs mb-1">Recent Consequences:</h4>
          <div className="space-y-1">
            {aiMemory.consequences.slice(-2).map((consequence: any, index: number) => (
              <div key={index} className="text-xs text-orange-200 bg-orange-900/20 p-1 rounded">
                {consequence.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Enhanced Gameplay Component
  const Gameplay: React.FC<{ 
    campaign: any, 
    messages: any[], 
    inputMessage: string, 
    setInputMessage: (msg: string) => void, 
    sendMessage: () => void, 
    handleKeyPress: (e: React.KeyboardEvent) => void, 
    isAIThinking: boolean, 
    messagesEndRef: React.RefObject<HTMLDivElement>,
    onStartCombat?: (enemies: any[]) => void,
    worldState?: any,
    aiMemory?: any,
    inputRef: React.RefObject<HTMLInputElement>
  }> = ({ campaign, messages, inputMessage, setInputMessage, sendMessage, handleKeyPress, isAIThinking, messagesEndRef, onStartCombat, worldState, aiMemory, inputRef }) => {
    
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [messageFilter, setMessageFilter] = useState<'all' | 'dm' | 'player' | 'system'>('all');
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // Focus management effect
    React.useEffect(() => {
      if (inputRef?.current && !isAIThinking) {
        inputRef.current.focus();
      }
    }, [inputMessage, isAIThinking, inputRef]);

    // Scroll detection for auto-scroll behavior
    React.useEffect(() => {
      const container = messageContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
        setIsScrolledUp(!isAtBottom);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Filter messages based on current filter
    const filteredMessages = React.useMemo(() => {
      if (messageFilter === 'all') return messages;
      return messages.filter(msg => msg.type === messageFilter);
    }, [messages, messageFilter]);

    // Quick action suggestions based on context
    const quickActions = React.useMemo(() => {
      const actions = [
        "Look around carefully",
        "Search for clues",
        "Talk to nearby NPCs",
        "Check inventory",
        "Cast a spell",
        "Attack with weapon"
      ];

      // Add context-specific actions based on world state
      if (worldState?.currentLocation === 'tavern') {
        actions.unshift("Order a drink", "Ask the bartender for information");
      }
      if (worldState?.weather === 'storm') {
        actions.unshift("Seek shelter", "Wait for the storm to pass");
      }

      return actions.slice(0, 6); // Limit to 6 actions
    }, [worldState]);

    const handleQuickAction = (action: string) => {
      setInputMessage(action);
      setShowQuickActions(false);
      setTimeout(() => sendMessage(), 100);
    };

    const getMessageIcon = (message: any) => {
      switch (message.type) {
        case 'player':
          return (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {character?.name?.charAt(0) || 'P'}
            </div>
          );
        case 'dm':
          return (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg">
              🎲
            </div>
          );
        case 'system':
          return (
            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg">
              ⚙️
            </div>
          );
        default:
          return (
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {message.playerName?.charAt(0) || '?'}
            </div>
          );
      }
    };

    const getMessageStyle = (message: any) => {
      const baseStyle = "mb-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-lg";
      
      switch (message.type) {
        case 'player':
          return `${baseStyle} bg-gradient-to-r from-blue-900/40 to-blue-800/40 border-blue-400/30 ml-8`;
        case 'dm':
          return `${baseStyle} bg-gradient-to-r from-purple-900/40 to-purple-800/40 border-purple-400/30 mr-8`;
        case 'system':
          return `${baseStyle} bg-gradient-to-r from-gray-900/40 to-gray-800/40 border-gray-400/30`;
        default:
          return `${baseStyle} bg-gradient-to-r from-green-900/40 to-green-800/40 border-green-400/30`;
      }
    };

    const formatMessageContent = (content: string) => {
      // Add basic markdown-like formatting
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-white/20 px-1 rounded">$1</code>');
    };

    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl overflow-hidden">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-4 bg-black/30 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl lg:text-2xl font-bold text-white">Adventure Log</h2>
            <div className="flex items-center space-x-1 text-sm text-blue-300">
              <span>•</span>
              <span>{filteredMessages.length} messages</span>
              {isConnected && (
                <>
                  <span>•</span>
                  <span className="text-green-400">Connected</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Message Filter */}
            <select
              value={messageFilter}
              onChange={(e) => setMessageFilter(e.target.value as any)}
              className="bg-white/10 text-white text-sm rounded-lg px-3 py-1 border border-white/20 focus:outline-none focus:border-blue-400"
            >
              <option value="all">All Messages</option>
              <option value="dm">DM Only</option>
              <option value="player">Player Only</option>
              <option value="system">System Only</option>
            </select>

            {/* Quick Actions Toggle */}
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                showQuickActions 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              Quick Actions
            </button>

            {/* Combat Test Button */}
            {onStartCombat && (
              <button
                onClick={() => onStartCombat([
                  { name: 'Goblin Warrior', health: 25, strength: 12, dexterity: 10, armorClass: 12 },
                  { name: 'Goblin Archer', health: 20, strength: 10, dexterity: 14, armorClass: 13 }
                ])}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center space-x-1 text-sm"
              >
                <Sword size={14} />
                <span>Combat</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className="p-4 bg-blue-900/20 border-b border-blue-400/30">
            <h3 className="text-white font-semibold mb-2 text-sm">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="text-left p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-sm text-blue-100 hover:text-white"
                  disabled={isAIThinking}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* World State Display */}
        {worldState && (
          <div className="p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-purple-400/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                {worldState.currentLocation && (
                  <div className="flex items-center space-x-1 text-purple-300">
                    <span>📍</span>
                    <span>{worldState.currentLocation}</span>
                  </div>
                )}
                {worldState.weather && (
                  <div className="flex items-center space-x-1 text-blue-300">
                    <span>{worldState.weather === 'clear' ? '☀️' : worldState.weather === 'rain' ? '🌧️' : '⛈️'}</span>
                    <span>{worldState.weather}</span>
                  </div>
                )}
                {worldState.timeOfDay && (
                  <div className="flex items-center space-x-1 text-yellow-300">
                    <span>{worldState.timeOfDay === 'day' ? '🌅' : worldState.timeOfDay === 'night' ? '🌙' : '🌆'}</span>
                    <span>{worldState.timeOfDay}</span>
                  </div>
                )}
              </div>
              
              {character && (
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1 text-red-300">
                    <span>❤️</span>
                    <span>{character.health}/{character.maxHealth}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-300">
                    <span>✨</span>
                    <span>{character.mana}/{character.maxMana}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-300">
                    <span>💰</span>
                    <span>{character.gold || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Messages Area */}
        <div 
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="text-blue-200">
                <div className="text-4xl mb-4 opacity-50">💬</div>
                <p className="text-lg">Your adventure begins here!</p>
                <p className="text-sm opacity-75">Type an action to start your story.</p>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg, index) => (
              <div key={msg.id || index} className={getMessageStyle(msg)}>
                <div className="flex items-start space-x-3">
                  {getMessageIcon(msg)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-white">
                        {msg.type === 'player' 
                          ? character?.name || 'You'
                          : msg.type === 'dm'
                          ? 'Dungeon Master'
                          : msg.playerName || 'System'
                        }
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.atmosphere?.mood && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          msg.atmosphere.mood === 'tense' ? 'bg-red-500/20 text-red-300' :
                          msg.atmosphere.mood === 'mysterious' ? 'bg-purple-500/20 text-purple-300' :
                          msg.atmosphere.mood === 'peaceful' ? 'bg-green-500/20 text-green-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {msg.atmosphere.mood}
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className="text-blue-100 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                    />
                    
                    {/* Enhanced Choice System */}
                    {msg.choices && msg.choices.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs text-gray-400 font-medium">Choose your action:</div>
                        <div className="grid gap-2">
                          {msg.choices.map((choice: string, choiceIndex: number) => (
                            <button
                              key={choiceIndex}
                              onClick={() => {
                                setInputMessage(choice);
                                setTimeout(() => sendMessage(), 100);
                              }}
                              className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-sm group"
                              disabled={isAIThinking}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 bg-blue-500/30 rounded-full flex items-center justify-center text-xs font-bold group-hover:bg-blue-500/50 transition-all">
                                  {choiceIndex + 1}
                                </span>
                                <span className="group-hover:text-white transition-colors">{choice}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Atmosphere Details */}
                    {msg.atmosphere && (msg.atmosphere.tension || msg.atmosphere.description) && (
                      <div className="mt-3 p-2 bg-black/30 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 space-y-1">
                          {msg.atmosphere.tension && (
                            <div>
                              <span className="font-semibold">Tension:</span> {msg.atmosphere.tension}/10
                            </div>
                          )}
                          {msg.atmosphere.description && (
                            <div className="italic text-gray-300">{msg.atmosphere.description}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* AI Thinking Enhanced Indicator */}
          {isAIThinking && (
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-400/30 rounded-xl">
              <div className="relative">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-300/30 border-t-purple-400"></div>
                <div className="animate-ping absolute inset-0 rounded-full h-6 w-6 border-2 border-purple-400/50"></div>
              </div>
              <div className="flex-1">
                <div className="text-purple-200 font-medium">Dungeon Master is thinking...</div>
                <div className="text-purple-300 text-sm">Crafting your story...</div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Auto-scroll button */}
        {isScrolledUp && (
          <div className="absolute bottom-20 right-4">
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-lg transition-all"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        )}

        {/* Enhanced Input Area */}
        <div className="p-4 bg-black/30 border-t border-white/20">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="What do you do? (Be specific and creative!)"
                className="w-full px-4 py-3 bg-white/10 text-white placeholder-blue-200 rounded-xl border border-white/20 focus:outline-none focus:border-blue-400 transition-all pr-12"
                disabled={isAIThinking}
                maxLength={500}
              />
              {inputMessage.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {inputMessage.length}/500
                </div>
              )}
            </div>
            
            <button 
              onClick={sendMessage} 
              disabled={isAIThinking || !inputMessage.trim()}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                isAIThinking || !inputMessage.trim()
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
              }`}
            >
              {isAIThinking ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  <span>Wait...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          {/* Input Hints */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>💡 Try: "I carefully examine the door for traps"</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Press Enter to send</span>
              <span>•</span>
              <span>Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Welcome Screen
  if (currentScreen === 'welcome') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} flex items-center justify-center p-4 transition-all duration-1000`}>
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">⚔️ AI Dungeon Master</h1>
            <p className="text-blue-200">Advanced RPG with real consequences</p>
            <div className="flex justify-center space-x-4 mt-4 text-sm">
              <div className="flex items-center space-x-1 text-yellow-400">
                <Swords size={16} />
                <span>Tactical Combat</span>
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp size={16} />
                <span>Character Growth</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-400">
                <Globe size={16} />
                <span>Living World</span>
              </div>
            </div>
            <Tooltip content="Interactive tutorial and help guide" ariaLabel="Help tutorial">
              <button
                onClick={() => {
                  setShowHelp(true);
                  setHelpScreen('welcome');
                }}
                className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2 mx-auto"
                aria-label="Open interactive tutorial and help guide"
              >
                <HelpCircle size={16} />
                <span>Interactive Tutorial</span>
              </button>
            </Tooltip>
          </div>
          
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-blue-200">Loading...</p>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-white">Welcome back, {currentUser?.displayName}!</p>
                <Tooltip content="Continue your adventure with existing characters" ariaLabel="Continue adventure">
                  <button
                    onClick={() => setCurrentScreen('character-select')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
                    aria-label="Continue your adventure with existing characters"
                  >
                    Continue Adventure
                  </button>
                </Tooltip>
              </div>
              <Tooltip content="Sign out of your account" ariaLabel="Sign out">
                <button
                  onClick={signOut}
                  className="w-full px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                  aria-label="Sign out of your account"
                >
                  Sign Out
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-4">
              <Tooltip content="Sign in with your Google account to save progress" ariaLabel="Sign in with Google">
                <button
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                  aria-label="Sign in with your Google account to save progress"
                  aria-describedby="signin-description"
                >
                  <User size={20} />
                  <span>Sign in with Google</span>
                </button>
              </Tooltip>
              <div id="signin-description" className="sr-only">Sign in to save your progress and access multiplayer features</div>
              
              <div className="text-center">
                <p className="text-blue-200 text-sm mb-3">Or join an existing campaign:</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Campaign Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 text-center"
                    aria-label="Enter campaign code to join existing game"
                    maxLength={6}
                  />
                  <Tooltip content="Join an existing campaign using the 6-character code" ariaLabel="Join campaign">
                    <button
                      onClick={() => {
                        if (playerName.trim() && joinCode.trim()) {
                          if (!character) {
                            setCurrentScreen('character');
                          } else {
                            // Join campaign logic would go here
                            alert('Join campaign feature coming soon!');
                          }
                        }
                      }}
                      disabled={!playerName.trim() || !joinCode.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                      aria-label="Join campaign with entered code"
                    >
                      Join
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Character Selection Screen
  if (currentScreen === 'character-select') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} p-4 transition-all duration-1000`}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Choose Your Character</h2>
                <p className="text-blue-200">Welcome back, {currentUser?.displayName}!</p>
              </div>
              <Tooltip content="Sign out of your account">
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                >
                  Sign Out
                </button>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {userCharacters.map((char) => (
                <Tooltip key={char.id} content={`Load ${char.name} - Level ${char.level} ${char.class}`}>
                  <div
                    onClick={() => loadCharacter(char.id!)}
                    className="bg-white/10 rounded-xl p-6 border border-white/20 hover:border-blue-400 hover:bg-white/20 cursor-pointer transition-all"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{char.class === 'Warrior' ? '⚔️' : char.class === 'Rogue' ? '🗡️' : char.class === 'Mage' ? '🔮' : char.class === 'Cleric' ? '⚡' : char.class === 'Ranger' ? '🏹' : '🎵'}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{char.name}</h3>
                      <p className="text-blue-200 mb-3">Level {char.level} {char.class}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-blue-200">
                        <div>HP: {char.health}/{char.maxHealth}</div>
                        <div>XP: {char.experience}</div>
                        <div>Gold: {char.gold}</div>
                        <div>Play Time: {Math.floor(char.totalPlayTime / 60000)}m</div>
                      </div>
                      <div className="mt-3 text-xs text-green-400">
                        Last played: {new Date(char.lastPlayed).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              ))}
              
              {/* Create New Character Card */}
              <Tooltip content="Create a new character and start a fresh adventure">
                <div
                  onClick={() => setCurrentScreen('character')}
                  className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-dashed border-white/30 hover:border-white/50 hover:from-green-500/30 hover:to-blue-500/30 cursor-pointer transition-all"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">✨</div>
                    <h3 className="text-xl font-bold text-white mb-2">Create New Character</h3>
                    <p className="text-blue-200">Start a new adventure with a fresh hero</p>
                  </div>
                </div>
              </Tooltip>
            </div>
            
            <div className="text-center">
              <Tooltip content="Return to the welcome screen">
                <button
                  onClick={() => setCurrentScreen('lobby')}
                  className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                >
                  ← Back to Welcome
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Character Creation Screen
  if (currentScreen === 'character') {
    if (!isAuthenticated) {
      return (
        <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} flex items-center justify-center p-4 transition-all duration-1000`}>
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-blue-200 mb-6">Please sign in to create a character</p>
            <button
              onClick={signInWithGoogle}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} p-4 transition-all duration-1000`}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-lg rounded-3xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Create Your Hero</h2>
              <button
                onClick={() => setCurrentScreen('character-select')}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
              >
                ← Back to Characters
              </button>
            </div>
            <CharacterCreation 
              playerName={currentUser?.displayName || ''}
              classes={classes}
              onCreateCharacter={createCharacter}
              joinCode={joinCode}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main App Layout (for all other screens)
  return (
    <div className={`main-container flex flex-col bg-gradient-to-br ${environments[currentEnvironment]} transition-all duration-1000`}>
      {/* Success Feedback */}
      {successFeedback && (
        <SuccessFeedback
          message={successFeedback.message}
          icon={successFeedback.icon}
          duration={successFeedback.duration}
          onClose={() => setSuccessFeedback(null)}
        />
      )}
      
      {/* Toast Notifications */}
      <ToastNotifications
        messages={toastMessages}
        onDismiss={dismissToast}
      />

      {/* Welcome Overlay */}
      {showWelcomeOverlay && (
        <WelcomeOverlay
          character={character}
          onStart={() => {
            setShowWelcomeOverlay(false);
            setCurrentScreen('lobby');
            addToast('welcomeBack');
          }}
          onDismiss={() => {
            setShowWelcomeOverlay(false);
            setCurrentScreen('lobby');
            addToast('ftueSkipped');
          }}
        />
      )}

      {/* Desktop Side NavBar */}
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          <NavBar 
            active={activeNav} 
            onNavigate={handleNavChange} 
            theme={currentEnvironment}
            isMobile={false}
          />
        </Suspense>
        {/* Main Content + Drawer Row */}
        <div className="flex-1 flex flex-col h-full">
          {/* Top Bar */}
          <Suspense fallback={<LoadingSpinner />}>
            <TopBar 
              onNewCampaign={handleNewCampaign}
              isMobile={isMobile}
              onToggleMobile={() => setMobileNavOpen(!mobileNavOpen)}
              currentScreen={currentScreen}
              onHelpClick={() => setShowHelp(true)}
            />
          </Suspense>
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="px-6 lg:px-8 py-6">
              {/* Add subtle background pattern for better visual hierarchy */}
              <div className="relative min-h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  {currentScreen === 'dashboard' && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Dashboard</h2>
                        <p className="text-blue-200 mb-6">Welcome to MythSeeker RPG!</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                          <Tooltip content="Create new campaigns or join existing ones">
                            <button
                              onClick={() => handleNavChange('campaigns')}
                              className="p-6 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
                            >
                              <Book size={32} className="text-blue-400 mx-auto mb-2" />
                              <h3 className="text-white font-semibold">Campaigns</h3>
                              <p className="text-blue-200 text-sm">Create or join campaigns</p>
                            </button>
                          </Tooltip>
                          <Tooltip content="View and manage your characters">
                            <button
                              onClick={() => handleNavChange('characters')}
                              className="p-6 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
                            >
                              <User size={32} className="text-green-400 mx-auto mb-2" />
                              <h3 className="text-white font-semibold">Characters</h3>
                              <p className="text-blue-200 text-sm">Manage your characters</p>
                            </button>
                          </Tooltip>
                          <Tooltip content="View your party members and their status">
                            <button
                              onClick={() => handleNavChange('party')}
                              className="p-6 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
                            >
                              <Users size={32} className="text-purple-400 mx-auto mb-2" />
                              <h3 className="text-white font-semibold">Party</h3>
                              <p className="text-blue-200 text-sm">View party members</p>
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}
                  {currentScreen === 'character' && (
                    <CharacterCreation 
                      playerName={currentUser?.displayName || ''}
                      classes={classes}
                      onCreateCharacter={createCharacter}
                      joinCode={joinCode}
                    />
                  )}
                  {currentScreen === 'lobby' && (
                    <CampaignLobby 
                      campaigns={campaigns}
                      campaignThemes={campaignThemes}
                      onCreateCampaign={createCampaign}
                      character={character}
                      onDeleteCampaign={deleteCampaign}
                      onJoinCampaign={joinCampaign}
                      onResumeCampaign={resumeCampaign}
                      onPauseCampaign={pauseCampaign}
                    />
                  )}
                  {currentScreen === 'waiting' && (
                    <WaitingRoom 
                      campaign={currentCampaign}
                      onStart={startCampaign}
                      onBack={() => setCurrentScreen('lobby')}
                    />
                  )}
                  {currentScreen === 'game' && (
                    <Gameplay
                      campaign={currentCampaign}
                      messages={messages}
                      inputMessage={inputMessage}
                      setInputMessage={setInputMessage}
                      sendMessage={sendMessage}
                      handleKeyPress={handleKeyPress}
                      isAIThinking={isAIThinking}
                      messagesEndRef={messagesEndRef}
                      onStartCombat={startCombat}
                      worldState={worldState}
                      aiMemory={aiMemory}
                      inputRef={gameInputRef}
                    />
                  )}
                  {currentScreen === 'party' && (
                    <div className="h-full p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Party Management</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {partyState.players.map((player) => (
                          <div key={player.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                            <h3 className="text-white font-semibold">{player.character?.name || player.name}</h3>
                            <p className="text-blue-200 text-sm">{player.character?.class || 'Unknown Class'}</p>
                            <p className="text-green-400 text-xs">Level {player.character?.level || 1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentScreen === 'world' && (
                    <div className="h-full p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">World Map & Exploration</h2>
                      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                        <p className="text-blue-200 mb-4">Interactive world map coming soon!</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-black/20 rounded-lg p-4">
                            <h3 className="text-white font-semibold mb-2">Current Location</h3>
                            <p className="text-blue-200">{worldState?.currentLocation || 'Unknown'}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-4">
                            <h3 className="text-white font-semibold mb-2">Discovered Areas</h3>
                            <p className="text-blue-200">0 locations explored</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {currentScreen === 'combat' && combatState && (
                    <CombatSystem
                      combatants={combatState.combatants}
                      battleMap={combatState.battleMap}
                      currentTurn={combatState.currentTurn}
                      activeCombatantId={combatState.turnOrder[combatState.currentCombatantIndex]}
                      onAction={handleCombatAction}
                      onEndCombat={endCombat}
                      isPlayerTurn={combatService.isPlayerTurn()}
                    />
                  )}
                  {currentScreen === 'magic' && (
                    <div className="h-full p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Magic & Spells</h2>
                      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                        <p className="text-blue-200 mb-4">Spell system coming soon!</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-black/20 rounded-lg p-4">
                            <h3 className="text-white font-semibold mb-2">Known Spells</h3>
                            <p className="text-blue-200">No spells learned yet</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-4">
                            <h3 className="text-white font-semibold mb-2">Spell Slots</h3>
                            <p className="text-blue-200">0 slots available</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Default case - show dashboard if no screen matches */}
                  {!['dashboard', 'character', 'lobby', 'waiting', 'game', 'party', 'world', 'combat', 'magic'].includes(currentScreen) && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Welcome to MythSeeker</h2>
                        <p className="text-blue-200">Use the navigation to get started!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
        {/* Right Drawer - desktop as flex child, mobile as fixed overlay */}
        <Suspense fallback={<LoadingSpinner />}>
          <RightDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            activeTab={activeDrawerTab}
            onTabChange={setActiveDrawerTab}
            isMobile={isMobile}
            campaign={currentCampaign}
            messages={messages}
            players={partyState.players}
            worldState={worldState}
            achievements={achievements}
            onSendMessage={sendMultiplayerMessage}
            onUpdateSettings={(settings) => {
              console.log('Settings updated:', settings);
            }}
            drawerWidth={drawerWidth}
            setDrawerWidth={setDrawerWidth}
            minWidth={MIN_WIDTH}
            maxWidth={MAX_WIDTH}
          />
        </Suspense>
      </div>
      {/* Floating Action Button - sets drawer tab and opens drawer */}
      <FloatingActionButton
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        isDrawerOpen={drawerOpen}
        onQuickAction={(action) => {
          setActiveDrawerTab(action);
          setDrawerOpen(true);
        }}
        isMobile={isMobile}
        hasNotifications={messages.length > 0}
        notificationCount={messages.filter(m => m.type === 'system').length}
      />
      {/* Mobile Navigation - Bottom */}
      <NavBar 
        active={activeNav} 
        onNavigate={handleNavChange} 
        theme={currentEnvironment}
        isMobile={true}
        onToggleMobile={() => setMobileNavOpen(!mobileNavOpen)}
      />
      {/* Simple Help Overlay */}
      <SimpleHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      {/* Help System */}
      <HelpSystem 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        currentScreen={helpScreen}
        onAction={handleHelpAction}
      />
    </div>
  );
};

// Character Creation Component
const CharacterCreation = ({ playerName, classes, onCreateCharacter, joinCode }: { playerName: string, classes: any[], onCreateCharacter: (characterData: any) => void, joinCode: string }) => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [characterName, setCharacterName] = useState(playerName);
  const [backstory, setBackstory] = useState('');
  const [hoveredClass, setHoveredClass] = useState<any>(null);
  const [errors, setErrors] = useState<{ name?: string; class?: string; backstory?: string }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  // Profanity filter (basic)
  const profanityList = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'piss', 'cock', 'fag', 'slut', 'whore'];
  const containsProfanity = (str: string) => {
    if (!str) return false;
    const lower = str.toLowerCase();
    return profanityList.some(word => lower.includes(word));
  };

  const validate = () => {
    setIsValidating(true);
    const newErrors: { name?: string; class?: string; backstory?: string } = {};
    
    if (!characterName.trim()) {
      newErrors.name = 'Character name is required.';
    } else if (characterName.length > 50) {
      newErrors.name = 'Character name must be 50 characters or less.';
    } else if (containsProfanity(characterName)) {
      newErrors.name = 'Please choose a more appropriate name.';
    }
    
    if (!selectedClass) {
      newErrors.class = 'Character class is required.';
    }
    
    if (backstory.length > 0 && containsProfanity(backstory)) {
      newErrors.backstory = 'Please remove inappropriate language from the backstory.';
    } else if (backstory.length > 500) {
      newErrors.backstory = 'Backstory must be 500 characters or less.';
    }
    
    setErrors(newErrors);
    setTimeout(() => setIsValidating(false), 500);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      setShowPreview(true);
      setTimeout(() => {
        onCreateCharacter({
          name: characterName.trim(),
          class: selectedClass.name,
          backstory: backstory.trim()
        });
      }, 1500);
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    if (characterName.trim()) completed += 40;
    if (selectedClass) completed += 40;
    if (backstory.trim()) completed += 20;
    return completed;
  };

  // Get the class to display in preview (hovered or selected)
  const previewClass = hoveredClass || selectedClass;

  // Step validation
  const isStep1Valid = characterName.trim().length > 0 && !errors.name;
  const isStep2Valid = selectedClass !== null && !errors.class;
  const isStep3Valid = backstory.length === 0 || (!errors.backstory && backstory.trim().length > 0);

  return (
    <div className="space-y-6 character-creation">
      {/* Progress Indicator */}
      <div className="bg-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Character Creation Progress</h3>
          <span className="text-blue-300 text-sm">{getCompletionPercentage()}% Complete</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center space-x-2 ${isStep1Valid ? 'text-green-400' : characterName.trim() ? 'text-yellow-400' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStep1Valid ? 'bg-green-500' : characterName.trim() ? 'bg-yellow-500' : 'bg-gray-500'}`}>
              {isStep1Valid ? '✓' : '1'}
            </div>
            <span>Name</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${isStep2Valid ? 'text-green-400' : selectedClass ? 'text-yellow-400' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStep2Valid ? 'bg-green-500' : selectedClass ? 'bg-yellow-500' : 'bg-gray-500'}`}>
              {isStep2Valid ? '✓' : '2'}
            </div>
            <span>Class</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${isStep3Valid ? 'text-green-400' : backstory.trim() ? 'text-yellow-400' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStep3Valid ? 'bg-green-500' : backstory.trim() ? 'bg-yellow-500' : 'bg-gray-500'}`}>
              {isStep3Valid ? '✓' : '3'}
            </div>
            <span>Story</span>
          </div>
        </div>
      </div>

      {/* Character Creation Success Animation */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 rounded-2xl p-8 max-w-md mx-4 text-center border border-purple-500/50">
            <div className="text-6xl mb-4 animate-bounce">{selectedClass?.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">Character Created!</h3>
            <p className="text-purple-200 mb-4">
              {characterName} the {selectedClass?.name} is ready for adventure!
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-purple-300/30 border-t-purple-400 rounded-full mx-auto"></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        <div className="space-y-4 lg:space-y-6">
          {/* Step 1: Character Name */}
          <div className={`transition-all duration-300 ${currentStep === 1 ? 'ring-2 ring-blue-400 rounded-xl p-4' : ''}`}>
            <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <span>Character Name</span>
              {isStep1Valid && <span className="text-green-400">✓</span>}
            </label>
            <input
              type="text"
              placeholder="Enter your hero's name..."
              value={characterName}
              onChange={(e) => {
                setCharacterName(e.target.value);
                if (currentStep === 1 && e.target.value.trim()) {
                  setTimeout(() => setCurrentStep(2), 500);
                }
              }}
              onFocus={() => setCurrentStep(1)}
              className={`w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border transition-all duration-300 focus:outline-none text-sm lg:text-base ${
                errors.name ? 'border-red-400 focus:border-red-400' : 
                isStep1Valid ? 'border-green-400 focus:border-green-400' : 
                'border-white/30 focus:border-blue-400'
              }`}
            />
            {errors.name && <div className="text-red-400 text-xs mt-1 animate-pulse">{errors.name}</div>}
            {isStep1Valid && !errors.name && (
              <div className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                <span>✓</span>
                <span>Great name choice!</span>
              </div>
            )}
          </div>

          {/* Step 2: Choose Class */}
          <div className={`transition-all duration-300 ${currentStep === 2 ? 'ring-2 ring-blue-400 rounded-xl p-4' : ''}`}>
            <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <span>Choose Your Class</span>
              {isStep2Valid && <span className="text-green-400">✓</span>}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 class-grid">
              {classes.map((cls) => (
                <div
                  key={cls.name}
                  onClick={() => {
                    setSelectedClass(cls);
                    if (currentStep === 2) {
                      setTimeout(() => setCurrentStep(3), 500);
                    }
                  }}
                  onFocus={() => setCurrentStep(2)}
                  onMouseEnter={() => setHoveredClass(cls)}
                  onMouseLeave={() => setHoveredClass(null)}
                  className={`class-card p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform ${
                    selectedClass?.name === cls.name
                      ? 'border-green-400 bg-green-500/30 shadow-lg scale-105 selected'
                      : hoveredClass?.name === cls.name
                      ? 'border-blue-400 bg-blue-500/20 shadow-md scale-102'
                      : 'border-white/30 bg-white/10 hover:border-white/50 hover:scale-102'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl mb-2 transition-transform duration-300 hover:scale-110">{cls.icon}</div>
                    <h3 className="text-white font-semibold text-sm lg:text-base mb-2">{cls.name}</h3>
                    
                    {/* Quick Stats with Meaningful Context */}
                    <div className="text-xs text-blue-200 space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span>STR: {cls.stats.strength}</span>
                        <span className="text-yellow-300">Attack Power</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DEX: {cls.stats.dexterity}</span>
                        <span className="text-green-300">Agility</span>
                      </div>
                      <div className="flex justify-between">
                        <span>INT: {cls.stats.intelligence}</span>
                        <span className="text-purple-300">Magic</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CHA: {cls.stats.charisma}</span>
                        <span className="text-pink-300">Social</span>
                      </div>
                    </div>
                    
                    {/* Visual Confirmation for Selected Class */}
                    {selectedClass?.name === cls.name && (
                      <div className="flex items-center justify-center space-x-1 text-green-400 text-xs animate-pulse">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.class && <div className="text-red-400 text-xs mt-1 animate-pulse">{errors.class}</div>}
            {isStep2Valid && !errors.class && (
              <div className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                <span>✓</span>
                <span>Excellent choice! {selectedClass.name} is a powerful class.</span>
              </div>
            )}
          </div>

          {/* Step 3: Character Backstory */}
          <div className={`transition-all duration-300 ${currentStep === 3 ? 'ring-2 ring-blue-400 rounded-xl p-4' : ''}`}>
            <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <span>Character Backstory</span>
              <span className="text-blue-300 text-xs">(Optional)</span>
              {isStep3Valid && <span className="text-green-400">✓</span>}
            </label>
            
            {/* Backstory Prompts for Creative Scaffolding */}
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                "What is your character's greatest fear?",
                "Where did they grow up?",
                "What brought them to adventure?",
                "Who is their closest friend?",
                "What do they value most?"
              ].map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setBackstory(prev => prev ? `${prev}\n\n${prompt}` : prompt);
                    setCurrentStep(3);
                  }}
                  className="px-2 py-1 bg-blue-600/30 text-blue-200 text-xs rounded hover:bg-blue-600/50 transition-all transform hover:scale-105"
                >
                  {prompt}
                </button>
              ))}
            </div>
            
            <textarea
              value={backstory}
              onChange={(e) => {
                setBackstory(e.target.value);
                setCurrentStep(3);
              }}
              onFocus={() => setCurrentStep(3)}
              placeholder="Describe your character's background, motivations, and personality... (Click prompts above for inspiration)"
              className={`w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border transition-all duration-300 focus:outline-none h-24 lg:h-32 resize-none text-sm lg:text-base ${
                errors.backstory ? 'border-red-400 focus:border-red-400' : 
                isStep3Valid && backstory.trim() ? 'border-green-400 focus:border-green-400' : 
                'border-white/30 focus:border-blue-400'
              }`}
            />
            {errors.backstory && <div className="text-red-400 text-xs mt-1 animate-pulse">{errors.backstory}</div>}
            {isStep3Valid && backstory.trim() && !errors.backstory && (
              <div className="text-green-400 text-xs mt-1 flex items-center space-x-1">
                <span>✓</span>
                <span>Great backstory! This will enhance your roleplay experience.</span>
              </div>
            )}
          </div>

          {/* Create Character Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedClass || !characterName.trim() || isValidating}
            className={`w-full px-4 lg:px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm lg:text-base transform ${
              selectedClass && characterName.trim() && !isValidating
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:scale-105 hover:shadow-xl'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
            }`}
          >
            {isValidating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                <span>Validating...</span>
              </div>
            ) : selectedClass && characterName.trim() ? (
              `Create ${characterName} the ${selectedClass.name}`
            ) : (
              'Complete required fields to create character'
            )}
          </button>
        </div>

        {/* Enhanced Class Preview */}
        <div className="bg-white/10 rounded-xl p-4 lg:p-6 transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-4">
            {previewClass ? `Class Preview: ${previewClass.name}` : 'Select a Class'}
          </h3>
          
          {previewClass ? (
            <div className="space-y-4">
              {/* Class Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-4xl animate-pulse">{previewClass.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{previewClass.name}</h4>
                  <p className="text-blue-200 text-sm">Master of tactical combat</p>
                </div>
              </div>
              
              {/* Character Preview with Live Name */}
              {characterName.trim() && (
                <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
                  <h5 className="text-white font-semibold mb-2 flex items-center space-x-2">
                    <span>✨</span>
                    <span>Character Preview</span>
                  </h5>
                  <div className="text-center">
                    <div className="text-3xl mb-2">{previewClass.icon}</div>
                    <p className="text-lg font-bold text-white">{characterName}</p>
                    <p className="text-blue-300">Level 1 {previewClass.name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-red-500/20 rounded px-2 py-1">
                        <span className="text-red-300">❤️ Health: 100</span>
                      </div>
                      <div className="bg-blue-500/20 rounded px-2 py-1">
                        <span className="text-blue-300">✨ Mana: 50</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Class Description */}
              <div className="bg-black/20 rounded-lg p-3">
                <h5 className="text-white font-semibold mb-2">Class Description</h5>
                <p className="text-blue-200 text-sm leading-relaxed">
                  {previewClass.name === 'Warrior' && "A mighty warrior skilled in close combat, wielding powerful weapons and wearing heavy armor. Your strength and endurance make you the frontline defender of your party."}
                  {previewClass.name === 'Rogue' && "A stealthy rogue who excels at sneaking, lockpicking, and dealing devastating sneak attacks. Your agility and cunning allow you to strike from the shadows."}
                  {previewClass.name === 'Mage' && "A powerful spellcaster who harnesses the arcane arts to cast devastating spells. Your intelligence and magical prowess make you a force to be reckoned with."}
                  {previewClass.name === 'Cleric' && "A divine spellcaster who channels the power of the gods to heal allies and smite enemies. Your faith and charisma make you an invaluable support."}
                  {previewClass.name === 'Ranger' && "A skilled hunter and tracker who excels at ranged combat and wilderness survival. Your dexterity and knowledge of nature make you a versatile adventurer."}
                  {previewClass.name === 'Bard' && "A charismatic performer who uses music and magic to inspire allies and charm enemies. Your creativity and social skills make you the heart of any party."}
                </p>
              </div>

              {/* Starting Equipment Preview */}
              <div className="bg-black/20 rounded-lg p-3">
                <h5 className="text-white font-semibold mb-2">Starting Equipment</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">⚔️</span>
                    <span className="text-blue-200">Iron Sword</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-brown-400">🛡️</span>
                    <span className="text-blue-200">Leather Armor</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400">🧪</span>
                    <span className="text-blue-200">3x Healing Potions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="text-blue-200">100 Gold Pieces</span>
                  </div>
                </div>
              </div>

              {/* Class Abilities Preview */}
              <div className="bg-black/20 rounded-lg p-3">
                <h5 className="text-white font-semibold mb-2">Class Abilities</h5>
                <div className="space-y-2 text-sm">
                  {previewClass.skills && Object.entries(previewClass.skills).slice(0, 3).map(([skill, level]: [string, any]) => (
                    <div key={skill} className="flex justify-between items-center">
                      <span className="text-blue-200 capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < level ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-blue-200 py-8">
              <div className="text-4xl mb-4 opacity-50">🎭</div>
              <p>Select a class to see detailed information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Campaign Lobby Component
const CampaignLobby = ({ campaigns, campaignThemes, onCreateCampaign, character, onDeleteCampaign, onJoinCampaign, onResumeCampaign, onPauseCampaign }: { 
  campaigns: any[], 
  campaignThemes: any[], 
  onCreateCampaign: (theme: any, customPrompt: string, isMultiplayer: boolean) => void, 
  character: any,
  onDeleteCampaign?: (campaignId: string) => void,
  onJoinCampaign?: (campaignCode: string) => void,
  onResumeCampaign?: (campaignId: string) => void,
  onPauseCampaign?: (campaignId: string) => void
}) => {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showJoinCampaign, setShowJoinCampaign] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(true);
  const [errors, setErrors] = useState<{ theme?: string; customPrompt?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'not-started'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status' | 'players'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Profanity filter (reuse from above)
  const profanityList = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'piss', 'cock', 'fag', 'slut', 'whore'];
  const containsProfanity = (str: string) => {
    if (!str) return false;
    const lower = str.toLowerCase();
    return profanityList.some(word => lower.includes(word));
  };

  const validate = () => {
    const newErrors: { theme?: string; customPrompt?: string } = {};
    if (!selectedTheme) {
      newErrors.theme = 'Campaign theme is required.';
    }
    if (customPrompt.length > 1000) {
      newErrors.customPrompt = 'Custom prompt must be 1000 characters or less.';
    } else if (customPrompt.length > 0 && containsProfanity(customPrompt)) {
      newErrors.customPrompt = 'Please remove inappropriate language from the custom prompt.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCampaign = () => {
    if (validate()) {
      onCreateCampaign(selectedTheme, customPrompt, isMultiplayer);
      setShowCreateCampaign(false);
      setSelectedTheme(null);
      setCustomPrompt('');
    }
  };

  const handleJoinCampaign = () => {
    if (joinCode.trim() && onJoinCampaign) {
      onJoinCampaign(joinCode.trim());
      setJoinCode('');
      setShowJoinCampaign(false);
    }
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      onDeleteCampaign?.(campaignId);
    }
  };

  const handleResumeCampaign = (campaignId: string) => {
    if (onResumeCampaign) {
      onResumeCampaign(campaignId);
    }
  };

  const handlePauseCampaign = (campaignId: string) => {
    if (onPauseCampaign) {
      onPauseCampaign(campaignId);
    }
  };

  // Enhanced campaign filtering and sorting
  const filteredAndSortedCampaigns = React.useMemo(() => {
    let filtered = campaigns.filter(campaign => {
      // Search filter
      const matchesSearch = campaign.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.customPrompt?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'not-started') {
          matchesStatus = !campaign.started;
        } else {
          matchesStatus = campaign.status === statusFilter;
        }
      }
      
      return matchesSearch && matchesStatus;
    });

    // Sort campaigns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.theme.localeCompare(b.theme);
        case 'status':
          const getStatusPriority = (campaign: any) => {
            if (!campaign.started) return 3;
            if (campaign.status === 'active') return 1;
            if (campaign.status === 'paused') return 2;
            return 4;
          };
          return getStatusPriority(a) - getStatusPriority(b);
        case 'players':
          return (b.players?.length || 0) - (a.players?.length || 0);
        case 'date':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [campaigns, searchTerm, statusFilter, sortBy]);

  const getCampaignStatusIcon = (campaign: any) => {
    if (!campaign.started) return '⏸️'; // Not started
    if (campaign.status === 'active') return '▶️'; // Active
    if (campaign.status === 'paused') return '⏸️'; // Paused
    return '⏸️'; // Default
  };

  const getCampaignStatusText = (campaign: any) => {
    if (!campaign.started) return 'Not Started';
    if (campaign.status === 'active') return 'In Progress';
    if (campaign.status === 'paused') return 'Paused';
    return 'Unknown';
  };

  const getCampaignStatusColor = (campaign: any) => {
    if (!campaign.started) return 'text-gray-400';
    if (campaign.status === 'active') return 'text-green-400';
    if (campaign.status === 'paused') return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getThemeIcon = (themeName: string) => {
    const theme = campaignThemes.find(t => t.name === themeName);
    return theme?.icon || '🎲';
  };

  const getThemeGradient = (themeName: string) => {
    const gradients: Record<string, string> = {
      'Fantasy': 'from-emerald-600 to-teal-600',
      'Sci-Fi': 'from-blue-600 to-cyan-600',
      'Horror': 'from-red-600 to-orange-600',
      'Mystery': 'from-purple-600 to-indigo-600',
      'Western': 'from-yellow-600 to-orange-600',
      'Modern': 'from-gray-600 to-blue-600',
      'Post-Apocalyptic': 'from-orange-600 to-red-600',
      'Steampunk': 'from-amber-600 to-yellow-600'
    };
    return gradients[themeName] || 'from-blue-600 to-purple-600';
  };

  if (showCreateCampaign) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white">Create New Campaign</h3>
            <p className="text-blue-200 mt-1">Choose a theme and customize your adventure</p>
          </div>
          <button
            onClick={() => setShowCreateCampaign(false)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 theme-grid">
          {campaignThemes.map((theme) => (
            <div
              key={theme.name}
              onClick={() => setSelectedTheme(theme)}
              className={`group p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedTheme?.name === theme.name
                  ? 'border-blue-400 bg-gradient-to-br from-blue-500/30 to-purple-500/30 shadow-xl scale-105'
                  : 'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{theme.icon}</div>
                <h4 className="text-white font-bold mb-2 text-lg">{theme.name}</h4>
                <p className="text-blue-200 text-sm leading-relaxed">{theme.description}</p>
                {selectedTheme?.name === theme.name && (
                  <div className="mt-3 flex items-center justify-center space-x-1 text-blue-400 text-sm animate-pulse">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Selected</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.theme && <div className="text-red-400 text-sm animate-pulse">{errors.theme}</div>}

        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <label className="block text-white font-semibold mb-3">Custom Campaign Prompt (Optional)</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Add specific details, themes, or story elements you want the AI to include in your campaign..."
            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 h-32 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            {errors.customPrompt && <div className="text-red-400 text-sm animate-pulse">{errors.customPrompt}</div>}
            <div className="text-xs text-gray-400 ml-auto">
              {customPrompt.length}/1000 characters
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="multiplayer"
              checked={isMultiplayer}
              onChange={(e) => setIsMultiplayer(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
            />
            <label htmlFor="multiplayer" className="text-white font-medium">
              Multiplayer Campaign (up to 6 players)
            </label>
          </div>
          <p className="text-blue-200 text-sm mt-2 ml-8">
            {isMultiplayer ? 'Others can join using the campaign code' : 'Solo adventure - just you and the AI'}
          </p>
        </div>

        <button
          onClick={handleCreateCampaign}
          disabled={!selectedTheme}
          className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
            selectedTheme
              ? `bg-gradient-to-r ${getThemeGradient(selectedTheme.name)} text-white hover:shadow-xl hover:scale-105`
              : 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
          }`}
        >
          {selectedTheme 
            ? `Create ${selectedTheme.name} Campaign ${isMultiplayer ? '(Multiplayer)' : '(Solo)'}`
            : 'Select a theme to continue'
          }
        </button>
      </div>
    );
  }

  if (showJoinCampaign) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white">Join Campaign</h3>
            <p className="text-blue-200 mt-1">Enter a campaign code to join an existing adventure</p>
          </div>
          <button
            onClick={() => setShowJoinCampaign(false)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white/10 rounded-xl p-8 border border-white/20 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h4 className="text-xl font-bold text-white mb-4">Join Adventure</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-3">Campaign Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full px-4 py-4 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 text-center text-2xl font-mono tracking-wider"
                  maxLength={6}
                />
                <p className="text-blue-200 text-sm mt-2">
                  Ask your Game Master for the 6-character code
                </p>
              </div>

              <button
                onClick={handleJoinCampaign}
                disabled={!joinCode.trim() || joinCode.length !== 6}
                className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                  joinCode.trim() && joinCode.length === 6
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-xl hover:scale-105'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
                }`}
              >
                {joinCode.length === 6 ? `Join Campaign ${joinCode}` : 'Enter Campaign Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 campaign-lobby">
      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Campaign Lobby</h2>
        <div className="flex items-center justify-center space-x-3 text-blue-100">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {character?.name?.charAt(0) || 'A'}
          </div>
          <p className="text-lg">Welcome, <span className="font-semibold text-white">{character?.name}</span> the Level {character?.level} {character?.class}!</p>
        </div>
      </div>

      {/* Enhanced action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setShowCreateCampaign(true)}
          className="group p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300">
              <Plus size={24} />
            </div>
            <div className="text-left">
              <div>Create New Campaign</div>
              <div className="text-emerald-100 text-sm font-normal">Start a fresh adventure</div>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setShowJoinCampaign(true)}
          className="group p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300">
              <Users size={24} />
            </div>
            <div className="text-left">
              <div>Join Campaign</div>
              <div className="text-blue-100 text-sm font-normal">Use a campaign code</div>
            </div>
          </div>
        </button>
      </div>

      {/* Enhanced campaigns section */}
      {campaigns.length > 0 && (
        <div className="space-y-6">
          {/* Filters and search */}
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-white">Your Campaigns</h3>
                <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm font-medium">
                  {filteredAndSortedCampaigns.length} of {campaigns.length}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-white/10 text-white placeholder-gray-300 rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
                />
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="not-started">Not Started</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                  <option value="players">Sort by Players</option>
                </select>

                <div className="flex border border-white/20 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-200'} transition-colors`}
                  >
                    ⊞
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-200'} transition-colors`}
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Campaign grid/list */}
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {filteredAndSortedCampaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className={`group relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-blue-400/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  viewMode === 'list' ? 'p-4 flex items-center space-x-4' : 'p-6'
                }`}
              >
                {/* Enhanced status indicator */}
                <div className={`absolute ${viewMode === 'list' ? 'left-2 top-1/2 transform -translate-y-1/2' : 'top-4 right-4'} flex items-center space-x-2`}>
                  <div className={`w-3 h-3 rounded-full ${
                    !campaign.started ? 'bg-yellow-400 animate-pulse' : 
                    campaign.status === 'active' ? 'bg-green-400' : 
                    campaign.status === 'paused' ? 'bg-orange-400' : 'bg-gray-400'
                  }`}></div>
                  {viewMode === 'list' && (
                    <span className={`text-xs font-medium ${getCampaignStatusColor(campaign)}`}>
                      {getCampaignStatusText(campaign)}
                    </span>
                  )}
                </div>
                
                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Campaign header */}
                  <div className={`${viewMode === 'list' ? 'flex items-center space-x-4' : 'mb-4'}`}>
                    <div className={`${viewMode === 'list' ? 'flex items-center space-x-3' : 'flex items-center space-x-3 mb-2'}`}>
                      <div className={`p-2 bg-gradient-to-r ${getThemeGradient(campaign.theme)} rounded-lg`}>
                        <span className="text-xl">{getThemeIcon(campaign.theme)}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{campaign.theme}</h4>
                        {viewMode === 'grid' && (
                          <p className={`text-sm font-medium ${getCampaignStatusColor(campaign)}`}>
                            {getCampaignStatusText(campaign)} • {(campaign.players?.length || 0)} player{(campaign.players?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className="text-right">
                        <div className="text-blue-200 text-sm">{(campaign.players?.length || 0)} players</div>
                        <div className="text-gray-400 text-xs">{campaign.messages?.length || 0} messages</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Campaign code for unstarted multiplayer campaigns */}
                  {!campaign.started && campaign.isMultiplayer && viewMode === 'grid' && (
                    <div className="mb-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-yellow-300 text-sm font-medium">Campaign Code:</span>
                          <code className="ml-2 bg-yellow-900/50 text-yellow-200 px-2 py-1 rounded text-sm font-mono">
                            {campaign.code}
                          </code>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(campaign.code);
                          }}
                          className="text-yellow-300 hover:text-yellow-100 transition-colors p-1"
                          title="Copy campaign code"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Campaign progress */}
                  {campaign.started && viewMode === 'grid' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-white mb-2">
                        <span>Adventure Progress</span>
                        <span>{campaign.messages?.length || 0} messages</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getThemeGradient(campaign.theme)} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min((campaign.messages?.length || 0) * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Quick actions */}
                <div className={`${viewMode === 'list' ? 'flex space-x-2' : 'flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                  {/* Play/Resume Button */}
                  {(!campaign.started || campaign.status === 'paused') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeCampaign(campaign.id);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium flex items-center space-x-1"
                      title={!campaign.started ? "Start Campaign" : "Resume Campaign"}
                    >
                      <span>▶</span>
                      <span>{!campaign.started ? 'Start' : 'Resume'}</span>
                    </button>
                  )}
                  
                  {/* Pause Button */}
                  {campaign.started && campaign.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePauseCampaign(campaign.id);
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all text-sm font-medium"
                      title="Pause Campaign"
                    >
                      ⏸
                    </button>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampaign(campaign.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
                    title="Delete Campaign"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* No results message */}
          {filteredAndSortedCampaigns.length === 0 && campaigns.length > 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No campaigns match your filters</h3>
              <p className="text-blue-200">Try adjusting your search or filter settings</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-8xl mb-6 opacity-50">🏰</div>
          <h3 className="text-3xl font-bold text-white mb-4">Ready for Adventure?</h3>
          <p className="text-blue-200 text-lg mb-8 max-w-md mx-auto">
            Your epic journey awaits! Create your first campaign or join an existing one to begin your adventure in the realms of MythSeeker.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setShowCreateCampaign(true)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
            >
              🎲 Create Your First Campaign
            </button>
            <button
              onClick={() => setShowJoinCampaign(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
            >
              🤝 Join Existing Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const WaitingRoom: React.FC<{ campaign: any, onStart: () => void, onBack: () => void }> = ({ campaign, onStart, onBack }) => (
  <div className="text-white p-3 lg:p-4">
    <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">Waiting for Players</h2>
    <p className="text-sm lg:text-base mb-3 lg:mb-4">Campaign Code: <span className="font-mono bg-white/20 px-2 py-1 rounded">{campaign?.code}</span></p>
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
      <Tooltip content="Start the campaign and begin the adventure">
        <button onClick={onStart} className="px-4 py-2 bg-green-600 rounded text-sm lg:text-base hover:bg-green-700 transition-all">Start Game</button>
      </Tooltip>
      <Tooltip content="Return to campaign lobby">
        <button onClick={onBack} className="px-4 py-2 bg-gray-600 rounded text-sm lg:text-base hover:bg-gray-700 transition-all">Back</button>
      </Tooltip>
    </div>
  </div>
);

export default function AppWrapper() {
  return (
    <>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only absolute top-2 left-2 bg-blue-700 text-white px-4 py-2 rounded z-50">Skip to main content</a>
      <ErrorBoundary>
        <AIDungeonMaster />
      </ErrorBoundary>
    </>
  );
}