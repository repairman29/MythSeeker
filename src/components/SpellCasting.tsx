import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { spellcastingService } from '../services/spellcastingService';
// import { DiceSystem3D } from './DiceSystem3D'; // Temporarily disabled due to React version conflicts
import { 
  Spell, 
  Spellcaster, 
  SpellLevel, 
  SpellcastingResult,
  SPELL_SCHOOL_INFO 
} from '../types/spells';
import { DiceRoll as EnhancedDiceRoll } from '../types/dice';

interface SpellCastingProps {
  casterId: string;
  isOpen: boolean;
  onClose: () => void;
  onSpellCast?: (result: SpellcastingResult) => void;
  targetIds?: string[]; // Pre-selected targets from combat
  availableTargets?: Array<{ id: string; name: string; type: string }>;
  combatMode?: boolean; // Whether we're in combat
}

interface SpellSelectionState {
  selectedSpell: Spell | null;
  selectedLevel: SpellLevel | null;
  selectedTargets: string[];
  targetPosition?: { x: number; y: number };
}

const SpellCasting: React.FC<SpellCastingProps> = ({
  casterId,
  isOpen,
  onClose,
  onSpellCast,
  targetIds = [],
  availableTargets = [],
  combatMode = false
}) => {
  const [caster, setCaster] = useState<Spellcaster | null>(null);
  const [spellSelection, setSpellSelection] = useState<SpellSelectionState>({
    selectedSpell: null,
    selectedLevel: null,
    selectedTargets: targetIds
  });
  const [readySpells, setReadySpells] = useState<Array<{ spell: Spell; availableLevels: SpellLevel[] }>>([]);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [pendingCast, setPendingCast] = useState<{ spell: Spell; level: SpellLevel; targets: string[] } | null>(null);
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSpellDetails, setShowSpellDetails] = useState<string | null>(null);

  // Load caster data and ready spells
  useEffect(() => {
    if (isOpen && casterId) {
      const casterData = spellcastingService.getSpellcaster(casterId);
      if (casterData) {
        setCaster(casterData);
        setReadySpells(spellcastingService.getReadySpells(casterId));
      }
    }
  }, [isOpen, casterId]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSpellSelection({
        selectedSpell: null,
        selectedLevel: null,
        selectedTargets: targetIds
      });
    }
  }, [isOpen, targetIds]);

  // Filter spells based on search and filters
  const filteredSpells = useMemo(() => {
    let filtered = readySpells;

    if (searchTerm) {
      filtered = filtered.filter(({ spell }) =>
        spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSchool !== 'all') {
      filtered = filtered.filter(({ spell }) => spell.school === filterSchool);
    }

    if (filterLevel !== 'all') {
      const level = parseInt(filterLevel) as SpellLevel;
      filtered = filtered.filter(({ spell }) => spell.level === level);
    }

    return filtered;
  }, [readySpells, searchTerm, filterSchool, filterLevel]);

  // Handle spell selection
  const handleSpellSelect = useCallback((spell: Spell, level: SpellLevel) => {
    setSpellSelection(prev => ({
      ...prev,
      selectedSpell: spell,
      selectedLevel: level,
      selectedTargets: spell.targets.type === 'self' ? [casterId] : prev.selectedTargets
    }));
  }, [casterId]);

  // Handle target selection
  const handleTargetToggle = useCallback((targetId: string) => {
    setSpellSelection(prev => {
      const { selectedTargets, selectedSpell } = prev;
      const isSelected = selectedTargets.includes(targetId);
      
      let newTargets: string[];
      
      if (selectedSpell?.targets.type === 'single') {
        newTargets = isSelected ? [] : [targetId];
      } else {
        newTargets = isSelected 
          ? selectedTargets.filter(id => id !== targetId)
          : [...selectedTargets, targetId];
      }
      
      return { ...prev, selectedTargets: newTargets };
    });
  }, []);

  // Cast spell
  const castSpell = useCallback(async () => {
    const { selectedSpell, selectedLevel, selectedTargets, targetPosition } = spellSelection;
    
    if (!selectedSpell || selectedLevel === null || !caster) {
      return;
    }

    // Validate targeting
    if (selectedSpell.targets.type === 'single' && selectedTargets.length !== 1) {
      alert('Please select exactly one target');
      return;
    }

    if (selectedSpell.targets.type === 'multiple' && selectedSpell.targets.count && 
        selectedTargets.length > selectedSpell.targets.count) {
      alert(`Please select no more than ${selectedSpell.targets.count} targets`);
      return;
    }

    try {
      // Check if spell involves dice rolls
      if (selectedSpell.spellAttack || selectedSpell.damage || selectedSpell.healing) {
        setPendingCast({ 
          spell: selectedSpell, 
          level: selectedLevel, 
          targets: selectedTargets 
        });
        setShowDiceRoller(true);
      } else {
        // Cast spell directly (no rolls needed)
        const result = await spellcastingService.castSpell(
          casterId,
          selectedSpell.id,
          selectedLevel,
          selectedTargets,
          targetPosition
        );
        
        handleSpellCastComplete(result);
      }
    } catch (error) {
      alert(`Failed to cast spell: ${error}`);
    }
  }, [spellSelection, caster, casterId]);

  // Handle dice roll completion
  const handleDiceRollComplete = useCallback(async (roll: EnhancedDiceRoll) => {
    setShowDiceRoller(false);

    if (!pendingCast) return;

    try {
      const result = await spellcastingService.castSpell(
        casterId,
        pendingCast.spell.id,
        pendingCast.level,
        pendingCast.targets,
        spellSelection.targetPosition
      );

      handleSpellCastComplete(result);
    } catch (error) {
      alert(`Failed to cast spell: ${error}`);
    } finally {
      setPendingCast(null);
    }
  }, [casterId, pendingCast, spellSelection.targetPosition]);

  // Handle spell cast completion
  const handleSpellCastComplete = useCallback((result: SpellcastingResult) => {
    // Update caster data
    const updatedCaster = spellcastingService.getSpellcaster(casterId);
    if (updatedCaster) {
      setCaster(updatedCaster);
      setReadySpells(spellcastingService.getReadySpells(casterId));
    }

    // Reset selection
    setSpellSelection({
      selectedSpell: null,
      selectedLevel: null,
      selectedTargets: []
    });

    // Notify parent component
    if (onSpellCast) {
      onSpellCast(result);
    }

    // Close dialog if in combat mode
    if (combatMode) {
      onClose();
    }
  }, [casterId, onSpellCast, combatMode, onClose]);

  // Get spell school color
  const getSchoolColor = useCallback((school: string) => {
    return SPELL_SCHOOL_INFO[school as keyof typeof SPELL_SCHOOL_INFO]?.color || '#6B7280';
  }, []);

  // Get spell school icon
  const getSchoolIcon = useCallback((school: string) => {
    return SPELL_SCHOOL_INFO[school as keyof typeof SPELL_SCHOOL_INFO]?.icon || '✨';
  }, []);

  // Render spell slot indicators
  const renderSpellSlots = () => {
    if (!caster) return null;

    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Spell Slots</h3>
        <div className="grid grid-cols-5 gap-2">
          {caster.spellSlots.map((slot, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-600">Level {slot.level}</div>
              <div className="flex space-x-1 justify-center mt-1">
                {Array.from({ length: slot.total }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border ${
                      i < slot.used 
                        ? 'bg-gray-400 border-gray-500' 
                        : 'bg-blue-500 border-blue-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {slot.total - slot.used}/{slot.total}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render spell list
  const renderSpellList = () => {
    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSpells.map(({ spell, availableLevels }) => (
          <div
            key={spell.id}
            className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getSchoolIcon(spell.school)}</span>
                  <h4 className="font-semibold">{spell.name}</h4>
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: getSchoolColor(spell.school) }}
                  >
                    {spell.school}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-gray-200">
                    Level {spell.level}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {spell.description}
                </p>
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Range: {typeof spell.range.type === 'number' ? `${spell.range.type} ft` : spell.range.type}</span>
                  <span>Cast: {spell.castingTime.type}</span>
                  {spell.duration.concentration && <span>⏰ Concentration</span>}
                  {spell.ritual && <span>📿 Ritual</span>}
                </div>
              </div>
              
              <div className="flex flex-col space-y-1 ml-4">
                {availableLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => handleSpellSelect(spell, level)}
                    className={`
                      px-3 py-1 rounded text-sm font-medium transition-colors
                      ${spellSelection.selectedSpell?.id === spell.id && spellSelection.selectedLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }
                    `}
                  >
                    {level === 0 ? 'Cantrip' : `Level ${level}`}
                  </button>
                ))}
                
                <button
                  onClick={() => setShowSpellDetails(showSpellDetails === spell.id ? null : spell.id)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Details
                </button>
              </div>
            </div>
            
            {/* Spell details */}
            {showSpellDetails === spell.id && (
              <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Components:</strong>
                    <div className="mt-1">
                      {spell.components.verbal && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 text-xs">V</span>}
                      {spell.components.somatic && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1 text-xs">S</span>}
                      {spell.components.material && <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-1 text-xs">M</span>}
                    </div>
                    {spell.components.materialComponent && (
                      <div className="text-xs text-gray-600 mt-1">
                        {spell.components.materialComponent}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <strong>Duration:</strong> {spell.duration.length || spell.duration.type}
                    {spell.duration.concentration && <span className="text-blue-600"> (Concentration)</span>}
                  </div>
                </div>
                
                {spell.damage && (
                  <div className="mt-2">
                    <strong>Damage:</strong> {spell.damage.map(d => `${d.dice} ${d.type}`).join(', ')}
                  </div>
                )}
                
                {spell.healing && (
                  <div className="mt-2">
                    <strong>Healing:</strong> {spell.healing.map(h => h.dice).join(', ')}
                  </div>
                )}
                
                {spell.higherLevelDescription && (
                  <div className="mt-2">
                    <strong>At Higher Levels:</strong> {spell.higherLevelDescription}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render target selection
  const renderTargetSelection = () => {
    const { selectedSpell, selectedTargets } = spellSelection;
    
    if (!selectedSpell || selectedSpell.targets.type === 'self') return null;

    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">
          Select Targets {selectedSpell.targets.type === 'single' ? '(1 required)' : 
          selectedSpell.targets.count ? `(max ${selectedSpell.targets.count})` : ''}
        </h3>
        
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {availableTargets.map(target => (
            <button
              key={target.id}
              onClick={() => handleTargetToggle(target.id)}
              className={`
                p-2 rounded text-sm text-left transition-colors
                ${selectedTargets.includes(target.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 border'
                }
              `}
            >
              <div className="font-medium">{target.name}</div>
              <div className="text-xs opacity-75">{target.type}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">🪄 Spellcasting</h2>
            {caster && (
              <p className="text-gray-600">
                {caster.class} Level {caster.level} • 
                {caster.spellcastingAbility.ability.toUpperCase()} modifier: +{caster.spellcastingAbility.modifier}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex gap-6">
          {/* Left Panel - Spell Selection */}
          <div className="flex-1 space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search spells..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Schools</option>
                {Object.entries(SPELL_SCHOOL_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.icon} {info.name}
                  </option>
                ))}
              </select>
              
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Levels</option>
                <option value="0">Cantrips</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </div>

            {/* Spell List */}
            {renderSpellList()}
          </div>

          {/* Right Panel - Casting Interface */}
          <div className="w-80 space-y-4">
            {/* Spell Slots */}
            {renderSpellSlots()}

            {/* Selected Spell */}
            {spellSelection.selectedSpell && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Selected Spell</h3>
                <div className="mt-2">
                  <div className="font-medium">{spellSelection.selectedSpell.name}</div>
                  <div className="text-sm text-blue-700">
                    Level {spellSelection.selectedLevel === 0 ? 'Cantrip' : spellSelection.selectedLevel}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {spellSelection.selectedSpell.description.substring(0, 100)}...
                  </div>
                </div>
              </div>
            )}

            {/* Target Selection */}
            {renderTargetSelection()}

            {/* Cast Button */}
            <button
              onClick={castSpell}
              disabled={!spellSelection.selectedSpell || 
                      (spellSelection.selectedSpell?.targets.type !== 'self' && 
                       spellSelection.selectedTargets.length === 0)}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              🪄 Cast Spell
            </button>

            {/* Concentration Status */}
            {caster?.concentratingOn && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-800">
                    ⏰ Concentrating
                  </span>
                  <button
                    onClick={() => spellcastingService.endConcentration(casterId)}
                    className="text-xs text-yellow-600 hover:text-yellow-800"
                  >
                    End
                  </button>
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  {spellcastingService.getSpell(caster.concentratingOn.spellId)?.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3D Dice Roller */}
        {/* <DiceSystem3D
          isOpen={showDiceRoller}
          onClose={() => {
            setShowDiceRoller(false);
            setPendingCast(null);
          }}
          onRollComplete={handleDiceRollComplete}
          rollContext={pendingCast?.spell.name}
          playerName={caster?.class}
        /> */}
      </div>
    </div>
  );
};

export default SpellCasting; 