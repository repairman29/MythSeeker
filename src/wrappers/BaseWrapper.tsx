import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import FloatingActionButton from '../components/FloatingActionButton';

interface BaseWrapperProps {
  user: any;
  children: ReactNode;
  showFloatingButton?: boolean;
  customActions?: Record<string, () => void>;
}

export const BaseWrapper: React.FC<BaseWrapperProps> = ({ 
  user, 
  children, 
  showFloatingButton = true,
  customActions = {}
}) => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignOut = () => {
    console.log('🎮 Sign out triggered');
  };

  const handleQuickAction = (action: string) => {
    // Check if there's a custom action handler
    if (customActions[action]) {
      customActions[action]();
      return;
    }

    // Default actions
    switch (action) {
      case 'chat':
        navigate('/game');
        break;
      case 'party':
        navigate('/party');
        break;
      case 'inventory':
        navigate('/characters');
        break;
      case 'character':
        navigate('/characters');
        break;
      case 'map':
        navigate('/world');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-auto md:pb-0 pb-20">
        {children}
      </div>
      
      {showFloatingButton && (
        <FloatingActionButton
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          isDrawerOpen={isDrawerOpen}
          onQuickAction={handleQuickAction}
          isMobile={isMobile}
          hasNotifications={false}
          notificationCount={0}
        />
      )}
    </div>
  );
}; 