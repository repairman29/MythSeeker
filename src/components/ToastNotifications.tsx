import React, { useState, useEffect } from 'react';
import { X, Sword, Shield, Sparkles, Heart, Star, Zap, Crown, Target, Users, Map, Book, Award, Flame, Eye, Crosshair } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'achievement' | 'fun';
  title: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationsProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastNotifications: React.FC<ToastNotificationsProps> = ({ messages, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {messages.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const getIcon = () => {
    if (toast.icon) return toast.icon;
    
    switch (toast.type) {
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-400" />;
      case 'success':
        return <Star className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'fun':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Zap className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-600 to-orange-600';
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-emerald-600';
      case 'warning':
        return 'bg-gradient-to-r from-orange-600 to-red-600';
      case 'fun':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-600';
    }
  };

  return (
    <div
      className={`${getBgColor()} text-white rounded-lg shadow-lg border border-white/20 backdrop-blur-sm transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ minWidth: '300px', maxWidth: '400px' }}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1">{toast.title}</h4>
            <p className="text-xs text-white/90 leading-relaxed">{toast.message}</p>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss(toast.id), 300);
            }}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast message generator
export const generateToastMessage = (action: string, context?: any): ToastMessage => {
  const funMessages = {
    characterCreated: [
      {
        title: "🎭 Character Born!",
        message: "Your hero has entered the realm! Time to write some epic backstory... or just wing it like a true adventurer!",
        type: 'fun' as const
      },
      {
        title: "⚔️ Hero Forged!",
        message: "Another legend joins the ranks! Let's hope they're not the type to check every door for traps...",
        type: 'fun' as const
      }
    ],
    campaignCreated: [
      {
        title: "🗺️ Adventure Awaits!",
        message: "Your campaign is ready! Remember: the best plans survive first contact with the players...",
        type: 'fun' as const
      },
      {
        title: "🌟 Epic Begins!",
        message: "A new tale unfolds! May your dice be kind and your players be merciful to your NPCs.",
        type: 'fun' as const
      }
    ],
    firstMessage: [
      {
        title: "💬 Words Have Power!",
        message: "Your first message! The AI DM is taking notes... and probably rolling some dice behind the scenes.",
        type: 'fun' as const
      },
      {
        title: "🎯 Communication Established!",
        message: "You've broken the ice! Now the real fun begins. Choose your words wisely...",
        type: 'fun' as const
      }
    ],
    combatStarted: [
      {
        title: "⚔️ Combat Initiated!",
        message: "The dice are rolling! Remember: it's not murder if they're monsters... probably.",
        type: 'fun' as const
      },
      {
        title: "🔥 Battle Begins!",
        message: "Time to test those combat skills! May your armor hold and your weapons strike true!",
        type: 'fun' as const
      }
    ],
    levelUp: [
      {
        title: "⭐ Level Up!",
        message: "You've grown stronger! Your enemies are getting nervous... and your party is getting jealous.",
        type: 'achievement' as const
      },
      {
        title: "🚀 Power Surge!",
        message: "Level up achieved! You're now officially too powerful for your own good.",
        type: 'achievement' as const
      }
    ],
    achievementUnlocked: [
      {
        title: "🏆 Achievement Unlocked!",
        message: "You've done something noteworthy! Or at least something the game decided to track.",
        type: 'achievement' as const
      }
    ],
    ftueSkipped: [
      {
        title: "🎯 Self-Taught Hero!",
        message: "You skipped the tutorial! Bold move. Let's see if you can figure out the inventory system...",
        type: 'fun' as const
      },
      {
        title: "🚀 Trial by Fire!",
        message: "No tutorial needed! You're either a genius or about to learn some painful lessons.",
        type: 'fun' as const
      }
    ],
    welcomeBack: [
      {
        title: "👋 Welcome Back, Adventurer!",
        message: "Your quest awaits! The AI DM has been plotting your demise... I mean, your adventure!",
        type: 'fun' as const
      },
      {
        title: "🌟 Return of the Hero!",
        message: "Back in the saddle! Your character sheet misses you, and your party needs your healing spells.",
        type: 'fun' as const
      }
    ],
    campaignPaused: [
      {
        title: "⏸️ Campaign Paused!",
        message: "Your adventure is on hold! The world waits patiently for your return... or does it?",
        type: 'warning' as const
      },
      {
        title: "🛑 Adventure Suspended!",
        message: "Campaign paused! Your party is frozen in time, probably mid-sentence. How dramatic!",
        type: 'warning' as const
      }
    ],
    campaignResumed: [
      {
        title: "▶️ Adventure Resumed!",
        message: "Back to the action! Your party springs back to life, ready to continue their epic quest!",
        type: 'success' as const
      },
      {
        title: "🚀 Campaign Restarted!",
        message: "The adventure continues! Time to pick up where you left off and make some more questionable decisions!",
        type: 'success' as const
      }
    ]
  };

  const messages = funMessages[action as keyof typeof funMessages] || [
    {
      title: "🎮 Action Completed!",
      message: "Something happened! The game noticed and decided to tell you about it.",
      type: 'info' as const
    }
  ];

  const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    id: `${action}-${Date.now()}`,
    ...selectedMessage,
    duration: 5000
  };
};

export default ToastNotifications; 