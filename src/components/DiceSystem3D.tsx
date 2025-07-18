import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { 
  DiceConfig, 
  DiceRoll, 
  DiceResult, 
  DiceType, 
  DICE_THEMES, 
  DEFAULT_DICE_SOUNDS,
  calculateDiceTotal,
  applyAdvantageDisadvantage,
  checkCritical,
  shouldExplode,
  shouldReroll
} from '../types/dice';

interface DiceSystem3DProps {
  isOpen: boolean;
  onClose: () => void;
  onRollComplete: (roll: DiceRoll) => void;
  theme?: 'CLASSIC' | 'METAL' | 'MYSTICAL';
  enablePhysics?: boolean;
  enableSounds?: boolean;
  rollContext?: string;
  playerName?: string;
}

interface Die3DProps {
  sides: number;
  position: [number, number, number];
  color: string;
  material: string;
  onSettle: (value: number, position: [number, number, number], rotation: [number, number, number]) => void;
  rollForce: [number, number, number];
  spinForce: [number, number, number];
}

// Individual 3D Die Component
const Die3D: React.FC<Die3DProps> = ({ 
  sides, 
  position, 
  color, 
  material, 
  onSettle, 
  rollForce, 
  spinForce 
}) => {
  const rigidBodyRef = useRef<any>();
  const [settled, setSettled] = useState(false);
  const [finalValue, setFinalValue] = useState<number | null>(null);
  
  const settlementTimer = useRef<NodeJS.Timeout>();

  // Generate geometry based on dice type
  const getDiceGeometry = (sides: number) => {
    switch (sides) {
      case 4: return new THREE.TetrahedronGeometry(1);
      case 6: return new THREE.BoxGeometry(1, 1, 1);
      case 8: return new THREE.OctahedronGeometry(1);
      case 10: return new THREE.ConeGeometry(1, 1.2, 10);
      case 12: return new THREE.DodecahedronGeometry(1);
      case 20: return new THREE.IcosahedronGeometry(1);
      case 100: return new THREE.SphereGeometry(1, 16, 16);
      default: return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  // Get material properties based on material type
  const getMaterialProps = (materialType: string) => {
    switch (materialType) {
      case 'metal':
        return { metalness: 0.8, roughness: 0.2 };
      case 'wood':
        return { metalness: 0.0, roughness: 0.8 };
      case 'crystal':
        return { metalness: 0.0, roughness: 0.0, transparent: true, opacity: 0.8 };
      case 'stone':
        return { metalness: 0.1, roughness: 0.9 };
      default: // plastic
        return { metalness: 0.0, roughness: 0.4 };
    }
  };

  // Calculate dice value based on rotation
  const calculateDiceValue = useCallback((rotation: THREE.Euler, sides: number): number => {
    // This is a simplified calculation - in a real implementation,
    // you'd need more sophisticated face detection based on the specific geometry
    const normalizedRotation = Math.abs(rotation.x + rotation.y + rotation.z) % (Math.PI * 2);
    return Math.floor((normalizedRotation / (Math.PI * 2)) * sides) + 1;
  }, []);

  // Apply initial forces when component mounts
  useEffect(() => {
    if (rigidBodyRef.current && !settled) {
      const rb = rigidBodyRef.current;
      // Apply throwing force
      rb.addForce(new THREE.Vector3(...rollForce), true);
      // Apply spin
      rb.addTorque(new THREE.Vector3(...spinForce), true);
    }
  }, [rollForce, spinForce, settled]);

  // Monitor physics to detect when die has settled
  useFrame(() => {
    if (rigidBodyRef.current && !settled) {
      const rb = rigidBodyRef.current;
      const velocity = rb.linvel();
      const angularVelocity = rb.angvel();
      
      const isStill = Math.abs(velocity.x) < 0.1 && 
                     Math.abs(velocity.y) < 0.1 && 
                     Math.abs(velocity.z) < 0.1 &&
                     Math.abs(angularVelocity.x) < 0.1 &&
                     Math.abs(angularVelocity.y) < 0.1 &&
                     Math.abs(angularVelocity.z) < 0.1;

      if (isStill && !settlementTimer.current) {
        // Wait a bit to make sure it's really settled
        settlementTimer.current = setTimeout(() => {
          if (rigidBodyRef.current) {
            const finalPosition = rb.translation();
            const finalRotation = rb.rotation();
            const value = calculateDiceValue(finalRotation, sides);
            
            setFinalValue(value);
            setSettled(true);
            onSettle(value, 
              [finalPosition.x, finalPosition.y, finalPosition.z],
              [finalRotation.x, finalRotation.y, finalRotation.z]
            );
          }
        }, 500);
      } else if (!isStill && settlementTimer.current) {
        clearTimeout(settlementTimer.current);
        settlementTimer.current = undefined;
      }
    }
  });

  const materialProps = getMaterialProps(material);

  return (
    <RigidBody ref={rigidBodyRef} position={position} colliders="hull">
      <mesh geometry={getDiceGeometry(sides)}>
        <meshStandardMaterial 
          color={color} 
          {...materialProps}
        />
      </mesh>
      {/* Add numbers to dice faces */}
      {settled && finalValue && (
        <Text
          position={[0, 0, 1.2]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {finalValue}
        </Text>
      )}
    </RigidBody>
  );
};

// Dice Rolling Surface
const RollingSurface: React.FC = () => {
  return (
    <>
      <RigidBody type="fixed" position={[0, -2, 0]}>
        <CuboidCollider args={[8, 0.1, 8]} />
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[16, 0.2, 16]} />
          <meshStandardMaterial color="#0f4c3a" roughness={0.8} />
        </mesh>
      </RigidBody>
      
      {/* Side walls to keep dice in bounds */}
      {[
        { pos: [8, 0, 0], args: [0.2, 2, 8] },
        { pos: [-8, 0, 0], args: [0.2, 2, 8] },
        { pos: [0, 0, 8], args: [8, 2, 0.2] },
        { pos: [0, 0, -8], args: [8, 2, 0.2] }
      ].map((wall, i) => (
        <RigidBody key={i} type="fixed" position={wall.pos as [number, number, number]}>
          <CuboidCollider args={wall.args as [number, number, number]} />
          <mesh>
            <boxGeometry args={[wall.args[0] * 2, wall.args[1] * 2, wall.args[2] * 2]} />
            <meshStandardMaterial color="#1a5a4a" transparent opacity={0.3} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
};

// Main 3D Dice System Component
export const DiceSystem3D: React.FC<DiceSystem3DProps> = ({
  isOpen,
  onClose,
  onRollComplete,
  theme = 'CLASSIC',
  enablePhysics = true,
  enableSounds = true,
  rollContext,
  playerName
}) => {
  const [diceConfig, setDiceConfig] = useState<DiceConfig[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollResults, setRollResults] = useState<DiceResult[]>([]);
  const [selectedDiceType, setSelectedDiceType] = useState<DiceType>('d20');
  
  const audioContext = useRef<AudioContext>();
  const sounds = useRef<{ [key: string]: AudioBuffer }>({});

  // Load sound effects
  useEffect(() => {
    if (enableSounds && !audioContext.current) {
      audioContext.current = new AudioContext();
      // Load sound files (simplified - in production, you'd load actual audio files)
      Object.entries(DEFAULT_DICE_SOUNDS).forEach(([key, url]) => {
        // Placeholder for actual audio loading
        console.log(`Loading sound: ${key} from ${url}`);
      });
    }
  }, [enableSounds]);

  // Add dice to the roll
  const addDice = useCallback((diceType: DiceType, count: number = 1) => {
    const sides = parseInt(diceType.slice(1));
    const newDice: DiceConfig = {
      sides,
      count,
      label: `${count}${diceType}`
    };
    
    setDiceConfig(prev => {
      const existing = prev.find(d => d.sides === sides);
      if (existing) {
        return prev.map(d => 
          d.sides === sides 
            ? { ...d, count: d.count + count }
            : d
        );
      }
      return [...prev, newDice];
    });
  }, []);

  // Remove dice from the roll
  const removeDice = useCallback((sides: number) => {
    setDiceConfig(prev => 
      prev.map(d => 
        d.sides === sides && d.count > 0
          ? { ...d, count: d.count - 1 }
          : d
      ).filter(d => d.count > 0)
    );
  }, []);

  // Clear all dice
  const clearDice = useCallback(() => {
    setDiceConfig([]);
    setRollResults([]);
  }, []);

  // Generate random forces for dice throwing
  const generateRollForces = (count: number) => {
    return Array.from({ length: count }, () => ({
      rollForce: [
        (Math.random() - 0.5) * 10,
        Math.random() * 5 + 5,
        (Math.random() - 0.5) * 10
      ] as [number, number, number],
      spinForce: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ] as [number, number, number]
    }));
  };

  // Handle individual die settlement
  const handleDieSettle = useCallback((
    sides: number,
    value: number, 
    position: [number, number, number], 
    rotation: [number, number, number]
  ) => {
    const diceType = `d${sides}` as DiceType;
    const result: DiceResult = {
      value,
      diceType,
      isMax: value === sides,
      isMin: value === 1,
      isCritical: checkCritical({ value, diceType, isMax: value === sides, isMin: value === 1, isCritical: false }, sides),
      position,
      rotation
    };

    setRollResults(prev => {
      const newResults = [...prev, result];
      
      // Check if all dice have settled
      const totalExpectedDice = diceConfig.reduce((sum, config) => sum + config.count, 0);
      if (newResults.length === totalExpectedDice) {
        // All dice settled, process the complete roll
        setTimeout(() => {
          const roll: DiceRoll = {
            id: `roll_${Date.now()}`,
            config: diceConfig[0], // Simplified - handle multiple configs properly
            results: newResults,
            total: calculateDiceTotal(newResults),
            timestamp: Date.now(),
            context: rollContext,
            player: playerName
          };
          
          onRollComplete(roll);
          setIsRolling(false);
        }, 1000);
      }
      
      return newResults;
    });
  }, [diceConfig, rollContext, playerName, onRollComplete]);

  // Execute the dice roll
  const rollDice = useCallback(() => {
    if (diceConfig.length === 0) return;
    
    setIsRolling(true);
    setRollResults([]);
    
    // Play sound effect
    if (enableSounds && audioContext.current) {
      // Placeholder for actual audio playback
      console.log('Playing dice throw sound');
    }
  }, [diceConfig, enableSounds]);

  // Get total dice count
  const getTotalDice = () => diceConfig.reduce((sum, config) => sum + config.count, 0);

  if (!isOpen) return null;

  const themeColors = DICE_THEMES[theme];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">🎲 3D Dice Roller</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dice Selection */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DiceType[]).map(diceType => (
            <button
              key={diceType}
              onClick={() => addDice(diceType)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              style={{ backgroundColor: themeColors.colors[diceType] }}
            >
              {diceType.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Current Dice Configuration */}
        <div className="mb-4">
          <h3 className="text-white mb-2">Current Roll:</h3>
          <div className="flex gap-2 flex-wrap">
            {diceConfig.map(config => (
              <div key={config.sides} className="bg-gray-800 rounded px-3 py-2 flex items-center gap-2">
                <span className="text-white">{config.count} × d{config.sides}</span>
                <button
                  onClick={() => removeDice(config.sides)}
                  className="text-red-400 hover:text-red-300"
                >
                  -
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
          <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
            <Suspense fallback={null}>
              <Environment preset="warehouse" />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              
              {enablePhysics ? (
                <Physics gravity={[0, -20, 0]}>
                  <RollingSurface />
                  
                  {/* Render dice when rolling */}
                  {isRolling && diceConfig.map((config, configIndex) => {
                    const forces = generateRollForces(config.count);
                    return Array.from({ length: config.count }, (_, diceIndex) => {
                      const globalIndex = configIndex * 10 + diceIndex; // Simplified indexing
                      const diceType = `d${config.sides}` as DiceType;
                      return (
                        <Die3D
                          key={`${config.sides}-${diceIndex}`}
                          sides={config.sides}
                          position={[
                            (diceIndex - config.count / 2) * 2,
                            5 + Math.random() * 2,
                            0
                          ]}
                          color={themeColors.colors[diceType]}
                          material={themeColors.material}
                          rollForce={forces[diceIndex]?.rollForce || [0, 0, 0]}
                          spinForce={forces[diceIndex]?.spinForce || [0, 0, 0]}
                          onSettle={(value, pos, rot) => handleDieSettle(config.sides, value, pos, rot)}
                        />
                      );
                    });
                  })}
                </Physics>
              ) : (
                <RollingSurface />
              )}
              
              <ContactShadows position={[0, -2, 0]} opacity={0.4} width={10} height={10} blur={1.5} />
              <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} />
            </Suspense>
          </Canvas>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <button
              onClick={rollDice}
              disabled={getTotalDice() === 0 || isRolling}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              {isRolling ? '🎲 Rolling...' : `🎲 Roll ${getTotalDice()} Dice`}
            </button>
            
            <button
              onClick={clearDice}
              disabled={isRolling}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Results Display */}
          {rollResults.length > 0 && (
            <div className="text-white">
              <span className="text-lg font-bold">Total: {calculateDiceTotal(rollResults)}</span>
              <div className="text-sm">
                {rollResults.map((result, i) => (
                  <span key={i} className={result.isCritical ? 'text-yellow-400' : ''}>
                    {result.value}{i < rollResults.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiceSystem3D; 