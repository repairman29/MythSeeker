// Unified Campaign Service - DRY principle applied
// Consolidates all campaign management logic into single service

import { ErrorHandler, ErrorUtils } from '../lib/errorHandler';
import { CampaignValidator, VALIDATION_LIMITS } from '../lib/validation';
import { multiplayerService } from './multiplayerService';
import { aiService } from './aiService';
import { Timestamp } from 'firebase/firestore';

// Constants to eliminate magic numbers
export const CAMPAIGN_CONSTANTS = {
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 1,
  CODE_LENGTH: 6,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  AI_TIMEOUT: 15000, // 15 seconds
  DEFAULT_ENVIRONMENT: 'fantasy'
} as const;

export interface CampaignData {
  id?: string;
  code: string;
  theme: string;
  background: string;
  players: Player[];
  messages: Message[];
  systemMessages?: Message[];
  started: boolean;
  customPrompt?: string;
  isMultiplayer: boolean;
  maxPlayers: number;
  status?: 'active' | 'paused' | 'completed';
  createdAt?: number | Date | import("firebase/firestore").Timestamp;
  lastActivity?: number | Date | import("firebase/firestore").Timestamp;
  participants?: Record<string, boolean>; // For Firebase compatibility
}

export interface Player {
  id: string;
  name: string;
  character: any;
  isHost: boolean;
  isOnline: boolean;
  lastSeen?: number | Date | import("firebase/firestore").Timestamp;
  status: 'ready' | 'not-ready' | 'in-game' | 'away';
  position?: { x: number; y: number };
  health?: number;
  mana?: number;
}

export interface Message {
  id: string;
  type: 'player' | 'dm' | 'system';
  content: string;
  character?: string;
  playerId?: string;
  playerName?: string;
  timestamp: number | Date | import("firebase/firestore").Timestamp;
  campaignId?: string;
  choices?: string[];
  atmosphere?: string;
  worldStateUpdates?: any;
}

function toGameMessage(msg: Message): import("./multiplayerService").GameMessage {
  let ts: Timestamp;
  if (msg.timestamp instanceof Timestamp) {
    ts = msg.timestamp;
  } else if (msg.timestamp instanceof Date) {
    ts = Timestamp.fromDate(msg.timestamp);
  } else if (typeof msg.timestamp === 'number') {
    ts = Timestamp.fromMillis(msg.timestamp);
  } else {
    ts = Timestamp.now();
  }
  return {
    ...msg,
    id: msg.id.toString(),
    timestamp: ts,
    campaignId: msg.campaignId || ''
  };
}

/**
 * Unified Campaign Service - eliminates code duplication
 */
export class CampaignService {
  private static instance: CampaignService;
  private campaigns: Map<string, CampaignData> = new Map();
  private autoSaveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  static getInstance(): CampaignService {
    if (!this.instance) {
      this.instance = new CampaignService();
    }
    return this.instance;
  }

  /**
   * Create campaign with unified validation and storage
   */
  async createCampaign(
    theme: any,
    customPrompt: string = '',
    isMultiplayer: boolean = true,
    playerData: any
  ): Promise<{ success: boolean; campaign?: CampaignData; error?: any }> {
    return ErrorUtils.campaignOperation(async () => {
      // Validate input data
      const validation = CampaignValidator.validateCampaignData({
        theme: theme.name,
        customPrompt
      });

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create campaign data structure
      const campaignData: CampaignData = {
        code: this.generateCampaignCode(),
        theme: theme.name,
        background: theme.bg || CAMPAIGN_CONSTANTS.DEFAULT_ENVIRONMENT,
        players: [{
          id: playerData.id || 'unknown',
          name: playerData.name,
          character: { ...playerData.character, playerId: playerData.id },
          isHost: true,
          isOnline: true,
          status: 'ready' as const
        }],
        messages: [],
        systemMessages: [],
        started: false,
        customPrompt: validation.sanitizedData?.customPrompt || '',
        isMultiplayer,
        maxPlayers: isMultiplayer ? CAMPAIGN_CONSTANTS.MAX_PLAYERS : CAMPAIGN_CONSTANTS.MIN_PLAYERS
      };

      // Create campaign based on type
      let createdCampaign: CampaignData;
      
      if (isMultiplayer) {
        createdCampaign = await this.createMultiplayerCampaign(campaignData);
      } else {
        createdCampaign = await this.createSinglePlayerCampaign(campaignData);
      }

      // Store in memory and persistent storage
      await this.saveCampaign(createdCampaign);
      this.campaigns.set(createdCampaign.id!, createdCampaign);

      return createdCampaign;
    }, 'createCampaign');
  }

