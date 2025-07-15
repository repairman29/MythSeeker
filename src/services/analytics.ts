import { getAnalytics, logEvent, setUserId, setUserProperties, Analytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

// Firebase configuration for mythseekers-rpg project
const firebaseConfig = {
  apiKey: "AIzaSyAVJvau3Hit06q1pNYCTOF-pVuutmk4oNQ",
  authDomain: "mythseekers-rpg.firebaseapp.com",
  databaseURL: "https://mythseekers-rpg-default-rtdb.firebaseio.com",
  projectId: "mythseekers-rpg",
  storageBucket: "mythseekers-rpg.firebasestorage.app",
  messagingSenderId: "659018227506",
  appId: "1:659018227506:web:82425e7adaf80c2e3c412b",
  measurementId: "G-E3T1V81ZX3"
};

// Initialize Firebase for analytics
const app = initializeApp(firebaseConfig);

// Analytics service for tracking user behavior and performance
class AnalyticsService {
  private analytics: Analytics | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics() {
    try {
      if (typeof window !== 'undefined' && app) {
        this.analytics = getAnalytics(app);
        this.isInitialized = true;
        console.log('Analytics initialized successfully');
      }
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  // Set user ID for tracking
  setUserId(userId: string) {
    if (this.analytics && this.isInitialized) {
      try {
        setUserId(this.analytics, userId);
      } catch (error) {
        console.warn('Failed to set user ID:', error);
      }
    }
  }

  // Set user properties
  setUserProperties(properties: Record<string, string>) {
    if (this.analytics && this.isInitialized) {
      try {
        setUserProperties(this.analytics, properties);
      } catch (error) {
        console.warn('Failed to set user properties:', error);
      }
    }
  }

  // Track page views
  trackPageView(pageName: string, pageTitle?: string) {
    this.logEvent('page_view', {
      page_name: pageName,
      page_title: pageTitle || pageName,
      timestamp: Date.now()
    });
  }

  // Track user actions
  trackUserAction(action: string, parameters?: Record<string, any>) {
    this.logEvent('user_action', {
      action,
      ...parameters,
      timestamp: Date.now()
    });
  }

  // Track game events
  trackGameEvent(event: string, parameters?: Record<string, any>) {
    this.logEvent('game_event', {
      event,
      ...parameters,
      timestamp: Date.now()
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, parameters?: Record<string, any>) {
    this.logEvent('performance', {
      metric,
      value,
      ...parameters,
      timestamp: Date.now()
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    this.logEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context,
      timestamp: Date.now()
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, parameters?: Record<string, any>) {
    this.logEvent('feature_usage', {
      feature,
      action,
      ...parameters,
      timestamp: Date.now()
    });
  }

  // Track conversion events
  trackConversion(conversionType: string, value?: number, currency?: string) {
    this.logEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency: currency || 'USD',
      timestamp: Date.now()
    });
  }

  // Track engagement metrics
  trackEngagement(metric: string, value: number, parameters?: Record<string, any>) {
    this.logEvent('engagement', {
      metric,
      value,
      ...parameters,
      timestamp: Date.now()
    });
  }

  // Track custom events
  logEvent(eventName: string, parameters?: Record<string, any>) {
    if (this.analytics && this.isInitialized) {
      try {
        logEvent(this.analytics, eventName, parameters);
      } catch (error) {
        console.warn(`Failed to log event ${eventName}:`, error);
      }
    }
  }

  // Track Core Web Vitals
  trackCoreWebVitals(metric: 'CLS' | 'FID' | 'LCP', value: number) {
    this.trackPerformance(`web_vital_${metric.toLowerCase()}`, value);
  }

  // Track bundle load performance
  trackBundleLoad(bundleName: string, loadTime: number, size: number) {
    this.trackPerformance('bundle_load', loadTime, {
      bundle_name: bundleName,
      bundle_size: size
    });
  }

  // Track API performance
  trackAPIPerformance(endpoint: string, responseTime: number, status: number) {
    this.trackPerformance('api_response_time', responseTime, {
      endpoint,
      status_code: status
    });
  }

  // Track user onboarding
  trackOnboardingStep(step: string, completed: boolean, timeSpent?: number) {
    this.trackUserAction('onboarding_step', {
      step,
      completed,
      time_spent: timeSpent
    });
  }

  // Track character creation
  trackCharacterCreation(characterClass: string, timeSpent: number) {
    this.trackGameEvent('character_created', {
      character_class: characterClass,
      time_spent: timeSpent
    });
  }

  // Track campaign events
  trackCampaignEvent(event: string, campaignId: string, parameters?: Record<string, any>) {
    this.trackGameEvent(event, {
      campaign_id: campaignId,
      ...parameters
    });
  }

  // Track combat events
  trackCombatEvent(event: string, parameters?: Record<string, any>) {
    this.trackGameEvent(`combat_${event}`, parameters);
  }

  // Track AI interactions
  trackAIInteraction(interactionType: string, responseTime: number, success: boolean) {
    this.trackPerformance('ai_response_time', responseTime, {
      interaction_type: interactionType,
      success
    });
  }

  // Track multiplayer events
  trackMultiplayerEvent(event: string, parameters?: Record<string, any>) {
    this.trackGameEvent(`multiplayer_${event}`, parameters);
  }

  // Track accessibility usage
  trackAccessibilityUsage(feature: string, enabled: boolean) {
    this.trackFeatureUsage('accessibility', feature, {
      enabled
    });
  }

  // Track device and browser info
  trackDeviceInfo() {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      const screenResolution = `${screen.width}x${screen.height}`;
      const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
      
      this.setUserProperties({
        device_type: this.getDeviceType(),
        browser: this.getBrowserInfo(),
        screen_resolution: screenResolution,
        viewport_size: viewportSize,
        user_agent: userAgent.substring(0, 100) // Truncate to avoid size limits
      });
    }
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private getBrowserInfo(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'other';
  }

  // Track session start
  trackSessionStart() {
    this.trackUserAction('session_start', {
      session_id: this.generateSessionId(),
      referrer: document.referrer || 'direct'
    });
  }

  // Track session end
  trackSessionEnd(duration: number) {
    this.trackUserAction('session_end', {
      session_duration: duration
    });
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Track user preferences
  trackUserPreference(preference: string, value: any) {
    this.trackUserAction('preference_changed', {
      preference,
      value: String(value)
    });
  }

  // Track search events
  trackSearch(query: string, results: number) {
    this.trackUserAction('search', {
      query: query.substring(0, 50), // Truncate to avoid size limits
      results_count: results
    });
  }

  // Track help usage
  trackHelpUsage(helpTopic: string, action: string) {
    this.trackFeatureUsage('help', action, {
      topic: helpTopic
    });
  }

  // Track tutorial completion
  trackTutorialCompletion(tutorialName: string, completed: boolean, stepsCompleted: number) {
    this.trackUserAction('tutorial_completion', {
      tutorial_name: tutorialName,
      completed,
      steps_completed: stepsCompleted
    });
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// Export individual tracking functions for convenience
export const {
  trackPageView,
  trackUserAction,
  trackGameEvent,
  trackPerformance,
  trackError,
  trackFeatureUsage,
  trackConversion,
  trackEngagement,
  trackCoreWebVitals,
  trackBundleLoad,
  trackAPIPerformance,
  trackOnboardingStep,
  trackCharacterCreation,
  trackCampaignEvent,
  trackCombatEvent,
  trackAIInteraction,
  trackMultiplayerEvent,
  trackAccessibilityUsage,
  trackDeviceInfo,
  trackSessionStart,
  trackSessionEnd,
  trackUserPreference,
  trackSearch,
  trackHelpUsage,
  trackTutorialCompletion
} = analyticsService; 