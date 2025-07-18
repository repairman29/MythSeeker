/**
 * Migration Service
 * 
 * Tracks the restoration of functionality from the original 8858-line App.tsx
 * into the new modular architecture.
 */

interface MigrationStatus {
  component: string;
  status: 'pending' | 'in-progress' | 'completed' | 'tested';
  originalLines: string;
  newLocation: string;
  dependencies: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export const migrationPlan: MigrationStatus[] = [
  // CRITICAL - Core App Infrastructure
  {
    component: 'Authentication System',
    status: 'completed',
    originalLines: '4739-4800',
    newLocation: 'src/App.tsx',
    dependencies: ['Firebase', 'Google Auth'],
    priority: 'critical',
    description: 'User authentication with Google sign-in'
  },
  {
    component: 'Router & Navigation',
    status: 'completed', 
    originalLines: '4801-4900',
    newLocation: 'src/App.tsx + src/wrappers/',
    dependencies: ['React Router'],
    priority: 'critical',
    description: 'Main app routing and navigation structure'
  },
  {
    component: 'Base Wrapper System',
    status: 'completed',
    originalLines: '4900-5900',
    newLocation: 'src/wrappers/BaseWrapper.tsx',
    dependencies: ['Navigation', 'FloatingActionButton'],
    priority: 'critical',
    description: 'Common layout wrapper for all pages'
  },

  // HIGH PRIORITY - Core Game Features
  {
    component: 'Dashboard Component',
    status: 'in-progress',
    originalLines: '4807-4938',
    newLocation: 'src/wrappers/DashboardWrapper.tsx',
    dependencies: ['Dashboard', 'Firebase Service'],
    priority: 'high',
    description: 'Main dashboard with campaigns and characters'
  },
  {
    component: 'Game Interface',
    status: 'in-progress',
    originalLines: '4958-4991',
    newLocation: 'src/wrappers/GameWrapper.tsx',
    dependencies: ['UniversalGameInterface'],
    priority: 'high',
    description: 'Main game interface for campaigns and automated games'
  },
  {
    component: 'Automated Game System',
    status: 'completed',
    originalLines: '5767-5836',
    newLocation: 'src/wrappers/index.tsx',
    dependencies: ['AutomatedGameWrapper'],
    priority: 'high',
    description: 'AI-powered automated game sessions'
  },

  // MEDIUM PRIORITY - Feature Pages
  {
    component: 'Character Management',
    status: 'pending',
    originalLines: '5053-5131',
    newLocation: 'src/wrappers/CharacterWrapper.tsx',
    dependencies: ['CharacterSheet', 'Character Service'],
    priority: 'medium',
    description: 'Character creation, editing, and management'
  },
  {
    component: 'Campaign System',
    status: 'pending',
    originalLines: '5069-5131',
    newLocation: 'src/wrappers/CampaignWrapper.tsx',
    dependencies: ['CampaignService', 'Multiplayer Service'],
    priority: 'medium',
    description: 'Campaign browser and multiplayer functionality'
  },
  {
    component: 'Combat System',
    status: 'pending',
    originalLines: '5320-5413',
    newLocation: 'src/wrappers/CombatWrapper.tsx',
    dependencies: ['EnhancedCombatSystem', 'Combat Service'],
    priority: 'medium',
    description: 'Turn-based combat with 3D visualizations'
  },
  {
    component: 'Magic System',
    status: 'pending',
    originalLines: '5416-5519',
    newLocation: 'src/wrappers/MagicWrapper.tsx',
    dependencies: ['MagicSystem', 'Spell Data'],
    priority: 'medium',
    description: 'Spell management and casting interface'
  },
  {
    component: 'World Map',
    status: 'pending',
    originalLines: '5250-5320',
    newLocation: 'src/wrappers/WorldWrapper.tsx',
    dependencies: ['WorldMap', 'AI Dungeon Master'],
    priority: 'medium',
    description: 'Interactive world exploration'
  },

  // LOW PRIORITY - Support Features
  {
    component: 'DM Center',
    status: 'pending',
    originalLines: '5522-5643',
    newLocation: 'src/wrappers/DMCenterWrapper.tsx',
    dependencies: ['DMCenter', 'Admin Tools'],
    priority: 'low',
    description: 'Dungeon Master tools and campaign management'
  },
  {
    component: 'Profile Management',
    status: 'pending',
    originalLines: '5646-5767',
    newLocation: 'src/wrappers/ProfileWrapper.tsx',
    dependencies: ['User Profile', 'Settings'],
    priority: 'low',
    description: 'User profile and account settings'
  },
  {
    component: 'Help System',
    status: 'pending',
    originalLines: '5898-end',
    newLocation: 'src/wrappers/HelpWrapper.tsx',
    dependencies: ['Help System', 'Documentation'],
    priority: 'low',
    description: 'User help and documentation system'
  },

  // COMPLEX COMPONENTS - Need Careful Migration  
  {
    component: 'AI Dungeon Master',
    status: 'pending',
    originalLines: '279-3473',
    newLocation: 'TBD - needs refactoring',
    dependencies: ['AI Service', 'Game State', 'Combat Service'],
    priority: 'high',
    description: 'Core AI game master with complex state management'
  },
  {
    component: 'Breadcrumb Navigation',
    status: 'pending',
    originalLines: '62-140',
    newLocation: 'src/components/Breadcrumb.tsx',
    dependencies: ['Router State'],
    priority: 'low',
    description: 'Dynamic breadcrumb navigation system'
  },
  {
    component: 'Toast Notifications',
    status: 'pending',
    originalLines: '141-200',
    newLocation: 'src/components/ToastNotifications.tsx',
    dependencies: ['Toast System'],
    priority: 'medium',
    description: 'Global notification and feedback system'
  }
];

export class MigrationService {
  static getStatus() {
    const total = migrationPlan.length;
    const completed = migrationPlan.filter(item => item.status === 'completed').length;
    const inProgress = migrationPlan.filter(item => item.status === 'in-progress').length;
    const pending = migrationPlan.filter(item => item.status === 'pending').length;

    return {
      total,
      completed,
      inProgress,
      pending,
      percentComplete: Math.round((completed / total) * 100)
    };
  }

  static getNextPriority() {
    return migrationPlan
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  static markCompleted(componentName: string) {
    const item = migrationPlan.find(m => m.component === componentName);
    if (item) {
      item.status = 'completed';
    }
  }

  static markInProgress(componentName: string) {
    const item = migrationPlan.find(m => m.component === componentName);
    if (item) {
      item.status = 'in-progress';
    }
  }

  static printStatus() {
    const status = this.getStatus();
    console.log(`
🔄 MIGRATION STATUS: ${status.percentComplete}% Complete
📊 Progress: ${status.completed}/${status.total} components migrated
🏗️  In Progress: ${status.inProgress}
⏳ Pending: ${status.pending}

📋 Next Priority Items:
${this.getNextPriority().slice(0, 3).map(item => 
  `   • ${item.component} (${item.priority}): ${item.description}`
).join('\n')}
    `);
  }
}

// Print current status when service is imported
MigrationService.printStatus(); 