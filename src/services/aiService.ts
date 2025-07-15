// Advanced AI Dungeon Master Service for MythSeeker
// This provides intelligent, contextual, and responsive DM responses using Vertex AI Gemini Pro

import { getFunctions, httpsCallable } from 'firebase/functions';

export interface AIResponse {
  narrative: string;
  choices: string[];
  environment?: string;
  worldStateUpdates?: {
    newLocation?: string;
    newNPCs?: Array<{
      name: string;
      role: string;
      personality: string;
      currentMood: string;
      currentAction: string;
    }>;
    factionChanges?: Array<{
      faction: string;
      change: string;
      reason: string;
    }>;
    questUpdates?: Array<{
      quest: string;
      progress: string;
      newObjective: string;
    }>;
    consequences?: Array<{
      type: 'immediate' | 'long-term';
      description: string;
      affectedAreas: string[];
    }>;
  };
  combatEncounter?: {
    active: boolean;
    enemies: Array<{
      name: string;
      health: number;
      attack: number;
      strength?: number;
      dexterity?: number;
      intelligence?: number;
      armorClass?: number;
    }>;
  };
  characterUpdates?: Array<{
    playerId: string;
    xpGain: number;
    xpReason: string;
    statChanges?: {
      health: number;
      mana: number;
    };
    newItems?: Record<string, number>;
    reputationChanges?: Record<string, number>;
  }>;
  atmosphere?: {
    mood: string;
    tension: 'low' | 'medium' | 'high';
    environmentalDetails: string;
  };
}

class AdvancedAIService {
  private functions = getFunctions();
  private aiDungeonMaster = httpsCallable(this.functions, 'aiDungeonMaster');

  // Generate intelligent, contextual response using Vertex AI Gemini Pro
  async complete(prompt: string): Promise<string> {
    try {
      // Call the Firebase function that uses Vertex AI Gemini Pro
      const result = await this.aiDungeonMaster({
        prompt: prompt,
        campaignId: 'default', // You can make this dynamic based on current campaign
        playerName: 'Player' // You can make this dynamic based on current player
      });
      
      const response = result.data as any;
      
      // Simulate AI processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return response.response || this.generateFallbackResponse();
    } catch (error) {
      console.error('Error calling Vertex AI:', error);
      // Fallback to local AI if Vertex AI is unavailable
      return this.generateLocalResponse(prompt);
    }
  }

  // Local fallback AI for when Vertex AI is unavailable
  private generateLocalResponse(prompt: string): string {
    try {
      // Parse the prompt to extract context
      const context = this.parsePromptContext(prompt);
      const isInitialPrompt = prompt.includes('INITIAL SCENE REQUIREMENTS');
      
      // Generate response based on context
      const response = isInitialPrompt ? 
        this.generateInitialScene(context) : 
        this.generateDynamicResponse(context);
      
      return JSON.stringify(response);
    } catch (error) {
      console.error('Error generating local response:', error);
      return JSON.stringify(this.generateFallbackResponse());
    }
  }

  private parsePromptContext(prompt: string): any {
    // Extract character data
    const characterMatch = prompt.match(/Player Level: (\d+) ([^,\n]+)/);
    const statsMatch = prompt.match(/Player Stats: STR (\d+), DEX (\d+), INT (\d+), CHA (\d+)/);
    
    // Extract world state
    const locationMatch = prompt.match(/Location: ([^\n]+)/);
    const timeMatch = prompt.match(/Time: ([^\n]+)/);
    const weatherMatch = prompt.match(/Weather: ([^\n]+)/);
    
    // Extract player input
    const playerInputMatch = prompt.match(/\*\*PLAYER INPUT:\*\* "([^"]+)"/);
    const playerInput = playerInputMatch ? playerInputMatch[1] : '';
    
    // Extract campaign theme - look for the specific pattern in the prompt
    const themeMatch = prompt.match(/for a ([^ ]+) campaign/);
    const theme = themeMatch ? themeMatch[1] : 'fantasy';

    // Extract custom prompt
    const customPromptMatch = prompt.match(/\*\*CUSTOM CAMPAIGN PROMPT:\*\*\n([^*]+?)(?=\*\*|$)/);
    const customPrompt = customPromptMatch ? customPromptMatch[1].trim() : '';

