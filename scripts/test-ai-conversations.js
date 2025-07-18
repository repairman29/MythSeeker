#!/usr/bin/env node

/**
 * MythSeeker AI Conversation Testing Script
 * 
 * This script simulates an automated game session to showcase:
 * - AI-to-AI conversations and relationship building
 * - Ghost's real AI responses as a post-apocalyptic scavenger
 * - Dynamic party interactions and emotional support
 * - Environmental reactions and proactive conversations
 * - Multi-tier AI system (Vertex AI → OpenAI → intelligent fallbacks)
 * 
 * Usage: node scripts/test-ai-conversations.js
 */

import { AutomatedGameService } from '../src/services/automatedGameService.js';
import { sentientAI } from '../src/services/sentientAIService.js';

// Test Configuration
const TEST_CONFIG = {
  sessionDuration: 300000, // 5 minutes of simulation
  playerInputInterval: 15000, // Player input every 15 seconds
  logDetailLevel: 'detailed', // 'summary' | 'detailed' | 'verbose'
  saveToFile: true,
  outputFile: 'ai-conversation-test-results.json'
};

// Test scenarios to demonstrate AI capabilities
const TEST_SCENARIOS = [
  {
    name: 'Post-Apocalyptic Ghost Adventure',
    config: {
      realm: 'Post-Apocalyptic',
      theme: 'Survival Horror',
      dmStyle: 'atmospheric',
      rating: 'PG-13',
      maxPlayers: 4
    },
    playerInputs: [
      "Ghost, let's check out these ruins",
      "I heard something moving behind us",
      "We should find supplies before dark",
      "Ghost, tell me about your past",
      "This place gives me the creeps",
      "Let's rest here for a moment",
      "Do you think other survivors are nearby?",
      "I'm feeling overwhelmed by all this",
      "We make a good team",
      "What's your opinion on our situation?"
    ]
  },
  {
    name: 'Fantasy Party Adventure',
    config: {
      realm: 'Fantasy',
      theme: 'Heroic Adventure',
      dmStyle: 'balanced',
      rating: 'PG',
      maxPlayers: 4
    },
    playerInputs: [
      "What do you think of this ancient temple?",
      "I sense magic in the air",
      "Let's discuss our strategy",
      "Anyone know about these symbols?",
      "We should be careful here",
      "Great job on that last fight!",
      "I'm not sure we should trust that NPC",
      "Tell me about your homeland",
      "This quest is harder than expected",
      "We've come so far together"
    ]
  }
];

class AIConversationTester {
  constructor() {
    this.automatedGameService = new AutomatedGameService();
    this.testResults = [];
    this.currentSessionId = null;
    this.startTime = Date.now();
  }

  async runComprehensiveTest() {
    console.log('🎮 Starting MythSeeker AI Conversation Test Suite...\n');
    console.log('🤖 Testing Features:');
    console.log('  ✓ Real AI integration (Vertex AI → OpenAI → Intelligent fallbacks)');
    console.log('  ✓ AI-to-AI conversations and relationship building');
    console.log('  ✓ Ghost\'s character-specific responses');
    console.log('  ✓ Emotional support and environmental reactions');
    console.log('  ✓ Proactive conversations and dynamic interactions\n');

    for (const scenario of TEST_SCENARIOS) {
      console.log(`🎭 Testing Scenario: ${scenario.name}`);
      console.log(`⚙️ Config: ${JSON.stringify(scenario.config, null, 2)}\n`);
      
      const scenarioResults = await this.testScenario(scenario);
      this.testResults.push(scenarioResults);
      
      console.log(`✅ Scenario "${scenario.name}" completed\n`);
      console.log('='.repeat(60) + '\n');
    }

    // Generate comprehensive report
    await this.generateReport();
    console.log('📊 Test suite completed! Results saved to file.');
  }

