import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseService, Character, UserProfile as UserProfileType } from './firebaseService';
import UserProfileComponent from './UserProfile';
import { aiService } from './services/aiService';
import { dynamicDMService } from './services/dynamicDMService';
import { MultiplayerGame, Player } from './services/multiplayerService';
import { npcService } from './services/npcService';
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
import { Swords, TrendingUp, Globe, HelpCircle, User, Book, Users, Sword, Plus, Edit, Trash2, Copy, ChevronDown, Send, ChevronRight, Home, Trophy } from 'lucide-react';
import SuccessFeedback from './components/SuccessFeedback';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import DiceRoller3D from './components/DiceRoller3D';
import Navigation from './components/Navigation';

// Lazy load components
const NavBar = lazy(() => import('./components/NavBar'));
const TopBar = lazy(() => import('./components/TopBar'));
const WelcomeOverlay = lazy(() => import('./components/WelcomeOverlay'));
const CombatSystem = lazy(() => import('./components/CombatSystem'));
const RightDrawer = lazy(() => import('./components/RightDrawer'));
const FloatingActionButton = lazy(() => import('./components/FloatingActionButton'));
const SimpleHelp = lazy(() => import('./components/SimpleHelp'));
const HelpSystem = lazy(() => import('./components/HelpSystem'));
const DMCenter = lazy(() => import('./components/DMCenter'));

// Breadcrumb Component
const Breadcrumb: React.FC<{ 
  currentScreen: string, 
  currentCampaign?: any, 
  character?: any,
  onNavigate: (path: string) => void 
}> = ({ currentScreen, currentCampaign, character, onNavigate }) => {
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Home', path: '/dashboard', icon: <Home size={16} /> }
    ];

    switch (currentScreen) {
      case 'character-select':
        breadcrumbs.push({ label: 'Characters', path: '/characters', icon: <User size={16} /> });
        break;
      case 'character':
        breadcrumbs.push({ label: 'Characters', path: '/characters', icon: <User size={16} /> });
        breadcrumbs.push({ label: 'Create Character', path: '/characters/create', icon: <Plus size={16} /> });
        break;
      case 'lobby':
        breadcrumbs.push({ label: 'Campaigns', path: '/campaigns', icon: <Book size={16} /> });
        break;
      case 'waiting':
        breadcrumbs.push({ label: 'Campaigns', path: '/campaigns', icon: <Book size={16} /> });
        if (currentCampaign) {
          breadcrumbs.push({ label: currentCampaign.theme, path: `/campaigns/${currentCampaign.id}/waiting`, icon: <Users size={16} /> });
        }
        break;
      case 'game':
        breadcrumbs.push({ label: 'Campaigns', path: '/campaigns', icon: <Book size={16} /> });
        if (currentCampaign) {
          breadcrumbs.push({ label: currentCampaign.theme, path: `/campaigns/${currentCampaign.id}`, icon: <Globe size={16} /> });
        }
        break;
      case 'party':
        breadcrumbs.push({ label: 'Party', path: '/party', icon: <Users size={16} /> });
        break;
      case 'world':
        breadcrumbs.push({ label: 'World', path: '/world', icon: <Globe size={16} /> });
        break;
      case 'combat':
        breadcrumbs.push({ label: 'Combat', path: '/combat', icon: <Sword size={16} /> });
        break;
      case 'magic':
        breadcrumbs.push({ label: 'Magic', path: '/magic', icon: <Swords size={16} /> });
        break;
      case 'dm-center':
        breadcrumbs.push({ label: 'DM Center', path: '/dm-center', icon: <User size={16} /> });
        break;
      case 'profile':
        breadcrumbs.push({ label: 'Profile', path: '/profile', icon: <User size={16} /> });
        break;
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm text-blue-200 mb-4 px-6 pt-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <ChevronRight size={14} className="text-blue-400" />}
          <button
            onClick={() => onNavigate(crumb.path)}
            className={`flex items-center space-x-1 hover:text-white transition-colors ${
              index === breadcrumbs.length - 1 ? 'text-white font-medium' : 'hover:underline'
            }`}
            disabled={index === breadcrumbs.length - 1}
          >
            {crumb.icon}
            <span>{crumb.label}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

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
  showIntroControls?: boolean;
  onSkipIntro?: () => void;
  onDontShowAgain?: () => void;
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
    npcInteraction: { 
      message: context?.npcName ? `${context.npcName} is ${context.disposition} (${context.emotionalSummary})` : 'NPC interaction recorded', 
      type: 'info' 
    },
  };
  
  const defaultMessage = { message: 'Action completed', type: 'success' as const };
  const toastData = messages[action] || defaultMessage;
  
  return {
    id,
    message: toastData.message,
    type: toastData.type,
  };
};

