# MythSeeker Site Map & Navigation Catalog

## Overview
This document provides a comprehensive catalog of all routes, navigation patterns, and internal page structures within the MythSeeker application. This serves as a development artifact for debugging navigation issues and understanding the complete user flow.

---

## 🗺️ **PRIMARY ROUTES** (React Router)

### Authentication & Core
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `/` | Redirect → `/dashboard` | - | No | Root redirect |
| `/dashboard` | Dashboard | DashboardWrapper | Yes | Main hub and overview |
| `/play` | UnifiedGameExperience | - | Yes | Universal game launcher (selection) |
| `/play/:sessionId` | UnifiedGameExperience | - | Yes | Generic game session by ID |
| `/play/training/:trainingType` | UnifiedGameExperience | - | Yes | Specific training session |
| `/play/combat/:scenarioType` | UnifiedGameExperience | - | Yes | Specific combat scenario |
| `/play/campaign/:campaignId` | UnifiedGameExperience | - | Yes | Specific campaign session |

### Game Modes & Interfaces
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `/game/*` | UniversalGameInterface | GameWrapper | Yes | Main game interface |
| `/automated-games` | AutomatedGameWrapper | AutomatedGamesWrapper | Yes | AI-powered sessions (Legacy) |

### Character Management
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `/characters` | CharactersPage | CharacterWrapper | Yes | Character browser and management |
| `/characters/create` | CharacterCreation | CharacterCreationWrapper | Yes | Character creation wizard |
| `/progression` | ProgressionWrapper | ProgressionWrapper | Yes | Character advancement & leveling |

### Campaign Management
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `/campaigns` | CampaignsPage | CampaignWrapper | Yes | Campaign browser and management |
| `/campaigns/:id` | Campaign Game | CampaignGameWrapper | Yes | Specific campaign game interface |
| `/campaigns/:id/waiting` | Waiting Room | WaitingRoomWrapper | Yes | Campaign waiting room |

### Game Systems
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `/party` | PartyPage | PartyWrapper | Yes | Party and multiplayer management |
| `/world` | WorldPage | WorldWrapper | Yes | Interactive world exploration |
| `/combat` | CombatPage | CombatWrapper | Yes | Battle system & tactical combat |
| `/magic` | MagicPage | MagicWrapper | Yes | Spell management and casting |

### DM & Admin Tools
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `/dm-center` | DMCenterPage | DMCenterWrapper | Yes | Dungeon Master tools |

### User Management
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `/profile` | ProfilePage | ProfileWrapper | Yes | User profile and account settings |
| `/achievements` | AchievementsPage | AchievementsWrapper | Yes | Achievement progress and unlocks |
| `/settings` | SettingsPage | SettingsWrapper | Yes | Application settings and preferences |
| `/help` | HelpPage | HelpWrapper | Yes | User help and documentation |

### Fallback
| Route | Component | Wrapper | Auth Required | Description |
|-------|-----------|---------|---------------|-------------|
| `*` | Redirect → `/dashboard` | - | Yes | Catch-all fallback |

---

## 🎯 **DYNAMIC NAVIGATION PATTERNS**

### URL Parameters & State-Based Navigation

#### `/play` Route Variations
- **Base**: `/play` - Game selection interface
- **Training**: `/play?gameType=training&trainingType=melee&isTraining=true`
- **Combat**: `/play?gameType=combat&scenarioType=encounter&difficulty=medium`
- **AI Game**: `/play?gameType=automated&sessionId=abc123`

#### Campaign-Specific Routes
- **Campaign Game**: `/campaigns/{campaignId}`
- **Campaign Waiting**: `/campaigns/{campaignId}/waiting`

#### Navigation State Passing
Routes that use `location.state` for navigation data:
- `/play` - Receives training/combat session configs
- `/campaigns/:id` - Campaign context
- `/game/*` - Game state and character data

---

## 📱 **TABBED INTERFACES**

### 1. **DMCenter Tabs** (`/dm-center`)
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `overview` | Overview | BarChart3 | Campaign analytics and quick tools |
| `content` | Content Library | Database | NPCs, encounters, locations, plot hooks |
| `rules` | Rules Engine | Book | Rule systems, mechanics, and automation |
| `ai-brain` | AI Brain | Brain | AI settings, personality, and training |
| `world-builder` | World Builder | Map | Maps, locations, and world state |
| `session-tools` | Session Tools | Wand2 | Live session management and tools |
| `analytics` | Analytics | BarChart3 | Player engagement and story metrics |
| `