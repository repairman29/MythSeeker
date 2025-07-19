import React, { useState, useEffect } from 'react';
import { User, Book, Sword, TrendingUp, Trophy, Users } from 'lucide-react';
import { firebaseService } from '../firebaseService';

interface AchievementsPageProps {
  user: any;
}

const AchievementsPage: React.FC<AchievementsPageProps> = ({ user }) => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [gameStats, setGameStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAchievementData = async () => {
      try {
        // Load user's characters
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters || []);
        
        // Load user's campaigns
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        setCampaigns(userCampaigns || []);
        
        // Load game stats from localStorage
        const stats = JSON.parse(localStorage.getItem('mythseeker_game_stats') || '{}');
        setGameStats(stats);
        
        // Load achievements from localStorage
        const userAchievements = JSON.parse(localStorage.getItem('mythseeker_achievements') || '[]');
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error loading achievement data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAchievementData();
  }, [user.uid]);

  const getAchievementProgress = (achievementId: string) => {
    switch (achievementId) {
      case 'first_character':
        return characters.length > 0 ? 100 : 0;
      case 'first_campaign':
        return campaigns.length > 0 ? 100 : 0;
      case 'first_combat_win':
        return gameStats.combatsWon > 0 ? 100 : 0;
      case 'character_level_5':
        return characters.some(c => c.level >= 5) ? 100 : 0;
      case 'complete_campaign':
        return campaigns.some(c => c.status === 'completed') ? 100 : 0;
      case 'multiplayer_party':
        return campaigns.some(c => c.isMultiplayer && c.players?.length > 1) ? 100 : 0;
      default:
        return 0;
    }
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return achievements.some(a => a.id === achievementId);
  };

  const achievementList = [
    {
      id: 'first_character',
      title: 'First Steps',
      description: 'Create your first character',
      icon: <User className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'first_campaign',
      title: 'Adventure Begins',
      description: 'Start your first campaign',
      icon: <Book className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'first_combat_win',
      title: 'Warrior',
      description: 'Win your first combat',
      icon: <Sword className="w-8 h-8" />,
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'character_level_5',
      title: 'Experienced Hero',
      description: 'Reach level 5 with any character',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 'complete_campaign',
      title: 'Storyteller',
      description: 'Complete a campaign',
      icon: <Trophy className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'multiplayer_party',
      title: 'Party Leader',
      description: 'Play in a multiplayer campaign',
      icon: <Users className="w-8 h-8" />,
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-200">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-blue-200">Track your progress and accomplishments</p>
        </div>

        {/* Achievement Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <div className="text-2xl font-bold text-white">{achievements.length}</div>
            <div className="text-blue-200 text-sm">Achievements Unlocked</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <div className="text-2xl font-bold text-white">{characters.length}</div>
            <div className="text-blue-200 text-sm">Characters Created</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <div className="text-2xl font-bold text-white">{campaigns.length}</div>
            <div className="text-blue-200 text-sm">Campaigns Started</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 text-center">
            <div className="text-2xl font-bold text-white">{gameStats.combatsWon || 0}</div>
            <div className="text-blue-200 text-sm">Combats Won</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementList.map((achievement) => {
            const progress = getAchievementProgress(achievement.id);
            const unlocked = isAchievementUnlocked(achievement.id);
            
            return (
              <div 
                key={achievement.id} 
                className={`bg-slate-800/50 rounded-lg p-6 border transition-all duration-300 ${
                  unlocked 
                    ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                    : 'border-slate-700/50'
                }`}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-4 ${
                    unlocked ? 'animate-pulse' : 'opacity-50'
                  }`}>
                    <div className="text-white">
                      {achievement.icon}
                    </div>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    unlocked ? 'text-white' : 'text-slate-400'
                  }`}>
                    {achievement.title}
                  </h3>
                  <p className="text-blue-200 text-sm mb-4">{achievement.description}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        unlocked ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-blue-600'
                      }`} 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs ${
                    unlocked ? 'text-yellow-400' : 'text-slate-400'
                  }`}>
                    {unlocked ? 'Unlocked!' : `${progress}% Complete`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{achievement.title}</p>
                      <p className="text-blue-200 text-sm">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage; 