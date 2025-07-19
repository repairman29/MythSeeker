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
| `/play` | UnifiedGameExperience | - | Yes | Universal game launcher |

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
| `marketplace` | Marketplace | Star | Community content and sharing |

### 2. **Combat Page Tabs** (`/combat`)
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `simulator` | Combat Simulator | Swords | Combat encounter simulator |
| `training` | Training | Target | Combat training sessions |
| `history` | Battle History | Clock | Previous combat encounters |
| `tactics` | Tactics Guide | Shield | Combat strategy and guides |

### 3. **Main Game Tabs** (GameInterface)
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `gameplay` | Adventure | Dice1 | AI Dungeon Master & Story |
| `progression` | Progression | Zap | Character progression & advancement |
| `map` | World Map | MapPin | Explore the world |
| `quests` | Quests | Dice1 | Active quests & objectives |
| `combat` | Combat | Sword | Battle system |

### 4. **MainTabs Component** (Legacy)
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `gameplay` | Gameplay | Sword | Main gameplay interface |
| `automated` | AI Games | Bot | AI-powered game sessions |
| `character` | Character Sheet | User | Character management |
| `progression` | Progression | TrendingUp | Character advancement |
| `inventory` | Inventory | Package | Item management |
| `map` | World Map | Map | World exploration |
| `log` | Campaign Log | BookOpen | Event and story log |

### 5. **Character Progression Tabs**
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `overview` | Overview | - | Character progression overview |
| `levelup` | Level Up | - | Level advancement interface |
| `feats` | Feats & Features | - | Character abilities and feats |
| `skills` | Skill Trees | - | Skill development trees |

### 6. **Enhanced Combat System Tabs**
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `overview` | Overview | Eye | Combat system overview |
| `weapons` | Weapons | Sword | Weapon management |
| `techniques` | Techniques | Target | Combat techniques |
| `training` | Training | TrendingUp | Combat training |
| `history` | History | Book | Combat history |

### 7. **Magic System Tabs**
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `spellbook` | Spellbook | BookOpen | Spell library |
| `prepared` | Prepared Spells | Star | Ready-to-cast spells |
| `components` | Components | Flame | Spell components |
| `research` | Research | Search | Magical research |

### 8. **Right Drawer Tabs** (Context-Sensitive)

#### During Gameplay
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `chat` | Chat | MessageSquare | Real-time messaging |
| `log` | Story Log | BookOpen | Campaign events & notes |
| `party` | Party | Users | Player status & info |
| `world` | World | Map | World state & exploration |
| `tools` | Tools | Settings | Game tools & settings |

#### Outside Gameplay
| Tab ID | Label | Icon | Description |
|--------|-------|------|-------------|
| `chat` | Chat | MessageSquare | Real-time messaging |
| `log` | Campaign Log | BookOpen | Story and events |
| `players` | Players | Users | Player management |
| `world` | World | Map | World state & events |
| `achievements` | Achievements | Award | Progress & rewards |
| `settings` | Settings | Settings | Game preferences |

---

## 🧭 **NAVIGATION COMPONENTS**

### Primary Navigation (Navigation.tsx)
Complete navigation system with icons, badges, and descriptions for all major routes.

### NavBar Component (NavBar.tsx)
Simplified navigation bar with context-sensitive items:
- Dashboard, Campaigns, AI Games, Characters, Profile (outside gameplay)
- DM Center, Party, World, Combat, Magic (during gameplay)

### BaseWrapper Navigation
Common wrapper providing:
- Floating Action Button
- Navigation service integration
- Breadcrumb support
- Context-aware navigation

---

## 🔄 **NAVIGATION FLOW PATTERNS**

### 1. **Game Launch Flow**
```
Dashboard → /play → Game Selection → Game Mode:
├── Solo AI → UniversalGameInterface (automated mode)
├── Quick Combat → UniversalGameInterface (combat mode)
├── Training → UniversalGameInterface (training mode)
├── Multiplayer → UniversalGameInterface (multiplayer mode)
└── Resume → Campaign Selection
```

### 2. **Character Creation Flow**
```
Dashboard → /characters → /characters/create → Character Wizard:
├── Basic Info Step
├── Race & Class Step
├── Ability Scores Step
├── Skills & Background Step
└── Final Review → Save → /characters
```

### 3. **Campaign Management Flow**
```
Dashboard → /campaigns → Campaign Browser:
├── Join Campaign → /campaigns/:id/waiting → /campaigns/:id
├── Create Campaign → Campaign Creator → /campaigns/:id/waiting
└── Resume Campaign → /campaigns/:id
```

### 4. **Training Session Flow**
```
/combat → Training Tab → Select Training Type → /play:
└── Navigate with state: { gameType: 'training', trainingType, sessionConfig }
```

### 5. **Combat Training Flow**
```
/combat → Training Tab → Training Options:
├── Melee Training → Navigate to /play with melee config
├── Archery Training → Navigate to /play with archery config
├── Magic Training → Navigate to /play with magic config
└── Stealth Training → Navigate to /play with stealth config
```

---

## 🐛 **KNOWN NAVIGATION ISSUES**

### 1. **Training Detection Bug**
- **Issue**: Training sessions incorrectly detected as combat scenarios
- **Location**: UnifiedGameExperience.tsx
- **Cause**: gameType 'training' vs 'combat' detection logic
- **Status**: Under investigation with enhanced debugging

### 2. **Routing State Loss**
- **Issue**: location.state sometimes null in production
- **Location**: UnifiedGameExperience.tsx
- **Mitigation**: URL parameter fallback implemented
- **Status**: Partially resolved

### 3. **Navigation Service Integration**
- **Issue**: Incomplete integration with NavigationService
- **Location**: Multiple components
- **Status**: Needs completion

---

## 🔧 **BREADCRUMB IMPLEMENTATION**

### Current Implementation
Basic breadcrumb support exists in:
- App.backup.tsx (legacy)
- BaseWrapper.tsx (partial)
- NavigationService.ts (service layer)

### Recommended Enhancement
Implement comprehensive breadcrumb system with:
- Automatic route-based breadcrumbs
- Context-aware navigation
- Deep linking support
- State preservation

---

## 📊 **ANALYTICS & TRACKING**

### Navigation Events Tracked
- Page navigation (`analyticsService.trackUserAction('navigation')`)
- Help system interactions
- Tab changes
- Game mode switches

### Metrics to Track
- Route popularity
- Navigation flow patterns
- Drop-off points
- User journey completion rates

---

## 🎯 **DEVELOPMENT RECOMMENDATIONS**

### 1. **Implement Site-Wide Breadcrumbs**
Create a comprehensive breadcrumb component that:
- Auto-generates from route hierarchy
- Shows navigation context
- Provides quick navigation shortcuts

### 2. **Enhance URL State Management**
- Always use URL parameters as fallback for routing state
- Implement deep linking for all game modes
- Preserve navigation context across refreshes

### 3. **Navigation Testing**
- Automated testing for all navigation flows
- State preservation validation
- Cross-browser navigation testing

### 4. **Performance Optimization**
- Lazy load route components
- Implement route-based code splitting
- Optimize navigation transitions

---

This site map serves as the authoritative reference for the MythSeeker navigation system and should be updated whenever routes, tabs, or navigation patterns are modified. 