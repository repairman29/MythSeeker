import { Quest, QuestObjective, QuestReward } from '../types/quest';
import { aiService } from './aiService';

export interface QuestBranch {
  id: string;
  condition: string;
  nextQuests: string[];
  consequences: QuestConsequence[];
}

export interface QuestConsequence {
  type: 'reputation' | 'faction' | 'world' | 'character' | 'unlock';
  target: string;
  value: number | string | boolean;
  description: string;
}

export interface DynamicQuestTemplate {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'weekly' | 'faction';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';
  level: number;
  objectives: QuestObjectiveTemplate[];
  rewards: QuestRewardTemplate;
  branches: QuestBranch[];
  prerequisites: string[];
  timeLimit?: number;
  location?: string;
  giver?: string;
  theme?: string;
  tags: string[];
}

export interface QuestObjectiveTemplate {
  type: 'kill' | 'collect' | 'explore' | 'talk' | 'craft' | 'deliver' | 'custom';
  description: string;
  target?: string;
  quantity?: number;
  location?: string;
  npcId?: string;
  itemId?: string;
  customCondition?: string;
  branching?: {
    success: string[];
    failure: string[];
  };
}

export interface QuestRewardTemplate {
  experience: number;
  gold: number;
  items: Array<{
    id: string;
    quantity: number;
    chance: number;
  }>;
  reputation?: Record<string, number>;
  unlocks?: string[];
  customRewards?: Array<{
    type: string;
    value: any;
    description: string;
  }>;
}

export interface AIQuestContext {
  playerLevel: number;
  playerLocation: string;
  playerReputation: Record<string, number>;
  playerActions: Array<{
    type: string;
    target: string;
    timestamp: number;
    outcome: 'success' | 'failure' | 'partial';
  }>;
  worldState: any;
  npcInteractions: Array<{
    npcId: string;
    relationship: number;
    lastInteraction: number;
    topics: string[]}>;
  recentEvents: Array<{
    type: string;
    description: string;
    impact: number;
    timestamp: number;
  }>;
  availableResources: string[];
  currentThreats: string[];
  factionRelations: Record<string, number>;
}

export interface AIGeneratedQuest {
  quest: Quest;
  reasoning: string;
  relevance: number;
  complexity: number;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  potentialOutcomes: Array<{
    condition: string;
    consequences: QuestConsequence[];
    probability: number;
  }>;
}

export class QuestService {
  private questTemplates: Map<string, DynamicQuestTemplate> = new Map();
  private activeQuests: Map<string, Quest> = new Map();
  private questHistory: Quest[] = [];
  private worldState: any = {};
  private aiQuestCache: Map<string, AIGeneratedQuest> = new Map();
  private lastQuestGeneration: number = 0;
  private questGenerationCooldown: number = 30000;

  constructor() {
    this.initializeQuestTemplates();
  }

