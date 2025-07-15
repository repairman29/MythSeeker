import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Plus, 
  X, 
  BookOpen, 
  Award,
  Map,
  Package,
  Heart,
  Zap,
  Sword,
  Shield,
  Target,
  Eye,
  Globe,
  Music,
  Volume2,
  Bell,
  Download,
  Upload,
  Share2,
  Copy,
  Edit,
  Trash2,
  RotateCcw,
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
  Info,
  Menu
} from 'lucide-react';

interface FABProps {
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
  onQuickAction?: (action: string) => void;
  isMobile: boolean;
  hasNotifications?: boolean;
  notificationCount?: number;
}

const FloatingActionButton: React.FC<FABProps> = ({
  onToggleDrawer,
  isDrawerOpen,
  onQuickAction,
  isMobile,
  hasNotifications = false,
  notificationCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    { 
      key: 'chat', 
      icon: <MessageSquare size={20} />, 
      label: 'Chat', 
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Open party chat'
    },
    { 
      key: 'party', 
      icon: <Users size={20} />, 
      label: 'Party', 
      color: 'bg-green-600 hover:bg-green-700',
      description: 'View party status'
    },
    { 
      key: 'inventory', 
      icon: <Package size={20} />, 
      label: 'Inventory', 
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Manage items'
    },
    { 
      key: 'character', 
      icon: <Heart size={20} />, 
      label: 'Character', 
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Character sheet'
    },
    { 
      key: 'map', 
      icon: <Map size={20} />, 
      label: 'Map', 
      color: 'bg-yellow-600 hover:bg-yellow-700',
      description: 'World map'
    },
    { 
      key: 'settings', 
      icon: <Settings size={20} />, 
      label: 'Settings', 
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'Game settings'
    }
  ];

  const handleMainButtonClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      onToggleDrawer();
    }
  };

  const handleQuickAction = (action: string) => {
    setIsExpanded(false);
    onQuickAction?.(action);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Action Buttons */}
      {isExpanded && (
        <div className="mb-4 space-y-3">
          {quickActions.map((action, index) => (
            <div
              key={action.key}
              className="flex items-center justify-end"
              style={{
                animationDelay: `${index * 50}ms`,
                transform: 'translateX(20px)',
                opacity: 0,
                animation: 'slideInRight 0.3s ease-out forwards'
              }}
            >
              {/* Tooltip */}
              <div className="mr-3 bg-black/90 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {action.description}
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => handleQuickAction(action.key)}
                className={`${action.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group`}
                title={action.description}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <div className="relative">
        {/* Notification Badge */}
        {hasNotifications && notificationCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center animate-pulse">
            {notificationCount > 99 ? '99+' : notificationCount}
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={handleMainButtonClick}
          className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${
            isDrawerOpen || isExpanded
              ? 'bg-red-600 hover:bg-red-700 rotate-45'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <div className="flex items-center justify-center text-white">
            {isDrawerOpen || isExpanded ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </div>
        </button>

        {/* Expand Button (only when drawer is closed) */}
        {!isDrawerOpen && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`absolute -top-2 -left-2 w-8 h-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
              isExpanded
                ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <div className="flex items-center justify-center text-white">
              {isExpanded ? (
                <X size={16} />
              ) : (
                <Plus size={16} />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Mobile-specific features */}
      {isMobile && (
        <div className="mt-4 flex justify-center">
          <div className="bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white text-xs opacity-75">
              {isDrawerOpen ? 'Close' : isExpanded ? 'Quick Actions' : 'Menu'}
            </p>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInRight {
            from {
              transform: translateX(20px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(20px);
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  );
};

export default FloatingActionButton; 