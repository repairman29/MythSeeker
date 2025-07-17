import React, { useState } from 'react';
import { Home, Book, Users, Map, User, Sword, Sparkles, Menu, Settings, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: <Home size={22} />, key: 'dashboard', description: 'Overview and quick actions', showInGameplay: false },
  { label: 'Campaigns', icon: <Book size={22} />, key: 'campaigns', description: 'Create and manage campaigns', showInGameplay: false },
  { label: 'Characters', icon: <User size={22} />, key: 'characters', description: 'Character creation and management', showInGameplay: false },
  { label: 'Profile', icon: <Award size={22} />, key: 'profile', description: 'Player profile and achievements', showInGameplay: false },
  { label: 'DM Center', icon: <Settings size={22} />, key: 'dm-center', description: 'Dungeon Master tools and resources', showInGameplay: true },
  { label: 'Party', icon: <Users size={22} />, key: 'party', description: 'View party members and status', showInGameplay: true },
  { label: 'World', icon: <Map size={22} />, key: 'world', description: 'World map and exploration', showInGameplay: true },
  { label: 'Combat', icon: <Sword size={22} />, key: 'combat', description: 'Combat system and tactics', showInGameplay: true },
  { label: 'Magic', icon: <Sparkles size={22} />, key: 'magic', description: 'Spells and magical abilities', showInGameplay: true },
];

const NavBar: React.FC<{ 
  active: string, 
  onNavigate: (key: string) => void, 
  theme?: string,
  isMobile?: boolean,
  onToggleMobile?: () => void,
  currentScreen?: string
}> = ({ active, onNavigate, theme, isMobile = false, onToggleMobile, currentScreen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check if we're in active gameplay
  const isInGameplay = currentScreen === 'game' || currentScreen === 'combat';
  
  // Filter items based on context
  const getVisibleItems = () => {
    if (isInGameplay) {
      return navItems.filter(item => item.showInGameplay);
    }
    return navItems.filter(item => !item.showInGameplay);
  };

  const visibleItems = getVisibleItems();

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button for top bar */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-blue-200 hover:text-yellow-300 transition-all"
          title="Toggle mobile menu"
        >
          <Menu size={24} />
        </button>
        
        {/* Bottom navigation bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 border-t border-white/20 z-50 lg:hidden">
          <div className="flex justify-around items-center py-2">
            {visibleItems.slice(0,5).map(item => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all min-w-0 flex-1 group ${
                  active === item.key 
                    ? 'text-yellow-300 bg-white/20' 
                    : 'text-blue-200 hover:text-yellow-300 hover:bg-white/10'
                }`}
                title={`${item.label} - ${item.description}`}
              >
                {item.icon}
                <span className="text-xs mt-1 font-medium truncate">{item.label}</span>
                
                {/* Tooltip for mobile */}
                <div className="absolute bottom-full mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.description}
                </div>
              </button>
            ))}
          </div>
        </nav>
      </>
    );
  }

  // Desktop side navigation
  return (
    <nav className={`hidden lg:flex h-screen w-20 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 flex-col items-center py-6 shadow-xl transition-all duration-500 ${theme ? `theme-${theme}` : ''}`}
      style={{ minWidth: 80 }}>
      
      {/* Collapse/Expand button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-blue-800 hover:bg-blue-700 text-white p-1 rounded-full transition-all"
        title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex-1 flex flex-col space-y-4 w-full items-center">
        {visibleItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex flex-col items-center w-full py-3 rounded-xl transition-all group relative ${
              active === item.key ? 'bg-white/20 text-yellow-300' : 'text-blue-200 hover:bg-white/10'
            }`}
            title={`${item.label} - ${item.description}`}
          >
            {item.icon}
            {!isCollapsed && (
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            )}
            
            {/* Desktop tooltip */}
            <div className={`absolute left-full ml-2 px-3 py-2 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50${isCollapsed ? 'hidden' : ''}`}>
              <div className="font-semibold">{item.label}</div>
              <div className="text-xs text-gray-300">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavBar; 