import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  customBreadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ 
  customBreadcrumbs, 
  className = '' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route configuration for automatic breadcrumb generation
  const routeConfig: Record<string, { label: string; icon?: React.ReactNode; parent?: string }> = {
    '/': { label: 'Home', icon: <Home size={16} /> },
    '/dashboard': { label: 'Dashboard', icon: <Home size={16} /> },
    '/play': { label: 'Play', parent: '/dashboard' },
    '/game': { label: 'Game', parent: '/dashboard' },
    '/characters': { label: 'Characters', parent: '/dashboard' },
    '/characters/create': { label: 'Create Character', parent: '/characters' },
    '/progression': { label: 'Progression', parent: '/characters' },
    '/campaigns': { label: 'Campaigns', parent: '/dashboard' },
    '/automated-games': { label: 'AI Games', parent: '/dashboard' },
    '/party': { label: 'Party', parent: '/dashboard' },
    '/world': { label: 'World', parent: '/dashboard' },
    '/combat': { label: 'Combat', parent: '/dashboard' },
    '/magic': { label: 'Magic', parent: '/dashboard' },
    '/dm-center': { label: 'DM Center', parent: '/dashboard' },
    '/profile': { label: 'Profile', parent: '/dashboard' },
    '/achievements': { label: 'Achievements', parent: '/dashboard' },
    '/settings': { label: 'Settings', parent: '/dashboard' },
    '/help': { label: 'Help', parent: '/dashboard' }
  };

  // Generate breadcrumbs automatically from current route
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Dashboard/Home
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Home size={16} />
    });

    // Handle root case
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      return breadcrumbs.map((crumb, index, array) => ({
        ...crumb,
        isActive: index === array.length - 1
      }));
    }

    // Build path progressively
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Handle dynamic routes (campaigns/:id, etc.)
      if (segment.match(/^[a-f0-9-]{36}$/) || !isNaN(Number(segment))) {
        // This is likely an ID, use parent route config
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const config = routeConfig[parentPath];
        if (config) {
          breadcrumbs.push({
            label: `${config.label} Details`,
            path: currentPath,
            isActive: index === pathSegments.length - 1
          });
        }
        return;
      }

      const config = routeConfig[currentPath];
      if (config) {
        // Skip if it's the same as dashboard
        if (currentPath !== '/dashboard') {
          breadcrumbs.push({
            label: config.label,
            path: currentPath,
            icon: config.icon,
            isActive: index === pathSegments.length - 1
          });
        }
      } else {
        // Fallback for unknown routes
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          path: currentPath,
          isActive: index === pathSegments.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  // Get context-aware breadcrumbs
  const getContextualBreadcrumbs = (): BreadcrumbItem[] => {
    const urlParams = new URLSearchParams(location.search);
    const routingState = location.state as any;

    // Check for training session context
    if (location.pathname === '/play') {
      const gameType = routingState?.gameType || urlParams.get('gameType');
      const trainingType = routingState?.trainingType || urlParams.get('trainingType');
      
      if (gameType === 'training' && trainingType) {
        return [
          { label: 'Dashboard', path: '/dashboard', icon: <Home size={16} /> },
          { label: 'Combat', path: '/combat' },
          { label: 'Training', path: '/combat' },
          { 
            label: `${trainingType.charAt(0).toUpperCase() + trainingType.slice(1)} Training`, 
            path: location.pathname + location.search,
            isActive: true 
          }
        ];
      }

      if (gameType === 'combat') {
        return [
          { label: 'Dashboard', path: '/dashboard', icon: <Home size={16} /> },
          { label: 'Combat', path: '/combat' },
          { label: 'Combat Scenario', path: location.pathname + location.search, isActive: true }
        ];
      }
    }

    // Check for campaign context
    if (location.pathname.includes('/campaigns/')) {
      const campaignId = location.pathname.split('/campaigns/')[1]?.split('/')[0];
      const isWaiting = location.pathname.includes('/waiting');
      
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Dashboard', path: '/dashboard', icon: <Home size={16} /> },
        { label: 'Campaigns', path: '/campaigns' }
      ];

      if (campaignId) {
        breadcrumbs.push({
          label: routingState?.campaignName || 'Campaign',
          path: `/campaigns/${campaignId}`,
          isActive: !isWaiting
        });

        if (isWaiting) {
          breadcrumbs.push({
            label: 'Waiting Room',
            path: `/campaigns/${campaignId}/waiting`,
            isActive: true
          });
        }
      }

      return breadcrumbs;
    }

    return generateBreadcrumbs();
  };

  const breadcrumbs = customBreadcrumbs || getContextualBreadcrumbs();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for single items
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight size={16} className="text-blue-400 mx-2" />
            )}
            {crumb.isActive ? (
              <span className="flex items-center space-x-1 text-white font-medium">
                {crumb.icon}
                <span>{crumb.label}</span>
              </span>
            ) : (
              <button
                onClick={() => handleNavigate(crumb.path)}
                className="flex items-center space-x-1 text-blue-300 hover:text-white transition-colors"
              >
                {crumb.icon}
                <span>{crumb.label}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Enhanced breadcrumb hook for components that need breadcrumb data
export const useBreadcrumbs = () => {
  const location = useLocation();
  
  const getCurrentRoute = () => ({
    pathname: location.pathname,
    search: location.search,
    state: location.state
  });

  const generateTrackingId = () => {
    const timestamp = Date.now();
    const route = location.pathname.replace(/[^a-zA-Z0-9]/g, '_');
    return `route_${route}_${timestamp}`;
  };

  return {
    currentRoute: getCurrentRoute(),
    trackingId: generateTrackingId(),
    fullPath: location.pathname + location.search
  };
};

export default BreadcrumbNavigation; 