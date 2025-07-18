/**
 * Toast Notification Service
 * 
 * Centralized service for managing toast notifications and user feedback
 * Extracted from the original monolithic App.tsx (lines 141-200)
 */

import React from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  icon?: React.ReactNode;
  showIntroControls?: boolean;
  onSkipIntro?: () => void;
  onDontShowAgain?: () => void;
  duration?: number;
}

export interface ToastContext {
  npcName?: string;
  disposition?: string;
  emotionalSummary?: string;
  achievementName?: string;
  itemName?: string;
  questName?: string;
  levelGained?: number;
}

export class ToastService {
  private callbacks: {
    onToastAdd?: (toast: ToastMessage) => void;
    onToastRemove?: (id: string) => void;
  } = {};

  private toasts: ToastMessage[] = [];

  // Register callback for toast state changes
  setCallbacks(callbacks: { onToastAdd?: (toast: ToastMessage) => void; onToastRemove?: (id: string) => void }) {
    this.callbacks = callbacks;
  }

  // Generate toast message based on action type and context
  private generateToastMessage(action: string, context?: ToastContext): ToastMessage {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const messages: Record<string, { message: string; type: ToastMessage['type']; duration?: number }> = {
      characterCreated: { 
        message: 'Character created successfully!', 
        type: 'success',
        duration: 5000
      },
      campaignCreated: { 
        message: 'Campaign created successfully!', 
        type: 'success',
        duration: 5000
      },
      campaignJoined: { 
        message: 'Joined campaign successfully!', 
        type: 'success',
        duration: 4000
      },
      campaignPaused: { 
        message: 'Campaign paused', 
        type: 'info',
        duration: 3000
      },
      campaignResumed: { 
        message: 'Campaign resumed', 
        type: 'success',
        duration: 3000
      },
      welcomeBack: { 
        message: 'Welcome back to your adventure!', 
        type: 'success',
        duration: 4000
      },
      levelUp: { 
        message: context?.levelGained ? `Level up! You are now level ${context.levelGained}!` : 'Level up!', 
        type: 'success',
        duration: 6000
      },
      achievementUnlocked: { 
        message: context?.achievementName ? `Achievement unlocked: ${context.achievementName}!` : 'Achievement unlocked!', 
        type: 'success',
        duration: 5000
      },
      itemFound: { 
        message: context?.itemName ? `Found item: ${context.itemName}!` : 'Item found!', 
        type: 'success',
        duration: 4000
      },
      questCompleted: { 
        message: context?.questName ? `Quest completed: ${context.questName}!` : 'Quest completed!', 
        type: 'success',
        duration: 5000
      },
      combatStarted: { 
        message: 'Combat initiated!', 
        type: 'warning',
        duration: 3000
      },
      combatVictory: { 
        message: 'Victory! Combat complete!', 
        type: 'success',
        duration: 4000
      },
      combatDefeat: { 
        message: 'Defeat... Better luck next time!', 
        type: 'error',
        duration: 4000
      },
      npcInteraction: { 
        message: context?.npcName && context?.disposition && context?.emotionalSummary 
          ? `${context.npcName} is ${context.disposition} (${context.emotionalSummary})` 
          : 'NPC interaction recorded', 
        type: 'info',
        duration: 4000
      },
      firstMessage: { 
        message: 'Welcome to your adventure! Send a message to begin.', 
        type: 'info',
        duration: 5000
      },
      explorationMilestone: { 
        message: 'New area discovered!', 
        type: 'success',
        duration: 4000
      },
      spellLearned: { 
        message: context?.itemName ? `Spell learned: ${context.itemName}!` : 'New spell learned!', 
        type: 'success',
        duration: 4000
      },
      connectionLost: { 
        message: 'Connection lost. Attempting to reconnect...', 
        type: 'warning',
        duration: 0 // Persistent until resolved
      },
      connectionRestored: { 
        message: 'Connection restored!', 
        type: 'success',
        duration: 3000
      },
      saveSuccess: { 
        message: 'Game saved successfully!', 
        type: 'success',
        duration: 2000
      },
      saveError: { 
        message: 'Failed to save game. Please try again.', 
        type: 'error',
        duration: 5000
      }
    };
    
    const defaultMessage = { message: 'Action completed', type: 'success' as const, duration: 3000 };
    const messageData = messages[action] || defaultMessage;
    
    return {
      id,
      ...messageData,
      duration: messageData.duration ?? 3000
    };
  }