  async testScenario(scenario) {
    const results = {
      scenarioName: scenario.name,
      config: scenario.config,
      startTime: Date.now(),
      messages: [],
      aiInteractions: {
        aiToAi: [],
        supportive: [],
        environmental: [],
        proactive: []
      },
      relationshipChanges: [],
      errors: [],
      endTime: null,
      summary: {}
    };

    try {
      // Create automated session
      console.log('🏗️ Creating automated session...');
      this.currentSessionId = await this.automatedGameService.createAutomatedSession(scenario.config);
      console.log(`✅ Session created: ${this.currentSessionId}`);

      // Add test player
      const testPlayer = {
        id: 'test-player-001',
        name: 'Test Player',
        experience: 'intermediate',
        preferences: ['story', 'exploration'],
        joinTime: Date.now()
      };

      await this.automatedGameService.addPlayerToSession(this.currentSessionId, testPlayer);
      console.log('👤 Test player added to session');

      // Get session details
      const session = this.automatedGameService.getSession(this.currentSessionId);
      console.log(`🤖 AI Party Members: ${session.aiPartyMembers.map(m => `${m.name} (${m.characterClass})`).join(', ')}`);

      // Simulate player inputs with AI responses
      for (let i = 0; i < scenario.playerInputs.length; i++) {
        const input = scenario.playerInputs[i];
        console.log(`\n💬 Player Input ${i + 1}/${scenario.playerInputs.length}: "${input}"`);
        
        const beforeMessages = session.messages.length;
        
        // Process player input and get AI responses
        const response = await this.automatedGameService.processPlayerInput(
          this.currentSessionId,
          testPlayer.id,
          input
        );

        const afterMessages = session.messages.length;
        const newMessages = session.messages.slice(beforeMessages);
        
        // Log and categorize new messages
        newMessages.forEach(msg => {
          const logEntry = {
            timestamp: msg.timestamp,
            sender: msg.sender || 'DM',
            content: msg.content,
            type: msg.metadata?.conversationType || msg.type,
            metadata: msg.metadata
          };
          
          results.messages.push(logEntry);
          
          // Categorize AI interactions
          if (msg.metadata?.conversationType === 'ai_to_ai') {
            results.aiInteractions.aiToAi.push(logEntry);
            console.log(`  🤖➡️🤖 AI-to-AI: ${msg.sender}: "${msg.content}"`);
          } else if (msg.metadata?.messageType === 'emotional_support') {
            results.aiInteractions.supportive.push(logEntry);
            console.log(`  ❤️ Support: ${msg.sender}: "${msg.content}"`);
          } else if (msg.metadata?.messageType === 'environmental_reaction') {
            results.aiInteractions.environmental.push(logEntry);
            console.log(`  🌍 Environmental: ${msg.sender}: "${msg.content}"`);
          } else if (msg.metadata?.messageType === 'proactive_conversation') {
            results.aiInteractions.proactive.push(logEntry);
            console.log(`  💭 Proactive: ${msg.sender}: "${msg.content}"`);
          } else if (msg.sender && msg.sender !== 'Test Player') {
            console.log(`  🤖 ${msg.sender}: "${msg.content}"`);
          } else {
            console.log(`  🎭 DM: "${msg.content}"`);
          }
        });

        // Track relationship changes
        this.trackRelationshipChanges(session, results);

        // Wait before next input (simulate realistic timing)
        if (i < scenario.playerInputs.length - 1) {
          await this.delay(3000); // 3 second delay between inputs
        }
      }

      // Final relationship analysis
      this.analyzeRelationships(session, results);

    } catch (error) {
      console.error(`❌ Error in scenario "${scenario.name}":`, error);
      results.errors.push({
        timestamp: Date.now(),
        error: error.message,
        stack: error.stack
      });
    }

    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
    results.summary = this.generateScenarioSummary(results);
    
    return results;
  }

  trackRelationshipChanges(session, results) {
    if (!session.aiPartyMembers) return;

    session.aiPartyMembers.forEach(member => {
      if (member.relationships && member.relationships.size > 0) {
        member.relationships.forEach((score, otherId) => {
          const existing = results.relationshipChanges.find(
            r => r.from === member.id && r.to === otherId
          );
          
          if (existing) {
            existing.currentScore = score;
            existing.change = score - existing.initialScore;
          } else {
            results.relationshipChanges.push({
              from: member.id,
              fromName: member.name,
              to: otherId,
              toName: this.getCharacterName(session, otherId),
              initialScore: score,
              currentScore: score,
              change: 0
            });
          }
        });
      }
    });
  }

  analyzeRelationships(session, results) {
    console.log('\n🤝 Final Relationship Analysis:');
    results.relationshipChanges.forEach(rel => {
      if (rel.change !== 0) {
        const emoji = rel.change > 0 ? '📈' : '📉';
        console.log(`  ${emoji} ${rel.fromName} → ${rel.toName}: ${rel.change > 0 ? '+' : ''}${rel.change} (${rel.currentScore})`);
      }
    });
  }

