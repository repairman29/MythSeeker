import React, { useState } from 'react';
import { Target, CheckCircle, Circle, Star, Award, MapPin, Clock, Users, Sword, Shield, Zap } from 'lucide-react';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  maxProgress: number;
  type: 'kill' | 'collect' | 'explore' | 'talk' | 'craft' | 'deliver';
  target?: string;
  location?: string;
}

export interface QuestReward {
  experience: number;
  gold: number;
  items?: Array<{
    name: string;
    quantity: number;
    rarity: string;
  }>;
  reputation?: Array<{
    faction: string;
    amount: number;
  }>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'weekly' | 'faction';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';
  level: number;
  objectives: QuestObjective[];
  rewards: QuestReward;
  status: 'available' | 'active' | 'completed' | 'failed';
  timeLimit?: number; // in minutes
  startTime?: number;
  completedTime?: number;
  giver?: string;
  location?: string;
  prerequisites?: string[]; // quest IDs that must be completed first
}

interface QuestSystemProps {
  quests: Quest[];
  onAcceptQuest: (questId: string) => void;
  onCompleteObjective: (questId: string, objectiveId: string) => void;
  onAbandonQuest: (questId: string) => void;
  onTrackQuest: (questId: string) => void;
  trackedQuestId?: string;
}

const QuestSystem: React.FC<QuestSystemProps> = ({
  quests,
  onAcceptQuest,
  onCompleteObjective,
  onAbandonQuest,
  onTrackQuest,
  trackedQuestId
}) => {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'available' | 'completed'>('all');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQuestTypeIcon = (type: string) => {
    switch (type) {
      case 'main': return <Star className="text-yellow-400" size={16} />;
      case 'side': return <Circle className="text-blue-400" size={16} />;
      case 'daily': return <Clock className="text-green-400" size={16} />;
      case 'weekly': return <Award className="text-purple-400" size={16} />;
      case 'faction': return <Users className="text-orange-400" size={16} />;
      default: return <Target size={16} />;
    }
  };

  const getObjectiveIcon = (type: string) => {
    switch (type) {
      case 'kill': return <Sword size={14} />;
      case 'collect': return <Award size={14} />;
      case 'explore': return <MapPin size={14} />;
      case 'talk': return <Users size={14} />;
      case 'craft': return <Shield size={14} />;
      case 'deliver': return <Target size={14} />;
      default: return <Circle size={14} />;
    }
  };

  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true;
    return quest.status === filter;
  });

  const completedObjectives = (quest: Quest) => {
    return quest.objectives.filter(obj => obj.completed).length;
  };

  const totalObjectives = (quest: Quest) => {
    return quest.objectives.length;
  };

  return (
    <div className="h-full flex">
      {/* Quest List */}
      <div className="w-1/3 bg-black/20 border-r border-white/20 p-4 overflow-auto">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-3">Quests</h3>
          
          {/* Filter Buttons */}
          <div className="flex space-x-2 mb-4">
            {(['all', 'active', 'available', 'completed'] as const).map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded text-sm capitalize transition-all ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredQuests.map(quest => (
            <div
              key={quest.id}
              onClick={() => setSelectedQuest(quest)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                selectedQuest?.id === quest.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : quest.status === 'active'
                  ? 'border-green-400 bg-green-500/10'
                  : quest.status === 'completed'
                  ? 'border-gray-400 bg-gray-500/10'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getQuestTypeIcon(quest.type)}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm">{quest.title}</h4>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </span>
                      <span className="text-blue-200">Lv.{quest.level}</span>
                      {quest.status === 'active' && (
                        <span className="text-green-400">
                          {completedObjectives(quest)}/{totalObjectives(quest)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  {quest.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackQuest(quest.id);
                      }}
                      className={`p-1 rounded ${
                        trackedQuestId === quest.id
                          ? 'bg-yellow-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Target size={12} />
                    </button>
                  )}
                  
                  {quest.status === 'available' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptQuest(quest.id);
                      }}
                      className="p-1 rounded bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle size={12} />
                    </button>
                  )}
                  
                  {quest.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbandonQuest(quest.id);
                      }}
                      className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      <Circle size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quest Details */}
      <div className="flex-1 p-4 overflow-auto">
        {selectedQuest ? (
          <div className="space-y-4">
            {/* Quest Header */}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getQuestTypeIcon(selectedQuest.type)}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedQuest.title}</h2>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className={getDifficultyColor(selectedQuest.difficulty)}>
                        {selectedQuest.difficulty}
                      </span>
                      <span className="text-blue-200">Level {selectedQuest.level}</span>
                      <span className="text-gray-400 capitalize">{selectedQuest.type} quest</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-sm">
                  {selectedQuest.giver && (
                    <div className="text-blue-200">Given by: {selectedQuest.giver}</div>
                  )}
                  {selectedQuest.location && (
                    <div className="text-green-200">Location: {selectedQuest.location}</div>
                  )}
                </div>
              </div>
              
              <p className="text-white/80 text-sm leading-relaxed">{selectedQuest.description}</p>
            </div>

            {/* Objectives */}
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Objectives</h3>
              <div className="space-y-3">
                {selectedQuest.objectives.map(objective => (
                  <div
                    key={objective.id}
                    className={`flex items-center space-x-3 p-2 rounded ${
                      objective.completed ? 'bg-green-500/20' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {objective.completed ? (
                        <CheckCircle className="text-green-400" size={16} />
                      ) : (
                        getObjectiveIcon(objective.type)
                      )}
                      <span className={`text-sm ${objective.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                        {objective.description}
                      </span>
                    </div>
                    
                    {objective.maxProgress > 1 && (
                      <div className="ml-auto text-xs text-blue-200">
                        {objective.progress}/{objective.maxProgress}
                      </div>
                    )}
                    
                    {objective.target && (
                      <div className="text-xs text-gray-400">
                        Target: {objective.target}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Rewards</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Star size={16} />
                    <span>{selectedQuest.rewards.experience} Experience</span>
                  </div>
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Award size={16} />
                    <span>{selectedQuest.rewards.gold} Gold</span>
                  </div>
                </div>
                
                {selectedQuest.rewards.items && selectedQuest.rewards.items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Items:</h4>
                    <div className="space-y-1">
                      {selectedQuest.rewards.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-blue-200">{item.name}</span>
                          <span className="text-gray-400">x{item.quantity}</span>
                          <span className={`text-xs ${
                            item.rarity === 'common' ? 'text-gray-400' :
                            item.rarity === 'uncommon' ? 'text-green-400' :
                            item.rarity === 'rare' ? 'text-blue-400' :
                            item.rarity === 'epic' ? 'text-purple-400' :
                            'text-yellow-400'
                          }`}>
                            {item.rarity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quest Actions */}
            <div className="flex space-x-3">
              {selectedQuest.status === 'available' && (
                <button
                  onClick={() => onAcceptQuest(selectedQuest.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Accept Quest
                </button>
              )}
              
              {selectedQuest.status === 'active' && (
                <>
                  <button
                    onClick={() => onTrackQuest(selectedQuest.id)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      trackedQuestId === selectedQuest.id
                        ? 'bg-yellow-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {trackedQuestId === selectedQuest.id ? 'Untrack' : 'Track Quest'}
                  </button>
                  <button
                    onClick={() => onAbandonQuest(selectedQuest.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                  >
                    Abandon Quest
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-white/60 mt-8">
            <Target size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a quest to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestSystem; 