// TODO: Refactor for magical, responsive, immersive dice rolling experience (see task list)
// TODO: Add roll history integration next
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
// @ts-expect-error - Cannon.js types are not available
import * as CANNON from 'cannon';
import * as Tone from 'tone';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface DiceRoller3DProps {
  isOpen: boolean;
  onClose: (result?: number) => void;
  onRollComplete?: (result: number) => void;
  sides?: number; // Number of sides for the dice (e.g., 6, 20)
}

interface DiceSet {
  id: string;
  name: string;
  color: number;
  roughness: number;
  metalness: number;
  emissive?: number;
  emissiveIntensity?: number;
}

const DICE_SETS: DiceSet[] = [
  { id: 'classic', name: 'Classic Purple', color: 0x8b5cf6, roughness: 0.5, metalness: 0.8 },
  { id: 'crystal', name: 'Crystal Blue', color: 0x3b82f6, roughness: 0.1, metalness: 0.9, emissive: 0xe40af, emissiveIntensity: 0.2 },
  { id: 'golden', name: 'Golden', color: 0xfbbf24, roughness: 0.0, metalness: 1 },
  { id: 'emerald', name: 'Emerald', color: 0x10b981, roughness: 0.0, metalness: 0.7 },
  { id: 'ruby', name: 'Ruby', color: 0xef4444, roughness: 0.0, metalness: 0.6 },
  { id: 'obsidian', name: 'Obsidian', color: 0x1f2937, roughness: 0.8, metalness: 0.3 },
  { id: 'wooden', name: 'Wooden', color: 0x92400e, roughness: 0.9, metalness: 1 },
  { id: 'neon', name: 'Neon Pink', color: 0xec4899, roughness: 0.2, metalness: 0.8, emissive: 0xc4899, emissiveIntensity: 0.3 },
];

