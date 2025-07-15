import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Map, 
  Target, 
  Sword, 
  BookOpen, 
  Users, 
  Send, 
  Loader,
  Dice1,
  Dice6,
  Heart,
  Zap,
  Shield,
  Star,
  Award,
  Clock,
  Eye,
  Globe,
  Compass,
  Flag,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize
} from 'lucide-react';
import Tooltip from './Tooltip';

interface GameInterfaceProps {
  campaign?: any;
  messages: any[];
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  sendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isAIThinking: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onStartCombat?: (enemies: any[]) => void;
  worldState?: any;
  character?: any;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const GameInterface: React.FC<GameInterfaceProps> = ({
  campaign,
  messages,
  inputMessage,
  setInputMessage,
  sendMessage,
  handleKeyPress,
  isAIThinking,
  messagesEndRef,
  onStartCombat,
  worldState,
  character,
  onTabChange,
  activeTab = 'gameplay',
  inputRef: propInputRef
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);

  // Use provided inputRef or create a local one
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = propInputRef || localInputRef;

  // Focus management effect - temporarily disabled for debugging
  // useEffect(() => {
  //   if (inputRef.current && !isAIThinking && document.activeElement !== inputRef.current) {
  //     console.log('Focusing input field');
  //     inputRef.current.focus();
  //   }
  // }, [inputMessage, isAIThinking, inputRef]);

  // Debug input changes
  useEffect(() => {
    console.log('Input message changed:', inputMessage);
  }, [inputMessage]);

  const tabs = [
    { 
      key: 'gameplay', 
      label: 'Adventure', 
      icon: <MessageSquare size={18} />, 
      description: 'AI Dungeon Master & Story'
    },
    { 
      key: 'map', 
      label: 'World Map', 
      icon: <Map size={18} />, 
      description: 'Explore the world'
    },
    { 
      key: 'quests', 
      label: 'Quests', 
      icon: <Target size={18} />, 
      description: 'Active quests & objectives'
    },
    { 
      key: 'combat', 
      label: 'Combat', 
      icon: <Sword size={18} />, 
      description: 'Battle system'
    }
  ];

  const rollDice = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    setDiceResult(result);
    setTimeout(() => setDiceResult(null), 2000);
    return result;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'dice':
        setShowDiceRoller(!showDiceRoller);
        break;
      case 'combat':
        onStartCombat?.([{ name: 'Goblin', health: 25, attack: 4 }]);
        break;
      case 'fullscreen':
        setIsFullscreen(!isFullscreen);
        break;
      case 'mute':
        setIsMuted(!isMuted);
        break;
    }
  };

  const renderGameplayTab = () => (
    <div className="flex flex-col h-full">
      {/* Game Header */}
      <div className="p-3 lg:p-4 border-b border-white/20 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg lg:text-xl font-bold text-white">Adventure</h3>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-300">
              <Globe size={16} />
              <span>{worldState?.currentLocation || 'Unknown Location'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip content={isMuted ? 'Unmute audio' : 'Mute audio'} ariaLabel={isMuted ? 'Unmute audio' : 'Mute audio'}>
              <button
                onClick={() => handleQuickAction('mute')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                aria-pressed={isMuted}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </Tooltip>
            <Tooltip content={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'} ariaLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              <button
                onClick={() => handleQuickAction('fullscreen')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </Tooltip>
            <Tooltip content="Game settings and options" ariaLabel="Game settings">
              <button
                onClick={() => handleQuickAction('settings')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Game settings and options"
              >
                <Settings size={16} />
              </button>
            </Tooltip>
          </div>
        </div>
        
        {/* Character Status Bar - Responsive */}
        {character && (
          <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-sm mt-3" role="status" aria-live="polite">
            <Tooltip content="Current and maximum health points" ariaLabel="Health status">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Heart size={14} className="text-red-400" aria-hidden="true" />
                <span className="text-white text-xs lg:text-sm" aria-label={`Health: ${character.health} out of ${character.maxHealth} points`}>
                  {character.health}/{character.maxHealth} HP
                </span>
              </div>
            </Tooltip>
            <Tooltip content="Current and maximum mana points" ariaLabel="Mana status">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Zap size={14} className="text-blue-400" aria-hidden="true" />
                <span className="text-white text-xs lg:text-sm" aria-label={`Mana: ${character.mana} out of ${character.maxMana} points`}>
                  {character.mana}/{character.maxMana} MP
                </span>
              </div>
            </Tooltip>
            <Tooltip content="Current experience points and level" ariaLabel="Experience status">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Star size={14} className="text-yellow-400" aria-hidden="true" />
                <span className="text-white text-xs lg:text-sm" aria-label={`Level ${character.level} with ${character.experience} experience points`}>
                  Lv.{character.level} ({character.experience} XP)
                </span>
              </div>
            </Tooltip>
            <Tooltip content="Current gold amount" ariaLabel="Gold status">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Award size={14} className="text-yellow-500" aria-hidden="true" />
                <span className="text-white text-xs lg:text-sm" aria-label={`${character.gold || 0} gold pieces`}>
                  {character.gold || 0} Gold
                </span>
              </div>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'player' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-full sm:max-w-2xl lg:max-w-3xl rounded-lg p-3 lg:p-4 ${
              message.type === 'player' 
                ? 'bg-blue-600 text-white ml-4 lg:ml-8' 
                : 'bg-white/10 text-white mr-4 lg:mr-8'
            }`}>
              {message.type === 'player' && (
                <div className="text-xs text-blue-200 mb-1 lg:mb-2">{message.character} ({message.playerName})</div>
              )}
              <div className="whitespace-pre-wrap text-sm lg:text-base leading-relaxed">{message.content}</div>
              
                              {message.choices && (
                  <div className="mt-3 space-y-2">
                    {message.choices.map((choice: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(choice)}
                        className="block w-full text-left px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-sm lg:text-base"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              
              {message.diceRoll && (
                <div className="mt-2 text-sm text-yellow-400">
                  🎲 Rolled {message.diceRoll.type}: {message.diceRoll.result} 
                  {message.diceRoll.success ? ' (Success!)' : ' (Failed)'}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isAIThinking && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white rounded-lg p-3 lg:p-4 mr-4 lg:mr-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm lg:text-base">AI Dungeon Master is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 lg:p-4 border-t border-white/20 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="flex space-x-2">
          <Tooltip content="Roll dice for skill checks and combat" ariaLabel="Roll dice">
            <button
              onClick={() => handleQuickAction('dice')}
              className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all"
              aria-label="Roll dice for skill checks and combat"
            >
              <Dice1 size={16} />
            </button>
          </Tooltip>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              console.log('Input onChange:', e.target.value);
              setInputMessage(e.target.value);
            }}
            onKeyDown={(e) => {
              console.log('Input onKeyDown:', e.key);
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            onFocus={(e) => {
              console.log('Input focused');
            }}
            onBlur={(e) => {
              console.log('Input blurred');
            }}
            placeholder="What do you do? (Press Enter to send)"
            className="flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-blue-400 text-sm lg:text-base"
            disabled={isAIThinking}
            ref={inputRef}
            aria-label="Enter your action or message to the AI Dungeon Master"
            aria-describedby="input-help"
          />
          <Tooltip content="Send your message to the AI Dungeon Master" ariaLabel="Send message">
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isAIThinking}
              className="px-4 lg:px-6 py-2 lg:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Send your message to the AI Dungeon Master"
            >
              <Send size={16} />
            </button>
          </Tooltip>
        </div>
        <div id="input-help" className="sr-only">Press Enter to send your message, or use the dice roller for skill checks</div>
        
        {/* Dice Roller */}
        {showDiceRoller && (
          <div className="mt-3 p-3 lg:p-4 bg-white/10 rounded-lg border border-white/20" role="region" aria-label="Dice roller">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm lg:text-base text-white font-medium">Dice Roller</span>
              <Tooltip content="Close dice roller" ariaLabel="Close dice roller">
                <button
                  onClick={() => setShowDiceRoller(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close dice roller"
                >
                  ×
                </button>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Dice selection">
              {[4, 6, 8, 10, 12, 20].map(sides => (
                <Tooltip key={sides} content={`Roll a ${sides}-sided die`} ariaLabel={`Roll d${sides}`}>
                  <button
                    onClick={() => rollDice(sides)}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-all text-sm"
                    aria-label={`Roll a ${sides}-sided die`}
                  >
                    d{sides}
                  </button>
                </Tooltip>
              ))}
            </div>
            {diceResult && (
              <div className="mt-2 text-center" role="status" aria-live="polite">
                <span className="text-2xl font-bold text-yellow-400" aria-label={`Dice result: ${diceResult}`}>{diceResult}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderMapTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-bold text-white mb-2">World Map</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <Globe size={16} />
          <span>{worldState?.currentLocation || 'Unknown Location'}</span>
          <Compass size={16} />
          <span>North</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 bg-gradient-to-b from-gray-900/50 to-black/50">
        <div className="w-full h-full bg-gradient-to-br from-green-900/30 to-blue-900/30 rounded-lg border border-white/20 flex items-center justify-center">
          <div className="text-center">
            <Map size={64} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">Interactive world map coming soon!</p>
            <p className="text-gray-500 text-sm mt-2">Explore locations, discover secrets, and track your journey.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestsTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-bold text-white mb-2">Active Quests</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <Target size={16} />
          <span>{worldState?.activeQuests?.length || 0} active quests</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900/50 to-black/50">
        {worldState?.activeQuests?.length > 0 ? (
          worldState.activeQuests.map((quest: any, index: number) => (
            <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{quest.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">{quest.progress}%</span>
                  <CheckCircle size={16} className="text-green-400" />
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">{quest.description}</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${quest.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Reward: {quest.reward}</span>
                <span>Difficulty: {quest.difficulty}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Target size={64} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No active quests</p>
            <p className="text-gray-500 text-sm mt-2">Talk to NPCs or explore to find new quests!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCombatTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-lg font-bold text-white mb-2">Combat System</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <Sword size={16} />
          <span>Ready for battle</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 bg-gradient-to-b from-gray-900/50 to-black/50">
        <div className="w-full h-full bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg border border-white/20 flex items-center justify-center">
          <div className="text-center">
            <Sword size={64} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">Combat system ready!</p>
            <p className="text-gray-500 text-sm mt-2 mb-4">Engage in tactical turn-based combat.</p>
            <Tooltip content="Start a combat encounter with enemies">
              <button
                onClick={() => handleQuickAction('combat')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Start Combat
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gameplay': return renderGameplayTab();
      case 'map': return renderMapTab();
      case 'quests': return renderQuestsTab();
      case 'combat': return renderCombatTab();
      default: return renderGameplayTab();
    }
  };

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-white/20 bg-gradient-to-r from-blue-900/50 to-purple-900/50" role="tablist" aria-label="Game interface tabs">
        {tabs.map((tab) => (
          <Tooltip key={tab.key} content={tab.description} ariaLabel={tab.description}>
            <button
              onClick={() => onTabChange?.(tab.key)}
              className={`flex items-center space-x-2 px-4 py-3 transition-colors ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-label={tab.description}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GameInterface; 