  // Add a toast notification
  addToast(action: string, context?: ToastContext): void {
    // Only show toasts for meaningful gameplay achievements, not errors or info messages
    const importantActions = [
      'characterCreated', 
      'campaignCreated', 
      'campaignJoined', 
      'levelUp', 
      'achievementUnlocked',
      'firstMessage',
      'combatStarted',
      'combatVictory',
      'combatDefeat',
      'questCompleted',
      'itemFound',
      'spellLearned',
      'npcInteraction',
      'explorationMilestone',
      'connectionLost',
      'connectionRestored',
      'saveSuccess',
      'saveError'
    ];
    
    // Skip non-important actions
    if (!importantActions.includes(action)) {
      return;
    }
    
    // Check if user has chosen to skip this intro
    const skippedIntros = JSON.parse(localStorage.getItem('mythseeker_skipped_intros') || '[]');
    if (skippedIntros.includes(action)) {
      return; // Don't show this toast if user chose to skip it
    }
    
    const toast = this.generateToastMessage(action, context);
    
    // Add intro controls for certain types of toasts
    if (['characterCreated', 'campaignCreated', 'firstMessage', 'combatStarted'].includes(action)) {
      toast.showIntroControls = true;
      toast.onSkipIntro = () => {
        console.log(`Skipped intro for ${action}`);
        this.dismissToast(toast.id);
      };
      toast.onDontShowAgain = () => {
        // Store preference in localStorage
        const skippedIntros = JSON.parse(localStorage.getItem('mythseeker_skipped_intros') || '[]');
        if (!skippedIntros.includes(action)) {
          skippedIntros.push(action);
          localStorage.setItem('mythseeker_skipped_intros', JSON.stringify(skippedIntros));
        }
        console.log(`Won't show ${action} intro again`);
        this.dismissToast(toast.id);
      };
    }
    
    this.toasts.push(toast);
    this.callbacks.onToastAdd?.(toast);
    
    // Auto-dismiss after specified duration (unless duration is 0 for persistent toasts)
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.dismissToast(toast.id), toast.duration);
    }
  }
  
  // Dismiss a specific toast
  dismissToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.callbacks.onToastRemove?.(id);
  }

  // Dismiss all toasts
  dismissAllToasts(): void {
    const toastIds = this.toasts.map(toast => toast.id);
    this.toasts = [];
    toastIds.forEach(id => this.callbacks.onToastRemove?.(id));
  }

  // Get all current toasts
  getToasts(): ToastMessage[] {
    return [...this.toasts];
  }

  // Quick methods for common toast types
  success(message: string, duration = 3000): void {
    const toast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type: 'success',
      duration
    };
    
    this.toasts.push(toast);
    this.callbacks.onToastAdd?.(toast);
    
    if (duration > 0) {
      setTimeout(() => this.dismissToast(toast.id), duration);
    }
  }

  error(message: string, duration = 5000): void {
    const toast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type: 'error',
      duration
    };
    
    this.toasts.push(toast);
    this.callbacks.onToastAdd?.(toast);
    
    if (duration > 0) {
      setTimeout(() => this.dismissToast(toast.id), duration);
    }
  }

  info(message: string, duration = 4000): void {
    const toast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type: 'info',
      duration
    };
    
    this.toasts.push(toast);
    this.callbacks.onToastAdd?.(toast);
    
    if (duration > 0) {
      setTimeout(() => this.dismissToast(toast.id), duration);
    }
  }

  warning(message: string, duration = 4000): void {
    const toast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type: 'warning',
      duration
    };
    
    this.toasts.push(toast);
    this.callbacks.onToastAdd?.(toast);
    
    if (duration > 0) {
      setTimeout(() => this.dismissToast(toast.id), duration);
    }
  }
}

// Export singleton instance
export const toastService = new ToastService(); 