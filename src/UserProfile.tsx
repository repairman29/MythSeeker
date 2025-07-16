import React, { useEffect, useState } from 'react';
import { firebaseService } from './firebaseService';
import { Award, Clock, Users, Trophy, TrendingUp, Star, Calendar, Target, Zap, Heart, Shield, Sword } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: Date;
  category: 'combat' | 'exploration' | 'social' | 'mastery';
}

interface PlayerStats {
  totalPlayTime: number;
  campaignsHosted: number;
  campaignsJoined: number;
  charactersCreated: number;
  totalXP: number;
  combatWins: number;
  questsCompleted: number;
  npcsInteracted: number;
  locationsDiscovered: number;
  achievementsUnlocked: number;
  lastActive: Date;
  joinDate: Date;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'stats' | 'characters'>('overview');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        try {
          const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          
          // Load achievements and stats
          await loadPlayerData(firebaseUser.uid);
        } catch (error) {
          console.warn('Error loading user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const loadPlayerData = async (uid: string) => {
    try {
      // Load achievements
      const userAchievements = await firebaseService.getUserAchievements(uid);
      setAchievements(userAchievements);
      
      // Load player stats
      const stats = await firebaseService.getPlayerStats(uid);
      setPlayerStats(stats);
    } catch (error) {
      console.warn('Error loading player data:', error);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await firebaseService.signInWithGoogle();
    } catch (e) {
      alert('Login failed: ' + e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await firebaseService.signOut();
    } catch (e) {
      alert('Logout failed: ' + e);
    }
    setLoading(false);
  };

  const getPlayerLevel = (totalXP: number) => {
    return Math.floor(totalXP / 1000) + 1;
  };

  const getPlayerRank = (level: number) => {
    if (level >= 20) return { name: 'Legendary Master', color: 'text-purple-400', icon: '👑' };
    if (level >= 15) return { name: 'Epic Hero', color: 'text-red-400', icon: '⚔️' };
    if (level >= 10) return { name: 'Veteran Adventurer', color: 'text-orange-400', icon: '🛡️' };
    if (level >= 5) return { name: 'Skilled Warrior', color: 'text-yellow-400', icon: '⚡' };
    return { name: 'Novice Explorer', color: 'text-green-400', icon: '🌱' };
  };

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h ${mins}m`;
    }
    return `${hours}h ${mins}m`;
  };

  if (loading) return <div className="text-blue-200">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const playerLevel = getPlayerLevel(playerStats?.totalXP || 0);
  const playerRank = getPlayerRank(playerLevel);

  return (
    <div className="flex flex-col h-full">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 mb-4 border border-white/20">
        <div className="flex items-center space-x-4">
          <img src={user.photoURL} alt="avatar" className="w-16 h-16 rounded-full border-2 border-blue-400" />
          <div className="flex-1">
            <div className="text-white font-bold text-lg">{user.displayName}</div>
            <div className="text-blue-200 text-sm">{user.email}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl">{playerRank.icon}</span>
              <span className={`font-semibold ${playerRank.color}`}>{playerRank.name}</span>
              <span className="text-gray-300">• Level {playerLevel}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-4">
        {[
          { key: 'overview', label: 'Overview', icon: <Star size={16} /> },
          { key: 'achievements', label: 'Achievements', icon: <Award size={16} /> },
          { key: 'stats', label: 'Statistics', icon: <TrendingUp size={16} /> },
          { key: 'characters', label: 'Characters', icon: <Users size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-bold">{formatPlayTime(playerStats?.totalPlayTime || 0)}</div>
                <div className="text-blue-200 text-sm">Play Time</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-white font-bold">{playerStats?.achievementsUnlocked || 0}</div>
                <div className="text-blue-200 text-sm">Achievements</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-white font-bold">{playerStats?.campaignsJoined || 0}</div>
                <div className="text-blue-200 text-sm">Campaigns</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                <Target className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-white font-bold">{playerStats?.questsCompleted || 0}</div>
                <div className="text-blue-200 text-sm">Quests</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-3 text-blue-200">
                  <Calendar size={16} />
                  <span>Joined MythSeeker {playerStats?.joinDate ? new Date(playerStats.joinDate).toLocaleDateString() : 'recently'}</span>
                </div>
                <div className="flex items-center space-x-3 text-blue-200">
                  <Clock size={16} />
                  <span>Last active {playerStats?.lastActive ? new Date(playerStats.lastActive).toLocaleDateString() : 'recently'}</span>
                </div>
              </div>
            </div>

            {/* Progress to Next Level */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">Level Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Level {playerLevel}</span>
                  <span className="text-blue-200">Level {playerLevel + 1}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${((playerStats?.totalXP || 0) % 1000) / 10}%` }}
                  ></div>
                </div>
                <div className="text-center text-sm text-blue-200">
                  {playerStats?.totalXP || 0} / {(playerLevel + 1) * 1000} XP
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{achievement.name}</h4>
                      <p className="text-gray-300 text-sm mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-yellow-400">+{achievement.points} points</span>
                        <span className="text-xs text-gray-400">
                          {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Unlocked'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {achievements.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Award size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No achievements unlocked yet</p>
                  <p className="text-gray-500 text-sm mt-2">Complete quests and challenges to earn achievements!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Combat Stats */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Sword size={20} className="text-red-400" />
                <span>Combat Statistics</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{playerStats?.combatWins || 0}</div>
                  <div className="text-blue-200 text-sm">Combat Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{playerStats?.totalXP || 0}</div>
                  <div className="text-blue-200 text-sm">Total XP</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{playerStats?.charactersCreated || 0}</div>
                  <div className="text-blue-200 text-sm">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{playerStats?.campaignsHosted || 0}</div>
                  <div className="text-blue-200 text-sm">Campaigns Hosted</div>
                </div>
              </div>
            </div>

            {/* Exploration Stats */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Target size={20} className="text-green-400" />
                <span>Exploration Statistics</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{playerStats?.questsCompleted || 0}</div>
                  <div className="text-blue-200 text-sm">Quests Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{playerStats?.locationsDiscovered || 0}</div>
                  <div className="text-blue-200 text-sm">Locations Found</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{playerStats?.npcsInteracted || 0}</div>
                  <div className="text-blue-200 text-sm">NPCs Met</div>
                </div>
              </div>
            </div>

            {/* Time Statistics */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Clock size={20} className="text-blue-400" />
                <span>Time Statistics</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-200">Total Play Time:</span>
                  <span className="text-white">{formatPlayTime(playerStats?.totalPlayTime || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Average Session:</span>
                  <span className="text-white">{playerStats?.campaignsJoined ? formatPlayTime(Math.floor((playerStats.totalPlayTime || 0) / playerStats.campaignsJoined)) : '0m'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Member Since:</span>
                  <span className="text-white">{playerStats?.joinDate ? new Date(playerStats.joinDate).toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">Character Gallery</h3>
              <p className="text-blue-200 text-sm mb-4">
                Your created characters and their achievements will appear here.
              </p>
              <div className="text-center py-8">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Character management coming soon!</p>
                <p className="text-gray-500 text-sm mt-2">Create characters to see them here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 