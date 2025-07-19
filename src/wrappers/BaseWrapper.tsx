import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import FloatingActionButton from '../components/FloatingActionButton';
import ToastNotifications from '../components/ToastNotifications';
import { stateManagerService } from '../services/stateManagerService';
import { toastService, ToastMessage } from '../services/toastService';
import { navigationService } from '../services/navigationService';
import { BreadcrumbNavigation } from '../components/BreadcrumbNavigation';
import { firebaseService } from '../firebaseService';

interface BaseWrapperProps {
  user: any;
  children: ReactNode;
  showFloatingButton?: boolean;
  customActions?: Record<string, () => void>;
  showNavigation?: boolean;
  showFloatingActions?: boolean;
  className?: string;
}

export const BaseWrapper: React.FC<BaseWrapperProps> = ({ 
  user, 
  children, 
  showFloatingButton = true, 
  customActions = {}, 
  showNavigation = true,
  showFloatingActions = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Initialize services
  useEffect(() => {
    // Set up navigation service
    navigationService.setCallbacks({
      onNavigate: (path: string) => {
        navigate(path);
      },
      onBreadcrumbChange: (breadcrumbs) => {
        // Update breadcrumbs in state if needed
        console.log('Breadcrumbs updated:', breadcrumbs);
      }
    });

    // Set up toast service
    toastService.setCallbacks({
      onToastAdd: (toast: ToastMessage) => {
        setToastMessages(prev => [...prev, toast]);
      },
      onToastRemove: (id: string) => {
        setToastMessages(prev => prev.filter(toast => toast.id !== id));
      }
    });

    // Initialize state manager with current user
    stateManagerService.setUser(user);
    stateManagerService.setNavigation(location.pathname.split('/')[1] || 'dashboard');

    // Set up responsive handler
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [navigate, location.pathname, user]);

  // Update navigation service when location changes
  useEffect(() => {
    navigationService.navigate(location.pathname);
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await firebaseService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleQuickAction = (action: string) => {
    // Check if custom action exists
    if (customActions[action]) {
      customActions[action]();
      return;
    }

    // Default quick actions
    switch (action) {
      case 'chat':
        navigationService.navigate('/game');
        break;
      case 'party':
        navigationService.navigate('/party');
        break;
      case 'inventory':
        navigationService.navigate('/characters');
        break;
      case 'character':
        navigationService.navigate('/characters');
        break;
      case 'map':
        navigationService.navigate('/world');
        break;
      case 'settings':
        navigationService.navigate('/settings');
        break;
      case 'achievements':
        navigationService.navigate('/achievements');
        break;
      case 'help':
        navigationService.navigate('/help');
        break;
      default:
        console.warn(`Unknown quick action: ${action}`);
        toastService.warning(`Action "${action}" not implemented yet`);
    }
  };

  const handleToggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    stateManagerService.setState({ drawerOpen: !isDrawerOpen });
  };

  const dismissToast = (id: string) => {
    toastService.dismissToast(id);
  };

  const floatingActions = [
    {
      id: 'play',
      label: 'Quick Play',
      icon: '🎮',
      onClick: () => navigationService.navigate('/play'),
      primary: true
    },
    {
      id: 'party',
      label: 'Party',
      icon: '👥',
      onClick: () => navigationService.navigate('/party')
    },
    {
      id: 'character',
      label: 'My Characters',
      icon: '🗡️',
      onClick: () => navigationService.navigate('/characters')
    },
    {
      id: 'create',
      label: 'Create Character',
      icon: '✨',
      onClick: () => navigationService.navigate('/characters')
    },
    {
      id: 'world',
      label: 'Explore World',
      icon: '🗺️',
      onClick: () => navigationService.navigate('/world')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => navigationService.navigate('/settings')
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: '🏆',
      onClick: () => navigationService.navigate('/achievements')
    },
    {
      id: 'help',
      label: 'Help',
      icon: '❓',
      onClick: () => navigationService.navigate('/help')
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {showNavigation && (
        <Navigation 
          user={user} 
          onSignOut={handleSignOut}
          currentPath={location.pathname}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto" id="main-content">
        {/* Breadcrumb Navigation */}
        <div className="bg-black/20 border-b border-white/10 px-6 py-3">
          <BreadcrumbNavigation className="text-sm" />
        </div>
        
        {children}
      </div>
      
      {showFloatingActions && (
        <FloatingActionButton
          onToggleDrawer={handleToggleDrawer}
          isDrawerOpen={isDrawerOpen}
          onQuickAction={handleQuickAction}
          isMobile={isMobile}
          hasNotifications={toastMessages.length > 0}
          notificationCount={toastMessages.length}
          actions={floatingActions}
          disabled={isSigningOut}
        />
      )}

      {/* Toast Notifications */}
      <ToastNotifications
        messages={toastMessages}
        onDismiss={dismissToast}
      />
    </div>
  );
}; 