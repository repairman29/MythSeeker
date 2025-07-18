import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseService, Character, UserProfile as UserProfileType } from './firebaseService';
import { CampaignService } from './services/campaignService';
import { UniversalGameInterface } from './components/UniversalGameInterface';
import { UnifiedGameExperience } from './components/UnifiedGameExperience';
import UserProfileComponent from './UserProfile';
import { aiService } from './services/aiService';
import { dynamicDMService } from './services/dynamicDMService';
import { MultiplayerGame, Player, multiplayerService } from './services/multiplayerService';
import { npcService } from './services/npcService';
import Tooltip from './components/Tooltip';
import ErrorBoundary from './components/ErrorBoundary';
import ToastNotifications from './components/ToastNotifications';
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
import { Swords, TrendingUp, Globe, HelpCircle, User, Book, Users, Sword, Plus, Edit, Trash2, Copy, ChevronDown, Send, ChevronRight, Home, Trophy, ArrowLeft, Zap, Eye, Shield, RefreshCw, Search, Heart, Skull, CheckCircle, XCircle } from 'lucide-react';
import SuccessFeedback from './components/SuccessFeedback';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import DiceRoller3D from './components/DiceRoller3D';
import Navigation from './components/Navigation';
import CharacterSheet from './components/CharacterSheet';
import CampaignCreator from './components/CampaignCreator';
import WorldMap from './components/WorldMap';
import MagicSystem from './components/MagicSystem';
import EnhancedCombatSystem from './components/EnhancedCombatSystem';
import { AutomatedGameWrapper } from './components/AutomatedGameWrapper';
import { GameInterface } from './components/GameInterface';
import ProgressionWrapper from './components/ProgressionWrapper';

// Lazy load components for better performance
const CharacterCreation = lazy(() => import('./components/CharacterCreation'));
const CampaignLog = lazy(() => import('./components/CampaignLog'));
const QuestSystem = lazy(() => import('./components/QuestSystem'));
const Inventory = lazy(() => import('./components/Inventory'));
const NPCInteraction = lazy(() => import('./components/NPCInteraction'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
      </div>
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-lg">Loading MythSeeker</h3>
        <p className="text-blue-200 text-sm">Preparing your adventure...</p>
      </div>
    </div>
  </div>
);

// Dashboard Wrapper Component
const DashboardComponent = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        const userAchievements = await firebaseService.getUserAchievements(user.uid);
        
        setCampaigns(userCampaigns);
        setCharacters(userCharacters);
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
      <Navigation user={user} />
      <div className="pt-16">
        <Dashboard 
          user={user}
          campaigns={campaigns}
          characters={characters}
          achievements={achievements}
          onNavigate={navigate}
        />
      </div>
      {isDiceRollerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <DiceRoller3D onClose={() => setIsDiceRollerOpen(false)} />
          </div>
        </div>
      )}
      <button
        onClick={() => setIsDiceRollerOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
      >
        🎲
      </button>
    </div>
  );
};