  private initializeQuestTemplates() {
    // Main Story Quests
    this.addQuestTemplate({
      id: 'main_ancient_seals',
      title: 'The Weakening Seals',
      description: 'Ancient magical seals are failing, threatening the entire region. Investigate the source and find a way to restore them.',
      type: 'main',
      difficulty: 'epic',
      level: 5,
      objectives: [
        {
          type: 'explore',
          description: 'Investigate the ancient seal locations',
          target: 'seal_locations',
          quantity: 3,
          location: 'ancient_ruins'
        },
        {
          type: 'collect',
          description: 'Gather seal restoration materials',
          target: 'seal_materials',
          quantity: 5
        },
        {
          type: 'talk',
          description: 'Consult with the ancient guardians',
          target: 'guardians',
          quantity: 2,
          location: 'guardian_temple'
        }
      ],
      rewards: {
        experience: 1000,
        gold: 500,
        items: [
          { id: 'seal_restorer', quantity: 1, chance: 100 },
          { id: 'ancient_knowledge', quantity: 1, chance: 75 }
        ],
        reputation: { 'Ancient_Order': 50 },
        unlocks: ['guardian_abilities', 'seal_magic']
      },
      branches: [
        {
          id: 'seal_success',
          condition: 'all_objectives_completed',
          nextQuests: ['main_seal_restoration', 'side_guardian_alliance'],
          consequences: [
            {
              type: 'world',
              target: 'seal_stability',
              value: 50,
              description: 'The ancient seals are partially restored, stabilizing the region'
            },
            {
              type: 'reputation',
              target: 'Ancient_Order',
              value: 25,
              description: 'The Ancient Order recognizes your contribution'
            }
          ]
        },
        {
          id: 'seal_failure',
          condition: 'quest_failed',
          nextQuests: ['main_seal_crisis', 'side_emergency_measures'],
          consequences: [
            {
              type: 'world',
              target: 'seal_stability',
              value: -25,
              description: 'The seals continue to weaken, causing increased instability'
            },
            {
              type: 'reputation',
              target: 'Ancient_Order',
              value: -10,
              description: 'The Ancient Order is disappointed with the failure'
            }
          ]
        }
      ],
      prerequisites: [],
      location: 'ancient_ruins',
      giver: 'Captain_Thorne',
      theme: 'fantasy',
      tags: ['main_story', 'magic', 'ancient', 'urgent']
    });

    // Dynamic Side Quests
    this.addQuestTemplate({
      id: 'side_merchant_trouble',
      title: 'Merchant\'s Dilemma',
      description: 'A local merchant is having trouble with bandits. Help them secure their trade route.',
      type: 'side',
      difficulty: 'medium',
      level: 3,
      objectives: [
        {
          type: 'kill',
          description: 'Defeat bandits on the trade route',
          target: 'bandits',
          quantity: 5,
          location: 'trade_route'
        },
        {
          type: 'deliver',
          description: 'Escort merchant goods safely',
          target: 'merchant_goods',
          quantity: 1,
          location: 'market'
        }
      ],
      rewards: {
        experience: 300,
        gold: 150,
        items: [
          { id: 'merchant_discount', quantity: 1, chance: 100 },
          { id: 'quality_weapon', quantity: 1, chance: 30 }
        ],
        reputation: { 'Merchant_Guild': 20 }
      },
      branches: [
        {
          id: 'merchant_success',
          condition: 'all_objectives_completed',
          nextQuests: ['side_merchant_expansion', 'side_bandit_hunt'],
          consequences: [
            {
              type: 'world',
              target: 'trade_route_safety',
              value: 30,
              description: 'The trade route is now safer for merchants'
            }
          ]
        }
      ],
      prerequisites: [],
      location: 'market',
      giver: 'Merchant_Alina',
      theme: 'fantasy',
      tags: ['side_quest', 'combat', 'escort', 'merchant']
    });

    // Faction Quests
    this.addQuestTemplate({
      id: 'faction_mage_guild',
      title: 'Arcane Research',
      description: 'The Mage Guild needs help with dangerous magical research.',
      type: 'faction',
      difficulty: 'hard',
      level: 7,
      objectives: [
        {
          type: 'collect',
          description: 'Gather rare magical components',
          target: 'magical_components',
          quantity: 3
        },
        {
          type: 'craft',
          description: 'Assist in creating a powerful artifact',
          target: 'artifact_creation',
          quantity: 1,
          location: 'mage_tower'
        }
      ],
      rewards: {
        experience: 800,
        gold: 400,
        items: [
          { id: 'mage_staff', quantity: 1, chance: 100 },
          { id: 'spell_scroll', quantity: 2, chance: 60 }
        ],
        reputation: { 'Mage_Guild': 40 },
        unlocks: ['advanced_magic', 'guild_membership']
      },
      branches: [
        {
          id: 'research_success',
          condition: 'all_objectives_completed',
          nextQuests: ['faction_mage_mastery', 'faction_artifact_quest'],
          consequences: [
            {
              type: 'faction',
              target: 'Mage_Guild',
              value: 25,
              description: 'The Mage Guild gains significant magical knowledge'
            }
          ]
        }
      ],
      prerequisites: ['side_merchant_trouble'],
      location: 'mage_tower',
      giver: 'Archmage_Zara',
      theme: 'fantasy',
      tags: ['faction', 'magic', 'research', 'crafting']
    });
  }

