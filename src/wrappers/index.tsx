import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BaseWrapper } from './BaseWrapper';
import Dashboard from '../components/Dashboard';
import { UniversalGameInterface } from '../components/UniversalGameInterface';
import { UnifiedGameExperience } from '../components/UnifiedGameExperience';
import { AutomatedGameWrapper as AutomatedGameComponent } from '../components/AutomatedGameWrapper';
import ProgressionWrapper from '../components/ProgressionWrapper';
import { firebaseService } from '../firebaseService';

// ===== DASHBOARD WRAPPER =====
interface DashboardWrapperProps {
  user: any;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ user }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCampaigns(userCampaigns || []);
        setCharacters(userCharacters || []);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, [user.uid]);

  return (
    <BaseWrapper user={user}>
      <Dashboard
        user={user}
        campaigns={campaigns}
        characters={characters}
        onNavigate={() => {}}
        onCreateCampaign={() => {}}
        onCreateCharacter={() => {}}
        onJoinCampaign={() => {}}
        onResumeCampaign={() => {}}
        onOpenDiceRoller={() => {}}
        onOpenProfile={() => {}}
        onOpenSettings={() => {}}
        onOpenAchievements={() => {}}
        onOpenHelp={() => {}}
      />
    </BaseWrapper>
  );
};

// ===== GAME WRAPPER =====
interface GameWrapperProps {
  user: any;
}

export const GameWrapper: React.FC<GameWrapperProps> = ({ user }) => {
  const location = useLocation();
  const { state } = location;

  const handleBackToLobby = () => {
    window.location.href = '/dashboard';
  };

  const gameType = state?.campaignId ? 'campaign' : 'automated';
  const gameId = state?.campaignId || state?.sessionId || 'default-game';

  return (
    <BaseWrapper user={user} showFloatingButton={false}>
      <UniversalGameInterface
        gameType={gameType}
        gameId={gameId}
        user={user}
        onBackToLobby={handleBackToLobby}
        showManager={gameType === 'automated'}
      />
    </BaseWrapper>
  );
};

// ===== PLACEHOLDER PAGES =====
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="p-8">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-8">{title}</h1>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <p className="text-slate-300 mb-4">{description}</p>
        <p className="text-sm text-slate-400">
          Full functionality will be restored incrementally from the original complex App.tsx.
        </p>
      </div>
    </div>
  </div>
);

// ===== CHARACTER WRAPPER =====
export const CharacterWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Character Management" 
      description="Create, edit, and manage your D&D characters with full stat tracking and progression."
    />
  </BaseWrapper>
);

// ===== CHARACTER CREATION WRAPPER =====
export const CharacterCreationWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Character Creation" 
      description="Step-by-step character creation with race, class, background, and stat generation."
    />
  </BaseWrapper>
);

// ===== CAMPAIGN WRAPPER =====
export const CampaignWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Campaign Browser" 
      description="Browse, join, and create multiplayer D&D campaigns with other players."
    />
  </BaseWrapper>
);

// ===== CAMPAIGN GAME WRAPPER =====
export const CampaignGameWrapper: React.FC<{ user: any }> = ({ user }) => (
  <GameWrapper user={user} />
);

// ===== WAITING ROOM WRAPPER =====
export const WaitingRoomWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Campaign Waiting Room" 
      description="Wait for other players to join before the campaign begins."
    />
  </BaseWrapper>
);

// ===== AUTOMATED GAMES WRAPPER =====
export const AutomatedGamesWrapper: React.FC<{ user: any }> = ({ user }) => {
  const handleBackToLobby = () => {
    window.location.href = '/dashboard';
  };

  return (
    <BaseWrapper user={user}>
      <AutomatedGameComponent user={user} onBackToLobby={handleBackToLobby} />
    </BaseWrapper>
  );
};

// ===== PARTY WRAPPER =====
export const PartyWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Party Management" 
      description="Manage your adventuring party, track relationships, and coordinate strategies."
    />
  </BaseWrapper>
);

// ===== WORLD WRAPPER =====
export const WorldWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="World Map" 
      description="Explore the interactive world map with locations, quests, and lore."
    />
  </BaseWrapper>
);

// ===== COMBAT WRAPPER =====
export const CombatWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Combat System" 
      description="Enhanced combat with tactical grids, spell effects, and 3D visualizations."
    />
  </BaseWrapper>
);

// ===== MAGIC WRAPPER =====
export const MagicWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Magic System" 
      description="Spell management, preparation, and casting with visual effects."
    />
  </BaseWrapper>
);

// ===== DM CENTER WRAPPER =====
export const DMCenterWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Dungeon Master Center" 
      description="Advanced DM tools for campaign management, NPC control, and world building."
    />
  </BaseWrapper>
);

// ===== PROFILE WRAPPER =====
export const ProfileWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="User Profile" 
      description="Manage your account settings, achievements, and gaming preferences."
    />
  </BaseWrapper>
);

// ===== ACHIEVEMENTS WRAPPER =====
export const AchievementsWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Achievements" 
      description="Track your progress with badges, milestones, and gaming achievements."
    />
  </BaseWrapper>
);

// ===== SETTINGS WRAPPER =====
export const SettingsWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Settings" 
      description="Configure audio, video, accessibility, and gameplay preferences."
    />
  </BaseWrapper>
);

// ===== HELP WRAPPER =====
export const HelpWrapper: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <PlaceholderPage 
      title="Help & Documentation" 
      description="Learn how to use MythSeeker with tutorials, guides, and FAQs."
    />
  </BaseWrapper>
);

// ===== PROGRESSION WRAPPER =====  
export const ProgressionWrapperComponent: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <ProgressionWrapper user={user} />
  </BaseWrapper>
); 