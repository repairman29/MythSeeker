import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebaseService';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import { UnifiedGameExperience } from './components/UnifiedGameExperience';

// Import all wrapper components
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
  HelpWrapper,
  ProgressionWrapperComponent
} from './wrappers';

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

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🎮 Auth state changed:', firebaseUser ? 'Signed in' : 'Signed out');
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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

  return (
    <Router>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only absolute top-2 left-2 bg-blue-700 text-white px-4 py-2 rounded z-50">
        Skip to main content
      </a>
      
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <div id="main-content">
            <Routes>
              {/* Default route */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Core application routes */}
              <Route path="/dashboard" element={<DashboardWrapper user={user} />} />
              <Route path="/play" element={<UnifiedGameExperience user={user} />} />
              <Route path="/game/*" element={<GameWrapper user={user} />} />
              
              {/* Character management */}
              <Route path="/characters" element={<CharacterWrapper user={user} />} />
              <Route path="/characters/create" element={<CharacterCreationWrapper user={user} />} />
              <Route path="/progression" element={<ProgressionWrapperComponent user={user} />} />
              
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
              
              {/* DM and admin */}
              <Route path="/dm-center" element={<DMCenterWrapper user={user} />} />
              
              {/* User management */}
              <Route path="/profile" element={<ProfileWrapper user={user} />} />
              <Route path="/achievements" element={<AchievementsWrapper user={user} />} />
              <Route path="/settings" element={<SettingsWrapper user={user} />} />
              <Route path="/help" element={<HelpWrapper user={user} />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
} 