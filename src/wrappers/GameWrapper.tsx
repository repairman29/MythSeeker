import React from 'react';
import { useLocation } from 'react-router-dom';
import { BaseWrapper } from './BaseWrapper';
import { UniversalGameInterface } from '../components/UniversalGameInterface';

interface GameWrapperProps {
  user: any;
}

export const GameWrapper: React.FC<GameWrapperProps> = ({ user }) => {
  const location = useLocation();
  const { state } = location;

  const handleBackToLobby = () => {
    window.location.href = '/dashboard';
  };

  // Determine if this is for a campaign or automated game based on state or URL
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