  /**
   * Start campaign with unified AI integration
   */
  async startCampaign(
    campaign: CampaignData
  ): Promise<{ success: boolean; message?: Message; error?: any }> {
    return ErrorUtils.campaignOperation(async () => {
      if (!campaign.id) {
        throw new Error('Campaign ID is missing');
      }

      // Generate AI opening
      const openingMessage = await this.generateCampaignOpening(campaign);
      
      // Update campaign status
      const startedCampaign: CampaignData = {
        ...campaign,
        started: true,
        status: 'active',
        messages: [openingMessage]
      };

      // Save updated campaign
      await this.saveCampaign(startedCampaign);
      this.campaigns.set(campaign.id, startedCampaign);

      // Start auto-save
      this.startAutoSave(campaign.id);

      return openingMessage;
    }, 'startCampaign');
  }

  /**
   * Send message with unified AI processing
   */
  async sendMessage(
    campaignId: string,
    message: Partial<Message>
  ): Promise<{ success: boolean; dmResponse?: Message; error?: any }> {
    return ErrorUtils.campaignOperation(async () => {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Validate message
      const validation = CampaignValidator.validateMessage(message);
      if (!validation.isValid) {
        throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
      }

      // Create player message
      const playerMessage: Message = {
        ...validation.sanitizedData,
        id: Date.now().toString(),
        timestamp: new Date()
      } as Message;

      // Generate AI response
      const dmResponse = await this.generateAIResponse(campaign, playerMessage.content);

      // Update campaign
      const updatedCampaign: CampaignData = {
        ...campaign,
        messages: [...campaign.messages, playerMessage, dmResponse],
        lastActivity: new Date()
      };

      await this.saveCampaign(updatedCampaign);
      this.campaigns.set(campaignId, updatedCampaign);

      return dmResponse;
    }, 'sendMessage');
  }

  /**
   * Join multiplayer campaign
   */
  async joinCampaign(
    campaignCode: string,
    playerData: Player
  ): Promise<{ success: boolean; campaign?: CampaignData; error?: any }> {
    return ErrorUtils.campaignOperation(async () => {
      // Validate campaign code
      const codeValidation = CampaignValidator.validateGameCode(campaignCode);
      if (!codeValidation.isValid) {
        throw new Error('Invalid campaign code');
      }

      // Find campaign (try multiple sources)
      let campaign = await this.findCampaignByCode(campaignCode);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Add player to campaign
      if (campaign.players.length >= campaign.maxPlayers) {
        throw new Error('Campaign is full');
      }

      const updatedCampaign: CampaignData = {
        ...campaign,
        players: [...campaign.players, { ...playerData, lastSeen: Date.now() }]
      };

      await this.saveCampaign(updatedCampaign);
      this.campaigns.set(campaign.id!, updatedCampaign);

      return updatedCampaign;
    }, 'joinCampaign');
  }

