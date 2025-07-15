import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dice1, Dice6, Sword, Shield, Zap, Heart, User, Users, Plus, Play, Settings, Sparkles, Flame, Copy, Share2, Star, Award, Package, Hammer, TrendingUp, Target, Clock, Swords, MapPin, Eye, Crosshair, Globe, AlertTriangle, Crown, Calendar, History, ChevronDown, ChevronUp, X, Menu } from 'lucide-react';
import { multiplayerService, MultiplayerGame, Player, GameMessage } from './multiplayer';
import { demoMultiplayerService } from './demoMultiplayer';
import UserProfile from './UserProfile';
import ResumeGame from './ResumeGame';
import { NavBar, TopBar, RightDrawer, MainTabs, CharacterSheet, Inventory, WorldMap, CampaignLog, CombatSystem } from './components';
import FloatingActionButton from './components/FloatingActionButton';
import GameInterface from './components/GameInterface';
import CombatService, { CombatState } from './services/combatService';
import { Combatant, CombatAction } from './components/CombatSystem';

const AIDungeonMaster = () => {
  // Combat service instance
  const combatService = React.useMemo(() => new CombatService(), []);
  
  // Navigation state
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('gameplay');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Game state
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [playerName, setPlayerName] = useState('');
  const [character, setCharacter] = useState<any>(null);
  const [currentCampaign, setCurrentCampaign] = useState<MultiplayerGame | null>(null);
  const [campaigns, setCampaigns] = useState<MultiplayerGame[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState('default');
  const [statusEffects, setStatusEffects] = useState<Record<string, any>>({});
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showLevelUp, setShowLevelUp] = useState<any>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState<any>(null);
  const [combatState, setCombatState] = useState<any>(null);
  const [combatLog, setCombatLog] = useState<any[]>([]);
  const [battleMap, setBattleMap] = useState<any>(null);
  const [selectedCombatant, setSelectedCombatant] = useState<any>(null);
  const [hoveredTile, setHoveredTile] = useState<any>(null);
  const [targetingMode, setTargetingMode] = useState<any>(null);
  const [lineOfSightCache, setLineOfSightCache] = useState<Record<string, any>>({});
  const [worldState, setWorldState] = useState<any>(null);
  const [showWorldEvents, setShowWorldEvents] = useState(false);
  const [pendingChoices, setPendingChoices] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Multiplayer state
  const [isConnected, setIsConnected] = useState(false);
  const [partyState, setPartyState] = useState<{
    players: Player[];
    isHost: boolean;
    lastSync: Date | null;
  }>({
    players: [],
    isHost: false,
    lastSync: null
  });

  // Drawer tab state for right drawer
  const [activeDrawerTab, setActiveDrawerTab] = useState('chat');

  // Generate unique player ID on load
  useEffect(() => {
    if (!playerId) {
      setPlayerId(Date.now().toString(36) + Math.random().toString(36).substr(2));
    }
  }, [playerId]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Multiplayer campaign subscription
  useEffect(() => {
    if (currentCampaign?.id) {
      const unsubscribe = multiplayerService.subscribeToCampaign(
        currentCampaign.id,
        (updatedCampaign) => {
          setCurrentCampaign(updatedCampaign);
          setMessages(updatedCampaign.messages || []);
          setPartyState({
            players: updatedCampaign.players || [],
            isHost: multiplayerService.isHost(updatedCampaign),
            lastSync: new Date()
          });
          setIsConnected(true);
        }
      );

      // Start heartbeat
      const heartbeatCleanup = multiplayerService.startHeartbeat(currentCampaign.id);

      return () => {
        unsubscribe();
        heartbeatCleanup();
      };
    }
  }, [currentCampaign?.id]);

  const scrollToBottom = () => {
    (messagesEndRef.current as HTMLDivElement | null)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Navigation handlers
  const handleNavChange = (navKey: string) => {
    setActiveNav(navKey);
    setCurrentScreen(navKey);
    if (navKey === 'campaigns') {
      setCurrentScreen('lobby');
    } else if (navKey === 'characters') {
      setCurrentScreen('character');
    } else if (navKey === 'combat') {
      setCurrentScreen('combat');
    } else if (navKey === 'gameplay') {
      setCurrentScreen('game');
    }
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
  };

  const handleNewCampaign = () => {
    setActiveNav('campaigns');
    setCurrentScreen('lobby');
  };

  const sendMultiplayerMessage = async (message: string) => {
    if (!message.trim() || !currentCampaign?.id) return;

    try {
      await multiplayerService.sendMessage(currentCampaign.id, {
        type: 'player',
        content: message,
        character: character?.name,
        playerId: playerId!,
        playerName: playerName
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add missing functions that were referenced but not defined


  // Classes with enhanced skill system
  const classes = [
    { 
      name: 'Warrior', 
      icon: '⚔️', 
      stats: { strength: 16, dexterity: 12, intelligence: 10, charisma: 8 },
      actionPoints: { move: 6, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Power Strike', description: 'Deal +50% damage on next attack', cost: 'Action', type: 'attack', range: 1 },
        3: { name: 'Shield Wall', description: 'Reduce all damage by 3 for 3 turns', cost: 'Action', type: 'defense', range: 0 },
        5: { name: 'Berserker Rage', description: 'Double damage but take +50% damage for 3 turns', cost: 'Bonus Action', type: 'buff', range: 0 },
        7: { name: 'Intimidating Shout', description: 'Fear nearby enemies for 2 turns', cost: 'Action', type: 'control', range: 3, aoe: true },
        10: { name: 'Legendary Strike', description: 'Guaranteed critical hit', cost: 'Action', type: 'attack', range: 1 }
      }
    },
    { 
      name: 'Rogue', 
      icon: '🗡️', 
      stats: { strength: 10, dexterity: 16, intelligence: 12, charisma: 8 },
      actionPoints: { move: 8, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Sneak Attack', description: 'Deal double damage if target is unaware', cost: 'Free', type: 'attack', range: 1 },
        3: { name: 'Shadow Step', description: 'Teleport behind enemy and gain advantage', cost: 'Movement', type: 'movement', range: 6 },
        5: { name: 'Poison Blade', description: 'Next 3 attacks apply poison (3 damage/turn)', cost: 'Bonus Action', type: 'buff', range: 0 },
        7: { name: 'Smoke Bomb', description: 'Become invisible for 2 turns', cost: 'Action', type: 'stealth', range: 0, aoe: true, radius: 2 },
        10: { name: 'Assassinate', description: 'Instant kill if target below 25% health', cost: 'Action', type: 'attack', range: 1 }
      }
    },
    { 
      name: 'Mage', 
      icon: '🔮', 
      stats: { strength: 8, dexterity: 10, intelligence: 16, charisma: 12 },
      actionPoints: { move: 5, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Magic Missile', description: 'Deal 1d4+1 force damage, never misses', cost: '1 Spell Slot', type: 'attack', range: 8 },
        3: { name: 'Shield Spell', description: 'Gain +5 AC until start of next turn', cost: 'Reaction', type: 'defense', range: 0 },
        5: { name: 'Fireball', description: 'Deal 3d6 fire damage in large area', cost: '1 Spell Slot', type: 'aoe', range: 10, radius: 3 },
        7: { name: 'Counterspell', description: 'Cancel enemy spell or ability', cost: 'Reaction', type: 'control', range: 8 },
        10: { name: 'Meteor Storm', description: 'Devastate entire battlefield', cost: '2 Spell Slots', type: 'aoe', range: 15, radius: 5 }
      }
    },
    { 
      name: 'Cleric', 
      icon: '⚡', 
      stats: { strength: 12, dexterity: 8, intelligence: 12, charisma: 16 },
      actionPoints: { move: 5, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Healing Word', description: 'Restore 1d4+CHA mod HP to ally', cost: '1 Spell Slot', type: 'heal', range: 8 },
        3: { name: 'Turn Undead', description: 'Force undead creatures to flee', cost: 'Action', type: 'control', range: 6, aoe: true },
        5: { name: 'Sacred Flame', description: 'Divine damage that ignores armor', cost: '1 Spell Slot', type: 'attack', range: 8 },
        7: { name: 'Mass Healing', description: 'Heal all allies for 2d4+CHA', cost: '2 Spell Slots', type: 'heal', range: 6, aoe: true },
        10: { name: 'Divine Intervention', description: 'Call upon divine aid in dire situations', cost: '3 Spell Slots', type: 'special', range: 0 }
      }
    },
    { 
      name: 'Ranger', 
      icon: '🏹', 
      stats: { strength: 14, dexterity: 14, intelligence: 10, charisma: 8 },
      actionPoints: { move: 7, action: 1, bonus: 1, reaction: 1 },
      reach: 10,
      skills: {
        1: { name: 'Hunter\'s Mark', description: 'Mark target for +1d6 damage on attacks', cost: 'Bonus Action', type: 'buff', range: 10 },
        3: { name: 'Multi-Shot', description: 'Attack up to 3 enemies with ranged weapon', cost: 'Action', type: 'attack', range: 10 },
        5: { name: 'Animal Companion', description: 'Summon beast ally for entire combat', cost: 'Action', type: 'summon', range: 3 },
        7: { name: 'Explosive Shot', description: 'Ranged attack that damages nearby enemies', cost: 'Action', type: 'aoe', range: 10, radius: 2 },
        10: { name: 'Rain of Arrows', description: 'Attack all enemies in large area', cost: 'Action', type: 'aoe', range: 12, radius: 4 }
      }
    },
    { 
      name: 'Bard', 
      icon: '🎵', 
      stats: { strength: 8, dexterity: 12, intelligence: 10, charisma: 16 },
      actionPoints: { move: 6, action: 1, bonus: 1, reaction: 1 },
      reach: 1,
      skills: {
        1: { name: 'Inspiration', description: 'Give ally advantage on next roll', cost: 'Bonus Action', type: 'support', range: 6 },
        3: { name: 'Cutting Words', description: 'Reduce enemy attack/damage by 1d6', cost: 'Reaction', type: 'debuff', range: 6 },
        5: { name: 'Song of Rest', description: 'Party heals +1d6 HP during short rest', cost: 'Short Rest', type: 'heal', range: 0 },
        7: { name: 'Mass Suggestion', description: 'Control multiple enemies for 1 turn', cost: 'Action', type: 'control', range: 8, aoe: true },
        10: { name: 'Power Word Kill', description: 'Instantly kill enemy below 100 HP', cost: 'Action', type: 'attack', range: 8 }
      }
    }
  ];

  // Campaign themes
  const campaignThemes = [
    { name: 'Classic Fantasy', description: 'Dragons, magic, and heroic quests in a medieval world', icon: '🏰', bg: 'fantasy' },
    { name: 'Sci-Fi Adventure', description: 'Space exploration, alien encounters, and futuristic technology', icon: '🚀', bg: 'scifi' },
    { name: 'Horror Mystery', description: 'Dark secrets, supernatural threats, and psychological tension', icon: '👻', bg: 'horror' },
    { name: 'Urban Fantasy', description: 'Magic hidden in the modern world, supernatural creatures in cities', icon: '🌃', bg: 'urban' },
    { name: 'Post-Apocalyptic', description: 'Surviving in a world after civilization has collapsed', icon: '☢️', bg: 'apocalypse' },
    { name: 'Pirate Adventure', description: 'High seas, treasure hunting, and swashbuckling action', icon: '🏴‍☠️', bg: 'pirate' }
  ];

  // Environment gradients
  const environments = {
    default: 'from-purple-900 via-blue-900 to-indigo-900',
    fantasy: 'from-emerald-900 via-green-800 to-teal-900',
    dungeon: 'from-gray-900 via-slate-800 to-stone-900',
    forest: 'from-green-900 via-emerald-800 to-lime-900',
    tavern: 'from-amber-900 via-orange-800 to-yellow-900',
    scifi: 'from-cyan-900 via-blue-800 to-indigo-900',
    horror: 'from-red-900 via-purple-900 to-black',
    urban: 'from-slate-900 via-gray-800 to-zinc-900',
    apocalypse: 'from-orange-900 via-red-800 to-yellow-900',
    pirate: 'from-blue-900 via-teal-800 to-cyan-900'
  };

  // Equipment system
  const equipmentTypes = {
    weapon: {
      'Iron Sword': { attack: 3, durability: 100, rarity: 'common', price: 50 },
      'Steel Blade': { attack: 5, durability: 120, rarity: 'uncommon', price: 150 },
      'Enchanted Sword': { attack: 7, magic: 2, durability: 150, rarity: 'rare', price: 500 },
      'Dragon Slayer': { attack: 10, crit: 2, durability: 200, rarity: 'legendary', price: 2000 },
      'Basic Staff': { magic: 4, mana: 10, durability: 80, rarity: 'common', price: 75 },
      'Crystal Staff': { magic: 7, mana: 20, durability: 100, rarity: 'rare', price: 400 },
      'War Bow': { attack: 4, range: true, durability: 90, rarity: 'common', price: 80 },
      'Elven Bow': { attack: 6, crit: 1, range: true, durability: 120, rarity: 'uncommon', price: 300 }
    },
    armor: {
      'Leather Armor': { defense: 2, durability: 80, rarity: 'common', price: 40 },
      'Chain Mail': { defense: 4, durability: 120, rarity: 'uncommon', price: 120 },
      'Plate Armor': { defense: 6, durability: 180, rarity: 'rare', price: 400 },
      'Dragon Scale': { defense: 8, magic: 3, durability: 250, rarity: 'legendary', price: 1500 },
      'Mage Robes': { magic: 3, mana: 15, durability: 60, rarity: 'uncommon', price: 100 },
      'Archmage Robes': { magic: 6, mana: 30, durability: 100, rarity: 'rare', price: 600 }
    }
  };

  // Achievement system
  const achievementCategories = {
    combat: {
      name: 'Combat Mastery',
      icon: '⚔️',
      achievements: [
        { id: 'first_blood', name: 'First Blood', description: 'Win your first combat', points: 10 },
        { id: 'critical_master', name: 'Critical Master', description: 'Score 10 critical hits', points: 25 },
        { id: 'untouchable', name: 'Untouchable', description: 'Win a combat without taking damage', points: 50 },
        { id: 'legendary_warrior', name: 'Legendary Warrior', description: 'Defeat a legendary enemy', points: 100 }
      ]
    },
    exploration: {
      name: 'World Explorer',
      icon: '🗺️',
      achievements: [
        { id: 'first_steps', name: 'First Steps', description: 'Start your first adventure', points: 5 },
        { id: 'dungeon_delver', name: 'Dungeon Delver', description: 'Explore 5 different dungeons', points: 30 },
        { id: 'world_traveler', name: 'World Traveler', description: 'Visit 10 different locations', points: 75 },
        { id: 'master_explorer', name: 'Master Explorer', description: 'Discover all secret areas', points: 200 }
      ]
    },
    social: {
      name: 'Diplomatic',
      icon: '👥',
      achievements: [
        { id: 'first_friend', name: 'First Friend', description: 'Gain positive reputation with a faction', points: 15 },
        { id: 'peacemaker', name: 'Peacemaker', description: 'Resolve a conflict without violence', points: 40 },
        { id: 'faction_leader', name: 'Faction Leader', description: 'Become leader of a major faction', points: 150 },
        { id: 'world_shaper', name: 'World Shaper', description: 'Change the course of history', points: 300 }
      ]
    }
  };

  // Utility functions
  const rollDice = (sides = 20) => Math.floor(Math.random() * sides) + 1;
  const getModifier = (stat: number) => Math.floor((stat - 10) / 2);
  const generateCampaignCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

  const calculateStats = (character: any) => {
    if (!character) return null;
    
    let totalStats = character.baseStats ? { ...character.baseStats } : { strength: 10, dexterity: 10, intelligence: 10, charisma: 10 };
    let bonuses = { attack: 0, defense: 0, magic: 0, health: 0, mana: 0, crit: 0 };
    
    // Equipment bonuses
    if (character.equipment) {
      Object.values(character.equipment).forEach((item: any) => {
        if (item && equipmentTypes[item.type] && equipmentTypes[item.type][item.name]) {
          const itemStats = equipmentTypes[item.type][item.name];
          Object.keys(itemStats).forEach((stat: string) => {
            if (stat !== 'durability' && stat !== 'rarity' && stat !== 'price' && stat !== 'range') {
              if (totalStats[stat] !== undefined) {
                totalStats[stat] += itemStats[stat];
              } else if (bonuses[stat] !== undefined) {
                bonuses[stat] += itemStats[stat];
              }
            }
          });
        }
      });
    }
    
    // Level bonuses
    const levelBonus = Math.floor((character.level || 1) / 2);
    Object.keys(totalStats).forEach(stat => {
      totalStats[stat] += levelBonus;
    });
    
    return { ...totalStats, ...bonuses };
  };

  const checkAchievements = (action: string, context: any = {}) => {
    // Achievement checking logic would go here
    // This is a simplified version
    const newAchievements: any[] = [];
    
    if (action === 'combat_win' && !achievements.find(a => a.id === 'first_blood')) {
      newAchievements.push(achievementCategories.combat.achievements[0]);
    }
    
    if (action === 'adventure_start' && !achievements.find(a => a.id === 'first_steps')) {
      newAchievements.push(achievementCategories.exploration.achievements[0]);
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      // Show achievement notification
      newAchievements.forEach(achievement => {
        setTimeout(() => {
          alert(`🏆 Achievement Unlocked: ${achievement.name}! (+${achievement.points} points)`);
        }, 500);
      });
    }
  };

  const createCharacter = (characterData: any) => {
    const classData = classes.find(c => c.name === characterData.class);
    const newCharacter = {
      ...characterData,
      baseStats: classData.stats,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      level: 1,
      experience: 0,
      gold: 100,
      inventory: {
        'Healing Potion': 3,
        'Iron Ore': 2,
        'Herb': 5
      },
      equipment: {
        weapon: { name: 'Iron Sword', type: 'weapon' },
        armor: { name: 'Leather Armor', type: 'armor' }
      },
      unlockedSkills: [1], // Start with level 1 skill
      id: playerId,
      playerId: playerId
    };
    setCharacter(newCharacter);
    setCurrentScreen('lobby');
  };

  const createCampaign = async (theme: any, customPrompt = '', isMultiplayer = true) => {
    const campaignCode = generateCampaignCode();
    
    const newCampaign = {
      code: campaignCode,
      theme: theme.name,
      background: theme.bg,
      players: [{ 
        id: playerId, 
        name: playerName, 
        character: { ...character, playerId },
        isHost: true,
        isOnline: true
      }],
      messages: [],
      systemMessages: [],
      started: false,
      customPrompt,
      isMultiplayer,
      maxPlayers: isMultiplayer ? 6 : 1
    };

    try {
      // Use demo service for now
      const gameId = await demoMultiplayerService.createGame(newCampaign);
      const createdCampaign = { ...newCampaign, id: gameId };
      
      setCampaigns([...campaigns, createdCampaign]);
      setCurrentCampaign(createdCampaign);
      setCurrentEnvironment(theme.bg);
      
      checkAchievements('adventure_start');
      
      if (isMultiplayer) {
        setCurrentScreen('waiting');
      } else {
        await startCampaign(createdCampaign);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  const startCampaign = async (campaign: any) => {
    setIsAIThinking(true);
    
    // Add null checks and fallbacks
    if (!campaign) {
      console.error('Campaign is undefined');
      setIsAIThinking(false);
      return;
    }
    
    if (!campaign.players || !Array.isArray(campaign.players)) {
      console.error('Campaign players is undefined or not an array:', campaign.players);
      // Create a fallback campaign with the current character
      campaign.players = [{
        id: playerId,
        name: playerName,
        character: character,
        isHost: true,
        isOnline: true
      }];
    }
    
    const partyStats = campaign.players.map(p => {
      if (!p || !p.character) {
        console.error('Player or character is undefined:', p);
        return 'Unknown Player: Stats unavailable';
      }
      
      const stats = calculateStats(p.character);
      return `${p.character.name || 'Unknown'} (Level ${p.character.level || 1} ${p.character.class || 'Adventurer'}): STR ${stats?.strength || 10}, DEX ${stats?.dexterity || 10}, INT ${stats?.intelligence || 10}, CHA ${stats?.charisma || 10}`;
    }).join('\n');

    const initPrompt = `You are an AI Dungeon Master for a ${campaign.theme} campaign. Start an engaging adventure for this party:

${partyStats}

Begin with an immersive opening scene that brings the party together and presents their first challenge. Include opportunities for roleplay, combat, and meaningful choices.

Respond with a JSON object:
{
  "narrative": "Opening scene description",
  "choices": ["Option 1", "Option 2", "Option 3"],
  "environment": "dungeon|forest|tavern|city",
  "combatEncounter": null
}

Your entire response MUST be a single, valid JSON object.`;

    try {
      const response = await window.claude.complete(initPrompt);
      const dmResponse = JSON.parse(response);
      
      if (dmResponse.environment) {
        setCurrentEnvironment(dmResponse.environment);
      }
      
      const openingMessage = {
        id: Date.now(),
        type: 'dm',
        content: dmResponse.narrative,
        choices: dmResponse.choices,
        timestamp: new Date()
      };
      
      setMessages([openingMessage]);
      
      const startedCampaign = { ...campaign, started: true };
      setCurrentCampaign(startedCampaign);
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? startedCampaign : c));
      
      setCurrentScreen('game');
    } catch (error) {
      console.error('Error starting campaign:', error);
      const fallbackMessage = {
        id: Date.now(),
        type: 'dm',
        content: `Welcome, brave adventurers, to your ${campaign.theme} journey! Your party stands at the threshold of an epic quest. What will you do?`,
        choices: ['Explore ahead', 'Gather information', 'Prepare equipment'],
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setCurrentScreen('game');
    }
    
    setIsAIThinking(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isAIThinking) return;

    const playerMessage = {
      type: 'player',
      content: inputMessage,
      character: character.name,
      playerId: playerId,
      playerName: playerName
    };

    try {
      // Send message to multiplayer service
      if (currentCampaign?.id) {
        await multiplayerService.sendMessage(currentCampaign.id, playerMessage);
      }
      
      setInputMessage('');
      setIsAIThinking(true);

      // For now, we'll use a simple AI response
      // In a full implementation, you'd want to coordinate AI responses across all players
      setTimeout(() => {
        const dmMessage = {
          type: 'dm',
          content: `The dungeon master considers your words carefully. "${inputMessage}" - how will this choice affect your journey?`,
          choices: ['Continue exploring', 'Ask for more details', 'Take a different approach']
        };
        
        if (currentCampaign?.id) {
          multiplayerService.sendMessage(currentCampaign.id, dmMessage);
        }
        
        setIsAIThinking(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setIsAIThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Combat functions
  const startCombat = (enemies: any[]) => {
    if (!character) return;

    // Convert character and enemies to combatants
    const playerCombatant: Combatant = {
      id: character.id || playerId || 'player',
      name: character.name,
      type: 'player',
      character: character,
      position: { x: 0, y: 0 }, // Will be set by combat service
      health: character.health,
      maxHealth: character.maxHealth,
      mana: character.mana,
      maxMana: character.maxMana,
      actionPoints: character.actionPoints || { move: 6, action: 1, bonus: 1, reaction: 1 },
      currentActionPoints: { move: 6, action: 1, bonus: 1, reaction: 1 },
      stats: {
        strength: character.baseStats?.strength || 10,
        dexterity: character.baseStats?.dexterity || 10,
        intelligence: character.baseStats?.intelligence || 10,
        charisma: character.baseStats?.charisma || 10,
        armorClass: 10
      },
      statusEffects: [],
      isActive: false,
      hasActed: false,
      reach: 1,
      skills: character.skills || {}
    };

    const enemyCombatants: Combatant[] = enemies.map((enemy, index) => ({
      id: `enemy-${index}`,
      name: enemy.name || `Enemy ${index + 1}`,
      type: 'enemy',
      position: { x: 0, y: 0 }, // Will be set by combat service
      health: enemy.health || 25,
      maxHealth: enemy.health || 25,
      actionPoints: { move: 4, action: 1, bonus: 0, reaction: 1 },
      currentActionPoints: { move: 4, action: 1, bonus: 0, reaction: 1 },
      stats: {
        strength: enemy.strength || 12,
        dexterity: enemy.dexterity || 10,
        intelligence: enemy.intelligence || 8,
        charisma: enemy.charisma || 8,
        armorClass: enemy.armorClass || 12
      },
      statusEffects: [],
      isActive: false,
      hasActed: false,
      reach: 1,
      skills: {}
    }));

    const allCombatants = [playerCombatant, ...enemyCombatants];
    const combatState = combatService.startCombat(allCombatants);
    setCombatState(combatState);
    setCurrentScreen('combat');
  };

  const handleCombatAction = (action: CombatAction) => {
    const result = combatService.executeAction(action);
    
    if (result.success && result.newState) {
      setCombatState(result.newState);
      
      // Check if combat has ended
      const combatEnd = combatService.checkCombatEnd();
      if (combatEnd.ended) {
        if (combatEnd.winner === 'players') {
          alert('Victory! You have defeated your enemies!');
          // Award experience and loot
          setCharacter(prev => prev ? {
            ...prev,
            experience: prev.experience + 50,
            health: Math.min(prev.maxHealth, prev.health + 20)
          } : null);
        } else {
          alert('Defeat! Your party has been defeated...');
          // Handle defeat - maybe respawn or game over
          setCharacter(prev => prev ? {
            ...prev,
            health: Math.max(1, prev.health - 10)
          } : null);
        }
        
        combatService.endCombat();
        setCombatState(null);
        setCurrentScreen('game');
      }
    } else {
      alert(result.message);
    }
  };

  const endCombat = () => {
    combatService.endCombat();
    setCombatState(null);
    setCurrentScreen('game');
  };

  // Welcome Screen
  if (currentScreen === 'welcome') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} flex items-center justify-center p-4 transition-all duration-1000`}>
        <div className="absolute top-4 right-4 z-50">
          <UserProfile />
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">⚔️ AI Dungeon Master</h1>
            <p className="text-blue-200">Advanced RPG with real consequences</p>
            <div className="flex justify-center space-x-4 mt-4 text-sm">
              <div className="flex items-center space-x-1 text-yellow-400">
                <Swords size={16} />
                <span>Tactical Combat</span>
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp size={16} />
                <span>Character Growth</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-400">
                <Globe size={16} />
                <span>Living World</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400"
            />
            
            <button
              onClick={() => playerName.trim() && setCurrentScreen('character')}
              disabled={!playerName.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Begin Adventure
            </button>

            <div className="text-center">
              <p className="text-blue-200 text-sm mb-3">Or join an existing campaign:</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Campaign Code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 text-center"
                />
                <button
                  onClick={() => {
                    if (playerName.trim() && joinCode.trim()) {
                      if (!character) {
                        setCurrentScreen('character');
                      } else {
                        // Join campaign logic would go here
                        alert('Join campaign feature coming soon!');
                      }
                    }
                  }}
                  disabled={!playerName.trim() || !joinCode.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App Layout (for all other screens)
  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
      {/* Desktop Side NavBar */}
      <NavBar 
        active={activeNav} 
        onNavigate={handleNavChange} 
        theme={currentEnvironment}
        isMobile={false}
      />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar 
          onNewCampaign={handleNewCampaign}
          isMobile={isMobile}
          onToggleMobile={() => setMobileNavOpen(!mobileNavOpen)}
          currentScreen={currentScreen}
        />
        {/* Main Content - Only render the active screen */}
        <div className="flex-1 flex pb-16 lg:pb-0">
          <div className="flex-1">
            {currentScreen === 'character' && (
              <CharacterCreation 
                playerName={playerName}
                classes={classes}
                onCreateCharacter={createCharacter}
                joinCode={joinCode}
              />
            )}
            {currentScreen === 'lobby' && (
              <CampaignLobby 
                campaigns={campaigns}
                campaignThemes={campaignThemes}
                onCreateCampaign={createCampaign}
                character={character}
              />
            )}
            {currentScreen === 'waiting' && (
              <WaitingRoom 
                campaign={currentCampaign}
                onStart={startCampaign}
                onBack={() => setCurrentScreen('lobby')}
              />
            )}
            {currentScreen === 'game' && (
              <GameInterface
                campaign={currentCampaign}
                messages={messages}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                sendMessage={sendMessage}
                handleKeyPress={handleKeyPress}
                isAIThinking={isAIThinking}
                messagesEndRef={messagesEndRef}
                onStartCombat={startCombat}
                worldState={worldState}
                character={character}
                // Remove tab logic from here
              />
            )}
            {currentScreen === 'combat' && combatState && (
              <CombatSystem
                combatants={combatState.combatants}
                battleMap={combatState.battleMap}
                currentTurn={combatState.currentTurn}
                activeCombatantId={combatState.turnOrder[combatState.currentCombatantIndex]}
                onAction={handleCombatAction}
                onEndCombat={endCombat}
                isPlayerTurn={combatService.isPlayerTurn()}
              />
            )}
          </div>
        </div>
      </div>
      {/* Right Drawer - contextual info, chat, party, log, etc. */}
      <RightDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeDrawerTab}
        onTabChange={setActiveDrawerTab}
        isMobile={isMobile}
        campaign={currentCampaign}
        messages={messages}
        players={partyState.players}
        worldState={worldState}
        achievements={achievements}
        onSendMessage={sendMultiplayerMessage}
        onUpdateSettings={(settings) => {
          console.log('Settings updated:', settings);
        }}
      />
      {/* Floating Action Button - sets drawer tab and opens drawer */}
      <FloatingActionButton
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        isDrawerOpen={drawerOpen}
        onQuickAction={(action) => {
          setActiveDrawerTab(action);
          setDrawerOpen(true);
        }}
        isMobile={isMobile}
        hasNotifications={messages.length > 0}
        notificationCount={messages.filter(m => m.type === 'system').length}
      />
      {/* Mobile Navigation - Bottom */}
      <NavBar 
        active={activeNav} 
        onNavigate={handleNavChange} 
        theme={currentEnvironment}
        isMobile={true}
        onToggleMobile={() => setMobileNavOpen(!mobileNavOpen)}
      />
    </div>
  );
};

// Character Creation Component
const CharacterCreation = ({ playerName, classes, onCreateCharacter, joinCode }: { playerName: string, classes: any[], onCreateCharacter: (characterData: any) => void, joinCode: string }) => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [characterName, setCharacterName] = useState(playerName);
  const [backstory, setBackstory] = useState('');
  const [hoveredClass, setHoveredClass] = useState<any>(null);

  const handleSubmit = () => {
    if (selectedClass && characterName.trim() && backstory.trim()) {
      onCreateCharacter({
        name: characterName,
        class: selectedClass.name,
        backstory: backstory
      });
    }
  };

  // Get the class to display in preview (hovered or selected)
  const previewClass = hoveredClass || selectedClass;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
      <div className="space-y-4 lg:space-y-6">
        <div>
          <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base">Character Name</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 text-sm lg:text-base"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base">Choose Your Class</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {classes.map((cls) => (
              <div
                key={cls.name}
                onClick={() => setSelectedClass(cls)}
                onMouseEnter={() => setHoveredClass(cls)}
                onMouseLeave={() => setHoveredClass(null)}
                className={`p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedClass?.name === cls.name
                    ? 'border-green-400 bg-green-500/30 shadow-lg scale-105'
                    : hoveredClass?.name === cls.name
                    ? 'border-blue-400 bg-blue-500/20 shadow-md scale-102'
                    : 'border-white/30 bg-white/10 hover:border-white/50 hover:scale-102'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl mb-2">{cls.icon}</div>
                  <h3 className="text-white font-semibold text-sm lg:text-base mb-2">{cls.name}</h3>
                  
                  {/* Quick Stats with Meaningful Context */}
                  <div className="text-xs text-blue-200 space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span>STR: {cls.stats.strength}</span>
                      <span className="text-yellow-300">Attack Power</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEX: {cls.stats.dexterity}</span>
                      <span className="text-green-300">Agility</span>
                    </div>
                    <div className="flex justify-between">
                      <span>INT: {cls.stats.intelligence}</span>
                      <span className="text-purple-300">Magic</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CHA: {cls.stats.charisma}</span>
                      <span className="text-pink-300">Social</span>
                    </div>
                  </div>
                  
                  {/* Visual Confirmation for Selected Class */}
                  {selectedClass?.name === cls.name && (
                    <div className="flex items-center justify-center space-x-1 text-green-400 text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Selected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2 lg:mb-3 text-sm lg:text-base">
            Character Backstory <span className="text-blue-300 text-xs">(Optional)</span>
          </label>
          
          {/* Backstory Prompts for Creative Scaffolding */}
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              "What is your character's greatest fear?",
              "Where did they grow up?",
              "What brought them to adventure?",
              "Who is their closest friend?",
              "What do they value most?"
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => setBackstory(prev => prev ? `${prev}\n\n${prompt}` : prompt)}
                className="px-2 py-1 bg-blue-600/30 text-blue-200 text-xs rounded hover:bg-blue-600/50 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
          
          <textarea
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            placeholder="Describe your character's background, motivations, and personality... (Click prompts above for inspiration)"
            className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 h-24 lg:h-32 resize-none text-sm lg:text-base"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedClass || !characterName.trim()}
          className={`w-full px-4 lg:px-6 py-3 rounded-xl font-semibold transition-all text-sm lg:text-base ${
            selectedClass && characterName.trim()
              ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
          }`}
        >
          {selectedClass && characterName.trim() 
            ? `Create ${characterName} the ${selectedClass.name}` 
            : 'Complete required fields to create character'
          }
        </button>
      </div>

      {/* Enhanced Class Preview */}
      <div className="bg-white/10 rounded-xl p-4 lg:p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          {previewClass ? `Class Preview: ${previewClass.name}` : 'Select a Class'}
        </h3>
        
        {previewClass ? (
          <div className="space-y-4">
            {/* Class Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-4xl">{previewClass.icon}</div>
              <div>
                <h4 className="text-lg font-semibold text-white">{previewClass.name}</h4>
                <p className="text-blue-200 text-sm">Master of tactical combat</p>
              </div>
            </div>
            
            {/* Class Description */}
            <div className="bg-black/20 rounded-lg p-3">
              <h5 className="text-white font-semibold mb-2">Class Description</h5>
              <p className="text-blue-200 text-sm leading-relaxed">
                {previewClass.name === 'Warrior' && "A mighty warrior skilled in close combat, wielding powerful weapons and wearing heavy armor. Your strength and endurance make you the frontline defender of your party."}
                {previewClass.name === 'Rogue' && "A stealthy rogue who excels at sneaking, lockpicking, and dealing devastating sneak attacks. Your agility and cunning allow you to strike from the shadows."}
                {previewClass.name === 'Mage' && "A powerful spellcaster who harnesses the arcane arts to cast devastating spells. Your intelligence and magical prowess make you a force to be reckoned with."}
                {previewClass.name === 'Cleric' && "A divine spellcaster who channels the power of the gods to heal allies and smite enemies. Your faith and charisma make you an invaluable support."}
                {previewClass.name === 'Ranger' && "A skilled hunter and tracker who excels at ranged combat and wilderness survival. Your dexterity and knowledge of nature make you a versatile adventurer."}
                {previewClass.name === 'Bard' && "A charismatic performer who uses music and magic to inspire allies and charm enemies. Your creativity and social skills make you the heart of any party."}
              </p>
            </div>
            
            {/* Enhanced Stats with Context */}
            <div>
              <h5 className="text-white font-semibold mb-2">Base Stats & Meaning</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-black/20 rounded p-2">
                  <div className="text-yellow-400 font-semibold">Strength: {previewClass.stats.strength}</div>
                  <div className="text-blue-200 text-xs">Melee damage, carrying capacity</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-green-400 font-semibold">Dexterity: {previewClass.stats.dexterity}</div>
                  <div className="text-blue-200 text-xs">Ranged attacks, stealth, reflexes</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-purple-400 font-semibold">Intelligence: {previewClass.stats.intelligence}</div>
                  <div className="text-blue-200 text-xs">Spell power, knowledge, problem-solving</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-pink-400 font-semibold">Charisma: {previewClass.stats.charisma}</div>
                  <div className="text-blue-200 text-xs">Social skills, spell casting, leadership</div>
                </div>
              </div>
            </div>
            
            {/* Class Abilities Preview */}
            <div>
              <h5 className="text-white font-semibold mb-2">Signature Abilities</h5>
              <div className="space-y-2">
                {Object.entries(previewClass.skills).slice(0, 3).map(([level, skill]: [string, any]) => (
                  <div key={level} className="bg-black/20 rounded-lg p-2">
                    <div className="text-yellow-400 text-sm font-semibold">Level {level}: {skill.name}</div>
                    <div className="text-blue-200 text-xs">{skill.description}</div>
                    <div className="text-green-400 text-xs mt-1">
                      Cost: {skill.cost} | Range: {skill.range || 1} tiles
                      {skill.aoe && ` | AOE: ${skill.radius || 2} tiles`}
                    </div>
                  </div>
                ))}
                <div className="text-blue-200 text-xs text-center">+ More abilities as you level up!</div>
              </div>
            </div>
            
            {/* Playstyle Recommendation */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-3 border border-blue-400/30">
              <h5 className="text-white font-semibold mb-2">Recommended Playstyle</h5>
              <p className="text-blue-200 text-sm">
                {previewClass.name === 'Warrior' && "Lead from the front! Use your high health and armor to protect allies while dealing heavy melee damage."}
                {previewClass.name === 'Rogue' && "Strike from the shadows! Use stealth and positioning to get advantage on your attacks and avoid damage."}
                {previewClass.name === 'Mage' && "Control the battlefield! Use your spells to damage enemies, buff allies, and control the flow of combat."}
                {previewClass.name === 'Cleric' && "Support your party! Heal allies, buff them with divine magic, and turn undead when needed."}
                {previewClass.name === 'Ranger' && "Master the wilderness! Use your ranged attacks and animal companions to control the battlefield from a distance."}
                {previewClass.name === 'Bard' && "Inspire greatness! Use your music and magic to buff allies, debuff enemies, and solve problems creatively."}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 opacity-50">⚔️</div>
            <p className="text-blue-200 text-lg">Hover over or click a class to see detailed information</p>
            <p className="text-blue-300 text-sm mt-2">Each class offers unique abilities and playstyles</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Campaign Lobby Component
const CampaignLobby = ({ campaigns, campaignThemes, onCreateCampaign, character }: { campaigns: any[], campaignThemes: any[], onCreateCampaign: (theme: any, customPrompt: string, isMultiplayer: boolean) => void, character: any }) => {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(true);

  const handleCreateCampaign = () => {
    if (selectedTheme) {
      onCreateCampaign(selectedTheme, customPrompt, isMultiplayer);
      setShowCreateCampaign(false);
      setSelectedTheme(null);
      setCustomPrompt('');
    }
  };

  if (showCreateCampaign) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl lg:text-2xl font-bold text-white">Create New Campaign</h3>
          <button
            onClick={() => setShowCreateCampaign(false)}
            className="px-3 lg:px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all text-sm lg:text-base"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {campaignThemes.map((theme) => (
            <div
              key={theme.name}
              onClick={() => setSelectedTheme(theme)}
              className={`p-4 lg:p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme?.name === theme.name
                  ? 'border-blue-400 bg-blue-500/30'
                  : 'border-white/30 bg-white/10 hover:border-white/50'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl lg:text-4xl mb-2 lg:mb-3">{theme.icon}</div>
                <h4 className="text-white font-semibold mb-1 lg:mb-2 text-sm lg:text-base">{theme.name}</h4>
                <p className="text-blue-200 text-xs lg:text-sm">{theme.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedTheme && (
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <label className="flex items-center space-x-2 text-white text-sm lg:text-base">
                <input
                  type="checkbox"
                  checked={isMultiplayer}
                  onChange={(e) => setIsMultiplayer(e.target.checked)}
                  className="rounded"
                />
                <span>Multiplayer Campaign (up to 6 players)</span>
              </label>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm lg:text-base">Custom Campaign Prompt (Optional)</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add any specific details, themes, or story elements you want the AI to include..."
                className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 h-20 lg:h-24 resize-none text-sm lg:text-base"
              />
            </div>

            <button
              onClick={handleCreateCampaign}
              className="w-full px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all text-sm lg:text-base"
            >
              Create {selectedTheme.name} Campaign
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="text-center">
        <button
          onClick={() => setShowCreateCampaign(true)}
          className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all text-base lg:text-lg"
        >
          + Create New Campaign
        </button>
      </div>

      {campaigns.length > 0 && (
        <div>
          <h3 className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4">Your Campaigns</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white/10 rounded-xl p-3 lg:p-4 border border-white/20">
                <h4 className="text-white font-semibold text-sm lg:text-base">{campaign.theme}</h4>
                <p className="text-blue-200 text-xs lg:text-sm">
                  {campaign.players.length} player{campaign.players.length !== 1 ? 's' : ''}
                  {campaign.started ? ' • In Progress' : ' • Waiting'}
                </p>
                {!campaign.started && campaign.isMultiplayer && (
                  <p className="text-yellow-400 text-xs lg:text-sm">Code: {campaign.code}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Game Interface Component
const Gameplay: React.FC<{ 
  campaign: any, 
  messages: any[], 
  inputMessage: string, 
  setInputMessage: (msg: string) => void, 
  sendMessage: () => void, 
  handleKeyPress: (e: React.KeyboardEvent) => void, 
  isAIThinking: boolean, 
  messagesEndRef: React.RefObject<HTMLDivElement>,
  onStartCombat?: (enemies: any[]) => void
}> = ({ campaign, messages, inputMessage, setInputMessage, sendMessage, handleKeyPress, isAIThinking, messagesEndRef, onStartCombat }) => (
  <div className="text-white p-2 lg:p-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 lg:mb-4 space-y-2 sm:space-y-0">
      <h2 className="text-xl lg:text-2xl font-bold">Gameplay</h2>
      {onStartCombat && (
        <button
          onClick={() => onStartCombat([
            { name: 'Goblin Warrior', health: 25, strength: 12, dexterity: 10, armorClass: 12 },
            { name: 'Goblin Archer', health: 20, strength: 10, dexterity: 14, armorClass: 13 }
          ])}
          className="px-3 lg:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center space-x-2 text-sm lg:text-base"
        >
          <Sword size={16} />
          <span>Start Combat Test</span>
        </button>
      )}
    </div>
    <div className="space-y-3 lg:space-y-4">
      {messages.map((msg, index) => (
        <div key={index} className="bg-black/20 p-3 lg:p-4 rounded text-sm lg:text-base">
          {msg.content}
        </div>
      ))}
      {isAIThinking && <div className="text-blue-200 text-sm lg:text-base">AI is thinking...</div>}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="What do you do?"
          className="flex-1 px-3 py-2 bg-black/20 rounded text-white text-sm lg:text-base"
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 rounded text-sm lg:text-base hover:bg-blue-700 transition-all">Send</button>
      </div>
    </div>
    <div ref={messagesEndRef} />
  </div>
);



const WaitingRoom: React.FC<{ campaign: any, onStart: () => void, onBack: () => void }> = ({ campaign, onStart, onBack }) => (
  <div className="text-white p-3 lg:p-4">
    <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">Waiting for Players</h2>
    <p className="text-sm lg:text-base mb-3 lg:mb-4">Campaign Code: <span className="font-mono bg-white/20 px-2 py-1 rounded">{campaign?.code}</span></p>
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
      <button onClick={onStart} className="px-4 py-2 bg-green-600 rounded text-sm lg:text-base hover:bg-green-700 transition-all">Start Game</button>
      <button onClick={onBack} className="px-4 py-2 bg-gray-600 rounded text-sm lg:text-base hover:bg-gray-700 transition-all">Back</button>
    </div>
  </div>
);

export default AIDungeonMaster;