const DiceRoller3D: React.FC<DiceRoller3DProps> = ({ isOpen, onClose, onRollComplete, sides = 6 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollCount, setRollCount] = useState(0); // Track rolls to prevent rapid re-rolls
  const [showShakeHint, setShowShakeHint] = useState(false);
  const [isShakeEnabled, setIsShakeEnabled] = useState(false);
  const [selectedDiceSet, setSelectedDiceSet] = useState<DiceSet>(DICE_SETS[0]);
  const [showDiceSelector, setShowDiceSelector] = useState(false);

  // Three.js and Cannon.js variables
  const scene = useRef<THREE.Scene | null>(null);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const world = useRef<CANNON.World | null>(null);
  const diceMesh = useRef<THREE.Mesh | null>(null);
  const diceBody = useRef<CANNON.Body | null>(null);
  const groundMesh = useRef<THREE.Mesh | null>(null);
  const groundBody = useRef<CANNON.Body | null>(null);
  const lastRollTime = useRef(0);
  const controls = useRef<OrbitControls | null>(null); // Ref for OrbitControls
  const animationFrameId = useRef<number | null>(null);

  // Sound effect
  const diceSound = useRef<Tone.Sampler | null>(null);

  // Shake detection variables
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const shakeThreshold = 15; // Adjust sensitivity
  const shakeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Haptic feedback
  const vibrate = useCallback(() => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate([30, 50, 30]);
    }
  }, []);

  // Create the dice mesh and body (updated with dice set theming)
  const createDice = useCallback((numSides: number, diceSet: DiceSet) => {
    if (!scene.current || !world.current) return;
    
    // Remove old dice if exists
    if (diceMesh.current) {
      scene.current.remove(diceMesh.current);
      diceMesh.current.geometry.dispose();
      (diceMesh.current.material as THREE.Material).dispose();
    }
    if (diceBody.current) {
      world.current.removeBody(diceBody.current);
    }

    let geometry: THREE.BufferGeometry;
    let shape: any;
    let scaleFactor = 1; // Adjust size based on dice type

    // Helper to extract vertices and faces for Cannon.js
    function getVerticesAndFaces(geometry: THREE.BufferGeometry) {
      const posAttr = geometry.getAttribute('position');
      const vertices: CANNON.Vec3[] = [];
      for (let i = 0; i < posAttr.count; i++) {
        vertices.push(new CANNON.Vec3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)));
      }
      const faces: number[][] = [];
      if (geometry.index) {
        const index = geometry.index.array;
        for (let i = 0; i < index.length; i += 3) {
          faces.push([index[i], index[i + 1], index[i + 2]]);
        }
      }
      return { vertices, faces };
    }

    switch (numSides) {
      case 4: { // Tetrahedron (d4)
        geometry = new THREE.TetrahedronGeometry(1 * scaleFactor);
        const { vertices, faces } = getVerticesAndFaces(geometry);
        shape = new CANNON.ConvexPolyhedron({ vertices, faces });
        break;
      }
      case 6: { // Cube (d6)
        geometry = new THREE.BoxGeometry(1 * scaleFactor, 1 * scaleFactor, 1 * scaleFactor);
        shape = new CANNON.Box(new CANNON.Vec3(0.5 * scaleFactor, 0.5 * scaleFactor, 0.5 * scaleFactor));
        break;
      }
      case 8: { // Octahedron (d8)
        geometry = new THREE.OctahedronGeometry(1 * scaleFactor);
        const { vertices, faces } = getVerticesAndFaces(geometry);
        shape = new CANNON.ConvexPolyhedron({ vertices, faces });
        break;
      }
      case 10: { // D10 (custom shape, often approximated by a decagonal prism or irregular polyhedron)
        // For simplicity, let's use a Dodecahedron and map results
        geometry = new THREE.DodecahedronGeometry(1 * scaleFactor);
        const { vertices, faces } = getVerticesAndFaces(geometry);
        shape = new CANNON.ConvexPolyhedron({ vertices, faces });
        break;
      }
      case 12: { // Dodecahedron (d12)
        geometry = new THREE.DodecahedronGeometry(1 * scaleFactor);
        const { vertices, faces } = getVerticesAndFaces(geometry);
        shape = new CANNON.ConvexPolyhedron({ vertices, faces });
        break;
      }
      case 20: { // Icosahedron (d20)
        geometry = new THREE.IcosahedronGeometry(1 * scaleFactor);
        const { vertices, faces } = getVerticesAndFaces(geometry);
        shape = new CANNON.ConvexPolyhedron({ vertices, faces });
        break;
      }
      default:
        console.warn(`Unsupported dice sides: ${numSides}. Defaulting to d6.`);
        geometry = new THREE.BoxGeometry(1, 1, 1);
        shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color: diceSet.color,
      roughness: diceSet.roughness,
      metalness: diceSet.metalness,
      emissive: diceSet.emissive || 0x000000,
      emissiveIntensity: diceSet.emissiveIntensity || 0,
    });
    diceMesh.current = new THREE.Mesh(geometry, material);
    scene.current.add(diceMesh.current);

    diceBody.current = new CANNON.Body({ mass: 1, shape: shape });
    diceBody.current.position.set(0, 5, 0); // Start high above ground
    world.current.addBody(diceBody.current);

    // Add a small initial random impulse to make it fall naturally
    diceBody.current.applyImpulse(
      new CANNON.Vec3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5),
      diceBody.current.position
    );
  }, [scene, world]);

  // Handle device motion for shake detection
  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (!event.accelerationIncludingGravity) return;
    
    const { x, y, z } = event.accelerationIncludingGravity;
    const acceleration = { x: x || 0, y: y || 0, z: z || 0 };
    
    const deltaX = Math.abs(acceleration.x - lastAcceleration.current.x);
    const deltaY = Math.abs(acceleration.y - lastAcceleration.current.y);
    const deltaZ = Math.abs(acceleration.z - lastAcceleration.current.z);
    
    const totalDelta = deltaX + deltaY + deltaZ;
    
    if (totalDelta > shakeThreshold && !isRolling && shakeTimeout.current === null) {
      shakeTimeout.current = setTimeout(() => {
        rollDice();
        shakeTimeout.current = null;
      }, 100);
    }
    
    lastAcceleration.current = acceleration;
  }, [isRolling]);

  // Responsive canvas: ResizeObserver
  useEffect(() => {
    if (!canvasRef.current) return;
    const resize = () => {
      if (renderer.current && camera.current && canvasRef.current) {
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        renderer.current.setSize(width, height, false);
        camera.current.aspect = width / height;
        camera.current.updateProjectionMatrix();
      }
    };
    resize();
    const observer = new window.ResizeObserver(resize);
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Initialize Tone.js Sampler for dice sound
  useEffect(() => {
    if (!diceSound.current) {
      diceSound.current = new Tone.Sampler({
        urls: {
          C3: "https://cdn.jsdelivr.net/gh/Tonejs/Tone.js/examples/audio/casio/c3.mp3", // Placeholder sound
        },
        onload: () => {
          console.log("Dice sound loaded!");
        },
      }).toDestination();
    }
  }, []);

  const playDiceSound = useCallback(() => {
    if (diceSound.current) {
      Tone.start(); // Ensure audio context is started
      diceSound.current.triggerAttackRelease("C3", "8n");
    }
  }, []);

  // Setup Three.js scene and Cannon.js world
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // --- Scene Setup ---
    scene.current = new THREE.Scene();
    scene.current.background = new THREE.Color(0x1a202c); // Dark background

    // --- Camera Setup ---
    camera.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.current.position.set(0, 5, 10); // Adjust camera position for better view
    camera.current.lookAt(0, 0, 0);

    // --- Renderer Setup ---
    renderer.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.current.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.current.setPixelRatio(window.devicePixelRatio);

    // --- OrbitControls Setup ---
    controls.current = new OrbitControls(camera.current, renderer.current.domElement);
    controls.current.enableDamping = true; // Smooth camera movement
    controls.current.dampingFactor = 0.05;
    controls.current.screenSpacePanning = false;
    controls.current.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
    // On mobile, limit controls for better UX
    if (window.innerWidth < 768) {
      controls.current.enableZoom = false;
      controls.current.enablePan = false;
    }

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.current.add(directionalLight);

    // --- Cannon.js World Setup ---
    world.current = new CANNON.World();
    world.current.gravity.set(0, -9.82, 0); // m/s²
    world.current.broadphase = new CANNON.NaiveBroadphase();
    world.current.solver.iterations = 10;

    // --- Ground Plane ---
    const groundShape = new CANNON.Plane();
    groundBody.current = new CANNON.Body({ mass: 0, shape: groundShape });
    groundBody.current.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be horizontal
    world.current.addBody(groundBody.current);

    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, side: THREE.DoubleSide }); // Dark gray
    groundMesh.current = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.current.rotation.x = -Math.PI / 2;
    scene.current.add(groundMesh.current);

    // --- Dice Creation (Initial) ---
    createDice(sides, selectedDiceSet);

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (renderer.current) {
        renderer.current.dispose();
      }
      if (controls.current) {
        controls.current.dispose();
      }
      if (world.current) {
        world.current.removeBody(diceBody.current!);
        world.current.removeBody(groundBody.current!);
      }
      scene.current = null;
      camera.current = null;
      renderer.current = null;
      world.current = null;
      diceMesh.current = null;
      diceBody.current = null;
      groundMesh.current = null;
      groundBody.current = null;
      setResult(null);
      setIsRolling(false);
    };
  }, [isOpen, sides, selectedDiceSet, createDice]);

  // Update dice when dice set changes
  useEffect(() => {
    if (isOpen && scene.current && world.current) {
      createDice(sides, selectedDiceSet);
    }
  }, [selectedDiceSet, sides, isOpen, createDice]);

  // Main animation loop (optimized for performance)
  useEffect(() => {
    if (!isOpen || !renderer.current || !scene.current || !camera.current || !world.current || !diceMesh.current || !diceBody.current) return;
    let running = true;
    const animate = () => {
      if (!running) return;
      animationFrameId.current = requestAnimationFrame(animate);
      world.current!.step(1 / 60);
      if (diceMesh.current && diceBody.current) {
        diceMesh.current.position.copy(diceBody.current.position as any);
        diceMesh.current.quaternion.copy(diceBody.current.quaternion as any);
        if (isRolling && diceBody.current.sleepState === CANNON.Body.SLEEPING) {
          const rollResult = getDiceRollResult(diceBody.current, sides);
          if (rollResult !== null) {
            setResult(rollResult);
            setIsRolling(false);
            playDiceSound();
            if (onRollComplete) {
              onRollComplete(rollResult);
            }
          }
        }
      }
      if (controls.current) {
        controls.current.update();
      }
      renderer.current!.render(scene.current!, camera.current!);
    };
    animate();
    return () => {
      running = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isOpen, sides, isRolling, playDiceSound, onRollComplete]);

  // Setup shake detection
  useEffect(() => {
    if (!isOpen) return;
    
    const isMobile = window.innerWidth < 768;
    const hasDeviceMotion = typeof DeviceMotionEvent !== 'undefined';
    if (isMobile && hasDeviceMotion) {
      setIsShakeEnabled(true);
      setShowShakeHint(true);
      
      // Request permission on iOS
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission().then((permission: string) => {
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        });
      } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
      
      const hintTimeout = setTimeout(() => setShowShakeHint(false), 5000);
      return () => {
        window.removeEventListener('devicemotion', handleDeviceMotion);
        if (shakeTimeout.current) {
          clearTimeout(shakeTimeout.current);
        }
        clearTimeout(hintTimeout);
      };
    }
  }, [isOpen, handleDeviceMotion]);

  // TODO: Add shake-to-roll (DeviceMotion API)
  // TODO: Add roll history integration
  // TODO: Add visual polish (glow, anticipation, particles)
  // TODO: Add animated result reveal
  // TODO: Add haptics and richer sound
  // TODO: Add accessibility improvements

  // Determine the dice roll result based on its orientation
  const getDiceRollResult = (body: CANNON.Body, numSides: number): number | null => {
    const quaternion = body.quaternion;
    const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

    let maxDot = -Infinity;
    let result = null;

    // Define face normals for common polyhedra
    const faceNormals: { [key: number]: { vector: THREE.Vector3; value: number }[] } = {
      4: [ // d4
        { vector: new THREE.Vector3(0, 1, 0), value: 1 },
        { vector: new THREE.Vector3(0.9428, -0.3333, 0), value: 2 },
        { vector: new THREE.Vector3(-0.4714, -0.3333, 0.8165), value: 3 },
        { vector: new THREE.Vector3(-0.4714, -0.3333, -0.8165), value: 4 },
      ],
      6: [ // d6 (cube faces)
        { vector: new THREE.Vector3(0, 1, 0), value: 6 }, // Top face
        { vector: new THREE.Vector3(0, -1, 0), value: 1 }, // Bottom face
        { vector: new THREE.Vector3(1, 0, 0), value: 4 },  // Right face
        { vector: new THREE.Vector3(-1, 0, 0), value: 3 }, // Left face
        { vector: new THREE.Vector3(0, 0, 1), value: 2 },  // Front face
        { vector: new THREE.Vector3(0, 0, -1), value: 5 }, // Back face
      ],
      8: [ // d8 (octahedron faces) - simplified mapping
        { vector: new THREE.Vector3(0, 1, 0), value: 8 },
        { vector: new THREE.Vector3(0, -1, 0), value: 1 },
        // Others are more complex, but we can approximate by finding the "most up" face
      ],
      10: [ // d10 (often a pentagonal trapezohedron) - simplified mapping
        { vector: new THREE.Vector3(0, 1, 0), value: 10 }, // Top point
        { vector: new THREE.Vector3(0, -1, 0), value: 0 }, // Bottom point (for 0-9 or 1-10)
      ],
      12: [ // d12 (dodecahedron faces) - simplified mapping
        { vector: new THREE.Vector3(0, 1, 0), value: 12 },
        { vector: new THREE.Vector3(0, -1, 0), value: 1 },
      ],
      20: [ // d20 (icosahedron faces) - simplified mapping
        { vector: new THREE.Vector3(0, 1, 0), value: 20 },
        { vector: new THREE.Vector3(0, -1, 0), value: 1 },
      ],
    };

    const currentFaceNormals = faceNormals[numSides];
    if (!currentFaceNormals) {
      // For complex polyhedra or unsupported types, find the face pointing most directly upwards
      // This is a simplified approach and might not map perfectly to actual dice numbers
      // A more robust solution would involve pre-calculating face normals and their corresponding values
      // for each specific polyhedron type.
      return Math.floor(Math.random() * numSides) + 1; // Fallback to random for now
    }

    for (const face of currentFaceNormals) {
      const dot = upVector.dot(face.vector);
      if (dot > maxDot) {
        maxDot = dot;
        result = face.value;
      }
    }

    // Special handling for d10 (0-9 or 1-10)
    if (numSides === 10 && result === 0) {
      return 10; // If it lands on '0' face, typically means 10
    }

    return result;
  };

  // Roll the dice (enhanced with haptics)
  const rollDice = useCallback(() => {
    if (!diceBody.current || !world.current || isRolling) return;
    
    // Prevent rapid re-rolls
    if (Date.now() - lastRollTime.current < 2000) { // 2 second cooldown
        console.log("Please wait before rolling again.");
        return;
    }

    setIsRolling(true);
    setResult(null); // Clear previous result
    setRollCount(prev => prev + 1); // Increment roll count
    lastRollTime.current = Date.now();

    // Haptic feedback on roll
    vibrate();

    // Reset position and velocity
    diceBody.current.position.set(
      (Math.random() - 0.5) * 2, // Random X
      5 + Math.random() * 2,    // High Y
      (Math.random() - 0.5) * 2  // Random Z
    );
    diceBody.current.velocity.set(0, 0, 0);
    diceBody.current.angularVelocity.set(0, 0, 0);

    // Apply random impulse and torque
    const impulseStrength = 5 + Math.random() * 5;
    const torqueStrength = 0.5 + Math.random() * 0.5;

    diceBody.current.applyImpulse(
      new CANNON.Vec3(
        (Math.random() - 0.5) * impulseStrength,
        (Math.random() * 0.5 + 0.5) * impulseStrength, // Always push upwards
        (Math.random() - 0.5) * impulseStrength
      ),
      diceBody.current.position
    );

    diceBody.current.applyTorque(
      new CANNON.Vec3(
        (Math.random() - 0.5) * torqueStrength,
        (Math.random() - 0.5) * torqueStrength,
        (Math.random() - 0.5) * torqueStrength
      )
    );

    diceBody.current.wakeUp();
  }, [isRolling, vibrate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-lg rounded-2xl p-8 border border-purple-400/30 shadow-2xl max-w-lg w-full mx-4 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <h3 className="text-2xl font-bold mb-6 text-white text-center">
            🎲 Roll d{sides}
          </h3>
          <button
            onClick={() => setShowDiceSelector(!showDiceSelector)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🎨 Dice
          </button>
        </div>

        {/* Dice Set Selector */}
        {showDiceSelector && (
          <div className="w-full mb-4 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-inner">
            <h4 className="text-white font-semibold mb-3 text-center">Choose Your Dice Set</h4>
            <div className="grid grid-cols-2 gap-2">
              {DICE_SETS.map((diceSet) => (
                <button
                  key={diceSet.id}
                  onClick={() => {
                    setSelectedDiceSet(diceSet);
                    setShowDiceSelector(false);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDiceSet.id === diceSet.id
                      ? 'border-purple-400 bg-purple-600/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-white text-sm font-medium text-center">{diceSet.name}</div>
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mt-1"
                    style={{ backgroundColor: `#${diceSet.color.toString(16).padStart(6, '0')}` }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shake to Roll Hint */}
        {showShakeHint && isShakeEnabled && (
          <div className="mb-4 p-3 bg-blue-500 rounded-lg border border-blue-400/30 text-center">
            <div className="text-blue-300 text-sm font-medium">
              📱 Shake your device to roll!
            </div>
          </div>
        )}

        {/* 3D Canvas for Dice */}
        <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-inner">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
        {/* Roll Button */}
        <button
          onClick={rollDice}
          disabled={isRolling}
          className="mt-6 px-8 py-4 bg-gradient-to-br from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all text-white font-bold text-lg shadow-lg transform hover:scale-105 disabled:transform-none"
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
        {/* Result Display */}
        {result !== null && (
          <div className="mt-6 p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30 w-full text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2 animate-bounce">
              🎯 Result: {result}
            </div>
            <div className="text-yellow-200">Your fate is sealed!</div>
          </div>
        )}
        {/* Close Button */}
        <button
          onClick={() => onClose(result || undefined)}
          className="w-full mt-4 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DiceRoller3D; 