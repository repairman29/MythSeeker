import React from 'react';
import { Home, Book, Users, Map, User, Sword, Sparkles, Menu } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: <Home size={22} />, key: 'dashboard', description: 'Overview and quick actions' },
  { label: 'Campaigns', icon: <Book size={22} />, key: 'campaigns', description: 'Create and manage campaigns' },
  { label: 'Characters', icon: <User size={22} />, key: 'characters', description: 'Character creation and management' },
  { label: 'Party', icon: <Users size={22} />, key: 'party', description: 'View party members and status' },
  { label: 'World', icon: <Map size={22} />, key: 'world', description: 'World map and exploration' },
  { label: 'Combat', icon: <Sword size={22} />, key: 'combat', description: 'Combat system and tactics' },
  { label: 'Magic', icon: <Sparkles size={22} />, key: 'magic', description: 'Spells and magical abilities' },
];

const NavBar: React.FC<{ 
  active: string, 
  onNavigate: (key: string) => void, 
  theme?: string,
  isMobile?: boolean,
  onToggleMobile?: () => void
}> = ({ active, onNavigate, theme, isMobile = false, onToggleMobile }) => {
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
            {navItems.slice(0, 5).map(item => (
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
      <div className="flex-1 flex flex-col space-y-4 w-full items-center">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex flex-col items-center w-full py-3 rounded-xl transition-all group relative ${
              active === item.key ? 'bg-white/20 text-yellow-300' : 'text-blue-200 hover:bg-white/10'
            }`}
            title={`${item.label} - ${item.description}`}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
            
            {/* Desktop tooltip */}
            <div className="absolute left-full ml-2 px-3 py-2 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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