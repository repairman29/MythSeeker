#!/usr/bin/env node

/**
 * Debug Character Creation Script
 * 
 * This script focuses specifically on debugging the character creation issue
 * that's causing 500 errors in the simulation.
 */

const https = require('https');

const CONFIG = {
  baseUrl: 'https://us-central1-mythseekers-rpg.cloudfunctions.net',
  testMode: true
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = https;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testAPI(action, data = {}) {
  const url = `${CONFIG.baseUrl}/testEndpoint`;
  console.log(`🔍 Testing: ${action}`);
  console.log(`📤 Data:`, JSON.stringify(data, null, 2));
  
  const result = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Mode': 'true'
    },
    body: {
      action: action,
      data: data
    }
  });
  
  console.log(`📥 Status: ${result.status}`);
  console.log(`📥 Response:`, JSON.stringify(result.data, null, 2));
  console.log('---');
  
  return result;
}

async function debugCharacterCreation() {
  console.log('🔍 Debugging Character Creation...\n');
  
  // Test 1: Save character
  console.log('🧪 Test 1: Save Character');
  const saveResult = await testAPI('saveCharacter', {
    userId: 'test-user-1',
    name: 'Debug Warrior',
    class: 'Warrior',
    level: 1,
    experience: 0,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    gold: 100,
    inventory: { 'Healing Potion': 3 },
    equipment: { weapon: 'Iron Sword', armor: 'Leather Armor' },
    stats: { strength: 16, dexterity: 12, intelligence: 10, charisma: 14 },
    skills: {},
    achievements: [],
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    totalPlayTime: 0
  });
  
  if (saveResult.status !== 200) {
    console.log('❌ Save character failed');
    return;
  }
  
  const characterId = saveResult.data.result?.characterId;
  console.log(`✅ Character saved with ID: ${characterId}\n`);
  
  // Test 2: Get user characters
  console.log('🧪 Test 2: Get User Characters');
  const getResult = await testAPI('getUserCharacters', {
    userId: 'test-user-1'
  });
  
  if (getResult.status !== 200) {
    console.log('❌ Get user characters failed');
    console.log('🔍 This is the issue causing the 500 error in simulation');
    return;
  }
  
  console.log('✅ Get user characters successful');
  console.log(`📊 Found ${getResult.data.result?.length || 0} characters`);
  
  // Test 3: Try with different user ID
  console.log('\n🧪 Test 3: Test with different user ID');
  const getResult2 = await testAPI('getUserCharacters', {
    userId: 'test-user-999'
  });
  
  console.log(`📊 User 999 has ${getResult2.data.result?.length || 0} characters`);
  
  // Test 4: Check Firestore directly (if possible)
  console.log('\n🧪 Test 4: Check if characters exist in database');
  console.log('🔍 This would require checking Firestore directly...');
}

async function main() {
  try {
    await debugCharacterCreation();
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

if (require.main === module) {
  main();
} 