  /**
   * Load campaigns from all sources
   */
  async loadCampaigns(userId: string): Promise<{ success: boolean; campaigns?: CampaignData[]; error?: any }> {
    return ErrorUtils.campaignOperation(async () => {
      const allCampaigns: CampaignData[] = [];

      // Load from localStorage
      const localCampaigns = this.loadFromLocalStorage();
      allCampaigns.push(...localCampaigns);

      // Load from Firebase (multiplayer campaigns)
      try {
        const firebaseCampaigns = await multiplayerService.getUserCampaigns();
        
        // Merge campaigns (Firebase takes precedence for multiplayer)
        const mergedCampaigns = this.mergeCampaigns(localCampaigns, firebaseCampaigns);
        
        // Update localStorage with merged data
        this.saveToLocalStorage(mergedCampaigns);
        
        return mergedCampaigns;
      } catch (error) {
        console.warn('Failed to load Firebase campaigns, using local only:', error);
        return localCampaigns;
      }
    }, 'loadCampaigns');
  }

  /**
   * Private helper methods
   */
  private async createMultiplayerCampaign(campaignData: CampaignData): Promise<CampaignData> {
    // Add participants field for Firebase compatibility
    const participants: Record<string, boolean> = {};
    campaignData.players.forEach(player => {
      if (player.id) participants[player.id] = true;
    });

    const campaignWithParticipants = { ...campaignData, participants };
    const gameId = await multiplayerService.createCampaign(campaignWithParticipants as any);
    
    return { ...campaignWithParticipants, id: gameId };
  }

  private async createSinglePlayerCampaign(campaignData: CampaignData): Promise<CampaignData> {
    return { ...campaignData, id: Date.now().toString() };
  }

  private async generateCampaignOpening(campaign: CampaignData): Promise<Message> {
    const aiResult = await ErrorUtils.aiServiceCall(async () => {
      const prompt = this.buildOpeningPrompt(campaign);
      return aiService.complete(prompt, campaign);
    });

    if (aiResult.success && aiResult.data) {
      try {
        const dmResponse = JSON.parse(aiResult.data);
        return {
          id: Date.now().toString(),
          type: 'dm',
          content: dmResponse.narrative,
          choices: dmResponse.choices,
          timestamp: new Date(),
          atmosphere: dmResponse.atmosphere
        };
      } catch (parseError) {
        // Fallback for invalid JSON
        return this.createFallbackMessage(campaign);
      }
    }

    return this.createFallbackMessage(campaign);
  }

  private async generateAIResponse(campaign: CampaignData, playerInput: string): Promise<Message> {
    const aiResult = await ErrorUtils.aiServiceCall(async () => {
      const prompt = this.buildResponsePrompt(campaign, playerInput);
      return aiService.complete(prompt, campaign);
    });

    if (aiResult.success && aiResult.data) {
      try {
        const dmResponse = JSON.parse(aiResult.data);
        return {
          id: (Date.now() + 1).toString(),
          type: 'dm',
          content: dmResponse.narrative,
          choices: dmResponse.choices,
          timestamp: new Date(),
          atmosphere: dmResponse.atmosphere
        };
      } catch (parseError) {
        return this.createContinuationMessage();
      }
    }

    return this.createContinuationMessage();
  }

  private buildOpeningPrompt(campaign: CampaignData): string {
    const partyMembers = campaign.players.map(p => `${p.character.name} the ${p.character.class}`).join(', ');
    
    return `Create an immersive opening for a ${campaign.theme} adventure.
    
    The party consists of: ${partyMembers}
    ${campaign.customPrompt ? `Custom prompt: ${campaign.customPrompt}` : ''}
    
    Rules:
    - Create an atmospheric opening scene
    - Present 3 specific action choices
    - Include environmental details
    - Response must be valid JSON with: narrative, choices, atmosphere, environment`;
  }

  private buildResponsePrompt(campaign: CampaignData, playerInput: string): string {
    const recentMessages = campaign.messages.slice(-5); // Last 5 messages for context
    const context = recentMessages.map(m => `${m.type}: ${m.content}`).join('\n');
    
    return `Continue the ${campaign.theme} adventure.
    
    Recent context:
    ${context}
    
    Player input: "${playerInput}"
    
    Respond with atmospheric narrative and 3 choices as JSON.`;
  }

