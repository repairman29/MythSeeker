/**
 * Microservice Integration Test
 * 
 * Tests the integration of all services in the MythSeeker architecture
 */

import { stateManagerService } from './stateManagerService';
import { toastService } from './toastService';
import { navigationService } from './navigationService';
import { analyticsService } from './analytics';
import { ServiceRegistry } from './index';

interface TestResult {
  serviceName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class IntegrationTester {
  private results: TestResult[] = [];
  
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting MythSeeker Microservice Integration Tests...');
    
    this.results = [];
    
    // Test individual services
    await this.testStateManagerService();
    await this.testToastService();
    await this.testNavigationService();
    await this.testAnalyticsService();
    
    // Test service interactions
    await this.testServiceInteractions();
    
    // Test service registry
    await this.testServiceRegistry();
    
    // Print results
    this.printResults();
    
    return this.results;
  }
  
  private async testStateManagerService(): Promise<void> {
    try {
      // Test basic state operations
      const initialState = stateManagerService.getState();
      
      if (initialState) {
        this.addResult('StateManager', 'pass', 'Initial state retrieved successfully');
      } else {
        this.addResult('StateManager', 'fail', 'Failed to retrieve initial state');
        return;
      }
      
      // Test state updates
      stateManagerService.setState({ isAuthenticated: true });
      const updatedState = stateManagerService.getState();
      
      if (updatedState.isAuthenticated) {
        this.addResult('StateManager', 'pass', 'State updates working correctly');
      } else {
        this.addResult('StateManager', 'fail', 'State updates not working');
      }
      
      // Test nested state updates
      stateManagerService.updateState('worldState.weather', 'sunny');
      const weatherState = stateManagerService.getStateSlice('worldState.weather');
      
      if (weatherState === 'sunny') {
        this.addResult('StateManager', 'pass', 'Nested state updates working');
      } else {
        this.addResult('StateManager', 'fail', 'Nested state updates not working');
      }
      
      // Test persistence
      const persistedKeys = [
        'currentUser', 'userCharacters', 'campaigns', 
        'worldState', 'aiMemory', 'achievements'
      ];
      
      let hasPersistence = true;
      persistedKeys.forEach(key => {
        if (!(key in initialState)) {
          hasPersistence = false;
        }
      });
      
      if (hasPersistence) {
        this.addResult('StateManager', 'pass', 'Persistence structure correct');
      } else {
        this.addResult('StateManager', 'warning', 'Some persistence keys missing');
      }
      
    } catch (error) {
      this.addResult('StateManager', 'fail', `Error testing state manager: ${error}`);
    }
  }
  
  private async testToastService(): Promise<void> {
    try {
      let toastReceived = false;
      let toastRemoved = false;
      
      // Set up callbacks to test notifications
      toastService.setCallbacks({
        onToastAdd: (toast) => {
          toastReceived = true;
          this.addResult('ToastService', 'pass', `Toast added: ${toast.message}`);
        },
        onToastRemove: (id) => {
          toastRemoved = true;
          this.addResult('ToastService', 'pass', `Toast removed: ${id}`);
        }
      });
      
      // Test adding toasts
      toastService.addToast('characterCreated');
      
      if (toastReceived) {
        this.addResult('ToastService', 'pass', 'Toast notifications working');
      } else {
        this.addResult('ToastService', 'fail', 'Toast notifications not working');
      }
      
      // Test toast methods
      toastService.success('Test success message');
      toastService.error('Test error message');
      toastService.info('Test info message');
      toastService.warning('Test warning message');
      
      const currentToasts = toastService.getToasts();
      if (currentToasts.length > 0) {
        this.addResult('ToastService', 'pass', `${currentToasts.length} toasts in queue`);
      } else {
        this.addResult('ToastService', 'warning', 'No toasts in queue after adding');
      }
      
      // Test dismissal
      toastService.dismissAllToasts();
      
      setTimeout(() => {
        const afterDismissal = toastService.getToasts();
        if (afterDismissal.length === 0) {
          this.addResult('ToastService', 'pass', 'Toast dismissal working');
        } else {
          this.addResult('ToastService', 'fail', 'Toast dismissal not working');
        }
      }, 100);
      
    } catch (error) {
      this.addResult('ToastService', 'fail', `Error testing toast service: ${error}`);
    }
  }
  
  private async testNavigationService(): Promise<void> {
    try {
      // Test route definitions
      const allRoutes = navigationService.getAllRoutes();
      
      if (allRoutes.length > 0) {
        this.addResult('NavigationService', 'pass', `${allRoutes.length} routes defined`);
      } else {
        this.addResult('NavigationService', 'fail', 'No routes defined');
        return;
      }
      
      // Test route categories
      const coreRoutes = navigationService.getRoutesByCategory('core');
      const gameRoutes = navigationService.getRoutesByCategory('game');
      const managementRoutes = navigationService.getRoutesByCategory('management');
      
      if (coreRoutes.length > 0 && gameRoutes.length > 0 && managementRoutes.length > 0) {
        this.addResult('NavigationService', 'pass', 'Route categories working');
      } else {
        this.addResult('NavigationService', 'warning', 'Some route categories missing');
      }
      
      // Test breadcrumb generation
      const breadcrumbs = navigationService.generateBreadcrumbs('/characters/create');
      
      if (breadcrumbs.length > 0) {
        this.addResult('NavigationService', 'pass', 'Breadcrumb generation working');
      } else {
        this.addResult('NavigationService', 'fail', 'Breadcrumb generation not working');
      }
      
      // Test authentication requirements
      const authRoutes = navigationService.getAuthenticatedRoutes();
      const publicRoutes = navigationService.getPublicRoutes();
      
      if (authRoutes.length > publicRoutes.length) {
        this.addResult('NavigationService', 'pass', 'Authentication routing configured');
      } else {
        this.addResult('NavigationService', 'warning', 'Most routes are public');
      }
      
    } catch (error) {
      this.addResult('NavigationService', 'fail', `Error testing navigation service: ${error}`);
    }
  }
  
