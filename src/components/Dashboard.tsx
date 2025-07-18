import React, { useState, useEffect } from 'react';
import { 
  Book, 
  User, 
  Users, 
  Globe, 
  Sword, 
  Swords, 
  Trophy, 
  Settings, 
  Plus, 
  Play, 
  Clock, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Map, 
  Shield, 
  Zap, 
  Heart, 
  Crown,
  Gamepad2,
  Sparkles,
  Target,
  Compass,
  ScrollText,
  Calendar,
  Award,
  BarChart3,
  Palette,
  Music,
  Volume2,
  Bell,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface DashboardProps {
  user: any;
  campaigns: any[];
  characters: any[];
  onNavigate: (path: string) => void;
  onCreateCampaign: () => void;
  onCreateCharacter: () => void;
  onJoinCampaign: () => void;
  onResumeCampaign: (campaignId: string) => void;
  onOpenDiceRoller: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenHelp: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  gradient: string;
  badge?: string;
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  gradient: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  isNew?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  campaigns,
  characters,
  onNavigate,
  onCreateCampaign,
  onCreateCharacter,
  onJoinCampaign,
  onResumeCampaign,
  onOpenDiceRoller,
  onOpenProfile,
  onOpenSettings,
  onOpenAchievements,
  onOpenHelp
}) => {
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPlayTime: '0h 0m',
    campaignsCompleted: 0,
    charactersCreated: 0,
    diceRolls: 0,
    achievements: 0
  });

  useEffect(() => {
    // Filter active campaigns
    setActiveCampaigns(campaigns.filter(c => c.status === 'active' || c.status === 'waiting'));
    
    // Mock recent activity - in real app, this would come from analytics
    setRecentActivity([
      { type: 'campaign_joined', title: 'Joined "Lost Mines"', time: '2 hours ago', icon: <Book className="w-4 h-4" /> },
      { type: 'character_created', title: 'Created "Thorin Stonefist"', time: '1 day ago', icon: <User className="w-4 h-4" /> },
      { type: 'achievement', title: 'Unlocked "First Steps"', time: '2 days ago', icon: <Trophy className="w-4 h-4" /> },
      { type: 'dice_roll', title: 'Rolled 20 on d20!', time: '3 days ago', icon: <Target className="w-4 h-4" /> }
    ]);
  }, [campaigns]);

  const quickActions: QuickAction[] = [
    {
      id: 'resume',
      title: 'Resume Adventure',
      description: 'Continue your latest campaign',
      icon: <Play className="w-6 h-6" />,
      action: () => {
        if (activeCampaigns.length > 0) {
          onResumeCampaign(activeCampaigns[0].id);
        } else {
          onCreateCampaign();
        }
      },
      color: 'from-emerald-500 to-teal-600',
      gradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      badge: activeCampaigns.length > 0 ? `${activeCampaigns.length} Active` : undefined
    },
    {
      id: 'ai-games',
      title: 'AI Adventures',
      description: 'Start an AI-powered game',
      icon: <Gamepad2 className="w-6 h-6" />,
      action: () => onNavigate('/automated-games'),
      color: 'from-cyan-500 to-blue-600',
      gradient: 'bg-gradient-to-r from-cyan-500 to-blue-600'
    },
    {
      id: 'new-campaign',
      title: 'New Campaign',
      description: 'Start a fresh adventure',
      icon: <Plus className="w-6 h-6" />,
      action: onCreateCampaign,
      color: 'from-blue-500 to-indigo-600',
      gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    },
    {
      id: 'join-campaign',
      title: 'Join Campaign',
      description: 'Enter with a friend\'s code',
      icon: <Users className="w-6 h-6" />,
      action: onJoinCampaign,
      color: 'from-purple-500 to-pink-600',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600'
    }
  ];

  const featureCards: FeatureCard[] = [
    {
      id: 'campaigns',
      title: 'Campaigns',
      description: 'Manage your adventures',
      icon: <Book className="w-8 h-8" />,
      path: '/campaigns',
      color: 'from-blue-500 to-indigo-600',
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      stats: [
        { label: 'Active', value: activeCampaigns.length },
        { label: 'Total', value: campaigns.length }
      ]
    },
    {
      id: 'characters',
      title: 'Characters',
      description: 'Your heroes and companions',
      icon: <User className="w-8 h-8" />,
      path: '/characters',
      color: 'from-green-500 to-emerald-600',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      stats: [
        { label: 'Created', value: characters.length },
        { label: 'Active', value: characters.filter(c => c.isActive).length }
      ]
    },
    {
      id: 'party',
      title: 'Party',
      description: 'Team up with friends',
      icon: <Users className="w-8 h-8" />,
      path: '/party',
      color: 'from-purple-500 to-pink-600',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
      stats: [
        { label: 'Members', value: '3-6' },
        { label: 'Online', value: '2' }
      ]
    },
    {
      id: 'world',
      title: 'World',
      description: 'Explore the realm',
      icon: <Globe className="w-8 h-8" />,
      path: '/world',
      color: 'from-teal-500 to-cyan-600',
      gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      stats: [
        { label: 'Locations', value: '12' },
        { label: 'Discovered', value: '8' }
      ]
    },
    {
      id: 'combat',
      title: 'Combat',
      description: 'Battle system & tactics',
      icon: <Sword className="w-8 h-8" />,
      path: '/combat',
      color: 'from-red-500 to-pink-600',
      gradient: 'bg-gradient-to-br from-red-500 to-pink-600',
      stats: [
        { label: 'Encounters', value: '5' },
        { label: 'Victories', value: '4' }
      ]
    },
    {
      id: 'magic',
      title: 'Magic',
      description: 'Spells & abilities',
      icon: <Swords className="w-8 h-8" />,
      path: '/magic',
      color: 'from-indigo-500 to-purple-600',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      stats: [
        { label: 'Spells', value: '24' },
        { label: 'Prepared', value: '8' }
      ]
    },
    {
      id: 'automated-games',
      title: 'AI Games',
      description: 'AI-powered adventures',
      icon: <Gamepad2 className="w-8 h-8" />,
      path: '/automated-games',
      color: 'from-cyan-500 to-blue-600',
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      isNew: true,
      stats: [
        { label: 'Active', value: '2' },
        { label: 'Saved', value: '5' }
      ]
    },
    {
      id: 'dm-center',
      title: 'DM Center',
      description: 'Dungeon Master tools',
      icon: <Crown className="w-8 h-8" />,
      path: '/dm-center',
      color: 'from-yellow-500 to-orange-600',
      gradient: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      isNew: true
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'Track your progress',
      icon: <Trophy className="w-8 h-8" />,
      path: '/achievements',
      color: 'from-amber-500 to-yellow-600',
      gradient: 'bg-gradient-to-br from-amber-500 to-yellow-600',
      stats: [
        { label: 'Unlocked', value: stats.achievements },
        { label: 'Total', value: '50' }
      ]
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, {user?.displayName || 'Adventurer'}! 👋
              </h1>
              <p className="text-blue-200 text-lg">
                Ready for your next epic adventure?
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-400" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`relative group p-6 rounded-xl ${action.gradient} hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        {action.icon}
                      </div>
                      {action.badge && (
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                    <p className="text-white/80 text-sm">{action.description}</p>
                    <ArrowRight className="w-4 h-4 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Features Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Compass className="w-6 h-6 mr-2 text-blue-400" />
                  Game Features
                </h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Search className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featureCards.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => onNavigate(feature.path)}
                    className="group relative p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
                  >
                    {feature.isNew && (
                      <span className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-xs font-medium">
                        NEW
                      </span>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${feature.gradient}`}>
                        {feature.icon}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 text-left">{feature.title}</h3>
                    <p className="text-slate-300 text-sm mb-4 text-left">{feature.description}</p>
                    
                    {feature.stats && (
                      <div className="flex space-x-4">
                        {feature.stats.map((stat, index) => (
                          <div key={index} className="text-left">
                            <div className="text-lg font-semibold text-white">{stat.value}</div>
                            <div className="text-xs text-slate-400">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Active Campaigns */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Play className="w-5 h-5 mr-2 text-green-400" />
                  Active Campaigns
                </h3>
                {activeCampaigns.length === 0 ? (
                  <div className="text-center py-4">
                    <Book className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-300 text-sm mb-3">No active campaigns</p>
                    <button
                      onClick={onCreateCampaign}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                      Create Campaign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCampaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{campaign.name}</h4>
                          <p className="text-xs text-slate-400">{campaign.theme}</p>
                        </div>
                        <button
                          onClick={() => onResumeCampaign(campaign.id)}
                          className="ml-2 p-1.5 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {activeCampaigns.length > 3 && (
                      <button
                        onClick={() => onNavigate('/campaigns')}
                        className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View all {activeCampaigns.length} campaigns
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-1.5 bg-slate-700/50 rounded-lg">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Settings */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-slate-400" />
                  Quick Settings
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={onOpenDiceRoller}
                    className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Dice Roller</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={onOpenProfile}
                    className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={onOpenAchievements}
                    className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">Achievements</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                  Your Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Play Time</span>
                    </div>
                    <span className="font-semibold">{stats.totalPlayTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">Achievements</span>
                    </div>
                    <span className="font-semibold">{stats.achievements}/50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Dice Rolls</span>
                    </div>
                    <span className="font-semibold">{stats.diceRolls}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Book className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">Campaigns</span>
                    </div>
                    <span className="font-semibold">{stats.campaignsCompleted}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 