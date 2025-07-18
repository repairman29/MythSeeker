// Browser-compatible debug script for Sentient AI
// Run this in the browser console to test and debug the AI system

import { sentientAI } from './services/sentientAIService';
import { aiService } from './services/aiService';

declare global {
  interface Window {
    debugSentientAI: any;
  }
}

// Simple test function for browser console
export async function testSentientAIInBrowser() {
  console.log('🧠 Starting Sentient AI Browser Test...');
  
  try {
    // Test the AI service first
    console.log('\n🤖 Testing base AI service...');
    const simplePrompt = "You are Ghost, a wasteland scavenger. Someone just asked 'Did you hear something?' Respond in character, brief and paranoid.";
    
    const aiResponse = await aiService.complete(simplePrompt);
    console.log('✅ Base AI Response:', aiResponse);
    
    // Test the sentient AI
    console.log('\n🧠 Testing sentient AI...');
    const testContext = {
      location: 'ruined_building',
      situation: 'exploration',
      sessionType: 'automated_game',
      realm: 'Post-Apocalyptic'
    };
    
    const sentientResult = await sentientAI.processSentientInput(
      'browser-test-user',
      'Ghost, did you hear something?',
      testContext
    );
    
    console.log('✅ Sentient AI Result:', sentientResult);
    console.log('💬 Response:', sentientResult.response);
    console.log('😊 Tone:', sentientResult.emotionalTone);
    console.log('🧠 Memories:', sentientResult.memoryUpdates.length);
    
    return { success: true, aiResponse, sentientResult };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Function to check what's happening with the automated game service
export async function debugAutomatedGameAI() {
  console.log('🎮 Debugging Automated Game AI...');
  
  try {
    // Import the automated game service
    const { automatedGameService } = await import('./services/automatedGameService');
    
    // Check if we can access the service
    console.log('📋 Automated Game Service:', automatedGameService);
    
    // Get all active sessions
    const sessions = automatedGameService.getAllSessions();
    console.log('🎯 Active Sessions:', sessions.length);
    
    if (sessions.length > 0) {
      const session = sessions[0];
      console.log('📊 First Session:', session);
      console.log('🤖 AI Party Members:', session.aiPartyMembers?.length || 0);
      
      if (session.aiPartyMembers && session.aiPartyMembers.length > 0) {
        console.log('👻 Ghost Details:', session.aiPartyMembers.find(m => m.name === 'Ghost'));
      }
    }
    
    return { success: true, sessions };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Function to manually trigger Ghost response
export async function manualGhostTest() {
  console.log('👻 Manual Ghost Test...');
  
  try {
    const { automatedGameService } = await import('./services/automatedGameService');
    const sessions = automatedGameService.getAllSessions();
    
    if (sessions.length === 0) {
      console.log('❌ No active sessions found. Create an automated game first.');
      return { success: false, error: 'No sessions' };
    }
    
    const session = sessions[0];
    const ghost = session.aiPartyMembers?.find(m => m.name === 'Ghost');
    
    if (!ghost) {
      console.log('❌ Ghost not found in session');
      return { success: false, error: 'Ghost not found' };
    }
    
    console.log('👻 Found Ghost:', ghost);
    
    // Manually test the AI response generation
    const testInput = "Did you hear something?";
    console.log('📝 Testing with input:', testInput);
    
    // This would normally be called internally
    // We'll need to access the private method for testing
    console.log('⚠️ Note: This test requires accessing private methods');
    
    return { success: true, ghost, session };
    
  } catch (error) {
    console.error('❌ Manual test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.debugSentientAI = {
    testSentientAI: testSentientAIInBrowser,
    debugAutomatedGame: debugAutomatedGameAI,
    manualGhostTest: manualGhostTest,
    // Helper to check if services are loaded
    checkServices: () => {
      console.log('🔍 Checking service availability...');
      console.log('sentientAI:', typeof sentientAI);
      console.log('aiService:', typeof aiService);
      return { sentientAI: typeof sentientAI, aiService: typeof aiService };
    }
  };
  
  console.log('🎯 Debug tools loaded! Use window.debugSentientAI in console:');
  console.log('- window.debugSentientAI.testSentientAI()');
  console.log('- window.debugSentientAI.debugAutomatedGame()');
  console.log('- window.debugSentientAI.manualGhostTest()');
  console.log('- window.debugSentientAI.checkServices()');
} 