  private createFallbackMessage(campaign: CampaignData): Message {
    return {
      id: Date.now().toString(),
      type: 'dm',
      content: `Welcome to your ${campaign.theme} adventure! Your journey begins at the threshold of destiny.`,
      choices: ['Explore ahead', 'Gather information', 'Prepare equipment'],
      timestamp: new Date()
    };
  }

  private createContinuationMessage(): Message {
    return {
      id: (Date.now() + 1).toString(),
      type: 'dm',
      content: `The adventure continues... (AI temporarily unavailable)`,
      choices: ['Continue forward', 'Investigate surroundings', 'Take a moment to plan'],
      timestamp: new Date()
    };
  }

  private generateCampaignCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < CAMPAIGN_CONSTANTS.CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async saveCampaign(campaign: CampaignData): Promise<void> {
    // Save to localStorage immediately
    const localCampaigns = this.loadFromLocalStorage();
    const existingIndex = localCampaigns.findIndex(c => c.id === campaign.id);
    
    if (existingIndex >= 0) {
      localCampaigns[existingIndex] = campaign;
    } else {
      localCampaigns.push(campaign);
    }
    
    this.saveToLocalStorage(localCampaigns);

    // Save to Firebase if multiplayer
    if (campaign.isMultiplayer && campaign.id) {
      try {
        await multiplayerService.updateCampaignState(campaign.id, {
          messages: campaign.messages.map(toGameMessage),
          started: campaign.started,
          lastActivity: Timestamp.fromDate(new Date())
        });
      } catch (error) {
        console.warn('Failed to sync to Firebase, but local save succeeded:', error);
      }
    }
  }

  private loadFromLocalStorage(): CampaignData[] {
    try {
      const stored = localStorage.getItem('mythseeker_campaigns');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load campaigns from localStorage:', error);
      return [];
    }
  }

  private saveToLocalStorage(campaigns: CampaignData[]): void {
    try {
      localStorage.setItem('mythseeker_campaigns', JSON.stringify(campaigns));
    } catch (error) {
      console.error('Failed to save campaigns to localStorage:', error);
    }
  }

  private mergeCampaigns(local: CampaignData[], firebase: CampaignData[]): CampaignData[] {
    const merged = [...local];
    
    firebase.forEach(fbCampaign => {
      const existingIndex = merged.findIndex(c => c.id === fbCampaign.id);
      if (existingIndex >= 0) {
        // Firebase takes precedence for multiplayer campaigns
        if (fbCampaign.isMultiplayer) {
          merged[existingIndex] = fbCampaign;
        }
      } else {
        merged.push(fbCampaign);
      }
    });
    
    return merged;
  }

  private async findCampaignByCode(code: string): Promise<CampaignData | null> {
    // Try local first
    const localCampaigns = this.loadFromLocalStorage();
    const localFound = localCampaigns.find(c => c.code === code);
    if (localFound) return localFound;

    // Try Firebase
    try {
      const firebaseCampaigns = await multiplayerService.getUserCampaigns();
      return firebaseCampaigns.find(c => c.code === code) || null;
    } catch (error) {
      console.warn('Failed to search Firebase campaigns:', error);
      return null;
    }
  }

  private startAutoSave(campaignId: string): void {
    // Clear existing timer
    const existingTimer = this.autoSaveTimers.get(campaignId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Start new auto-save timer
    const timer = setInterval(async () => {
      const campaign = this.campaigns.get(campaignId);
      if (campaign && campaign.started) {
        await this.saveCampaign(campaign);
      }
    }, CAMPAIGN_CONSTANTS.AUTO_SAVE_INTERVAL);

    this.autoSaveTimers.set(campaignId, timer);
  }

  // Cleanup method
  dispose(): void {
    this.autoSaveTimers.forEach(timer => clearInterval(timer));
    this.autoSaveTimers.clear();
    this.campaigns.clear();
  }
}

// Export singleton instance
export const campaignService = CampaignService.getInstance(); 