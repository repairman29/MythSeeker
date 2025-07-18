// Test script for debugging the Sentient AI system
import { sentientAI } from './services/sentientAIService.js';

async function testSentientAI() {
    console.log('🧠 Testing Sentient AI System...');
    
    try {
        // Test basic functionality
        const testInput = "Ghost, did you hear something?";
        const testContext = {
            location: 'wasteland_ruins',
            situation: 'exploration',
            sessionType: 'automated_game',
            realm: 'Post-Apocalyptic'
        };
        
        console.log('📝 Input:', testInput);
        console.log('🌍 Context:', testContext);
        
        const result = await sentientAI.processSentientInput(
            'test-player-123',
            testInput,
            testContext
        );
        
        console.log('✅ Sentient AI Response:', result);
        console.log('💬 Response Content:', result.response);
        console.log('😊 Emotional Tone:', result.emotionalTone);
        console.log('🧠 Memory Updates:', result.memoryUpdates.length);
        console.log('❤️ Relationship Changes:', result.relationshipChanges);
        console.log('💡 Proactive Insights:', result.proactiveInsights);
        
    } catch (error) {
        console.error('❌ Sentient AI Test Failed:', error);
        console.error('📋 Error Details:', error.message);
        console.error('🔍 Stack Trace:', error.stack);
    }
}

// Test the AI service method directly
async function testAIService() {
    console.log('\n🤖 Testing AI Service...');
    
    try {
        const { aiService } = await import('./services/aiService.js');
        
        const testPrompt = `You are Ghost, a paranoid post-apocalyptic scavenger. 
        Respond to: "Did you hear something?" 
        Keep it short and in character.`;
        
        console.log('📝 Prompt:', testPrompt);
        
        const response = await aiService.complete(testPrompt);
        console.log('✅ AI Service Response:', response);
        
    } catch (error) {
        console.error('❌ AI Service Test Failed:', error);
        console.error('📋 Error Details:', error.message);
    }
}

// Test memory system
async function testMemorySystem() {
    console.log('\n🧠 Testing Memory System...');
    
    try {
        // Export and import player data
        const playerData = sentientAI.exportPlayerData('test-player-123');
        console.log('📤 Exported Player Data:', playerData);
        
        // Import the data back
        sentientAI.importPlayerData('test-player-456', playerData);
        console.log('📥 Successfully imported player data');
        
    } catch (error) {
        console.error('❌ Memory System Test Failed:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Sentient AI Diagnostic Tests...\n');
    
    await testAIService();
    await testSentientAI();
    await testMemorySystem();
    
    console.log('\n✅ All tests completed!');
}

// Export for use in other files
export { testSentientAI, testAIService, testMemorySystem, runAllTests };

// Run tests if this file is executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('test-sentient-ai')) {
    runAllTests().catch(console.error);
} 