import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Send, 
  Eye, 
  Sword, 
  Shield, 
  Users, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Zap, 
  Clock,
  Dice1
} from 'lucide-react';
import Tooltip from './Tooltip';
import DiceRoller from './DiceRoller';
import { gameStateService } from '../services/gameStateService';

interface GameInterfaceProps {
  campaign: any;
  messages: any[];
  inputMessage: string;
  setInputMessage: (message: string) => void;
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
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [showWorldState, setShowWorldState] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Use provided inputRef or create a stable local one
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = propInputRef || localInputRef;

  // Ensure input focus is maintained
  useEffect(() => {
    if (!isAIThinking && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAIThinking, inputRef]);

  // Memoized tabs configuration
  const tabs = useMemo(() => [
    { 
      key: 'gameplay', 
      label: 'Adventure', 
      icon: <Dice1 size={18} />, 
      description: 'AI Dungeon Master & Story'
    },
    { 
      key: 'map', 
      label: 'World Map', 
      icon: <MapPin size={18} />, 
      description: 'Explore the world'
    },
    { 
      key: 'quests', 
      label: 'Quests', 
      icon: <Dice1 size={18} />, 
      description: 'Active quests & objectives'
    },
    { 
      key: 'combat', 
      label: 'Combat', 
      icon: <Sword size={18} />, 
      description: 'Battle system'
    }
  ], []);

  // Memoized dice rolling function
  const rollDice = useCallback((sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    return result;
  }, []);

  // Dynamic quick actions based on context
  const quickActions = useMemo(() => {
    const actions = [
      { label: 'Roll Dice', action: () => setShowDiceRoller(true), icon: <Dice1 size={16} /> },
      { label: 'Look around', action: () => setInputMessage('I look around to see what\'s here.'), icon: <Eye size={16} /> },
      { label: 'Check character', action: () => onTabChange?.(character ? 'gameplay' : 'combat'), icon: <Shield size={16} /> },
    ];

    // Add context-specific actions
    if (worldState?.inCombat) {
      actions.push(
        { label: 'Attack', action: () => setInputMessage('I attack the nearest enemy.'), icon: <Sword size={16} /> },
        { label: 'Defend', action: () => setInputMessage('I take a defensive stance.'), icon: <Shield size={16} /> }
      );
    }

    if (worldState?.nearbyNPCs?.length > 0) {
      actions.push(
        { label: 'Talk to NPC', action: () => setInputMessage('I approach and greet the nearby person.'), icon: <Users size={16} /> }
      );
    }

    return actions;
  }, [worldState, rollDice, setInputMessage, onTabChange, character]);

  // Memoized message rendering with enhanced visual hierarchy
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <div
        key={message.id || index}
        className={`mb-4 p-4 rounded-lg transition-all ${
          message.type === 'player'
            ? 'bg-blue-600/20 border border-blue-400/30 ml-8'
            : message.type === 'dm'
            ? 'bg-purple-600/20 border border-purple-400/30 mr-8'
            : 'bg-gray-600/20 border border-gray-400/30'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {message.type === 'player' ? (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                {character?.name?.charAt(0) || 'P'}
              </div>
            ) : message.type === 'dm' ? (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg shadow-md">
                🎲
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
                {message.playerName?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white">
                  {message.type === 'player' 
                    ? character?.name || 'Player'
                    : message.type === 'dm'
                    ? 'Dungeon Master'
                    : message.playerName || 'Unknown'
                  }
                </span>
                <span className="text-xs text-gray-400">
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
            </div>
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
            
            {message.choices && message.choices.length > 0 && (
              <div className="mt-4 space-y-2">
                {message.choices.map((choice: string, choiceIndex: number) => {
                  // Determine action type for icon
                  const getActionIcon = (text: string) => {
                    const lowerText = text.toLowerCase();
                    if (lowerText.includes('attack') || lowerText.includes('fight')) return <Sword size={16} />;
                    if (lowerText.includes('talk') || lowerText.includes('speak') || lowerText.includes('ask')) return <Users size={16} />;
                    if (lowerText.includes('look') || lowerText.includes('examine') || lowerText.includes('search')) return <Eye size={16} />;
                    if (lowerText.includes('move') || lowerText.includes('go') || lowerText.includes('walk')) return <MapPin size={16} />;
                    return <Zap size={16} />;
                  };

                  return (
                    <button
                      key={choiceIndex}
                      onClick={() => {
                        setInputMessage(choice);
                        sendMessage();
                      }}
                      className="block w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all text-sm group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-300 hover:text-blue-200 transition-colors">
                          {getActionIcon(choice)}
                        </span>
                        <span className="text-white group-hover:text-blue-100 transition-colors">{choice}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  }, [messages, character, setInputMessage, sendMessage]);

  // Stable input handling functions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, [setInputMessage]);

  const handleSendClick = () => {
    if (!inputMessage.trim() || isAIThinking) return;
    sendMessage();
  };

  // Memoized tab rendering
  const renderedTabs = useMemo(() => {
    return tabs.map(tab => (
      <Tooltip key={tab.key} content={tab.description}>
        <button
          onClick={() => onTabChange?.(tab.key)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === tab.key 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-white/10 text-blue-200 hover:bg-white/20'
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      </Tooltip>
    ));
  }, [tabs, activeTab, onTabChange]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
      {/* Enhanced Top Controls with World State */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 bg-black/20">
        <div className="flex items-center space-x-4">
          {renderedTabs}
          
          {/* World State Toggle */}
          <Tooltip content={showWorldState ? "Hide World Info" : "Show World Info"}>
            <button
              onClick={() => setShowWorldState(!showWorldState)}
              className={`p-2 rounded-lg transition-all ${
                showWorldState ? 'bg-blue-600/20 text-blue-300 bg-white/10 text-blue-200 hover:bg-white/20' : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              <MapPin size={18} />
            </button>
          </Tooltip>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          <div className="flex items-center space-x-1">
            {quickActions.slice(0, 3).map((action, index) => (
              <Tooltip key={index} content={action.label}>
                <button
                  onClick={action.action}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {action.icon}
                </button>
              </Tooltip>
            ))}
          </div>

          {/* Dice Roller */}
          <Tooltip content="Roll Dice">
            <button
              onClick={() => setShowDiceRoller(!showDiceRoller)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Dice1 size={18} className="text-blue-400" />
            </button>
          </Tooltip>

          {/* Sound Toggle */}
          <Tooltip content={isMuted ? "Unmute" : "Mute"}>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMuted ? (
                <VolumeX size={18} className="text-red-400" />
              ) : (
                <Volume2 size={18} className="text-blue-400" />
              )}
            </button>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip content={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 size={18} className="text-blue-400" />
              ) : (
                <Maximize2 size={18} className="text-blue-400" />
              )}
            </button>
          </Tooltip>

          {/* Settings */}
          <Tooltip content="Settings">
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <Settings size={18} className="text-blue-400" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* World State Header - Collapsible */}
      {showWorldState && worldState && (
        <div className="px-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <MapPin size={14} />
                <span>{worldState.currentLocation || 'Unknown Location'}</span>
              </div>
              <div className="flex items-center space-x-1 text-green-300">
                <Clock size={14} />
                <span>{worldState.currentTime || 'Day'}</span>
              </div>
              {worldState.weather && (
                <div className="flex items-center space-x-1 text-yellow-300">
                  <span>☀️</span>
                  <span>{worldState.weather}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              {worldState.inCombat && (
                <span className="bg-red-600/20 text-red-300 px-2 py-1 rounded-full">⚔️ Combat</span>
              )}
              {worldState.activeQuests?.length > 0 && (
                <span className="bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded-full">
                  📜 {worldState.activeQuests.length} Quest{worldState.activeQuests.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {renderedMessages}
          
          {/* AI Thinking Indicator */}
          {isAIThinking && (
            <div className="flex items-center space-x-3 p-4 bg-purple-600/20 border border-purple-400/30 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
              <span className="text-purple-200">Dungeon Master is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area */}
        <div className="p-4 border-t border-white/20 bg-black/20">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="What would you like to do? (Be specific and creative!)"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 transition-colors text-base"
              disabled={isAIThinking}
              autoFocus
            />
            <button
              onClick={handleSendClick}
              disabled={isAIThinking || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-all text-white font-semibold shadow-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Dice Roller Modal */}
      {showDiceRoller && (
        <DiceRoller
          isOpen={showDiceRoller}
          onClose={(results) => {
            setShowDiceRoller(false);
            if (results && results.length > 0) {
              const total = results.reduce((sum, result) => sum + result, 0);
              setInputMessage(`I rolled ${results.join(', ')} for a total of ${total}!`);
              sendMessage();
            }
          }}
          onRollComplete={(results) => {
            const total = results.reduce((sum, result) => sum + result, 0);
            setInputMessage(`I rolled ${results.join(', ')} for a total of ${total}!`);
            sendMessage();
          }}
          defaultDice={[{ sides: 20, count: 1 }]}
        />
      )}
    </div>
  );
};

GameInterface.displayName = 'GameInterface';

export default GameInterface; 