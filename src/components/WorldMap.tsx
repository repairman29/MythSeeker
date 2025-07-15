import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Eye, Star, Clock } from 'lucide-react';

interface WorldMapProps {
  worldState: any;
}

const WorldMap: React.FC<WorldMapProps> = ({ worldState }) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Sample world data - in a real app this would come from worldState
  const worldLocations = [
    { id: 'tavern', name: 'The Prancing Pony', type: 'tavern', x: 20, y: 30, discovered: true, description: 'A cozy inn where travelers gather' },
    { id: 'dungeon', name: 'Ancient Crypt', type: 'dungeon', x: 60, y: 20, discovered: true, description: 'Dark depths hold ancient secrets' },
    { id: 'forest', name: 'Mystic Grove', type: 'forest', x: 40, y: 60, discovered: true, description: 'Enchanted forest with magical creatures' },
    { id: 'castle', name: 'Dragon\'s Keep', type: 'castle', x: 80, y: 40, discovered: false, description: 'Legendary fortress of the ancient dragon' },
    { id: 'village', name: 'Riverside Village', type: 'village', x: 30, y: 70, discovered: true, description: 'Peaceful village by the river' },
    { id: 'mountain', name: 'Crystal Peak', type: 'mountain', x: 70, y: 80, discovered: false, description: 'Mountain of precious crystals' }
  ];

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'tavern': return '🍺';
      case 'dungeon': return '⚔️';
      case 'forest': return '🌲';
      case 'castle': return '🏰';
      case 'village': return '🏘️';
      case 'mountain': return '⛰️';
      default: return '📍';
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'tavern': return 'text-yellow-400';
      case 'dungeon': return 'text-red-400';
      case 'forest': return 'text-green-400';
      case 'castle': return 'text-purple-400';
      case 'village': return 'text-blue-400';
      case 'mountain': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="h-full flex text-white">
      {/* Map Display */}
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <MapPin size={24} className="text-green-400" />
          <span>World Map</span>
        </h2>
        
        {/* Interactive Map */}
        <div className="relative bg-gradient-to-br from-blue-900 via-green-900 to-brown-900 rounded-xl p-8 border border-white/20 h-96">
          {/* Grid lines for reference */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="absolute border-l border-white/30" style={{ left: `${i * 10}%` }} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="absolute border-t border-white/30" style={{ top: `${i * 10}%` }} />
            ))}
          </div>
          
          {/* Location markers */}
          {worldLocations.map((location) => (
            <div
              key={location.id}
              onClick={() => setSelectedLocation(location.id)}
              className={`absolute cursor-pointer transition-all ${
                selectedLocation === location.id ? 'scale-125' : 'hover:scale-110'
              }`}
              style={{ left: `${location.x}%`, top: `${location.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`text-2xl ${location.discovered ? getLocationColor(location.type) : 'text-gray-600'}`}>
                {getLocationIcon(location.type)}
              </div>
              {location.discovered && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                  <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {location.name}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Compass */}
          <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-2">
            <Compass size={24} className="text-white" />
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-black/50 rounded-lg p-3">
            <div className="text-sm font-semibold mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <span>🍺</span>
                <span>Tavern</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⚔️</span>
                <span>Dungeon</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🌲</span>
                <span>Forest</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🏰</span>
                <span>Castle</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="w-80 p-6 border-l border-white/20">
        <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <Navigation size={20} className="text-blue-400" />
          <span>Location Details</span>
        </h3>
        
        {selectedLocation ? (
          (() => {
            const location = worldLocations.find(loc => loc.id === selectedLocation);
            if (!location) return null;
            
            return (
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{getLocationIcon(location.type)}</span>
                  <div>
                    <h4 className={`text-lg font-bold ${getLocationColor(location.type)}`}>
                      {location.name}
                    </h4>
                    <p className="text-sm text-blue-200 capitalize">{location.type}</p>
                  </div>
                </div>
                
                <p className="text-blue-200 text-sm mb-4">{location.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Eye size={14} className="text-blue-400" />
                    <span className="text-blue-200">Status:</span>
                    <span className={location.discovered ? 'text-green-400' : 'text-yellow-400'}>
                      {location.discovered ? 'Discovered' : 'Undiscovered'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-blue-400" />
                    <span className="text-blue-200">Coordinates:</span>
                    <span className="text-white">{location.x}%, {location.y}%</span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
                    Travel Here
                  </button>
                  {!location.discovered && (
                    <button className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-all">
                      Explore
                    </button>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-center py-8 text-blue-200">
            <MapPin size={32} className="mx-auto mb-2 opacity-50" />
            <p>Select a location on the map</p>
          </div>
        )}
        
        {/* Quick Stats */}
        <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-semibold mb-3 flex items-center space-x-2">
            <Star size={16} className="text-yellow-400" />
            <span>Exploration Progress</span>
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-200">Discovered:</span>
              <span className="text-white">{worldLocations.filter(loc => loc.discovered).length}/{worldLocations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Completion:</span>
              <span className="text-white">
                {Math.round((worldLocations.filter(loc => loc.discovered).length / worldLocations.length) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap; 