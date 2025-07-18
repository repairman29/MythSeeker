import React, { useState } from 'react';
import { Sword, User, Package, Map, BookOpen, Bot } from 'lucide-react';

const mainTabs = [
  { key: 'gameplay', label: 'Gameplay', icon: <Sword size={18} /> },
  { key: 'automated', label: 'AI Games', icon: <Bot size={18} /> },
  { key: 'character', label: 'Character Sheet', icon: <User size={18} /> },
  { key: 'inventory', label: 'Inventory', icon: <Package size={18} /> },
  { key: 'map', label: 'World Map', icon: <Map size={18} /> },
  { key: 'log', label: 'Campaign Log', icon: <BookOpen size={18} /> },
];

const MainTabs: React.FC<{
  active: string;
  onTabChange: (key: string) => void;
  children: React.ReactNode[];
}> = ({ active, onTabChange, children }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-black/10 px-2 lg:px-4 py-2">
        <div className="flex space-x-1 lg:space-x-2 overflow-x-auto scrollbar-hide">
          {mainTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-all whitespace-nowrap min-w-fit ${
                active === tab.key 
                  ? 'bg-white/20 text-yellow-300' 
                  : 'text-blue-200 hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span className="ml-1 lg:ml-2 text-sm lg:text-base">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-2 lg:p-4 bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
        {children[mainTabs.findIndex(tab => tab.key === active)]}
      </div>
    </div>
  );
};

export default MainTabs; 