import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BaseWrapper } from './BaseWrapper';
import Dashboard from '../components/Dashboard';
import { UniversalGameInterface } from '../components/UniversalGameInterface';
import { UnifiedGameExperience } from '../components/UnifiedGameExperience';
import { AutomatedGameWrapper as AutomatedGameComponent } from '../components/AutomatedGameWrapper';
import ProgressionWrapper from '../components/ProgressionWrapper';
import { firebaseService } from '../firebaseService';

// Import the new page components
import WorldPage from '../components/WorldPage';
import CombatPage from '../components/CombatPage';
import MagicPage from '../components/MagicPage';
import DMCenterPage from '../components/DMCenterPage';
import SettingsPage from '../components/SettingsPage';

// Import the missing page components at the top
import ProfilePage from '../components/ProfilePage';
import HelpPage from '../components/HelpPage';
import AchievementsPage from '../components/AchievementsPage';
import PartyPage from '../components/PartyPage';
import CharactersPage from '../components/CharactersPage';
import CampaignsPage from '../components/CampaignsPage';

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
interface CharacterWrapperProps {
  user: any;
}

export const CharacterWrapper: React.FC<CharacterWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <CharactersPage user={user} />
    </BaseWrapper>
  );
};

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
interface CampaignWrapperProps {
  user: any;
}

export const CampaignWrapper: React.FC<CampaignWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <CampaignsPage user={user} />
    </BaseWrapper>
  );
};

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
interface PartyWrapperProps {
  user: any;
}

export const PartyWrapper: React.FC<PartyWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <PartyPage user={user} />
    </BaseWrapper>
  );
};

// ===== WORLD WRAPPER =====
interface WorldWrapperProps {
  user: any;
}

export const WorldWrapper: React.FC<WorldWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <WorldPage user={user} />
    </BaseWrapper>
  );
};

// ===== COMBAT WRAPPER =====
interface CombatWrapperProps {
  user: any;
}

export const CombatWrapper: React.FC<CombatWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <CombatPage user={user} />
    </BaseWrapper>
  );
};

// ===== MAGIC WRAPPER =====
interface MagicWrapperProps {
  user: any;
}

export const MagicWrapper: React.FC<MagicWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <MagicPage user={user} />
    </BaseWrapper>
  );
};

// ===== DM CENTER WRAPPER =====
interface DMCenterWrapperProps {
  user: any;
}

export const DMCenterWrapper: React.FC<DMCenterWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <DMCenterPage user={user} />
    </BaseWrapper>
  );
};

// ===== SETTINGS WRAPPER =====
interface SettingsWrapperProps {
  user: any;
}

export const SettingsWrapper: React.FC<SettingsWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <SettingsPage user={user} />
    </BaseWrapper>
  );
};

// ===== PROFILE WRAPPER =====
interface ProfileWrapperProps {
  user: any;
}

export const ProfileWrapper: React.FC<ProfileWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <ProfilePage user={user} />
    </BaseWrapper>
  );
};

// ===== HELP WRAPPER =====
interface HelpWrapperProps {
  user: any;
}

export const HelpWrapper: React.FC<HelpWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <HelpPage user={user} />
    </BaseWrapper>
  );
};

// ===== ACHIEVEMENTS WRAPPER =====
interface AchievementsWrapperProps {
  user: any;
}

export const AchievementsWrapper: React.FC<AchievementsWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <AchievementsPage user={user} />
    </BaseWrapper>
  );
};

// ===== PROGRESSION WRAPPER =====  
export const ProgressionWrapperComponent: React.FC<{ user: any }> = ({ user }) => (
  <BaseWrapper user={user}>
    <ProgressionWrapper user={user} />
  </BaseWrapper>
); 