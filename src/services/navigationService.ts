/**
 * Navigation Service
 * 
 * Centralized navigation management and breadcrumb generation
 * Extracted from the original monolithic App.tsx breadcrumb system
 */

import React from 'react';

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export interface NavigationRoute {
  path: string;
  label: string;
  icon: React.ReactNode;
  component?: string;
  description?: string;
  requiresAuth?: boolean;
  category?: 'core' | 'game' | 'management' | 'support';
}

export class NavigationService {
  private currentPath: string = '/';
  private history: string[] = [];
  private callbacks: {
    onNavigate?: (path: string) => void;
    onBreadcrumbChange?: (breadcrumbs: BreadcrumbItem[]) => void;
  } = {};

  // Define all application routes (icons will be provided by components)
  private routes: NavigationRoute[] = [
    // Core Routes
    {
      path: '/',
      label: 'Home',
      icon: null, // Will be set by component
      category: 'core',
      description: 'Landing page and authentication'
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: null,
      component: 'DashboardWrapper',
      category: 'core',
      requiresAuth: true,
      description: 'Main dashboard with campaigns and characters'
    },

    // Game Routes
    {
      path: '/play',
      label: 'Play',
      icon: null,
      component: 'UnifiedGameExperience',
      category: 'game',
      requiresAuth: true,
      description: 'Unified game experience'
    },
    {
      path: '/game',
      label: 'Game',
      icon: null,
      component: 'GameWrapper',
      category: 'game',
      requiresAuth: true,
      description: 'Main game interface'
    },
    {
      path: '/automated-games',
      label: 'Automated Games',
      icon: null,
      component: 'AutomatedGamesWrapper',
      category: 'game',
      requiresAuth: true,
      description: 'AI-powered automated game sessions'
    },
    {
      path: '/world',
      label: 'World',
      icon: null,
      component: 'WorldWrapper',
      category: 'game',
      requiresAuth: true,
      description: 'Interactive world exploration'
    },
    {
      path: '/combat',
      label: 'Combat',
      icon: null,
      component: 'CombatWrapper',
      category: 'game',
      requiresAuth: true,
      description: 'Turn-based combat system'
    },
    {
      path: '/magic',
      label: 'Magic',
      icon: null,
      component: 'MagicWrapper',
      category: 'game',
      requiresAuth: true,
      description: 'Spell management and casting'
    },

    // Character & Campaign Management
    {
      path: '/characters',
      label: 'Characters',
      icon: null,
      component: 'CharacterWrapper',
      category: 'management',
      requiresAuth: true,
      description: 'Character management'
    },
    {
      path: '/characters/create',
      label: 'Create Character',
      icon: null,
      component: 'CharacterCreationWrapper',
      category: 'management',
      requiresAuth: true,
      description: 'Character creation wizard'
    },
    {
      path: '/progression',
      label: 'Progression',
      icon: null,
      component: 'ProgressionWrapper',
      category: 'management',
      requiresAuth: true,
      description: 'Character progression and advancement'
    },
    {
      path: '/campaigns',
      label: 'Campaigns',
      icon: null,
      component: 'CampaignWrapper',
      category: 'management',
      requiresAuth: true,
      description: 'Campaign browser and management'
    },
    {
      path: '/party',
      label: 'Party',
      icon: null,
      component: 'PartyWrapper',
      category: 'management',
      requiresAuth: true,
      description: 'Party and multiplayer management'
    },

    // DM & Admin
    {
      path: '/dm-center',
      label: 'DM Center',
      icon: null,
      component: 'DMCenterWrapper',
      category: 'management',
      requiresAuth: true,
      description: 'Dungeon Master tools and campaign management'
    },

    // User Management
    {
      path: '/profile',
      label: 'Profile',
      icon: null,
      component: 'ProfileWrapper',
      category: 'support',
      requiresAuth: true,
      description: 'User profile and account settings'
    },
    {
      path: '/achievements',
      label: 'Achievements',
      icon: null,
      component: 'AchievementsWrapper',
      category: 'support',
      requiresAuth: true,
      description: 'Achievement progress and unlocks'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: null,
      component: 'SettingsWrapper',
      category: 'support',
      requiresAuth: true,
      description: 'Application settings and preferences'
    },

    // Support
    {
      path: '/help',
      label: 'Help',
      icon: null,
      component: 'HelpWrapper',
      category: 'support',
      requiresAuth: true,
      description: 'User help and documentation'
    }
  ];

