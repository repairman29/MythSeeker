import React, { useState } from 'react';
import { X, HelpCircle, MessageSquare, Users, Map, Star, Zap, Sword, Shield, Sparkles, Book, Target, Eye, Crosshair } from 'lucide-react';

interface SimpleHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimpleHelp: React.FC<SimpleHelpProps> = ({ isOpen, onClose }) => {
  const [currentTip, setCurrentTip] = useState(0);

  const funTips = [
    {
      icon: <Sword className="w-8 h-8 text-blue-400" />,
      title: "⚔️ How to Play",
      content: "Just type what you want to do! The AI understands natural language like 'I attack the goblin' or 'I search the chest for treasure'.",
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-green-400" />,
      title: "💬 Chat with AI DM",
      content: "The main area is where you chat with your AI Dungeon Master. Type your actions, ask questions, or just roleplay!",
      color: "from-green-600 to-emerald-600"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-400" />,
      title: "👥 Party & Tools",
      content: "Click the floating action button (bottom right) to access party chat, character sheets, inventory, and campaign tools.",
      color: "from-purple-600 to-pink-600"
    },
    {
      icon: <Map className="w-8 h-8 text-yellow-400" />,
      title: "🗺️ Navigation",
      content: "Use the left sidebar to switch between campaigns, characters, party management, world exploration, and combat.",
      color: "from-yellow-600 to-orange-600"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
      title: "✨ Pro Tips",
      content: "• Be descriptive in your actions\n• Ask the AI for details\n• Use the right drawer for party tools\n• Your choices have real consequences!",
      color: "from-indigo-600 to-purple-600"
    }
  ];

  const handleNext = () => {
    setCurrentTip((prev) => (prev + 1) % funTips.length);
  };

  const handlePrev = () => {
    setCurrentTip((prev) => (prev - 1 + funTips.length) % funTips.length);
  };

  if (!isOpen) return null;

  const currentTipData = funTips[currentTip];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-gradient-to-br ${currentTipData.color} rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl transform transition-all duration-500`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {currentTipData.icon}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentTipData.title}
          </h2>
          
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
              {currentTipData.content}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mb-6">
            {funTips.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentTip ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex space-x-3">
            <button
              onClick={handlePrev}
              className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-white/90 transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>

          {/* Fun footer */}
          <div className="mt-6 p-3 bg-white/10 rounded-lg">
            <p className="text-white/70 text-xs">
              💡 <strong>Remember:</strong> The AI remembers everything you do. Choose your words wisely!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleHelp; 