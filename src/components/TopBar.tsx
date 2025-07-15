import React from 'react';
import UserProfile from '../UserProfile';
import { Bell, PlusCircle, Menu } from 'lucide-react';

const TopBar: React.FC<{ 
  onNewCampaign: () => void,
  isMobile?: boolean,
  onToggleMobile?: () => void,
  currentScreen?: string
}> = ({ onNewCampaign, isMobile = false, onToggleMobile, currentScreen }) => {
  // Get screen title for better context
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'character': return 'Character Creation';
      case 'lobby': return 'Campaign Lobby';
      case 'waiting': return 'Waiting Room';
      case 'game': return 'Adventure';
      case 'combat': return 'Combat';
      default: return 'MythSeeker';
    }
  };

  return (
    <header className="w-full h-16 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-between px-4 lg:px-6 shadow-lg z-40">
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Mobile menu button */}
        {isMobile && onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 text-blue-200 hover:text-yellow-300 transition-all"
            title="Menu"
          >
            <Menu size={20} />
          </button>
        )}
        
        {/* Screen Title - Provides Context */}
        <div className="hidden sm:block">
          <h1 className="text-lg lg:text-xl font-bold text-white">{getScreenTitle()}</h1>
          <p className="text-xs text-blue-200">AI-Powered RPG Adventure</p>
        </div>
        
        <button
          onClick={onNewCampaign}
          className="flex items-center px-3 lg:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold text-sm lg:text-base shadow-md"
          title="Create a new campaign"
        >
          <PlusCircle size={18} className="mr-1 lg:mr-2" />
          <span className="hidden sm:inline">New Campaign</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-3 lg:space-x-6">
        {/* Notification Center */}
        <button 
          className="relative text-blue-200 hover:text-yellow-300 transition-all p-2"
          title="Notifications"
        >
          <Bell size={20} className="lg:w-6 lg:h-6" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">3</span>
        </button>
        
        {/* User Profile - Desktop */}
        <div className="hidden sm:block">
          <UserProfile />
        </div>
        
        {/* Mobile user profile button */}
        <button 
          className="sm:hidden p-2 text-blue-200 hover:text-yellow-300 transition-all"
          title="User Profile"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            U
          </div>
        </button>
      </div>
    </header>
  );
};

export default TopBar; 