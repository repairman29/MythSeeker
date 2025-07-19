interface NavigationEvent {
  id: string;
  timestamp: number;
  userId?: string;
  fromPath: string;
  toPath: string;
  navigationMethod: 'route' | 'breadcrumb' | 'tab' | 'button' | 'link';
  routingState?: any;
  urlParams?: string;
  sessionId: string;
  userAgent: string;
  screenSize: { width: number; height: number };
}

interface NavigationIssue {
  id: string;
  timestamp: number;
  type: 'state_loss' | 'routing_error' | 'broken_link' | 'slow_navigation' | 'context_mismatch';
  path: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent: string;
  additionalData?: any;
}

interface NavigationFlow {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  events: NavigationEvent[];
  issues: NavigationIssue[];
  totalTime?: number;
  bounceRate?: boolean;
}

class NavigationTrackingService {
  private events: NavigationEvent[] = [];
  private issues: NavigationIssue[] = [];
  private currentFlow: NavigationFlow | null = null;
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `nav_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    this.currentFlow = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      events: [],
      issues: []
    };

    // Track initial page load
    this.trackNavigation(
      '(direct)',
      window.location.pathname,
      'route',
      null,
      window.location.search
    );
  }

  /**
   * Track a navigation event
   */
  trackNavigation(
    fromPath: string,
    toPath: string,
    method: NavigationEvent['navigationMethod'],
    routingState?: any,
    urlParams?: string,
    userId?: string
  ): void {
    const event: NavigationEvent = {
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId,
      fromPath,
      toPath,
      navigationMethod: method,
      routingState,
      urlParams,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.events.push(event);
    if (this.currentFlow) {
      this.currentFlow.events.push(event);
    }

    // Auto-detect issues
    this.detectNavigationIssues(event);

    // Log for debugging
    console.log('🧭 Navigation tracked:', {
      from: fromPath,
      to: toPath,
      method,
      hasState: !!routingState,
      params: urlParams
    });
  }

  /**
   * Track a navigation issue
   */
  trackIssue(
    type: NavigationIssue['type'],
    path: string,
    description: string,
    severity: NavigationIssue['severity'] = 'medium',
    additionalData?: any
  ): void {
    const issue: NavigationIssue = {
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      path,
      description,
      severity,
      userAgent: navigator.userAgent,
      additionalData
    };

    this.issues.push(issue);
    if (this.currentFlow) {
      this.currentFlow.issues.push(issue);
    }

    // Log critical issues immediately
    if (severity === 'critical' || severity === 'high') {
      console.error('🚨 Navigation Issue:', issue);
    } else {
      console.warn('⚠️ Navigation Issue:', issue);
    }
  }

  /**
   * Auto-detect common navigation issues
   */
  private detectNavigationIssues(event: NavigationEvent): void {
    const { fromPath, toPath, routingState, navigationMethod } = event;

    // Detect state loss
    if (toPath === '/play' && !routingState && navigationMethod === 'route') {
      this.trackIssue(
        'state_loss',
        toPath,
        'Navigation to /play without routing state - may cause context loss',
        'medium',
        { expectedState: 'gameType, trainingType, or campaign data' }
      );
    }

    // Detect rapid navigation (potential user confusion)
    const recentEvents = this.events.slice(-5);
    const rapidNavigation = recentEvents.filter(e => 
      Date.now() - e.timestamp < 2000 && e.fromPath !== e.toPath
    );
    
    if (rapidNavigation.length >= 4) {
      this.trackIssue(
        'routing_error',
        toPath,
        'Rapid navigation detected - user may be experiencing navigation issues',
        'low',
        { rapidEvents: rapidNavigation.length }
      );
    }

    // Detect back-and-forth navigation patterns
    if (this.events.length >= 2) {
      const lastEvent = this.events[this.events.length - 2];
      if (lastEvent.toPath === fromPath && lastEvent.fromPath === toPath) {
        this.trackIssue(
          'context_mismatch',
          toPath,
          'Back-and-forth navigation pattern detected',
          'low',
          { pattern: `${fromPath} ↔ ${toPath}` }
        );
      }
    }
  }

  /**
   * Track breadcrumb usage
   */
  trackBreadcrumbClick(fromPath: string, toPath: string, breadcrumbLabel: string): void {
    this.trackNavigation(fromPath, toPath, 'breadcrumb');
    
    console.log('🍞 Breadcrumb used:', {
      label: breadcrumbLabel,
      from: fromPath,
      to: toPath
    });
  }

  /**
   * Track tab changes within pages
   */
  trackTabChange(page: string, fromTab: string, toTab: string): void {
    const path = `${page}#${toTab}`;
    this.trackNavigation(`${page}#${fromTab}`, path, 'tab');
  }

  /**
   * Generate navigation analytics
   */
  getNavigationAnalytics(): {
    totalEvents: number;
    totalIssues: number;
    sessionDuration: number;
    popularRoutes: { path: string; count: number }[];
    issuesByType: Record<string, number>;
    navigationMethods: Record<string, number>;
  } {
    const now = Date.now();
    const routeCounts: Record<string, number> = {};
    const issueCounts: Record<string, number> = {};
    const methodCounts: Record<string, number> = {};

    // Count route popularity
    this.events.forEach(event => {
      routeCounts[event.toPath] = (routeCounts[event.toPath] || 0) + 1;
      methodCounts[event.navigationMethod] = (methodCounts[event.navigationMethod] || 0) + 1;
    });

    // Count issue types
    this.issues.forEach(issue => {
      issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
    });

    // Sort popular routes
    const popularRoutes = Object.entries(routeCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: this.events.length,
      totalIssues: this.issues.length,
      sessionDuration: now - this.startTime,
      popularRoutes,
      issuesByType: issueCounts,
      navigationMethods: methodCounts
    };
  }

  /**
   * Get current navigation context
   */
  getCurrentContext(): {
    currentPath: string;
    previousPath?: string;
    sessionId: string;
    issuesInSession: number;
    lastNavigationMethod?: string;
  } {
    const lastEvent = this.events[this.events.length - 1];
    const previousEvent = this.events[this.events.length - 2];

    return {
      currentPath: lastEvent?.toPath || window.location.pathname,
      previousPath: previousEvent?.toPath,
      sessionId: this.sessionId,
      issuesInSession: this.currentFlow?.issues.length || 0,
      lastNavigationMethod: lastEvent?.navigationMethod
    };
  }

  /**
   * Export navigation data for analysis
   */
  exportNavigationData(): {
    session: NavigationFlow | null;
    allEvents: NavigationEvent[];
    allIssues: NavigationIssue[];
    analytics: ReturnType<typeof this.getNavigationAnalytics>;
  } {
    return {
      session: this.currentFlow,
      allEvents: this.events,
      allIssues: this.issues,
      analytics: this.getNavigationAnalytics()
    };
  }

  /**
   * Reset tracking data
   */
  reset(): void {
    this.events = [];
    this.issues = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.initializeSession();
  }

  /**
   * Check for critical navigation issues
   */
  hasCriticalIssues(): boolean {
    return this.issues.some(issue => issue.severity === 'critical');
  }

  /**
   * Get issues for current session
   */
  getCurrentSessionIssues(): NavigationIssue[] {
    return this.currentFlow?.issues || [];
  }
}

// Create singleton instance
export const navigationTrackingService = new NavigationTrackingService();

// Enhanced hook for components to track navigation
export const useNavigationTracking = () => {
  const trackNavigation = (
    fromPath: string,
    toPath: string,
    method: NavigationEvent['navigationMethod'],
    routingState?: any
  ) => {
    navigationTrackingService.trackNavigation(fromPath, toPath, method, routingState);
  };

  const trackIssue = (
    type: NavigationIssue['type'],
    description: string,
    severity: NavigationIssue['severity'] = 'medium'
  ) => {
    navigationTrackingService.trackIssue(type, window.location.pathname, description, severity);
  };

  return {
    trackNavigation,
    trackIssue,
    getCurrentContext: () => navigationTrackingService.getCurrentContext(),
    getAnalytics: () => navigationTrackingService.getNavigationAnalytics(),
    hasCriticalIssues: () => navigationTrackingService.hasCriticalIssues()
  };
};

export default navigationTrackingService; 