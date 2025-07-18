#!/usr/bin/env node

/**
 * MythSeeker AI Service Test
 * Validates that all permissions and secrets are properly configured
 */

import https from 'https';

const FUNCTION_URL = 'https://us-central1-mythseekers-rpg.cloudfunctions.net/aiDungeonMaster';

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

console.log('🧪 Testing MythSeeker AI Service Setup...\n');

const postData = JSON.stringify(testData);

const options = {
  hostname: 'us-central1-mythseekers-rpg.cloudfunctions.net',
  port: 443,
  path: '/aiDungeonMaster',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('\n✅ AI Service Test Results:');
      console.log('==========================');
      
      if (res.statusCode === 200) {
        console.log('🎉 Status: SUCCESS');
        console.log(`📝 Response Length: ${response.response?.length || 0} characters`);
        console.log(`🤖 Response Preview: ${(response.response || '').substring(0, 100)}...`);
        
        // Check for success indicators
        if (response.response) {
          console.log('✅ AI response received successfully');
          
          // Check if it's a fallback response
          if (response.response.includes('PLACEHOLDER') || response.response.length < 50) {
            console.log('⚠️  Using fallback responses (placeholder API keys detected)');
            console.log('💡 Add real API keys for premium AI quality');
          } else {
            console.log('🚀 Premium AI service active!');
          }
        }
      } else {
        console.log('❌ Status: ERROR');
        console.log(`🔍 Error Details: ${JSON.stringify(response, null, 2)}`);
      }
      
    } catch (error) {
      console.log('❌ Failed to parse response:', error.message);
      console.log('📄 Raw response:', data);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`• Service Reachable: ${res.statusCode < 500 ? '✅' : '❌'}`);
    console.log(`• Authentication: ${res.statusCode !== 401 && res.statusCode !== 403 ? '✅' : '❌'}`);
    console.log(`• Function Execution: ${res.statusCode === 200 ? '✅' : '❌'}`);
    console.log(`• AI Response Generated: ${data.includes('"response"') ? '✅' : '❌'}`);
    
    console.log('\n🚀 Next Steps:');
    console.log('==============');
    if (res.statusCode === 200) {
      console.log('• ✅ Service is working correctly');
      console.log('• 🔑 Add real API keys for premium AI quality');
      console.log('• 🎮 Test the full game experience');
    } else {
      console.log('• 🔧 Check Firebase function logs for details');
      console.log('• 🔍 Verify service account permissions');
      console.log('• 📞 Contact support if issues persist');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('===================');
  console.log('• Check internet connection');
  console.log('• Verify Firebase project is deployed');
  console.log('• Run: firebase functions:log --only aiDungeonMaster');
});

req.write(postData);
req.end();

console.log('⏳ Sending test request to AI service...');
console.log(`🎯 Target: ${FUNCTION_URL}`);
console.log(`📦 Payload: ${postData.length} bytes\n`); 