  // Set navigation callbacks
  setCallbacks(callbacks: {
    onNavigate?: (path: string) => void;
    onBreadcrumbChange?: (breadcrumbs: BreadcrumbItem[]) => void;
  }) {
    this.callbacks = callbacks;
  }

  // Navigate to a specific path
  navigate(path: string): void {
    // Add current path to history
    if (this.currentPath !== path) {
      this.history.push(this.currentPath);
    }

    this.currentPath = path;
    
    // Update breadcrumbs
    const breadcrumbs = this.generateBreadcrumbs(path);
    
    // Notify callbacks
    this.callbacks.onNavigate?.(path);
    this.callbacks.onBreadcrumbChange?.(breadcrumbs);
  }

  // Go back to previous path
  goBack(): void {
    if (this.history.length > 0) {
      const previousPath = this.history.pop()!;
      this.navigate(previousPath);
    }
  }

  // Get current path
  getCurrentPath(): string {
    return this.currentPath;
  }

  // Get navigation history
  getHistory(): string[] {
    return [...this.history];
  }

  // Generate breadcrumbs for a given path
  generateBreadcrumbs(path: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Home/Dashboard
    if (path !== '/dashboard') {
      breadcrumbs.push({
        label: 'Dashboard',
        path: '/dashboard',
        icon: null // Will be set by component
      });
    }

    // Handle specific paths
    const pathSegments = path.split('/').filter(segment => segment !== '');
    
    // Build breadcrumbs based on path segments
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const route = this.getRouteInfo(currentPath);
      
      if (route) {
        breadcrumbs.push({
          label: route.label,
          path: currentPath,
          icon: route.icon
        });
      } else {
        // Handle dynamic routes or unknown paths
        const label = this.formatPathSegment(segment);
        breadcrumbs.push({
          label,
          path: currentPath,
          icon: null
        });
      }
    }

    return breadcrumbs;
  }

  // Get route information
  getRouteInfo(path: string): NavigationRoute | undefined {
    return this.routes.find(route => route.path === path);
  }

  // Get all routes
  getAllRoutes(): NavigationRoute[] {
    return [...this.routes];
  }

  // Get routes by category
  getRoutesByCategory(category: string): NavigationRoute[] {
    return this.routes.filter(route => route.category === category);
  }

  // Get authenticated routes
  getAuthenticatedRoutes(): NavigationRoute[] {
    return this.routes.filter(route => route.requiresAuth);
  }

  // Get public routes
  getPublicRoutes(): NavigationRoute[] {
    return this.routes.filter(route => !route.requiresAuth);
  }

  // Check if a path requires authentication
  requiresAuth(path: string): boolean {
    const route = this.getRouteInfo(path);
    return route?.requiresAuth ?? false;
  }

  // Format path segment for display
  private formatPathSegment(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Add a new route dynamically
  addRoute(route: NavigationRoute): void {
    const existingIndex = this.routes.findIndex(r => r.path === route.path);
    if (existingIndex >= 0) {
      this.routes[existingIndex] = route;
    } else {
      this.routes.push(route);
    }
  }

  // Remove a route
  removeRoute(path: string): void {
    this.routes = this.routes.filter(route => route.path !== path);
  }

  // Check if current path matches a pattern
  isActivePath(pattern: string): boolean {
    if (pattern === this.currentPath) {
      return true;
    }
    
    // Handle wildcard patterns
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return this.currentPath.startsWith(basePath);
    }
    
    return false;
  }

  // Get relative navigation from current path
  getRelativePath(targetPath: string): string {
    const currentSegments = this.currentPath.split('/').filter(s => s);
    const targetSegments = targetPath.split('/').filter(s => s);
    
    // Find common prefix
    let commonLength = 0;
    while (
      commonLength < currentSegments.length &&
      commonLength < targetSegments.length &&
      currentSegments[commonLength] === targetSegments[commonLength]
    ) {
      commonLength++;
    }
    
    // Build relative path
    const upCount = currentSegments.length - commonLength;
    const downPath = targetSegments.slice(commonLength);
    
    const relativeParts = Array(upCount).fill('..').concat(downPath);
    return relativeParts.join('/') || '.';
  }
}

// Export singleton instance
export const navigationService = new NavigationService(); 