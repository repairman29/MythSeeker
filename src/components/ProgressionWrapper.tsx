import React from 'react';
import Navigation from './Navigation';
import { TrendingUp, Zap, Star, User, ArrowLeft } from 'lucide-react';

interface ProgressionWrapperProps {
  user: any;
}

const ProgressionWrapper: React.FC<ProgressionWrapperProps> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button 
                onClick={() => window.history.back()}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h1 className="text-3xl font-bold text-white mb-2">Character Progression</h1>
              <p className="text-blue-200">Sprint 2 - Character advancement system</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-4">Character Progression System</h3>
                <p className="text-blue-200 mb-8 text-lg">
                  Experience tracking, skill trees, feat selection, and D&D 5e compatible progression system!
                </p>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
                    <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-2">Experience System</h4>
                    <p className="text-sm text-blue-200">Multiple XP sources with automatic level detection</p>
                  </div>
                  <div className="bg-amber-600/20 rounded-lg p-4 border border-amber-500/30">
                    <Zap className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-2">Skill Trees</h4>
                    <p className="text-sm text-blue-200">Interactive progression paths with visual connections</p>
                  </div>
                  <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
                    <Star className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white mb-2">Feat Selection</h4>
                    <p className="text-sm text-blue-200">D&D 5e compatible feats with prerequisites</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <a 
                    href="/characters" 
                    className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Manage Characters</span>
                  </a>
                  <p className="text-sm text-blue-300">
                    Full progression demo available in the characters section!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressionWrapper; 