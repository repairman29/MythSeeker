import React, { useState, useMemo } from 'react';
import { MessageSquare, Search, Filter, Calendar, User, Bot, Settings } from 'lucide-react';

interface CampaignLogProps {
  messages: any[];
}

const CampaignLog: React.FC<CampaignLogProps> = ({ messages }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'player' | 'dm' | 'system'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredMessages = useMemo(() => {
    let filtered = messages.filter(message => {
      const matchesSearch = message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           message.character?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           message.playerName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || message.type === filterType;
      
      return matchesSearch && matchesFilter;
    });

    // Sort messages
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return filtered;
  }, [messages, searchTerm, filterType, sortOrder]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'player': return <User size={16} className="text-blue-400" />;
      case 'dm': return <Bot size={16} className="text-purple-400" />;
      case 'system': return <Settings size={16} className="text-yellow-400" />;
      default: return <MessageSquare size={16} className="text-gray-400" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'player': return 'bg-blue-600/20 border-blue-400/30';
      case 'dm': return 'bg-purple-600/20 border-purple-400/30';
      case 'system': return 'bg-yellow-600/20 border-yellow-400/30';
      default: return 'bg-white/10 border-white/20';
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <MessageSquare size={24} className="text-blue-400" />
            <span>Campaign Log</span>
          </h2>
          <div className="text-sm text-blue-200">
            {filteredMessages.length} of {messages.length} messages
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Messages</option>
            <option value="player">Player Messages</option>
            <option value="dm">DM Messages</option>
            <option value="system">System Messages</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6">
        {filteredMessages.length > 0 ? (
          <div className="space-y-4">
            {filteredMessages.map((message, index) => (
              <div
                key={message.id || index}
                className={`p-4 rounded-lg border ${getMessageColor(message.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getMessageIcon(message.type)}
                    <div>
                      {message.type === 'player' && (
                        <div className="text-sm">
                          <span className="font-semibold text-blue-400">{message.character}</span>
                          <span className="text-blue-200"> ({message.playerName})</span>
                        </div>
                      )}
                      {message.type === 'dm' && (
                        <div className="text-sm font-semibold text-purple-400">Dungeon Master</div>
                      )}
                      {message.type === 'system' && (
                        <div className="text-sm font-semibold text-yellow-400">System</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-blue-200">
                    <Calendar size={12} />
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
                </div>
                
                <div className="text-white whitespace-pre-wrap">{message.content}</div>
                
                {message.choices && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="text-sm text-blue-200 mb-2">Choices:</div>
                    <div className="space-y-1">
                      {message.choices.map((choice: string, choiceIndex: number) => (
                        <div key={choiceIndex} className="text-sm bg-black/20 px-2 py-1 rounded">
                          {choice}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {message.diceRoll && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="text-sm text-yellow-400">
                      🎲 Rolled {message.diceRoll.type}: {message.diceRoll.result}
                      {message.diceRoll.success ? ' (Success!)' : ' (Failed)'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-blue-200">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No messages found</p>
            <p className="text-sm">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start your adventure to see messages here'
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-t border-white/20 bg-white/5">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-blue-400 font-semibold">
              {messages.filter(m => m.type === 'player').length}
            </div>
            <div className="text-blue-200">Player Messages</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 font-semibold">
              {messages.filter(m => m.type === 'dm').length}
            </div>
            <div className="text-blue-200">DM Messages</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold">
              {messages.filter(m => m.type === 'system').length}
            </div>
            <div className="text-blue-200">System Messages</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignLog; 