// Navigation Hook Component
const NavigationManager: React.FC<{ 
  onScreenChange: (screen: string) => void,
  currentScreen: string
}> = ({ onScreenChange, currentScreen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // URL to screen mapping
  const pathToScreen: Record<string, string> = {
    '/': 'welcome',
    '/dashboard': 'dashboard',
    '/characters': 'character-select',
    '/characters/create': 'character',
    '/campaigns': 'lobby',
    '/campaigns/:id': 'game',
    '/campaigns/:id/waiting': 'waiting',
    '/party': 'party',
    '/world': 'world',
    '/combat': 'combat',
    '/magic': 'magic',
    '/dm-center': 'dm-center',
    '/profile': 'profile'
  };

  // Screen to URL mapping
  const screenToPath: Record<string, string> = {
    'welcome': '/',
    'dashboard': '/dashboard',
    'character-select': '/characters',
    'character': '/characters/create',
    'lobby': '/campaigns',
    'game': '/campaigns',
    'waiting': '/campaigns',
    'party': '/party',
    'world': '/world',
    'combat': '/combat',
    'magic': '/magic',
    'dm-center': '/dm-center'
  };

  // Handle URL changes
  useEffect(() => {
    const path = location.pathname;
    let screen = 'dashboard';

    // Match exact paths first
    if (pathToScreen[path]) {
      screen = pathToScreen[path];
    } else {
      // Match dynamic paths
      if (path.includes('/campaigns/') && path.endsWith('/waiting')) {
        screen = 'waiting';
      } else if (path.includes('/campaigns/') && path !== '/campaigns') {
        screen = 'game';
      }
    }

    if (screen !== currentScreen) {
      onScreenChange(screen);
    }
  }, [location.pathname, currentScreen, onScreenChange]);

  // Navigation handler
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return null; // This component doesn't render anything
};

const AIDungeonMaster = ({ initialScreen = 'welcome' }: { initialScreen?: string }) => {
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
  const [currentUser, setCurrentUser] = useState<UserProfileType | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firestoreReady, setFirestoreReady] = useState(false);
  
  // Navigation state
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('gameplay');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Game state
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
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
  
  // DM Center state
  const [dmCenterData, setDmCenterData] = useState<any>({
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

  // Persona update state
  const [lastPersonaUpdate, setLastPersonaUpdate] = useState<number>(0);

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
    // Only show toasts for meaningful gameplay achievements, not errors or info messages
    const importantActions = [
      'characterCreated', 
      'campaignCreated', 
      'campaignJoined', 
      'levelUp', 
      'achievementUnlocked',
      'firstMessage',
      'combatStarted',
      'questCompleted',
      'itemFound',
      'npcInteraction',
      'explorationMilestone'
    ];
    
    // Skip error, info, warning, success, goodbye, and other non-gameplay toasts
    const skipActions = ['error', 'info', 'warning', 'success', 'goodbye', 'characterLoaded', 'campaignDeleted', 'ftueSkipped'];
    
    if (importantActions.includes(action) && !skipActions.includes(action)) {
      // Check if user has chosen to skip this intro
      const skippedIntros = JSON.parse(localStorage.getItem('mythseeker_skipped_intros') || '[]');
      if (skippedIntros.includes(action)) {
        return; // Don't show this toast if user chose to skip it
      }
      
      const toast = generateToastMessage(action, context);
      
      // Add intro controls for certain types of toasts
      if (['characterCreated', 'campaignCreated', 'firstMessage', 'combatStarted'].includes(action)) {
        toast.showIntroControls = true;
        toast.onSkipIntro = () => {
          console.log(`Skipped intro for ${action}`);
        };
        toast.onDontShowAgain = () => {
          // Store preference in localStorage
          const skippedIntros = JSON.parse(localStorage.getItem('mythseeker_skipped_intros') || '[]');
          if (!skippedIntros.includes(action)) {
            skippedIntros.push(action);
            localStorage.setItem('mythseeker_skipped_intros', JSON.stringify(skippedIntros));
          }
          console.log(`Won't show ${action} intro again`);
        };
      }
      
      setToastMessages(prev => [...prev, toast]);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => dismissToast(toast.id), 5000);
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
          // Add a small delay to ensure Firestore connection is ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
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

          // Get user profile with retry logic
          console.log('Loading user profile for:', firebaseUser.uid);
          let retryCount = 0;
          let userProfile = null;
          
          while (retryCount < 3 && !userProfile) {
            try {
              userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
              break;
            } catch (error) {
              retryCount++;
              console.log(`Profile load attempt ${retryCount} failed:`, error);
              if (retryCount < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              }
            }
          }
          
          if (userProfile) {
            setCurrentUser(userProfile);
            setPlayerName(userProfile.displayName);
            setIsAuthenticated(true);
            
            // Load user's characters with retry logic
            console.log('Loading characters for user:', firebaseUser.uid);
            let characters: any[] = [];
            retryCount = 0;
            
            while (retryCount < 3) {
              try {
                characters = await firebaseService.getUserCharacters(firebaseUser.uid);
                break;
              } catch (error) {
                retryCount++;
                console.log(`Characters load attempt ${retryCount} failed:`, error);
                if (retryCount < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }
            }
            
            setUserCharacters(characters);
            
            // Track user profile loaded
            analyticsService.trackUserAction('profile_loaded', {
              characters_count: characters.length,
              has_characters: characters.length > 0
            });
            
            // Don't automatically redirect - let the user navigate where they want
            // Only set initial screen if we're not already on a specific route
            if (location.pathname === '/') {
              if (characters.length > 0) {
                setCurrentScreen('dashboard');
                navigate('/dashboard');
                analyticsService.trackPageView('dashboard', 'MythSeeker - Dashboard');
              } else {
                setCurrentScreen('welcome');
                navigate('/');
                analyticsService.trackPageView('welcome', 'MythSeeker - Welcome');
              }
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

    try {
      console.log('Attempting to save character to Firebase:', firebaseCharacter);
      const characterId = await firebaseService.saveCharacter(firebaseCharacter);
      console.log('Character saved to Firebase with ID:', characterId);
      
      // Update local state with Firebase ID
      const savedCharacter = { ...firebaseCharacter, id: characterId };
      setUserCharacters(prev => [savedCharacter, ...prev]);
      setCharacter(savedCharacter);
      
      addToast('characterCreated', { character: characterData });
      setCurrentScreen('lobby');
      
      console.log('Character state updated, navigating to lobby');
    } catch (error) {
      console.error('Error saving character to Firebase, falling back to local storage:', error);
      
      // Fallback: Save to local storage with generated ID
      const localCharacter = { 
        ...firebaseCharacter, 
        id: Date.now().toString(),
        userId: currentUser.uid // Keep the user ID for when Firebase works again
      };
      
      // Save to localStorage as backup
      const localCharacters = JSON.parse(localStorage.getItem('mythseeker_characters') || '[]');
      localCharacters.push(localCharacter);
      localStorage.setItem('mythseeker_characters', JSON.stringify(localCharacters));
      
      // Update local state
      setUserCharacters(prev => [localCharacter, ...prev]);
      setCharacter(localCharacter);
      
      addToast('characterCreated', { character: characterData });
      addToast('warning', { message: 'Character saved locally. Will sync when connection is restored.' });
      setCurrentScreen('lobby');
      
      console.log('Character saved to local storage as fallback');
    }
  };

  const loadCharacter = async (characterId: string) => {
    console.log('loadCharacter called with ID:', characterId);
    console.log('Current user:', currentUser);
    console.log('Is authenticated:', isAuthenticated);
    
    try {
      // First try to load from local storage
      const localCharacters = JSON.parse(localStorage.getItem('mythseeker_characters') || '[]');
      console.log('Local characters found:', localCharacters.length);
      const localCharacter = localCharacters.find((c: any) => c.id === characterId);
      
      if (localCharacter) {
        console.log('Found character in local storage:', localCharacter.name);
        setCharacter(localCharacter);
        // Don't automatically navigate to campaigns - let the user choose
        addToast('characterLoaded', { character: localCharacter.name });
        return;
      }
      
      console.log('Character not found in local storage, trying Firebase...');
      
      // If not found locally and user is authenticated, try Firebase
      if (currentUser) {
        console.log('Loading character from Firebase with ID:', characterId);
        const character = await firebaseService.getCharacter(characterId);
        console.log('Firebase getCharacter result:', character);
        
        if (character) {
          console.log('Successfully loaded character from Firebase:', character.name);
          setCharacter(character);
          // Don't automatically navigate to campaigns - let the user choose
          addToast('characterLoaded', { character: character.name });
        } else {
          console.log('Character not found in Firebase');
          addToast('error', { message: 'Character not found in database' });
        }
      } else {
        console.log('User not authenticated, cannot load from Firebase');
        addToast('error', { message: 'Character not found' });
      }
    } catch (error: any) {
      console.error('Error loading character:', error);
      addToast('error', { message: `Failed to load character: ${error.message || 'Unknown error'}` });
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await firebaseService.signInWithGoogle();
      // Don't set loading to false here - it might be using redirect
      // The onAuthStateChanged listener will handle loading state
      // Removed automatic welcome toast to reduce noise
    } catch (error) {
      const err = error as any;
      console.error('Error signing in:', err);
      // Handle specific authentication errors
      if (err.code === 'auth/popup-blocked') {
        addToast('error', { message: 'Popup was blocked. Trying alternative sign-in method...' });
      } else if (err.code === 'auth/popup-closed-by-user') {
        addToast('info', { message: 'Sign-in was cancelled.' });
        setIsLoading(false);
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Don't show error for cancelled popup requests (user might have closed it)
        setIsLoading(false);
      } else {
        addToast('error', { message: 'Failed to sign in. Please try again.' });
        setIsLoading(false);
      }
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

  const navigate = useNavigate();

  // Enhanced navigation handler with URL routing
  const handleNavChange = (navKey: string) => {
    setActiveNav(navKey);
    
    // Map navigation keys to screens and URLs
    const navMappings: Record<string, { screen: string; path: string }> = {
      'dashboard': { screen: 'dashboard', path: '/dashboard' },
      'campaigns': { screen: 'lobby', path: '/campaigns' },
      'characters': { screen: 'character-select', path: '/characters' },
      'party': { screen: 'party', path: '/party' },
      'world': { screen: 'world', path: '/world' },
      'combat': { screen: 'combat', path: '/combat' },
      'magic': { screen: 'magic', path: '/magic' },
      'dm-center': { screen: 'dm-center', path: '/dm-center' }
    };

    const mapping = navMappings[navKey] || navMappings['dashboard'];
    setCurrentScreen(mapping.screen);
    navigate(mapping.path);
    
    // Track navigation
    analyticsService.trackUserAction('navigation', { from: currentScreen, to: mapping.screen });
  };

  // Breadcrumb navigation handler
  const handleBreadcrumbNavigate = (path: string) => {
    navigate(path);
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

  const handleQuickStart = async () => {
    console.log('🚀 Quick Start initiated...');
    
    try {
      // Create a quick character
      const quickCharacter = {
        id: `quick_${Date.now()}`,
        name: 'Adventurer',
        class: 'Warrior',
        level: 1,
        health: 20,
        maxHealth: 20,
        mana: 0,
        maxMana: 0,
        experience: 0,
        gold: 50,
        inventory: {
          'Sword': 1,
          'Shield': 1,
          'Health Potion': 2
        },
        baseStats: {
          strength: 16,
          dexterity: 12,
          intelligence: 10,
          charisma: 14
        },
        skills: ['Athletics', 'Intimidation'],
        backstory: 'A brave warrior seeking adventure and glory.',
        totalPlayTime: 0,
        lastPlayed: new Date(),
        achievements: []
      };

      // Set the character
      setCharacter(quickCharacter);
      
      // Create a quick campaign
      const quickCampaign = {
        id: `quick_campaign_${Date.now()}`,
        name: 'Quick Adventure',
        theme: 'Fantasy',
        description: 'A fast-paced fantasy adventure for quick play',
        isMultiplayer: false,
        started: false,
        status: 'active',
        players: [{
          id: playerId,
          name: currentUser?.displayName || 'Player',
          character: quickCharacter
        }],
        customPrompt: 'A classic fantasy adventure with action, exploration, and discovery.',
        createdAt: new Date(),
        lastActivity: new Date()
      };

      // Start the campaign immediately
      await startCampaign(quickCampaign);
      
      addToast('success', { message: 'Quick start campaign created! Welcome to your adventure!' });
      
    } catch (error) {
      console.error('Quick start error:', error);
      addToast('error', { message: 'Failed to start quick campaign. Please try again.' });
    }
  };

  const handleTutorialStart = async () => {
    console.log('📚 Tutorial Start initiated...');
    
    try {
      // Create tutorial character
      const tutorialCharacter = {
        id: `tutorial_${Date.now()}`,
        name: 'Apprentice',
        class: 'Mage',
        level: 1,
        health: 16,
        maxHealth: 16,
        mana: 20,
        maxMana: 20,
        experience: 0,
        gold: 25,
        inventory: {
          'Staff': 1,
          'Spellbook': 1,
          'Mana Potion': 2
        },
        baseStats: {
          strength: 8,
          dexterity: 12,
          intelligence: 16,
          charisma: 14
        },
        skills: ['Arcana', 'Investigation'],
        backstory: 'A young apprentice learning the ways of magic and adventure.',
        totalPlayTime: 0,
        lastPlayed: new Date(),
        achievements: []
      };

      // Set the character
      setCharacter(tutorialCharacter);
      
      // Create tutorial campaign with guided prompts
      const tutorialCampaign = {
        id: `tutorial_campaign_${Date.now()}`,
        name: 'Learning Adventure',
        theme: 'Fantasy',
        description: 'A guided tutorial to learn MythSeeker mechanics',
        isMultiplayer: false,
        started: false,
        status: 'active',
        isTutorial: true,
        players: [{
          id: playerId,
          name: currentUser?.displayName || 'Player',
          character: tutorialCharacter
        }],
        customPrompt: `You are a patient, educational DM teaching a new player. This is a tutorial campaign designed to teach MythSeeker mechanics through play.

TUTORIAL OBJECTIVES:
1. Teach basic movement and exploration
2. Introduce NPC interaction and dialogue
3. Demonstrate simple combat mechanics
4. Show inventory and character management
5. Explain quest and objective systems

GUIDELINES:
- Be encouraging and supportive
- Explain mechanics naturally through story
- Provide clear choices that teach different systems
- Keep challenges easy and educational
- Celebrate player successes
- Use simple, clear language
- Reference the tutorial nature when helpful

Start with a welcoming scene that introduces the magical academy setting and the player's role as an apprentice.`,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      // Start the tutorial campaign
      await startCampaign(tutorialCampaign);
      
      addToast('success', { message: 'Tutorial started! Learn the ropes of MythSeeker!' });
      
    } catch (error) {
      console.error('Tutorial start error:', error);
      addToast('error', { message: 'Failed to start tutorial. Please try again.' });
    }
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
      
      // Ensure campaigns have proper status (fix legacy campaigns)
      const normalizedCampaigns = savedCampaigns.map((campaign: any) => ({
        ...campaign,
        status: campaign.status || (campaign.started ? 'active' : undefined)
      }));
      
      // Set campaigns immediately from localStorage
      setCampaigns(normalizedCampaigns);
      
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
      const err = error as Error;
      console.error('Error loading campaigns:', err);
      // Fallback to empty array
      setCampaigns([]);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      // Remove from local storage
      const savedCampaigns = JSON.parse(localStorage.getItem('mythseeker_campaigns') || '[]');
      const filteredCampaigns = savedCampaigns.filter((c: any) => c.id !== campaignId);
      localStorage.setItem('mythseeker_campaigns', JSON.stringify(filteredCampaigns));
      
      // Remove from Firebase if multiplayer and authenticated
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign?.isMultiplayer && isAuthenticated) {
        try {
          await multiplayerService.deleteCampaign(campaignId);
        } catch (firebaseError) {
          console.error('Error deleting from Firebase, but local deletion succeeded:', firebaseError);
        }
      }
      
      // Update state
      setCampaigns(filteredCampaigns);
      
      // If this was the current campaign, clear it
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(null);
        setMessages([]);
        setCurrentScreen('lobby');
        navigate('/campaigns');
      }
      
      addToast('campaignDeleted', { message: 'Campaign deleted successfully' });
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting campaign:', err);
      addToast('error', { message: 'Failed to delete campaign' });
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
          navigate(`/campaigns/${joinedCampaign.id}`);
        } else {
          setCurrentScreen('waiting');
          navigate(`/campaigns/${joinedCampaign.id}/waiting`);
        }
        
        addToast('campaignJoined', { campaign: joinedCampaign });
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error joining campaign:', err);
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
    // Don't automatically set current campaign - let user choose
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
        if (item && item.type && item.name && equipmentTypes[item.type] && equipmentTypes[item.type][item.name]) {
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
        navigate(`/campaigns/${createdCampaign.id}/waiting`);
      } else {
        await startCampaign(createdCampaign);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  const startCampaign = async (campaign: any) => {
    console.log('=== START CAMPAIGN DEBUG ===');
    console.log('startCampaign called with campaign:', campaign);
    console.log('Campaign ID:', campaign?.id);
    console.log('Campaign isMultiplayer:', campaign?.isMultiplayer);
    console.log('Current AI thinking state:', isAIThinking);
    
    if (!campaign || !campaign.id) {
      console.error('Campaign or campaign ID is missing!', campaign);
      addToast('error', { message: 'Campaign data is invalid' });
      return;
    }
    
    setIsAIThinking(true);
    try {
      // Use DynamicDMService for immersive campaign opening
      const theme = campaignThemes.find(t => t.name === campaign.theme) || campaignThemes[0];
      const partyMembers = campaign.players?.map((p: any) => `${p.character?.name || 'Unknown'} the ${p.character?.class || 'Adventurer'}`).join(', ') || 'the party';
      const openingInput = `Begin the adventure. The party consists of: ${partyMembers}. Setting: ${theme.description}. Present an immersive opening scene with 3 action choices.`;
      const dynamicResponse = await dynamicDMService.processPlayerInput({
        message: openingInput,
        playerId: playerId,
        campaignId: campaign.id,
        character: character,
        timestamp: new Date()
      });
      // Build the opening message
      const openingMessage = {
        id: Date.now(),
        type: 'dm',
        content: dynamicResponse.narrative_text + (dynamicResponse.npc_dialogue ? `\n\n${dynamicResponse.npc_dialogue}` : ''),
        choices: (dynamicResponse as any).choices || ['Explore', 'Investigate', 'Ask questions'],
        timestamp: new Date(),
        atmosphere: dynamicResponse.mood_adjustment || { mood: 'dynamic', tension: 'medium' }
      };
      // Update world state if present
      if (dynamicResponse.game_state_updates) {
        updateWorldState(dynamicResponse.game_state_updates);
      }
      setMessages([openingMessage]);
      const startedCampaign = { ...campaign, started: true, status: 'active' };
      setCurrentCampaign(startedCampaign);
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? startedCampaign : c));
      setCurrentScreen('game');
      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error starting campaign with DynamicDMService:', error);
      addToast('error', { message: 'Failed to start campaign. Please try again.' });
    }
    setIsAIThinking(false);
    console.log('=== END CAMPAIGN DEBUG ===');
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
        await multiplayerService.updateCampaignState(campaignId, { status: 'paused' });
      } catch (error) {
        console.error('Error pausing campaign:', error);
      }
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Set the campaign as current and load its state
    setCurrentCampaign(campaign);
    setMessages(campaign.messages || []);
    
    // Update campaign status to active (ensure started campaigns have proper status)
    const resumedCampaign: MultiplayerGame = { 
      ...campaign, 
      status: campaign.started ? 'active' as const : campaign.status 
    };
    setCampaigns(prev => prev.map(c => c.id === campaignId ? resumedCampaign : c));
    
    // Transition to appropriate screen with URL routing
    if (campaign.started) {
      setCurrentScreen('game');
      navigate(`/campaigns/${campaign.id}`);
      addToast('campaignResumed', { campaign: campaign });
    } else {
      // If campaign hasn't started yet, go to waiting room
      setCurrentScreen('waiting');
      navigate(`/campaigns/${campaign.id}/waiting`);
    }

    // Save to Firebase if multiplayer and update status
    if (campaign.isMultiplayer && campaign.started) {
      try {
        await multiplayerService.updateCampaignState(campaignId, { status: 'active' });
      } catch (error) {
        console.error('Error updating campaign status:', error);
      }
    }

    // In resumeCampaign and anywhere setCurrentCampaign is called after loading a campaign:
    if ((campaign as any).dmCenterData) {
      setDmCenterData((campaign as any).dmCenterData);
    } else if ((campaign as any).aiSettings) {
      setDmCenterData({ aiSettings: (campaign as any).aiSettings });
    }
    // Place this after setCurrentCampaign(campaign) or setCurrentCampaign(resumedCampaign) in resumeCampaign and similar places.
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

    try {
      // Use Advanced Dynamic DM Service for enhanced AI processing
      const dynamicResponse = await dynamicDMService.processPlayerInput({
        message: sanitizedMessage,
        playerId: playerId,
        campaignId: currentCampaign?.id || 'single-player',
        character: character,
        timestamp: new Date()
      });

      // Process the enhanced response
      const dmResponse = {
        narrative: dynamicResponse.narrative_text,
        choices: (dynamicResponse.follow_up_prompts || ['Explore', 'Investigate', 'Ask questions']),
        atmosphere: {
          mood: 'dynamic',
          tension: 'medium',
          environmentalDetails: 'The world responds to your actions'
        }
      };

      // Add NPC dialogue if present
      if (dynamicResponse.npc_dialogue) {
        dmResponse.narrative += `\n\n${dynamicResponse.npc_dialogue}`;
      }

      // Process system actions (dice rolls, stat changes, etc.)
      if (dynamicResponse.system_actions && dynamicResponse.system_actions.length > 0) {
        dynamicResponse.system_actions.forEach((action: any) => {
          if (action.type === 'dice_roll') {
            const roll = rollDice(20);
            dmResponse.narrative += `\n\n[Roll: ${roll}]`;
          }
        });
      }
      
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
              setCharacter((prev: any) => prev ? {
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
    
    // Get AI settings from DM Center
    const aiSettings = dmCenterData?.aiSettings || {
      dmStyle: 'balanced',
      difficulty: 6,
      descriptionLength: 'detailed',
      improvisationLevel: 7,
      npcComplexity: 'detailed',
      conflictFrequency: 5,
      continuityStrictness: 'moderate',
      worldReactivity: 8
    };
    
    // Build context from recent actions - Enhanced memory context
    const recentActions = aiMemory.playerActions.slice(-10); // Increased from 5 to 10
    const recentConsequences = aiMemory.consequences.slice(-5); // Increased from 3 to 5
    
    // Add long-term memory summary for campaigns with many actions
    const longTermMemory = aiMemory.playerActions.length > 20 ? 
      `LONG-TERM MEMORY: This player has taken ${aiMemory.playerActions.length} actions. Key patterns: ${aiMemory.playerActions.slice(-20).filter((a: any) => a.type === 'combat').length} combat actions, ${aiMemory.playerActions.slice(-20).filter((a: any) => a.type === 'social').length} social interactions, ${aiMemory.playerActions.slice(-20).filter((a: any) => a.type === 'exploration').length} exploration actions.` : '';
    
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

    // Generate AI personality based on settings
    const getDMStyle = () => {
      switch (aiSettings.dmStyle) {
        case 'story-focused': return 'Focus on narrative depth, character development, and emotional storytelling. Prioritize story over mechanics.';
        case 'combat-heavy': return 'Emphasize tactical combat, strategic thinking, and action sequences. Make every fight meaningful and challenging.';
        case 'roleplay-intensive': return 'Deep character interactions, NPC development, and social encounters. Focus on dialogue and relationships.';
        case 'sandbox': return 'Open world exploration, player-driven storylines, and emergent gameplay. Let players shape the world.';
        default: return 'Balanced approach between story, combat, and roleplay. Adapt to player preferences dynamically.';
      }
    };

    const getDescriptionStyle = () => {
      switch (aiSettings.descriptionLength) {
        case 'concise': return 'Keep descriptions brief and to the point. Focus on essential details only.';
        case 'verbose': return 'Provide rich, detailed descriptions with sensory details, atmosphere, and immersive world-building.';
        default: return 'Use moderate detail - enough to paint a picture without overwhelming.';
      }
    };

    const getDifficultyGuidance = () => {
      if (aiSettings.difficulty <= 3) return 'Keep challenges easy and accessible. Provide clear solutions and helpful guidance.';
      if (aiSettings.difficulty <= 6) return 'Balanced challenges that test players but provide reasonable solutions.';
      return 'Create challenging, high-stakes situations that require clever thinking and may have serious consequences.';
    };

    const basePrompt = `You are an advanced AI Dungeon Master for a ${currentCampaign?.theme || 'fantasy'} campaign. You must create dynamic, responsive, and truly intelligent storytelling.

**AI PERSONALITY SETTINGS:**
- DM Style: ${getDMStyle()}
- Description Style: ${getDescriptionStyle()}
- Difficulty Level: ${getDifficultyGuidance()}
- NPC Complexity: ${aiSettings.npcComplexity} - Create NPCs with ${aiSettings.npcComplexity} personalities and motivations
- Conflict Frequency: ${aiSettings.conflictFrequency}/10 - ${aiSettings.conflictFrequency <= 3 ? 'Minimal conflict, peaceful interactions' : aiSettings.conflictFrequency <= 6 ? 'Moderate tension and occasional conflicts' : 'High tension with frequent dramatic conflicts'}
- Continuity: ${aiSettings.continuityStrictness} - ${aiSettings.continuityStrictness === 'strict' ? 'Maintain strict world consistency and logical consequences' : aiSettings.continuityStrictness === 'loose' ? 'Allow creative flexibility while maintaining basic coherence' : 'Balance consistency with creative freedom'}
- World Reactivity: ${aiSettings.worldReactivity}/10 - ${aiSettings.worldReactivity <= 3 ? 'Minimal world changes' : aiSettings.worldReactivity <= 6 ? 'Moderate world reactions to player actions' : 'Highly reactive world that changes dramatically based on player choices'}

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

${longTermMemory}

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

      // Add new NPCs with enhanced persistence
      if (updates.newNPCs) {
        updates.newNPCs.forEach((npcData: any) => {
          const existingNPC = newState.npcs[npcData.name];
          if (existingNPC) {
            // Update existing NPC with new information and emotional state
            const updatedNPC = npcService.updateEmotionalState(existingNPC, npcData.emotionalImpact || {});
            newState.npcs[npcData.name] = {
              ...updatedNPC,
              ...npcData,
              lastSeen: new Date(),
              interactionCount: (existingNPC.interactionCount || 0) + 1,
              knownSecrets: [...(existingNPC.knownSecrets || []), ...(npcData.knownSecrets || [])],
              currentLocation: newState.currentLocation
            };
          } else {
            // Create new NPC with full emotional and memory system
            const newNPC = npcService.createNPC({
              ...npcData,
              id: Date.now().toString(),
              firstEncounter: new Date(),
              lastSeen: new Date(),
              interactionCount: 1,
              relationship: 0,
              knownSecrets: [],
              currentLocation: newState.currentLocation
            });
            newState.npcs[npcData.name] = newNPC;
          }
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
    setAiMemory((prev: any) => ({
      ...prev,
      playerActions: [...prev.playerActions, {
        description: `Player action: ${inputMessage}`,
        timestamp: new Date(),
        location: worldState.currentLocation
      }],
      consequences: [...prev.consequences, ...(updates.consequences || [])]
    }));
  };

  // Handle NPC interaction with emotional feedback
  const handleNPCInteraction = (npcId: string, playerAction: string, emotionalImpact?: any) => {
    const npc = worldState.npcs[npcId];
    if (!npc) return;

    // Update NPC emotional state
    const updatedNPC = npcService.updateEmotionalState(npc, emotionalImpact || {});
    
    // Add memory of this interaction
    const memory = {
      type: 'conversation' as const,
      description: `Player said: "${playerAction}"`,
      emotionalImpact: emotionalImpact || { joy: 0, anger: 0, fear: 0, trust: 0, respect: 0 },
      relationshipChange: 0,
      context: `Interaction at ${worldState.currentLocation}`
    };
    
    const npcWithMemory = npcService.addMemory(updatedNPC, memory);
    
    // Update world state
    setWorldState(prev => ({
      ...prev,
      npcs: {
        ...prev.npcs,
        [npcId]: npcWithMemory
      }
    }));

    // Generate NPC response based on emotional state
    const npcResponse = npcService.generateResponse(npcWithMemory, playerAction);
    
    // Add NPC response to messages
    const npcMessage = {
      id: Date.now() + 1,
      type: 'npc' as const,
      content: npcResponse,
      npcId: npcId,
      npcName: npcWithMemory.name,
      timestamp: new Date(),
      emotionalState: npcWithMemory.emotionalState
    };
    
    setMessages(prev => [...prev, npcMessage]);
    
    // Show emotional feedback toast
    const disposition = npcService.getDisposition(npcWithMemory);
    const emotionalSummary = npcService.getEmotionalSummary(npcWithMemory);
    
    addToast('npcInteraction', { 
      npcName: npcWithMemory.name, 
      disposition, 
      emotionalSummary 
    });
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

      {/* NPC Emotional States */}
      {Object.keys(worldState.npcs).length > 0 && (
        <div className="mt-2">
          <h4 className="text-purple-400 font-semibold text-xs mb-1">NPC Emotions:</h4>
          <div className="space-y-1">
            {Object.entries(worldState.npcs).slice(0, 3).map(([npcId, npc]: [string, any]) => (
              <div key={npcId} className="text-xs text-purple-200 bg-purple-900/20 p-1 rounded flex justify-between">
                <span>{npc.name}</span>
                <span className={`${
                  npc.emotionalState?.currentMood === 'friendly' ? 'text-green-400' :
                  npc.emotionalState?.currentMood === 'hostile' ? 'text-red-400' :
                  npc.emotionalState?.currentMood === 'anxious' ? 'text-orange-400' :
                  'text-gray-400'
                }`}>
                  {npc.emotionalState?.currentMood || 'neutral'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render full-width content for screens that need unrestricted space
  const renderFullWidthContent = () => {
    switch (currentScreen) {
      case 'character':
        if (!isAuthenticated) {
          return (
            <div className="h-full flex items-center justify-center p-4">
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
          <div className="h-full p-6">
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
        );
      case 'waiting':
        return (
          <WaitingRoom 
            campaign={currentCampaign}
            onStart={startCampaign}
            onBack={() => setCurrentScreen('lobby')}
          />
        );
      case 'game':
        return (
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
        );
      case 'combat':
        return combatState && (
          <Suspense fallback={<LoadingSpinner />}>
            <CombatSystem
              combatants={combatState.combatants}
              battleMap={combatState.battleMap}
              currentTurn={combatState.currentTurn}
              activeCombatantId={combatState.turnOrder[combatState.currentCombatantIndex]}
              onAction={handleCombatAction}
              onEndCombat={endCombat}
              isPlayerTurn={combatService.isPlayerTurn()}
            />
          </Suspense>
        );
      case 'world':
        return (
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
                  <h3 className="text-white font-semibold mb-2">Weather</h3>
                  <p className="text-blue-200">{worldState?.weather || 'Clear'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'characters':
      case 'character-select':
        return (
          <div className="h-full p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">Choose Your Character</h2>
                <p className="text-blue-200">Welcome back, {currentUser?.displayName}!</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                >
                  ← Back to Dashboard
                </button>
                <button
                  onClick={() => setCurrentScreen('character')}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Create New Character
                </button>
              </div>
            </div>
            
            {userCharacters.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏰</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Characters Yet</h3>
                <p className="text-blue-200 mb-6">Create your first character to begin your adventure!</p>
                <button
                  onClick={() => setCurrentScreen('character')}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  Create Your First Character
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCharacters.map((char: any) => (
                  <div
                    key={char.id}
                    className="bg-white/10 rounded-xl p-6 border border-white/20 hover:border-blue-400 hover:bg-white/20 cursor-pointer transition-all"
                    onClick={() => loadCharacter(char.id!)}
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
                ))}
                
                {/* Create New Character Card */}
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
              </div>
            )}
          </div>
        );
      case 'profile':
        if (!isAuthenticated) {
          return (
            <div className="h-full flex items-center justify-center p-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
                <p className="text-blue-200 mb-6">Please sign in to view your profile</p>
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
          <div className="h-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Player Profile</h2>
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="h-[calc(100vh-200px)]">
              <UserProfileComponent />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Enhanced Gameplay Component with immersive design
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
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [showDiceRoller, setShowDiceRoller] = useState(false);
    const [diceResult, setDiceResult] = useState<number | null>(null);
    const [messageFilter, setMessageFilter] = useState<'all' | 'dm' | 'player' | 'system'>('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [atmosphericSound, setAtmosphericSound] = useState(true);

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Enhanced quick actions with context awareness
    const quickActions = [
      "I examine my surroundings carefully for clues",
      "I search for hidden passages or secret doors", 
      "I listen carefully for any sounds or voices",
      "I check my equipment and inventory",
      "I try to communicate with any nearby NPCs",
      "I cast a detection spell",
      "I move stealthily forward",
      "I prepare for combat"
    ];

    // Dice rolling functionality
    const rollDice = (sides: number) => {
      const result = Math.floor(Math.random() * sides) + 1;
      setDiceResult(result);
      setInputMessage(`I roll a d${sides} and get ${result}`);
      setTimeout(() => setDiceResult(null), 3000);
    };

    // Enhanced message filtering
    const filteredMessages = messages.filter(msg => {
      if (messageFilter === 'all') return true;
      return msg.type === messageFilter;
    });

    // Scroll detection
    useEffect(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsScrolledUp(!isNearBottom);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Format message content with enhanced styling
    const formatMessageContent = (content: string) => {
      if (!content) return '';
      
      // Add emphasis for important terms
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-blue-300">$1</em>')
        .replace(/"(.*?)"/g, '<span class="text-green-300">"$1"</span>');
    };

    // Enhanced choice selection with animation
    const handleQuickAction = (action: string) => {
      setInputMessage(action);
      setShowQuickActions(false);
      setTimeout(() => sendMessage(), 100);
    };

    return (
      <div className={`h-full flex flex-col transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Immersive Header with Campaign Info */}
        <div className="relative bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-lg border-b border-purple-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
          <div className="relative flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                🗺️
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{campaign?.theme || 'Adventure'}</h2>
                <div className="flex items-center space-x-4 text-sm text-purple-200">
                  <span>•</span>
                  <span>{filteredMessages.length} messages</span>
                  <span>•</span>
                  <span className="text-green-400">Active Campaign</span>
                  {worldState?.currentLocation && (
                    <>
                      <span>•</span>
                      <span className="text-yellow-400">{worldState.currentLocation}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Message Filter */}
              <select
                value={messageFilter}
                onChange={(e) => setMessageFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
              >
                <option value="all">All Messages</option>
                <option value="dm">DM Only</option>
                <option value="player">Player Only</option>
                <option value="system">System Only</option>
              </select>

              {/* Quick Actions Toggle */}
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className={`p-2 rounded-lg transition-all ${showQuickActions ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-200 hover:bg-white/20'}`}
                title="Quick Actions"
              >
                ⚡
              </button>

              {/* Dice Roller */}
              <button
                onClick={() => setShowDiceRoller(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-purple-200"
                title="Roll Dice"
              >
                🎲
              </button>

              {/* Atmospheric Sound */}
              <button
                onClick={() => setAtmosphericSound(!atmosphericSound)}
                className={`p-2 rounded-lg transition-all ${atmosphericSound ? 'bg-green-600 text-white' : 'bg-white/10 text-purple-200 hover:bg-white/20'}`}
                title="Atmospheric Sounds"
              >
                🔊
              </button>

              {/* Fullscreen */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-purple-200"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? '🗗' : '🗖'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-purple-500/30 backdrop-blur-sm">
            <div className="p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                <span>⚡</span>
                <span>Quick Actions</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-sm text-purple-100 hover:text-white transform hover:scale-105"
                    disabled={isAIThinking}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950/90 via-purple-950/90 to-slate-950/90 relative"
        >
          {/* Atmospheric Background Elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="relative p-6 space-y-6">
            {filteredMessages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`group relative transform transition-all duration-300 hover:scale-[1.01] ${
                  msg.type === 'player'
                    ? 'ml-8'
                    : msg.type === 'dm'
                    ? 'mr-8'
                    : ''
                }`}
              >
                {/* Message Container with Enhanced Styling */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-xl ${
                  msg.type === 'player'
                    ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-400/30 shadow-blue-500/10'
                    : msg.type === 'dm'
                    ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30 shadow-purple-500/10'
                    : 'bg-gradient-to-br from-gray-600/20 to-slate-600/20 border-gray-400/30 shadow-gray-500/10'
                }`}>
                  
                  {/* Message Header */}
                  <div className="flex items-start space-x-4 mb-4">
                    {/* Enhanced Avatar */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                      msg.type === 'player'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        : msg.type === 'dm'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                        : 'bg-gradient-to-br from-gray-500 to-slate-600'
                    }`}>
                      {msg.type === 'player' ? (
                        character?.name?.charAt(0) || 'P'
                      ) : msg.type === 'dm' ? (
                        '🎭'
                      ) : (
                        '⚙️'
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-white text-lg">
                          {msg.type === 'player' 
                            ? character?.name || 'You'
                            : msg.type === 'dm'
                            ? 'Dungeon Master'
                            : msg.playerName || 'System'
                          }
                        </span>
                        <span className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded-full">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        {msg.atmosphere?.mood && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            msg.atmosphere.mood === 'tense' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                            msg.atmosphere.mood === 'mysterious' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' :
                            msg.atmosphere.mood === 'peaceful' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                            'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                          }`}>
                            {msg.atmosphere.mood}
                          </span>
                        )}
                      </div>
                      
                      {/* Enhanced Message Content */}
                      <div 
                        className="text-gray-100 leading-relaxed text-lg"
                        dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                      />
                      
                      {/* Enhanced Choice System */}
                      {msg.choices && msg.choices.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                            <span className="font-medium">Choose your path:</span>
                          </div>
                          <div className="grid gap-3">
                            {msg.choices.map((choice: string, choiceIndex: number) => (
                              <button
                                key={choiceIndex}
                                onClick={() => {
                                  setInputMessage(choice);
                                  setTimeout(() => sendMessage(), 100);
                                }}
                                className="group text-left p-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                disabled={isAIThinking}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white group-hover:scale-110 transition-transform">
                                    {choiceIndex + 1}
                                  </span>
                                  <span className="text-gray-200 group-hover:text-white transition-colors font-medium">
                                    {choice}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Atmosphere Details */}
                      {msg.atmosphere && (
                        <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">Atmosphere</div>
                          <div className="text-sm text-gray-300">
                            🌡️ {msg.atmosphere.mood} • 🌤️ {msg.atmosphere.lighting || 'Normal'} • 🔊 {msg.atmosphere.sounds || 'Quiet'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced AI Thinking Indicator */}
            {isAIThinking && (
              <div className="group transform transition-all duration-300">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/30 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      🎭
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-white text-lg">Dungeon Master</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                      <div className="text-purple-200 text-lg italic">
                        The Dungeon Master weaves the threads of fate...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        {isScrolledUp && (
          <div className="absolute bottom-24 right-6 z-10">
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full text-white shadow-lg transition-all transform hover:scale-110"
            >
              ↓
            </button>
          </div>
        )}

        {/* Enhanced Input Area */}
        <div className="bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-lg border-t border-purple-500/30 p-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="What do you do? (Be specific and creative!)"
                className="w-full px-6 py-4 bg-white/10 text-white placeholder-purple-200 rounded-2xl border border-white/20 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all text-lg backdrop-blur-sm"
                disabled={isAIThinking}
                maxLength={500}
              />
              {inputMessage.length > 0 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 bg-black/30 px-2 py-1 rounded-full">
                  {inputMessage.length}/500
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={isAIThinking || !inputMessage.trim()}
              className="px-8 py-4 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl transition-all text-white font-bold text-lg shadow-lg transform hover:scale-105 disabled:transform-none"
            >
              {isAIThinking ? '⏳' : '🚀'}
            </button>
          </div>
        </div>

        {/* Enhanced Dice Roller Modal */}
        {showDiceRoller && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-lg rounded-2xl p-8 border border-purple-400/30 shadow-2xl max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-6 text-white text-center">🎲 Dice Roller</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[4, 6, 8, 10, 12, 20].map(sides => (
                  <button
                    key={sides}
                    onClick={() => rollDice(sides)}
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white font-bold text-lg transform hover:scale-105 border border-white/20 hover:border-white/40"
                  >
                    d{sides}
                  </button>
                ))}
              </div>
              {diceResult && (
                <div className="text-center mb-6 p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">🎯 {diceResult}</div>
                  <div className="text-yellow-200">Great roll!</div>
                </div>
              )}
              <button
                onClick={() => setShowDiceRoller(false)}
                className="w-full px-6 py-3 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
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
                    onClick={() => {
                      setCurrentScreen('character-select');
                      navigate('/characters');
                    }}
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

  // Character screens are now handled in the main layout below
  // Debug logging for character selection
  if (currentScreen === 'character-select') {
    console.log('Character selection screen - userCharacters:', userCharacters);
    console.log('Character selection screen - userCharacters length:', userCharacters.length);
    userCharacters.forEach((char, index) => {
      console.log(`Character ${index}: ID=${char.id}, Name=${char.name}, Class=${char.class}`);
    });
  }

  // Main App Layout (for all other screens)
  return (
    <div className="h-full overflow-hidden">
      {/* Error Boundary */}
      <ErrorBoundary>
        {/* Toast Notifications */}
        <ToastNotifications 
          messages={toastMessages} 
          onDismiss={dismissToast} 
        />
        {/* Welcome Overlay */}
        <Suspense fallback={<LoadingSpinner />}>
          <WelcomeOverlay 
            isOpen={showWelcomeOverlay} 
            onClose={() => setShowWelcomeOverlay(false)}
            onSkip={() => {
              setShowWelcomeOverlay(false);
              addToast('ftueSkipped');
            }}
            onStart={handleTutorialStart}
          />
        </Suspense>
        {/* Main Content Area */}
        <div className="h-full overflow-hidden">
          <main className="h-full overflow-hidden">
            <div className="h-full">
              <div className="h-full overflow-hidden">
                {renderFullWidthContent()}
              </div>
            </div>
          </main>
        </div>
        {/* Right Drawer - only for non-DM Center screens */}
        {currentScreen !== 'dm-center' && (
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
        )}
      </ErrorBoundary>
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
      {/* Simple Help Overlay */}
      <Suspense fallback={<LoadingSpinner />}>
        <SimpleHelp 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
        />
      </Suspense>
      {/* Help System */}
      <Suspense fallback={<LoadingSpinner />}>
        <HelpSystem 
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          currentScreen={helpScreen}
          onAction={handleHelpAction}
        />
      </Suspense>
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
  const [isMultiplayer, setIsMultiplayer] = useState(true); // Restore multiplayer default for production functionality
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
        case 'status': {
          const getStatusPriority = (campaign: any) => {
            if (!campaign.started) return 3;
            if (campaign.status === 'active') return 1;
            if (campaign.status === 'paused') return 2;
            return 4;
          };
          return getStatusPriority(a) - getStatusPriority(b);
        }
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
    if (campaign.status === 'active' || (!campaign.status && campaign.started)) return '▶️'; // Active (including legacy campaigns without status)
    if (campaign.status === 'paused') return '⏸️'; // Paused
    return '⏸️'; // Default
  };

  const getCampaignStatusText = (campaign: any) => {
    if (!campaign.started) return 'Not Started';
    if (campaign.status === 'active' || (!campaign.status && campaign.started)) return 'In Progress'; // Include legacy campaigns
    if (campaign.status === 'paused') return 'Paused';
    return 'Unknown';
  };

  const getCampaignStatusColor = (campaign: any) => {
    if (!campaign.started) return 'text-gray-400';
    if (campaign.status === 'active' || (!campaign.status && campaign.started)) return 'text-green-400'; // Include legacy campaigns
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

        <div className="w-full max-w-lg mx-auto">
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
                  {/* Resume/Continue Button for all started campaigns */}
                  {campaign.started && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeCampaign(campaign.id);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium flex items-center space-x-1"
                      title={campaign.status === 'paused' ? "Resume Campaign" : "Continue Campaign"}
                    >
                      <span>▶</span>
                      <span>{campaign.status === 'paused' ? 'Resume' : 'Continue'}</span>
                    </button>
                  )}
                  
                  {/* Start Button for unstarted campaigns */}
                  {!campaign.started && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeCampaign(campaign.id);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium flex items-center space-x-1"
                      title="Start Campaign"
                    >
                      <span>🚀</span>
                      <span>Start</span>
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
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
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

const WaitingRoom: React.FC<{ campaign: any, onStart: (campaign: any) => void, onBack: () => void }> = ({ campaign, onStart, onBack }) => {
  const [playersReady, setPlayersReady] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(1);

  useEffect(() => {
    if (campaign?.players) {
      const ready = campaign.players.filter((p: any) => p.status === 'ready').length;
      setPlayersReady(ready);
      setTotalPlayers(campaign.players.length);
    }
  }, [campaign]);

  const handleStart = () => {
    console.log('WaitingRoom: Starting campaign with:', campaign);
    onStart(campaign);
  };

  const isHost = campaign?.players?.[0]?.isHost || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">Campaign Lobby</h2>
          <div className="bg-white/10 rounded-lg p-4 inline-block">
            <p className="text-lg mb-2">Campaign Code:</p>
            <div className="font-mono text-3xl bg-white/20 px-6 py-3 rounded-lg border border-white/30">
              {campaign?.code || 'LOADING'}
            </div>
            <p className="text-blue-200 text-sm mt-2">Share this code with other players</p>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Campaign Details</h3>
            <div className="space-y-2">
              <p><span className="text-blue-200">Theme:</span> {campaign?.theme || 'Unknown'}</p>
              <p><span className="text-blue-200">Max Players:</span> {campaign?.maxPlayers || 6}</p>
              <p><span className="text-blue-200">Type:</span> {campaign?.isMultiplayer ? 'Multiplayer' : 'Solo'}</p>
              {campaign?.customPrompt && (
                <p><span className="text-blue-200">Custom Story:</span> {campaign.customPrompt}</p>
              )}
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Players ({totalPlayers}/{campaign?.maxPlayers || 6})</h3>
            <div className="space-y-3">
              {campaign?.players?.map((player: any, index: number) => (
                <div key={player.id || index} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${player.status === 'ready' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{player.character?.name || player.name}</p>
                    <p className="text-sm text-blue-200">{player.character?.class || 'Unknown Class'} {player.isHost ? '(Host)' : ''}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    player.status === 'ready' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {player.status === 'ready' ? 'Ready' : 'Not Ready'}
                  </div>
                </div>
              )) || (
                <div className="text-center text-blue-200 py-4">
                  <p>Loading players...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solo Start Feature */}
        <div className="bg-gradient-to-r from-orange-600/20 to-yellow-600/20 rounded-lg p-6 border border-orange-400/30 mb-6">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">🎯</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-orange-200 mb-2">Turn-Based Multiplayer</h3>
              <p className="text-orange-100 mb-3">
                You can start this multiplayer campaign solo! Other players can join during the game when it&apos;s their turn. 
                Perfect for turn-based gameplay where friends hop in and out as needed.
              </p>
              <div className="flex items-center space-x-2 text-sm text-orange-200">
                <span>✨</span>
                <span>Players can join mid-game using the campaign code</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {isHost && (
            <button
              onClick={handleStart}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              🚀 Start Adventure
              {totalPlayers === 1 ? ' Solo' : ` (${playersReady}/${totalPlayers} Ready)`}
            </button>
          )}
          
          {!isHost && (
            <div className="flex-1 px-8 py-4 bg-blue-600/50 text-white rounded-xl font-bold text-lg text-center">
              Waiting for host to start...
            </div>
          )}

          <button
            onClick={onBack}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg transition-all"
          >
            ← Back to Lobby
          </button>
        </div>

        {/* Helpful Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="font-semibold mb-2">💡 For Hosts</h4>
            <p className="text-sm text-blue-200">
              You can start the campaign anytime! Other players can join later using the campaign code, 
              making it perfect for flexible scheduling.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="font-semibold mb-2">🎮 For Players</h4>
            <p className="text-sm text-blue-200">
              Even if the campaign has started, you can still join! Just use the campaign code and 
              jump in when it&apos;s your turn or during a break in the action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AppWrapper() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Handler for opening authentication (login/signup)
  const handleOpenAuth = async () => {
    try {
      await firebaseService.signInWithGoogle();
      console.log('Sign in successful');
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  if (!authChecked) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LandingPage onOpenAuth={handleOpenAuth} />;
  }

  // If authenticated, render the full app with Dashboard integration
  return (
    <Router>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only absolute top-2 left-2 bg-blue-700 text-white px-4 py-2 rounded z-50">Skip to main content</a>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardWrapper user={user} />} />
          <Route path="/game/*" element={<GameWrapper user={user} />} />
          <Route path="/characters" element={<CharacterWrapper user={user} />} />
          <Route path="/characters/create" element={<CharacterCreationWrapper user={user} />} />
          <Route path="/campaigns" element={<CampaignWrapper user={user} />} />
          <Route path="/campaigns/:id" element={<CampaignGameWrapper user={user} />} />
          <Route path="/campaigns/:id/waiting" element={<WaitingRoomWrapper user={user} />} />
          <Route path="/party" element={<PartyWrapper user={user} />} />
          <Route path="/world" element={<WorldWrapper user={user} />} />
          <Route path="/combat" element={<CombatWrapper user={user} />} />
          <Route path="/magic" element={<MagicWrapper user={user} />} />
          <Route path="/dm-center" element={<DMCenterWrapper user={user} />} />
          <Route path="/profile" element={<ProfileWrapper user={user} />} />
          <Route path="/achievements" element={<AchievementsWrapper user={user} />} />
          <Route path="/settings" element={<SettingsWrapper user={user} />} />
          <Route path="/help" element={<HelpWrapper user={user} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

// Dashboard Wrapper Component
const DashboardWrapper: React.FC<{ user: any }> = ({ user }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCampaigns(userCampaigns || []);
        setCharacters(userCharacters || []);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, [user.uid]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns');
  };

  const handleCreateCharacter = () => {
    navigate('/characters/create');
  };

  const handleJoinCampaign = () => {
    navigate('/campaigns');
  };

  const handleResumeCampaign = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleOpenDiceRoller = () => {
    setIsDiceRollerOpen(true);
  };

  const handleOpenProfile = () => {
    navigate('/profile');
  };

  const handleOpenSettings = () => {
    navigate('/settings');
  };

  const handleOpenAchievements = () => {
    navigate('/achievements');
  };

  const handleOpenHelp = () => {
    navigate('/help');
  };

  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <Dashboard
          user={user}
          campaigns={campaigns}
          characters={characters}
          onNavigate={handleNavigate}
          onCreateCampaign={handleCreateCampaign}
          onCreateCharacter={handleCreateCharacter}
          onJoinCampaign={handleJoinCampaign}
          onResumeCampaign={handleResumeCampaign}
          onOpenDiceRoller={handleOpenDiceRoller}
          onOpenProfile={handleOpenProfile}
          onOpenSettings={handleOpenSettings}
          onOpenAchievements={handleOpenAchievements}
          onOpenHelp={handleOpenHelp}
        />
      </div>
      {isDiceRollerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Dice Roller</h2>
              <button
                onClick={() => setIsDiceRollerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <DiceRoller3D />
          </div>
        </div>
      )}
    </div>
  );
};

// Game Wrapper Component (for the main game interface)
const GameWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster />
      </div>
    </div>
  );
};

// Character Wrapper Component
const CharacterWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <CharactersPage user={user} />
      </div>
    </div>
  );
};

// Character Creation Wrapper Component
const CharacterCreationWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="character" />
      </div>
    </div>
  );
};

// Campaign Wrapper Component
const CampaignWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="lobby" />
      </div>
    </div>
  );
};

// Campaign Game Wrapper Component
const CampaignGameWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="game" />
      </div>
    </div>
  );
};

// Waiting Room Wrapper Component
const WaitingRoomWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="waiting" />
      </div>
    </div>
  );
};

// Party Wrapper Component
const PartyWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <PartyPage user={user} />
      </div>
    </div>
  );
};

// World Wrapper Component
const WorldWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="world" />
      </div>
    </div>
  );
};

// Combat Wrapper Component
const CombatWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="combat" />
      </div>
    </div>
  );
};

// Magic Wrapper Component
const MagicWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="magic" />
      </div>
    </div>
  );
};

// DM Center Wrapper Component
const DMCenterWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AIDungeonMaster initialScreen="dm-center" />
      </div>
    </div>
  );
};

// Profile Wrapper Component
const ProfileWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <ProfilePage user={user} />
      </div>
    </div>
  );
};

// Achievements Wrapper Component
const AchievementsWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <AchievementsPage user={user} />
      </div>
    </div>
  );
};

// Settings Wrapper Component
const SettingsWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <SettingsPage user={user} />
      </div>
    </div>
  );
};

// Help Wrapper Component
const HelpWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-hidden">
        <HelpPage user={user} />
      </div>
    </div>
  );
};

// Page Components for each navigation item
const CharactersPage: React.FC<{ user: any }> = ({ user }) => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters || []);
      } catch (error) {
        console.error('Error loading characters:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCharacters();
  }, [user.uid]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-200">Loading characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Characters</h1>
          <p className="text-blue-200">Manage your heroes and companions</p>
        </div>
        
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Characters Yet</h3>
            <p className="text-blue-200 mb-6">Create your first character to begin your adventure</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Create Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div key={character.id} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{character.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{character.name}</h3>
                    <p className="text-blue-200 text-sm">{character.class}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Level</span>
                    <span className="text-white">{character.level || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">XP</span>
                    <span className="text-white">{character.xp || 0}</span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                    Play
                  </button>
                  <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PartyPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Party</h1>
          <p className="text-blue-200">Team up with friends and coordinate adventures</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Active Party</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-blue-200">No active party</p>
              <p className="text-slate-400 text-sm">Join or create a party to start playing together</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Party Invitations</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-blue-200">No pending invitations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorldPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">World</h1>
          <p className="text-blue-200">Explore the realm and discover its secrets</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">World Map</h3>
            <div className="aspect-video bg-slate-700/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-blue-200">Interactive world map coming soon</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Current Location</h3>
              <p className="text-blue-200">Not in any location</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Discovered Areas</h3>
              <p className="text-slate-400 text-sm">No areas discovered yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CombatPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Combat</h1>
          <p className="text-blue-200">Battle system & tactical combat tools</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Combat Simulator</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sword className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-blue-200">Practice combat scenarios</p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
                Start Combat
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Combat History</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-blue-200">No combat history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MagicPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Magic</h1>
          <p className="text-blue-200">Spells, abilities, and magical resources</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Spell Library</h3>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Swords className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-blue-200">Browse and learn spells</p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
                Explore Spells
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Known Spells</h3>
              <p className="text-slate-400 text-sm">No spells learned yet</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Spell Slots</h3>
              <p className="text-slate-400 text-sm">No spell slots available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DMCenterPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DM Center</h1>
          <p className="text-blue-200">Dungeon Master tools and resources</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Campaign Builder</h3>
            <p className="text-blue-200 mb-4">Create and manage campaigns</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
              Create Campaign
            </button>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">NPC Generator</h3>
            <p className="text-blue-200 mb-4">Generate NPCs and characters</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
              Generate NPC
            </button>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Initiative Tracker</h3>
            <p className="text-blue-200 mb-4">Track combat initiative</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
              Start Tracker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-blue-200">Your account settings and preferences</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-full" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.displayName || 'Adventurer'}</h2>
              <p className="text-blue-200">{user?.email}</p>
              <p className="text-slate-400 text-sm">Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white">Edit Profile</span>
                </button>
                <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white">Change Password</span>
                </button>
                <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white">Privacy Settings</span>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Game Statistics</h3>
              <div className="space-y-3">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 text-sm">Campaigns Played</span>
                  <p className="text-white font-semibold">0</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 text-sm">Characters Created</span>
                  <p className="text-white font-semibold">0</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 text-sm">Total Play Time</span>
                  <p className="text-white font-semibold">0 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AchievementsPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-blue-200">Track your progress and accomplishments</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">First Steps</h3>
              <p className="text-blue-200 text-sm mb-4">Create your first character</p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-slate-400 text-xs mt-2">0% Complete</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Storyteller</h3>
              <p className="text-blue-200 text-sm mb-4">Complete your first campaign</p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-slate-400 text-xs mt-2">0% Complete</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sword className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Warrior</h3>
              <p className="text-blue-200 text-sm mb-4">Win your first combat</p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-slate-400 text-xs mt-2">0% Complete</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-blue-200">App preferences and configuration</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Game Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Sound Effects</span>
                <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Music</span>
                <button className="w-12 h-6 bg-slate-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Notifications</span>
                <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Display Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Theme</span>
                <select className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600">
                  <option>Dark</option>
                  <option>Light</option>
                  <option>Auto</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Font Size</span>
                <select className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600">
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HelpPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
          <p className="text-blue-200">Support & documentation</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Quick Start Guide</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Character Creation</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">First Campaign</span>
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">FAQ</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Contact Support</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Bug Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};