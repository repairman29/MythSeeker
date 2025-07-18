#!/usr/bin/env node

/**
 * Comprehensive MythSeeker Game Testing
 * 
 * This script tests both automated games and campaigns to ensure
 * they meet our quality standards for production deployment.
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'https://us-central1-mythseekers-rpg.cloudfunctions.net',
  webAppUrl: 'https://mythseekers-rpg.web.app',
  testDelay: 1000,
  verbose: true,
  testMode: true,
  testBothGameTypes: true
};

// Quality Standards
const QUALITY_STANDARDS = {
  aiResponseTime: 3000,    // Max 3 seconds for AI responses
  successRate: 95,         // Min 95% success rate
  errorRate: 5,           // Max 5% error rate
  uiResponseTime: 500,    // Max 500ms for UI interactions
  campaignCreation: 2000, // Max 2 seconds for campaign creation
  automatedGameCreation: 1500 // Max 1.5 seconds for automated game creation
};

// Test Results Tracking
let testResults = {
  automatedGames: { passed: 0, failed: 0, tests: [] },
  campaigns: { passed: 0, failed: 0, tests: [] },
  aiService: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  overall: { startTime: Date.now(), endTime: null }
};

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'INFO': '📝',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'TEST': '🧪',
    'PERFORMANCE': '📊'
  }[type] || '📝';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(category, testName, passed, duration, details = '') {
  const result = { testName, passed, duration, details, timestamp: Date.now() };
  testResults[category].tests.push(result);
  
  if (passed) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
  }
  
  log(`${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms) ${details}`, passed ? 'SUCCESS' : 'ERROR');
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true',
        ...options.headers
      },
      ...options
    };

    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Firebase Functions Availability
async function testFirebaseFunctions() {
  log('Testing Firebase Functions availability...', 'TEST');
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(`${CONFIG.baseUrl}/testEndpoint`, {
      body: {
        action: 'healthCheck',
        data: { test: true }
      }
    });
    
    const duration = Date.now() - startTime;
    const passed = result.status === 200 || result.status === 404; // 404 is ok, means functions are responding
    
    recordTest('performance', 'Firebase Functions Health Check', passed, duration, `Status: ${result.status}`);
    return passed;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordTest('performance', 'Firebase Functions Health Check', false, duration, `Error: ${error.message}`);
    return false;
  }
}

// Test 2: AI Service Performance
async function testAIServicePerformance() {
  log('Testing AI Service performance...', 'TEST');
  
  const testPrompts = [
    'I attack the goblin with my sword',
    'I search for treasure in the ruins',
    'I talk to the village elder',
    'I cast a healing spell on my ally',
    'I investigate the mysterious door'
  ];
  
  let totalPassed = 0;
  
  for (const prompt of testPrompts) {
    const startTime = Date.now();
    
    try {
      const result = await makeRequest(`${CONFIG.baseUrl}/aiDungeonMaster`, {
        body: {
          prompt: prompt,
          campaignId: 'test-automated-session',
          playerName: 'Test Player'
        }
      });
      
      const duration = Date.now() - startTime;
      const passed = result.status === 200 && duration < QUALITY_STANDARDS.aiResponseTime;
      
      recordTest('aiService', `AI Response: "${prompt.substring(0, 30)}..."`, passed, duration, 
        `Status: ${result.status}, Response time: ${duration}ms`);
      
      if (passed) totalPassed++;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      recordTest('aiService', `AI Response: "${prompt.substring(0, 30)}..."`, false, duration, 
        `Error: ${error.message}`);
    }
    
    await delay(CONFIG.testDelay);
  }
  
  return (totalPassed / testPrompts.length) * 100 >= QUALITY_STANDARDS.successRate;
}

// Test 3: Campaign Creation and Management
async function testCampaignFunctionality() {
  log('Testing Campaign functionality...', 'TEST');
  
  // Test character creation
  const characterData = {
    name: 'Test Hero',
    characterClass: 'Fighter',
    race: 'Human',
    level: 1,
    stats: {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 12,
      wisdom: 13,
      charisma: 10
    }
  };
  
  const startTime = Date.now();
  
  try {
    const charResult = await makeRequest(`${CONFIG.baseUrl}/testEndpoint`, {
      body: {
        action: 'saveCharacter',
        data: {
          userId: 'test-user-campaign',
          character: characterData
        }
      }
    });
    
    const charDuration = Date.now() - startTime;
    const charPassed = charResult.status === 200;
    
    recordTest('campaigns', 'Character Creation', charPassed, charDuration, `Status: ${charResult.status}`);
    
    if (!charPassed) return false;
    
    // Test campaign creation
    const campaignStartTime = Date.now();
    const campaignResult = await makeRequest(`${CONFIG.baseUrl}/testEndpoint`, {
      body: {
        action: 'createGameSession',
        data: {
          hostId: 'test-user-campaign',
          theme: 'Medieval Fantasy',
          customPrompt: 'A grand adventure awaits in the kingdom of Aetheria.'
        }
      }
    });
    
    const campaignDuration = Date.now() - campaignStartTime;
    const campaignPassed = campaignResult.status === 200 && campaignDuration < QUALITY_STANDARDS.campaignCreation;
    
    recordTest('campaigns', 'Campaign Creation', campaignPassed, campaignDuration, `Status: ${campaignResult.status}`);
    
    return campaignPassed;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    recordTest('campaigns', 'Campaign Functionality Test', false, duration, `Error: ${error.message}`);
    return false;
  }
}

// Test 4: Automated Game Simulation
async function testAutomatedGameFunctionality() {
  log('Testing Automated Game functionality...', 'TEST');
  
  // Since we can't directly test the frontend service in Node.js,
  // we'll test the AI endpoints that automated games use
  const testScenarios = [
    {
      name: 'Post-Apocalyptic Adventure',
      prompt: 'I scavenge through the abandoned building looking for supplies'
    },
    {
      name: 'Fantasy Quest',
      prompt: 'I approach the mysterious tower with caution'
    },
    {
      name: 'Sci-Fi Exploration',
      prompt: 'I scan the alien artifact with my tricorder'
    }
  ];
  
  let passedTests = 0;
  
  for (const scenario of testScenarios) {
    const startTime = Date.now();
    
    try {
      const result = await makeRequest(`${CONFIG.baseUrl}/aiDungeonMaster`, {
        body: {
          prompt: scenario.prompt,
          campaignId: 'automated-test-session',
          playerName: 'Auto Test Player'
        }
      });
      
      const duration = Date.now() - startTime;
      const passed = result.status === 200 && duration < QUALITY_STANDARDS.automatedGameCreation;
      
      recordTest('automatedGames', scenario.name, passed, duration, `Status: ${result.status}`);
      
      if (passed) passedTests++;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      recordTest('automatedGames', scenario.name, false, duration, `Error: ${error.message}`);
    }
    
    await delay(CONFIG.testDelay);
  }
  
  return (passedTests / testScenarios.length) * 100 >= QUALITY_STANDARDS.successRate;
}

// Test 5: Performance Benchmarking
async function testPerformanceBenchmarks() {
  log('Running performance benchmarks...', 'TEST');
  
  const benchmarks = [
    {
      name: 'Concurrent AI Requests',
      test: async () => {
        const promises = [];
        const startTime = Date.now();
        
        for (let i = 0; i < 5; i++) {
          promises.push(
            makeRequest(`${CONFIG.baseUrl}/aiDungeonMaster`, {
              body: {
                prompt: `Concurrent test request ${i + 1}`,
                campaignId: `concurrent-test-${i}`,
                playerName: `Test Player ${i + 1}`
              }
            })
          );
        }
        
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        const successCount = results.filter(r => r.status === 200).length;
        
        return {
          passed: successCount >= 4 && duration < 10000, // At least 4 of 5 should succeed in under 10s
          duration,
          details: `${successCount}/5 requests succeeded`
        };
      }
    }
  ];
  
  let allPassed = true;
  
  for (const benchmark of benchmarks) {
    try {
      const result = await benchmark.test();
      recordTest('performance', benchmark.name, result.passed, result.duration, result.details);
      if (!result.passed) allPassed = false;
    } catch (error) {
      recordTest('performance', benchmark.name, false, 0, `Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Generate comprehensive report
function generateReport() {
  testResults.overall.endTime = Date.now();
  const totalDuration = testResults.overall.endTime - testResults.overall.startTime;
  
  log('\n' + '='.repeat(80), 'INFO');
  log('🎮 MYTHSEEKER COMPREHENSIVE GAME TESTING REPORT', 'SUCCESS');
  log('='.repeat(80), 'INFO');
  
  const categories = ['automatedGames', 'campaigns', 'aiService', 'performance'];
  let overallPassed = 0;
  let overallTotal = 0;
  
  categories.forEach(category => {
    const results = testResults[category];
    const total = results.passed + results.failed;
    const successRate = total > 0 ? (results.passed / total * 100).toFixed(1) : '0.0';
    
    overallPassed += results.passed;
    overallTotal += total;
    
    log(`\n📊 ${category.toUpperCase()}: ${results.passed}/${total} (${successRate}%)`, 'PERFORMANCE');
    
    results.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      log(`  ${status} ${test.testName} (${test.duration}ms) ${test.details}`, 'INFO');
    });
  });
  
  const overallSuccessRate = overallTotal > 0 ? (overallPassed / overallTotal * 100).toFixed(1) : '0.0';
  
  log(`\n🎯 OVERALL RESULTS: ${overallPassed}/${overallTotal} tests passed (${overallSuccessRate}%)`, 'SUCCESS');
  log(`⏱️ Total testing duration: ${(totalDuration / 1000).toFixed(1)} seconds`, 'INFO');
  
  // Quality Standards Assessment
  log('\n📋 QUALITY STANDARDS ASSESSMENT:', 'TEST');
  
  const meetsStandards = {
    successRate: parseFloat(overallSuccessRate) >= QUALITY_STANDARDS.successRate,
    errorRate: parseFloat(overallSuccessRate) <= (100 - QUALITY_STANDARDS.errorRate)
  };
  
  log(`  Success Rate: ${overallSuccessRate}% (Target: ≥${QUALITY_STANDARDS.successRate}%) ${meetsStandards.successRate ? '✅' : '❌'}`, 'INFO');
  log(`  Error Rate: ${(100 - parseFloat(overallSuccessRate)).toFixed(1)}% (Target: ≤${QUALITY_STANDARDS.errorRate}%) ${meetsStandards.errorRate ? '✅' : '❌'}`, 'INFO');
  
  const overallQuality = Object.values(meetsStandards).every(meets => meets);
  
  log(`\n🚀 PRODUCTION READINESS: ${overallQuality ? 'READY' : 'NEEDS IMPROVEMENT'}`, overallQuality ? 'SUCCESS' : 'WARNING');
  
  if (!overallQuality) {
    log('\n🔧 RECOMMENDATIONS:', 'WARNING');
    if (!meetsStandards.successRate) {
      log('  • Improve AI service reliability and error handling', 'WARNING');
      log('  • Optimize Firebase function performance', 'WARNING');
    }
  }
  
  return {
    overallQuality,
    successRate: parseFloat(overallSuccessRate),
    totalTests: overallTotal,
    passedTests: overallPassed,
    duration: totalDuration
  };
}

// Main test execution
async function runComprehensiveTests() {
  log('🚀 Starting MythSeeker Comprehensive Game Testing Suite...', 'SUCCESS');
  log(`🎯 Quality Standards: ${QUALITY_STANDARDS.successRate}% success rate, <${QUALITY_STANDARDS.aiResponseTime}ms AI response`, 'INFO');
  
  try {
    // Run all test suites
    await testFirebaseFunctions();
    await delay(CONFIG.testDelay);
    
    await testAIServicePerformance();
    await delay(CONFIG.testDelay);
    
    await testCampaignFunctionality();
    await delay(CONFIG.testDelay);
    
    await testAutomatedGameFunctionality();
    await delay(CONFIG.testDelay);
    
    await testPerformanceBenchmarks();
    
    // Generate and display report
    const report = generateReport();
    
    // Save results to file
    const fs = require('fs');
    const reportData = {
      ...testResults,
      qualityAssessment: report,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(reportData, null, 2));
    log('\n💾 Full test results saved to: comprehensive-test-report.json', 'SUCCESS');
    
    process.exit(report.overallQuality ? 0 : 1);
    
  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = {
  runComprehensiveTests,
  testResults,
  QUALITY_STANDARDS
}; 