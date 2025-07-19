// Dynamic Play Route Management Service

export interface PlayRouteConfig {
  sessionId?: string;
  gameType: 'training' | 'combat' | 'campaign' | 'solo-ai' | 'multiplayer';
  subType?: string; // trainingType, scenarioType, or campaignId
  params?: Record<string, string>;
  state?: any;
}

export interface ParsedPlayRoute {
  routeType: 'training' | 'combat' | 'campaign' | 'session' | 'selection';
  identifier?: string; // trainingType, scenarioType, campaignId, or sessionId
  sessionId?: string;
  gameType?: string;
  urlParams: URLSearchParams;
  routingState?: any;
}

class RoutingService {
  /**
   * Generate a dynamic play route URL
   */
  generatePlayRoute(config: PlayRouteConfig): string {
    const { gameType, subType, sessionId, params = {} } = config;
    
    let basePath = '/play';
    
    // Generate route based on game type
    switch (gameType) {
      case 'training':
        if (subType) {
          basePath = `/play/training/${subType}`;
        }
        break;
        
      case 'combat':
        if (subType) {
          basePath = `/play/combat/${subType}`;
        }
        break;
        
      case 'campaign':
        if (subType) {
          basePath = `/play/campaign/${subType}`;
        }
        break;
        
      default:
        if (sessionId) {
          basePath = `/play/${sessionId}`;
        }
        break;
    }
    
    // Add URL parameters
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      urlParams.set(key, value);
    });
    
    const queryString = urlParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }

  /**
   * Parse current location to extract play route information
   */
  parsePlayRoute(pathname: string, search: string, state?: any): ParsedPlayRoute {
    const urlParams = new URLSearchParams(search);
    const pathParts = pathname.split('/').filter(Boolean);
    
    // Default result
    const result: ParsedPlayRoute = {
      routeType: 'selection',
      urlParams,
      routingState: state
    };
    
    // Not a play route
    if (!pathname.startsWith('/play')) {
      return result;
    }
    
    // Base /play route
    if (pathParts.length === 1) {
      result.routeType = 'selection';
      return result;
    }
    
    // Dynamic routes
    if (pathParts.length >= 2) {
      const routeType = pathParts[1];
      
      switch (routeType) {
        case 'training':
          result.routeType = 'training';
          result.gameType = 'training';
          if (pathParts[2]) {
            result.identifier = pathParts[2]; // trainingType
          }
          break;
          
        case 'combat':
          result.routeType = 'combat';
          result.gameType = 'combat';
          if (pathParts[2]) {
            result.identifier = pathParts[2]; // scenarioType
          }
          break;
          
        case 'campaign':
          result.routeType = 'campaign';
          result.gameType = 'campaign';
          if (pathParts[2]) {
            result.identifier = pathParts[2]; // campaignId
          }
          break;
          
        default:
          // Generic session: /play/[sessionId]
          result.routeType = 'session';
          result.sessionId = routeType;
          result.gameType = state?.gameType || urlParams.get('gameType') || 'solo-ai';
          break;
      }
    }
    
    return result;
  }

  /**
   * Generate session-specific URL for sharing/bookmarking
   */
  generateSessionURL(sessionId: string, gameType: string, additionalParams?: Record<string, string>): string {
    const config: PlayRouteConfig = {
      sessionId,
      gameType: gameType as any,
      params: {
        sessionId,
        gameType,
        ...additionalParams
      }
    };
    
    return this.generatePlayRoute(config);
  }

  /**
   * Generate training session URL
   */
  generateTrainingURL(trainingType: string, additionalParams?: Record<string, string>): string {
    const config: PlayRouteConfig = {
      gameType: 'training',
      subType: trainingType,
      params: {
        gameType: 'training',
        trainingType,
        isTraining: 'true',
        ...additionalParams
      }
    };
    
    return this.generatePlayRoute(config);
  }

  /**
   * Generate combat scenario URL
   */
  generateCombatURL(scenarioType: string, additionalParams?: Record<string, string>): string {
    const config: PlayRouteConfig = {
      gameType: 'combat',
      subType: scenarioType,
      params: {
        gameType: 'combat',
        scenarioType,
        ...additionalParams
      }
    };
    
    return this.generatePlayRoute(config);
  }

  /**
   * Generate campaign session URL
   */
  generateCampaignURL(campaignId: string, additionalParams?: Record<string, string>): string {
    const config: PlayRouteConfig = {
      gameType: 'campaign',
      subType: campaignId,
      params: {
        gameType: 'campaign',
        campaignId,
        ...additionalParams
      }
    };
    
    return this.generatePlayRoute(config);
  }

  /**
   * Extract session information for debugging/tracking
   */
  getSessionContext(pathname: string, search: string, state?: any): {
    sessionType: string;
    sessionId: string;
    readableDescription: string;
    debugInfo: Record<string, any>;
  } {
    const parsed = this.parsePlayRoute(pathname, search, state);
    
    let sessionType = parsed.routeType;
    let sessionId = parsed.identifier || parsed.sessionId || 'unknown';
    let readableDescription = 'Unknown session';
    
    switch (parsed.routeType) {
      case 'training':
        sessionType = 'Training Session';
        readableDescription = `${parsed.identifier?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Training`;
        break;
        
      case 'combat':
        sessionType = 'Combat Scenario';
        readableDescription = `${parsed.identifier?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Combat`;
        break;
        
      case 'campaign':
        sessionType = 'Campaign Session';
        readableDescription = `Campaign ${parsed.identifier?.slice(0, 8)}`;
        break;
        
      case 'session':
        sessionType = 'Game Session';
        readableDescription = `${parsed.gameType?.charAt(0).toUpperCase()}${parsed.gameType?.slice(1)} Session`;
        break;
        
      default:
        sessionType = 'Game Selection';
        readableDescription = 'Game Selection Menu';
        sessionId = 'selection';
        break;
    }
    
    return {
      sessionType,
      sessionId,
      readableDescription,
      debugInfo: {
        pathname,
        search,
        parsed,
        hasState: !!state,
        urlParams: Object.fromEntries(parsed.urlParams.entries())
      }
    };
  }
}

// Export singleton instance
export const routingService = new RoutingService();

// Export route generation helpers
export const generateTrainingRoute = (trainingType: string, params?: Record<string, string>) => 
  routingService.generateTrainingURL(trainingType, params);

export const generateCombatRoute = (scenarioType: string, params?: Record<string, string>) => 
  routingService.generateCombatURL(scenarioType, params);

export const generateCampaignRoute = (campaignId: string, params?: Record<string, string>) => 
  routingService.generateCampaignURL(campaignId, params);

export const generateSessionRoute = (sessionId: string, gameType: string, params?: Record<string, string>) => 
  routingService.generateSessionURL(sessionId, gameType, params);

export default routingService; 