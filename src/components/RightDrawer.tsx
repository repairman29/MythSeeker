import React, { useState } from 'react';
import { 
  MessageSquare, 
  BookOpen, 
  Users, 
  Map, 
  Settings, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  Star,
  Calendar,
  Clock,
  User,
  Shield,
  Sword,
  Zap,
  Heart,
  Coins,
  Package,
  Award,
  Target,
  Eye,
  Globe,
  Music,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Download,
  Upload,
  Share2,
  Copy,
  Edit,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
  Info,
  Crown
} from 'lucide-react';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile: boolean;
  campaign?: any;
  messages?: any[];
  players?: any[];
  worldState?: any;
  achievements?: any[];
  onSendMessage?: (message: string) => void;
  onUpdateSettings?: (settings: any) => void;
}

const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isMobile,
  campaign,
  messages = [],
  players = [],
  worldState,
  achievements = [],
  onSendMessage,
  onUpdateSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [settings, setSettings] = useState({
    soundEnabled: true,
    musicEnabled: true,
    notifications: true,
    autoSave: true,
    theme: 'dark',
    language: 'en'
  });

  const tabs = [
    { key: 'chat', label: 'Chat', icon: <MessageSquare size={20} />, description: 'Real-time messaging' },
    { key: 'log', label: 'Campaign Log', icon: <BookOpen size={20} />, description: 'Story and events' },
    { key: 'players', label: 'Party', icon: <Users size={20} />, description: 'Player management' },
    { key: 'world', label: 'World', icon: <Map size={20} />, description: 'World state & events' },
    { key: 'achievements', label: 'Achievements', icon: <Award size={20} />, description: 'Progress & rewards' },
    { key: 'settings', label: 'Settings', icon: <Settings size={20} />, description: 'Game preferences' }
  ];

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdateSettings?.(newSettings);
  };

  const filteredMessages = messages.filter(msg => {
    if (searchTerm && !msg.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && msg.type !== filterType) {
      return false;
    }
    return true;
  });

  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Campaign Chat</h3>
          <div className="flex items-center space-x-2">
            <button className="p-1 text-blue-300 hover:text-blue-100 transition-colors">
              <Search size={16} />
            </button>
            <button className="p-1 text-blue-300 hover:text-blue-100 transition-colors">
              <Filter size={16} />
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 text-white placeholder-gray-300 rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
          >
            <option value="all">All</option>
            <option value="player">Players</option>
            <option value="dm">DM</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.map((message, index) => (
          <div key={index} className={`p-3 rounded-lg ${
            message.type === 'player' 
              ? 'bg-blue-600/20 border border-blue-500/30' 
              : message.type === 'dm'
              ? 'bg-purple-600/20 border border-purple-500/30'
              : 'bg-gray-600/20 border border-gray-500/30'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  message.type === 'player' ? 'bg-blue-500/50 text-blue-100' :
                  message.type === 'dm' ? 'bg-purple-500/50 text-purple-100' :
                  'bg-gray-500/50 text-gray-100'
                }`}>
                  {message.type === 'player' ? 'Player' : message.type === 'dm' ? 'DM' : 'System'}
                </span>
                {message.character && (
                  <span className="text-sm font-medium text-white">{message.character}</span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(message.timestamp?.toDate?.() || message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-white text-sm leading-relaxed">{message.content}</p>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-white/20">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-white/10 text-white placeholder-gray-300 rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                onSendMessage?.(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const renderLogTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">Campaign Log</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search log entries..."
            className="flex-1 px-3 py-2 bg-white/10 text-white placeholder-gray-300 rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
          />
          <button className="px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
            <Download size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {campaign?.systemMessages?.map((entry: any, index: number) => (
          <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {new Date(entry.timestamp?.toDate?.() || entry.timestamp).toLocaleDateString()}
                </span>
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {new Date(entry.timestamp?.toDate?.() || entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                entry.type === 'combat' ? 'bg-red-500/50 text-red-100' :
                entry.type === 'quest' ? 'bg-green-500/50 text-green-100' :
                entry.type === 'story' ? 'bg-purple-500/50 text-purple-100' :
                'bg-gray-500/50 text-gray-100'
              }`}>
                {entry.type}
              </span>
            </div>
            <h4 className="text-white font-medium mb-1">{entry.title}</h4>
            <p className="text-gray-300 text-sm">{entry.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlayersTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">Party Members</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {players.length} player{players.length !== 1 ? 's' : ''} online
          </span>
          <div className="flex-1"></div>
          <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
            Invite
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {players.map((player, index) => (
          <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  player.isOnline ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
                <div>
                  <h4 className="text-white font-medium">{player.character?.name || player.name}</h4>
                  <p className="text-gray-400 text-sm">
                    Level {player.character?.level} {player.character?.class}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${
                  player.status === 'ready' ? 'bg-green-500/50 text-green-100' :
                  player.status === 'in-game' ? 'bg-blue-500/50 text-blue-100' :
                  'bg-gray-500/50 text-gray-100'
                }`}>
                  {player.status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <Heart size={12} className="text-red-400" />
                <span className="text-gray-300">
                  {player.character?.health || 0}/{player.character?.maxHealth || 100}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap size={12} className="text-blue-400" />
                <span className="text-gray-300">
                  {player.character?.mana || 0}/{player.character?.maxMana || 50}
                </span>
              </div>
            </div>
            
            {player.isHost && (
              <div className="mt-2 flex items-center space-x-1">
                <Crown size={12} className="text-yellow-400" />
                <span className="text-xs text-yellow-400">Campaign Host</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorldTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">World State</h3>
        <div className="flex items-center space-x-2">
          <Globe size={16} className="text-green-400" />
          <span className="text-sm text-gray-300">
            {worldState?.currentLocation || 'Unknown Location'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Location */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-2">Current Location</h4>
          <p className="text-gray-300 text-sm mb-2">
            {worldState?.locationDescription || 'No location description available.'}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Map size={12} />
            <span>{worldState?.coordinates || 'Unknown coordinates'}</span>
          </div>
        </div>

        {/* Active Quests */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-2">Active Quests</h4>
          {worldState?.activeQuests?.length > 0 ? (
            <div className="space-y-2">
              {worldState.activeQuests.map((quest: any, index: number) => (
                <div key={index} className="p-2 bg-white/5 rounded border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{quest.title}</span>
                    <span className="text-xs text-gray-400">{quest.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${quest.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No active quests</p>
          )}
        </div>

        {/* World Events */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-2">Recent Events</h4>
          {worldState?.recentEvents?.length > 0 ? (
            <div className="space-y-2">
              {worldState.recentEvents.map((event: any, index: number) => (
                <div key={index} className="p-2 bg-white/5 rounded border border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'combat' ? 'bg-red-400' :
                      event.type === 'quest' ? 'bg-green-400' :
                      event.type === 'story' ? 'bg-purple-400' :
                      'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-white">{event.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No recent events</p>
          )}
        </div>

        {/* Weather & Time */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-2">Environment</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Sun size={14} className="text-yellow-400" />
              <span className="text-gray-300">{worldState?.time || 'Day'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe size={14} className="text-blue-400" />
              <span className="text-gray-300">{worldState?.weather || 'Clear'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">Achievements</h3>
        <div className="flex items-center space-x-2">
          <Award size={16} className="text-yellow-400" />
          <span className="text-sm text-gray-300">
            {achievements.length} unlocked
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {achievements.map((achievement, index) => (
          <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{achievement.icon || '🏆'}</div>
              <div className="flex-1">
                <h4 className="text-white font-medium">{achievement.name}</h4>
                <p className="text-gray-300 text-sm mb-2">{achievement.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-400">+{achievement.points} points</span>
                  <span className="text-xs text-gray-400">
                    {new Date(achievement.unlockedAt?.toDate?.() || achievement.unlockedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {achievements.length === 0 && (
          <div className="text-center py-8">
            <Award size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No achievements unlocked yet</p>
            <p className="text-gray-500 text-sm mt-2">Complete quests and challenges to earn achievements!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">Settings</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Audio Settings */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Audio</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 size={16} className="text-gray-400" />
                <span className="text-gray-300">Sound Effects</span>
              </div>
              <button
                onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Music size={16} className="text-gray-400" />
                <span className="text-gray-300">Background Music</span>
              </div>
              <button
                onClick={() => handleSettingChange('musicEnabled', !settings.musicEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.musicEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.musicEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Notifications</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell size={16} className="text-gray-400" />
                <span className="text-gray-300">Push Notifications</span>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Game</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Save size={16} className="text-gray-400" />
                <span className="text-gray-300">Auto Save</span>
              </div>
              <button
                onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoSave ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sun size={16} className="text-gray-400" />
                <span className="text-gray-300">Theme</span>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="px-3 py-1 bg-white/10 text-white rounded border border-white/20 focus:outline-none focus:border-blue-400"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Data</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-2">
                <Download size={16} className="text-gray-400" />
                <span className="text-gray-300">Export Character</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-2">
                <Upload size={16} className="text-gray-400" />
                <span className="text-gray-300">Import Character</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 bg-red-600/20 rounded-lg border border-red-500/30 hover:bg-red-600/30 transition-colors">
              <div className="flex items-center space-x-2">
                <Trash2 size={16} className="text-red-400" />
                <span className="text-red-400">Reset Progress</span>
              </div>
              <ChevronRight size={16} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">About</h4>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Info size={16} className="text-blue-400" />
              <span className="text-white font-medium">MythSeeker RPG</span>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              AI-powered tabletop RPG with multiplayer support
            </p>
            <div className="text-xs text-gray-400">
              Version 1.0.0 • Built with React & Firebase
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat': return renderChatTab();
      case 'log': return renderLogTab();
      case 'players': return renderPlayersTab();
      case 'world': return renderWorldTab();
      case 'achievements': return renderAchievementsTab();
      case 'settings': return renderSettingsTab();
      default: return renderChatTab();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 border-l border-white/20 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isMobile ? 'w-full sm:w-96' : 'w-96'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Campaign Tools</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/20 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center p-3 min-w-0 flex-1 transition-colors ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={tab.description}
            >
              {tab.icon}
              <span className="text-xs mt-1 font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
};

export default RightDrawer; 