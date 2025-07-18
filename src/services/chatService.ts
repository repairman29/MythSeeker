import { gameStateService } from './gameStateService';

// Types
export interface ChatMessage {
  id: number;
  type: 'player' | 'dm' | 'system' | 'combat' | 'movement';
  content: string;
  character?: string;
  playerId?: string;
  playerName?: string;
  timestamp: Date;
  choices?: string[];
  atmosphere?: {
    mood: string;
    tension: string;
    environmentalDetails: string;
  };
  worldStateUpdates?: any;
  metadata?: any;
}

export interface ChatHistory {
  messages: ChatMessage[];
  lastReadTimestamp: Date;
  unreadCount: number;
}

export interface MessageFormattingOptions {
  showTimestamps: boolean;
  showCharacterNames: boolean;
  showAtmosphere: boolean;
  compactMode: boolean;
}

// Chat Service
export class ChatService {
  private chatHistory: ChatHistory;
  private formattingOptions: MessageFormattingOptions;
  private callbacks: {
    onMessageAdded?: (message: ChatMessage) => void;
    onHistoryUpdated?: (history: ChatHistory) => void;
    onUnreadCountChanged?: (count: number) => void;
  } = {};

  constructor() {
    this.chatHistory = {
      messages: [],
      lastReadTimestamp: new Date(),
      unreadCount: 0
    };
    
    this.formattingOptions = {
      showTimestamps: true,
      showCharacterNames: true,
      showAtmosphere: true,
      compactMode: false
    };
  }

  // Message Management
  addMessage(message: ChatMessage) {
    this.chatHistory.messages.push(message);
    this.updateUnreadCount();
    this.callbacks.onMessageAdded?.(message);
    this.callbacks.onHistoryUpdated?.(this.chatHistory);
  }

  getMessages(): ChatMessage[] {
    return [...this.chatHistory.messages];
  }

  getRecentMessages(count: number = 50): ChatMessage[] {
    return this.chatHistory.messages.slice(-count);
  }

  clearHistory() {
    this.chatHistory.messages = [];
    this.chatHistory.unreadCount = 0;
    this.callbacks.onHistoryUpdated?.(this.chatHistory);
  }

  // Unread Count Management
  markAsRead() {
    this.chatHistory.lastReadTimestamp = new Date();
    this.chatHistory.unreadCount = 0;
    this.callbacks.onUnreadCountChanged?.(0);
  }

  private updateUnreadCount() {
    const unreadMessages = this.chatHistory.messages.filter(
      msg => msg.timestamp > this.chatHistory.lastReadTimestamp
    );
    this.chatHistory.unreadCount = unreadMessages.length;
    this.callbacks.onUnreadCountChanged?.(this.chatHistory.unreadCount);
  }

  getUnreadCount(): number {
    return this.chatHistory.unreadCount;
  }

  // Message Formatting
  formatMessage(message: ChatMessage): string {
    let formatted = '';

    // Add timestamp if enabled
    if (this.formattingOptions.showTimestamps) {
      formatted += `[${this.formatTimestamp(message.timestamp)}] `;
    }

    // Add character name if enabled and available
    if (this.formattingOptions.showCharacterNames && message.character) {
      formatted += `**${message.character}**: `;
    }

    // Add message content
    formatted += message.content;

    // Add atmosphere if enabled and available
    if (this.formattingOptions.showAtmosphere && message.atmosphere) {
      formatted += `\n*${message.atmosphere.environmentalDetails}*`;
    }

    return formatted;
  }

  private formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Formatting Options
  updateFormattingOptions(options: Partial<MessageFormattingOptions>) {
    this.formattingOptions = { ...this.formattingOptions, ...options };
  }

  getFormattingOptions(): MessageFormattingOptions {
    return { ...this.formattingOptions };
  }

  // Message Search and Filtering
  searchMessages(query: string): ChatMessage[] {
    const lowerQuery = query.toLowerCase();
    return this.chatHistory.messages.filter(message =>
      message.content.toLowerCase().includes(lowerQuery) ||
      (message.character && message.character.toLowerCase().includes(lowerQuery)) ||
      (message.playerName && message.playerName.toLowerCase().includes(lowerQuery))
    );
  }

  filterMessagesByType(type: ChatMessage['type']): ChatMessage[] {
    return this.chatHistory.messages.filter(message => message.type === type);
  }

  filterMessagesByPlayer(playerId: string): ChatMessage[] {
    return this.chatHistory.messages.filter(message => message.playerId === playerId);
  }

  // Message Statistics
  getMessageStats() {
    const stats = {
      total: this.chatHistory.messages.length,
      byType: {} as Record<ChatMessage['type'], number>,
      byPlayer: {} as Record<string, number>,
      averageLength: 0
    };

    // Count by type
    this.chatHistory.messages.forEach(message => {
      stats.byType[message.type] = (stats.byType[message.type] || 0) + 1;
    });

    // Count by player
    this.chatHistory.messages.forEach(message => {
      if (message.playerId) {
        stats.byPlayer[message.playerId] = (stats.byPlayer[message.playerId] || 0) + 1;
      }
    });

    // Calculate average length
    if (this.chatHistory.messages.length > 0) {
      const totalLength = this.chatHistory.messages.reduce((sum, msg) => sum + msg.content.length, 0);
      stats.averageLength = Math.round(totalLength / this.chatHistory.messages.length);
    }

    return stats;
  }

  // Callback Management
  onMessageAdded(callback: (message: ChatMessage) => void) {
    this.callbacks.onMessageAdded = callback;
  }

  onHistoryUpdated(callback: (history: ChatHistory) => void) {
    this.callbacks.onHistoryUpdated = callback;
  }

  onUnreadCountChanged(callback: (count: number) => void) {
    this.callbacks.onUnreadCountChanged = callback;
  }

  // Integration with Game State Service
  initializeWithGameState() {
    // Subscribe to game state changes
    gameStateService.onStateChange((state) => {
      // Update chat history when messages change
      if (state.messages.length !== this.chatHistory.messages.length) {
        this.chatHistory.messages = state.messages;
        this.updateUnreadCount();
        this.callbacks.onHistoryUpdated?.(this.chatHistory);
      }
    });

    // Subscribe to message sent events
    gameStateService.onMessageSent((message) => {
      this.addMessage(message);
    });
  }

  // Export/Import
  exportChatHistory(): string {
    return JSON.stringify(this.chatHistory, null, 2);
  }

  importChatHistory(historyJson: string) {
    try {
      const history = JSON.parse(historyJson);
      this.chatHistory = {
        ...history,
        messages: history.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
      this.updateUnreadCount();
      this.callbacks.onHistoryUpdated?.(this.chatHistory);
    } catch (error) {
      console.error('Failed to import chat history:', error);
    }
  }
}

// Export singleton instance
export const chatService = new ChatService(); 