// Character Management Component
const CharacterManagementComponent = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const loadCharacters = async () => {
      if (user) {
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters);
      }
    };
    loadCharacters();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
      <Navigation user={user} />
      <div className="pt-16 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Characters</h1>
            <button
              onClick={() => navigate('/character-creation')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Character
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => setSelectedCharacter(character)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {character.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{character.name}</h3>
                    <p className="text-slate-400">{character.class} • Level {character.level}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">HP:</span>
                    <span className="text-white">{character.currentHP}/{character.maxHP}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">XP:</span>
                    <span className="text-white">{character.experience}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <CharacterSheet 
              character={selectedCharacter}
              onClose={() => setSelectedCharacter(null)}
              onUpdate={async (updatedCharacter) => {
                await firebaseService.updateCharacter(updatedCharacter);
                setCharacters(prev => prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c));
                setSelectedCharacter(updatedCharacter);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Game Interface Wrapper Component
const GameComponent = ({ user }: { user: any }) => {
  const location = useLocation();
  const { state } = location;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
      <UniversalGameInterface
        user={user}
        gameType={state?.gameType || 'campaign'}
        gameId={state?.gameId || state?.campaignId}
        characterId={state?.characterId}
        isMultiplayer={state?.isMultiplayer}
        campaignData={state?.campaignData}
      />
    </div>
  );
};

// Campaign Management Component
const CampaignManagementComponent = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (user) {
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        setCampaigns(userCampaigns);
      }
    };
    loadCampaigns();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
      <Navigation user={user} />
      <div className="pt-16 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Campaigns</h1>
            <button
              onClick={() => navigate('/campaign-creator')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <h3 className="text-xl font-semibold text-white mb-2">{campaign.name}</h3>
                <p className="text-slate-400 mb-4">{campaign.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Players:</span>
                    <span className="text-white">{campaign.players?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Session:</span>
                    <span className="text-white">{campaign.currentSession || 1}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/game', { 
                        state: { 
                          gameType: 'campaign', 
                          campaignId: campaign.id,
                          campaignData: campaign 
                        } 
                      });
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    Join Game
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/dm-center', { state: { campaignId: campaign.id } });
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    DM Mode
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// DM Center Component
const DMCenterComponent = ({ user }: { user: any }) => {
  const location = useLocation();
  const { state } = location;
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    const loadCampaign = async () => {
      if (state?.campaignId) {
        const campaignData = await firebaseService.getCampaign(state.campaignId);
        setCampaign(campaignData);
      }
    };
    loadCampaign();
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
      <Navigation user={user} />
      <div className="pt-16 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">DM Center</h1>
          {campaign && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-semibold text-white mb-4">{campaign.name}</h2>
              <p className="text-slate-300 mb-6">{campaign.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Players</h3>
                  <div className="space-y-2">
                    {campaign.players?.map((player: any) => (
                      <div key={player.id} className="text-slate-300">{player.name}</div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">NPCs</h3>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition-colors">
                    Manage NPCs
                  </button>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">World</h3>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm transition-colors">
                    World Builder
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
          setUser({ ...firebaseUser, profile: userProfile });
          trackSessionStart();
          trackDeviceInfo();
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setAuthChecked(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                user ? <Navigate to="/dashboard" replace /> : <LandingPage />
              } />
              
              {/* Protected Routes */}
              {user ? (
                <>
                  <Route path="/dashboard" element={<DashboardComponent user={user} />} />
                  <Route path="/characters" element={<CharacterManagementComponent user={user} />} />
                  <Route path="/character-creation" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16">
                        <CharacterCreation user={user} />
                      </div>
                    </div>
                  } />
                  <Route path="/campaigns" element={<CampaignManagementComponent user={user} />} />
                  <Route path="/campaign-creator" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16">
                        <CampaignCreator user={user} />
                      </div>
                    </div>
                  } />
                  <Route path="/game" element={<GameComponent user={user} />} />
                  <Route path="/automated-game" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <AutomatedGameWrapper user={user} />
                    </div>
                  } />
                  <Route path="/unified-game" element={<UnifiedGameExperience user={user} />} />
                  <Route path="/dm-center" element={<DMCenterComponent user={user} />} />
                  <Route path="/world" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16">
                        <WorldMap user={user} />
                      </div>
                    </div>
                  } />
                  <Route path="/magic" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16">
                        <MagicSystem user={user} />
                      </div>
                    </div>
                  } />
                  <Route path="/combat" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16">
                        <EnhancedCombatSystem user={user} />
                      </div>
                    </div>
                  } />
                  <Route path="/progression" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16">
                        <ProgressionWrapper user={user} />
                      </div>
                    </div>
                  } />
                  <Route path="/profile" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16">
                        <UserProfileComponent user={user} />
                      </div>
                    </div>
                  } />
                  <Route path="/achievements" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16 p-8">
                        <div className="max-w-6xl mx-auto">
                          <h1 className="text-4xl font-bold text-white mb-8">Achievements</h1>
                          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                            <p className="text-slate-300">Achievement system coming soon!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                  <Route path="/help" element={
                    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
                      <Navigation user={user} />
                      <div className="pt-16 p-8">
                        <div className="max-w-6xl mx-auto">
                          <h1 className="text-4xl font-bold text-white mb-8">Help & Support</h1>
                          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                            <p className="text-slate-300">Help system coming soon!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                </>
              ) : (
                <Route path="*" element={<Navigate to="/" replace />} />
              )}
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
            </Routes>
          </Suspense>
          
          <ToastNotifications />
          <SuccessFeedback />
        </div>
      </Router>
    </ErrorBoundary>
  );
} 