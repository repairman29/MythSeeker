// Unified Validation Library - DRY principle applied
// This library is shared between client and Firebase functions

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: string[];
  sanitizedData?: T;
}

export interface ValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

// Constants to eliminate magic numbers
export const VALIDATION_LIMITS = {
  CAMPAIGN_NAME: { min: 1, max: 50 },
  CAMPAIGN_PROMPT: { min: 0, max: 1000 },
  CHARACTER_NAME: { min: 1, max: 30 },
  PLAYER_NAME: { min: 1, max: 30 },
  MESSAGE_CONTENT: { min: 1, max: 2000 },
  GAME_CODE: { exact: 6 },
  AI_PROMPT: { min: 1, max: 5000 },
  PASSWORD: { min: 8, max: 128 }
} as const;

// Profanity filter (centralized)
const PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 
  'piss', 'cock', 'fag', 'slut', 'whore'
];

// Security threats (centralized)
const SECURITY_THREATS = [
  'javascript:', '<script', '</script>', '<iframe', '</iframe>',
  'onload=', 'onclick=', 'onerror=', 'eval(', 'function('
];

/**
 * Core validation utility - eliminates duplication
 */
export class Validator {
  static sanitizeString(input: any): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '');
  }

  static containsProfanity(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return PROFANITY_LIST.some(word => lower.includes(word));
  }

  static containsSecurityThreats(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return SECURITY_THREATS.some(threat => lower.includes(threat));
  }

  static validateString(value: any, config: ValidationConfig): ValidationResult<string> {
    const errors: string[] = [];
    
    // Type check
    if (value !== null && value !== undefined && typeof value !== 'string') {
      errors.push('Must be a string');
      return { isValid: false, errors };
    }

    const sanitized = this.sanitizeString(value || '');

    // Required check
    if (config.required && !sanitized) {
      errors.push('This field is required');
    }

    // Length checks
    if (sanitized && config.minLength && sanitized.length < config.minLength) {
      errors.push(`Must be at least ${config.minLength} characters`);
    }

    if (sanitized && config.maxLength && sanitized.length > config.maxLength) {
      errors.push(`Must be ${config.maxLength} characters or less`);
    }

    // Pattern check
    if (sanitized && config.pattern && !config.pattern.test(sanitized)) {
      errors.push('Invalid format');
    }

    // Security checks
    if (sanitized && this.containsSecurityThreats(sanitized)) {
      errors.push('Contains potentially dangerous content');
    }

    if (sanitized && this.containsProfanity(sanitized)) {
      errors.push('Contains inappropriate language');
    }

    // Custom validation
    if (sanitized && config.customValidator) {
      const customError = config.customValidator(sanitized);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitized
    };
  }

  static validateArray(value: any, itemValidator?: (item: any) => ValidationResult): ValidationResult<any[]> {
    const errors: string[] = [];

    if (!Array.isArray(value)) {
      errors.push('Must be an array');
      return { isValid: false, errors };
    }

    if (itemValidator) {
      const sanitizedItems: any[] = [];
      
      for (let i = 0; i < value.length; i++) {
        const itemResult = itemValidator(value[i]);
        if (!itemResult.isValid) {
          errors.push(`Item ${i}: ${itemResult.errors.join(', ')}`);
        } else {
          sanitizedItems.push(itemResult.sanitizedData);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: sanitizedItems
      };
    }

    return { isValid: true, errors: [], sanitizedData: value };
  }

  static validateObject(value: any, schema: Record<string, ValidationConfig>): ValidationResult<Record<string, any>> {
    const errors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    if (!value || typeof value !== 'object') {
      errors.push('Must be an object');
      return { isValid: false, errors };
    }

    for (const [key, config] of Object.entries(schema)) {
      const fieldResult = this.validateString(value[key], config);
      
      if (!fieldResult.isValid) {
        errors.push(`${key}: ${fieldResult.errors.join(', ')}`);
      } else {
        sanitizedData[key] = fieldResult.sanitizedData;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }
}

/**
 * Specific validators using the core utility
 */
export const CampaignValidator = {
  validateCampaignData(data: any): ValidationResult {
    return Validator.validateObject(data, {
      theme: { 
        required: true, 
        minLength: VALIDATION_LIMITS.CAMPAIGN_NAME.min,
        maxLength: VALIDATION_LIMITS.CAMPAIGN_NAME.max 
      },
      customPrompt: { 
        required: false, 
        maxLength: VALIDATION_LIMITS.CAMPAIGN_PROMPT.max 
      }
    });
  },

  validateGameCode(code: any): ValidationResult<string> {
    return Validator.validateString(code, {
      required: true,
      minLength: VALIDATION_LIMITS.GAME_CODE.exact,
      maxLength: VALIDATION_LIMITS.GAME_CODE.exact,
      pattern: /^[A-Z0-9]{6}$/,
      customValidator: (value) => {
        return value.length !== 6 ? 'Game code must be exactly 6 characters' : null;
      }
    });
  },

  validateMessage(data: any): ValidationResult {
    const result = Validator.validateObject(data, {
      content: { 
        required: true, 
        minLength: VALIDATION_LIMITS.MESSAGE_CONTENT.min,
        maxLength: VALIDATION_LIMITS.MESSAGE_CONTENT.max 
      },
      type: { 
        required: false,
        customValidator: (value) => {
          const validTypes = ['player', 'dm', 'system'];
          return validTypes.includes(value) ? null : 'Invalid message type';
        }
      }
    });

    // Add timestamp if not present
    if (result.isValid && result.sanitizedData) {
      result.sanitizedData.timestamp = data.timestamp || Date.now();
    }

    return result;
  }
};

export const CharacterValidator = {
  validateCharacterData(data: any): ValidationResult {
    return Validator.validateObject(data, {
      name: { 
        required: true, 
        minLength: VALIDATION_LIMITS.CHARACTER_NAME.min,
        maxLength: VALIDATION_LIMITS.CHARACTER_NAME.max 
      },
      class: { 
        required: true, 
        minLength: 1,
        maxLength: 20 
      }
    });
  }
};

export const MessageValidator = {
  validateMessage(data: any): ValidationResult {
    const result = Validator.validateObject(data, {
      content: { 
        required: true, 
        minLength: VALIDATION_LIMITS.MESSAGE_CONTENT.min,
        maxLength: VALIDATION_LIMITS.MESSAGE_CONTENT.max 
      },
      type: { 
        required: false,
        customValidator: (value) => {
          const validTypes = ['player', 'dm', 'system'];
          return validTypes.includes(value) ? null : 'Invalid message type';
        }
      }
    });

    // Add timestamp if not present
    if (result.isValid && result.sanitizedData) {
      result.sanitizedData.timestamp = data.timestamp || Date.now();
    }

    return result;
  }
};

export const AIValidator = {
  validatePrompt(data: any): ValidationResult {
    const result = Validator.validateObject(data, {
      prompt: { 
        required: true, 
        minLength: VALIDATION_LIMITS.AI_PROMPT.min,
        maxLength: VALIDATION_LIMITS.AI_PROMPT.max 
      },
      campaignId: { required: true, minLength: 1 },
      playerName: { required: false }
    });

    return result;
  }
};

// Rate limiting utility (shared)
export class RateLimiter {
  private static store = new Map<string, { count: number; resetTime: number }>();

  static checkLimit(userId: string, action: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `${userId}:${action}`;
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    this.store.set(key, record);
    return true;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Cleanup rate limiter every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => RateLimiter.cleanup(), 5 * 60 * 1000);
} 