    return {
      character: {
        level: characterMatch ? parseInt(characterMatch[1]) : 1,
        class: characterMatch ? characterMatch[2] : 'Adventurer',
        stats: statsMatch ? {
          strength: parseInt(statsMatch[1]),
          dexterity: parseInt(statsMatch[2]),
          intelligence: parseInt(statsMatch[3]),
          charisma: parseInt(statsMatch[4])
        } : { strength: 10, dexterity: 10, intelligence: 10, charisma: 10 }
      },
      worldState: {
        location: locationMatch ? locationMatch[1].trim() : 'unknown',
        time: timeMatch ? timeMatch[1].trim() : 'day',
        weather: weatherMatch ? weatherMatch[1].trim() : 'clear'
      },
      playerInput,
      theme,
      customPrompt
    };
  }

  private generateInitialScene(context: any): AIResponse {
    const { character, worldState, theme, customPrompt } = context;
    
    const location = this.generateLocation(worldState.location, theme);
    const npc = this.generateNPC(character, theme);
    const conflict = this.generateConflict(theme, customPrompt);
    
    const narratives = [
      `You find yourself in ${location.name}, where ${location.atmosphere}. ${npc.name}, a ${npc.role.toLowerCase()}, approaches you with ${npc.mood} in their eyes. "${npc.greeting}" they say, their voice ${npc.voice}.`,
      `As you enter ${location.name}, ${location.description}. ${npc.name} spots you and immediately makes their way over. "${npc.greeting}" they ${npc.action}, their ${npc.personality} nature evident in every gesture.`,
      `${location.name} ${location.activity}. ${npc.name} rushes toward you, their face ${npc.expression}. "${npc.greeting}" they ${npc.action}, clearly ${npc.motivation}.`
    ];

    const choices = [
      `Accept ${npc.name}'s request and ask for details`,
      `Express skepticism and demand more information`,
      `Ask about the local situation and ${npc.name}'s background`,
      `Request to see the area and gather your own intelligence`
    ];

    return {
      narrative: narratives[Math.floor(Math.random() * narratives.length)],
      choices,
      environment: location.id,
      worldStateUpdates: {
        newLocation: location.id,
        newNPCs: [{
          name: npc.name,
          role: npc.role,
          personality: npc.personality,
          currentMood: npc.mood,
          currentAction: npc.action
        }],
        consequences: [{
          type: 'immediate',
          description: `You've been approached by ${npc.name} about ${conflict.name}`,
          affectedAreas: [location.id]
        }]
      },
      atmosphere: {
        mood: location.mood,
        tension: 'medium',
        environmentalDetails: location.details
      }
    };
  }

  private generateDynamicResponse(context: any): AIResponse {
    const { character, worldState, playerInput, theme } = context;
    
    // Analyze player input and determine response type
    const input = playerInput.toLowerCase();
    
    if (this.isCombatAction(input)) {
      return this.generateCombatResponse(context);
    } else if (this.isExplorationAction(input)) {
      return this.generateExplorationResponse(context);
    } else if (this.isSocialAction(input)) {
      return this.generateSocialResponse(context);
    } else if (this.isRestAction(input)) {
      return this.generateRestResponse(context);
    } else {
      return this.generateGeneralResponse(context);
    }
  }

  private isCombatAction(input: string): boolean {
    const combatKeywords = ['attack', 'fight', 'combat', 'battle', 'strike', 'slash', 'stab', 'shoot', 'cast', 'spell'];
    return combatKeywords.some(keyword => input.includes(keyword));
  }

  private isExplorationAction(input: string): boolean {
    const explorationKeywords = ['explore', 'search', 'investigate', 'examine', 'look', 'check', 'find', 'discover'];
    return explorationKeywords.some(keyword => input.includes(keyword));
  }

  private isSocialAction(input: string): boolean {
    const socialKeywords = [
      'talk', 'ask', 'tell', 'speak', 'negotiate', 'persuade', 'intimidate', 'charm',
      'say', 'reply', 'respond', 'answer', 'question', 'stare', 'look', 'glance',
      'nod', 'shake', 'smile', 'frown', 'laugh', 'cry', 'whisper', 'shout',
      'greet', 'introduce', 'meet', 'converse', 'discuss', 'debate', 'argue',
      'agree', 'disagree', 'accept', 'refuse', 'promise', 'threaten', 'warn',
      'advise', 'suggest', 'propose', 'offer', 'request', 'demand', 'beg',
      'apologize', 'thank', 'congratulate', 'comfort', 'encourage', 'scold'
    ];
    return socialKeywords.some(keyword => input.includes(keyword));
  }

  private isRestAction(input: string): boolean {
    const restKeywords = ['rest', 'sleep', 'heal', 'recover', 'meditate', 'camp'];
    return restKeywords.some(keyword => input.includes(keyword));
  }

  private generateCombatResponse(context: any): AIResponse {
    const { character, worldState, theme } = context;
    const enemies = this.generateEnemies(theme, character.level, worldState.location);
    
    const combatNarratives = [
      `The tension erupts into violence! ${enemies.length > 1 ? 'Your enemies' : 'Your enemy'} ${enemies.length > 1 ? 'surround' : 'positions'} you, weapons drawn and eyes filled with determination. The ${character.class.toLowerCase()} in you recognizes this moment - it's time to prove your worth in battle.`,
      `Suddenly, ${enemies.length > 1 ? 'multiple figures' : 'a figure'} emerges from the shadows, ${enemies.length > 1 ? 'their' : 'their'} intentions clear. Your ${character.class.toLowerCase()} instincts kick in as you prepare for combat.`,
      `The air crackles with anticipation as ${enemies.length > 1 ? 'your opponents' : 'your opponent'} ${enemies.length > 1 ? 'take' : 'takes'} up ${enemies.length > 1 ? 'their' : 'their'} fighting stance. Your ${character.class.toLowerCase()} training prepares you for what comes next.`
    ];

    return {
      narrative: combatNarratives[Math.floor(Math.random() * combatNarratives.length)],
      choices: [
        "Engage in tactical combat using your class abilities",
        "Attempt to intimidate or bluff your way out",
        "Look for tactical advantages in the environment",
        "Call for reinforcements or help"
      ],
      combatEncounter: {
        active: true,
        enemies
      },
      atmosphere: {
        mood: 'tense',
        tension: 'high',
        environmentalDetails: 'The air is thick with the promise of violence and the sound of steel being drawn'
      }
    };
  }

  private generateEnemies(theme: string, characterLevel: number, location: string): Array<{name: string, health: number, attack: number, strength?: number, dexterity?: number, intelligence?: number, armorClass?: number}> {
    const themeEnemies = {
      fantasy: {
        tavern: ['Drunken Brawler', 'Thief', 'Mercenary'],
        forest: ['Bandit', 'Wolf', 'Goblin Scout'],
        dungeon: ['Skeleton', 'Goblin Warrior', 'Dark Elf'],
        city: ['City Guard', 'Thug', 'Assassin']
      },
      scifi: {
        tavern: ['Rogue Android', 'Space Pirate', 'Mutant'],
        forest: ['Alien Scout', 'Rogue Drone', 'Wild Creature'],
        dungeon: ['Security Bot', 'Alien Warrior', 'Mutant Beast'],
        city: ['Security Officer', 'Gang Member', 'Rogue AI']
      },
      horror: {
        tavern: ['Cursed Patron', 'Shadow Creature', 'Undead'],
        forest: ['Dark Entity', 'Cursed Beast', 'Shadow Walker'],
        dungeon: ['Undead Warrior', 'Dark Spirit', 'Cursed Guardian'],
        city: ['Corrupted Citizen', 'Shadow Stalker', 'Dark Entity']
      }
    };

    const enemies = themeEnemies[theme as keyof typeof themeEnemies]?.[location as keyof any] || 
                   themeEnemies.fantasy.tavern;
    
    const enemyCount = Math.min(characterLevel, 3);
    
    return Array.from({ length: enemyCount }, (_, i) => ({
      name: enemies[i % enemies.length],
      health: 20 + (characterLevel * 5) + Math.floor(Math.random() * 10),
      attack: 3 + characterLevel + Math.floor(Math.random() * 3),
      strength: 12 + Math.floor(Math.random() * 6),
      dexterity: 10 + Math.floor(Math.random() * 6),
      intelligence: 8 + Math.floor(Math.random() * 6),
      armorClass: 12 + Math.floor(Math.random() * 4)
    }));
  }

  private generateExplorationResponse(context: any): AIResponse {
    const { character, worldState, theme } = context;
    
    const discoveries = [
      "You discover ancient markings that seem to tell a story of the area's history",
      "A hidden passage reveals itself behind a loose stone, leading to unknown depths",
      "You find evidence of recent activity - footprints, disturbed earth, or discarded items",
      "The environment reveals subtle clues about what happened here recently",
      "Your investigation uncovers a hidden cache or secret compartment",
      "You notice environmental details that others might have missed"
    ];

    const explorationNarratives = [
      `Your careful investigation pays off! ${discoveries[Math.floor(Math.random() * discoveries.length)]}. Your ${character.class.toLowerCase()} instincts tell you this could be important.`,
      `Your ${character.class.toLowerCase()} training guides your search. ${discoveries[Math.floor(Math.random() * discoveries.length)]}, and you sense this discovery could change everything.`,
      `Your methodical approach reveals secrets others might miss. ${discoveries[Math.floor(Math.random() * discoveries.length)]}, and your ${character.class.toLowerCase()} experience helps you understand its significance.`
    ];

    return {
      narrative: explorationNarratives[Math.floor(Math.random() * explorationNarratives.length)],
      choices: [
        "Examine the discovery more closely for additional details",
        "Document your findings and search for related clues",
        "Investigate the surrounding area for more context",
        "Report your discovery to relevant NPCs or allies"
      ],
      atmosphere: {
        mood: 'curious',
        tension: 'low',
        environmentalDetails: 'The area reveals its secrets to your careful observation and expertise'
      }
    };
  }

  private generateSocialResponse(context: any): AIResponse {
    const { character, playerInput } = context;
    
    // Analyze the player's input to generate more specific responses
    const input = playerInput.toLowerCase();
    
    // Check for specific types of social interactions
    if (input.includes('how dire') || input.includes('serious') || input.includes('dangerous')) {
      return {
        narrative: `Captain Thorne's expression darkens as they lean in closer, their voice dropping to a grave whisper. "More dire than you can imagine. The ancient seals are weakening, and if they break completely, the entire region will be overrun. We've already lost three villages to the north. I need someone with your ${character.class.toLowerCase()} skills to help us investigate the source before it's too late."`,
        choices: [
          "Accept the mission and ask for more details about the ancient seals",
          "Request proof of the threat before committing",
          "Ask about the rewards and support you'll receive",
          "Decline politely, citing other pressing matters"
        ],
        atmosphere: {
          mood: 'urgent',
          tension: 'high',
          environmentalDetails: 'The tavern seems to grow quieter as Captain Thorne speaks, as if the very air holds its breath'
        }
      };
    }
    
    if (input.includes('stare') || input.includes('look') || input.includes('glance')) {
      return {
        narrative: `Your ${character.class.toLowerCase()} instincts tell you that Captain Thorne is genuine in their concern. Their weathered face shows the strain of someone who has seen too much, and their eyes carry the weight of responsibility. "I can see you're assessing the situation," they say, nodding approvingly. "That's exactly the kind of careful thinking we need right now."`,
        choices: [
          "Ask about their military background and experience",
          "Inquire about the specific nature of the threat",
          "Request to see any evidence or reports they have",
          "Ask about the political situation and who else is involved"
        ],
        atmosphere: {
          mood: 'respectful',
          tension: 'medium',
          environmentalDetails: 'The firelight casts dancing shadows that seem to emphasize the gravity of the situation'
        }
      };
    }
    
    if (input.includes('why me') || input.includes('choose') || input.includes('select')) {
      return {
        narrative: `"Why you?" Captain Thorne chuckles, but there's no humor in it. "I've been watching you since you walked in. The way you carry yourself, the way you observe your surroundings - you have the bearing of someone who knows how to handle themselves in dangerous situations. Plus, your ${character.class.toLowerCase()} background gives you skills we desperately need right now."`,
        choices: [
          "Ask about what specific skills they think you can offer",
          "Inquire about other potential allies or resources",
          "Request more information about the mission parameters",
          "Ask about the risks and potential consequences"
        ],
        atmosphere: {
          mood: 'analytical',
          tension: 'medium',
          environmentalDetails: "The captain's assessment seems to carry the weight of military experience and strategic thinking"
        }
      };
    }
    
    // Default social response for other interactions
    const socialNarratives = [
      `Your diplomatic approach opens new possibilities. The person you're speaking with seems to respond well to your ${character.class.toLowerCase()} manner and ${character.stats.charisma >= 14 ? 'natural charisma' : 'earnest approach'}. They share information that could prove valuable.`,
      `Your ${character.class.toLowerCase()} background helps you connect with the person. They seem to trust your ${character.stats.charisma >= 14 ? 'charming' : 'honest'} nature and share insights about the local situation.`,
      `Your conversation reveals unexpected depths. Your ${character.class.toLowerCase()} experience and ${character.stats.intelligence >= 14 ? 'sharp mind' : 'practical knowledge'} help you understand the nuances of what they're telling you.`
    ];

    return {
      narrative: socialNarratives[Math.floor(Math.random() * socialNarratives.length)],
      choices: [
        "Ask for more specific details about their concerns",
        "Offer assistance in return for their help",
        "Request an introduction to other important people",
        "Thank them and use this information strategically"
      ],
      atmosphere: {
        mood: 'cooperative',
        tension: 'low',
        environmentalDetails: 'The conversation creates a more relaxed and open atmosphere'
      }
    };
  }

  private generateRestResponse(context: any): AIResponse {
    const { character, worldState } = context;
    
    const restNarratives = [
      `You take a moment to rest and recover. The ${character.class.toLowerCase()} in you knows the value of preparation and recuperation. You feel your strength returning and your mind clearing.`,
      `Your ${character.class.toLowerCase()} training emphasizes the importance of rest. As you take this time to recover, you feel your energy returning and your focus sharpening.`,
      `The ${character.class.toLowerCase()} way teaches patience and preparation. This rest allows you to recover your strength and plan your next move with renewed clarity.`
    ];

    return {
      narrative: restNarratives[Math.floor(Math.random() * restNarratives.length)],
      choices: [
        "Continue resting to fully recover your strength",
        "Use this time to plan your next move carefully",
        "Check your equipment and supplies while resting",
        "Resume your journey with renewed energy"
      ],
      characterUpdates: [{
        playerId: "current",
        xpGain: 5,
        xpReason: "Wise use of rest time and strategic thinking",
        statChanges: {
          health: 10,
          mana: 5
        }
      }],
      atmosphere: {
        mood: 'peaceful',
        tension: 'low',
        environmentalDetails: 'The area provides a safe haven for rest and recovery'
      }
    };
  }

  private generateGeneralResponse(context: any): AIResponse {
    const { character, worldState, theme, recentActions } = context;
    
    const generalNarratives = [
      `Your actions have consequences in this ${theme} world. The story continues to unfold based on your choices, and your ${character.class.toLowerCase()} skills and level ${character.level} experience guide your path forward.`,
      `The world responds to your presence and actions. Your ${character.class.toLowerCase()} background and recent decisions shape how events unfold around you.`,
      `Your ${character.class.toLowerCase()} instincts serve you well as you navigate this situation. Your level ${character.level} experience and recent actions influence the world's response to your presence.`
    ];

    return {
      narrative: generalNarratives[Math.floor(Math.random() * generalNarratives.length)],
      choices: [
        "Continue with your current approach and see where it leads",
        "Try a different strategy based on what you've learned",
        "Seek advice from others who might have relevant experience",
        "Take time to reflect on your options and their implications"
      ],
      atmosphere: {
        mood: 'neutral',
        tension: 'low',
        environmentalDetails: 'The world responds to your presence and actions in subtle ways'
      }
    };
  }

  private generateLocation(locationType: string, theme: string): any {
    const locations = {
      tavern: {
        fantasy: {
          name: 'The Prancing Pony Tavern',
          atmosphere: 'warm firelight dances across weathered faces',
          description: 'bustles with activity and the sound of laughter',
          activity: 'hums with the energy of travelers and locals',
          mood: 'cozy',
          details: 'The air is thick with the scent of ale and wood smoke'
        },
        scifi: {
          name: 'The Stellar Lounge',
          atmosphere: 'neon lights pulse to the rhythm of distant engines',
          description: 'buzzes with the energy of space travelers',
          activity: 'vibrates with the hum of technology and conversation',
          mood: 'futuristic',
          details: 'The air hums with the subtle energy of advanced life support systems'
        },
        horror: {
          name: 'The Shadowed Inn',
          atmosphere: 'flickering candles cast dancing shadows on the walls',
          description: 'echoes with whispered conversations',
          activity: 'pulses with an uneasy energy',
          mood: 'foreboding',
          details: 'The air is thick with the scent of old wood and something else, something older'
        },
        urban: {
          name: 'The Midnight Bar',
          atmosphere: 'dim lighting creates intimate corners for private conversations',
          description: 'buzzes with the energy of city nightlife',
          activity: 'throbs with the pulse of urban life',
          mood: 'mysterious',
          details: 'The air carries the mingled scents of coffee, alcohol, and urban mystery'
        },
        apocalypse: {
          name: 'The Last Stop',
          atmosphere: 'makeshift barricades and dim emergency lighting',
          description: 'echoes with the sounds of survivors sharing stories',
          activity: 'hums with the quiet desperation of those who remain',
          mood: 'grim',
          details: 'The air is thick with the scent of survival and the weight of lost civilization'
        },
        pirate: {
          name: 'The Salty Dog',
          atmosphere: 'lanterns swing gently with the rhythm of the sea',
          description: 'roars with the laughter of sailors and adventurers',
          activity: 'bustles with tales of treasure and adventure',
          mood: 'adventurous',
          details: 'The air carries the salty tang of the ocean and the promise of fortune'
        }
      },
      forest: {
        fantasy: {
          name: 'The Enchanted Grove',
          atmosphere: 'ancient trees whisper secrets to the wind',
          description: 'shimmers with magical energy and natural beauty',
          activity: 'pulses with the life force of the forest',
          mood: 'mystical',
          details: 'The air is alive with the scent of earth, magic, and ancient wisdom'
        },
        scifi: {
          name: 'The Bio-Dome Forest',
          atmosphere: 'artificial sunlight filters through genetically enhanced foliage',
          description: 'buzzes with the energy of engineered ecosystems',
          activity: 'throbs with the pulse of controlled nature',
          mood: 'synthetic',
          details: 'The air carries the scent of purified oxygen and technological harmony'
        },
        horror: {
          name: 'The Twisted Woods',
          atmosphere: 'malformed trees reach like skeletal fingers toward the sky',
          description: 'echoes with unnatural sounds and distant screams',
          activity: 'pulses with dark energy and malevolent presence',
          mood: 'terrifying',
          details: 'The air is thick with the scent of decay and something far worse'
        }
      },
      dungeon: {
        fantasy: {
          name: 'The Ancient Crypts',
          atmosphere: 'torchlight flickers against ancient stone walls',
          description: 'echoes with the whispers of forgotten souls',
          activity: 'pulses with the energy of ancient magic',
          mood: 'mysterious',
          details: 'The air is thick with the dust of ages and the weight of history'
        },
        scifi: {
          name: 'The Abandoned Facility',
          atmosphere: 'emergency lighting casts eerie shadows on metal walls',
          description: 'buzzes with the remnants of advanced technology',
          activity: 'throbs with the pulse of malfunctioning systems',
          mood: 'technological',
          details: 'The air hums with the energy of dormant machines and lost knowledge'
        },
        horror: {
          name: 'The Cursed Catacombs',
          atmosphere: 'darkness seems to swallow the light whole',
          description: 'echoes with the sounds of things that should not exist',
          activity: 'pulses with malevolent energy and dark magic',
          mood: 'horrifying',
          details: 'The air is thick with the scent of death and the presence of evil'
        }
      },
      city: {
        fantasy: {
          name: 'The Grand Bazaar',
          atmosphere: 'colorful stalls and the sounds of commerce fill the air',
          description: 'bustles with merchants, travelers, and city life',
          activity: 'hums with the energy of trade and opportunity',
          mood: 'lively',
          details: 'The air carries the scent of spices, goods, and the promise of fortune'
        },
        scifi: {
          name: 'The Mega-City District',
          atmosphere: 'neon lights and holographic advertisements create a dazzling display',
          description: 'buzzes with the energy of advanced civilization',
          activity: 'throbs with the pulse of technological progress',
          mood: 'futuristic',
          details: 'The air hums with the energy of countless machines and digital life'
        },
        horror: {
          name: 'The Forgotten Quarter',
          atmosphere: 'abandoned buildings and broken streetlights create an eerie silence',
          description: 'echoes with the sounds of things that lurk in the shadows',
          activity: 'pulses with the energy of fear and desperation',
          mood: 'terrifying',
          details: 'The air is thick with the scent of decay and the weight of forgotten lives'
        }
      }
    };

    const themeLocations = locations[locationType as keyof typeof locations];
    const locationData = themeLocations?.[theme as keyof typeof themeLocations] || locations.tavern.fantasy;
    
    return {
      ...locationData,
      id: locationType
    };
  }

  private generateNPC(character: any, theme: string): any {
    const npcs = {
      fantasy: [
        {
          name: 'Eldric the Sage',
          role: 'Wise Scholar',
          personality: 'scholarly and contemplative',
          mood: 'concerned wisdom',
          action: 'approaches you thoughtfully',
          greeting: 'I have been studying the ancient texts, and I believe I have found something that requires your attention',
          voice: 'carries the weight of centuries of knowledge',
          expression: 'lined with the wisdom of age',
          motivation: 'desperate to share their discovery'
        },
        {
          name: 'Captain Thorne',
          role: 'Veteran Warrior',
          personality: 'battle-hardened but honorable',
          mood: 'urgent determination',
          action: 'strides toward you with purpose',
          greeting: 'We need someone with your skills. The situation is more dire than most realize',
          voice: 'carries the authority of command',
          expression: 'marked by years of conflict',
          motivation: 'seeking a capable ally for a dangerous mission'
        },
        {
          name: 'Lady Seraphina',
          role: 'Noble Diplomat',
          personality: 'graceful and politically savvy',
          mood: 'calculated concern',
          action: 'glides toward you with practiced elegance',
          greeting: 'Your reputation precedes you. I believe we may be able to help each other in these troubled times',
          voice: 'carries the refinement of noble breeding',
          expression: 'shows the careful control of one used to court intrigue',
          motivation: 'seeking a trustworthy agent for delicate matters'
        }
      ],
      scifi: [
        {
          name: 'Commander Nova',
          role: 'AI Coordinator',
          personality: 'logical and efficient',
          mood: 'digital urgency',
          action: 'approaches with calculated precision',
          greeting: 'My sensors have detected an anomaly that requires immediate attention',
          voice: 'carries the precision of advanced algorithms',
          expression: 'displays subtle digital patterns',
          motivation: 'programmed to seek assistance for critical situations'
        },
        {
          name: 'Dr. Zara Chen',
          role: 'Research Scientist',
          personality: 'brilliant but socially awkward',
          mood: 'scientific excitement mixed with concern',
          action: 'approaches with the energy of one who has made a breakthrough',
          greeting: 'You won\'t believe what I\'ve discovered! But we need someone with your skills to investigate further',
          voice: 'carries the enthusiasm of scientific discovery',
          expression: 'shows the intensity of someone who has been working too long',
          motivation: 'desperate to share their findings and get help'
        },
        {
          name: 'Captain Vega',
          role: 'Space Fleet Commander',
          personality: 'disciplined and strategic',
          mood: 'military urgency',
          action: 'marches toward you with purpose',
          greeting: 'We have a situation that requires immediate action. Your skills are exactly what we need',
          voice: 'carries the authority of military command',
          expression: 'shows the stress of someone carrying heavy responsibility',
          motivation: 'seeking a capable operative for a critical mission'
        }
      ],
      horror: [
        {
          name: 'Father Marcus',
          role: 'Local Priest',
          personality: 'haunted but determined',
          mood: 'desperate hope',
          action: 'emerges from the shadows',
          greeting: 'The darkness has returned, and we need someone who can face it',
          voice: 'carries the weight of terrible knowledge',
          expression: 'haunted by what they have seen',
          motivation: 'seeking someone to help fight the darkness'
        },
        {
          name: 'Dr. Sarah Blackwood',
          role: 'Paranormal Investigator',
          personality: 'obsessive and driven',
          mood: 'frantic determination',
          action: 'rushes toward you with barely contained energy',
          greeting: 'I\'ve been tracking this for months! The signs are all there, and now it\'s happening again',
          voice: 'carries the intensity of someone who has seen too much',
          expression: 'shows the strain of someone who hasn\'t slept in days',
          motivation: 'desperate to stop the cycle of horror'
        },
        {
          name: 'The Caretaker',
          role: 'Groundskeeper',
          personality: 'mysterious and knowing',
          mood: 'ominous warning',
          action: 'materializes from the darkness',
          greeting: 'You shouldn\'t be here. But since you are, perhaps you can help with what\'s coming',
          voice: 'carries the weight of ancient secrets',
          expression: 'shows the wisdom of one who has seen generations pass',
          motivation: 'seeking someone to break an ancient curse'
        }
      ],
      urban: [
        {
          name: 'Detective Mike Torres',
          role: 'Homicide Detective',
          personality: 'world-weary but determined',
          mood: 'professional concern',
          action: 'approaches with the practiced ease of a cop',
          greeting: 'I\'ve got a case that\'s got me stumped. I think you might be able to help',
          voice: 'carries the gravel of too many late nights',
          expression: 'shows the weariness of someone who has seen too much',
          motivation: 'seeking help with an unsolvable case'
        },
        {
          name: 'Madame Celeste',
          role: 'Fortune Teller',
          personality: 'mysterious and theatrical',
          mood: 'prophetic urgency',
          action: 'emerges from behind her curtain with dramatic flair',
          greeting: 'The cards have been trying to tell me something about you. There\'s danger ahead',
          voice: 'carries the mystery of the unknown',
          expression: 'shows the intensity of someone who sees beyond the veil',
          motivation: 'seeking to prevent a terrible fate'
        },
        {
          name: 'Marcus "The Fixer"',
          role: 'Information Broker',
          personality: 'smooth and calculating',
          mood: 'businesslike interest',
          action: 'approaches with the confidence of someone who knows everyone',
          greeting: 'I hear you\'re looking for work. I might have something that pays well',
          voice: 'carries the smooth confidence of a dealmaker',
          expression: 'shows the careful calculation of a businessman',
          motivation: 'seeking a reliable operative for a lucrative job'
        }
      ],
      apocalypse: [
        {
          name: 'Commander Hayes',
          role: 'Survival Leader',
          personality: 'pragmatic and protective',
          mood: 'urgent concern',
          action: 'approaches with the authority of someone used to making life-or-death decisions',
          greeting: 'We\'re running out of time and supplies. I need someone who can handle themselves',
          voice: 'carries the weight of leadership in desperate times',
          expression: 'shows the stress of someone responsible for others\' survival',
          motivation: 'seeking help to protect the community'
        },
        {
          name: 'Dr. Elena Rodriguez',
          role: 'Medical Researcher',
          personality: 'desperate but hopeful',
          mood: 'scientific urgency',
          action: 'approaches with the energy of someone who has made a breakthrough',
          greeting: 'I think I\'ve found a way to help, but I need someone to get the supplies',
          voice: 'carries the hope of someone who refuses to give up',
          expression: 'shows the determination of someone fighting against impossible odds',
          motivation: 'seeking help to save lives'
        },
        {
          name: 'Scout',
          role: 'Wasteland Scout',
          personality: 'cautious and observant',
          mood: 'warning concern',
          action: 'emerges from the shadows with practiced stealth',
          greeting: 'You need to know what\'s coming. It\'s worse than we thought',
          voice: 'carries the urgency of someone who has seen terrible things',
          expression: 'shows the alertness of someone who lives by their wits',
          motivation: 'seeking to warn others of impending danger'
        }
      ],
      pirate: [
        {
          name: 'Captain Blackbeard',
          role: 'Pirate Captain',
          personality: 'charismatic and ruthless',
          mood: 'adventurous excitement',
          action: 'swaggers toward you with the confidence of a legend',
          greeting: 'Ahoy there! I\'ve got a tale of treasure that\'ll make your eyes sparkle',
          voice: 'carries the rum-soaked authority of a sea captain',
          expression: 'shows the cunning of someone who has survived countless battles',
          motivation: 'seeking a crew for a legendary treasure hunt'
        },
        {
          name: 'Madame Fortune',
          role: 'Port Town Proprietor',
          personality: 'shrewd and well-connected',
          mood: 'businesslike interest',
          action: 'approaches with the practiced grace of a successful merchant',
          greeting: 'I hear you\'re looking for adventure. I might have just the thing',
          voice: 'carries the smooth confidence of someone who knows every secret',
          expression: 'shows the wisdom of someone who has seen fortunes made and lost',
          motivation: 'seeking a reliable partner for a profitable venture'
        },
        {
          name: 'The Navigator',
          role: 'Mysterious Seafarer',
          personality: 'enigmatic and knowledgeable',
          mood: 'prophetic warning',
          action: 'emerges from the shadows with the grace of one who knows the sea',
          greeting: 'The tides are changing, and not for the better. You\'ll need a guide',
          voice: 'carries the mystery of one who has sailed to the edge of the world',
          expression: 'shows the wisdom of someone who has seen things beyond mortal ken',
          motivation: 'seeking someone to help prevent a maritime disaster'
        }
      ]
    };

    const themeNPCs = npcs[theme as keyof typeof npcs] || npcs.fantasy;
    return themeNPCs[Math.floor(Math.random() * themeNPCs.length)];
  }

  private generateConflict(theme: string, customPrompt: string): any {
    const conflicts = {
      fantasy: [
        { name: 'Ancient Prophecy', description: 'A prophecy foretells great danger' },
        { name: 'Missing Artifact', description: 'A powerful artifact has disappeared' },
        { name: 'Political Intrigue', description: 'Noble houses vie for power' },
        { name: 'Monster Threat', description: 'Creatures threaten the realm' },
        { name: 'Dark Magic', description: 'Forbidden magic has been unleashed' },
        { name: 'Dragon Awakening', description: 'An ancient dragon has stirred from its slumber' }
      ],
      scifi: [
        { name: 'System Malfunction', description: 'Critical systems are failing' },
        { name: 'Alien Invasion', description: 'Unknown forces approach' },
        { name: 'Resource Shortage', description: 'Essential supplies are running low' },
        { name: 'Political Crisis', description: 'Factions struggle for control' },
        { name: 'AI Rebellion', description: 'Artificial intelligences have become hostile' },
        { name: 'Space Anomaly', description: 'A mysterious phenomenon threatens the sector' }
      ],
      horror: [
        { name: 'Supernatural Threat', description: 'Dark forces have awakened' },
        { name: 'Dark Ritual', description: 'An ancient ritual has begun' },
        { name: 'Missing People', description: 'Citizens are disappearing' },
        { name: 'Ancient Curse', description: 'A curse has been unleashed' },
        { name: 'Cult Activity', description: 'A sinister cult is growing in power' },
        { name: 'Haunted Location', description: 'A place has become possessed by evil' }
      ],
      urban: [
        { name: 'Criminal Syndicate', description: 'A powerful crime organization is expanding' },
        { name: 'Corrupt Officials', description: 'Government officials are involved in illegal activities' },
        { name: 'Supernatural Crime', description: 'Supernatural forces are behind recent crimes' },
        { name: 'Urban Legend', description: 'A local legend has become real' },
        { name: 'Corporate Conspiracy', description: 'A corporation is hiding dangerous secrets' },
        { name: 'Underground Network', description: 'A secret network operates beneath the city' }
      ],
      apocalypse: [
        { name: 'Resource Crisis', description: 'Essential resources are running out' },
        { name: 'Hostile Faction', description: 'A dangerous group threatens the community' },
        { name: 'Environmental Hazard', description: 'A new environmental threat has emerged' },
        { name: 'Disease Outbreak', description: 'A deadly disease is spreading' },
        { name: 'Radiation Zone', description: 'A radioactive area is expanding' },
        { name: 'Mutant Threat', description: 'Mutated creatures are becoming more aggressive' }
      ],
      pirate: [
        { name: 'Treasure Hunt', description: 'A legendary treasure has been discovered' },
        { name: 'Naval Conflict', description: 'Pirate fleets are at war' },
        { name: 'Cursed Island', description: 'An island holds dark secrets' },
        { name: 'Sea Monster', description: 'A sea creature threatens shipping lanes' },
        { name: 'Navy Pursuit', description: 'The navy is hunting pirates' },
        { name: 'Lost Fleet', description: 'A fleet has disappeared in mysterious circumstances' }
      ]
    };

    const themeConflicts = conflicts[theme as keyof typeof conflicts] || conflicts.fantasy;
    return themeConflicts[Math.floor(Math.random() * themeConflicts.length)];
  }

  private generateFallbackResponse(): AIResponse {
    return {
      narrative: "The world around you continues to unfold, revealing new possibilities and challenges. Your actions shape the story in ways both seen and unseen.",
      choices: [
        "Continue exploring the current situation",
        "Seek out more information from the environment",
        "Interact with those around you",
        "Take time to plan your next move"
      ],
      atmosphere: {
        mood: 'neutral',
        tension: 'low',
        environmentalDetails: 'The world responds to your presence in subtle ways'
      }
    };
  }
}

// Create and export the AI service instance
export const aiService = new AdvancedAIService();

// Mock the window.claude object for compatibility
if (typeof window !== 'undefined') {
  (window as any).claude = {
    complete: (prompt: string) => aiService.complete(prompt)
  };
} 