  private addQuestTemplate(template: DynamicQuestTemplate) {
    this.questTemplates.set(template.id, template);
  }

  // Generate dynamic quest based on world state and player actions
  public generateDynamicQuest(
    playerLevel: number,
    playerLocation: string,
    playerReputation: Record<string, number>,
    worldState: any,
    recentActions: any[]
  ): Quest | null {
    const availableTemplates = this.getAvailableQuestTemplates(
      playerLevel,
      playerLocation,
      playerReputation,
      worldState
    );

    if (availableTemplates.length === 0) return null;

    // Select quest based on player preferences and world state
    const selectedTemplate = this.selectQuestTemplate(
      availableTemplates,
      playerLevel,
      recentActions,
      worldState
    );

    if (!selectedTemplate) return null;

    // Generate quest instance with dynamic modifications
    return this.createQuestInstance(selectedTemplate, playerLevel, worldState);
  }

  private getAvailableQuestTemplates(
    playerLevel: number,
    playerLocation: string,
    playerReputation: Record<string, number>,
    worldState: any
  ): DynamicQuestTemplate[] {
    return Array.from(this.questTemplates.values()).filter(template => {
      // Check level requirement
      if (template.level > playerLevel) return false;

      // Check location requirement
      if (template.location && template.location !== playerLocation) return false;

      // Check reputation requirements
      if (template.rewards.reputation) {
        for (const [faction, requiredRep] of Object.entries(template.rewards.reputation)) {
          const currentRep = playerReputation[faction] || 0;
          if (currentRep < requiredRep) return false;
        }
      }

      // Check prerequisites
      if (template.prerequisites.length > 0) {
        const completedQuests = this.questHistory
          .filter(q => q.status === 'completed')
          .map(q => q.id);
        
        for (const prereq of template.prerequisites) {
          if (!completedQuests.includes(prereq)) return false;
        }
      }

      // Check if quest is already active
      if (this.activeQuests.has(template.id)) return false;

      return true;
    });
  }

