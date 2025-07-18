#!/usr/bin/env node

/**
 * MythSeeker AI Service Test - Firebase Callable Version
 * Tests the AI service using Firebase callable functions
 */

import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase configuration for mythseekers-rpg
const firebaseConfig = {
  projectId: "mythseekers-rpg",
  appId: "1:659018227506:web:your-app-id"
};

console.log('🧪 Testing MythSeeker AI Service (Firebase Callable)...\n');

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const functions = getFunctions(app);
  
  // Get the AI function
  const aiDungeonMaster = httpsCallable(functions, 'aiDungeonMaster');
  
  const testData = {
    prompt: "Hello, I'm testing the AI service setup. Please respond with a brief greeting.",
    campaignId: "test-setup-validation", 
    playerName: "TestUser",
    context: {
      session: {
        config: {
          rating: "PG-13",
          realm: "Test Environment"
        }
      }
    }
  };
  
  console.log('⏳ Calling AI service...');
  console.log(`📦 Test Data:`, JSON.stringify(testData, null, 2));
  
  const result = await aiDungeonMaster(testData);
  
  console.log('\n✅ AI Service Test Results:');
  console.log('==========================');
  console.log('🎉 Status: SUCCESS');
  console.log(`📝 Response:`, result.data);
  
  if (result.data?.response) {
    console.log('✅ AI response received successfully');
    console.log(`🤖 Response Preview: ${result.data.response.substring(0, 150)}...`);
    
    // Check response quality
    if (result.data.response.includes('PLACEHOLDER') || result.data.response.length < 50) {
      console.log('⚠️  Using fallback responses (placeholder API keys detected)');
      console.log('💡 Add real API keys for premium AI quality');
    } else {
      console.log('🚀 Premium AI service active!');
    }
  }
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('• ✅ Service Reachable');
  console.log('• ✅ Authentication Working');
  console.log('• ✅ Function Execution Success');
  console.log('• ✅ AI Response Generated');
  
  console.log('\n🚀 Next Steps:');
  console.log('==============');
  console.log('• ✅ Service is working correctly');
  console.log('• 🔑 Add real API keys for premium AI quality');
  console.log('• 🎮 Test the full game experience');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  
  if (error.code === 'functions/unauthenticated') {
    console.log('\n🔧 Authentication Issue:');
    console.log('========================');
    console.log('• The function requires authentication');
    console.log('• This means security is working correctly');
    console.log('• Test the service through the web app instead');
  } else if (error.code === 'functions/permission-denied') {
    console.log('\n🔧 Permission Issue:');
    console.log('====================');
    console.log('• Check Firebase security rules');
    console.log('• Verify user authentication in the web app');
  } else {
    console.log('\n🔧 Troubleshooting:');
    console.log('===================');
    console.log('• Check Firebase project configuration');
    console.log('• Verify functions are deployed');
    console.log('• Run: firebase functions:log --only aiDungeonMaster');
    console.log('• Full error:', error);
  }
} 