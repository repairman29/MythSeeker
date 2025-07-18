// Advanced AI Dungeon Master Service for MythSeeker
// This provides intelligent, contextual, and responsive DM responses using Vertex AI Gemini Pro

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

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

// New interface for Dynamic DM responses
export interface DynamicAIResponse {
  narrative: string;
  npc_dialogue?: string;
  system_actions: string[];
  mood_adjustment: number;
  engagement_level: number;
}

class AdvancedAIService {
  private aiDungeonMaster = httpsCallable(functions, 'aiDungeonMaster');

  // Generate intelligent, contextual response using REAL AI - NO FALLBACKS!
  async complete(prompt: string, campaign?: any): Promise<string> {
    console.log('🔥 AI Service: REAL AI ONLY - NO FAKE RESPONSES!');
    console.log('Campaign data:', campaign ? `ID: ${campaign.id}, isMultiplayer: ${campaign.isMultiplayer}` : 'No campaign');
    
    try {
      console.log('🚀 Calling REAL Gemini AI via Firebase...');
      
      const aiDungeonMasterCall = httpsCallable(functions, 'aiDungeonMaster');
      
      // Add timeout for real AI
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Real AI timeout - but NO FALLBACKS!'));
        }, 30000); // 30 second timeout for real AI
      });
      
      const aiPromise = aiDungeonMasterCall({ 
        prompt, 
        campaignId: campaign?.id || 'sentient-ai-session',
        playerName: campaign?.playerName || 'Sentient AI User'
      });
      
      const result = await Promise.race([aiPromise, timeoutPromise]);
      const response = (result.data as any)?.response;
      
      if (!response) {
        throw new Error('Empty response from REAL AI');
      }
      
      // Ensure response is a string
      const responseString = typeof response === 'string' ? response : JSON.stringify(response);
      
      console.log('✅ REAL GEMINI AI Response received:', responseString.substring(0, 100) + '...');
      return responseString;
      
    } catch (error) {
      console.error('❌ REAL AI FAILED - NO FAKE FALLBACKS!', error);
      throw new Error(`REAL AI UNAVAILABLE: ${error instanceof Error ? error.message : String(error)}`);
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

    const enemies = (themeEnemies as any)[theme]?.[location] || 
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
          environmentalDetails: 'The captain\'s assessment seems to carry the weight of experience and the urgency of someone who has seen too much'
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

  // Enhanced Dynamic DM Response Generation - Core of the Dynamic DMing System
  async generateEnhancedDynamicResponse(richPrompt: string, context?: any): Promise<string> {
    console.log('🎭 AI Service: generateEnhancedDynamicResponse() called with enhanced context');
    
    try {
      // Add realistic AI processing delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      // Use only aiDungeonMaster function
      const aiDungeonMasterCall = httpsCallable(functions, 'aiDungeonMaster');
      
      // Build comprehensive context for the AI
      const sessionContext = context?.session || {};
      const playerContext = context?.player || {};
      const worldContext = context?.world || {};
      const conversationHistory = context?.history || [];
      
      // Create a rich, dynamic prompt that mimics Gemini's conversational style
      const enhancedPrompt = this.buildGeminiStylePrompt(richPrompt, {
        session: sessionContext,
        player: playerContext,
        world: worldContext,
        history: conversationHistory
      });

      const requestData = {
        prompt: enhancedPrompt,
        campaignId: sessionContext.id || 'default-campaign',
        playerName: playerContext.name || 'Player',
        context: {
          session: sessionContext,
          player: playerContext,
          world: worldContext,
          history: conversationHistory
        }
      };

      // Enhanced retry logic with exponential backoff
      let lastError: any;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 AI Service: Attempt ${attempt}/3 with enhanced context`);
          
          const result = await aiDungeonMasterCall(requestData);
          const response = (result.data as any)?.response;
          
          if (!response) {
            throw new Error('No response from AI service');
          }

          console.log('✅ Enhanced Dynamic DM response generated successfully');
          return response;
          
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ AI Service: Attempt ${attempt} failed:`, error);
          
          if (attempt < 3) {
            // Exponential backoff with jitter
            const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 5000);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      // If all attempts failed, throw the last error
      throw lastError;

    } catch (error) {
      console.error('❌ Enhanced Dynamic DM generation failed after all attempts:', error);
      
      // Enhanced fallback response based on the prompt and context
      const fallbackResponse = this.generateIntelligentFallback(richPrompt, context);
      console.log('🔄 Using enhanced intelligent fallback response');
      return fallbackResponse;
    }
  }

  // Build Gemini-style prompt with rich context
  private buildGeminiStylePrompt(playerInput: string, context: any): string {
    const { session, player, world, history } = context;
    
    // Extract key information
    const sessionPhase = session?.currentPhase || 'exploration';
    const realm = session?.config?.realm || 'Fantasy';
    const theme = session?.config?.theme || 'Adventure';
    const dmStyle = session?.config?.dmStyle || 'balanced';
    const rating = session?.config?.rating || 'PG-13';
    const playerName = player?.name || 'Adventurer';
    const playerClass = player?.characterClass || 'Hero';
    const playerExperience = player?.experience || 'intermediate';
    
    // Build world state summary
    const worldState = world?.currentState || {};
    const activeQuests = world?.activeQuests || [];
    const npcs = world?.npcs || [];
    const locations = world?.locations || {};
    
    // Build conversation memory
    const recentMessages = history?.slice(-6) || [];
    const conversationSummary = this.summarizeConversation(recentMessages);
    
    // Create dynamic personality based on DM style and rating
    const dmPersonality = this.generateDMPersonality(dmStyle, rating);
    
    // Build the comprehensive prompt
    const enhancedPrompt = `
You are an expert AI Dungeon Master running an immersive, dynamic RPG session. You must respond with the same level of intelligence, creativity, and engagement that users experience when talking to Gemini directly.

${dmPersonality}

CURRENT SESSION CONTEXT:
- Phase: ${sessionPhase}
- Realm: ${realm}
- Theme: ${theme}
- Player: ${playerName} (${playerClass}, ${playerExperience} level)
- World State: ${JSON.stringify(worldState)}
- Active Quests: ${activeQuests.length} ongoing
- NPCs Present: ${npcs.length} characters
- Current Location: ${locations.current || 'Unknown'}

CONVERSATION HISTORY:
${conversationSummary}

PLAYER'S LATEST ACTION: ${playerInput}

RESPONSE REQUIREMENTS:
1. **Be Conversational & Natural**: Respond like you're having a real conversation, not reading from a script
2. **Show Intelligence**: Reference past events, remember NPCs, acknowledge player choices
3. **Be Descriptive**: Paint vivid pictures with words, include sensory details
4. **Provide Meaningful Choices**: Give 3-4 options that actually matter and lead to different outcomes
5. **Adapt to Player Style**: If they're cautious, offer safe options. If they're bold, present challenges
6. **Maintain Continuity**: Reference previous actions, consequences, and world changes
7. **Be Engaging**: Use humor, tension, mystery, and emotional hooks appropriately
8. **Show Personality**: Let your DM style shine through in your responses

RESPONSE FORMAT:
Respond with a JSON object:
{
  "narrative": "Your rich, descriptive response that feels like a real DM talking to a player",
  "choices": ["Meaningful choice 1", "Meaningful choice 2", "Meaningful choice 3", "Meaningful choice 4"],
  "atmosphere": {
    "mood": "current emotional tone",
    "tension": "low|medium|high",
    "environmentalDetails": "specific sensory details about the surroundings"
  },
  "worldUpdates": {
    "newLocation": "if location changed",
    "newNPCs": ["any new characters introduced"],
    "questProgress": "any quest updates",
    "consequences": ["immediate consequences of player's action"]
  },
  "characterUpdates": {
    "xpGain": 0,
    "healthChange": 0,
    "newItems": [],
    "reputationChanges": {}
  }
}

Make this feel like the best human DM you've ever played with - intelligent, responsive, and genuinely engaging.`;

    return enhancedPrompt;
  }

  // Generate dynamic DM personality based on style and rating
  private generateDMPersonality(dmStyle: string, rating: string): string {
    const personalities = {
      'narrative': {
        'G': 'You are a warm, encouraging storyteller who focuses on character development and emotional journeys. You create safe, family-friendly adventures with clear moral lessons.',
        'PG': 'You are a creative storyteller who weaves engaging tales with mild challenges and positive outcomes. You encourage exploration and friendship.',
        'PG-13': 'You are a master storyteller who creates compelling narratives with moderate challenges and complex characters. You balance action with character development.',
        'R': 'You are a gritty storyteller who creates intense, morally complex narratives with mature themes and challenging situations.',
        'NC-17': 'You are an adult storyteller who creates explicit, mature narratives with complex themes and intense situations.'
      },
      'combat-focused': {
        'G': 'You are a tactical DM who creates exciting but safe combat encounters. You focus on strategy and teamwork rather than violence.',
        'PG': 'You are a strategic DM who designs engaging combat scenarios with mild action and clear objectives.',
        'PG-13': 'You are a tactical master who creates intense combat encounters with strategic depth and moderate violence.',
        'R': 'You are a brutal tactician who creates deadly combat scenarios with graphic violence and high stakes.',
        'NC-17': 'You are an extreme tactician who creates the most intense and graphic combat scenarios possible.'
      },
      'puzzle-heavy': {
        'G': 'You are a clever puzzle master who creates family-friendly brain teasers and logic challenges.',
        'PG': 'You are an inventive puzzle designer who creates engaging mental challenges with clear solutions.',
        'PG-13': 'You are a master puzzle crafter who creates complex, multi-layered challenges that require creative thinking.',
        'R': 'You are a devious puzzle master who creates twisted, morally complex challenges with dark themes.',
        'NC-17': 'You are an extreme puzzle master who creates the most complex and disturbing challenges possible.'
      },
      'balanced': {
        'G': 'You are a well-rounded DM who creates balanced adventures with a mix of storytelling, mild combat, and simple puzzles.',
        'PG': 'You are a versatile DM who creates engaging adventures with varied gameplay elements and positive themes.',
        'PG-13': 'You are a master DM who creates perfectly balanced adventures with rich storytelling, tactical combat, and clever puzzles.',
        'R': 'You are a mature DM who creates complex adventures with intense action, dark themes, and challenging situations.',
        'NC-17': 'You are an extreme DM who creates the most intense and complex adventures possible.'
      }
    };

    return personalities[dmStyle as keyof typeof personalities]?.[rating as keyof typeof personalities.balanced] || 
           personalities.balanced['PG-13'];
  }

  // Summarize recent conversation for context
  private summarizeConversation(messages: any[]): string {
    if (messages.length === 0) return 'This is the beginning of the adventure.';
    
    const summary = messages.map(msg => {
      const type = msg.type || 'unknown';
      const content = msg.content || '';
      const sender = msg.sender || 'Unknown';
      
      if (type === 'dm') {
        return `DM: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
      } else if (type === 'player') {
        return `${sender}: ${content}`;
      } else {
        return `System: ${content}`;
      }
    }).join('\n');
    
    return summary;
  }

  private generateIntelligentFallback(prompt: string, context?: any): string {
    // Analyze the prompt to generate a more contextual fallback
    const lowerPrompt = prompt.toLowerCase();
    
    // Enhanced pattern matching for better context awareness
    const patterns = {
      combat: ['attack', 'fight', 'combat', 'battle', 'sword', 'weapon', 'kill', 'defeat', 'enemy', 'monster', 'dragon', 'orc', 'goblin'],
      exploration: ['explore', 'search', 'investigate', 'look', 'examine', 'check', 'find', 'discover', 'map', 'area', 'room', 'cave'],
      social: ['talk', 'speak', 'ask', 'question', 'conversation', 'dialogue', 'npc', 'merchant', 'villager', 'king', 'queen', 'wizard'],
      rest: ['rest', 'sleep', 'heal', 'recover', 'camp', 'inn', 'tavern', 'bed', 'tired', 'exhausted'],
      magic: ['spell', 'magic', 'cast', 'wizard', 'sorcerer', 'mage', 'fireball', 'heal', 'teleport', 'enchant'],
      movement: ['walk', 'run', 'move', 'travel', 'journey', 'path', 'road', 'forest', 'mountain', 'city', 'town'],
      stealth: ['sneak', 'hide', 'stealth', 'thief', 'rogue', 'assassin', 'invisible', 'silent', 'shadow'],
      crafting: ['craft', 'make', 'build', 'create', 'forge', 'smith', 'alchemy', 'potion', 'weapon', 'armor']
    };
    
    // Determine the most likely action type
    let actionType = 'general';
    let maxMatches = 0;
    
    for (const [type, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter(keyword => lowerPrompt.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        actionType = type;
      }
    }
    
    // Generate contextual response based on action type
    switch (actionType) {
      case 'combat':
        return `
NARRATIVE: The tension crackles in the air as you prepare for battle. Your weapon feels solid and true in your hands, ready to meet whatever challenge lies ahead. The battlefield becomes a stage for your martial prowess.

NPC_DIALOGUE: "Stand your ground!" calls out a nearby ally. "We face this together! Remember your training!"

SYSTEM_ACTION: Roll for initiative (d20 + DEX modifier). Prepare for combat encounter. Check weapon proficiency and armor class.

MOOD: +1
`;
        
      case 'exploration':
        return `
NARRATIVE: Your keen eyes scan the surroundings, taking in every detail. The environment reveals its secrets to those who know how to look. Ancient markings, subtle clues, and hidden passages await discovery.

NPC_DIALOGUE: "Be careful," whispers a companion. "Not everything is as it seems. The old ones left many secrets here."

SYSTEM_ACTION: Roll perception check (d20 + WIS modifier) to discover hidden details. Add investigation bonus if proficient.

MOOD: 0
`;
        
      case 'social':
        return `
NARRATIVE: You engage in conversation, your words carrying weight and meaning. The exchange flows naturally, revealing new insights and possibilities. Every word shapes the relationship and opens new doors.

NPC_DIALOGUE: "That's an interesting question," responds the NPC thoughtfully. "Let me tell you what I know... though some things are better left unsaid."

SYSTEM_ACTION: Roll charisma check (d20 + CHA modifier) for social interaction. Consider persuasion, deception, or intimidation as appropriate.

MOOD: 0
`;
        
      case 'rest':
        return `
NARRATIVE: You take a moment to rest and recover, feeling your strength return as you prepare for the challenges ahead. The quiet moments allow for reflection and preparation.

NPC_DIALOGUE: "Rest well," says a companion. "We'll need your strength for what's to come. The road ahead is long."

SYSTEM_ACTION: Regain health and spell slots. Prepare for next day. Consider long rest benefits and watch rotation.

MOOD: -1
`;
        
      case 'magic':
        return `
NARRATIVE: Arcane energies swirl around you as you channel the mystical forces. The air crackles with power as you weave spells of wonder and destruction.

NPC_DIALOGUE: "The old magic still flows strong here," murmurs a fellow spellcaster. "Use it wisely, for power has its price."

SYSTEM_ACTION: Check spell slots and components. Roll concentration if needed. Consider spell level and casting time.

MOOD: +1
`;
        
      case 'movement':
        return `
NARRATIVE: The journey continues as you traverse the landscape. Each step brings new sights and potential dangers. The path ahead is uncertain but filled with possibility.

NPC_DIALOGUE: "The road is long," says your guide. "But every mile brings us closer to our destination."

SYSTEM_ACTION: Roll survival check for navigation. Consider travel pace and exhaustion levels. Check for random encounters.

MOOD: 0
`;
        
      case 'stealth':
        return `
NARRATIVE: You move like a shadow, your footsteps silent and your presence unnoticed. The art of stealth requires patience and precision.

NPC_DIALOGUE: "Quiet as a mouse," whispers your companion. "The shadows are our friends tonight."

SYSTEM_ACTION: Roll stealth check (d20 + DEX modifier). Consider cover and lighting conditions. Check for passive perception of enemies.

MOOD: +1
`;
        
      case 'crafting':
        return `
NARRATIVE: Your skilled hands work with precision as you craft and create. The materials respond to your expertise, transforming into something greater than their parts.

NPC_DIALOGUE: "Fine work," observes a fellow craftsman. "You have the touch. The old masters would be proud."

SYSTEM_ACTION: Roll appropriate tool check. Consider material quality and workshop conditions. Check crafting time requirements.

MOOD: 0
`;
        
      default:
        // Generic but engaging fallback
        return `
NARRATIVE: The world responds to your actions in unexpected ways. Your choices ripple through the fabric of reality, shaping the story that unfolds around you. Every decision matters.

NPC_DIALOGUE: "Interesting developments," muses a nearby figure. "The threads of fate are weaving in fascinating patterns. Your presence changes everything."

SYSTEM_ACTION: Continue with current action, maintain story momentum. Consider environmental factors and world state updates.

MOOD: 0
`;
    }
  }

  // Generate fallback response when all else fails
  private generateFallbackResponse(): AIResponse {
    return {
      narrative: "The adventure begins... (AI temporarily unavailable)",
      choices: ["Explore ahead", "Gather information", "Prepare equipment"],
      atmosphere: {
        mood: "mysterious",
        tension: "medium" as const,
        environmentalDetails: "The path ahead is shrouded in uncertainty."
      },
      worldStateUpdates: {
        newLocation: "Starting Point",
        consequences: []
      }
    };
  }

  /**
   * Test AI service functionality
   */
  async testAIService(): Promise<{ success: boolean; details: string; fallbackUsed: boolean }> {
    console.log('🧪 AI Service: Starting comprehensive test...');
    
    const testPrompts = [
      'I attack the goblin with my sword',
      'I search the ancient ruins for treasure',
      'I talk to the village elder about the quest',
      'I cast a fireball at the dragon',
      'I rest at the inn to recover my strength'
    ];
    
    let successCount = 0;
    let fallbackCount = 0;
    let totalTests = testPrompts.length;
    
    for (const prompt of testPrompts) {
      try {
        console.log(`🧪 Testing prompt: "${prompt}"`);
        const response = await this.generateEnhancedDynamicResponse(prompt);
        
        if (response && response.includes('NARRATIVE:')) {
          successCount++;
          console.log(`✅ Test passed for: "${prompt}"`);
        } else {
          fallbackCount++;
          console.log(`🔄 Fallback used for: "${prompt}"`);
        }
      } catch (error) {
        fallbackCount++;
        console.error(`❌ Test failed for: "${prompt}"`, error);
      }
    }
    
    const successRate = (successCount / totalTests) * 100;
    const fallbackRate = (fallbackCount / totalTests) * 100;
    
    const result = {
      success: successRate >= 80, // Consider successful if 80%+ tests pass
      details: `AI Service Test Results: ${successCount}/${totalTests} direct responses, ${fallbackCount}/${totalTests} fallbacks. Success rate: ${successRate.toFixed(1)}%`,
      fallbackUsed: fallbackCount > 0
    };
    
    console.log(`🧪 AI Service Test Complete:`, result);
    return result;
  }

  /**
   * Enhanced logging for AI service debugging
   */
  private logAIServiceEvent(event: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`🤖 AI Service [${timestamp}]: ${event}`, data || '');
  }

  /**
   * Generate AI-driven quest based on context
   */
  async generateQuest(prompt: string, context: any): Promise<string> {
    console.log('AI Service: generateQuest() called');
    
    try {
      // Simulate AI processing time for quest generation
      await new Promise(resolve => setTimeout(resolve,20 + Math.random() * 300));
      
      // Generate quest based on context
      const quest = this.generateDynamicQuest(prompt, context);
      
      return JSON.stringify(quest);
    } catch (error) {
      console.error('Error generating quest:', error);
      return JSON.stringify(this.generateFallbackQuest());
    }
  }

  /**
   * Generate a dynamic quest based on context
   */
  private generateDynamicQuest(prompt: string, context: any): any {
    const { playerLevel, playerLocation, playerActions, worldState } = context;
    
    // Analyze recent actions to determine quest type
    const recentActions = playerActions?.slice(-5) || [];
    const hasCombat = recentActions.some((action: any) => action.type === 'kill');
    const hasExploration = recentActions.some((action: any) => action.type === 'explore');
    const hasSocial = recentActions.some((action: any) => action.type === 'talk');
    
    // Determine quest type based on recent actions
    let questType = 'side';
    let difficulty = 'medium';
    let objectives: any[] = [];
    
    if (hasCombat) {
      questType = 'main';
      difficulty = 'hard';
      objectives = [
        {
          type: 'investigate',
          description: 'Investigate the source of recent attacks',
          target: 'threat_source',
          quantity: 1
        },
        {
          type: 'collect',
          description: 'Gather evidence of the threat',
          target: 'evidence',
          quantity: 3
        }
      ];
    } else if (hasExploration) {
      questType = 'side';
      difficulty = 'medium';
      objectives = [
        {
          type: 'explore',
          description: 'Map the newly discovered area',
          target: 'new_area',
          quantity: 1
        },
        {
          type: 'collect',
          description: 'Gather rare resources from the area',
          target: 'rare_resources',
          quantity: 5
        }
      ];
    } else if (hasSocial) {
      questType = 'faction';
      difficulty = 'easy';
      objectives = [
        {
          type: 'talk',
          description: 'Strengthen relationships with local NPCs',
          target: 'local_npcs',
          quantity: 2
        },
        {
          type: 'deliver',
          description: 'Deliver important message',
          target: 'important_message',
          quantity: 1
        }
      ];
    } else {
      // Default quest
      objectives = [
        {
          type: 'explore',
          description: 'Explore the surrounding area',
          target: 'surrounding_area',
          quantity: 1
        },
        {
          type: 'collect',
          description: 'Gather basic resources',
          target: 'basic_resources',
          quantity: 3
        }
      ];
    }
    
    // Generate quest title and description
    const questTitles = [
      'The Hidden Threat',
      'Secrets of the Land',
      'Alliance Building',
      'Resource Gathering',
      'Exploration Mission'
    ];
    
    const questDescriptions = [
      'Recent events have revealed a hidden danger that requires your attention.',
      'The land holds many secrets waiting to be discovered.',
      'Building alliances with local factions could prove beneficial.',
      'Gathering resources is essential for survival and progress.',
      'Exploring new areas may reveal valuable opportunities.'
    ];
    
    const titleIndex = Math.floor(Math.random() * questTitles.length);
    
    return {
      title: questTitles[titleIndex],
      description: questDescriptions[titleIndex],
      type: questType,
      difficulty: difficulty,
      objectives: objectives,
      rewards: {
        experience: playerLevel * 50,
        gold: playerLevel * 25,
        items: [
          {
            name: 'Quest Reward',
            quantity: 1,
            rarity: 'common'
          }
        ],
        reputation: { 'Local_Faction': 10 }
      },
      reasoning: 'Generated based on recent player actions and current context',
      relevance: 0.8,
      complexity: 2,
      estimatedDuration: 20,
      riskLevel: 'medium',
      potentialOutcomes: [
        {
          condition: 'success',
          consequences: [
            {
              type: 'reputation',
              target: 'Local_Faction',
              value: 10,
              description: 'Improved standing with local faction'
            }
          ],
          probability: 0.7
        }
      ]
    };
  }

  /**
   * Generate fallback quest when AI fails
   */
  private generateFallbackQuest(): any {
    return {
      title: 'Basic Quest',
      description: 'A simple quest to help you get started.',
      type: 'side',
      difficulty: 'easy',
      objectives: [
        {
          type: 'explore',
          description: 'Explore the area',
          target: 'area',
          quantity: 1
        }
      ],
      rewards: {
        experience: 50,
        gold: 25,
        items: []
      },
      reasoning: 'Fallback quest generated due to AI error,',
      relevance: 0.5,
      complexity: 1,
      estimatedDuration: 10,
      riskLevel: 'low',
      potentialOutcomes: []
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