  private selectQuestTemplate(
    availableTemplates: DynamicQuestTemplate[],
    playerLevel: number,
    recentActions: any[],
    worldState: any
  ): DynamicQuestTemplate | null {
    if (availableTemplates.length === 0) return null;

    // Score templates based on various factors
    const scoredTemplates = availableTemplates.map(template => {
      let score = 0;

      // Level appropriateness
      const levelDiff = Math.abs(template.level - playerLevel);
      score += Math.max(0, 10 - levelDiff);

      // Recent action relevance
      const actionRelevance = this.calculateActionRelevance(template, recentActions);
      score += actionRelevance * 5;

      // World state relevance
      const worldRelevance = this.calculateWorldRelevance(template, worldState);
      score += worldRelevance * 3;

      // Quest type preference (main quests get priority)
      if (template.type === 'main') score += 10;
      else if (template.type === 'faction') score += 5;

      // Difficulty preference (medium difficulty preferred)
      if (template.difficulty === 'medium') score += 3;
      else if (template.difficulty === 'easy') score += 2;
      else if (template.difficulty === 'hard') score += 1;

      return { template, score };
    });

    // Sort by score and select
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0]?.template || null;
  }

  private calculateActionRelevance(template: DynamicQuestTemplate, recentActions: any[]): number {
    let relevance = 0;
    const actionText = recentActions.map(a => a.description).join(' ').toLowerCase();

    for (const tag of template.tags) {
      if (actionText.includes(tag.replace('_', ' '))) {
        relevance += 1;
      }
    }

    return relevance;
  }

  private calculateWorldRelevance(template: DynamicQuestTemplate, worldState: any): number {
    let relevance = 0;

    // Check if quest objectives align with current world state
    for (const objective of template.objectives) {
      if (objective.location && worldState.currentLocation === objective.location) {
        relevance += 1;
      }
      if (objective.target && worldState[objective.target]) {
        relevance += 1;
      }
    }

    return relevance;
  }

  private createQuestInstance(
    template: DynamicQuestTemplate,
    playerLevel: number,
    worldState: any
  ): Quest {
    // Generate dynamic objectives based on template
    const objectives: QuestObjective[] = template.objectives.map(obj => ({
      id: `${template.id}_obj_${obj.type}_${Date.now()}`,
      type: obj.type === 'custom' ? 'explore' : obj.type, // fallback for 'custom'
      description: this.dynamicizeDescription(obj.description, worldState),
      target: obj.target,
      progress: 0,
      maxProgress: obj.quantity || 1,
      completed: false,
      location: obj.location,
      npcId: obj.npcId,
      itemId: obj.itemId
    }));

    // Generate dynamic rewards
    const rewards: QuestReward = {
      experience: template.rewards.experience + (playerLevel * 10),
      gold: template.rewards.gold + (playerLevel * 5),
      items: template.rewards.items.map(item => ({
        name: item.id,
        quantity: item.quantity + Math.floor(playerLevel / 5),
        rarity: 'common' // fallback, or map if available
      })),
      reputation: template.rewards.reputation
        ? Object.entries(template.rewards.reputation).map(([faction, amount]) => ({ faction, amount }))
        : undefined,
      // unlocks: template.rewards.unlocks // not in QuestReward, ignore or extend if needed
    };

    const quest: Quest = {
      id: `${template.id}_${Date.now()}`,
      title: template.title,
      description: template.description,
      type: template.type,
      difficulty: template.difficulty,
      level: template.level,
      objectives,
      rewards,
      status: 'available',
      timeLimit: template.timeLimit,
      startTime: undefined,
      completedTime: undefined,
      giver: template.giver,
      location: template.location,
      prerequisites: template.prerequisites
    };

    return quest;
  }

  private dynamicizeDescription(description: string, worldState: any): string {
    // Replace placeholders with dynamic content
    let dynamicDescription = description;

    // Replace location references
    if (worldState.currentLocation) {
      dynamicDescription = dynamicDescription.replace(
        /{location}/g,
        worldState.currentLocation
      );
    }

    // Replace NPC references
    if (worldState.npcs) {
      const npcNames = Object.keys(worldState.npcs);
      if (npcNames.length > 0) {
        const randomNPC = npcNames[Math.floor(Math.random() * npcNames.length)];
        dynamicDescription = dynamicDescription.replace(
          /{npc}/g,
          randomNPC
        );
      }
    }

    // Replace faction references
    if (worldState.factions) {
      const factionNames = Object.keys(worldState.factions);
      if (factionNames.length > 0) {
        const randomFaction = factionNames[Math.floor(Math.random() * factionNames.length)];
        dynamicDescription = dynamicDescription.replace(
          /{faction}/g,
          randomFaction
        );
      }
    }

    return dynamicDescription;
  }

  // Process quest completion and handle branching
  public completeQuest(questId: string, worldState: any): {
    quest: Quest;
    consequences: QuestConsequence[];
    nextQuests: string[];
  } {
    const quest = this.activeQuests.get(questId);
    if (!quest) {
      throw new Error(`Quest ${questId} not found`);
    }

    const template = this.questTemplates.get(quest.id.split('_')[0]);
    if (!template) {
      throw new Error(`Quest template not found for ${questId}`);
    }

    // Update quest status
    quest.status = 'completed';
    quest.completedTime = Date.now();
    this.activeQuests.delete(questId);
    this.questHistory.push(quest);

    // Determine which branch to follow
    const branch = this.determineQuestBranch(template, quest, worldState);
    
    // Apply consequences
    const consequences = branch ? branch.consequences : [];

    // Generate next quests
    const nextQuests = branch ? branch.nextQuests : [];

    return {
      quest,
      consequences,
      nextQuests
    };
  }

  private determineQuestBranch(
    template: DynamicQuestTemplate,
    quest: Quest,
    worldState: any
  ): QuestBranch | null {
    for (const branch of template.branches) {
      if (this.evaluateBranchCondition(branch.condition, quest, worldState)) {
        return branch;
      }
    }
    return null;
  }

  private evaluateBranchCondition(
    condition: string,
    quest: Quest,
    worldState: any
  ): boolean {
    switch (condition) {
      case 'all_objectives_completed':
        return quest.objectives.every(obj => Boolean(obj.completed));
      case 'quest_failed':
        return quest.status === 'failed';
      case 'time_expired':
        return Boolean(quest.timeLimit && quest.startTime && 
               (Date.now() - quest.startTime) > (quest.timeLimit * 60 * 1000));
      default:
        return false;
    }
  }

  // Accept a quest
  public acceptQuest(questId: string): Quest {
    const quest = this.activeQuests.get(questId);
    if (!quest) {
      throw new Error(`Quest ${questId} not found`);
    }

    quest.status = 'active';
    quest.startTime = Date.now();
    return quest;
  }

  // Update quest progress
  public updateQuestProgress(
    questId: string,
    objectiveId: string,
    progress: number
  ): Quest | null {
    const quest = this.activeQuests.get(questId);
    if (!quest) return null;

    // MIGRATION: Ensure all objectives have completed as boolean
    quest.objectives.forEach(obj => { obj.completed = !!obj.completed; });

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return null;

    objective.progress = Math.min(objective.progress + progress, objective.maxProgress);
    objective.completed = Boolean(objective.progress >= objective.maxProgress);

    // Check if quest is complete
    if (quest.objectives.every(obj => obj.completed)) {
      quest.status = 'completed';
      quest.completedTime = Date.now();
      this.activeQuests.delete(questId);
      this.questHistory.push(quest);
    }

    return quest;
  }

  // Get available quests for a player
  public getAvailableQuests(
    playerLevel: number,
    playerLocation: string,
    playerReputation: Record<string, number>
  ): Quest[] {
    return Array.from(this.activeQuests.values()).filter(quest => 
      quest.status === 'available' &&
      quest.level <= playerLevel &&
      (!quest.location || quest.location === playerLocation)
    );
  }

  // Get active quests for a player
  public getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests.values()).filter(quest => 
      quest.status === 'active'
    );
  }

  // Update world state
  public updateWorldState(newWorldState: any) {
    this.worldState = { ...this.worldState, ...newWorldState };
  }

  /**
   * Generate AI-driven dynamic quests based on current context
   */
  public async generateAIQuest(context: AIQuestContext): Promise<AIGeneratedQuest | null> {
    // Check cooldown to prevent spam
    const now = Date.now();
    if (now - this.lastQuestGeneration < this.questGenerationCooldown) {
      return null;
    }

    try {
      // Create AI prompt for quest generation
      const prompt = this.createQuestGenerationPrompt(context);
      
      // Generate quest using AI
      const aiResponse = await aiService.generateQuest(prompt, context);
      
      if (!aiResponse) {
        return null;
      }

      // Parse AI response and create quest
      const quest = this.parseAIQuestResponse(aiResponse, context);
      
      if (!quest) {
        return null;
      }

      // Cache the generated quest
      const cacheKey = `${context.playerLocation}_${context.playerLevel}_${now}`;
      this.aiQuestCache.set(cacheKey, quest);
      
      this.lastQuestGeneration = now;
      return quest;

    } catch (error) {
      console.error('Error generating AI quest:', error);
      return null;
    }
  }

  /**
   * Create a comprehensive prompt for AI quest generation
   */
  private createQuestGenerationPrompt(context: AIQuestContext): string {
    const recentActions = context.playerActions
      .filter(action => Date.now() - action.timestamp < 86400000) // Last 24 hours
      .map(action => `${action.type}: ${action.target} (${action.outcome})`)
      .join(', ');
    const npcContext = context.npcInteractions
      .filter(npc => npc.relationship > 0)
      .map(npc => `${npc.npcId} (relationship: ${npc.relationship}, topics: ${npc.topics.join(', ')})`)
      .join('; ');

    const worldEvents = context.recentEvents
      .filter(event => event.impact > 0.5)
      .map(event => `${event.type}: ${event.description}`)
      .join(';');
    return `
Generate a dynamic quest for a level ${context.playerLevel} player in ${context.playerLocation}.

CONTEXT:
- Player Level: ${context.playerLevel}
- Location: ${context.playerLocation}
- Recent Actions: ${recentActions || 'None'}
- NPC Relationships: ${npcContext || 'None'}
- Recent World Events: ${worldEvents || 'None'}
- Available Resources: ${context.availableResources.join(', ')}
- Current Threats: ${context.currentThreats.join(', ')}
- Faction Relations: ${Object.entries(context.factionRelations).map(([faction, relation]) => `${faction}: ${relation}`).join(', ')}

WORLD STATE:
${JSON.stringify(context.worldState, null, 2)}

REQUIREMENTS:
1. Create a quest that feels organic and connected to the player's recent actions
2. Consider the player's relationships with NPCs and factions
3. Incorporate recent world events and current threats
4. Make objectives challenging but achievable for the player's level
5. Provide meaningful rewards that align with the player's progression
6. Include branching possibilities based on player choices
7. Consider the location and available resources

Generate a quest in the following JSON format:
{
  "title": "Quest Title",
  "description": "quest description",
  "type": "main|side|daily|weekly|faction",
  "difficulty": "easy|medium|hard|epic|legendary",
  "objectives": [
    {
      "id": "obj_1",
      "type": "kill|collect|explore|talk|craft|deliver|custom",
      "description": "Objective description",
      "target": "target identifier",
      "quantity": 1,
      "location": "optional location"
    }
  ],
  "rewards": {
    "experience": 10,
    "gold": 50,
    "items": [
      {
        "id": "Item Name",
        "quantity": 1,
        "rarity": "common|uncommon|rare|epic|legendary"
      }
    ],
    "reputation": {
      "faction_name": 10
    }
  },
  "reasoning": "Why this quest was generated",
  "relevance": 0.85,
  "complexity": 3,
  "estimatedDuration": 30,
  "riskLevel": "low|medium|high",
  "potentialOutcomes": [
    {
      "condition": "success",
      "consequences": [
        {
          "type": "reputation|faction|world|character|unlock",
          "target": "target",
          "value": 10,
          "description": "Consequence description"
        }
      ],
      "probability": 0.7
    }
  ]
}
`;
  }

  /**
   * Parse AI response and create quest instance
   */
  private parseAIQuestResponse(aiResponse: string, context: AIQuestContext): AIGeneratedQuest | null {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in AI response');
        return null;
      }

      const questData = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!questData.title || !questData.description || !questData.objectives) {
        console.error('Invalid quest data from AI');
        return null;
      }

      // Create quest instance
      const quest: Quest = {
        id: `ai_quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: questData.title,
        description: questData.description,
        type: questData.type || 'side',
        difficulty: questData.difficulty || 'medium',
        level: context.playerLevel,
        objectives: questData.objectives.map((obj: any, index: number) => ({
          id: `obj_${index}`,
          description: obj.description,
          completed: false,
          progress: 0,
          maxProgress: obj.quantity || 1,
          type: obj.type,
          target: obj.target,
          location: obj.location
        })),
        rewards: {
          experience: questData.rewards?.experience || 100,
          gold: questData.rewards?.gold || 50,
          items: questData.rewards?.items || [],
          reputation: questData.rewards?.reputation ? 
            Object.entries(questData.rewards.reputation).map(([faction, amount]) => ({
              faction,
              amount: amount as number
            })) : undefined
        },
        status: 'available',
        giver: 'AI_Quest_Giver',
        location: context.playerLocation
      };

      return {
        quest,
        reasoning: questData.reasoning || 'AI-generated quest based on current context',
        relevance: questData.relevance || 0.5,
        complexity: questData.complexity || 1,
        estimatedDuration: questData.estimatedDuration || 15,
        riskLevel: questData.riskLevel || 'medium',
        potentialOutcomes: questData.potentialOutcomes || []
      };

    } catch (error) {
      console.error('Error parsing AI quest response:', error);
      return null;
    }
  }

  /**
   * Get contextual quest suggestions based on player actions
   */
  public getContextualQuestSuggestions(context: AIQuestContext): Array<{
    type: 'follow_up' | 'consequence' | 'opportunity' | 'threat_response';
    quest: Quest;
    reasoning: string;
    urgency: number;
  }> {
    const suggestions: Array<{
      type: 'follow_up' | 'consequence' | 'opportunity' | 'threat_response';
      quest: Quest;
      reasoning: string;
      urgency: number;
    }> = [];

    // Analyze recent actions for follow-up opportunities
    const recentActions = context.playerActions
      .filter(action => Date.now() - action.timestamp < 3600000) // Last hour
      .map(action => ({
        type: action.type,
        target: action.target,
        outcome: action.outcome
      }));

    recentActions.forEach(action => {
      if (action.outcome === 'success' && action.type === 'kill') {
        // Generate follow-up quest for successful combat
        const followUpQuest = this.createFollowUpQuest(action, context);
        if (followUpQuest) {
          suggestions.push({
            type: 'follow_up',
            quest: followUpQuest,
            reasoning: `Follow-up to successful ${action.type} action`,
            urgency: 0.3
          });
        }
      } else if (action.outcome === 'failure') {
        // Generate consequence quest for failed actions
        const consequenceQuest = this.createConsequenceQuest(action, context);
        if (consequenceQuest) {
          suggestions.push({
            type: 'consequence',
            quest: consequenceQuest,
            reasoning: `Consequence of failed ${action.type} action`,
            urgency: 0.7
          });
        }
      }
    });

    // Check for threat response opportunities
    context.currentThreats.forEach(threat => {
      const threatQuest = this.createThreatResponseQuest(threat, context);
      if (threatQuest) {
        suggestions.push({
          type: 'threat_response',
          quest: threatQuest,
          reasoning: `Response to current threat: ${threat}`,
          urgency: 0.8
        });
      }
    });

    // Check for faction opportunities
    Object.entries(context.factionRelations).forEach(([faction, relation]) => {
      if (relation > 50) {
        const factionQuest = this.createFactionQuest(faction, relation, context);
        if (factionQuest) {
          suggestions.push({
            type: 'opportunity',
            quest: factionQuest,
            reasoning: `Opportunity with allied faction: ${faction}`,
            urgency: 0.4
          });
        }
      }
    });

    return suggestions.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Create follow-up quest based on successful action
   */
  private createFollowUpQuest(action: any, context: AIQuestContext): Quest | null {
    const questId = `follow_up_${action.type}_${Date.now()}`;
    
    switch (action.type) {
      case 'kill':
        return {
          id: questId,
          title: 'Investigate the Source',
          description: `Your recent victory over ${action.target} has revealed a larger threat. Investigate the source of this danger.`,
          type: 'side',
          difficulty: 'medium',
          level: context.playerLevel,
          objectives: [
            {
              id: 'investigate',
              description: 'Investigate the area where you fought',
              completed: false,
              progress: 0,
              maxProgress: 1,
              type: 'explore',
              location: action.target
            },
            {
              id: 'gather_evidence',
              description: 'Gather evidence of the larger threat',
              completed: false,
              progress: 0,
              maxProgress: 3,
              type: 'collect',
              target: 'evidence'
            }
          ],
          rewards: {
            experience: 150,
            gold: 75,
            items: []
          },
          status: 'available',
          giver: 'Local_Scout',
          location: context.playerLocation
        };
      
      default:
        return null;
    }
  }

  /**
   * Create consequence quest for failed action
   */
  private createConsequenceQuest(action: any, context: AIQuestContext): Quest | null {
    const questId = `consequence_${action.type}_${Date.now()}`;
    
    return {
      id: questId,
      title: 'Deal with the Consequences',
      description: `Your failure to ${action.type} ${action.target} has created new problems. You must address the consequences.`,
      type: 'side',
      difficulty: 'hard',
      level: context.playerLevel,
      objectives: [
        {
          id: 'contain_threat',
          description: 'Contain the threat that was created',
          completed: false,
          progress: 0,
          maxProgress: 1,
          type: 'explore',
          target: 'contain_threat'
        },
        {
          id: 'make_amends',
          description: 'Make amends for the failure',
          completed: false,
          progress: 0,
          maxProgress: 1,
          type: 'talk',
          target: 'affected_npcs'
        }
      ],
      rewards: {
        experience: 20,
        gold: 10,
        items: []
      },
      status: 'available',
      giver: 'Local_Authority',
      location: context.playerLocation
    };
  }

  /**
   * Create threat response quest
   */
  private createThreatResponseQuest(threat: string, context: AIQuestContext): Quest | null {
    const questId = `threat_response_${threat}_${Date.now()}`;
    
    return {
      id: questId,
      title: `Respond to ${threat}`,
      description: `A ${threat} threatens the region. You must act quickly to address this danger.`,
      type: 'main',
      difficulty: 'hard',
      level: context.playerLevel,
      objectives: [
        {
          id: 'assess_threat',
          description: 'Assess the nature and scope of the threat',
          completed: false,
          progress: 0,
          maxProgress: 1,
          type: 'explore',
          target: threat
        },
        {
          id: 'gather_resources',
          description: 'Gather resources needed to address the threat',
          completed: false,
          progress: 0,
          maxProgress: 5,
          type: 'collect',
          target: 'response_resources'
        },
        {
          id: 'execute_response',
          description: 'Execute the response plan',
          completed: false,
          progress: 0,
          maxProgress: 1,
          type: 'explore',
          target: 'threat_response'
        }
      ],
      rewards: {
        experience: 50,
        gold: 250,
        items: [
          {
            name: 'Threat Response Badge',
            quantity: 1,
            rarity: 'rare'
          }
        ]
      },
      status: 'available',
      giver: 'Emergency_Coordinator',
      location: context.playerLocation
    };
  }

  /**
   * Create faction quest for allied factions
   */
  private createFactionQuest(faction: string, relation: number, context: AIQuestContext): Quest | null {
    const questId = `faction_${faction}_${Date.now()}`;
    
    return {
      id: questId,
      title: `${faction} Alliance Mission`,
      description: `Your strong relationship with ${faction} has opened up new opportunities for collaboration.`,
      type: 'faction',
      difficulty: 'medium',
      level: context.playerLevel,
      objectives: [
        {
          id: 'faction_task',
          description: 'Complete a task for the faction',
          completed: false,
          progress: 0,
          maxProgress: 1,
          type: 'explore',
          target: `${faction}_task`
        }
      ],
      rewards: {
        experience: 30,
        gold: 150,
        items: [],
        reputation: [
          {
            faction,
            amount: 25
          }
        ]
      },
      status: 'available',
      giver: `${faction}_Representative`,
      location: context.playerLocation
    };
  }
}

export default QuestService; 