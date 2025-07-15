// Comprehensive validation and security utilities

// XSS Protection - Remove potentially dangerous HTML/script tags
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

// Profanity filter (basic implementation)
const profanityList = [
  'badword1', 'badword2', 'badword3', // Add actual profanity list
  'spam', 'scam', 'hack', 'crack'
];

export const containsProfanity = (text: string): boolean => {
  const sanitizedText = text.toLowerCase();
  return profanityList.some(word => sanitizedText.includes(word));
};

// Character name validation
export const validateCharacterName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Character name is required' };
  }
  
  const sanitizedName = sanitizeInput(name.trim());
  
  if (sanitizedName.length < 2) {
    return { isValid: false, error: 'Character name must be at least 2 characters long' };
  }
  
  if (sanitizedName.length > 20) {
    return { isValid: false, error: 'Character name must be 20 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_']+$/.test(sanitizedName)) {
    return { isValid: false, error: 'Character name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes' };
  }
  
  if (containsProfanity(sanitizedName)) {
    return { isValid: false, error: 'Character name contains inappropriate content' };
  }
  
  return { isValid: true };
};

// Campaign name validation
export const validateCampaignName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Campaign name is required' };
  }
  
  const sanitizedName = sanitizeInput(name.trim());
  
  if (sanitizedName.length < 3) {
    return { isValid: false, error: 'Campaign name must be at least 3 characters long' };
  }
  
  if (sanitizedName.length > 50) {
    return { isValid: false, error: 'Campaign name must be 50 characters or less' };
  }
  
  if (containsProfanity(sanitizedName)) {
    return { isValid: false, error: 'Campaign name contains inappropriate content' };
  }
  
  return { isValid: true };
};

// Chat message validation
export const validateChatMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  const sanitizedMessage = sanitizeInput(message.trim());
  
  if (sanitizedMessage.length > 500) {
    return { isValid: false, error: 'Message must be 500 characters or less' };
  }
  
  if (containsProfanity(sanitizedMessage)) {
    return { isValid: false, error: 'Message contains inappropriate content' };
  }
  
  return { isValid: true };
};

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Rate limiting utility
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return this.maxAttempts;
    return Math.max(0, this.maxAttempts - attempt.count);
  }
  
  getTimeUntilReset(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    return Math.max(0, attempt.resetTime - Date.now());
  }
}

// CSRF Protection
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken;
};

// Input length limits
export const INPUT_LIMITS = {
  CHARACTER_NAME: { min: 2, max: 20 },
  CAMPAIGN_NAME: { min: 3, max: 50 },
  CHAT_MESSAGE: { max: 500 },
  BACKSTORY: { max: 1000 },
  CUSTOM_PROMPT: { max: 2000 },
  JOIN_CODE: { exact: 6 }
} as const;

// Generic input validation
export const validateInput = (
  input: string,
  type: keyof typeof INPUT_LIMITS,
  required: boolean = true
): { isValid: boolean; error?: string } => {
  if (!input && required) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (!input && !required) {
    return { isValid: true };
  }
  
  const sanitizedInput = sanitizeInput(input.trim());
  const limits = INPUT_LIMITS[type];
  
  if ('min' in limits && sanitizedInput.length < limits.min) {
    return { isValid: false, error: `Must be at least ${limits.min} characters long` };
  }
  
  if ('max' in limits && sanitizedInput.length > limits.max) {
    return { isValid: false, error: `Must be ${limits.max} characters or less` };
  }
  
  if ('exact' in limits && sanitizedInput.length !== limits.exact) {
    return { isValid: false, error: `Must be exactly ${limits.exact} characters long` };
  }
  
  if (containsProfanity(sanitizedInput)) {
    return { isValid: false, error: 'Contains inappropriate content' };
  }
  
  return { isValid: true };
};

// Form validation helper
export const validateForm = (formData: Record<string, any>, validationRules: Record<string, any>) => {
  const errors: Record<string, string> = {};
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];
    const validation = validateInput(value, rules.type, rules.required);
    
    if (!validation.isValid) {
      errors[field] = validation.error!;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 