  getCharacterName(session, id) {
    const member = session.aiPartyMembers.find(m => m.id === id);
    return member ? member.name : id;
  }

  generateScenarioSummary(results) {
    return {
      totalMessages: results.messages.length,
      aiToAiConversations: results.aiInteractions.aiToAi.length,
      supportiveInteractions: results.aiInteractions.supportive.length,
      environmentalReactions: results.aiInteractions.environmental.length,
      proactiveConversations: results.aiInteractions.proactive.length,
      relationshipEvolution: results.relationshipChanges.filter(r => r.change !== 0).length,
      averageResponseTime: results.duration / results.messages.length,
      errorCount: results.errors.length,
      successRate: ((results.messages.length - results.errors.length) / results.messages.length * 100).toFixed(1) + '%'
    };
  }

  async generateReport() {
    const report = {
      testSuite: 'MythSeeker AI Conversation Test',
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      scenarios: this.testResults,
      overallSummary: this.generateOverallSummary(),
      recommendations: this.generateRecommendations()
    };

    if (TEST_CONFIG.saveToFile) {
      const fs = await import('fs').then(m => m.promises);
      await fs.writeFile(
        TEST_CONFIG.outputFile,
        JSON.stringify(report, null, 2),
        'utf8'
      );
    }

    // Display summary
    console.log('\n📊 OVERALL TEST RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total Scenarios: ${this.testResults.length}`);
    console.log(`Total Messages Generated: ${report.overallSummary.totalMessages}`);
    console.log(`AI-to-AI Conversations: ${report.overallSummary.totalAiToAi}`);
    console.log(`Supportive Interactions: ${report.overallSummary.totalSupport}`);
    console.log(`Proactive Conversations: ${report.overallSummary.totalProactive}`);
    console.log(`Relationship Changes: ${report.overallSummary.totalRelationshipChanges}`);
    console.log(`Overall Success Rate: ${report.overallSummary.averageSuccessRate}%`);
    console.log(`Average Response Time: ${report.overallSummary.averageResponseTime}ms`);
    
    console.log('\n💡 Key Insights:');
    report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    
    return report;
  }

  generateOverallSummary() {
    const totals = this.testResults.reduce((acc, result) => {
      acc.totalMessages += result.summary.totalMessages;
      acc.totalAiToAi += result.summary.aiToAiConversations;
      acc.totalSupport += result.summary.supportiveInteractions;
      acc.totalProactive += result.summary.proactiveConversations;
      acc.totalRelationshipChanges += result.summary.relationshipEvolution;
      acc.totalErrors += result.summary.errorCount;
      acc.totalDuration += result.duration;
      return acc;
    }, {
      totalMessages: 0,
      totalAiToAi: 0,
      totalSupport: 0,
      totalProactive: 0,
      totalRelationshipChanges: 0,
      totalErrors: 0,
      totalDuration: 0
    });

    return {
      ...totals,
      averageSuccessRate: ((totals.totalMessages - totals.totalErrors) / totals.totalMessages * 100).toFixed(1) + '%',
      averageResponseTime: Math.round(totals.totalDuration / totals.totalMessages)
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateOverallSummary();
    
    if (summary.totalAiToAi > 0) {
      recommendations.push('AI-to-AI conversations are working! Characters are building relationships.');
    }
    
    if (summary.totalSupport > 0) {
      recommendations.push('Emotional support system is active - AI members respond to player needs.');
    }
    
    if (summary.totalProactive > 0) {
      recommendations.push('Proactive conversations keep the party engaged during quiet moments.');
    }
    
    if (summary.totalRelationshipChanges > 0) {
      recommendations.push('Relationship dynamics are evolving based on interactions.');
    }
    
    if (parseFloat(summary.averageSuccessRate) > 90) {
      recommendations.push('Excellent AI response success rate - system is highly reliable.');
    }
    
    if (summary.averageResponseTime < 5000) {
      recommendations.push('Fast response times provide smooth conversational flow.');
    }
    
    return recommendations;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test suite
async function main() {
  try {
    const tester = new AIConversationTester();
    await tester.runComprehensiveTest();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AIConversationTester }; 