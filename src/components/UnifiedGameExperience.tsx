import React, { useState, useEffect } from 'react';
import { UniversalGameInterface } from './UniversalGameInterface';
// import { DiceSystem3D } from './DiceSystem3D'; // Temporarily disabled due to React version conflicts
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, Zap, Users, Sparkles, ArrowLeft, Dice1, Bot, BookOpen, Sword } from 'lucide-react';
import { DiceRoll } from '../types/dice';

interface UnifiedGameExperienceProps {
  user: any;
}

type GameMode = 'selection' | 'solo-ai' | 'quick-combat' | 'multiplayer' | 'resume' | 'training' | 'combat-scenario';

interface GameOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  quickStart: boolean;
  action: () => void;
}

export const UnifiedGameExperience: React.FC<UnifiedGameExperienceProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [gameMode, setGameMode] = useState<GameMode>('selection');
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [diceHistory, setDiceHistory] = useState<DiceRoll[]>([]);

  // Check for training/combat scenarios from routing state AND URL parameters
  useEffect(() => {
    const routingState = location.state;
    const urlParams = new URLSearchParams(location.search);
    
    // Force console log that can't be optimized away
    window.console.log('🔍 UnifiedGameExperience: PRODUCTION CHECK - Routing state:', routingState);
    window.console.log('🔍 UnifiedGameExperience: PRODUCTION CHECK - Routing state details:', JSON.stringify(routingState, null, 2));
    window.console.log('🔍 UnifiedGameExperience: PRODUCTION CHECK - URL params:', urlParams.toString());
    window.console.log('🔍 UnifiedGameExperience: PRODUCTION CHECK - URL route params:', params);
    window.console.log('🔍 PRODUCTION CHECK - Current gameMode:', gameMode);
    window.console.log('🔍 PRODUCTION CHECK - Location pathname:', location.pathname);
    
    // Check URL parameters as backup
    const gameTypeFromUrl = urlParams.get('gameType');
    const trainingTypeFromUrl = urlParams.get('trainingType');
    const isTrainingFromUrl = urlParams.get('isTraining') === 'true';
    
    // Extract route parameters
    const { sessionId, trainingType, scenarioType, campaignId } = params;
    
    window.console.log('🔍 PRODUCTION CHECK - gameType from state:', routingState?.gameType);
    window.console.log('🔍 PRODUCTION CHECK - gameType from URL:', gameTypeFromUrl);
    window.console.log('🔍 PRODUCTION CHECK - isTraining from URL:', isTrainingFromUrl);
    window.console.log('🔍 PRODUCTION CHECK - Route params:', { sessionId, trainingType, scenarioType, campaignId });

    // Determine game mode from URL route structure
    if (trainingType) {
      window.console.log('🎯 PRODUCTION - Training session detected via URL route:', trainingType);
      setGameMode('training');
    } else if (scenarioType) {
      window.console.log('⚔️ PRODUCTION - Combat scenario detected via URL route:', scenarioType);
      setGameMode('combat-scenario');
    } else if (campaignId) {
      window.console.log('📖 PRODUCTION - Campaign session detected via URL route:', campaignId);
      setGameMode('multiplayer');
    } else if (sessionId) {
      window.console.log('🎮 PRODUCTION - Generic session detected via URL route:', sessionId);
      // Determine session type from routing state or default to solo-ai
      const actualGameType = routingState?.gameType || gameTypeFromUrl;
      if (actualGameType === 'training' || isTrainingFromUrl) {
        setGameMode('training');
      } else if (actualGameType === 'combat') {
        setGameMode('combat-scenario');
      } else {
        setGameMode('solo-ai');
      }
    } else if (routingState || gameTypeFromUrl) {
      const actualGameType = routingState?.gameType || gameTypeFromUrl;
      
      if (actualGameType === 'training' || isTrainingFromUrl) {
        window.console.log('🎯 PRODUCTION - Training session detected via state/params:', { 
          actualGameType, 
          routingState: routingState?.gameType, 
          urlGameType: gameTypeFromUrl,
          isTrainingFromUrl 
        });
        setGameMode('training');
      } else if (actualGameType === 'combat') {
        window.console.log('⚔️ PRODUCTION - Combat scenario detected:', { actualGameType, routingState, urlParams: urlParams.toString() });
        // Check if this is actually a training session within combat
        const isTrainingCombat = routingState?.sessionConfig?.isTraining || 
                                routingState?.sessionConfig?.customPrompt?.includes('training') ||
                                routingState?.isTraining;
        
        if (isTrainingCombat) {
          window.console.log('🎯 PRODUCTION - Combat training session detected, switching to training mode');
          setGameMode('training');
        } else {
          setGameMode('combat-scenario');
        }
      } else {
        window.console.log('⚠️ PRODUCTION - Unknown routing state or params:', { actualGameType, routingState, urlParams: urlParams.toString() });
      }
    } else {
      window.console.log('❌ PRODUCTION - No routing state, URL params, or route params found - defaulting to selection');
    }
  }, [location.state, location.search, gameMode, params]);

  // Handle dice roll completion
  const handleDiceRollComplete = (roll: DiceRoll) => {
    setDiceHistory(prev => [roll, ...prev.slice(0, 9)]); // Keep last 10 rolls
    console.log('Dice roll completed:', roll);
  };

  const gameOptions: GameOption[] = [
    {
      id: 'solo-ai',
      title: 'Solo AI Adventure',
      description: 'Start an instant AI-powered RPG session with AI companions',
      icon: <Bot className="w-6 h-6" />,
      badge: 'Popular',
      quickStart: true,
      action: () => setGameMode('solo-ai')
    },
    {
      id: 'quick-combat',
      title: 'Quick Combat',
      description: 'Jump into tactical combat with 3D dice and full mechanics',
      icon: <Sword className="w-6 h-6" />,
      badge: 'New',
      quickStart: true,
      action: () => setGameMode('quick-combat')
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer Campaign',
      description: 'Join or create a campaign with friends',
      icon: <Users className="w-6 h-6" />,
      badge: '',
      quickStart: false,
      action: () => setGameMode('multiplayer')
    },
    {
      id: 'resume',
      title: 'Resume Adventure',
      description: 'Continue your existing campaigns and adventures',
      icon: <BookOpen className="w-6 h-6" />,
      badge: '',
      quickStart: false,
      action: () => setGameMode('resume')
    },
    {
      id: 'dice-roller',
      title: '3D Dice Roller',
      description: 'Beautiful 3D physics-based dice for any occasion',
      icon: <Dice1 className="w-6 h-6" />,
      badge: 'Enhanced',
      quickStart: true,
      action: () => setShowDiceRoller(true)
    }
  ];

  // Get recent campaigns and characters
  useEffect(() => {
    // Load user's campaigns and characters here
    // This would integrate with your existing services
  }, [user]);

  const renderGameSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Choose Your Adventure
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unified gaming experience with 3D dice, AI companions, and seamless multiplayer
          </p>
        </div>

        {/* Quick Start Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="text-yellow-400" />
            Quick Start
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {gameOptions.filter(option => option.quickStart).map(option => (
              <div
                key={option.id}
                className="group relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-purple-400/50 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={option.action}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                      {option.icon}
                    </div>
                    {option.badge && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-400/30">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
                  <p className="text-gray-400 text-sm">{option.description}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Full Options */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">All Game Modes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameOptions.map(option => (
              <div
                key={option.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-400/30 transition-all duration-300 cursor-pointer transform hover:scale-102"
                onClick={option.action}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-blue-400">
                      {option.icon}
                    </div>
                    <h3 className="font-semibold">{option.title}</h3>
                    {option.badge && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Dice Rolls */}
        {diceHistory.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Dice1 className="text-purple-400" />
              Recent Dice Rolls
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {diceHistory.slice(0, 5).map((roll, index) => (
                <div key={`${roll.id}-${index}`} className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{roll.total}</div>
                  <div className="text-xs text-gray-400">
                    {roll.config.count}d{roll.config.sides}
                  </div>
                  {roll.context && (
                    <div className="text-xs text-gray-500 mt-1 truncate">{roll.context}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3D Dice Roller Modal - Temporarily disabled */}
      {/* <DiceSystem3D
        isOpen={showDiceRoller}
        onClose={() => setShowDiceRoller(false)}
        onRollComplete={handleDiceRollComplete}
        theme="CLASSIC"
        enablePhysics={true}
        enableSounds={true}
        rollContext="Unified Game Experience"
        playerName={user?.displayName || 'Player'}
      /> */}
      
      {/* Temporary 2D dice replacement */}
      {showDiceRoller && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🎲 Dice Roller</h3>
              <button
                onClick={() => setShowDiceRoller(false)}
                className="text-gray-300 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎲</div>
              <button
                onClick={() => {
                  const result = Math.floor(Math.random() * 20) + 1;
                  handleDiceRollComplete({
                    id: `temp-${Date.now()}`,
                    config: { sides: 20, count: 1 },
                    results: [{ value: result, discarded: false }],
                    total: result,
                    timestamp: Date.now(),
                    metadata: { rollContext: 'Unified Game Experience' }
                  });
                  setShowDiceRoller(false);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Roll d20
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGameMode = () => {
    const routingState = location.state;
    const urlParams = new URLSearchParams(location.search);
    
    switch (gameMode) {
      case 'solo-ai':
        return (
          <UniversalGameInterface
            user={user}
            mode="automated"
            onBackToSelection={() => setGameMode('selection')}
            enableDiceIntegration={true}
            onDiceRoll={handleDiceRollComplete}
          />
        );
      
      case 'quick-combat':
        return (
          <UniversalGameInterface
            user={user}
            mode="combat"
            onBackToSelection={() => setGameMode('selection')}
            enableDiceIntegration={true}
            onDiceRoll={handleDiceRollComplete}
          />
        );

      case 'training':
        // Build training session config from routing state or URL params
        const trainingConfig = routingState?.sessionConfig || {
          theme: urlParams.get('theme') || 'Training Session',
          description: 'Combat training session', 
          isTraining: true,
          trainingType: routingState?.trainingType || urlParams.get('trainingType') || 'general',
          objectives: [],
          experienceType: 'training',
          customPrompt: routingState?.sessionConfig?.customPrompt || `You are running a training session for ${urlParams.get('theme') || 'Combat Training'}. 

This is a safe training environment focused on skill development and learning. Provide detailed instructional feedback, technique analysis, and step-by-step guidance to help the player improve their abilities.

TRAINING OBJECTIVES:
- Master fundamental techniques
- Receive constructive feedback
- Practice with purpose
- Build confidence through repetition

Be supportive but challenging. Focus on teaching proper form and technique.`
        };

        window.console.log('🎯 PRODUCTION - Training config being passed:', trainingConfig);

        return (
          <UniversalGameInterface
            user={user}
            mode="automated"
            gameId={`training_${trainingConfig.trainingType || 'general'}`}
            onBackToSelection={() => navigate('/combat')}
            enableDiceIntegration={true}
            onDiceRoll={handleDiceRollComplete}
            showManager={false}
            initialCampaign={{
              name: trainingConfig.theme || 'Training Session',
              theme: trainingConfig.theme || 'Training',
              description: trainingConfig.description || 'Combat training session',
              customPrompt: trainingConfig.customPrompt,
              isTraining: true,
              trainingType: trainingConfig.trainingType,
              objectives: trainingConfig.objectives || [],
              experienceType: trainingConfig.experienceType || 'training'
            }}
          />
        );

      case 'combat-scenario':
        return (
          <UniversalGameInterface
            user={user}
            mode="automated"
            gameId={`combat_${routingState?.scenarioType || 'general'}`}
            onBackToSelection={() => navigate('/combat')}
            enableDiceIntegration={true}
            onDiceRoll={handleDiceRollComplete}
            showManager={false}
            initialCampaign={{
              name: routingState?.sessionConfig?.theme || 'Combat Scenario',
              theme: routingState?.sessionConfig?.theme || 'Combat',
              description: routingState?.sessionConfig?.description || 'Combat encounter',
              customPrompt: routingState?.sessionConfig?.customPrompt,
              isCombat: true,
              scenarioType: routingState?.scenarioType,
              difficulty: routingState?.sessionConfig?.difficulty,
              experienceReward: routingState?.sessionConfig?.experienceReward,
              enemies: routingState?.sessionConfig?.enemies || []
            }}
          />
        );

      case 'multiplayer':
        return (
          <UniversalGameInterface
            user={user}
            mode="multiplayer"
            onBackToSelection={() => setGameMode('selection')}
            enableDiceIntegration={true}
            onDiceRoll={handleDiceRollComplete}
          />
        );

      case 'resume':
        // Show campaign selection UI
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setGameMode('selection')}
                className="flex items-center gap-2 text-blue-300 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Game Selection
              </button>
              
              <h1 className="text-3xl font-bold mb-8">Resume Adventure</h1>
              
              <div className="bg-white/10 rounded-xl p-8 text-center">
                <p className="text-gray-300 mb-4">
                  Campaign loading functionality will be integrated here.
                </p>
                <button
                  onClick={() => navigate('/campaigns')}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Go to Campaigns
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return renderGameSelection();
    }
  };

  return renderGameMode();
}; 