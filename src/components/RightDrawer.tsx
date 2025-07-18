import React, { useState, useRef } from 'react';
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
  Crown,
  MapPin,
  Compass
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
  drawerWidth?: number;
  setDrawerWidth?: (w: number) => void;
  minWidth?: number;
  maxWidth?: number;
  currentScreen?: string;
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
  onUpdateSettings,
  drawerWidth = 400,
  setDrawerWidth,
  minWidth = 320,
  maxWidth = 600,
  currentScreen
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [chatMessage, setChatMessage] = useState('');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    musicEnabled: true,
    notifications: true,
    autoSave: true,
    theme: 'dark',
    language: 'en'
  });

  // Check if we're in active gameplay
  const isInGameplay = currentScreen === 'game' || currentScreen === 'combat';

  // Resizable drawer state (desktop only)
  const DEFAULT_WIDTH = 384; // 24rem
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 600;
  const resizing = useRef(false);

  // Mouse event handlers for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || !setDrawerWidth) return;
    resizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing.current || !setDrawerWidth) return;
    const winWidth = window.innerWidth;
    const newWidth = Math.min(
      Math.max(winWidth - e.clientX, minWidth),
      maxWidth
    );
    setDrawerWidth(newWidth);
  };
  const handleMouseUp = () => {
    if (resizing.current) {
      resizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };
  React.useEffect(() => {
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  // Context-aware tabs - show different tabs during gameplay
  const getTabs = () => {
    if (isInGameplay) {
      return [
        { key: 'chat', label: 'Chat', icon: <MessageSquare size={20} />, description: 'Real-time messaging' },
        { key: 'log', label: 'Story Log', icon: <BookOpen size={20} />, description: 'Campaign events & notes' },
        { key: 'party', label: 'Party', icon: <Users size={20} />, description: 'Player status & info' },
        { key: 'world', label: 'World', icon: <Map size={20} />, description: 'World state & exploration' },
        { key: 'tools', label: 'Tools', icon: <Settings size={20} />, description: 'Game tools & settings' }
      ];
    }
    
    return [
    { key: 'chat', label: 'Chat', icon: <MessageSquare size={20} />, description: 'Real-time messaging' },
    { key: 'log', label: 'Campaign Log', icon: <BookOpen size={20} />, description: 'Story and events' },
      { key: 'players', label: 'Players', icon: <Users size={20} />, description: 'Player management' },
    { key: 'world', label: 'World', icon: <Map size={20} />, description: 'World state & events' },
    { key: 'achievements', label: 'Achievements', icon: <Award size={20} />, description: 'Progress & rewards' },
    { key: 'settings', label: 'Settings', icon: <Settings size={20} />, description: 'Game preferences' }
  ];
  };

  const tabs = getTabs();

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
          <h3 className="text-lg font-semibold text-white">
            {isInGameplay ? 'Adventure Chat' : 'Campaign Chat'}
          </h3>
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
            ref={searchInputRef}
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
        {filteredMessages.map((msg, index) => (
          <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-sm font-semibold text-white ${
                msg.type === 'player' ? 'bg-blue-500/50 text-blue-100' :
                msg.type === 'dm' ? 'bg-purple-500/50 text-purple-100' :
                  'bg-gray-500/50 text-gray-100'
                }`}>
                {msg.type === 'player' ? 'Player' : msg.type === 'dm' ? 'DM' : 'System'}
                </span>
              <span className="text-xs text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-white text-sm leading-relaxed">{msg.content}</p>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-white/20">
        <div className="flex space-x-2">
          <input
            ref={chatInputRef}
            type="text"
            placeholder="Type a message..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 text-white placeholder-gray-300 rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && chatMessage.trim() && onSendMessage) {
                onSendMessage(chatMessage);
                setChatMessage('');
              }
            }}
          />
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              if (chatMessage.trim() && onSendMessage) {
                onSendMessage(chatMessage);
                setChatMessage('');
              }
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const renderLogTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">
            {isInGameplay ? 'Story Log' : 'Campaign Log'}
          </h3>
        <div className="flex space-x-2">
          <button className="p-1 text-blue-300 hover:text-blue-100 transition-colors">
            <Search size={16} />
          </button>
        </div>
          <input
            type="text"
            placeholder="Search log entries..."
            value={logSearchTerm}
            onChange={(e) => setLogSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-300 rounded-lg border border-white/20 focus:outline-none focus:border-blue-400"
          />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Sample log entries - replace with actual data */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar size={14} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Session Start</span>
            <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
          <p className="text-gray-200">The party entered the ancient ruins...</p>
            </div>
        
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Sword size={14} className="text-red-400" />
            <span className="text-sm font-semibold text-white">Combat Encounter</span>
            <span className="text-xs text-gray-400">1o</span>
          </div>
          <p className="text-gray-200">Battle with goblin scouts...</p>
        </div>
      </div>
    </div>
  );

  const renderPartyTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">Party Status</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {players.map((player, index) => (
          <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold`}>
                {player.name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{player.name}</div>
                <div className="text-sm text-gray-300">
                  Level {player.level} {player.class}
              </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                <Heart size={12} className="text-red-400" />
                    <span>{player.health}/{player.maxHealth}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Shield size={12} className="text-blue-400" />
                    <span>AC {player.armorClass}</span>
                </span>
              </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorldTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">World State</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {worldState && (
          <>
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin size={16} className="text-blue-400" />
                <span className="font-semibold text-white">Current Location</span>
          </div>
              <p className="text-gray-200">{worldState.currentLocation || 'Unknown Location'}</p>
        </div>

        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={16} className="text-green-400" />
                <span className="font-semibold text-white">Time & Weather</span>
                  </div>
              <p className="text-gray-200">
                {worldState.currentTime || 'Day'} - {worldState.weather || 'Clear'}
              </p>
        </div>

            {worldState.activeQuests && worldState.activeQuests.length > 0 && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Target size={16} className="text-yellow-400" />
                  <span className="font-semibold text-white">Active Quests</span>
                </div>
                <div className="space-y-2">
                  {worldState.activeQuests.map((quest: any, index: number) => (
                    <p key={index} className="text-sm text-gray-200">
                      • {quest.title}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderToolsTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3">Game Tools</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 size={16} className="text-blue-400" />
            <span className="font-semibold text-white">Audio Settings</span>
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-200">Sound Effects</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.musicEnabled}
                onChange={(e) => handleSettingChange('musicEnabled', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-200">Background Music</span>
            </label>
          </div>
        </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
            <Bell size={16} className="text-yellow-400" />
            <span className="font-semibold text-white">Notifications</span>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-200">Enable Notifications</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return renderChatTab();
      case 'log':
        return renderLogTab();
      case 'party':
        return renderPartyTab();
      case 'world':
        return renderWorldTab();
      case 'tools':
        return renderToolsTab();
      default:
        return renderChatTab();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 border-l border-white/20 shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
      isMobile ? 'w-full sm:w-96' : ''
    }`}
      style={{ width: isMobile ? drawerWidth : 'auto' }}>
      
      {/* Resize handle for desktop */}
      {!isMobile && setDrawerWidth && (
          <div
          className="absolute left-0 top-0 bottom-0 bg-blue-600 cursor-col-resize hover:bg-blue-400 transition-colors"
          onMouseDown={handleMouseDown}
        />
        )}
      
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-white">GameTools</h2>
        </div>
          <button
            onClick={onClose}
          className="p-2 text-blue-200 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      
      {/* Tabs */}
        <div className="flex border-b border-white/20 overflow-x-auto">
        {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
            className={`flex items-center space-x-2 p-3 min-w-0 flex-1 transition-colors ${
                activeTab === tab.key
                ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
              title={tab.description}
            >
              {tab.icon}
            <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      
      {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
  );
};

export default RightDrawer; 