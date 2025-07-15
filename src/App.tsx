import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dice1, Dice6, Sword, Shield, Zap, Heart, User, Users, Plus, Play, Settings, Sparkles, Flame, Copy, Share2, Star, Award, Package, Hammer, TrendingUp, Target, Clock, Swords, MapPin, Eye, Crosshair, Globe, AlertTriangle, Crown, Calendar, History, ChevronDown, ChevronUp, X, Menu } from 'lucide-react';
import { multiplayerService, MultiplayerGame, Player, GameMessage } from './multiplayer';
import { demoMultiplayerService } from './demoMultiplayer';

const AIDungeonMaster = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [playerName, setPlayerName] = useState('');
  const [character, setCharacter] = useState(null);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState('default');
  const [statusEffects, setStatusEffects] = useState({});
  const [playerId, setPlayerId] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [pendingLevelUp, setPendingLevelUp] = useState(null);
  const [combatState, setCombatState] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [battleMap, setBattleMap] = useState(null);
  const [selectedCombatant, setSelectedCombatant] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [targetingMode, setTargetingMode] = useState(null);
  const [lineOfSightCache, setLineOfSightCache] = useState({});
  const [worldState, setWorldState] = useState(null);
  const [showWorldEvents, setShowWorldEvents] = useState(false);
  const [pendingChoices, setPendingChoices] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const messagesEndRef = useRef(null);

  // Generate unique player ID on load
  useEffect(() => {
    if (!playerId) {
      setPlayerId(Date.now().toString(36) + Math.random().toString(36).substr(2));
    }
  }, [playerId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  const getModifier = (stat) => Math.floor((stat - 10) / 2);
  const generateCampaignCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

  const calculateStats = (character) => {
    if (!character) return null;
    
    let totalStats = { ...character.baseStats };
    let bonuses = { attack: 0, defense: 0, magic: 0, health: 0, mana: 0, crit: 0 };
    
    // Equipment bonuses
    Object.values(character.equipment || {}).forEach(item => {
      if (item && equipmentTypes[item.type] && equipmentTypes[item.type][item.name]) {
        const itemStats = equipmentTypes[item.type][item.name];
        Object.keys(itemStats).forEach(stat => {
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
    
    // Level bonuses
    const levelBonus = Math.floor(character.level / 2);
    Object.keys(totalStats).forEach(stat => {
      totalStats[stat] += levelBonus;
    });
    
    return { ...totalStats, ...bonuses };
  };

  const checkAchievements = (action, context = {}) => {
    // Achievement checking logic would go here
    // This is a simplified version
    const newAchievements = [];
    
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

  const createCharacter = (characterData) => {
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

  const createCampaign = async (theme, customPrompt = '', isMultiplayer = true) => {
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

  const startCampaign = async (campaign) => {
    setIsAIThinking(true);
    
    const partyStats = campaign.players.map(p => {
      const stats = calculateStats(p.character);
      return `${p.character.name} (Level ${p.character.level} ${p.character.class}): STR ${stats.strength}, DEX ${stats.dexterity}, INT ${stats.intelligence}, CHA ${stats.charisma}`;
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
        await demoMultiplayerService.sendMessage(currentCampaign.id, playerMessage);
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
          demoMultiplayerService.sendMessage(currentCampaign.id, dmMessage);
        }
        
        setIsAIThinking(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setIsAIThinking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Welcome Screen
  if (currentScreen === 'welcome') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} flex items-center justify-center p-4 transition-all duration-1000`}>
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
                  onClick={async () => {
                    if (playerName.trim() && joinCode.trim()) {
                      if (!character) {
                        setCurrentScreen('character');
                      } else {
                        try {
                          const joinedGame = await demoMultiplayerService.joinGame(joinCode, {
                            id: playerId,
                            name: playerName,
                            character: { ...character, playerId },
                            isHost: false,
                            isOnline: true
                          });
                          
                          if (joinedGame) {
                            setCurrentCampaign(joinedGame);
                            setCurrentEnvironment(joinedGame.background);
                            setCurrentScreen('waiting');
                            setJoinCode('');
                          } else {
                            alert('Campaign not found or full. Please check the code.');
                          }
                        } catch (error) {
                          console.error('Error joining campaign:', error);
                          alert('Failed to join campaign. Please try again.');
                        }
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

  // Character Creation Screen
  if (currentScreen === 'character') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} p-4 transition-all duration-1000`}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Your Hero</h2>
            <CharacterCreation 
              playerName={playerName}
              classes={classes}
              onCreateCharacter={createCharacter}
              joinCode={joinCode}
            />
          </div>
        </div>
      </div>
    );
  }

  // Campaign Lobby Screen
  if (currentScreen === 'lobby') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} p-4 transition-all duration-1000`}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Campaign Lobby</h2>
                <p className="text-blue-200">Welcome, {character.name} the Level {character.level} {character.class}!</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAchievements(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all flex items-center space-x-2"
                >
                  <Award size={16} />
                  <span>Achievements</span>
                </button>
                <button
                  onClick={() => setCurrentScreen('character')}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                >
                  Edit Character
                </button>
              </div>
            </div>
            
            <CampaignLobby 
              campaigns={campaigns}
              campaignThemes={campaignThemes}
              onCreateCampaign={createCampaign}
              character={character}
            />
          </div>
        </div>
      </div>
    );
  }

  // Waiting Room Screen (for multiplayer)
  if (currentScreen === 'waiting') {
    // Set up real-time updates for the waiting room
    useEffect(() => {
      if (currentCampaign?.id) {
        const unsubscribe = demoMultiplayerService.onGameUpdate(currentCampaign.id, (updatedGame) => {
          setCurrentCampaign(updatedGame);
          
          // Auto-start if host started the game
          if (updatedGame.started && !currentCampaign.started) {
            startCampaign(updatedGame);
          }
        });

        // Update player status as online
        demoMultiplayerService.updatePlayerStatus(currentCampaign.id, playerId, true);

        return () => {
          unsubscribe();
          // Update player status as offline when leaving
          demoMultiplayerService.updatePlayerStatus(currentCampaign.id, playerId, false);
        };
      }
    }, [currentCampaign?.id, playerId]);

    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} p-4 transition-all duration-1000`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Waiting for Adventurers</h2>
              <div className="bg-black/20 rounded-xl p-4 mb-6">
                <p className="text-blue-200 mb-2">Campaign Code:</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-mono text-yellow-400">{currentCampaign.code}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentCampaign.code);
                      alert('Campaign code copied!');
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentCampaign.players.map((player) => (
                  <div key={player.id} className={`bg-white/10 rounded-lg p-4 ${!player.isOnline ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">{player.character.name}</h4>
                        <p className="text-blue-200 text-sm">Level {player.character.level} {player.character.class}</p>
                        <p className="text-green-400 text-xs">{player.name} {player.isHost && '(Host)'}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: currentCampaign.maxPlayers - currentCampaign.players.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="bg-white/5 rounded-lg p-4 border-2 border-dashed border-white/20">
                    <div className="text-center text-white/50">
                      <Users size={24} className="mx-auto mb-2" />
                      <p className="text-sm">Waiting for player...</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={async () => {
                    if (currentCampaign?.id) {
                      await demoMultiplayerService.leaveGame(currentCampaign.id, playerId);
                    }
                    setCurrentScreen('lobby');
                  }}
                  className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                >
                  ← Back to Lobby
                </button>
                {currentCampaign.players.find(p => p.id === playerId)?.isHost && (
                  <button
                    onClick={async () => {
                      if (currentCampaign?.id) {
                        await demoMultiplayerService.startGame(currentCampaign.id);
                      }
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    Start Adventure
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  if (currentScreen === 'game') {
    // Set up real-time updates for the game
    useEffect(() => {
      if (currentCampaign?.id) {
        const unsubscribe = demoMultiplayerService.onGameUpdate(currentCampaign.id, (updatedGame) => {
          setCurrentCampaign(updatedGame);
          setMessages(updatedGame.messages || []);
        });

        return () => {
          unsubscribe();
        };
      }
    }, [currentCampaign?.id]);

    return (
      <div className={`min-h-screen bg-gradient-to-br ${environments[currentEnvironment]} flex flex-col transition-all duration-1000`}>
        <GameInterface
          campaign={currentCampaign}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          isAIThinking={isAIThinking}
          onBack={async () => {
            if (currentCampaign?.id) {
              await demoMultiplayerService.leaveGame(currentCampaign.id, playerId);
            }
            setCurrentScreen('lobby');
          }}
          messagesEndRef={messagesEndRef}
          statusEffects={statusEffects}
          currentEnvironment={currentEnvironment}
          playerId={playerId}
          calculateStats={calculateStats}
          achievements={achievements}
        />
      </div>
    );
  }

  return null;
};

// Character Creation Component
const CharacterCreation = ({ playerName, classes, onCreateCharacter, joinCode }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [characterName, setCharacterName] = useState(playerName);
  const [backstory, setBackstory] = useState('');

  const handleSubmit = () => {
    if (selectedClass && characterName.trim() && backstory.trim()) {
      onCreateCharacter({
        name: characterName,
        class: selectedClass.name,
        backstory: backstory
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <label className="block text-white font-semibold mb-3">Character Name</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-3">Choose Your Class</label>
          <div className="grid grid-cols-2 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.name}
                onClick={() => setSelectedClass(cls)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedClass?.name === cls.name
                    ? 'border-blue-400 bg-blue-500/30'
                    : 'border-white/30 bg-white/10 hover:border-white/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{cls.icon}</div>
                  <h3 className="text-white font-semibold">{cls.name}</h3>
                  <div className="text-xs text-blue-200 mt-2 space-y-1">
                    <div>STR: {cls.stats.strength}</div>
                    <div>DEX: {cls.stats.dexterity}</div>
                    <div>INT: {cls.stats.intelligence}</div>
                    <div>CHA: {cls.stats.charisma}</div>
                  </div>
                  {selectedClass?.name === cls.name && (
                    <div className="mt-2 text-xs text-yellow-200">
                      Move: {cls.actionPoints.move} tiles
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-3">Character Backstory</label>
          <textarea
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            placeholder="Describe your character's background, motivations, and personality..."
            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 h-32 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedClass || !characterName.trim() || !backstory.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Create Character
        </button>
      </div>

      {/* Class Preview */}
      <div className="bg-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Class Preview</h3>
        {selectedClass ? (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-4xl">{selectedClass.icon}</div>
              <div>
                <h4 className="text-lg font-semibold text-white">{selectedClass.name}</h4>
                <p className="text-blue-200 text-sm">Master of tactical combat</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h5 className="text-white font-semibold mb-2">Base Stats</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-blue-200">Strength: {selectedClass.stats.strength}</div>
                  <div className="text-blue-200">Dexterity: {selectedClass.stats.dexterity}</div>
                  <div className="text-blue-200">Intelligence: {selectedClass.stats.intelligence}</div>
                  <div className="text-blue-200">Charisma: {selectedClass.stats.charisma}</div>
                </div>
              </div>
              
              <div>
                <h5 className="text-white font-semibold mb-2">Class Abilities</h5>
                <div className="space-y-2">
                  {Object.entries(selectedClass.skills).slice(0, 3).map(([level, skill]) => (
                    <div key={level} className="bg-black/20 rounded-lg p-2">
                      <div className="text-yellow-400 text-sm font-semibold">Level {level}: {skill.name}</div>
                      <div className="text-blue-200 text-xs">{skill.description}</div>
                      <div className="text-green-400 text-xs">
                        Cost: {skill.cost} | Range: {skill.range || 1} tiles
                        {skill.aoe && ` | AOE: ${skill.radius || 2} tiles`}
                      </div>
                    </div>
                  ))}
                  <div className="text-blue-200 text-xs text-center">+ More abilities as you level up!</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-blue-200">Select a class to see preview</p>
        )}
      </div>
    </div>
  );
};

// Campaign Lobby Component
const CampaignLobby = ({ campaigns, campaignThemes, onCreateCampaign, character }) => {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Create New Campaign</h3>
          <button
            onClick={() => setShowCreateCampaign(false)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignThemes.map((theme) => (
            <div
              key={theme.name}
              onClick={() => setSelectedTheme(theme)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme?.name === theme.name
                  ? 'border-blue-400 bg-blue-500/30'
                  : 'border-white/30 bg-white/10 hover:border-white/50'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{theme.icon}</div>
                <h4 className="text-white font-semibold mb-2">{theme.name}</h4>
                <p className="text-blue-200 text-sm">{theme.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedTheme && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-white">
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
              <label className="block text-white font-semibold mb-2">Custom Campaign Prompt (Optional)</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add any specific details, themes, or story elements you want the AI to include..."
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400 h-24 resize-none"
              />
            </div>

            <button
              onClick={handleCreateCampaign}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
            >
              Create {selectedTheme.name} Campaign
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <button
          onClick={() => setShowCreateCampaign(true)}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all text-lg"
        >
          + Create New Campaign
        </button>
      </div>

      {campaigns.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Your Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h4 className="text-white font-semibold">{campaign.theme}</h4>
                <p className="text-blue-200 text-sm">
                  {campaign.players.length} player{campaign.players.length !== 1 ? 's' : ''}
                  {campaign.started ? ' • In Progress' : ' • Waiting'}
                </p>
                {!campaign.started && campaign.isMultiplayer && (
                  <p className="text-yellow-400 text-sm">Code: {campaign.code}</p>
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
const GameInterface = ({ 
  campaign, 
  messages, 
  inputMessage, 
  setInputMessage, 
  sendMessage, 
  handleKeyPress, 
  isAIThinking, 
  onBack,
  messagesEndRef,
  statusEffects,
  currentEnvironment,
  playerId,
  calculateStats,
  achievements
}) => {
  const [showPartySheet, setShowPartySheet] = useState(true);
  const currentPlayer = campaign.players.find(p => p.id === playerId);

  return (
    <>
      {/* Header */}
      <div className="bg-black/20 border-b border-white/20 p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            ← Back to Lobby
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{campaign.theme}</h2>
            <p className="text-blue-200 text-sm">{campaign.players.length} adventurers</p>
          </div>
          <button
            onClick={() => setShowPartySheet(!showPartySheet)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            <Users size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Party Sheet Sidebar */}
        {showPartySheet && (
          <div className="w-80 bg-black/20 border-r border-white/20 p-4 overflow-auto">
            <h3 className="text-lg font-bold text-white mb-4">Party</h3>
            <div className="space-y-4">
              {campaign.players.map((player) => {
                const stats = calculateStats(player.character);
                const playerEffects = statusEffects[player.id] || {};
                
                return (
                  <div key={player.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-semibold">{player.character.name}</h4>
                        <p className="text-blue-200 text-sm">
                          Level {player.character.level} {player.character.class}
                        </p>
                        <p className="text-green-400 text-xs">{player.name}</p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-yellow-400">XP: {player.character.experience}</div>
                        <div className="text-yellow-400">Gold: {player.character.gold || 0}</div>
                      </div>
                    </div>
                    
                    {/* Health Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-white mb-1">
                        <span>Health</span>
                        <span>{player.character.health}/{player.character.maxHealth + (stats?.health || 0)}</span>
                      </div>
                      <div className="w-full bg-red-900 rounded-full h-2">
                        <div 
                          className={`health-bar-${player.id} bg-red-500 h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${(player.character.health / (player.character.maxHealth + (stats?.health || 0))) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Mana Bar */}
                    {player.character.mana !== undefined && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-white mb-1">
                          <span>Mana</span>
                          <span>{player.character.mana}/{player.character.maxMana + (stats?.mana || 0)}</span>
                        </div>
                        <div className="w-full bg-blue-900 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(player.character.mana / (player.character.maxMana + (stats?.mana || 0))) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Effects */}
                    {Object.keys(playerEffects).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.keys(playerEffects).map(effectName => (
                          <span key={effectName} className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                            {effectName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-1 mt-2 text-xs text-blue-200">
                      <div>STR: {stats?.strength || 0}</div>
                      <div>DEX: {stats?.dexterity || 0}</div>
                      <div>INT: {stats?.intelligence || 0}</div>
                      <div>CHA: {stats?.charisma || 0}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-lg p-4 ${
                  message.type === 'player' 
                    ? 'bg-blue-600 text-white ml-8' 
                    : 'bg-white/10 text-white mr-8'
                }`}>
                  {message.type === 'player' && (
                    <div className="text-xs text-blue-200 mb-1">{message.character} ({message.playerName})</div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.choices && (
                    <div className="mt-3 space-y-2">
                      {message.choices.map((choice, index) => (
                        <button
                          key={index}
                          onClick={() => setInputMessage(choice)}
                          className="block w-full text-left px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-sm"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {message.diceRoll && (
                    <div className="mt-2 text-sm text-yellow-400">
                      🎲 Rolled {message.diceRoll.type}: {message.diceRoll.result} 
                      {message.diceRoll.success ? ' (Success!)' : ' (Failed)'}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isAIThinking && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white rounded-lg p-4 mr-8">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>AI Dungeon Master is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/20 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What do you do?"
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:border-blue-400"
                disabled={isAIThinking}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isAIThinking}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-blue-200 text-center">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Notifications */}
      <style jsx>{`
        .heal-flash {
          animation: heal-flash 0.6s ease-in-out;
        }
        .damage-flash {
          animation: damage-flash 0.6s ease-in-out;
        }
        @keyframes heal-flash {
          0%, 100% { background-color: rgb(34 197 94); }
          50% { background-color: rgb(22 163 74); }
        }
        @keyframes damage-flash {
          0%, 100% { background-color: rgb(239 68 68); }
          50% { background-color: rgb(220 38 38); }
        }
      `}</style>
    </>
  );
};

export default AIDungeonMaster;