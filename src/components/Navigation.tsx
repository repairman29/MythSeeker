import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Users, 
  Book, 
  Globe, 
  Sword, 
  Swords, 
  Crown, 
  Trophy, 
  Settings, 
  HelpCircle, 
  Menu, 
  X,
  LogOut,
  Map,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bot,
  TrendingUp
} from 'lucide-react';
import { auth, firebaseService } from '../firebaseService';

interface NavigationProps {
  user: any;
  onSignOut: () => void;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  isNew?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ user, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Home className="w-5 h-5" />,
      description: 'Main hub and overview'
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      path: '/campaigns',
      icon: <Book className="w-5 h-5" />,
      description: 'Manage your adventures'
    },
    {
      id: 'automated-games',
      label: 'AI Games',
      path: '/automated-games',
      icon: <Bot className="w-5 h-5" />,
      description: 'Join AI-powered RPG sessions',
      isNew: true
    },
    {
      id: 'characters',
      label: 'Characters',
      path: '/characters',
      icon: <User className="w-5 h-5" />,
      description: 'Your heroes and companions'
    },
    {
      id: 'progression',
      label: 'Progression',
      path: '/progression',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Character advancement & leveling',
      isNew: true
    },
    {
      id: 'party',
      label: 'Party',
      path: '/party',
      icon: <Users className="w-5 h-5" />,
      description: 'Team up with friends'
    },
    {
      id: 'world',
      label: 'World',
      path: '/world',
      icon: <Globe className="w-5 h-5" />,
      description: 'Explore the realm'
    },
    {
      id: 'combat',
      label: 'Combat',
      path: '/combat',
      icon: <Sword className="w-5 h-5" />,
      description: 'Battle system & tactics'
    },
    {
      id: 'magic',
      label: 'Magic',
      path: '/magic',
      icon: <Swords className="w-5 h-5" />,
      description: 'Spells & abilities'
    },
    {
      id: 'dm-center',
      label: 'DM Center',
      path: '/dm-center',
      icon: <Crown className="w-5 h-5" />,
      description: 'Dungeon Master tools',
      isNew: true
    },
    {
      id: 'achievements',
      label: 'Achievements',
      path: '/achievements',
      icon: <Trophy className="w-5 h-5" />,
      description: 'Track your progress'
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: <User className="w-5 h-5" />,
      description: 'Your account settings'
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      description: 'App preferences'
    },
    {
      id: 'help',
      label: 'Help',
      path: '/help',
      icon: <HelpCircle className="w-5 h-5" />,
      description: 'Support & documentation'
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOut();
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Desktop & Tablet Navigation - Collapsible Sidebar */}
      <nav className={`hidden md:flex flex-col bg-slate-800/90 backdrop-blur-sm border-r border-slate-700/50 h-screen sticky top-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b border-slate-700/50 ${isSidebarCollapsed ? 'px-2' : 'px-6'}`}>
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">MythSeeker</h1>
                  <p className="text-xs text-slate-400">RPG Adventure</p>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-slate-700/50 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName || 'Adventurer'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className={`space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group relative ${
                  isActive(item.path)
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <div className={`flex-shrink-0 ${isActive(item.path) ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      {item.isNew && (
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-xs font-medium">
                          NEW
                        </span>
                      )}
                      {item.badge && (
                        <span className="px-1.5 py-0.5 bg-slate-600 rounded-full text-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 group-hover:text-slate-300 truncate">
                      {item.description}
                    </p>
                  </div>
                )}
                {/* Tooltip for collapsed state */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t border-slate-700/50 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title={isSidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MythSeeker</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 bg-slate-800/95 border-b border-slate-700/50 max-h-96 overflow-y-auto">
              {/* User Info */}
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.displayName || 'Adventurer'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${isActive(item.path) ? 'text-blue-400' : 'text-slate-400'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.isNew && (
                          <span className="px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-xs font-medium">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <div className="p-4 border-t border-slate-700/50">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 z-40">
          <div className="flex justify-around p-2">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-blue-400 bg-blue-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-5 h-5">
                  {item.icon}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-slate-400 hover:text-white transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation; 