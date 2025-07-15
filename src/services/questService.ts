import { Quest, QuestObjective, QuestReward } from '../components/QuestSystem';

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

export class QuestService {
  private questTemplates: Map<string, DynamicQuestTemplate> = new Map();
  private activeQuests: Map<string, Quest> = new Map();
  private questHistory: Quest[] = [];
  private worldState: any = {};

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
    const availableTemplates = this.getAvailableQuests(
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

  private getAvailableQuests(
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
      type: obj.type,
      description: this.dynamicizeDescription(obj.description, worldState),
      target: obj.target,
      quantity: obj.quantity || 1,
      completed: 0,
      location: obj.location,
      npcId: obj.npcId,
      itemId: obj.itemId
    }));

    // Generate dynamic rewards
    const rewards: QuestReward = {
      experience: template.rewards.experience + (playerLevel * 10),
      gold: template.rewards.gold + (playerLevel * 5),
      items: template.rewards.items.map(item => ({
        ...item,
        quantity: item.quantity + Math.floor(playerLevel / 5)
      })),
      reputation: template.rewards.reputation,
      unlocks: template.rewards.unlocks
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
        return quest.objectives.every(obj => obj.completed >= obj.quantity);
      case 'quest_failed':
        return quest.status === 'failed';
      case 'time_expired':
        return quest.timeLimit && quest.startTime && 
               (Date.now() - quest.startTime) > (quest.timeLimit * 60 * 1000);
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

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return null;

    objective.completed = Math.min(objective.completed + progress, objective.quantity);

    // Check if quest is complete
    if (quest.objectives.every(obj => obj.completed >= obj.quantity)) {
      quest.status = 'completed';
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
}

export default QuestService; 