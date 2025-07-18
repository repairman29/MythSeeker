/**
 * Service Types
 * 
 * Common types and interfaces for the MythSeeker microservice architecture
 */

// Service Configuration
export interface ServiceConfig {
  serviceName: string;
  version: string;
  dependencies: string[];
  endpoints?: Record<string, string>;
  settings?: Record<string, any>;
}

// Service Status
export interface ServiceStatus {
  serviceName: string;
  status: 'initializing' | 'running' | 'error' | 'stopped';
  uptime: number;
  lastError?: string;
  lastActivity?: Date;
  metadata?: Record<string, any>;
}

// Service Event
export interface ServiceEvent {
  serviceName: string;
  eventType: string;
  timestamp: Date;
  data?: any;
  userId?: string;
  sessionId?: string;
}

// Service Response
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId?: string;
  metadata?: Record<string, any>;
}

// User Profile Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  soundEffects: boolean;
  music: boolean;
  notifications: boolean;
  autoSave: boolean;
  diceRoller: DiceRollerPreferences;
  game: GamePreferences;
}

export interface DiceRollerPreferences {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  shakeToRoll: boolean;
  showHistory: boolean;
}

export interface GamePreferences {
  autoRoll: boolean;
  showDamageNumbers: boolean;
  showHealthBars: boolean;
  confirmActions: boolean;
}

export interface UserStats {
  totalPlayTime: number;
  campaignsPlayed: number;
  charactersCreated: number;
  diceRolled: number;
  achievements: string[];
  level: number;
  experience: number;
}

// Character Types
export interface Character {
  id: string;
  userId: string;
  name: string;
  race: string;
  class: string;
  level: number;
  experience: number;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  proficiencyBonus: number;
  abilities: AbilityScores;
  skills: Record<string, number>;
  equipment: Equipment[];
  spells?: Spell[];
  background?: string;
  alignment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  description?: string;
  quantity: number;
  equipped: boolean;
  properties?: Record<string, any>;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  prepared?: boolean;
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  description: string;
  theme: string;
  dmUserId: string;
  players: CampaignPlayer[];
  isActive: boolean;
  isMultiplayer: boolean;
  maxPlayers: number;
  joinCode?: string;
  worldState: WorldState;
  sessions: GameSession[];
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
}

export interface CampaignPlayer {
  userId: string;
  characterId: string;
  joinedAt: Date;
  isHost: boolean;
  status: 'active' | 'inactive' | 'kicked';
}

export interface GameSession {
  id: string;
  campaignId: string;
  startTime: Date;
  endTime?: Date;
  participants: string[];
  messages: ChatMessage[];
  events: GameEvent[];
  summary?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  characterId?: string;
  type: 'player' | 'dm' | 'system' | 'npc';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface GameEvent {
  id: string;
  type: string;
  timestamp: Date;
  participantIds: string[];
  data: Record<string, any>;
  result?: Record<string, any>;
}

// World State Types
export interface WorldState {
  currentLocation?: string;
  locations: Record<string, Location>;
  npcs: Record<string, NPC>;
  factions: Record<string, Faction>;
  weather: string;
  timeOfDay: string;
  events: WorldEvent[];
  playerReputation: Record<string, number>;
  discoveredSecrets: string[];
  globalFlags: Record<string, boolean>;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  type: string;
  connections: string[];
  npcs: string[];
  items: string[];
  discovered: boolean;
  properties?: Record<string, any>;
}

export interface NPC {
  id: string;
  name: string;
  race?: string;
  class?: string;
  description: string;
  personality: string;
  relationship: number; // -100 to 100
  currentLocation: string;
  dialogue?: DialogueNode[];
  inventory?: Equipment[];
  stats?: Partial<Character>;
  emotionalState?: EmotionalState;
}

export interface EmotionalState {
  happiness: number;
  anger: number;
  fear: number;
  trust: number;
  lastInteraction?: Date;
  memoryFlags: string[];
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  reputation: number;
  members: string[];
  allies: string[];
  enemies: string[];
  goals: string[];
  resources: Record<string, number>;
}

export interface WorldEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  affectedLocations: string[];
  consequences?: Record<string, any>;
  recurring: boolean;
}

