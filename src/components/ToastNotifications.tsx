import React, { useState, useEffect } from 'react';
import { X, Sword, Shield, Sparkles, Heart, Star, Zap, Crown, Target, Users, Map, Book, Award, Flame, Eye, Crosshair, Check } from 'lucide-react';

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
  showIntroControls?: boolean;
  onSkipIntro?: () => void;
  onDontShowAgain?: () => void;
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
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Only auto-dismiss if not hovered and no intro controls
    if (!toast.showIntroControls) {
      const timer = setTimeout(() => {
        if (!isHovered) {
          setIsVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }
      }, toast.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss, toast.showIntroControls, isHovered]);

  const handleSkipIntro = () => {
    if (dontShowAgain && toast.onDontShowAgain) {
      toast.onDontShowAgain();
    } else if (toast.onSkipIntro) {
      toast.onSkipIntro();
    }
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

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
      style={{ minWidth: '320px', maxWidth: '420px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            {toast.showIntroControls && (
              <div className="mt-3 space-y-3 border-t border-white/20 pt-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      dontShowAgain 
                        ? 'bg-white border-white' 
                        : 'border-white/60 hover:border-white'
                    }`}
                  >
                    {dontShowAgain && <Check className="w-2.5 h-2.5 text-gray-900" />}
                  </button>
                  <label 
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    className="text-xs text-white/80 cursor-pointer hover:text-white transition-colors"
                  >
                    Don't show me again
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSkipIntro}
                    className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                  >
                    Skip Intro
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            title="Dismiss"
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
        title: "📈 Level Up!",
        message: "You've grown stronger! Time to face bigger challenges... and bigger monsters!",
        type: 'achievement' as const
      },
      {
        title: "🌟 Power Gained!",
        message: "A new level of power awaits! Your enemies will tremble... or at least roll higher initiative.",
        type: 'achievement' as const
      }
    ],
    achievementUnlocked: [
      {
        title: "🏆 Achievement Unlocked!",
        message: "You've accomplished something special! Your legend grows with each milestone.",
        type: 'achievement' as const
      },
      {
        title: "⭐ Milestone Reached!",
        message: "Another badge of honor earned! Your character's story becomes more legendary.",
        type: 'achievement' as const
      }
    ],
    questCompleted: [
      {
        title: "✅ Quest Complete!",
        message: "Another adventure finished! The realm is a little safer... or more dangerous, depending on your choices.",
        type: 'success' as const
      },
      {
        title: "🎯 Mission Accomplished!",
        message: "Quest objectives achieved! Time to collect your rewards and plan the next adventure.",
        type: 'success' as const
      }
    ],
    itemFound: [
      {
        title: "💎 Treasure Discovered!",
        message: "A valuable find! Let's hope it's not cursed... or if it is, that the curse is at least interesting.",
        type: 'fun' as const
      },
      {
        title: "🔍 Loot Acquired!",
        message: "Your search has paid off! Another piece of equipment to make you more formidable.",
        type: 'fun' as const
      }
    ],
    npcInteraction: [
      {
        title: "👥 New Friend Made!",
        message: "You've met someone interesting! NPCs remember how you treat them... choose wisely.",
        type: 'fun' as const
      },
      {
        title: "🤝 Social Success!",
        message: "A successful interaction! Your reputation in this area has improved.",
        type: 'success' as const
      }
    ],
    explorationMilestone: [
      {
        title: "🗺️ New Territory!",
        message: "You've discovered a new area! The map of your adventures grows larger.",
        type: 'fun' as const
      },
      {
        title: "🌟 Exploration Bonus!",
        message: "Your curiosity has been rewarded! New locations mean new opportunities.",
        type: 'fun' as const
      }
    ]
  };

  const messages = funMessages[action as keyof typeof funMessages] || [
    {
      title: "🎉 Achievement!",
      message: "Something wonderful has happened!",
      type: 'fun' as const
    }
  ];

  const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...selectedMessage,
    duration: 5000
  };
};

export default ToastNotifications; 