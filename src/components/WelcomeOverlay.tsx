import React, { useState, useEffect } from 'react';
import { Sparkles, Sword, Shield, Zap, Heart, Star, X, Play, Users, Map, Book } from 'lucide-react';

interface WelcomeOverlayProps {
  character: any;
  onStart: () => void;
  onDismiss: () => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ character, onStart, onDismiss }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const welcomeSteps = [
    {
      icon: <Sparkles className="w-12 h-12 text-purple-400" />,
      title: "🎉 Welcome to MythSeeker!",
      subtitle: `Greetings, ${character?.name || 'Brave Adventurer'}!`,
      message: "You've just created your first character! Time to embark on an epic journey where your choices matter and the AI Dungeon Master is always ready to surprise you.",
      color: "from-purple-600 to-pink-600"
    },
    {
      icon: <Sword className="w-12 h-12 text-blue-400" />,
      title: "⚔️ Your Hero Awaits",
      subtitle: `Level ${character?.level || 1} ${character?.class || 'Adventurer'}`,
      message: `You're a ${character?.class || 'mighty warrior'} with ${character?.health || 100} HP and dreams of glory. The realm is yours to explore!`,
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: <Map className="w-12 h-12 text-green-400" />,
      title: "🗺️ Adventure Beckons",
      subtitle: "Ready to explore?",
      message: "Create a campaign, join friends, or dive into a solo adventure. The AI Dungeon Master is waiting to craft your story!",
      color: "from-green-600 to-emerald-600"
    }
  ];

  const currentWelcome = welcomeSteps[currentStep];

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onStart();
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className={`bg-gradient-to-br ${currentWelcome.color} rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl transform transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {currentWelcome.icon}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentWelcome.title}
          </h2>
          
          <h3 className="text-lg text-white/90 mb-4">
            {currentWelcome.subtitle}
          </h3>
          
          <p className="text-white/80 text-sm leading-relaxed mb-8">
            {currentWelcome.message}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mb-6">
            {welcomeSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Skip Intro
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-white/90 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              {currentStep === welcomeSteps.length - 1 ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Adventure</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Fun tip */}
          <div className="mt-6 p-3 bg-white/10 rounded-lg">
            <p className="text-white/70 text-xs">
              💡 <strong>Pro Tip:</strong> {getRandomTip()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const getRandomTip = () => {
  const tips = [
    "The AI DM remembers everything. Choose your words wisely!",
    "Combat is turn-based and tactical. Position matters!",
    "Your character grows through roleplay, not just combat.",
    "The right drawer has all your party tools and chat.",
    "You can always edit your character from the lobby.",
    "The floating action button is your quick access to everything.",
    "Each class has unique abilities that unlock as you level up.",
    "The world reacts to your choices. No two adventures are alike!"
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

export default WelcomeOverlay; 