#!/usr/bin/env node

/**
 * MythSeeker Mock Game Simulation
 * 
 * This script simulates a complete gameplay session by calling the backend APIs
 * in sequence, mimicking real user behavior. It helps identify:
 * - Missing API endpoints
 * - Performance bottlenecks
 * - Data flow issues
 * - Multiplayer synchronization problems
 * 
 * Usage: node scripts/mock-game-simulation.js
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'https://us-central1-mythseekers-rpg.cloudfunctions.net',
  // baseUrl: 'http://localhost:5001/mythseekers-rpg/us-central1', // For local testing
  simulationDelay: 1000, // ms between actions
  numPlayers: 3,
  testCampaign: true,
  testCombat: true,
  testMultiplayer: true,
  verbose: true,
  // For testing, we'll use a test mode that bypasses auth
  testMode: true
};

// Test data
const TEST_DATA = {
  users: [
    {
      uid: 'test-user-1',
      displayName: 'TestPlayer1',
      email: 'test1@mythseeker.com',
      character: {
        id: 'char-1',
        name: 'Aria the Warrior',
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
      }
    },
    {
      uid: 'test-user-2', 
      displayName: 'TestPlayer2',
      email: 'test2@mythseeker.com',
      character: {
        id: 'char-2',
        name: 'Zara the Mage',
        class: 'Mage',
        level: 1,
        experience: 0,
        health: 80,
        maxHealth: 80,
        mana: 100,
        maxMana: 100,
        gold: 100,
        inventory: { 'Mana Potion': 3 },
        equipment: { weapon: 'Basic Staff', armor: 'Mage Robes' },
        stats: { strength: 8, dexterity: 14, intelligence: 18, charisma: 12 },
        skills: {},
        achievements: [],
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        totalPlayTime: 0
      }
    },
    {
      uid: 'test-user-3',
      displayName: 'TestPlayer3', 
      email: 'test3@mythseeker.com',
      character: {
        id: 'char-3',
        name: 'Thorin the Ranger',
        class: 'Ranger',
        level: 1,
        experience: 0,
        health: 90,
        maxHealth: 90,
        mana: 60,
        maxMana: 60,
        gold: 100,
        inventory: { 'Arrows': 20 },
        equipment: { weapon: 'War Bow', armor: 'Leather Armor' },
        stats: { strength: 12, dexterity: 16, intelligence: 12, charisma: 10 },
        skills: {},
        achievements: [],
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        totalPlayTime: 0
      }
    }
  ],
  campaign: {
    theme: 'Classic Fantasy',
    description: 'A test campaign for simulation',
    customPrompt: 'You are a wise and experienced DM running a classic fantasy adventure.',
    code: 'TEST123'
  }
};

// Utility functions
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type}]`;
  console.log(`${prefix} ${message}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
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

// API wrapper functions - Updated for Firebase Functions
class MythSeekerAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Firebase Functions use a specific format for callable functions
  async callFunction(functionName, data = {}) {
    const url = `${this.baseUrl}/testEndpoint`;
    log(`Calling Firebase Function: ${functionName}`, 'API');
    
    return makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true'
      },
      body: {
        action: functionName,
        data: data
      }
    });
  }

  async saveCharacter(userId, characterData) {
    log(`Saving character for user ${userId}`, 'API');
    return this.callFunction('saveCharacter', {
      userId,
      ...characterData
    });
  }

  async getUserCharacters(userId) {
    log(`Getting characters for user ${userId}`, 'API');
    return this.callFunction('getUserCharacters', { userId });
  }

  async createGameSession(hostId, theme, customPrompt) {
    log(`Creating game session with host ${hostId}`, 'API');
    return this.callFunction('createGameSession', {
      hostId,
      theme,
      customPrompt,
      code: TEST_DATA.campaign.code
    });
  }

  async joinGameSession(joinCode, playerId, characterId) {
    log(`Player ${playerId} joining session with code ${joinCode}`, 'API');
    return this.callFunction('joinGameSession', {
      code: joinCode,
      characterId,
      playerId
    });
  }

  async startGameSession(gameId) {
    log(`Starting game session ${gameId}`, 'API');
    return this.callFunction('startGameSession', { gameId });
  }

  async saveGameProgress(gameId, gameState) {
    log(`Saving game progress for session ${gameId}`, 'API');
    return this.callFunction('saveGameProgress', { gameId, gameState });
  }

  async aiDungeonMaster(gameId, playerInput, context = {}) {
    log(`AI DM processing input: "${playerInput.substring(0, 50)}..."`, 'API');
    return this.callFunction('aiDungeonMaster', {
      gameId,
      playerInput,
      context
    });
  }

  async getUserGameHistory(userId) {
    log(`Getting game history for user ${userId}`, 'API');
    return this.callFunction('getUserGameHistory', { userId });
  }

  async completeCampaign(gameId, finalState) {
    log(`Completing campaign ${gameId}`, 'API');
    return this.callFunction('completeCampaign', { gameId, finalState });
  }
}

// Simulation scenarios
class GameSimulation {
  constructor(api) {
    this.api = api;
    this.results = {
      success: 0,
      errors: 0,
      performance: [],
      gaps: []
    };
  }

  async runFullSimulation() {
    log('🚀 Starting MythSeeker Mock Game Simulation', 'SIMULATION');
    log(`Testing with ${TEST_DATA.users.length} players`, 'SIMULATION');
    log(`Test Mode: ${CONFIG.testMode ? 'ENABLED' : 'DISABLED'}`, 'CONFIG');
    
    try {
      // Phase 1: Character Creation
      await this.simulateCharacterCreation();
      
      // Phase 2: Campaign Setup
      const campaignData = await this.simulateCampaignSetup();
      
      // Phase 3: Gameplay Session
      await this.simulateGameplaySession(campaignData);
      
      // Phase 4: Combat Testing (if available)
      if (CONFIG.testCombat) {
        await this.simulateCombat(campaignData);
      }
      
      // Phase 5: Multiplayer Testing
      if (CONFIG.testMultiplayer) {
        await this.simulateMultiplayerInteraction(campaignData);
      }
      
      // Phase 6: Campaign Completion
      await this.simulateCampaignCompletion(campaignData);
      
      // Phase 7: Performance Analysis
      await this.analyzePerformance();
      
    } catch (error) {
      log(`Simulation failed: ${error.message}`, 'ERROR');
      this.results.errors++;
    }
    
    this.printResults();
  }

  async simulateCharacterCreation() {
    log('📝 Phase 1: Character Creation', 'PHASE');
    
    for (const user of TEST_DATA.users) {
      const startTime = Date.now();
      
      try {
        // Save character
        const saveResult = await this.api.saveCharacter(user.uid, user.character);
        if (saveResult.status !== 200) {
          throw new Error(`Failed to save character: ${saveResult.status} - ${JSON.stringify(saveResult.data)}`);
        }
        
        // Verify character was saved
        const getResult = await this.api.getUserCharacters(user.uid);
        if (getResult.status !== 200) {
          throw new Error(`Failed to get characters: ${getResult.status}`);
        }
        
        const duration = Date.now() - startTime;
        this.results.performance.push({
          action: 'character_creation',
          user: user.uid,
          duration,
          success: true
        });
        
        log(`✅ Character created for ${user.displayName} (${duration}ms)`, 'SUCCESS');
        this.results.success++;
        
      } catch (error) {
        log(`❌ Character creation failed for ${user.displayName}: ${error.message}`, 'ERROR');
        this.results.errors++;
        this.results.gaps.push({
          type: 'character_creation',
          user: user.uid,
          error: error.message
        });
      }
      
      await delay(CONFIG.simulationDelay);
    }
  }

  async simulateCampaignSetup() {
    log('🎮 Phase 2: Campaign Setup', 'PHASE');
    
    const hostUser = TEST_DATA.users[0];
    const startTime = Date.now();
    
    try {
      // Create game session
      const createResult = await this.api.createGameSession(
        hostUser.uid,
        TEST_DATA.campaign.theme,
        TEST_DATA.campaign.customPrompt
      );
      
      if (createResult.status !== 200) {
        throw new Error(`Failed to create game session: ${createResult.status} - ${JSON.stringify(createResult.data)}`);
      }
      
      const gameId = createResult.data.result?.gameId || 'test-game-id';
      const joinCode = createResult.data.result?.code || TEST_DATA.campaign.code;
      
      log(`✅ Campaign created: ${gameId} (Code: ${joinCode})`, 'SUCCESS');
      
      // Other players join the session
      for (let i = 1; i < TEST_DATA.users.length; i++) {
        const user = TEST_DATA.users[i];
        const joinResult = await this.api.joinGameSession(joinCode, user.uid, user.character.id);
        
        if (joinResult.status !== 200) {
          log(`⚠️ Failed to join session for ${user.displayName}: ${joinResult.status}`, 'WARNING');
        } else {
          log(`✅ ${user.displayName} joined the campaign`, 'SUCCESS');
        }
        await delay(CONFIG.simulationDelay);
      }
      
      // Start the game session
      const startResult = await this.api.startGameSession(gameId);
      if (startResult.status !== 200) {
        log(`⚠️ Failed to start game session: ${startResult.status}`, 'WARNING');
      } else {
        log(`✅ Campaign started successfully`, 'SUCCESS');
      }
      
      const duration = Date.now() - startTime;
      this.results.performance.push({
        action: 'campaign_setup',
        duration,
        success: true
      });
      
      this.results.success++;
      
      return { gameId, joinCode, hostUser };
      
    } catch (error) {
      log(`❌ Campaign setup failed: ${error.message}`, 'ERROR');
      this.results.errors++;
      this.results.gaps.push({
        type: 'campaign_setup',
        error: error.message
      });
      throw error;
    }
  }

  async simulateGameplaySession(campaignData) {
    log('🎭 Phase 3: Gameplay Session', 'PHASE');
    
    const { gameId } = campaignData;
    const gameplayActions = [
      "I want to explore the ancient ruins we discovered.",
      "Can I check for traps before we proceed?",
      "I cast Detect Magic to see if there's anything magical here.",
      "Let's search for hidden passages.",
      "I'll try to pick the lock on this door."
    ];
    
    for (let i = 0; i < gameplayActions.length; i++) {
      const action = gameplayActions[i];
      const player = TEST_DATA.users[i % TEST_DATA.users.length];
      const startTime = Date.now();
      
      try {
        const result = await this.api.aiDungeonMaster(gameId, action, {
          playerId: player.uid,
          characterName: player.character.name
        });
        
        if (result.status !== 200) {
          log(`⚠️ AI DM failed for action "${action.substring(0, 30)}...": ${result.status}`, 'WARNING');
        } else {
          const duration = Date.now() - startTime;
          this.results.performance.push({
            action: 'ai_dm_response',
            player: player.uid,
            duration,
            success: true
          });
          
          log(`✅ AI DM responded to "${action.substring(0, 30)}..." (${duration}ms)`, 'SUCCESS');
          this.results.success++;
        }
        
        // Save game progress periodically
        if (i % 2 === 0) {
          try {
            await this.api.saveGameProgress(gameId, {
              turn: i + 1,
              lastAction: action,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            log(`⚠️ Failed to save game progress: ${error.message}`, 'WARNING');
          }
        }
        
      } catch (error) {
        log(`❌ Gameplay action failed: ${error.message}`, 'ERROR');
        this.results.errors++;
        this.results.gaps.push({
          type: 'gameplay_action',
          player: player.uid,
          action,
          error: error.message
        });
      }
      
      await delay(CONFIG.simulationDelay);
    }
  }

  async simulateCombat(campaignData) {
    log('⚔️ Phase 4: Combat Testing', 'PHASE');
    
    // Note: This is a placeholder since combat API doesn't exist yet
    log('⚠️ Combat API not implemented yet - adding to gaps', 'WARNING');
    this.results.gaps.push({
      type: 'combat_system',
      description: 'No combat API endpoints found',
      needed: ['startCombat', 'resolveCombatAction', 'getCombatState']
    });
  }

  async simulateMultiplayerInteraction(campaignData) {
    log('👥 Phase 5: Multiplayer Interaction', 'PHASE');
    
    // Test real-time features (placeholder)
    log('⚠️ Multiplayer real-time features not fully implemented', 'WARNING');
    this.results.gaps.push({
      type: 'multiplayer_realtime',
      description: 'Real-time multiplayer features need WebSocket/Realtime DB integration',
      needed: ['player_presence', 'live_chat', 'shared_state_sync']
    });
  }

  async simulateCampaignCompletion(campaignData) {
    log('🏁 Phase 6: Campaign Completion', 'PHASE');
    
    const { gameId } = campaignData;
    const startTime = Date.now();
    
    try {
      const result = await this.api.completeCampaign(gameId, {
        completedAt: new Date().toISOString(),
        finalScore: 100,
        achievements: ['first_campaign', 'team_player']
      });
      
      if (result.status !== 200) {
        log(`⚠️ Failed to complete campaign: ${result.status}`, 'WARNING');
      } else {
        const duration = Date.now() - startTime;
        this.results.performance.push({
          action: 'campaign_completion',
          duration,
          success: true
        });
        
        log(`✅ Campaign completed successfully (${duration}ms)`, 'SUCCESS');
        this.results.success++;
      }
      
    } catch (error) {
      log(`❌ Campaign completion failed: ${error.message}`, 'ERROR');
      this.results.errors++;
      this.results.gaps.push({
        type: 'campaign_completion',
        error: error.message
      });
    }
  }

  async analyzePerformance() {
    log('📊 Phase 7: Performance Analysis', 'PHASE');
    
    if (this.results.performance.length === 0) {
      log('No performance data to analyze', 'WARNING');
      return;
    }
    
    const avgResponseTime = this.results.performance.reduce((sum, p) => sum + p.duration, 0) / this.results.performance.length;
    const maxResponseTime = Math.max(...this.results.performance.map(p => p.duration));
    const minResponseTime = Math.min(...this.results.performance.map(p => p.duration));
    
    log(`📈 Performance Summary:`, 'ANALYSIS');
    log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`, 'ANALYSIS');
    log(`   Fastest Response: ${minResponseTime}ms`, 'ANALYSIS');
    log(`   Slowest Response: ${maxResponseTime}ms`, 'ANALYSIS');
    log(`   Total Actions: ${this.results.performance.length}`, 'ANALYSIS');
    
    // Identify slow endpoints
    const slowEndpoints = this.results.performance.filter(p => p.duration > 1000);
    if (slowEndpoints.length > 0) {
      log(`⚠️ Slow endpoints detected:`, 'WARNING');
      slowEndpoints.forEach(p => {
        log(`   ${p.action}: ${p.duration}ms`, 'WARNING');
      });
    }
  }

  printResults() {
    log('🎯 Simulation Results', 'RESULTS');
    log('=' * 50, 'RESULTS');
    
    log(`✅ Successful Actions: ${this.results.success}`, 'RESULTS');
    log(`❌ Failed Actions: ${this.results.errors}`, 'RESULTS');
    const totalActions = this.results.success + this.results.errors;
    const successRate = totalActions > 0 ? ((this.results.success / totalActions) * 100).toFixed(1) : '0.0';
    log(`📊 Success Rate: ${successRate}%`, 'RESULTS');
    
    if (this.results.gaps.length > 0) {
      log('\n🔍 Identified Gaps:', 'GAPS');
      this.results.gaps.forEach((gap, index) => {
        log(`${index + 1}. ${gap.type}: ${gap.description || gap.error}`, 'GAPS');
        if (gap.needed) {
          gap.needed.forEach(need => log(`   - Need: ${need}`, 'GAPS'));
        }
      });
    }
    
    log('\n🚀 Recommendations:', 'RECOMMENDATIONS');
    if (this.results.gaps.some(g => g.type === 'combat_system')) {
      log('1. Implement combat system backend API', 'RECOMMENDATIONS');
    }
    if (this.results.gaps.some(g => g.type === 'multiplayer_realtime')) {
      log('2. Add WebSocket/Realtime DB for multiplayer', 'RECOMMENDATIONS');
    }
    if (this.results.performance.some(p => p.duration > 1000)) {
      log('3. Optimize slow API endpoints', 'RECOMMENDATIONS');
    }
    
    log('\n🎮 MythSeeker is ready for the next phase!', 'SUCCESS');
  }
}

// Main execution
async function main() {
  const api = new MythSeekerAPI(CONFIG.baseUrl);
  const simulation = new GameSimulation(api);
  
  log('🎮 MythSeeker Mock Game Simulation Starting...', 'STARTUP');
  log(`Base URL: ${CONFIG.baseUrl}`, 'CONFIG');
  log(`Simulation Delay: ${CONFIG.simulationDelay}ms`, 'CONFIG');
  log(`Test Players: ${TEST_DATA.users.length}`, 'CONFIG');
  
  await simulation.runFullSimulation();
}

// Run the simulation
if (require.main === module) {
  main().catch(error => {
    log(`Simulation crashed: ${error.message}`, 'CRITICAL');
    process.exit(1);
  });
}

module.exports = { MythSeekerAPI, GameSimulation, TEST_DATA, CONFIG }; 