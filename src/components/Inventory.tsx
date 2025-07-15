import React, { useState } from 'react';
import { Package, Sword, Shield, Zap, Heart, Coins, Trash2, Plus, Minus } from 'lucide-react';

interface InventoryProps {
  character: any;
}

const Inventory: React.FC<InventoryProps> = ({ character }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-bold mb-2">No Character Selected</h2>
          <p className="text-blue-200">Create a character to view their inventory</p>
        </div>
      </div>
    );
  }

  const inventory = character.inventory || {};
  const equipment = character.equipment || {};

  const getItemIcon = (itemName: string) => {
    if (itemName.toLowerCase().includes('sword') || itemName.toLowerCase().includes('blade')) return <Sword size={16} />;
    if (itemName.toLowerCase().includes('armor') || itemName.toLowerCase().includes('mail')) return <Shield size={16} />;
    if (itemName.toLowerCase().includes('potion') || itemName.toLowerCase().includes('heal')) return <Heart size={16} />;
    if (itemName.toLowerCase().includes('staff') || itemName.toLowerCase().includes('magic')) return <Zap size={16} />;
    if (itemName.toLowerCase().includes('gold') || itemName.toLowerCase().includes('coin')) return <Coins size={16} />;
    return <Package size={16} />;
  };

  const getItemRarityColor = (itemName: string) => {
    if (itemName.toLowerCase().includes('legendary')) return 'text-yellow-400';
    if (itemName.toLowerCase().includes('rare')) return 'text-purple-400';
    if (itemName.toLowerCase().includes('uncommon')) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="h-full flex text-white">
      {/* Inventory List */}
      <div className="w-1/2 p-6 border-r border-white/20">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Package size={24} className="text-blue-400" />
          <span>Inventory</span>
        </h2>
        
        <div className="space-y-2 max-h-96 overflow-auto">
          {Object.entries(inventory).map(([itemName, quantity]) => (
            <div
              key={itemName}
              onClick={() => setSelectedItem(itemName)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedItem === itemName ? 'bg-blue-600/30 border border-blue-400' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-400">{getItemIcon(itemName)}</div>
                  <div>
                    <div className={`font-semibold ${getItemRarityColor(itemName)}`}>{itemName}</div>
                    <div className="text-sm text-blue-200">Quantity: {quantity as number}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-white/20 rounded">
                    <Plus size={14} />
                  </button>
                  <button className="p-1 hover:bg-white/20 rounded">
                    <Minus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {Object.keys(inventory).length === 0 && (
            <div className="text-center py-8 text-blue-200">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>Inventory is empty</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="w-1/2 p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Shield size={24} className="text-yellow-400" />
          <span>Equipment</span>
        </h2>
        
        <div className="space-y-4">
          {/* Weapon Slot */}
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <Sword size={20} className="text-red-400" />
              <span className="font-semibold">Weapon</span>
            </div>
            {equipment.weapon ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${getItemRarityColor(equipment.weapon.name)}`}>
                    {equipment.weapon.name}
                  </div>
                  <div className="text-sm text-blue-200">Equipped</div>
                </div>
                <button className="p-2 hover:bg-red-600/30 rounded text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="text-blue-200 text-sm">No weapon equipped</div>
            )}
          </div>

          {/* Armor Slot */}
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <Shield size={20} className="text-blue-400" />
              <span className="font-semibold">Armor</span>
            </div>
            {equipment.armor ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${getItemRarityColor(equipment.armor.name)}`}>
                    {equipment.armor.name}
                  </div>
                  <div className="text-sm text-blue-200">Equipped</div>
                </div>
                <button className="p-2 hover:bg-red-600/30 rounded text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="text-blue-200 text-sm">No armor equipped</div>
            )}
          </div>

          {/* Item Details */}
          {selectedItem && (
            <div className="bg-white/10 rounded-lg p-4 border border-white/20 mt-6">
              <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
                {getItemIcon(selectedItem)}
                <span className={getItemRarityColor(selectedItem)}>{selectedItem}</span>
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-200">Type:</span>
                  <span className="text-white">
                    {selectedItem.toLowerCase().includes('sword') || selectedItem.toLowerCase().includes('blade') ? 'Weapon' :
                     selectedItem.toLowerCase().includes('armor') || selectedItem.toLowerCase().includes('mail') ? 'Armor' :
                     selectedItem.toLowerCase().includes('potion') ? 'Consumable' : 'Item'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Quantity:</span>
                  <span className="text-white">{inventory[selectedItem] as number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Rarity:</span>
                  <span className={getItemRarityColor(selectedItem)}>
                    {selectedItem.toLowerCase().includes('legendary') ? 'Legendary' :
                     selectedItem.toLowerCase().includes('rare') ? 'Rare' :
                     selectedItem.toLowerCase().includes('uncommon') ? 'Uncommon' : 'Common'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
                  Use Item
                </button>
                <button className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all">
                  Equip Item
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory; 