export interface DialogueNode {
  id: string;
  text: string;
  conditions?: Record<string, any>;
  responses: DialogueResponse[];
}

export interface DialogueResponse {
  id: string;
  text: string;
  action?: string;
  nextNodeId?: string;
  requirements?: Record<string, any>;
}

// Quest Types
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'fetch' | 'kill' | 'escort' | 'delivery';
  status: 'available' | 'active' | 'completed' | 'failed';
  giver: string; // NPC ID
  location: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  requirements?: Record<string, any>;
  timeLimit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: string;
  targetId?: string;
  targetQuantity?: number;
  currentProgress: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'experience' | 'gold' | 'item' | 'reputation';
  amount?: number;
  itemId?: string;
  factionId?: string;
}

// Combat Types
export interface CombatState {
  id: string;
  sessionId: string;
  participants: Combatant[];
  currentTurn: number;
  round: number;
  initiative: InitiativeEntry[];
  battleMap?: BattleMap;
  status: 'preparing' | 'active' | 'ended';
  startTime: Date;
  endTime?: Date;
}

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'monster';
  characterId?: string;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  position?: Position;
  statusEffects: StatusEffect[];
  isAlive: boolean;
  hasActed: boolean;
}

export interface InitiativeEntry {
  combatantId: string;
  initiative: number;
  dexterityModifier: number;
}

export interface BattleMap {
  width: number;
  height: number;
  tiles: MapTile[][];
  objects: MapObject[];
}

export interface MapTile {
  type: 'floor' | 'wall' | 'difficult' | 'hazard';
  occupied: boolean;
  visible: boolean;
}

export interface MapObject {
  id: string;
  type: string;
  position: Position;
  blocking: boolean;
  interactive: boolean;
  properties?: Record<string, any>;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: string;
  duration: number;
  magnitude?: number;
  description: string;
  stackable: boolean;
}

// AI and DM Types
export interface AIContext {
  campaignId: string;
  sessionId: string;
  worldState: WorldState;
  recentMessages: ChatMessage[];
  playerActions: PlayerAction[];
  dmPersona: DMPersona;
  aiMemory: AIMemory;
}

export interface PlayerAction {
  id: string;
  playerId: string;
  type: string;
  target?: string;
  data: Record<string, any>;
  timestamp: Date;
  result?: Record<string, any>;
}

export interface DMPersona {
  style: string;
  tone: string;
  difficulty: number;
  creativity: number;
  strictness: number;
  preferences: Record<string, any>;
}

export interface AIMemory {
  shortTerm: MemoryEntry[];
  longTerm: MemoryEntry[];
  playerProfiles: Record<string, PlayerProfile>;
  storyThreads: StoryThread[];
  worldKnowledge: Record<string, any>;
}

export interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  importance: number;
  timestamp: Date;
  tags: string[];
  associatedEntities: string[];
}

export interface PlayerProfile {
  playerId: string;
  preferences: Record<string, any>;
  playstyle: string;
  skillLevel: number;
  favoriteActivities: string[];
  behaviorPatterns: Record<string, any>;
}

export interface StoryThread {
  id: string;
  title: string;
  description: string;
  priority: number;
  status: 'active' | 'paused' | 'resolved';
  participants: string[];
  events: string[];
  nextSteps: string[];
}

// Analytics Types
export interface AnalyticsEvent {
  eventType: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
  category: 'user' | 'game' | 'system' | 'performance';
}

export interface PerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Error Types
export interface ErrorReport {
  id: string;
  type: string;
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  resolved: boolean;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  query: string;
  filters?: Record<string, any>;
  suggestions?: string[];
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event Emitter Types
export interface EventHandler<T = any> {
  (data: T): void | Promise<void>;
}

export interface EventEmitter {
  on<T>(event: string, handler: EventHandler<T>): () => void;
  off(event: string, handler: EventHandler): void;
  emit<T>(event: string, data?: T): void;
  once<T>(event: string, handler: EventHandler<T>): () => void;
} 