  private async testAnalyticsService(): Promise<void> {
    try {
      // Test basic analytics functions
      const hasTrackMethods = [
        'trackPageView',
        'trackUserAction', 
        'trackGameEvent',
        'trackPerformance',
        'trackError'
      ].every(method => typeof analyticsService[method] === 'function');
      
      if (hasTrackMethods) {
        this.addResult('AnalyticsService', 'pass', 'Analytics methods available');
      } else {
        this.addResult('AnalyticsService', 'fail', 'Missing analytics methods');
      }
      
      // Test analytics tracking (non-intrusive)
      try {
        analyticsService.trackPageView('test-page', 'Integration Test');
        analyticsService.trackUserAction('test-action', { test: true });
        this.addResult('AnalyticsService', 'pass', 'Analytics tracking functional');
      } catch (error) {
        this.addResult('AnalyticsService', 'warning', 'Analytics tracking may have issues');
      }
      
    } catch (error) {
      this.addResult('AnalyticsService', 'fail', `Error testing analytics service: ${error}`);
    }
  }
  
  private async testServiceInteractions(): Promise<void> {
    try {
      // Test state manager + toast service interaction
      let notificationTriggered = false;
      
      toastService.setCallbacks({
        onToastAdd: () => {
          notificationTriggered = true;
        },
        onToastRemove: () => {}
      });
      
      // Simulate a state change that should trigger a notification
      stateManagerService.setState({ currentCampaign: { id: 'test', name: 'Test Campaign' } });
      toastService.addToast('campaignCreated');
      
      if (notificationTriggered) {
        this.addResult('ServiceInteraction', 'pass', 'State + Toast interaction working');
      } else {
        this.addResult('ServiceInteraction', 'warning', 'State + Toast interaction unclear');
      }
      
      // Test navigation + state manager interaction
      const currentNav = stateManagerService.getStateSlice('activeNav');
      navigationService.navigate('/dashboard');
      stateManagerService.setNavigation('dashboard');
      
      const updatedNav = stateManagerService.getStateSlice('activeNav');
      if (updatedNav === 'dashboard') {
        this.addResult('ServiceInteraction', 'pass', 'Navigation + State interaction working');
      } else {
        this.addResult('ServiceInteraction', 'fail', 'Navigation + State interaction not working');
      }
      
    } catch (error) {
      this.addResult('ServiceInteraction', 'fail', `Error testing service interactions: ${error}`);
    }
  }
  
  private async testServiceRegistry(): Promise<void> {
    try {
      const registry = ServiceRegistry.getInstance();
      
      if (registry) {
        this.addResult('ServiceRegistry', 'pass', 'Service registry singleton working');
      } else {
        this.addResult('ServiceRegistry', 'fail', 'Service registry not accessible');
        return;
      }
      
      // Test service registration (non-destructive)
      const testServiceName = 'testService';
      const testService = { name: testServiceName, initialize: () => Promise.resolve() };
      
      registry.register(testServiceName, testService);
      const retrieved = registry.get(testServiceName);
      
      if (retrieved && retrieved.name === testServiceName) {
        this.addResult('ServiceRegistry', 'pass', 'Service registration working');
      } else {
        this.addResult('ServiceRegistry', 'fail', 'Service registration not working');
      }
      
    } catch (error) {
      this.addResult('ServiceRegistry', 'fail', `Error testing service registry: ${error}`);
    }
  }
  
  private addResult(serviceName: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({
      serviceName,
      status,
      message,
      details
    });
  }
  
  private printResults(): void {
    console.log('\n🧪 MICROSERVICE INTEGRATION TEST RESULTS:');
    console.log('==========================================');
    
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} [${result.serviceName}] ${result.message}`);
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`📋 Total Tests: ${this.results.length}`);
    
    const successRate = ((passCount / this.results.length) * 100).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    if (failCount === 0) {
      console.log('\n🎉 ALL CORE SERVICES OPERATIONAL!');
      console.log('✨ MythSeeker microservice architecture is ready for production!');
    } else {
      console.log('\n⚠️  Some services need attention before production deployment.');
    }
  }
  
  // Quick health check method
  async healthCheck(): Promise<boolean> {
    const results = await this.runAllTests();
    const criticalFailures = results.filter(r => 
      r.status === 'fail' && 
      ['StateManager', 'NavigationService', 'ToastService'].includes(r.serviceName)
    );
    
    return criticalFailures.length === 0;
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester();

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Run tests after a delay to ensure services are initialized
  setTimeout(() => {
    integrationTester.runAllTests();
  }, 1000);
} 