import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Message {
  id: string | number;
  type: 'player' | 'dm' | 'system';
  content: string;
  timestamp: Date;
  playerName?: string;
  choices?: string[];
  character?: any;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  character?: any;
  onChoiceSelect?: (choice: string) => void;
  className?: string;
}

const VirtualizedMessageListComponent: React.FC<VirtualizedMessageListProps> = (props) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [parentHeight, setParentHeight] = useState(0);

  // Update parent height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (parentRef.current) {
        setParentHeight(parentRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: props.messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height per message
    overscan: 5, // Number of items to render outside viewport
  });

  // Memoized message rendering function
  const renderMessage = useMemo(() => (message: Message, index: number) => {
    const isPlayer = message.type === 'player';
    const isDM = message.type === 'dm';

    return (
      <div
        key={message.id}
        className={`mb-4 p-4 rounded-lg ${
          isPlayer
            ? 'bg-blue-600/20 border border-blue-400/30 ml-8'
            : isDM
            ? 'bg-purple-600/20 border border-purple-400/30 mr-8'
            : 'bg-gray-600/20 border border-gray-400/30'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isPlayer ? (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {props.character?.name?.charAt(0) || 'P'}
              </div>
            ) : isDM ? (
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                🎲
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">
                {message.playerName?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-white">
                {isPlayer 
                  ? props.character?.name || 'You'
                  : isDM
                  ? 'Dungeon Master'
                  : message.playerName || 'Unknown'
                }
              </span>
              <span className="text-xs text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-blue-100 whitespace-pre-wrap">{message.content}</div>
            
            {/* Choices */}
            {message.choices && message.choices.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.choices.map((choice: string, choiceIndex: number) => (
                  <button
                    key={choiceIndex}
                    onClick={() => props.onChoiceSelect?.(choice)}
                    className="block w-full text-left p-2 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-colors text-sm"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [props.character, props.onChoiceSelect]);

  return (
    <div 
      ref={parentRef}
      className={`overflow-auto ${props.className}`}
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow: any) => {
          const message = props.messages[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderMessage(message, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VirtualizedMessageList = React.memo(VirtualizedMessageListComponent, (prevProps, nextProps) => {
  return prevProps.messages.length === nextProps.messages.length;
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default VirtualizedMessageList; 