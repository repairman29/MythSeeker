import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseService';

// Minimal components
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

const LandingPage = ({ onOpenAuth }: { onOpenAuth: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center">
    <div className="text-center space-y-6">
      <h1 className="text-6xl font-bold text-white mb-4">MythSeeker</h1>
      <p className="text-xl text-blue-200 mb-8">Your AI-Powered D&D Adventure Platform</p>
      <button
        onClick={onOpenAuth}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
      >
        Sign In to Play
      </button>
    </div>
  </div>
);

const Dashboard = ({ user }: { user: any }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user.displayName || 'Player'}!</h1>
        <p className="text-blue-200">Your D&D adventures await</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-2">Quick Play</h3>
          <p className="text-slate-300 mb-4">Start an AI-powered adventure instantly</p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
            Start Adventure
          </button>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-2">Characters</h3>
          <p className="text-slate-300 mb-4">Create and manage your characters</p>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
            Manage Characters
          </button>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-2">Campaigns</h3>
          <p className="text-slate-300 mb-4">Join or create multiplayer campaigns</p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
            Browse Campaigns
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={() => auth.signOut()}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAuth = async () => {
    try {
      // Simple sign in - you can implement Google sign in here
      console.log('Sign in requested');
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
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
} 