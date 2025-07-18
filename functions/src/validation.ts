// Validation schemas and types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

// Character validation
export function validateCharacter(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid character data'] };
  }

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Character name is required and must be a non-empty string');
  }
  
  if (!data.class || typeof data.class !== 'string' || data.class.trim().length === 0) {
    errors.push('Character class is required and must be a non-empty string');
  }

  // Numeric validations
  if (typeof data.level !== 'number' || data.level < 1 || data.level > 20) {
    errors.push('Character level must be a number between 1 and 20');
  }

  if (typeof data.experience !== 'number' || data.experience < 0) {
    errors.push('Character experience must be a non-negative number');
  }

  if (typeof data.health !== 'number' || data.health < 0) {
    errors.push('Character health must be a non-negative number');
  }

  if (typeof data.maxHealth !== 'number' || data.maxHealth < 1) {
    errors.push('Character max health must be a positive number');
  }

  if (typeof data.mana !== 'number' || data.mana < 0) {
    errors.push('Character mana must be a non-negative number');
  }

  if (typeof data.maxMana !== 'number' || data.maxMana < 0) {
    errors.push('Character max mana must be a non-negative number');
  }

  if (typeof data.gold !== 'number' || data.gold < 0) {
    errors.push('Character gold must be a non-negative number');
  }

  // String length validations
  if (data.name && data.name.length > 50) {
    errors.push('Character name must be 50 characters or less');
  }

  if (data.class && data.class.length > 30) {
    errors.push('Character class must be 30 characters or less');
  }

  // Sanitize data
  const sanitizedData = {
    ...data,
    name: data.name ? data.name.trim() : '',
    class: data.class ? data.class.trim() : '',
    level: Math.max(1, Math.min(20, data.level || 1)),
    experience: Math.max(0, data.experience || 0),
    health: Math.max(0, data.health || 0),
    maxHealth: Math.max(1, data.maxHealth || 1),
    mana: Math.max(0, data.mana || 0),
    maxMana: Math.max(0, data.maxMana || 0),
    gold: Math.max(0, data.gold || 0),
    inventory: data.inventory && typeof data.inventory === 'object' ? data.inventory : {},
    equipment: data.equipment && typeof data.equipment === 'object' ? data.equipment : {},
    stats: data.stats && typeof data.stats === 'object' ? data.stats : {},
    skills: data.skills && typeof data.skills === 'object' ? data.skills : {},
    achievements: Array.isArray(data.achievements) ? data.achievements : []
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

// Game session validation
export function validateGameSession(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid game session data'] };
  }

  // Theme validation
  if (data.theme && typeof data.theme !== 'string') {
    errors.push('Game theme must be a string');
  }

  if (data.theme && data.theme.length > 50) {
    errors.push('Game theme must be 50 characters or less');
  }

  // Background validation
  if (data.background && typeof data.background !== 'string') {
    errors.push('Game background must be a string');
  }

  // Max players validation
  if (data.maxPlayers && (typeof data.maxPlayers !== 'number' || data.maxPlayers < 1 || data.maxPlayers > 10)) {
    errors.push('Max players must be a number between 1 and 10');
  }

  // Custom prompt validation
  if (data.customPrompt && typeof data.customPrompt !== 'string') {
    errors.push('Custom prompt must be a string');
  }

  if (data.customPrompt && data.customPrompt.length > 1000) {
    errors.push('Custom prompt must be 1000 characters or less');
  }

  // Players array validation
  if (data.players && !Array.isArray(data.players)) {
    errors.push('Players must be an array');
  }

  // Messages array validation
  if (data.messages && !Array.isArray(data.messages)) {
    errors.push('Messages must be an array');
  }

  // Sanitize data
  const sanitizedData = {
    ...data,
    theme: data.theme ? data.theme.trim() : 'Classic Fantasy',
    background: data.background ? data.background.trim() : 'fantasy',
    maxPlayers: Math.max(1, Math.min(10, data.maxPlayers || 6)),
    customPrompt: data.customPrompt ? data.customPrompt.trim() : '',
    players: Array.isArray(data.players) ? data.players : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    started: Boolean(data.started),
    code: data.code && typeof data.code === 'string' ? data.code.toUpperCase() : undefined
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

// Message validation
export function validateMessage(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid message data'] };
  }

  // Content validation
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Message content is required and must be a non-empty string');
  }

  if (data.content && data.content.length > 2000) {
    errors.push('Message content must be 2000 characters or less');
  }

  // Type validation
  if (data.type && !['player', 'dm', 'system'].includes(data.type)) {
    errors.push('Message type must be one of: player, dm, system');
  }

  // Character name validation
  if (data.character && typeof data.character !== 'string') {
    errors.push('Character name must be a string');
  }

  if (data.character && data.character.length > 50) {
    errors.push('Character name must be 50 characters or less');
  }

  // Player name validation
  if (data.playerName && typeof data.playerName !== 'string') {
    errors.push('Player name must be a string');
  }

  if (data.playerName && data.playerName.length > 50) {
    errors.push('Player name must be 50 characters or less');
  }

  // Sanitize data
  const sanitizedData = {
    ...data,
    content: data.content ? data.content.trim() : '',
    type: ['player', 'dm', 'system'].includes(data.type) ? data.type : 'player',
    character: data.character ? data.character.trim() : undefined,
    playerName: data.playerName ? data.playerName.trim() : undefined,
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now()
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

// Game code validation
export function validateGameCode(code: any): ValidationResult {
  const errors: string[] = [];
  
  if (!code || typeof code !== 'string') {
    errors.push('Game code must be a string');
  } else if (code.length !== 6) {
    errors.push('Game code must be exactly 6 characters');
  } else if (!/^[A-Z0-9]{6}$/.test(code)) {
    errors.push('Game code must contain only uppercase letters and numbers');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: code ? code.toUpperCase() : undefined
  };
}

// Character ID validation
export function validateCharacterId(characterId: any): ValidationResult {
  const errors: string[] = [];
  
  if (!characterId || typeof characterId !== 'string') {
    errors.push('Character ID must be a string');
  } else if (characterId.length < 1 || characterId.length > 50) {
    errors.push('Character ID must be between 1 and 50 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(characterId)) {
    errors.push('Character ID must contain only letters, numbers, hyphens, and underscores');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: characterId ? characterId.trim() : undefined
  };
}

// Game ID validation
export function validateGameId(gameId: any): ValidationResult {
  const errors: string[] = [];
  
  if (!gameId || typeof gameId !== 'string') {
    errors.push('Game ID must be a string');
  } else if (gameId.length < 1 || gameId.length > 50) {
    errors.push('Game ID must be between 1 and 50 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(gameId)) {
    errors.push('Game ID must contain only letters, numbers, hyphens, and underscores');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: gameId ? gameId.trim() : undefined
  };
}

// Campaign data validation
export function validateCampaignData(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid campaign data'] };
  }

  // World state validation
  if (data.worldState && typeof data.worldState !== 'object') {
    errors.push('World state must be an object');
  }

  // NPCs validation
  if (data.npcs && !Array.isArray(data.npcs)) {
    errors.push('NPCs must be an array');
  }

  // Quests validation
  if (data.quests && !Array.isArray(data.quests)) {
    errors.push('Quests must be an array');
  }

  // Factions validation
  if (data.factions && !Array.isArray(data.factions)) {
    errors.push('Factions must be an array');
  }

  // Sanitize data
  const sanitizedData = {
    ...data,
    worldState: data.worldState && typeof data.worldState === 'object' ? data.worldState : {},
    npcs: Array.isArray(data.npcs) ? data.npcs : [],
    quests: Array.isArray(data.quests) ? data.quests : [],
    factions: Array.isArray(data.factions) ? data.factions : []
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

// AI prompt validation
export function validateAIPrompt(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid AI prompt data'] };
  }

  // Content validation
  if (!data.prompt || typeof data.prompt !== 'string' || data.prompt.trim().length === 0) {
    errors.push('AI prompt is required and must be a non-empty string');
  }

  if (data.prompt && data.prompt.length > 5000) {
    errors.push('AI prompt must be 5000 characters or less');
  }

  // Context validation
  if (data.context && typeof data.context !== 'object') {
    errors.push('AI context must be an object');
  }

  // Character validation
  if (data.character && typeof data.character !== 'object') {
    errors.push('Character data must be an object');
  }

  // World state validation
  if (data.worldState && typeof data.worldState !== 'object') {
    errors.push('World state must be an object');
  }

  // --- LOOSE FILTER: Only block empty or extremely long prompts. Allow all creative content. ---
  // (If you want to block truly egregious content, add a minimal forbidden list here.)
  // Example:
  // const forbidden = /(hate speech|illegal|child|terrorism)/i;
  // if (forbidden.test(data.prompt)) {
  //   errors.push('AI prompt contains forbidden content');
  // }

  // Sanitize data
  const sanitizedData = {
    ...data,
    prompt: data.prompt ? sanitizeString(data.prompt) : '',
    context: data.context && typeof data.context === 'object' ? data.context : {},
    character: data.character && typeof data.character === 'object' ? data.character : {},
    worldState: data.worldState && typeof data.worldState === 'object' ? data.worldState : {},
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    rating: data.rating || 'PG-13', // Pass through rating if provided
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

// Rate limiting helper with in-memory tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, action: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired, start new window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  return true;
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Input sanitization helper
export function sanitizeString(input: any): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters and normalize
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 2000); // Limit length
}

// Number sanitization helper
export function sanitizeNumber(input: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  const num = Number(input);
  if (isNaN(num)) {
    return min;
  }
  return Math.max(min, Math.min(max, num));
}

// Array sanitization helper
export function sanitizeArray(input: any): any[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter(item => item !== null && item !== undefined);
}

// Object sanitization helper
export function sanitizeObject(input: any): Record<string, any> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {};
  }
  return input;
} 