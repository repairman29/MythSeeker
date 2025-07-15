import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ChevronLeft, ChevronRight, Play, Pause, SkipForward, BookOpen, Lightbulb, Target, Users, Settings } from 'lucide-react';
import Tooltip from './Tooltip';

interface HelpStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  action?: string;
  actionLabel?: string;
}

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: string;
  onAction?: (action: string) => void;
}

const HelpSystem: React.FC<HelpSystemProps> = ({ isOpen, onClose, currentScreen, onAction }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const helpContent = {
    welcome: [
      {
        id: 'welcome-intro',
        title: 'Welcome to MythSeeker!',
        content: 'You\'re about to embark on an epic AI-powered RPG adventure. Let me show you around!',
        action: 'next',
        actionLabel: 'Get Started'
      },
      {
        id: 'character-creation',
        title: 'Create Your Hero',
        content: 'Choose your character class, customize your stats, and write your backstory. Each class has unique abilities and playstyles.',
        action: 'next',
        actionLabel: 'Continue'
      },
      {
        id: 'campaign-creation',
        title: 'Start Your Adventure',
        content: 'Create or join campaigns with different themes like Fantasy, Sci-Fi, Horror, and more. Each theme offers unique experiences.',
        action: 'next',
        actionLabel: 'Continue'
      }
    ],
    lobby: [
      {
        id: 'lobby-overview',
        title: 'Campaign Lobby',
        content: 'This is where you manage your campaigns. Create new ones, join existing ones, or continue your adventures.',
        action: 'next',
        actionLabel: 'Continue'
      },
      {
        id: 'create-campaign',
        title: 'Create Campaign',
        content: 'Click "Create New Campaign" to start a new adventure. Choose a theme and invite friends with the campaign code.',
        action: 'next',
        actionLabel: 'Continue'
      },
      {
        id: 'join-campaign',
        title: 'Join Campaign',
        content: 'Enter a 6-character campaign code to join an existing game. Make sure you have the code from your Game Master.',
        action: 'next',
        actionLabel: 'Continue'
      }
    ],
    game: [
      {
        id: 'game-interface',
        title: 'Game Interface',
        content: 'This is your main game area. Chat with the AI Dungeon Master, roll dice, and make decisions that shape your story.',
        action: 'next',
        actionLabel: 'Continue'
      },
      {
        id: 'character-status',
        title: 'Character Status',
        content: 'Keep track of your health, mana, experience, and gold. These stats change based on your actions and choices.',
        action: 'next',
        actionLabel: 'Continue'
      },
      {
        id: 'chat-input',
        title: 'Chat with AI',
        content: 'Type your actions and responses here. Be descriptive! The AI will respond based on your character, the world, and your choices.',
        action: 'next',
        actionLabel: 'Continue'
      },
      {
        id: 'dice-roller',
        title: 'Dice Rolling',
        content: 'Click the dice button to roll for skill checks, combat, or any action that needs a random element. Different situations call for different dice.',
        action: 'next',
        actionLabel: 'Continue'
      },
      {
        id: 'tabs-navigation',
        title: 'Game Tabs',
        content: 'Switch between different views: Gameplay (main chat), Map (world exploration), Quests (active missions), and Combat (battle system).',
        action: 'next',
        actionLabel: 'Continue'
      }
    ]
  };

  const currentHelpSteps = helpContent[currentScreen as keyof typeof helpContent] || [];

  useEffect(() => {
    if (isOpen && currentHelpSteps.length > 0) {
      setCurrentStep(0);
      setIsPlaying(false);
    }
  }, [isOpen, currentScreen]);

  useEffect(() => {
    if (isPlaying && currentHelpSteps.length > 0) {
      const timer = setTimeout(() => {
        if (currentStep < currentHelpSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, currentHelpSteps.length]);

  const handleNext = () => {
    if (currentStep < currentHelpSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
    }
    handleNext();
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isOpen || currentHelpSteps.length === 0) return null;

  const currentHelp = currentHelpSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-blue-900/95 to-purple-900/95 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <HelpCircle size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Interactive Help</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip content="Auto-play tutorial" ariaLabel="Auto-play">
              <button
                onClick={toggleAutoPlay}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                aria-label={isPlaying ? 'Pause auto-play' : 'Start auto-play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </Tooltip>
            <Tooltip content="Skip tutorial" ariaLabel="Skip">
              <button
                onClick={handleSkip}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                aria-label="Skip tutorial"
              >
                <SkipForward size={16} />
              </button>
            </Tooltip>
            <Tooltip content="Close help" ariaLabel="Close">
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                aria-label="Close help"
              >
                <X size={16} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-3">{currentHelp.title}</h3>
          <p className="text-gray-300 leading-relaxed">{currentHelp.content}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {currentHelpSteps.length}</span>
            <span>{Math.round(((currentStep + 1) / currentHelpSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / currentHelpSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous step"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <div className="flex space-x-2">
            {currentHelp.action && (
              <button
                onClick={() => handleAction(currentHelp.action!)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
              >
                {currentHelp.actionLabel || 'Continue'}
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStep === currentHelpSteps.length - 1}
            className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next step"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-3 bg-white/10 rounded-lg border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb size={16} className="text-yellow-400" />
            <span className="text-sm font-medium text-white">Quick Tips</span>
          </div>
          <div className="text-xs text-gray-300 space-y-1">
            <p>• Be descriptive in your actions for better AI responses</p>
            <p>• Use the dice roller for skill checks and combat</p>
            <p>• Explore different tabs to access all game features</p>
            <p>• Your choices have real consequences in the story</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSystem; 