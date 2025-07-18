import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, firebaseService } from './firebaseService';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import { UnifiedGameExperience } from './components/UnifiedGameExperience';

// Import wrapper components for clean routing
import { 
  DashboardWrapper,
  GameWrapper,
  CharacterWrapper,
  CharacterCreationWrapper,
  CampaignWrapper,
  CampaignGameWrapper,
  WaitingRoomWrapper,
  AutomatedGamesWrapper,
  PartyWrapper,
  WorldWrapper,
  CombatWrapper,
  MagicWrapper,
  DMCenterWrapper,
  ProfileWrapper,
  AchievementsWrapper,
  SettingsWrapper,
  HelpWrapper
} from './wrappers';

// Import ProgressionWrapper from components
import ProgressionWrapper from './components/ProgressionWrapper';

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

// Simple Character Creation Component (placeholder until we restore the full one)
const CharacterCreation = ({ user }: { user: any }) => (
  <div className="max-w-4xl mx-auto p-8">
    <h1 className="text-4xl font-bold text-white mb-8">Character Creation</h1>
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <p className="text-slate-300 mb-4">Character creation system coming soon!</p>
      <p className="text-sm text-slate-400">
        This will include full D&D 5e character creation with races, classes, backgrounds, and more.
      </p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    console.log('🎮 App: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🎮 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Handler for opening authentication (login/signup)
  const handleOpenAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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

  // If authenticated, render the full app with clean routing
  return (
    <ErrorBoundary>
      <Router>
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only absolute top-2 left-2 bg-blue-700 text-white px-4 py-2 rounded z-50">Skip to main content</a>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Core routes */}
              <Route path="/dashboard" element={<DashboardWrapper user={user} />} />
              <Route path="/play" element={<UnifiedGameExperience user={user} />} />
              <Route path="/game/*" element={<GameWrapper user={user} />} />
              
              {/* Character management */}
              <Route path="/characters" element={<CharacterWrapper user={user} />} />
              <Route path="/characters/create" element={<CharacterCreationWrapper user={user} />} />
              <Route path="/progression" element={<ProgressionWrapper user={user} />} />
              
              {/* Campaign management */}
              <Route path="/campaigns" element={<CampaignWrapper user={user} />} />
              <Route path="/campaigns/:id" element={<CampaignGameWrapper user={user} />} />
              <Route path="/campaigns/:id/waiting" element={<WaitingRoomWrapper user={user} />} />
              
              {/* Game modes */}
              <Route path="/automated-games" element={<AutomatedGamesWrapper user={user} />} />
              <Route path="/party" element={<PartyWrapper user={user} />} />
              <Route path="/world" element={<WorldWrapper user={user} />} />
              <Route path="/combat" element={<CombatWrapper user={user} />} />
              <Route path="/magic" element={<MagicWrapper user={user} />} />
              
              {/* Admin and tools */}
              <Route path="/dm-center" element={<DMCenterWrapper user={user} />} />
              
              {/* User management */}
              <Route path="/profile" element={<ProfileWrapper user={user} />} />
              <Route path="/achievements" element={<AchievementsWrapper user={user} />} />
              <Route path="/settings" element={<SettingsWrapper user={user} />} />
              <Route path="/help" element={<HelpWrapper user={user} />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
} 