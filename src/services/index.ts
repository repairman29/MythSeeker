// Centralized Service Exports for MythSeeker Microservice Architecture

// Authentication & User Management
export { authService } from './authService';
export { userProfileService } from './userProfileService';

// Game Core Services
export { gameStateService } from './gameStateService';
export { campaignService } from './campaignService';
export { characterService } from './characterService';
export { automatedGameService } from './automatedGameService';

// AI & Content Services
export { aiService } from './aiService';
export { dynamicDMService } from './dynamicDMService';
export { chatService } from './chatService';
export { npcService } from './npcService';

// Game Mechanics Services
export { combatService } from './combatService';
export { diceService } from './diceService';
export { questService } from './questService';
export { achievementService } from './achievementService';

// Communication & Multiplayer
export { multiplayerService } from './multiplayerService';
export { realtimeService } from './realtimeService';

// System Services
export { analyticsService } from './analytics';
export { performanceService } from './performanceService';
export { rulesEngine } from './rulesEngine';

// UI & UX Services
export { navigationService } from './navigationService';
export { toastService } from './toastService';
export { stateManagerService } from './stateManagerService';

// Service Types
export type {
  ServiceConfig,
  ServiceStatus,
  ServiceEvent,
  ServiceResponse
} from './types';

// Service Registry for dependency injection and service discovery
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();
  private dependencies: Map<string, string[]> = new Map();

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  register<T>(name: string, service: T, deps: string[] = []): void {
    this.services.set(name, service);
    this.dependencies.set(name, deps);
  }

  get<T>(name: string): T {
    return this.services.get(name);
  }

  async initialize(): Promise<void> {
    // Initialize services in dependency order
    const initOrder = this.resolveDependencies();
    
    for (const serviceName of initOrder) {
      const service = this.services.get(serviceName);
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
      }
    }
  }

  private resolveDependencies(): string[] {
    // Simple topological sort for dependency resolution
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) return;
      visited.add(serviceName);

      const deps = this.dependencies.get(serviceName) || [];
      for (const dep of deps) {
        visit(dep);
      }
      
      result.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }

    return result;
  }
}

// Initialize all services
export const initializeServices = async (): Promise<void> => {
  const registry = ServiceRegistry.getInstance();
  
  // Register all services with their dependencies
  registry.register('analytics', analyticsService, []);
  registry.register('performance', performanceService, ['analytics']);
  registry.register('auth', authService, ['analytics']);
  registry.register('userProfile', userProfileService, ['auth']);
  registry.register('gameState', gameStateService, ['auth', 'analytics']);
  registry.register('character', characterService, ['auth', 'gameState']);
  registry.register('campaign', campaignService, ['auth', 'character']);
  registry.register('ai', aiService, ['analytics']);
  registry.register('chat', chatService, ['ai', 'gameState']);
  registry.register('combat', combatService, ['gameState', 'character']);
  registry.register('multiplayer', multiplayerService, ['auth', 'gameState']);
  registry.register('navigation', navigationService, ['auth']);
  registry.register('toast', toastService, []);
  registry.register('stateManager', stateManagerService, []);

  // Initialize all services
  await registry.initialize();
}; 